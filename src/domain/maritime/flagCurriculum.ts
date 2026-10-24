import type { ContrastStep, Curriculum, LessonStep } from '../learning/stages'
import { flagTopic } from './flagTopic'
import { flagByLetter, type FlagLetter } from './flags'

// Draft: source-bounded recognition content, pending human domain review.
const items = flagTopic().items

function item(letter: FlagLetter) {
  const found = items.find((candidate) => {
    const source = candidate.stimulus?.source
    return source?.kind === 'figure' && source.figure.kind === 'signal-flag'
      && source.figure.letter === letter
  })
  if (!found?.id || !found.choice || !found.stimulus) throw new Error(`Missing flag item ${letter}`)
  return { ...found, id: found.id, choice: found.choice, stimulus: found.stimulus }
}

const distinctions = {
  A: 'A means diver down; O means man overboard.',
  B: 'B concerns dangerous goods; J concerns fire with dangerous cargo or a dangerous-cargo leak.',
  O: 'O means man overboard; A means diver down.',
  U: 'U means danger; V means assistance; W means medical assistance.',
  V: 'V means assistance; W means medical assistance; U means danger.',
  W: 'W means medical assistance; V means assistance; U means danger.',
  D: 'D means manoeuvring with difficulty; F means disabled; M means stopped and making no way.',
  F: 'F means disabled; D means manoeuvring with difficulty; M means stopped and making no way.',
  M: 'M describes your own stopped vessel; L tells another vessel to stop.',
  J: 'J concerns fire with dangerous cargo or a dangerous-cargo leak; B concerns dangerous goods.',
  L: 'L tells another vessel to stop; M describes your own stopped vessel.',
  Y: 'Y means dragging anchor; F means disabled; M means stopped and making no way.',
} satisfies Record<FlagLetter, string>

function introduce(letter: FlagLetter): LessonStep[] {
  const scored = item(letter)
  const flag = flagByLetter(letter)
  return [
    {
      id: `show-${letter.toLowerCase()}`, kind: 'show', itemId: scored.id,
      title: `${letter} (${flag.name})`, body: flag.meaning, altText: scored.stimulus.alt,
    },
    {
      id: `choose-${letter.toLowerCase()}`, kind: 'choose', itemId: scored.id,
      prompt: scored.prompt, options: [...scored.choice.options], answer: scored.answer,
      explain: distinctions[letter],
    },
  ]
}

function contrast(id: string, letters: FlagLetter[], answer: FlagLetter): ContrastStep {
  return {
    id, kind: 'contrast', itemIds: letters.map((letter) => item(letter).id),
    prompt: flagByLetter(answer).meaning, answerItemId: item(answer).id,
    explain: distinctions[answer],
  }
}

export const flagCurriculum: Curriculum = {
  stages: [
    {
      id: 'serious-signals', title: 'Serious Signals',
      steps: [...introduce('A'), ...introduce('B'), ...introduce('O')],
    },
    {
      id: 'look-alikes-i', title: 'Look-Alikes I',
      steps: [...introduce('U'), ...introduce('V'), ...introduce('W'),
        contrast('contrast-u-v-w', ['U', 'V', 'W'], 'U')],
    },
    {
      id: 'look-alikes-ii', title: 'Look-Alikes II',
      steps: [...introduce('D'), ...introduce('F'), ...introduce('M'),
        contrast('contrast-d-f-m', ['D', 'F', 'M'], 'D')],
    },
    {
      id: 'the-rest', title: 'The Rest',
      steps: [...introduce('J'), ...introduce('L'), ...introduce('Y'),
        contrast('contrast-j-b', ['J', 'B'], 'J'),
        contrast('contrast-l-m', ['L', 'M'], 'L')],
    },
    {
      id: 'all-twelve', title: 'All Twelve',
      steps: [
        { id: 'checkpoint-all-twelve', kind: 'checkpoint', itemIds: items.map((scored) => scored.id!) },
        contrast('checkpoint-d-f-m', ['D', 'F', 'M'], 'F'),
        contrast('checkpoint-u-v-w', ['U', 'V', 'W'], 'W'),
        contrast('checkpoint-b-j', ['B', 'J'], 'B'),
        contrast('checkpoint-l-m', ['L', 'M'], 'M'),
        contrast('checkpoint-a-o', ['A', 'O'], 'O'),
      ],
    },
  ],
}
