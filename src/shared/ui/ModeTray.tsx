import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import './ModeTray.css'

export interface ModeTile {
  id: string
  /** One or two words; the tile's whole accessible name. */
  label: string
  /** What the mode puts in front of you first: a letter, a waveform, a pattern. */
  stimulus: ReactNode
  /** A solid fill token, such as `var(--mode-key)`. */
  colour: string
  /** The ink token that reads on `colour`, such as `var(--mode-key-ink)`. */
  ink: string
  disabled?: boolean
  onSelect: () => void
}

export interface ModeTrayProps {
  tiles: ModeTile[]
  /** The navigation landmark's name. */
  label: string
  /** Extra class on the dock, the element that is fixed on phones. */
  className?: string
}

/**
 * The bottom tray of solid stimulus tiles. On phones it is fixed above the
 * navigation and reserves its own height on its parent (`--mode-tray-height`),
 * so the screen's content never hides beneath it; on desktop it sits in flow.
 */
export function ModeTray({ tiles, label, className = '' }: ModeTrayProps) {
  const dock = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const node = dock.current
    const host = node?.parentElement
    if (!node || !host) return
    const reserve = () => {
      const fixed = typeof getComputedStyle === 'function' && getComputedStyle(node).position === 'fixed'
      host.style.setProperty('--mode-tray-height', `${fixed ? node.getBoundingClientRect().height : 0}px`)
    }
    reserve()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(reserve)
    observer?.observe(node)
    window.addEventListener('resize', reserve)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', reserve)
      host.style.removeProperty('--mode-tray-height')
    }
  }, [])

  return (
    <div ref={dock} className={`mode-tray-dock${className ? ` ${className}` : ''}`}>
      <nav className="mode-tray" aria-label={label}>
        {tiles.map((tile) => (
          <button key={tile.id} type="button" className="mode-tray-tile" data-tile-id={tile.id}
            style={{ '--tile-fill': tile.colour, '--tile-ink': tile.ink } as CSSProperties}
            aria-disabled={tile.disabled || undefined}
            onClick={() => { if (!tile.disabled) tile.onSelect() }}>
            <span className="mode-tray-stimulus" aria-hidden="true">{tile.stimulus}</span>
            <span className="mode-tray-label">{tile.label}</span>
            {tile.disabled && <svg className="mode-tray-lock" aria-hidden="true" focusable="false" width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
              <path d="M2 6V4a4 4 0 0 1 8 0v2h1v8H1V6h1Zm2 0h4V4a2 2 0 0 0-4 0v2Z" />
            </svg>}
          </button>
        ))}
      </nav>
    </div>
  )
}
