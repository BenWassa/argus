import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function read(path: string): string {
  return readFileSync(resolve(path), 'utf8')
}

function importsOf(source: string): string[] {
  return [...source.matchAll(/^import[\s\S]*?from '([^']+)'/gm)].map((match) => match[1])
}

const RUN = 'src/features/morse/fluency/FluencyRun.tsx'
const HOME = 'src/features/morse/fluency/FluencyHome.tsx'
const SURFACE = 'src/features/morse/fluency/FluencySurface.tsx'

/**
 * The evidence boundary, enforced structurally rather than documentarily.
 *
 * `PracticeRun` can make the strong claim — writes nothing — because it
 * imports nothing that could write. Fluency legitimately keeps statistics, so
 * its claim is one step weaker and has to be stated precisely: it writes
 * `morseFluency`, through one function, from one module. Everything else is
 * out of reach.
 *
 * If a future edit needs a scheduler or an evidence recorder in here, it is no
 * longer a formative surface, and this test should be the thing that says so.
 */
describe('fluency writes only its own field', () => {
  it.each([
    ['the run', RUN],
    ['the home screen', HOME],
  ])('keeps %s away from every write path', (_label, path) => {
    const source = read(path)
    const imports = importsOf(source)

    expect(imports).not.toContain('../../../services/library/LibraryProvider')
    expect(imports).not.toContain('../../../domain/study/scheduling')
    expect(imports).not.toContain('../../../domain/study/cueLadder')
    expect(imports).not.toContain('../../../domain/study/evidence')
    expect(source).not.toContain('updateTopic')
    expect(source).not.toContain('resolveAttempt')
    expect(source).not.toContain('resolveStudy')
    expect(source).not.toContain('recordAnswer(')
    expect(source).not.toContain('mergeItemEvidence')
  })

  it('confines the one write to the surface wrapper, and to one field', () => {
    const source = read(SURFACE)
    const writes = [...source.matchAll(/updateTopic\(/g)]
    expect(writes).toHaveLength(1)

    // The write is a spread plus exactly one field. Anything else reaching a
    // topic from here would be a second thing Fluency can change.
    expect(source).toContain('...current, morseFluency: next')
    expect(source).not.toContain('lastTestedAt')
    expect(source).not.toContain('itemEvidence')
    expect(source).not.toContain('status')
    expect(source).not.toContain('completedAt')
    expect(source).not.toContain('history')
  })

  it('never reaches the scored Test evidence store from anywhere in the feature', () => {
    for (const path of [RUN, HOME, SURFACE]) {
      const source = read(path)
      expect(source).not.toContain('DirectionEvidence')
      expect(source).not.toContain('unassistedCorrect')
      expect(source).not.toContain('lastLatencyMs')
    }
  })

  /**
   * Press duration is deliberately discarded by `MorseKeyInput` so it cannot
   * become sending-speed evidence. A surface that measures response time is
   * exactly the one that would be tempted to start measuring keying time too.
   */
  it('measures response time and never keying time', () => {
    const source = read(RUN)
    expect(source).not.toContain('pressDuration')
    expect(source).not.toContain('MORSE_HOLD_MS')
    expect(source).not.toContain('wpm')
  })
})
