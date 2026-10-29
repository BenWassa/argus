import { afterEach, expect, it, vi } from 'vitest'
import { firebaseSyncBackend } from './firebaseSyncBackend'

type Snapshot = { metadata: { fromCache: boolean; hasPendingWrites: boolean }; docs: []; data: () => undefined }
type Listener = (snapshot: Snapshot) => void
const sdk = vi.hoisted(() => ({ listeners: [] as Listener[], options: [] as unknown[] }))
vi.mock('firebase/app', () => ({ getApps: () => [{}] }))
vi.mock('firebase/auth', () => ({ getAuth: () => ({}) }))
vi.mock('firebase/firestore', () => ({
  getFirestore: () => ({}), collection: () => ({}), doc: () => ({}),
  onSnapshot: (_ref: unknown, options: unknown, listener: Listener) => {
    sdk.options.push(options)
    sdk.listeners.push(typeof options === 'function' ? options as Listener : listener)
    return () => {}
  },
}))
afterEach(() => { sdk.listeners = []; sdk.options = [] })
it('plans only from server-confirmed snapshots, including metadata-only confirmations', async () => {
  const backend = firebaseSyncBackend({ apiKey: 'a', appId: 'a', authDomain: 'a', projectId: 'a' })
  const records = vi.fn()
  const meta = vi.fn()
  const stop = backend.observeLibrary('a', records, vi.fn())
  const stopMeta = backend.observeMeta('a', meta, vi.fn())
  await vi.waitFor(() => expect(sdk.listeners).toHaveLength(2))
  const snapshot: Snapshot = { metadata: { fromCache: true, hasPendingWrites: false }, docs: [], data: () => undefined }
  for (const listener of sdk.listeners) listener(snapshot)
  expect(records).not.toHaveBeenCalled()
  expect(meta).not.toHaveBeenCalled()
  for (const listener of sdk.listeners) listener({ ...snapshot, metadata: { fromCache: false, hasPendingWrites: true } })
  expect(records).not.toHaveBeenCalled()
  expect(meta).not.toHaveBeenCalled()
  for (const listener of sdk.listeners) listener({ ...snapshot, metadata: { fromCache: false, hasPendingWrites: false } })
  expect(records).toHaveBeenCalledWith([])
  expect(meta).toHaveBeenCalledWith(null)
  expect(sdk.options).toEqual([{ includeMetadataChanges: true }, { includeMetadataChanges: true }])
  stop(); stopMeta()
})
