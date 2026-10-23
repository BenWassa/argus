import { useLayoutEffect, useRef, type ReactNode } from 'react'
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
/*
 * Home and Roles: Lucide house / medal, retrieved with Better Icons.
 * https://github.com/lucide-icons/lucide/blob/02eb9161b57917ccaa262f1bf070507cddde3b08/icons/house.svg
 * https://github.com/lucide-icons/lucide/blob/02eb9161b57917ccaa262f1bf070507cddde3b08/icons/medal.svg
 * Adapted to the navigation's existing 1.6px outline; circle expressed as arcs.
 * Licence: https://github.com/lucide-icons/lucide/blob/02eb9161b57917ccaa262f1bf070507cddde3b08/LICENSE
 * ISC License — Copyright (c) 2026 Lucide Icons and Contributors
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */
const NAV: { id: NavView; label: string; path: string }[] = [
  { id: 'today', label: 'Home', path: 'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { id: 'roles', label: 'Roles', path: 'M7.21 15L2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15M11 12L5.12 2.2M13 12l5.88-9.8M8 7h8M17 17a5 5 0 1 1-10 0 5 5 0 0 1 10 0M12 18v-2h-.5' },
  { id: 'library', label: 'Library', path: 'M5 4h5v16H5zM14 4h5v16h-5' },
]

export function AppShell({ view, onNavigate, children }: AppShellProps) {
  const shell = useRef<HTMLDivElement>(null)
  const nav = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const node = nav.current
    if (!node) return
    // The inset navigation grows with text size. Its real top edge, including
    // safe-area spacing, is the boundary for every docked mobile control.
    const measure = () => {
      const clearance = window.innerWidth >= 980
        ? 0 : window.innerHeight - node.getBoundingClientRect().top
      shell.current?.style.setProperty('--nav-clearance', `${clearance}px`)
    }
    measure()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(node)
    window.addEventListener('resize', measure)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <div className="app-shell" ref={shell}>
      <nav ref={nav} className="nav" aria-label="Sections">
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
