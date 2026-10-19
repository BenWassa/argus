import { useState } from 'react'
import { useLibrary } from '../../../services/library/LibraryProvider'
import { modePlayLetters } from '../../../domain/morse/modes'
import { newMorsePractice, type PracticeDirection } from '../../../domain/morse/practice'
import { LetterPracticeRun } from './LetterPracticeRun'
import { SessionFrame } from '../../../shared/ui/SessionFrame'

/** The only write path in letter practice: formative observations alone. */
export function LetterPracticeSurface({ topicId, onExit, direction }: { direction?: PracticeDirection; topicId: string; onExit: () => void }) {
  const { topics, updateTopic } = useLibrary()
  const topic = topics.find(t => t.id === topicId)
  const [round, setRound] = useState(0)
  if (!topic) return null
  // The taught roster, or Lesson 1's letters before any are settled (#257).
  const eligible = modePlayLetters(topic)
  if (!eligible.length) return <SessionFrame kind={direction ?? "key"} title="Practice" onClose={onExit}><h1>Learn letters first</h1></SessionFrame>
  return <LetterPracticeRun key={`${round}-${direction}`} direction={direction} eligible={eligible} initialProgress={topic.morsePractice ?? newMorsePractice()}
    onProgress={next => updateTopic(topicId, current => ({ ...current, morsePractice: next }))}
    onAnother={() => setRound(n => n + 1)} onExit={onExit} />
}
