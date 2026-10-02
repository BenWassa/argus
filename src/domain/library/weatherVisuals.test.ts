import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { seedLibrary } from './catalogSeed'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import { freshCatalogTopic, reconcileCatalog } from './catalog'

const weather = seedLibrary().topics.filter((topic) => ['beaufort-wind-scale', 'cloud-genera'].includes(topic.id))

describe('staged weather guides', () => {
  it('ships all 14 accepted local images as unscored Learn content with accessible credits', () => {
    const visuals = weather.flatMap((topic) => topic.learn?.sections?.flatMap((section) => section.blocks.flatMap((block) => block.type === 'entries' ? block.entries.flatMap((entry) => entry.visual ? [entry.visual] : []) : [])) ?? [])
    expect(visuals).toHaveLength(14)
    const ledger = readFileSync('docs/open/ISSUE_131_WMO_CLOUD_VISUAL_GUIDE.md', 'utf8') + readFileSync('docs/open/ISSUE_129_BEAUFORT_VISUAL_GUIDE.md', 'utf8')
    for (const visual of visuals) {
      expect(visual.source.kind).toBe('image')
      if (visual.source.kind !== 'image') continue
      const path = `public${visual.source.src}`
      expect(existsSync(path)).toBe(true)
      expect(ledger).toContain(createHash('sha256').update(readFileSync(path)).digest('hex'))
      expect(visual.alt.length).toBeGreaterThan(20)
      expect(visual.credit).toBeTruthy()
      expect(visual.assetId).toBeTruthy()
    }
    expect(weather.flatMap((topic) => topic.items).every((item) => !item.stimulus && !item.choice)).toBe(true)
  })

  it('scores only ten cloud abbreviation-to-name mappings and delivers fresh progress', () => {
    const clouds = weather.find((topic) => topic.id === 'cloud-genera')!
    expect(clouds.items.map((item) => item.prompt)).toEqual(['Ci', 'Cc', 'Cs', 'Ac', 'As', 'Ns', 'St', 'Sc', 'Cu', 'Cb'])
    expect(clouds.items.map((item) => item.answer)).toEqual(['Cirrus', 'Cirrocumulus', 'Cirrostratus', 'Altocumulus', 'Altostratus', 'Nimbostratus', 'Stratus', 'Stratocumulus', 'Cumulus', 'Cumulonimbus'])
    const existing = freshCatalogTopic(weather.find((topic) => topic.id === 'beaufort-wind-scale')!)
    const { library, report } = reconcileCatalog({ version: 5, topics: [existing] })
    expect(report.added).toContain('cloud-genera')
    expect(library.topics[0]).toBe(existing)
    const added = library.topics.find((topic) => topic.id === 'cloud-genera')!
    expect(added.status).toBe('unstarted')
    expect(added.history).toEqual([])
    expect(added.completedAt).toBeNull()
  })

  it('preserves the visual-guide presentation across ordinary v5 round trips', () => {
    const parsed = parseLibrary(JSON.parse(JSON.stringify({ version: 5, topics: weather })))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.library.topics.map((topic) => topic.learn)).toEqual(weather.map((topic) => topic.learn))
  })

  it('rejects guide entries without a visual and unknown presentation values', () => {
    const raw = JSON.parse(JSON.stringify({ version: 5, topics: [weather.find((topic) => topic.id === 'beaufort-wind-scale')] }))
    const block = raw.topics[0].learn.sections[0].blocks[1]
    block.presentation = 'autoplay'
    expect(parseLibrary(raw).ok).toBe(false)
    block.presentation = 'visual-guide'
    delete block.entries[0].visual
    expect(parseLibrary(raw).ok).toBe(false)
  })
})
