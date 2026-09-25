import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useLibrary } from '../../services/library/LibraryProvider'
import { journeysFor, type JourneyEntry } from '../../domain/study/journey'
import { libraryGroups } from '../../domain/study/libraryGroups'
import type { RunTarget } from '../../app/routing/routes'
import { Confirm } from '../../shared/ui/Confirm'
import { AddMenu } from './AddMenu'
import { TopicForm, type Draft } from './TopicForm'
import { TopicPage } from './TopicPage'
import { TopicGauge } from './TopicGauge'
import { CaptureSheet } from './CaptureSheet'
import { useInbox } from '../../services/inbox/useInbox'
import type { Mode } from '../../domain/study/mode'
import type { Topic } from '../../domain/library/topic'
import './LibraryPage.css'

interface LibraryProps {
  onStart: (mode: Mode, topicIds: string[], target?: RunTarget) => void
  /** The Morse alphabet, opened from the topic page and returning to it. */
  onReference: (topicId: string) => void
  /** Durable topic navigation is owned by App/history, not only local state. */
  onOpenTopic: (topicId: string) => void
  onCloseTopic: () => void
  /** Set when Today sends the user here to author their first topic. */
  openFormOnMount?: boolean
  /** Current topic identity restored by browser Back/Forward when present. */
  openTopicOnMount?: string | null
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

export function LibraryPage({
  onStart,
  onReference,
  onOpenTopic,
  onCloseTopic,
  openFormOnMount = false,
  openTopicOnMount = null,
}: LibraryProps) {
  const { topics, upsertTopic, removeTopic } = useLibrary()

  const [openId, setOpenId] = useState<string | null>(openTopicOnMount)
  const [editing, setEditing] = useState<Topic | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [formOpen, setFormOpen] = useState(openFormOnMount)
  const [focusItems, setFocusItems] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Topic | null>(null)
  const [addMenuOpen, setAddMenuOpen] = useState(false)

  // The inbox is a neighbour of the library, never a part of it. Capture is
  // reached from the + button; its requests never enter `topics`, so nothing
  // here can reach the scheduler, a Test run, progress or completion.
  const inbox = useInbox()
  const [capturing, setCapturing] = useState(false)

  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  const searchId = useId()
  const searchField = useRef<HTMLInputElement>(null)
  const searchToggle = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)
  /** Set when leaving a topic page, so focus lands back on the row you left from. */
  const returnTo = useRef<string | null>(null)
  const previousRouteTopic = useRef<string | null>(openTopicOnMount)

  // Derived from the live store rather than held as a snapshot, so an edit made
  // on the topic page is reflected the moment it saves.
  const open = openId ? (topics.find((t) => t.id === openId) ?? null) : null

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return topics
    return topics.filter(
      (topic) =>
        topic.title.toLowerCase().includes(needle) || topic.scope.toLowerCase().includes(needle),
    )
  }, [topics, query])

  const groups = useMemo(() => libraryGroups(journeysFor(filtered)), [filtered])
  const filtering = query.trim().length > 0
  const nothingMatches = groups.learning.length === 0 && groups.rest.length === 0

  useEffect(() => {
    if (searchOpen) searchField.current?.focus()
  }, [searchOpen])

  // Browser Back/Forward owns the durable topic identity. Keep the existing
  // local page state synchronized so filters/dialogs remain local while a
  // historical Topic entry can still be restored deterministically.
  useEffect(() => {
    const previous = previousRouteTopic.current
    if (previous && !openTopicOnMount) returnTo.current = previous
    previousRouteTopic.current = openTopicOnMount
    setOpenId(openTopicOnMount)
  }, [openTopicOnMount])

  // A topic deleted from its own page has nowhere to return to but the list.
  useEffect(() => {
    if (openId && !topics.some((t) => t.id === openId)) setOpenId(null)
  }, [openId, topics])

  /**
   * Land back on the row you left from.
   *
   * A row can still move while you are away because a deliberate action, a
   * scored run or another concurrent write may change its journey. Browsing the
   * topic itself does not. A single-frame restore must therefore tolerate either
   * case rather than assuming the row is still under the same shelf.
   *
   * So this re-runs as the list settles and gives up only once it has, rather
   * than after a fixed number of frames. `#main` is the floor, because a filter
   * can also hide the row entirely.
   */
  useEffect(() => {
    if (open || !returnTo.current) return
    const id = returnTo.current
    let frame = 0
    let raf = 0

    const settle = () => {
      const row = list.current?.querySelector<HTMLElement>(`[data-row="${CSS.escape(id)}"]`)
      if (row) {
        returnTo.current = null
        row.focus()
        return
      }
      if (frame >= 3) {
        returnTo.current = null
        document.getElementById('main')?.focus()
        return
      }
      frame += 1
      raf = requestAnimationFrame(settle)
    }

    raf = requestAnimationFrame(settle)
    return () => cancelAnimationFrame(raf)
  }, [open, topics])

  function openTopic(id: string) {
    setOpenId(id)
    onOpenTopic(id)
  }

  function leaveTopic() {
    returnTo.current = openId
    onCloseTopic()
  }

  function newTopic(seed: Draft | null = null) {
    setEditing(null)
    setDraft(seed)
    setFocusItems(false)
    setFormOpen(true)
  }

  // Capture needs a working inbox. Without one there is only one real choice,
  // so the FAB skips straight to it rather than opening a menu with one option.
  function openAdd() {
    if (inbox.status !== 'ready') {
      newTopic()
      return
    }
    setAddMenuOpen(true)
  }

  function editTopic(topic: Topic, atItems = false) {
    setEditing(topic)
    setDraft(null)
    setFocusItems(atItems)
    setFormOpen(true)
  }

  function closeSearch() {
    setQuery('')
    setSearchOpen(false)
    // The field is going away, so focus returns to the control that opened it.
    requestAnimationFrame(() => searchToggle.current?.focus())
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

      {addMenuOpen && (
        <AddMenu
          onNewTopic={() => {
            setAddMenuOpen(false)
            newTopic()
          }}
          onWantToLearn={() => {
            setAddMenuOpen(false)
            setCapturing(true)
          }}
          onClose={() => setAddMenuOpen(false)}
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
          onReference={onReference}
          onEdit={() => editTopic(open, open.items.length === 0)}
          onDelete={() => setPendingDelete(open)}
        />
        {overlays}
      </>
    )
  }

  const rows = (entries: JourneyEntry[]) => (
    <ul className="index">
      {entries.map((entry) => (
        <Row key={entry.topic.id} entry={entry} onOpen={() => openTopic(entry.topic.id)} />
      ))}
    </ul>
  )

  return (
    <>
      <div className="page-head lib-head">
        <div>
          <h1>Library</h1>
          <p className="kicker lib-count tabular">
            {topics.length === 0
              ? 'Empty'
              : filtering
                ? `${filtered.length} of ${topics.length} topics`
                : `${topics.length} ${topics.length === 1 ? 'topic' : 'topics'}`}
          </p>
        </div>

        {/* Search stays a single control until it is wanted, then opens
            leftwards over the heading. Closing it clears the query, so a
            filtered list never outlives the field that filtered it. */}
        {topics.length > 0 && (
          <div className={`lib-search-box${searchOpen ? ' is-open' : ''}`}>
            {searchOpen ? (
              <>
                <label className="sr-only" htmlFor={searchId}>
                  Search topics
                </label>
                <input
                  ref={searchField}
                  id={searchId}
                  className="field lib-search"
                  type="search"
                  value={query}
                  placeholder="Search titles and scope"
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') closeSearch()
                  }}
                />
                <button
                  className="lib-search-toggle"
                  type="button"
                  aria-label="Close search"
                  onClick={closeSearch}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </>
            ) : (
              <button
                ref={searchToggle}
                className="lib-search-toggle"
                type="button"
                aria-label="Search topics"
                onClick={() => setSearchOpen(true)}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                  <circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M15 15l5 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

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
      ) : nothingMatches ? (
        <div className="lib-blank">
          <p>
            Nothing matches that. The library holds {topics.length}{' '}
            {topics.length === 1 ? 'topic' : 'topics'} in total.
          </p>
          <button className="ghost" type="button" onClick={closeSearch}>
            Clear search
          </button>
        </div>
      ) : (
        <div ref={list}>
          {/* Two groups and one heading. What you have started, most recent
              first, is the part of a library you come back to; everything
              else is the shelf, by title, and needs no name beyond Library. */}
          {groups.learning.length > 0 && (
            <section className="lib-group" aria-labelledby="lib-learning-head">
              <h2 id="lib-learning-head" className="lib-group-head">
                Learning
              </h2>
              {rows(groups.learning)}
            </section>
          )}
          {groups.rest.length > 0 && (
            <section className="lib-group lib-group-rest" aria-label="Not started">
              {rows(groups.rest)}
            </section>
          )}
        </div>
      )}

      {topics.length > 0 && (
        <button
          className="lib-fab"
          type="button"
          onClick={openAdd}
          aria-label="Add to the library"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
            <path
              d="M12 5v14M5 12h14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}

      {overlays}
    </>
  )
}

interface RowProps {
  entry: JourneyEntry
  onOpen: () => void
}

/**
 * A title and, where the topic has earned one, its progress reading. The row
 * opens the topic and does nothing else: what to do next is the topic page's
 * one decision, and Today's, rather than a second button on every row here.
 */
function Row({ entry, onOpen }: RowProps) {
  const { topic, journey } = entry
  return (
    <li className="index-entry">
      <button type="button" className="index-row" data-row={topic.id} onClick={onOpen}>
        <span className="index-title">{topic.title}</span>
        <TopicGauge topic={topic} journey={journey} variant="row" />
      </button>
    </li>
  )
}
