import type { Curriculum, LessonStep } from '../stages'
import { flagTopic } from '../../maritime/flagTopic'
import { flagAnswer, flagByLetter, type FlagLetter } from '../../maritime/flags'

/**
 * #296 authored curriculum for Signal Flags (#148). NOT registered until the
 * owner/reviewer approval is recorded (see ISSUE_296_AUTHORED_LESSONS.md).
 *
 * Source boundary: the twelve shipped signal-flags items, their keys and
 * geometry-only stimulus text, and the topic's own Learn text (meanings, design
 * descriptions, "Pairs that get mixed up", limitations). Every meaning, option,
 * alt text and design cue is read from the shipped topic at module load, so it
 * cannot drift from the scored bank. Nothing outside the topic is taught.
 *
 * Every question about a flag is a `choose` or a `checkpoint` on that flag's own
 * item, so the picture is always on screen. A `contrast` step shows no figure
 * (its tiles carry item prompts), so none is used; a look-alike pair is a
 * two- or three-option choose about the pictured flag instead.
 */
const items = flagTopic().items

function item(letter: FlagLetter) {
  const found = items.find((candidate) => {
    const source = candidate.stimulus?.source
    return source?.kind === 'figure' && source.figure.kind === 'signal-flag'
      && source.figure.letter === letter
  })
  if (!found?.id || !found.stimulus) throw new Error(`Missing flag item ${letter}`)
  return { id: found.id, answer: found.answer, alt: found.stimulus.alt, options: found.choice?.options ?? [] }
}

const slug = (letter: FlagLetter) => letter.toLowerCase()
const answerOf = (letter: FlagLetter) => flagAnswer(flagByLetter(letter))

/** What to look for, from the topic's own design text; used after a second miss. */
function cue(letters: FlagLetter[]): string {
  return letters.map((letter) => `Flag ${letter}: ${flagByLetter(letter).description}`).join(' ')
}

const PICK = 'Which flag is this, and what does it mean?'

/** A show then a four-option choose, the shipped options reordered answer-first. */
function introduce(letter: FlagLetter, sibling: FlagLetter): LessonStep[] {
  const scored = item(letter)
  const flag = flagByLetter(letter)
  return [
    {
      id: `flags-show-${slug(letter)}`, kind: 'show', itemId: scored.id,
      title: `${letter} (${flag.name})`, body: flag.meaning, altText: scored.alt,
    },
    {
      id: `flags-choose-${slug(letter)}`, kind: 'choose', itemId: scored.id,
      prompt: PICK, answer: scored.answer,
      options: [scored.answer, ...scored.options.filter((option) => option !== scored.answer)],
      explain: cue([letter, sibling]),
    },
  ]
}

/** A look-alike pair or trio, asked about the pictured flag; the answer is first. */
function compare(id: string, letter: FlagLetter, others: FlagLetter[], prompt: string): LessonStep {
  const scored = item(letter)
  return {
    id, kind: 'choose', itemId: scored.id, prompt,
    answer: scored.answer, options: [letter, ...others].map(answerOf),
    explain: cue([letter, ...others]),
  }
}

const idsOf = (letters: FlagLetter[]) => letters.map((letter) => item(letter).id)

export const signalFlagsCurriculum: Curriculum = {
  stages: [
    {
      id: 'serious-signals', title: 'Serious Signals',
      steps: [
        ...introduce('A', 'O'), ...introduce('B', 'J'), ...introduce('O', 'A'),
        compare('flags-serious-compare-o', 'O', ['A'], 'Which flag is this?'),
        { id: 'flags-serious-summary', kind: 'summary', text: 'A: diver down. B: dangerous goods. O: man overboard.' },
        { id: 'flags-serious-check', kind: 'checkpoint', itemIds: idsOf(['A', 'B', 'O']) },
      ],
    },
    {
      id: 'danger-and-assistance', title: 'Danger and Assistance',
      steps: [
        ...introduce('U', 'V'), ...introduce('V', 'W'), ...introduce('W', 'V'),
        compare('flags-assist-compare-u', 'U', ['V', 'W'], 'Which flag is this?'),
        { id: 'flags-assist-summary', kind: 'summary', text: 'U: danger. V: assistance. W: medical assistance.' },
        { id: 'flags-assist-check', kind: 'checkpoint', itemIds: idsOf(['U', 'V', 'W']) },
      ],
    },
    {
      id: 'difficulty-disabled-stopped', title: 'Difficulty, Disabled and Stopped',
      steps: [
        ...introduce('D', 'F'), ...introduce('F', 'D'), ...introduce('M', 'F'),
        compare('flags-state-compare-d', 'D', ['F', 'M'], 'Which flag is this?'),
        {
          id: 'flags-state-summary', kind: 'summary',
          text: 'D: manoeuvring with difficulty. F: disabled. M: stopped and making no way.',
        },
        { id: 'flags-state-check', kind: 'checkpoint', itemIds: idsOf(['D', 'F', 'M']) },
      ],
    },
    {
      id: 'fire-stop-and-anchor', title: 'Fire, Stop and Anchor',
      steps: [
        ...introduce('J', 'B'), ...introduce('L', 'M'), ...introduce('Y', 'F'),
        compare('flags-rest-compare-j', 'J', ['B'], 'Which flag is this?'),
        compare('flags-rest-compare-l', 'L', ['M'], 'Which flag is this?'),
        {
          id: 'flags-rest-summary', kind: 'summary',
          text: 'J: fire with dangerous cargo, or leaking it. L: tells another vessel to stop. Y: dragging anchor.',
        },
        { id: 'flags-rest-check', kind: 'checkpoint', itemIds: idsOf(['J', 'L', 'Y']) },
      ],
    },
    {
      id: 'all-twelve', title: 'All Twelve',
      steps: [
        {
          id: 'flags-all-show', kind: 'show', title: 'Compare the Patterns',
          body: 'Compare bands, diamond and cross for D, F and M. Compare quarters, cross and nested rectangles for U, V and W.',
        },
        compare('flags-all-compare-f', 'F', ['D', 'M'], 'Which flag is this?'),
        compare('flags-all-compare-w', 'W', ['V', 'U'], 'Which flag is this?'),
        compare('flags-all-compare-b', 'B', ['J'], 'Which flag is this?'),
        compare('flags-all-compare-m', 'M', ['L'], 'Which flag is this?'),
        compare('flags-all-compare-o', 'O', ['A'], 'Which flag is this?'),
        {
          id: 'flags-all-summary', kind: 'summary',
          text: 'Recognition only. The published Code governs.',
        },
        { id: 'flags-all-check', kind: 'checkpoint', itemIds: items.map((scored) => scored.id!) },
      ],
    },
  ],
}
