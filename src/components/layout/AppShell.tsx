import type { ReactNode } from 'react'
import type { View } from '../../lib/types'

type NavView = Extract<View, 'today' | 'library'>

interface AppShellProps {
  /** The section to mark current. A child route passes its parent. */
  view: NavView
  onNavigate: (view: NavView) => void
  children: ReactNode
}

/**
 * Two destinations, and they are the two the learner actually has.
 *
 * Today is the docket: what the schedule wants now. Library is everything owned,
 * including the permanent completion record. Progress used to sit here and was a
 * third projection of the derivation Library already shelves; Data used to sit
 * here and is used a handful of times a year. Both were spending half the bottom
 * bar on under five percent of sessions.
 *
 * Data keeps its route and reaches it from Library, exactly as Topic does, and
 * marks Library current while it is open.
 */
const NAV: { id: NavView; label: string; path: string }[] = [
  { id: 'today', label: 'Today', path: 'M4 7h16M4 12h16M4 17h9' },
  { id: 'library', label: 'Library', path: 'M5 4h5v16H5zM14 4h5v16h-5' },
]

export function AppShell({ view, onNavigate, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <nav className="nav" aria-label="Sections">
        <p className="brand">
          <span className="brand-name">Argus</span>
          <span className="brand-note">Closed-scope skill library</span>
        </p>
        <ul>
          {NAV.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="nav-btn"
                aria-current={view === item.id ? 'page' : undefined}
                onClick={() => onNavigate(item.id)}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
                  <path
                    d={item.path}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <main id="main" tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}
