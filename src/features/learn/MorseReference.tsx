import { useEffect, useRef } from 'react'
import { canonicalNotation, mnemonicTextEquivalent, spokenRhythm } from '../../lib/morseMnemonics'
import { MORSE_LETTERS, type MorseLetter } from '../../lib/morse'
import { MorseMnemonic } from './MorseMnemonic'
import { MorseBeatGrammarNote, MorsePhrase } from './MorsePhrase'
import { MorsePlayButton } from './MorsePlayButton'
import { useMorseAudio } from './useMorseAudio'
import './MorseReference.css'

/**
 * The Morse alphabet: a lookup surface, and nothing else.
 *
 * #48 separates the two jobs the old Learn page was doing at once. This is the
 * reference half: all 26 letters, alphabetically, always available, with no
 * locking, no progression and no evidence of any kind.
 *
 * That last property is structural rather than promised. This module imports no
 * store, no scheduler and no cue ladder — it takes no library, no topic and no
 * mutation callback, and it derives every letter from the canonical
 * `MORSE_LETTERS` table. There is nothing here that *could* write scheduler,
 * cue or completion state, however long a learner browses or however many times
 * they press Play. `MorseReference.test.tsx` asserts that import boundary
 * directly, so a later edit that reaches for the store fails the gate.
 */

const ALPHABET = Object.keys(MORSE_LETTERS).sort() as MorseLetter[]

function ReferenceRow({
  glyph,
  playing,
  activeIndex,
  onToggle,
}: {
  glyph: MorseLetter
  playing: boolean
  activeIndex: number | null
  onToggle: () => void
}) {
  const pattern = MORSE_LETTERS[glyph]

  return (
    <li className={`morse-ref-row${playing ? ' is-sounding' : ''}`}>
      <span className="morse-ref-letter" aria-hidden="true">
        {glyph}
      </span>

      <div className="morse-ref-body">
        <MorsePhrase glyph={glyph} />
        <div className="morse-ref-visual">
          <MorseMnemonic
            glyph={glyph}
            pattern={pattern}
            textLabel={mnemonicTextEquivalent(glyph, pattern)}
            activeIndex={activeIndex}
          />
          <p className="morse-ref-canonical">
            <span className="morse-notation" aria-hidden="true">
              {canonicalNotation(pattern)}
            </span>
            <span className="morse-rhythm">{spokenRhythm(pattern)}</span>
          </p>
        </div>
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
        <button className="ghost small" type="button" onClick={onExit}>
          Close
        </button>
      </div>

      <h1 ref={headingRef} tabIndex={-1} className="morse-ref-title">
        Morse alphabet
      </h1>

      <p className="morse-ref-lede">
        Every letter, A to Z, always available. Looking something up here is not a test and changes
        nothing about your progress.
      </p>

      <MorseBeatGrammarNote className="morse-ref-grammar" />

      <ul className="morse-ref-list">
        {ALPHABET.map((glyph) => (
          <ReferenceRow
            key={glyph}
            glyph={glyph}
            playing={sounding?.glyph === glyph}
            activeIndex={sounding?.glyph === glyph ? sounding.index : null}
            onToggle={() => toggle(glyph)}
          />
        ))}
      </ul>

      <p className="sr-only" aria-live="polite">
        {sounding ? `Playing ${sounding.glyph}.` : ''}
      </p>

      {audioError && (
        <p className="morse-audio-error" role="status">
          {audioError} Audio is optional here; the phrase, its beat marks, the drawing and the
          written pattern all state the same mapping.
        </p>
      )}

      <p className="morse-ref-foot">
        Play uses your device's media volume. Recall of these mappings in both directions is proved
        in Test, never here.
      </p>
    </section>
  )
}
