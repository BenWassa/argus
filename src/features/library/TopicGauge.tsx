import type { TopicJourney } from '../../domain/study/journey'
import type { Topic } from '../../domain/library/topic'
import { gaugeFill, gaugeLabel, gaugeReading } from './gaugeReading'

/**
 * One topic's progress, as an instrument reads it.
 *
 * The track is cut into the chassis rather than laid on it — `--field` and
 * `--engrave` exist for exactly this and the tokens say so — and it fills in
 * steel. Never the accent, and never a semantic colour: lighting one would
 * light every row, and a red/green fill would turn a schedule into a
 * scoreboard. Completion is the one state that changes the fill, to the settled
 * slate that means "no longer the thing in progress".
 *
 * `variant` is density, not meaning. A row shows the bar with its reading
 * available to a screen reader, because a row is already carrying four pieces
 * of text and a fifth would crowd the title off a phone. The topic page shows
 * the same reading in words, because that page is about this one topic and has
 * the room to say what it is measuring.
 */
export function TopicGauge({
  topic,
  journey,
  variant,
  caption,
}: {
  topic: Topic
  journey: TopicJourney
  variant: 'row' | 'page'
  /** A fuller line in the same units, replacing the reading on the page. */
  caption?: string | null
}) {
  const reading = gaugeReading(topic, journey)
  const fill = gaugeFill(reading)
  const label = gaugeLabel(reading)

  // Nothing truthful to report. Rendering an empty track would imply a measure
  // that is running at zero, which is a different and false statement.
  if (reading.kind === 'none' || fill === null || label === null) return null

  const track = (
    <span className={`gauge-track gauge-${reading.kind}`} aria-hidden="true">
      <span className="gauge-fill" style={{ width: `${Math.round(fill * 100)}%` }} />
    </span>
  )

  if (variant === 'row') {
    return (
      <span className="gauge gauge-row">
        {track}
        <span className="sr-only">{label}</span>
      </span>
    )
  }

  return (
    <div className="gauge gauge-page">
      {track}
      <p className="gauge-label tabular">{caption ?? label}</p>
    </div>
  )
}
