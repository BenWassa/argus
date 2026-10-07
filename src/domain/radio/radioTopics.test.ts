import { describe, expect, it } from 'vitest'
import {
  MARINE_CALLING_ID,
  MARINE_PRIORITY_ID,
  RADIO_PROCEDURE_ID,
  SCORED_PROWORDS,
  marinePriorityCommunicationsTopic,
  marineRoutineCallingTopic,
  radioProcedureTopic,
  radioTopics,
} from './radioTopics'

const rows = (items: { prompt: string; answer: string }[]) =>
  items.map(({ prompt, answer }) => ({ prompt, answer }))

describe('Radio Procedure (RIC-22)', () => {
  const topic = radioProcedureTopic()

  it('scores the 12 Appendix A words then 3 structures, and nothing else', () => {
    expect(topic.items).toHaveLength(15)
    expect(topic.items.slice(0, 12).map((item) => item.prompt)).toEqual([
      'ACKNOWLEDGE', 'AFFIRMATIVE', 'CORRECTION', 'GO AHEAD', 'NEGATIVE', 'OUT',
      'OVER', 'READ BACK', 'ROGER', 'SAY AGAIN', 'STAND BY', 'WILCO',
    ])
    expect(SCORED_PROWORDS).toHaveLength(12)
    expect(topic.items.slice(0, 12).every((item) => !item.choice)).toBe(true)
    expect(topic.items.slice(12).every((item) => item.choice)).toBe(true)
  })

  it('keeps the answers RIC-22 prints for the contrasting pair', () => {
    const byPrompt = Object.fromEntries(topic.items.map((item) => [item.prompt, item.answer]))
    expect(byPrompt.OVER).toBe('My transmission is ended and I expect a response from you.')
    expect(byPrompt.OUT).toBe('Conversation is ended and no response is expected.')
    expect(byPrompt.ROGER).toBe('I have received all of your last transmission.')
  })

  it('keys the three sequences to the RIC-22 order', () => {
    expect(rows(topic.items.slice(12))).toEqual([
      expect.objectContaining({ answer: 'Called station → THIS IS → Calling station → Invitation to reply' }),
      expect.objectContaining({ answer: 'ALL STATIONS → THIS IS → Calling station → Invitation to reply' }),
      expect.objectContaining({ answer: 'Call → Addressee reply → Message → Acknowledgement or ending' }),
    ])
  })

  it('lists no Learn-only word that is also scored', () => {
    const learned = (topic.learn?.sections ?? [])
      .flatMap((section) => section.blocks)
      .flatMap((block) => (block.type === 'definitions' ? block.items.map((entry) => entry.term) : []))
    const scored = new Set(topic.items.map((item) => item.prompt))
    const other = learned.slice(12)
    expect(other).toContain('I SAY AGAIN')
    expect(other.filter((term) => scored.has(term))).toEqual([])
  })
})

describe('Marine Calling (RAMN 2026 §4.1.1)', () => {
  const topic = marineRoutineCallingTopic()

  it('scores exactly the four published structures', () => {
    expect(topic.items).toHaveLength(4)
    expect(topic.items.map((item) => item.answer)).toEqual([
      'Station called (three times) → THIS IS → Type, name and call sign of your vessel (three times) → OVER',
      'ALL STATIONS (three times) → THIS IS → Type, name and call sign of your vessel (three times) → OVER',
      'It proceeds with the message instead of giving the invitation to reply',
      'Originating ship → Date and time → Address → Text → Signature',
    ])
  })
})

describe('Marine Priority Calls (RAMN 2026 §§4.1.2–4.1.4)', () => {
  const topic = marinePriorityCommunicationsTopic()

  it('scores exactly nine items', () => {
    expect(topic.items).toHaveLength(9)
    expect(topic.items[0].answer).toBe('Distress → Urgency → Safety → All other communications')
  })

  it('keys the distress call, message, urgency call and safety call to the published order', () => {
    expect(topic.items[4].answer).toBe(
      'MAYDAY (three times) → THIS IS → Ship name (three times) → Call sign or other identification → MMSI (if a DSC distress alert was sent)',
    )
    expect(topic.items[5].answer.split(' → ')).toEqual([
      'MAYDAY', 'Ship name', 'Call sign or other identification',
      'MMSI (if a DSC distress alert was sent)', 'Position', 'Nature of distress',
      'Assistance needed', 'Other useful information', 'OVER',
    ])
    expect(topic.items[6].answer.split(' → ')[0]).toBe('PAN PAN (three times)')
    expect(topic.items[7].answer.split(' → ').slice(-3)).toEqual([
      'Brief description of the safety message',
      'Channel or frequency for the safety broadcast',
      'OUT',
    ])
  })

  it('asks each signal’s meaning against the same four published meanings', () => {
    const [mayday, panpan, securite] = [topic.items[1], topic.items[2], topic.items[3]]
    expect(mayday.prompt).toBe('What does MAYDAY announce?')
    expect(panpan.prompt).toBe('What does PAN PAN announce?')
    expect(securite.prompt).toBe('What does SÉCURITÉ announce?')
    expect(new Set(mayday.choice!.options)).toEqual(new Set(panpan.choice!.options))
    expect(new Set(mayday.choice!.options)).toEqual(new Set(securite.choice!.options))
    expect(new Set([mayday.answer, panpan.answer, securite.answer]).size).toBe(3)
  })

  it('sends the safety message to the announced working frequency', () => {
    expect(topic.items[8].answer).toBe('On the working frequency announced at the end of the safety call')
  })
})

describe('every radio sequence item', () => {
  const sequences = radioTopics().flatMap((topic) =>
    topic.items.filter((item) => item.answer.includes(' → ')),
  )

  it('has distractors that reorder the key and add or drop nothing', () => {
    expect(sequences).toHaveLength(3 + 3 + 5)
    for (const item of sequences) {
      const key = item.answer.split(' → ')
      const wrong = item.choice!.options.filter((option) => option !== item.answer)
      expect(wrong).toHaveLength(3)
      for (const option of wrong) {
        expect(option.split(' → ').slice().sort(), item.prompt).toEqual(key.slice().sort())
        expect(option).not.toBe(item.answer)
      }
    }
  })

  it('uses ids that follow the topic', () => {
    const ids = [RADIO_PROCEDURE_ID, MARINE_CALLING_ID, MARINE_PRIORITY_ID]
    radioTopics().forEach((topic, index) => {
      expect(topic.id).toBe(ids[index])
      expect(topic.items.every((item, n) => item.id === `${topic.id}-item-${String(n + 1).padStart(2, '0')}`)).toBe(true)
    })
  })
})
