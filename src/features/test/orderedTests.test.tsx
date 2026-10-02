// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { seedLibrary } from '../../domain/library/catalogSeed'
import { sequenceFor } from '../../domain/library/catalog'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import { parseSequence } from '../../infrastructure/persistence/sequenceParser'
import { acquisitionProfiles, buildDeck } from './testDeck'
import { SequenceCard } from './SequenceCard'
import { sequenceTextClass } from './textScale'

afterEach(() => { cleanup(); vi.restoreAllMocks() })
const orderedIds = ['firearm-safety-acts-prove', 'primary-survey', 'ooda-loop']
const topic = () => seedLibrary().topics.find(t => t.id === orderedIds[0])!

describe('ordered topic Tests', () => {
  it.each(orderedIds)('asks every item exactly once in authored order: %s', id => {
    const t = seedLibrary().topics.find(t => t.id === id)!
    const random = vi.spyOn(Math, 'random')
    const deck = buildDeck([t], new Map())
    expect(deck.map(c => c.item.id)).toEqual(t.sequence!.groups.flatMap(g => g.itemIds))
    expect(new Set(deck.map(c => c.item.id)).size).toBe(t.items.length)
    expect(random).not.toHaveBeenCalled()
  })
  it('keeps unordered lookups shuffled', () => {
    const t = seedLibrary().topics.find(t => t.id === 'nato-phonetic') ?? seedLibrary().topics.find(t => !t.sequence)!
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const deck = buildDeck([t], new Map())
    expect(deck.map(c => c.item.id)).not.toEqual(t.items.map(i => i.id))
    expect(deck).toHaveLength(t.items.length)
  })
  it('provides read-only defaults only to unchanged catalog copies', () => {
    const t = topic()
    const { sequence, ...old } = t
    const before = JSON.stringify(old)
    expect(sequenceFor(old)).toEqual(sequence)
    expect(JSON.stringify(old)).toBe(before)
    expect(sequenceFor({ ...old, origin: 'user' })).toBeUndefined()
    expect(sequenceFor({ ...old, items: old.items.map((i, n) => n ? i : { ...i, answer: 'Edited' }) })).toBeUndefined()
    const authored = { groups: [...sequence!.groups].reverse() }
    expect(sequenceFor({ ...t, sequence: authored })).toBe(authored)
  })
  it('preserves ordered metadata through the v5 storage/sync boundary', () => {
    const parsed = parseLibrary(JSON.parse(JSON.stringify({ version: 5, topics: [topic()] })))
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.library.topics[0].sequence).toEqual(topic().sequence)
    const { sequence: _, ...old } = topic()
    expect(parseLibrary({ version: 5, topics: [old] }).ok).toBe(true)
  })
  it('rejects missing, repeated, unknown or letter-mismatched steps', () => {
    const t = topic()
    for (const sequence of [
      { groups: [] },
      { groups: [{ label: 'A', letters: 'A', itemIds: [t.items[0].id] }] },
      { groups: [{ label: 'A', letters: 'AA', itemIds: [t.items[0].id, t.items[0].id] }] },
      { groups: [{ label: 'A', letters: 'A', itemIds: ['unknown'] }] },
      { groups: t.sequence!.groups.map(g => ({ ...g, letters: 'X' })) },
    ]) expect(parseSequence(sequence, t.items, 'Topic').ok).toBe(false)
  })
  it('announces the current step and retains earlier letters after a miss without reordering', () => {
    const deck = buildDeck([topic()], new Map())
    const { rerender } = render(<SequenceCard sequence={deck[2].sequence!} />)
    expect(screen.getByText('ACTS. Step 3 of 4, T.')).toBeTruthy()
    expect(screen.getByRole('listitem', { current: 'step' })).toHaveProperty('textContent', 'T')
    // A miss advances through the same frozen deck and carries no grade into the glyphs.
    rerender(<SequenceCard sequence={deck[3].sequence!} />)
    expect(screen.getByRole('listitem', { current: 'step' })).toHaveProperty('textContent', 'S')
    expect(screen.getByText('T').className).toContain('is-answered')
    rerender(<SequenceCard sequence={deck[4].sequence!} />)
    expect(screen.getByRole('list', { name: 'PROVE' })).toBeTruthy()
    expect(screen.queryByRole('list', { name: 'ACTS' })).toBeNull()
  })
  it('uses static letter state and scales longer acronyms', () => {
    expect(sequenceTextClass('ABCDE')).toBe('')
    expect(sequenceTextClass('ABCDEFGHI')).toBe(' is-medium')
    expect(sequenceTextClass('ABCDEFGHIJ')).toBe(' is-long')
    // No motion API or animation is involved, including with reduced motion enabled.
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    render(<SequenceCard sequence={buildDeck([topic()], new Map())[0].sequence!} />)
    expect(screen.getByRole('listitem', { current: 'step' }).getAttribute('style')).toBeNull()
    vi.unstubAllGlobals()
  })
})


describe('authored sequences on progressive topics', () => {
  const morse = () => {
    const t = seedLibrary().topics.find(t => t.id === 'international-morse-letters-printed')!
    return { ...t, sequence: { groups: [{ label: 'Alphabet', letters: t.items.map(i => i.prompt).join(''), itemIds: t.items.map(i => i.id!) }] } }
  }
  it('preserves progressive character metadata in a full ordered deck', () => {
    const t = morse()
    expect(parseSequence(t.sequence, t.items, 'Topic').ok).toBe(true)
    const deck = buildDeck([t], acquisitionProfiles([t]))
    expect(deck.every(c => c.character !== undefined)).toBe(true)
    expect(deck.map(c => c.item.id)).toEqual(t.sequence.groups[0].itemIds)
  })
  it('keeps reviews to their subset without undefined ordered cards', () => {
    const t = morse()
    const deck = buildDeck([t], acquisitionProfiles([t]), new Set([t.id]))
    expect(deck).toHaveLength(10)
    expect(deck.every(c => c.item && c.character !== undefined && !c.sequence)).toBe(true)
  })
})
