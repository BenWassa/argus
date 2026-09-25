import { useEffect, useRef } from 'react'
import { canonicalNotation, spokenRhythm } from '../../../domain/morse/mnemonics'
import { MORSE_FIGURES, MORSE_LETTERS, MORSE_PUNCTUATION, type MorseLetter } from '../../../domain/morse/code'
import { verbalMnemonic } from '../../../domain/morse/verbalMnemonics'
import { MorsePlayButton } from '../MorsePlayButton'
import { useMorseAudio } from '../useMorseAudio'
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

/**
 * How to hold each figure and mark without a phrase. The figures follow a rule
 * rather than needing a mnemonic, so the rule is the caption.
 */
const EXTRA_CAPTIONS: Record<string, string> = {
  '1': '1 dit, then dahs',
  '2': '2 dits, then dahs',
  '3': '3 dits, then dahs',
  '4': '4 dits, then a dah',
  '5': 'five dits',
  '6': '1 dah, then dits',
  '7': '2 dahs, then dits',
  '8': '3 dahs, then dits',
  '9': '4 dahs, then a dit',
  '0': 'five dahs',
  '.': 'full stop: A three times',
  ',': 'comma: dahs outside',
  '?': 'question mark: dits outside',
  '/': 'slash: D and N together',
}

const EXTRAS = [...Object.entries(MORSE_FIGURES), ...Object.entries(MORSE_PUNCTUATION)]

/**
 * Figures and the four beginner punctuation marks, met in Copy after the
 * alphabet. Only on the standalone reference: the topic page's cards are the
 * course, and the course is A–Z.
 */
function MorseFigureCards() {
  const { sounding, toggle } = useMorseAudio()
  return (
    <section className="morse-ref-extras" aria-labelledby="morse-ref-extras-head">
      <h2 id="morse-ref-extras-head" className="morse-ref-extras-head">Figures and punctuation</h2>
      <p className="morse-ref-lede">Not part of the A–Z course. Copy introduces them once the alphabet is done.</p>
      <ul className="morse-ref-list">
        {EXTRAS.map(([glyph, pattern]) => (
          <li key={glyph} className={`morse-ref-card is-extra${sounding?.glyph === glyph ? ' is-sounding' : ''}`}>
            <span className="morse-ref-letter" aria-hidden="true">{glyph}</span>
            <div className="morse-ref-body">
              <p className="morse-ref-pattern">
                <span aria-hidden="true">{canonicalNotation(pattern)}</span>
                <span className="sr-only">{glyph}: {spokenRhythm(pattern)}</span>
              </p>
              <p className="morse-ref-mnemonic">{EXTRA_CAPTIONS[glyph]}</p>
            </div>
            <MorsePlayButton glyph={glyph} playing={sounding?.glyph === glyph} onToggle={() => toggle(glyph)} />
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * The complete, pure lookup surface shared by the standalone reference route
 * and the progressive Morse Topic page. Audio state is local to the mounted
 * reference and cannot reach learner progress.
 */
export function MorseReferenceCards() {
  const { sounding, audioError, toggle } = useMorseAudio()

  return (
    <>
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
    </>
  )
}

export function MorseReference({ onExit }: { onExit: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <section className="session morse-reference">
      <div className="session-bar">
        <p>
          <span className="session-topic">Morse alphabet</span>
        </p>
        <span className="session-count tabular" aria-label="26 letters">26</span>
        <button className="ghost small" type="button" onClick={onExit}>Close</button>
      </div>

      <h1 ref={headingRef} tabIndex={-1} className="morse-ref-title">Morse alphabet</h1>

      <p className="morse-ref-lede">
        Letter, pattern, mnemonic, sound. This is a reference: use it whenever you want, and it
        changes nothing about your progress.
      </p>

      <MorseReferenceCards />

      <MorseFigureCards />

      <p className="morse-ref-foot">
        Play uses your device&apos;s media volume. Recall in both printed directions is proved in Test,
        never here.
      </p>
    </section>
  )
}
