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
  'Three-digit T/M/G notation, east-positive grid convergence and practice banks are Argus conventions, not quotations. Practice offsets are invented, not current local values.'

const NOT_NAVIGATION =
  'Recall does not show that you can navigate safely: compass handling, fieldwork, resection, terrain, GPS, current declination, low visibility, emergencies and Arctic travel are excluded.'

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
    'A whole-circle bearing is measured clockwise from the stated north, from 000° to 359°.',
  sections: [
    {
      heading: 'Reading a bearing',
      blocks: [
        {
          type: 'bullets',
          items: [
            'Bearings increase clockwise from north: east is 090°, south 180°, west 270°.',
            'Use three digits: 005°. A full turn, 360°, is written 000°.',
            'Name the reference: 037°T means true north, used throughout this topic.',
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
          text: 'Check the quadrant before reading the angle; count clockwise from north.',
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
          text: '005° is just east of north; 355° is just west. They are 10° apart.',
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
    'Visual diagram questions require sight; descriptions would reveal answers. Reciprocal and declination calculations in the following topics work from text alone.',
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
    'A reciprocal, or back bearing, points the opposite way along the same line, measured from the same north.',
  sections: [
    {
      heading: 'The rule',
      blocks: [
        {
          type: 'steps',
          items: [
            'Add 180° to the bearing.',
            'At 360° or more, subtract 360° to return to 000°–359°.',
            'Keep the same north reference: true, magnetic or grid.',
          ],
        },
        {
          type: 'paragraph',
          text: 'Shortcut: below 180°, add 180°; otherwise subtract 180°.',
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
    'A reciprocal keeps its north reference. Converting between true, magnetic and grid north is a separate step.',
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
    'The same line has different bearings from true, magnetic and grid north. Declination relates true and magnetic bearings.',
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
          text: 'When magnetic north lies east of true north, D is positive and M is smaller than T by D.',
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
          text: 'Normalize to 000°–359°: 365° becomes 005°; −5° becomes 355°.',
        },
        {
          type: 'paragraph',
          text: 'Name the starting and target norths before adding or subtracting.',
        },
      ],
    },
    {
      heading: 'Why declination is always supplied',
      blocks: [
        {
          type: 'paragraph',
          text: 'Declination varies with location and time. Exercises supply D; real use needs a current, authoritative local value.',
        },
      ],
    },
  ],
  limitations: [
    'Compass reliability varies in the Canadian Arctic; these exercises do not establish field competence.',
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
    'Grid north follows the map’s grid. A Canadian topographic margin often gives grid-to-magnetic declination, distinct from true-to-magnetic declination.',
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
          text: 'Each angle joins a different pair of norths.',
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
          text: 'Offsets from true north: T = 0°, M = D, G = C; east positive, west negative. Add the starting reference’s offset, subtract the target’s.',
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
          text: 'For magnetic north g degrees east of grid north, use M = G − g or G = M + g directly.',
        },
        {
          type: 'paragraph',
          text: 'Converting then taking the reciprocal must agree with taking the reciprocal then converting.',
        },
      ],
    },
  ],
  caseStudies: [
    {
      title: 'A margin relation and a back bearing',
      scenario:
        'A margin gives magnetic north 10° east of grid north. Find the magnetic reciprocal of a 060°G line.',
      analysis: [
        {
          heading: 'Trace',
          blocks: [
            {
              type: 'steps',
              items: [
                'Convert: M = G − 10° = 050°M.',
                'Reciprocate: 050° + 180° = 230°M.',
                'Check: reciprocal 240°G − 10° = 230°M. Both routes agree.',
              ],
            },
          ],
        },
      ],
      takeaway: 'Name the norths, keep the offset’s sign, and check both routes.',
    },
  ],
  limitations: [
    'Use the margin’s printed values and date, never its drawn angles, which may be exaggerated.',
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
        'Reading the true bearing of a ray on a compass rose, and finding the ray for a stated bearing, clockwise from north, 000° to 359°. Follows Compass Bearings. Calculations, compass handling and field navigation are not scored.',
      items: withIds(WHOLE_CIRCLE_ID, [...readBearingItems(), ...findBearingItems()]),
      learn: wholeCircleLearn,
    }),
    unstarted({
      id: RECIPROCAL_ID,
      title: 'Reciprocal Bearings',
      scope:
        'The reciprocal (back) bearing of a stated bearing, on one north reference, including results that cross 000°. Converting between norths and field navigation are not scored.',
      items: withIds(RECIPROCAL_ID, reciprocalItems()),
      learn: reciprocalLearn,
    }),
    unstarted({
      id: NORTH_REFERENCES_ID,
      title: 'True & Magnetic North',
      scope:
        'What true, magnetic and grid north and declination are, and converting between true and magnetic bearings with a given declination (east positive), including results that cross 000°. Declination is always given. Grid conversions, compass handling and field navigation are not scored.',
      items: withIds(NORTH_REFERENCES_ID, [...northConceptItems(), ...declinationItems()]),
      learn: northReferencesLearn,
    }),
    unstarted({
      id: GRID_NORTH_ID,
      title: 'Grid North & Map Bearings',
      scope:
        'Reading a three-north diagram, converting between grid, magnetic and true bearings from a map margin, and converting then taking the reciprocal. Offsets are always given. Plotting routes, coordinates, resection and field navigation are not scored.',
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
