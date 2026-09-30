import { describe, expect, it } from 'vitest'
import { parseChoice, parseVisual } from './visualParser'
import { parseLibrary } from './libraryParser'

const timestamp = '2026-08-01T00:00:00.000Z'

const dialVisual = {
  source: { kind: 'figure', figure: { kind: 'angle-dial', pointers: [{ bearing: 45 }] } },
  alt: 'A dial with one pointer between north and east.',
  caption: 'One pointer',
}

function topic(items: unknown[], learn?: unknown): Record<string, unknown> {
  return {
    id: 'visual-topic',
    title: 'Visual topic',
    scope: 'Finite.',
    track: 'learning',
    items,
    ...(learn ? { learn } : {}),
    status: 'unstarted',
    createdAt: timestamp,
    drilledAt: null,
    learningAt: null,
    completedAt: null,
    lastTestedAt: null,
    spotCheckedAt: null,
    history: [],
    itemEvidence: {},
  }
}

function library(items: unknown[], learn?: unknown) {
  return parseLibrary({ version: 5, topics: [topic(items, learn)] })
}

const choiceItem = {
  id: 'item-1',
  kind: 'forward',
  prompt: 'Which bearing?',
  answer: '045°',
  choice: { options: ['045°', '135°'] },
  stimulus: dialVisual,
}

describe('parseVisual', () => {
  it('requires alt text', () => {
    expect(parseVisual({ ...dialVisual, alt: ' ' }, 'x').ok).toBe(false)
    expect(parseVisual({ source: dialVisual.source }, 'x').ok).toBe(false)
  })

  it('accepts a local shipped image and records its dimensions', () => {
    const parsed = parseVisual(
      { source: { kind: 'image', src: '/media/clouds/cirrus.avif', width: 700, height: 300 }, alt: 'Cirrus.' },
      'x',
    )
    expect(parsed).toEqual({
      ok: true,
      value: { source: { kind: 'image', src: '/media/clouds/cirrus.avif', width: 700, height: 300 }, alt: 'Cirrus.' },
    })
  })

  it.each([
    ['a remote address', 'https://example.com/a.png'],
    ['a protocol-relative address', '//example.com/a.png'],
    ['a data URI', 'data:image/png;base64,AAAA'],
    ['a javascript URI', 'javascript:alert(1)'],
    ['path traversal', '/media/../secret.png'],
    ['a path outside /media/', '/assets/a.png'],
    ['a non-image extension', '/media/a.html'],
    ['a relative path', 'media/a.png'],
  ])('rejects %s as an image source', (_name, src) => {
    expect(parseVisual({ source: { kind: 'image', src, width: 10, height: 10 }, alt: 'a' }, 'x').ok).toBe(false)
  })

  it('rejects an image without usable dimensions', () => {
    const base = { kind: 'image', src: '/media/a.png' }
    expect(parseVisual({ source: { ...base, width: 0, height: 10 }, alt: 'a' }, 'x').ok).toBe(false)
    expect(parseVisual({ source: { ...base, width: 10.5, height: 10 }, alt: 'a' }, 'x').ok).toBe(false)
    expect(parseVisual({ source: base, alt: 'a' }, 'x').ok).toBe(false)
  })

  it('rejects an unknown source kind and an unknown figure kind', () => {
    expect(parseVisual({ source: { kind: 'video', src: '/media/a.mp4' }, alt: 'a' }, 'x').ok).toBe(false)
    expect(parseVisual({ source: { kind: 'figure', figure: { kind: 'mystery' } }, alt: 'a' }, 'x').ok).toBe(false)
  })
})

describe('parseChoice', () => {
  it('requires the answer to be exactly one of the options', () => {
    expect(parseChoice({ options: ['a', 'b'] }, 'a', 'x').ok).toBe(true)
    expect(parseChoice({ options: ['a', 'b'] }, 'c', 'x').ok).toBe(false)
  })

  it('rejects duplicates, blanks, and out-of-range option counts', () => {
    expect(parseChoice({ options: ['a', 'a'] }, 'a', 'x').ok).toBe(false)
    expect(parseChoice({ options: ['a', ' '] }, 'a', 'x').ok).toBe(false)
    expect(parseChoice({ options: ['a'] }, 'a', 'x').ok).toBe(false)
    expect(parseChoice({ options: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }, 'a', 'x').ok).toBe(false)
    expect(parseChoice({}, 'a', 'x').ok).toBe(false)
  })
})

describe('library round trip', () => {
  it('preserves a visual choice item through parse and re-serialise', () => {
    const first = library([choiceItem])
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const item = first.library.topics[0].items[0]
    expect(item.choice).toEqual({ options: ['045°', '135°'] })
    expect(item.stimulus?.alt).toContain('dial')

    const again = parseLibrary(JSON.parse(JSON.stringify(first.library)))
    expect(again.ok).toBe(true)
    if (again.ok) expect(again.library.topics[0].items).toEqual(first.library.topics[0].items)
  })

  it('leaves a plain item exactly as it was', () => {
    const parsed = library([{ id: 'item-1', kind: 'forward', prompt: 'p', answer: 'a' }])
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.library.topics[0].items[0]).toEqual({ id: 'item-1', kind: 'forward', prompt: 'p', answer: 'a' })
  })

  it('accepts a choice item with no picture, such as a calculation', () => {
    const { stimulus: _stimulus, ...noPicture } = choiceItem
    expect(library([noPicture]).ok).toBe(true)
  })

  it('refuses a picture with no choice, a bidirectional choice, and a key outside the options', () => {
    const { choice: _choice, ...noChoice } = choiceItem
    expect(library([noChoice]).ok).toBe(false)
    expect(library([{ ...choiceItem, kind: 'bidirectional' }]).ok).toBe(false)
    expect(library([{ ...choiceItem, answer: '999°' }]).ok).toBe(false)
  })

  it('round-trips a Learn visual block and an entry visual', () => {
    const learn = {
      kind: 'concise',
      sections: [
        {
          heading: 'Pictures',
          blocks: [
            { type: 'visual', visual: dialVisual },
            {
              type: 'entries',
              entries: [{ marker: '1', title: 'One', fields: [], visual: dialVisual }],
            },
          ],
        },
      ],
    }
    const parsed = library([{ id: 'item-1', kind: 'forward', prompt: 'p', answer: 'a' }], learn)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const blocks = parsed.library.topics[0].learn?.sections?.[0].blocks
    expect(blocks?.[0]).toEqual({ type: 'visual', visual: dialVisual })
    expect(blocks?.[1]).toMatchObject({ type: 'entries', entries: [{ visual: dialVisual }] })
  })

  it('rejects a Learn visual block with a remote image or no alt text', () => {
    const block = (visual: unknown) => ({
      kind: 'concise',
      sections: [{ heading: 'h', blocks: [{ type: 'visual', visual }] }],
    })
    const item = [{ id: 'item-1', kind: 'forward', prompt: 'p', answer: 'a' }]
    expect(library(item, block({ source: { kind: 'image', src: 'https://x.test/a.png', width: 1, height: 1 }, alt: 'a' })).ok).toBe(false)
    expect(library(item, block({ source: dialVisual.source })).ok).toBe(false)
  })
})
