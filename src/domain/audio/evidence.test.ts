import { describe, expect, it } from 'vitest'
import {
  hasCompleteListeningCoverage,
  listeningCoverage,
  mergeAudioEvidence,
  pruneAudioEvidence,
  recordAudioAnswer,
} from './evidence'
import type { Item } from '../library/topic'
import { recordAnswer } from '../study/cueLadder'

const at = '2026-10-01T10:00:00.000Z'

const heard = (id: string): Item => ({
  id,
  kind: 'forward',
  prompt: 'p',
  answer: 'a',
  choice: { options: ['a', 'b'] },
  audio: { assetId: `asset-${id}`, src: '/media/audio/x.wav', transcript: 'a', drill: 'proword' },
})
const plain = (id: string): Item => ({ id, kind: 'forward', prompt: 'p', answer: 'a' })

describe('listening evidence', () => {
  it('counts an unaided correct answer as both correct and unaided', () => {
    const e = recordAudioAnswer(undefined, { correct: true, assisted: false, latencyMs: 900, at })
    expect(e).toEqual({ attempts: 1, correct: 1, unassistedCorrect: 1, assistedAttempts: 0, lastAt: at, lastLatencyMs: 900 })
  })

  it('counts a transcript-assisted correct answer as correct but never as unaided', () => {
    const e = recordAudioAnswer(undefined, { correct: true, assisted: true, latencyMs: 4000, at })
    expect(e.correct).toBe(1)
    expect(e.unassistedCorrect).toBe(0)
    expect(e.assistedAttempts).toBe(1)
  })

  it('counts a miss as an attempt only', () => {
    const e = recordAudioAnswer(undefined, { correct: false, assisted: false, latencyMs: null, at })
    expect(e).toMatchObject({ attempts: 1, correct: 0, unassistedCorrect: 0, assistedAttempts: 0 })
  })

  it('accumulates, and every counter stays consistent', () => {
    let e = recordAudioAnswer(undefined, { correct: true, assisted: false, latencyMs: 1, at })
    e = recordAudioAnswer(e, { correct: true, assisted: true, latencyMs: 2, at })
    e = recordAudioAnswer(e, { correct: false, assisted: false, latencyMs: 3, at })
    expect(e).toMatchObject({ attempts: 3, correct: 2, unassistedCorrect: 1, assistedAttempts: 1 })
    expect(e.unassistedCorrect).toBeLessThanOrEqual(e.attempts - e.assistedAttempts)
  })
})

describe('listening is its own claim', () => {
  const items = [heard('h1'), heard('h2'), plain('t1')]

  it('reads only heard items and only unaided answers', () => {
    const store = {
      h1: recordAudioAnswer(undefined, { correct: true, assisted: false, latencyMs: 1, at }),
      h2: recordAudioAnswer(undefined, { correct: true, assisted: true, latencyMs: 1, at }),
    }
    expect(listeningCoverage(items, store)).toEqual({ unaided: 1, total: 2 })
    expect(hasCompleteListeningCoverage(items, store)).toBe(false)
    const both = { ...store, h2: recordAudioAnswer(store.h2, { correct: true, assisted: false, latencyMs: 1, at }) }
    expect(hasCompleteListeningCoverage(items, both)).toBe(true)
  })

  it('cannot be completed by text or choice evidence', () => {
    // Plenty of perfect item evidence for the very same items…
    const itemEvidence = Object.fromEntries(
      items.map((item) => [
        item.id!,
        recordAnswer(undefined, { direction: 'prompt-to-answer', correct: true, assisted: false, latencyMs: 1, at }),
      ]),
    )
    expect(Object.keys(itemEvidence)).toHaveLength(3)
    // …and the listening record is still empty, so the claim is still open.
    expect(listeningCoverage(items, undefined)).toEqual({ unaided: 0, total: 2 })
    expect(hasCompleteListeningCoverage(items, undefined)).toBe(false)
  })

  it('is never complete for a topic with nothing to hear', () => {
    expect(hasCompleteListeningCoverage([plain('t1')], {})).toBe(false)
    expect(listeningCoverage([plain('t1')], {})).toEqual({ unaided: 0, total: 0 })
  })

  it('merges and prunes like item evidence', () => {
    const a = recordAudioAnswer(undefined, { correct: true, assisted: false, latencyMs: 1, at })
    expect(mergeAudioEvidence({ h1: a }, { h2: a })).toEqual({ h1: a, h2: a })
    expect(Object.keys(pruneAudioEvidence({ h1: a, gone: a }, items))).toEqual(['h1'])
    expect(pruneAudioEvidence(undefined, items)).toEqual({})
  })
})
