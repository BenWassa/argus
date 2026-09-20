import { MORSE_LETTERS, type MorseLetter } from '../code'

/**
 * The material Fluency asks with.
 *
 * The word checkpoints in Learn draw from four tiny curated sets, each
 * mechanically validated against the letters that lesson had introduced. That
 * constraint is what kept them small, and post-acquisition it dissolves: every
 * letter is available, so the corpus can be sized for variety instead of for
 * eligibility.
 *
 * It is still authored rather than generated. A generated word list produces
 * things nobody would send, and the point of a word is that the learner
 * recognises its *shape* — which only happens for words they actually know.
 *
 * Deliberately ordinary English. CW abbreviations and Q-codes belong to
 * operating practice, which is a later and separate competency; putting them
 * here would quietly turn a fluency drill into radio training.
 */

const SHORT = [
  'AND', 'ARC', 'ASK', 'BAY', 'BED', 'BIG', 'BOX', 'BUS', 'CAB', 'CAR',
  'CAT', 'COW', 'CUP', 'DAY', 'DOG', 'DRY', 'EAR', 'EAT', 'EGG', 'END',
  'EYE', 'FAR', 'FEW', 'FIT', 'FLY', 'FOG', 'FOX', 'GAS', 'GUN', 'HAT',
  'HOT', 'ICE', 'INK', 'JAR', 'JOB', 'KEY', 'LAW', 'LEG', 'MAP', 'MIX',
  'NET', 'NEW', 'OAK', 'OIL', 'OWL', 'PEN', 'PIG', 'RAIN', 'RED', 'RUN',
  'SEA', 'SKY', 'SUN', 'TEA', 'TEN', 'TIN', 'TOP', 'VAN', 'WAR', 'WAX',
  'WEB', 'WET', 'WIN', 'ZIP',
  'BLUE', 'BOAT', 'BOOK', 'CALM', 'CITY', 'COLD', 'DARK', 'DESK', 'DOOR',
  'DOWN', 'EAST', 'FAST', 'FIRE', 'FISH', 'FIVE', 'FOUR', 'GATE', 'GOLD',
  'HAND', 'HARD', 'HELP', 'HOME', 'IRON', 'JUMP', 'KEEP', 'KIND', 'LAKE',
  'LAMP', 'LAND', 'LIFE', 'LONG', 'MAIN', 'MARK', 'MILE', 'MIND', 'MOON',
  'NEAR', 'NEXT', 'NINE', 'OPEN', 'OVER', 'PATH', 'PLAN', 'RAIL', 'RISE',
  'ROAD', 'ROCK', 'ROOM', 'SALT', 'SAND', 'SHIP', 'SNOW', 'SOFT', 'STAR',
  'STOP', 'TIME', 'TREE', 'TURN', 'WALK', 'WARM', 'WAVE', 'WEST', 'WIND',
  'WOOD', 'ZONE',
] as const

const MEDIUM = [
  'ABOVE', 'AGENT', 'ALARM', 'AMBER', 'ANGLE', 'BEACH', 'BLACK', 'BLANK',
  'BOARD', 'BRAVE', 'BREAD', 'BRICK', 'BRIEF', 'CABLE', 'CHAIN', 'CHART',
  'CLEAR', 'CLIMB', 'CLOCK', 'CLOUD', 'COAST', 'COVER', 'CRISP', 'CROWD',
  'DEPTH', 'DRIFT', 'EARLY', 'EARTH', 'EIGHT', 'EMPTY', 'EQUAL', 'FIELD',
  'FIRST', 'FLAME', 'FLOOR', 'FOCUS', 'FORCE', 'FRONT', 'GLASS', 'GRASS',
  'GREEN', 'GUARD', 'HEART', 'HEAVY', 'HORSE', 'HOUSE', 'JOINT', 'JUDGE',
  'LIGHT', 'LOCAL', 'MAJOR', 'MARCH', 'METAL', 'MONTH', 'MOUTH', 'NIGHT',
  'NORTH', 'OCEAN', 'ORDER', 'PAPER', 'PILOT', 'PLACE', 'PLANE', 'POINT',
  'POWER', 'PRIZE', 'QUICK', 'QUIET', 'RADIO', 'RANGE', 'RIVER', 'ROUND',
  'ROUTE', 'SHARP', 'SHELF', 'SHORE', 'SIGNAL', 'SMOKE', 'SOLID', 'SOUND',
  'SOUTH', 'SPARK', 'SPEED', 'STAND', 'STEAM', 'STEEL', 'STONE', 'STORM',
  'TABLE', 'THREE', 'TIGER', 'TRACK', 'TRAIN', 'TRUCK', 'VALID', 'VALUE',
  'VOICE', 'WATCH', 'WATER', 'WHEAT', 'WHEEL', 'WHITE', 'WORLD', 'YOUNG',
] as const

const LONG = [
  'ANCHOR', 'ANSWER', 'BRIDGE', 'CANDLE', 'CANYON', 'CIRCLE', 'COPPER',
  'DANGER', 'DESERT', 'ENGINE', 'FOREST', 'GARDEN', 'GRAVEL', 'HARBOR',
  'ISLAND', 'JACKET', 'LADDER', 'MARKET', 'MEADOW', 'MIRROR', 'ORANGE',
  'PLANET', 'QUARRY', 'RESCUE', 'RIBBON', 'SILVER', 'SPRING', 'SQUARE',
  'STREAM', 'SUMMER', 'SUNSET', 'THUNDER', 'TIMBER', 'TUNNEL', 'VALLEY',
  'VOYAGE', 'WINDOW', 'WINTER', 'YELLOW',
  'COMPASS', 'DIAMOND', 'EVENING', 'JOURNEY', 'MORNING', 'PACKAGE',
  'QUANTUM', 'STATION', 'WEATHER',
] as const

export type WordTier = 'short' | 'medium' | 'long'

const TIERS: Record<WordTier, readonly string[]> = {
  short: SHORT,
  medium: MEDIUM,
  long: LONG,
}

/**
 * Every word, validated.
 *
 * The check is mechanical and runs at call time rather than living only in a
 * test, for the same reason `checkpoints.ts` validates its curated sets
 * against the live packet authority: an authored list is exactly the kind of
 * thing that acquires a typo and a stray apostrophe.
 */
export function fluencyWords(tier: WordTier): string[] {
  return TIERS[tier].map((word) => {
    for (const letter of word) {
      if (!(letter in MORSE_LETTERS)) {
        throw new Error(`Fluency corpus word "${word}" contains unsupported character "${letter}".`)
      }
    }
    return word
  })
}

export function allFluencyWords(): string[] {
  return [...fluencyWords('short'), ...fluencyWords('medium'), ...fluencyWords('long')]
}

export const MORSE_ALPHABET = Object.keys(MORSE_LETTERS) as MorseLetter[]

/**
 * A tiny deterministic generator.
 *
 * Fluency needs varied material across sessions but reproducible material
 * inside one, so the run is built once from a seed rather than calling
 * `Math.random` per question — which would reshuffle on every React render and
 * make the whole thing untestable. Mulberry32: small, fast, and good enough
 * for choosing letters.
 */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Pick `count` items, favouring the front of a need-ordered list without ever
 * being strictly deterministic about it.
 *
 * Straight "always take the top N by need" produces the same run twice in a
 * row and makes the drill feel like a punishment loop over the learner's four
 * worst letters. A weighted draw keeps the pressure on those letters while
 * still letting the rest of the roster appear.
 */
export function weightedSample<T>(
  ordered: readonly T[],
  count: number,
  random: () => number,
): T[] {
  const pool = [...ordered]
  const picked: T[] = []
  while (picked.length < count && pool.length > 0) {
    // Bias toward the head: squaring a uniform draw puts ~70% of picks in the
    // first half of the remaining pool.
    const index = Math.min(pool.length - 1, Math.floor(random() ** 2 * pool.length))
    picked.push(pool.splice(index, 1)[0])
  }
  return picked
}

/** A random group of `length` characters, drawn with the same head bias. */
export function buildGroup(
  needOrdered: readonly MorseLetter[],
  length: number,
  random: () => number,
): string {
  const letters: MorseLetter[] = []
  for (let at = 0; at < length; at += 1) {
    const index = Math.min(
      needOrdered.length - 1,
      Math.floor(random() ** 2 * needOrdered.length),
    )
    letters.push(needOrdered[index])
  }
  return letters.join('')
}
