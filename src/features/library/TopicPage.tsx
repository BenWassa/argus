import { useLayoutEffect, useRef, useState } from 'react'
import { KEEP_GOING, journeyFor } from '../../domain/study/journey'
import { resolveStudy } from '../../domain/study/scheduling'
import { useLibrary } from '../../services/library/LibraryProvider'
import { morseLessonPath } from '../../domain/morse/curriculum/lessonPath'
import { morseWordCheckpointPath } from '../../domain/morse/curriculum/checkpoints'
import { statusLabel } from '../../shared/ui/StatusTag'
import { topicIcon } from './topicIcon'
import { sequenceFor } from '../../domain/library/catalog'
import { LearnSupport } from '../learn/LearnSupport'
import { SourcesAndLimits } from '../learn/SourcesAndLimits'
import { VisualView } from '../visual/VisualView'
import { listeningCoverage } from '../../domain/audio/evidence'
import { AudioReference } from '../audio/AudioReference'
import { MorseBeatGrammarNote } from '../morse/MorsePhrase'
import { MorsePath } from '../morse/lesson/MorsePath'
import { MorsePlacementDialog } from '../morse/MorsePlacementDialog'
import { applyMorsePlacement, canOfferMorsePlacement } from '../../domain/morse/placement'
// The reference and the structured support keep the editorial treatment they
// were designed with; only where they are rendered changed.
import '../learn/Reading.css'
import type { RunTarget } from '../../app/routing/routes'
import { hasPractice, practiceItemCount } from '../../domain/study/practiceTargets'
import { REVIEW_LENGTH, isReviewTopic } from '../../domain/study/review'
import { morseFocusLetters } from '../../domain/morse/fluency/focus'
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

/** Content first, explanatory support folded, one persistent action. */
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
  const sequence = sequenceFor(topic)
  const journey = journeyFor(topic)
  const listening = listeningCoverage(topic.items, topic.audioEvidence)

  // Restore the page heading before the browser paints the traversed entry.
  // A passive effect can lose a race with Playwright/browser focus handling
  // after history.forward(), leaving the restored topic visible but unfocused.
  useLayoutEffect(() => {
    heading.current?.focus()
  }, [topic.id])

  const { acquisition } = journey
  const testing = journey.action === 'test'
  const placementEligible = course && canOfferMorsePlacement(topic)

  // Once the course is banked, the useful thing to do is keep learning — words,
  // then sentences. The full check and a short review sit beside it, and the
  // learner chooses: nothing waits on a clock. While the ladder is still moving,
  // or the topic needs repair, the check leads: only it can earn anything.
  const afterAlphabet = course && acquisition.ready
  const keepGoing = afterAlphabet && journey.primaryLabel === KEEP_GOING
  const reviewable = isReviewTopic(topic)

  function openFluency() {
    onStart('learn', [topic.id], { kind: 'fluency' })
  }

  // How many items a check has left outstanding, counted in items rather than
  // in directions: a bidirectional item missed both ways is one thing to go and
  // fix. Zero for any topic that keeps no per-item evidence, which is why an
  // ordinary topic's offer lives on its check's end screen instead.
  const practiceCount = hasPractice(topic) ? practiceItemCount(topic) : 0

  function startCheck() {
    onStart('test', [topic.id])
  }

  function startReview() {
    onStart('test', [topic.id], { kind: 'review' })
  }

  function startCurrentMorseLesson() {
    if (placementEligible) {
      setPlacementOpen(true)
      return
    }
    // After the thirteen lessons, "the lesson" is going over what the course
    // still owes; lesson 13 again could not confirm it.
    if (acquisition.afterCourse && acquisition.owed.length > 0 && !acquisition.ready) {
      startGoingOver()
      return
    }
    onStart('learn', [topic.id], { kind: 'lesson' })
  }

  function startGoingOver() {
    onStart('learn', [topic.id], { kind: 'after-course' })
  }

  return (
    <article className={`topic topic-track-${topic.track}`}>
      <button className="quiet topic-back" type="button" aria-label="Back to Library" onClick={onBack}>
        <span aria-hidden="true">←</span> Library
      </button>

      <TopicHero topic={topic} />
      <header className="topic-head">
        <h1 ref={heading} tabIndex={-1} className="topic-title">
          {topic.title}
        </h1>

        {/* The boundary is the reason the topic is allowed to exist, so it reads
            as content rather than as a caption under the title. */}
        <p className="topic-scope">{sequence && topic.track !== 'survival' ? `${topic.items.length} rules, in order.` : topic.scope}</p>

        {/* One line of state, in the learner's words. Four dimensions still exist
            and still disagree usefully; this is the journey's one sentence about
            all of them. */}
        <p className="topic-state">
          <span className="topic-state-meta tabular">
            {topic.items.length} {topic.items.length === 1 ? 'item' : 'items'}
          </span>
          <span className={`topic-state-label${journey.phase === 'repair' ? ' is-repair' : topic.status === 'completed' || topic.status === 'drilled' ? ' is-banked' : ''}`}>
            {journey.statusLabel}
          </span>
        </p>

        {/* Listening is its own claim (#151): read only from the separate audio
            record, so text or choice evidence can never complete it. */}
        {listening.total > 0 && (
          <p className="topic-detail topic-listening">
            Listening: {listening.unaided} of {listening.total} answered by ear, unaided
          </p>
        )}

      </header>

      {!runnable && (
        <div className="topic-unfinished">
          <p>This topic has no items yet. Add them as <code>prompt | answer</code>, one per line.</p>
          <button type="button" onClick={onEdit}>Add items</button>
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
            owed={acquisition.owed}
            onGoOver={startGoingOver}
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
              {sequence && <details className="fold"><summary>Scope and limits</summary><p className="topic-course-rule">{topic.scope}</p></details>}
          {topic.learn && <LearnSupport content={topic.learn} />}
              <MorseBeatGrammarNote className="topic-course-grammar" />
            </details>
          )}
        </section>
      ) : runnable ? (
        <section className="topic-body" aria-labelledby="topic-reference-head">
          <RecallReference topic={topic} heading="What to remember" />
          {sequence && <details className="fold"><summary>Scope and limits</summary><p className="topic-course-rule">{topic.scope}</p></details>}
          {topic.learn && <LearnSupport content={topic.learn} />}
        </section>
      ) : null}

      {runnable && (course || practiceCount > 0) && (
        <details className="fold topic-options">
          <summary aria-label="More learning options">⋯ More options</summary>
          <div className="topic-alternates">
          {/* A banked course is checked when the learner chooses. The full
              check is scored and can send the topic to repair; the review asks
              the weakest letters and moves nothing. */}
          {keepGoing && (
            <button className="quiet topic-alt" type="button" onClick={startCheck}>
              Full test: all {topic.items.length} letters, scored
            </button>
          )}
          {reviewable && (
            <button className="quiet topic-alt" type="button" onClick={startReview}>
              Quick review: {REVIEW_LENGTH} letters, no hints
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
              onClick={() =>
                course
                  ? // Keyed and by ear, over just the letters missed.
                    onStart('learn', [topic.id], {
                      kind: 'fluency',
                      mode: 'sprint',
                      letters: morseFocusLetters(topic),
                    })
                  : onStart('learn', [topic.id], { kind: 'practice' })
              }
            >
              {course
                ? `Practise the letters you missed: ${morseFocusLetters(topic).join(' ')}`
                : `Practise the ${practiceCount} ${practiceCount === 1 ? 'item' : 'items'} you missed`}
            </button>
          )}

          {/* Acquisition readiness makes fluency useful, independently of scoring. */}
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
              screen: a control labelled `Go back over a lesson` that could not
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
          </div>
        </details>
      )}

      {runnable && (
        <div className={`topic-action-bar${journey.phase === 'repair' ? ' is-repair' : topic.status === 'completed' || topic.status === 'drilled' ? ' is-banked' : ''}`}>
          <button className="topic-primary" type="button" onClick={keepGoing ? openFluency : course && journey.action === 'learn' ? startCurrentMorseLesson : startCheck}>
            {course ? journey.primaryLabel : journey.phase === 'repair' ? 'Repair' : topic.status === 'completed' || topic.status === 'drilled' ? 'Test again' : 'Test'}
          </button>
        </div>
      )}

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
      {topic.learn && <SourcesAndLimits content={topic.learn} />}
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

function TopicHero({ topic }: { topic: Topic }) {
  const icon = topicIcon(topic.id)
  return (
    <div className="topic-hero">
      {topic.hero ? <VisualView key={topic.id} visual={topic.hero} /> : (
        <div className="topic-hero-fallback" aria-hidden="true">
          {icon ? <img src={icon} alt="" /> : <span>{topic.title.slice(0, 1)}</span>}
        </div>
      )}
    </div>
  )
}

/** The complete scored set, as reading. */
function RecallReference({ topic, heading }: { topic: Topic; heading: string }) {
  const groups = sequenceFor(topic)?.groups
  const sets = groups ? groups.map(group => ({
    label: group.label,
    entries: group.itemIds.map((id, i) => ({ item: topic.items.find(item => item.id === id)!, marker: Array.from(group.letters)[i] })),
  })) : [{ label: undefined, entries: topic.items.map((item, i) => ({ item, marker: String(i + 1).padStart(2, '0') })) }]
  return (
    <div className="topic-reference">
      <h2 id="topic-reference-head" className="topic-reference-head">{heading}</h2>
      {sets.map((set, groupIndex) => <div className="topic-recall-group" key={set.label ?? groupIndex}>
      {set.label && <h3 className="topic-recall-group-label">{set.label}</h3>}
      <ol className="topic-recall-cards">
        {set.entries.map(({ item, marker }, i) => (
          <li key={item.id ?? `${item.prompt}-${i}`} className={item.stimulus || item.audio ? 'has-visual' : undefined}>
            <span className="topic-recall-marker tabular">{marker}</span>
            {item.stimulus && (
              <div className="sheet-visual">
                <VisualView visual={item.stimulus} compact />
              </div>
            )}
            {item.audio && (
              <div className="sheet-visual">
                <AudioReference item={item as typeof item & { audio: NonNullable<typeof item.audio> }} />
              </div>
            )}
            <span className="topic-recall-prompt">{item.prompt}</span>
            <span className="topic-recall-answer">{item.answer}</span>
          </li>
        ))}
      </ol>
      </div>)}
    </div>
  )
}
