import type { ReactNode } from 'react'
import type { View } from '../../lib/types'

interface AppShellProps {
  view: View
  onNavigate: (view: View) => void
  children: ReactNode
}

const NAV: { id: View; label: string; path: string }[] = [
  { id: 'today', label: 'Today', path: 'M4 7h16M4 12h16M4 17h9' },
  { id: 'library', label: 'Library', path: 'M5 4h5v16H5zM14 4h5v16h-5' },
  { id: 'progress', label: 'Progress', path: 'M4 19V9m5 10V5m5 14v-7m5 7V8' },
  { id: 'data', label: 'Data', path: 'M12 4v11m0 0 4-4m-4 4-4-4M5 19h14' },
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
