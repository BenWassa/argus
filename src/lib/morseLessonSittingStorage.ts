import { LESSON_RETRIEVAL_TARGET, newLessonSitting, type LessonSitting } from './morseLessonSitting'

const KEY = 'argus.morse-learn-sittings.v1'

type SittingStore = Record<string, LessonSitting>

function validSitting(value: unknown): LessonSitting | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const raw = value as Record<string, unknown>
  const retrievals = Number.isInteger(raw.retrievals) ? Number(raw.retrievals) : -1
  const correct = Number.isInteger(raw.correct) ? Number(raw.correct) : -1
  if (retrievals < 0 || retrievals > LESSON_RETRIEVAL_TARGET || correct < 0 || correct > retrievals) return null
  if (!Array.isArray(raw.revisitItemIds) || raw.revisitItemIds.some((id) => typeof id !== 'string' || !id)) return null
  const revisitItemIds = [...new Set(raw.revisitItemIds as string[])]
  return { retrievals, correct, revisitItemIds }
}

function readStore(): SittingStore {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}
    const store: SittingStore = {}
    for (const [topicId, value] of Object.entries(parsed as Record<string, unknown>)) {
      const sitting = validSitting(value)
      if (sitting) store[topicId] = sitting
    }
    return store
  } catch {
    return {}
  }
}

function writeStore(store: SittingStore): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    // Learn remains usable for this session when storage is blocked/full.
  }
}

export function loadLessonSitting(topicId: string): LessonSitting {
  const sitting = readStore()[topicId]
  return sitting
    ? { ...sitting, revisitItemIds: [...sitting.revisitItemIds] }
    : newLessonSitting()
}

export function saveLessonSitting(topicId: string, sitting: LessonSitting): void {
  const valid = validSitting(sitting)
  if (!valid) return
  const store = readStore()
  store[topicId] = valid
  writeStore(store)
}

export function clearLessonSitting(topicId: string): void {
  const store = readStore()
  if (!(topicId in store)) return
  delete store[topicId]
  writeStore(store)
}

export function clearAllLessonSittings(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* reset remains best effort, like the main library storage */
  }
}
