import { describe, expect, it } from 'vitest'
import { seedLibrary } from '../../library/catalogSeed'
import { curriculumFor } from '../generatedCurriculum'
import { checkCurriculum } from '../stages'

const AUTHORED_IDS = ['ooda-loop', 'whole-circle-bearings', 'reciprocal-bearings', 'north-references-declination', 'grid-north-map-bearings']

describe('authored curricula are what the app serves for their topics', () => {
  const topics = seedLibrary().topics
  it.each(AUTHORED_IDS)('%s', (id) => {
    const topic = topics.find(candidate => candidate.id === id)!
    const curriculum = curriculumFor(topic)!
    expect(curriculum.stages.some(stage => /^lesson-\d+$/.test(stage.id))).toBe(false)
    const figures = new Set(topic.items.filter(item => item.stimulus).map(item => item.id!))
    expect(checkCurriculum(curriculum, new Set(topic.items.map(item => item.id!)), { figureItemIds: figures })).toEqual([])
  })

  it('leaves every other ordinary topic on generated lessons', () => {
    const nato = topics.find(candidate => candidate.id === 'nato-phonetic')!
    expect(curriculumFor(nato)!.stages[0].id).toBe('lesson-1')
  })
})
