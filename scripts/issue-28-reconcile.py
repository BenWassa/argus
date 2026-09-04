from pathlib import Path


def replace(path: str, old: str, new: str, count: int | None = None) -> None:
    p = Path(path)
    text = p.read_text()
    found = text.count(old)
    if count is not None and found != count:
        raise SystemExit(f'{path}: expected {count} matches, found {found}: {old[:80]!r}')
    if found == 0:
        raise SystemExit(f'{path}: target not found: {old[:80]!r}')
    p.write_text(text.replace(old, new))


replace(
    'src/lib/morseCurriculum.ts',
    "import { hasCompleteDirectionalCoverage, itemKind, migratedItemId } from './items'\n",
    "import { hasCompleteDirectionalCoverage, itemKind, migratedItemId } from './items'\nimport { MORSE_LETTERS } from './morse'\n",
    1,
)
replace(
    'src/lib/morseCurriculum.ts',
    "export const MORSE_TOPIC_ID = 'international-morse-letters-printed'\nexport const MORSE_COMPLETION_CLAIM = 'Can independently recall all A–Z printed Morse mappings in both directions.'\n",
    "export const MORSE_TOPIC_ID = 'international-morse-letters-printed'\nexport const MORSE_COMPLETION_CLAIM = 'Can independently recall all A–Z printed Morse mappings in both directions.'\n\nconst MORSE_BASELINE_TITLE = 'International Morse — Letters (printed)'\nconst MORSE_BASELINE_SCOPE = 'The 26 International Morse patterns for A–Z, recalled from the printed letter. One direction only: letter → canonical dit/dah pattern.'\n\nfunction isStockMorseMapping(topic: Topic): boolean {\n  const expected = Object.entries(MORSE_LETTERS)\n  return topic.items.length === expected.length && topic.items.every((item, index) => {\n    const [prompt, answer] = expected[index]\n    return item.prompt === prompt && item.answer === answer\n  })\n}\n\nfunction isManagedMorseTopic(topic: Topic): boolean {\n  if (topic.id !== MORSE_TOPIC_ID || !isStockMorseMapping(topic)) return false\n  const knownTitle = topic.title === MORSE_BASELINE_TITLE || topic.title === 'International Morse — Letters'\n  const knownScope = topic.scope === MORSE_BASELINE_SCOPE || topic.scope === MORSE_COMPLETION_CLAIM\n  return knownTitle && knownScope\n}\n",
    1,
)
replace(
    'src/lib/morseCurriculum.ts',
    "/** Typed bidirectional content cannot be covered by forward evidence alone. */\nexport function hasCompleteBidirectionalCoverage(topic: Topic): boolean {",
    r'''/**
 * Upgrade the actually shipped #23 stock topic in place. Seed changes alone do
 * not reach a learner who already has a valid v5 library in localStorage.
 *
 * The guard is intentionally narrow: only the known seeded topic id with the
 * exact canonical A–Z mapping and known seeded title/scope is managed. Any
 * user-modified Morse topic is left untouched, as are all non-Morse topics.
 * Existing item ids, evidence, scheduler timestamps and history are retained.
 * A completion earned under #23's one-direction contract is demoted because it
 * cannot truthfully satisfy #28's wider bidirectional claim.
 */
export function reconcileSeededMorseCurriculum(
  library: CurrentLibrary,
  authoritative: CurrentLibrary,
): CurrentLibrary {
  const target = authoritative.topics.find((topic) => topic.id === MORSE_TOPIC_ID)
  if (!target) return library

  let changed = false
  const topics = library.topics.map((topic) => {
    if (!isManagedMorseTopic(topic)) return topic

    const alreadyCurrent =
      topic.title === target.title &&
      topic.scope === target.scope &&
      topic.items.every((item) => item.kind === 'bidirectional') &&
      Boolean(topic.learn)
    if (alreadyCurrent) return topic

    changed = true
    const previousOneDirection = topic.items.some((item) => item.kind !== 'bidirectional')
    const priorCompletion = previousOneDirection && (topic.status === 'completed' || topic.status === 'decayed')

    return {
      ...topic,
      title: target.title,
      scope: target.scope,
      items: target.items.map((item, index) => ({
        ...item,
        id: topic.items[index]?.id ?? item.id,
      })),
      ...(target.learn ? { learn: target.learn } : {}),
      status: priorCompletion ? 'drilled' : topic.status,
      completedAt: priorCompletion ? null : topic.completedAt,
      spotCheckedAt: priorCompletion ? null : topic.spotCheckedAt,
    }
  })

  return changed ? { ...library, topics } : library
}

/** Typed bidirectional content cannot be covered by forward evidence alone. */
export function hasCompleteBidirectionalCoverage(topic: Topic): boolean {''',
    1,
)

replace(
    'src/lib/storage.ts',
    "import { migratedItemId } from './items'\nimport { seedLibrary } from './seed'\n",
    "import { migratedItemId } from './items'\nimport { reconcileSeededMorseCurriculum } from './morseCurriculum'\nimport { seedLibrary } from './seed'\n",
    1,
)
replace(
    'src/lib/storage.ts',
    "    // Promote a valid legacy record immediately. This makes the migration\n    // durable even before the provider's first effect runs.\n    if (found.key !== KEY) saveLibrary(parsed.library)\n    return parsed.library",
    "    const reconciled = reconcileSeededMorseCurriculum(parsed.library, freshSeedLibrary())\n\n    // Promote a valid legacy record and absorb the shipped #23 stock topic\n    // immediately. This makes both migrations durable before the provider's\n    // first effect runs.\n    if (found.key !== KEY || reconciled !== parsed.library) saveLibrary(reconciled)\n    return reconciled",
    1,
)

replace(
    'src/lib/morseCurriculum.test.ts',
    "  enforceDirectionalCompletion,\n  hasCompleteBidirectionalCoverage,\n} from './morseCurriculum'",
    "  enforceDirectionalCompletion,\n  hasCompleteBidirectionalCoverage,\n  reconcileSeededMorseCurriculum,\n} from './morseCurriculum'",
    1,
)

p = Path('src/lib/morseCurriculum.test.ts')
text = p.read_text()
text += r'''

describe('shipped #23 absorption', () => {
  const current = topic(MORSE_TOPIC_ID)
  const nato = topic('nato-phonetic')
  const oldScope = 'The 26 International Morse patterns for A–Z, recalled from the printed letter. One direction only: letter → canonical dit/dah pattern.'

  it('upgrades the stock one-direction v5 topic without replacing learner state or non-Morse topics', () => {
    const completedAt = '2026-09-02T12:00:00.000Z'
    const old = {
      ...current,
      title: 'International Morse — Letters (printed)',
      scope: oldScope,
      items: current.items.map((item) => ({ ...item, kind: 'forward' as const })),
      learn: undefined,
      status: 'completed' as const,
      completedAt,
      spotCheckedAt: completedAt,
      drilledAt: '2026-08-01T12:00:00.000Z',
      history: [{ at: completedAt, correct: 26, total: 26, resolvedTo: 'completed' as const }],
      itemEvidence: evidenceStore(current, false),
    }
    const source = { version: 5 as const, topics: [old, nato] }
    const authoritative = seedLibrary()
    const upgraded = reconcileSeededMorseCurriculum(source, authoritative)
    const morse = upgraded.topics[0]

    expect(upgraded).not.toBe(source)
    expect(upgraded.topics[1]).toBe(nato)
    expect(morse.title).toBe('International Morse — Letters')
    expect(morse.scope).toBe(MORSE_COMPLETION_CLAIM)
    expect(morse.items).toHaveLength(26)
    expect(morse.items.every((item) => item.kind === 'bidirectional')).toBe(true)
    expect(morse.items.map((item) => item.id)).toEqual(old.items.map((item) => item.id))
    expect(morse.learn).toEqual(current.learn)
    expect(morse.itemEvidence).toEqual(old.itemEvidence)
    expect(morse.drilledAt).toBe(old.drilledAt)
    expect(morse.history).toEqual(old.history)
    expect(morse.status).toBe('drilled')
    expect(morse.completedAt).toBeNull()
    expect(morse.spotCheckedAt).toBeNull()
  })

  it('does not overwrite a user-modified Morse deck', () => {
    const edited = {
      ...current,
      title: 'My Morse notes',
      items: current.items.map((item, index) => index === 0 ? { ...item, answer: '..' } : item),
    }
    const source = { version: 5 as const, topics: [edited] }
    expect(reconcileSeededMorseCurriculum(source, seedLibrary())).toBe(source)
  })

  it('is idempotent for the current #28 curriculum', () => {
    const source = seedLibrary()
    expect(reconcileSeededMorseCurriculum(source, seedLibrary())).toBe(source)
  })
})
'''
p.write_text(text)
