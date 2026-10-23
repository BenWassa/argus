import { useEffect, useRef } from 'react'
import { isLearned } from '../../domain/study/scheduling'
import { targetsForItems } from '../../domain/study/practiceTargets'
import { morseLessonPath } from '../../domain/morse/curriculum/lessonPath'
import { fire } from '../../shared/haptics'
import { SessionFrame, RoundResult } from '../../shared/ui/SessionFrame'
import type { BankedAttempt } from './bankedAttempt'
import './TestDone.css'
import type { Topic } from '../../domain/library/topic'

/** A finished review: scored for the learner, never an attempt. */
export interface ReviewResult {
  topic: Topic
  correct: number
  total: number
}

/** The unit a count is in: letters for the Morse course, items otherwise. */
function unitFor(topic: Topic): string {
  return morseLessonPath(topic) ? 'letter' : 'item'
}

/** How many missed items the result names before it says "+N more". */
const MISSED_SHOWN = 8

interface MissedRow {
  key: string
  label: string
  detail?: string
}

/**
 * The items this run answered wrong, as prompt and answer. A pictured item's
 * picture is its prompt, so its row leads with the answer instead.
 */
function missedRows(topics: Topic[], missed: Record<string, string[]>): { rows: MissedRow[]; more: number } {
  const all: MissedRow[] = []
  for (const topic of topics) {
    for (const id of missed[topic.id] ?? []) {
      const item = topic.items.find((candidate) => candidate.id === id)
      if (!item) continue
      all.push(item.stimulus
        ? { key: `${topic.id}:${id}`, label: item.answer }
        : { key: `${topic.id}:${id}`, label: item.prompt, detail: item.answer })
    }
  }
  return { rows: all.slice(0, MISSED_SHOWN), more: Math.max(0, all.length - MISSED_SHOWN) }
}

export function TestDone({
  banked,
  reviewed = [],
  missed,
  onExit,
  onPractice,
  onPlayMorse,
  score,
  saveNote,
}: {
  banked: BankedAttempt[]
  reviewed?: ReviewResult[]
  /** Item ids answered wrong in this run, per topic. */
  missed: Record<string, string[]>
  onExit: () => void
  onPractice?: (topicId: string, itemIds: string[]) => void
  /** Hand a Morse learner straight into guided sending (#201): formative play, never evidence. */
  onPlayMorse?: (topicId: string) => void
  /** Every answer given in this run, across topics: the one reading on the result. */
  score: { correct: number; total: number }
  /** Shown while the result is still being written to this device. */
  saveNote?: string
}) {
  const withheld = banked.filter((entry) => entry.withheldByAcquisition)
  // Correct end to end, and still not a qualifying run. Named separately because
  // it is the opposite of a failure and must not be reported as one.
  const building = banked.filter((entry) => entry.nonQualifying && !entry.withheldByAcquisition)
  const moved = banked
    .filter((entry) => !entry.withheldByAcquisition && !entry.nonQualifying)
    .map((entry) => entry.resolution)
  const completed = moved.filter((resolution) => resolution.completed)

  const completionHapticSent = useRef(false)
  // `crest` is the pattern's own definition of what it is for: "stage advance,
  // personal best, session complete." A completion banking is exactly that
  // event and, until now, was the one occurrence in that list with no haptic
  // and no entrance behind it — the plate simply appeared fully formed, same
  // as every ordinary transition line below it. Depends only on the length so
  // it cannot re-fire on a re-render this screen never causes. A ref also
  // guards React StrictMode's effect replay on a committed completion screen.
  useEffect(() => {
    if (completed.length === 0 || completionHapticSent.current) return
    completionHapticSent.current = true
    fire('crest')
  }, [completed.length])
  const learned = moved.filter(resolution => !resolution.completed && isLearned(resolution.topic))
  const continuing = moved.filter(resolution => !resolution.completed && !isLearned(resolution.topic))

  /**
   * One offer, for the first topic in this run that missed something.
   *
   * A multi-topic Test that missed items in several topics could offer several
   * practice runs, but a screen that ends in a column of competing buttons is
   * the decision-on-the-daily-path problem this redesign spent batches 1 to 3
   * removing. The first one is the one to go and fix; the rest keep their own
   * offer on their topic pages.
   *
   * The count comes from `targetsForItems` rather than from the raw miss list,
   * so the number on the button is exactly what the run will ask. A badly
   * broken twenty-item check is bounded by `PRACTICE_LIMIT`, and an offer that
   * promised twenty and then asked ten would be the screen lying about the
   * work.
   */
  const practiceOffer = [
    ...banked.map((entry) => entry.resolution.topic),
    ...reviewed.map((entry) => entry.topic),
  ]
    .filter((topic) => !isLearned(topic))
    .map((topic) => {
      const asked = targetsForItems(topic, missed[topic.id] ?? [])
      // Counted in items, not directions: an item missed both ways is one
      // thing to go and fix.
      const itemIds = [...new Set(asked.map((target) => target.item.id))]
      return { topicId: topic.id, title: topic.title, itemIds, unit: unitFor(topic) }
    })
    .find((candidate) => candidate.itemIds.length > 0)

  /**
   * The next move for an alphabet learner (#201). A Test that banks the Morse
   * course is the moment Play opens up, so it leads with the first sending run
   * instead of "Done". Any other Morse result that ran for real
   * (learned already, or building toward completion) keeps Play discoverable
   * at text weight: playing round words records no completion.
   * A run withheld because the lesson is unfinished offers neither, since play
   * is not open yet.
   */
  const morseResult = banked.find(
    (entry) => !entry.withheldByAcquisition && morseLessonPath(entry.resolution.topic),
  )
  const morseCompleted = Boolean(
    morseResult && !morseResult.nonQualifying && morseResult.resolution.completed,
  )
  const offerPlay = Boolean(morseResult && onPlayMorse)
  // Unfinished learning can offer Practice as its next action.
  const playLeads = offerPlay && morseCompleted && !(practiceOffer && onPractice)

  // One short line per topic outcome, in the words the topic page shows for
  // the status it now holds. A topic that did not bank says so once, with how
  // many items are left to practise; the missed chips below name them. The
  // title leads only when several topics ran together.
  const several = banked.length + reviewed.length > 1
  const lead = (title: string) => (several ? `${title}: ` : '')
  const toPractise = (topic: Topic) => (missed[topic.id] ?? []).filter((id) => topic.items.some((item) => item.id === id)).length
  const unfinishedOutcome = (topic: Topic) => {
    const count = toPractise(topic)
    return count > 0 ? [`${lead(topic.title)}Still learning · ${count} to practise`] : []
  }
  const outcome: string[] = [
    ...reviewed.map((entry) => `${entry.topic.title}: review only, not counted.`),
    ...[...completed, ...learned].map((resolution) => `${lead(resolution.topic.title)}Learned`),
    ...continuing.flatMap((resolution) => unfinishedOutcome(resolution.topic)),
    ...withheld.map((entry) => `${entry.resolution.topic.title}: finish the lesson to count.`),
    ...building.map((entry) => `${entry.resolution.topic.title}: all correct, not counted yet.`),
  ]
  if (banked.length === 0 && reviewed.length === 0) outcome.push('No topic ran to the end.')

  // The one next step takes the primary slot: optional Practice while learning, else
  // sending after a banked course. Anything else stays at text weight.
  const practiceNext = practiceOffer && onPractice ? practiceOffer : null
  const playNext = !practiceNext && playLeads && morseResult && onPlayMorse ? morseResult : null
  const playQuiet = offerPlay && !playNext && morseResult && onPlayMorse ? morseResult : null
  const items = practiceNext
    ? `${practiceNext.itemIds.length} ${practiceNext.unit}${practiceNext.itemIds.length === 1 ? '' : 's'}`
    : ''
  const missedList = missedRows([
    ...banked.map((entry) => entry.resolution.topic),
    ...reviewed.map((entry) => entry.topic),
  ], missed)

  return (
    <SessionFrame kind="test" title={banked.length === 0 && reviewed.length > 0 ? 'Review' : 'Test'}
      progress={{ current: score.total, total: score.total }} onClose={onExit} className="test-done">
      {saveNote && (
        <div className="test-save-note">
          <p className="test-outcome" role="status">{saveNote}</p>
          <div className="save-bar" aria-hidden="true" />
        </div>
      )}
      <RoundResult
        correct={score.correct}
        total={score.total}
        onAgain={practiceNext ? () => onPractice?.(practiceNext.topicId, practiceNext.itemIds) : playNext ? () => onPlayMorse?.(playNext.resolution.topic.id) : undefined}
        againLabel={practiceNext ? `Practise ${items}` : playNext ? 'Send five words' : undefined}
        onDone={onExit}
        doneLabel="Done"
        extra={<>
          {outcome.map((line, index) => <p className="test-outcome" key={index}>{line}</p>)}
          {missedList.rows.length > 0 && <section className="test-missed" aria-label="Missed">
            <h2 className="test-missed-head">Missed</h2>
            <ul className="test-missed-list">
              {missedList.rows.map((row) => <li key={row.key} className="test-missed-chip">
                <span className="test-missed-prompt">{row.label}</span>
                {row.detail && <span className="test-missed-answer">{row.detail}</span>}
              </li>)}
              {missedList.more > 0 && <li className="test-missed-more">+{missedList.more} more</li>}
            </ul>
          </section>}
          {playQuiet && onPlayMorse && (
            <button className="ghost" type="button" onClick={() => onPlayMorse(playQuiet.resolution.topic.id)}>
              {morseCompleted ? 'Send five words' : 'Play with words'}
            </button>
          )}
        </>}
      />
    </SessionFrame>
  )
}
