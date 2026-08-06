import { useLibrary } from '../../lib/store'
import { dueState, dueTopics } from '../../lib/scheduling'
import { StatusTag } from '../../components/ui/StatusTag'

interface TodayProps {
  onStart: (topicIds: string[]) => void
  onLearn: (topicIds: string[]) => void
  onGoToLibrary: () => void
}

export function Today({ onStart, onLearn, onGoToLibrary }: TodayProps) {
  const { topics } = useLibrary()
  const due = dueTopics(topics)
  const practicable = topics.filter((t) => t.items.length > 0)
  // Unstarted topics have never been shown to the user, so they go to Learn
  // first, not straight into a blind recall test.
  const toLearn = due.filter((t) => t.status === 'unstarted')
  const toPractise = due.filter((t) => t.status !== 'unstarted')

  // Nothing authored yet. Teach the entry gate rather than showing a blank.
  if (topics.length === 0) {
    return (
      <>
        <h1>Today</h1>
        <div className="lede">
          <p>
            Your library is empty. Argus holds topics that can be genuinely finished: a fixed
            alphabet, a named framework with a known number of parts, a defined protocol. Each one
            states its own boundary before it can exist.
          </p>
          <button type="button" onClick={onGoToLibrary}>
            Create the first topic
          </button>
        </div>
      </>
    )
  }

  if (due.length === 0) {
    const next = [...practicable].sort(
      (a, b) => dueState(a).waitDays - dueState(b).waitDays,
    )[0]
    return (
      <>
        <h1>Today</h1>
        <div className="lede">
          <p>Nothing is due. Recall needs the gap to mean anything, so the schedule is holding.</p>
          {next && (
            <p className="next-up">
              Next: <strong>{next.title}</strong>, {dueState(next).label.toLowerCase()}.
            </p>
          )}
          <button className="ghost" type="button" onClick={() => onStart(practicable.map((t) => t.id))}>
            Practise ahead anyway
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <h1>Today</h1>

      <section className="practice-panel" aria-labelledby="due-heading">
        <h2 id="due-heading">
          {due.length} {due.length === 1 ? 'topic is' : 'topics are'} due
        </h2>
        <ul className="due-list">
          {due.map((topic) => (
            <li key={topic.id}>
              <span className="due-title">{topic.title}</span>
              <StatusTag status={topic.status} />
            </li>
          ))}
        </ul>
        {toLearn.length > 0 && (
          <button type="button" onClick={() => onLearn(toLearn.map((t) => t.id))}>
            Learn{toPractise.length > 0 ? ` (${toLearn.length})` : ''}
          </button>
        )}
        {toPractise.length > 0 && (
          <button
            className={toLearn.length > 0 ? 'ghost' : undefined}
            type="button"
            onClick={() => onStart(toPractise.map((t) => t.id))}
          >
            Start practice{toLearn.length > 0 ? ` (${toPractise.length})` : ''}
          </button>
        )}
      </section>
    </>
  )
}
