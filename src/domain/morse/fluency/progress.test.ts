import { describe, expect, it } from 'vitest'
import {
  FLUENCY_LATENCY_WINDOW,
  characterCv,
  coefficientOfVariation,
  elementCountRatio,
  fluencyIsFresh,
  fluencyNeed,
  medianLatency,
  newFluencyProgress,
  parseFluencyProgress,
  recordFluencyAnswer,
  recordFluencyBest,
  setFluencyRung,
  slowestCharacters,
  type MorseFluencyProgress,
} from './progress'

function withLatencies(
  glyphs: Record<string, number[]>,
): MorseFluencyProgress {
  let progress = newFluencyProgress()
  for (const [glyph, latencies] of Object.entries(glyphs)) {
    for (const latency of latencies) {
      progress = recordFluencyAnswer(progress, glyph as never, true, latency)
    }
  }
  return progress
}

describe('fluency progress', () => {
  it('starts fresh and reports itself as fresh', () => {
    expect(fluencyIsFresh(newFluencyProgress())).toBe(true)
  })

  it('stops being fresh once anything is recorded', () => {
    const progress = recordFluencyAnswer(newFluencyProgress(), 'E', true, 400)
    expect(fluencyIsFresh(progress)).toBe(false)
  })

  it('records a miss as an exposure without a latency', () => {
    const progress = recordFluencyAnswer(newFluencyProgress(), 'E', false, 400)
    expect(progress.characters.E).toEqual({ heard: 1, correct: 0, recentLatencyMs: [] })
  })

  it('refuses a latency on a wrong answer even when one is offered', () => {
    // A miss's response time mixes a fast guess with a long failed search.
    const progress = recordFluencyAnswer(newFluencyProgress(), 'Q', false, 120)
    expect(progress.characters.Q?.recentLatencyMs).toEqual([])
  })

  it('accepts a correct answer with no usable latency', () => {
    const progress = recordFluencyAnswer(newFluencyProgress(), 'E', true, null)
    expect(progress.characters.E).toEqual({ heard: 1, correct: 1, recentLatencyMs: [] })
  })

  it('bounds the latency window', () => {
    let progress = newFluencyProgress()
    for (let at = 0; at < FLUENCY_LATENCY_WINDOW + 8; at += 1) {
      progress = recordFluencyAnswer(progress, 'E', true, at)
    }
    const stored = progress.characters.E
    expect(stored?.recentLatencyMs).toHaveLength(FLUENCY_LATENCY_WINDOW)
    // Newest kept, oldest dropped.
    expect(stored?.recentLatencyMs.at(-1)).toBe(FLUENCY_LATENCY_WINDOW + 7)
    expect(stored?.heard).toBe(FLUENCY_LATENCY_WINDOW + 8)
  })

  it('reports the median rather than the mean, so one interruption cannot move it', () => {
    const progress = withLatencies({ E: [400, 410, 420, 430, 9000] })
    expect(medianLatency(progress, 'E')).toBe(420)
  })

  describe('coefficient of variation', () => {
    it('is unknown below the sample floor', () => {
      expect(coefficientOfVariation([400, 420, 410])).toBeNull()
    })

    it('is near zero for perfectly stable timing', () => {
      expect(coefficientOfVariation([500, 500, 500, 500, 500])).toBe(0)
    })

    /**
     * The measure's whole purpose: a uniform speed-up leaves CV unchanged,
     * because everything scaled together. Only a narrowing spread moves it.
     */
    it('is unchanged by a uniform speed-up', () => {
      const slow = [800, 1000, 1200, 900, 1100]
      const fast = slow.map((value) => value / 2)
      expect(coefficientOfVariation(fast)).toBeCloseTo(coefficientOfVariation(slow)!, 10)
    })

    it('falls when the spread narrows at the same mean', () => {
      const scattered = coefficientOfVariation([400, 1600, 500, 1500, 1000])!
      const steady = coefficientOfVariation([950, 1050, 1000, 1000, 1000])!
      expect(steady).toBeLessThan(scattered)
    })

    it('reads a single character from its own window', () => {
      const progress = withLatencies({ B: [500, 500, 500, 500, 500] })
      expect(characterCv(progress, 'B')).toBe(0)
      expect(characterCv(progress, 'Z')).toBeNull()
    })
  })

  describe('element-count ratio', () => {
    it('is unknown until both halves have data', () => {
      expect(elementCountRatio(withLatencies({ E: [400, 400, 400, 400, 400] }))).toBeNull()
    })

    it('is about 1 when long characters cost the same as short ones', () => {
      // E and T are one element; Q and Y are four.
      const progress = withLatencies({
        E: [500, 500, 500, 500, 500],
        Q: [500, 500, 500, 500, 500],
      })
      expect(elementCountRatio(progress)).toBeCloseTo(1, 5)
    })

    it('rises when long characters take proportionally longer, which is counting', () => {
      const progress = withLatencies({
        E: [400, 400, 400, 400, 400],
        Q: [1200, 1200, 1200, 1200, 1200],
      })
      expect(elementCountRatio(progress)).toBeCloseTo(3, 5)
    })
  })

  it('names the slowest characters it has enough data for', () => {
    const progress = withLatencies({
      E: [300, 300, 300, 300, 300],
      Q: [1400, 1400, 1400, 1400, 1400],
      Z: [900, 900, 900, 900, 900],
      // Below the sample floor: excluded however slow it looks.
      J: [5000, 5000],
    })
    expect(slowestCharacters(progress, 3).map((entry) => entry.glyph)).toEqual(['Q', 'Z', 'E'])
    expect(slowestCharacters(progress).some((entry) => entry.glyph === 'J')).toBe(false)
  })

  describe('selection need', () => {
    it('puts an unheard character above every heard one', () => {
      const progress = withLatencies({ Q: [3000, 3000, 3000, 3000, 3000] })
      expect(fluencyNeed(progress, 'X')).toBeGreaterThan(fluencyNeed(progress, 'Q'))
    })

    it('prefers the slower of two heard characters', () => {
      const progress = withLatencies({
        E: [300, 300, 300, 300, 300],
        Q: [1500, 1500, 1500, 1500, 1500],
      })
      expect(fluencyNeed(progress, 'Q')).toBeGreaterThan(fluencyNeed(progress, 'E'))
    })

    it('prefers the less accurate of two equally slow characters', () => {
      let progress = withLatencies({ E: [500, 500, 500, 500, 500], T: [500, 500, 500, 500, 500] })
      progress = recordFluencyAnswer(progress, 'T', false, null)
      expect(fluencyNeed(progress, 'T')).toBeGreaterThan(fluencyNeed(progress, 'E'))
    })
  })

  describe('personal bests', () => {
    it('keeps a better result and reports the improvement', () => {
      const first = recordFluencyBest(newFluencyProgress(), 'sprint', 40)
      expect(first.improved).toBe(true)
      const better = recordFluencyBest(first.progress, 'sprint', 55)
      expect(better.improved).toBe(true)
      expect(better.progress.bests.sprint).toBe(55)
    })

    it('refuses a worse or equal result', () => {
      const base = recordFluencyBest(newFluencyProgress(), 'sprint', 55).progress
      expect(recordFluencyBest(base, 'sprint', 40).improved).toBe(false)
      expect(recordFluencyBest(base, 'sprint', 55).improved).toBe(false)
      expect(recordFluencyBest(base, 'sprint', 40).progress.bests.sprint).toBe(55)
    })
  })

  it('keeps the rung as the only stored speed', () => {
    const progress = setFluencyRung(newFluencyProgress(), 10)
    expect(progress.rung).toBe(10)
    expect(Object.keys(progress)).not.toContain('characterWpm')
  })
})

describe('parseFluencyProgress', () => {
  const valid = {
    rung: 8,
    characters: { E: { heard: 3, correct: 2, recentLatencyMs: [400, 500] } },
    bests: { sprint: 42 },
  }

  it('accepts a well-formed record', () => {
    const parsed = parseFluencyProgress(valid)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.value.characters.E?.correct).toBe(2)
  })

  it('accepts a record with no bests', () => {
    const parsed = parseFluencyProgress({ rung: 6, characters: {} })
    expect(parsed.ok).toBe(true)
  })

  it.each([
    ['a non-object', 42],
    ['an array', []],
    ['an undefined rung', { characters: {} }],
    ['a rung off the ladder', { rung: 5, characters: {} }],
    ['a non-object characters map', { rung: 6, characters: [] }],
    ['an unknown letter', { rung: 6, characters: { '1': { heard: 1, correct: 1, recentLatencyMs: [] } } }],
    ['negative counters', { rung: 6, characters: { E: { heard: -1, correct: 0, recentLatencyMs: [] } } }],
    ['more correct than heard', { rung: 6, characters: { E: { heard: 1, correct: 2, recentLatencyMs: [] } } }],
    ['a negative latency', { rung: 6, characters: { E: { heard: 1, correct: 1, recentLatencyMs: [-3] } } }],
    ['more latencies than correct answers', { rung: 6, characters: { E: { heard: 2, correct: 1, recentLatencyMs: [400, 500] } } }],
    ['a non-numeric best', { rung: 6, characters: {}, bests: { sprint: 'fast' } }],
  ])('rejects %s', (_label, value) => {
    expect(parseFluencyProgress(value).ok).toBe(false)
  })

  it('rejects a window longer than the store allows', () => {
    const latencies = Array.from({ length: FLUENCY_LATENCY_WINDOW + 1 }, () => 400)
    const parsed = parseFluencyProgress({
      rung: 6,
      characters: { E: { heard: 99, correct: 99, recentLatencyMs: latencies } },
    })
    expect(parsed.ok).toBe(false)
  })
})
