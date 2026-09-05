import { describe, expect, it } from 'vitest'
import {
  addedCommit,
  decodeFields,
  documentId,
  encodeValue,
  formatHandoff,
  pendingRequests,
  planMarkAdded,
  toContentRequest,
} from './lib.mjs'
import { shippedTopicIds } from './cli.mjs'
import shippedCatalog from '../../src/lib/shippedCatalog.json' with { type: 'json' }

const SHIPPED = shippedCatalog.topicIds

function document(id, fields) {
  return {
    name: `projects/p/databases/(default)/documents/users/u/inbox/${id}`,
    fields,
  }
}

const pendingDocument = document('req-1', {
  text: { stringValue: 'Maritime signal flags' },
  status: { stringValue: 'pending' },
  trackHint: { stringValue: 'tradecraft' },
  createdAt: { timestampValue: '2026-02-01T09:00:00Z' },
})

describe('reading the inbox over REST', () => {
  it('decodes the narrow record and nothing more', () => {
    const request = toContentRequest(pendingDocument)
    expect(request).toEqual({
      id: 'req-1',
      name: pendingDocument.name,
      text: 'Maritime signal flags',
      status: 'pending',
      trackHint: 'tradecraft',
      createdAt: '2026-02-01T09:00:00Z',
      topicIds: [],
      addedAt: null,
    })
  })

  it('round-trips values it is allowed to write', () => {
    expect(decodeFields({ a: encodeValue('x'), b: encodeValue(['y', 'z']), c: encodeValue(null) })).toEqual({
      a: 'x',
      b: ['y', 'z'],
      c: null,
    })
    expect(documentId('projects/p/databases/(default)/documents/users/u/inbox/abc')).toBe('abc')
  })

  it('works the backlog oldest first and ignores requests already added', () => {
    const requests = [
      toContentRequest(document('newer', { ...pendingDocument.fields, createdAt: { timestampValue: '2026-03-01T00:00:00Z' } })),
      toContentRequest(document('older', { ...pendingDocument.fields, createdAt: { timestampValue: '2026-01-01T00:00:00Z' } })),
      toContentRequest(document('done', { ...pendingDocument.fields, status: { stringValue: 'added' } })),
    ]
    expect(pendingRequests(requests).map((request) => request.id)).toEqual(['older', 'newer'])
  })
})

describe('the research hand-off', () => {
  it('presents requests as intent and states what must happen before they ship', () => {
    const handoff = formatHandoff([toContentRequest(pendingDocument)], new Date('2026-03-01T00:00:00Z'))

    expect(handoff).toContain('1 pending request')
    expect(handoff).toContain('Maritime signal flags')
    expect(handoff).toContain('req-1')
    expect(handoff).toContain('intent')
    expect(handoff).toContain('finite completion boundary')
    expect(handoff).toContain('reviewed')
    // A hand-off is never allowed to read like a specification for scored
    // material, so it carries no scope, item or answer vocabulary at all.
    expect(handoff).not.toMatch(/\bscope:\s/i)
    expect(handoff).not.toMatch(/\banswer\b/i)
  })

  it('says so plainly when there is nothing to ingest', () => {
    expect(formatHandoff([])).toContain('Nothing pending')
  })
})

describe('marking a request added', () => {
  const pending = toContentRequest(pendingDocument)

  it('accepts topics that are in the shipped catalog', () => {
    expect(planMarkAdded(pending, [SHIPPED[0]], SHIPPED)).toEqual({
      action: 'write',
      topicIds: [SHIPPED[0]],
    })
  })

  it('refuses a topic that has not shipped', () => {
    // The whole point of the gate: a generated draft, an open pull request or a
    // branch that was never merged cannot mark anything as delivered.
    const plan = planMarkAdded(pending, ['maritime-signal-flags'], SHIPPED)
    expect(plan.action).toBe('error')
    expect(plan.reason).toContain('not in the shipped catalog')
  })

  it('refuses an empty, repeated or malformed topic list', () => {
    expect(planMarkAdded(pending, [], SHIPPED).action).toBe('error')
    expect(planMarkAdded(pending, [SHIPPED[0], SHIPPED[0]], SHIPPED).action).toBe('error')
    expect(planMarkAdded(pending, [''], SHIPPED).action).toBe('error')
    expect(planMarkAdded(undefined, [SHIPPED[0]], SHIPPED).action).toBe('error')
  })

  it('is safe to repeat and refuses to rewrite provenance', () => {
    const added = { ...pending, status: 'added', topicIds: [SHIPPED[1], SHIPPED[0]] }

    // Same topics in any order: nothing to do.
    expect(planMarkAdded(added, [SHIPPED[0], SHIPPED[1]], SHIPPED).action).toBe('skip')
    // Different topics: refused rather than silently overwritten.
    const conflict = planMarkAdded(added, [SHIPPED[2]], SHIPPED)
    expect(conflict.action).toBe('error')
    expect(conflict.reason).toContain('not rewritten')
  })

  it('writes only status, topicIds and a server-set addedAt', () => {
    const commit = addedCommit('projects/p/databases/(default)/documents/users/u/inbox/req-1', ['nato-phonetic'])
    const [write] = commit.writes

    expect(write.updateMask.fieldPaths).toEqual(['status', 'topicIds'])
    expect(Object.keys(write.update.fields).sort()).toEqual(['status', 'topicIds'])
    expect(write.updateTransforms).toEqual([{ fieldPath: 'addedAt', setToServerValue: 'REQUEST_TIME' }])
    // The captured text, its track hint and its creation time are untouched,
    // and the request must already exist.
    expect(write.currentDocument).toEqual({ exists: true })
  })
})

describe('the shipped catalog the tool checks against', () => {
  it('is the manifest the app itself ships', () => {
    expect(shippedTopicIds()).toEqual(SHIPPED)
    expect(SHIPPED.length).toBeGreaterThan(0)
  })
})
