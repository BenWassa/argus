import { statusLabel } from '../../shared/ui/StatusTag'
import { targetsForItems } from '../../domain/study/practiceTargets'
import type { BankedAttempt } from './bankedAttempt'

export function TestDone({
  banked,
  missed,
  onExit,
  onPractice,
  headingRef,
}: {
  banked: BankedAttempt[]
  /** Item ids answered wrong in this run, per topic. */
  missed: Record<string, string[]>
  onExit: () => void
  onPractice?: (topicId: string, itemIds: string[]) => void
  headingRef: React.RefObject<HTMLHeadingElement | null>
}) {
  const resolutions = banked.map((entry) => entry.resolution)
  const withheld = banked.filter((entry) => entry.withheldByAcquisition)
  // Correct end to end, and still not a qualifying run. Named separately because
  // it is the opposite of a failure and must not be reported as one.
  const building = banked.filter((entry) => entry.nonQualifying && !entry.withheldByAcquisition)
  const moved = banked
    .filter((entry) => !entry.withheldByAcquisition && !entry.nonQualifying)
    .map((entry) => entry.resolution)
  const completed = moved.filter((resolution) => resolution.completed)
  const decayed = moved.filter((resolution) => resolution.decayed)
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
  const practiceOffer = banked
    .map((entry) => {
      const topic = entry.resolution.topic
      const asked = targetsForItems(topic, missed[topic.id] ?? [])
      // Counted in items, not directions: an item missed both ways is one
      // thing to go and fix.
      const itemIds = [...new Set(asked.map((target) => target.item.id))]
      return { topicId: topic.id, title: topic.title, itemIds }
    })
    .find((candidate) => candidate.itemIds.length > 0)

  return (
    <section className="session session-done">
      <h1 ref={headingRef} tabIndex={-1}>
        {completed.length > 0 ? 'Banked' : 'Test ended'}
      </h1>

      {completed.map((resolution) => (
        <div className="banked" key={resolution.topic.id}>
          <span className="kicker">Completed</span>
          <p className="banked-title">{resolution.topic.title}</p>
          <p className="banked-note">
            Recalled cleanly {resolution.gapDays} days after it was last drilled. It is now part of
            your permanent record.
          </p>
        </div>
      ))}

      {decayed.map((resolution) => (
        <p className="transition" key={resolution.topic.id}>
          <strong>{resolution.topic.title}</strong> did not survive its spot check, so it goes back
          to drilling. Your completion from{' '}
          {resolution.topic.completedAt
            ? new Date(resolution.topic.completedAt).toLocaleDateString()
            : 'the original run'}{' '}
          still stands.
        </p>
      ))}

      {changed.map((resolution) => (
        <p className="transition" key={resolution.topic.id}>
          <strong>{resolution.topic.title}</strong>: {statusLabel(resolution.from).toLowerCase()} to{' '}
          {statusLabel(resolution.to).toLowerCase()}.
          {resolution.from === 'drilled' && resolution.to === 'learning' && (
            <> The delayed test starts again once it is drilled clean.</>
          )}
        </p>
      ))}

      {held.map((resolution) => (
        <p className="transition" key={resolution.topic.id}>
          <strong>{resolution.topic.title}</strong> held at {statusLabel(resolution.to).toLowerCase()}.
        </p>
      ))}

      {withheld.map((entry) => (
        <p className="transition" key={entry.resolution.topic.id}>
          <strong>{entry.resolution.topic.title}</strong>: the lesson has not been through every
          letter yet, so this run is recorded but does not move the ladder. Finish the lesson and
          the delayed test starts counting from there.
        </p>
      ))}

      {building.map((entry) => (
        <p className="transition" key={entry.resolution.topic.id}>
          <strong>{entry.resolution.topic.title}</strong>: every answer correct. The claim covers
          both printed directions, and this run has not yet seen both for every letter, so it is
          recorded as progress rather than banked. Nothing was lost and no clock went backwards.
          The next run asks the directions still outstanding.
        </p>
      ))}

      {resolutions.length === 0 && (
        <p className="transition">No topic ran to the end, so nothing changed rung.</p>
      )}

      {/* The offer to go and fix what just broke, and the only new action on
          this screen. It is deliberately not the accent: the end screen's one
          accent moment belongs to banking a completion, and a miss is not an
          event to mark. Practice records nothing, so taking it costs the
          learner nothing but the time. */}
      {practiceOffer && onPractice && (
        <div className="practice-offer">
          <p>
            {practiceOffer.itemIds.length}{' '}
            {practiceOffer.itemIds.length === 1 ? 'item' : 'items'} did not come back on{' '}
            <strong>{practiceOffer.title}</strong>. Practice asks only those, records nothing, and
            leaves the check to prove it.
          </p>
          <button
            type="button"
            onClick={() => onPractice(practiceOffer.topicId, practiceOffer.itemIds)}
          >
            Practise {practiceOffer.itemIds.length}{' '}
            {practiceOffer.itemIds.length === 1 ? 'item' : 'items'}
          </button>
        </div>
      )}

      <button
        className={practiceOffer && onPractice ? 'ghost' : undefined}
        type="button"
        onClick={onExit}
      >
        Back to today
      </button>
    </section>
  )
}
