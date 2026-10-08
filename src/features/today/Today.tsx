import { useState } from 'react'
import { useLibrary } from '../../services/library/LibraryProvider'
import { dueEntries, journeysFor, type JourneyEntry } from '../../domain/study/journey'
import { hasStarted } from '../../domain/study/libraryGroups'
import { homeProgress, homeReadout, type HomeProgress } from '../../domain/study/home'
import { useTopicCapture } from '../library/useTopicCapture'
import './Today.css'

/** Keep the established priority order, including historically completed repair. */
export function inProgress(entries: JourneyEntry[]): JourneyEntry[] {
  return dueEntries(entries.filter((entry) => entry.topic.items.length > 0 && hasStarted(entry)))
}

function militaryDate(date: Date, year = true): string {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]}${year ? ` ${date.getFullYear()}` : ''}`
}

interface TodayProps {
  onOpenTopic: (topicId: string) => void
  onGoToLibrary: () => void
  onAuthorTopic: () => void
  onOpenProfile: () => void
}

/** Home keeps the historical `today` route so restored history stays valid. */
export function Today({ onOpenTopic, onGoToLibrary, onAuthorTopic, onOpenProfile }: TodayProps) {
  const { topics } = useLibrary()
  const [announcement, setAnnouncement] = useState('')
  const capture = useTopicCapture(() => setAnnouncement('Added to Want to learn.'))
  const entries = journeysFor(topics)
  const readout = homeReadout(entries)
  const active = inProgress(entries)

  return (
    <>
      <Head stamp={militaryDate(new Date())} onProfile={onOpenProfile} />
      <dl className="home-readout" aria-label="Learning record">
        <div><dt>Completed</dt><dd className="tabular">{readout.completed}</dd></div>
        <div><dt>In progress</dt><dd className="tabular">{readout.inProgress}</dd></div>
        <div><dt>Last active</dt><dd className="tabular">
          {readout.lastActive ? <time dateTime={readout.lastActive}>{militaryDate(new Date(readout.lastActive), false)}</time> : '—'}
        </dd></div>
      </dl>
      {active.length > 0 ? (
        <section className="home-active" aria-labelledby="home-active-heading">
          <div className="home-section-bar">
            <h2 id="home-active-heading">Active topics</h2>
            {active.length > 3 && <button className="quiet" type="button" onClick={onGoToLibrary}>See all</button>}
          </div>
          <ul className="index docket">
            {active.slice(0, 3).map((entry) => (
              <li className="today-entry" key={entry.topic.id}>
                <button type="button" className="index-row today-plate" data-repair={entry.journey.phase === 'repair' || undefined} onClick={() => onOpenTopic(entry.topic.id)}>
                  <ProgressRing progress={homeProgress(entry.topic, entry.journey)} />
                  <span className="home-topic-copy">
                    <span className="index-title today-plate-title">{entry.topic.title}</span>
                    <span className={`home-topic-reading${entry.journey.phase === 'repair' ? ' is-repair' : ''}`}>{homeProgress(entry.topic, entry.journey).label}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <div className="home-empty">
          <p className="today-note">{topics.some((topic) => topic.items.length === 0)
            ? 'Add prompts and answers to your topics in the Library before testing.'
            : readout.completed > 0
            ? 'Everything you have started is banked. Check any topic from the Library whenever you like.'
            : 'Start a topic in the Library. It will appear here while you build recall.'}</p>
          <button className="ghost" type="button" onClick={onGoToLibrary}>Open Library</button>
        </div>
      )}
      <button className="home-add quiet" type="button" onClick={capture.available ? capture.openCapture : onAuthorTopic}>+ Add something to learn</button>
      {capture.overlay}
      <p className="sr-only" role="status">{announcement}</p>
    </>
  )
}

function ProgressRing({ progress }: { progress: HomeProgress }) {
  const circumference = 2 * Math.PI * 23
  const ratio = progress.kind === 'ratio' ? Math.max(0, Math.min(1, progress.done / progress.total)) : null
  return (
    <span className={`home-dial is-${progress.kind}`} aria-hidden="true">
      <svg viewBox="0 0 56 56" focusable="false">
        <circle className="home-dial-track" cx="28" cy="28" r="23" />
        {ratio !== null ? <circle className="home-dial-arc" cx="28" cy="28" r="23" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - ratio)} /> :
          <circle className="home-dial-stage" cx="28" cy="28" r="23" />}
      </svg>
      <span className="home-dial-mark">{progress.kind === 'repair' ? '!' : progress.kind === 'complete' ? '✓' : '·'}</span>
    </span>
  )
}

/** The Argus wordmark anchors the page while the docket below names the work. */
function Head({
  stamp,
  onProfile,
}: {
  stamp: string
  onProfile: () => void
}) {
  return (
    <div className="today-head">
      <h1 className="today-brand" aria-live="polite">
        ARGUS
      </h1>
      <div className="today-head-tools">
        <p className="today-date tabular">{stamp}</p>
        <button
          className="today-profile"
          type="button"
          aria-label="Open profile"
          title="Profile"
          onClick={onProfile}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
            <circle cx="12" cy="8" r="3.25" />
            <path d="M5.75 19c.6-3.25 2.68-5 6.25-5s5.65 1.75 6.25 5" />
          </svg>
        </button>
      </div>
    </div>
  )
}
