import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

function source(file: string): string {
  return readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8')
}

describe('Morse word checkpoint surface', () => {
  it('reuses the #77 direct keyed input with expected-length auto grading', () => {
    const code = source('./MorseCheckpoint.tsx')
    expect(code).toContain("import { MorseKeyInput } from '../morse/MorseKeyInput'")
    expect(code).toContain('expectedLength={MORSE_LETTERS[target.letter].length}')
    expect(code).toContain('pattern === MORSE_LETTERS[target.letter]')
    expect(code).not.toMatch(/>\s*(Submit|Check|Delete|Continue|Back)\s*</)
    expect(code).not.toContain('Backspace')
  })

  it('shows the whole word with an explicit current-character treatment', () => {
    const code = source('./MorseCheckpoint.tsx')
    expect(code).toContain('morse-checkpoint-word')
    expect(code).toContain("characterIndex === target.characterIndex ? 'is-current' : undefined")
    expect(code).toContain('Key the highlighted letter')
    expect(code).toContain('character {(target.characterIndex ?? 0) + 1} of {target.word}')
  })

  it('advances after either correct or wrong feedback without a between-character Continue action', () => {
    const code = source('./MorseCheckpoint.tsx')
    expect(code).toContain('setFeedback({')
    expect(code).toContain("correct: pattern === MORSE_LETTERS[target.letter]")
    // The dwell is owned by the shared #87 lifecycle, not by a private timer
    // with a private duration that could drift from Learn's.
    expect(code).toContain('useKeyedResponse')
    expect(code).not.toContain('setTimeout(')
    expect(code).not.toContain('MORSE_CHECKPOINT_FEEDBACK_MS')
    expect(code).toContain('setIndex((current) => current + 1)')
    expect(code).toContain('answered(pattern === MORSE_LETTERS[target.letter])')
    expect(code).toContain("feedback.correct ? 'Correct' : 'Miss'")
    expect(code).not.toMatch(/feedback\.correct[^\n]+setIndex/)
    // The next letter is not answerable while the previous result stands.
    expect(code).toContain('inert={!armed}')
    expect(code).toContain('locked={!armed}')
    expect(code).not.toContain('>Continue<')
  })

  it('is structurally ephemeral and has no durable learner-state write path', () => {
    const code = source('./MorseCheckpoint.tsx')
    expect(code).not.toContain("from '../../lib/store'")
    expect(code).not.toContain("from '../../lib/scheduling'")
    expect(code).not.toContain('updateTopic')
    expect(code).not.toContain('lessonProgress')
    expect(code).not.toContain('lessonSitting')
    expect(code).not.toContain('acquisitionReadyAt')
    expect(code).not.toContain('DirectionEvidence')
    expect(code).not.toContain('localStorage')
  })

  it('announces feedback and restores focus while staying phone/text-scale safe', () => {
    const code = source('./MorseCheckpoint.tsx')
    const css = source('./MorseCheckpoint.css')
    expect(code).toContain('role="status"')
    expect(code).toContain('aria-live="assertive"')
    expect(code).toContain('targetRef.current?.focus({ preventScroll: true })')
    expect(code).toContain('headingRef.current?.focus({ preventScroll: true })')
    expect(css).toContain('max-width: 100%')
    expect(css).toContain('flex-wrap: wrap')
    expect(css).toContain('@media (max-width: 380px)')
    expect(css).not.toMatch(/font-size:\s*\d+px/)
  })
})
