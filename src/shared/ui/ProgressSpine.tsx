import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import './ProgressSpine.css'

/**
 * Where a row sits on the line. `position` is "you are here": it marks and
 * scrolls, it does not make the row the only thing to press.
 */
export type SpineState = 'done' | 'position' | 'reached' | 'locked' | 'repair'

export interface SpineRow {
  id: string
  /** Round for a step; square for a test or milestone. */
  shape: 'round' | 'square'
  /** The node's mark: a number, a tick, a short code or a small solid glyph. */
  mark?: ReactNode
  state: SpineState
  /** The row's main words. */
  label: ReactNode
  /** One quieter line under the label. */
  detail?: ReactNode
  /** Content at the row's far edge. On a button row it must not be interactive. */
  trailing?: ReactNode
  /** The row's whole accessible name; the visible parts are hidden from it. */
  accessibleLabel: string
  /** Called on tap unless the row is locked. */
  onSelect?: () => void
  /** Called on tap of a locked row, so the screen can say why in one line. */
  onLockedSelect?: () => void
  /** A non-button row (role group) whose trailing content holds its own controls. */
  group?: boolean
  /** A full-width plate crossing the spine, for milestones. */
  plate?: boolean
  className?: string
  /** Content under the row inside the same list item, such as one quiet action. */
  after?: ReactNode
  /**
   * One small secondary control drawn inside the row's plate, under its words.
   * It sits outside the row button (controls never nest), and stays usable
   * while the row is locked.
   */
  aside?: ReactNode
}

export interface ProgressSpineProps {
  rows: SpineRow[]
  /** The list's accessible name. */
  label: string
  /** The row the spine is filled to and scrolled to on arrival. */
  positionId?: string
  /** The position row's name on a return pill shown while it is off screen; omit for no pill. */
  jump?: string
  className?: string
}

const SCROLL: ScrollIntoViewOptions = { block: 'center', behavior: 'instant' }

/** One straight line, top to bottom: done in the action colour, ahead in --spine-ahead. */
export function ProgressSpine({ rows, label, positionId: positionProp, jump, className = '' }: ProgressSpineProps) {
  const listRef = useRef<HTMLOListElement>(null)
  const positionRef = useRef<HTMLElement | null>(null)
  const [direction, setDirection] = useState<'↑' | '↓' | null>(null)
  const signature = rows.map((row) => `${row.id}:${row.state}`).join('|')
  const positionId = positionProp ?? rows.find((row) => row.state === 'position')?.id
  const position = rows.find((row) => row.id === positionId)
  const lastDone = [...rows].reverse().find((row) => row.state === 'done')
  const filledTo = position?.id ?? lastDone?.id
  const offersJump = jump !== undefined && Boolean(position)

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const measure = () => {
      const nodes = [...list.querySelectorAll<HTMLElement>('[data-spine-node]')]
      if (!nodes.length) return
      const top = list.getBoundingClientRect().top
      const centre = (element: Element) => {
        const rect = element.getBoundingClientRect()
        return rect.top + rect.height / 2 - top
      }
      const filledRow = [...list.querySelectorAll<HTMLElement>('[data-node-id]')].find((item) => item.dataset.nodeId === filledTo)
      const filled = filledRow?.querySelector('[data-spine-node]')
      list.style.setProperty('--spine-top', `${centre(nodes[0])}px`)
      list.style.setProperty('--spine-bottom', `${centre(nodes[nodes.length - 1])}px`)
      list.style.setProperty('--spine-current', `${filled ? centre(filled) : centre(nodes[0])}px`)
    }
    measure()
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    resize?.observe(list)
    window.addEventListener('resize', measure)
    return () => {
      resize?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [signature, filledTo])

  // Arrival only: the line opens at the position, without animation.
  useLayoutEffect(() => {
    positionRef.current?.scrollIntoView?.(SCROLL)
  }, [positionId])

  useLayoutEffect(() => {
    const target = positionRef.current
    if (!offersJump || !target || typeof IntersectionObserver === 'undefined') {
      setDirection(null)
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) setDirection(entry.isIntersecting ? null : entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0) ? '↑' : '↓')
    })
    observer.observe(target)
    return () => observer.disconnect()
  }, [positionId, offersJump])

  return (
    <>
      <ol className={`spine${className ? ` ${className}` : ''}`} aria-label={label} ref={listRef}>
        {rows.map((row) => {
          const locked = row.state === 'locked'
          const isPosition = row.id === positionId
          const hasAside = row.aside !== undefined && row.aside !== null
          const classes = ['spine-row', `is-${isPosition ? 'position' : row.state}`, row.plate && 'is-plate', hasAside && 'has-aside', row.className]
            .filter(Boolean).join(' ')
          const ref = isPosition ? (element: HTMLElement | null) => { positionRef.current = element } : undefined
          const content = <>
            <span className={`spine-node${row.shape === 'square' ? ' spine-node-square' : ''}`} data-spine-node="" aria-hidden="true">{row.mark}</span>
            <span className="spine-main">
              <span className="spine-label">{row.label}</span>
              {row.detail !== undefined && row.detail !== null && <span className="spine-detail">{row.detail}</span>}
            </span>
            {row.trailing !== undefined && row.trailing !== null && <span className="spine-trailing">{row.trailing}</span>}
          </>
          const control = row.group ? (
            <div className={classes} role="group" ref={ref} aria-label={row.accessibleLabel}
              aria-current={isPosition ? 'step' : undefined} aria-disabled={locked || undefined}>
              {content}
            </div>
          ) : (
            <button type="button" className={classes} ref={ref} aria-label={row.accessibleLabel}
              aria-current={isPosition ? 'step' : undefined} aria-disabled={locked || undefined}
              onClick={() => { if (locked) row.onLockedSelect?.(); else row.onSelect?.() }}>
              {content}
            </button>
          )
          return (
            <li key={row.id} data-node-id={row.id}>
              {hasAside ? <div className="spine-row-wrap">{control}<div className="spine-aside">{row.aside}</div></div> : control}
              {row.after}
            </li>
          )
        })}
      </ol>
      {offersJump && direction && <button type="button" className="spine-jump"
        onClick={() => positionRef.current?.scrollIntoView?.(SCROLL)}>
        {jump} {direction}
      </button>}
    </>
  )
}
