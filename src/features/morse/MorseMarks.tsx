import type { CSSProperties } from 'react'
import './MorseMarks.css'

/**
 * Preset sizes, by the dit's diameter. A dah is three dits long and the gap
 * between marks is one dit, so a drawn pattern is its own timing at any size.
 *
 * - `pip`: a path pip's chip.
 * - `tile`: a mode tray tile.
 * - `support`: a correction or reference row; it scales with the row's type.
 * - `stimulus`: the whole task, as in Read and the A–Z Test's "Name it".
 */
export type MorseMarksSize = 'pip' | 'tile' | 'support' | 'stimulus'

interface MorseMarksProps {
  /** The pattern, as `.-` or as notation (`· —`); spaces are ignored. */
  pattern: string
  size?: MorseMarksSize
  /** A CSS length for the dit, overriding the preset (for example `0.44em`). */
  unit?: string
  /** When given, the marks are one image with this name; otherwise they are hidden from assistive technology. */
  label?: string
  className?: string
}

/** `.` and `·` are dits; `-`, `—`, `−` and `–` are dahs; anything else is dropped. */
export function morseMarkKinds(pattern: string): Array<'dit' | 'dah'> {
  const kinds: Array<'dit' | 'dah'> = []
  for (const mark of pattern) {
    if (mark === '.' || mark === '·') kinds.push('dit')
    else if (mark === '-' || mark === '—' || mark === '−' || mark === '–') kinds.push('dah')
  }
  return kinds
}

/**
 * Morse drawn rather than set in type (#263). Round dits and pill dahs share
 * one height and one centre line, in the current colour. Set as type, a dit is
 * a speck that sits on the font's baseline while a dash floats at its x-height;
 * drawn, the pattern reads at a glance at every size, and one component keeps
 * the tray tile, Read practice, corrections and the A–Z Test the same.
 *
 * Each mark keeps its notation character as text, so copying the marks gives
 * `· —`, while the box, not the glyph, is what is drawn.
 */
export function MorseMarks({ pattern, size = 'support', unit, label, className = '' }: MorseMarksProps) {
  const kinds = morseMarkKinds(pattern)
  return (
    <span className={`morse-marks is-${size}${className ? ` ${className}` : ''}`}
      style={unit ? { '--morse-unit': unit } as CSSProperties : undefined}
      role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {kinds.map((kind, index) => (
        <span key={index} className={`morse-mark is-${kind}`}>{kind === 'dit' ? '·' : '—'}</span>
      ))}
    </span>
  )
}
