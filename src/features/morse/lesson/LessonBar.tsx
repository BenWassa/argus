// Owns the persistent lesson position, mode and close control.

import type { LessonRun } from '../../../domain/morse/curriculum/lesson'

// Replay is named once, in the bar, where it stays visible for the whole run.
// It belongs there rather than on every screen: the learner needs to know
// which run they are in, not to be reminded at every step that it does not
// count.
/**
 * One word for what this is, one number for where you are, and the way out.
 *
 * It used to carry `Lesson 4 of 13` and `7 retrievals` stacked on top of each
 * other, which is two sentences and three numbers to say one thing. The
 * retrieval count in particular measured nothing the learner was working
 * towards — it went up whatever happened, and the lesson does not end on it.
 * What is left is the position in a finite course, which is the only number
 * on this screen worth reading, and it sits where a page number belongs.
 */
export function LessonBar({ run, replay, onExit }: { run: LessonRun; replay: boolean; onExit: () => void }) {
  return (
    <div className="session-bar">
      <p>
        <span className="session-topic">{run.finished || run.afterCourse ? 'Morse' : 'Lesson'}</span>
        {/* Its own element with real whitespace around it, so the line reads as
            two facts to a screen reader too rather than as `LessonReplay`. */}
        {replay && <> <span className="session-mode">Replay</span></>}
        {run.afterCourse && <> <span className="session-mode">Going over</span></>}
      </p>
      {!run.finished && !run.afterCourse && (
        <span className="session-count tabular" aria-label={`Lesson ${run.packetIndex + 1} of ${run.packetCount}`}>
          {run.packetIndex + 1}
          <span className="session-count-of" aria-hidden="true">/{run.packetCount}</span>
        </span>
      )}
      <button className="ghost small" type="button" onClick={onExit}>Close</button>
    </div>
  )
}
