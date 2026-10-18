import { describe, expect, it } from 'vitest'
import { journeyFor } from '../../study/journey'
import { modeTopicFixtures, morseTopic } from '../__fixtures__/modeTopics'
import { MORSE_TIERS, levelsFor, modeAvailability, modeEntry } from '../modes'
import { lessonPackets } from './lesson'
import { morseWordCheckpoints } from './checkpoints'
import { morseProgressPath } from './progressPath'

describe('Morse progress path', () => {
  it('keeps exactly one current node consistent with the shared next action across learner fixtures', () => {
    for (const [name, topic] of Object.entries(modeTopicFixtures())) {
      const journey = journeyFor(topic)
      const path = morseProgressPath(topic)!
      const current = path.nodes.filter((node) => node.state === 'current')
      expect(current, name).toHaveLength(1)
      expect(current[0].id, name).toBe(path.currentNodeId)
      if (journey.action === 'test') {
        expect(current[0].action, name).toEqual({ kind: 'test', early: false })
      } else if (journey.acquisition.afterCourse && journey.acquisition.owed.length) {
        expect(current[0].action, name).toEqual({ kind: 'after-course' })
      } else {
        expect(current[0].action, name).toEqual({ kind: 'start-lesson', packetIndex: journey.acquisition.packet - 1 })
      }
      expect(new Set(path.nodes.map((node) => node.id)).size).toBe(path.nodes.length)
      expect(path.nodes.every((node) => node.accessibleLabel.includes(node.state))).toBe(true)
      expect(path.nodes.every((node) => !node.accessibleLabel.includes('—'))).toBe(true)
    }
  })

  it('shows Start with placement, all canonical lesson letters and derived interstitial positions', () => {
    const path = morseProgressPath(morseTopic())!
    expect(path.currentNodeId).toBe('start')
    expect(path.nodes[0]).toMatchObject({ kind: 'start', offersPlacement: true })
    const lessons = path.nodes.filter((node) => node.kind === 'lesson')
    expect(lessons.map((node) => node.novel)).toEqual(lessonPackets().map((packet) => packet.novel))
    expect(lessons).toHaveLength(13)
    expect(lessons.slice(1).every((node) => node.state === 'locked' && node.novel.length === 2 && node.action === null)).toBe(true)
    for (const checkpoint of morseWordCheckpoints()) {
      const index = path.nodes.findIndex((node) => node.id === `checkpoint-${checkpoint.id}`)
      expect(path.nodes[index - 1].id).toBe(`lesson-${checkpoint.afterLesson}`)
      expect(path.nodes[index]).toMatchObject({ state: 'locked', words: checkpoint.words, action: null })
    }
    expect(path.nodes.filter((node) => node.kind === 'tier').map((node) => node.tier)).toEqual(MORSE_TIERS.filter((tier) => tier !== 'letters'))
  })

  it('keeps past lessons replayable and checkpoints reached without claiming unsaved completions', () => {
    const path = morseProgressPath(modeTopicFixtures().mid)!
    expect(path.currentNodeId).toBe('lesson-6')
    expect(path.nodes.find((node) => node.id === 'lesson-1')).toMatchObject({ state: 'done', action: { kind: 'replay-lesson', packetIndex: 0 } })
    expect(path.nodes.find((node) => node.id === 'lesson-6')?.accessibleLabel)
      .toBe(`Lesson 6, ${lessonPackets()[5].novel.join(' and ')}, current`)
    expect(path.nodes.find((node) => node.id === 'checkpoint-after-4')).toMatchObject({ state: 'reached', action: { kind: 'checkpoint', checkpointId: 'after-4' } })
    expect(path.nodes.find((node) => node.id === 'checkpoint-after-7')?.state).toBe('locked')
  })

  it('preserves later reached lessons and checkpoints through a returning miss', () => {
    const path = morseProgressPath(modeTopicFixtures().returning)!
    expect(path.currentNodeId).toBe('lesson-1')
    expect(path.nodes.find((node) => node.id === 'lesson-5')).toMatchObject({ state: 'reached', action: { kind: 'replay-lesson', packetIndex: 4 } })
    expect(path.nodes.find((node) => node.id === 'checkpoint-after-4')?.state).toBe('reached')
    expect(path.nodes.find((node) => node.id === 'lesson-7')?.state).toBe('locked')
  })

  it('distinguishes early Test, eligible Test, banked and repair while retaining a Test action', () => {
    const fixtures = modeTopicFixtures()
    for (const [name, state, early] of [
      ['fresh', 'locked', true], ['ready', 'available', false], ['banked', 'banked', false], ['repair', 'repair', false],
    ] as const) {
      const test = morseProgressPath(fixtures[name])!.nodes.find((node) => node.kind === 'test')!
      expect(test).toMatchObject({ testState: state, earlyRunPossible: early, testAction: { kind: 'test', early } })
      if (state !== 'locked') expect(test.action).toEqual({ kind: 'test', early })
    }
    const afterCourse = morseProgressPath(fixtures.afterCourse)!
    expect(afterCourse.currentNodeId).toBe('test')
    expect(afterCourse.nodes.find((node) => node.id === 'test')).toMatchObject({
      state: 'current', testState: 'locked', action: { kind: 'after-course' },
    })
    expect(afterCourse.nodes.filter((node) => node.kind === 'lesson').every((node) => node.state === 'done')).toBe(true)
  })

  it('derives tier pips from actual supporting modes and requires every level in a tier to clear', () => {
    const topic = modeTopicFixtures().advanced
    const words = morseProgressPath(topic)!.nodes.find((node) => node.kind === 'tier' && node.tier === 'words')!
    if (words.kind !== 'tier') throw new Error('Missing Words tier.')
    expect(words.pips.map((pip) => [pip.mode, pip.state])).toEqual([['key', 'cleared'], ['listen', 'available']])
    expect(words.pips.find((pip) => pip.mode === 'listen')!.action).toEqual({ kind: 'mode', entry: modeEntry(topic, 'listen', 'copy:words') })
    const before = topic.morseFluency!.bests
    topic.morseFluency!.bests = { ...before, 'copy:words': 90, words: 5 }
    const pending = morseProgressPath(topic)!.nodes.find((node) => node.id === 'tier-words')!
    if (pending.kind !== 'tier') throw new Error('Missing Words tier.')
    expect(pending.pips[1]).toMatchObject({ state: 'available', action: { entry: { kind: 'fluency', challenge: 'words' } } })
    topic.morseFluency!.bests.words = 6
    expect(morseProgressPath(topic)!.nodes.find((node) => node.id === 'tier-words')?.state).toBe('done')
    for (const node of morseProgressPath(topic)!.nodes) {
      if (node.kind !== 'tier') continue
      for (const pip of node.pips) {
        expect(levelsFor(pip.mode).some((level) => level.tier === node.tier)).toBe(true)
        if (pip.action) expect(pip.action.entry).toEqual(modeEntry(topic, pip.mode, pip.action.entry.levelId!))
      }
    }
  })

  it('locks tier pips only when their mode is unavailable, including during acquisition', () => {
    for (const topic of Object.values(modeTopicFixtures())) {
      for (const node of morseProgressPath(topic)!.nodes) {
        if (node.kind !== 'tier') continue
        for (const pip of node.pips) {
          const available = modeAvailability(topic, pip.mode) === 'available'
          expect(pip.state === 'locked').toBe(!available)
          expect(pip.action !== null).toBe(available)
        }
        expect(node.state).toBe(node.pips.every((pip) => pip.state === 'cleared') ? 'done'
          : node.pips.some((pip) => pip.state === 'available') ? 'reached' : 'locked')
      }
    }
  })

  it('keeps a banked learner at the Test regardless of formative tier clears', () => {
    for (const topic of [modeTopicFixtures().banked, modeTopicFixtures().advanced]) {
      const path = morseProgressPath(topic)!
      expect(path.currentNodeId).toBe('test')
      expect(path.nodes.filter((node) => node.state === 'current')).toEqual([
        expect.objectContaining({ id: 'test', kind: 'test', testState: 'banked', action: { kind: 'test', early: false } }),
      ])
      expect(path.nodes.filter((node) => node.kind === 'tier').every((node) => node.state !== 'locked')).toBe(true)
    }
  })

  it('returns no Morse path for unsupported content', () => {
    expect(morseProgressPath({ ...morseTopic(), items: [] })).toBeNull()
    expect(morseProgressPath({ ...morseTopic(), items: [{ prompt: 'Other', answer: 'Content' }] })).toBeNull()
  })
})
