// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { LibraryProvider } from '../../../services/library/LibraryProvider'
import { parseLibrary } from '../../../infrastructure/persistence/libraryParser'
import { seedLibrary } from '../../../domain/library/catalogSeed'
import { lessonPackets } from '../../../domain/morse/curriculum/lesson'
import { copyPrompts } from '../../../domain/morse/fluency/copy'
import { newFluencyProgress } from '../../../domain/morse/fluency/progress'
import { startFluencyRun } from '../../../domain/morse/fluency/session'
import { FluencySurface } from './FluencySurface'

/**
 * The safety check of #263: at 10 / 26, Groups · Listen, Copy and the other
 * Listen runs are handed only the taught letters by the surface that opens
 * them, and what those runs then draw stays inside that set.
 */
const seen: { run: string; allowed?: ReadonlySet<string> }[] = []
vi.mock('./FluencyRun', () => ({ FluencyRun: (props: { mode: string; allowed?: ReadonlySet<string> }) => { seen.push({ run: `fluency:${props.mode}`, allowed: props.allowed }); return null } }))
vi.mock('./CopyRun', () => ({ CopyRun: (props: { level: string; allowed?: ReadonlySet<string> }) => { seen.push({ run: `copy:${props.level}`, allowed: props.allowed }); return null } }))

const MORSE_ID = 'international-morse-letters-printed'
const taught = new Set<string>(lessonPackets().slice(0, 5).flatMap((packet) => packet.characters))

function storeTenOfTwentySix() {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  localStorage.setItem('argus.library.v5', JSON.stringify({
    ...parsed.library,
    topics: parsed.library.topics.map((topic) => topic.id !== MORSE_ID ? topic
      : { ...topic, status: 'learning', lessonProgress: Object.fromEntries(topic.items.filter((item) => taught.has(item.prompt)).map((item) => [item.id!, 'settled'])) }),
  }))
}

afterEach(() => { cleanup(); localStorage.clear(); seen.length = 0 })

describe('Listen runs at 10 / 26 (#263)', () => {
  it.each([
    ['fluency:groups', { initialMode: 'groups' as const }],
    ['fluency:words', { initialMode: 'words' as const }],
    ['copy:common', { initialCopy: 'common' as const }],
  ])('%s is handed only the ten taught letters, and draws only those', (run, entry) => {
    expect(taught.size).toBe(10)
    storeTenOfTwentySix()
    render(<LibraryProvider><FluencySurface topicId={MORSE_ID} {...entry} onExit={vi.fn()} /></LibraryProvider>)
    const opened = seen.find((candidate) => candidate.run === run)
    expect(opened, run).toBeDefined()
    expect([...opened!.allowed!].sort()).toEqual([...taught].sort())
    for (let seed = 0; seed < 40; seed += 1) {
      const prompts = run.startsWith('copy:')
        ? copyPrompts('common', newFluencyProgress(), seed, new Set(), opened!.allowed)
        : startFluencyRun(run === 'fluency:groups' ? 'groups' : 'words', 6, newFluencyProgress(), seed, new Set(), [], opened!.allowed).prompts.map((prompt) => prompt.text)
      expect(prompts.length).toBeGreaterThan(0)
      for (const prompt of prompts) expect([...prompt].filter((character) => character !== ' ' && !taught.has(character)), prompt).toEqual([])
    }
  })
})
