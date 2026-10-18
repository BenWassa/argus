import { useEffect, useRef, type ComponentPropsWithoutRef, type CSSProperties, type ReactNode } from 'react'
import './SessionFrame.css'

/** Morse modes take their own colour; every other kind takes the action colour unless given a pair. */
export type SessionKind = 'key' | 'listen' | 'read' | 'free' | 'lesson' | 'checkpoint' | 'test' | 'practice'

const MODE_KINDS = new Set<SessionKind>(['key', 'listen', 'read', 'free'])

interface SessionFrameProps extends ComponentPropsWithoutRef<'section'> {
  kind: SessionKind
  title: string
  progress?: { current: number; total: number }
  onClose: () => void
  /** Session-level controls under the header, such as Listen's spacing. */
  toolbar?: ReactNode
  /** A solid fill token for this session, such as `var(--learning)`; overrides the kind's colour. */
  colour?: string
  /** The ink that reads on `colour`. */
  ink?: string
}

function sessionColours(kind: SessionKind): { colour: string; ink: string } {
  const token = MODE_KINDS.has(kind) ? `mode-${kind}` : 'action'
  return { colour: `var(--${token}, var(--accent))`, ink: `var(--${token}-ink, var(--accent-ink))` }
}

/** Shared session chrome. Progress describes this run, never learning evidence. */
export function SessionFrame({ kind, title, progress, onClose, toolbar, colour, ink, children, className = '', style, ...props }: SessionFrameProps) {
  const derived = sessionColours(kind)
  const total = Math.max(0, progress?.total ?? 0)
  const current = Math.min(total, Math.max(0, progress?.current ?? 0))
  return (
    <section {...props} className={`session session-frame ${className}`} data-session-kind={kind}
      style={{ '--session-colour': colour ?? derived.colour, '--session-ink': ink ?? derived.ink, ...style } as CSSProperties}>
      <header className="session-frame-header">
        <span className="session-frame-title">{title}</span>
        <div className="session-frame-progress" role={progress ? 'progressbar' : undefined}
          aria-label={progress ? `${current} of ${total}` : undefined} aria-hidden={progress ? undefined : true}
          aria-valuemin={progress ? 0 : undefined} aria-valuemax={progress ? total : undefined} aria-valuenow={progress ? current : undefined}>
          <span style={{ transform: `scaleX(${total ? current / total : 0})` }} />
        </div>
        <button className="ghost small" type="button" onClick={onClose}>Close</button>
      </header>
      {toolbar && <div className="session-frame-toolbar">{toolbar}</div>}
      {children}
    </section>
  )
}

/** A static verdict remains legible when the brief feedback motion is disabled. */
export function SessionCorrect({ target, announce = true }: { target?: string; announce?: boolean }) {
  return <div className="session-correct" role={announce ? "status" : undefined}><span aria-hidden="true">{target && `${target} `}✓</span><span className="sr-only">Correct</span></div>
}

/**
 * The end of a run: one reading and its actions. `onAgain` is optional because
 * not every run can be repeated (a scored Test); without it, Done is the one
 * primary action. The labels default to Again and Done and may name a
 * consequence instead, such as "Practise 2 items".
 */
export function RoundResult({ correct, total, onAgain, onDone, extra, againLabel = 'Again', doneLabel = 'Done' }: {
  correct: number; total: number; onAgain?: () => void; onDone: () => void; extra?: ReactNode; againLabel?: string; doneLabel?: string
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [])
  return <div className="session-round-result">
    <h1 ref={heading} tabIndex={-1} className="session-round-reading" aria-label={`${correct} of ${total} correct`}>{correct} / {total}</h1>
    {extra}
    <div className="session-round-actions">
      {onAgain && <button type="button" onClick={onAgain}>{againLabel}</button>}
      <button type="button" className={onAgain ? 'ghost' : undefined} onClick={onDone}>{doneLabel}</button>
    </div>
  </div>
}
