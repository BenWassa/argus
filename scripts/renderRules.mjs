#!/usr/bin/env node
// Render firestore.rules from the tracked template.
//
// The owner's address is deployment configuration, not repository content, so
// the deployable rules file is generated and untracked. The address is an
// identity rather than a credential, but pinning one project's owner into the
// repository would still be wrong: it is configuration of a particular Firebase
// project, and the repository has to stay deployable against any of them.
//
// This used to render a Firebase UID. A UID only exists once somebody has
// signed in, which made the rules undeployable until the owner had already
// authenticated against rules that did not yet name them. An address is known
// before the first sign-in, so the bootstrap resolves.

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
export const TEMPLATE_PATH = join(root, 'firestore.rules.template')
export const OUTPUT_PATH = join(root, 'firestore.rules')
export const OWNER_PLACEHOLDER = '__ARGUS_OWNER_EMAIL__'

/**
 * Deliberately a shape check and not an attempt to validate an address.
 *
 * The rules compare `request.auth.token.email.lower()` against this string, so
 * what matters is that it is lowercase, has no quote that could escape the
 * generated rules literal, and looks like an address at all.
 */
export function assertUsableOwner(email) {
  if (typeof email !== 'string' || !email.trim()) {
    throw new Error(
      'ARGUS_OWNER_EMAIL is not set. It is the Google address allowed to use this project.',
    )
  }
  const owner = email.trim()
  if (owner !== owner.toLowerCase()) {
    throw new Error(`ARGUS_OWNER_EMAIL "${owner}" must be lowercase; the rules compare a lowercased token.`)
  }
  if (/['"\\\s]/.test(owner)) {
    throw new Error(`ARGUS_OWNER_EMAIL "${owner}" contains a quote, backslash or space.`)
  }
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(owner)) {
    throw new Error(`ARGUS_OWNER_EMAIL "${owner}" does not look like an email address.`)
  }
  return owner
}

export function renderRules(template, owner) {
  const rendered = template.replaceAll(OWNER_PLACEHOLDER, assertUsableOwner(owner))
  if (rendered.includes(OWNER_PLACEHOLDER)) {
    throw new Error('The rules template still contains an unrendered placeholder.')
  }
  return rendered
}

export function renderRulesFile(owner, outputPath = OUTPUT_PATH, { emulator = false } = {}) {
  const rendered = renderRules(readFileSync(TEMPLATE_PATH, 'utf8'), owner)
  const marked = emulator ? `${EMULATOR_BANNER}\n${rendered}` : rendered
  writeFileSync(outputPath, marked)
  return marked
}

/** The owner the emulator suite renders against when no real one is configured. */
export const EMULATOR_OWNER = 'owner@argus-emulator.test'

/**
 * `npm run test:rules` leaves a rendered ruleset behind at the same path
 * `firebase deploy` reads, naming an owner who does not exist. Deploying that
 * would lock the real owner out of their own project, and nothing about the
 * file's contents would look wrong at a glance.
 *
 * So an emulator render says so in its first line, and `assertDeployable`
 * refuses it. The deploy scripts re-render from ARGUS_OWNER_EMAIL first anyway;
 * this is the guard for when someone runs `firebase deploy` by hand.
 */
export const EMULATOR_BANNER = '// EMULATOR ONLY — rendered by test:rules. DO NOT DEPLOY.'

export function assertDeployable(rules) {
  if (rules.startsWith(EMULATOR_BANNER)) {
    throw new Error(
      'firestore.rules was rendered for the emulator and names an owner who does not exist. Re-render it with ARGUS_OWNER_EMAIL before deploying.',
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
    const owner = process.env.ARGUS_OWNER_EMAIL
    renderRulesFile(owner || (emulator ? EMULATOR_OWNER : undefined), OUTPUT_PATH, {
      emulator: emulator && !owner,
    })
    console.log(`Wrote ${OUTPUT_PATH}`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
