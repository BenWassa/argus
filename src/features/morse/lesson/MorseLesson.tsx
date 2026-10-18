import { canonicalPattern } from '../../../domain/morse/testing/acquisitionProfile'
import { owedLetters, type LessonRun } from '../../../domain/morse/curriculum/lesson'
import { journeyFor } from '../../../domain/study/journey'
import type { Topic } from '../../../domain/library/topic'
import { MorseCheckpoint } from './MorseCheckpoint'
import { MorseBeatGrammarNote } from '../MorsePhrase'
import { MorseCharacterSupport } from '../MorseCharacterSupport'
import { CharacterStage, ListeningCheckStep, StepLabel, VisualCheckStep } from './LessonSteps'
import { LessonBar } from './LessonBar'
import { useLessonProgression } from './useLessonProgression'
import './MorseLesson.css'

interface MorseLessonProps {
  topic: Topic
  initialRun: LessonRun
  /**
   * True when this is a rerun of a lesson the learner has already reached
   * (#117).
   *
   * Replay is deliberately not a second surface. It is this component, with
   * this component's screens, steps, mnemonics, audio, feedback and word
   * checkpoints, running a lesson the canonical builder produced for an earlier
   * position. The flag changes three things and nothing else: the record writes
   * nothing, "next lesson" walks the printed order instead of the learner's
   * durable position, and the copy stops implying a first meeting.
   */
  replay?: boolean
  onExit: () => void
  onTest: () => void
  onReference: () => void
  /** Guided sending, offered beside Test once every letter is acquired (#201). */
  onPlay?: () => void
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
  const {
    run, topicRef, headingRef, stepRef, sounding, audioError, toggle,
    phase, armed, holding, hasFeedback, step, packetProgress, notationIsNew,
    listeningEntry, listening, audioOptions, listeningFeedback, audioNotice,
    checkpointInvite, runningCheckpoint, startInvitedCheckpoint,
    skipInvitedCheckpoint, finishRunningCheckpoint, continueFromMiss,
    introduce, answerVisual, answerListening, skipListening, nextPacket,
  } = useLessonProgression({ topic, initialRun, replay, onExit })
  const bar = <LessonBar run={run} replay={replay} onExit={onExit} />

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
    const { checkpoint } = checkpointInvite
    const wordCount = checkpoint.words.length
    return (
      <section className="session morse-lesson">
        {bar}
        <h1 ref={headingRef} tabIndex={-1} className="lesson-title">Checkpoint</h1>
        <p className="lesson-lede">Real words, in letters you already know.</p>
        <p className="lesson-foot">
          {checkpoint.warmups.length} warm-ups, then {wordCount === 1 ? 'one word' : `${wordCount} words`}. Optional.
        </p>
        <div className="lesson-exits" inert={!armed}>
          <button type="button" onClick={startInvitedCheckpoint}>Start</button>
          <button className="ghost" type="button" onClick={skipInvitedCheckpoint}>Skip</button>
        </div>
      </section>
    )
  }

  if (run.finished) {
    return (
      <section className="session morse-lesson">
        {bar}
        <h1 ref={headingRef} tabIndex={-1} className="lesson-title">Every letter covered</h1>
        {/* Trimmed hard, but not past the claim it exists to refuse to make:
            Learn finishing is acquisition, and the A–Z claim is still Test's. */}
        <p className="lesson-lede">That is acquisition, not proof. The A–Z claim is earned in Test.</p>
        <div className="lesson-exits" inert={!armed}>
          <button type="button" onClick={onTest}>Test me</button>
          {/* Play opens with acquisition, not with the Test: the letters can be
              used in words now, and sending records nothing against the claim. */}
          {onPlay && journeyFor(topicRef.current).acquisition.ready && (
            <button className="ghost" type="button" onClick={onPlay}>Send five words</button>
          )}
          <button className="ghost" type="button" onClick={onReference}>Morse alphabet</button>
        </div>
      </section>
    )
  }

  if (run.complete && run.afterCourse) {
    // What this sitting settled is already recorded, so what is left is read
    // straight off the topic as it stands now.
    const still = owedLetters(topicRef.current)
    return (
      <section className="session morse-lesson">
        {bar}
        <h1 ref={headingRef} tabIndex={-1} className="lesson-title">
          {still.length === 0 ? 'Every letter confirmed' : 'Letters gone over'}
        </h1>
        <p className="lesson-lede">
          {still.length === 0
            ? 'The course is ready for its Test.'
            : `Still to confirm: ${still.join(' ')}. Another round counts as a new sitting.`}
        </p>
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
        <p className="lesson-foot">Nothing in Learn is scored.</p>
      </section>
    )
  }

  if (run.complete) {
    const last = run.packetIndex + 1 >= run.packetCount
    return (
      <section className="session morse-lesson">
        {bar}
        <h1 ref={headingRef} tabIndex={-1} className="lesson-title">
          Lesson {run.packetIndex + 1} {replay ? 'replayed' : 'done'}
        </h1>
        <p className="lesson-lede">
          {last ? 'That was the last lesson.' : 'Next lesson brings two new letters.'}
        </p>
        <div className="lesson-exits" inert={!armed}>
          <button type="button" onClick={nextPacket}>{last ? 'Finish' : 'Next lesson'}</button>
          <button className="ghost" type="button" onClick={onExit}>Stop here</button>
        </div>
        {/* One line, and only the one the learner cannot infer: what this run
            did and did not change. */}
        <p className="lesson-foot">
          {replay ? 'A replay records nothing.' : 'Nothing in Learn is scored.'}
        </p>
      </section>
    )
  }

  const feedback = run.feedback
  const shownListeningFeedback = listeningFeedback

  return (
    <section
      className="session morse-lesson"
      data-phase={phase}
      // `data-step` marks the screens whose whole job is one retrieval, so the
      // stylesheet can bring the answer down into thumb reach instead of
      // leaving a third of a phone screen empty beneath it. Feedback is
      // excluded on purpose: a correction is read from the top down.
      data-step={!hasFeedback && step ? step.kind : undefined}
    >
      {bar}
      <h1 ref={headingRef} tabIndex={-1} className="sr-only">
        {run.afterCourse ? 'Morse, going over missed letters' : `Morse lesson, packet ${run.packetIndex + 1} of ${run.packetCount}`}
      </h1>
      {/* The one piece of progress worth showing inside a lesson, shown rather
          than spelled out. `Lesson progress: 2 of 5 settled` was a sentence
          carrying two numbers that mattered less than the bar does. */}
      <div
        className="lesson-progress"
        role="progressbar"
        aria-valuenow={packetProgress.done}
        aria-valuemin={0}
        aria-valuemax={packetProgress.total}
        aria-label="Letters settled this lesson"
      >
        <span
          className="lesson-progress-fill"
          style={{ inlineSize: `${packetProgress.total === 0 ? 0 : (packetProgress.done / packetProgress.total) * 100}%` }}
        />
      </div>

      {(feedback?.correct || shownListeningFeedback?.correct) && (
        <div className="lesson-feedback is-correct" role="status" aria-live="polite">
          <p className="lesson-verdict">Correct</p>
        </div>
      )}

      {/* Both corrections hold until `Continue`. Nothing about a miss is on a
          clock any more, so there is no dwell for a learner to lose a
          half-read correction to — see `useKeyedResponse`. */}
      {shownListeningFeedback && !shownListeningFeedback.correct && (
        <div className="lesson-feedback" role="status" aria-live="assertive">
          <p className="lesson-verdict">Not that one</p>
          <p className="lesson-correction">You chose {shownListeningFeedback.response || 'no letter'}. The sound was {shownListeningFeedback.glyph}:</p>
          <MorseCharacterSupport glyph={shownListeningFeedback.glyph} pattern={shownListeningFeedback.pattern}
            playing={sounding?.glyph === shownListeningFeedback.glyph}
            onToggle={() => toggle(shownListeningFeedback.glyph)} audioError={audioError} />
          <button className="lesson-next" type="button" onClick={continueFromMiss} disabled={!holding}>Continue</button>
        </div>
      )}

      {feedback && !feedback.correct && (
        <div className="lesson-feedback" role="status" aria-live="assertive">
          <p className="lesson-verdict">Not that one</p>
          <p className="lesson-correction">You keyed <span className="mono">{feedback.response ? canonicalPattern(feedback.response) : '—'}</span>. {feedback.glyph} is:</p>
          <MorseCharacterSupport glyph={feedback.glyph} pattern={feedback.pattern} playing={sounding?.glyph === feedback.glyph}
            onToggle={() => toggle(feedback.glyph)} audioError={audioError} />
          <button className="lesson-next" type="button" onClick={continueFromMiss} disabled={!holding}>Continue</button>
        </div>
      )}

      {!hasFeedback && step?.kind === 'introduce' && (
        <div className="lesson-introduce" ref={stepRef} tabIndex={-1} data-kind="new">
          <StepLabel>New letter</StepLabel>
          <CharacterStage glyph={step.entry.glyph} pattern={step.entry.pattern} playing={sounding?.glyph === step.entry.glyph}
            activeIndex={sounding?.glyph === step.entry.glyph ? sounding.index : null} onToggle={() => toggle(step.entry.glyph)} />
          {notationIsNew && <MorseBeatGrammarNote className="lesson-grammar" />}
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

      {(audioNotice || audioError) && <p className="morse-audio-error" role="status">{audioNotice ?? `${audioError} Continuing visually.`}</p>}
    </section>
  )
}
