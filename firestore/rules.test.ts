import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { renderRules } from '../scripts/renderRules.mjs'

/**
 * Security Rules are the trust boundary for everything the browser does to the
 * content inbox, so they are tested against the real Firestore emulator rather
 * than reasoned about. Run with `npm run test:rules`.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OWNER_EMAIL = 'owner@googlemail.com'
/** The same account, spelled the way Google may also present it. */
const OWNER_TWIN = 'owner@gmail.com'
const AUTHORIZED_UID = 'argus-authorized-uid-000001'
const OTHER_UID = 'some-other-google-account-99'
const OTHER_EMAIL = 'someone.else@example.test'

let env: RulesTestEnvironment

/**
 * The owner is their verified address, not their UID, so a test identity has to
 * carry the token claims a real Google sign-in would. A UID alone proves
 * nothing now, which is the point of the model and is asserted below.
 */
function ownerDb(uid: string = AUTHORIZED_UID) {
  return env
    .authenticatedContext(uid, { email: OWNER_EMAIL, email_verified: true })
    .firestore()
}

function inbox(uid: string) {
  return `users/${uid}/inbox`
}

function library(uid: string) {
  return `users/${uid}/library`
}

/** A synced topic as the client writes it: the v5 JSON, carried verbatim. */
function syncedTopic(topicId: string, revision = 1) {
  return {
    topicId,
    json: JSON.stringify({ id: topicId, title: 'NATO phonetic', status: 'learning' }),
    revision,
    updatedAt: serverTimestamp(),
  }
}

const validPending = {
  text: 'Maritime signal flags',
  status: 'pending',
  trackHint: null,
  createdAt: serverTimestamp(),
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'argus-rules-test',
    firestore: {
      rules: renderRules(readFileSync(join(ROOT, 'firestore.rules.template'), 'utf8'), OWNER_EMAIL),
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

/** Write a record straight into the emulator, bypassing the rules under test. */
async function seed(path: string, data: Record<string, unknown>) {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data)
  })
}

describe('who may use the inbox', () => {
  it('lets the sole authorized user read and capture', async () => {
    const db = ownerDb()
    await assertSucceeds(addDoc(collection(db, inbox(AUTHORIZED_UID)), validPending))
    await assertSucceeds(getDocs(collection(db, inbox(AUTHORIZED_UID))))
  })

  it('denies an unauthenticated client', async () => {
    const db = env.unauthenticatedContext().firestore()
    await assertFails(getDocs(collection(db, inbox(AUTHORIZED_UID))))
    await assertFails(addDoc(collection(db, inbox(AUTHORIZED_UID)), validPending))
  })

  it('denies any other signed-in account, in its own subtree as well', async () => {
    // Signing in with a Google account is not authorization. Without this, any
    // Google user in the world would have a write path into the project.
    const db = env
      .authenticatedContext(OTHER_UID, { email: OTHER_EMAIL, email_verified: true })
      .firestore()
    await assertFails(getDocs(collection(db, inbox(AUTHORIZED_UID))))
    await assertFails(addDoc(collection(db, inbox(AUTHORIZED_UID)), validPending))
    await assertFails(addDoc(collection(db, inbox(OTHER_UID)), validPending))
    await assertFails(getDocs(collection(db, inbox(OTHER_UID))))
  })

  it('denies the owner everything outside their own two collections', async () => {
    const db = ownerDb()
    // A topic-shaped document is not a synced record: the library collection
    // takes the v5 JSON envelope and nothing else.
    await assertFails(setDoc(doc(db, `${library(AUTHORIZED_UID)}/nato-phonetic`), { title: 'NATO' }))
    await assertFails(setDoc(doc(db, 'topics/nato-phonetic'), { title: 'NATO' }))
    await assertFails(getDoc(doc(db, `users/${OTHER_UID}/inbox/anything`)))
  })

  it('denies an account holding the right address without having verified it', async () => {
    // `email_verified` is the whole reason an address is usable as an identity.
    // Without it a provider that never checked could assert any address at all.
    const db = env
      .authenticatedContext(AUTHORIZED_UID, { email: OWNER_EMAIL, email_verified: false })
      .firestore()
    await assertFails(getDocs(collection(db, inbox(AUTHORIZED_UID))))
    await assertFails(setDoc(doc(db, `${library(AUTHORIZED_UID)}/nato`), syncedTopic('nato')))
  })

  it('accepts the same account under its other Google spelling', async () => {
    // One account created on googlemail.com answers to gmail.com too, and which
    // one reaches the token is not ours to choose. Refusing the other spelling
    // would deny the real owner and look like sync being broken.
    const db = env
      .authenticatedContext(AUTHORIZED_UID, { email: OWNER_TWIN, email_verified: true })
      .firestore()
    await assertSucceeds(getDocs(collection(db, inbox(AUTHORIZED_UID))))
    await assertSucceeds(setDoc(doc(db, `${library(AUTHORIZED_UID)}/nato`), syncedTopic('nato')))
  })

  it('denies a signed-in account with no address claim at all', async () => {
    const db = env.authenticatedContext(AUTHORIZED_UID).firestore()
    await assertFails(getDocs(collection(db, inbox(AUTHORIZED_UID))))
    await assertFails(setDoc(doc(db, `${library(AUTHORIZED_UID)}/nato`), syncedTopic('nato')))
  })

  it('denies the owner writing into somebody else\'s subtree', async () => {
    // Being the owner authorizes the owner's own path, not the path itself.
    const db = ownerDb()
    await assertFails(setDoc(doc(db, `${library(OTHER_UID)}/nato`), syncedTopic('nato')))
    await assertFails(getDocs(collection(db, library(OTHER_UID))))
  })
})

describe('the synced learning record', () => {
  it('lets the owner write, read back and delete a topic', async () => {
    const db = ownerDb()
    const path = `${library(AUTHORIZED_UID)}/nato-phonetic`
    await assertSucceeds(setDoc(doc(db, path), syncedTopic('nato-phonetic')))
    await assertSucceeds(getDoc(doc(db, path)))
    await assertSucceeds(getDocs(collection(db, library(AUTHORIZED_UID))))
    await assertSucceeds(deleteDoc(doc(db, path)))
  })

  it('carries library-level state in its own document', async () => {
    const db = ownerDb()
    await assertSucceeds(
      setDoc(doc(db, `users/${AUTHORIZED_UID}/libraryMeta/library`), {
        json: JSON.stringify({ version: 5, catalogDelivered: ['nato-phonetic'] }),
        revision: 3,
        updatedAt: serverTimestamp(),
      }),
    )
  })

  it('rejects a device that chooses its own clock', async () => {
    // Two of the owner's devices resolve a conflict by which write landed
    // later, so the later time may not be something a device can simply claim.
    const db = ownerDb()
    await assertFails(
      setDoc(doc(db, `${library(AUTHORIZED_UID)}/nato-phonetic`), {
        ...syncedTopic('nato-phonetic'),
        updatedAt: new Date('2030-01-01T00:00:00Z'),
      }),
    )
  })

  it('rejects a document whose id and payload disagree', async () => {
    const db = ownerDb()
    await assertFails(
      setDoc(doc(db, `${library(AUTHORIZED_UID)}/nato-phonetic`), syncedTopic('something-else')),
    )
  })

  it('rejects a record that is empty, oversized or not text', async () => {
    const db = ownerDb()
    const path = `${library(AUTHORIZED_UID)}/nato-phonetic`
    for (const json of ['', 'x'.repeat(900_001)]) {
      await assertFails(setDoc(doc(db, path), { ...syncedTopic('nato-phonetic'), json }))
    }
    await assertFails(
      setDoc(doc(db, path), { ...syncedTopic('nato-phonetic'), json: { id: 'nato-phonetic' } }),
    )
  })

  it('rejects a missing or negative revision, and any field beyond the envelope', async () => {
    const db = ownerDb()
    const path = `${library(AUTHORIZED_UID)}/nato-phonetic`
    const { revision: _dropped, ...withoutRevision } = syncedTopic('nato-phonetic')
    await assertFails(setDoc(doc(db, path), withoutRevision))
    await assertFails(setDoc(doc(db, path), { ...syncedTopic('nato-phonetic'), revision: -1 }))
    await assertFails(
      setDoc(doc(db, path), { ...syncedTopic('nato-phonetic'), status: 'completed' }),
    )
  })

  it('denies every other signed-in account, in the owner\'s subtree and their own', async () => {
    const db = env
      .authenticatedContext(OTHER_UID, { email: OTHER_EMAIL, email_verified: true })
      .firestore()
    await assertFails(getDocs(collection(db, library(AUTHORIZED_UID))))
    await assertFails(setDoc(doc(db, `${library(AUTHORIZED_UID)}/nato`), syncedTopic('nato')))
    await assertFails(setDoc(doc(db, `${library(OTHER_UID)}/nato`), syncedTopic('nato')))
  })

  it('denies an unauthenticated client', async () => {
    const db = env.unauthenticatedContext().firestore()
    await assertFails(getDocs(collection(db, library(AUTHORIZED_UID))))
    await assertFails(setDoc(doc(db, `${library(AUTHORIZED_UID)}/nato`), syncedTopic('nato')))
  })
})

describe('what a captured request may contain', () => {
  it('accepts a track hint and a URL plus note', async () => {
    const db = ownerDb()
    await assertSucceeds(
      addDoc(collection(db, inbox(AUTHORIZED_UID)), {
        text: 'https://example.com/article — the section on knots',
        status: 'pending',
        trackHint: 'tradecraft',
        createdAt: serverTimestamp(),
      }),
    )
    await assertSucceeds(
      addDoc(collection(db, inbox(AUTHORIZED_UID)), {
        text: 'Cloud types and what they indicate',
        status: 'pending',
        createdAt: serverTimestamp(),
      }),
    )
  })

  it('rejects empty, untrimmed and oversized text', async () => {
    const db = ownerDb()
    for (const text of ['', '   ', '  leading space', 'x'.repeat(2001)]) {
      await assertFails(
        addDoc(collection(db, inbox(AUTHORIZED_UID)), { ...validPending, text }),
      )
    }
  })

  it('rejects a client-chosen creation time', async () => {
    const db = ownerDb()
    await assertFails(
      addDoc(collection(db, inbox(AUTHORIZED_UID)), {
        ...validPending,
        createdAt: new Date('2020-01-01T00:00:00Z'),
      }),
    )
  })

  it('rejects a track hint that is not an Argus track', async () => {
    const db = ownerDb()
    await assertFails(
      addDoc(collection(db, inbox(AUTHORIZED_UID)), { ...validPending, trackHint: 'urgent' }),
    )
  })

  it('rejects a request that tries to be a topic', async () => {
    // The whole architecture depends on this: a request has no scope, no items,
    // no status ladder and no evidence, and the rules will not store one that
    // pretends otherwise.
    const db = ownerDb()
    for (const extra of [
      { scope: 'Everything about knots.' },
      { items: [{ prompt: 'A', answer: 'B' }] },
      { status: 'completed' },
      { itemEvidence: {} },
      { history: [] },
      { topicIds: ['nato-phonetic'] },
      { addedAt: serverTimestamp() },
    ]) {
      await assertFails(addDoc(collection(db, inbox(AUTHORIZED_UID)), { ...validPending, ...extra }))
    }
  })

  it('rejects a request created straight into added', async () => {
    const db = ownerDb()
    await assertFails(
      addDoc(collection(db, inbox(AUTHORIZED_UID)), {
        text: 'Already done, honest',
        status: 'added',
        createdAt: serverTimestamp(),
        topicIds: ['nato-phonetic'],
        addedAt: serverTimestamp(),
      }),
    )
  })
})

describe('the pending to added transition', () => {
  const path = `users/${AUTHORIZED_UID}/inbox/request-1`
  const pending = {
    text: 'Maritime signal flags',
    status: 'pending',
    trackHint: 'tradecraft',
    createdAt: new Date('2026-01-01T00:00:00Z'),
  }

  it('accepts a request that has actually shipped topics', async () => {
    await seed(path, pending)
    const db = ownerDb()
    await assertSucceeds(
      updateDoc(doc(db, path), {
        status: 'added',
        topicIds: ['maritime-signal-flags'],
        addedAt: serverTimestamp(),
      }),
    )
  })

  it('rejects an addition with no topics behind it', async () => {
    await seed(path, pending)
    const db = ownerDb()
    await assertFails(
      updateDoc(doc(db, path), { status: 'added', topicIds: [], addedAt: serverTimestamp() }),
    )
    await assertFails(updateDoc(doc(db, path), { status: 'added', addedAt: serverTimestamp() }))
  })

  it('rejects rewriting what was captured', async () => {
    await seed(path, pending)
    const db = ownerDb()
    await assertFails(
      updateDoc(doc(db, path), {
        text: 'Something else entirely',
        status: 'added',
        topicIds: ['maritime-signal-flags'],
        addedAt: serverTimestamp(),
      }),
    )
    await assertFails(
      updateDoc(doc(db, path), {
        status: 'added',
        trackHint: 'survival',
        topicIds: ['maritime-signal-flags'],
        addedAt: serverTimestamp(),
      }),
    )
    await assertFails(
      updateDoc(doc(db, path), {
        status: 'added',
        createdAt: serverTimestamp(),
        topicIds: ['maritime-signal-flags'],
        addedAt: serverTimestamp(),
      }),
    )
  })

  it('rejects a backdated addition time', async () => {
    await seed(path, pending)
    const db = ownerDb()
    await assertFails(
      updateDoc(doc(db, path), {
        status: 'added',
        topicIds: ['maritime-signal-flags'],
        addedAt: new Date('2020-01-01T00:00:00Z'),
      }),
    )
  })

  it('rejects attaching topics without leaving pending', async () => {
    await seed(path, pending)
    const db = ownerDb()
    await assertFails(updateDoc(doc(db, path), { topicIds: ['maritime-signal-flags'] }))
  })

  it('rejects re-adding a request that is already added', async () => {
    await seed(path, {
      ...pending,
      status: 'added',
      topicIds: ['maritime-signal-flags'],
      addedAt: new Date('2026-02-01T00:00:00Z'),
    })
    const db = ownerDb()
    await assertFails(
      updateDoc(doc(db, path), { topicIds: ['something-else'], addedAt: serverTimestamp() }),
    )
  })
})

describe('removing a request', () => {
  const path = `users/${AUTHORIZED_UID}/inbox/request-1`

  it('lets the authorized user drop a pending request', async () => {
    await seed(path, { text: 'Never mind', status: 'pending', createdAt: new Date() })
    const db = ownerDb()
    await assertSucceeds(deleteDoc(doc(db, path)))
  })

  it('keeps an added request as ingestion provenance', async () => {
    await seed(path, {
      text: 'Maritime signal flags',
      status: 'added',
      createdAt: new Date(),
      topicIds: ['maritime-signal-flags'],
      addedAt: new Date(),
    })
    const db = ownerDb()
    await assertFails(deleteDoc(doc(db, path)))
  })

  it('denies deletion to anybody else', async () => {
    await seed(path, { text: 'Never mind', status: 'pending', createdAt: new Date() })
    await assertFails(deleteDoc(doc(env.unauthenticatedContext().firestore(), path)))
    await assertFails(deleteDoc(doc(env.authenticatedContext(OTHER_UID).firestore(), path)))
  })
})
