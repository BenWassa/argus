/**
 * Copy material beyond single words: phrases, sentences, numbers and
 * punctuation, generated from templates.
 *
 * A template grammar rather than free generation, and every slot is typed, so
 * a place only ever fills a place and a portable thing only ever fills
 * something you can carry. That is what keeps the output plain English that
 * someone might actually send, rather than word salad — the same reason the
 * word corpus is authored. The generator only supplies the variety.
 *
 * Deliberately no CW abbreviations or Q-codes, for the reason `corpus.ts`
 * gives: operating practice is a separate competency.
 */

type Pick = <T>(list: readonly T[]) => T

/** `n` different entries, so a list never reads "THE MAP, THE KEY AND THE MAP". */
function distinct<T>(pick: Pick, list: readonly T[], n: number): T[] {
  const out: T[] = []
  while (out.length < Math.min(n, list.length)) {
    const next = pick(list.filter((entry) => !out.includes(entry)))
    out.push(next)
  }
  return out
}

const PEOPLE = [
  'MY FRIEND', 'THE PILOT', 'THE CAPTAIN', 'THE DOCTOR', 'MY SISTER', 'MY BROTHER',
  'THE GUARD', 'OUR TEAM', 'THE DRIVER', 'MY FATHER', 'MY MOTHER', 'THE TEACHER',
] as const

const PLACES = [
  'LAKE', 'RIVER', 'GATE', 'HOUSE', 'BRIDGE', 'STATION', 'GARDEN', 'MARKET',
  'HARBOR', 'BEACH', 'CORNER', 'HOTEL', 'OFFICE', 'CAMP', 'FARM', 'SHOP',
] as const

const THINGS = [
  'MAP', 'KEY', 'LAMP', 'BOOK', 'RADIO', 'BAG', 'COAT', 'CUP', 'BOX', 'PEN',
  'ROPE', 'BELL', 'LETTER', 'CAMERA', 'JACKET', 'TICKET',
] as const

const THING_ADJECTIVES = ['OLD', 'NEW', 'RED', 'BLUE', 'SMALL', 'BIG', 'GREEN', 'HEAVY', 'BLACK', 'SPARE'] as const

const ANIMALS = ['DOG', 'CAT', 'FOX', 'OWL', 'HORSE', 'DEER', 'BIRD', 'HAWK', 'GOAT', 'DUCK'] as const

const TIMES = [
  'TODAY', 'TONIGHT', 'AT NOON', 'AT DAWN', 'THIS MORNING', 'TOMORROW',
  'THIS EVENING', 'AFTER LUNCH', 'BEFORE DARK', 'NEXT WEEK',
] as const

const TRAVEL = ['WALK', 'DRIVE', 'RIDE', 'GO', 'RUN'] as const

const NEAR = ['NEAR', 'BY', 'BEHIND', 'PAST'] as const

const SKY = [
  'THE WIND IS STRONG', 'THE SEA IS CALM', 'THE SKY IS CLEAR', 'THE ROAD IS WET',
  'THE NIGHT IS COLD', 'THE RIVER IS HIGH', 'THE AIR IS WARM', 'THE SNOW IS DEEP',
] as const

const ACTIONS = [
  'OPEN THE DOOR', 'CLOSE THE GATE', 'READ THE MAP', 'CALL ME BACK', 'WAIT FOR ME',
  'TURN LEFT', 'TURN RIGHT', 'GO NORTH', 'HEAD WEST', 'STAY HERE', 'SLOW DOWN',
  'LOOK UP', 'COME HOME', 'SEND HELP', 'HOLD ON', 'KEEP GOING', 'LIGHT THE FIRE',
  'PACK THE BAG', 'FIND THE KEY', 'WATCH THE SKY',
] as const

const PLURALS = [
  'BOATS', 'DOGS', 'CUPS', 'KEYS', 'MAPS', 'BOOKS', 'HORSES', 'BIRDS', 'MILES',
  'DAYS', 'HOURS', 'TRUCKS', 'TENTS', 'BAGS', 'MEN', 'SHIPS',
] as const

/** Two or three words that belong together. */
const PHRASE_TEMPLATES: ((pick: Pick) => string)[] = [
  (pick) => pick(ACTIONS),
  (pick) => `THE ${pick(THING_ADJECTIVES)} ${pick(THINGS)}`,
  (pick) => `AT THE ${pick(PLACES)}`,
  (pick) => `${pick(THING_ADJECTIVES)} ${pick(THINGS)}`,
  (pick) => `${pick(NEAR)} THE ${pick(PLACES)}`,
  (pick) => `SEE YOU ${pick(TIMES)}`,
  (pick) => `${article(pick(ANIMALS))} ${pick(NEAR)} THE ${pick(PLACES)}`,
]

const CONTAINERS = ['BAG', 'BOX', 'CAR', 'TENT', 'BOAT'] as const

const SENTENCE_TEMPLATES: ((pick: Pick) => string)[] = [
  (pick) => `${pick(PEOPLE)} IS AT THE ${pick(PLACES)}`,
  (pick) => `MEET ME AT THE ${pick(PLACES)} ${pick(TIMES)}`,
  (pick) => `${pick(SKY)} ${pick(TIMES)}`,
  (pick) => {
    const thing = pick(THINGS)
    return `THE ${thing} IS IN THE ${pick(CONTAINERS.filter((container) => container !== thing))}`
  },
  (pick) => `WE WILL ${pick(TRAVEL)} TO THE ${pick(PLACES)} ${pick(TIMES)}`,
  (pick) => `${pick(PEOPLE)} SAW ${article(pick(ANIMALS))} ${pick(NEAR)} THE ${pick(PLACES)}`,
  (pick) => `PLEASE BRING THE ${pick(THING_ADJECTIVES)} ${pick(THINGS)}`,
  (pick) => `${pick(PEOPLE)} HAS THE ${pick(THINGS)}`,
  (pick) => `I LEFT THE ${pick(THINGS)} AT THE ${pick(PLACES)}`,
  (pick) => distinct(pick, ACTIONS, 2).join(' AND '),
  (pick) => `THE ${pick(ANIMALS)} RAN ${pick(NEAR)} THE ${pick(PLACES)}`,
]

function article(noun: string): string {
  return /^[AEIOU]/.test(noun) ? `AN ${noun}` : `A ${noun}`
}

function digits(random: () => number, length: number): string {
  let out = ''
  for (let at = 0; at < length; at += 1) out += String(Math.floor(random() * 10))
  return out
}

/** A small number that reads naturally in a sentence: 2–12, never a leading zero. */
function count(random: () => number): string {
  return String(2 + Math.floor(random() * 11))
}

function hour(random: () => number): string {
  return String(1 + Math.floor(random() * 12))
}

/**
 * Numbers practice: a bare figure group most of the time, because a group has
 * no context to guess from, and otherwise a figure inside a short phrase.
 */
const NUMBER_TEMPLATES: ((pick: Pick, random: () => number) => string)[] = [
  (_pick, random) => digits(random, 1),
  (_pick, random) => digits(random, 2),
  (_pick, random) => digits(random, 3),
  (_pick, random) => digits(random, 4),
  (pick, random) => `${count(random)} ${pick(PLURALS)}`,
  (_pick, random) => `ROOM ${1 + Math.floor(random() * 9)}${digits(random, 2)}`,
  (pick, random) => `AT ${hour(random)} ${pick(['AM', 'PM'])}`,
  (_pick, random) => `${count(random)} DEGREES`,
]

/** Sentences that need figures and the four beginner punctuation marks. */
const MIXED_TEMPLATES: ((pick: Pick, random: () => number) => string)[] = [
  (pick, random) => `MEET ME AT THE ${pick(PLACES)} AT ${hour(random)} PM.`,
  (pick) => `IS THE ${pick(THINGS)} AT THE ${pick(PLACES)}?`,
  (pick) => `WHERE IS ${pick(PEOPLE)}?`,
  (pick, random) => `WE SAW ${count(random)} ${pick(PLURALS)}.`,
  (pick) => {
    const [first, second, third] = distinct(pick, THINGS, 3)
    return `BRING THE ${first}, THE ${second} AND THE ${third}.`
  },
  (_pick, random) => {
    const leaves = hour(random)
    const not = String((Number(leaves) % 12) + 1)
    return `THE TRAIN LEAVES AT ${leaves}, NOT ${not}.`
  },
  (_pick, random) => `ROOM ${1 + Math.floor(random() * 9)}${digits(random, 2)}, FLOOR ${1 + Math.floor(random() * 9)}.`,
  (pick) => `CAN YOU ${pick(ACTIONS)}?`,
  (_pick, random) => `WIND ${digits(random, 1)}${digits(random, 1)}0/${count(random)}.`,
  (_pick, random) => `ON ${1 + Math.floor(random() * 28)}/${1 + Math.floor(random() * 12)}.`,
  (pick) => `${pick(SKY)}.`,
]

function pickerFor(random: () => number): Pick {
  return (list) => list[Math.min(list.length - 1, Math.floor(random() * list.length))]
}

function uniqueFrom(
  templates: readonly ((pick: Pick, random: () => number) => string)[],
  count: number,
  random: () => number,
): string[] {
  const pick = pickerFor(random)
  const out: string[] = []
  // Bounded, so a template set too small to supply `count` distinct outputs
  // cannot spin forever; it then allows a repeat rather than hanging the run.
  for (let tries = 0; out.length < count && tries < count * 40; tries += 1) {
    const template = templates[Math.floor(random() * templates.length)]
    const text = template(pick, random)
    if (!out.includes(text) || tries >= count * 30) out.push(text)
  }
  return out
}

export function generatePhrases(count: number, random: () => number): string[] {
  return uniqueFrom(PHRASE_TEMPLATES, count, random)
}

export function generateSentences(count: number, random: () => number): string[] {
  return uniqueFrom(SENTENCE_TEMPLATES, count, random)
}

export function generateNumbers(count: number, random: () => number): string[] {
  return uniqueFrom(NUMBER_TEMPLATES, count, random)
}

export function generateMixed(count: number, random: () => number): string[] {
  return uniqueFrom(MIXED_TEMPLATES, count, random)
}
