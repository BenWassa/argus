import { useEffect, useRef, useState } from 'react'

const SPLASH_SEEN_KEY = 'argus-splash-seen'

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
  const completed = useRef(false)

  function complete() {
    if (completed.current) return
    completed.current = true

    try {
      sessionStorage.setItem(SPLASH_SEEN_KEY, 'true')
    } catch {
      // The splash still dismisses when storage is unavailable.
    }

    onComplete()
  }

  useEffect(() => {
    const timeout = window.setTimeout(complete, reducedMotion ? 700 : 6500)
    return () => window.clearTimeout(timeout)
  }, [reducedMotion])

  return (
    <section className="splash" aria-label="Opening Argus">
      {reducedMotion ? (
        <img
          className="splash-media"
          src={`${import.meta.env.BASE_URL}media/splash-poster.jpg`}
          alt=""
        />
      ) : (
        <video
          className="splash-media"
          autoPlay
          muted
          playsInline
          preload="auto"
          poster={`${import.meta.env.BASE_URL}media/splash-poster.jpg`}
          onEnded={complete}
          onError={complete}
          aria-hidden="true"
        >
          <source src={`${import.meta.env.BASE_URL}media/splashv1.mp4`} type="video/mp4" />
        </video>
      )}
      {!reducedMotion && (
        <button className="splash-skip ghost small" type="button" onClick={complete}>
          Skip intro
        </button>
      )}
    </section>
  )
}
