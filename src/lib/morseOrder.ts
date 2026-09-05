import { differsOnlyInFinalElement } from './confusion'
import { MORSE_LETTERS, morsePattern, type MorseLetter } from './morse'
import { patternExtentUnits } from './morseMnemonics'

export { differsOnlyInFinalElement }

/**
 * P1 — character order, and P2 — packet composition.
 *
 * The order is *generated* from a stated rule rather than transcribed from
 * folklore, so the rule can be argued with and the sequence re-derived. See
 * `docs/MORSE_CHARACTER_ORDER.md` for the comparison against Koch and CW
 * Academy orders required by PRD §10.2. It is not official and not optimal;
 * it is a defensible order for a *printed* first boundary.
 */

export const ALL_MORSE_LETTERS = Object.keys(MORSE_LETTERS) as MorseLetter[]

/**
 * Spragg's strongest confusion family — two characters of the same length whose
 * patterns agree everywhere except the final element — is the one hard
 * constraint on packet composition. The relation itself lives in `confusion.ts`
 * with the rest of the confusion model.
 */
export function confusableWith(letter: MorseLetter): MorseLetter[] {
  const pattern = morsePattern(letter)
  return ALL_MORSE_LETTERS.filter(
    (other) => other !== letter && differsOnlyInFinalElement(pattern, morsePattern(other)),
  )
}

/** dit = 0, dah = 1, most significant element first. A stable tie-break only. */
export function patternRank(pattern: string): number {
  return Array.from(pattern).reduce((value, mark) => value * 2 + (mark === '-' ? 1 : 0), 0)
}

/**
 * Complexity-ascending candidates: fewest elements first, then shortest keying
 * time, then all-dits before all-dahs. Deterministic and independent of any
 * confusability handling, which is applied on top.
 */
export function complexityOrderedLetters(): MorseLetter[] {
  return [...ALL_MORSE_LETTERS].sort((a, b) => {
    const patternA = morsePattern(a)
    const patternB = morsePattern(b)
    return (
      patternA.length - patternB.length ||
      patternExtentUnits(patternA) - patternExtentUnits(patternB) ||
      patternRank(patternA) - patternRank(patternB) ||
      a.localeCompare(b)
    )
  })
}

function anyConfusable(candidate: MorseLetter, group: readonly MorseLetter[]): boolean {
  const pattern = morsePattern(candidate)
  return group.some((member) => differsOnlyInFinalElement(pattern, morsePattern(member)))
}

/**
 * The acquisition sequence: complexity-ascending, deferring any character that
 * would be introduced alongside a character it differs from only in its final
 * element. Deferral is minimal — a deferred character takes the first later
 * slot where the constraint holds — so the sequence stays as close to plain
 * complexity order as the constraint allows.
 */
export function buildAcquisitionOrder(novelPerPacket: number = DEFAULT_PACKET_PLAN.novel): MorseLetter[] {
  const queue = complexityOrderedLetters()
  const order: MorseLetter[] = []
  let group: MorseLetter[] = []

  while (queue.length > 0) {
    if (group.length >= novelPerPacket) group = []
    // Prefer the next candidate; fall back to the first that does not collide
    // with the pair currently forming. If every remaining candidate collides,
    // close the group early rather than break the constraint.
    let at = queue.findIndex((candidate) => !anyConfusable(candidate, group))
    if (at === -1) {
      group = []
      at = 0
    }
    const [letter] = queue.splice(at, 1)
    order.push(letter)
    group.push(letter)
  }

  return order
}

/**
 * P2 — five visible cards, two of them novel. Both values are configuration and
 * neither one defines the other: `visible` is a mobile layout decision and
 * `novel` is the acquisition load. Changing one must never silently change the
 * other, which is the failure mode PRD §10.1 warns about.
 */
export const DEFAULT_PACKET_PLAN = {
  visible: 5,
  novel: 2,
} as const

export interface PacketPlanConfig {
  /** Maximum cards shown at once. A packet may be smaller near the start. */
  visible?: number
  /** Characters seen for the first time in this packet. */
  novel?: number
  order?: MorseLetter[]
}

export interface CharacterPacket {
  index: number
  novel: MorseLetter[]
  /** Already-encoded characters returning for retrieval, least recent first. */
  review: MorseLetter[]
  /** Novel first, then review. The order cards are laid out in. */
  characters: MorseLetter[]
}

/**
 * Compose packets from the sequence. Review characters are drawn from those
 * already encoded, least recently seen first, and any character that would put
 * a final-element confusable pair on screen together is skipped — so a packet
 * can be smaller than `visible`. The constraint outranks the layout.
 */
export function buildCharacterPackets(config: PacketPlanConfig = {}): CharacterPacket[] {
  const visible = config.visible ?? DEFAULT_PACKET_PLAN.visible
  const novelPerPacket = config.novel ?? DEFAULT_PACKET_PLAN.novel
  if (!Number.isInteger(visible) || visible < 1) {
    throw new RangeError('A packet must show at least one card.')
  }
  if (!Number.isInteger(novelPerPacket) || novelPerPacket < 1) {
    throw new RangeError('A packet must introduce at least one novel character.')
  }
  if (novelPerPacket > visible) {
    throw new RangeError('A packet cannot introduce more novel characters than it shows.')
  }

  const order = config.order ?? buildAcquisitionOrder(novelPerPacket)
  const packets: CharacterPacket[] = []
  const lastSeenAt = new Map<MorseLetter, number>()

  for (let start = 0; start < order.length; start += novelPerPacket) {
    const index = packets.length
    const novel = order.slice(start, start + novelPerPacket)
    const encoded = order
      .slice(0, start)
      .sort((a, b) => (lastSeenAt.get(a) ?? -1) - (lastSeenAt.get(b) ?? -1))

    const review: MorseLetter[] = []
    for (const candidate of encoded) {
      if (review.length >= visible - novel.length) break
      if (anyConfusable(candidate, [...novel, ...review])) continue
      review.push(candidate)
    }

    const characters = [...novel, ...review]
    for (const letter of characters) lastSeenAt.set(letter, index)
    packets.push({ index, novel, review, characters })
  }

  return packets
}

/** The shipped sequence. Recorded in `docs/MORSE_CHARACTER_ORDER.md`. */
export const ACQUISITION_ORDER: MorseLetter[] = buildAcquisitionOrder()
