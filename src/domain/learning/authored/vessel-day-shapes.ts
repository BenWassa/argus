import type { Curriculum } from '../stages'

/**
 * #322 authored curriculum, registered in generatedCurriculum.ts.
 * Source boundary: the five existing vessel-day-shapes items and COLREGs
 * Rules 26, 27 and 30 cited in the #322 plan. No new scored content.
 * Shows carry geometry-only altText; choose/checkpoint figures use the item's
 * existing geometry-only stimulus.alt. Contrasts are two-option chooses because
 * a contrast step shows item prompts, not figures, and these items are pictures.
 */
const ANCHOR = 'vessel-day-shapes-item-01'
const TWO = 'vessel-day-shapes-item-02'
const DIAMOND = 'vessel-day-shapes-item-03'
const THREE = 'vessel-day-shapes-item-04'
const CONES = 'vessel-day-shapes-item-05'

const anchor = 'Vessel at anchor'
const two = 'Vessel not under command'
const diamond = 'Vessel restricted in her ability to manoeuvre'
const three = 'Vessel aground'
const cones = 'Vessel engaged in fishing (trawling or other fishing)'

const anchorExplain = 'Only one round ball appears. Two mean not under command; three mean aground.'
const twoExplain = 'Two round balls are stacked. A third round ball would mean aground.'
const diamondExplain = 'A diamond sits between the two balls. Aground has three round balls.'
const threeExplain = 'All three shapes are round balls. Restricted ability to manoeuvre has a diamond in the middle.'
const conesExplain = 'Two cones meet point to point. The shape covers trawling and other fishing alike.'

export const vesselDayShapesCurriculum: Curriculum = {
  stages: [
    {
      id: 'shape-ball-count', title: 'Count the Balls',
      steps: [
        { kind: 'show', id: 'shapes-count-intro', itemId: ANCHOR, title: 'One Ball',
          body: `${anchor}: one black ball.`, altText: 'One black round ball.' },
        { kind: 'show', id: 'shapes-count-intro-two', itemId: TWO, title: 'Two Balls',
          body: `${two}: two black balls in a vertical line.`, altText: 'Two black round balls in a vertical line.' },
        { kind: 'show', id: 'shapes-count-intro-three', itemId: THREE, title: 'Three Balls',
          body: `${three}: three black balls in a vertical line.`, altText: 'Three black round balls in a vertical line.' },
        { kind: 'choose', id: 'shapes-count-one', itemId: ANCHOR,
          prompt: 'Which vessel state does this display?', options: [anchor, two, three, diamond],
          answer: anchor, explain: anchorExplain },
        { kind: 'choose', id: 'shapes-count-two', itemId: TWO,
          prompt: 'Which vessel state does this display?', options: [two, anchor, three, diamond],
          answer: two, explain: twoExplain },
        { kind: 'choose', id: 'shapes-count-three', itemId: THREE,
          prompt: 'Which vessel state does this display?', options: [three, two, diamond, anchor],
          answer: three, explain: threeExplain },
        { kind: 'summary', id: 'shapes-count-summary',
          text: `One ball: ${anchor}. Two balls: ${two}. Three balls: ${three}.` },
        { kind: 'checkpoint', id: 'shapes-count-check', itemIds: [ANCHOR, TWO, THREE] },
      ],
    },
    {
      id: 'shape-middle-diamond', title: 'Check the Middle',
      steps: [
        { kind: 'show', id: 'shapes-middle-show', itemId: DIAMOND, title: 'Ball, Diamond, Ball',
          body: `${diamond}: check the diamond between the two balls, rather than a third round ball.`,
          altText: 'A black ball above a black diamond above a black ball, in a vertical line.' },
        { kind: 'choose', id: 'shapes-middle-choose', itemId: DIAMOND,
          prompt: 'Which vessel state does this display?', options: [diamond, three, two, cones],
          answer: diamond, explain: diamondExplain },
        { kind: 'choose', id: 'shapes-middle-contrast', itemId: THREE,
          prompt: 'Check the middle shape. Which vessel state does this display?', options: [three, diamond],
          answer: three, explain: threeExplain },
        { kind: 'summary', id: 'shapes-middle-summary', text: `The middle diamond identifies ${diamond}.` },
        { kind: 'checkpoint', id: 'shapes-middle-check', itemIds: [DIAMOND, THREE] },
      ],
    },
    {
      id: 'shape-fishing-cones', title: 'Points Together',
      steps: [
        { kind: 'show', id: 'shapes-cone-show', itemId: CONES, title: 'Two Cones',
          body: `${cones}: two cones meet at their points; neither is a ball. The shape does not separate fishing types.`,
          altText: 'Two black cones in a vertical line with their points touching.' },
        { kind: 'choose', id: 'shapes-cone-choose', itemId: CONES,
          prompt: 'Which vessel state does this display?', options: [cones, diamond, two, anchor],
          answer: cones, explain: conesExplain },
        { kind: 'choose', id: 'shapes-cone-contrast', itemId: DIAMOND,
          prompt: 'Cones or a diamond? Which vessel state does this display?', options: [diamond, cones],
          answer: diamond, explain: diamondExplain },
        { kind: 'summary', id: 'shapes-cone-summary', text: 'The day shape does not separate trawling from other fishing.' },
        { kind: 'checkpoint', id: 'shapes-cone-check', itemIds: [CONES, DIAMOND] },
      ],
    },
    {
      id: 'shape-mixed-signals', title: 'Mix the Five Displays',
      steps: [
        { kind: 'show', id: 'shapes-mixed-teach', title: 'Read the Arrangement',
          body: 'Count the balls; check the middle shape; look for two cones meeting at their points.' },
        { kind: 'summary', id: 'shapes-mixed-summary',
          text: 'Now review all five displays. The separate Test is optional.' },
        { kind: 'checkpoint', id: 'shapes-mixed-check', itemIds: [ANCHOR, TWO, DIAMOND, THREE, CONES] },
      ],
    },
  ],
}
