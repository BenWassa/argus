import {
  owedLetters
} from '../../../domain/morse/curriculum/lesson'
import { spokenRhythm } from '../../../domain/morse/mnemonics'
import { journeyFor } from '../../../domain/study/journey'
import { SaveBar } from '../../../shared/ui/SaveBar'
import { SessionCorrect, SessionFrame } from '../../../shared/ui/SessionFrame'
import { MorseCharacterSupport } from '../MorseCharacterSupport'
import { MorseMarks } from '../MorseMarks'
import { CharacterStage, ListeningCheckStep, StepLabel, VisualCheckStep } from './LessonSteps'
import { MorseCheckpoint } from './MorseCheckpoint'
import './MorseLesson.css'
import { useLessonProgression, type MorseLessonProps } from './useLessonProgression'
/**
 * Shown when the device refused an answer's write, or is slow to keep it. The
 * lesson has not moved on: what was earned stays on screen. A refusal offers
 * trying again, which repeats the same write; a slow save only says so.
 */
function SaveHold({ held, slow, onRetry }: { held: boolean; slow: boolean; onRetry: () => void }) {
  if (held) {
    return (
      <div className="lesson-save-hold" role="alert">
        <p>Your answer was not saved on this device. Nothing is lost yet.</p>
        <button type="button" onClick={onRetry}>Try saving again</button>
      </div>
    )
  }
  // Slow, not refused: the lesson moves on by itself once the device has kept it.
  if (slow) {
    return (
      <div className="lesson-save-hold" role="status">
        <p>Still saving to this device. This can take a moment.</p>
        <SaveBar />
      </div>
    )
  }
  return null
}

export function MorseLesson({
  topic,
  initialRun,
  replay = false,
  onExit,
  onTest,
  onReference,
  onPlay,
}: MorseLessonProps) {
  const { sounding, audioError, toggle, headingRef, stepRef, run, listeningFeedback, audioNotice, checkpointInvite, runningCheckpoint, phase, armed, holding, continueFromMiss, topicRef, hasFeedback, saveHeld, saveSlow, retrySave, step, packetProgress, listeningEntry, listening, audioOptions, introduce, startInvitedCheckpoint, skipInvitedCheckpoint, finishRunningCheckpoint, answerVisual, answerListening, skipListening, nextPacket } = useLessonProgression({ topic, initialRun, replay, onExit, onTest, onReference, onPlay })
  const frame = {
    kind: 'lesson' as const,
    title: run.finished ? 'Lessons' : run.afterCourse ? 'Review' : `Lesson ${run.packetIndex + 1}`,
    'data-replay': replay || undefined,
    progress: { current: packetProgress.done, total: packetProgress.total },
    onClose: onExit,
  }

  if (runningCheckpoint) {
    return (
      <MorseCheckpoint
        checkpoint={runningCheckpoint.checkpoint}
        onExit={onExit}
        onContinue={finishRunningCheckpoint}
        continueLabel="Keep going"
      />
    )
  }

  if (checkpointInvite) {
    return (
      <SessionFrame {...frame} className="morse-lesson">
        <h2 ref={headingRef} tabIndex={-1} className="session-prompt-heading lesson-title">Checkpoint</h2>
        <div className="lesson-exits" inert={!armed}>
          <button type="button" onClick={startInvitedCheckpoint}>Start</button>
          <button className="ghost" type="button" onClick={skipInvitedCheckpoint}>Skip</button>
        </div>
      </SessionFrame>
    )
  }

  if (run.finished) {
    return (
      <SessionFrame {...frame} className="morse-lesson">
        <h2 ref={headingRef} tabIndex={-1} className="session-prompt-heading lesson-title">Every letter covered</h2>
        <SaveHold held={saveHeld} slow={saveSlow} onRetry={retrySave} />
        <div className="lesson-exits" inert={!armed}>
          <button type="button" onClick={onTest}>Test me</button>
          {/* Play opens with acquisition, not with the Test: the letters can be
              used in words now, and sending records nothing against the claim. */}
          {onPlay && journeyFor(topicRef.current).acquisition.ready && (
            <button className="ghost" type="button" onClick={onPlay}>Send five words</button>
          )}
          <button className="ghost" type="button" onClick={onReference}>Morse alphabet</button>
        </div>
      </SessionFrame>
    )
  }

  if (run.complete && run.afterCourse) {
    // What this sitting settled is already recorded, so what is left is read
    // straight off the topic as it stands now.
    const still = owedLetters(topicRef.current)
    return (
      <SessionFrame {...frame} className="morse-lesson">
        <h2 ref={headingRef} tabIndex={-1} className="session-prompt-heading lesson-title">
          {still.length === 0 ? 'Every letter confirmed' : 'Letters gone over'}
        </h2>
        <SaveHold held={saveHeld} slow={saveSlow} onRetry={retrySave} />
        <div className="lesson-exits" inert={!armed}>
          {still.length === 0 ? (
            <>
              <button type="button" onClick={onTest}>Test me</button>
              <button className="ghost" type="button" onClick={onExit}>Done</button>
            </>
          ) : (
            <>
              <button type="button" onClick={nextPacket}>Another round</button>
              <button className="ghost" type="button" onClick={onExit}>Stop here</button>
            </>
          )}
        </div>
      </SessionFrame>
    )
  }

  if (run.complete) {
    const last = run.packetIndex + 1 >= run.packetCount
    return (
      <SessionFrame {...frame} className="morse-lesson">
        <h2 ref={headingRef} tabIndex={-1} className="session-prompt-heading lesson-title">
          Lesson {run.packetIndex + 1} {replay ? 'replayed' : 'done'}
        </h2>
        <SaveHold held={saveHeld} slow={saveSlow} onRetry={retrySave} />
        <div className="lesson-exits" inert={!armed}>
          <button type="button" onClick={nextPacket}>{last ? 'Finish' : 'Next lesson'}</button>
          <button className="ghost" type="button" onClick={onExit}>Stop here</button>
        </div>
      </SessionFrame>
    )
  }

  const feedback = run.feedback
  const shownListeningFeedback = listeningFeedback

  return (
    <SessionFrame {...frame}
      className="morse-lesson"
      data-phase={phase}
      // `data-step` marks the screens whose whole job is one retrieval, so the
      // stylesheet can bring the answer down into thumb reach instead of
      // leaving a third of a phone screen empty beneath it. Feedback is
      // excluded on purpose: a correction is read from the top down.
      data-step={!hasFeedback && step ? step.kind : undefined}
    >
      <h2 ref={headingRef} tabIndex={-1} className="session-prompt-heading sr-only">
        {run.afterCourse ? 'Morse, going over missed letters' : `Morse lesson, packet ${run.packetIndex + 1} of ${run.packetCount}`}
      </h2>
      {(feedback?.correct || shownListeningFeedback?.correct) && <SessionCorrect target={feedback?.glyph ?? shownListeningFeedback?.glyph} />}

      {/* Both corrections hold until `Continue`. Nothing about a miss is on a
          clock any more, so there is no dwell for a learner to lose a
          half-read correction to — see `useKeyedResponse`. */}
      {shownListeningFeedback && !shownListeningFeedback.correct && (
        <SessionCorrect className="lesson-miss" miss={{
          said: shownListeningFeedback.response || undefined,
          answer: <MorseCharacterSupport glyph={shownListeningFeedback.glyph} pattern={shownListeningFeedback.pattern}
            playing={sounding?.glyph === shownListeningFeedback.glyph}
            onToggle={() => toggle(shownListeningFeedback.glyph)} audioError={audioError} />,
          onContinue: continueFromMiss, continueDisabled: !holding,
        }} />
      )}

      {feedback && !feedback.correct && (
        <SessionCorrect className="lesson-miss" miss={{
          said: feedback.response ? <MorseMarks pattern={feedback.response} size="support" label={spokenRhythm(feedback.response)} /> : undefined,
          saidLabel: 'You keyed',
          answer: <MorseCharacterSupport glyph={feedback.glyph} pattern={feedback.pattern} playing={sounding?.glyph === feedback.glyph}
            onToggle={() => toggle(feedback.glyph)} audioError={audioError} />,
          onContinue: continueFromMiss, continueDisabled: !holding,
        }} />
      )}

      {!hasFeedback && step?.kind === 'introduce' && (
        <div className="lesson-introduce" ref={stepRef} tabIndex={-1} data-kind="new">
          <StepLabel>New letter</StepLabel>
          <CharacterStage glyph={step.entry.glyph} pattern={step.entry.pattern} playing={sounding?.glyph === step.entry.glyph}
            activeIndex={sounding?.glyph === step.entry.glyph ? sounding.index : null} onToggle={() => toggle(step.entry.glyph)} />
          <button
            className="lesson-next"
            type="button"
            onClick={() => introduce(step.entry.itemId)}
          >
            Got it
          </button>
        </div>
      )}

      {!hasFeedback && step?.kind === 'check' && listeningEntry && (
        <ListeningCheckStep key={`listen-${listeningEntry.itemId}-${run.step}`} regionRef={stepRef} entry={listeningEntry}
          options={audioOptions} playing={sounding?.glyph === listeningEntry.glyph} onToggle={() => toggle(listeningEntry.glyph)}
          onAnswer={(response) => answerListening(listeningEntry.itemId, response)} onSkip={skipListening} armed={armed} />
      )}

      {!hasFeedback && step?.kind === 'check' && !listening && (
        <VisualCheckStep key={`visual-${step.entry.itemId}-${run.step}`} regionRef={stepRef} entry={step.entry}
          format={step.format} armed={armed} onAnswer={(response) => answerVisual(step.entry.itemId, response)} />
      )}

      <SaveHold held={saveHeld} slow={saveSlow} onRetry={retrySave} />

      {(audioNotice || audioError) && <p className="morse-audio-error" role="status">{audioNotice ?? `${audioError} Continuing visually.`}</p>}
    </SessionFrame>
  )

}
