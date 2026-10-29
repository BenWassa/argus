// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { LibraryProvider } from '../../services/library/LibraryProvider'
import type { SyncState } from '../../services/sync/useSync'
import { ProfilePage } from './ProfilePage'

const sync = vi.hoisted(() => ({ state: { kind: 'unconfigured' } as SyncState, pending: null as boolean | null, conflicts: [] as string[] }))
vi.mock('../../services/sync/SyncProvider', () => ({
  useSyncState: () => ({ ...sync, signIn: async () => {}, signOut: async () => {} }),
}))
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); sync.pending = null; sync.conflicts = [] })
async function profile() {
  render(<LibraryProvider><ProfilePage onBack={() => {}} /></LibraryProvider>)
  await act(async () => {})
}
it('keeps pending changes visible when cloud writes fail', async () => {
  sync.state = { kind: 'error', user: { uid: 'a', email: null, displayName: null }, message: 'unavailable' }
  sync.pending = true
  await profile()
  expect(screen.getByText('Pending sync').parentElement?.textContent).toContain('Changes saved on this device')
  expect(screen.getByText(/unavailable The library/).textContent).toContain('unavailable')
})
it('reports conflict count without saying everything is in step', async () => {
  sync.state = { kind: 'synced', user: { uid: 'a', email: null, displayName: null }, at: new Date(), conflicts: ['one', 'two'] }
  sync.conflicts = ['one', 'two']
  sync.pending = true
  await profile()
  expect(screen.getByText('Sync conflicts').parentElement?.textContent).toContain('2 topics need review')
  expect(screen.queryByText(/Everything is in step/)).toBeNull()
})
it('states offline session and network status with the existing device rows', async () => {
  sync.state = { kind: 'offline', owner: 'a' }
  sync.pending = true
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
  await profile()
  expect(screen.getByText('Network').parentElement?.textContent).toContain('Offline')
  expect(screen.getByText(/Sync will resume/).textContent).toContain('Sync will resume')
  expect(screen.getByText('Storage')).toBeTruthy()
})
