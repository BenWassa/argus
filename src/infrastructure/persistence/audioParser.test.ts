import { describe, expect, it } from 'vitest'
import { parseAudio, parseAudioEvidence, parseResponse } from './audioParser'
import { parseLibrary } from './libraryParser'

const timestamp = '2026-08-01T00:00:00.000Z'

const audio = {
  assetId: 'listening-01',
  src: '/media/audio/listening-01.mp3',
  transcript: 'Alfa WUN TOO',
  drill: 'token-copy',
}

function topic(items: unknown[], extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'listening',
    title: 'Listening',
    scope: 'Finite.',
    track: 'learning',
    items,
    status: 'unstarted',
    createdAt: timestamp,
    drilledAt: null,
    learningAt: null,
    completedAt: null,
    lastTestedAt: null,
    spotCheckedAt: null,
    history: [],
    itemEvidence: {},
    ...extra,
  }
}

const library = (items: unknown[], extra: Record<string, unknown> = {}) =>
  parseLibrary({ version: 5, topics: [topic(items, extra)] })

const copyItem = {
  id: 'item-1',
  kind: 'forward',
  prompt: 'Copy what you hear',
  answer: 'A12',
  audio,
  response: { mode: 'copy', normalizer: 'compact' },
}
const choiceItem = {
  id: 'item-2',
  kind: 'forward',
  prompt: 'What does it mean?',
  answer: 'Message received',
  audio: { ...audio, assetId: 'listening-02', src: '/media/audio/listening-02.mp3', transcript: 'Roger', drill: 'proword' },
  choice: { options: ['Message received', 'Repeat your message'] },
}
const fieldsItem = {
  id: 'item-3',
  kind: 'forward',
  prompt: 'Extract the fields',
  answer: 'North of Cape Sable · Taking on water',
  audio: { ...audio, assetId: 'listening-03', src: '/media/audio/listening-03.mp3', transcript: 'x', drill: 'message-extraction' },
  response: {
    mode: 'fields',
    fields: [
      { label: 'Position', expected: 'North of Cape Sable' },
      { label: 'Nature of distress', expected: 'Taking on water' },
    ],
  },
}

describe('parseAudio', () => {
  it('accepts a local shipped recording with its transcript', () => {
    expect(parseAudio(audio, 'x')).toEqual({ ok: true, value: audio })
  })

  it.each([
    ['a remote address', { ...audio, src: 'https://example.com/a.mp3' }],
    ['a protocol-relative address', { ...audio, src: '//example.com/a.mp3' }],
    ['a data URI', { ...audio, src: 'data:audio/wav;base64,AAAA' }],
    ['a path outside /media/audio/', { ...audio, src: '/media/a.mp3' }],
    ['path traversal', { ...audio, src: '/media/audio/../secret.mp3' }],
    ['a non-audio extension', { ...audio, src: '/media/audio/a.html' }],
    ['no transcript', { ...audio, transcript: ' ' }],
    ['no asset id', { ...audio, assetId: '' }],
    ['an unknown drill', { ...audio, drill: 'shouting' }],
  ])('rejects %s', (_name, value) => {
    expect(parseAudio(value, 'x').ok).toBe(false)
  })
})

describe('parseResponse', () => {
  it('accepts copy and fields modes', () => {
    expect(parseResponse({ mode: 'copy', normalizer: 'words' }, 'x').ok).toBe(true)
    expect(parseResponse(fieldsItem.response, 'x').ok).toBe(true)
  })

  it.each([
    ['an unknown mode', { mode: 'speak' }],
    ['an unknown normalizer', { mode: 'copy', normalizer: 'fuzzy' }],
    ['one field', { mode: 'fields', fields: [{ label: 'a', expected: 'b' }] }],
    ['six fields', { mode: 'fields', fields: Array.from({ length: 6 }, (_, i) => ({ label: `l${i}`, expected: 'e' })) }],
    ['a blank expected value', { mode: 'fields', fields: [{ label: 'a', expected: ' ' }, { label: 'b', expected: 'c' }] }],
    ['a repeated label', { mode: 'fields', fields: [{ label: 'a', expected: 'x' }, { label: 'a', expected: 'y' }] }],
  ])('rejects %s', (_name, value) => {
    expect(parseResponse(value, 'x').ok).toBe(false)
  })
})

describe('audio items in a library', () => {
  it('round-trips copy, choice and fields items through parse and re-serialise', () => {
    const first = library([copyItem, choiceItem, fieldsItem])
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const items = first.library.topics[0].items
    expect(items[0].audio?.transcript).toBe('Alfa WUN TOO')
    expect(items[0].response).toEqual({ mode: 'copy', normalizer: 'compact' })
    expect(items[1].choice?.options).toHaveLength(2)
    expect(items[2].response?.mode).toBe('fields')
    const again = parseLibrary(JSON.parse(JSON.stringify(first.library)))
    expect(again.ok).toBe(true)
    if (again.ok) expect(again.library.topics[0].items).toEqual(items)
  })

  it('needs exactly one way to answer it', () => {
    const { response: _r, ...neither } = copyItem
    expect(library([neither]).ok).toBe(false)
    expect(library([{ ...copyItem, choice: { options: ['A12', 'B'] } }]).ok).toBe(false)
  })

  it('refuses a response with no audio, a bidirectional audio item, and audio alongside a picture', () => {
    const { audio: _a, ...noAudio } = copyItem
    expect(library([noAudio]).ok).toBe(false)
    expect(library([{ ...copyItem, kind: 'bidirectional' }]).ok).toBe(false)
    const picture = {
      source: { kind: 'figure', figure: { kind: 'angle-dial', pointers: [{ bearing: 1 }] } },
      alt: 'A dial.',
    }
    expect(library([{ ...choiceItem, stimulus: picture }]).ok).toBe(false)
  })

  it('refuses a choice whose key is not an option, as any choice item does', () => {
    expect(library([{ ...choiceItem, answer: 'Something else' }]).ok).toBe(false)
  })

  it('leaves an ordinary item exactly as it was', () => {
    const parsed = library([{ id: 'item-1', kind: 'forward', prompt: 'p', answer: 'a' }])
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.library.topics[0].items[0]).toEqual({ id: 'item-1', kind: 'forward', prompt: 'p', answer: 'a' })
  })
})

describe('audio evidence on import', () => {
  const good = { attempts: 3, correct: 2, unassistedCorrect: 1, assistedAttempts: 1, lastAt: timestamp, lastLatencyMs: 900 }

  it('round-trips, and absent means none', () => {
    const parsed = library([copyItem], { audioEvidence: { 'item-1': good } })
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.library.topics[0].audioEvidence).toEqual({ 'item-1': good })
    const none = library([copyItem])
    expect(none.ok && none.library.topics[0].audioEvidence).toBeUndefined()
    const empty = library([copyItem], { audioEvidence: {} })
    expect(empty.ok && empty.library.topics[0].audioEvidence).toBeUndefined()
  })

  it.each([
    ['unknown item', { ghost: good }],
    ['an item with no audio', { 'item-0': good }],
    ['a negative counter', { 'item-1': { ...good, attempts: -1 } }],
    ['a fractional counter', { 'item-1': { ...good, correct: 1.5 } }],
    ['more correct than attempts', { 'item-1': { ...good, correct: 4 } }],
    ['more unaided than correct', { 'item-1': { ...good, unassistedCorrect: 3 } }],
    ['more assisted attempts than attempts', { 'item-1': { ...good, assistedAttempts: 4 } }],
    ['more unaided answers than unassisted attempts', { 'item-1': { ...good, attempts: 2, correct: 2, unassistedCorrect: 2, assistedAttempts: 1 } }],
    ['a non-object record', { 'item-1': 7 }],
  ])('rejects %s rather than clamping it into fabricated progress', (_name, evidence) => {
    const plain = { id: 'item-0', kind: 'forward', prompt: 'p', answer: 'a' }
    expect(library([plain, copyItem], { audioEvidence: evidence }).ok).toBe(false)
  })

  it('checks ids against heard items only', () => {
    expect(parseAudioEvidence({ a: good }, 'x', new Set(['a'])).ok).toBe(true)
    expect(parseAudioEvidence({ a: good }, 'x', new Set()).ok).toBe(false)
  })
})
