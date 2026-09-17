import { useSyncState } from '../../services/sync/SyncProvider'
import { SignInScreen } from '../../features/auth/SignInScreen'
import { AppRouter } from '../routing/AppRouter'

/**
 * Nothing about the learning product renders until Argus knows whose it is
 * (#93 §1).
 *
 * The gate is on the *render*, not on navigation, because a route guard still
 * mounts the surfaces behind it: `Today` would read the local library and paint
 * a moment of somebody's shelves before auth resolved. Returning `SignInScreen`
 * instead means those components never mount at all.
 *
 * A build with no Firebase configuration is not gated. That is not a loophole
 * left open for convenience — it is the configuration the repository has always
 * supported, where there is nothing to sign in to and Argus is a local-only
 * app. It is also what the browser suite runs against.
 */
export function AuthGate() {
  const { state, signIn } = useSyncState()

  // Who is in, stated positively. A sign-in that failed reports an error with
  // nobody attached, and reading that as "not signed out" would let a failure
  // open the door — so the test is for a user, never for the absence of one.
  const signedIn =
    state.kind === 'syncing' ||
    state.kind === 'synced' ||
    (state.kind === 'error' && state.user !== null)

  const open = state.kind === 'unconfigured' || signedIn

  return (
    <div className="app-runtime">
      {open ? (
        <AppRouter />
      ) : (
        <SignInScreen
          restoring={state.kind === 'restoring'}
          error={state.kind === 'error' ? state.message : null}
          onSignIn={signIn}
        />
      )}
    </div>
  )
}
