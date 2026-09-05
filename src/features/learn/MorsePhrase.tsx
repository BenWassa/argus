import {
  verbalMnemonic,
  verbalMnemonicTextEquivalent,
  type MorseVerbalBeat,
} from '../../lib/morseVerbalMnemonics'

/**
 * The rhythmic verbal mnemonic, rendered as one cohesive phrase whose timing is
 * carried by an explicit mark under every word.
 *
 * #44's real-phone review found two defects in the previous treatment, and this
 * component is the single place both are fixed for every surface that shows a
 * phrase.
 *
 * **Casing is not semantic.** The old card capitalised held words and left short
 * words lowercase, which made typography load-bearing and made the supplied
 * exemplar `A LONG` an outright contradiction — `A` is the *short* beat. Every
 * visible word is now rendered in the same case, so casing carries no
 * information at all and cannot contradict anything. `A LONG` still reads
 * exactly as #42 supplied it, and every other phrase reads the same way. The
 * authored casing survives untouched in the DOM's accessible text, because a
 * screen reader announcing `BAT` as an initialism would be a worse trade than
 * the visual consistency is worth.
 *
 * **Timing is explicit and aligned.** Each word carries a `·` (short, one unit)
 * or `—` (held, three units) directly beneath it. A learner reads the beat
 * structure off the marks rather than inferring it from how a particular
 * English speaker would say the word, which is what
 * `docs/MORSE_VERBAL_MNEMONICS.md` always claimed and what #44's card had
 * removed.
 *
 * The alignment also answers the repetition complaint. `ZOOM ZOOM ZIP ZIP`
 * looks like duplicated data until four separate marks sit under four separate
 * words; then it visibly is four beats. `MorseBeatGrammarNote` states the same
 * thing once in words.
 */

interface MorsePhraseProps {
  glyph: string
  /**
   * A strict opening prefix of the phrase, when a surface is disclosing only
   * part of it. Omit for the whole phrase.
   */
  beats?: readonly MorseVerbalBeat[]
  /** How many beats the learner still has to recall, shown as `?` marks. */
  hiddenCount?: number
  /** Accessible text. Defaults to the letter's full short/held reading. */
  label?: string
}

export function beatMarkGlyph(length: MorseVerbalBeat['length']): string {
  return length === 'short' ? '·' : '—'
}

export function MorsePhrase({ glyph, beats, hiddenCount = 0, label }: MorsePhraseProps) {
  const shown = beats ?? verbalMnemonic(glyph).beats

  return (
    <p className="morse-phrase" aria-label={label ?? verbalMnemonicTextEquivalent(glyph)}>
      <span className="morse-phrase-beats" aria-hidden="true">
        {shown.map((beat, index) => (
          <span className={`morse-phrase-beat is-${beat.length}`} key={`${beat.text}-${index}`}>
            {/* Uppercased in the markup rather than by `text-transform`, so the
                "casing carries nothing" rule is a property of the rendered
                output and can be asserted for all 26 phrases. */}
            <span className="morse-phrase-word">{beat.text.toUpperCase()}</span>
            <span className="morse-phrase-mark">{beatMarkGlyph(beat.length)}</span>
          </span>
        ))}
        {hiddenCount > 0 && (
          <span className="morse-phrase-beat is-hidden">
            <span className="morse-phrase-word">{'?'.repeat(hiddenCount)}</span>
            <span className="morse-phrase-mark">{'?'.repeat(hiddenCount)}</span>
          </span>
        )}
      </span>
    </p>
  )
}

/**
 * The one learner-facing explanation of the mnemonic grammar, including why a
 * word may repeat. Stated once per surface, never once per card: #44 asked for
 * the repetition to be understandable, not for five copies of a caption.
 */
export function MorseBeatGrammarNote({ className = 'morse-grammar-note' }: { className?: string }) {
  return (
    <p className={className}>
      Say the phrase as one rhythm. The mark under each word is its length:{' '}
      <span className="morse-grammar-mark">·</span> is a short beat (a dit) and{' '}
      <span className="morse-grammar-mark">—</span> is a held one (a dah). One word is one Morse
      signal, so a repeated word is a deliberately repeated beat — <strong>ZOOM ZOOM ZIP ZIP</strong>{' '}
      is four signals, <span className="morse-grammar-mark">— — · ·</span>, not a typo.
    </p>
  )
}
