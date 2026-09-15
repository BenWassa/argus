import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { renderRules } from '../scripts/renderRules.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const INBOX_UID = 'argus-authorized-uid-000001'
const ACCOUNT_A = 'progress-account-a'
const ACCOUNT_B = 'progress-account-b'

let env: RulesTestEnvironment

function libraryPath(uid: string, id = 'current') {
  return `users/${uid}/library/${id}`
}

function record(revision = 1) {
  return {
    format: 1,
    revision,
    library: { version: 5, topics: [], catalogDelivered: [] },
    lastMutationId: `mutation-${revision}`,
    updatedAt: serverTimestamp(),
  }
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'argus-rules-test',
    firestore: {
      rules: renderRules(readFileSync(join(ROOT, 'firestore.rules.template'), 'utf8'), INBOX_UID),
      host: '127.0.0.1',
      port: 8080,
    },
  })
})

afterAll(async () => {
  await env?.cleanup()
})

beforeEach(async () => {
  await env.clearFirestore()
})

describe('learner-library ownership', () => {
  it('lets each authenticated account create and read only its own current document', async () => {
    const a = env.authenticatedContext(ACCOUNT_A).firestore()
    const b = env.authenticatedContext(ACCOUNT_B).firestore()

    await assertSucceeds(setDoc(doc(a, libraryPath(ACCOUNT_A)), record()))
    await assertSucceeds(setDoc(doc(b, libraryPath(ACCOUNT_B)), record()))
    await assertSucceeds(getDoc(doc(a, libraryPath(ACCOUNT_A))))
    await assertSucceeds(getDoc(doc(b, libraryPath(ACCOUNT_B))))

    await assertFails(getDoc(doc(a, libraryPath(ACCOUNT_B))))
    await assertFails(getDoc(doc(b, libraryPath(ACCOUNT_A))))
  })

  it('denies unauthenticated access and non-current library documents', async () => {
    const anonymous = env.unauthenticatedContext().firestore()
    const a = env.authenticatedContext(ACCOUNT_A).firestore()
    await assertFails(getDoc(doc(anonymous, libraryPath(ACCOUNT_A))))
    await assertFails(setDoc(doc(anonymous, libraryPath(ACCOUNT_A)), record()))
    await assertFails(setDoc(doc(a, libraryPath(ACCOUNT_A, 'other')), record()))
  })
})

describe('learner-library revision contract', () => {
  it('requires revision 1 on create and exact +1 updates', async () => {
    const db = env.authenticatedContext(ACCOUNT_A).firestore()
    const ref = doc(db, libraryPath(ACCOUNT_A))

    await assertFails(setDoc(ref, record(2)))
    await assertSucceeds(setDoc(ref, record(1)))
    await assertFails(updateDoc(ref, { revision: 3, lastMutationId: 'skip', updatedAt: serverTimestamp() }))
    await assertSucceeds(updateDoc(ref, { revision: 2, lastMutationId: 'next', updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(ref, { revision: 2, lastMutationId: 'same', updatedAt: serverTimestamp() }))
  })

  it('rejects malformed envelopes, client timestamps and deletion', async () => {
    const db = env.authenticatedContext(ACCOUNT_A).firestore()
    const ref = doc(db, libraryPath(ACCOUNT_A))

    await assertFails(setDoc(ref, { ...record(), library: { version: 4, topics: [] } }))
    await assertFails(setDoc(ref, { ...record(), extra: true }))
    await assertFails(setDoc(ref, { ...record(), updatedAt: new Date('2020-01-01T00:00:00Z') }))

    await assertSucceeds(setDoc(ref, record()))
    await assertFails(deleteDoc(ref))
  })
})
