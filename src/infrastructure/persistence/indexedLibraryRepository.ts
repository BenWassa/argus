import type { CurrentLibrary } from '../../domain/library/library'
import { parseLibrary } from './libraryParser'

export const LOCAL_DATABASE = 'argus.local.v1'
export const LOCAL_DATABASE_VERSION = 1
const LIBRARIES = 'libraries'
const OUTBOX = 'outbox'
const LEDGERS = 'ledgers'
const MIGRATIONS = 'migrations'

export class LocalDurabilityError extends Error {
  constructor(public readonly kind: 'unavailable' | 'blocked' | 'corrupt' | 'missing' | 'write-failed', message: string, cause?: unknown) {
    super(message, { cause })
    this.name = 'LocalDurabilityError'
  }
}

export interface LocalLibraryRecord {
  owner: string
  revision: number
  library: CurrentLibrary
}

/** One cumulative snapshot per owner; coalescing never drops surviving progress. */
export interface PendingLibrarySync extends LocalLibraryRecord {
  deletedTopicIds: string[]
}

export interface MigrationRecord {
  owner: string
  sourceKey: string | null
  verified: boolean
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function completed(tx: IDBTransaction): Promise<void> {
  const promise = new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onabort = () => reject(new LocalDurabilityError('write-failed', 'This change could not be saved on this device.', tx.error))
    tx.onerror = () => { /* abort carries the final result; never report an early success */ }
  })
  // A failed request can reject before its transaction's abort event arrives.
  // The caller still awaits this promise; this suppresses only premature noise.
  void promise.catch(() => {})
  return promise
}

function validLibrary(value: unknown): CurrentLibrary {
  const parsed = parseLibrary(value)
  if (!parsed.ok) throw new LocalDurabilityError('corrupt', `The saved library needs recovery: ${parsed.error}`)
  return parsed.library
}

function validRecord(value: LocalLibraryRecord | undefined, owner: string): LocalLibraryRecord | null {
  if (value === undefined) return null
  if (value.owner !== owner || !Number.isSafeInteger(value.revision) || value.revision < 1) {
    throw new LocalDurabilityError('corrupt', 'The saved library record needs recovery.')
  }
  return { ...value, library: validLibrary(value.library) }
}

function requireOwner(owner: string): void {
  if (!owner || owner.length > 256) throw new LocalDurabilityError('corrupt', 'A local library needs a valid owner key.')
}

export interface IndexedLibraryRepository {
  read(owner: string): Promise<LocalLibraryRecord | null>
  initialize(owner: string, input: { seed: CurrentLibrary; legacy?: { key: string; raw: string } }): Promise<LocalLibraryRecord>
  update(owner: string, change: (current: CurrentLibrary) => CurrentLibrary): Promise<LocalLibraryRecord>
  pending(owner: string): Promise<PendingLibrarySync | null>
  /** Ack only the snapshot actually sent, never a newer offline mutation. */
  acknowledge(owner: string, revision: number, ledger: Record<string, unknown>): Promise<boolean>
  readLedger(owner: string): Promise<Record<string, unknown>>
  migration(owner: string): Promise<MigrationRecord | null>
  close(): void
}

/** Native IndexedDB only. No Firebase, React, silent reseeding or legacy-key deletion. */
export async function openIndexedLibraryRepository(name = LOCAL_DATABASE): Promise<IndexedLibraryRepository> {
  if (typeof indexedDB === 'undefined') throw new LocalDurabilityError('unavailable', 'Durable local storage is unavailable in this browser.')
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    let rejected = false
    const opening = indexedDB.open(name, LOCAL_DATABASE_VERSION)
    opening.onupgradeneeded = () => {
      if (rejected) { opening.transaction?.abort(); return }
      for (const store of [LIBRARIES, OUTBOX, LEDGERS, MIGRATIONS]) {
        if (!opening.result.objectStoreNames.contains(store)) opening.result.createObjectStore(store, { keyPath: 'owner' })
      }
    }
    opening.onerror = () => reject(new LocalDurabilityError('unavailable', 'The local database could not be opened.', opening.error))
    opening.onblocked = () => {
      rejected = true
      reject(new LocalDurabilityError('blocked', 'Close other Argus tabs and retry the local database update.'))
    }
    opening.onsuccess = () => {
      if (rejected) opening.result.close()
      else resolve(opening.result)
    }
  })
  // An upgraded app must never leave another tab's upgrade blocked indefinitely.
  db.onversionchange = () => db.close()

  function write(stores: string[]): IDBTransaction {
    try {
      return db.transaction(stores, 'readwrite', { durability: 'strict' })
    } catch (error) {
      // Older browsers omit the optional durability argument entirely.
      if (error instanceof TypeError) return db.transaction(stores, 'readwrite')
      throw error
    }
  }

  async function get<T>(store: string, owner: string): Promise<T | undefined> {
    requireOwner(owner)
    const tx = db.transaction(store, 'readonly')
    const done = completed(tx)
    try {
      const value = await request<T | undefined>(tx.objectStore(store).get(owner))
      await done
      return value
    } catch (error) {
      await done.catch(() => {})
      throw new LocalDurabilityError('unavailable', 'The local database could not be read.', error)
    }
  }

  async function transaction<T>(stores: string[], run: (tx: IDBTransaction) => Promise<T>): Promise<T> {
    const tx = write(stores)
    const done = completed(tx)
    try {
      const result = await run(tx)
      await done
      return result
    } catch (error) {
      try { tx.abort() } catch { /* already completed or aborted */ }
      await done.catch(() => {})
      if (error instanceof LocalDurabilityError) throw error
      throw new LocalDurabilityError('write-failed', 'This change could not be saved on this device.', error)
    }
  }

  const repository: IndexedLibraryRepository = {
    async read(owner) {
      return validRecord(await get<LocalLibraryRecord>(LIBRARIES, owner), owner)
    },

    async initialize(owner, input) {
      requireOwner(owner)
      // Canonical data wins, even if an abandoned legacy copy is now malformed.
      // Read errors and corrupt canonical records are never interpreted as empty.
      const existing = await repository.read(owner)
      let candidate: CurrentLibrary | undefined
      if (!existing) {
        if (input.legacy) {
          let json: unknown
          try { json = JSON.parse(input.legacy.raw) } catch (error) {
            throw new LocalDurabilityError('corrupt', 'The legacy library needs recovery; its original bytes were kept.', error)
          }
          candidate = validLibrary(json)
        } else candidate = validLibrary(input.seed)
      }
      await transaction([LIBRARIES, OUTBOX, MIGRATIONS], async (tx) => {
        const stored = validRecord(await request<LocalLibraryRecord | undefined>(tx.objectStore(LIBRARIES).get(owner)), owner)
        if (stored) return
        const row: LocalLibraryRecord = { owner, revision: 1, library: candidate! }
        tx.objectStore(LIBRARIES).put(row)
        tx.objectStore(OUTBOX).put({ ...row, deletedTopicIds: [] } satisfies PendingLibrarySync)
        tx.objectStore(MIGRATIONS).put({ owner, sourceKey: input.legacy?.key ?? null, verified: false } satisfies MigrationRecord)
      })
      // Completion is not marked until the committed copy crosses the parser again.
      const verified = await repository.read(owner)
      if (!verified) throw new LocalDurabilityError('corrupt', 'The migrated library could not be verified.')
      await transaction([MIGRATIONS], async (tx) => {
        const marker = await request<MigrationRecord | undefined>(tx.objectStore(MIGRATIONS).get(owner))
        if (marker && !marker.verified) tx.objectStore(MIGRATIONS).put({ ...marker, verified: true })
      })
      return verified
    },

    async update(owner, change) {
      requireOwner(owner)
      return transaction([LIBRARIES, OUTBOX], async (tx) => {
        const before = validRecord(await request<LocalLibraryRecord | undefined>(tx.objectStore(LIBRARIES).get(owner)), owner)
        if (!before) throw new LocalDurabilityError('missing', 'No local library exists for this owner.')
        const next = validLibrary(change(before.library))
        if (JSON.stringify(next) === JSON.stringify(before.library)) return before
        const revision = before.revision + 1
        if (!Number.isSafeInteger(revision)) throw new LocalDurabilityError('corrupt', 'The local revision counter needs recovery.')
        const prior = await request<PendingLibrarySync | undefined>(tx.objectStore(OUTBOX).get(owner))
        const live = new Set(next.topics.map((topic) => topic.id))
        const deleted = new Set([...(prior?.deletedTopicIds ?? []), ...before.library.topics.filter((topic) => !live.has(topic.id)).map((topic) => topic.id)])
        for (const id of live) deleted.delete(id)
        const row: LocalLibraryRecord = { owner, revision, library: next }
        tx.objectStore(LIBRARIES).put(row)
        tx.objectStore(OUTBOX).put({ ...row, deletedTopicIds: [...deleted].sort() } satisfies PendingLibrarySync)
        return row
      })
    },

    async pending(owner) {
      const value = await get<PendingLibrarySync>(OUTBOX, owner)
      const valid = validRecord(value, owner)
      if (!value || !valid) return null
      if (!Array.isArray(value.deletedTopicIds) || !value.deletedTopicIds.every((id) => typeof id === 'string')) {
        throw new LocalDurabilityError('corrupt', 'Pending sync intent needs recovery.')
      }
      return { ...valid, deletedTopicIds: value.deletedTopicIds }
    },

    async acknowledge(owner, revision, ledger) {
      requireOwner(owner)
      if (!Number.isSafeInteger(revision) || revision < 1) throw new LocalDurabilityError('corrupt', 'Invalid sync acknowledgement revision.')
      return transaction([OUTBOX, LEDGERS], async (tx) => {
        const pending = await request<PendingLibrarySync | undefined>(tx.objectStore(OUTBOX).get(owner))
        if (!pending || pending.revision !== revision) return false
        tx.objectStore(LEDGERS).put({ owner, ledger })
        tx.objectStore(OUTBOX).delete(owner)
        return true
      })
    },

    async readLedger(owner) {
      const value = await get<{ owner: string; ledger: Record<string, unknown> }>(LEDGERS, owner)
      if (!value) return {}
      if (value.owner !== owner || !value.ledger || typeof value.ledger !== 'object' || Array.isArray(value.ledger)) {
        throw new LocalDurabilityError('corrupt', 'The local sync ledger needs recovery.')
      }
      return value.ledger
    },

    async migration(owner) { return await get<MigrationRecord>(MIGRATIONS, owner) ?? null },
    close() { db.close() },
  }
  return repository
}
