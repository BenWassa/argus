import { useCallback, useEffect, useState } from 'react'
import { browserTestUid, firebaseServices } from './firebaseClient'

export interface ArgusUser {
  uid: string
  email: string | null
  displayName: string | null
}

export type AuthState =
  | { status: 'loading'; user: null; error: null }
  | { status: 'signed-out'; user: null; error: null }
  | { status: 'ready'; user: ArgusUser; error: null }
  | { status: 'error'; user: null; error: string }

const TEST_SIGNED_OUT_KEY = 'argus.test-auth.signed-out'

function toArgusUser(user: { uid: string; email: string | null; displayName: string | null }): ArgusUser {
  return { uid: user.uid, email: user.email, displayName: user.displayName }
}

function authError(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : ''
  if (code.includes('popup-closed') || code.includes('cancelled-popup')) return 'Google sign-in was closed before it finished.'
  if (code.includes('popup-blocked')) return 'The browser blocked the Google sign-in window. Allow pop-ups and try again.'
  if (code.includes('network') || code.includes('unavailable')) return 'Google sign-in could not be reached. Check the connection and try again.'
  if (error instanceof Error && error.message) return error.message
  return 'Google sign-in could not be completed.'
}

/**
 * Application auth authority. No learner UI mounts until this hook reports a
 * restored/signed-in user and progress bootstrap has reconciled that UID.
 */
export function useAuthSession() {
  const testUid = browserTestUid()
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null, error: null })
  const [generation, setGeneration] = useState(0)

  useEffect(() => {
    let cancelled = false

    if (testUid) {
      queueMicrotask(() => {
        if (cancelled) return
        const signedOut = window.localStorage.getItem(TEST_SIGNED_OUT_KEY) === 'true'
        setState(
          signedOut
            ? { status: 'signed-out', user: null, error: null }
            : {
                status: 'ready',
                user: { uid: testUid, email: 'argus-e2e@example.test', displayName: 'Argus E2E' },
                error: null,
              },
        )
      })
      return () => {
        cancelled = true
      }
    }

    let unsubscribe: (() => void) | null = null
    void firebaseServices()
      .then(({ auth, authApi }) => {
        if (cancelled) return
        unsubscribe = authApi.onAuthStateChanged(
          auth,
          (user) => {
            if (cancelled) return
            setState(
              user
                ? { status: 'ready', user: toArgusUser(user), error: null }
                : { status: 'signed-out', user: null, error: null },
            )
          },
          (error) => {
            if (!cancelled) setState({ status: 'error', user: null, error: authError(error) })
          },
        )
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ status: 'error', user: null, error: authError(error) })
      })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [generation, testUid])

  const signIn = useCallback(async () => {
    setState({ status: 'loading', user: null, error: null })
    if (testUid) {
      window.localStorage.removeItem(TEST_SIGNED_OUT_KEY)
      setState({
        status: 'ready',
        user: { uid: testUid, email: 'argus-e2e@example.test', displayName: 'Argus E2E' },
        error: null,
      })
      return
    }

    try {
      const { auth, authApi } = await firebaseServices()
      const provider = new authApi.GoogleAuthProvider()
      await authApi.signInWithPopup(auth, provider)
      // onAuthStateChanged is authoritative; do not duplicate the restored user.
    } catch (error) {
      setState({ status: 'error', user: null, error: authError(error) })
    }
  }, [testUid])

  const signOut = useCallback(async () => {
    if (testUid) {
      window.localStorage.setItem(TEST_SIGNED_OUT_KEY, 'true')
      setState({ status: 'signed-out', user: null, error: null })
      return
    }
    try {
      const { auth, authApi } = await firebaseServices()
      await authApi.signOut(auth)
      setState({ status: 'signed-out', user: null, error: null })
    } catch (error) {
      setState({ status: 'error', user: null, error: authError(error) })
    }
  }, [testUid])

  const retry = useCallback(() => {
    setState({ status: 'loading', user: null, error: null })
    setGeneration((value) => value + 1)
  }, [])

  return { ...state, signIn, signOut, retry }
}
