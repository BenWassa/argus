import { describe, expect, it } from 'vitest'
import { nextLedger, planSync, topicJson, wouldLoseEvidence, type Ledger, type RemoteRecord } from './plan'
import type { Topic } from '../types'

/**
 * Sync is the only place two devices can disagree about the learner's record,
 * so every branch of that disagreement is pinned here rather than discovered on
 * a phone. The cases that matter are the asymmetric ones: a topic missing on one
 * side is an arrival or a deletion depending only on what this device already
 * agreed with the server, and getting that backwards either resurrects deleted
 * topics forever or silently deletes live ones.
 */

function topic(id: string, overrides: Partial<Topic> = {}): Topic {
  return { id, title: id, status: 'unstarted', history: [], ...overrides } as Topic
}

function remote(id: string, source: Topic, revision: number, updatedAtMs: number | null = 1_000): RemoteRecord {
  return { topicId: id, json: topicJson(source), revision, updatedAtMs }
}

function ledgerFor(id: string, source: Topic, revision: number, changedAtMs = 500): Ledger {
  return { [id]: { revision, json: topicJson(source), changedAtMs } }
}

describe('a topic that exists on only one side', () => {
  it('pushes a topic this device has just created', () => {
    const fresh = topic('knots')
    const { actions } = planSync([fresh], [], {})
    expect(actions).toEqual([
      { kind: 'push', topicId: 'knots', json: topicJson(fresh), revision: 1 },
    ])
  })

  it('adopts a topic another device has just created', () => {
    const theirs = topic('knots')
    const { actions } = planSync([], [remote('knots', theirs, 1)], {})
    expect(actions).toEqual([
      { kind: 'adopt', topicId: 'knots', json: topicJson(theirs), revision: 1 },
    ])
  })

  it('drops a local topic the server has deleted, rather than re-uploading it', () => {
    // Without the ledger this is indistinguishable from a local creation, and
    // a deleted topic would come back on every device that still held it.
    const gone = topic('knots')
    const { actions } = planSync([gone], [], ledgerFor('knots', gone, 3))
    expect(actions).toEqual([{ kind: 'dropLocal', topicId: 'knots' }])
  })

  it('deletes remotely a topic this device has deleted, rather than re-adopting it', () => {
    const gone = topic('knots')
    const { actions } = planSync([], [remote('knots', gone, 3)], ledgerFor('knots', gone, 3))
    expect(actions).toEqual([{ kind: 'deleteRemote', topicId: 'knots' }])
  })

  it('re-publishes a restored shipped topic instead of applying a stale remote deletion', () => {
    const shipped = topic('nato-phonetic')
    const { actions } = planSync(
      [shipped],
      [],
      ledgerFor('nato-phonetic', shipped, 3),
    )
    expect(actions).toEqual([
      { kind: 'push', topicId: 'nato-phonetic', json: topicJson(shipped), revision: 4 },
    ])
  })

  it('re-adopts shipped curriculum instead of propagating a local deletion', () => {
    const shipped = topic('nato-phonetic')
    const { actions } = planSync(
      [],
      [remote('nato-phonetic', shipped, 3)],
      ledgerFor('nato-phonetic', shipped, 3),
    )
    expect(actions).toEqual([
      { kind: 'adopt', topicId: 'nato-phonetic', json: topicJson(shipped), revision: 3 },
    ])
  })
})

describe('a topic both sides hold', () => {
  it('does nothing when neither side has moved', () => {
    const settled = topic('knots')
    const plan = planSync([settled], [remote('knots', settled, 2)], ledgerFor('knots', settled, 2))
    expect(plan.actions).toEqual([])
    expect(plan.conflicts).toEqual([])
  })

  it('pushes a local edit on top of the revision the server holds', () => {
    const before = topic('knots')
    const after = topic('knots', { status: 'learning' })
    const plan = planSync([after], [remote('knots', before, 2)], ledgerFor('knots', before, 2))
    expect(plan.actions).toEqual([
      { kind: 'push', topicId: 'knots', json: topicJson(after), revision: 3 },
    ])
    expect(plan.conflicts).toEqual([])
  })

  it('adopts a remote edit this device has not touched', () => {
    const before = topic('knots')
    const after = topic('knots', { status: 'drilled' })
    const plan = planSync([before], [remote('knots', after, 3)], ledgerFor('knots', before, 2))
    expect(plan.actions).toEqual([
      { kind: 'adopt', topicId: 'knots', json: topicJson(after), revision: 3 },
    ])
    expect(plan.conflicts).toEqual([])
  })
})

describe('a topic both sides changed', () => {
  const before = topic('knots')
  const mine = topic('knots', { status: 'learning' })
  const theirs = topic('knots', { status: 'drilled' })

  it('touches neither copy and reports the conflict instead', () => {
    // #93 rules out destructive last-write-wins. Whichever edit happened later,
    // the other may still hold work, so nothing is overwritten either way.
    const plan = planSync(
      [mine],
      [remote('knots', theirs, 3, 9_000)],
      ledgerFor('knots', before, 2, 1_000),
    )
    expect(plan.conflicts).toEqual(['knots'])
    expect(plan.actions).toEqual([])
  })

  it('reports it the same way round when this device wrote later', () => {
    const plan = planSync(
      [mine],
      [remote('knots', theirs, 3, 1_000)],
      ledgerFor('knots', before, 2, 9_000),
    )
    expect(plan.conflicts).toEqual(['knots'])
    expect(plan.actions).toEqual([])
  })

  it('leaves the conflicted topic out of the ledger, so it stays reported', () => {
    // A conflict that quietly settled itself on the next pass would be worse
    // than one that persists: the person would never get the chance to look.
    const ledger = ledgerFor('knots', before, 2, 1_000)
    const plan = planSync([mine], [remote('knots', theirs, 3, 9_000)], ledger)
    const settled = nextLedger(ledger, plan.actions, 5_000)
    const again = planSync([mine], [remote('knots', theirs, 3, 9_000)], settled)
    expect(again.conflicts).toEqual(['knots'])
  })
})

describe('a remote copy that would lose evidence', () => {
  const drilled = topic('knots', {
    history: [{ at: '2026-01-01T00:00:00.000Z' }, { at: '2026-02-01T00:00:00.000Z' }],
  } as Partial<Topic>)

  it('is refused even when this device has not touched the topic', () => {
    // An older or damaged copy arriving late is not a later edit. Attempts do
    // not un-happen, so a shorter history is evidence of the wrong direction.
    const thinner = topic('knots', { history: [] } as Partial<Topic>)
    const plan = planSync(
      [drilled],
      [remote('knots', thinner, 5)],
      ledgerFor('knots', drilled, 2),
    )
    expect(plan.actions).toEqual([])
    expect(plan.conflicts).toEqual(['knots'])
  })

  it('is accepted when it carries at least what this device holds', () => {
    const richer = topic('knots', {
      history: [
        { at: '2026-01-01T00:00:00.000Z' },
        { at: '2026-02-01T00:00:00.000Z' },
        { at: '2026-03-01T00:00:00.000Z' },
      ],
    } as Partial<Topic>)
    const plan = planSync([drilled], [remote('knots', richer, 5)], ledgerFor('knots', drilled, 2))
    expect(plan.conflicts).toEqual([])
    expect(plan.actions).toEqual([
      { kind: 'adopt', topicId: 'knots', json: topicJson(richer), revision: 5 },
    ])
  })

  it('judges attempts and item evidence, and refuses anything it cannot read', () => {
    expect(wouldLoseEvidence('{ not json', drilled)).toBe(true)
    expect(wouldLoseEvidence('"a string"', drilled)).toBe(true)
    expect(
      wouldLoseEvidence(JSON.stringify({ history: [1, 2], itemEvidence: {} }), {
        ...drilled,
        itemEvidence: { a: 1 },
      } as unknown as Topic),
    ).toBe(true)
  })
})

describe('the ledger after a plan is applied', () => {
  it('records what was pushed and adopted, and forgets what was deleted', () => {
    const kept = topic('knots')
    const ledger = { ...ledgerFor('knots', kept, 1), ...ledgerFor('gone', topic('gone'), 4) }
    const next = nextLedger(
      ledger,
      [
        { kind: 'push', topicId: 'knots', json: topicJson(kept), revision: 2 },
        { kind: 'dropLocal', topicId: 'gone' },
        { kind: 'adopt', topicId: 'new', json: '{"id":"new"}', revision: 7 },
      ],
      12_345,
    )
    expect(next.knots).toEqual({ revision: 2, json: topicJson(kept), changedAtMs: 12_345 })
    expect(next.gone).toBeUndefined()
    expect(next.new).toEqual({ revision: 7, json: '{"id":"new"}', changedAtMs: 12_345 })
  })

  it('settles: replanning after applying a plan asks for nothing further', () => {
    const mine = topic('knots', { status: 'learning' })
    const ledger = ledgerFor('knots', topic('knots'), 2)
    const first = planSync([mine], [remote('knots', topic('knots'), 2)], ledger)
    const settled = nextLedger(ledger, first.actions, 3_000)
    const again = planSync([mine], [remote('knots', mine, 3)], settled)
    expect(again.actions).toEqual([])
  })
})


describe('the first sync on a new device', () => {
  // No ledger exists yet, so there is nothing to say who moved. Reporting every
  // topic as conflicted would be correct and useless: the ordinary case is a
  // local library of untouched seed topics meeting the real record.
  const untouched = topic('knots')
  const earned = topic('knots', {
    history: [{ at: '2026-01-01T00:00:00.000Z' }, { at: '2026-02-01T00:00:00.000Z' }],
  } as Partial<Topic>)

  it('takes the fuller copy when it covers what this device holds', () => {
    const plan = planSync([untouched], [remote('knots', earned, 4)], {})
    expect(plan.conflicts).toEqual([])
    expect(plan.actions).toEqual([
      { kind: 'adopt', topicId: 'knots', json: topicJson(earned), revision: 4 },
    ])
  })

  it('sends this device up when it is the one holding the record', () => {
    const plan = planSync([earned], [remote('knots', untouched, 4)], {})
    expect(plan.conflicts).toEqual([])
    expect(plan.actions).toEqual([
      { kind: 'push', topicId: 'knots', json: topicJson(earned), revision: 5 },
    ])
  })

  it('does nothing at all when the two copies already agree', () => {
    const plan = planSync([untouched], [remote('knots', untouched, 4)], {})
    expect(plan.conflicts).toEqual([])
    expect(plan.actions).toEqual([
      { kind: 'adopt', topicId: 'knots', json: topicJson(untouched), revision: 4 },
    ])
  })

  it('reports a conflict when each copy holds something the other does not', () => {
    // Equal attempts, but this device has item evidence the other lacks and the
    // other has an attempt this one lacks. Neither covers the other.
    const mine = topic('knots', {
      history: [{ at: '2026-01-01T00:00:00.000Z' }],
      itemEvidence: { a: 1, b: 2 },
    } as unknown as Partial<Topic>)
    const theirs = topic('knots', {
      history: [{ at: '2026-01-01T00:00:00.000Z' }, { at: '2026-02-01T00:00:00.000Z' }],
      itemEvidence: { a: 1 },
    } as unknown as Partial<Topic>)
    const plan = planSync([mine], [remote('knots', theirs, 4)], {})
    expect(plan.actions).toEqual([])
    expect(plan.conflicts).toEqual(['knots'])
  })
})
