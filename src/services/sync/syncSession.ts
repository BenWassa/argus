/**
 * Whether this device has ever signed in.
 *
 * Firebase restores a session from its own storage, but asking it to do so
 * means loading the Auth SDK and letting it call out to Google — on every page
 * load, for everybody, including the overwhelming majority of loads where
 * nobody has ever signed in and the answer is always no.
 *
 * A one-key marker answers that cheaply. It is set when a sign-in succeeds and
 * cleared when one signs out, so a returning owner still has their session
 * restored and a signed-out visitor never pays for the SDK at all. It is a
 * hint, not authority: being present only causes Firebase to be asked, and
 * Security Rules remain the only thing that decides what anyone may read.
 */

const KEY = 'argus.sync.signedIn'

export function hasSignedIn(): boolean {
  try {
    return localStorage.getItem(KEY) === 'true'
  } catch {
    // A browser refusing storage simply pays the load cost, which is the safe
    // way round: sync still works, it just is not deferred.
    return true
  }
}

export function rememberSignedIn(): void {
  try {
    localStorage.setItem(KEY, 'true')
  } catch {
    // Nothing to do. The next load asks Firebase instead of skipping it.
  }
}

export function forgetSignedIn(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // As above: failing to clear the hint costs a load, not correctness.
  }
}
