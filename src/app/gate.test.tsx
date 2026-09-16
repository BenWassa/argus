// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { LibraryProvider } from '../lib/store'
import { SyncProvider } from '../lib/sync/SyncProvider'
import { Gate } from './App'
import { rememberSignedIn } from '../lib/sync/session'
import type { SyncBackend, SyncUser } from '../lib/sync/backend'
import type { RemoteRecord } from '../lib/sync/plan'

/**
 * The entry boundary (#93 §1). The configured app must not mount any learner
 * surface merely because Firebase has identified a UID; it waits until that
 * UID's local/cloud recovery matrix is resolved.
 */

interface FakeBackend extends SyncBackend {
  emitUser: (user: SyncUser | null) => void
  emitRecords: (records: RemoteRecord[]) => void
  emitMeta: (json: string | null) => void
}

function fakeBackend(overrides: Partial<SyncBackend> = {}): FakeBackend {
  let userListener: (user: SyncUser | null) => void = () => {}
  let recordListener: (records: RemoteRecord[]) => void = () => {}
  let metaListener: (json: string | null) => void = () => {}
  return {
    configured: true,
    emitUser: (user) => userListener(user),
    emitRecords: (records) => recordListener(records),
    emitMeta: (json) => metaListener(json),
    observeUser: (next) => {
      userListener = next
      return () => {}
    },
    signIn: async () => {},
    signOut: async () => {},
    observeLibrary: (_uid, onRecords) => {
      recordListener = onRecords
      return () => {}
    },
    pushTopic: async () => {},
    deleteTopic: async () => {},
    observeMeta: (_uid, onMeta) => {
      metaListener = onMeta
      return () => {}
    },
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
        <Gate />
      </SyncProvider>
    </LibraryProvider>,
  )
}

function finishEmptyBootstrap(backend: FakeBackend) {
  act(() => {
    backend.emitRecords([])
    backend.emitMeta(null)
  })
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

  it('keeps learner surfaces unmounted after auth until cloud bootstrap finishes', async () => {
    const backend = fakeBackend()
    renderApp(backend)
    await act(async () => {
      screen.getByRole('button', { name: /continue with google/i }).click()
    })
    act(() => backend.emitUser(OWNER))

    expect(screen.getByText(/checking your session/i)).toBeTruthy()
    expect(screen.queryByRole('navigation', { name: 'Sections' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Today' })).toBeNull()

    finishEmptyBootstrap(backend)
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy())
  })

  it('opens once somebody is signed in and their learner library is reconciled', async () => {
    const backend = fakeBackend()
    renderApp(backend)
    await act(async () => {
      screen.getByRole('button', { name: /continue with google/i }).click()
    })
    act(() => backend.emitUser(OWNER))
    finishEmptyBootstrap(backend)
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy())
    expect(screen.queryByRole('button', { name: /continue with google/i })).toBeNull()
  })

  it('holds the door while a returning session is being checked', () => {
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

  it('shuts again on sign-out without showing the previous account library', async () => {
    const backend = fakeBackend()
    renderApp(backend)
    await act(async () => {
      screen.getByRole('button', { name: /continue with google/i }).click()
    })
    act(() => backend.emitUser(OWNER))
    finishEmptyBootstrap(backend)
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy())
    act(() => backend.emitUser(null))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /continue with google/i })).toBeTruthy(),
    )
    expect(screen.queryByRole('navigation', { name: 'Sections' })).toBeNull()
  })
})

describe('a build with no Firebase configuration', () => {
  it('is not gated, because there is nothing to sign in to', () => {
    renderApp({ ...fakeBackend(), configured: false })
    expect(screen.queryByRole('button', { name: /continue with google/i })).toBeNull()
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy()
  })
})
