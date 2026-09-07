import { useEffect, useRef } from 'react'
import { canonicalNotation, spokenRhythm } from '../../lib/morseMnemonics'
import { MORSE_LETTERS, type MorseLetter } from '../../lib/morse'
import { verbalMnemonic } from '../../lib/morseVerbalMnemonics'
import { MorsePlayButton } from './MorsePlayButton'
import { useMorseAudio } from './useMorseAudio'
import './MorseReference.css'

/**
 * The Morse alphabet: a lookup surface, and nothing else.
 *
 * #76 deliberately breaks from the old compressed row treatment. Each letter
 * gets one compact learning card with four immediate anchors: large glyph,
 * large canonical pattern, mnemonic phrase and sound. The SVG remains useful in
 * guided acquisition but is omitted here so the reference can optimize fast
 * letter ↔ pattern lookup without visual competition.
 *
 * The purity boundary from #48 remains structural: this module imports no store,
 * scheduler or cue ladder and receives no topic or mutation callback.
 */

const ALPHABET = Object.keys(MORSE_LETTERS).sort() as MorseLetter[]

function ReferenceCard({
  glyph,
  playing,
  onToggle,
}: {
  glyph: MorseLetter
  playing: boolean
  onToggle: () => void
}) {
  const pattern = MORSE_LETTERS[glyph]
  const mnemonic = verbalMnemonic(glyph)

  return (
    <li className={`morse-ref-card${playing ? ' is-sounding' : ''}`}>
      <span className="morse-ref-letter" aria-hidden="true">{glyph}</span>

      <div className="morse-ref-body">
        <p className="morse-ref-pattern">
          <span aria-hidden="true">{canonicalNotation(pattern)}</span>
          <span className="sr-only">{glyph}: {spokenRhythm(pattern)}</span>
        </p>
        <p className="morse-ref-mnemonic" aria-label={`Mnemonic for ${glyph}: ${mnemonic.phrase}`}>
          {mnemonic.phrase}
        </p>
      </div>

      <MorsePlayButton glyph={glyph} playing={playing} onToggle={onToggle} />
    </li>
  )
}

export function MorseReference({ onExit }: { onExit: () => void }) {
  const { sounding, audioError, toggle } = useMorseAudio()
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <section className="session morse-reference">
      <div className="session-bar">
        <p>
          <span className="session-topic">Morse alphabet</span>
          <span className="tabular">26 letters</span>
        </p>
        <button className="ghost small" type="button" onClick={onExit}>Close</button>
      </div>

      <h1 ref={headingRef} tabIndex={-1} className="morse-ref-title">Morse alphabet</h1>

      <p className="morse-ref-lede">
        Letter, pattern, mnemonic, sound. This is a reference: use it whenever you want, and it
        changes nothing about your progress.
      </p>

      <ul className="morse-ref-list">
        {ALPHABET.map((glyph) => (
          <ReferenceCard
            key={glyph}
            glyph={glyph}
            playing={sounding?.glyph === glyph}
            onToggle={() => toggle(glyph)}
          />
        ))}
      </ul>

      <p className="sr-only" aria-live="polite">
        {sounding ? `Playing ${sounding.glyph}.` : ''}
      </p>

      {audioError && (
        <p className="morse-audio-error" role="status">
          {audioError} Audio is optional here; the written pattern and mnemonic remain available.
        </p>
      )}

      <p className="morse-ref-foot">
        Play uses your device&apos;s media volume. Recall in both printed directions is proved in Test,
        never here.
      </p>
    </section>
  )
}
