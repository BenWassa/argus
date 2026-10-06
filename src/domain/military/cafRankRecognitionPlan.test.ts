import { describe, expect, it } from 'vitest'
import {
  CAF_RANK_RECOGNITION_PLAN,
  CAF_RANK_RIGHTS_STATUS,
  CAF_RANK_SOURCE_PAGES,
  cafRankRecognitionPlanFor,
  type CafRankService,
} from './cafRankRecognitionPlan'

const SERVICES: readonly CafRankService[] = ['army', 'rcn', 'rcaf']

describe('CAF rank-insignia recognition plan (#178)', () => {
  it('fixes exactly 57 licence-blocked recognition items: 19 per service', () => {
    expect(CAF_RANK_RECOGNITION_PLAN).toHaveLength(57)

    for (const service of SERVICES) {
      const items = cafRankRecognitionPlanFor(service)
      expect(items).toHaveLength(19)
      expect(items.map((item) => item.level)).toEqual(Array.from({ length: 19 }, (_, index) => index + 1))
      expect(new Set(items.map((item) => item.officialAssetUrl)).size).toBe(19)
    }
  })

  it('keeps every source on the official DND/CAF rank pages and outside runtime media', () => {
    for (const item of CAF_RANK_RECOGNITION_PLAN) {
      expect(item.officialSourcePageUrl).toBe(CAF_RANK_SOURCE_PAGES[item.service])
      expect(item.officialAssetUrl).toMatch(
        /^https:\/\/www\.canada\.ca\/content\/dam\/themes\/defence\/caf\/militaryhistory\/dhh\/ranks\/[a-z0-9-]+\.png$/,
      )
      expect(item.officialAssetUrl).not.toContain('/media/')
      expect(item.rightsStatus).toBe(CAF_RANK_RIGHTS_STATUS)
    }
  })

  it('authors only nearby 3-4 option confusion sets with one exact key', () => {
    for (const item of CAF_RANK_RECOGNITION_PLAN) {
      expect(item.options.length).toBeGreaterThanOrEqual(3)
      expect(item.options.length).toBeLessThanOrEqual(4)
      expect(new Set(item.options).size).toBe(item.options.length)
      expect(item.options.filter((option) => option === item.answer)).toHaveLength(1)
    }
  })

  it('uses non-revealing alt text for the explicitly visual completion claim', () => {
    for (const item of CAF_RANK_RECOGNITION_PLAN) {
      expect(item.alt.length).toBeGreaterThan(30)
      expect(item.alt.toLowerCase()).not.toContain(item.answer.toLowerCase())
      expect(item.alt.toLowerCase()).not.toContain(item.abbreviation.toLowerCase())
    }
  })

  it('uses RCN sleeve-lace exemplars for flag officers and current learner-facing Sailor names', () => {
    const navy = cafRankRecognitionPlanFor('rcn')

    for (const item of navy.slice(0, 4)) {
      expect(item.officialAssetUrl).toContain('-sleeve.png')
      expect(item.dressInstructionFigure).toBe('3-2-3')
    }

    expect(navy.slice(15).map((item) => item.answer)).toEqual([
      'Master Sailor',
      'Sailor 1st Class',
      'Sailor 2nd Class',
      'Sailor 3rd Class',
    ])
  })

  it('pins the controlling Dress Instruction figures by service and officer/NCM split', () => {
    expect(cafRankRecognitionPlanFor('army').slice(0, 11).every((item) => item.dressInstructionFigure === '3-2-1')).toBe(true)
    expect(cafRankRecognitionPlanFor('army').slice(11).every((item) => item.dressInstructionFigure === '3-2-6')).toBe(true)
    expect(cafRankRecognitionPlanFor('rcn').slice(0, 11).every((item) => item.dressInstructionFigure === '3-2-3')).toBe(true)
    expect(cafRankRecognitionPlanFor('rcn').slice(11).every((item) => item.dressInstructionFigure === '3-2-7')).toBe(true)
    expect(cafRankRecognitionPlanFor('rcaf').slice(0, 11).every((item) => item.dressInstructionFigure === '3-2-5')).toBe(true)
    expect(cafRankRecognitionPlanFor('rcaf').slice(11).every((item) => item.dressInstructionFigure === '3-2-8')).toBe(true)
  })
})
