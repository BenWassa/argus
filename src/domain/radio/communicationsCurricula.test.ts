import { describe, expect, it } from 'vitest'
import { seedLibrary } from '../library/catalogSeed'
import { askedItemIds, checkCurriculum, type LessonStep } from '../learning/stages'
import { marinePriorityCommunicationsTopic, marineRoutineCallingTopic } from './radioTopics'
import {
  communicationsCurricula, marineCallingCurriculum, marinePriorityCurriculum,
  natoAlphabetCurriculum, radioNumbersCurriculum,
} from './communicationsCurricula'

const shippedTopics = [
  ...seedLibrary().topics.filter(t => t.id === 'nato-phonetic' || t.id === 'radiotelephony-numbers'),
  marineRoutineCallingTopic(),
  marinePriorityCommunicationsTopic(),
]
const byId = new Map(shippedTopics.map(t => [t.id, t]))
const steps = (id: string): LessonStep[] =>
  communicationsCurricula[id].stages.flatMap(stage => stage.steps)
const item = (topicId: string, itemId: string) => byId.get(topicId)!.items.find(i => i.id === itemId)!

describe('#324 source-bound communications curricula (draft, not registered)', () => {
  it('contains exactly the four owned topics with all original scored item identities', () => {
    expect(Object.keys(communicationsCurricula).sort()).toEqual([
      'marine-vhf-priority-communications', 'marine-vhf-routine-calling',
      'nato-phonetic', 'radiotelephony-numbers',
    ])
    expect(shippedTopics.map(t => t.items.length)).toEqual([26, 13, 4, 9])
    for (const topic of shippedTopics) {
      const authored = communicationsCurricula[topic.id]
      expect(checkCurriculum(authored, new Set(topic.items.map(i => i.id!))), topic.id).toEqual([])
      const covered = new Set(authored.stages.flatMap(stage => stage.steps.flatMap(askedItemIds)))
      expect(covered).toEqual(new Set(topic.items.map(i => i.id)))
    }
  })

  it('does not duplicate generated lesson-N stage IDs or exceed the authored step budget', () => {
    for (const curriculum of Object.values(communicationsCurricula)) {
      expect(curriculum.stages.every(stage => !/^lesson-\d+$/.test(stage.id))).toBe(true)
      for (const stage of curriculum.stages) {
        expect(stage.steps.length).toBeLessThanOrEqual(16)
        expect(stage.steps.some(step => step.kind !== 'show')).toBe(true)
      }
    }
  })

  it('pins every scored answer in choose steps to the existing Test key', () => {
    for (const topic of shippedTopics) {
      for (const step of steps(topic.id)) {
        if (step.kind === 'choose') {
          expect(step.answer, step.id).toBe(item(topic.id, step.itemId).answer)
          expect(step.options.filter(option => option === step.answer)).toHaveLength(1)
          expect(new Set(step.options).size).toBe(step.options.length)
          expect(step.explain.trim().length, step.id).toBeGreaterThan(12)
        }
      }
    }
  })

  it('teaches the NATO 26 in six small packets with separate written-only evidence', () => {
    expect(natoAlphabetCurriculum.stages.map(s => s.title)).toEqual([
      'Letters A–E', 'Letters F–J', 'Letters K–N',
      'Letters O–R', 'Letters S–V', 'Letters W–Z',
    ])
    const showSteps = steps('nato-phonetic').filter(s => s.kind === 'show' && 'itemId' in s)
    expect(showSteps).toHaveLength(26)
    expect(showSteps.find(s => s.kind === 'show' && s.title === 'A')).toMatchObject({ body: 'Alfa' })
    expect(showSteps.find(s => s.kind === 'show' && s.title === 'J')).toMatchObject({ body: 'Juliett' })
    const j = steps('nato-phonetic').find(s => s.id === 'nato-f-j-choose-j')
    expect(j).toMatchObject({ kind: 'choose', answer: 'Juliett' })
    if (j?.kind === 'choose') expect(j.options).toContain('Juliet')
  })

  it('teaches thirteen printed radio tokens, not invented audio proficiency', () => {
    expect(radioNumbersCurriculum.stages).toHaveLength(5)
    const expected = ['ZE-RO', 'WUN', 'TOO', 'TREE', 'FOW-er',
      'FIFE', 'SIX', 'SEV-en', 'AIT', 'NIN-er',
      'DAY-SEE-MAL', 'HUN-dred', 'TOU-SAND']
    expect(byId.get('radiotelephony-numbers')!.items.map(i => i.answer)).toEqual(expected)
    for (let n = 1; n <= 13; n++) {
      expect(steps('radiotelephony-numbers').some(step => step.kind === 'choose' &&
        step.itemId === 'radiotelephony-numbers-item-' + String(n).padStart(2, '0'))).toBe(true)
    }
    expect(steps('radiotelephony-numbers').every(step => step.kind !== 'show' ||
      !step.body.includes('heard correctly'))).toBe(true)
  })

  it('uses RAMN three-times fields, not the RIC-22 up-to-three convention', () => {
    expect(marineCallingCurriculum.stages).toHaveLength(4)
    const source = byId.get('marine-vhf-routine-calling')!
    const orders = steps(source.id).filter(s => s.kind === 'order')
    expect(orders).toHaveLength(3)
    for (const [index, step] of orders.entries()) {
      if (step.kind !== 'order') throw new Error('Missing order')
      const itemIndex = index === 2 ? 3 : index
      expect(step.blocks.join(' → ')).toBe(source.items[itemIndex].answer)
    }
    expect(orders[0]).toMatchObject({ kind: 'order', blocks: [
      'Station called (three times)', 'THIS IS',
      'Type, name and call sign of your vessel (three times)', 'OVER',
    ] })
    expect(steps(source.id).find(s => s.id === 'call-broadcast-choose'))
      .toMatchObject({ kind: 'choose', itemId: source.items[2].id })
  })

  it('keeps marine priority fields exact and decomposes nine-field calls into accessible chunks', () => {
    const source = byId.get('marine-vhf-priority-communications')!
    expect(marinePriorityCurriculum.stages).toHaveLength(6)
    const indexed = Object.fromEntries(steps(source.id).map(s => [s.id, s]))
    for (const [stepId, number] of [
      ['priority-order', 0],
      ['distress-call-order', 4],
      ['urgency-call-order', 6],
    ] as const) {
      const step = indexed[stepId]
      if (step.kind !== 'order') throw new Error('Expected order ' + stepId)
      expect(step.blocks.join(' → ')).toBe(source.items[number].answer)
    }
    for (const [prefix, itemIndex] of [
      ['distress-message', 5], ['safety-call', 7],
    ] as const) {
      const first = indexed[prefix === 'distress-message' ? 'distress-message-preamble' : 'safety-call-first']
      const second = indexed[prefix === 'distress-message' ? 'distress-message-details' : 'safety-call-last']
      if (first.kind !== 'order' || second.kind !== 'order') throw new Error(prefix)
      expect([...first.blocks, ...second.blocks].join(' → ')).toBe(source.items[itemIndex].answer)
      expect(first.blocks.length).toBeLessThanOrEqual(8)
      expect(second.blocks.length).toBeLessThanOrEqual(8)
    }
    expect(indexed['safety-message-frequency'])
      .toMatchObject({ kind: 'choose', answer: source.items[8].answer })
    expect(indexed['distress-call-dsc']).toMatchObject({
      kind: 'complete', answer: 'if a DSC distress alert was sent',
    })
    expect(indexed['urgency-call-condition']).toMatchObject({
      kind: 'complete', answer: 'if a DSC urgency announcement was sent',
    })
  })

  it('uses no audio evidence, operational scenario judgement or new formal Test definitions', () => {
    const file = JSON.stringify(communicationsCurricula)
    expect(file).not.toContain('"audio"')
    expect(file).not.toContain('"microphone"')
    expect(file).not.toContain('"certificateReady"')
    expect(steps('marine-vhf-priority-communications')
      .filter(s => s.kind === 'order').every(s => s.blocks.length <= 8)).toBe(true)
    expect(steps('marine-vhf-routine-calling')
      .filter(s => s.kind === 'choose' || s.kind === 'order' || s.kind === 'complete')
      .every(s => s.explain.length > 15)).toBe(true)
  })
})
