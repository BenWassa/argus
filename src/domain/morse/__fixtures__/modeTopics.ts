import { seedLibrary } from '../../library/catalogSeed'
import type { Topic } from '../../library/topic'
import { lessonPackets } from '../curriculum/lesson'
import { newFluencyProgress } from '../fluency/progress'

export function morseTopic(settledLessons = 0): Topic {
  const topic = seedLibrary().topics.find((candidate) => candidate.id === 'international-morse-letters-printed')
  if (!topic) throw new Error('Missing seeded Morse topic.')
  const glyphs = new Set<string>(lessonPackets().slice(0, settledLessons).flatMap((packet) => packet.characters))
  return { ...topic, status: settledLessons ? 'learning' : 'unstarted', lessonProgress: Object.fromEntries(
    topic.items.filter((item) => glyphs.has(item.prompt)).map((item) => [item.id!, 'settled']),
  ) }
}

export function modeTopicFixtures(): Record<string, Topic> {
  const mid = morseTopic(5)
  const returning = structuredClone(mid)
  returning.lessonProgress![returning.items.find((item) => item.prompt === 'E')!.id!] = 'cued'
  const ready = morseTopic(13)
  const banked: Topic = { ...ready, status: 'completed', completedAt: '2026-01-01T00:00:00Z', acquisitionReadyAt: '2025-01-01T00:00:00Z' }
  const afterCourse: Topic = { ...ready, morseReview: { sittings: 1, items: {
    [ready.items[0].id!]: { introducedIn: 1, lastSeenIn: 1, laterCorrect: 0, printed: 1, heard: 0, heardCorrect: 0 },
  } } }
  return {
    fresh: morseTopic(), mid, returning, ready, banked,
    repair: { ...banked, status: 'decayed' }, afterCourse,
    advanced: { ...banked, morseFluency: { ...newFluencyProgress(), bests: {
      'send:words': 95, 'send:flow': 90, 'copy:letters': 90, 'copy:common': 99,
    } } },
    legacyBanked: { ...morseTopic(), status: 'drilled' },
  }
}
