import { useLibrary } from '../../lib/store'
import { dueState, dueTopics, modeFor } from '../../lib/scheduling'
import { StatusTag } from '../../components/ui/StatusTag'
import type { Mode } from '../../lib/types'

interface TodayProps {
  onStart: (mode: Mode, topicIds: string[]) => void
  onGoToLibrary: () => void
}

export function Today({ onStart, onGoToLibrary }: TodayProps) {
  const { topics } = useLibrary()
  const due = dueTopics(topics)
  const practicable = topics.filter((t) => t.items.length > 0)

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
    const next = [...practicable].sort((a, b) => dueState(a).waitDays - dueState(b).waitDays)[0]
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
          <button
            className="ghost"
            type="button"
            onClick={() => onStart('practice', practicable.map((t) => t.id))}
          >
            Practise anyway
          </button>
        </div>
      </>
    )
  }

  // The ladder decides the mode: a topic never seen wants reading, everything
  // else wants proving. Whichever group is on top gets the single primary
  // action, so the five-minute path stays one tap.
  const toLearn = due.filter((topic) => modeFor(topic) === 'learn')
  const toTest = due.filter((topic) => modeFor(topic) === 'test')
  const leadWithLearn = toLearn.length > 0
  const leadGroup = leadWithLearn ? toLearn : toTest
  const altGroup = leadWithLearn ? toTest : []

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

        <div className="panel-actions">
          <button
            type="button"
            onClick={() => onStart(leadWithLearn ? 'learn' : 'test', leadGroup.map((t) => t.id))}
          >
            {leadWithLearn ? 'Learn' : 'Start test'} · {leadGroup.length}{' '}
            {leadGroup.length === 1 ? 'topic' : 'topics'}
          </button>

          <div className="panel-alts">
            {altGroup.length > 0 && (
              <button
                className="quiet"
                type="button"
                onClick={() => onStart('test', altGroup.map((t) => t.id))}
              >
                Test {altGroup.length}
              </button>
            )}
            <button
              className="quiet"
              type="button"
              onClick={() => onStart('practice', due.map((t) => t.id))}
            >
              Practise without recording
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
