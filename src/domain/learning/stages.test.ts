import { describe, expect, it } from 'vitest'
import { checkCurriculum, type Curriculum, type LessonStage } from './stages'

const ITEMS = new Set(['roger', 'wilco', 'over', 'out'])

function good(): Curriculum {
  return {
    stages: [
      {
        id: 'agree',
        title: 'Words that agree',
        steps: [
          { kind: 'show', id: 'agree-show-roger', title: 'ROGER', body: 'I have received all of your last transmission.', itemId: 'roger' },
          {
            kind: 'choose', id: 'agree-choose-roger', itemId: 'roger', prompt: 'You heard the whole message. What do you say?',
            options: ['ROGER', 'WILCO', 'OVER', 'OUT'], answer: 'ROGER', explain: 'ROGER means received. WILCO also promises to act on it.',
          },
          {
            kind: 'contrast', id: 'agree-contrast', itemIds: ['roger', 'wilco'], answerItemId: 'wilco',
            prompt: 'Which one promises to comply?', explain: 'WILCO is received, understood and will be complied with.',
          },
          { kind: 'summary', id: 'agree-summary', text: 'ROGER acknowledges; WILCO commits.' },
        ],
      },
      {
        id: 'ending',
        title: 'Ending and turns',
        steps: [
          { kind: 'recall', id: 'ending-recall-over', itemId: 'over' },
          { kind: 'checkpoint', id: 'ending-checkpoint', itemIds: ['over', 'out'] },
        ],
      },
    ],
  }
}

const withStage = (change: (stage: LessonStage) => void): Curriculum => {
  const c = good()
  change(c.stages[0])
  return c
}

describe('checkCurriculum', () => {
  it('accepts a well-formed curriculum that covers every scored item', () => {
    expect(checkCurriculum(good(), ITEMS)).toEqual([])
  })

  it('refuses a curriculum with no stages', () => {
    expect(checkCurriculum({ stages: [] }, new Set())).toContain('A curriculum needs at least one stage.')
  })

  it('refuses malformed or repeated stage and step ids', () => {
    const c = good()
    c.stages[1].id = 'agree'
    c.stages[0].steps[0].id = 'Bad Id'
    c.stages[1].steps[0].id = 'agree-summary'
    const problems = checkCurriculum(c, ITEMS).join('\n')
    expect(problems).toMatch(/repeats a stage id/)
    expect(problems).toMatch(/needs an id of lower-case/)
    expect(problems).toMatch(/repeats a step id/)
  })

  it('refuses a stage that never asks the learner anything', () => {
    const c = withStage((stage) => { stage.steps = [stage.steps[0], stage.steps[3]] })
    expect(checkCurriculum(c, ITEMS, { requireFullCoverage: false }).join('\n')).toMatch(/never asks the learner anything/)
  })

  it('refuses a step that refers to an item the topic does not have', () => {
    const c = withStage((stage) => { (stage.steps[1] as { itemId: string }).itemId = 'nope' })
    expect(checkCurriculum(c, ITEMS).join('\n')).toMatch(/"nope", which the topic does not have/)
  })

  it('needs exactly one option equal to the answer, and no blank or repeated options', () => {
    const none = withStage((stage) => { (stage.steps[1] as { answer: string }).answer = 'MAYDAY' })
    expect(checkCurriculum(none, ITEMS).join('\n')).toMatch(/exactly one option equal to its answer/)
    const repeated = withStage((stage) => { (stage.steps[1] as { options: string[] }).options = ['ROGER', 'ROGER', 'OVER'] })
    expect(checkCurriculum(repeated, ITEMS).join('\n')).toMatch(/blank or repeated option/)
    const few = withStage((stage) => { (stage.steps[1] as { options: string[] }).options = ['ROGER'] })
    expect(checkCurriculum(few, ITEMS).join('\n')).toMatch(/2-6 options/)
  })

  it('needs a one-line explanation for every step that can be answered wrong', () => {
    const c = withStage((stage) => { (stage.steps[1] as { explain: string }).explain = '  ' })
    expect(checkCurriculum(c, ITEMS).join('\n')).toMatch(/needs a one-line explanation/)
  })

  it('needs a contrast answer to be one of its items, and 2-3 items', () => {
    const c = withStage((stage) => { (stage.steps[2] as { answerItemId: string }).answerItemId = 'over' })
    expect(checkCurriculum(c, ITEMS).join('\n')).toMatch(/answer that is not one of its items/)
    const one = withStage((stage) => { (stage.steps[2] as { itemIds: string[] }).itemIds = ['roger'] })
    expect(checkCurriculum(one, ITEMS).join('\n')).toMatch(/contrasts 2-3 items/)
  })

  it('needs a text equivalent when a shown item is a figure', () => {
    const c = good()
    expect(checkCurriculum(c, ITEMS, { figureItemIds: new Set(['roger']) }).join('\n')).toMatch(/needs altText/)
    ;(c.stages[0].steps[0] as { altText?: string }).altText = 'The proword ROGER'
    expect(checkCurriculum(c, ITEMS, { figureItemIds: new Set(['roger']) })).toEqual([])
  })

  it('checks order and complete steps', () => {
    const c = withStage((stage) => {
      stage.steps.push({ kind: 'order', id: 'agree-order', itemId: 'roger', prompt: 'Order the call.', blocks: ['A'], explain: 'x' })
      stage.steps.push({ kind: 'complete', id: 'agree-complete', itemId: 'roger', before: '', after: '', options: ['a', 'b'], answer: 'a', explain: 'x' })
    })
    const problems = checkCurriculum(c, ITEMS).join('\n')
    expect(problems).toMatch(/needs 2-8 blocks/)
    expect(problems).toMatch(/needs text around the gap/)
  })

  it('reports scored items that no step asks about, unless coverage is waived', () => {
    const c = good()
    c.stages[1].steps = [{ kind: 'recall', id: 'ending-recall-over', itemId: 'over' }]
    expect(checkCurriculum(c, ITEMS).join('\n')).toMatch(/never asked about: out/)
    expect(checkCurriculum(c, ITEMS, { requireFullCoverage: false })).toEqual([])
  })

  it('does not count a show step as asking about an item', () => {
    const c = good()
    c.stages[1].steps = [
      { kind: 'show', id: 'ending-show-out', title: 'OUT', body: 'Conversation ended.', itemId: 'out' },
      { kind: 'recall', id: 'ending-recall-over', itemId: 'over' },
    ]
    expect(checkCurriculum(c, ITEMS).join('\n')).toMatch(/never asked about: out/)
  })
})
