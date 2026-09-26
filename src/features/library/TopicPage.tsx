import { useLayoutEffect, useRef, useState } from 'react'
import { KEEP_GOING, journeyFor } from '../../domain/study/journey'
import { resolveStudy } from '../../domain/study/scheduling'
import { useLibrary } from '../../services/library/LibraryProvider'
import { morseLessonPath } from '../../domain/morse/curriculum/lessonPath'
import { morseWordCheckpointPath } from '../../domain/morse/curriculum/checkpoints'
import { statusLabel } from '../../shared/ui/StatusTag'
import { TopicGauge } from './TopicGauge'
import { gaugeLabel, gaugeReading } from './gaugeReading'
import { LearnSupport } from '../learn/LearnSupport'
import { MorseBeatGrammarNote } from '../morse/MorsePhrase'
import { MorsePath } from '../morse/lesson/MorsePath'
import { MorsePlacementDialog } from '../morse/MorsePlacementDialog'
import { applyMorsePlacement, canOfferMorsePlacement } from '../../domain/morse/placement'
// The reference and the structured support keep the editorial treatment they
// were designed with; only where they are rendered changed.
import '../learn/Reading.css'
import type { RunTarget } from '../../app/routing/routes'
import { hasPractice, practiceItemCount } from '../../domain/study/practiceTargets'
import { REVIEW_LENGTH } from '../../domain/study/review'
import { COPY_LEVEL_INFO, nextCopyLevel } from '../../domain/morse/fluency/copy'
import type { Mode } from '../../domain/study/mode'
import type { Topic } from '../../domain/library/topic'
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
  const [placementOpen, setPlacementOpen] = useState(false)
  const runnable = topic.items.length > 0

  const path = runnable ? morseLessonPath(topic) : null
  const checkpoints = path ? morseWordCheckpointPath(topic) : null
  const course = Boolean(path && checkpoints)

  /**
   * The topic body is reference material. Rendering or revisiting it is read-only
   * browsing and must not create learner state. The journey therefore reads the
   * stored topic exactly as it stands.
   */
  const journey = journeyFor(topic)

  // Restore the page heading before the browser paints the traversed entry.
  // A passive effect can lose a race with Playwright/browser focus handling
  // after history.forward(), leaving the restored topic visible but unfocused.
  useLayoutEffect(() => {
    heading.current?.focus()
  }, [topic.id])

  const { acquisition } = journey
  // The detail line leads with the same count the gauge reads while a lesson
  // is under way, so the two merge into one caption. Anywhere else they say
  // different things and both stay.
  const gaugeText = gaugeLabel(gaugeReading(topic, journey))
  const showsGauge = Boolean(gaugeText && journey.detail?.startsWith(gaugeText))
  const testing = journey.action === 'test'
  const placementEligible = course && canOfferMorsePlacement(topic)

  // After the alphabet, and between scheduled checks, the useful thing to do is
  // keep learning — words, then sentences — not re-run a Test that cannot move
  // anything. The Test is still there, as a short review. When a check is due,
  // or the topic needs repair, the check leads again: only it can earn anything.
  const afterAlphabet = course && acquisition.ready
  const keepGoing = afterAlphabet && journey.primaryLabel === KEEP_GOING
  const copyNext = afterAlphabet ? nextCopyLevel(topic.morseFluency) : null

  function openFluency() {
    onStart('learn', [topic.id], { kind: 'fluency' })
  }

  // How many items a check has left outstanding, counted in items rather than
  // in directions: a bidirectional item missed both ways is one thing to go and
  // fix. Zero for any topic that keeps no per-item evidence, which is why an
  // ordinary topic's offer lives on its check's end screen instead.
  const practiceCount = hasPractice(topic) ? practiceItemCount(topic) : 0

  function startLearning() {
    updateTopic(topic.id, (current) => resolveStudy(current))
  }

  function startCheck() {
    onStart('test', [topic.id])
  }

  function startCurrentMorseLesson() {
    if (placementEligible) {
      setPlacementOpen(true)
      return
    }
    onStart('learn', [topic.id], { kind: 'lesson' })
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
          <span className="topic-state-meta tabular">
            {topic.items.length} {topic.items.length === 1 ? 'item' : 'items'}
          </span>
          <span className={`topic-state-label${journey.phase === 'repair' ? ' is-repair' : ''}`}>
            {journey.statusLabel}
          </span>
        </p>

        {/* The detail line and the gauge caption used to say the same count
            twice, one under the other. When there is a gauge, the detail is
            its caption; when there is not, it stands on its own. */}
        {journey.detail && !showsGauge && <p className="topic-detail">{journey.detail}</p>}

        {/* The page about one topic used to say nothing about where the
            learner was in it. Every measure it could have shown was already
            computed by `journeyFor` and thrown away here.

            One gauge, deliberately not the five-dimension status sheet this
            header replaced: that sheet went because it made the learner
            reconcile four numbers that disagreed. The gauge shows the single
            most specific reading the topic has earned, in its own units. */}
        <TopicGauge
          topic={topic}
          journey={journey}
          variant="page"
          caption={showsGauge ? journey.detail : null}
        />
      </header>

      {runnable ? (
        <div className="topic-act">
          {keepGoing ? (
            <button className="topic-primary" type="button" onClick={openFluency}>
              <span className="topic-primary-verb">{journey.primaryLabel}</span>
              <span className="topic-primary-note">
                {copyNext
                  ? `Next: ${COPY_LEVEL_INFO[copyNext].title.toLowerCase()}. Hear it, write it down.`
                  : 'Every copy level cleared. Tighten the spacing and go round again.'}
              </span>
            </button>
          ) : (
            <PrimaryAction
              journey={journey}
              course={course}
              onEnroll={startLearning}
              onLesson={startCurrentMorseLesson}
              onCheck={startCheck}
            />
          )}

          {/* The same conditions `isReviewTopic` checks, so this Test runs as
              the short review it names. */}
          {keepGoing && (
            <button className="quiet topic-alt" type="button" onClick={startCheck}>
              Quick review — {REVIEW_LENGTH} letters, no hints
            </button>
          )}

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

          {/* After the alphabet.

              Gated on acquisition rather than on completion, because the two
              answer different questions. Completion is a statement about
              scored evidence and a retention gap; acquisition readiness is the
              fact that every letter has been produced unaided at least once,
              which is exactly the point at which "you know the alphabet, now
              get faster" becomes true. A learner waiting out a spacing
              interval before their qualifying check should not be told there
              is nothing to do.

              It reads `acquisition.ready`, not `topic.acquisitionReadyAt`.
              The stored field postdates the programme, so a learner who
              finished the alphabet before it existed has every letter settled
              and no timestamp — and gating on the raw field hid Fluency from
              exactly the learner it was built for. `journeyFor` already
              resolves the derived and stored answers into one, and it is the
              same fallback `acquisitionStartedAt` makes for the same records.

              Text weight, never primary: the recommended action is still
              whatever the journey says, because only a check can earn
              anything and Fluency cannot earn anything at all. */}
          {afterAlphabet && !keepGoing && (
            <button className="quiet topic-alt" type="button" onClick={openFluency}>
              Copy and speed practice
            </button>
          )}

          {/* The path not recommended, at text weight. It never takes the shape
              of the primary control, and it states its own consequence.

              It launches a replay rather than `{ kind: 'lesson' }` (#117). A
              learner who has settled every letter has no unsettled packet left,
              so asking for "the lesson" handed them the end-of-curriculum
              screen — a control labelled `Go back over a lesson` that could not
              go back over one. Replay runs the canonical course from Lesson 1,
              through the same screens, and records nothing. */}
          {course && testing && (
            <button
              className="quiet topic-alt"
              type="button"
              onClick={() => onStart('learn', [topic.id], { kind: 'replay', index: 0 })}
            >
              Replay the course from lesson 1
            </button>
          )}
          {!course && (
            <p className="topic-consequence">
              {journey.action === 'enroll'
                ? 'Browse freely. Starting learning records enrollment, not a score or evidence.'
                : journey.advancementEligible
                  ? 'Scored, every item once. Two perfect tests complete the topic.'
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
            onLesson={(index, replay) => {
              if (!replay && placementEligible) {
                setPlacementOpen(true)
                return
              }
              onStart('learn', [topic.id], replay ? { kind: 'replay', index } : { kind: 'lesson' })
            }}
            onCheckpoint={(checkpoint) =>
              onStart('learn', [topic.id], {
                kind: 'checkpoint',
                afterLesson: checkpoint.afterLesson,
              })
            }
            onCheck={startCheck}
          />

          {/* The course's own explanatory support, which had nowhere to be.
              `LearnSupport` was rendered only in the ordinary-topic branch
              below, so for a curriculum topic the authored overview — what a
              dit and a dah are, how the spacing works, how the lesson chooses
              what to show next, and what the completion claim does and does not
              cover — was written, shipped and displayed nowhere at all.

              It is a fold rather than a band of prose: the curriculum is what
              this page is for, and this is the thing you come back to once,
              when something stops making sense. The mark grammar joins it here,
              because the lesson now explains that only at first meeting. */}
          {course && (
            <details className="fold topic-course-notes">
              <summary>How this course works</summary>
              <p className="topic-course-rule">
                Replays and word checkpoints run the same lessons and record nothing at all. Test
                is the only place the A–Z claim is proved.
              </p>
              {topic.learn && <LearnSupport content={topic.learn} />}
              <MorseBeatGrammarNote className="topic-course-grammar" />
            </details>
          )}
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
      {placementOpen && course && (
        <MorsePlacementDialog
          topic={topic}
          onClose={() => setPlacementOpen(false)}
          onNew={() => {
            // "New" is itself the learner's placement decision. Record the
            // ordinary curriculum start before entering LessonRun so its
            // boundary gate does not ask the same question a second time.
            updateTopic(topic.id, (current) => resolveStudy(current))
            setPlacementOpen(false)
            onStart('learn', [topic.id], { kind: 'lesson' })
          }}
          onCommit={(result) => {
            updateTopic(topic.id, (current) => applyMorsePlacement(current, result))
          }}
          onContinue={(result) => {
            setPlacementOpen(false)
            if (result.nextLesson !== null) {
              onStart('learn', [topic.id], { kind: 'lesson' })
            }
          }}
        />
      )}
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
  onEnroll,
  onLesson,
  onCheck,
}: {
  journey: ReturnType<typeof journeyFor>
  course: boolean
  onEnroll: () => void
  onLesson: () => void
  onCheck: () => void
}) {
  if (journey.action === 'enroll') {
    return (
      <button className="topic-primary" type="button" onClick={onEnroll}>
        <span className="topic-primary-verb">{journey.primaryLabel}</span>
        <span className="topic-primary-note">
          Make this an active topic. Browsing the reference alone changes nothing.
        </span>
      </button>
    )
  }

  if (journey.action === 'learn' && course) {
    const { sitting } = journey
    return (
      <button className="topic-primary" type="button" onClick={onLesson}>
        <span className="topic-primary-verb">{journey.primaryLabel}</span>
        {/* The verb already names the lesson and the state line above already
            gives the position, so repeating `lesson N of M` here put the same
            number on screen three times inside four lines. The note says the
            one thing neither of them does: what pressing it is like. */}
        <span className="topic-primary-note">
          {sitting?.active
            ? `Resume after ${sitting.retrievals} retrievals.`
            : 'Two new letters, then retrieval.'}
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
