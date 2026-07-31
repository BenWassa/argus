import { useState } from 'react'
import { useLibrary } from '../../lib/store'
import { dueState } from '../../lib/scheduling'
import { StatusTag } from '../../components/ui/StatusTag'
import { Dialog } from '../../components/ui/Dialog'
import { Confirm } from '../../components/ui/Confirm'
import { TopicForm } from './TopicForm'
import type { Topic } from '../../lib/types'

interface LibraryProps {
  onPractise: (topicIds: string[]) => void
  /** Set when Today sends the user here to author their first topic. */
  openFormOnMount?: boolean
}

export function Library({ onPractise, openFormOnMount = false }: LibraryProps) {
  const { topics, upsertTopic, removeTopic } = useLibrary()
  const [detail, setDetail] = useState<Topic | null>(null)
  const [editing, setEditing] = useState<Topic | null>(null)
  const [formOpen, setFormOpen] = useState(openFormOnMount)
  const [pendingDelete, setPendingDelete] = useState<Topic | null>(null)

  const sorted = [...topics].sort((a, b) => a.title.localeCompare(b.title))

  return (
    <>
      <div className="page-head">
        <h1>Library</h1>
        <button
          className="ghost"
          type="button"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          New topic
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="empty">
          No topics yet. A topic needs a stated boundary before it can exist here, which is what
          makes it possible to finish.
        </p>
      ) : (
        <ul className="index">
          {sorted.map((topic) => (
            <li key={topic.id}>
              <button type="button" className="index-row" onClick={() => setDetail(topic)}>
                <span className="index-title">{topic.title}</span>
                <span className="index-meta">
                  <StatusTag status={topic.status} />
                  <span className={`track track-${topic.track}`}>{topic.track}</span>
                  <span>
                    {topic.items.length} {topic.items.length === 1 ? 'item' : 'items'}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {detail && (
        <Dialog title={detail.title} onClose={() => setDetail(null)}>
          <p className="scope">{detail.scope}</p>
          <dl className="facts">
            <div>
              <dt>Status</dt>
              <dd>
                <StatusTag status={detail.status} />
              </dd>
            </div>
            <div>
              <dt>Schedule</dt>
              <dd>{dueState(detail).label}</dd>
            </div>
            <div>
              <dt>Items</dt>
              <dd>{detail.items.length}</dd>
            </div>
            {detail.completedAt && (
              <div>
                <dt>First completed</dt>
                <dd>{new Date(detail.completedAt).toLocaleDateString()}</dd>
              </div>
            )}
          </dl>

          <h3>Items</h3>
          <ul className="items">
            {detail.items.map((item, i) => (
              <li key={`${item.prompt}-${i}`}>
                <span>{item.prompt}</span>
                <span>{item.answer}</span>
              </li>
            ))}
          </ul>

          <div className="actions">
            <button
              className="ghost"
              type="button"
              onClick={() => {
                setPendingDelete(detail)
                setDetail(null)
              }}
            >
              Delete
            </button>
            <button
              className="ghost"
              type="button"
              onClick={() => {
                setEditing(detail)
                setDetail(null)
                setFormOpen(true)
              }}
            >
              Edit
            </button>
            <button type="button" onClick={() => onPractise([detail.id])}>
              Practise
            </button>
          </div>
        </Dialog>
      )}

      {formOpen && (
        <TopicForm
          topic={editing}
          onClose={() => {
            setFormOpen(false)
            setEditing(null)
          }}
          onSave={(topic) => {
            upsertTopic(topic)
            setFormOpen(false)
            setEditing(null)
          }}
        />
      )}

      {pendingDelete && (
        <Confirm
          title="Delete topic"
          body={`"${pendingDelete.title}" and its practice history will be removed from this device. Export your library first if you want a copy.`}
          confirmLabel="Delete topic"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            removeTopic(pendingDelete.id)
            setPendingDelete(null)
          }}
        />
      )}
    </>
  )
}
