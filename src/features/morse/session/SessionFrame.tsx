import { useEffect, useRef, type ComponentPropsWithoutRef, type CSSProperties } from 'react'
import './SessionFrame.css'

type SessionKind = 'key' | 'listen' | 'read' | 'free' | 'lesson' | 'checkpoint'

interface SessionFrameProps extends ComponentPropsWithoutRef<'section'> {
  kind: SessionKind
  title: string
  progress?: { current: number; total: number }
  onClose: () => void
}

/** Shared session chrome. Progress describes this run, never learning evidence. */
export function SessionFrame({ kind, title, progress, onClose, children, className = '', style, ...props }: SessionFrameProps) {
  const mode = kind === 'lesson' || kind === 'checkpoint' ? 'action' : `mode-${kind}`
  const total = Math.max(0, progress?.total ?? 0)
  const current = Math.min(total, Math.max(0, progress?.current ?? 0))
  return (
    <section {...props} className={`session session-frame ${className}`} data-session-kind={kind}
      style={{ '--session-colour': `var(--${mode}, var(--accent))`, '--session-ink': `var(--${mode}-ink, var(--accent-ink))`, ...style } as CSSProperties}>
      <header className="session-frame-header">
        <span className="session-frame-title">{title}</span>
        <div className="session-frame-progress" role={progress ? 'progressbar' : undefined}
          aria-label={progress ? `${current} of ${total}` : undefined} aria-hidden={progress ? undefined : true}
          aria-valuemin={progress ? 0 : undefined} aria-valuemax={progress ? total : undefined} aria-valuenow={progress ? current : undefined}>
          <span style={{ transform: `scaleX(${total ? current / total : 0})` }} />
        </div>
        <button className="ghost small" type="button" onClick={onClose}>Close</button>
      </header>
      {children}
    </section>
  )
}

/** A static verdict remains legible when the brief feedback motion is disabled. */
export function SessionCorrect({ target, announce = true }: { target?: string; announce?: boolean }) {
  return <div className="session-correct" role={announce ? "status" : undefined}><span aria-hidden="true">{target && `${target} `}✓</span><span className="sr-only">Correct</span></div>
}

export function RoundResult({ correct, total, onAgain, onDone }: { correct: number; total: number; onAgain: () => void; onDone: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [])
  return <div className="session-round-result">
    <h1 ref={heading} tabIndex={-1} className="session-round-reading" aria-label={`${correct} of ${total} correct`}>{correct} / {total}</h1>
    <div className="session-round-actions"><button type="button" onClick={onAgain}>Again</button><button type="button" className="ghost" onClick={onDone}>Done</button></div>
  </div>
}
