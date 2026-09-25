import type { Topic } from './topic'
import type { Library } from './library'

const NATO = [
  'Alfa', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel',
  'India', 'Juliett', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa',
  'Quebec', 'Romeo', 'Sierra', 'Tango', 'Uniform', 'Victor', 'Whiskey',
  'X-ray', 'Yankee', 'Zulu',
]

const MORSE_A_TO_Z = [
  ['A', '.-'], ['B', '-...'], ['C', '-.-.'], ['D', '-..'], ['E', '.'],
  ['F', '..-.'], ['G', '--.'], ['H', '....'], ['I', '..'], ['J', '.---'],
  ['K', '-.-'], ['L', '.-..'], ['M', '--'], ['N', '-.'], ['O', '---'],
  ['P', '.--.'], ['Q', '--.-'], ['R', '.-.'], ['S', '...'], ['T', '-'],
  ['U', '..-'], ['V', '...-'], ['W', '.--'], ['X', '-..-'], ['Y', '-.--'],
  ['Z', '--..'],
] as const

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

/** ISED RIC-21 §5.3, spellings and hyphenation exactly as printed. */
const RADIOTELEPHONY_NUMBERS = [
  ['0', 'ZE-RO'], ['1', 'WUN'], ['2', 'TOO'], ['3', 'TREE'], ['4', 'FOW-er'],
  ['5', 'FIFE'], ['6', 'SIX'], ['7', 'SEV-en'], ['8', 'AIT'], ['9', 'NIN-er'],
  ['Decimal', 'DAY-SEE-MAL'], ['Hundred', 'HUN-dred'], ['Thousand', 'TOU-SAND'],
] as const

/** BIPM SI Brochure, 9th ed., Table 7, largest to smallest. Micro is µ as printed. */
const SI_PREFIXES = [
  ['10³⁰', 'quetta (Q)'], ['10²⁷', 'ronna (R)'], ['10²⁴', 'yotta (Y)'], ['10²¹', 'zetta (Z)'],
  ['10¹⁸', 'exa (E)'], ['10¹⁵', 'peta (P)'], ['10¹²', 'tera (T)'], ['10⁹', 'giga (G)'],
  ['10⁶', 'mega (M)'], ['10³', 'kilo (k)'], ['10²', 'hecto (h)'], ['10¹', 'deca (da)'],
  ['10⁻¹', 'deci (d)'], ['10⁻²', 'centi (c)'], ['10⁻³', 'milli (m)'], ['10⁻⁶', 'micro (µ)'],
  ['10⁻⁹', 'nano (n)'], ['10⁻¹²', 'pico (p)'], ['10⁻¹⁵', 'femto (f)'], ['10⁻¹⁸', 'atto (a)'],
  ['10⁻²¹', 'zepto (z)'], ['10⁻²⁴', 'yocto (y)'], ['10⁻²⁷', 'ronto (r)'], ['10⁻³⁰', 'quecto (q)'],
] as const

/**
 * Unicode Greek and Coptic block, U+0391–U+03A9 and U+03B1–U+03C9 in code-point
 * (alphabetical) order. Sigma carries its final form, U+03C2.
 */
const GREEK_LETTERS = [
  ['Α α', 'Alpha'], ['Β β', 'Beta'], ['Γ γ', 'Gamma'], ['Δ δ', 'Delta'], ['Ε ε', 'Epsilon'],
  ['Ζ ζ', 'Zeta'], ['Η η', 'Eta'], ['Θ θ', 'Theta'], ['Ι ι', 'Iota'], ['Κ κ', 'Kappa'],
  ['Λ λ', 'Lambda'], ['Μ μ', 'Mu'], ['Ν ν', 'Nu'], ['Ξ ξ', 'Xi'], ['Ο ο', 'Omicron'],
  ['Π π', 'Pi'], ['Ρ ρ', 'Rho'], ['Σ σ ς', 'Sigma'], ['Τ τ', 'Tau'], ['Υ υ', 'Upsilon'],
  ['Φ φ', 'Phi'], ['Χ χ', 'Chi'], ['Ψ ψ', 'Psi'], ['Ω ω', 'Omega'],
] as const

/** RFC 4648 §8: the Base 16 alphabet, each digit standing for one four-bit group. */
const HEX_DIGITS = '0123456789ABCDEF'

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
      id: 'international-morse-letters-printed',
      title: 'International Morse — Letters (printed)',
      scope: 'Can independently recall all A–Z printed Morse mappings in both directions.',
      track: 'learning',
      items: MORSE_A_TO_Z.map(([prompt, answer], index) => ({
        id: `international-morse-letters-printed-item-${String(index + 1).padStart(2, '0')}`,
        kind: 'bidirectional' as const,
        prompt,
        answer,
      })),
      learn: {
        kind: 'concise',
        overview: 'International Morse represents letters as sequences of dits (.) and dahs (-). A dah lasts three dit units; spacing within a character is one unit, between characters three, and between words seven. Completion requires uncued printed recall in both directions: letter → canonical pattern and printed pattern → letter. It does not claim auditory reception, sending, WPM, words, phrases, or operating fluency.',
        sections: [
          {
            heading: 'How the lesson works',
            blocks: [
              {
                type: 'paragraph',
                text: 'Learn is a guided lesson rather than a page to scroll. Each lesson introduces two new characters, asks you to retrieve them shortly afterwards, reteaches anything you miss and brings it back later, and mixes in characters from earlier lessons. Support falls away as you get a character right and comes back when you do not. A lesson finishes when every character in it has been produced from the letter alone.',
              },
              {
                type: 'paragraph',
                text: 'The order runs from the shortest patterns upward, and two characters that differ only in their final element are never introduced together. Nothing in the lesson is scored: it decides what you are shown next and nothing else. The Morse alphabet page is separate, always open, and lists all 26 letters for lookup.',
              },
              {
                type: 'paragraph',
                text: 'Every drawing is that character’s own timing rather than a picture to decode: a dit is one unit wide, a dah is three, and the gap between them is one. Read the rhythm left to right, in the order it is keyed, and let the letter and its shape settle as a single thing.',
              },
            ],
          },
        ],
        sources: [
          {
            label: 'ITU-R M.1677-1 — International Morse code',
            url: 'https://www.itu.int/rec/R-REC-M.1677-1-200910-I/en',
            note: 'In-force ITU recommendation; Annex 1 defines the A–Z signals and canonical 1:3:7 timing relationships.',
          },
        ],
      },
      status: 'unstarted',
      createdAt: ago(0),
      drilledAt: null,
      learningAt: null,
      completedAt: null,
      lastTestedAt: null,
      spotCheckedAt: null,
      history: [],
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
    {
      id: 'scuba-equipment-abbreviations',
      title: 'Recreational scuba equipment abbreviations',
      scope: 'Six common recreational-scuba equipment abbreviations — SCUBA, BCD, SPG, LPI, DSMB and DPV — and each term’s core reference function. Test does not cover equipment selection, setup, inspection, maintenance, dive planning or diving procedures.',
      track: 'learning',
      items: [
        { prompt: 'SCUBA', answer: 'Self-contained underwater breathing apparatus — equipment that lets a diver breathe underwater from a carried gas supply.' },
        { prompt: 'BCD', answer: 'Buoyancy control device — the buoyancy bladder/system that helps a diver control buoyancy and commonly holds the cylinder.' },
        { prompt: 'SPG', answer: 'Submersible pressure gauge — an instrument that displays the pressure, and therefore remaining gas, in a cylinder.' },
        { prompt: 'LPI', answer: 'Low-pressure inflator — the hose and fitting that supplies low-pressure gas from a regulator to inflate a BCD.' },
        { prompt: 'DSMB', answer: 'Delayed surface marker buoy — an inflatable surface-signalling buoy deployed from underwater.' },
        { prompt: 'DPV', answer: 'Diver propulsion vehicle — a powered device used to propel a diver through the water.' },
      ],
      learn: {
        kind: 'concise',
        overview: 'These abbreviations label common recreational-scuba equipment and accessories. They are a vocabulary boundary only: knowing their expansions and broad functions does not establish that equipment is suitable, correctly assembled, inspected, maintained or safe to use.',
        limitations: [
          'Argus supports memory and rehearsal only. This topic is not diver training, certification, a pre-dive checklist, equipment-maintenance instruction or a substitute for a qualified instructor, dive professional, manufacturer manual or local dive operator.',
          'Equipment configuration, gas planning, buoyancy skills, emergency response, ascent decisions, servicing intervals and site-specific procedures are outside the Test boundary.',
        ],
        sources: [
          {
            label: 'PADI — What does SCUBA stand for?',
            url: 'https://blog.padi.com/what-does-scuba-stand-for/',
            note: 'Industry training reference for SCUBA, BCD, low-pressure inflator, regulator-system components and alternate-air-source terminology.',
          },
          {
            label: 'PADI — SPG (Submersible Pressure Gauges)',
            url: 'https://www.padi.com/gear/spgs',
            note: 'Reference for the SPG expansion and its cylinder-pressure/remaining-gas role.',
          },
          {
            label: 'BSAC — Annual Diving Incident Report 2024, abbreviations',
            url: 'https://www.bsac.com/document/bsac-diving-incidents-report-2024/1bsac-annual-incident-report-2024.pdf',
            note: 'National diving-club reference for BCD, DSMB and DPV expansions.',
          },
        ],
      },
      status: 'unstarted',
      createdAt: ago(0),
      drilledAt: null,
      learningAt: null,
      completedAt: null,
      lastTestedAt: null,
      spotCheckedAt: null,
      history: [],
    },
    {
      id: 'radiotelephony-numbers',
      title: 'Radiotelephony numbers',
      scope: 'The spoken forms of the digits 0–9 and of decimal, hundred and thousand, as printed for Canadian aeronautical radio in ISED RIC-21. Tested number → spoken form. How numbers are grouped on air and radio procedure are not scored.',
      track: 'learning',
      items: RADIOTELEPHONY_NUMBERS.map(([prompt, answer]) => ({ prompt, answer })),
      learn: {
        kind: 'concise',
        overview: 'Formal radiotelephony gives each digit a fixed spoken form — TREE, FIFE and NIN-er rather than three, five and nine — and set words for the decimal point, hundreds and thousands. These are the forms Innovation, Science and Economic Development Canada prints for aeronautical radio, right after the phonetic alphabet — the same code words as the NATO topic.',
        sections: [
          {
            heading: 'How numbers are said on air',
            blocks: [
              {
                type: 'bullets',
                items: [
                  'Every number except a whole thousand is said one digit at a time: 75 is “seven five”, and 5,800 is “five eight zero zero”.',
                  'A whole thousand is the digits of the thousands followed by “thousand”: 11,000 is “one one thousand”.',
                  'A decimal point is said as “decimal”: 121.5 is “one two one decimal five”.',
                  'RIC-21 sets further conventions for altitudes, flight levels, headings, wind, time and aircraft types. Those, and these grouping rules, are not scored here.',
                ],
              },
            ],
          },
        ],
        limitations: [
          'Completion means you can recall these 13 spoken forms. It is not a radio operator certificate, radio training or permission to transmit.',
          'The forms are sourced to Canadian aeronautical radiotelephony. Marine, amateur, public-safety and other radio services publish their own procedures, which this topic does not cover.',
        ],
        sources: [
          {
            label: 'ISED — RIC-21, Study Guide for the Restricted Operator Certificate With Aeronautical Qualification',
            url: 'https://ised-isde.canada.ca/site/spectrum-management-telecommunications/en/official-publications/information/radiocom-information-circulars-ric/ric-21-study-guide-restricted-operator-certificate-aeronautical-qualification',
            note: 'Government of Canada study guide (dated 2011-07-12). §5.3 prints the spoken forms of 0–9 and of decimal, hundred and thousand; §5.4 sets how numbers are transmitted.',
          },
        ],
      },
      status: 'unstarted',
      createdAt: ago(0),
      drilledAt: null,
      learningAt: null,
      completedAt: null,
      lastTestedAt: null,
      spotCheckedAt: null,
      history: [],
    },
    {
      id: 'si-prefixes',
      title: 'SI prefixes',
      scope: 'All 24 SI prefixes, from 10³⁰ to 10⁻³⁰: each power of ten → the prefix’s name and symbol, as listed in Table 7 of the BIPM SI Brochure. Unit conversion and the rules for writing quantities are not scored.',
      track: 'learning',
      items: SI_PREFIXES.map(([prompt, answer]) => ({ prompt, answer })),
      learn: {
        kind: 'concise',
        overview: 'An SI prefix multiplies a unit by a power of ten: a kilometre is 10³ metres and a picosecond is 10⁻¹² seconds. The BIPM lists 24 prefixes, from quetta (10³⁰) down to quecto (10⁻³⁰). The outermost two at each end — ronna and quetta, ronto and quecto — were added in 2022.',
        sections: [
          {
            heading: 'Patterns that carry most of the load',
            blocks: [
              {
                type: 'bullets',
                items: [
                  'Above kilo and below milli, each prefix is a step of 10³. Only hecto, deca, deci and centi sit between 10³ and 10⁻³, one power of ten apart.',
                  'Symbols are case-sensitive. Apart from da, h and k, every multiple has an upper-case symbol and every sub-multiple a lower-case one, so M (mega) and m (milli), P (peta) and p (pico), Z and z, Y and y, R and r, Q and q are different prefixes.',
                  'Deca is the only two-letter symbol (da). Micro is the Greek letter mu (µ).',
                  'Prefix names are written in lower case, and a prefix symbol joins its unit symbol with no space: pm, mmol, GΩ, THz.',
                ],
              },
            ],
          },
        ],
        limitations: [
          'Completion means you can give the name and symbol for each of the 24 powers of ten. The reverse (symbol → power), unit conversion and the SI rules for writing quantities are not tested.',
          'SI prefixes are strictly powers of ten. The binary prefixes used for computer memory — kibi (Ki) for 2¹⁰, mebi (Mi) for 2²⁰ and so on — are a separate IEC set and are not part of this topic.',
        ],
        sources: [
          {
            label: 'BIPM — The International System of Units (SI Brochure), 9th edition',
            url: 'https://www.bipm.org/en/publications/si-brochure',
            note: 'Version 4.01, June 2026. Chapter 3, Table 7 lists the 24 prefixes with names and symbols and states the case rule; Appendix 1 records the 27th CGPM (2022) decision adding ronna, ronto, quetta and quecto.',
          },
        ],
      },
      status: 'unstarted',
      createdAt: ago(0),
      drilledAt: null,
      learningAt: null,
      completedAt: null,
      lastTestedAt: null,
      spotCheckedAt: null,
      history: [],
    },
    {
      id: 'greek-alphabet',
      title: 'Greek alphabet',
      scope: 'The 24 letters of the Greek alphabet: each letter’s capital and small forms → its English name. Tested letter → name. Writing a letter from its name, pronunciation and reading Greek are not scored.',
      track: 'learning',
      items: GREEK_LETTERS.map(([prompt, answer]) => ({ prompt, answer })),
      learn: {
        kind: 'concise',
        overview: 'The Greek alphabet has 24 letters. Mathematics, science and engineering borrow most of them as symbols, usually in the small form — π, λ, σ, μ, Δ — so seeing a letter and naming it is the everyday need. That is the direction this topic tests.',
        sections: [
          {
            heading: 'Where letters are easy to confuse',
            blocks: [
              {
                type: 'bullets',
                items: [
                  'Many capitals share their shape with Latin letters — Α, Β, Ε, Ζ, Η, Ι, Κ, Μ, Ν, Ο, Ρ, Τ, Υ, Χ — so the small form is usually what identifies the letter.',
                  'Some small forms look like Latin letters with other names: η (eta) is not n, ν (nu) is not v, ρ (rho) is not p, χ (chi) is not x, and ω (omega) is not w.',
                  'ζ (zeta) and ξ (xi) are easily swapped, and so are ν (nu) and υ (upsilon).',
                  'Sigma has two small forms: σ, and ς, the final sigma written at the end of a word.',
                ],
              },
            ],
          },
        ],
        limitations: [
          'Completion means you can name each letter when you see it. Writing a letter from its name is not tested, and knowing the letters is not reading, writing or speaking Greek.',
          'The names are the conventional English ones used in mathematics and science, not a guide to Greek pronunciation. The order below is alphabetical but is not scored.',
        ],
        sources: [
          {
            label: 'Unicode — Greek and Coptic code chart (Unicode 18.0)',
            url: 'https://www.unicode.org/charts/PDF/U0370.pdf',
            note: 'Encodes the 24 capital (U+0391–U+03A9) and small (U+03B1–U+03C9) letters in alphabetical order with their names, including final sigma (U+03C2); gives lambda as the usual name of the character Unicode names LAMDA.',
          },
        ],
      },
      status: 'unstarted',
      createdAt: ago(0),
      drilledAt: null,
      learningAt: null,
      completedAt: null,
      lastTestedAt: null,
      spotCheckedAt: null,
      history: [],
    },
    {
      id: 'hex-digits-binary',
      title: 'Hexadecimal digits in binary',
      scope: 'The 16 hexadecimal digits 0–F: each digit → its four-bit binary pattern, 0000 to 1111. Tested hex → binary. Converting longer numbers and binary arithmetic are not scored.',
      track: 'learning',
      items: [...HEX_DIGITS].map((digit, value) => ({
        prompt: digit,
        answer: value.toString(2).padStart(4, '0'),
      })),
      learn: {
        kind: 'concise',
        overview: 'One hexadecimal digit stands for exactly four bits, so a byte is always two hex digits: C3 is 1100 0011. Knowing the 16 patterns by heart turns hex dumps, bit masks and colour codes into bits without counting.',
        sections: [
          {
            heading: 'Reading a pattern from its place values',
            blocks: [
              {
                type: 'bullets',
                items: [
                  'The four bits are worth 8, 4, 2 and 1 from left to right. Add the places that hold a 1: 1011 is 8 + 2 + 1 = 11, which is B.',
                  'The letters A to F stand for the values 10 to 15. Upper and lower case mean the same digit.',
                  'Anchors that make the rest quick: 1, 2, 4 and 8 are the single-bit patterns (0001, 0010, 0100, 1000); 7 is 0111 and F is 1111.',
                ],
              },
            ],
          },
        ],
        limitations: [
          'Completion means you can give the four-bit pattern for each of the 16 hex digits. Binary → hex, longer numbers, signed representations and binary arithmetic are not tested.',
        ],
        sources: [
          {
            label: 'IETF — RFC 4648, The Base16, Base32, and Base64 Data Encodings, §8',
            url: 'https://www.rfc-editor.org/rfc/rfc4648#section-8',
            note: 'Standard Base 16 (hex) encoding: each character represents 4 bits, and the alphabet maps the values 0–15 to 0–9 and A–F. The four-bit patterns are those values written in binary.',
          },
        ],
      },
      status: 'unstarted',
      createdAt: ago(0),
      drilledAt: null,
      learningAt: null,
      completedAt: null,
      lastTestedAt: null,
      spotCheckedAt: null,
      history: [],
    },
  ]

  return {
    version: 5,
    topics: topics.map((topic) => ({
      ...topic,
      items: topic.items.map((item, index) => ({
        id: item.id ?? `${topic.id}-item-${String(index + 1).padStart(2, '0')}`,
        kind: item.kind ?? 'forward',
        prompt: item.prompt,
        answer: item.answer,
      })),
      itemEvidence: topic.itemEvidence ?? {},
      lessonProgress: topic.lessonProgress ?? {},
    })),
  }
}
