import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

function source(file: string): string {
  return readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8')
}

describe('Morse word checkpoint surface', () => {
  it('uses direct keyed input and gives a word one automatic verdict', () => {
    const code = source('./MorseCheckpoint.tsx')
    expect(code).toContain("import { MorseKeyInput } from '../input/MorseKeyInput'")
    expect(code).toContain("import { MorseWordKeyInput } from '../input/MorseWordKeyInput'")
    expect(code).toContain('expectedLength={MORSE_LETTERS[target.letter].length}')
    expect(code).toContain('pattern.every((entry, index) => entry === MORSE_LETTERS[target.letters[index]])')
    expect(code).not.toMatch(/>\s*(Submit|Check|Delete|Continue|Back)\s*</)
    expect(code).not.toContain('Backspace')
  })

  it('shows the whole word without turning each character into a checkpoint', () => {
    const code = source('./MorseCheckpoint.tsx')
    expect(code).toContain('morse-checkpoint-word')
    expect(code).toContain('Key the whole word')
    expect(code).toContain('Key the whole word {target.word}')
    expect(code).not.toContain('Key the highlighted letter')
    expect(code).not.toContain('characterIndex')
  })

  it('advances after either correct or wrong feedback without a manual confirmation action', () => {
    const code = source('./MorseCheckpoint.tsx')
    expect(code).toContain('setFeedback({ correct, target })')
    expect(code).toContain('answered(correct)')
    expect(code).toContain('useKeyedResponse')
    expect(code).not.toContain('setTimeout(')
    expect(code).not.toContain('MORSE_CHECKPOINT_FEEDBACK_MS')
    expect(code).toContain('setIndex((current) => current + 1)')
    expect(code).toContain("feedback.correct ? 'Correct' : 'Miss'")
    expect(code).toContain('inert={!armed}')
    expect(code).toContain('locked={!armed}')
    expect(code).not.toContain('>Continue<')
  })

  it('revisits a missed target at most once and reports a small local summary', () => {
    const code = source('./MorseCheckpoint.tsx')
    expect(code).toContain('checkpointTargetKey(target)')
    expect(code).toContain('retriedTargets.current.has(key)')
    expect(code).toContain('retriedTargets.current.add(key)')
    expect(code).toContain('withCheckpointRetry(current, index, target)')
    expect(code).toContain('{correctAnswers} of {attempts} correct')
    expect(code).toContain("'target' : 'targets'} revisited once")
    expect(code).toContain("' · no misses to revisit'")
  })

  it('is structurally ephemeral and has no durable learner-state write path', () => {
    const code = source('./MorseCheckpoint.tsx')
    expect(code).not.toContain("from '../../../services/library/LibraryProvider'")
    expect(code).not.toContain("from '../../../domain/study/scheduling'")
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

  it('offers a #88 continuation back into the interrupted lesson only when one is handed in', () => {
    const code = source('./MorseCheckpoint.tsx')
    expect(code).toContain('onContinue?: () => void')
    expect(code).toContain('onContinue ? (')
    expect(code).toContain('{continueLabel ?? \'Keep going\'}')
    expect(code).toMatch(/<button type="button" disabled=\{!armed\} onClick=\{onExit\}>Back to lessons<\/button>/)
    expect(code).not.toContain('>Continue<')
  })

  it('extends the #88 automatic handoff to all four cumulative milestones', () => {
    const lesson = source('./MorseLesson.tsx')
    expect(lesson).toContain('const CHECKPOINT_LESSON_NUMBERS = new Set([4, 7, 10, 13])')
    expect(lesson).toContain('checkpointNewlyUnlocked(pathBeforeAnswer, pathNow, completedLessonNumber)')
    expect(lesson).toContain('setCheckpointInvite({ checkpoint: invite, resume: cleared })')
    expect(lesson).toContain('Skip for now')
  })
})
