import { curriculumFor, learningItemId } from '../../../domain/learning/generatedCurriculum'
import { withStageCompleted } from '../../../domain/learning/stageProgress'
import type { Topic } from '../../../domain/library/topic'
import { useLibrary } from '../../../services/library/LibraryProvider'
import { StageRunner } from './StageRunner'

export function StageLesson({ topic, stageId, onExit, onNext, onTest }: {
  topic: Topic; stageId: string; onExit: () => void; onNext: (stageId: string) => void; onTest: () => void
}) {
  const { updateTopic } = useLibrary()
  const curriculum = curriculumFor(topic)
  const stage = curriculum?.stages.find(stage => stage.id === stageId)
  if (!curriculum || !stage) return null
  const items = new Map(topic.items.map((item, index) => [learningItemId(item, index), item]))
  const next = curriculum.stages[curriculum.stages.indexOf(stage) + 1]
  return <StageRunner stage={stage} itemFor={id => items.get(id)}
    itemFace={id => ({ front: items.get(id)?.prompt ?? '', back: items.get(id)?.answer ?? '' })}
    onFinish={id => updateTopic(topic.id, current => withStageCompleted(current, curriculum, id))}
    onExit={onExit} onNext={next ? () => onNext(next.id) : onTest} nextLabel={next ? 'Next lesson' : 'Final Test'} />
}
