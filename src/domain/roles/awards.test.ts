import { describe, expect, it } from 'vitest'
import { freshSeedLibrary, reconcileLoadedLibrary } from '../../infrastructure/persistence/libraryMigrations'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import { captureRoleAwards, mergeRoleAwards, parseRoleAwards, type RoleAward } from './awards'
import { COMMUNICATOR } from './definitions'
import { communicatorProgress, roleProgress } from './roles'

const now = new Date('2026-10-13T15:00:00.000Z')
const ids = COMMUNICATOR.pathways.flatMap((path) => [...path.topicIds])
const receipt: RoleAward = { roleId: 'communicator', roleVersion: 1, earnedAt: now.toISOString(), topicIds: [...ids].sort() }
const completedLibrary = () => {
  const library = freshSeedLibrary(now)
  return { ...library, topics: library.topics.map((topic) => ids.includes(topic.id as typeof ids[number]) ? { ...topic, completedAt: now.toISOString(), status: 'completed' as const } : topic) }
}

describe('permanent role receipts', () => {
  it('backfills a complete existing library once and never invents partial awards', () => {
    const upgraded = reconcileLoadedLibrary(completedLibrary(), now).library
    expect(upgraded.roleAwards).toEqual([receipt])
    expect(captureRoleAwards(upgraded, new Date('2027-01-01'))).toBe(upgraded)
    expect(captureRoleAwards(freshSeedLibrary(now), now).roleAwards).toBeUndefined()
  })
  it('keeps an award with no topics and across an optional future requirement set', () => {
    expect(communicatorProgress([], [receipt])).toMatchObject({ earned: true, completeCount: 0, earnedVersion: 1 })
    const v2 = { ...COMMUNICATOR, version: 2, pathways: [...COMMUNICATOR.pathways, { id: 'extra', title: 'Extra', topicIds: ['new-a', 'new-b'] }] }
    expect(roleProgress(v2, completedLibrary().topics, [receipt])).toMatchObject({ earned: true, requiredCount: 9, completeCount: 7, earnedVersion: 1 })
  })
  it('round-trips receipts and reset generation without depending on surviving topics', () => {
    const library = { version: 5, topics: [], roleAwards: [receipt], roleAwardGeneration: 3 }
    expect(parseLibrary(JSON.parse(JSON.stringify(library)))).toEqual({ ok: true, library })
    const future = { ...receipt, roleId: 'future-role', roleVersion: 7 }
    expect(parseRoleAwards([future])).toEqual([future])
  })
  it('refuses malformed or duplicate receipts rather than silently dropping awards', () => {
    for (const awards of [null, {}, [receipt, receipt], [{ ...receipt, earnedAt: 'yesterday' }], [{ ...receipt, roleVersion: 0 }], [{ ...receipt, topicIds: ['a', 'a'] }], [{ ...receipt, secret: true }]]) {
      expect(parseLibrary({ version: 5, topics: [], roleAwards: awards }).ok).toBe(false)
    }
    expect(parseLibrary({ version: 5, topics: [], roleAwardGeneration: -1 }).ok).toBe(false)
  })
  it('merges concurrent awards deterministically without removing either role', () => {
    const later = { ...receipt, earnedAt: '2026-10-14T15:00:00.000Z' }
    const other = { ...receipt, roleId: 'navigator' }
    expect(mergeRoleAwards([later], [receipt, other])).toEqual(mergeRoleAwards([other, receipt], [later]))
    expect(mergeRoleAwards([later], [receipt, other])).toEqual([receipt, other])
  })
})
