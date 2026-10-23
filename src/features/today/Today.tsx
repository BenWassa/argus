import { useState, type CSSProperties } from 'react'
import { useLibrary } from '../../services/library/LibraryProvider'
import { dueEntries, journeysFor, type JourneyEntry, type TopicAction } from '../../domain/study/journey'
import { hasStarted } from '../../domain/study/libraryGroups'
import { homeProgress, homeReadout, type HomeProgress } from '../../domain/study/home'
import { useTopicCapture } from '../library/useTopicCapture'
import { Plate } from '../../shared/ui/Plate'
import { ScreenHeader } from '../../shared/ui/ScreenHeader'
import { TopicGlyph } from '../library/TopicGlyph'
import { topicIcon } from '../library/topicIcon'
import './Today.css'

/** Continue unfinished learning in the shared priority order. */
export function inProgress(entries: JourneyEntry[]): JourneyEntry[] {
  return dueEntries(entries.filter((entry) => entry.topic.items.length > 0 && hasStarted(entry)))
}

function militaryDate(date: Date, year = true): string {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]}${year ? ` ${date.getFullYear()}` : ''}`
}

interface TodayProps {
  onContinue?: (action: TopicAction, topicId: string) => void
  onOpenTopic: (topicId: string) => void
  onGoToLibrary: () => void
  onAuthorTopic: () => void
  onOpenProfile: () => void
}

/** Home keeps the historical `today` route so restored history stays valid. */
export function Today({ onContinue, onOpenTopic, onGoToLibrary, onAuthorTopic, onOpenProfile }: TodayProps) {
  const { topics } = useLibrary()
  const [announcement, setAnnouncement] = useState('')
  const capture = useTopicCapture(() => setAnnouncement('Added to Want to learn.'))
  const entries = journeysFor(topics)
  const readout = homeReadout(entries)
  const active = inProgress(entries)

  return (
    <>
      <Head stamp={militaryDate(new Date())} onProfile={onOpenProfile} />
      <Plate variant="raised" className="home-panel">
        <dl className="home-readout" aria-label="Learning record">
          <div><dt>Completed</dt><dd className="tabular"><ReadoutIcon kind="completed" />{readout.completed}</dd></div>
          <div><dt>In progress</dt><dd className="tabular"><ReadoutIcon kind="progress" />{readout.inProgress}</dd></div>
          <div><dt>Last active</dt><dd className="tabular"><ReadoutIcon kind="active" />
            {readout.lastActive ? <time dateTime={readout.lastActive}>{militaryDate(new Date(readout.lastActive), false)}</time> : '—'}
          </dd></div>
        </dl>
      </Plate>
      {active.length > 0 ? (
        <section className="home-active" aria-labelledby="home-active-heading">
          <div className="home-section-bar">
            <h2 id="home-active-heading">Active topics</h2>
            {active.length > 3 && <button className="quiet" type="button" onClick={onGoToLibrary}>See all</button>}
          </div>
          <ul className="index docket">
            {active.slice(0, 3).map((entry) => (
              <li className="today-entry" key={entry.topic.id}>
                <button type="button" className="index-row today-plate plate plate-raised" style={{ '--track-hue': `var(--${entry.topic.track})` } as CSSProperties} onClick={() => onOpenTopic(entry.topic.id)}>
                  <ProgressRing topicId={entry.topic.id} progress={homeProgress(entry.topic, entry.journey)} />
                  <span className="home-topic-copy">
                    <span className="index-title today-plate-title">{entry.topic.title}</span>
                    <span className="home-topic-reading">{homeProgress(entry.topic, entry.journey).label}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <Plate className="home-empty">
          <p className="today-note">{topics.some((topic) => topic.items.length === 0)
            ? 'Add prompts and answers to your topics in the Library before testing.'
            : readout.completed > 0
            ? 'Everything you have started is learned.'
            : 'Nothing in progress.'}</p>
          <button className="ghost" type="button" onClick={onGoToLibrary}>Open Library</button>
        </Plate>
      )}
      {active[0] ? <button className="home-add" type="button" onClick={() => onContinue ? onContinue(active[0].journey.action, active[0].topic.id) : onOpenTopic(active[0].topic.id)}>Continue: {active[0].topic.title}</button>
        : <button className="home-add" type="button" onClick={capture.available ? capture.openCapture : onAuthorTopic}>+ Add something to learn</button>}
      {capture.overlay}
      <p className="sr-only" role="status">{announcement}</p>
    </>
  )
}

function ProgressRing({ progress, topicId }: { progress: HomeProgress; topicId: string }) {
  const circumference = 2 * Math.PI * 23
  const ratio = progress.kind === 'ratio' ? Math.max(0, Math.min(1, progress.done / progress.total)) : null
  return (
    <span className={`home-dial is-${progress.kind}`} aria-hidden="true">
      <svg viewBox="0 0 56 56" focusable="false">
        <circle className="home-dial-track" cx="28" cy="28" r="23" />
        {ratio !== null ? <circle className="home-dial-arc" cx="28" cy="28" r="23" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - ratio)} /> :
          <circle className="home-dial-stage" cx="28" cy="28" r="23" />}
      </svg>
      <span className="home-dial-mark">{topicIcon(topicId) ? <TopicGlyph topicId={topicId} /> : <svg className="home-topic-fallback" viewBox="0 0 24 24" focusable="false"><path d="M6 4h9l3 3v13H6zM14 4v4h4M9 12h6M9 16h6" /></svg>}</span>
    </span>
  )
}

/** The Argus wordmark anchors the page while the plates below name the work. */
function Head({
  stamp,
  onProfile,
}: {
  stamp: string
  onProfile: () => void
}) {
  return (
    <ScreenHeader className="today-head" titleClassName="today-brand" title="ARGUS">
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
    </ScreenHeader>
  )
}

/** Lucide circle-check, circle-play and clock, retrieved with Better Icons.
 * ISC notice and pinned upstream licence: src/shared/layout/AppShell.tsx.
 * Source icons: https://github.com/lucide-icons/lucide/tree/02eb9161b57917ccaa262f1bf070507cddde3b08/icons
 * Adapted to the app's 1.6px outline. */
function ReadoutIcon({ kind }: { kind: 'completed' | 'progress' | 'active' }) {
  return <svg className="home-readout-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="10" />
    {kind === 'completed' ? <path d="m16 9-5.5 5.5L8 12" />
      : kind === 'progress' ? <path d="m10 8 6 4-6 4z" /> : <path d="M12 6v6l4 2" />}
  </svg>
}
