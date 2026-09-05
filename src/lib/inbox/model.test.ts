import { describe, expect, it } from 'vitest'
import {
  CAPTURE_TEXT_MAX,
  ingestionOrder,
  normalizeCaptureText,
  parseContentRequest,
  pendingQueue,
  pendingRequestFields,
  toIsoTimestamp,
  validateCapture,
  validateTopicIds,
  type ContentRequest,
} from './model'

const SHIPPED = ['nato-phonetic', 'ooda-loop']

function request(overrides: Partial<ContentRequest> = {}): ContentRequest {
  return {
    id: 'req-1',
    text: 'Maritime signal flags',
    status: 'pending',
    trackHint: null,
    createdAt: '2026-02-01T09:00:00.000Z',
    topicIds: [],
    addedAt: null,
    ...overrides,
  }
}

describe('what capture accepts', () => {
  it('takes an idea, a URL, or a URL and a note through the same field', () => {
    for (const text of [
      'Maritime signal flags',
      'https://example.com/article',
      'https://example.com/article — useful section on knots',
    ]) {
      const result = validateCapture(text, null)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.draft.text).toBe(text)
    }
  })

  it('trims without interpreting what was typed', () => {
    expect(normalizeCaptureText('  Cloud types  ')).toBe('Cloud types')
    expect(normalizeCaptureText('one\r\ntwo   \nthree')).toBe('one\ntwo\nthree')
    // Not a parser: a URL keeps its punctuation, case and query string.
    expect(normalizeCaptureText('https://ex.com/a?b=C#d')).toBe('https://ex.com/a?b=C#d')
  })

  it('refuses an empty capture and one longer than the field holds', () => {
    expect(validateCapture('   ', null).ok).toBe(false)
    expect(validateCapture('x'.repeat(CAPTURE_TEXT_MAX + 1), null).ok).toBe(false)
    expect(validateCapture('x'.repeat(CAPTURE_TEXT_MAX), null).ok).toBe(true)
  })

  it('accepts a track hint only from the existing Argus tracks', () => {
    expect(validateCapture('Knots', 'tradecraft').ok).toBe(true)
    expect(validateCapture('Knots', 'urgent' as never).ok).toBe(false)
  })

  it('writes only the four fields the inbox record has', () => {
    expect(pendingRequestFields({ text: 'Knots', trackHint: 'tradecraft' })).toEqual({
      text: 'Knots',
      status: 'pending',
      trackHint: 'tradecraft',
    })
    // Nothing resembling a topic: no scope, items, status ladder or evidence.
    expect(Object.keys(pendingRequestFields({ text: 'Knots', trackHint: null }))).toEqual([
      'text',
      'status',
      'trackHint',
    ])
  })
})

describe('reading records back', () => {
  it('accepts a well-formed record and resolves its timestamps', () => {
    const parsed = parseContentRequest('abc', {
      text: ' Knots ',
      status: 'pending',
      trackHint: 'tradecraft',
      createdAt: { toDate: () => new Date('2026-02-01T09:00:00Z') },
    })
    expect(parsed).toEqual({
      id: 'abc',
      text: 'Knots',
      status: 'pending',
      trackHint: 'tradecraft',
      createdAt: '2026-02-01T09:00:00.000Z',
      topicIds: [],
      addedAt: null,
    })
  })

  it('drops a record that is not a content request', () => {
    expect(parseContentRequest('abc', null)).toBeNull()
    expect(parseContentRequest('', { text: 'x', status: 'pending' })).toBeNull()
    expect(parseContentRequest('abc', { text: '   ', status: 'pending' })).toBeNull()
    expect(parseContentRequest('abc', { text: 'x', status: 'completed' })).toBeNull()
  })

  it('treats an unresolved server timestamp as not yet saved', () => {
    expect(toIsoTimestamp(null)).toBeNull()
    expect(toIsoTimestamp('not a date')).toBeNull()
    expect(parseContentRequest('abc', { text: 'x', status: 'pending' })?.createdAt).toBeNull()
  })
})

describe('the queue', () => {
  const requests = [
    request({ id: 'b', createdAt: '2026-02-02T00:00:00.000Z' }),
    request({ id: 'a', createdAt: '2026-02-01T00:00:00.000Z' }),
    request({ id: 'fresh', createdAt: null }),
    request({ id: 'done', status: 'added', topicIds: ['nato-phonetic'], addedAt: '2026-03-01T00:00:00.000Z' }),
  ]

  it('shows pending requests newest first, with an unsaved one at the top', () => {
    expect(pendingQueue(requests).map((entry) => entry.id)).toEqual(['fresh', 'b', 'a'])
  })

  it('hands ingestion the same requests oldest first', () => {
    expect(ingestionOrder(requests).map((entry) => entry.id)).toEqual(['a', 'b', 'fresh'])
  })

  it('never shows an added request in the pending queue', () => {
    expect(pendingQueue(requests).some((entry) => entry.status === 'added')).toBe(false)
  })
})

describe('what may be recorded as added', () => {
  it('requires at least one shipped topic id', () => {
    expect(validateTopicIds(['nato-phonetic'], SHIPPED)).toEqual({ ok: true, topicIds: ['nato-phonetic'] })
    expect(validateTopicIds([], SHIPPED).ok).toBe(false)
    expect(validateTopicIds('nato-phonetic', SHIPPED).ok).toBe(false)
  })

  it('refuses ids that have not shipped, and repeated ids', () => {
    const unshipped = validateTopicIds(['maritime-signal-flags'], SHIPPED)
    expect(unshipped.ok).toBe(false)
    if (!unshipped.ok) expect(unshipped.error).toContain('has not shipped')
    expect(validateTopicIds(['ooda-loop', 'ooda-loop'], SHIPPED).ok).toBe(false)
  })
})
