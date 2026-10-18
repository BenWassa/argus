// Owns the Home latency diagnostics and their formative interpretation.
import { useMemo } from 'react'
import {
  allLatencies,
  coefficientOfVariation,
  elementCountRatio,
  median,
  slowestCharacters,
  type MorseFluencyProgress,
} from '../../../domain/morse/fluency/progress'

export function FluencyDiagnostics({ store }: { store: MorseFluencyProgress }) {
  const stats = useMemo(() => {
    const latencies = allLatencies(store)
    return {
      samples: latencies.length,
      medianMs: median(latencies),
      cv: coefficientOfVariation(latencies),
      ratio: elementCountRatio(store),
      slowest: slowestCharacters(store, 3),
    }
  }, [store])

  return (
    <>
      {/*
        The diagnostic, and the reason this surface keeps statistics at all.

        Accuracy is nearly useless here — a learner who knows the alphabet gets
        almost everything right eventually, and "96%" says nothing about
        whether they are recognising or assembling. The element-count ratio
        does say it: if four-element characters cost about the same as
        two-element ones, that is recognition; if they cost twice as much, the
        learner is still counting, and no amount of accuracy hides it.
      */}
      {stats.samples >= 5 ? (
        <div className="fluency-stats">
          <h2 className="fluency-stats-title">Where you are</h2>

          {stats.medianMs !== null && (
            <p className="fluency-stat">
              <span className="fluency-stat-value tabular">
                {(stats.medianMs / 1000).toFixed(2)}s
              </span>
              <span className="fluency-stat-label">typical response</span>
            </p>
          )}

          {stats.ratio !== null && (
            <p className="fluency-stat">
              <span className="fluency-stat-value tabular">{stats.ratio.toFixed(2)}×</span>
              <span className="fluency-stat-label">
                {stats.ratio < 1.25
                  ? 'long characters cost you about the same as short ones — that is recognition'
                  : stats.ratio < 1.6
                    ? 'long characters still cost you more; the counting has not quite gone'
                    : 'long characters cost you far more, which usually means you are still counting them'}
              </span>
            </p>
          )}

          {stats.cv !== null && (
            <p className="fluency-stat">
              <span className="fluency-stat-value tabular">{stats.cv.toFixed(2)}</span>
              <span className="fluency-stat-label">
                {stats.cv < 0.35
                  ? 'your timing is steady, which is what automatic looks like'
                  : 'your timing still varies a lot from character to character'}
              </span>
            </p>
          )}

          {stats.slowest.length > 0 && (
            <p className="fluency-stat">
              <span className="fluency-stat-value mono">
                {stats.slowest.map((character) => character.glyph).join(' ')}
              </span>
              <span className="fluency-stat-label">
                slowest right now — Sprint will keep bringing them back
              </span>
            </p>
          )}
        </div>
      ) : (
        <p className="note fluency-empty">
          Run a Sprint or two and this will start telling you which characters are
          costing you time, and whether you are hearing them or still counting them.
        </p>
      )}
    </>
  )
}
