// Firestore access for the maintainer ingestion path.
//
// This runs on a maintainer's machine or in CI, never in the browser. It reads
// a Google service-account key from a file named by GOOGLE_APPLICATION_CREDENTIALS
// and mints a short-lived access token itself, so the repository has no Firebase
// Admin dependency and no privileged credential of any kind. Nothing in this
// file is imported by the app; `src/lib/inbox/boundary.test.ts` holds that line.

import { readFile } from 'node:fs/promises'
import { createSign } from 'node:crypto'

const SCOPE = 'https://www.googleapis.com/auth/datastore'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

function base64url(input) {
  return Buffer.from(input).toString('base64url')
}

export function signedAssertion(credentials, now = Math.floor(Date.now() / 1000)) {
  const header = { alg: 'RS256', typ: 'JWT' }
  const claims = {
    iss: credentials.client_email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }
  const body = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`
  const signature = createSign('RSA-SHA256').update(body).sign(credentials.private_key)
  return `${body}.${signature.toString('base64url')}`
}

async function accessToken(credentials) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signedAssertion(credentials),
    }),
  })
  if (!response.ok) {
    throw new Error(`Could not exchange the service-account key for a token: ${response.status} ${await response.text()}`)
  }
  return (await response.json()).access_token
}

/**
 * A Firestore client for one project. Against the emulator it needs no
 * credential at all, which is what the ingestion tests use.
 */
export async function firestoreClient({ projectId, credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS }) {
  if (!projectId) throw new Error('ARGUS_FIREBASE_PROJECT_ID is not set.')

  const emulator = process.env.FIRESTORE_EMULATOR_HOST
  let authorization = 'Bearer owner'
  let origin = emulator ? `http://${emulator}` : 'https://firestore.googleapis.com'

  if (!emulator) {
    if (!credentialsPath) {
      throw new Error(
        'GOOGLE_APPLICATION_CREDENTIALS is not set. Point it at a service-account key file held outside this repository.',
      )
    }
    const credentials = JSON.parse(await readFile(credentialsPath, 'utf8'))
    authorization = `Bearer ${await accessToken(credentials)}`
    origin = 'https://firestore.googleapis.com'
  }

  const base = `${origin}/v1/projects/${projectId}/databases/(default)/documents`

  async function call(path, init = {}) {
    const response = await fetch(`${base}${path}`, {
      ...init,
      headers: { authorization, 'content-type': 'application/json', ...(init.headers ?? {}) },
    })
    if (!response.ok) {
      throw new Error(`Firestore ${init.method ?? 'GET'} ${path} failed: ${response.status} ${await response.text()}`)
    }
    return response.status === 204 ? null : response.json()
  }

  return {
    documentName: (collectionPath, id) => `projects/${projectId}/databases/(default)/documents/${collectionPath}/${id}`,

    async list(collectionPath) {
      const documents = []
      let pageToken
      do {
        const query = new URLSearchParams({ pageSize: '300', ...(pageToken ? { pageToken } : {}) })
        const page = await call(`/${collectionPath}?${query}`)
        documents.push(...(page?.documents ?? []))
        pageToken = page?.nextPageToken
      } while (pageToken)
      return documents
    },

    async commit(body) {
      return call(':commit', { method: 'POST', body: JSON.stringify(body) })
    },
  }
}
