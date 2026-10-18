import type { ReactNode, Ref } from 'react'
import './ScreenHeader.css'

export interface ScreenHeaderProgress {
  value: number
  max: number
  /** The bar's accessible name, such as "12 of 26 letters". */
  label: string
}

export interface ScreenHeaderProps {
  title: ReactNode
  /** The h1, focusable by script (tabIndex -1) so a screen can land on it. */
  ref?: Ref<HTMLHeadingElement>
  onBack?: () => void
  backLabel?: string
  /** A decorative mark before the title, such as a topic glyph. */
  glyph?: ReactNode
  progress?: ScreenHeaderProgress
  /** A short mono reading beside the bar, or under the title without one. */
  readout?: ReactNode
  /** Trailing quiet controls opposite Back. */
  actions?: ReactNode
  /** Extra header content under the progress, such as one quiet action. */
  children?: ReactNode
  className?: string
  titleClassName?: string
}

/** Back and quiet actions, one title, and an optional settled bar with its reading. */
export function ScreenHeader({
  title, ref, onBack, backLabel = 'Back to previous screen', glyph, progress, readout, actions, children,
  className = '', titleClassName = '',
}: ScreenHeaderProps) {
  const max = Math.max(0, progress?.max ?? 0)
  const value = Math.min(max, Math.max(0, progress?.value ?? 0))
  const readoutNode = readout === undefined || readout === null ? null
    : <span className="screen-header-readout tabular">{readout}</span>
  return (
    <header className={`screen-header${className ? ` ${className}` : ''}`}>
      {(onBack || actions) && <div className="screen-header-bar">
        {onBack && <button className="quiet screen-header-back" type="button" aria-label={backLabel} onClick={onBack}>
          <span aria-hidden="true">←</span> Back
        </button>}
        {actions && <div className="screen-header-actions">{actions}</div>}
      </div>}
      <div className="screen-header-title-row">
        {glyph && <span className="screen-header-glyph" aria-hidden="true">{glyph}</span>}
        <h1 ref={ref} tabIndex={-1} className={`screen-header-title${titleClassName ? ` ${titleClassName}` : ''}`}>{title}</h1>
      </div>
      {progress ? <div className="screen-header-progress">
        <div className="screen-header-track" role="img" aria-label={progress.label}>
          <span style={{ width: `${max ? value / max * 100 : 0}%` }} />
        </div>
        {readoutNode}
      </div> : readoutNode}
      {children}
    </header>
  )
}
