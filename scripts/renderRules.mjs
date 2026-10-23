#!/usr/bin/env node
// Generate rules from explicit deployment UID/email pairs.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
export const TEMPLATE_PATH = join(root, 'firestore.rules.template')
export const OUTPUT_PATH = join(root, 'firestore.rules')
export const OWNER_PLACEHOLDER = '__ARGUS_ALLOWED_IDENTITIES__'

/** Render only explicitly configured UID/email pairs; never infer aliases. */
export function renderRules(template, identities) {
  const pairs = typeof identities === 'string' ? JSON.parse(identities) : identities
  if (!Array.isArray(pairs) || pairs.length === 0) {
    throw new Error('ARGUS_ALLOWED_IDENTITIES must be a nonempty JSON array of {uid, email}.')
  }
  const clauses = pairs.map(({ uid, email }) => {
    if (typeof uid !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) {
      throw new Error('Each identity needs a valid Firebase UID.')
    }
    if (typeof email !== 'string' || !/^[^@\s\x27"\\]+@[^@\s\x27"\\]+\.[^@\s\x27"\\]+$/.test(email) || email !== email.toLowerCase()) {
      throw new Error('Each identity needs an exact lowercase email address.')
    }
    return `(request.auth.uid == '${uid}' && request.auth.token.email == '${email}')`
  })
  if (!template.includes(OWNER_PLACEHOLDER)) throw new Error('Missing identity placeholder.')
  return template.replaceAll(OWNER_PLACEHOLDER, clauses.join('\n          || '))
}

export function renderRulesFile(owner, outputPath = OUTPUT_PATH, { emulator = false } = {}) {
  const rendered = renderRules(readFileSync(TEMPLATE_PATH, 'utf8'), owner)
  const marked = emulator ? `${EMULATOR_BANNER}\n${rendered}` : rendered
  writeFileSync(outputPath, marked)
  return marked
}

/** The owner the emulator suite renders against when no real one is configured. */
export const EMULATOR_OWNER = [{ uid: 'emulator-owner', email: 'owner@argus-emulator.test' }]

/**
 * `npm run test:rules` leaves a rendered ruleset behind at the same path
 * `firebase deploy` reads, naming an owner who does not exist. Deploying that
 * would lock the real owner out of their own project, and nothing about the
 * file's contents would look wrong at a glance.
 *
 * So an emulator render says so in its first line, and `assertDeployable`
 * refuses it. The deploy scripts re-render from ARGUS_ALLOWED_IDENTITIES first anyway;
 * this is the guard for when someone runs `firebase deploy` by hand.
 */
export const EMULATOR_BANNER = '// EMULATOR ONLY — rendered by test:rules. DO NOT DEPLOY.'

export function assertDeployable(rules) {
  if (rules.startsWith(EMULATOR_BANNER)) {
    throw new Error(
      'firestore.rules was rendered for the emulator and names an owner who does not exist. Re-render it with ARGUS_ALLOWED_IDENTITIES before deploying.',
    )
  }
  return rules
}

const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (invokedDirectly) {
  // `--emulator` renders a runnable rules file for the local emulator without
  // requiring anybody to hold the real project's owner. The rules suite supplies
  // its own ruleset anyway; this only satisfies the emulator's own startup.
  const emulator = process.argv.includes('--emulator')
  try {
    if (process.argv.includes('--check')) {
      assertDeployable(readFileSync(OUTPUT_PATH, 'utf8'))
      console.log(`${OUTPUT_PATH} is deployable`)
      process.exit(0)
    }
    // A real owner always wins, so `--emulator` in CI with the variable set
    // still renders something deployable rather than something marked.
    const owner = process.env.ARGUS_ALLOWED_IDENTITIES
    renderRulesFile(owner || (emulator ? EMULATOR_OWNER : undefined), OUTPUT_PATH, {
      emulator: emulator && !owner,
    })
    console.log(`Wrote ${OUTPUT_PATH}`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
