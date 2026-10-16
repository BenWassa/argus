import { canonicalNotation, spokenRhythm } from '../../domain/morse/mnemonics'
import { MORSE_LETTERS, type MorseLetter } from '../../domain/morse/code'
import { MorsePhrase } from './MorsePhrase'
import { MorsePlayButton } from './MorsePlayButton'
import { useMorseAudio } from './useMorseAudio'
import './MorseCharacterSupport.css'

/** A single, canonical character reveal shared by lookup and correction surfaces. */
interface MorseCharacterSupportProps {
  glyph: string
  pattern?: string
  playing?: boolean
  onToggle?: () => void
  /** Optional short rule for figures/punctuation without a verbal phrase. */
  mnemonic?: string
  className?: string
  audioError?: string | null
}

function SupportContent({ glyph, pattern, playing, onToggle, mnemonic, className, audioError }: Required<Pick<MorseCharacterSupportProps, 'glyph' | 'pattern' | 'playing' | 'onToggle' | 'className'>> & Pick<MorseCharacterSupportProps, 'mnemonic' | 'audioError'>) {
  return (
    <div className={`morse-character-support${playing ? ' is-sounding' : ''}${className ? ` ${className}` : ''}`}>
      <span className={`morse-character-support-glyph${className.includes('morse-ref-support') ? ' morse-ref-letter' : ''}`} aria-hidden="true">{glyph}</span>
      <div className="morse-character-support-body">
        <p className={`morse-character-support-notation${className.includes('morse-ref-support') ? ' morse-ref-pattern' : ''}`}>
          <span aria-hidden="true">{canonicalNotation(pattern)}</span>
          <span className="sr-only">{glyph}: {spokenRhythm(pattern)}</span>
        </p>
        {mnemonic ? <p className="morse-character-support-mnemonic morse-ref-mnemonic">{mnemonic}</p> : <MorsePhrase glyph={glyph} />}
      </div>
      <MorsePlayButton glyph={glyph} playing={playing} onToggle={onToggle} />
      {audioError && <p className="morse-character-support-audio-error" role="status">{audioError} Audio is optional; the written pattern and mnemonic remain available.</p>}
    </div>
  )
}

function SelfOwnedSupport(props: Required<Pick<MorseCharacterSupportProps, 'glyph' | 'pattern' | 'className'>> & Pick<MorseCharacterSupportProps, 'mnemonic'>) {
  const audio = useMorseAudio()
  return <SupportContent {...props} playing={audio.sounding?.glyph === props.glyph} onToggle={() => audio.toggle(props.glyph)} audioError={audio.audioError} />
}

export function MorseCharacterSupport({
  glyph,
  pattern = MORSE_LETTERS[glyph as MorseLetter],
  playing,
  onToggle,
  mnemonic,
  className = '',
  audioError,
}: MorseCharacterSupportProps) {
  const resolvedPattern = pattern ?? MORSE_LETTERS[glyph as MorseLetter]
  const resolvedClassName = className ?? ''
  if (onToggle) {
    return <SupportContent glyph={glyph} pattern={resolvedPattern} playing={playing ?? false} onToggle={onToggle} mnemonic={mnemonic} className={resolvedClassName} audioError={audioError} />
  }
  return <SelfOwnedSupport glyph={glyph} pattern={resolvedPattern} mnemonic={mnemonic} className={resolvedClassName} />
}
