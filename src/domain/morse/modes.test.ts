import { describe, expect, it } from 'vitest'
import { morseTopic, modeTopicFixtures } from './__fixtures__/modeTopics'
import {
  LEVEL_REASON_ALPHABET, LEVEL_REASON_LETTERS, MORSE_MODES, SAFE_LEVEL_MINIMUM, currentLevel, lettersStable,
  levelReadiness, levelsFor, modeAvailability, modeEligibleLetters, modeEntry, modeLevelCleared,
  modeMaterialCharacters, modePlayLetters,
} from './modes'
import { COPY_LEVELS, copyPrompts } from './fluency/copy'
import { newFluencyProgress } from './fluency/progress'
import { SEND_STAGES, sendPrompts } from './fluency/send'
import { startFluencyRun } from './fluency/session'
import { lessonPackets } from './curriculum/lesson'
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

  it('opens every mode with no settled letters: Letters start on Lesson 1, longer levels say why (#257)', () => {
    const fresh = morseTopic()
    expect(modePlayLetters(fresh)).toEqual(lessonPackets()[0].characters)
    for (const { id } of MORSE_MODES) {
      expect(modeAvailability(fresh, id)).toBe('available')
      expect(currentLevel(fresh, id)?.id ?? null).toBe(id === 'free' ? null : 'letters')
    }
    expect(modeEntry(fresh, 'free')).toEqual({ mode: 'free', levelId: null, kind: 'free' })
    for (const mode of ['key', 'listen', 'read'] as const) {
      expect(modeEntry(fresh, mode)).toMatchObject({ kind: 'practice', levelId: 'letters', eligibleLetters: lessonPackets()[0].characters })
      for (const level of levelsFor(mode).filter((candidate) => candidate.kind !== 'practice')) {
        expect(modeEntry(fresh, mode, level.id), level.id).toBeNull()
        expect(levelReadiness(fresh, level), level.id).toEqual({
          startable: false, reason: level.tier === 'numbers' ? LEVEL_REASON_ALPHABET : LEVEL_REASON_LETTERS,
        })
      }
    }
  })

  it('uses the exact #221 roster and does not infer knowledge from status or bests', () => {
    const topic = morseTopic(1)
    const eligible = modeEligibleLetters(topic)
    expect(eligible).toHaveLength(2)
    for (const { id } of MORSE_MODES) expect(modeAvailability(topic, id)).toBe('available')
    expect(modeEntry(topic, 'key')).toMatchObject({ kind: 'practice', direction: 'key', levelId: 'letters', eligibleLetters: eligible })
    // Two letters make no ordinary words, so no word level can start yet.
    expect(modeEntry(topic, 'listen', 'copy:common')).toBeNull()
    expect(modeEntry(topic, 'key', 'send:dispatch')).toBeNull()
    expect(modeEntry(topic, 'free')).toEqual({ mode: 'free', levelId: null, kind: 'free' })
    expect(modeEligibleLetters({ ...topic, acquisitionReadyAt: 'historical' })).toHaveLength(26)
    expect(modeEligibleLetters(modeTopicFixtures().legacyBanked)).toEqual([])
    expect(modeMaterialCharacters(topic)).toEqual(new Set(eligible))
    expect(modeMaterialCharacters({ ...topic, acquisitionReadyAt: 'historical' })).toBeNull()
  })

  it('offers a level by id exactly when it can start, regardless of other clears', () => {
    for (const topic of Object.values(modeTopicFixtures())) {
      for (const { id: mode } of MORSE_MODES) {
        for (const level of levelsFor(mode)) {
          const entry = modeEntry(topic, mode, level.id)
          if (levelReadiness(topic, level).startable) {
            expect(entry).toMatchObject({ mode, levelId: level.id, kind: level.kind })
          } else {
            expect(entry).toBeNull()
          }
        }
      }
    }
    const ready = { ...morseTopic(13), morseFluency: newFluencyProgress() }
    for (const mode of ['key', 'listen', 'read'] as const) {
      for (const level of levelsFor(mode)) expect(levelReadiness(ready, level)).toEqual({ startable: true })
    }
    const topic = { ...morseTopic(1), morseFluency: newFluencyProgress() }
    topic.morseFluency.bests['send:words'] = 90
    expect(currentLevel(topic, 'key')?.id).toBe('send:flow')
    // The suggestion cannot start with two letters, so the tray falls back to Letters.
    expect(modeEntry(topic, 'key')).toMatchObject({ levelId: 'letters' })
  })

  it('never gives a 10 / 26 learner material containing an untaught letter (#257)', () => {
    const topic = morseTopic(5)
    const taught = new Set(modeEligibleLetters(topic))
    expect(taught.size).toBe(10)
    const allowed = modeMaterialCharacters(topic)!
    const untaught = (text: string) => [...text].filter((character) => character !== ' ' && !taught.has(character as never))
    const startable = new Set<string>()
    for (const mode of ['key', 'listen'] as const) {
      for (const level of levelsFor(mode)) {
        if (!levelReadiness(topic, level).startable) continue
        startable.add(level.id)
        for (let seed = 0; seed < 40; seed += 1) {
          const prompts = level.kind === 'send' ? sendPrompts(level.stage, seed, allowed)
            : level.kind === 'copy' ? copyPrompts(level.level, newFluencyProgress(), seed, new Set(), allowed)
              : level.kind === 'fluency' ? startFluencyRun(level.challenge, 6, newFluencyProgress(), seed, new Set(), [], allowed).prompts.map((prompt) => prompt.text)
                : []
          if (level.kind !== 'practice') expect(prompts.length, `${level.id} seed ${seed}`).toBeGreaterThan(0)
          for (const prompt of prompts) expect(untaught(prompt), `${level.id}: ${prompt}`).toEqual([])
        }
      }
    }
    // Words are open at 10 letters; numbers wait for the alphabet.
    expect(startable).toContain('send:words')
    expect(startable).toContain('copy:common')
    expect(startable).toContain('fluency:words')
    expect(startable).toContain('fluency:groups')
    expect(startable).not.toContain('copy:numbers')
    expect(startable).not.toContain('copy:mixed')
    expect(levelReadiness(topic, levelsFor('listen').find((level) => level.id === 'copy:numbers')!))
      .toEqual({ startable: false, reason: LEVEL_REASON_ALPHABET })
  })

  it('needs SAFE_LEVEL_MINIMUM distinct prompts before a word level can start', () => {
    expect(SAFE_LEVEL_MINIMUM).toBe(6)
    const words = levelsFor('key').find((level) => level.id === 'send:words')!
    // Lesson 2 makes two words (EAT, TEA); lesson 3 makes enough.
    expect(levelReadiness(morseTopic(2), words).startable).toBe(false)
    expect(levelReadiness(morseTopic(3), words).startable).toBe(true)
  })

  it('requires three latest correct outcomes for every eligible A–Z letter in the same direction', () => {
    const topic = { ...morseTopic(13), morsePractice: newMorsePractice() }
    for (const glyph of modeEligibleLetters(topic)) {
      topic.morsePractice.characters.key[glyph] = { outcomes: [false, true, true, true], shown: 4, lastShownSequence: 1 }
    }
    expect(lettersStable(topic, 'key')).toBe(true)
    expect(currentLevel(topic, 'key')?.id).toBe('send:words')
    expect(currentLevel(topic, 'listen')?.id).toBe('letters')
    expect(currentLevel(topic, 'read')?.id).toBe('letters')
    topic.morsePractice.characters.key.E!.outcomes = [true, true]
    expect(lettersStable(topic, 'key')).toBe(false)
    topic.morsePractice.characters.key.E!.outcomes = [true, true, false]
    expect(lettersStable(topic, 'key')).toBe(false)
    topic.morsePractice.characters.key.E!.outcomes = [true, true, true]
    expect(lettersStable(topic, 'key')).toBe(true)
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
