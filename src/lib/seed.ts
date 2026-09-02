import type { Library, Topic } from './types'

const NATO = [
  'Alfa', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel',
  'India', 'Juliett', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa',
  'Quebec', 'Romeo', 'Sierra', 'Tango', 'Uniform', 'Victor', 'Whiskey',
  'X-ray', 'Yankee', 'Zulu',
]

const day = 86_400_000
const ago = (days: number) => new Date(Date.now() - days * day).toISOString()

export function seedLibrary(): Library {
  const topics: Topic[] = [
    {
      id: 'nato-phonetic',
      title: 'NATO phonetic alphabet',
      scope: 'The 26 letters A to Z and their code words. Nothing else.',
      track: 'learning',
      items: NATO.map((word, i) => ({
        prompt: String.fromCharCode(65 + i),
        answer: word,
      })),
      status: 'drilled',
      createdAt: ago(64),
      drilledAt: ago(34),
      learningAt: ago(60),
      completedAt: null,
      lastTestedAt: ago(34),
      spotCheckedAt: null,
      history: [
        { at: ago(60), correct: 21, total: 26, resolvedTo: 'learning' },
        { at: ago(34), correct: 26, total: 26, resolvedTo: 'drilled' },
      ],
    },
    {
      id: 'ooda-loop',
      title: 'OODA loop',
      scope: 'The four stages in order, and what each one does.',
      track: 'learning',
      items: [
        { prompt: 'Stage 1', answer: 'Observe' },
        { prompt: 'Stage 2', answer: 'Orient' },
        { prompt: 'Stage 3', answer: 'Decide' },
        { prompt: 'Stage 4', answer: 'Act' },
      ],
      status: 'learning',
      createdAt: ago(12),
      drilledAt: null,
      learningAt: ago(3),
      completedAt: null,
      lastTestedAt: ago(3),
      spotCheckedAt: null,
      history: [{ at: ago(3), correct: 3, total: 4, resolvedTo: 'learning' }],
    },
    {
      id: 'primary-survey',
      title: 'Primary survey',
      scope: 'The five ABCDE steps in assessment order.',
      track: 'survival',
      items: [
        { prompt: 'A', answer: 'Airway' },
        { prompt: 'B', answer: 'Breathing' },
        { prompt: 'C', answer: 'Circulation' },
        { prompt: 'D', answer: 'Disability' },
        { prompt: 'E', answer: 'Exposure' },
      ],
      status: 'unstarted',
      createdAt: ago(2),
      drilledAt: null,
      learningAt: null,
      completedAt: null,
      lastTestedAt: null,
      spotCheckedAt: null,
      history: [],
    },
    {
      id: 'cardinal-bearings',
      title: 'Cardinal and intercardinal bearings',
      scope: 'The eight compass points and their degree values.',
      track: 'tradecraft',
      items: [
        { prompt: 'North', answer: '0' },
        { prompt: 'Northeast', answer: '45' },
        { prompt: 'East', answer: '90' },
        { prompt: 'Southeast', answer: '135' },
        { prompt: 'South', answer: '180' },
        { prompt: 'Southwest', answer: '225' },
        { prompt: 'West', answer: '270' },
        { prompt: 'Northwest', answer: '315' },
      ],
      status: 'completed',
      createdAt: ago(180),
      drilledAt: ago(150),
      learningAt: ago(180),
      completedAt: ago(110),
      lastTestedAt: ago(110),
      spotCheckedAt: null,
      history: [
        { at: ago(150), correct: 8, total: 8, resolvedTo: 'drilled' },
        { at: ago(110), correct: 8, total: 8, resolvedTo: 'completed' },
      ],
    },
  ]

  return { version: 3, topics }
}
