import { useEffect, useRef, useState } from 'react'
import './SignInScreen.css'

function GoogleMark() {
  return (
    <svg className="signin-google-mark" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

/**
 * The configured-production entry boundary (#93) and opening composition (#102).
 *
 * Splash media and authentication deliberately live in the same bounded shell:
 * there is no intro to dismiss before reaching a second login surface. Media is
 * presentation only; auth restoration remains the authority for whether the
 * learner product is allowed to mount.
 */
export function SignInScreen({
  restoring,
  error,
  onSignIn,
}: {
  restoring: boolean
  error: string | null
  onSignIn: () => Promise<void> | void
}) {
  const action = useRef<HTMLButtonElement>(null)
  const splashVideo = useRef<HTMLVideoElement>(null)
  const [busy, setBusy] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const [mediaFailed, setMediaFailed] = useState(false)
  const [reducedMotion] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  )

  const poster = `${import.meta.env.BASE_URL}media/splash-poster.jpg`

  function freezeSplashAtEnd(video: HTMLVideoElement) {
    video.pause()
    if (Number.isFinite(video.duration) && video.duration > 0.12) {
      video.currentTime = Math.max(0, video.duration - 0.08)
    }
  }

  useEffect(() => {
    if (!restoring && !busy) action.current?.focus({ preventScroll: true })
  }, [restoring, busy])

  async function handleSignIn() {
    if (busy) return
    setBusy(true)
    try {
      await onSignIn()
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="signin" id="main" tabIndex={-1}>
      <section className="signin-shell" aria-labelledby="signin-title">
        <div className="signin-media" aria-hidden="true">
          <img className="signin-media-backdrop" src={poster} alt="" draggable={false} />
          <img
            className={`signin-poster${videoReady && !mediaFailed ? ' is-covered' : ''}`}
            src={poster}
            alt=""
            draggable={false}
          />
          {!reducedMotion && !mediaFailed && (
            <video
              ref={splashVideo}
              className={`signin-video${videoReady ? ' is-ready' : ''}`}
              autoPlay
              muted
              playsInline
              preload="metadata"
              poster={poster}
              onCanPlay={() => setVideoReady(true)}
              onLoadedData={() => setVideoReady(true)}
              onEnded={(event) => freezeSplashAtEnd(event.currentTarget)}
              onError={() => {
                setMediaFailed(true)
                setVideoReady(false)
              }}
            >
              <source src={`${import.meta.env.BASE_URL}media/splashv1.mp4`} type="video/mp4" />
            </video>
          )}
          <div className="signin-media-separator" />
        </div>

        <div className="signin-content">
          <header className="signin-heading">
            <h1 className="signin-mark" id="signin-title">
              Argus
            </h1>
            <p className="signin-lede">A library of things you can actually finish.</p>
          </header>

          {restoring ? (
            <div className="signin-restoring" role="status" aria-live="polite">
              <span className="signin-spinner" aria-hidden="true" />
              <span>Checking your session…</span>
            </div>
          ) : (
            <>
              <button
                ref={action}
                className="signin-action"
                type="button"
                onClick={() => void handleSignIn()}
                disabled={busy}
                aria-busy={busy || undefined}
              >
                {busy ? <span className="signin-spinner" aria-hidden="true" /> : <GoogleMark />}
                <span>{busy ? 'Signing in…' : 'Continue with Google'}</span>
              </button>
              <p className="signin-note">
                Your library syncs to your account and stays available on this device.
              </p>
            </>
          )}

          {error && (
            <p className="signin-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </section>
    </main>
  )
}
