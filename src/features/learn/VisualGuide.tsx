import { useRef, useState } from 'react'
import type { LearnEntry } from '../../domain/learning/content'
import { VisualView } from '../visual/VisualView'
import './VisualGuide.css'

/** A finite, manual-only field guide. Scroll snapping never requires motion. */
export function VisualGuide({ entries }: { entries: LearnEntry[] }) {
  const rail = useRef<HTMLOListElement>(null)
  const [active, setActive] = useState(0)
  function go(index: number) {
    const list = rail.current
    const panel = list?.children[index] as HTMLElement | undefined
    if (!list || !panel) return
    list.scrollTo({ left: panel.offsetLeft - (list.children[0] as HTMLElement).offsetLeft, behavior: 'instant' })
    setActive(index)
  }
  return (
    <div className="visual-guide" role="region" aria-label="Visual field guide">
      <ol className="visual-guide-rail" ref={rail} tabIndex={0}
        aria-label="Guide images, use left and right arrow keys to browse"
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
          event.preventDefault()
          go(Math.max(0, Math.min(entries.length - 1, active + (event.key === 'ArrowRight' ? 1 : -1))))
        }}
        onScroll={() => {
          const list = rail.current
          if (!list) return
          const first = (list.children[0] as HTMLElement).offsetLeft
          let closest = 0
          let distance = Infinity
          Array.from(list.children).forEach((child, index) => {
            const candidate = Math.abs((child as HTMLElement).offsetLeft - first - list.scrollLeft)
            if (candidate < distance) { distance = candidate; closest = index }
          })
          setActive(closest)
        }}>
        {entries.map((entry) => (
          <li className="visual-guide-panel" key={entry.marker}>
            <h4><span className="visual-guide-marker">{entry.marker}</span> {entry.title}</h4>
            {entry.visual && <VisualView visual={entry.visual} />}
            {entry.meta && <p className="visual-guide-meta">{entry.meta}</p>}
            <dl>{entry.fields.map((field) => <div key={field.label}><dt>{field.label}</dt><dd>{field.text}</dd></div>)}</dl>
            {entry.note && <p>{entry.note}</p>}
          </li>
        ))}
      </ol>
      <div className="visual-guide-controls">
        <button type="button" className="btn btn-ghost" aria-label="Previous guide image" disabled={active === 0} onClick={() => go(active - 1)}>Previous</button>
        <p className="visual-guide-position" aria-live="polite">{entries[active].marker} · {active + 1} of {entries.length}</p>
        <button type="button" className="btn btn-ghost" aria-label="Next guide image" disabled={active === entries.length - 1} onClick={() => go(active + 1)}>Next</button>
      </div>
      <div className="visual-guide-steps" aria-label="Choose a guide image">
        {entries.map((entry, index) => <button type="button" key={entry.marker} aria-label={`Show ${entry.marker}: ${entry.title}`} aria-current={active === index ? 'step' : undefined} onClick={() => go(index)}>{entry.marker}</button>)}
      </div>
    </div>
  )
}
