import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useLibrary } from '../../lib/store'
import { dueState, gapProgress, isDue, modeFor, shelves } from '../../lib/scheduling'
import { Confirm } from '../../components/ui/Confirm'
import { TopicForm, type Draft } from './TopicForm'
import { TopicPage } from './TopicPage'
import { CaptureSheet } from './CaptureSheet'
import { WantToLearn } from './WantToLearn'
import { useInbox } from '../../lib/inbox/useInbox'
import { describeInboxError } from '../../lib/inbox/backend'
import type { ContentRequest } from '../../lib/inbox/model'
import { TRACKS, type Mode, type Topic, type Track } from '../../lib/types'
import './Library.css'

interface LibraryProps {
  onStart: (mode: Mode, topicIds: string[]) => void
  /** Set when Today sends the user here to author their first topic. */
  openFormOnMount?: boolean
}

const TRACK_LABELS: Record<Track, string> = {
  learning: 'Learning',
  survival: 'Survival',
  tradecraft: 'Tradecraft',
}

/**
 * Shown when the library is empty. A well-formed scope sentence is the one
 * thing the product cannot teach by describing it, so the empty state hands
 * over a real one rather than restating the rule.
 */
const EXAMPLE: Draft = {
  title: 'Cardinal bearings',
  scope: 'The four cardinal compass points and their degree values. Nothing else.',
  track: 'tradecraft',
  items: 'North | 0\nEast | 90\nSouth | 180\nWest | 270',
}

export function Library({ onStart, openFormOnMount = false }: LibraryProps) {
  const { topics, upsertTopic, removeTopic } = useLibrary()

  const [openId, setOpenId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Topic | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [formOpen, setFormOpen] = useState(openFormOnMount)
  const [focusItems, setFocusItems] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Topic | null>(null)

  // The inbox is a neighbour of the library, never a part of it. Its requests
  // are held in their own state and never enter `topics`, so nothing here can
  // reach the scheduler, a Test run, progress or completion.
  const inbox = useInbox()
  const [capturing, setCapturing] = useState(false)
  const [removingRequest, setRemovingRequest] = useState<string | null>(null)
  const [inboxError, setInboxError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [announcement, setAnnouncement] = useState('')

  const searchId = useId()
  const list = useRef<HTMLDivElement>(null)
  /** Set when leaving a topic page, so focus lands back on the row you left from. */
  const returnTo = useRef<string | null>(null)

  // Derived from the live store rather than held as a snapshot, so an edit made
  // on the topic page is reflected the moment it saves.
  const open = openId ? (topics.find((t) => t.id === openId) ?? null) : null

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return topics.filter((topic) => {
      if (tracks.length > 0 && !tracks.includes(topic.track)) return false
      if (!needle) return true
      return (
        topic.title.toLowerCase().includes(needle) || topic.scope.toLowerCase().includes(needle)
      )
    })
  }, [topics, query, tracks])

  const groups = useMemo(() => shelves(filtered), [filtered])
  const dueCount = useMemo(() => topics.filter((t) => isDue(t) && t.items.length > 0).length, [topics])
  const filtering = query.trim().length > 0 || tracks.length > 0

  const selectable = filtered.filter((t) => t.items.length > 0)
  const chosen = selected.filter((id) => selectable.some((t) => t.id === id))

  // A topic deleted from its own page has nowhere to return to but the list.
  useEffect(() => {
    if (openId && !topics.some((t) => t.id === openId)) setOpenId(null)
  }, [openId, topics])

  useEffect(() => {
    if (open || !returnTo.current) return
    const id = returnTo.current
    returnTo.current = null
    requestAnimationFrame(() => {
      const row = list.current?.querySelector<HTMLElement>(`[data-row="${CSS.escape(id)}"]`)
      // A filter can hide the row you came from, so there is a floor to land on.
      if (row) row.focus()
      else document.getElementById('main')?.focus()
    })
  }, [open])

  function leaveTopic() {
    returnTo.current = openId
    setOpenId(null)
  }

  function newTopic(seed: Draft | null = null) {
    setEditing(null)
    setDraft(seed)
    setFocusItems(false)
    setFormOpen(true)
  }

  function editTopic(topic: Topic, atItems = false) {
    setEditing(topic)
    setDraft(null)
    setFocusItems(atItems)
    setFormOpen(true)
  }

  function toggleTrack(track: Track) {
    setTracks((current) =>
      current.includes(track) ? current.filter((t) => t !== track) : [...current, track],
    )
  }

  function toggleSelected(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    )
  }

  function endSelecting() {
    setSelecting(false)
    setSelected([])
  }

  function clearFilters() {
    setQuery('')
    setTracks([])
  }

  async function signInToInbox() {
    setInboxError(null)
    try {
      await inbox.signIn()
    } catch (error) {
      setInboxError(describeInboxError(error))
    }
  }

  async function removeRequest(request: ContentRequest) {
    setInboxError(null)
    setRemovingRequest(request.id)
    try {
      await inbox.deleteRequest(request.id)
      setAnnouncement('Request removed.')
    } catch (error) {
      setInboxError(describeInboxError(error))
    } finally {
      setRemovingRequest(null)
    }
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
    setDraft(null)
    setFocusItems(false)
  }

  // The form and the delete confirmation belong to both surfaces, so they are
  // rendered once outside the branch rather than kept in step in two places.
  const overlays = (
    <>
      {formOpen && (
        <TopicForm
          topic={editing}
          draft={draft}
          focusItems={focusItems}
          onClose={closeForm}
          onSave={(topic) => {
            upsertTopic(topic)
            setAnnouncement(editing ? `${topic.title} saved.` : `${topic.title} added to the library.`)
            closeForm()
          }}
        />
      )}

      {capturing && (
        <CaptureSheet
          onSubmit={inbox.addRequest}
          onClose={() => setCapturing(false)}
          onCaptured={() => setAnnouncement('Added to Want to learn.')}
        />
      )}

      {pendingDelete && (
        <Confirm
          title="Delete topic"
          body={`"${pendingDelete.title}" and its test history will be removed from this device. Export your library first if you want a copy.`}
          confirmLabel="Delete topic"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            removeTopic(pendingDelete.id)
            setAnnouncement(`${pendingDelete.title} deleted.`)
            setPendingDelete(null)
          }}
        />
      )}

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </>
  )

  if (open) {
    return (
      <>
        <TopicPage
          topic={open}
          onBack={leaveTopic}
          onStart={onStart}
          onEdit={() => editTopic(open, open.items.length === 0)}
          onDelete={() => setPendingDelete(open)}
        />
        {overlays}
      </>
    )
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Library</h1>
          <p className="kicker lib-count tabular">
            {topics.length === 0
              ? 'Empty'
              : filtering
                ? `${filtered.length} of ${topics.length} topics`
                : `${topics.length} ${topics.length === 1 ? 'topic' : 'topics'} · ${dueCount} due`}
          </p>
        </div>
        <div className="lib-head-actions">
          <button className="ghost" type="button" onClick={() => newTopic()}>
            New topic
          </button>
          {/* Lighter than New topic on purpose: this one asks for an idea, not
              a finite boundary. A build with no inbox does not offer it at all,
              rather than showing a control that cannot work. */}
          {inbox.status !== 'unconfigured' && (
            <button className="lib-capture" type="button" onClick={() => setCapturing(true)}>
              <span aria-hidden="true">+</span> Want to learn
            </button>
          )}
        </div>
      </div>

      <WantToLearn
        status={inbox.status}
        requests={inbox.requests}
        error={inboxError ?? inbox.error}
        removing={removingRequest}
        onSignIn={() => void signInToInbox()}
        onRemove={(request) => void removeRequest(request)}
      />

      {topics.length === 0 ? (
        <div className="lib-blank">
          <p>
            Argus holds topics that can be genuinely finished: a fixed alphabet, a named framework
            with a known number of parts, a defined protocol. Every one states where it ends before
            it can exist, and that boundary is what makes finishing possible.
          </p>
          <div className="lib-blank-actions">
            <button type="button" onClick={() => newTopic()}>
              Write the first topic
            </button>
            <button className="quiet" type="button" onClick={() => newTopic(EXAMPLE)}>
              Start from an example
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="lib-filters">
            <label className="sr-only" htmlFor={searchId}>
              Search topics
            </label>
            <input
              id={searchId}
              className="field lib-search"
              type="search"
              value={query}
              placeholder="Search titles and scope"
              onChange={(e) => setQuery(e.target.value)}
            />

            <div className="lib-chips" role="group" aria-label="Filter by track">
              {TRACKS.map((track) => (
                <button
                  key={track}
                  type="button"
                  className={`lib-chip lib-chip-${track}`}
                  aria-pressed={tracks.includes(track)}
                  onClick={() => toggleTrack(track)}
                >
                  {TRACK_LABELS[track]}
                </button>
              ))}
              {/* Stays put once selecting, even if a filter drops the list below
                  the threshold that offered it. Otherwise the way out vanishes. */}
              {(selecting || selectable.length > 1) && (
                <button
                  className="quiet lib-select-toggle"
                  type="button"
                  onClick={() => (selecting ? endSelecting() : setSelecting(true))}
                >
                  {selecting ? 'Cancel' : 'Select'}
                </button>
              )}
            </div>
          </div>

          {groups.length === 0 ? (
            <div className="lib-blank">
              <p>
                Nothing matches that. The library holds {topics.length}{' '}
                {topics.length === 1 ? 'topic' : 'topics'} in total.
              </p>
              <button className="ghost" type="button" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          ) : (
            <div ref={list}>
              {groups.map((shelf) => (
                <section className="lib-shelf" key={shelf.id}>
                  <h2 className="lib-shelf-head">
                    {shelf.label}
                    <span className="lib-shelf-count tabular">{shelf.topics.length}</span>
                  </h2>
                  <ul className="index">
                    {shelf.topics.map((topic) => (
                      <Row
                        key={topic.id}
                        topic={topic}
                        onDueShelf={shelf.id === 'due'}
                        selecting={selecting}
                        selected={chosen.includes(topic.id)}
                        onOpen={() => setOpenId(topic.id)}
                        onToggle={() => toggleSelected(topic.id)}
                        onAction={() =>
                          topic.items.length === 0
                            ? editTopic(topic, true)
                            : onStart(modeFor(topic), [topic.id])
                        }
                      />
                    ))}
                  </ul>
                </section>
              ))}

              <p className="lib-consequence">
                Tests are scored. The ladder moves only when its required evidence gap is satisfied.
              </p>
            </div>
          )}
        </>
      )}

      {selecting && chosen.length > 0 && (
        <div className="lib-batch" role="group" aria-label="Run the selected topics">
          <p className="lib-batch-count tabular">
            {chosen.length} selected
          </p>
          <div className="lib-batch-actions">
            <button type="button" onClick={() => onStart('test', chosen)}>
              Test {chosen.length}
            </button>
          </div>
        </div>
      )}

      {overlays}
    </>
  )
}

interface RowProps {
  topic: Topic
  /** True on the Due now shelf, where the schedule line stops being a countdown
   *  and becomes the reason the topic surfaced. */
  onDueShelf: boolean
  selecting: boolean
  selected: boolean
  onOpen: () => void
  onToggle: () => void
  onAction: () => void
}

/**
 * Two zones, separated by a hairline, each with one meaning: the left navigates
 * to the topic, the right runs it. The action carries its mode as a word,
 * because a scored test is the most consequential thing in the product and an
 * icon cannot state a consequence.
 */
function Row({ topic, onDueShelf, selecting, selected, onOpen, onToggle, onAction }: RowProps) {
  const runnable = topic.items.length > 0
  const action = !runnable ? 'Add items' : modeFor(topic) === 'learn' ? 'Learn' : 'Test'
  const gap = gapProgress(topic)
  const schedule = dueState(topic).label
  // Repair reads in warning on Today, so it reads in warning here. Decay is
  // routing information in both places, and it should look the same in both.
  const when = [
    'lib-when',
    onDueShelf ? 'is-due' : '',
    topic.status === 'decayed' ? 'is-repair' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li className={`index-entry${selecting ? ' is-selecting' : ''}`}>
      {selecting && (
        <input
          type="checkbox"
          className="lib-check"
          checked={selected}
          disabled={!runnable}
          aria-label={`Select ${topic.title}`}
          onChange={onToggle}
        />
      )}

      <button
        type="button"
        className="index-row"
        data-row={topic.id}
        // A topic with no items cannot be run, so it cannot be selected either.
        // Tapping it in select mode still opens it, which is the only useful
        // thing left to do with it.
        onClick={selecting && runnable ? onToggle : onOpen}
      >
        <span className="index-title">{topic.title}</span>
        <span className="index-meta">
          <span className={`track track-${topic.track}`}>{topic.track}</span>
          <span className="tabular">
            {topic.items.length} {topic.items.length === 1 ? 'item' : 'items'}
          </span>
          <span className={when}>{schedule}</span>
        </span>
        {gap !== null && gap < 1 && (
          <span className="lib-gap" aria-hidden="true">
            <span className="lib-gap-fill" style={{ width: `${Math.round(gap * 100)}%` }} />
          </span>
        )}
      </button>

      {!selecting && (
        <button className="lib-action" type="button" onClick={onAction}>
          {action}
        </button>
      )}
    </li>
  )
}
