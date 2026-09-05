#!/usr/bin/env node
// Render firestore.rules from the tracked template.
//
// The sole authorized Firebase UID is deployment configuration, not repository
// content, so the deployable rules file is generated and untracked. The UID is
// an identity rather than a credential, but pinning one project's UID into the
// repository would still be wrong: it is configuration of a particular Firebase
// project, and the repository has to stay deployable against any of them.

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
export const TEMPLATE_PATH = join(root, 'firestore.rules.template')
export const OUTPUT_PATH = join(root, 'firestore.rules')
export const UID_PLACEHOLDER = '__ARGUS_AUTHORIZED_UID__'

/** Firebase UIDs are opaque, but they are never empty and never quoted. */
export function assertUsableUid(uid) {
  if (typeof uid !== 'string' || !uid.trim()) {
    throw new Error('ARGUS_INBOX_UID is not set. It is the Firebase UID allowed to use the inbox.')
  }
  if (!/^[A-Za-z0-9_-]{6,128}$/.test(uid.trim())) {
    throw new Error(`ARGUS_INBOX_UID "${uid}" does not look like a Firebase UID.`)
  }
  return uid.trim()
}

export function renderRules(template, uid) {
  const rendered = template.replaceAll(UID_PLACEHOLDER, assertUsableUid(uid))
  if (rendered.includes(UID_PLACEHOLDER)) {
    throw new Error('The rules template still contains an unrendered placeholder.')
  }
  return rendered
}

export function renderRulesFile(uid, outputPath = OUTPUT_PATH) {
  const rendered = renderRules(readFileSync(TEMPLATE_PATH, 'utf8'), uid)
  writeFileSync(outputPath, rendered)
  return rendered
}

/** The UID the emulator suite renders against when no real one is configured. */
export const EMULATOR_UID = 'argus-emulator-uid-000001'

const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (invokedDirectly) {
  // `--emulator` renders a runnable rules file for the local emulator without
  // requiring anybody to hold the real project's UID. The rules suite supplies
  // its own ruleset anyway; this only satisfies the emulator's own startup.
  const emulator = process.argv.includes('--emulator')
  try {
    renderRulesFile(process.env.ARGUS_INBOX_UID || (emulator ? EMULATOR_UID : undefined))
    console.log(`Wrote ${OUTPUT_PATH}`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
