// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { LibraryProvider, useLibrary } from './LibraryProvider'
import { freshSeedLibrary } from '../../infrastructure/persistence/libraryMigrations'
import { COMMUNICATOR } from '../../domain/roles/definitions'

const key = 'argus.library.v5'
const now = new Date('2026-10-13T15:00:00Z')
const ids = COMMUNICATOR.pathways.flatMap((path) => [...path.topicIds])
afterEach(() => { cleanup(); localStorage.clear() })

function readyLibrary() {
  const library = freshSeedLibrary(now)
  return { ...library, topics: library.topics.map((topic) => ids.includes(topic.id as typeof ids[number]) ? { ...topic, completedAt: now.toISOString(), status: 'completed' as const } : topic) }
}

describe('award receipt persistence', () => {
  it('preserves receipts through deletion, import, reload and account parking', () => {
    localStorage.setItem(key, JSON.stringify(readyLibrary()))
    const hook = renderHook(useLibrary, { wrapper: LibraryProvider })
    expect(hook.result.current.roleAwards).toHaveLength(1)
    const award = hook.result.current.roleAwards![0]
    act(() => hook.result.current.removeTopic(ids[0]))
    act(() => hook.result.current.replaceLibrary({ version: 5, topics: [], catalogDelivered: [] }))
    expect(hook.result.current.roleAwards).toEqual([award])
    expect(JSON.parse(localStorage.getItem(key)!).roleAwards).toEqual([award])
    act(() => hook.result.current.bindOwner('owner-a'))
    act(() => hook.result.current.bindOwner('owner-b'))
    expect(hook.result.current.roleAwards ?? []).toEqual([])
    act(() => hook.result.current.bindOwner('owner-a'))
    expect(hook.result.current.roleAwards).toEqual([award])
    hook.unmount()
    const reloaded = renderHook(useLibrary, { wrapper: LibraryProvider })
    expect(reloaded.result.current.roleAwards).toEqual([award])
  })
  it('writes a receipt in the same library record as the final completing topic', () => {
    const library = readyLibrary()
    library.topics = library.topics.map((topic) => topic.id === ids[0] ? { ...topic, status: 'learning', completedAt: null } : topic)
    localStorage.setItem(key, JSON.stringify(library))
    const { result } = renderHook(useLibrary, { wrapper: LibraryProvider })
    expect(result.current.roleAwards).toBeUndefined()
    act(() => result.current.updateTopic(ids[0], (topic) => ({ ...topic, status: 'completed', completedAt: now.toISOString() })))
    const saved = JSON.parse(localStorage.getItem(key)!)
    expect(saved.roleAwards).toHaveLength(1)
    expect(saved.topics.find((topic: { id: string }) => topic.id === ids[0]).completedAt).toBe(now.toISOString())
  })
  it('clears only on explicit reset and ignores stale pre-reset cloud receipts', () => {
    localStorage.setItem(key, JSON.stringify(readyLibrary()))
    const { result } = renderHook(useLibrary, { wrapper: LibraryProvider })
    const awards = result.current.roleAwards!
    act(() => result.current.resetLibrary())
    expect(result.current.roleAwards).toEqual([])
    expect(result.current.roleAwardGeneration).toBe(1)
    act(() => result.current.mergeRoleAwards(awards, 0))
    expect(result.current.roleAwards).toEqual([])
    act(() => result.current.mergeRoleAwards(awards, 2))
    expect(result.current.roleAwards).toEqual(awards)
    expect(result.current.roleAwardGeneration).toBe(2)
  })
})
