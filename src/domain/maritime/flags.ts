/**
 * The twelve selected International Code of Signals flags of Maritime II (#148):
 * A, B, D, F, J, L, M, O, U, V, W, Y.
 *
 * Each flag is a finite, serializable design — a shape, a background and a short
 * list of plain primitives in a fixed frame — drawn deterministically. No
 * generated imagery is involved, and nothing here is a font glyph, emoji or
 * operating-system flag.
 *
 * Authority. The retained single-letter meanings are those of
 * `docs/open/ISSUE_138_MARITIME_VISUAL_LITERACY.md` §3D, an **Argus editorial
 * selection** of twelve of the International Code's prioritized single-letter
 * signals, not an official sub-code. The designs are project redraws; their
 * verification against the IMO and NGA Pub. 102 depictions is tracked per flag in
 * `flagManifest.ts`.
 */
export const FLAG_LETTERS = ['A', 'B', 'D', 'F', 'J', 'L', 'M', 'O', 'U', 'V', 'W', 'Y'] as const
export type FlagLetter = (typeof FLAG_LETTERS)[number]

export type FlagColour = 'white' | 'blue' | 'red' | 'yellow' | 'black'

/** The fixed frame every flag is drawn in. Rectangular flags are 3:2. */
export const FLAG_WIDTH = 150
export const FLAG_HEIGHT = 100

/** A swallow-tailed flag has a triangular notch cut into its fly edge. */
export const SWALLOWTAIL_NOTCH = 35

export type FlagPrimitive =
  | { type: 'rect'; x: number; y: number; width: number; height: number; fill: FlagColour }
  | { type: 'polygon'; points: [number, number][]; fill: FlagColour }
  | { type: 'line'; from: [number, number]; to: [number, number]; width: number; stroke: FlagColour }

export interface FlagDesign {
  shape: 'rectangle' | 'swallowtail'
  background: FlagColour
  primitives: FlagPrimitive[]
}

export interface SignalFlag {
  letter: FlagLetter
  /** The ITU/NATO spelling of the letter, as used elsewhere in Argus. */
  name: string
  /** The retained practical single-letter meaning (Argus editorial selection). */
  meaning: string
  /** Learn grouping: how the signal is used, not its alphabetical place. */
  group: 'warning' | 'state' | 'assistance'
  design: FlagDesign
  /** The pattern and colours in words, without naming the letter or its meaning. */
  description: string
}

const W = FLAG_WIDTH
const H = FLAG_HEIGHT

/** Diagonal bands for Yankee: parallel stripes across the flag, red on yellow. */
function yankeeStripes(): FlagPrimitive[] {
  const stripes: FlagPrimitive[] = []
  // Lines run from the lower hoist to the upper fly; the band spacing is uniform.
  const count = 5
  const step = (W + H) / count
  for (let i = 0; i < count; i += 1) {
    const offset = i * step + step / 2
    stripes.push({
      type: 'line',
      from: [offset - H, H],
      to: [offset, 0],
      // Equal red and yellow bands: the spacing along x + y is `step`, so the
      // perpendicular width of a band that covers half of it is step / (2√2).
      width: Math.round((step / (2 * Math.SQRT2)) * 100) / 100,
      stroke: 'red',
    })
  }
  return stripes
}

export const SIGNAL_FLAGS: readonly SignalFlag[] = [
  {
    letter: 'A',
    name: 'Alfa',
    meaning: 'Diver down; keep well clear and proceed slowly',
    group: 'warning',
    design: {
      shape: 'swallowtail',
      background: 'white',
      primitives: [{ type: 'rect', x: W / 2, y: 0, width: W / 2, height: H, fill: 'blue' }],
    },
    description: 'A swallow-tailed flag divided vertically: white at the hoist (left), blue at the fly (right).',
  },
  {
    letter: 'B',
    name: 'Bravo',
    meaning: 'Taking in, discharging or carrying dangerous goods',
    group: 'warning',
    design: { shape: 'swallowtail', background: 'red', primitives: [] },
    description: 'A plain red swallow-tailed flag.',
  },
  {
    letter: 'D',
    name: 'Delta',
    meaning: 'Keep clear; vessel manoeuvring with difficulty',
    group: 'warning',
    design: {
      shape: 'rectangle',
      background: 'yellow',
      primitives: [{ type: 'rect', x: 0, y: H / 4, width: W, height: H / 2, fill: 'blue' }],
    },
    description: 'A rectangular flag of three horizontal bands: yellow, a wider blue band, then yellow.',
  },
  {
    letter: 'F',
    name: 'Foxtrot',
    meaning: 'Vessel disabled; communicate with me',
    group: 'state',
    design: {
      shape: 'rectangle',
      background: 'white',
      primitives: [
        { type: 'polygon', points: [[W / 2, 0], [W, H / 2], [W / 2, H], [0, H / 2]], fill: 'red' },
      ],
    },
    description: 'A white rectangular flag with a large red diamond whose corners touch the middle of each edge.',
  },
  {
    letter: 'J',
    name: 'Juliett',
    meaning: 'On fire with dangerous cargo, or leaking dangerous cargo; keep well clear',
    group: 'warning',
    design: {
      shape: 'rectangle',
      background: 'blue',
      primitives: [{ type: 'rect', x: 0, y: H / 3, width: W, height: H / 3, fill: 'white' }],
    },
    description: 'A rectangular flag of three equal horizontal bands: blue, white, blue.',
  },
  {
    letter: 'L',
    name: 'Lima',
    meaning: 'You should stop your vessel immediately',
    group: 'warning',
    design: {
      shape: 'rectangle',
      background: 'yellow',
      primitives: [
        { type: 'rect', x: W / 2, y: 0, width: W / 2, height: H / 2, fill: 'black' },
        { type: 'rect', x: 0, y: H / 2, width: W / 2, height: H / 2, fill: 'black' },
      ],
    },
    description: 'A rectangular flag in four quarters: yellow and black on the top row, black and yellow on the bottom row.',
  },
  {
    letter: 'M',
    name: 'Mike',
    meaning: 'My vessel is stopped and making no way through the water',
    group: 'state',
    design: {
      shape: 'rectangle',
      background: 'blue',
      primitives: [
        { type: 'line', from: [0, 0], to: [W, H], width: 22, stroke: 'white' },
        { type: 'line', from: [0, H], to: [W, 0], width: 22, stroke: 'white' },
      ],
    },
    description: 'A blue rectangular flag with a white diagonal cross (saltire) from corner to corner.',
  },
  {
    letter: 'O',
    name: 'Oscar',
    meaning: 'Man overboard',
    group: 'state',
    design: {
      shape: 'rectangle',
      background: 'yellow',
      primitives: [{ type: 'polygon', points: [[0, 0], [W, H], [0, H]], fill: 'red' }],
    },
    description: 'A rectangular flag divided by a diagonal from its upper hoist corner to its lower fly corner: red in the lower-left triangle, yellow in the upper-right triangle.',
  },
  {
    letter: 'U',
    name: 'Uniform',
    meaning: 'You are running into danger',
    group: 'warning',
    design: {
      shape: 'rectangle',
      background: 'white',
      primitives: [
        { type: 'rect', x: 0, y: 0, width: W / 2, height: H / 2, fill: 'red' },
        { type: 'rect', x: W / 2, y: H / 2, width: W / 2, height: H / 2, fill: 'red' },
      ],
    },
    description: 'A rectangular flag in four quarters: red and white on the top row, white and red on the bottom row.',
  },
  {
    letter: 'V',
    name: 'Victor',
    meaning: 'Assistance required',
    group: 'assistance',
    design: {
      shape: 'rectangle',
      background: 'white',
      primitives: [
        { type: 'line', from: [0, 0], to: [W, H], width: 22, stroke: 'red' },
        { type: 'line', from: [0, H], to: [W, 0], width: 22, stroke: 'red' },
      ],
    },
    description: 'A white rectangular flag with a red diagonal cross (saltire) from corner to corner.',
  },
  {
    letter: 'W',
    name: 'Whiskey',
    meaning: 'Medical assistance required',
    group: 'assistance',
    design: {
      shape: 'rectangle',
      background: 'red',
      primitives: [
        { type: 'rect', x: 25, y: 17, width: 100, height: 66, fill: 'white' },
        { type: 'rect', x: 50, y: 33, width: 50, height: 34, fill: 'blue' },
      ],
    },
    description: 'A rectangular flag of three nested rectangles: red outside, then white, then a blue rectangle in the centre.',
  },
  {
    letter: 'Y',
    name: 'Yankee',
    meaning: 'Vessel is dragging anchor',
    group: 'state',
    design: { shape: 'rectangle', background: 'yellow', primitives: yankeeStripes() },
    description: 'A rectangular flag of diagonal stripes alternating yellow and red.',
  },
]

export function flagByLetter(letter: FlagLetter): SignalFlag {
  return SIGNAL_FLAGS.find((flag) => flag.letter === letter)!
}

/** The outline of a flag in the frame, as SVG polygon points. */
export function flagOutline(shape: FlagDesign['shape']): [number, number][] {
  return shape === 'swallowtail'
    ? [[0, 0], [W, 0], [W - SWALLOWTAIL_NOTCH, H / 2], [W, H], [0, H]]
    : [[0, 0], [W, 0], [W, H], [0, H]]
}

/** The answer text for an item: letter, name and retained meaning. */
export function flagAnswer(flag: SignalFlag): string {
  return `${flag.letter} (${flag.name}) — ${flag.meaning}`
}

/** The deliberately designed confusion sets of the research note §3D. */
export const FLAG_CONFUSION_SETS: readonly FlagLetter[][] = [
  ['D', 'F', 'M'],
  ['U', 'V', 'W'],
  ['B', 'J'],
  ['L', 'M'],
  ['A', 'O'],
]
