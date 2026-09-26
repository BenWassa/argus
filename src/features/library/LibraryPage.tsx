import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useLibrary } from '../../services/library/LibraryProvider'
import { journeysFor, type JourneyEntry } from '../../domain/study/journey'
import { libraryGroups } from '../../domain/study/libraryGroups'
import type { RunTarget } from '../../app/routing/routes'
import { Confirm } from '../../shared/ui/Confirm'
import { TRACK_LABELS } from '../../shared/ui/trackLabels'
import { AddMenu } from './AddMenu'
import { TopicForm, type Draft } from './TopicForm'
import { TopicPage } from './TopicPage'
import { TopicGauge } from './TopicGauge'
import { gaugeLabel, gaugeReading } from './gaugeReading'
import { CaptureSheet } from './CaptureSheet'
import { useInbox } from '../../services/inbox/useInbox'
import type { Mode } from '../../domain/study/mode'
import { TRACKS, type Topic } from '../../domain/library/topic'
import { topicIcon } from './topicIcon'
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

/** The unstarted shelf split by track, in the canonical track order, each run
 *  carrying where it starts in the whole list for the arrival stagger. */
function byTrack(entries: JourneyEntry[]) {
  let offset = 0
  return TRACKS.flatMap((track) => {
    const run = entries.filter((entry) => entry.topic.track === track)
    if (run.length === 0) return []
    const group = { track, entries: run, offset }
    offset += run.length
    return [group]
  })
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

  // The stagger index runs across both shelves, so the list arrives as one
  // sequence from the top rather than restarting at the second heading.
  const rows = (entries: JourneyEntry[], offset: number, started: boolean) => (
    <ul className="index">
      {entries.map((entry, i) => (
        <Row
          key={entry.topic.id}
          entry={entry}
          order={offset + i}
          started={started}
          onOpen={() => openTopic(entry.topic.id)}
        />
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
          {/* Two shelves, both named. What you have started, most recent
              first, is the part of a library you come back to; the rest is
              everything you have not begun, set out by track under a heading
              in that track's metal, so the colour is named where it is used.
              `Started` names progress; `Knowledge` names the subject track. */}
          {groups.learning.length > 0 && (
            <section className="lib-group" aria-labelledby="lib-started-head">
              <div className="lib-group-bar">
                <h2 id="lib-started-head" className="lib-group-head">
                  Started
                </h2>
                <span className="lib-group-count tabular" aria-hidden="true">
                  {groups.learning.length}
                </span>
              </div>
              {rows(groups.learning, 0, true)}
            </section>
          )}
          {groups.rest.length > 0 && (
            <section className="lib-group lib-group-rest" aria-labelledby="lib-rest-head">
              <div className="lib-group-bar">
                <h2 id="lib-rest-head" className="lib-group-head">
                  Not started
                </h2>
                <span className="lib-group-count tabular" aria-hidden="true">
                  {groups.rest.length}
                </span>
              </div>
              {byTrack(groups.rest).map(({ track, entries, offset }) => (
                <div
                  key={track}
                  className="lib-track"
                  style={{ '--track-hue': `var(--${track})` } as CSSProperties}
                >
                  <h3 className="lib-track-head">{TRACK_LABELS[track]}</h3>
                  {rows(entries, groups.learning.length + offset, false)}
                </div>
              ))}
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
  /** Position in the whole list, for the arrival stagger. */
  order: number
  started: boolean
  onOpen: () => void
}

/**
 * One plate per topic: a title and, once the topic has been started, one
 * reading of where it is. The plate is the whole control, so it needs no
 * chevron to say it opens.
 * The row opens the topic and does nothing else: what to do next is the topic
 * page's one decision, and Today's, rather than a second button on every row.
 *
 * A started plate leads with a stud in its track's metal; an unstarted one
 * needs none, because it already sits under a heading in that metal. The reading is the gauge's own, in its units, or the schedule's
 * sentence where there is no measure yet; a decayed topic says `Needs repair`
 * in tarnish instead, the one warm note in the product.
 */
function Row({ entry, order, started, onOpen }: RowProps) {
  const { topic, journey } = entry
  const repair = journey.phase === 'repair'
  // A started topic with no measure yet still has a sentence: the schedule's
  // own, the same words Today and the topic page use for it.
  const measured = gaugeLabel(gaugeReading(topic, journey)) !== null
  const icon = topicIcon(topic.id)
  const style = {
    '--track-hue': `var(--${topic.track})`,
    '--order': Math.min(order, 12),
  } as CSSProperties

  return (
    <li className="index-entry lib-entry" style={style}>
      <button
        type="button"
        className={`index-row lib-row${icon ? ' has-topic-icon' : ''}`}
        data-row={topic.id}
        data-started={started || undefined}
        data-repair={repair || undefined}
        onClick={onOpen}
      >
        {icon && <img className="topic-icon" src={icon} alt="" aria-hidden="true" />}
        <span className="index-title">{topic.title}</span>
        {repair ? (
          <span className="lib-row-reading lib-repair">Needs repair</span>
        ) : !started ? null : measured ? (
          <TopicGauge topic={topic} journey={journey} variant="row" />
        ) : (
          <span className="lib-row-reading">{journey.statusLabel}</span>
        )}
      </button>
    </li>
  )
}
