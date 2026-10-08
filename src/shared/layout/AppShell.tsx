import type { ReactNode } from 'react'
import type { View } from '../../app/routing/routes'
import { isDemoBuild } from '../../demo/demoMode'

type NavView = Extract<View, 'today' | 'roles' | 'library'>

interface AppShellProps {
  /** The section to mark current. A child route passes its parent. */
  view: NavView
  onNavigate: (view: NavView) => void
  children: ReactNode
}

/**
 * Three primary destinations: Home, evidence-backed Roles, and Library.
 *
 * Home holds the topics already in motion. Library is everything owned,
 * including the permanent completion record. Progress used to sit here and was a
 * third projection of the derivation Library already shelves; utility controls
 * likewise do not earn a permanent destination.
 *
 * Profile is reached from Home and marks Home current while it is open.
 */
const NAV: { id: NavView; label: string; path: string }[] = [
  { id: 'today', label: 'Home', path: 'M4 7h16M4 12h16M4 17h9' },
  { id: 'roles', label: 'Roles', path: 'M12 3l3 3 4.3.7-.7 4.3 2.4 4-3.8 2.1L12 21l-3.2-4.9L5 14l2.4-4-.7-4.3L11 6zM9 10l3 2 3-2' },
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
        {isDemoBuild() && (
          <p className="demo-note" role="note">
            <strong>Demo</strong> Sample progress. Nothing is saved; reloading resets it.
          </p>
        )}
        {children}
      </main>
    </div>
  )
}
