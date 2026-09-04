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
    'src/lib/seed.ts',
    "import type { Library, Topic } from './types'\n",
    "import type { Library, Topic } from './types'\nimport { MORSE_COMPLETION_CLAIM, finalizeMorseCurriculumSeed } from './morseCurriculum'\n",
    1,
)
replace(
    'src/lib/seed.ts',
    "      title: 'International Morse — Letters (printed)',\n      scope: 'The 26 International Morse patterns for A–Z, recalled from the printed letter. One direction only: letter → canonical dit/dah pattern.',",
    "      title: 'International Morse — Letters',\n      scope: MORSE_COMPLETION_CLAIM,",
    1,
)
replace(
    'src/lib/seed.ts',
    "        overview: 'International Morse represents letters as sequences of dits (.) and dahs (-). A dah lasts three dit units; spacing within a character is one unit, between characters three, and between words seven. This topic scores only printed letter → canonical pattern recall; it does not claim reverse recall, auditory reception, sending, or any speed criterion.',",
    "        overview: 'International Morse represents letters as sequences of dits (.) and dahs (-). A dah lasts three dit units; spacing within a character is one unit, between characters three, and between words seven. Learn introduces correct audio and the original Argus rhythm drawings, but completion is strictly uncued printed mapping recall in both directions. It does not claim auditory reception, sending, words, phrases, or competence at any WPM.',",
    1,
)
replace(
    'src/lib/seed.ts',
    '  return { version: 4, topics }\n}',
    '  return finalizeMorseCurriculumSeed({ version: 4, topics })\n}',
    1,
)

Path('src/lib/morseCurriculum.ts').write_text(r'''import { hasCompleteDirectionalCoverage, itemKind, migratedItemId } from './items'
import type { Resolution } from './scheduling'
import type { CurrentLibrary, LegacyLibraryV4, Topic } from './types'

export const MORSE_TOPIC_ID = 'international-morse-letters-printed'
export const MORSE_COMPLETION_CLAIM = 'Can independently recall all A–Z printed Morse mappings in both directions.'

/**
 * Normalize the compact authored seed to the v5 runtime shape. Deterministic
 * ids match the v4 -> v5 storage migration, so every non-Morse topic keeps its
 * existing runtime identity and forward semantics. Workstream 5 widens only
 * the existing Morse topic, preserving its id to absorb #23 in place.
 */
export function finalizeMorseCurriculumSeed(library: LegacyLibraryV4): CurrentLibrary {
  return {
    version: 5,
    topics: library.topics.map((topic) => ({
      ...topic,
      items: topic.items.map((item, index) => ({
        ...item,
        id: item.id?.trim() || migratedItemId(topic.id, index),
        kind: topic.id === MORSE_TOPIC_ID ? 'bidirectional' : item.kind ?? 'forward',
      })),
      itemEvidence: topic.itemEvidence ?? {},
    })),
  }
}

/** Typed bidirectional content cannot be covered by forward evidence alone. */
export function hasCompleteBidirectionalCoverage(topic: Topic): boolean {
  const bidirectional = topic.items.filter((item) => itemKind(item) === 'bidirectional')
  if (bidirectional.length === 0) return true
  return bidirectional.every((item) => {
    if (!item.id) return false
    return hasCompleteDirectionalCoverage(item, topic.itemEvidence?.[item.id])
  })
}

/**
 * Keep the scheduler authoritative on retention timing while preventing a
 * wider typed content claim from reading as complete before both directions
 * have actually been demonstrated. A satisfied delayed gap is preserved: the
 * topic stays drilled on its original drilledAt anchor until coverage exists.
 */
export function enforceDirectionalCompletion(before: Topic, resolution: Resolution): Resolution {
  if (!resolution.completed || hasCompleteBidirectionalCoverage(resolution.topic)) return resolution

  const history = [...resolution.topic.history]
  const last = history.at(-1)
  if (last) history[history.length - 1] = { ...last, resolvedTo: 'drilled' }

  return {
    ...resolution,
    topic: {
      ...resolution.topic,
      status: 'drilled',
      completedAt: before.completedAt,
      history,
    },
    to: 'drilled',
    completed: false,
    gapDays: null,
  }
}
''')

replace(
    'src/features/test/Session.tsx',
    "import { mergeItemEvidence, recordAnswer, rungFor } from '../../lib/cueLadder'\n",
    "import { mergeItemEvidence, recordAnswer, rungFor } from '../../lib/cueLadder'\nimport { enforceDirectionalCompletion } from '../../lib/morseCurriculum'\n",
    1,
)
replace(
    'src/features/test/Session.tsx',
    "    const resolution = resolveAttempt(topic, attempt.correct, attempt.total)\n    upsertTopic(mergeItemEvidence(resolution.topic, evidence))\n    setResolutions((previous) => [...previous, resolution])",
    "    const resolution = resolveAttempt(topic, attempt.correct, attempt.total)\n    const withEvidence = { ...resolution, topic: mergeItemEvidence(resolution.topic, evidence) }\n    const bounded = enforceDirectionalCompletion(topic, withEvidence)\n    upsertTopic(bounded.topic)\n    setResolutions((previous) => [...previous, bounded])",
    1,
)

replace(
    'src/lib/types.ts',
    '/** The seed remains an explicit v4 source record; storage is the v5 boundary. */\nexport type Library = LegacyLibraryV4 | CurrentLibrary',
    '/** Seed authoring may begin v4-shaped; shipped/runtime libraries normalize to v5. */\nexport type Library = LegacyLibraryV4 | CurrentLibrary',
    1,
)

replace('src/lib/seed.test.ts', 'expect(library.version).toBe(4)', 'expect(library.version).toBe(5)', 1)
replace('src/lib/seed.test.ts', 'expect(topic.items).toEqual([', 'expect(topic.items.map(({ prompt, answer }) => ({ prompt, answer }))).toEqual([', 3)
replace('src/lib/seed.test.ts', "expect(topic.items[0]).toEqual({ prompt: 'A', answer: 'Alfa' })", "expect(topic.items[0]).toMatchObject({ prompt: 'A', answer: 'Alfa' })", 1)
replace('src/lib/seed.test.ts', "expect(topic.items[9]).toEqual({ prompt: 'J', answer: 'Juliett' })", "expect(topic.items[9]).toMatchObject({ prompt: 'J', answer: 'Juliett' })", 1)
replace('src/lib/seed.test.ts', "expect(topic.items[25]).toEqual({ prompt: 'Z', answer: 'Zulu' })", "expect(topic.items[25]).toMatchObject({ prompt: 'Z', answer: 'Zulu' })", 1)
replace(
    'src/lib/seed.test.ts',
    "      'The 26 International Morse patterns for A–Z, recalled from the printed letter. One direction only: letter → canonical dit/dah pattern.',",
    "      'Can independently recall all A–Z printed Morse mappings in both directions.',",
    1,
)
replace('src/lib/seed.test.ts', "expect(topic.learn?.overview).toContain('does not claim reverse recall')", "expect(topic.learn?.overview).toContain('does not claim auditory reception')", 1)

replace(
    'src/features/learn/MorseCharacterPacket.test.tsx',
    "    expect(topic.scope).toContain('One direction only')",
    "    expect(topic.scope).toBe('Can independently recall all A–Z printed Morse mappings in both directions.')",
    1,
)

Path('src/lib/morseCurriculum.test.ts').write_text(r'''import { describe, expect, it } from 'vitest'
import { morseAcquisitionProfile } from './acquisition'
import { recordAnswer, rungFor } from './cueLadder'
import { requiredDirections } from './items'
import { MORSE_LETTERS } from './morse'
import {
  MORSE_COMPLETION_CLAIM,
  MORSE_TOPIC_ID,
  enforceDirectionalCompletion,
  hasCompleteBidirectionalCoverage,
} from './morseCurriculum'
import { resolveAttempt } from './scheduling'
import { seedLibrary } from './seed'
import type { DirectionEvidence, ItemEvidenceStore, Topic } from './types'

const ITU_A_TO_Z = [
  ['A', '.-'], ['B', '-...'], ['C', '-.-.'], ['D', '-..'], ['E', '.'],
  ['F', '..-.'], ['G', '--.'], ['H', '....'], ['I', '..'], ['J', '.---'],
  ['K', '-.-'], ['L', '.-..'], ['M', '--'], ['N', '-.'], ['O', '---'],
  ['P', '.--.'], ['Q', '--.-'], ['R', '.-.'], ['S', '...'], ['T', '-'],
  ['U', '..-'], ['V', '...-'], ['W', '.--'], ['X', '-..-'], ['Y', '-.--'],
  ['Z', '--..'],
] as const

function topic(id: string): Topic {
  const found = seedLibrary().topics.find((candidate) => candidate.id === id)
  if (!found) throw new Error(`Missing seeded topic: ${id}`)
  return found
}

function direction(): DirectionEvidence {
  return {
    attempts: 1,
    correct: 1,
    consecutiveCorrect: 1,
    lastAt: '2026-09-03T12:00:00.000Z',
    lastLatencyMs: 700,
  }
}

function evidenceStore(morse: Topic, reverse: boolean): ItemEvidenceStore {
  return Object.fromEntries(morse.items.map((item) => [item.id!, {
    cue: 'free' as const,
    directions: {
      'prompt-to-answer': direction(),
      ...(reverse ? { 'answer-to-prompt': direction() } : {}),
    },
  }]))
}

describe('workstream 5 seeded curriculum', () => {
  const morse = topic(MORSE_TOPIC_ID)

  it('absorbs #23 as one 26-unit v5 bidirectional topic', () => {
    const library = seedLibrary()
    expect(library.version).toBe(5)
    expect(library.topics.filter((candidate) => candidate.id === MORSE_TOPIC_ID)).toHaveLength(1)
    expect(morse.title).toBe('International Morse — Letters')
    expect(morse.scope).toBe(MORSE_COMPLETION_CLAIM)
    expect(morse.items).toHaveLength(26)
    expect(new Set(morse.items.map((item) => item.id)).size).toBe(26)
    expect(morse.items.map((item) => item.id)).toEqual(
      Array.from({ length: 26 }, (_, index) => `${MORSE_TOPIC_ID}-item-${String(index + 1).padStart(2, '0')}`),
    )
    expect(morse.items.every((item) => item.kind === 'bidirectional')).toBe(true)
    expect(morse.items.flatMap(requiredDirections)).toHaveLength(52)
  })

  it('matches ITU-R M.1677-1 A–Z character by character', () => {
    expect(morse.items.map(({ prompt, answer }) => [prompt, answer])).toEqual(ITU_A_TO_Z)
    expect(Object.entries(MORSE_LETTERS)).toEqual(ITU_A_TO_Z)
  })

  it('integrates all Learn packets with the same 26 mappings the Test ladder drives', () => {
    const profile = morseAcquisitionProfile(morse)
    expect(profile?.size).toBe(26)
    const introduced = new Set<string>()
    for (const section of morse.learn?.sections ?? []) {
      for (const block of section.blocks) {
        if (block.type !== 'morse-character-packet') continue
        for (const character of block.characters) {
          introduced.add(character.glyph)
          expect(profile?.get(morse.items.find((item) => item.prompt === character.glyph)!.id!)?.pattern).toBe(character.pattern)
          expect(character.mnemonicId).toBe(`argus-morse-rhythm-v1-${character.glyph}`)
        }
      }
    }
    expect(introduced.size).toBe(26)
  })

  it('walks all 26 items through both uncued directions without adding scoring units', () => {
    const profile = morseAcquisitionProfile(morse)!
    let store: ItemEvidenceStore = {}
    const firstItemRungs: string[] = []

    for (let pass = 0; pass < 9; pass += 1) {
      for (const item of morse.items) {
        const rung = rungFor(item, store[item.id!])
        if (item === morse.items[0]) firstItemRungs.push(rung.id)
        expect(profile.has(item.id!)).toBe(true)
        store[item.id!] = recordAnswer(store[item.id!], {
          direction: rung.direction,
          correct: true,
          latencyMs: 700,
          at: `2026-09-03T12:${String(pass).padStart(2, '0')}:00.000Z`,
        })
      }
    }

    expect(firstItemRungs).toEqual([
      'rich-recognition', 'rich-recognition',
      'delayed-recognition', 'delayed-recognition',
      'reduced-recognition', 'reduced-recognition',
      'free-production', 'free-production',
      'free-reception',
    ])
    expect(hasCompleteBidirectionalCoverage({ ...morse, itemEvidence: store })).toBe(true)
    expect(morse.items).toHaveLength(26)
  })
})

describe('directional completion boundary', () => {
  const now = new Date('2026-09-03T12:00:00.000Z')
  const drilledAt = '2026-07-01T12:00:00.000Z'
  const morse = topic(MORSE_TOPIC_ID)

  it('cannot read as complete with forward-only evidence, without resetting the retention clock', () => {
    const before: Topic = {
      ...morse,
      status: 'drilled',
      drilledAt,
      learningAt: '2026-06-30T12:00:00.000Z',
      completedAt: null,
      itemEvidence: evidenceStore(morse, false),
      history: [],
    }
    const scheduler = resolveAttempt(before, 26, 26, now)
    expect(scheduler.completed).toBe(true)

    const bounded = enforceDirectionalCompletion(before, scheduler)
    expect(bounded.completed).toBe(false)
    expect(bounded.to).toBe('drilled')
    expect(bounded.topic.status).toBe('drilled')
    expect(bounded.topic.drilledAt).toBe(drilledAt)
    expect(bounded.topic.completedAt).toBeNull()
    expect(bounded.topic.history.at(-1)).toMatchObject({ correct: 26, total: 26, resolvedTo: 'drilled' })
  })

  it('allows the unchanged scheduler completion once every mapping has both directions', () => {
    const before: Topic = {
      ...morse,
      status: 'drilled',
      drilledAt,
      learningAt: '2026-06-30T12:00:00.000Z',
      completedAt: null,
      itemEvidence: evidenceStore(morse, true),
      history: [],
    }
    const scheduler = resolveAttempt(before, 26, 26, now)
    const bounded = enforceDirectionalCompletion(before, scheduler)
    expect(bounded).toEqual(scheduler)
    expect(bounded.completed).toBe(true)
    expect(bounded.topic.status).toBe('completed')
  })

  it('does not change completion behavior for non-bidirectional topics', () => {
    const nato = topic('nato-phonetic')
    const before: Topic = {
      ...nato,
      status: 'drilled',
      drilledAt,
      learningAt: '2026-06-30T12:00:00.000Z',
      completedAt: null,
      history: [],
    }
    const scheduler = resolveAttempt(before, 26, 26, now)
    expect(enforceDirectionalCompletion(before, scheduler)).toEqual(scheduler)
  })
})
''')

replace('docs/SEEDED_CONTENT_PROVENANCE.md', 'Issue: #11; Morse baseline: #23  ', 'Issue: #11; Morse foundation: #23; Morse curriculum: #28  ', 1)
replace('docs/SEEDED_CONTENT_PROVENANCE.md', 'Library format: v4', 'Library format: v5', 1)
replace(
    'docs/SEEDED_CONTENT_PROVENANCE.md',
    '| International Morse — Letters (printed) | 26 printed letters A–Z → canonical International Morse dit/dah pattern | 26 | Concise support |',
    '| International Morse — Letters | 26 printed A–Z mappings recalled uncued in both directions | 26 typed bidirectional units | Progressive packets + concise support |',
    1,
)
replace(
    'docs/SEEDED_CONTENT_PROVENANCE.md',
    'Existing seeded historical attempt totals remain compatible with their decks. The Morse baseline is new and starts unstarted with no history.',
    'Existing seeded historical attempt totals remain compatible with their decks. Workstream #28 absorbs the temporary #23 Morse control under the same topic id, preserves 26 logical scoring units, and widens only those items to typed bidirectional semantics.',
    1,
)
replace('docs/SEEDED_CONTENT_PROVENANCE.md', '## International Morse — Letters (printed)', '## International Morse — Letters', 1)
replace(
    'docs/SEEDED_CONTENT_PROVENANCE.md',
    'Workstream #23 deliberately ships the smallest useful Morse control before the progressive cue, schema and audio work lands. ITU-R M.1677-1 Annex 1 supplies the authoritative International Morse A–Z mapping and the canonical timing relationships. This topic uses only the mapping in scored Test items; the timing note is explanatory context.',
    'Workstream #28 supersedes the temporary one-direction #23 control in place. ITU-R M.1677-1 Annex 1 supplies the authoritative International Morse A–Z mapping and canonical timing relationships. The 26 mappings below were checked character by character against Annex 1 §1.1.1; each is one typed bidirectional item, so the scheduler still sees 26 logical units while coverage accounting requires both printed directions.',
    1,
)
replace(
    'docs/SEEDED_CONTENT_PROVENANCE.md',
    '**The 26 International Morse patterns for A–Z, recalled from the printed letter. One direction only: letter → canonical dit/dah pattern.**\n\nEvery A–Z mapping appears once. Completion here does **not** claim pattern → letter recall, auditory reception, sending, or a speed criterion. The later bidirectional/progressive curriculum must explicitly supersede or absorb this control topic so overlapping completion claims do not remain in the shipped library.',
    '**Can independently recall all A–Z printed Morse mappings in both directions.**\n\nEvery A–Z mapping appears exactly once as a bidirectional logical item. Completion requires uncued letter → canonical pattern and printed canonical pattern → letter evidence for all 26 mappings. It does **not** claim numbers, punctuation, prosigns, auditory reception, stated-WPM continuous copying, sending rhythm/timing, words, phrases, QSOs, or radio operating conventions.',
    1,
)
replace(
    'docs/SEEDED_CONTENT_PROVENANCE.md',
    'Concise support states the dit/dah notation, the ITU 1:3:7 timing relationships, and the completion limitations. It does not introduce an acquisition ladder, audio interaction, SVG mnemonic system, or any scored material beyond the 26 printed prompts.',
    'The #26 Learn surface supplies 13 progressive packets covering all 26 letters, correct explicit-action Morse audio, visible canonical notation/spoken rhythm, and the original Argus rhythm SVG grammar. The drawings are original-by-construction: no per-letter third-party artwork is reused. Their deterministic provenance ids are `argus-morse-rhythm-v1-A` through `argus-morse-rhythm-v1-Z`. Learn remains unscored; #27 supplies the Test cue ladder, whose final production and reception rungs are uncued.',
    1,
)
replace(
    'docs/SEEDED_CONTENT_PROVENANCE.md',
    '- The printed Morse control claims one direction only and does not count timing context, audio, sending, reverse recognition, or speed toward completion.',
    '- The Morse curriculum has exactly 26 typed bidirectional scoring units; completion requires both printed directions for all A–Z and does not count audio, sending, words/phrases, or WPM toward completion.',
    1,
)
