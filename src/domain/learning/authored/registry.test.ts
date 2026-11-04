import { describe, expect, it } from 'vitest'
import { seedLibrary } from '../../library/catalogSeed'
import { curriculumFor } from '../generatedCurriculum'
import { checkCurriculum } from '../stages'

const AUTHORED_IDS = ['vessel-day-shapes', 'ooda-loop', 'whole-circle-bearings', 'reciprocal-bearings', 'north-references-declination', 'grid-north-map-bearings']

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
    for (const topic of topics.filter(topic => !AUTHORED_IDS.includes(topic.id) && topic.items.length && topic.id !== 'international-morse')) {
      const curriculum = curriculumFor(topic)
      if (curriculum) expect(curriculum.stages.every(stage => /^lesson-\d+$/.test(stage.id)), topic.id).toBe(true)
    }
  })
})
