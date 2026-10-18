import type { CSSProperties } from 'react'
import { topicIcon } from './topicIcon'

/**
 * A shipped topic's recognition glyph, painted in a solid colour.
 *
 * The SVGs are drawn as a shape only; their stroke colour in the file is not
 * used. The shape is a mask and the fill is the caller's `--track-hue` (or
 * `--topic-track`), so the glyph reads in the topic's track colour as one solid
 * fill. Returns null for a topic without a shipped icon, so the title-led
 * layout stays intact.
 */
export function TopicGlyph({ topicId, className }: { topicId: string; className?: string }) {
  const src = topicIcon(topicId)
  if (!src) return null
  return (
    <span
      className={`topic-icon${className ? ` ${className}` : ''}`}
      style={{ '--topic-icon-src': `url("${src}")` } as CSSProperties}
      aria-hidden="true"
    />
  )
}
