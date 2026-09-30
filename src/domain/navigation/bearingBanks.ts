import type { Item } from '../library/topic'
import type { Visual } from '../visual/visual'
import type { FigureSpec } from '../visual/figures'
import {
  angularSeparation,
  convert,
  formatBearing,
  formatOffset,
  gridDeclination,
  NORTH_REFERENCE_NAMES,
  normalize,
  reciprocal,
  type NorthReference,
} from './bearings'

/**
 * The four scored banks of the Compass & Bearings programme (#149), as fixed
 * exercise specifications whose answers and distractors are all computed from
 * `bearings.ts`. No answer is typed in: each bank lists the inputs, and the
 * key is what the tested arithmetic says. The inventories and coverage rules
 * are those of `docs/open/ISSUE_140_COMPASS_BEARINGS_TOPO.md` §5.
 *
 * Every item is an objectively graded choice (#146). Distractors model the
 * errors these calculations actually attract — reading the wrong way round,
 * applying a declination with the wrong sign, forgetting the conversion — so a
 * wrong option is wrong for an instructive reason rather than at random.
 */
export type BankItem = Pick<Item, 'prompt' | 'answer' | 'choice' | 'stimulus'>

function fig(figure: FigureSpec, alt: string): Visual {
  return { source: { kind: 'figure', figure }, alt }
}

/** Options in a stable order; Test shuffles the display. */
function options(answer: string, wrong: string[]): string[] {
  return [answer, ...wrong].sort()
}

/** The first `count` candidates that are distinct from the answer and each other. */
function distinct(answer: string, candidates: string[], count: number): string[] {
  const out: string[] = []
  for (const candidate of candidates) {
    if (candidate === answer || out.includes(candidate)) continue
    out.push(candidate)
    if (out.length === count) break
  }
  if (out.length < count) throw new Error(`Could not find ${count} distractors for ${answer}.`)
  return out
}

// ---------------------------------------------------------------------------
// A1 — Whole-circle bearing diagrams

/** Six rays to read. Quadrants: NE, SE, SW, NW; two sit close to north. */
export const A1_READ_BEARINGS = [37, 128, 205, 291, 5, 355] as const

/** Six bearings to find. Two are exact cardinal/intercardinal values (135, 270). */
export const A1_FIND_BEARINGS = [72, 163, 250, 344, 135, 270] as const

/** Letters for candidate rays: correct answers are unique per item (catalog rule), and mixed high/low. */
const RAY_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M'] as const

/** Plausible misreadings of a bearing, most instructive first. */
function misreadings(bearing: number): number[] {
  return [
    normalize(360 - bearing), // counted anticlockwise from north
    reciprocal(bearing), // read from the wrong end of the line
    normalize(90 - bearing), // measured from east
    normalize(bearing + 90),
    normalize(bearing - 90),
    normalize(bearing + 20),
  ]
}

export function readBearingItems(): BankItem[] {
  return A1_READ_BEARINGS.map((bearing, index) => {
    const answer = formatBearing(bearing, 'T')
    const wrong = distinct(
      answer,
      misreadings(bearing).map((b) => formatBearing(b, 'T')),
      3,
    )
    return {
      prompt: `Diagram ${index + 1} — which bearing does the ray show, measured clockwise from true north?`,
      answer,
      choice: { options: options(answer, wrong) },
      stimulus: fig(
        { kind: 'angle-dial', reference: 'T', quadrantGuides: true, pointers: [{ bearing }] },
        'A compass rose with true north at the top, dotted quadrant lines, and one ray from the centre. Read the ray against the rose.',
      ),
    }
  })
}

/** Rays at least this far apart stay visually distinguishable on one rose. */
const MIN_RAY_SEPARATION = 25

export function findBearingItems(): BankItem[] {
  return A1_FIND_BEARINGS.map((bearing, index) => {
    const rays: number[] = [bearing]
    for (const candidate of misreadings(bearing)) {
      if (rays.length === 4) break
      if (rays.every((ray) => angularSeparation(ray, candidate) >= MIN_RAY_SEPARATION)) rays.push(candidate)
    }
    if (rays.length < 4) throw new Error(`Could not place four rays for ${bearing}.`)

    // Four distinct letters, the correct one unique to this item.
    const letters = [
      RAY_LETTERS[index],
      RAY_LETTERS[(index + 4) % RAY_LETTERS.length],
      RAY_LETTERS[(index + 7) % RAY_LETTERS.length],
      RAY_LETTERS[(index + 10) % RAY_LETTERS.length],
    ]
    const answer = `Ray ${letters[0]}`
    const pointers = rays.map((b, i) => ({ bearing: b, label: letters[i] }))
    return {
      prompt: `Diagram ${index + 7} — which ray shows ${formatBearing(bearing, 'T')}?`,
      answer,
      choice: { options: options(answer, letters.slice(1).map((letter) => `Ray ${letter}`)) },
      stimulus: fig(
        { kind: 'angle-dial', reference: 'T', quadrantGuides: true, pointers },
        `A compass rose with true north at the top and four lettered rays from the centre, ${letters.slice().sort().join(', ')}. Choose the ray that matches the bearing asked.`,
      ),
    }
  })
}

// ---------------------------------------------------------------------------
// A2 — Reciprocal bearings

interface ReciprocalCase {
  bearing: number
  ref: NorthReference
  /** Drawn on a rose, with the forward bearing printed on the ray. */
  diagram?: boolean
}

/** Twelve cases: 3 below 180, 3 at/above 180, 2 crossing 000, 2 round checks, 2 diagrams. */
export const A2_CASES: readonly ReciprocalCase[] = [
  { bearing: 37, ref: 'T' },
  { bearing: 112, ref: 'M' },
  { bearing: 146, ref: 'G' },
  { bearing: 203, ref: 'T' },
  { bearing: 264, ref: 'M' },
  { bearing: 350, ref: 'T' },
  { bearing: 183, ref: 'G' },
  { bearing: 357, ref: 'M' },
  { bearing: 0, ref: 'T' },
  { bearing: 225, ref: 'M' },
  { bearing: 71, ref: 'T', diagram: true },
  { bearing: 295, ref: 'G', diagram: true },
]

export function reciprocalItems(): BankItem[] {
  return A2_CASES.map(({ bearing, ref, diagram }) => {
    const back = reciprocal(bearing)
    const answer = formatBearing(back, ref)
    const wrong = distinct(
      answer,
      [
        normalize(360 - bearing), // mirrored rather than reversed
        normalize(bearing + 90),
        normalize(bearing - 90),
        normalize(back + 10), // the right idea with an arithmetic slip
        normalize(back - 10),
      ].map((b) => formatBearing(b, ref)),
      3,
    )
    const forward = formatBearing(bearing, ref)
    const prompt = diagram
      ? `The ray on the diagram is a bearing of ${forward} from A to B. What is the bearing from B back to A?`
      : `The bearing from A to B is ${forward}. What is the bearing from B back to A?`
    return {
      prompt,
      answer,
      choice: { options: options(answer, wrong) },
      ...(diagram
        ? {
            stimulus: fig(
              { kind: 'angle-dial', reference: ref, pointers: [{ bearing, label: forward }] },
              `A compass rose drawn against ${NORTH_REFERENCE_NAMES[ref]} with one ray from the centre, labelled ${forward}. The ray runs from A at the centre toward B.`,
            ),
          }
        : {}),
    }
  })
}

// ---------------------------------------------------------------------------
// A3 — True and magnetic north, declination supplied

interface DeclinationCase {
  from: 'T' | 'M'
  bearing: number
  /** Signed declination, east positive. */
  D: number
}

/** Four each way (two east, two west), then four that cross 000. */
export const A3_CASES: readonly DeclinationCase[] = [
  { from: 'T', bearing: 90, D: 10 },
  { from: 'T', bearing: 145, D: 7 },
  { from: 'T', bearing: 70, D: -12 },
  { from: 'T', bearing: 200, D: -15 },
  { from: 'M', bearing: 130, D: 9 },
  { from: 'M', bearing: 52, D: 15 },
  { from: 'M', bearing: 82, D: -12 },
  { from: 'M', bearing: 240, D: -18 },
  { from: 'T', bearing: 5, D: 10 },
  { from: 'T', bearing: 355, D: -10 },
  { from: 'M', bearing: 358, D: 7 },
  { from: 'M', bearing: 3, D: -8 },
]

export function declinationItems(): BankItem[] {
  return A3_CASES.map(({ from, bearing, D }) => {
    const to: NorthReference = from === 'T' ? 'M' : 'T'
    const offsets = { D, C: 0 }
    const answer = formatBearing(convert(bearing, from, to, offsets), to)
    const right = convert(bearing, from, to, offsets)
    const wrong = distinct(
      answer,
      [
        convert(bearing, from, to, { D: -D, C: 0 }), // the declination applied the wrong way
        bearing, // no conversion at all
        right + 10,
        right - 10,
        right + 5,
        right - 5,
      ].map((b) => formatBearing(b, to)),
      3,
    )
    const fromName = from === 'T' ? 'true' : 'magnetic'
    const toName = to === 'M' ? 'magnetic' : 'true'
    return {
      prompt: `A ${fromName} bearing of ${formatBearing(bearing, from)}, with declination D = ${formatOffset(D)}. What is the ${toName} bearing?`,
      answer,
      choice: { options: options(answer, wrong) },
    }
  })
}

/** Four concept items, written out: there is nothing to compute. */
export function northConceptItems(): BankItem[] {
  const make = (prompt: string, answer: string, wrong: string[]): BankItem => ({
    prompt,
    answer,
    choice: { options: options(answer, wrong) },
  })
  return [
    make(
      'What is magnetic declination?',
      'The angle between true north and magnetic north, positive when magnetic north is east of true north',
      [
        'The angle between true north and grid north',
        'The angle between grid north and magnetic north, always measured from the map edge',
        'The angle a compass needle tilts below the horizontal',
      ],
    ),
    make(
      'Which north does a compass needle align with?',
      'Magnetic north, along the local horizontal magnetic field',
      ['True north, toward the geographic North Pole', 'Grid north, along the map’s vertical grid lines', 'Whichever north is printed on the map in use'],
    ),
    make(
      'Why is declination supplied with a calculation instead of memorized?',
      'It is different from place to place and changes over time',
      ['It is the same everywhere in Canada and never changes', 'It only matters for bearings above 180°', 'It is always exactly 10° east or west'],
    ),
    make(
      'Which north is defined by the map’s grid rather than by the Earth’s field or the pole?',
      'Grid north',
      ['True north', 'Magnetic north', 'Compass north, which is always the same as true north'],
    ),
  ]
}

// ---------------------------------------------------------------------------
// A4 — Grid north and combined map-bearing application

/** Four diagrams to read. The drawn angles are the figure's own data, exaggerated for legibility. */
export const A4_DIAGRAMS: readonly {
  rays: { ref: NorthReference; angle: number }[]
  question: string
  /** Derives the key from the drawn angles, never from a separate string. */
  answer: (rays: { ref: NorthReference; angle: number }[]) => string
  wrong: string[]
}[] = [
  {
    rays: [
      { ref: 'G', angle: 0 },
      { ref: 'M', angle: 14 },
    ],
    question: 'In this schematic (not to scale), which side of grid north does magnetic north lie on?',
    answer: (rays) => (rays.find((r) => r.ref === 'M')!.angle > 0 ? 'East of grid north (clockwise from it)' : 'West of grid north (anticlockwise from it)'),
    wrong: ['West of grid north (anticlockwise from it)', 'It coincides with grid north', 'Directly opposite grid north'],
  },
  {
    rays: [
      { ref: 'T', angle: 0 },
      { ref: 'G', angle: -12 },
    ],
    question: 'In this schematic (not to scale), which side of true north does grid north lie on?',
    answer: (rays) => (rays.find((r) => r.ref === 'G')!.angle > 0 ? 'East of true north, so convergence C is positive' : 'West of true north, so convergence C is negative'),
    wrong: ['East of true north, so convergence C is positive', 'It coincides with true north', 'East of true north, so convergence C is negative'],
  },
  {
    rays: [
      { ref: 'T', angle: 0 },
      { ref: 'G', angle: 12 },
      { ref: 'M', angle: 28 },
    ],
    question: 'In this schematic (not to scale), what is the order of the three norths clockwise, starting from true north?',
    answer: (rays) => [...rays].sort((a, b) => a.angle - b.angle).map((r) => `${r.ref}N`).join(' → '),
    wrong: ['TN → MN → GN', 'GN → TN → MN', 'MN → TN → GN'],
  },
  {
    rays: [
      { ref: 'M', angle: -22 },
      { ref: 'T', angle: 0 },
      { ref: 'G', angle: 14 },
    ],
    question: 'In this schematic (not to scale), which two norths are separated by the grid declination — the angle printed in a map margin?',
    answer: () => 'Grid north and magnetic north',
    wrong: ['True north and magnetic north', 'True north and grid north', 'True north, grid north and magnetic north together'],
  },
]

export function northDiagramItems(): BankItem[] {
  return A4_DIAGRAMS.map((diagram) => {
    const answer = diagram.answer(diagram.rays)
    const wrong = distinct(answer, diagram.wrong, 3)
    return {
      prompt: diagram.question,
      answer,
      choice: { options: options(answer, wrong) },
      stimulus: fig(
        { kind: 'north-reference', rays: diagram.rays },
        `A schematic, not to scale, of ${diagram.rays.length} north lines from one point, each labelled ${diagram.rays.map((r) => `${r.ref}N`).join(', ')}. One line is upright; the others lean east or west of it.`,
      ),
    }
  })
}

interface GridMagneticCase {
  from: 'G' | 'M'
  bearing: number
  /** Grid declination: magnetic north east (+) or west (−) of grid north. */
  gd: number
}

/** Direct G↔M conversions using the margin's stated relationship. */
export const A4_DIRECT_CASES: readonly GridMagneticCase[] = [
  { from: 'G', bearing: 104, gd: 8 },
  { from: 'G', bearing: 270, gd: -6 },
  { from: 'M', bearing: 47, gd: 11 },
  { from: 'M', bearing: 4, gd: -7 },
]

function directItem({ from, bearing, gd }: GridMagneticCase): BankItem {
  const to: NorthReference = from === 'G' ? 'M' : 'G'
  // A margin states only G↔M, so the convergence is folded in as zero and the
  // stated relation carries all of the offset. `gridDeclination` = D − C = gd.
  const offsets = { D: gd, C: 0 }
  if (gridDeclination(offsets) !== gd) throw new Error('Grid declination must equal the stated relation.')
  const right = convert(bearing, from, to, offsets)
  const answer = formatBearing(right, to)
  const wrong = distinct(
    answer,
    [
      convert(bearing, from, to, { D: -gd, C: 0 }),
      bearing,
      right + 10,
      right - 10,
    ].map((b) => formatBearing(b, to)),
    3,
  )
  const side = gd > 0 ? 'east' : 'west'
  const fromName = from === 'G' ? 'grid' : 'magnetic'
  const toName = to === 'G' ? 'grid' : 'magnetic'
  return {
    prompt: `A map margin states that magnetic north is ${Math.abs(gd)}° ${side} of grid north. What is the ${toName} bearing for a ${fromName} bearing of ${formatBearing(bearing, from)}?`,
    answer,
    choice: { options: options(answer, wrong) },
  }
}

export function directGridItems(): BankItem[] {
  return A4_DIRECT_CASES.map(directItem)
}

interface MixedCase {
  from: NorthReference
  to: NorthReference
  bearing: number
  D: number
  C: number
}

/** Both offsets supplied; the general rule is the method. */
export const A4_MIXED_CASES: readonly MixedCase[] = [
  { from: 'G', to: 'M', bearing: 100, D: 10, C: 2 },
  { from: 'M', to: 'G', bearing: 214, D: 9, C: -3 },
]

export function mixedItems(): BankItem[] {
  return A4_MIXED_CASES.map(({ from, to, bearing, D, C }) => {
    const offsets = { D, C }
    const right = convert(bearing, from, to, offsets)
    const answer = formatBearing(right, to)
    const wrong = distinct(
      answer,
      [
        convert(bearing, from, to, { D: -D, C }),
        convert(bearing, from, to, { D, C: -C }),
        convert(bearing, from, to, { D: 0, C }), // convergence only
        convert(bearing, from, to, { D, C: 0 }), // declination only
      ].map((b) => formatBearing(b, to)),
      3,
    )
    return {
      prompt: `Declination D = ${formatOffset(D)} and grid convergence C = ${formatOffset(C)}. What is the ${NORTH_REFERENCE_NAMES[to].replace(' north', '')} bearing for a ${NORTH_REFERENCE_NAMES[from].replace(' north', '')} bearing of ${formatBearing(bearing, from)}?`,
      answer,
      choice: { options: options(answer, wrong) },
    }
  })
}

interface TwoStepCase {
  bearing: number
  from: NorthReference
  /** Convert to this reference, then take the reciprocal there. */
  to: NorthReference
  D: number
  C: number
  /** Whether the prompt states a map-margin relation (G↔M) rather than D and C. */
  marginStyle?: boolean
}

export const A4_TWO_STEP_CASES: readonly TwoStepCase[] = [
  { bearing: 60, from: 'G', to: 'M', D: 10, C: 0, marginStyle: true },
  { bearing: 330, from: 'M', to: 'G', D: -8, C: 2 },
]

export function twoStepItems(): BankItem[] {
  return A4_TWO_STEP_CASES.map(({ bearing, from, to, D, C, marginStyle }) => {
    const offsets = { D, C }
    const converted = convert(bearing, from, to, offsets)
    const back = reciprocal(converted)
    const answer = formatBearing(back, to)
    const wrong = distinct(
      answer,
      [
        converted, // forgot the reciprocal
        reciprocal(bearing), // forgot the conversion
        reciprocal(convert(bearing, from, to, { D: -D, C: -C })), // conversion applied the wrong way
        back + 10,
        back - 10,
      ].map((b) => formatBearing(b, to)),
      3,
    )
    const toName = NORTH_REFERENCE_NAMES[to].replace(' north', '')
    const fromName = NORTH_REFERENCE_NAMES[from].replace(' north', '')
    const relation = marginStyle
      ? `A map margin states that magnetic north is ${Math.abs(D)}° ${D > 0 ? 'east' : 'west'} of grid north.`
      : `Declination D = ${formatOffset(D)} and grid convergence C = ${formatOffset(C)}.`
    return {
      prompt: `${relation} The ${fromName} bearing of a line is ${formatBearing(bearing, from)}. Convert it to a ${toName} bearing, then give the ${toName} bearing back along the same line.`,
      answer,
      choice: { options: options(answer, wrong) },
    }
  })
}
