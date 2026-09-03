import type { Library, Topic } from './types'

const NATO = [
  'Alfa', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel',
  'India', 'Juliett', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa',
  'Quebec', 'Romeo', 'Sierra', 'Tango', 'Uniform', 'Victor', 'Whiskey',
  'X-ray', 'Yankee', 'Zulu',
]

const BEARINGS = [
  ['North', '0°'],
  ['Northeast', '45°'],
  ['East', '90°'],
  ['Southeast', '135°'],
  ['South', '180°'],
  ['Southwest', '225°'],
  ['West', '270°'],
  ['Northwest', '315°'],
] as const

const day = 86_400_000
const ago = (days: number) => new Date(Date.now() - days * day).toISOString()

export function seedLibrary(): Library {
  const topics: Topic[] = [
    {
      id: 'nato-phonetic',
      title: 'NATO phonetic alphabet',
      scope: 'The 26 letters A to Z and their official NATO code words, tested letter → code word.',
      track: 'learning',
      items: NATO.map((word, i) => ({
        prompt: String.fromCharCode(65 + i),
        answer: word,
      })),
      learn: {
        kind: 'concise',
        overview: 'The NATO spelling alphabet assigns one standardized code word to each letter so letters can be distinguished more reliably in voice communication. The official spellings include Alfa and Juliett.',
        sources: [
          {
            label: 'NATO — The NATO phonetic alphabet',
            url: 'https://www.nato.int/en/about-us/nato-history/history-by-theme/symbols-of-nato/nato-phonetic-alphabet',
            note: 'Official NATO reference for the 26 code words, spellings and standardization history.',
          },
        ],
      },
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
      scope: 'The four OODA stages in order and each stage’s core function. Nothing beyond those four stage/function pairs is scored.',
      track: 'learning',
      items: [
        {
          prompt: 'Stage 1 — name and core function',
          answer: 'Observe — notice unfolding circumstances, outside information, and interaction with the environment.',
        },
        {
          prompt: 'Stage 2 — name and core function',
          answer: 'Orient — interpret observations through analysis and synthesis shaped by experience, culture, heritage, and new information.',
        },
        {
          prompt: 'Stage 3 — name and core function',
          answer: 'Decide — select a course of action as a hypothesis to test.',
        },
        {
          prompt: 'Stage 4 — name and core function',
          answer: 'Act — carry out the decision as a test; results feed back into subsequent observation and orientation.',
        },
      ],
      learn: {
        kind: 'briefing',
        overview: 'John Boyd’s final OODA sketch is a feedback-rich model of adaptation, not merely four boxes connected in a circle. Observation supplies changing information; orientation interprets it; a decision is a hypothesis; action tests that hypothesis; results and new circumstances feed the process again.',
        sections: [
          {
            heading: 'The four functions',
            blocks: [
              {
                type: 'definitions',
                items: [
                  {
                    term: 'Observe',
                    definition: 'Take in unfolding circumstances, outside information, and the effects of interaction with the environment.',
                  },
                  {
                    term: 'Orient',
                    definition: 'Make sense of observations through analysis and synthesis, filtered by factors such as previous experience, cultural traditions, genetic heritage, and new information.',
                  },
                  {
                    term: 'Decide',
                    definition: 'Choose a course of action: in Boyd’s model, a hypothesis about what should happen next.',
                  },
                  {
                    term: 'Act',
                    definition: 'Execute the decision as a test. What happens becomes new information for further observation and orientation.',
                  },
                ],
              },
            ],
          },
          {
            heading: 'Relationships that matter',
            blocks: [
              {
                type: 'bullets',
                items: [
                  'Orientation is not a neutral sorting step: it is shaped by prior experience and inherited or learned frames as well as fresh information.',
                  'Decision and action form a hypothesis/test pair. The value of action includes the information produced by its outcome.',
                  'Feedback and feed-forward links make the model iterative and partly concurrent rather than a rigid stop-start sequence.',
                  'Boyd’s sketch includes implicit guidance and control from orientation toward observation and action, so not every familiar situation requires a fresh explicit decision box before behavior changes.',
                ],
              },
            ],
          },
          {
            heading: 'Common simplification',
            blocks: [
              {
                type: 'paragraph',
                text: 'The familiar four-arrow circle is useful as a mnemonic for order, but it is not Boyd’s full model. The published appendix to A Discourse on Winning and Losing explicitly describes that simple circular version as a gross oversimplification because it drops the feedback, feed-forward, orientation inputs, and implicit guidance shown in Boyd’s final sketch. “Run the loop faster” is therefore incomplete: adaptation depends on how accurately the situation is observed and oriented as well as on tempo.',
              },
            ],
          },
        ],
        caseStudies: [
          {
            title: 'Service incident under uncertainty',
            scenario: 'Minutes after a software deployment, an operations team sees rising checkout failures, but the dashboards disagree about which service is responsible. The objective is to restore reliable checkout without blindly reversing unrelated changes.',
            analysis: [
              {
                heading: 'Trace the whole loop',
                blocks: [
                  {
                    type: 'paragraph',
                    text: 'The team first gathers current error rates, traces, deploy diffs, customer reports, and signs of downstream failure. Those observations do not dictate an answer by themselves. The team orients them using the system architecture, known dependencies, experience from earlier incidents, and the possibility that a familiar failure pattern may be misleading. It forms a bounded hypothesis: one newly changed checkout dependency is causing the failures. The decision is to canary a rollback of that dependency rather than reverse the entire release. The rollback is the test. Error rates fall but do not fully recover, creating new observations that force a revised orientation: the deployment exposed a second capacity problem. A second hypothesis and action follow from the changed picture.',
                  },
                ],
              },
              {
                heading: 'Why the second cycle matters',
                blocks: [
                  {
                    type: 'paragraph',
                    text: 'The first action is not “completion” of the loop. Its result changes the evidence available and can invalidate the orientation that produced it. The useful habit is repeated re-observation and re-orientation as reality answers each test, rather than defending the first diagnosis because a decision was already made.',
                  },
                ],
              },
            ],
            takeaway: 'OODA is a model for continuous adaptation under changing information: observe and orient well, treat decisions as testable hypotheses, learn from action, and update the next cycle.',
          },
        ],
        limitations: [
          'OODA is a conceptual model, not a guarantee of good decisions. Boyd’s full sketch is richer than the four labels tested here.',
          'Argus Test intentionally covers only the four stages in order and each stage’s core function. Implicit guidance, competitive strategy, tempo, and the wider theory remain explanatory context rather than completion requirements.',
        ],
        sources: [
          {
            label: 'Air University Press — A Discourse on Winning and Losing, John R. Boyd',
            url: 'https://www.airuniversity.af.edu/AUPress/Display/Article/1528758/a-discourse-on-winning-and-losing/',
            note: 'Published primary-quality edition; Appendix reproduces Boyd’s final OODA-loop sketch and explains its feedback, feed-forward, hypothesis/test and non-linear character.',
          },
          {
            label: 'U.S. Marine Corps Officer Candidates School — Academic Preparation Guide',
            url: 'https://www.ocs.marines.mil/Portals/243/Docs/Candidates/Academic%20Prep%20Guide.pdf',
            note: 'Current military training cross-check for Observe, Orient, Decide, Act and the continuous-feedback framing.',
          },
        ],
      },
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
      scope: 'The five ABCDE headings in assessment order — Airway, Breathing, Circulation, Disability, Exposure. Test covers the headings and order only.',
      track: 'survival',
      items: [
        { prompt: 'Step 1 (A)', answer: 'Airway' },
        { prompt: 'Step 2 (B)', answer: 'Breathing' },
        { prompt: 'Step 3 (C)', answer: 'Circulation' },
        { prompt: 'Step 4 (D)', answer: 'Disability' },
        { prompt: 'Step 5 (E)', answer: 'Exposure' },
      ],
      learn: {
        kind: 'briefing',
        overview: 'ABCDE is a structured priority sequence for the initial assessment of a seriously unwell or deteriorating person. The finite Argus boundary is deliberately narrower than clinical practice: remember the five headings and their order; use Learn only to understand why the sequence exists.',
        sections: [
          {
            heading: 'Operating principles',
            blocks: [
              {
                type: 'bullets',
                items: [
                  'Complete an initial ABCDE assessment and reassess regularly, especially after an intervention or a change in condition.',
                  'Identify and address life-threatening problems before moving to the next part of the assessment, within your training and local protocol.',
                  'Assess the effect of what was done and call for appropriate help early rather than treating ABCDE as a checklist to finish before escalation.',
                ],
              },
            ],
          },
          {
            heading: 'What the headings focus attention on',
            blocks: [
              {
                type: 'table',
                columns: ['Heading', 'Assessment focus'],
                rows: [
                  ['A — Airway', 'Whether the airway is open and whether there are signs of obstruction.'],
                  ['B — Breathing', 'Whether breathing is adequate and whether immediately life-threatening breathing problems are present.'],
                  ['C — Circulation', 'Circulation and perfusion, including major bleeding or other immediately threatening circulatory problems.'],
                  ['D — Disability', 'A rapid neurological assessment, including level of consciousness; ABC causes of deterioration must remain in mind.'],
                  ['E — Exposure', 'Further examination as needed while preserving dignity and minimizing heat loss.'],
                ],
              },
            ],
          },
          {
            heading: 'Priority sequence, not checklist completion',
            blocks: [
              {
                type: 'paragraph',
                text: 'The point of the sequence is priority. A life-threatening problem found at an early step is managed or escalated according to the responder’s training before simply proceeding down the alphabet, and the response to management is reassessed. ABCDE organizes the first pass; it does not replace diagnosis, definitive treatment, or continuing reassessment.',
              },
            ],
          },
        ],
        caseStudies: [
          {
            title: 'Deterioration during supervised clinical care',
            scenario: 'A trained clinical team is called because a patient has suddenly become less responsive and looks acutely unwell. This case illustrates sequence and reassessment only; it intentionally omits treatment techniques, thresholds, doses, and diagnosis.',
            analysis: [
              {
                heading: 'Use the sequence as a priority frame',
                blocks: [
                  {
                    type: 'paragraph',
                    text: 'The team starts with Airway rather than jumping to the most visually striking symptom. It then assesses Breathing and finds a serious abnormality. Appropriate help is called and the breathing problem is managed within training and local protocol before the team simply moves on. Breathing is reassessed to see whether the response changed the situation. The team then continues through Circulation, Disability, and Exposure. If the patient changes again, the sequence is repeated from the top because earlier priorities may have changed.',
                  },
                ],
              },
              {
                heading: 'What the case is meant to teach',
                blocks: [
                  {
                    type: 'paragraph',
                    text: 'ABCDE supplies an order for finding immediate threats and a discipline of reassessment. It does not make an untrained person clinically competent, and completing E does not mean the patient is fully assessed or treated.',
                  },
                ],
              },
            ],
            takeaway: 'Remember the order, prioritize immediate threats, reassess, and escalate appropriately; detailed clinical actions belong to formal training and current protocols, not this Test boundary.',
          },
        ],
        limitations: [
          'Argus supports memory and rehearsal only. This topic is not first-aid or clinical training, a credential, or a substitute for supervised practice and current local protocols.',
          'Detailed examination techniques, treatment thresholds, interventions, medications, population-specific modifications, CPR algorithms, and diagnosis are outside the Test boundary.',
          'In a real emergency or clinical deterioration, seek appropriate emergency or clinical help and act within your training and current local guidance.',
        ],
        sources: [
          {
            label: 'Resuscitation Council UK — First Aid Guidelines 2025',
            url: 'https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/first-aid-guidelines',
            note: 'Current official first-aid guidance supporting a structured ABCDE approach, early help and acting within training.',
          },
          {
            label: 'Resuscitation Council UK — The ABCDE Approach',
            url: 'https://www.resus.org.uk/library/abcde-approach',
            note: 'Official structured ABCDE reference, updated July 2024, supporting the sequence, treatment of life-threatening problems before progression, reassessment and the meaning of each heading.',
          },
        ],
      },
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
      scope: 'The eight cardinal/intercardinal compass points as clockwise bearings from north, using 0° for north.',
      track: 'tradecraft',
      items: BEARINGS.map(([prompt, answer]) => ({ prompt, answer })),
      learn: {
        kind: 'concise',
        overview: 'Bearings are measured clockwise from north. The eight cardinal/intercardinal points are spaced by 45°. This Test uses 0° for north; 360° represents the same direction after a full turn but is outside the chosen eight-value boundary.',
        sources: [
          {
            label: 'NOAA — Navigation Training Manual',
            url: 'https://repository.library.noaa.gov/view/noaa/42218/noaa_42218_DS1.pdf',
            note: 'Official navigation training reference for clockwise degree bearings and the cardinal/intercardinal values.',
          },
        ],
      },
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

  return { version: 4, topics }
}
