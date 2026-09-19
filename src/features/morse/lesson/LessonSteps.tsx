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
  return (
    <div className="lesson-check" ref={regionRef} tabIndex={-1} data-question="visual">
      <p className="lesson-task">Key this pattern</p>
      <p className="lesson-glyph" aria-hidden="true">{entry.glyph}</p>
      <h2 className="sr-only">Key the Morse pattern for {entry.glyph}.</h2>

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
    <div className="lesson-check" ref={regionRef} tabIndex={-1} data-question="listening">
      <p className="lesson-task">Listen, then choose the letter</p>
      <h2 className="sr-only">Listen to the Morse sound, then choose the matching letter.</h2>
      <div className="lesson-listening-stimulus">
        <MorsePlayButton glyph={entry.glyph} playing={playing} onToggle={onToggle} concealGlyph />
        <p className="lesson-length">Replay as needed.</p>
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
