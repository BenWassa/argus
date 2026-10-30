import type { Curriculum } from '../stages'

/** Source boundary: reciprocalLearn and the A2 bank in navigation/bearingTopics.ts and bearingBanks.ts. */
export const reciprocalBearingsCurriculum: Curriculum = {
  stages: [
    {
      id: 'adding-a-half-turn',
      title: 'Adding a Half Turn',
      steps: [
        {
          kind: 'show', id: 'half-turn-rule', itemId: 'reciprocal-bearings-item-01',
          title: 'The Opposite Way',
          body: 'A reciprocal, or back bearing, points the opposite way along the same line. Add 180°: 037°T becomes 217°T. Keep the same north reference.',
        },
        {
          kind: 'choose', id: 'half-turn-037', itemId: 'reciprocal-bearings-item-01',
          prompt: 'The bearing from A to B is 037°T. What is the bearing from B back to A?',
          options: ['127°T', '217°T', '323°T'], answer: '217°T',
          explain: 'A 90° turn or a mirror reading does not reverse the line.',
        },
        {
          kind: 'choose', id: 'half-turn-112', itemId: 'reciprocal-bearings-item-02',
          prompt: 'The forward bearing is 112°M. What is its back bearing?',
          options: ['248°M', '202°M', '292°M'], answer: '292°M',
          explain: 'Mirroring or adding only 90° misses the opposite direction.',
        },
        {
          kind: 'complete', id: 'half-turn-146', itemId: 'reciprocal-bearings-item-03',
          before: 'The reciprocal of 146°G is ', after: '.',
          options: ['326°G', '236°G', '214°G'], answer: '326°G',
          explain: 'Use a 180° turn, rather than a 90° turn or mirror reading.',
        },
        { kind: 'summary', id: 'half-turn-summary', text: 'Add 180° to point back along the same line, keeping the same north.' },
        {
          kind: 'checkpoint', id: 'half-turn-checkpoint',
          itemIds: ['reciprocal-bearings-item-01', 'reciprocal-bearings-item-02', 'reciprocal-bearings-item-03'],
        },
      ],
    },
    {
      id: 'wrapping-the-turn',
      title: 'Wrapping the Turn',
      steps: [
        {
          kind: 'show', id: 'wrap-rule', itemId: 'reciprocal-bearings-item-04',
          title: 'Back Into the Circle',
          body: '203° + 180° = 383°. At 360° or more, subtract 360° to return to 000°–359°. The back bearing is 023°T.',
        },
        {
          kind: 'choose', id: 'wrap-203', itemId: 'reciprocal-bearings-item-04',
          prompt: 'The forward bearing is 203°T. What is its back bearing?',
          options: ['383°T', '157°T', '023°T'], answer: '023°T',
          explain: 'Leaving 383° unwrapped or mirroring 203° misses the back bearing.',
        },
        {
          kind: 'complete', id: 'wrap-264', itemId: 'reciprocal-bearings-item-05',
          before: '264°M + 180° gives 444°. After subtracting 360°, the back bearing is ', after: '.',
          options: ['444°M', '084°M', '096°M'], answer: '084°M',
          explain: 'Subtract 360° from 444°; 096° is a mirror reading.',
        },
        {
          kind: 'choose', id: 'wrap-350', itemId: 'reciprocal-bearings-item-06',
          prompt: 'The forward bearing is 350°T. What is its back bearing?',
          options: ['170°T', '530°T', '010°T'], answer: '170°T',
          explain: 'Leaving 530° unwrapped or mirroring 350° misses the opposite direction.',
        },
        {
          kind: 'show', id: 'wrap-trace-350', itemId: 'reciprocal-bearings-item-06',
          title: 'Across 000°',
          body: '350° + 180° = 530°. Subtract 360°: the back bearing is 170°T.',
        },
        { kind: 'summary', id: 'wrap-summary', text: 'Add 180°, then subtract 360° if the result is 360° or more.' },
        {
          kind: 'checkpoint', id: 'wrap-checkpoint',
          itemIds: ['reciprocal-bearings-item-04', 'reciprocal-bearings-item-05', 'reciprocal-bearings-item-06'],
        },
      ],
    },
    {
      id: 'checking-the-return',
      title: 'Checking the Return',
      steps: [
        {
          kind: 'choose', id: 'return-183', itemId: 'reciprocal-bearings-item-07',
          prompt: 'The forward bearing is 183°G. What is its back bearing?',
          options: ['363°G', '003°G', '177°G'], answer: '003°G',
          explain: '363° still needs wrapping; 177° mirrors the forward bearing.',
        },
        {
          kind: 'show', id: 'return-trace-183', itemId: 'reciprocal-bearings-item-07',
          title: 'Keep Three Digits',
          body: '183° + 180° = 363°. Subtract 360° to write 003°G.',
        },
        {
          kind: 'choose', id: 'return-357', itemId: 'reciprocal-bearings-item-08',
          prompt: 'The forward bearing is 357°M. What is its back bearing?',
          options: ['003°M', '537°M', '177°M'], answer: '177°M',
          explain: '003° mirrors the ray; 537° has not been wrapped.',
        },
        {
          kind: 'show', id: 'return-check-rule', itemId: 'reciprocal-bearings-item-09',
          title: 'Take It Back Again',
          body: 'Take the reciprocal of your answer. You should get the bearing you started with. 000°T becomes 180°T; 180°T becomes 000°T.',
        },
        {
          kind: 'complete', id: 'return-000', itemId: 'reciprocal-bearings-item-09',
          before: 'From 000°T, the back bearing is ', after: '.',
          options: ['360°T', '000°T', '180°T'], answer: '180°T',
          explain: 'A full turn points north again; the back bearing needs half a turn.',
        },
        { kind: 'summary', id: 'return-summary', text: 'The reciprocal of a reciprocal returns to the starting bearing.' },
        {
          kind: 'checkpoint', id: 'return-checkpoint',
          itemIds: ['reciprocal-bearings-item-07', 'reciprocal-bearings-item-08', 'reciprocal-bearings-item-09'],
        },
      ],
    },
    {
      id: 'reversing-the-ray',
      title: 'Reversing the Ray',
      steps: [
        {
          kind: 'choose', id: 'reverse-225', itemId: 'reciprocal-bearings-item-10',
          prompt: 'The forward bearing is 225°M. What is its back bearing?',
          options: ['405°M', '045°M', '135°M'], answer: '045°M',
          explain: '405° needs wrapping; 135° is a mirror reading.',
        },
        {
          kind: 'show', id: 'reverse-shortcut', itemId: 'reciprocal-bearings-item-10',
          title: 'The Shortcut',
          body: 'Below 180°, add 180°; otherwise subtract 180°. For 225°M, subtract: 225° − 180° = 045°M.',
        },
        {
          kind: 'show', id: 'reverse-dial-071', itemId: 'reciprocal-bearings-item-11',
          title: 'The Other End',
          body: 'The ray is 071°T from A to B. A back bearing points the opposite way along the same line.',
          altText: 'A compass rose drawn against true north with one ray from the centre, labelled 071°T. The ray runs from A at the centre toward B.',
        },
        {
          kind: 'complete', id: 'reverse-071', itemId: 'reciprocal-bearings-item-11',
          before: 'The ray shows 071°T from A to B. The bearing from B back to A is ', after: '.',
          options: ['289°T', '161°T', '251°T'], answer: '251°T',
          explain: 'A mirror reading or 90° turn does not reach the opposite end.',
        },
        {
          kind: 'complete', id: 'reverse-295', itemId: 'reciprocal-bearings-item-12',
          before: 'The ray shows 295°G from A to B. The bearing from B back to A is ', after: '.',
          options: ['115°G', '065°G', '025°G'], answer: '115°G',
          explain: '065° mirrors the ray; adding 90° gives a quarter turn.',
        },
        {
          kind: 'show', id: 'reverse-dial-295', itemId: 'reciprocal-bearings-item-12',
          title: 'Keep the Same North',
          body: '295° − 180° = 115°G. A reciprocal keeps its north reference. Converting between norths is a separate step.',
          altText: 'A compass rose drawn against grid north with one ray from the centre, labelled 295°G. The ray runs from A at the centre toward B.',
        },
        { kind: 'summary', id: 'reverse-summary', text: 'Reverse the line by 180° and keep the same T, M or G reference.' },
        {
          kind: 'checkpoint', id: 'reverse-checkpoint',
          itemIds: ['reciprocal-bearings-item-10', 'reciprocal-bearings-item-11', 'reciprocal-bearings-item-12'],
        },
      ],
    },
  ],
}
