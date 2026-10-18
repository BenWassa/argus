import type { CSSProperties } from 'react'
import type { TopicJourney } from '../../domain/study/journey'
import type { Topic } from '../../domain/library/topic'
import { gaugeFill, gaugeLabel, gaugeReading } from './gaugeReading'

/**
 * One topic's progress, as an instrument reads it.
 *
 * The track is cut into the chassis rather than laid on it (`--field` and
 * `--engrave`) and it fills in a solid colour: the topic's track colour
 * (`--track-hue`), so a row's gauge, its icon and its stud read as the same
 * topic. Never the action colour, and never a semantic one: lighting one would
 * light every row, and a red/green fill would turn a schedule into a
 * scoreboard. A track is a category, not a grade, so this colours the schedule
 * without turning it into a scoreboard.
 *
 * Completion keeps the track colour and a full bar, and its reading leads with
 * a check (`is-banked`), so "banked" is a glyph and a word, not a change of
 * colour.
 *
 * `variant` is density, not meaning. A row sets the reading beside a short bar,
 * because a bar with no units on a list of titles is a shape to decode. The
 * topic page sets it beneath a full-width one, and may replace it with a fuller
 * caption in the same units. The legacy `bare` variant keeps its reading for screen readers. Home now
 * uses a separate circular progress instrument.
 */
export function TopicGauge({
  topic,
  journey,
  variant,
  caption,
}: {
  topic: Topic
  journey: TopicJourney
  variant: 'row' | 'page' | 'bare'
  /** A fuller line in the same units, replacing the reading on the page. */
  caption?: string | null
}) {
  const reading = gaugeReading(topic, journey)
  const fill = gaugeFill(reading)
  const label = gaugeLabel(reading)

  // Nothing truthful to report. Rendering an empty track would imply a measure
  // that is running at zero, which is a different and false statement.
  if (reading.kind === 'none' || fill === null || label === null) return null

  const labelClass = `gauge-label tabular${reading.kind === 'complete' ? ' is-banked' : ''}`
  const hue = { '--track-hue': `var(--${topic.track})` } as CSSProperties

  const track = (
    <span className={`gauge-track gauge-${reading.kind}`} aria-hidden="true">
      <span className="gauge-fill" style={{ width: `${Math.round(fill * 100)}%` }} />
    </span>
  )

  if (variant === 'bare') {
    return (
      <span className="gauge gauge-bare" style={hue}>
        {track}
        <span className="sr-only">{label}</span>
      </span>
    )
  }

  if (variant === 'row') {
    return (
      <span className="gauge gauge-row" style={hue}>
        {track}
        <span className={labelClass}>{label}</span>
      </span>
    )
  }

  return (
    <div className="gauge gauge-page" style={hue}>
      {track}
      <p className={labelClass}>{caption ?? label}</p>
    </div>
  )
}
