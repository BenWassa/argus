import { describe, expect, it } from 'vitest'
import {
  CUE_RUNGS,
  FREE_PRODUCTION_RUNG,
  FREE_RECEPTION_RUNG,
  isAssistedRung,
  recordAnswer,
  rungFor,
} from './cueLadder'
import {
  hasCompleteTopicDirectionalCoverage,
  isQualifyingAttempt,
  retentionCorrectCount,
  type AttemptAnswer,
} from './items'
import { COMPLETION_GAP_DAYS, resolveAttempt } from './scheduling'
import { parseLibrary } from './storage'
import { seedLibrary } from './seed'
import type { DirectionEvidence, IdentifiedItem, ItemCueEvidence, ItemEvidenceStore, Topic } from './types'

/**
 * #68 — adversarial cover for the exact printed claim:
 *
 *   "Can independently recall all A–Z printed Morse mappings in both directions."
 *
 * Every test here attacks one word of it. `independently` means no scaffolding
 * reached the learner; `all A–Z` means 26 logical units, none excused; `both
 * directions` means neither half may be inferred from the other. The audit these
 * cover is written up in `docs/MORSE_CUE_LADDER.md`.
 */

const MORSE_TOPIC_ID = 'international-morse-letters-printed'

function morseTopic(): Topic {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  const topic = parsed.library.topics.find((candidate) => candidate.id === MORSE_TOPIC_ID)
  if (!topic) throw new Error('The seeded Morse topic is missing.')
  return topic
}

/**
 * A direction's evidence, kept internally coherent so no test can lean on a
 * state the storage boundary would reject: independent answers are a subset of
 * correct ones, which are a subset of attempts.
 */
function evidence(partial: Partial<DirectionEvidence>): DirectionEvidence {
  const unassistedCorrect = partial.unassistedCorrect ?? 0
  const correct = partial.correct ?? Math.max(1, unassistedCorrect)
  const attempts = partial.attempts ?? correct
  const built: DirectionEvidence = {
    attempts,
    correct,
    unassistedCorrect,
    consecutiveCorrect: partial.consecutiveCorrect ?? 1,
    lastAt: partial.lastAt ?? '2026-01-01T00:00:00.000Z',
    lastLatencyMs: partial.lastLatencyMs ?? 900,
  }
  if (built.unassistedCorrect > built.correct || built.correct > built.attempts) {
    throw new Error('Incoherent evidence fixture.')
  }
  return built
}

/** Evidence for one item, stated as what each direction was actually shown. */
function bothDirections(forward: Partial<DirectionEvidence>, reverse: Partial<DirectionEvidence>): ItemCueEvidence {
  return {
    cue: 'free',
    directions: {
      'prompt-to-answer': evidence(forward),
      'answer-to-prompt': evidence(reverse),
    },
  }
}

function storeFor(topic: Topic, build: () => ItemCueEvidence): ItemEvidenceStore {
  return Object.fromEntries(topic.items.map((item) => [item.id as string, build()]))
}

/** One whole-deck attempt, described as it was actually asked and supported. */
function attemptOf(topic: Topic, answer: (item: IdentifiedItem) => Omit<AttemptAnswer, 'itemId'>): AttemptAnswer[] {
  return topic.items.map((item) => ({ itemId: item.id as string, ...answer(item as IdentifiedItem) }))
}

const UNCUED_REVERSE = { direction: 'answer-to-prompt', correct: true, assisted: false } as const
const UNCUED_FORWARD = { direction: 'prompt-to-answer', correct: true, assisted: false } as const

/** A drilled topic sitting exactly on its delayed-test boundary. */
function drilledTopic(store: ItemEvidenceStore): Topic {
  return {
    ...morseTopic(),
    status: 'drilled',
    drilledAt: '2026-01-01T00:00:00.000Z',
    learningAt: '2025-12-01T00:00:00.000Z',
    itemEvidence: store,
  }
}

const DELAYED = new Date('2026-03-01T00:00:00.000Z')

function bank(topic: Topic, attempt: AttemptAnswer[], now = DELAYED) {
  const graded = retentionCorrectCount(topic.items, topic.itemEvidence, topic.items.length, attempt)
  return { graded, resolution: resolveAttempt(topic, graded, topic.items.length, now) }
}

describe('the qualifying delayed attempt and the word "independently"', () => {
  it('refuses a delayed attempt whose directional evidence was all earned with cues on screen', () => {
    // The pre-#68 defect, stated exactly. Every direction of every letter has a
    // correct answer, so the old `correct > 0` coverage gate was satisfied and
    // the topic completed — but every one of those answers was given at the
    // rich rung, with half the pattern, the timing artwork and a verbal beat in
    // front of the learner. That is recognition with support, not independent
    // recall, and it may not carry a claim that says `independently`.
    const topic = drilledTopic(
      storeFor(morseTopic(), () =>
        bothDirections({ correct: 4, attempts: 4, unassistedCorrect: 0 }, { correct: 2, attempts: 2, unassistedCorrect: 0 }),
      ),
    )
    expect(hasCompleteTopicDirectionalCoverage(topic.items, topic.itemEvidence)).toBe(false)

    const { graded, resolution } = bank(topic, attemptOf(topic, () => UNCUED_REVERSE))
    expect(graded).toBe(0)
    expect(resolution.completed).toBe(false)
    expect(resolution.topic.completedAt).toBeNull()
  })

  it('refuses a clean delayed attempt in which even one letter was answered with a cue', () => {
    // 25 letters independent, one still needing its element count. The learner
    // answered all 26 correctly, and history is fully independent, so only the
    // attempt's own testimony can catch this.
    const topic = drilledTopic(
      storeFor(morseTopic(), () => bothDirections({ unassistedCorrect: 3 }, { unassistedCorrect: 2 })),
    )
    expect(hasCompleteTopicDirectionalCoverage(topic.items, topic.itemEvidence)).toBe(true)

    const cuedLetter = topic.items[7].id as string
    const attempt = attemptOf(topic, (item) =>
      item.id === cuedLetter ? { ...UNCUED_FORWARD, assisted: true } : UNCUED_REVERSE,
    )

    expect(isQualifyingAttempt(topic.items, topic.itemEvidence, attempt)).toBe(false)
    const { graded, resolution } = bank(topic, attempt)
    expect(graded).toBe(0)
    expect(resolution.completed).toBe(false)
    // The scheduler is untouched: it simply saw a failed attempt, exactly as it
    // does for any other incomplete run.
    expect(resolution.to).toBe('learning')
  })

  it('counts a supported correct answer for fading and for nothing else', () => {
    const item: IdentifiedItem = { id: 'i-q', kind: 'bidirectional', prompt: 'Q', answer: '--.-' }
    const cued = recordAnswer(undefined, {
      direction: 'prompt-to-answer',
      correct: true,
      assisted: true,
      latencyMs: 700,
      at: '2026-01-01T00:00:00.000Z',
    })
    const direction = cued.directions['prompt-to-answer']
    expect(direction?.correct).toBe(1)
    expect(direction?.unassistedCorrect).toBe(0)
    // It still earns its place on the fade streak — this is real acquisition
    // progress, just not evidence of independence.
    expect(direction?.consecutiveCorrect).toBe(1)
    expect(hasCompleteTopicDirectionalCoverage([item], { 'i-q': cued })).toBe(false)
  })

  it('derives independence from the rung on screen rather than from a separate opinion', () => {
    for (const rung of CUE_RUNGS) {
      const assisted = isAssistedRung(rung)
      const shows =
        rung.allowsArtwork || rung.allowsVerbalCue || rung.allowsAudio || rung.showsLength || rung.revealPolicy !== 'none'
      expect(assisted).toBe(shows)
    }
    expect(CUE_RUNGS.filter((rung) => !isAssistedRung(rung)).map((rung) => rung.id)).toEqual([
      'free-production',
      'free-reception',
    ])
  })
})

describe('the qualifying delayed attempt and the words "both directions"', () => {
  it('refuses independent forward evidence with no reverse evidence at all', () => {
    const topic = drilledTopic(
      Object.fromEntries(
        morseTopic().items.map((item) => [
          item.id as string,
          { cue: 'free', directions: { 'prompt-to-answer': evidence({ unassistedCorrect: 4 }) } } as ItemCueEvidence,
        ]),
      ),
    )
    const { graded, resolution } = bank(topic, attemptOf(topic, () => UNCUED_FORWARD))
    expect(graded).toBe(0)
    expect(resolution.completed).toBe(false)
  })

  it('refuses when a single letter of the 26 is missing its reverse independent evidence', () => {
    const base = morseTopic()
    const store = storeFor(base, () => bothDirections({ unassistedCorrect: 2 }, { unassistedCorrect: 2 }))
    const partial = base.items[19].id as string
    store[partial] = {
      cue: 'free',
      directions: {
        'prompt-to-answer': evidence({ unassistedCorrect: 2 }),
        // Reverse was answered, and answered correctly — but only ever with a cue.
        'answer-to-prompt': evidence({ attempts: 3, correct: 3, unassistedCorrect: 0 }),
      },
    }
    const topic = drilledTopic(store)

    expect(topic.items).toHaveLength(26)
    const { graded, resolution } = bank(topic, attemptOf(topic, () => UNCUED_REVERSE))
    expect(graded).toBe(0)
    expect(resolution.completed).toBe(false)
  })

  it('keeps asking both directions once both are independently established', () => {
    // Before #68 an item that reached free reception was pinned there for good:
    // the forward streak only falls on a forward error, and it was never asked
    // forward again. A topic whose claim asserts production then never asked
    // for production again after two answers.
    const item: IdentifiedItem = { id: 'i-s', kind: 'bidirectional', prompt: 'S', answer: '...' }
    let cue: ItemCueEvidence | undefined
    const seen: string[] = []
    for (let i = 0; i < 24; i += 1) {
      const rung = rungFor(item, cue)
      seen.push(rung.id)
      cue = recordAnswer(cue, {
        direction: rung.direction,
        correct: true,
        assisted: isAssistedRung(rung),
        latencyMs: 700,
        at: '2026-01-01T00:00:00.000Z',
      })
    }

    const settled = seen.slice(10)
    expect(settled).toContain('free-reception')
    expect(settled).toContain('free-production')
    // Neither direction is allowed to starve: independent evidence for the two
    // halves of the claim stays within one answer of each other.
    const forward = cue?.directions['prompt-to-answer']?.unassistedCorrect ?? 0
    const reverse = cue?.directions['answer-to-prompt']?.unassistedCorrect ?? 0
    expect(Math.abs(forward - reverse)).toBeLessThanOrEqual(1)
  })

  it('still opens reverse only after forward production has held a full fade streak', () => {
    const item: IdentifiedItem = { id: 'i-s', kind: 'bidirectional', prompt: 'S', answer: '...' }
    const forwardOnly: IdentifiedItem = { id: 'i-r', kind: 'forward', prompt: 'R', answer: '.-.' }
    let cue: ItemCueEvidence | undefined
    const rungs: string[] = []
    for (let i = 0; i < 9; i += 1) {
      const rung = rungFor(item, cue)
      rungs.push(rung.id)
      cue = recordAnswer(cue, {
        direction: rung.direction,
        correct: true,
        assisted: isAssistedRung(rung),
        latencyMs: 700,
        at: '2026-01-01T00:00:00.000Z',
      })
    }
    expect(rungs.indexOf('free-reception')).toBeGreaterThan(rungs.indexOf('free-production'))
    expect(rungs.filter((id) => id === 'free-production').length).toBeGreaterThanOrEqual(2)

    // A forward-only item never reaches reverse recall at all.
    let plain: ItemCueEvidence | undefined
    for (let i = 0; i < 20; i += 1) {
      const rung = rungFor(forwardOnly, plain)
      expect(rung.direction).toBe('prompt-to-answer')
      plain = recordAnswer(plain, {
        direction: rung.direction,
        correct: true,
        assisted: isAssistedRung(rung),
        latencyMs: 700,
        at: '2026-01-01T00:00:00.000Z',
      })
    }
    expect(rungFor(forwardOnly, plain).id).toBe(CUE_RUNGS[FREE_PRODUCTION_RUNG].id)
  })
})

describe('the qualifying delayed attempt and the scheduler gap', () => {
  const independent = () => bothDirections({ unassistedCorrect: 2 }, { unassistedCorrect: 2 })

  it('banks a completion for a full clean independent bidirectional run after the gap', () => {
    const topic = drilledTopic(storeFor(morseTopic(), independent))
    const attempt = attemptOf(topic, () => UNCUED_REVERSE)

    expect(topic.items).toHaveLength(26)
    expect(isQualifyingAttempt(topic.items, topic.itemEvidence, attempt)).toBe(true)

    const { graded, resolution } = bank(topic, attempt)
    expect(graded).toBe(26)
    expect(resolution.completed).toBe(true)
    expect(resolution.to).toBe('completed')
    expect(resolution.gapDays).toBeGreaterThanOrEqual(COMPLETION_GAP_DAYS)
  })

  it('leaves the gap itself the scheduler’s business: an early clean run cannot complete', () => {
    const topic = drilledTopic(storeFor(morseTopic(), independent))
    const attempt = attemptOf(topic, () => UNCUED_REVERSE)
    const early = new Date('2026-01-20T00:00:00.000Z')

    // The evidence gate passes and the scheduler still refuses: 19 days is not 30.
    expect(isQualifyingAttempt(topic.items, topic.itemEvidence, attempt)).toBe(true)
    const { resolution } = bank(topic, attempt, early)
    expect(resolution.completed).toBe(false)
    expect(resolution.topic.completedAt).toBeNull()
  })

  it('does not let the evidence gate advance, skip or reset a gap on its own', () => {
    const topic = drilledTopic(storeFor(morseTopic(), independent))
    const attempt = attemptOf(topic, () => UNCUED_REVERSE)
    expect(isQualifyingAttempt(topic.items, topic.itemEvidence, attempt)).toBe(true)
    // Reading the gate changes nothing about the topic it read.
    expect(topic.drilledAt).toBe('2026-01-01T00:00:00.000Z')
    expect(topic.status).toBe('drilled')
    expect(topic.history).toEqual(morseTopic().history)
  })
})

describe('what the qualifying attempt may not borrow', () => {
  it('cannot be carried by a Learn run: no lesson state writes directional evidence', () => {
    const topic = drilledTopic({})
    const settled = {
      ...topic,
      lessonProgress: Object.fromEntries(topic.items.map((item) => [item.id as string, 'settled' as const])),
      lessonSitting: { retrievals: 10, correct: 10, revisitItemIds: [] },
    }
    const { graded, resolution } = bank(settled, attemptOf(settled, () => UNCUED_REVERSE))
    expect(graded).toBe(0)
    expect(resolution.completed).toBe(false)
  })

  it('cannot be carried by an attempt that testifies about nothing', () => {
    // A run that says nothing about how it asked a unit is not a run that asked
    // it unaided. Silence withholds the claim; it does not pass it. This also
    // means a fully independent lifetime store cannot be cashed in by a surface
    // that records no testimony at all.
    const independent = storeFor(morseTopic(), () =>
      bothDirections({ unassistedCorrect: 2 }, { unassistedCorrect: 2 }),
    )
    expect(bank(drilledTopic({}), []).graded).toBe(0)
    expect(bank(drilledTopic(independent), []).graded).toBe(0)

    // And an attempt that skips even one of the 26 is not a whole-deck run.
    const topic = drilledTopic(independent)
    const short = attemptOf(topic, () => UNCUED_REVERSE).slice(1)
    expect(isQualifyingAttempt(topic.items, topic.itemEvidence, short)).toBe(false)
    expect(bank(topic, short).graded).toBe(0)
  })

  it('makes no auditory, sending or speed claim: independence is a rung, not a latency', () => {
    const topic = drilledTopic(
      storeFor(morseTopic(), () =>
        bothDirections(
          { unassistedCorrect: 2, lastLatencyMs: 90_000 },
          { unassistedCorrect: 2, lastLatencyMs: 90_000 },
        ),
      ),
    )
    const { resolution } = bank(topic, attemptOf(topic, () => UNCUED_REVERSE))
    expect(resolution.completed).toBe(true)
    // Nothing in the qualifying path reads an audio rung. The claim covers
    // printed mappings only, and #29 reception stays outside it.
    expect(CUE_RUNGS.every((rung) => !rung.allowsAudio)).toBe(true)
    expect(CUE_RUNGS[FREE_RECEPTION_RUNG].response).toBe('entry')
  })
})

describe('ordinary topics are untouched by the bidirectional gate', () => {
  const plainItems: IdentifiedItem[] = [
    { id: 'p-1', kind: 'forward', prompt: 'Sign of life', answer: 'A trace only a person leaves' },
    { id: 'p-2', kind: 'forward', prompt: 'Dead drop', answer: 'A handover with no meeting' },
  ]

  it('passes a forward-only attempt straight through, evidence or not', () => {
    expect(retentionCorrectCount(plainItems, undefined, 2)).toBe(2)
    expect(retentionCorrectCount(plainItems, {}, 2, [])).toBe(2)
    // Even an attempt recorded as supported: ordinary topics never entered this
    // gate before #68 and do not enter it now.
    expect(
      retentionCorrectCount(plainItems, {}, 2, [
        { itemId: 'p-1', direction: 'prompt-to-answer', correct: true, assisted: true },
        { itemId: 'p-2', direction: 'prompt-to-answer', correct: true, assisted: true },
      ]),
    ).toBe(2)
  })

  it('completes an ordinary drilled topic after its gap exactly as before', () => {
    const topic: Topic = {
      id: 'tradecraft',
      title: 'Tradecraft',
      scope: 'Two terms.',
      track: 'tradecraft',
      items: plainItems,
      status: 'drilled',
      createdAt: '2026-01-01T00:00:00.000Z',
      drilledAt: '2026-01-01T00:00:00.000Z',
      learningAt: '2025-12-01T00:00:00.000Z',
      completedAt: null,
      lastTestedAt: null,
      spotCheckedAt: null,
      history: [],
      itemEvidence: {},
    }
    const graded = retentionCorrectCount(topic.items, topic.itemEvidence, 2)
    const resolution = resolveAttempt(topic, graded, 2, DELAYED)
    expect(graded).toBe(2)
    expect(resolution.completed).toBe(true)
  })
})

describe('portability of the independence counter', () => {
  it('round-trips through export/import losslessly', () => {
    const topic = drilledTopic(
      storeFor(morseTopic(), () => bothDirections({ unassistedCorrect: 2 }, { unassistedCorrect: 1 })),
    )
    const first = parseLibrary({ version: 5, topics: [topic] })
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const second = parseLibrary(JSON.parse(JSON.stringify(first.library)))
    expect(second.ok).toBe(true)
    if (!second.ok) return
    expect(second.library.topics[0].itemEvidence).toEqual(first.library.topics[0].itemEvidence)
    expect(
      second.library.topics[0].itemEvidence?.[topic.items[0].id as string]?.directions['prompt-to-answer']
        ?.unassistedCorrect,
    ).toBe(2)
  })

  it('reads a pre-#68 v5 record as zero independent evidence rather than assuming it', () => {
    const topic = drilledTopic({})
    const legacy = {
      version: 5,
      topics: [
        {
          ...topic,
          itemEvidence: Object.fromEntries(
            topic.items.map((item) => [
              item.id as string,
              {
                cue: 'free',
                directions: {
                  // Exactly the pre-#68 shape: no support level was ever recorded.
                  'prompt-to-answer': { attempts: 6, correct: 6, consecutiveCorrect: 2, lastAt: null, lastLatencyMs: null },
                  'answer-to-prompt': { attempts: 3, correct: 3, consecutiveCorrect: 1, lastAt: null, lastLatencyMs: null },
                },
              },
            ]),
          ),
        },
      ],
    }
    const parsed = parseLibrary(legacy)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const loaded = parsed.library.topics[0]
    const direction = loaded.itemEvidence?.[loaded.items[0].id as string]?.directions['prompt-to-answer']
    expect(direction?.correct).toBe(6)
    expect(direction?.unassistedCorrect).toBe(0)

    // An upgrade withholds the claim until it is re-earned. It never resets what
    // the learner actually banked: status, history and completion stand.
    const { graded, resolution } = bank(loaded, attemptOf(loaded, () => UNCUED_REVERSE))
    expect(graded).toBe(0)
    expect(resolution.completed).toBe(false)
    expect(loaded.status).toBe('drilled')
    expect(loaded.history).toEqual(topic.history)
  })

  it('rejects an import claiming more independent answers than correct ones', () => {
    const topic = drilledTopic({})
    const parsed = parseLibrary({
      version: 5,
      topics: [
        {
          ...topic,
          itemEvidence: {
            [topic.items[0].id as string]: {
              cue: 'free',
              directions: {
                'prompt-to-answer': {
                  attempts: 2,
                  correct: 1,
                  unassistedCorrect: 2,
                  consecutiveCorrect: 1,
                  lastAt: null,
                  lastLatencyMs: null,
                },
              },
            },
          },
        },
      ],
    })
    expect(parsed.ok).toBe(false)
    if (parsed.ok) return
    expect(parsed.error).toContain('impossible correct/consecutive counts')
  })
})

/**
 * The whole journey, driven the way `Session` drives it: every session runs all
 * 26 units once, each at whatever rung it currently sits on, grades objectively,
 * records `assisted` from that rung and resolves one attempt against the
 * unchanged scheduler.
 *
 * This is here because a gate that nothing can ever satisfy is not a stricter
 * gate, it is a broken product. The hardened claim has to remain reachable by
 * ordinary honest practice, and reachable only that way.
 */
function playSession(topic: Topic, correctFor: (item: IdentifiedItem) => boolean, now: Date) {
  const store: ItemEvidenceStore = { ...(topic.itemEvidence ?? {}) }
  const attempt: AttemptAnswer[] = []
  let correct = 0

  for (const raw of topic.items) {
    const item = raw as IdentifiedItem
    const rung = rungFor(item, store[item.id])
    const assisted = isAssistedRung(rung)
    const got = correctFor(item)
    if (got) correct += 1
    attempt.push({ itemId: item.id, direction: rung.direction, correct: got, assisted })
    store[item.id] = recordAnswer(store[item.id], {
      direction: rung.direction,
      correct: got,
      assisted,
      latencyMs: 800,
      at: now.toISOString(),
    })
  }

  const graded = retentionCorrectCount(topic.items, store, correct, attempt)
  const resolution = resolveAttempt(topic, graded, topic.items.length, now)
  return { topic: { ...resolution.topic, itemEvidence: store }, resolution, attempt, graded }
}

const DAY_MS = 86_400_000

describe('the whole journey, end to end', () => {
  it('still reaches completion through ordinary honest practice, and only through it', () => {
    let topic: Topic = { ...morseTopic(), status: 'learning', learningAt: '2026-01-01T00:00:00.000Z' }
    let day = 2
    let completed = false
    const qualifying: { rungs: Set<string>; assisted: boolean } = { rungs: new Set(), assisted: true }

    // A diligent learner who answers correctly, one session a day, and waits out
    // every gap the scheduler asks for.
    for (let session = 0; session < 120 && !completed; session += 1) {
      const now = new Date(Date.parse('2026-01-01T00:00:00.000Z') + day * DAY_MS)
      const before = topic
      const played = playSession(topic, () => true, now)
      topic = played.topic

      if (played.resolution.completed) {
        completed = true
        qualifying.assisted = played.attempt.some((answer) => answer.assisted)
        for (const raw of before.items) {
          qualifying.rungs.add(rungFor(raw as IdentifiedItem, before.itemEvidence?.[raw.id as string]).id)
        }
      }

      // Wait exactly as long as the scheduler says, so no gap is skipped.
      day += before.status === 'drilled' ? COMPLETION_GAP_DAYS : 1
    }

    expect(completed).toBe(true)
    expect(topic.status).toBe('completed')
    expect(topic.completedAt).not.toBeNull()

    // What the qualifying attempt was: 26 units, every one of them uncued.
    expect(qualifying.assisted).toBe(false)
    expect([...qualifying.rungs].every((id) => id === 'free-production' || id === 'free-reception')).toBe(true)

    // And every letter holds independent evidence in both required directions.
    expect(hasCompleteTopicDirectionalCoverage(topic.items, topic.itemEvidence)).toBe(true)
    for (const item of topic.items) {
      const directions = topic.itemEvidence?.[item.id as string]?.directions
      expect(directions?.['prompt-to-answer']?.unassistedCorrect ?? 0).toBeGreaterThan(0)
      expect(directions?.['answer-to-prompt']?.unassistedCorrect ?? 0).toBeGreaterThan(0)
    }
  })

  it('never completes a learner who is still being carried by the cues', () => {
    // This learner answers correctly whenever a cue is on screen and misses as
    // soon as one is taken away. Cued recognition is real, and it is not the
    // claim, so the topic must never complete however long they keep going.
    let topic: Topic = { ...morseTopic(), status: 'learning', learningAt: '2026-01-01T00:00:00.000Z' }
    let day = 2

    for (let session = 0; session < 200; session += 1) {
      const now = new Date(Date.parse('2026-01-01T00:00:00.000Z') + day * DAY_MS)
      const before = topic
      const played = playSession(
        topic,
        (item) => isAssistedRung(rungFor(item, before.itemEvidence?.[item.id])),
        now,
      )
      topic = played.topic
      expect(played.resolution.completed).toBe(false)
      day += before.status === 'drilled' ? COMPLETION_GAP_DAYS : 1
    }

    expect(topic.completedAt).toBeNull()
    expect(topic.status).not.toBe('completed')
    expect(hasCompleteTopicDirectionalCoverage(topic.items, topic.itemEvidence)).toBe(false)
  })
})
