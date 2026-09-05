#!/usr/bin/env node
// Argus content-inbox ingestion tool.
//
//   npm run inbox -- list
//   npm run inbox -- mark-added --id <requestId> --topics <topicId>[,<topicId>]
//
// It does two things and refuses to do a third. It reads pending requests into
// a hand-off document, and it marks a request `added` once the topics it became
// are in the shipped catalog. It cannot write curriculum, open a pull request,
// merge anything or deploy anything: turning intent into a finite Argus topic is
// researched, reviewed work that happens in Git, by a person.
//
// Configuration (all from the maintainer's environment, never from the app):
//   ARGUS_FIREBASE_PROJECT_ID       the Firebase project holding the inbox
//   ARGUS_INBOX_UID                 the sole authorized Firebase UID
//   GOOGLE_APPLICATION_CREDENTIALS  path to a service-account key file
//   FIRESTORE_EMULATOR_HOST         set instead, to work against an emulator

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { firestoreClient } from './firestoreRest.mjs'
import { addedCommit, formatHandoff, pendingRequests, planMarkAdded, toContentRequest } from './lib.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

export function shippedTopicIds() {
  return JSON.parse(readFileSync(join(ROOT, 'src/lib/shippedCatalog.json'), 'utf8')).topicIds
}

function parseArgs(argv) {
  const [command = 'help', ...rest] = argv
  const flags = {}
  for (let i = 0; i < rest.length; i += 1) {
    if (!rest[i].startsWith('--')) continue
    const key = rest[i].slice(2)
    const next = rest[i + 1]
    if (next && !next.startsWith('--')) {
      flags[key] = next
      i += 1
    } else {
      flags[key] = true
    }
  }
  return { command, flags }
}

function usage() {
  console.log(`Argus content inbox

  npm run inbox -- list [--json]
      Read pending requests as a research hand-off.

  npm run inbox -- mark-added --id <requestId> --topics <id>[,<id>] [--dry-run]
      Record that a request became shipped topics. Refused unless every topic id
      is already in the shipped catalog, and safe to repeat.
`)
}

async function connect() {
  const uid = process.env.ARGUS_INBOX_UID
  if (!uid) throw new Error('ARGUS_INBOX_UID is not set.')
  const client = await firestoreClient({ projectId: process.env.ARGUS_FIREBASE_PROJECT_ID })
  return { client, collectionPath: `users/${uid}/inbox` }
}

async function readRequests() {
  const { client, collectionPath } = await connect()
  const documents = await client.list(collectionPath)
  return { client, collectionPath, requests: documents.map(toContentRequest) }
}

async function list(flags) {
  const { requests } = await readRequests()
  if (flags.json) {
    console.log(JSON.stringify(pendingRequests(requests), null, 2))
    return
  }
  console.log(formatHandoff(requests))
}

async function markAdded(flags) {
  const id = typeof flags.id === 'string' ? flags.id.trim() : ''
  if (!id) throw new Error('mark-added needs --id <requestId>.')
  const topicIds = typeof flags.topics === 'string'
    ? flags.topics.split(',').map((value) => value.trim()).filter(Boolean)
    : []

  const { client, collectionPath, requests } = await readRequests()
  const plan = planMarkAdded(requests.find((request) => request.id === id), topicIds, shippedTopicIds())

  if (plan.action === 'error') throw new Error(plan.reason)
  if (plan.action === 'skip') {
    console.log(`${id}: ${plan.reason}`)
    return
  }
  if (flags['dry-run']) {
    console.log(`${id}: would be marked added with ${plan.topicIds.join(', ')}.`)
    return
  }

  await client.commit(addedCommit(client.documentName(collectionPath, id), plan.topicIds))
  console.log(`${id}: marked added with ${plan.topicIds.join(', ')}.`)
}

// Only when run as a command. Imported (by the tests, for `shippedTopicIds`)
// it stays inert.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { command, flags } = parseArgs(process.argv.slice(2))
  try {
    if (command === 'list') await list(flags)
    else if (command === 'mark-added') await markAdded(flags)
    else usage()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
