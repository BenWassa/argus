import { canonicalNotation, spokenRhythm } from '../../lib/morseMnemonics'
import type { MorseCharacterLearnItem } from '../../lib/types'
import { MorseMnemonic } from './MorseMnemonic'
import { MorseBeatGrammarNote, MorsePhrase } from './MorsePhrase'
import { MorsePlayButton } from './MorsePlayButton'
import { useMorseAudio, type Sounding } from './useMorseAudio'
import './MorseCharacterPacket.css'

function MorseCharacterCard({
  character,
  sounding,
  onToggle,
}: {
  character: MorseCharacterLearnItem
  sounding: Sounding | null
  onToggle: (glyph: string) => void
}) {
  const isSounding = sounding?.glyph === character.glyph

  return (
    <li className={`morse-card${isSounding ? ' is-sounding' : ''}`}>
      <div className="morse-phrase-row">
        <span className="morse-letter" aria-hidden="true">{character.glyph}</span>
        <MorsePhrase glyph={character.glyph} />
      </div>

      <div className="morse-visual-row">
        <MorseMnemonic
          glyph={character.glyph}
          pattern={character.pattern}
          textLabel={character.textLabel}
          activeIndex={isSounding ? sounding.index : null}
        />
        <MorsePlayButton
          glyph={character.glyph}
          playing={isSounding}
          onToggle={() => onToggle(character.audioText)}
        />
      </div>

      <p className="morse-canonical">
        <span className="morse-notation" aria-hidden="true">
          {canonicalNotation(character.pattern)}
        </span>
        <span className="morse-rhythm">{spokenRhythm(character.pattern)}</span>
      </p>
    </li>
  )
}

/**
 * The `morse-character-packet` Learn block: a set of characters laid out to
 * read, with the phrase, the timing drawing, the canonical pattern and audio.
 *
 * #48 moved the shipped A–Z curriculum off this surface — Learn is now a guided
 * lesson and lookup lives on the Morse alphabet page — but the block type stays
 * part of the durable Learn content model and the import/export contract, so
 * authored content that uses it keeps rendering. Nothing here is scored,
 * nothing is hidden behind progress and no packet is locked.
 */
export function MorseCharacterPacket({ characters }: { characters: MorseCharacterLearnItem[] }) {
  const { sounding, audioError, toggle } = useMorseAudio()

  return (
    <div className="morse-packet">
      <MorseBeatGrammarNote className="morse-packet-note" />

      <ul className="morse-cards">
        {characters.map((character) => (
          <MorseCharacterCard
            key={character.glyph}
            character={character}
            sounding={sounding}
            onToggle={toggle}
          />
        ))}
      </ul>

      <p className="morse-packet-note">
        The phrase is the first memory hook. The SVG is a secondary timing scaffold: circle = one
        unit, bar = three, read left to right. Both disappear before uncued Test. Play uses your
        device's media volume.
      </p>

      <p className="sr-only" aria-live="polite">
        {sounding ? `Playing ${sounding.glyph}.` : ''}
      </p>

      {audioError && (
        <p className="morse-audio-error" role="status">
          {audioError} Audio is optional here; the phrase, its beat marks, the SVG and the written
          pattern still teach the same mapping.
        </p>
      )}
    </div>
  )
}
