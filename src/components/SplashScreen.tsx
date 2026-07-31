import { useEffect, useRef, useState } from 'react'
import './SplashScreen.css'

const SPLASH_SEEN_KEY = 'argus-splash-seen'
const EXIT_MS = 420

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
  const root = useRef<HTMLElement>(null)
  const skipButton = useRef<HTMLButtonElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const ambient = useRef<HTMLCanvasElement>(null)

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
    // Focus the dialog surface, not the skip button, so launch is not decorated
    // with a focus ring nobody asked for. Tab still reaches the button.
    root.current?.focus({ preventScroll: true })
    const timeout = window.setTimeout(complete, reducedMotion ? 900 : 7000)

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

  // The backdrop is the footage itself: each frame is painted into a small
  // canvas that CSS blurs across the whole viewport, so the sharp layer fades
  // into a moving blur of the same scene and the frame has no findable edge.
  useEffect(() => {
    if (reducedMotion) return
    let raf = 0
    function draw() {
      const source = video.current
      const target = ambient.current
      if (source && target && source.readyState >= 2) {
        target.getContext('2d')?.drawImage(source, 0, 0, target.width, target.height)
      }
      raf = window.requestAnimationFrame(draw)
    }
    raf = window.requestAnimationFrame(draw)
    return () => window.cancelAnimationFrame(raf)
  }, [reducedMotion])

  const poster = `${import.meta.env.BASE_URL}media/splash-poster.jpg`

  return (
    <section
      ref={root}
      tabIndex={-1}
      className={`launch-splash${exiting ? ' is-exiting' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Opening Argus"
      onClick={complete}
    >
      <img
        className="launch-splash-atmosphere"
        src={poster}
        alt=""
        aria-hidden="true"
        draggable={false}
      />

      {!reducedMotion && (
        <canvas
          ref={ambient}
          className={`launch-splash-ambient${videoReady ? ' is-live' : ''}`}
          width={96}
          height={54}
          aria-hidden="true"
        />
      )}

      <div className="launch-splash-stage">
        <div className="launch-splash-media" aria-hidden="true">
          <div className="launch-splash-media-inner">
            <img
              className={`launch-splash-poster${videoReady ? ' is-hidden' : ''}`}
              src={poster}
              alt=""
              draggable={false}
            />
            {!reducedMotion && (
              <video
                ref={video}
                className={`launch-splash-video${videoReady ? ' is-ready' : ''}`}
                autoPlay
                muted
                playsInline
                preload="auto"
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
        </div>
      </div>

      <button
        ref={skipButton}
        className="launch-splash-skip"
        type="button"
        onClick={complete}
      >
        Skip intro
      </button>
    </section>
  )
}
