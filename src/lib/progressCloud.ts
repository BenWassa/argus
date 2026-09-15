import { browserTestUid, firebaseServices } from './firebaseClient'
import {
  browserTestProgressCloud,
  CloudRevisionConflictError,
  type CloudLibrarySnapshot,
  type ProgressCloud,
} from './progressSync'
import { parseLibrary } from './storage'

const CLOUD_FORMAT = 1

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseCloudRecord(data: unknown): CloudLibrarySnapshot {
  if (!isRecord(data) || data.format !== CLOUD_FORMAT) {
    throw new Error('The cloud learner-library envelope is invalid.')
  }
  if (!Number.isInteger(data.revision) || Number(data.revision) < 1) {
    throw new Error('The cloud learner-library revision is invalid.')
  }
  if (typeof data.lastMutationId !== 'string' || !data.lastMutationId) {
    throw new Error('The cloud learner-library mutation id is invalid.')
  }

  // The cloud payload crosses the exact same trust boundary as local storage
  // and import. Firestore is persistence, not a second learner schema.
  const parsed = parseLibrary(data.library)
  if (!parsed.ok) throw new Error(`Cloud learner library: ${parsed.error}`)
  return {
    revision: Number(data.revision),
    library: parsed.library,
    lastMutationId: data.lastMutationId,
  }
}

export function firebaseProgressCloud(): ProgressCloud {
  return {
    async read(uid) {
      const { db, dbApi } = await firebaseServices()
      const snapshot = await dbApi.getDoc(dbApi.doc(db, `users/${uid}/library/current`))
      return snapshot.exists() ? parseCloudRecord(snapshot.data()) : null
    },

    async write(uid, expectedRevision, library, mutationId) {
      const { db, dbApi } = await firebaseServices()
      const ref = dbApi.doc(db, `users/${uid}/library/current`)

      return dbApi.runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(ref)
        const current = snapshot.exists() ? parseCloudRecord(snapshot.data()) : null

        // A response can be lost after Firestore committed. Retrying the same
        // mutation is therefore idempotent rather than becoming a false conflict.
        if (current?.lastMutationId === mutationId) return current
        if ((current?.revision ?? null) !== expectedRevision) {
          throw new CloudRevisionConflictError()
        }

        const next: CloudLibrarySnapshot = {
          revision: (current?.revision ?? 0) + 1,
          library,
          lastMutationId: mutationId,
        }
        transaction.set(ref, {
          format: CLOUD_FORMAT,
          revision: next.revision,
          library: next.library,
          lastMutationId: mutationId,
          updatedAt: dbApi.serverTimestamp(),
        })
        return next
      })
    },
  }
}

let shared: ProgressCloud | null = null

export function defaultProgressCloud(): ProgressCloud {
  shared ??= browserTestUid() ? browserTestProgressCloud() : firebaseProgressCloud()
  return shared
}
