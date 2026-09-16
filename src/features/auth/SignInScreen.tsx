import { useEffect, useRef } from 'react'
import './SignInScreen.css'

/**
 * The entry boundary (#93 §1).
 *
 * Argus asks who you are before it shows you anything, because the learning
 * record is now an account's record rather than a browser's. The composition is
 * the one the issue asks for and nothing more: the splash imagery it already
 * owns, the name, one action. It is not an onboarding carousel and has no
 * second way in.
 *
 * `restoring` is a separate state on purpose. A returning owner must never be
 * shown a sign-in button they do not need, and nobody may be shown the library
 * before Firebase has confirmed the session — so this screen holds the door in
 * both directions while that resolves.
 */
export function SignInScreen({
  restoring,
  error,
  onSignIn,
}: {
  restoring: boolean
  error: string | null
  onSignIn: () => void
}) {
  const action = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!restoring) action.current?.focus({ preventScroll: true })
  }, [restoring])

  return (
    <main className="signin" id="main">
      <img
        className="signin-atmosphere"
        src={`${import.meta.env.BASE_URL}media/splash-poster.jpg`}
        alt=""
        aria-hidden="true"
        draggable={false}
      />

      <div className="signin-stage">
        <h1 className="signin-mark">Argus</h1>
        <p className="signin-lede">A library of things you can actually finish.</p>

        {restoring ? (
          // Deliberately not a button. There is nothing to decide yet, and
          // offering an action here is how a returning owner ends up signing in
          // twice.
          <p className="signin-status" role="status" aria-live="polite">
            Checking your session…
          </p>
        ) : (
          <>
            <button ref={action} className="signin-action" type="button" onClick={onSignIn}>
              Continue with Google
            </button>
            <p className="signin-note">
              Your library syncs to your account, and stays on this device between visits.
            </p>
          </>
        )}

        <p className={error ? 'signin-status error' : 'signin-status'} role="status" aria-live="polite">
          {error ?? ''}
        </p>
      </div>
    </main>
  )
}
