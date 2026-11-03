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
    // #326: non-safety-critical illustration from the shipped service-incident case.
    // These formative checks are not added to the original four-item Test.
    {
      id: 'seeing-vs-interpreting',
      title: 'Seeing vs Interpreting',
      steps: [
        { kind: 'show', id: 'seeing-show-contrast', title: 'Two different jobs',
          body: 'Observe takes in information; Orient interprets it using context and experience. An observed rise in errors does not by itself establish its cause.' },
        { kind: 'choose', id: 'seeing-choose-observe', itemId: OBSERVE,
          prompt: 'A dashboard records that checkout errors rose after a release. Which OODA stage is taking in that information?',
          options: ['Observe', 'Orient', 'Decide', 'Act'], answer: 'Observe',
          explain: 'The error reading is new information being observed; explaining the rise is a separate interpretation.' },
        { kind: 'choose', id: 'seeing-choose-orient', itemId: ORIENT,
          prompt: 'The team interprets the error trend using the architecture and previous incidents. Which stage is this?',
          options: ['Orient', 'Observe', 'Decide', 'Act'], answer: 'Orient',
          explain: 'Orient connects observations to experience and context; it is not merely collecting new measurements.' },
        { kind: 'choose', id: 'seeing-choose-inference', itemId: ORIENT,
          prompt: 'Which statement is an interpretation rather than a direct observation?',
          options: [
            'A dependency change may be causing the errors.',
            'The error-rate chart increased after the release.',
            'Two trace samples were collected after the release.',
            'The release occurred before the first error spike.',
          ], answer: 'A dependency change may be causing the errors.',
          explain: 'A proposed cause is an interpretation to examine, not a fact established by the measurements alone.' },
        { kind: 'checkpoint', id: 'seeing-checkpoint', itemIds: [OBSERVE, ORIENT] },
      ],
    },
    {
      id: 'hypothesis-test-feedback',
      title: 'Test and Re-observe',
      steps: [
        { kind: 'show', id: 'feedback-show-hypothesis', title: 'A decision is not proof',
          body: 'In the shipped service example, the team chooses a limited rollback hypothesis, tests it, then interprets the result. The four named stages are a memory aid; feedback can occur throughout.' },
        { kind: 'choose', id: 'feedback-choose-decide', itemId: DECIDE,
          prompt: 'The team selects one dependency change to test. Which stage is represented?',
          options: ['Decide', 'Observe', 'Orient', 'Act'], answer: 'Decide',
          explain: 'Decide selects a proposed course of action; the selection is a hypothesis, not a proven explanation.' },
        { kind: 'choose', id: 'feedback-choose-act', itemId: ACT,
          prompt: 'The team carries out its selected test. Which stage is represented?',
          options: ['Act', 'Decide', 'Observe', 'Orient'], answer: 'Act',
          explain: 'Act tests the chosen course. Its result becomes information for continuing observation and orientation.' },
        { kind: 'choose', id: 'feedback-choose-return', itemId: OBSERVE,
          prompt: 'Errors fall, but not completely. What does the model say about this new result?',
          options: [
            'It feeds new observation and orientation.',
            'It proves the first explanation was complete.',
            'It ends the need for further observations.',
            'It means the four stages must always run without overlap.',
          ], answer: 'It feeds new observation and orientation.',
          explain: 'Partial improvement is new information. The team re-observes and re-orients rather than treating one action as final proof.' },
        { kind: 'order', id: 'feedback-order-concepts', itemId: OBSERVE,
          prompt: 'Rebuild the four-name mnemonic sequence (not a strict operational algorithm).',
          blocks: ['Observe', 'Orient', 'Decide', 'Act'],
          explain: 'The mnemonic is Observe → Orient → Decide → Act. Boyd’s fuller model has feedback and implicit guidance between stages.' },
        { kind: 'summary', id: 'feedback-summary',
          text: 'You practised separating information from interpretation, choosing from acting, and treating the result as new information. This is conceptual recall, not tested decision-making skill.' },
        { kind: 'checkpoint', id: 'feedback-checkpoint', itemIds: [OBSERVE, ORIENT, DECIDE, ACT] },
      ],
    },
  ],
}
