import { describe, expect, it } from 'vitest'
import { SHIPPED_CATALOG_TOPIC_IDS } from '../library/catalog'
import { seedLibrary } from '../library/catalogSeed'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import { AVAILABLE_ROLES, ROLE_IDS } from '../roles/definitions'
import { HUMAN_FACTORS_TOPIC_IDS, humanFactorsTopics } from './humanFactorsTopics'

const topics = humanFactorsTopics()

describe('Analyst Wave 1 staged topics', () => {
  it('is staged: not delivered, not in the demo seed, and not an earnable role', () => {
    // Delete this test in the change that ships the topics after the answer-key
    // review required by docs/open/ISSUE_197_ANALYST_WAVE1_HUMAN_FACTORS.md §6.
    for (const id of HUMAN_FACTORS_TOPIC_IDS) {
      expect(SHIPPED_CATALOG_TOPIC_IDS).not.toContain(id)
      expect(seedLibrary().topics.map((topic) => topic.id)).not.toContain(id)
    }
    expect(ROLE_IDS).not.toContain('analyst')
    expect(AVAILABLE_ROLES.map((role) => String(role.id))).not.toContain('analyst')
  })

  it('defines four topics of nine objective items each, 36 in all', () => {
    expect(topics.map((topic) => topic.id)).toEqual([...HUMAN_FACTORS_TOPIC_IDS])
    for (const topic of topics) expect(topic.items, topic.id).toHaveLength(9)
    expect(topics.reduce((sum, topic) => sum + topic.items.length, 0)).toBe(36)
  })

  it('adds up to the planned 40 items with the shipped OODA Loop', () => {
    const ooda = seedLibrary().topics.find((topic) => topic.id === 'ooda-loop')
    expect(ooda?.items).toHaveLength(4)
    expect(ooda?.items.some((item) => item.choice)).toBe(false)
    expect(36 + (ooda?.items.length ?? 0)).toBe(40)
  })

  it('gives every item a deterministic id and a unique prompt and answer', () => {
    const ids = topics.flatMap((topic) => topic.items.map((item) => item.id))
    expect(new Set(ids).size).toBe(ids.length)
    for (const topic of topics) {
      for (const item of topic.items) expect(item.id?.startsWith(`${topic.id}-item-`)).toBe(true)
      expect(new Set(topic.items.map((item) => item.prompt)).size, topic.id).toBe(topic.items.length)
      expect(new Set(topic.items.map((item) => item.answer)).size, topic.id).toBe(topic.items.length)
    }
  })

  it('makes every item a four-option forward choice whose key is one of the options', () => {
    for (const topic of topics) {
      for (const item of topic.items) {
        const where = `${topic.id}/${item.id}`
        expect(item.kind, where).toBe('forward')
        expect(item.choice?.options, where).toHaveLength(4)
        expect(new Set(item.choice?.options).size, where).toBe(4)
        expect(item.choice?.options, where).toContain(item.answer)
        expect(item.stimulus, where).toBeUndefined()
        expect(item.audio, where).toBeUndefined()
        for (const text of [item.prompt, item.answer, ...(item.choice?.options ?? [])]) {
          expect(text.trim(), where).toBe(text)
        }
      }
    }
  })

  it('does not let the key stand out by being the longest option', () => {
    // A key that is usually the longest, most qualified choice can be found
    // without reading the vignette. Allow it in a minority of items per topic.
    for (const topic of topics) {
      const longest = topic.items.filter((item) => {
        const lengths = (item.choice?.options ?? []).map((option) => option.length)
        return item.answer.length === Math.max(...lengths)
      }).length
      expect(longest, `${topic.id} key is longest in ${longest}/9 items`).toBeLessThanOrEqual(4)
    }
  })

  it('states a boundary, a limitation and a source with a note for every topic', () => {
    for (const topic of topics) {
      expect(topic.scope.length, topic.id).toBeGreaterThan(40)
      expect(topic.learn?.limitations?.length, topic.id).toBeGreaterThan(0)
      expect(topic.learn?.caseStudies, `${topic.id} needs two contrasting worked examples`).toHaveLength(2)
      const sources = topic.learn?.sources ?? []
      expect(sources.length, topic.id).toBeGreaterThan(0)
      for (const source of sources) {
        expect(source.url, topic.id).toMatch(/^https:\/\//)
        expect(source.note?.trim().length ?? 0, topic.id).toBeGreaterThan(0)
      }
    }
  })

  it('crosses the import/export parse boundary unchanged', () => {
    const library = {
      version: 5 as const,
      topics: topics.map((topic) => ({ ...topic, origin: 'catalog' as const, itemEvidence: {}, lessonProgress: {} })),
    }
    const parsed = parseLibrary(JSON.parse(JSON.stringify(library)))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.library.topics.map((topic) => topic.items.length)).toEqual([9, 9, 9, 9])
  })
})
