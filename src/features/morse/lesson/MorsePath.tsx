import { Fragment } from 'react'
import type { MorseLessonPathItem } from '../../../domain/morse/curriculum/lessonPath'
import type { MorseWordCheckpointPathItem } from '../../../domain/morse/curriculum/checkpoints'
import './MorsePath.css'

interface MorsePathProps {
  path: MorseLessonPathItem[]
  checkpoints: MorseWordCheckpointPathItem[]
  /** True once every letter has been produced unaided at least once in Learn. */
  ready: boolean
  onLesson: (index: number, replay: boolean) => void
  onCheckpoint: (checkpoint: MorseWordCheckpointPathItem) => void
  onCheck: () => void
}

/**
 * Only the states the action word does not already carry.
 *
 * `Replay` and `Start` say an entry is open, and a locked entry says `Locked`
 * where its control would be, so labelling those again put nine rows of `OPEN`
 * down the page saying nothing. `Done` and `Current` are the two facts the
 * button cannot express.
 */
function stateLabel(state: MorseLessonPathItem['state']): string | null {
  if (state === 'completed') return 'Done'
  if (state === 'current') return 'Current'
  return null
}

/**
 * The curriculum, as a place rather than a screen.
 *
 * This used to live inside the Learn run, which meant the only way to see the
 * shape of the thing you were finishing was to press a button called `Learn`
 * from somewhere else. It is now the body of the Morse topic page: opening Morse
 * lands here, and the lesson, the checkpoints and the check are tasks launched
 * from it.
 *
 * It owns no progress. Lesson state projects `morseLessonPath(topic)` and
 * checkpoint eligibility projects `morseWordCheckpointPath(topic)`, both derived
 * from the same durable acquisition support normal Learn writes. There is no
 * second unlock database, no milestone record and no completion flag here.
 *
 * Locked entries stay visible on purpose. A finite curriculum you can see the
 * end of is the entire premise of the product, so the path shows all thirteen
 * lessons from the first sitting rather than revealing them as a reward.
 */
/**
 * How many finished lessons may sit above the current one before the rest are
 * folded away. One is enough to show the path has a history and a direction;
 * the topic header above this list is already tall, and every extra row costs
 * about 70px of the only screen that matters.
 */
const VISIBLE_COMPLETED_BEFORE_CURRENT = 1

/** Folding one row into one row saves nothing, so it takes two to be worth it. */
const MINIMUM_WORTH_FOLDING = 2

export function MorsePath({
  path,
  checkpoints,
  ready,
  onLesson,
  onCheckpoint,
  onCheck,
}: MorsePathProps) {
  const checkpointAfter = new Map<number, MorseWordCheckpointPathItem>(
    checkpoints.map((checkpoint) => [checkpoint.afterLesson, checkpoint]),
  )

  /**
   * The finished run above the current lesson, folded.
   *
   * Thirteen lessons, four checkpoints and a Test is eighteen rows. With five
   * lessons done, the row the learner came to press sat around 945px down an
   * 844px screen — opening Morse landed them above four `Replay` buttons and
   * asked them to scroll to find out where they were. The finished stretch is
   * collapsed so the current lesson is the first lesson on the page.
   *
   * Only the *completed* run collapses, and only while there is somewhere to
   * be. Everything ahead stays visible, locked rows included: seeing the end of
   * a finite curriculum is the premise of the product, and a learner who has
   * finished the whole thing wants the full index rather than one summary row.
   */
  const currentIndex = path.findIndex((lesson) => lesson.state === 'current')
  const candidate = currentIndex - VISIBLE_COMPLETED_BEFORE_CURRENT
  const foldedCount =
    candidate >= MINIMUM_WORTH_FOLDING &&
    path.slice(0, currentIndex).every((lesson) => lesson.state === 'completed')
      ? candidate
      : 0
  const folded = path.slice(0, foldedCount)
  const shown = path.slice(foldedCount)

  return (
    <ol className="morse-path" aria-label="Morse curriculum">
      {folded.length > 0 && (
        <li className="morse-path-item morse-path-folded">
          <span className="morse-path-number morse-path-mark" aria-hidden="true">
            {String(folded.length).padStart(2, '0')}
          </span>
          <details className="morse-path-fold">
            <summary>
              Lessons 1–{folded.length} done
              <span className="morse-path-fold-letters">
                {folded.flatMap((lesson) => lesson.novel).join(' · ')}
              </span>
            </summary>
            <ol className="morse-path morse-path-nested">
              {folded.map((lesson) => {
                // A checkpoint whose milestone falls inside the folded run
                // travels with it, rather than disappearing from the page.
                const checkpoint = checkpointAfter.get(lesson.number)
                return (
                  <Fragment key={lesson.index}>
                    <li className={`morse-path-item morse-path-lesson is-${lesson.state}`}>
                      <span className="morse-path-number tabular" aria-hidden="true">
                        {String(lesson.number).padStart(2, '0')}
                      </span>
                      <span className="morse-path-main">
                        <strong className="morse-path-letters">{lesson.novel.join(' · ')}</strong>
                      </span>
                      <button
                        className="ghost small morse-path-action"
                        type="button"
                        aria-label={`Replay lesson ${lesson.number}`}
                        onClick={() => onLesson(lesson.index, true)}
                      >
                        Replay
                      </button>
                    </li>
                    {checkpoint?.unlocked && (
                      <li className="morse-path-item morse-path-checkpoint is-unlocked">
                        <span className="morse-path-number morse-path-mark" aria-hidden="true">
                          CP
                        </span>
                        <span className="morse-path-main">
                          <strong className="morse-path-checkpoint-title">Word checkpoint</strong>
                        </span>
                        <button
                          className="ghost small morse-path-action"
                          type="button"
                          aria-label={`Start word checkpoint after lesson ${checkpoint.afterLesson}`}
                          onClick={() => onCheckpoint(checkpoint)}
                        >
                          Start
                        </button>
                      </li>
                    )}
                  </Fragment>
                )
              })}
            </ol>
          </details>
        </li>
      )}

      {shown.map((lesson) => {
        const checkpoint = checkpointAfter.get(lesson.number)
        const status = stateLabel(lesson.state)
        const locked = lesson.state === 'locked'

        return (
          <Fragment key={lesson.index}>
            <li
              className={`morse-path-item morse-path-lesson is-${lesson.state}`}
              aria-current={lesson.state === 'current' ? 'step' : undefined}
            >
              <span className="morse-path-number tabular" aria-hidden="true">
                {String(lesson.number).padStart(2, '0')}
              </span>
              <span className="morse-path-main">
                <strong className="morse-path-letters">{lesson.novel.join(' · ')}</strong>
              </span>
              {status && <span className="morse-path-status">{status}</span>}

              {locked ? (
                <span className="morse-path-action is-locked" aria-hidden="true">
                  Locked
                </span>
              ) : (
                <button
                  className={`small morse-path-action${lesson.state === 'current' ? '' : ' ghost'}`}
                  type="button"
                  // Fifteen controls reading `Continue`, `Replay` and `Start`
                  // are unambiguous by position and useless by name, so each
                  // one says which entry it belongs to.
                  aria-label={
                    lesson.state === 'current'
                      ? `Continue lesson ${lesson.number}`
                      : `Replay lesson ${lesson.number}`
                  }
                  onClick={() => onLesson(lesson.index, lesson.state !== 'current')}
                >
                  {lesson.state === 'current' ? 'Continue' : 'Replay'}
                </button>
              )}
            </li>

            {checkpoint && (
              <li
                className={`morse-path-item morse-path-checkpoint${
                  checkpoint.unlocked ? ' is-unlocked' : ' is-locked'
                }`}
              >
                <span className="morse-path-number morse-path-mark" aria-hidden="true">
                  CP
                </span>
                <span className="morse-path-main">
                  <strong className="morse-path-checkpoint-title">Word checkpoint</strong>
                  {/* Said once, at the first one. Four rows carrying the same
                      sentence verbatim explained it no better than one did and
                      cost three lines of a phone screen. */}
                  {checkpoint.afterLesson === checkpoints[0]?.afterLesson && (
                    <span className="morse-path-note">Real words, letters you already know</span>
                  )}
                </span>
                {checkpoint.unlocked ? (
                  <button
                    className="ghost small morse-path-action"
                    type="button"
                    aria-label={`Start word checkpoint after lesson ${checkpoint.afterLesson}`}
                    onClick={() => onCheckpoint(checkpoint)}
                  >
                    Start
                  </button>
                ) : (
                  <span className="morse-path-action is-locked" aria-hidden="true">
                    Locked
                  </span>
                )}
              </li>
            )}
          </Fragment>
        )
      })}

      {/* The check closes the curriculum, and is tappable from the first day.
          Its position describes the order of the work, never an unlock: an early
          attempt is allowed, and the run itself states what it does and does not
          move rather than a permanent second mode button saying so everywhere. */}
      <li
        className={`morse-path-item morse-path-check${ready ? ' is-ready' : ''}`}
        aria-current={ready ? 'step' : undefined}
      >
        <span className="morse-path-number morse-path-mark" aria-hidden="true">
          A–Z
        </span>
        <span className="morse-path-main">
          <strong className="morse-path-checkpoint-title">Test</strong>
          <span className="morse-path-note">
            {ready
              ? 'Every letter, both directions, no support. This is where the claim is proved.'
              : 'Open now, but the lesson has not reached every letter, so an early run is recorded without moving the ladder.'}
          </span>
        </span>
        <button
          className={`small morse-path-action${ready ? '' : ' ghost'}`}
          type="button"
          aria-label={ready ? 'Start the A to Z test' : 'Try the A to Z test early'}
          onClick={onCheck}
        >
          {ready ? 'Start' : 'Try early'}
        </button>
      </li>
    </ol>
  )
}
