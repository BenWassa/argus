import { describe, expect, it } from 'vitest'
import {
  libraryMetaJson,
  mergeLibraryMetaJson,
  nextLedger,
  parseLibraryMeta,
  planSync,
  topicJson,
  wouldLoseEvidence,
  type Ledger,
  type RemoteRecord,
} from './syncPlanner'
import { freshSeedLibrary } from '../../infrastructure/persistence/libraryMigrations'
import type { Topic } from '../../domain/library/topic'

describe('transactional role metadata merge', () => {
  const communicator = { roleId: 'communicator', roleVersion: 1, earnedAt: '2026-10-13T12:00:00.000Z', topicIds: ['a'] }
  const navigator = { ...communicator, roleId: 'navigator' }
  it('preserves server awards when a stale client commits another role', () => {
    const a = libraryMetaJson(['a'], [communicator], 0)
    const b = libraryMetaJson(['b'], [navigator], 0)
    const result = mergeLibraryMetaJson(b, a)
    expect(JSON.parse(result)).toMatchObject({ catalogDelivered: ['a', 'b'], roleAwards: [communicator, navigator] })
    expect(mergeLibraryMetaJson(a, b)).toBe(result)
  })
  it('keeps an explicit reset over stale writes and accepts later awards in its generation', () => {
    const stale = libraryMetaJson([], [communicator], 0)
    const reset = libraryMetaJson([], [], 1)
    expect(mergeLibraryMetaJson(stale, reset)).toBe(reset)
    expect(mergeLibraryMetaJson(reset, stale)).toBe(reset)
    expect(mergeLibraryMetaJson(libraryMetaJson([], [navigator], 1), reset)).toBe(libraryMetaJson([], [navigator], 1))
  })
  it('refuses corrupt or future server metadata rather than replacing it', () => {
    const local = libraryMetaJson([])
    expect(() => mergeLibraryMetaJson(local, '{')).toThrow(/not overwritten/)
    expect(() => mergeLibraryMetaJson(local, JSON.stringify({ version: 6, catalogDelivered: [] }))).toThrow(/not overwritten/)
    expect(() => mergeLibraryMetaJson(local, JSON.stringify({ version: 5, catalogDelivered: [], futureField: true }))).toThrow(/not overwritten/)
  })
})

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

  it('adopts rather than reports when both devices arrived at the same record', () => {
    // Two devices applying the same load migration both change the topic, to
    // identical JSON. Agreement is not a conflict.
    const migrated = topic('knots', { title: 'Knots' })
    const plan = planSync(
      [migrated],
      [remote('knots', migrated, 3, 9_000)],
      ledgerFor('knots', before, 2, 1_000),
    )
    expect(plan.conflicts).toEqual([])
    expect(plan.actions).toEqual([
      { kind: 'adopt', topicId: 'knots', json: topicJson(migrated), revision: 3 },
    ])
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

  it('refuses a remote copy that would erase Morse placement progress', () => {
    const placedOut = topic('morse-code', {
      status: 'learning',
      lessonProgress: { e: 'settled', t: 'settled', a: 'settled', n: 'settled' },
      acquisitionReadyAt: '2026-09-18T12:00:00.000Z',
    })
    const withoutPlacement = topic('morse-code', { status: 'learning' })

    const plan = planSync(
      [placedOut],
      [remote('morse-code', withoutPlacement, 5)],
      ledgerFor('morse-code', placedOut, 2),
    )

    expect(plan.actions).toEqual([])
    expect(plan.conflicts).toEqual(['morse-code'])
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

  it('syncs the whole fresh catalog between independently installed devices', () => {
    const phone = freshSeedLibrary(new Date('2026-10-01T12:00:00Z')).topics
    const tablet = freshSeedLibrary(new Date('2026-10-23T12:00:00Z')).topics
    const records = tablet.map((entry) => remote(entry.id, entry, 4))
    const plan = planSync(phone, records, {})
    expect(phone.length).toBeGreaterThan(20)
    expect(plan.conflicts).toEqual([])
    expect(plan.actions).toHaveLength(phone.length)
    expect(plan.actions.every((action) => action.kind === 'adopt')).toBe(true)
    const settled = nextLedger({}, plan.actions, 5000)
    expect(planSync(tablet, records, settled)).toEqual({ actions: [], conflicts: [] })
  })

  it('settles equivalent records with reordered keys after both devices synced', () => {
    const baseline = topic('knots', { createdAt: '2026-10-01T00:00:00Z' })
    const mine = { ...baseline, createdAt: '2026-10-23T00:00:00Z' }
    const theirs = { ...mine, createdAt: '2026-10-02T00:00:00Z' }
    const record = remote('knots', theirs, 4)
    record.json = JSON.stringify(Object.fromEntries(Object.entries(theirs).reverse()))
    const plan = planSync([mine], [record], ledgerFor('knots', baseline, 3))
    expect(plan.conflicts).toEqual([])
    expect(plan.actions).toEqual([{ kind: 'adopt', topicId: 'knots', json: record.json, revision: 4 }])
  })

  it('retains real content edits even when progress counts match', () => {
    const mine = topic('knots', { title: 'My knots' })
    const theirs = topic('knots', { title: 'Different knots' })
    expect(planSync([mine], [remote('knots', theirs, 4)], {})).toEqual({ actions: [], conflicts: ['knots'] })
  })

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

  it('sends local placement up instead of adopting a placement-free remote copy', () => {
    const placedOut = topic('morse-code', {
      status: 'learning',
      lessonProgress: { e: 'settled', t: 'settled' },
    })
    const withoutPlacement = topic('morse-code', { status: 'learning' })

    const plan = planSync([placedOut], [remote('morse-code', withoutPlacement, 4)], {})

    expect(plan.conflicts).toEqual([])
    expect(plan.actions).toEqual([
      { kind: 'push', topicId: 'morse-code', json: topicJson(placedOut), revision: 5 },
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

describe('a remote copy this build cannot read', () => {
  it('is never pushed over on a first meeting, only reported', () => {
    const local = topic('knots', { history: [{ at: '2026-09-01T00:00:00.000Z', correct: 3, total: 3, resolvedTo: 'drilled' }] })
    const unreadable: RemoteRecord = { topicId: 'knots', json: '{ from a later build', revision: 4, updatedAtMs: 1_000 }
    const { actions, conflicts } = planSync([local], [unreadable], {})
    expect(actions).toEqual([])
    expect(conflicts).toEqual(['knots'])
  })
})

describe('formative Morse practice travels with the whole topic record', () => {
  const practice = {
    schemaVersion: 1 as const,
    sequence: { key: 1, read: 0, listen: 0 },
    characters: { key: { E: { outcomes: [true], shown: 1, lastShownSequence: 1 } }, read: {}, listen: {} },
  }

  it('serializes practice and reports concurrent practice edits as a topic conflict', () => {
    const baseline = topic('morse', { morsePractice: practice })
    const local = topic('morse', { morsePractice: { ...practice, sequence: { ...practice.sequence, key: 2 } } })
    const theirs = topic('morse', { morsePractice: { ...practice, sequence: { ...practice.sequence, read: 1 } } })
    expect(JSON.parse(topicJson(local)).morsePractice).toEqual(local.morsePractice)
    const plan = planSync([local], [remote('morse', theirs, 2)], ledgerFor('morse', baseline, 1))
    expect(plan.actions).toEqual([])
    expect(plan.conflicts).toEqual(['morse'])
  })
})

describe('formative Morse recognition travels with the whole topic record (#279)', () => {
  const recognition = {
    schemaVersion: 1 as const,
    streams: { 'read/speed': { sequence: 1, characters: { E: { outcomes: [true], shown: 1, lastShownSequence: 1, lastGradedSequence: 1, recentCorrectMs: [2000] } } } },
  }

  it('serializes recognition and reports concurrent edits as a topic conflict', () => {
    const baseline = topic('morse', { morseRecognition: recognition })
    const local = topic('morse', { morseRecognition: { ...recognition, streams: { 'read/speed': { ...recognition.streams['read/speed'], sequence: 2 } } } })
    const theirs = topic('morse', { morseRecognition: { ...recognition, streams: { 'read/speed': { ...recognition.streams['read/speed'], sequence: 3 } } } })
    expect(JSON.parse(topicJson(local)).morseRecognition).toEqual(local.morseRecognition)
    const plan = planSync([local], [remote('morse', theirs, 2)], ledgerFor('morse', baseline, 1))
    expect(plan.actions).toEqual([])
    expect(plan.conflicts).toEqual(['morse'])
  })
})

describe('library-level state', () => {
  it('travels as one canonical text for the same set of delivered topics', () => {
    expect(libraryMetaJson(['b', 'a', 'b'])).toBe(libraryMetaJson(['a', 'b']))
    expect(parseLibraryMeta(libraryMetaJson(['b', 'a']))).toEqual(['a', 'b'])
  })

  it('refuses a record it cannot read rather than guessing at it', () => {
    expect(parseLibraryMeta('{ nope')).toBeNull()
    expect(parseLibraryMeta(JSON.stringify({ version: 6, catalogDelivered: [] }))).toBeNull()
    expect(parseLibraryMeta(JSON.stringify({ version: 5, catalogDelivered: [1] }))).toBeNull()
  })
})
