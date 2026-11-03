import type { FigureSpec } from '../visual/figures'
import { convert, formatBearing, formatOffset, gridDeclination, normalize, reciprocal, type NorthReference } from './bearings'

/** #323: domain-only, reproducible, non-scored exercises. No Test IDs or learner writes. */
export const TOPICS = [
  'cardinal-bearings', 'whole-circle-bearings', 'reciprocal-bearings',
  'north-references-declination', 'grid-north-map-bearings',
] as const
export type BearingTopicId = (typeof TOPICS)[number]
export type BearingExerciseKind = 'identify' | 'read-ray' | 'find-ray' | 'calculate' | 'two-step'

export const STAGES: Record<BearingTopicId, readonly string[]> = {
  'cardinal-bearings': ['anchors', 'diagonals', 'find-a-ray', 'mixed-eight'],
  'whole-circle-bearings': ['reading-the-dial', 'close-to-north', 'finding-the-ray', 'checking-the-quadrant'],
  'reciprocal-bearings': ['adding-a-half-turn', 'wrapping-the-turn', 'checking-the-return', 'reversing-the-ray'],
  'north-references-declination': ['naming-the-norths', 'signing-declination', 'true-to-magnetic', 'magnetic-to-true', 'wrapping-through-north'],
  'grid-north-map-bearings': ['reading-north-diagrams', 'using-the-map-margin', 'using-signed-offsets', 'converting-a-back-bearing'],
}

export interface BearingChoice {
  prompt: string
  options: string[]
  answer: string
  explanation: string
  /** A distinct diagnosis for every wrong option, not merely a generic retry. */
  wrongFeedback: Record<string, string>
}
export interface BearingFormativeCase extends BearingChoice {
  id: string
  topicId: BearingTopicId
  stageId: string
  kind: BearingExerciseKind
  evidence: 'formative-only'
  inputs: Readonly<Record<string, string | number>>
  workings: string[]
  figure?: FigureSpec
  /** Does not disclose the unknown answer before the learner responds. */
  figureAlt?: string
  intermediate?: BearingChoice
}
type Wrong = [value: string, diagnosis: string]

function selection(answer: string, wrong: Wrong[]): Pick<BearingChoice, 'options' | 'wrongFeedback'> {
  const options = [answer]
  const wrongFeedback: Record<string, string> = {}
  for (const [value, diagnosis] of wrong) {
    if (options.includes(value)) continue
    options.push(value)
    wrongFeedback[value] = diagnosis
    if (options.length === 4) break
  }
  if (options.length !== 4) throw new Error('Three unique plausible errors required: ' + answer)
  return { options, wrongFeedback }
}
function numericSelection(answer: number, ref: NorthReference, wrong: [number, string][]) {
  return selection(formatBearing(answer, ref), [
    ...wrong.map(([n, why]): Wrong => [formatBearing(n, ref), why]),
    [formatBearing(answer + 9, ref), 'Arithmetic slip: recompute the operation, then normalize.'],
    [formatBearing(answer - 9, ref), 'Arithmetic slip: recompute the operation, then normalize.'],
  ])
}
/** FNV-1a: stable on every device, unlike Math.random or a timestamp. */
function hash(s: string) {
  let x = 2166136261
  for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619)
  return x >>> 0
}
function pick<T>(values: readonly T[], hashValue: number, ordinal: number): T {
  return values[(hashValue + ordinal) % values.length]
}
function build(topicId: BearingTopicId, stageId: string, seed: number, ordinal: number,
  kind: BearingExerciseKind, spec: Omit<BearingFormativeCase, 'id' | 'topicId' | 'stageId' | 'evidence' | 'kind'>): BearingFormativeCase {
  return { id: topicId + ':' + stageId + ':v1:' + seed.toString(36) + ':' + ordinal,
    topicId, stageId, kind, evidence: 'formative-only', ...spec }
}

const DIRECTIONS = [
  ['North', 0], ['Northeast', 45], ['East', 90], ['Southeast', 135],
  ['South', 180], ['Southwest', 225], ['West', 270], ['Northwest', 315],
] as const
function cardinal(topic: BearingTopicId, stage: string, seed: number, n: number, h: number): BearingFormativeCase {
  const pool = stage === 'anchors' ? [0, 2, 4, 6] : stage === 'diagonals' ? [1, 3, 5, 7] : [0, 1, 2, 3, 4, 5, 6, 7]
  const index = pick(pool, h, n)
  const [direction, angle] = DIRECTIONS[index]
  const inputs = { angle, direction }
  if (stage === 'find-a-ray') {
    const angles = [angle, normalize(angle + 90), normalize(angle + 180), normalize(angle + 270)]
    const labels = ['A', 'B', 'C', 'D']
    const pointers = angles.map((bearing, i) => ({ bearing, label: labels[(i + (h + n) % 4) % 4] }))
    const answer = 'Ray ' + pointers[0].label
    return build(topic, stage, seed, n, 'find-ray', {
      prompt: 'Which labelled ray points ' + direction.toLowerCase() + '?', answer,
      ...selection(answer, pointers.slice(1).map(p => ['Ray ' + p.label,
        'Ray ' + p.label + ' points at ' + p.bearing + '°, not ' + angle + '°. Count clockwise from north.'])),
      explanation: direction + ' is ' + angle + '° clockwise from north.', inputs,
      workings: ['North = 0°; each eight-point interval is 45°.', direction + ' = ' + angle + '°.'],
      figure: { kind: 'angle-dial', quadrantGuides: true, pointers },
      figureAlt: 'Compass rose, north at the top, with four lettered rays. The requested direction is in the question.',
    })
  }
  const inverse = stage === 'mixed-eight' && (h + n) % 2 === 0
  const answer = inverse ? direction : angle + '°'
  const wrong = [1, 2, 3].map(i => {
    const [name, degrees] = DIRECTIONS[(index + i) % 8]
    return [inverse ? name : degrees + '°', name + ' means ' + degrees + '°, while ' + direction + ' means ' + angle + '°.'] as Wrong
  })
  return build(topic, stage, seed, n, 'identify', {
    prompt: inverse ? 'Name the direction for ' + angle + '°.' : 'What is the bearing of ' + direction + '?',
    answer, ...selection(answer, wrong), inputs,
    explanation: 'Starting at north 0°, advance clockwise in 45° steps: ' + direction + ' = ' + angle + '°.',
    workings: ['N = 0°, E = 90°, S = 180°, W = 270°.', 'The diagonal points fall halfway between.'],
  })
}

const WHOLE: Record<string, number[]> = {
  'reading-the-dial': [22, 68, 102, 116, 174],
  'close-to-north': [1, 7, 13, 347, 353, 359],
  'finding-the-ray': [29, 81, 142, 218, 263, 321],
  'checking-the-quadrant': [193, 239, 281, 311, 338],
}
function whole(topic: BearingTopicId, stage: string, seed: number, n: number, h: number): BearingFormativeCase {
  const bearing = pick(WHOLE[stage], h, n)
  const target = formatBearing(bearing, 'T')
  if (stage === 'finding-the-ray' || stage === 'checking-the-quadrant') {
    const angles = [bearing, normalize(bearing + 60), reciprocal(bearing), normalize(bearing + 270)]
    const labels = ['A', 'B', 'C', 'D']
    const pointers = angles.map((angle, i) => ({ bearing: angle, label: labels[(i + (h + n) % 4) % 4] }))
    const answer = 'Ray ' + pointers[0].label
    return build(topic, stage, seed, n, 'find-ray', {
      prompt: 'Which ray is ' + target + '?', answer,
      ...selection(answer, pointers.slice(1).map(p => ['Ray ' + p.label,
        'Ray ' + p.label + ' shows ' + formatBearing(p.bearing, 'T') + ', not ' + target + '. Check clockwise from TN.'])),
      explanation: target + ' is the marked angle clockwise from true north.', inputs: { bearing, reference: 'T' },
      workings: ['Check the target quadrant.', 'Read the lettered rays clockwise from TN.'],
      figure: { kind: 'angle-dial', reference: 'T', quadrantGuides: true, pointers },
      figureAlt: 'Four lettered rays on a compass dial with true north at the top. Match the requested number to a ray.',
    })
  }
  return build(topic, stage, seed, n, 'read-ray', {
    prompt: 'Read this ray, clockwise from true north.', answer: target,
    ...numericSelection(bearing, 'T', [
      [normalize(360 - bearing), 'Anticlockwise error: bearings increase clockwise from TN.'],
      [reciprocal(bearing), 'Wrong end of line: this is 180° away from the indicated ray.'],
      [normalize(90 - bearing), 'Wrong origin: the angle starts at TN, not east.'],
    ]), explanation: 'Sweep clockwise from TN to the ray: ' + target + '.',
    inputs: { bearing, reference: 'T' }, workings: ['TN = 000°T.', 'Clockwise to ' + target + '.'],
    figure: { kind: 'angle-dial', reference: 'T', quadrantGuides: true, arc: true, pointers: [{ bearing }] },
    figureAlt: 'One unlabelled ray on a compass dial with true north at the top. Read its number from the drawing.',
  })
}

const RECIP: Record<string, number[]> = {
  'adding-a-half-turn': [24, 82, 151, 169, 173],
  'wrapping-the-turn': [31, 105, 187, 261, 312],
  'checking-the-return': [1, 179, 180, 359, 347],
  'reversing-the-ray': [64, 207, 338, 143, 289],
}
const REFS: readonly NorthReference[] = ['T', 'M', 'G']
function reciprocalCase(topic: BearingTopicId, stage: string, seed: number, n: number, h: number): BearingFormativeCase {
  const bearing = pick(RECIP[stage], h, n)
  const ref = pick(REFS, h >>> 3, n)
  const result = reciprocal(bearing)
  const answer = formatBearing(result, ref)
  const original = formatBearing(bearing, ref)
  return build(topic, stage, seed, n, 'calculate', {
    prompt: 'A to B is ' + original + '. What is the bearing from B to A?', answer,
    ...numericSelection(result, ref, [
      [bearing, 'No reversal: this is still the original A-to-B direction.'],
      [normalize(360 - bearing), 'Mirroring across north does not reverse the line.'],
      [normalize(bearing + 90), 'This turns 90°, not the necessary 180°.'],
      [normalize(bearing - 90), 'This turns 90°, not the necessary 180°.'],
    ]), explanation: 'Reverse by 180° on the same ' + ref + ' reference: ' + original + ' becomes ' + answer + '.',
    inputs: { bearing, reference: ref }, workings: [bearing + ' + 180 = ' + (bearing + 180) + '°.',
      'Normalize to ' + answer + '.', 'The reciprocal of ' + answer + ' is ' + original + '.'],
    figure: { kind: 'angle-dial', reference: ref, pointers: [{ bearing, label: 'A to B' }] },
    figureAlt: 'The initial A-to-B ray on a compass rose. The reverse ray would lie on the same straight line.',
  })
}

function northConcept(topic: BearingTopicId, stage: string, seed: number, n: number, h: number): BearingFormativeCase {
  if (stage === 'signing-declination') {
    const east = (h + n) % 2 === 0
    const D = east ? 11 : -14
    const answer = east ? 'Positive (east)' : 'Negative (west)'
    return build(topic, stage, seed, n, 'identify', {
      prompt: 'Magnetic north is ' + (east ? 'east' : 'west') + ' of true north. What sign is D?', answer,
      ...selection(answer, [
        [east ? 'Negative (west)' : 'Positive (east)', 'The sign is reversed: D is positive east, negative west.'],
        ['Zero', 'D is zero only when true and magnetic north coincide.'],
        ['Cannot be determined from the stated side', 'East/west is explicitly given; a real-world location lookup is unnecessary.'],
      ]), explanation: 'D measures magnetic north from true north; east is positive and west negative.',
      inputs: { D }, workings: ['Example supplied D = ' + formatOffset(D) + '. The drawn angle is schematic.'],
      figure: { kind: 'north-reference', rays: [{ ref: 'T', angle: 0 }, { ref: 'M', angle: east ? 22 : -22 }] },
      figureAlt: 'Not-to-scale two-north figure showing the stated east/west relation. Do not measure its angle.',
    })
  }
  const names = [
    ['True north (T)', 'geographic North Pole'], ['Magnetic north (M)', 'local horizontal magnetic field'],
    ['Grid north (G)', 'vertical map grid lines'],
  ] as const
  const [answer, definition] = pick(names, h, n)
  return build(topic, stage, seed, n, 'identify', {
    prompt: 'Which north is defined by the ' + definition + '?', answer,
    ...selection(answer, [
      ...names.filter(x => x[0] !== answer).map(x => [x[0], x[0] + ' is defined by the ' + x[1] + '.'] as Wrong),
      ['Unspecified north', 'A bearing needs its stated reference T, M or G.'],
    ]), explanation: 'Pole = true; local field = magnetic; map grid = grid.',
    inputs: { name: answer }, workings: ['Name the reference before converting a bearing.'],
  })
}

const DECLINATION = [
  { bearing: 26, D: 11 }, { bearing: 116, D: -9 }, { bearing: 252, D: 17 },
  { bearing: 5, D: 13 }, { bearing: 356, D: -15 }, { bearing: 339, D: 24 },
]
function trueMagnetic(topic: BearingTopicId, stage: string, seed: number, n: number, h: number): BearingFormativeCase {
  const data = pick(DECLINATION, h, n)
  const from: NorthReference = stage === 'true-to-magnetic' ? 'T' : stage === 'magnetic-to-true' ? 'M' : (h + n) % 2 ? 'T' : 'M'
  const to: NorthReference = from === 'T' ? 'M' : 'T'
  const bearing = stage === 'wrapping-through-north' ? pick([2, 5, 355, 359], h, n) : data.bearing
  const D = stage === 'wrapping-through-north' ? (bearing < 10 ? 16 : -14) : data.D
  const result = convert(bearing, from, to, { D, C: 0 })
  const answer = formatBearing(result, to)
  const rule = from === 'T' ? 'M = T − D' : 'T = M + D'
  return build(topic, stage, seed, n, 'calculate', {
    prompt: 'Given ' + formatBearing(bearing, from) + ' and D = ' + formatOffset(D) + ', find the ' + to + ' bearing.', answer,
    ...numericSelection(result, to, [
      [convert(bearing, from, to, { D: -D, C: 0 }), 'Sign error: east-positive D must keep the supplied sign. Apply ' + rule + '.'],
      [bearing, 'No conversion: the origin changes from ' + from + ' to ' + to + '.'],
      [reciprocal(result), 'This is a back bearing, not a north-reference conversion.'],
    ]), explanation: rule + '; normalize the result to ' + answer + '.',
    inputs: { bearing, D, C: 0, from, to }, workings: [rule + '.', 'Use D = ' + formatOffset(D) + '.', 'Result: ' + answer + '.'],
  })
}

function gridConcept(topic: BearingTopicId, stage: string, seed: number, n: number, h: number): BearingFormativeCase {
  if (stage === 'reading-north-diagrams' && (h + n) % 2 === 0) {
    const styles = [
      ['True north (TN)', 'solid', 'geographic pole'],
      ['Magnetic north (MN)', 'dashed', 'local horizontal magnetic field'],
      ['Grid north (GN)', 'dotted', 'map grid'],
    ] as const
    const [answer, lineStyle, meaning] = pick(styles, h, n)
    return build(topic, stage, seed, n, 'identify', {
      prompt: 'In the three-north key, which reference uses a ' + lineStyle + ' line?', answer,
      ...selection(answer, [
        ...styles.filter(v => v[0] !== answer).map(v => [v[0], v[0] + ' is ' + v[1] + ', defined by the ' + v[2] + '.'] as Wrong),
        ['Any north line', 'The legend must distinguish the three different north references.'],
      ]), explanation: answer + ' uses a ' + lineStyle + ' line and refers to the ' + meaning + '.',
      inputs: { reference: answer, style: lineStyle },
      workings: ['TN is solid; MN is dashed; GN is dotted. Read printed margin numbers, not drawn angles.'],
      figure: { kind: 'north-reference', rays: [
        { ref: 'T', angle: 0 }, { ref: 'G', angle: -16 }, { ref: 'M', angle: 26 },
      ] }, figureAlt: 'Schematic three-north diagram. Distinct solid, dotted and dashed lines; not to scale.',
    })
  }
  const names = [
    ['Magnetic declination D (T–M)', 'true and magnetic'],
    ['Convergence C (T–G)', 'true and grid'],
    ['Grid declination g (G–M)', 'grid and magnetic'],
  ] as const
  const [answer, pair] = pick(names, h, n)
  return build(topic, stage, seed, n, 'identify', {
    prompt: 'Which named angle is between ' + pair + ' north?', answer,
    ...selection(answer, [
      ...names.filter(x => x[0] !== answer).map(x => [x[0], x[0] + ' describes ' + x[1] + ' north, not ' + pair + '.'] as Wrong),
      ['Reciprocal angle (180°)', 'A back bearing reverses a direction; it is not a north-reference offset.'],
    ]), explanation: 'D joins T–M; C joins T–G; g joins G–M. Diagram angles may be exaggerated.',
    inputs: { pair }, workings: ['Signed convention: g = D − C, positive when magnetic is east of grid.'],
    figure: { kind: 'north-reference', rays: [
      { ref: 'T', angle: 0 }, { ref: 'G', angle: -16 }, { ref: 'M', angle: 26 },
    ] }, figureAlt: 'Not-to-scale three-north diagram with solid TN, dotted GN and dashed MN. Do not measure it.',
  })
}
function gridMargin(topic: BearingTopicId, stage: string, seed: number, n: number, h: number): BearingFormativeCase {
  const data = pick([
    { bearing: 16, gd: 12 }, { bearing: 275, gd: -9 }, { bearing: 358, gd: 15 },
    { bearing: 7, gd: -11 }, { bearing: 123, gd: 6 }, { bearing: 338, gd: -16 },
  ], h, n)
  const from: NorthReference = (h + n) % 2 === 0 ? 'G' : 'M'
  const to: NorthReference = from === 'G' ? 'M' : 'G'
  const result = convert(data.bearing, from, to, { D: data.gd, C: 0 })
  const answer = formatBearing(result, to)
  return build(topic, stage, seed, n, 'calculate', {
    prompt: 'Map margin: MN ' + Math.abs(data.gd) + '° ' + (data.gd > 0 ? 'east' : 'west') +
      ' of GN. Convert ' + formatBearing(data.bearing, from) + ' to ' + to + '.', answer,
    ...numericSelection(result, to, [
      [convert(data.bearing, from, to, { D: -data.gd, C: 0 }), 'Sign error: preserve east-positive grid declination.'],
      [data.bearing, 'No conversion: grid and magnetic have different north origins.'],
      [reciprocal(result), 'A reciprocal reverses the line; this problem only converts the reference.'],
    ]), explanation: (from === 'G' ? 'M = G − g' : 'G = M + g') + ' with supplied g = ' + formatOffset(data.gd) + ': ' + answer + '.',
    inputs: { bearing: data.bearing, gd: data.gd, from, to },
    workings: ['g = ' + formatOffset(gridDeclination({ D: data.gd, C: 0 })) + '.',
      from === 'G' ? 'Subtract g from G.' : 'Add g to M.', 'Normalize: ' + answer + '.'],
  })
}
function gridComposite(topic: BearingTopicId, stage: string, seed: number, n: number, h: number): BearingFormativeCase {
  const data = pick([
    { bearing: 18, D: 13, C: -4 }, { bearing: 274, D: -11, C: 6 },
    { bearing: 357, D: 17, C: 3 }, { bearing: 6, D: -14, C: -5 },
    { bearing: 185, D: -7, C: 4 }, { bearing: 341, D: 9, C: -3 },
  ], h, n)
  const from: NorthReference = (h + n) % 2 === 0 ? 'G' : 'M'
  const to: NorthReference = from === 'G' ? 'M' : 'G'
  const offsets = { D: data.D, C: data.C }
  const forward = convert(data.bearing, from, to, offsets)
  const twoStep = stage === 'converting-a-back-bearing'
  const result = twoStep ? reciprocal(forward) : forward
  const answer = formatBearing(result, to)
  const common = numericSelection(result, to, [
    [forward, 'Conversion only: this omits the reciprocal when a return bearing is requested.'],
    [reciprocal(data.bearing), 'Reciprocal only: the north reference was never converted.'],
    [convert(data.bearing, from, to, { D: -data.D, C: -data.C }), 'Both offset signs were reversed.'],
    [convert(data.bearing, from, to, { D: data.D, C: 0 }), 'Grid convergence C was ignored.'],
    [convert(data.bearing, from, to, { D: 0, C: data.C }), 'Magnetic declination D was ignored.'],
  ])
  const intermediate = twoStep ? {
    prompt: 'Step 1: convert first. What is the forward ' + to + ' bearing?',
    answer: formatBearing(forward, to), ...numericSelection(forward, to, [
      [data.bearing, 'Original value: the north origin has not yet changed.'],
      [convert(data.bearing, from, to, { D: -data.D, C: -data.C }), 'Signed offsets were reversed.'],
      [reciprocal(forward), 'This applies the return direction too early.'],
    ]), explanation: 'Add the source offset and subtract the target offset: ' + formatBearing(forward, to) + '.',
  } : undefined
  return build(topic, stage, seed, n, twoStep ? 'two-step' : 'calculate', {
    prompt: 'D = ' + formatOffset(data.D) + '; C = ' + formatOffset(data.C) +
      '. Convert ' + formatBearing(data.bearing, from) + ' to ' + to + (twoStep ? ' and find its back bearing.' : '.'),
    answer, ...common, inputs: { ...data, from, to },
    explanation: 'Convert with source offset minus target offset: ' + formatBearing(forward, to) +
      (twoStep ? '; then reverse 180°: ' + answer + '.' : '.'),
    workings: ['g = D − C = ' + formatOffset(gridDeclination(offsets)) + '.',
      'Forward conversion: ' + formatBearing(forward, to) + '.',
      ...(twoStep ? ['Reciprocal: ' + answer + '.', 'Converting the source reciprocal gives the same result.'] : [])],
    ...(intermediate ? { intermediate } : {}),
  })
}

export function bearingFormativeCase(topicId: BearingTopicId, stageId: string, seed: number, ordinal: number): BearingFormativeCase {
  if (!Number.isSafeInteger(seed) || seed < 0 || !Number.isSafeInteger(ordinal) || ordinal < 0)
    throw new RangeError('Seed and ordinal must be non-negative safe integers.')
  if (!STAGES[topicId]?.includes(stageId)) throw new RangeError('Unknown topic/stage: ' + topicId + '/' + stageId)
  const h = hash(topicId + ':' + stageId + ':' + seed)
  if (topicId === 'cardinal-bearings') return cardinal(topicId, stageId, seed, ordinal, h)
  if (topicId === 'whole-circle-bearings') return whole(topicId, stageId, seed, ordinal, h)
  if (topicId === 'reciprocal-bearings') return reciprocalCase(topicId, stageId, seed, ordinal, h)
  if (topicId === 'north-references-declination') return ['naming-the-norths', 'signing-declination'].includes(stageId)
    ? northConcept(topicId, stageId, seed, ordinal, h) : trueMagnetic(topicId, stageId, seed, ordinal, h)
  return ['reading-north-diagrams'].includes(stageId) ? gridConcept(topicId, stageId, seed, ordinal, h)
    : stageId === 'using-the-map-margin' ? gridMargin(topicId, stageId, seed, ordinal, h)
      : gridComposite(topicId, stageId, seed, ordinal, h)
}
