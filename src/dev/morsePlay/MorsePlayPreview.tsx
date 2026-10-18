import { seedLibrary } from '../../domain/library/catalogSeed'
import type { Topic } from '../../domain/library/topic'
import { lessonPackets } from '../../domain/morse/curriculum/lesson'
import { MorseModeTray } from '../../features/morse/play/MorseModeTray'
import { MorseProgressPath } from '../../features/morse/play/MorseProgressPath'
import './MorsePlayPreview.css'

/** Isolated seed copies, never the stored library or a new progression policy. */
export function morsePlayPreviewTopic(state: string | null): Topic {
  const topic = seedLibrary().topics.find((candidate) => candidate.id === 'international-morse-letters-printed')
  if (!topic) throw new Error('Missing seeded Morse topic.')
  const finished = state === 'done' || state === 'repair'
  const settledLessons = finished ? 13 : state === 'mid' ? 5 : 0
  const glyphs = new Set<string>(lessonPackets().slice(0, settledLessons).flatMap((packet) => packet.characters))
  return {
    ...topic,
    status: state === 'repair' ? 'decayed' : finished ? 'completed' : settledLessons ? 'learning' : 'unstarted',
    lessonProgress: Object.fromEntries(topic.items.filter((item) => glyphs.has(item.prompt)).map((item) => [item.id!, 'settled'])),
    ...(finished ? { completedAt: '2026-01-01T00:00:00Z', acquisitionReadyAt: '2025-01-01T00:00:00Z' } : {}),
  }
}

export function MorsePlayPreview() {
  const topic = morsePlayPreviewTopic(new URLSearchParams(window.location.search).get('state'))
  return (
    <div className="morse-play-preview">
      <main className="morse-play-preview-main">
        <MorseProgressPath topic={topic} onAction={(action) => console.info('Morse path', action)} />
      </main>
      <div className="morse-play-preview-tray">
        <MorseModeTray topic={topic} onStart={(mode, entry) => console.info('Morse mode', mode, entry)} />
      </div>
      <div className="morse-play-preview-nav" aria-hidden="true"><span>Home</span><span>Roles</span><span>Library</span></div>
    </div>
  )
}
