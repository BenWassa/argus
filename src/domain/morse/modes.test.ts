import { describe, expect, it } from 'vitest'
import { morseTopic, modeTopicFixtures } from './__fixtures__/modeTopics'
import {
  MORSE_MODES, currentLevel, lettersStable, levelsFor, modeAvailability, modeEligibleLetters,
  modeEntry, modeLevelCleared,
} from './modes'
import { COPY_LEVELS } from './fluency/copy'
import { newFluencyProgress } from './fluency/progress'
import { SEND_STAGES } from './fluency/send'
import { newMorsePractice } from './practice'

describe('Morse modes', () => {
  it('maps every surviving runner id in display and recommendation order', () => {
    expect(MORSE_MODES.map((mode) => mode.label)).toEqual(['Key', 'Listen', 'Read', 'Free play'])
    expect(levelsFor('key').map((level) => level.id)).toEqual(['letters', ...SEND_STAGES.map((id) => `send:${id}`)])
    expect(levelsFor('listen').filter((level) => level.kind === 'copy').map((level) => level.level))
      .toEqual(COPY_LEVELS.filter((id) => id !== 'letters'))
    expect(levelsFor('listen').filter((level) => level.kind === 'fluency').map((level) => level.challenge)).toEqual(['words', 'groups'])
    expect(levelsFor('read').map((level) => level.id)).toEqual(['letters'])
    expect(levelsFor('free')).toEqual([])
    expect(levelsFor('key').find((level) => level.id === 'send:messages')?.tier).toBe('sentences')
    expect(levelsFor('key').find((level) => level.id === 'send:dispatch')?.tier).toBe('messages')
  })

  it('locks every mode without settled letters but still describes the Letters starting level', () => {
    for (const { id } of MORSE_MODES) {
      expect(modeAvailability(morseTopic(), id)).toBe('locked')
      expect(modeEntry(morseTopic(), id)).toBeNull()
      expect(currentLevel(morseTopic(), id)?.id ?? null).toBe(id === 'free' ? null : 'letters')
    }
  })

  it('uses the exact #221 roster and does not infer knowledge from status or bests', () => {
    const topic = morseTopic(1)
    const eligible = modeEligibleLetters(topic)
    expect(eligible).toHaveLength(2)
    for (const { id } of MORSE_MODES) expect(modeAvailability(topic, id)).toBe('available')
    expect(modeEntry(topic, 'key')).toMatchObject({ kind: 'practice', direction: 'key', levelId: 'letters', eligibleLetters: eligible })
    expect(modeEntry(topic, 'listen', 'copy:common')).toBeNull()
    expect(modeEntry(topic, 'key', 'send:dispatch')).toBeNull()
    expect(modeEntry(topic, 'free')).toEqual({ mode: 'free', levelId: null, kind: 'free' })
    expect(modeEligibleLetters({ ...topic, acquisitionReadyAt: 'historical' })).toHaveLength(26)
    expect(modeEligibleLetters(modeTopicFixtures().legacyBanked)).toEqual([])
  })

  it('requires five latest correct outcomes for every eligible A–Z letter in the same direction', () => {
    const topic = { ...morseTopic(13), morsePractice: newMorsePractice() }
    for (const glyph of modeEligibleLetters(topic)) {
      topic.morsePractice.characters.key[glyph] = { outcomes: [false, true, true, true, true, true], shown: 6, lastShownSequence: 1 }
    }
    expect(lettersStable(topic, 'key')).toBe(true)
    expect(currentLevel(topic, 'key')?.id).toBe('send:words')
    expect(currentLevel(topic, 'listen')?.id).toBe('letters')
    expect(currentLevel(topic, 'read')?.id).toBe('letters')
    topic.morsePractice.characters.key.E!.outcomes = [true, true, true, true]
    expect(lettersStable(topic, 'key')).toBe(false)
    topic.morsePractice.characters.key.E!.outcomes = [true, true, true, true, false]
    expect(lettersStable(topic, 'key')).toBe(false)
    delete topic.morsePractice.characters.key.E
    expect(lettersStable(topic, 'key')).toBe(false)
    topic.lessonProgress = morseTopic(1).lessonProgress
    expect(lettersStable(topic, 'key')).toBe(false)
  })

  it('reuses 90% clears, preserves historical same-direction suggestions and keeps levels replayable', () => {
    const topic = modeTopicFixtures().advanced
    expect(currentLevel(topic, 'key')?.id).toBe('send:phrases')
    expect(currentLevel(topic, 'listen')?.id).toBe('copy:words')
    expect(currentLevel(topic, 'read')?.id).toBe('letters')
    expect(modeEntry(topic, 'key')).toMatchObject({ kind: 'send', stage: 'phrases', mode: 'key', levelId: 'send:phrases' })
    expect(modeEntry(topic, 'listen')).toMatchObject({ kind: 'copy', level: 'words', rung: topic.morseFluency!.rung })
    expect(modeEntry(topic, 'key', 'send:dispatch')).toMatchObject({ stage: 'dispatch' })
    expect(modeEntry(topic, 'key', 'copy:common')).toBeNull()
    topic.morseFluency!.bests['send:flow'] = 89
    expect(currentLevel(topic, 'key')?.id).toBe('send:flow')
    topic.morseFluency!.bests['copy:common'] = 89
    expect(currentLevel(topic, 'listen')?.id).toBe('copy:common')
  })

  it('keeps challenge counts separate from accuracy and speed bests', () => {
    const topic = { ...morseTopic(13), morseFluency: newFluencyProgress() }
    topic.morseFluency.bests = { sprint: 100, ladder: 20, words: 5, groups: 5 }
    expect(currentLevel(topic, 'listen')?.id).toBe('letters')
    for (const level of levelsFor('listen').filter((candidate) => candidate.kind === 'fluency')) {
      expect(modeLevelCleared(topic, 'listen', level)).toBe(false)
      topic.morseFluency.bests[level.challenge] = 6
      expect(modeLevelCleared(topic, 'listen', level)).toBe(true)
      expect(modeEntry(topic, 'listen', level.id)).toMatchObject({ kind: 'fluency' })
    }
  })

  it('retains the existing weakest Send suggestion once all stages clear', () => {
    const topic = { ...morseTopic(13), morseFluency: newFluencyProgress() }
    for (const stage of SEND_STAGES) topic.morseFluency.bests[`send:${stage}`] = 99
    topic.morseFluency.bests['send:flow'] = 91
    expect(currentLevel(topic, 'key')?.id).toBe('send:flow')
    for (const level of COPY_LEVELS) topic.morseFluency.bests[`copy:${level}`] = 99
    topic.morseFluency.bests.words = 6
    topic.morseFluency.bests.groups = 6
    expect(currentLevel(topic, 'listen')?.id).toBe('fluency:groups')
  })
})
