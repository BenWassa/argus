import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

function source(file: string): string {
  return readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8')
}

describe('Morse word checkpoint surface', () => {
  it('uses direct keyed input for each letter in a word', () => {
    const code = source('./MorseCheckpoint.tsx')
    expect(code).toContain("import { MorseKeyInput } from '../input/MorseKeyInput'")
    expect(code).not.toContain('MorseWordKeyInput')
    expect(code).toContain('expectedLength={MORSE_LETTERS[letter].length}')
    expect(code).toContain('pattern === MORSE_LETTERS[letter]')
    // No Submit/Delete/Backspace: the key commits on the final element. The one
    // button a target may carry is the `Continue` that ends a correction, and
    // it appears only inside the miss branch of the feedback block.
    expect(code).not.toMatch(/>\s*(Submit|Check|Delete|Back)\s*</)
    expect(code).not.toContain('Backspace')
  })

  it('keeps the whole word visible and highlights the current character', () => {
    const code = source('./MorseCheckpoint.tsx')
    expect(code).toContain('morse-checkpoint-word')
    expect(code).toContain("run.phase === 'warmup' ? 'Warm up' : 'Word'")
    expect(code).toContain("characterIndex === run.characterIndex ? 'is-current'")
    expect(code).toContain('letter {run.characterIndex + 1} of {word}')
  })

  /**
   * Reverses the original #87 rule that neither verdict took a confirmation.
   *
   * That rule was right about a hit and wrong about a miss. A correction is the
   * only screen here with something on it to read, and every duration this
   * surface ever chose for it was a guess at someone else's reading speed. So a
   * hit still clears itself and a miss now waits for the learner — one shared
   * boundary still, with the difference owned by `useKeyedResponse` rather than
   * by a private timer here.
   */
  it('clears a hit by itself and holds a miss until the learner continues', () => {
    const code = source('./MorseCheckpoint.tsx')
    expect(code).toContain('setFeedback({ correct, letter })')
    expect(code).toContain('answered(correct)')
    expect(code).toContain('useKeyedResponse')
    expect(code).not.toContain('setTimeout(')
    expect(code).not.toContain('MORSE_CHECKPOINT_FEEDBACK_MS')
    expect(code).toContain('nextCheckpointRunState(checkpoint, current)')
    expect(code).toContain("feedback.correct ? 'Correct' : 'Miss'")
    expect(code).toContain('inert={!armed}')
    expect(code).toContain('locked={!armed}')
    // The dismissal lives inside the miss branch and is driven by the hook's
    // own hold state, so it can never appear beside a hit.
    expect(code).toContain('onClick={acknowledge} disabled={!holding}')
    const missBranch = code.slice(code.indexOf('{!feedback.correct && ('), code.indexOf('morse-checkpoint-answer'))
    expect(missBranch).toContain('onClick={acknowledge}')
  })

  it('never requeues a miss and reports a small local summary', () => {
    const code = source('./MorseCheckpoint.tsx')
    expect(code).not.toContain('checkpointTargetKey')
    expect(code).not.toContain('retriedTargets')
    expect(code).not.toContain('withCheckpointRetry')
    expect(code).toContain('{correctAnswers} of {attempts} correct')
    expect(code).toContain('Nothing here changed saved progress.')
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
    // The summary screen offers no `Continue`: that word belongs to a held
    // correction, and confusing the two would make one of them mean nothing.
    const summary = code.slice(code.indexOf('morse-checkpoint-summary'), code.indexOf('if (!letter)'))
    expect(summary).not.toMatch(/>\s*Continue\s*</)
  })

  it('extends the #88 automatic handoff to all four cumulative milestones', () => {
    const lesson = source('./MorseLesson.tsx')
    expect(lesson).toContain('const CHECKPOINT_LESSON_NUMBERS = new Set([4, 7, 10, 13])')
    expect(lesson).toContain('checkpointNewlyUnlocked(pathBeforeAnswer, pathNow, completedLessonNumber)')
    expect(lesson).toContain('setCheckpointInvite({ checkpoint: invite, resume: cleared })')
    expect(lesson).toContain('onClick={skipInvitedCheckpoint}>Skip<')
  })
})
