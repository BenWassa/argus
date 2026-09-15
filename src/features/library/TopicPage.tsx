import { useEffect, useRef } from 'react'
import { journeyFor } from '../../lib/journey'
import { resolveStudy } from '../../lib/scheduling'
import { useLibrary } from '../../lib/store'
import { morseLessonPath } from '../../lib/morseLessonPath'
import { morseWordCheckpointPath } from '../../lib/morseWordCheckpoints'
import { statusLabel } from '../../components/ui/StatusTag'
import { LearnSupport } from '../learn/LearnSupport'
import { MorsePath } from '../learn/MorsePath'
// The reference and the structured support keep the editorial treatment they
// were designed with; only where they are rendered changed.
import '../learn/Reading.css'
import type { RunTarget } from '../../lib/navigation'
import { hasPractice, practiceItemCount } from '../../lib/practice'
import type { Mode, Topic } from '../../lib/types'
import './TopicPage.css'

interface TopicPageProps {
  topic: Topic
  onBack: () => void
  onStart: (mode: Mode, topicIds: string[], target?: RunTarget) => void
  onReference: (topicId: string) => void
  onEdit: () => void
  onDelete: () => void
}

function stamp(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * One topic, one page, and the page is the work.
 *
 * This surface used to be a status sheet: a definition list of five internal
 * progress dimensions, then two equally-shaped mode buttons, then the material
 * folded away behind `Show all 26 items`. The material then appeared a second
 * time on a separate full-screen Learn route that repeated the title, the scope
 * and every item, adding only a briefing and a `Test me` footer.
 *
 * Two things changed.
 *
 * **The body is the content.** For an ordinary topic the reference is the page,
 * set as editorial reading exactly as the Learn sheet set it, which is why the
 * separate reading route is gone rather than merely hidden. For a curriculum
 * topic the body is the path, so opening Morse lands on the curriculum instead
 * of on a facts table with the alphabet underneath it.
 *
 * **There is one action.** `journeyFor` already computed what to do next and
 * every other surface already displayed its verdict; showing two same-sized
 * buttons afterwards asked the learner to ratify a decision the product had
 * made. The recommended action is the only prominent control. The other path
 * stays reachable at text weight, because "available but not recommended" is a
 * real state and hiding it would be a different kind of lie.
 *
 * What did not change: acquisition, evidence, retention and sitting remain four
 * separate facts owned by four separate fields. They are simply no longer
 * printed as a table. Their consequences are stated where they bite.
 */
export function TopicPage({
  topic,
  onBack,
  onStart,
  onReference,
  onEdit,
  onDelete,
}: TopicPageProps) {
  const { updateTopic } = useLibrary()
  const heading = useRef<HTMLHeadingElement>(null)
  const runnable = topic.items.length > 0

  const path = runnable ? morseLessonPath(topic) : null
  const checkpoints = path ? morseWordCheckpointPath(topic) : null
  const course = Boolean(path && checkpoints)

  /**
   * Opening an ordinary topic is the exposure event, because the reference is
   * on this page and reading it is the whole of acquisition for that kind of
   * topic. The separate Learn route used to stamp this on mount and nothing
   * about the meaning changed when the route went away, only where it happens.
   *
   * A curriculum topic is exempt: its exposure is a lesson, and `MorseLesson`
   * owns that write. Reading the path is not learning the alphabet.
   *
   * The displayed journey is computed from the resolved topic rather than the
   * stored one so the page does not paint one frame of a verdict it is in the
   * act of invalidating.
   */
  const exposed = !course && runnable ? resolveStudy(topic) : topic
  const journey = journeyFor(exposed)

  useEffect(() => {
    if (course || !runnable) return
    updateTopic(topic.id, (current) => resolveStudy(current))
    // Exposure belongs to opening this topic, not to every render of it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.id, course, runnable])

  useEffect(() => {
    heading.current?.focus()
  }, [topic.id])

  const { acquisition } = journey
  const testing = journey.action === 'test'

  // How many items a check has left outstanding, counted in items rather than
  // in directions: a bidirectional item missed both ways is one thing to go and
  // fix. Zero for any topic that keeps no per-item evidence, which is why an
  // ordinary topic's offer lives on its check's end screen instead.
  const practiceCount = hasPractice(topic) ? practiceItemCount(topic) : 0

  function startCheck() {
    onStart('test', [topic.id])
  }

  return (
    <article className="topic">
      <button className="quiet topic-back" type="button" aria-label="Back to Library" onClick={onBack}>
        <span aria-hidden="true">←</span> Library
      </button>

      <header className="topic-head">
        <h1 ref={heading} tabIndex={-1} className="topic-title">
          {topic.title}
        </h1>

        {/* The boundary is the reason the topic is allowed to exist, so it reads
            as content rather than as a caption under the title. */}
        <p className="topic-scope">{topic.scope}</p>

        {/* One line of state, in the learner's words. Four dimensions still exist
            and still disagree usefully; this is the journey's one sentence about
            all of them. */}
        <p className="topic-state">
          <span className={`track track-${topic.track}`}>{topic.track}</span>
          <span className="topic-state-meta tabular">
            {topic.items.length} {topic.items.length === 1 ? 'item' : 'items'}
          </span>
          <span className={`topic-state-label${journey.phase === 'repair' ? ' is-repair' : ''}`}>
            {journey.statusLabel}
          </span>
        </p>

        {journey.detail && <p className="topic-detail">{journey.detail}</p>}
      </header>

      {runnable ? (
        <div className="topic-act">
          <PrimaryAction
            journey={journey}
            course={course}
            onLesson={() => onStart('learn', [topic.id], { kind: 'lesson' })}
            onCheck={startCheck}
          />

          {/* The standing offer to go back over what a check missed (#92 batch
              5). Text weight, never the primary control: the recommended move
              is still the check, because only the check can re-earn anything.
              It disappears on its own once a later check answers those items
              correctly, which is why nothing here has to remember being taken.

              It appears only for a topic that keeps per-item evidence. An
              ordinary reveal-and-grade topic records no per-item result, so
              after its check ends there is nothing left to select on; that
              topic's offer lives on the check's end screen instead. */}
          {practiceCount > 0 && (
            <button
              className="quiet topic-alt"
              type="button"
              onClick={() => onStart('learn', [topic.id], { kind: 'practice' })}
            >
              Practise the {practiceCount} {practiceCount === 1 ? 'item' : 'items'} you missed
            </button>
          )}

          {/* The path not recommended, at text weight. It never takes the shape
              of the primary control, and it states its own consequence. */}
          {course && testing && (
            <button
              className="quiet topic-alt"
              type="button"
              onClick={() => onStart('learn', [topic.id], { kind: 'lesson' })}
            >
              Go back over a lesson
            </button>
          )}
          {!course && (
            <p className="topic-consequence">
              {journey.advancementEligible
                ? 'Scored, every item once. The ladder moves only when the required gap is satisfied.'
                : 'Scored and recorded, but the ladder does not move until acquisition is finished.'}
            </p>
          )}
        </div>
      ) : (
        <div className="topic-unfinished">
          <p>
            This topic has no items yet, so there is nothing to read or test. Add them as
            <code> prompt | answer</code>, one per line.
          </p>
          <button type="button" onClick={onEdit}>
            Add items
          </button>
        </div>
      )}

      {course && path && checkpoints ? (
        <section className="topic-body" aria-labelledby="topic-course-head">
          <div className="topic-body-head">
            <h2 id="topic-course-head">Curriculum</h2>
            <button className="quiet" type="button" onClick={() => onReference(topic.id)}>
              Morse alphabet
            </button>
          </div>

          <MorsePath
            path={path}
            checkpoints={checkpoints}
            ready={acquisition.ready}
            onLesson={(index, replay) =>
              onStart('learn', [topic.id], replay ? { kind: 'replay', index } : { kind: 'lesson' })
            }
            onCheckpoint={(checkpoint) =>
              onStart('learn', [topic.id], {
                kind: 'checkpoint',
                afterLesson: checkpoint.afterLesson,
              })
            }
            onCheck={startCheck}
          />

          <p className="topic-body-foot">
            Lessons, replays and word checkpoints are practice and record no score. Test is the
            only place the A–Z claim is proved.
          </p>
        </section>
      ) : runnable ? (
        /* The reference, as reading rather than as a fold. A card shape promises
           a concealed answer; this conceals nothing, so it is set as a list. */
        <section className="topic-body" aria-labelledby="topic-reference-head">
          {topic.learn && <LearnSupport content={topic.learn} />}

          <h2 id="topic-reference-head" className="topic-reference-head">
            {topic.learn ? 'Recall reference' : 'The complete set'}
          </h2>

          <ol className="sheet-items">
            {topic.items.map((item, i) => (
              <li key={item.id ?? `${item.prompt}-${i}`}>
                <span className="sheet-num tabular">{String(i + 1).padStart(2, '0')}</span>
                <span className="sheet-prompt">{item.prompt}</span>
                <span className="sheet-answer">{item.answer}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {topic.history.length > 0 && (
        <details className="fold">
          <summary>
            History, {topic.history.length}{' '}
            {topic.history.length === 1 ? 'attempt' : 'attempts'}
          </summary>
          <ol className="fold-history">
            {[...topic.history].reverse().map((attempt) => (
              <li key={attempt.at}>
                <span className="tabular">{stamp(attempt.at)}</span>
                <span className="tabular">
                  {attempt.correct}/{attempt.total}
                </span>
                <span className="fold-resolved">{statusLabel(attempt.resolvedTo)}</span>
              </li>
            ))}
          </ol>
        </details>
      )}

      {topic.completedAt && (
        <p className="topic-earned">
          First completed {stamp(topic.completedAt)}. That stays true whatever happens next.
        </p>
      )}

      {/* Editing and deleting are administration, not learning. They sit below
          the content at text weight so they never compete with the action. */}
      <div className="topic-admin">
        <button className="quiet" type="button" onClick={onEdit}>
          Edit topic
        </button>
        <button className="quiet is-danger" type="button" onClick={onDelete}>
          Delete topic
        </button>
      </div>
    </article>
  )
}

/**
 * The one prominent control, and it is the journey's answer rather than this
 * page's opinion of it. Its label carries the consequence, because a scored run
 * is the most consequential thing in the product and a verb alone cannot say so.
 */
function PrimaryAction({
  journey,
  course,
  onLesson,
  onCheck,
}: {
  journey: ReturnType<typeof journeyFor>
  course: boolean
  onLesson: () => void
  onCheck: () => void
}) {
  if (journey.action === 'learn' && course) {
    const { acquisition, sitting } = journey
    return (
      <button className="topic-primary" type="button" onClick={onLesson}>
        <span className="topic-primary-verb">{journey.primaryLabel}</span>
        <span className="topic-primary-note">
          {sitting?.active
            ? `Pick up at ${sitting.retrievals} of ${sitting.target} retrievals.`
            : `Two new letters, then retrieval. Lesson ${acquisition.packet} of ${acquisition.packetCount}.`}
        </span>
      </button>
    )
  }

  // One name for the scored run, everywhere. The curriculum's last entry is a
  // Test, not a differently-named cousin of one: two words for one consequence
  // is exactly the ambiguity this pass exists to remove.
  return (
    <button className="topic-primary" type="button" onClick={onCheck}>
      <span className="topic-primary-verb">{journey.primaryLabel}</span>
      <span className="topic-primary-note">
        {course
          ? 'Every letter, both printed directions, no support.'
          : 'Every item, once, scored by you.'}
      </span>
    </button>
  )
}
