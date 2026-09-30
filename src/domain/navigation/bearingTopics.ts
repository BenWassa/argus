import type { LearnContent, LearnBlock } from '../learning/content'
import type { FigureSpec } from '../visual/figures'
import type { IdentifiedItem, Topic } from '../library/topic'
import {
  declinationItems,
  directGridItems,
  findBearingItems,
  mixedItems,
  northConceptItems,
  northDiagramItems,
  readBearingItems,
  reciprocalItems,
  twoStepItems,
  type BankItem,
} from './bearingBanks'

/**
 * The four shipped follow-on topics of the Compass & Bearings programme (#149).
 * The existing eight-point `cardinal-bearings` topic stays as the prerequisite
 * and is deliberately not touched here.
 *
 * Content authority is `docs/open/ISSUE_140_COMPASS_BEARINGS_TOPO.md`. Source-
 * backed facts (NRCan definitions, the east-positive declination convention,
 * the T/M/G distinction) are kept apart from Argus editorial choices (the
 * three-digit notation with a T/M/G suffix, the signed convergence `C`
 * convention and the exercise banks), and each topic says which is which.
 */
const NRCAN_COMPONENTS = {
  label: 'NRCan — Magnetic components',
  url: 'https://www.geomag.nrcan.gc.ca/mag_fld/comp-en.php',
  note: 'Natural Resources Canada definitions of true and magnetic north and of magnetic declination, positive eastward.',
}
const NRCAN_DECLINATION = {
  label: 'NRCan — Magnetic declination',
  url: 'https://geomag.nrcan.gc.ca/mag_fld/magdec-en.php',
  note: 'Distinguishes true declination, grid declination and convergence, and warns that declination changes with time.',
}
const NRCAN_COMPASS = {
  label: 'NRCan — Using a compass',
  url: 'https://www.geomag.nrcan.gc.ca/mag_fld/compass-en.php',
  note: 'The map and compass relationship and the practical difference between grid and magnetic bearings; compass reliability is not uniform in the Canadian Arctic.',
}
const NRCAN_ORIENTING = {
  label: 'NRCan — Orienting a Topographic Map',
  url: 'https://natural-resources.canada.ca/maps-tools-publications/maps/topographic-maps/orienting-topographic-map',
  note: 'The grid and magnetic relationship in an NTS margin diagram, and the warning not to measure its drawn angles, which may be exaggerated.',
}
const NOAA_NAVIGATION = {
  label: 'NOAA — Navigation Training Manual',
  url: 'https://repository.library.noaa.gov/view/noaa/42218/noaa_42218_DS1.pdf',
  note: 'Official navigation training reference for bearings measured in clockwise degrees from north.',
}

const EDITORIAL_CONVENTIONS =
  'Three-digit bearings with a T, M or G suffix, the signed grid-convergence convention (east of true north positive) and the exercise banks are Argus editorial choices for consistent practice, not quotations from one publication.'

const NOT_NAVIGATION =
  'Completing this topic does not show that you can navigate safely: it does not cover holding, levelling or sighting a compass, taking a field bearing, walking an azimuth, resection, terrain association, GPS use, finding a current local declination, or navigating in low visibility, emergencies or the Canadian Arctic.'

function dial(
  pointers: { bearing: number; label?: string }[],
  options: { reference?: 'T' | 'M' | 'G'; quadrantGuides?: boolean; arc?: boolean } = {},
): FigureSpec {
  return { kind: 'angle-dial', pointers, ...options }
}

function visual(figure: FigureSpec, alt: string, caption: string): LearnBlock {
  return { type: 'visual', visual: { source: { kind: 'figure', figure }, alt, caption } }
}

function withIds(topicId: string, items: BankItem[]): IdentifiedItem[] {
  return items.map((item, index) => ({
    id: `${topicId}-item-${String(index + 1).padStart(2, '0')}`,
    kind: 'forward' as const,
    ...item,
  }))
}

function unstarted(base: Pick<Topic, 'id' | 'title' | 'scope' | 'items' | 'learn'>): Topic {
  return {
    ...base,
    track: 'tradecraft',
    status: 'unstarted',
    createdAt: new Date(0).toISOString(),
    drilledAt: null,
    learningAt: null,
    completedAt: null,
    lastTestedAt: null,
    spotCheckedAt: null,
    history: [],
  }
}

// ---------------------------------------------------------------------------

const WHOLE_CIRCLE_ID = 'whole-circle-bearings'

const wholeCircleLearn: LearnContent = {
  kind: 'concise',
  overview:
    'Builds on Compass Bearings, which gives the eight named points. A whole-circle bearing is any direction from 000° to 359°, measured clockwise from the stated north. This topic is about reading that angle off a diagram and finding the ray for a given bearing. Because its claim is about diagrams, it is a visual topic.',
  sections: [
    {
      heading: 'Reading a bearing',
      blocks: [
        {
          type: 'bullets',
          items: [
            'Bearings increase clockwise from north: east is 090°, south 180°, west 270°.',
            'Write them with three digits: 005°, not 5°. Answers here are always 000° to 359°; 360° is the same direction as 000° after a full turn.',
            'Name the north the bearing is measured from. A suffix does it: 037°T is measured from true north. Here every bearing is from true north.',
          ],
        },
        visual(
          dial([{ bearing: 37, label: '037°T' }], { reference: 'T', quadrantGuides: true, arc: true }),
          'A compass rose with true north at the top and dotted quadrant lines. One ray, labelled 037°T, leans a little less than halfway from north toward east, and a short arc runs clockwise from north to it.',
          'The arc is the bearing: the clockwise angle from north to the ray, here 037°T in the north-east quadrant.',
        ),
      ],
    },
    {
      heading: 'Quadrant check',
      blocks: [
        {
          type: 'paragraph',
          text: 'Before you pick a number, place the ray in a quadrant. It catches most mistakes, such as reading from the wrong end of a line or counting anticlockwise.',
        },
        {
          type: 'table',
          columns: ['Bearing', 'Quadrant', 'Ray points toward'],
          rows: [
            ['000° to 089°', 'North-east', 'Between north and east'],
            ['090° to 179°', 'South-east', 'Between east and south'],
            ['180° to 269°', 'South-west', 'Between south and west'],
            ['270° to 359°', 'North-west', 'Between west and north'],
          ],
        },
      ],
    },
    {
      heading: 'Close to north',
      blocks: [
        {
          type: 'paragraph',
          text: 'Rays near north are easy to confuse. 005° and 355° are only 10° apart, on opposite sides of north. One is just east of north; the other is just west.',
        },
        visual(
          dial([{ bearing: 5, label: '005°' }, { bearing: 355, label: '355°' }], { reference: 'T', quadrantGuides: true }),
          'A compass rose with true north at the top and two rays very close to it, 005° just to the right of north and 355° just to the left.',
          '005° and 355° sit either side of north, 10° apart.',
        ),
      ],
    },
  ],
  limitations: [
    'This topic is explicitly visual: it asks you to read and choose bearings in diagrams. The diagram cannot be replaced by a description without giving the answer away, so it does not claim to be fully usable without sight; reciprocal and declination calculations in the following topics can be done from text alone.',
    EDITORIAL_CONVENTIONS,
    NOT_NAVIGATION,
  ],
  sources: [NOAA_NAVIGATION, NRCAN_COMPASS],
}

// ---------------------------------------------------------------------------

const RECIPROCAL_ID = 'reciprocal-bearings'

const reciprocalLearn: LearnContent = {
  kind: 'concise',
  overview:
    'The reciprocal, or back bearing, is the opposite direction along the same line. If you walk from A to B on a bearing, the bearing from B back to A is the reciprocal. It is always measured from the same north.',
  sections: [
    {
      heading: 'The rule',
      blocks: [
        {
          type: 'steps',
          items: [
            'Add 180° to the bearing.',
            'If the result is 360° or more, subtract 360° so it lies between 000° and 359°.',
            'Keep the reference: a true bearing gives a true reciprocal, a magnetic bearing a magnetic one, a grid bearing a grid one.',
          ],
        },
        {
          type: 'paragraph',
          text: 'The same thing as a mental shortcut: below 180°, add 180°; at 180° or above, subtract 180°. It is one rule in two steps, not a second rule.',
        },
        {
          type: 'table',
          columns: ['Forward', 'Reciprocal', 'Why'],
          rows: [
            ['037°T', '217°T', '37 + 180 = 217'],
            ['225°T', '045°T', '225 + 180 = 405, then 405 − 360 = 45'],
            ['350°T', '170°T', '350 + 180 = 530, then 530 − 360 = 170'],
            ['000°T', '180°T', '0 + 180 = 180'],
            ['180°T', '000°T', '180 + 180 = 360, which is 000°'],
          ],
        },
        visual(
          dial([{ bearing: 37, label: '037°T' }, { bearing: 217, label: '217°T' }], { reference: 'T' }),
          'A compass rose with true north at the top and two rays from the centre pointing in exactly opposite directions: 037°T toward the upper right and 217°T toward the lower left.',
          'A bearing and its reciprocal lie on one straight line through the centre, 180° apart.',
        ),
      ],
    },
    {
      heading: 'Two checks',
      blocks: [
        {
          type: 'bullets',
          items: [
            'The two bearings should always differ by exactly 180°.',
            'Take the reciprocal of your answer. You should get the bearing you started with.',
          ],
        },
      ],
    },
  ],
  limitations: [
    'Reciprocals are calculated on one north reference. Converting between true, magnetic and grid north is a separate step, taught in the next topics.',
    EDITORIAL_CONVENTIONS,
    NOT_NAVIGATION,
  ],
  sources: [NOAA_NAVIGATION],
}

// ---------------------------------------------------------------------------

const NORTH_REFERENCES_ID = 'north-references-declination'

const northReferencesLearn: LearnContent = {
  kind: 'briefing',
  overview:
    'A compass does not point to true north. Bearings can be measured from true north, magnetic north or, on a map, grid north, and the same line has a different number against each. Converting between true and magnetic bearings needs the declination, and here it is always supplied.',
  sections: [
    {
      heading: 'Three norths',
      blocks: [
        {
          type: 'definitions',
          items: [
            { term: 'True north (T)', definition: 'The direction toward the geographic North Pole.' },
            { term: 'Magnetic north (M)', definition: 'The direction of the local horizontal magnetic field, which a compass needle aligns with.' },
            { term: 'Grid north (G)', definition: 'North as defined by a map’s grid, along its vertical grid lines. It is taken up in the next topic.' },
            { term: 'Magnetic declination (D)', definition: 'The angle between true north and magnetic north. Positive when magnetic north lies east of true north, negative when it lies west.' },
          ],
        },
        visual(
          { kind: 'north-reference', rays: [{ ref: 'T', angle: 0 }, { ref: 'M', angle: 18, label: 'MN 10°E' }] },
          'A schematic, not to scale, of two north lines from one point: true north upright and magnetic north leaning to its east, labelled for a declination of 10° east.',
          'With declination 10° east, magnetic north is 10° east of true north. The drawn angle is exaggerated; the number is what matters.',
        ),
      ],
    },
    {
      heading: 'Converting true and magnetic bearings',
      blocks: [
        {
          type: 'paragraph',
          text: 'Think of the diagram. If magnetic north is east of true north (D positive), then a line’s bearing measured from magnetic north is smaller than its bearing from true north by D.',
        },
        {
          type: 'table',
          columns: ['To find', 'Rule', 'Example'],
          rows: [
            ['Magnetic from true', 'M = T − D', 'T 090°, D +10° gives M 080°'],
            ['True from magnetic', 'T = M + D', 'M 080°, D +10° gives T 090°'],
            ['Magnetic from true, D west', 'M = T − (−12°) = T + 12°', 'T 070°, D −12° gives M 082°'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Always finish by bringing the answer back into 000° to 359°. A result of 365° is 005°, and −5° is 355°.',
        },
        {
          type: 'paragraph',
          text: 'Argus teaches the rule from the diagram instead of a mnemonic. An add-or-subtract mnemonic that leaves out the starting and target references is easy to apply backwards.',
        },
      ],
    },
    {
      heading: 'Why declination is always supplied',
      blocks: [
        {
          type: 'paragraph',
          text: 'Declination differs from place to place and changes over time, so this topic never asks you to remember one. Every calculation states D. For real use, take the current value for your location from an up-to-date authoritative source.',
        },
      ],
    },
  ],
  limitations: [
    'The declinations used here are made-up values for practice, not current local values.',
    EDITORIAL_CONVENTIONS,
    NOT_NAVIGATION,
  ],
  sources: [NRCAN_COMPONENTS, NRCAN_DECLINATION, NRCAN_COMPASS],
}

// ---------------------------------------------------------------------------

const GRID_NORTH_ID = 'grid-north-map-bearings'

const gridNorthLearn: LearnContent = {
  kind: 'briefing',
  overview:
    'A map has a third north. Grid north follows the map’s grid lines, and on a Canadian topographic map the margin diagram usually gives the angle between grid north and magnetic north. That angle is not the same as the true-magnetic declination. This topic covers reading the three-north relationship and converting between the stated norths when the offsets are supplied.',
  sections: [
    {
      heading: 'Three angles, three names',
      blocks: [
        {
          type: 'definitions',
          items: [
            { term: 'Magnetic declination', definition: 'True north to magnetic north.' },
            { term: 'Grid declination', definition: 'Grid north to magnetic north. A map margin often prints this one.' },
            { term: 'Convergence', definition: 'True north to grid north.' },
          ],
        },
        {
          type: 'paragraph',
          text: 'Do not call all three “declination”. Each is the angle between a different pair of norths.',
        },
        visual(
          { kind: 'north-reference', rays: [{ ref: 'T', angle: 0, label: 'TN' }, { ref: 'G', angle: 12, label: 'GN' }, { ref: 'M', angle: 28, label: 'MN' }] },
          'A schematic, not to scale, of three north lines from one point: true north upright, grid north leaning a little to its east, and magnetic north leaning further east. True north is a solid line, magnetic north a dashed line and grid north a dotted line.',
          'True north is solid, magnetic dashed, grid dotted. Margin diagrams like this are explanatory: their angles may be exaggerated, so do not measure them. Use the printed numbers.',
        ),
      ],
    },
    {
      heading: 'One rule for every conversion',
      blocks: [
        {
          type: 'paragraph',
          text: 'Give each north a signed offset clockwise from true north: true is 0°, magnetic is D, and grid is C (east of true positive, west negative). To change reference, add the offset of the one you are leaving and subtract the offset of the one you are going to.',
        },
        {
          type: 'table',
          columns: ['Convert', 'Rule'],
          rows: [
            ['True → magnetic', 'M = T − D'],
            ['Magnetic → true', 'T = M + D'],
            ['True → grid', 'G = T − C'],
            ['Grid → true', 'T = G + C'],
            ['Grid → magnetic', 'M = G + C − D'],
            ['Magnetic → grid', 'G = M + D − C'],
          ],
        },
        {
          type: 'paragraph',
          text: 'When a margin already gives the grid-to-magnetic angle, use it directly. Magnetic north east of grid north by g degrees gives M = G − g and G = M + g. You do not need D and C separately.',
        },
        {
          type: 'paragraph',
          text: 'Two-step problems often convert, then take the reciprocal. Doing it in the other order must give the same answer, which makes a good check.',
        },
      ],
    },
  ],
  caseStudies: [
    {
      title: 'A margin relation and a back bearing',
      scenario:
        'A map margin states that magnetic north is 10° east of grid north. A line on the map has a grid bearing of 060°G. You want the bearing to walk back along it with a compass.',
      analysis: [
        {
          heading: 'Trace',
          blocks: [
            {
              type: 'steps',
              items: [
                'Magnetic north is east of grid north by 10°, so M = G − 10°: 060° − 10° = 050°M.',
                'The back bearing is the reciprocal on the same north: 050° + 180° = 230°M.',
                'Check the other way: the reciprocal grid bearing is 240°G, and 240° − 10° = 230°M. Both routes agree.',
              ],
            },
          ],
        },
      ],
      takeaway: 'Name both norths, apply the stated offset with its sign, and check with the reciprocal.',
    },
  ],
  limitations: [
    'The offsets used are made-up values for practice. Real margins state the values for their own map and date.',
    'Use the numbers printed in a margin, not the angle drawn, which may be exaggerated.',
    EDITORIAL_CONVENTIONS,
    NOT_NAVIGATION,
  ],
  sources: [NRCAN_DECLINATION, NRCAN_ORIENTING, NRCAN_COMPASS, NRCAN_COMPONENTS],
}

// ---------------------------------------------------------------------------

export const BEARING_TOPIC_IDS = [
  WHOLE_CIRCLE_ID,
  RECIPROCAL_ID,
  NORTH_REFERENCES_ID,
  GRID_NORTH_ID,
] as const

export function bearingTopics(): Topic[] {
  return [
    unstarted({
      id: WHOLE_CIRCLE_ID,
      title: 'Whole-Circle Bearings',
      scope:
        'Twelve diagram exercises on a compass rose: read the true bearing of a ray (6) and find the ray for a stated true bearing (6). Bearings run clockwise from north, 000° to 359°. Builds on the eight-point Compass Bearings topic. Test is visual; it does not cover calculations, compass handling or field navigation.',
      items: withIds(WHOLE_CIRCLE_ID, [...readBearingItems(), ...findBearingItems()]),
      learn: wholeCircleLearn,
    }),
    unstarted({
      id: RECIPROCAL_ID,
      title: 'Reciprocal Bearings',
      scope:
        'Twelve reciprocal (back) bearing calculations on one north reference: three below 180°, three at or above, two crossing 000°, two round-number checks and two read from a diagram. Test does not cover converting between norths or field navigation.',
      items: withIds(RECIPROCAL_ID, reciprocalItems()),
      learn: reciprocalLearn,
    }),
    unstarted({
      id: NORTH_REFERENCES_ID,
      title: 'True & Magnetic North',
      scope:
        'Sixteen items: four on what true, magnetic and grid north and declination are, and twelve true↔magnetic conversions with a supplied signed declination (east positive), including results that cross 000°. Test never asks for a real declination and does not cover grid north, compass handling or field navigation.',
      items: withIds(NORTH_REFERENCES_ID, [...northConceptItems(), ...declinationItems()]),
      learn: northReferencesLearn,
    }),
    unstarted({
      id: GRID_NORTH_ID,
      title: 'Grid North & Map Bearings',
      scope:
        'Twelve items: four on reading a three-north diagram, four direct grid↔magnetic conversions from a stated margin relation, two true/magnetic/grid conversions with both declination and convergence supplied, and two that convert then take the reciprocal. Offsets are always supplied. Test does not cover plotting routes, coordinates, resection or field navigation.',
      items: withIds(GRID_NORTH_ID, [
        ...northDiagramItems(),
        ...directGridItems(),
        ...mixedItems(),
        ...twoStepItems(),
      ]),
      learn: gridNorthLearn,
    }),
  ]
}
