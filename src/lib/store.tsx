import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { clearLibrary, loadLibrary, saveLibrary } from './storage'
import type { Library, Topic } from './types'

interface LibraryStore {
  topics: Topic[]
  upsertTopic: (topic: Topic) => void
  removeTopic: (id: string) => void
  replaceLibrary: (library: Library) => void
  resetLibrary: () => void
}

const Ctx = createContext<LibraryStore | null>(null)

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState<Library>(() => loadLibrary())

  useEffect(() => {
    saveLibrary(library)
  }, [library])

  const upsertTopic = useCallback((topic: Topic) => {
    setLibrary((prev) => {
      const i = prev.topics.findIndex((t) => t.id === topic.id)
      const topics =
        i === -1
          ? [...prev.topics, topic]
          : prev.topics.map((t, at) => (at === i ? topic : t))
      return { ...prev, topics }
    })
  }, [])

  const removeTopic = useCallback((id: string) => {
    setLibrary((prev) => ({ ...prev, topics: prev.topics.filter((t) => t.id !== id) }))
  }, [])

  const replaceLibrary = useCallback((next: Library) => setLibrary(next), [])

  const resetLibrary = useCallback(() => {
    clearLibrary()
    setLibrary({ version: 3, topics: [] })
  }, [])

  const value = useMemo(
    () => ({ topics: library.topics, upsertTopic, removeTopic, replaceLibrary, resetLibrary }),
    [library.topics, upsertTopic, removeTopic, replaceLibrary, resetLibrary],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLibrary(): LibraryStore {
  const store = useContext(Ctx)
  if (!store) throw new Error('useLibrary must be used inside LibraryProvider')
  return store
}
