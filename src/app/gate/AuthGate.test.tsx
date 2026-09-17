// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { LibraryProvider } from '../../lib/LibraryProvider'
import { SyncProvider } from '../../lib/sync/SyncProvider'
import { AuthGate } from './AuthGate'
import { rememberSignedIn } from '../../lib/sync/session'
import type { SyncBackend, SyncUser } from '../../lib/sync/backend'

/**
 * The entry boundary (#93 §1), which the browser suite deliberately does not
 * cover: it runs the local-only configuration, because it cannot sign in to
 * Google. So the gate is pinned here instead.
 *
 * What matters is not only that a sign-in screen appears, but that the learning
 * surfaces never mount behind it. A guard that renders `Today` and hides it is
 * not a boundary — it has already read the library.
 */

function fakeBackend(overrides: Partial<SyncBackend> = {}): SyncBackend & {
  emitUser: (user: SyncUser | null) => void
} {
  let listener: (user: SyncUser | null) => void = () => {}
  return {
    configured: true,
    emitUser: (user) => listener(user),
    observeUser: (next) => {
      listener = next
      return () => {}
    },
    signIn: async () => {},
    signOut: async () => {},
    observeLibrary: () => () => {},
    pushTopic: async () => {},
    deleteTopic: async () => {},
    observeMeta: () => () => {},
    pushMeta: async () => {},
    ...overrides,
  }
}

const OWNER: SyncUser = { uid: 'owner', email: 'owner@example.test', displayName: 'Owner' }

afterEach(() => {
  cleanup()
  localStorage.clear()
})

function renderApp(backend: SyncBackend) {
  return render(
    <LibraryProvider>
      <SyncProvider backend={backend}>
        <AuthGate />
      </SyncProvider>
    </LibraryProvider>,
  )
}

describe('a build with an account to sign in to', () => {
  it('asks who you are before showing anything of the library', () => {
    renderApp(fakeBackend())
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Argus' })).toBeTruthy()
    // The surfaces behind the gate must not have mounted at all.
    expect(screen.queryByRole('navigation', { name: 'Sections' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Today' })).toBeNull()
  })

  it('opens once somebody is signed in', async () => {
    // The real sequence: pressing the button is what makes Argus ask Firebase
    // anything at all, and the answer arrives afterwards.
    const backend = fakeBackend()
    renderApp(backend)
    await act(async () => {
      screen.getByRole('button', { name: /continue with google/i }).click()
    })
    act(() => backend.emitUser(OWNER))
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /continue with google/i })).toBeNull(),
    )
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy()
  })

  it('holds the door while a returning session is being checked', () => {
    // Neither screen is right yet: showing sign-in would ask a signed-in owner
    // to sign in again, and showing the library would expose it to somebody who
    // may turn out not to be signed in at all.
    rememberSignedIn()
    renderApp(fakeBackend())
    expect(screen.getByText(/checking your session/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /continue with google/i })).toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Sections' })).toBeNull()
  })

  it('keeps the door shut when signing in fails, and says why', async () => {
    const backend = fakeBackend({
      signIn: async () => {
        throw new Error('popup-blocked')
      },
    })
    renderApp(backend)
    const button = screen.getByRole('button', { name: /continue with google/i })
    await act(async () => {
      button.click()
    })
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('popup-blocked'))
    expect(screen.queryByRole('navigation', { name: 'Sections' })).toBeNull()
  })

  it('shuts again on sign-out', async () => {
    const backend = fakeBackend()
    renderApp(backend)
    await act(async () => {
      screen.getByRole('button', { name: /continue with google/i }).click()
    })
    act(() => backend.emitUser(OWNER))
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy())
    act(() => backend.emitUser(null))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /continue with google/i })).toBeTruthy(),
    )
  })
})

describe('a build with no Firebase configuration', () => {
  it('is not gated, because there is nothing to sign in to', () => {
    // The local-only configuration the repository has always supported, and
    // what the browser suite runs against.
    renderApp({ ...fakeBackend(), configured: false })
    expect(screen.queryByRole('button', { name: /continue with google/i })).toBeNull()
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy()
  })
})
