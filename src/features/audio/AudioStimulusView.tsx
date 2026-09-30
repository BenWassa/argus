import type { AudioStimulus } from '../../domain/audio/audio'
import { AudioPlayer } from './AudioPlayer'
import './Audio.css'

interface AudioStimulusViewProps {
  audio: AudioStimulus
  /** The transcript is on screen. */
  showTranscript: boolean
  /**
   * Offer a control to reveal the transcript. Omit it where the transcript is
   * simply shown (reference) or cannot be offered.
   */
  onRevealTranscript?: () => void
  onPlay?: (replay: boolean) => void
  onUnavailable?: () => void
  label?: string
}

/**
 * One recording and the text that makes it usable without it (#151).
 *
 * The transcript is content, so it is never absent from the model; whether it is
 * *shown* is a presentation decision the caller owns. In a scored exposure it
 * starts hidden and revealing it is the learner's choice and has a stated cost.
 * The reveal control sits beside the player, so the route to the text is always
 * at hand for a learner who cannot use the audio.
 */
export function AudioStimulusView({
  audio,
  showTranscript,
  onRevealTranscript,
  onPlay,
  onUnavailable,
  label = 'Listen to the recording',
}: AudioStimulusViewProps) {
  return (
    <figure className="audio-stimulus">
      <AudioPlayer src={audio.src} label={label} onPlay={onPlay} onUnavailable={onUnavailable} />
      {showTranscript ? (
        <figcaption className="audio-transcript">
          <span className="audio-transcript-label">Transcript</span>
          <span className="audio-transcript-text">{audio.transcript}</span>
        </figcaption>
      ) : (
        onRevealTranscript && (
          <button type="button" className="ghost audio-reveal" onClick={onRevealTranscript}>
            Show transcript
          </button>
        )
      )}
    </figure>
  )
}
