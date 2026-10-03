import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import {
  FLAG_CONFUSION_SETS,
  FLAG_HEIGHT,
  FLAG_LETTERS,
  FLAG_WIDTH,
  SIGNAL_FLAGS,
  flagAnswer,
  flagByLetter,
  flagOutline,
  type FlagColour,
  type FlagPrimitive,
} from './flags'
import { flagItems, FLAG_DISTRACTORS } from './flagBank'
import { FLAG_MANIFEST } from './flagManifest'
import { canonicalDesign } from './flagHash'
import { flagTopic, FLAGS_TOPIC_ID } from './flagTopic'
import { parseFigure } from '../visual/figures'

/** Research note §3D, typed out: the twelve retained meanings. */
const EXPECTED_MEANINGS: Record<string, string> = {
  A: 'Diver down; keep well clear and proceed slowly',
  B: 'Taking in, discharging or carrying dangerous goods',
  D: 'Keep clear; vessel manoeuvring with difficulty',
  F: 'Vessel disabled; communicate with me',
  J: 'On fire with dangerous cargo, or leaking dangerous cargo; keep well clear',
  L: 'You should stop your vessel immediately',
  M: 'My vessel is stopped and making no way through the water',
  O: 'Man overboard',
  U: 'You are running into danger',
  V: 'Assistance required',
  W: 'Medical assistance required',
  Y: 'Vessel is dragging anchor',
}

const PALETTE: FlagColour[] = ['white', 'blue', 'red', 'yellow', 'black']

describe('the twelve selected flags', () => {
  it('are exactly A, B, D, F, J, L, M, O, U, V, W and Y', () => {
    expect([...FLAG_LETTERS]).toEqual(['A', 'B', 'D', 'F', 'J', 'L', 'M', 'O', 'U', 'V', 'W', 'Y'])
    expect(SIGNAL_FLAGS.map((flag) => flag.letter)).toEqual([...FLAG_LETTERS])
    expect(new Set(SIGNAL_FLAGS.map((flag) => flag.letter)).size).toBe(12)
  })

  it('carry the retained meanings of the research note, unchanged', () => {
    for (const flag of SIGNAL_FLAGS) expect(flag.meaning).toBe(EXPECTED_MEANINGS[flag.letter])
  })

  it('use the ITU/NATO spellings Argus already teaches', () => {
    expect(SIGNAL_FLAGS.map((f) => f.name)).toEqual([
      'Alfa', 'Bravo', 'Delta', 'Foxtrot', 'Juliett', 'Lima', 'Mike', 'Oscar', 'Uniform', 'Victor', 'Whiskey', 'Yankee',
    ])
  })

  it('are drawn only from the five flag colours, inside the frame, and only A and B are swallow-tailed', () => {
    const inside = (x: number, y: number) => x >= 0 && x <= FLAG_WIDTH && y >= 0 && y <= FLAG_HEIGHT
    for (const { letter, design } of SIGNAL_FLAGS) {
      expect(PALETTE).toContain(design.background)
      expect(design.shape === 'swallowtail').toBe(letter === 'A' || letter === 'B')
      for (const primitive of design.primitives as FlagPrimitive[]) {
        if (primitive.type === 'rect') {
          expect(PALETTE).toContain(primitive.fill)
          expect(inside(primitive.x, primitive.y)).toBe(true)
          expect(inside(primitive.x + primitive.width, primitive.y + primitive.height)).toBe(true)
        } else if (primitive.type === 'polygon') {
          expect(PALETTE).toContain(primitive.fill)
          for (const [x, y] of primitive.points) expect(inside(x, y)).toBe(true)
        } else {
          expect(PALETTE).toContain(primitive.stroke)
          expect(primitive.width).toBeGreaterThan(0)
        }
      }
    }
  })

  it('gives every flag a distinct design, so no two can be confused by drawing', () => {
    const designs = SIGNAL_FLAGS.map((flag) => canonicalDesign(flag.design))
    expect(new Set(designs).size).toBe(12)
  })

  it('draws a swallow-tail notch only in the fly edge, and a plain rectangle otherwise', () => {
    expect(flagOutline('rectangle')).toHaveLength(4)
    const tail = flagOutline('swallowtail')
    expect(tail).toHaveLength(5)
    expect(tail[2][0]).toBeLessThan(FLAG_WIDTH) // the notch cuts inward from the fly
    expect(tail[2][1]).toBe(FLAG_HEIGHT / 2)
  })

  it('describes each flag in words that name its pattern and colours but never its letter or meaning', () => {
    for (const flag of SIGNAL_FLAGS) {
      expect(flag.description).toMatch(/flag/)
      expect(flag.description).not.toContain(flag.name)
      expect(flag.description).not.toContain(flag.meaning)
      expect(flag.description).not.toMatch(/\b(diver|overboard|anchor|dangerous|assistance|disabled)\b/i)
    }
    expect(flagByLetter('A').description).toBe(
      'A swallow-tailed flag divided vertically: white at the hoist (left), blue at the fly (right).',
    )
  })
})

describe('flag items (12)', () => {
  const items = flagItems()

  it('has one item per flag, in order, keyed to its own entry', () => {
    expect(items).toHaveLength(12)
    items.forEach((item, i) => {
      expect(item.answer).toBe(flagAnswer(SIGNAL_FLAGS[i]))
      expect(item.stimulus!.source).toEqual({ kind: 'figure', figure: { kind: 'signal-flag', letter: SIGNAL_FLAGS[i].letter } })
    })
    expect(new Set(items.map((i) => i.answer)).size).toBe(12)
    expect(new Set(items.map((i) => i.prompt)).size).toBe(12)
  })

  it('offers four distinct options including the answer once, and a stimulus text that does not give it away', () => {
    for (const item of items) {
      const { options } = item.choice!
      expect(options).toHaveLength(4)
      expect(new Set(options).size).toBe(4)
      expect(options.filter((o) => o === item.answer)).toHaveLength(1)
      expect(item.stimulus!.alt).not.toContain(item.answer)
      expect(item.stimulus!.caption).toBeUndefined()
    }
  })

  it('always offers the flag’s designed confusion-set siblings as distractors', () => {
    for (const flag of SIGNAL_FLAGS) {
      const siblings = new Set(
        FLAG_CONFUSION_SETS.filter((set) => set.includes(flag.letter)).flatMap((set) => set.filter((l) => l !== flag.letter)),
      )
      const distractors = new Set(FLAG_DISTRACTORS[flag.letter])
      for (const sibling of siblings) expect(distractors.has(sibling)).toBe(true)
      expect(distractors.has(flag.letter)).toBe(false)
      expect(distractors.size).toBe(3)
    }
  })

  it('validates as a figure and rejects a letter outside the twelve', () => {
    expect(parseFigure({ kind: 'signal-flag', letter: 'A' }, 'x').ok).toBe(true)
    for (const letter of ['C', 'N', 'Z', 'a', '', 7]) expect(parseFigure({ kind: 'signal-flag', letter }, 'x').ok).toBe(false)
  })
})

describe('asset manifest', () => {
  it('has twelve rows, one per flag, all project redraws with no third-party artwork', () => {
    expect(FLAG_MANIFEST.map((row) => row.letter)).toEqual([...FLAG_LETTERS])
    for (const row of FLAG_MANIFEST) {
      expect(row.authoringMethod).toBe('project redraw')
      expect(row.rendererId).toBe(`signal-flag:${row.letter}`)
      expect(row.licence).toMatch(/no third-party artwork/)
      expect(row.meaningSource).toMatch(/International Code of Signals/)
      expect(row.designAuthority).toMatch(/NGA Pub\. 102/)
    }
  })

  it('pins each drawn design by SHA-256, so an accidental change fails here', () => {
    for (const row of FLAG_MANIFEST) {
      const hash = createHash('sha256').update(canonicalDesign(flagByLetter(row.letter).design)).digest('hex')
      expect(hash, `flag ${row.letter} changed; re-pin deliberately after review`).toBe(row.designSha256)
    }
  })

  it('records honestly that no flag has been compared with the authoritative depictions yet', () => {
    // When a reviewer has made the comparison they fill `review`; until then this
    // documents the gate rather than hiding it.
    expect(FLAG_MANIFEST.every((row) => row.review === null)).toBe(true)
  })
})

describe('the Signal Flags topic', () => {
  const topic = flagTopic()

  it('has twelve forward objective-choice items with stable ids', () => {
    expect(topic.id).toBe(FLAGS_TOPIC_ID)
    expect(topic.items).toHaveLength(12)
    topic.items.forEach((item, i) => {
      expect(item.id).toBe(`signal-flags-item-${String(i + 1).padStart(2, '0')}`)
      expect(item.kind).toBe('forward')
      expect(item.choice).toBeDefined()
    })
  })

  it('is deterministic', () => {
    expect(JSON.stringify(flagTopic())).toBe(JSON.stringify(flagTopic()))
  })

  it('states the boundary: an Argus selection, no qualification, essential information in text', () => {
    expect(topic.scope).toMatch(/Argus editorial selection, not an official sub-code/)
    const limitations = (topic.learn?.limitations ?? []).join(' ')
    expect(limitations).toMatch(/not an official sub-code/)
    expect(limitations).toMatch(/not signalling procedure or a maritime qualification/)
    expect(limitations).toMatch(/Letter, name, meaning and design remain text/)
    for (const source of topic.learn?.sources ?? []) expect(source.url).toMatch(/^https:\/\//)
    expect(topic.learn?.sources?.map((s) => s.url).join(' ')).toMatch(/imo\.org/)
    expect(topic.learn?.sources?.map((s) => s.url).join(' ')).toMatch(/msi\.nga\.mil/)
  })

  it('keeps dangerous cargo attached to Juliet’s fire meaning in the comparison copy', () => {
    const comparisons = topic.learn!.sections!.find(section => section.heading === 'Pairs that get mixed up')!.blocks
      .flatMap(block => block.type === 'bullets' ? block.items : [])
    const juliet = comparisons.find(text => text.includes('J:'))!
    expect(juliet).toMatch(/J: fire with dangerous cargo, or dangerous-cargo leak/)
    expect(flagByLetter('J').meaning).toMatch(/fire with dangerous cargo/)
  })

  it('groups the flags by use, not alphabetically, with an alphabetical reference below', () => {
    const headings = topic.learn!.sections!.map((s) => s.heading)
    expect(headings).toEqual(['Warnings to others', 'Vessel state', 'Assistance', 'Pairs that get mixed up', 'Alphabetical reference'])
    const last = topic.learn!.sections!.at(-1)!.blocks[0]
    expect(last.type === 'table' && last.rows.map((r) => r[0])).toEqual([...FLAG_LETTERS])
  })

  it('gives every flag a Learn entry with its letter, meaning, design text and picture', () => {
    const entries = topic.learn!.sections!.flatMap((s) => s.blocks).flatMap((b) => (b.type === 'entries' ? b.entries : []))
    expect(entries.map((e) => e.marker).sort()).toEqual([...FLAG_LETTERS])
    for (const entry of entries) {
      expect(entry.visual).toBeDefined()
      expect(entry.fields.map((f) => f.label)).toEqual(expect.arrayContaining(['Meaning', 'Design']))
    }
  })
})
