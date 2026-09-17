import { describe, expect, it } from 'vitest'
import { nextLedger, planSync, topicJson, wouldLoseEvidence, type Ledger, type RemoteRecord } from './plan'
import type { Topic } from '../types'

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

  it('drops an unchanged local topic the server has deleted', () => {
    const gone = topic('knots')
    const { actions, conflicts } = planSync([gone], [], ledgerFor('knots', gone, 3))
    expect(actions).toEqual([{ kind: 'dropLocal', topicId: 'knots' }])
    expect(conflicts).toEqual([])
  })

  it('does not drop a locally edited topic when another device deleted the old copy', () => {
    const before = topic('knots')
    const mine = topic('knots', { status: 'learning' })
    const plan = planSync([mine], [], ledgerFor('knots', before, 3))
    expect(plan.actions).toEqual([])
    expect(plan.conflicts).toEqual(['knots'])
  })

  it('deletes remotely only the exact revision this device had deleted', () => {
    const gone = topic('knots')
    const { actions, conflicts } = planSync([], [remote('knots', gone, 3)], ledgerFor('knots', gone, 3))
    expect(actions).toEqual([{ kind: 'deleteRemote', topicId: 'knots', revision: 3 }])
    expect(conflicts).toEqual([])
  })

  it('does not delete a topic another device edited after this device deleted its old copy', () => {
    const before = topic('knots')
    const theirs = topic('knots', { status: 'drilled' })
    const plan = planSync([], [remote('knots', theirs, 4)], ledgerFor('knots', before, 3))
    expect(plan.actions).toEqual([])
    expect(plan.conflicts).toEqual(['knots'])
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

  it('adopts an identical copy to establish the ledger baseline', () => {
    const plan = planSync([untouched], [remote('knots', untouched, 4)], {})
    expect(plan.conflicts).toEqual([])
    expect(plan.actions).toEqual([
      { kind: 'adopt', topicId: 'knots', json: topicJson(untouched), revision: 4 },
    ])
  })

  it('reports a conflict when each copy holds something the other does not', () => {
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
