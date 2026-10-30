import type { Curriculum } from '../stages'

/** Source boundary: wholeCircleLearn and the A1 banks in navigation/bearingTopics.ts and bearingBanks.ts. */
export const wholeCircleBearingsCurriculum: Curriculum = {
  stages: [
    {
      id: 'reading-the-dial',
      title: 'Reading the Dial',
      steps: [
        {
          kind: 'show', id: 'dial-clockwise', itemId: 'whole-circle-bearings-item-01',
          title: 'Clockwise From North',
          body: 'Count clockwise from true north to the ray: 037°T. Use three digits. T means true north throughout this topic.',
          altText: 'A compass rose with true north at the top and one ray toward the north-east, at 037°T.',
        },
        {
          kind: 'choose', id: 'dial-read-037', itemId: 'whole-circle-bearings-item-01',
          prompt: 'Which bearing does the ray show, measured clockwise from true north?',
          options: ['323°T', '037°T', '217°T', '053°T'], answer: '037°T',
          explain: 'Counting anticlockwise or starting from east changes the angle.',
        },
        {
          kind: 'show', id: 'dial-quadrants', itemId: 'whole-circle-bearings-item-02',
          title: 'Check the Quadrant',
          body: 'East is 090°, south 180°, west 270°. Check the quadrant before reading the angle; count clockwise from north.',
          altText: 'A compass rose with true north at the top, dotted quadrant lines, and one ray between east and south, at 128°T.',
        },
        {
          kind: 'choose', id: 'dial-read-128', itemId: 'whole-circle-bearings-item-02',
          prompt: 'Read this ray clockwise from true north. Which bearing is between east and south?',
          options: ['232°T', '308°T', '128°T', '322°T'], answer: '128°T',
          explain: 'A reading in another quadrant starts from the wrong direction.',
        },
        {
          kind: 'choose', id: 'dial-read-205', itemId: 'whole-circle-bearings-item-03',
          prompt: 'Which true bearing does this ray between south and west show?',
          options: ['205°T', '155°T', '025°T', '245°T'], answer: '205°T',
          explain: 'Counting anticlockwise puts this ray in the wrong quadrant.',
        },
        { kind: 'summary', id: 'dial-summary', text: 'Read clockwise from true north, then check the quadrant.' },
        {
          kind: 'checkpoint', id: 'dial-checkpoint',
          itemIds: ['whole-circle-bearings-item-01', 'whole-circle-bearings-item-02', 'whole-circle-bearings-item-03'],
        },
      ],
    },
    {
      id: 'close-to-north',
      title: 'Close to North',
      steps: [
        {
          kind: 'choose', id: 'north-read-291', itemId: 'whole-circle-bearings-item-04',
          prompt: 'Which true bearing does this ray between west and north show?',
          options: ['069°T', '111°T', '159°T', '291°T'], answer: '291°T',
          explain: 'Counting anticlockwise gives 069°, on the other side of north.',
        },
        {
          kind: 'show', id: 'north-east-side', itemId: 'whole-circle-bearings-item-05',
          title: 'Just East of North',
          body: '005° is just east of north. Use three digits: 005°. A full turn, 360°, is written 000°.',
          altText: 'A compass rose with true north at the top and one ray just to its right, at 005°T.',
        },
        {
          kind: 'choose', id: 'north-read-005', itemId: 'whole-circle-bearings-item-05',
          prompt: 'Which true bearing does the ray just east of north show?',
          options: ['355°T', '185°T', '005°T', '085°T'], answer: '005°T',
          explain: '355° is just west of north; this ray is just east.',
        },
        {
          kind: 'choose', id: 'north-read-355', itemId: 'whole-circle-bearings-item-06',
          prompt: 'Which true bearing does the ray just west of north show?',
          options: ['355°T', '005°T', '175°T', '095°T'], answer: '355°T',
          explain: '005° is just east of north; this ray is just west.',
        },
        {
          kind: 'show', id: 'north-west-side', itemId: 'whole-circle-bearings-item-06',
          title: 'Either Side of North',
          body: '355° is just west of north. 005° and 355° sit either side of north, 10° apart.',
          altText: 'A compass rose with true north at the top and one ray just to its left, at 355°T.',
        },
        { kind: 'summary', id: 'north-summary', text: '005° is just east of north; 355° is just west.' },
        {
          kind: 'checkpoint', id: 'north-checkpoint',
          itemIds: ['whole-circle-bearings-item-04', 'whole-circle-bearings-item-05', 'whole-circle-bearings-item-06'],
        },
      ],
    },
    {
      id: 'finding-the-ray',
      title: 'Finding the Ray',
      steps: [
        {
          kind: 'complete', id: 'ray-find-072', itemId: 'whole-circle-bearings-item-07',
          before: 'Count clockwise from true north. The ray at 072°T is ', after: '.',
          options: ['Ray E', 'Ray A', 'Ray H', 'Ray L'], answer: 'Ray A',
          explain: 'Counting anticlockwise selects a ray on the wrong side of north.',
        },
        {
          kind: 'show', id: 'ray-trace-072', itemId: 'whole-circle-bearings-item-07',
          title: 'From Bearing to Ray',
          body: '072°T is between north and east. Count clockwise from true north to Ray A.',
          altText: 'A compass rose with true north at the top and four rays: A at 072°, E at 288°, H at 252°, and L at 018°.',
        },
        {
          kind: 'complete', id: 'ray-find-163', itemId: 'whole-circle-bearings-item-08',
          before: 'The ray at 163°T, between east and south, is ', after: '.',
          options: ['Ray F', 'Ray J', 'Ray M', 'Ray B'], answer: 'Ray B',
          explain: 'Counting anticlockwise from north selects Ray F.',
        },
        {
          kind: 'complete', id: 'ray-find-250', itemId: 'whole-circle-bearings-item-09',
          before: 'The ray at 250°T, between south and west, is ', after: '.',
          options: ['Ray C', 'Ray G', 'Ray K', 'Ray A'], answer: 'Ray C',
          explain: 'Starting from east or counting anticlockwise selects another ray.',
        },
        { kind: 'summary', id: 'ray-summary', text: 'Find the quadrant, then count clockwise from true north to the ray.' },
        {
          kind: 'checkpoint', id: 'ray-checkpoint',
          itemIds: ['whole-circle-bearings-item-07', 'whole-circle-bearings-item-08', 'whole-circle-bearings-item-09'],
        },
      ],
    },
    {
      id: 'checking-the-quadrant',
      title: 'Checking the Quadrant',
      steps: [
        {
          kind: 'complete', id: 'quadrant-find-344', itemId: 'whole-circle-bearings-item-10',
          before: 'The ray at 344°T, between west and north, is ', after: '.',
          options: ['Ray H', 'Ray L', 'Ray D', 'Ray B'], answer: 'Ray D',
          explain: 'Counting anticlockwise selects Ray H, east of north.',
        },
        {
          kind: 'show', id: 'quadrant-trace-344', itemId: 'whole-circle-bearings-item-10',
          title: 'West of North',
          body: '344°T is between 270° and 359°, in the north-west quadrant. Ray D is on that side of north.',
          altText: 'A compass rose with true north at the top and four rays: D at 344°, H at 016°, L at 164°, and B at 106°.',
        },
        {
          kind: 'complete', id: 'quadrant-find-135', itemId: 'whole-circle-bearings-item-11',
          before: 'The ray at 135°T, between east and south, is ', after: '.',
          options: ['Ray J', 'Ray E', 'Ray M', 'Ray C'], answer: 'Ray E',
          explain: 'Counting anticlockwise selects Ray J in the south-west quadrant.',
        },
        {
          kind: 'complete', id: 'quadrant-find-270', itemId: 'whole-circle-bearings-item-12',
          before: 'The ray at 270°T, due west, is ', after: '.',
          options: ['Ray K', 'Ray A', 'Ray D', 'Ray F'], answer: 'Ray F',
          explain: 'Counting anticlockwise selects Ray K, due east.',
        },
        { kind: 'summary', id: 'quadrant-summary', text: 'Keep true north as the start, and check the ray against its quadrant.' },
        {
          kind: 'checkpoint', id: 'quadrant-checkpoint',
          itemIds: ['whole-circle-bearings-item-10', 'whole-circle-bearings-item-11', 'whole-circle-bearings-item-12'],
        },
      ],
    },
  ],
}
