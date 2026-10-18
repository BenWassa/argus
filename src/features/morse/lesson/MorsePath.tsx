import { Fragment, type ReactNode } from 'react'
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
  /** Letters the finished course still owes; empty hides the row. */
  owed?: string[]
  onGoOver?: () => void
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
 *
 * Each entry is one row and the row is the control. The path used to put a
 * full-size button at the end of every row, so a finished course was a column
 * of eighteen `Replay` and `Start` buttons that the eye could not get past. A
 * row now carries one word at text weight saying what a tap does, and a locked
 * row carries nothing at all: it is dimmed, and it is not a control.
 */
function pad(value: number): string {
  return String(value).padStart(2, '0')
}

interface RowProps {
  className: string
  mark: ReactNode
  title: ReactNode
  note?: ReactNode
  /** The word saying what a tap does. Absent on a locked row. */
  cue?: string
  /** Accessible name for the row control. */
  label: string
  /** Absent for a locked entry, which is stated rather than offered. */
  onPress?: () => void
  current?: boolean
}

function PathRow({ className, mark, title, note, cue, label, onPress, current }: RowProps) {
  const body = (
    <>
      <span className="morse-path-number tabular" aria-hidden="true">
        {mark}
      </span>
      <span className="morse-path-main">
        {title}
        {note && <span className="morse-path-note">{note}</span>}
      </span>
      {cue && (
        <span className="morse-path-cue" aria-hidden="true">
          {cue}
        </span>
      )}
    </>
  )

  return (
    <li className={`morse-path-item ${className}`} aria-current={current ? 'step' : undefined}>
      {onPress ? (
        <button className="morse-path-row" type="button" aria-label={label} onClick={onPress}>
          {body}
        </button>
      ) : (
        // A disabled button still invites a press. A dimmed row does not.
        <div className="morse-path-row" aria-label={label} role="group">
          {body}
        </div>
      )}
    </li>
  )
}

function LessonRow({
  lesson,
  onLesson,
}: {
  lesson: MorseLessonPathItem
  onLesson: MorsePathProps['onLesson']
}) {
  const letters = <strong className="morse-path-letters">{lesson.novel.join(' · ')}</strong>
  const className = `morse-path-lesson is-${lesson.state}`

  if (lesson.state === 'locked') {
    return (
      <PathRow
        className={className}
        mark={pad(lesson.number)}
        title={letters}
        label={`Lesson ${lesson.number}, locked`}
      />
    )
  }

  const current = lesson.state === 'current'
  return (
    <PathRow
      className={className}
      mark={pad(lesson.number)}
      title={letters}
      cue={current ? 'Continue' : 'Replay'}
      // Fifteen controls reading `Continue`, `Replay` and `Start` are
      // unambiguous by position and useless by name, so each one says which
      // entry it belongs to.
      label={current ? `Continue lesson ${lesson.number}` : `Replay lesson ${lesson.number}`}
      onPress={() => onLesson(lesson.index, !current)}
      current={current}
    />
  )
}

function CheckpointRow({
  checkpoint,
  first,
  onCheckpoint,
}: {
  checkpoint: MorseWordCheckpointPathItem
  /** The checkpoint's nature is said once, at the first one. */
  first: boolean
  onCheckpoint: MorsePathProps['onCheckpoint']
}) {
  const unlocked = checkpoint.unlocked
  return (
    <PathRow
      className={`morse-path-checkpoint ${unlocked ? 'is-unlocked' : 'is-locked'}`}
      mark="CP"
      title={<strong className="morse-path-checkpoint-title">Checkpoint</strong>}
      note={first ? 'Real words, letters you know' : undefined}
      cue={unlocked ? 'Start' : undefined}
      label={
        unlocked
          ? `Start word checkpoint after lesson ${checkpoint.afterLesson}`
          : `Word checkpoint after lesson ${checkpoint.afterLesson}, locked`
      }
      onPress={unlocked ? () => onCheckpoint(checkpoint) : undefined}
    />
  )
}

export function MorsePath({
  path,
  checkpoints,
  ready,
  onLesson,
  onCheckpoint,
  onCheck,
  owed = [],
  onGoOver,
}: MorsePathProps) {
  const checkpointAfter = new Map<number, MorseWordCheckpointPathItem>(
    checkpoints.map((checkpoint) => [checkpoint.afterLesson, checkpoint]),
  )
  const firstCheckpoint = checkpoints[0]?.afterLesson

  const withCheckpoint = (lesson: MorseLessonPathItem) => {
    const checkpoint = checkpointAfter.get(lesson.number)
    return (
      <Fragment key={lesson.index}>
        <LessonRow lesson={lesson} onLesson={onLesson} />
        {checkpoint && (
          <CheckpointRow
            checkpoint={checkpoint}
            first={checkpoint.afterLesson === firstCheckpoint}
            onCheckpoint={onCheckpoint}
          />
        )}
      </Fragment>
    )
  }

  return (
    <ol className="morse-path" aria-label="Morse curriculum">
      {path.map((lesson) => withCheckpoint(lesson))}

      {/* After the thirteen lessons: the letters the course still owes, named,
          so the learner can see exactly what one more sitting is for. */}
      {owed.length > 0 && onGoOver && (
        <PathRow
          className="morse-path-go-over"
          mark="↺"
          title={<strong className="morse-path-checkpoint-title">Go over {owed.join(' · ')}</strong>}
          note={ready ? 'Missed since. Keyed, no new letters' : 'Confirms the last letters before the Test'}
          cue="Start"
          label={`Go over ${owed.join(', ')}`}
          onPress={onGoOver}
          current={!ready}
        />
      )}

      {/* The check closes the curriculum, and is tappable from the first day.
          Its position describes the order of the work, never an unlock: an early
          attempt is allowed, and the run itself states what it does and does not
          move rather than a permanent second mode button saying so everywhere. */}
      <PathRow
        className={`morse-path-check${ready ? ' is-ready' : ''}`}
        mark="A–Z"
        title={<strong className="morse-path-checkpoint-title">Test</strong>}
        cue={ready ? 'Start' : 'Try early'}
        label={ready ? 'Start the A to Z test' : 'Try the A to Z test early'}
        onPress={onCheck}
        current={ready}
      />
    </ol>
  )
}
