import { useState } from 'react'
import type { Visual } from '../../domain/visual/visual'
import { FigureView } from './FigureView'
import './Visual.css'

/** A shipped local file, resolved against the app base so it works offline. */
function mediaUrl(src: string): string {
  return `${import.meta.env.BASE_URL}${src.replace(/^\//, '')}`
}

interface VisualViewProps {
  visual: Visual
  /**
   * Whether the caption and credit are shown. A scored item's stimulus leaves
   * them off: a caption is teaching text and could state the answer.
   */
  showCaption?: boolean
  /** A smaller rendering for lists of items. */
  compact?: boolean
}

/**
 * One picture and the text that makes it usable without it (#146).
 *
 * The picture never stands alone: the required alternative text is its name to
 * assistive technology, and if a local image cannot be loaded the alternative
 * is shown as visible text in its place, so the learner is never left with a
 * blank box and no information.
 */
export function VisualView({ visual, showCaption = true, compact = false }: VisualViewProps) {
  const [failed, setFailed] = useState(false)
  const { source } = visual

  return (
    <figure className={`visual${compact ? ' is-compact' : ''}`}>
      <div
        className="visual-frame"
        role="img"
        aria-label={visual.alt}
        style={source.kind === 'image' ? { aspectRatio: `${source.width} / ${source.height}` } : undefined}
      >
        {source.kind === 'figure' ? (
          <FigureView figure={source.figure} />
        ) : failed ? (
          <p className="visual-missing">{visual.alt}</p>
        ) : (
          <img
            className="visual-image"
            src={mediaUrl(source.src)}
            width={source.width}
            height={source.height}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      {showCaption && (visual.caption || visual.credit) && (
        <figcaption className="visual-caption">
          {visual.caption && <span>{visual.caption}</span>}
          {visual.credit && <span className="visual-credit">{visual.credit}</span>}
        </figcaption>
      )}
    </figure>
  )
}
