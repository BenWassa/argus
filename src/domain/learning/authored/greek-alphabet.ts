import type { Curriculum, LessonStep } from '../stages'

/**
 * #325 Greek alphabet pilot. Drafted but intentionally NOT registered in
 * generatedCurriculum.ts until the owner approves the 390px interaction mock.
 *
 * Each existing scored item is capital + lowercase glyph -> English name.
 * This file does not introduce glyph production, pronunciation or word reading.
 * Authority: Unicode 18.0 Greek and Coptic nameslist
 * https://www.unicode.org/Public/18.0.0/charts/nameslist/0370/
 * Item identity: catalogSeed.ts GREEK_LETTERS, positions 01–24.
 */
interface Letter {
  ordinal: number
  forms: string
  name: string
  cue: string
}

interface Contrast {
  letters: [number, number]
  answer: number
  prompt: string
  explain: string
}

interface Packet {
  id: string
  title: string
  letters: Letter[]
  review: number[]
  contrasts: Contrast[]
  takeaway: string
}

/** Data is intentionally explicit: audit against the pre-existing catalog and Unicode. */
const PACKETS: readonly Packet[] = [
  {
    id: 'familiar-shapes', title: 'Familiar Shapes',
    letters: [
      { ordinal: 1, forms: 'Α α', name: 'Alpha', cue: 'Α resembles Latin A, but the lowercase is α.' },
      { ordinal: 2, forms: 'Β β', name: 'Beta', cue: 'Β resembles Latin B; its lowercase β is distinctive.' },
      { ordinal: 5, forms: 'Ε ε', name: 'Epsilon', cue: 'Ε resembles Latin E; the lowercase form is ε.' },
      { ordinal: 9, forms: 'Ι ι', name: 'Iota', cue: 'Ι resembles Latin I; lowercase ι is a short stroke.' },
    ],
    review: [],
    contrasts: [
      { letters: [2, 5], answer: 2, prompt: 'Which pair is Beta, not Epsilon?', explain: 'Beta is Β β; Epsilon is Ε ε. The lowercase forms distinguish them.' },
    ],
    takeaway: 'Similar-looking Latin capitals are only a starting cue. Always check the Greek small letter.',
  },
  {
    id: 'distinctive-outline', title: 'Distinctive Outlines',
    letters: [
      { ordinal: 4, forms: 'Δ δ', name: 'Delta', cue: 'Delta has a triangular capital Δ and the smaller δ.' },
      { ordinal: 11, forms: 'Λ λ', name: 'Lambda', cue: 'Lambda has capital Λ and lowercase λ; do not confuse Λ with Delta Δ.' },
      { ordinal: 16, forms: 'Π π', name: 'Pi', cue: 'Pi has a two-legged capital Π and lowercase π.' },
      { ordinal: 24, forms: 'Ω ω', name: 'Omega', cue: 'Omega has capital Ω and lowercase ω; Omicron is a different letter.' },
    ],
    review: [1, 2],
    contrasts: [
      { letters: [4, 11], answer: 11, prompt: 'Which is Lambda rather than Delta?', explain: 'Lambda is Λ λ; Delta is Δ δ, with a closed triangular capital.' },
      { letters: [16, 24], answer: 24, prompt: 'Which is Omega rather than Pi?', explain: 'Omega is Ω ω; Pi is Π π.' },
    ],
    takeaway: 'Use the pair of case forms together, not just the outline of one character.',
  },
  {
    id: 'similar-capitals', title: 'Similar Capitals',
    letters: [
      { ordinal: 3, forms: 'Γ γ', name: 'Gamma', cue: 'Γ has a right-angle outline; the small form is γ.' },
      { ordinal: 7, forms: 'Η η', name: 'Eta', cue: 'Η resembles Latin H, but η is not Latin n.' },
      { ordinal: 12, forms: 'Μ μ', name: 'Mu', cue: 'Μ resembles Latin M; small mu is μ (U+03BC).' },
      { ordinal: 13, forms: 'Ν ν', name: 'Nu', cue: 'Ν resembles Latin N; small nu is ν, not Latin v.' },
    ],
    review: [4, 11],
    contrasts: [
      { letters: [7, 13], answer: 7, prompt: 'Which pair is Eta (η), not Nu (ν)?', explain: 'Eta is Η η; Nu is Ν ν. η bends down at the end; ν forms a pointed v shape.' },
      { letters: [12, 13], answer: 13, prompt: 'Which pair has lowercase ν (Nu)?', explain: 'Nu is Ν ν; Mu is Μ μ.' },
    ],
    takeaway: 'η, μ and ν are Greek letters, not Latin n, u or v.',
  },
  {
    id: 'deceptive-lookalikes', title: 'Deceptive Lookalikes',
    letters: [
      { ordinal: 10, forms: 'Κ κ', name: 'Kappa', cue: 'Κ resembles Latin K, while κ is the small Greek form.' },
      { ordinal: 15, forms: 'Ο ο', name: 'Omicron', cue: 'Ο ο both resemble Latin O/o, but are Greek code points.' },
      { ordinal: 17, forms: 'Ρ ρ', name: 'Rho', cue: 'Ρ resembles Latin P, but this is Rho; ρ resembles Latin p.' },
      { ordinal: 19, forms: 'Τ τ', name: 'Tau', cue: 'Τ resembles Latin T; lowercase τ has a curved top stroke.' },
    ],
    review: [7, 13],
    contrasts: [
      { letters: [17, 10], answer: 17, prompt: 'Which pair is Rho (Ρ ρ)?', explain: 'Rho is Ρ ρ, despite looking like Latin P/p. Kappa is Κ κ.' },
      { letters: [15, 24], answer: 15, prompt: 'Which is Omicron, not Omega?', explain: 'Omicron is Ο ο; Omega is Ω ω.' },
    ],
    takeaway: 'Do not infer the English name of a Greek character from a similar-looking Latin letter.',
  },
  {
    id: 'easily-confused', title: 'Easily Confused',
    letters: [
      { ordinal: 6, forms: 'Ζ ζ', name: 'Zeta', cue: 'Zeta has capital Ζ, with small ζ shaped differently from Xi ξ.' },
      { ordinal: 14, forms: 'Ξ ξ', name: 'Xi', cue: 'Xi has the three-bar capital Ξ and the curved small ξ.' },
      { ordinal: 18, forms: 'Σ σ ς', name: 'Sigma', cue: 'Sigma is Σ σ; ς is the final form of lowercase sigma, not a 25th letter.' },
      { ordinal: 20, forms: 'Υ υ', name: 'Upsilon', cue: 'Upsilon is Υ υ; distinguish small υ from Nu ν.' },
    ],
    review: [13, 17],
    contrasts: [
      { letters: [6, 14], answer: 14, prompt: 'Which pair is Xi rather than Zeta?', explain: 'Xi is Ξ ξ; Zeta is Ζ ζ.' },
      { letters: [13, 20], answer: 20, prompt: 'Which pair is Upsilon rather than Nu?', explain: 'Upsilon is Υ υ; Nu is Ν ν. The small forms υ and ν can look close.' },
    ],
    takeaway: 'Sigma has three common forms (Σ, σ, ς) but is one of the 24 letters.',
  },
  {
    id: 'finish-and-mix', title: 'Finish And Mix',
    letters: [
      { ordinal: 8, forms: 'Θ θ', name: 'Theta', cue: 'Theta has a line through its oval: Θ θ.' },
      { ordinal: 21, forms: 'Φ φ', name: 'Phi', cue: 'Phi has a vertical line through its oval: Φ φ.' },
      { ordinal: 22, forms: 'Χ χ', name: 'Chi', cue: 'Χ resembles Latin X, but the name of the Greek letter is Chi.' },
      { ordinal: 23, forms: 'Ψ ψ', name: 'Psi', cue: 'Psi has a centre stem between two arms: Ψ ψ.' },
    ],
    review: [14, 18],
    contrasts: [
      { letters: [8, 21], answer: 21, prompt: 'Which pair is Phi, not Theta?', explain: 'Phi is Φ φ with a vertical stroke; Theta is Θ θ with a horizontal stroke.' },
      { letters: [22, 23], answer: 23, prompt: 'Which is Psi rather than Chi?', explain: 'Psi is Ψ ψ with a central stem; Chi is Χ χ, an X-like pair.' },
    ],
    takeaway: 'Review all six packets voluntarily; the existing optional Test still covers only glyph pair to English name.',
  },
]

export const greekLessonLetters: readonly Letter[] = PACKETS.flatMap(packet => packet.letters)
const byOrdinal = new Map(greekLessonLetters.map(letter => [letter.ordinal, letter]))
const itemId = (ordinal: number) => `greek-alphabet-item-${String(ordinal).padStart(2, '0')}`

function choose(letter: Letter, id: string, distractors: readonly Letter[]): LessonStep {
  // A source-bound four-tile objective response; the runner applies its own fixed shuffle.
  const options = [letter.name, ...distractors.filter(other => other.ordinal !== letter.ordinal).slice(0, 3).map(other => other.name)]
  if (options.length !== 4) throw new Error(`Greek options are incomplete for ${id}`)
  return {
    id, kind: 'choose', itemId: itemId(letter.ordinal),
    prompt: `Which English name matches ${letter.forms}?`,
    options, answer: letter.name,
    explain: `${letter.forms} is ${letter.name}. ${letter.cue}`,
  }
}

export const greekAlphabetCurriculum: Curriculum = {
  stages: PACKETS.map(packet => {
    const steps: LessonStep[] = []
    // Show an entire small packet before querying its items: avoid immediate answer copying.
    for (const letter of packet.letters) steps.push({
      id: `${packet.id}-show-${letter.ordinal}`, kind: 'show', itemId: itemId(letter.ordinal),
      title: `${letter.forms} — ${letter.name}`, body: letter.cue,
    })
    for (const letter of packet.letters) steps.push(choose(
      letter, `${packet.id}-choose-${letter.ordinal}`, packet.letters,
    ))
    for (const ordinal of packet.review) {
      const letter = byOrdinal.get(ordinal)!
      steps.push(choose(letter, `${packet.id}-review-${ordinal}`, [letter, ...packet.letters.slice(0, 3)]))
    }
    for (const contrast of packet.contrasts) steps.push({
      id: `${packet.id}-contrast-${contrast.answer}`, kind: 'contrast',
      itemIds: contrast.letters.map(itemId), answerItemId: itemId(contrast.answer),
      prompt: contrast.prompt, explain: contrast.explain,
    })
    steps.push({ id: `${packet.id}-summary`, kind: 'summary', text: packet.takeaway })
    steps.push({
      id: `${packet.id}-checkpoint`, kind: 'checkpoint',
      itemIds: [...packet.letters.map(letter => itemId(letter.ordinal)), ...packet.review.map(itemId)],
    })
    return { id: packet.id, title: packet.title, steps }
  }),
}
