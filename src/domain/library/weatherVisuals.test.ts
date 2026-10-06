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
    const ledger = readFileSync('docs/closed/ISSUE_131_WMO_CLOUD_VISUAL_GUIDE.md', 'utf8') + readFileSync('docs/open/ISSUE_129_BEAUFORT_VISUAL_GUIDE.md', 'utf8')
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

  it('pins the approved #129 Beaufort stages, copy and local asset contract without widening Test', () => {
    const beaufort = weather.find((topic) => topic.id === 'beaufort-wind-scale')!
    const sections = beaufort.learn?.sections ?? []
    expect(sections.map((section) => section.heading)).toEqual(['Read the wind at a glance', 'The scale'])

    const guide = sections[0]
    expect(guide.blocks[0]).toEqual({
      type: 'paragraph',
      text: 'The Beaufort scale describes wind through its visible effects. Move from calm conditions to hurricane-force winds and watch how the sea, vegetation and coastline change.',
    })
    expect(guide.blocks[1]).toEqual({
      type: 'paragraph',
      text: 'These illustrations build intuition; a still image cannot diagnose an exact Beaufort force. Test asks only the force names and knot ranges.',
    })

    const block = guide.blocks[2]
    if (block.type !== 'entries') throw new Error('Beaufort visual guide should use entries.')
    expect(block.presentation).toBe('visual-guide')
    expect(block.entries.map((entry) => {
      if (!entry.visual || entry.visual.source.kind !== 'image') throw new Error('Beaufort guide entry should use a local image.')
      return {
        marker: entry.marker,
        title: entry.title,
        effects: entry.fields[0]?.text,
        cues: entry.fields[1]?.text,
        src: entry.visual.source.src,
        width: entry.visual.source.width,
        height: entry.visual.source.height,
        alt: entry.visual.alt,
      }
    })).toEqual([
      {
        marker: '0–3',
        title: 'Calm → gentle breeze',
        effects: 'Mostly smooth water develops ripples, then small wavelets. Leaves and grasses begin to move, but conditions remain settled.',
        cues: 'ripples · small wavelets · light vegetation movement',
        src: '/media/beaufort/beaufort-0-3.avif',
        width: 700,
        height: 300,
        alt: 'Rocky lighthouse coast in calm to light-breeze conditions, with smooth water and only small ripples.',
      },
      {
        marker: '4–6',
        title: 'Moderate → strong breeze',
        effects: 'Whitecaps become common, waves grow noticeably larger and exposed vegetation moves continuously. Conditions are clearly windy.',
        cues: 'frequent whitecaps · larger waves · sustained movement',
        src: '/media/beaufort/beaufort-4-6.avif',
        width: 700,
        height: 300,
        alt: 'The same lighthouse coast under moderate to strong breeze, with frequent whitecaps and wind-bent grasses.',
      },
      {
        marker: '7–9',
        title: 'Near gale → strong gale',
        effects: 'The sea becomes rough. Foam is blown along the surface, spray increases and trees or larger branches are visibly affected.',
        cues: 'breaking waves · streaking foam · spray · difficult walking',
        src: '/media/beaufort/beaufort-7-9.avif',
        width: 700,
        height: 300,
        alt: 'The same lighthouse coast in near-gale to strong-gale conditions, with rough breaking seas, blown spray and bent vegetation.',
      },
      {
        marker: '10–12',
        title: 'Storm → hurricane force',
        effects: 'Very high seas, dense spray and severe wind effects dominate the scene. Visibility can deteriorate sharply and structural damage becomes possible.',
        cues: 'very high waves · airborne spray · poor visibility · damage risk',
        src: '/media/beaufort/beaufort-10-12.avif',
        width: 700,
        height: 300,
        alt: 'The same lighthouse coast in storm to hurricane-force conditions, with very rough seas, dense spray, rain and reduced visibility.',
      },
    ])

    expect(beaufort.items.map((item) => item.prompt)).toEqual(
      [...Array(13).keys()].map((force) => `Force ${force}`),
    )
    expect(beaufort.items.every((item) => !item.stimulus && !item.choice)).toBe(true)
  })

  it('scores only ten cloud abbreviation-to-name mappings and delivers fresh progress', () => {
    const clouds = weather.find((topic) => topic.id === 'cloud-genera')!
    expect(clouds.items.map((item) => item.prompt)).toEqual(['Ci', 'Cc', 'Cs', 'Ac', 'As', 'Ns', 'St', 'Sc', 'Cu', 'Cb'])
    expect(clouds.items.map((item) => item.answer)).toEqual(['Cirrus', 'Cirrocumulus', 'Cirrostratus', 'Altocumulus', 'Altostratus', 'Nimbostratus', 'Stratus', 'Stratocumulus', 'Cumulus', 'Cumulonimbus'])
    expect(clouds.scope).toContain('Test scores vocabulary only')
    expect(clouds.learn?.limitations?.join(' ')).toContain('One photograph per genus cannot demonstrate recognition across natural variation.')

    const sectionHeadings = clouds.learn?.sections?.map((section) => section.heading) ?? []
    expect(sectionHeadings).toEqual(expect.arrayContaining([
      'Cloud levels',
      'High clouds',
      'Middle clouds',
      'Low-base clouds',
      'Compare grains, masses and rolls',
      'Compare veils and sheets',
      'Compare uniform layers and cloud towers',
      'What clouds can tell you',
    ]))
    const comparisonCopy = JSON.stringify(clouds.learn?.sections ?? [])
    expect(comparisonCopy).toContain('Cirrocumulus, Altocumulus and Stratocumulus')
    expect(comparisonCopy).toContain('Cirrostratus')
    expect(comparisonCopy).toContain('Altostratus')
    expect(comparisonCopy).toContain('Nimbostratus')
    expect(comparisonCopy).toContain('Stratus is generally uniform; Stratocumulus')
    expect(comparisonCopy).toContain('Cumulus has sharp detached mounds or towers. Cumulonimbus')
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
    const block = raw.topics[0].learn.sections[0].blocks[2]
    block.presentation = 'autoplay'
    expect(parseLibrary(raw).ok).toBe(false)
    block.presentation = 'visual-guide'
    delete block.entries[0].visual
    expect(parseLibrary(raw).ok).toBe(false)
  })
})
