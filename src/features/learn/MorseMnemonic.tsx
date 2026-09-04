import { useId } from 'react'
import { buildMnemonic, canonicalNotation, spokenRhythm } from '../../lib/morseMnemonics'

interface MorseMnemonicProps {
  glyph: string
  pattern: string
  /** The semantic equivalent. This is the accessible name of the drawing. */
  textLabel: string
  /**
   * Element currently sounding, or null. Illumination is a colour change only:
   * nothing moves, nothing translates, so reduced-motion users lose no
   * sequence information and the drawing never animates position.
   */
  activeIndex?: number | null
}

/**
 * One character in the Argus mnemonic grammar: the uppercase glyph with its
 * rhythm laid out on the shared rail in transmission order. The geometry comes
 * from `morseMnemonics`, so the drawing and its regression tests cannot drift
 * apart, and the same rail is used for every character so pattern length is
 * directly comparable between cards.
 */
export function MorseMnemonic({ glyph, pattern, textLabel, activeIndex = null }: MorseMnemonicProps) {
  const geometry = buildMnemonic(glyph, pattern)
  const baseId = useId()
  const titleId = `${baseId}-title`
  const descId = `${baseId}-desc`

  return (
    <svg
      className="morse-mnemonic"
      viewBox={geometry.viewBox}
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
      focusable="false"
    >
      <title id={titleId}>{textLabel}</title>
      <desc id={descId}>
        {`Canonical notation ${canonicalNotation(pattern)}, read left to right: ${spokenRhythm(pattern)}.`}
      </desc>

      <text
        className="morse-mnemonic-glyph"
        x={geometry.glyphX}
        y={geometry.glyphY}
        textAnchor="middle"
        dominantBaseline="central"
        aria-hidden="true"
      >
        {glyph}
      </text>

      {/* The rail runs the full width for every character, so a short pattern
          visibly is a short pattern rather than merely a small drawing. */}
      <line
        className="morse-mnemonic-rail"
        x1={geometry.railStart}
        y1={geometry.centerY}
        x2={geometry.railEnd}
        y2={geometry.centerY}
      />
      <line
        className="morse-mnemonic-origin"
        x1={geometry.railStart}
        y1={geometry.centerY - geometry.unit}
        x2={geometry.railStart}
        y2={geometry.centerY + geometry.unit}
      />

      {geometry.elements.map((element) => {
        const active = activeIndex === element.index
        const className = `morse-mnemonic-element morse-mnemonic-${element.kind}${active ? ' is-sounding' : ''}`
        return element.kind === 'dit' ? (
          <circle
            key={element.index}
            className={className}
            cx={element.x + element.width / 2}
            cy={geometry.centerY}
            r={element.width / 2}
          />
        ) : (
          <rect
            key={element.index}
            className={className}
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            rx={element.height / 2}
          />
        )
      })}
    </svg>
  )
}
