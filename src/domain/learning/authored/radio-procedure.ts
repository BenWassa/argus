import type { Curriculum, LessonStep } from '../stages'
import { radioProcedureTopic } from '../../radio/radioTopics'

/**
 * #296 authored curriculum for Radio Procedure (#150). NOT registered until the
 * owner/reviewer approval is recorded (see ISSUE_296_AUTHORED_LESSONS.md).
 *
 * Source boundary: the fifteen shipped radio-procedure items (twelve RIC-22
 * Appendix A words and three published call orders) and the topic's own Learn
 * text (call-order table, "never REPEAT" bullet, limitations). Meanings and
 * orders are read from the shipped items at module load, so they cannot drift
 * from the scored bank. Options are always other shipped answers. No marine,
 * aeronautical or operating guidance is added.
 *
 * A call order is asked once, by building it with an `order` step; the item's
 * option-choice form is what the optional Test asks.
 */
const items = radioProcedureTopic().items

function word(term: string) {
  const found = items.find((candidate) => candidate.prompt === term)
  if (!found?.id) throw new Error(`Missing radio word ${term}`)
  return { id: found.id, term, meaning: found.answer }
}

function sequence(index: number) {
  const found = items.find((candidate) => candidate.id === `radio-procedure-item-${String(index).padStart(2, '0')}`)
  if (!found?.id) throw new Error(`Missing radio sequence ${index}`)
  return { id: found.id, prompt: found.prompt, answer: found.answer, blocks: found.answer.split(' → ') }
}

/** A show of one word, then a four-option choose on its meaning (answer first). */
function teach(term: string, distractors: string[], explain: string): LessonStep[] {
  const scored = word(term)
  const slug = term.toLowerCase().replace(/ /g, '-')
  return [
    { id: `radio-show-${slug}`, kind: 'show', itemId: scored.id, title: term, body: scored.meaning },
    {
      id: `radio-choose-${slug}`, kind: 'choose', itemId: scored.id,
      prompt: `What does ${term} mean?`, answer: scored.meaning,
      options: [scored.meaning, ...distractors.map((other) => word(other).meaning)], explain,
    },
  ]
}

/** Pick the word for a meaning; the tiles are the words themselves. */
function contrast(id: string, terms: string[], answer: string, explain: string): LessonStep {
  return {
    id, kind: 'contrast', itemIds: terms.map((term) => word(term).id),
    prompt: word(answer).meaning, answerItemId: word(answer).id, explain,
  }
}

function build(id: string, index: number, title: string, explain: string): LessonStep[] {
  const scored = sequence(index)
  return [
    { id: `radio-show-${id}`, kind: 'show', itemId: scored.id, title, body: scored.answer },
    { id: `radio-order-${id}`, kind: 'order', itemId: scored.id, prompt: scored.prompt, blocks: scored.blocks, explain },
  ]
}

const allItemIds = items.map((scored) => scored.id!)

export const radioProcedureCurriculum: Curriculum = {
  stages: [
    {
      id: 'words-that-agree', title: 'Words That Agree',
      steps: [
        ...teach('ROGER', ['WILCO', 'ACKNOWLEDGE', 'AFFIRMATIVE'],
          'ROGER says all of the last transmission was received. WILCO adds that your instructions are understood and will be complied with.'),
        ...teach('WILCO', ['ROGER', 'ACKNOWLEDGE', 'AFFIRMATIVE'],
          'WILCO covers receipt, understanding and compliance with your instructions. ROGER covers receipt of the last transmission.'),
        ...teach('ACKNOWLEDGE', ['ROGER', 'WILCO', 'AFFIRMATIVE'],
          'ACKNOWLEDGE asks the other station to let you know it has received and understood the message.'),
        ...teach('AFFIRMATIVE', ['ROGER', 'WILCO', 'ACKNOWLEDGE'],
          'AFFIRMATIVE means yes, or permission granted. NEGATIVE means no, or that is not correct, or I do not agree.'),
        ...teach('NEGATIVE', ['ROGER', 'WILCO', 'ACKNOWLEDGE'],
          'NEGATIVE means no, or that is not correct, or I do not agree. AFFIRMATIVE means yes, or permission granted.'),
        contrast('radio-contrast-agree', ['ROGER', 'WILCO', 'ACKNOWLEDGE'], 'WILCO',
          'WILCO includes compliance. ROGER states receipt; ACKNOWLEDGE asks for receipt and understanding to be confirmed.'),
        {
          id: 'radio-agree-summary', kind: 'summary',
          text: 'ROGER: received. WILCO: will comply. ACKNOWLEDGE: confirm receipt and understanding. AFFIRMATIVE: yes. NEGATIVE: no.',
        },
        { id: 'radio-agree-check', kind: 'checkpoint', itemIds: ['ROGER', 'WILCO', 'ACKNOWLEDGE', 'AFFIRMATIVE', 'NEGATIVE'].map((term) => word(term).id) },
      ],
    },
    {
      id: 'ending-and-turns', title: 'Ending and Turns',
      steps: [
        ...teach('OVER', ['OUT', 'GO AHEAD', 'STAND BY'],
          'OVER ends my transmission and expects a response from you. OUT ends the conversation and expects none.'),
        ...teach('OUT', ['OVER', 'GO AHEAD', 'STAND BY'],
          'OUT ends the conversation and no response is expected. OVER ends my transmission but expects a response.'),
        ...teach('GO AHEAD', ['OVER', 'OUT', 'STAND BY'],
          'GO AHEAD tells the other station to proceed with its message.'),
        ...teach('STAND BY', ['OVER', 'OUT', 'GO AHEAD'],
          'STAND BY means I must pause for a few seconds or minutes; wait and I will call you.'),
        contrast('radio-contrast-ending', ['OVER', 'OUT'], 'OVER',
          'OVER expects a response from you; OUT expects none.'),
        {
          id: 'radio-ending-summary', kind: 'summary',
          text: 'OVER: I expect a response. OUT: none expected. GO AHEAD: proceed. STAND BY: wait for my call.',
        },
        { id: 'radio-ending-check', kind: 'checkpoint', itemIds: ['OVER', 'OUT', 'GO AHEAD', 'STAND BY'].map((term) => word(term).id) },
      ],
    },
    {
      id: 'fixing-mistakes', title: 'Fixing Mistakes',
      steps: [
        ...teach('SAY AGAIN', ['READ BACK', 'CORRECTION', 'ACKNOWLEDGE'],
          'SAY AGAIN asks for the transmission to be sent again, in whole or the part named. READ BACK asks for the message back exactly as received.'),
        ...teach('READ BACK', ['SAY AGAIN', 'CORRECTION', 'ACKNOWLEDGE'],
          'READ BACK asks for all or the specified part of the message to be repeated back exactly as received. SAY AGAIN asks for it to be sent again.'),
        ...teach('CORRECTION', ['SAY AGAIN', 'READ BACK', 'ACKNOWLEDGE'],
          'CORRECTION says an error was made in this transmission and the correct version follows.'),
        {
          id: 'radio-repeat-show', kind: 'show', title: 'Never Say Repeat',
          body: 'Use SAY AGAIN or READ BACK, never “REPEAT”.',
        },
        contrast('radio-contrast-fixing', ['SAY AGAIN', 'READ BACK'], 'READ BACK',
          'READ BACK asks for the message back exactly as received; SAY AGAIN asks for it to be sent again.'),
        {
          id: 'radio-fixing-summary', kind: 'summary',
          text: 'SAY AGAIN: send it again. READ BACK: return it exactly as received. CORRECTION: an error was made.',
        },
        { id: 'radio-fixing-check', kind: 'checkpoint', itemIds: ['SAY AGAIN', 'READ BACK', 'CORRECTION'].map((term) => word(term).id) },
      ],
    },
    {
      id: 'call-order', title: 'Call Order',
      steps: [
        ...build('one-station', 13, 'One Station',
          'The called station is always named first, then THIS IS, then the calling station, then the invitation to reply.'),
        ...build('all-stations', 14, 'All Stations',
          'ALL STATIONS is named first, then THIS IS, then the calling station, then the invitation to reply.'),
        ...build('message-handling', 15, 'Message Handling',
          'Message handling runs: call, addressee reply, message, then acknowledgement or ending.'),
        {
          id: 'radio-call-summary', kind: 'summary',
          text: 'Name who you call first, then THIS IS, then yourself, then invite a reply.',
        },
        { id: 'radio-call-check', kind: 'checkpoint', itemIds: [13, 14, 15].map((index) => sequence(index).id) },
      ],
    },
    {
      id: 'putting-it-together', title: 'Putting It Together',
      steps: [
        {
          id: 'radio-together-show', kind: 'show', title: 'Recall Only',
          body: 'Not radio training, an operator certificate or permission to transmit.',
        },
        contrast('radio-contrast-together-ending', ['OVER', 'OUT'], 'OUT',
          'OUT expects no response; OVER expects a response from you.'),
        contrast('radio-contrast-together-fixing', ['SAY AGAIN', 'READ BACK'], 'SAY AGAIN',
          'SAY AGAIN asks for it to be sent again; READ BACK asks for it back exactly as received.'),
        {
          id: 'radio-together-summary', kind: 'summary',
          text: 'Twelve RIC-22 words and three call orders, for recall only.',
        },
        { id: 'radio-together-check', kind: 'checkpoint', itemIds: allItemIds },
      ],
    },
  ],
}
