import { useEffect, useRef, useState } from 'react'

/** A shipped local file, resolved against the app base so it works offline. */
function audioUrl(src: string): string {
  return `${import.meta.env.BASE_URL}${src.replace(/^\//, '')}`
}

type PlayerState = 'idle' | 'playing' | 'ended' | 'error'

interface AudioPlayerProps {
  src: string
  /** What the learner is about to hear, for the control's programmatic name. */
  label: string
  /** Called each time playback actually starts; the second argument is true for a replay. */
  onPlay?: (replay: boolean) => void
  /** Called once if the recording cannot be played. */
  onUnavailable?: () => void
}

/**
 * A native `<audio>` element with one explicit control (#151).
 *
 * Nothing plays by itself: playback starts only from the button, so there is no
 * autoplay to fight a screen reader or a phone's audio policy. The control says
 * what it will do (Play, Stop, Replay), its state is announced politely, and the
 * recording stops when the card goes away or the page is hidden. If the file
 * cannot be loaded the control says so and the transcript route stays open,
 * because audio failure must never lock a learner out of the content.
 *
 * Replaying the clean recording is allowed and never changes how an answer
 * counts; only revealing the transcript does.
 */
export function AudioPlayer({ src, label, onPlay, onUnavailable }: AudioPlayerProps) {
  const audio = useRef<HTMLAudioElement>(null)
  const [state, setState] = useState<PlayerState>('idle')
  const played = useRef(false)
  const onPlayRef = useRef(onPlay)
  onPlayRef.current = onPlay
  const onUnavailableRef = useRef(onUnavailable)
  onUnavailableRef.current = onUnavailable

  useEffect(() => {
    const element = audio.current
    function stop() {
      try {
        element?.pause()
      } catch {
        // A detached or unsupported element has nothing to stop.
      }
    }
    // A backgrounded page must not keep talking.
    window.addEventListener('pagehide', stop)
    return () => {
      window.removeEventListener('pagehide', stop)
      stop()
    }
  }, [])

  function fail() {
    setState('error')
    onUnavailableRef.current?.()
  }

  function press() {
    const element = audio.current
    if (!element || state === 'error') return
    if (state === 'playing') {
      element.pause()
      element.currentTime = 0
      setState('ended')
      return
    }
    element.currentTime = 0
    const started = element.play()
    // `play()` rejects when the file is missing or the browser refuses it.
    if (started && typeof started.catch === 'function') started.catch(fail)
  }

  const verb = state === 'playing' ? 'Stop' : state === 'idle' ? 'Play' : 'Replay'
  const status =
    state === 'playing'
      ? 'Playing.'
      : state === 'ended'
        ? 'Finished. You can replay it.'
        : state === 'error'
          ? 'This recording could not be played. You can read the transcript instead; that counts as practice.'
          : ''

  return (
    <div className="audio-player">
      <audio
        ref={audio}
        src={audioUrl(src)}
        preload="auto"
        onPlaying={() => {
          setState('playing')
          onPlayRef.current?.(played.current)
          played.current = true
        }}
        onEnded={() => setState('ended')}
        onError={fail}
      />
      <button
        type="button"
        className="audio-play"
        disabled={state === 'error'}
        aria-label={state === 'error' ? `Recording unavailable: ${label}` : `${verb} recording: ${label}`}
        onClick={press}
      >
        <span className="audio-play-mark" aria-hidden="true">
          {state === 'playing' ? '■' : state === 'idle' ? '▶' : '↺'}
        </span>
        <span>{state === 'error' ? 'Unavailable' : verb}</span>
      </button>
      <p className="audio-status" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  )
}
