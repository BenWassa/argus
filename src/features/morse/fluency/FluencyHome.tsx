import { useMemo, useRef } from 'react'
import {
  allLatencies,
  coefficientOfVariation,
  elementCountRatio,
  median,
  newFluencyProgress,
  setFluencyRung,
  slowestCharacters,
  type MorseFluencyProgress,
} from '../../../domain/morse/fluency/progress'
import {
  FLUENCY_RUNGS,
  nextRung,
  previousRung,
  rungDescription,
  type FluencyRung,
} from '../../../domain/morse/fluency/timing'
import { FLUENCY_MODES, fluencyRunLength, type FluencyMode } from '../../../domain/morse/fluency/session'
import {
  COPY_LEVELS,
  COPY_LEVEL_INFO,
  copyBestKey,
  copyLevelCleared,
  nextCopyLevel,
  type CopyLevel,
} from '../../../domain/morse/fluency/copy'
import './Fluency.css'

interface FluencyHomeProps {
  progress: MorseFluencyProgress | undefined
  onProgress: (next: MorseFluencyProgress) => void
  onStart: (mode: FluencyMode) => void
  onCopy: (level: CopyLevel) => void
  onFreePlay: () => void
  onExit: () => void
}

const MODES: Record<FluencyMode, { title: string; purpose: string; best: (value: number) => string }> = {
  sprint: {
    title: 'Sprint',
    purpose: 'One character at a time, as fast as it comes back.',
    best: (value) => `${value} a minute`,
  },
  ladder: {
    title: 'Ladder',
    purpose: 'The same characters with less and less room between them.',
    best: (value) => `${value} WPM spacing`,
  },
  words: {
    title: 'Words',
    purpose: 'A whole word, heard and keyed as one thing.',
    best: (value) => `${value} in a row`,
  },
  groups: {
    title: 'Groups',
    purpose: 'Random letters, so no word shape can cover a weak one.',
    best: (value) => `${value} in a row`,
  },
}

/**
 * The post-acquisition home.
 *
 * Learn teaches the alphabet and stops. This is what the learner does after
 * that, and the two things it has to get right are the rung and the
 * diagnostic.
 *
 * ## Why the rung is a control and the character speed is not
 *
 * There is exactly one speed dial here, and it is the *spacing*. The character
 * speed is pinned at 20 WPM and is not exposed, because the one thing a
 * learner reliably does with a speed control is turn it down — and turning the
 * character speed down is precisely how a person trains themselves to count
 * elements, which is the habit this whole surface exists to remove. Spacing is
 * the number that is safe to move, so spacing is the number on screen.
 *
 * ## Why the statistics live here and only here
 *
 * These numbers are formative. They are not evidence, they cannot complete
 * anything, and they must not be read as if they could — so they appear inside
 * Fluency and nowhere near the topic card, Today, or anything that shows
 * retention state. Adjacency is how a formative number quietly becomes
 * perceived evidence, which is the same reason the practice offer is a quiet
 * text control rather than a primary action.
 */
export function FluencyHome({ progress, onProgress, onStart, onCopy, onFreePlay, onExit }: FluencyHomeProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const store = progress ?? newFluencyProgress()
  const nextLevel = nextCopyLevel(store)

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

  function setRung(rung: FluencyRung) {
    onProgress(setFluencyRung(store, rung))
  }

  return (
    <section className="session fluency-home">
      <div className="session-bar">
        <p>
          <span className="session-topic">Fluency</span>
        </p>
        <button className="ghost small" type="button" onClick={onExit}>
          Close
        </button>
      </div>

      <header className="fluency-head">
        <h1 ref={headingRef} tabIndex={-1}>
          After the alphabet
        </h1>
        <p className="lede-text">
          You know all 26. This is where they stop being something you work out and
          start being something you just hear — first as letters, then words, then
          sentences. Everything here is practice — none of it changes your progress or
          your completion.
        </p>
      </header>

      {/* The one dial, shared by Copy and the drills. Characters always sound
          at the same speed; this is how much room you get between them. */}
      <div className="fluency-rung">
        <p className="fluency-rung-label">
          Spacing <span className="tabular">{store.rung} WPM</span>
        </p>
        <p className="note">{rungDescription(store.rung)} · characters always at 20 WPM</p>
        <div className="fluency-rung-controls">
          <button
            className="ghost small"
            type="button"
            onClick={() => setRung(previousRung(store.rung))}
            disabled={store.rung === FLUENCY_RUNGS[0]}
            aria-label="More room between characters"
          >
            More room
          </button>
          <button
            className="ghost small"
            type="button"
            onClick={() => setRung(nextRung(store.rung))}
            disabled={store.rung === FLUENCY_RUNGS[FLUENCY_RUNGS.length - 1]}
            aria-label="Less room between characters"
          >
            Less room
          </button>
        </div>
      </div>

      {/* Copy leads because it is the progression: the material grows from
          letters to sentences, and it is the only mode that asks for the text
          rather than an echo of the rhythm. The speed drills below it train
          recognition time and are what to reach for when a level stalls. */}
      <section className="fluency-section" aria-labelledby="copy-levels-head">
        <h2 id="copy-levels-head" className="fluency-stats-title">
          Copy — hear it, write it down
        </h2>
        <ol className="fluency-modes">
          {COPY_LEVELS.map((level) => {
            const meta = COPY_LEVEL_INFO[level]
            const best = store.bests[copyBestKey(level)]
            const isNext = level === nextLevel
            return (
              <li key={level}>
                <button
                  className={`fluency-mode${isNext ? ' is-next' : ''}`}
                  type="button"
                  onClick={() => onCopy(level)}
                  aria-describedby={isNext ? 'copy-next-label' : undefined}
                >
                  <span className="fluency-mode-title">
                    {meta.title}
                    {isNext && (
                      <span id="copy-next-label" className="copy-next-tag">
                        Next
                      </span>
                    )}
                  </span>
                  <span className="fluency-mode-purpose">{meta.purpose}</span>
                  <span className="fluency-mode-meta tabular">
                    {meta.length} prompts
                    {best !== undefined && ` · best ${best}%`}
                    {copyLevelCleared(store, level) && ' · cleared'}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="fluency-section" aria-labelledby="free-play-head">
        <h2 id="free-play-head" className="fluency-stats-title">
          Free play — build your own
        </h2>
        <button className="fluency-mode" type="button" onClick={onFreePlay}>
          <span className="fluency-mode-title">Free play</span>
          <span className="fluency-mode-purpose">
            Key your own words and sentences and see what they spell, or type anything and hear it.
          </span>
          <span className="fluency-mode-meta">No target, no score, nothing saved</span>
        </button>
      </section>

      <section className="fluency-section" aria-labelledby="speed-drills-head">
        <h2 id="speed-drills-head" className="fluency-stats-title">
          Speed drills — hear it, key it back
        </h2>
        <ul className="fluency-modes">
          {FLUENCY_MODES.map((mode) => {
            const meta = MODES[mode]
            const best = store.bests[mode]
            return (
              <li key={mode}>
                <button className="fluency-mode" type="button" onClick={() => onStart(mode)}>
                  <span className="fluency-mode-title">{meta.title}</span>
                  <span className="fluency-mode-purpose">{meta.purpose}</span>
                  <span className="fluency-mode-meta tabular">
                    {fluencyRunLength(mode)} prompts
                    {best !== undefined && ` · best ${meta.best(best)}`}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

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
    </section>
  )
}
