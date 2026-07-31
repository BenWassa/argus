import { useEffect, useRef, useState } from 'react'
import './SplashScreen.css'

const SPLASH_SEEN_KEY = 'argus-splash-seen'
const EXIT_MS = 180

type SplashScreenProps = {
  onComplete: () => void
}

export function shouldShowSplash() {
  try {
    return sessionStorage.getItem(SPLASH_SEEN_KEY) !== 'true'
  } catch {
    return true
  }
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [reducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [videoReady, setVideoReady] = useState(false)
  const [exiting, setExiting] = useState(false)
  const completed = useRef(false)
  const exitTimer = useRef<number | null>(null)
  const skipButton = useRef<HTMLButtonElement>(null)

  function complete() {
    if (completed.current) return
    completed.current = true

    try {
      sessionStorage.setItem(SPLASH_SEEN_KEY, 'true')
    } catch {
      // The splash still dismisses when storage is unavailable.
    }

    setExiting(true)
    exitTimer.current = window.setTimeout(onComplete, reducedMotion ? 0 : EXIT_MS)
  }

  useEffect(() => {
    skipButton.current?.focus({ preventScroll: true })
    const timeout = window.setTimeout(complete, reducedMotion ? 600 : 6500)

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') complete()
      if (event.key === 'Tab') {
        event.preventDefault()
        skipButton.current?.focus({ preventScroll: true })
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(timeout)
      if (exitTimer.current !== null) window.clearTimeout(exitTimer.current)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [reducedMotion])

  const poster = `${import.meta.env.BASE_URL}media/splash-poster.jpg`

  return (
    <section
      className={`launch-splash${exiting ? ' is-exiting' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Opening Argus"
    >
      <img
        className="launch-splash-atmosphere"
        src={poster}
        alt=""
        aria-hidden="true"
        draggable={false}
      />

      <div className="launch-splash-stage">
        <div className="launch-splash-media" aria-hidden="true">
          <img
            className={`launch-splash-poster${videoReady ? ' is-hidden' : ''}`}
            src={poster}
            alt=""
            draggable={false}
          />
          {!reducedMotion && (
            <video
              className={`launch-splash-video${videoReady ? ' is-ready' : ''}`}
              autoPlay
              muted
              playsInline
              preload="metadata"
              poster={poster}
              onCanPlay={() => setVideoReady(true)}
              onLoadedData={() => setVideoReady(true)}
              onEnded={complete}
              onError={complete}
            >
              <source src={`${import.meta.env.BASE_URL}media/splashv1.mp4`} type="video/mp4" />
            </video>
          )}
        </div>

        <button
          ref={skipButton}
          className="launch-splash-skip small"
          type="button"
          onClick={complete}
        >
          Skip intro
        </button>
      </div>
    </section>
  )
}
