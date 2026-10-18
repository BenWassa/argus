import { useEffect } from 'react'
import { statusLabel } from '../../shared/ui/StatusTag'
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

export function TestDone({
  banked,
  reviewed = [],
  missed,
  onExit,
  onPractice,
  onPlayMorse,
  score,
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
}) {
  const withheld = banked.filter((entry) => entry.withheldByAcquisition)
  // Correct end to end, and still not a qualifying run. Named separately because
  // it is the opposite of a failure and must not be reported as one.
  const building = banked.filter((entry) => entry.nonQualifying && !entry.withheldByAcquisition)
  const moved = banked
    .filter((entry) => !entry.withheldByAcquisition && !entry.nonQualifying)
    .map((entry) => entry.resolution)
  const completed = moved.filter((resolution) => resolution.completed)
  const decayed = moved.filter((resolution) => resolution.decayed)

  // `crest` is the pattern's own definition of what it is for: "stage advance,
  // personal best, session complete." A completion banking is exactly that
  // event and, until now, was the one occurrence in that list with no haptic
  // and no entrance behind it — the plate simply appeared fully formed, same
  // as every ordinary transition line below it. Depends only on the length so
  // it cannot re-fire on a re-render this screen never causes.
  useEffect(() => {
    if (completed.length > 0) fire('crest')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed.length])
  const changed = moved.filter(
    (resolution) => !resolution.completed && !resolution.decayed && resolution.to !== resolution.from,
  )
  const held = moved.filter(
    (resolution) => !resolution.completed && !resolution.decayed && resolution.to === resolution.from,
  )

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
    .map((topic) => {
      const asked = targetsForItems(topic, missed[topic.id] ?? [])
      // Counted in items, not directions: an item missed both ways is one
      // thing to go and fix.
      const itemIds = [...new Set(asked.map((target) => target.item.id))]
      return { topicId: topic.id, title: topic.title, itemIds }
    })
    .find((candidate) => candidate.itemIds.length > 0)

  /**
   * The next move for an alphabet learner (#201). A Test that banks the Morse
   * course is the moment Play opens up, so it leads with the first sending run
   * instead of "Back to today". Any other Morse result that ran for real
   * (held, repaired, building toward a qualifying run) keeps Play discoverable
   * at text weight: playing round words certifies and repairs nothing.
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
  // One primary per screen: a missed-item practice offer, being the repair, keeps it.
  const playLeads = offerPlay && morseCompleted && !(practiceOffer && onPractice)

  // One short line per topic outcome, never a paragraph.
  const outcome: string[] = [
    ...reviewed.map((entry) => `${entry.topic.title}: review, ladder unchanged.`),
    ...completed.map((resolution) => `${resolution.topic.title} banked.`),
    ...decayed.map((resolution) => `${resolution.topic.title} goes back to drilling.`),
    ...changed.map(
      (resolution) =>
        `${resolution.topic.title}: ${statusLabel(resolution.from).toLowerCase()} to ${statusLabel(resolution.to).toLowerCase()}.`,
    ),
    ...held.map((resolution) => `${resolution.topic.title} held at ${statusLabel(resolution.to).toLowerCase()}.`),
    ...withheld.map((entry) => `${entry.resolution.topic.title}: finish the lesson to count.`),
    ...building.map((entry) => `${entry.resolution.topic.title}: clean run, not yet banked.`),
  ]
  if (outcome.length === 0) outcome.push('No topic ran to the end.')

  // The one next step takes the primary slot: repairing what was missed, else
  // sending after a banked course. Anything else stays at text weight.
  const practiceNext = practiceOffer && onPractice ? practiceOffer : null
  const playNext = !practiceNext && playLeads && morseResult && onPlayMorse ? morseResult : null
  const playQuiet = offerPlay && !playNext && morseResult && onPlayMorse ? morseResult : null
  const items = practiceNext ? `${practiceNext.itemIds.length} ${practiceNext.itemIds.length === 1 ? 'item' : 'items'}` : ''

  return (
    <SessionFrame kind="test" title={banked.length === 0 && reviewed.length > 0 ? 'Review' : 'Test'}
      progress={{ current: score.total, total: score.total }} onClose={onExit} className="test-done">
      <RoundResult
        correct={score.correct}
        total={score.total}
        onAgain={practiceNext ? () => onPractice?.(practiceNext.topicId, practiceNext.itemIds) : playNext ? () => onPlayMorse?.(playNext.resolution.topic.id) : undefined}
        againLabel={practiceNext ? `Practise ${items}` : playNext ? 'Send five words' : undefined}
        onDone={onExit}
        doneLabel="Back to today"
        extra={<>
          {outcome.map((line, index) => <p className="test-outcome" key={index}>{line}</p>)}
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
