import type { ReactNode } from 'react'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="./" aria-label="Argus home">
          <img src="./argus-icon-192.png" width="38" height="38" alt="" />
          <span>
            <strong>ARGUS</strong>
            <small>Finite competence</small>
          </span>
        </a>
      </header>
      <main>{children}</main>
    </div>
  )
}
