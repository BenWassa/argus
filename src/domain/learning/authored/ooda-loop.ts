import type { Curriculum } from '../stages'

/**
 * Hand-authored lessons for OODA Loop (#296). Every claim restates the topic's
 * own scored answers or its Learn content (`ooda-loop` in catalogSeed.ts); see
 * docs/open/ISSUE_296_AUTHORED_LESSONS_TRACE.md. Stage ids are readable, never
 * `lesson-N`, so they never collide with generated lessons.
 */
const OBSERVE = 'ooda-loop-item-01'
const ORIENT = 'ooda-loop-item-02'
const DECIDE = 'ooda-loop-item-03'
const ACT = 'ooda-loop-item-04'

export const oodaLoopCurriculum: Curriculum = {
  stages: [
    {
      id: 'the-four-stages',
      title: 'The Four Stages',
      steps: [
        { kind: 'show', id: 'stages-show-observe', itemId: OBSERVE, title: 'Observe',
          body: 'Notice unfolding circumstances, outside information, and interaction with the environment.' },
        { kind: 'choose', id: 'stages-choose-observe', itemId: OBSERVE,
          prompt: 'Which stage is noticing what is happening around you?',
          options: ['Observe', 'Decide', 'Act', 'Orient'], answer: 'Observe',
          explain: 'Observe is the stage that takes in circumstances and outside information.' },
        { kind: 'show', id: 'stages-show-orient', itemId: ORIENT, title: 'Orient',
          body: 'Interpret what you observed through analysis and synthesis, shaped by experience, culture, heritage, and new information.' },
        { kind: 'choose', id: 'stages-choose-orient', itemId: ORIENT,
          prompt: 'Which stage makes sense of observations using experience and culture?',
          options: ['Orient', 'Observe', 'Act', 'Decide'], answer: 'Orient',
          explain: 'Orient interprets observations; prior experience, culture and heritage shape it.' },
        { kind: 'show', id: 'stages-show-decide', itemId: DECIDE, title: 'Decide',
          body: 'Select a course of action as a hypothesis to test.' },
        { kind: 'choose', id: 'stages-choose-decide', itemId: DECIDE,
          prompt: 'Which stage selects a course of action as a hypothesis?',
          options: ['Decide', 'Orient', 'Observe', 'Act'], answer: 'Decide',
          explain: 'Decide picks the course of action, treated as a hypothesis to test.' },
        { kind: 'show', id: 'stages-show-act', itemId: ACT, title: 'Act',
          body: 'Carry out the decision as a test. The results feed back into the next round of observation and orientation.' },
        { kind: 'order', id: 'stages-order', itemId: OBSERVE,
          prompt: 'Put the four stages in order.', blocks: ['Observe', 'Orient', 'Decide', 'Act'],
          explain: 'The order is Observe, Orient, Decide, Act.' },
        { kind: 'checkpoint', id: 'stages-checkpoint', itemIds: [OBSERVE, ORIENT, DECIDE, ACT] },
      ],
    },
    {
      id: 'how-they-connect',
      title: 'How They Connect',
      steps: [
        { kind: 'complete', id: 'connect-complete-decision', itemId: DECIDE,
          before: 'A decision is a', after: 'to be tested by acting.',
          options: ['hypothesis', 'guarantee', 'final answer', 'rule'], answer: 'hypothesis',
          explain: 'In this model a decision is a hypothesis, and action is the test.' },
        { kind: 'complete', id: 'connect-complete-act', itemId: ACT,
          before: 'The result of acting is new', after: 'for the next round.',
          options: ['information', 'orders', 'doubt', 'tempo'], answer: 'information',
          explain: 'The result of acting is new information, which feeds back into observation and orientation.' },
        { kind: 'choose', id: 'connect-choose-orientation', itemId: ORIENT,
          prompt: 'Which stage is shaped by prior experience, culture and heritage as well as fresh information?',
          options: ['Orient', 'Observe', 'Act', 'Decide'], answer: 'Orient',
          explain: 'Orientation is shaped by experience, culture and heritage as well as new information.' },
        { kind: 'summary', id: 'connect-summary',
          text: 'The four-arrow circle is a mnemonic for order. In practice feedback runs between all the stages, so they overlap.' },
        { kind: 'checkpoint', id: 'connect-checkpoint', itemIds: [OBSERVE, ORIENT, DECIDE, ACT] },
      ],
    },
  ],
}
