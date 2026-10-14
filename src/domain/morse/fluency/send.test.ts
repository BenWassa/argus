import { describe, expect, it } from 'vitest'
import { MORSE_LETTERS } from '../code'
import { newFluencyProgress } from './progress'
import {
  SEND_STAGES,
  SEND_STAGE_INFO,
  nextSendStage,
  recommendedSendStage,
  sendBestKey,
  sendPrompts,
  sendStageCleared,
} from './send'

describe('guided Morse sending material', () => {
  it('builds finite deterministic material for every stage', () => {
    for (const stage of SEND_STAGES) {
      const first = sendPrompts(stage, 42)
      const second = sendPrompts(stage, 42)
      expect(first).toEqual(second)
      expect(first).toHaveLength(SEND_STAGE_INFO[stage].length)
      expect(new Set(first).size).toBe(first.length)

      for (const prompt of first) {
        expect(prompt).toMatch(/^[A-Z ]+$/)
        for (const character of prompt.replaceAll(' ', '')) {
          expect(character in MORSE_LETTERS).toBe(true)
        }
      }
    }
  })

  it('keeps the field-themed pack visibly separate from official procedure', () => {
    const dispatch = sendPrompts('dispatch', 7)
    expect(dispatch.every((prompt) => prompt.split(' ').length >= 2)).toBe(true)
    expect(dispatch.every((prompt) => /[A-Z]/.test(prompt))).toBe(true)
  })

  it('uses formative bests as suggestions, never gates', () => {
    const fresh = newFluencyProgress()
    expect(nextSendStage(fresh)).toBe('words')
    expect(sendStageCleared(fresh, 'words')).toBe(false)

    const progressed = {
      ...fresh,
      bests: { ...fresh.bests, [sendBestKey('words')]: 92 },
    }
    expect(sendStageCleared(progressed, 'words')).toBe(true)
    expect(nextSendStage(progressed)).toBe('flow')
    expect(nextSendStage(progressed, 'words')).toBe('flow')
  })

  it('recommends the weakest stage once every stage is cleared', () => {
    const fresh = newFluencyProgress()
    expect(recommendedSendStage(undefined)).toBe('words')
    expect(recommendedSendStage(fresh)).toBe('words')

    const cleared = {
      ...fresh,
      bests: {
        [sendBestKey('words')]: 100,
        [sendBestKey('flow')]: 95,
        [sendBestKey('phrases')]: 92,
        [sendBestKey('messages')]: 98,
        [sendBestKey('dispatch')]: 100,
      },
    }
    expect(nextSendStage(cleared)).toBeNull()
    expect(recommendedSendStage(cleared)).toBe('phrases')

    const tied = {
      ...cleared,
      bests: Object.fromEntries(SEND_STAGES.map((stage) => [sendBestKey(stage), 100])),
    }
    expect(recommendedSendStage(tied)).toBe('dispatch')
  })
})
