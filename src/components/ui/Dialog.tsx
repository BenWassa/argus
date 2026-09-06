import { useEffect, useId, useRef, type ReactNode } from 'react'
import { registerBackBlocker } from '../../lib/navigation'

interface DialogProps {
  title: string
  onClose: () => void
  children: ReactNode
  /** Named so the control says what it closes, never a bare cross. */
  closeLabel?: string
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Dialog({ title, onClose, children, closeLabel }: DialogProps) {
  const panel = useRef<HTMLDivElement>(null)
  const opener = useRef<Element | null>(null)
  const titleId = useId()

  // Held in a ref so the setup effect runs exactly once. Callers pass inline
  // arrows; depending on the prop directly would re-run focus entry on render.
  const close = useRef(onClose)
  close.current = onClose

  useEffect(() => {
    opener.current = document.activeElement
    const node = panel.current
    node?.querySelector<HTMLElement>(FOCUSABLE)?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Browser/system Back is another close affordance for a modal surface. The
    // App history adapter bounces the attempted route pop, while this callback
    // reuses the dialog's existing close policy (including TopicForm's dirty
    // discard safeguard) instead of inventing a parallel Android path.
    const unregisterBack = registerBackBlocker(() => {
      close.current()
      return true
    })

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        close.current()
        return
      }
      if (e.key !== 'Tab' || !node) return

      // Keep Tab inside the dialog. Without this, focus walks out behind an
      // aria-modal surface and the rest of the page is silently reachable.
      const targets = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (targets.length === 0) return
      const first = targets[0]
      const last = targets[targets.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      unregisterBack()
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = previousOverflow
      // Focus return runs on the next frame, after the list behind the dialog
      // has re-rendered, so the stored node is the live one and not a detached
      // copy left over from the render that opened the dialog.
      const target = opener.current
      requestAnimationFrame(() => {
        if (target instanceof HTMLElement && target.isConnected) target.focus()
        else document.getElementById('main')?.focus()
      })
    }
  }, [])

  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panel}
      >
        <div className="sheet-head">
          <h2 id={titleId}>{title}</h2>
          <button
            className="ghost icon"
            type="button"
            onClick={onClose}
            aria-label={closeLabel ?? `Close ${title.toLowerCase()}`}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}
