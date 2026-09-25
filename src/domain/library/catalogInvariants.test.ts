import { describe, expect, it } from 'vitest'
import { SHIPPED_CATALOG_TOPIC_IDS, catalogDefinitions, reconcileCatalog } from './catalog'
import { itemKind } from './items'
import { morseAcquisitionProfile } from '../morse/testing/acquisitionProfile'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'

/**
 * Rules every shipped topic has to meet, whatever it teaches. Topic-specific
 * content is pinned in `catalogSeed.test.ts`; this file is what a new topic has
 * to pass before it can join the manifest at all.
 */
const NOW = new Date('2026-09-25T12:00:00.000Z')

describe('shipped catalog invariants', () => {
  const topics = catalogDefinitions()

  it('gives every topic and every item a unique, deterministic id', () => {
    expect(new Set(topics.map((topic) => topic.id)).size).toBe(topics.length)

    const itemIds = topics.flatMap((topic) => topic.items.map((item) => item.id))
    expect(itemIds.every((id) => typeof id === 'string' && id.length > 0)).toBe(true)
    expect(new Set(itemIds).size).toBe(itemIds.length)

    // Deterministic ids are what let a later catalog change be written as an
    // explicit migration instead of an orphaning of learner evidence.
    for (const topic of topics) {
      for (const item of topic.items) expect(item.id?.startsWith(`${topic.id}-item-`)).toBe(true)
    }
  })

  it('states a finite boundary and scores at least one item against it', () => {
    for (const topic of topics) {
      expect(topic.title.trim()).toBe(topic.title)
      expect(topic.title.length).toBeGreaterThan(0)
      expect(topic.scope.trim().length).toBeGreaterThan(0)
      expect(topic.items.length).toBeGreaterThan(0)
    }
  })

  it('keeps every prompt and every answer unambiguous within its topic', () => {
    for (const topic of topics) {
      const prompts = topic.items.map((item) => item.prompt)
      const answers = topic.items.map((item) => item.answer)
      // Two cards with one prompt cannot both be right; two cards with one
      // answer make the reverse question — and the reference — ambiguous.
      expect(new Set(prompts).size, `${topic.id} repeats a prompt`).toBe(prompts.length)
      expect(new Set(answers).size, `${topic.id} repeats an answer`).toBe(answers.length)
      for (const item of topic.items) {
        expect(item.prompt.trim()).toBe(item.prompt)
        expect(item.answer.trim()).toBe(item.answer)
        expect(item.prompt.length).toBeGreaterThan(0)
        expect(item.answer.length).toBeGreaterThan(0)
        expect(item.prompt).not.toBe(item.answer)
      }
    }
  })

  it('records provenance for every topic', () => {
    for (const topic of topics) {
      const sources = topic.learn?.sources ?? []
      expect(sources.length, `${topic.id} has no source`).toBeGreaterThan(0)
      for (const source of sources) {
        expect(source.label.trim().length).toBeGreaterThan(0)
        expect(source.url).toMatch(/^https:\/\//)
        expect(source.note?.trim().length ?? 0).toBeGreaterThan(0)
      }
    }
  })

  it('makes an item bidirectional only where Test can actually ask both directions', () => {
    // Only the acquisition ladder asks and records the reverse direction. An
    // ordinary reveal-and-self-score card always asks prompt → answer, so a
    // bidirectional item there could never earn reverse evidence and its topic
    // could never pass a retention attempt.
    for (const topic of topics) {
      if (!topic.items.some((item) => itemKind(item) === 'bidirectional')) continue
      expect(morseAcquisitionProfile(topic), `${topic.id} is bidirectional without a ladder`).not.toBeNull()
    }
  })

  it('crosses the import/export parse boundary unchanged', () => {
    const { library } = reconcileCatalog({ version: 5, topics: [], catalogDelivered: [] }, NOW)
    expect(library.topics.map((topic) => topic.id)).toEqual([...SHIPPED_CATALOG_TOPIC_IDS])

    const parsed = parseLibrary(JSON.parse(JSON.stringify(library)), NOW)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.library).toEqual(library)
  })
})
