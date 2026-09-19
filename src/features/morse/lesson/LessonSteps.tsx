import {
  canonicalNotation,
  mnemonicTextEquivalent,
  spokenRhythm,
} from '../../../domain/morse/mnemonics'
import type { LessonCheckFormat, LessonEntry } from '../../../domain/morse/curriculum/lesson'
import type { MorseLetter } from '../../../domain/morse/code'
import { MorseKeyInput } from '../input/MorseKeyInput'
import { MorseMnemonic } from '../MorseMnemonic'
import { MorsePhrase } from '../MorsePhrase'
import { MorsePlayButton } from '../MorsePlayButton'

/**
 * The three things a lesson step can put on screen: a character being taught,
 * a printed retrieval, and a listening retrieval.
 *
 * Presentation only — each takes what it should show and reports what the
 * learner did. None of them reads the library, the sitting or the review
 * history, which is what lets one set of steps serve first-time acquisition and
 * replay alike: the difference between the two is consequence, decided at the
 * record boundary, and never anything a step has to know about.
 */

/**
 * The mark on a step that is bringing an earlier character back.
 *
 * A lesson mixes two new letters with a handful of returning ones, and until
 * now the screens were identical: mid-lesson on `Y` and `Z`, a retrieval of `R`
 * simply appeared, and the only honest reading available to the learner was
 * that the app had lost its place. The circling arrow says the opposite —
 * this is coming round again, on purpose, because it is due.
 *
 * Drawn rather than lettered so the meaning survives at a glance and at any
 * text size, and `aria-hidden` because the word beside it already says it.
 */
export function ReviewMark() {
  return (
    <svg className="review-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M20 12a8 8 0 1 1-2.34-5.66"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M20 3.5V9h-5.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * The one line naming what this step is.
 *
 * Returning material gets the whole treatment — mark, colour and size — because
 * that is the distinction the learner cannot otherwise make. New material gets
 * a single quiet word, because the glyph under it is already the whole prompt.
 */
export function StepLabel({ review, children }: { review?: boolean; children: React.ReactNode }) {
  if (!review) return <p className="lesson-task">{children}</p>
  return (
    <p className="lesson-task is-review">
      <ReviewMark />
      Review
    </p>
  )
}
export function CharacterStage({
  glyph,
  pattern,
  playing,
  activeIndex,
  onToggle,
}: {
  glyph: string
  pattern: string
  playing: boolean
  activeIndex: number | null
  onToggle: () => void
}) {
  return (
    <div className="lesson-stage">
      <p className="lesson-glyph" aria-hidden="true">{glyph}</p>
      <MorsePhrase glyph={glyph} />
      <div className="lesson-visual">
        <MorseMnemonic
          glyph={glyph}
          pattern={pattern}
          textLabel={mnemonicTextEquivalent(glyph, pattern)}
          activeIndex={activeIndex}
        />
        <MorsePlayButton glyph={glyph} playing={playing} onToggle={onToggle} />
      </div>
      <p className="lesson-canonical">
        <span className="morse-notation" aria-hidden="true">{canonicalNotation(pattern)}</span>
        <span className="morse-rhythm">{spokenRhythm(pattern)}</span>
      </p>
    </div>
  )
}

/** Printed letter → Morse. Support changes the cue, never the response mechanism. */
export function VisualCheckStep({
  entry,
  format,
  regionRef,
  armed,
  onAnswer,
}: {
  entry: LessonEntry
  format: LessonCheckFormat
  regionRef: React.RefObject<HTMLDivElement | null>
  armed: boolean
  onAnswer: (response: string) => void
}) {
  const review = !entry.novel
  return (
    <div
      className="lesson-check"
      ref={regionRef}
      tabIndex={-1}
      data-question="visual"
      data-kind={review ? 'review' : 'new'}
    >
      <StepLabel review={review}>Key it</StepLabel>
      <p className="lesson-glyph" aria-hidden="true">{entry.glyph}</p>
      <h2 className="sr-only">
        {review ? 'Review. ' : ''}Key the Morse pattern for {entry.glyph}.
      </h2>

      {format === 'taught' && (
        <div className="lesson-support" data-support="taught">
          <MorsePhrase glyph={entry.glyph} />
        </div>
      )}

      {format === 'cued' && (
        <div className="lesson-support" data-support="cued">
          <p className="lesson-length">
            {entry.pattern.length} {entry.pattern.length === 1 ? 'signal' : 'signals'}
          </p>
        </div>
      )}

      {/* `inert` rather than `pointer-events: none`: the tap that finished the
          previous retrieval must not fall through to anything at all. */}
      <div className="lesson-answer" inert={!armed}>
        <MorseKeyInput expectedLength={entry.pattern.length} locked={!armed} onSubmit={onAnswer} />
      </div>
    </div>
  )
}

/** Morse sound → letter. The answer is never named by the prompt or audio control. */
export function ListeningCheckStep({
  entry,
  options,
  playing,
  regionRef,
  onToggle,
  onAnswer,
  onSkip,
  armed,
}: {
  entry: LessonEntry
  options: MorseLetter[]
  playing: boolean
  regionRef: React.RefObject<HTMLDivElement | null>
  onToggle: () => void
  onAnswer: (response: string) => void
  onSkip: () => void
  armed: boolean
}) {
  return (
    <div
      className="lesson-check"
      ref={regionRef}
      tabIndex={-1}
      data-question="listening"
      data-kind={entry.novel ? 'new' : 'review'}
    >
      <StepLabel review={!entry.novel}>Listen</StepLabel>
      <h2 className="sr-only">Listen to the Morse sound, then choose the matching letter.</h2>
      <div className="lesson-listening-stimulus">
        <MorsePlayButton glyph={entry.glyph} playing={playing} onToggle={onToggle} concealGlyph />
      </div>
      <div className="lesson-options" aria-label="Letter choices" inert={!armed}>
        {options.map((option) => (
          <button className="lesson-option lesson-letter-option" key={option} type="button" onClick={() => onAnswer(option)}>
            {option}
          </button>
        ))}
      </div>
      <button className="ghost lesson-audio-skip" type="button" onClick={onSkip}>Can&apos;t listen now</button>
    </div>
  )
}
