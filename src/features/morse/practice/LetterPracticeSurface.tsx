import { useState } from 'react'
import { useLibrary } from '../../../services/library/LibraryProvider'
import { morseAcquisitionProfile } from '../../../domain/morse/testing/acquisitionProfile'
import { journeyFor } from '../../../domain/study/journey'
import type { MorseLetter } from '../../../domain/morse/code'
import { newMorsePractice } from '../../../domain/morse/practice'
import { LetterPracticeRun } from './LetterPracticeRun'

/** The only write path in letter practice: formative observations alone. */
export function LetterPracticeSurface({ topicId, onExit }: { topicId: string; onExit: () => void }) {
  const { topics, updateTopic } = useLibrary()
  const topic = topics.find(t => t.id === topicId)
  const [round, setRound] = useState(0)
  if (!topic) return null
  const profile = morseAcquisitionProfile(topic)
  const ready = journeyFor(topic).acquisition.ready
  const eligible = [...(profile?.values() ?? [])]
    .filter(c => ready || topic.lessonProgress?.[c.itemId] === 'settled')
    .map(c => c.glyph as MorseLetter)
  if (!eligible.length) return <section className="session"><h1>Practice letters</h1>
    <p>Learn your first letters to start a practice round.</p><button onClick={onExit}>Back to Morse</button></section>
  return <LetterPracticeRun key={round} eligible={eligible} initialProgress={topic.morsePractice ?? newMorsePractice()}
    onProgress={next => updateTopic(topicId, current => ({ ...current, morsePractice: next }))}
    onAnother={() => setRound(n => n + 1)} onExit={onExit} />
}
