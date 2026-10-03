import type { Topic } from './topic'
import type { Library } from './library'
import { bearingTopics } from '../navigation/bearingTopics'
import { maritimeTopics } from '../maritime/maritimeTopics'
import { flagTopic } from '../maritime/flagTopic'
import { cloudTopic } from './cloudTopic'
import { beaufortVisualGuide } from './weatherVisuals'

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

/**
 * Environment and Climate Change Canada's Beaufort table, except force 12: ECCC
 * prints 64–71 knots, but WMO hurricane force is force 12 or over, unbounded.
 */
const BEAUFORT = [
  ['Force 0', 'Calm — less than 1 knot'],
  ['Force 1', 'Light air — 1–3 knots'],
  ['Force 2', 'Light breeze — 4–6 knots'],
  ['Force 3', 'Gentle breeze — 7–10 knots'],
  ['Force 4', 'Moderate breeze — 11–16 knots'],
  ['Force 5', 'Fresh breeze — 17–21 knots'],
  ['Force 6', 'Strong breeze — 22–27 knots'],
  ['Force 7', 'Near gale — 28–33 knots'],
  ['Force 8', 'Gale — 34–40 knots'],
  ['Force 9', 'Strong gale — 41–47 knots'],
  ['Force 10', 'Storm — 48–55 knots'],
  ['Force 11', 'Violent storm — 56–63 knots'],
  ['Force 12', 'Hurricane — 64 knots or more'],
] as const

/** ECCC's observed effects at sea, forces 0–12. Supporting cues; not scored. */
const BEAUFORT_AT_SEA = [
  'Sea surface like a mirror, but not necessarily flat.',
  'Ripples with the appearance of scales are formed, but without foam crests.',
  'Small wavelets, still short but more pronounced. Crests do not break. When visibility good, horizon line always very clear.',
  'Large wavelets. Crests begin to break. Foam of glassy appearance. Perhaps scattered whitecaps.',
  'Small waves, becoming longer. Fairly frequent whitecaps.',
  'Moderate waves, taking a more pronounced long form. Many whitecaps are formed. Chance of some spray.',
  'Large waves begin to form. The white foam crests are more extensive everywhere. Probably some spray.',
  'Sea heaps up and white foam from breaking waves begins to be blown in streaks along the direction of the wind.',
  'Moderately high waves of greater length. Edges of crests begin to break into the spindrift. The foam is blown in well-marked streaks along the direction of the wind.',
  'High waves. Dense streaks of foam along the direction of the wind. Crests of waves begin to topple, tumble and roll over. Spray may affect visibility.',
  'Very high waves with long overhanging crests. Dense white streaks of foam. Surface of the sea takes a white appearance. The tumbling of the sea becomes heavy and shock-like. Visibility affected.',
  'Exceptionally high waves. Sea completely covered with long white patches of foam. Visibility affected.',
  'Air filled with foam and spray. Sea entirely white with foam. Visibility seriously impaired.',
] as const

/** ECCC's observed effects on land, forces 0–12. Supporting cues; not scored. */
const BEAUFORT_ON_LAND = [
  'Smoke rises vertically.',
  'Direction of wind shown by smoke drift, but not wind vanes.',
  'Wind felt on face. Leaves rustle. Ordinary vane moved by wind.',
  'Leaves and small twigs in constant motion. Wind extends light flag.',
  'Raises dust and loose paper. Small branches are moved.',
  'Small trees with leaves begin to sway. Crested wavelets form on inland waters.',
  'Large branches in motion. Whistling heard in telephone wires. Umbrellas used with difficulty.',
  'Whole trees in motion. Inconvenience felt in walking against wind.',
  'Breaks twigs off trees. Generally impedes progress. Walking into wind almost impossible.',
  'Slight structural damage occurs, e.g. roofing shingles may become loose or blow off.',
  'Trees uprooted. Considerable structural damage occurs.',
  'Widespread damage.',
  'Rare. Severe widespread damage to vegetation and significant structural damage possible.',
] as const

const BEAUFORT_FORCE_12_NOTE =
  'Environment and Climate Change Canada’s table prints 64–71 knots for force 12. The World Meteorological Organization treats hurricane force as Beaufort force 12 or over, with no upper limit, and the Met Office gives 64 knots or more, so Argus tests force 12 as 64 knots or more.'

/**
 * RCMP CFSC Student Handbook (5th ed., 2014): ACTS as on p. 21, PROVE as in
 * §3.1.7 Table 4. Order is the acronym order and is part of the claim.
 */
const ACTS_PROVE = [
  ['ACTS 1 (A)', 'Assume every firearm is loaded.'],
  ['ACTS 2 (C)', 'Control the muzzle direction at all times.'],
  ['ACTS 3 (T)', 'Trigger finger must be kept off the trigger and out of the trigger guard.'],
  ['ACTS 4 (S)', 'See that the firearm is unloaded — PROVE it safe.'],
  ['PROVE 1 (P)', 'Point the firearm in the safest available direction.'],
  ['PROVE 2 (R)', 'Remove all ammunition.'],
  ['PROVE 3 (O)', 'Observe the chamber.'],
  ['PROVE 4 (V)', 'Verify the feeding path.'],
  ['PROVE 5 (E)', 'Examine the bore for obstructions.'],
] as const

const day = 86_400_000
const ago = (days: number) => new Date(Date.now() - days * day).toISOString()

export function seedLibrary(): Library {
  const topics: Topic[] = [
    {
      id: 'nato-phonetic',
      title: 'NATO Alphabet',
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
      title: 'International Morse Code',
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
        overview: 'Morse dits (.) last one unit, dahs (-) three. Gaps within characters, between characters and between words last 1, 3, 7 units.',
        sections: [
          {
            heading: 'How the lesson works',
            blocks: [
              {
                type: 'paragraph',
                text: 'Lessons introduce two characters, then mix retrieval with earlier ones. Misses return with teaching support; correct retrieval removes support. Finish by producing every lesson character from its letter alone.',
              },
              {
                type: 'paragraph',
                text: 'Shortest patterns come first; characters differing only at the final element are introduced separately. Lessons are unscored. The separate alphabet page lists all 26 letters.',
              },
              {
                type: 'paragraph',
                text: 'Drawings show timing left to right: dit width 1, dah width 3, internal gap 1.',
              },
            ],
          },
        ],
        limitations: [
          'Completion covers uncued printed A–Z recall in both directions; not listening, sending, WPM, words, phrases or operating fluency.',
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
      sequence: { groups: [{ label: 'OODA', letters: 'OODA', itemIds: ['ooda-loop-item-01', 'ooda-loop-item-02', 'ooda-loop-item-03', 'ooda-loop-item-04'] }] },
      title: 'OODA Loop',
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
        overview: 'Boyd’s model of adaptation: observe, orient, decide, act, with each result feeding the next cycle.',
        sections: [
          {
            heading: 'How the stages connect',
            blocks: [
              {
                type: 'bullets',
                items: [
                  'Orientation is shaped by prior experience, culture and heritage as well as fresh information.',
                  'A decision is a hypothesis; action is the test, and its result is new information.',
                  'Feedback runs between all the stages, so they overlap rather than run stop-start.',
                  'Orientation can steer action directly (implicit guidance), so not every response needs a fresh decision.',
                ],
              },
            ],
          },
          {
            heading: 'The circle is a simplification',
            blocks: [
              {
                type: 'paragraph',
                text: 'The four-arrow circle is a mnemonic for order. Boyd’s full sketch adds feedback, feed-forward and implicit guidance. “Run the loop faster” is incomplete: accurate observation and orientation matter as much as tempo.',
              },
            ],
          },
        ],
        caseStudies: [
          {
            title: 'Service incident under uncertainty',
            scenario: 'After a deployment, checkout failures rise and the dashboards disagree about which service is at fault.',
            analysis: [
              {
                heading: 'Walkthrough',
                blocks: [
                  {
                    type: 'paragraph',
                    text: 'The team gathers error rates, traces and deploy diffs, reads them against the architecture and past incidents, and hypothesises one changed dependency. It canaries a rollback of that dependency only. Errors fall but not fully, so the team re-orients: the deployment also exposed a capacity problem. A second cycle follows.',
                  },
                ],
              },
            ],
            takeaway: 'The first action is a test, not the end: re-observe and re-orient as each result arrives.',
          },
        ],
        limitations: [
          'OODA is a conceptual model, not a guarantee of good decisions; Boyd’s full sketch is richer than the four labels tested.',
          'Test covers only the four stages in order and each core function; implicit guidance, tempo and strategy are context, not scored.',
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
      sequence: { groups: [{ label: 'ABCDE', letters: 'ABCDE', itemIds: ['primary-survey-item-01', 'primary-survey-item-02', 'primary-survey-item-03', 'primary-survey-item-04', 'primary-survey-item-05'] }] },
      title: 'Primary Survey',
      scope: 'The five ABCDE headings in assessment order — Airway, Breathing, Circulation, Disability, Exposure. Test covers the headings and order only; not first-aid or clinical training.',
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
        overview: 'ABCDE orders the first assessment of a seriously unwell person by priority.',
        sections: [
          {
            heading: 'How to use the sequence',
            blocks: [
              {
                type: 'bullets',
                items: [
                  'Deal with life-threatening problems at each step, within your training and local protocol, before moving on.',
                  'Reassess after every intervention or change in condition, and call for help early.',
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
        ],
        caseStudies: [
          {
            title: 'Deterioration during supervised clinical care',
            scenario: 'A trained clinical team is called to a patient who has become less responsive and looks acutely unwell. The case shows sequence and reassessment only.',
            analysis: [
              {
                heading: 'Walkthrough',
                blocks: [
                  {
                    type: 'paragraph',
                    text: 'The team starts at Airway, not the most striking symptom, and finds a serious Breathing problem. It calls for help, manages that within protocol, and reassesses before moving on to Circulation, Disability and Exposure. If the patient changes again, the sequence restarts from the top.',
                  },
                ],
              },
            ],
            takeaway: 'Remember the order, prioritise immediate threats, reassess and escalate; clinical actions belong to formal training.',
          },
        ],
        limitations: [
          'Memory and rehearsal only: not first-aid or clinical training, a credential, or a substitute for supervised practice and local protocols.',
          'Examination technique, treatment thresholds, interventions, medications, CPR algorithms and diagnosis are outside the Test boundary.',
          'In a real emergency, seek emergency or clinical help and act within your training and current local guidance.',
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
      title: 'Compass Bearings',
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
    cloudTopic(ago(0)),
    ...bearingTopics(),
    ...maritimeTopics(),
    flagTopic(),
    {
      id: 'scuba-equipment-abbreviations',
      title: 'SCUBA Equipment',
      scope: 'Thirteen common recreational-scuba equipment abbreviations and shorthand — SCUBA, BCD, SPG, LPI, DSMB, DPV, AAS, DV, HP, LP, IP, SMB and DIN — and each term’s core equipment meaning or reference function. Test does not cover equipment selection, assembly, inspection, maintenance, dive planning, emergency technique or diving procedures.',
      track: 'learning',
      items: [
        {
          id: 'scuba-equipment-abbreviations-item-01',
          prompt: 'SCUBA',
          answer: 'Self-contained underwater breathing apparatus — a system that lets a diver breathe underwater from a breathing-gas supply carried by the diver.',
        },
        {
          id: 'scuba-equipment-abbreviations-item-02',
          prompt: 'BCD',
          answer: 'Buoyancy control device — an inflatable buoyancy system used to adjust buoyancy; many recreational BCDs also secure the cylinder.',
        },
        {
          id: 'scuba-equipment-abbreviations-item-03',
          prompt: 'SPG',
          answer: 'Submersible pressure gauge — a gauge or display used to monitor cylinder pressure and therefore the breathing-gas supply available.',
        },
        {
          id: 'scuba-equipment-abbreviations-item-04',
          prompt: 'LPI',
          answer: 'Low-pressure inflator — the BCD inflator connection supplied with low-pressure gas from the regulator first stage.',
        },
        {
          id: 'scuba-equipment-abbreviations-item-05',
          prompt: 'DSMB',
          answer: 'Delayed surface marker buoy — a surface-signalling buoy carried deflated and normally sent to the surface from underwater on a line or spool.',
        },
        {
          id: 'scuba-equipment-abbreviations-item-06',
          prompt: 'DPV',
          answer: 'Diver propulsion vehicle — a powered device that propels a diver through the water.',
        },
        {
          id: 'scuba-equipment-abbreviations-item-07',
          prompt: 'AAS',
          answer: 'Alternate air source — a backup breathing-gas source available for gas sharing; in common recreational open-circuit gear this is often an alternate second stage or “octopus.”',
        },
        {
          id: 'scuba-equipment-abbreviations-item-08',
          prompt: 'DV',
          answer: 'Demand valve — another name for a regulator second stage, which supplies breathing gas on demand when the diver inhales.',
        },
        {
          id: 'scuba-equipment-abbreviations-item-09',
          prompt: 'HP',
          answer: 'High pressure — the cylinder-pressure side of the regulator system; an HP port can feed a pressure gauge or transmitter.',
        },
        {
          id: 'scuba-equipment-abbreviations-item-10',
          prompt: 'LP',
          answer: 'Low pressure — regulator output used for equipment such as second-stage hoses and BCD or dry-suit inflators after the first stage has reduced cylinder pressure.',
        },
        {
          id: 'scuba-equipment-abbreviations-item-11',
          prompt: 'IP',
          answer: 'Intermediate pressure — the reduced pressure between the regulator first stage and second stage, above surrounding ambient pressure.',
        },
        {
          id: 'scuba-equipment-abbreviations-item-12',
          prompt: 'SMB',
          answer: 'Surface marker buoy — a visible buoy used to mark or signal a diver’s position at the surface; unlike a delayed SMB, an SMB may be deployed or towed for longer during a dive.',
        },
        {
          id: 'scuba-equipment-abbreviations-item-13',
          prompt: 'DIN',
          answer: 'DIN connection — a screw-in regulator-to-cylinder-valve connection standard, contrasted with the bracket-style yoke connection.',
        },
      ],
      learn: {
        kind: 'briefing',
        overview: 'The regulator reduces cylinder pressure for breathing and buoyancy equipment. Surface-signalling and propulsion devices sit outside that gas path.',
        sections: [
          {
            heading: 'Breathing-gas path',
            blocks: [
              {
                type: 'steps',
                items: [
                  'Cylinder and valve: store and release high-pressure (HP) breathing gas.',
                  'First stage: attaches to the valve and reduces HP to intermediate pressure (IP).',
                  'Second stage, or demand valve (DV): supplies gas at ambient pressure on inhalation.',
                  'Alternate air source (AAS): backup for gas sharing, commonly an alternate second stage (“octopus”).',
                  'SPG or transmitter/display: monitors cylinder pressure and remaining gas supply.',
                  'Low-pressure (LP) outlets: supply the BCD inflator (LPI) and, where fitted, dry-suit inflator.',
                ],
              },
            ],
          },
          {
            heading: 'Core recreational kit map',
            blocks: [
              {
                type: 'table',
                columns: ['Component', 'Reference function'],
                rows: [
                  ['Mask', 'Creates a clear, equalizable airspace in front of the eyes and encloses the nose.'],
                  ['Snorkel', 'Provides a simple way to breathe at the surface without using cylinder gas when conditions and the dive plan make it appropriate.'],
                  ['Fins', 'Provide efficient propulsion through the water.'],
                  ['Exposure suit', 'Wetsuits, dry suits or other exposure protection reduce heat loss and may protect the skin from the environment.'],
                  ['Cylinder / tank', 'Stores compressed breathing gas and presents it to the regulator through the cylinder valve.'],
                  ['Regulator', 'Reduces high cylinder pressure in stages and supplies breathing gas to the diver at usable pressure.'],
                  ['BCD / BC', 'Provides adjustable buoyancy; many recreational versions also secure the cylinder and may carry integrated weights.'],
                  ['Weight system', 'Offsets positive buoyancy from the diver and equipment so correct overall weighting can be established.'],
                  ['SPG and dive computer', 'The SPG reports cylinder pressure. A dive computer tracks information such as depth and time and applies its decompression model; some computers also display transmitted cylinder pressure.'],
                  ['Surface-signalling equipment', 'Visual or audible devices such as an SMB/DSMB and whistle help make a diver’s position or need for attention apparent at the surface.'],
                ],
              },
            ],
          },
          {
            heading: 'Buoyancy, signalling and propulsion',
            blocks: [
              {
                type: 'definitions',
                items: [
                  {
                    term: 'BCD / BC',
                    definition: 'BCD means buoyancy control device. “BC” or “buoyancy compensator” is also common wording. The device provides an inflatable buoyancy volume; many recreational versions also carry the cylinder and may integrate weights.',
                  },
                  {
                    term: 'SMB',
                    definition: 'A surface marker buoy marks or signals a diver’s position. Usage varies by region, but an SMB may be present from early in the dive or towed for an extended period.',
                  },
                  {
                    term: 'DSMB',
                    definition: 'A delayed surface marker buoy is carried deflated and deployed later, commonly from underwater before surfacing. It is normally used with a line and reel or spool.',
                  },
                  {
                    term: 'DPV',
                    definition: 'A diver propulsion vehicle, often called a scooter, provides powered propulsion through the water.',
                  },
                ],
              },
            ],
          },
          {
            heading: 'Connection and naming shorthand',
            blocks: [
              {
                type: 'bullets',
                items: [
                  'DIN screws into the cylinder valve; yoke/bracket is the common alternative. Some configurations accept adapters.',
                  '“Regulator” or “reg” may mean the whole set or just the second stage.',
                  '“Octopus”, “octo” and “occy” mean alternate second stage; AAS is broader.',
                  '“Tank” and “bottle” mean cylinder, not necessarily pure oxygen.',
                ],
              },
            ],
          },
        ],
        limitations: [
          'Vocabulary only, not diver training, certification, equipment selection, a pre-dive checklist, maintenance, or a substitute for instructors, dive professionals, manufacturer manuals and local operators.',
          'Assembly, inspection, gas management, buoyancy, emergencies, DSMB deployment, regulator configuration, servicing and ascent decisions require instruction and current equipment-specific procedures.',
          'Terminology varies by agency, region and equipment; synonyms here are common, not universal.',
        ],
        sources: [
          {
            label: 'PADI — Scuba Diving Certification FAQ',
            url: 'https://www.padi.com/help/scuba-certification-faq',
            note: 'Training-agency overview of the core equipment used in entry-level recreational scuba: mask, snorkel, fins, regulator, BCD, dive computer/planner, cylinder, exposure suit and weight system.',
          },
          {
            label: 'PADI — Regulator',
            url: 'https://www.padi.com/gear/regulators',
            note: 'Training-agency reference for first stage, second stage/demand valve, alternate air source, low-pressure BCD inflator, SPG, and DIN-versus-yoke connections.',
          },
          {
            label: 'Divers Alert Network — Breathe In, Breathe Out',
            url: 'https://dan.org/alert-diver/article/breathe-in-breathe-out/',
            note: 'DAN explanation of the regulator pressure path from high pressure (HP) through intermediate pressure (IP) to the second stage.',
          },
          {
            label: 'PADI — Buoyancy Control Devices (BCD)',
            url: 'https://www.padi.com/gear/bcds',
            note: 'Reference for the BCD expansion, buoyancy function, inflator system and common recreational equipment features.',
          },
          {
            label: 'PADI — SPG (Submersible Pressure Gauges)',
            url: 'https://www.padi.com/gear/spgs',
            note: 'Reference for SPG expansion and cylinder-pressure monitoring.',
          },
          {
            label: 'PADI — Signaling Devices',
            url: 'https://www.padi.com/gear/signaling-devices',
            note: 'Reference for delayed surface marker buoys and their role as surface-signalling equipment.',
          },
          {
            label: 'British Sub-Aqua Club — Safe use of Surface and Delayed Surface Marker Buoys',
            url: 'https://www.bsac.com/news-and-blog/safe-use-of-surface-and-delayed-surface-marker-buoys/',
            note: 'Diving-agency cross-check for SMB/DSMB terminology and the distinction between the two marker-buoy concepts.',
          },
          {
            label: 'PADI — Scuba Diving Terms',
            url: 'https://blog.padi.com/scuba-terminology-say-this-dont-say-that/',
            note: 'Reference for common BC/BCD, regulator, octopus and demand-valve (DV) terminology.',
          },
          {
            label: 'PADI — Make Your Dive Checks More Effective with Shisa Kanko',
            url: 'https://blog.padi.com/shisa-kanko-make-your-dive-checks-more-effective/',
            note: 'PADI usage of AAS for alternate air source.',
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
      title: 'Radio Numbers',
      scope: 'The spoken forms of the digits 0–9 and of decimal, hundred and thousand, as printed for Canadian aeronautical radio in ISED RIC-21. Tested number → spoken form. How numbers are grouped on air and radio procedure are not scored.',
      track: 'learning',
      items: RADIOTELEPHONY_NUMBERS.map(([prompt, answer]) => ({ prompt, answer })),
      learn: {
        kind: 'concise',
        overview: 'Canadian aeronautical radio uses fixed spoken forms, including TREE, FIFE and NIN-er, plus decimal, hundred and thousand.',
        sections: [
          {
            heading: 'How numbers are said on air',
            blocks: [
              {
                type: 'bullets',
                items: [
                  'Except whole thousands, say digits separately: 75 is “seven five”; 5,800 is “five eight zero zero”.',
                  'Whole thousands: digits then “thousand”; 11,000 is “one one thousand”.',
                  'Use “decimal”: 121.5 is “one two one decimal five”.',
                  'RIC-21 also covers altitudes, flight levels, headings, wind, time and aircraft types. Grouping and these conventions are unscored.',
                ],
              },
            ],
          },
        ],
        limitations: [
          'Recall only, not radio training, an operator certificate or permission to transmit.',
          'Canadian aeronautical forms only; marine, amateur, public-safety and other services have separate procedures.',
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
      title: 'SI Prefixes',
      scope: 'All 24 SI prefixes, from 10³⁰ to 10⁻³⁰: each power of ten → the prefix’s name and symbol, as listed in Table 7 of the BIPM SI Brochure. Unit conversion and the rules for writing quantities are not scored.',
      track: 'learning',
      items: SI_PREFIXES.map(([prompt, answer]) => ({ prompt, answer })),
      learn: {
        kind: 'concise',
        overview: 'SI prefixes multiply units by powers of ten. Ronna, quetta, ronto and quecto were added in 2022.',
        sections: [
          {
            heading: 'Patterns that carry most of the load',
            blocks: [
              {
                type: 'bullets',
                items: [
                  'Above kilo and below milli, steps are 10³. Between them, hecto, deca, deci and centi step by one power.',
                  'Symbols are case-sensitive: multiples use capitals except da, h, k; sub-multiples use lower case. M (mega) differs from m (milli).',
                  'Deca alone has two letters (da); micro uses Greek mu (µ).',
                  'Names use lower case. Join prefix and unit without a space: pm, mmol, GΩ, THz.',
                ],
              },
            ],
          },
        ],
        limitations: [
          'Reverse recall, unit conversion and rules for writing quantities are not tested.',
          'IEC binary prefixes, such as kibi (Ki, 2¹⁰) and mebi (Mi, 2²⁰), are separate from SI and excluded.',
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
      title: 'Greek Alphabet',
      scope: 'The 24 letters of the Greek alphabet: each letter’s capital and small forms → its English name. Tested letter → name. Writing a letter from its name, pronunciation and reading Greek are not scored.',
      track: 'learning',
      items: GREEK_LETTERS.map(([prompt, answer]) => ({ prompt, answer })),
      learn: {
        kind: 'concise',
        overview: 'Greek letters appear as symbols in mathematics, science and engineering. Small forms often distinguish letters whose capitals resemble Latin ones.',
        sections: [
          {
            heading: 'Where letters are easy to confuse',
            blocks: [
              {
                type: 'bullets',
                items: [
                  'Latin-like capitals: Α, Β, Ε, Ζ, Η, Ι, Κ, Μ, Ν, Ο, Ρ, Τ, Υ, Χ.',
                  'Latin-like small forms: η (eta), ν (nu), ρ (rho), χ (chi), ω (omega) are not n, v, p, x, w.',
                  'Compare ζ (zeta) with ξ (xi), and ν (nu) with υ (upsilon).',
                  'Sigma: σ normally; ς at a word’s end.',
                ],
              },
            ],
          },
        ],
        limitations: [
          'Recognition only, not writing letters from names or reading, writing or speaking Greek.',
          'Conventional English names, not Greek pronunciation. Alphabetical order is not scored.',
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
      title: 'Hex to Binary',
      scope: 'The 16 hexadecimal digits 0–F: each digit → its four-bit binary pattern, 0000 to 1111. Tested hex → binary. Converting longer numbers and binary arithmetic are not scored.',
      track: 'learning',
      items: [...HEX_DIGITS].map((digit, value) => ({
        prompt: digit,
        answer: value.toString(2).padStart(4, '0'),
      })),
      learn: {
        kind: 'concise',
        overview: 'One hex digit represents four bits; a byte is two hex digits. C3 is 1100 0011.',
        sections: [
          {
            heading: 'Reading a pattern from its place values',
            blocks: [
              {
                type: 'bullets',
                items: [
                  'Bit weights, left to right: 8, 4, 2, 1. Add set bits: 1011 = 8 + 2 + 1 = 11 = B.',
                  'A–F mean 10–15; upper and lower case are equivalent.',
                  'Single-bit anchors: 1 = 0001, 2 = 0010, 4 = 0100, 8 = 1000. Also 7 = 0111; F = 1111.',
                ],
              },
            ],
          },
        ],
        limitations: [
          'Binary → hex, longer numbers, signed representations and binary arithmetic are not tested.',
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
    {
      id: 'beaufort-wind-scale',
      title: 'Beaufort Scale',
      scope: 'Beaufort forces 0 to 12: each force → its descriptive term and wind-speed range in knots, as published by Environment and Climate Change Canada, with force 12 as 64 knots or more. Tested force → term and range. The observed effects at sea and on land are not scored.',
      track: 'tradecraft',
      items: BEAUFORT.map(([prompt, answer]) => ({ prompt, answer })),
      learn: {
        kind: 'concise',
        overview: 'Beaufort links wind forces with knot ranges and observed effects at sea and on land.',
        sections: [
          beaufortVisualGuide,
          {
            heading: 'The scale',
            blocks: [
              {
                type: 'entries',
                entries: BEAUFORT.map(([prompt, answer], force) => {
                  const [term, range] = answer.split(' — ')
                  return {
                    marker: prompt.replace('Force ', ''),
                    title: term,
                    meta: range,
                    fields: [
                      { label: 'At sea', text: BEAUFORT_AT_SEA[force] },
                      { label: 'On land', text: BEAUFORT_ON_LAND[force] },
                    ],
                    ...(force === 12 ? { note: BEAUFORT_FORCE_12_NOTE } : {}),
                  }
                }),
              },
            ],
          },
        ],
        limitations: [
          'A memory aid, not a forecast or a substitute for current marine forecasts, warnings and seamanship judgement.',
          'Observed effects, other units, wave heights and reverse recall (speed → force) are not tested.',
        ],
        sources: [
          {
            label: 'Environment and Climate Change Canada — Beaufort wind scale table',
            url: 'https://www.canada.ca/en/environment-climate-change/services/general-marine-weather-information/understanding-forecasts/beaufort-wind-scale-table.html',
            note: 'Canadian government table of the 13 forces: descriptive terms, knot and km/h ranges, and the effects observed at sea and on land quoted above (page dated 2017-09-10).',
          },
          {
            label: 'WMO — Manual on Marine Meteorological Services (WMO-No. 558), Volume I',
            url: 'https://library.wmo.int/records/item/41585-manual-on-marine-meteorological-services-volume-i-global-aspects',
            note: 'International technical regulation. The 2012 edition, updated 2018, Part I §2.2.44 defines the wind-warning categories, with hurricane force as Beaufort force 12 or over.',
          },
          {
            label: 'Met Office — Beaufort wind force scale',
            url: 'https://weather.metoffice.gov.uk/guides/coast-and-sea/beaufort-scale',
            note: 'National meteorological service cross-check: the same terms and knot ranges, with force 12 as 64 knots or more.',
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
      id: 'firearm-safety-acts-prove',
      sequence: { groups: [{ label: 'ACTS', letters: 'ACTS', itemIds: ['firearm-safety-acts-prove-item-01', 'firearm-safety-acts-prove-item-02', 'firearm-safety-acts-prove-item-03', 'firearm-safety-acts-prove-item-04'] }, { label: 'PROVE', letters: 'PROVE', itemIds: ['firearm-safety-acts-prove-item-05', 'firearm-safety-acts-prove-item-06', 'firearm-safety-acts-prove-item-07', 'firearm-safety-acts-prove-item-08', 'firearm-safety-acts-prove-item-09'] }] },
      title: 'Firearm Safety',
      scope: 'The Vital Four ACTS rules and the five PROVE it safe steps, in order and in the wording of the RCMP Canadian Firearms Safety Course Student Handbook (2014). Test covers recall of these nine rules only — not handling a firearm, the course, its tests or a licence.',
      track: 'survival',
      items: ACTS_PROVE.map(([prompt, answer]) => ({ prompt, answer })),
      learn: {
        kind: 'briefing',
        overview: 'ACTS is four rules applied together every time a firearm is handled. Its last rule is carried out by PROVE, five steps in a fixed order.',
        sections: [
          {
            heading: 'Handbook rules',
            blocks: [
              {
                type: 'bullets',
                items: [
                  'Whenever an incident occurs, at least one ACTS rule has been broken.',
                  'ACTS starts from an assumption, not a check: treat every firearm as loaded, so the muzzle and trigger rules apply before its condition is known.',
                  'S is done through PROVE: check both chamber and magazine, every time a firearm is handled, for any reason.',
                  'Pass or accept only open and unloaded firearms.',
                  'A firearm is unloaded and safe only until it leaves the direct control of the person who PROVEd it.',
                  'Never rely on the safety: a loaded firearm with the safety on could still fire.',
                  'If you cannot properly PROVE a firearm safe, do not handle it; ask a qualified individual.',
                ],
              },
            ],
          },
        ],
        caseStudies: [
          {
            title: 'A firearm handed over as “already checked”',
            scenario: 'At a supervised range, a friend holds out a rifle with the action closed and says it is unloaded: they checked it a minute ago.',
            analysis: [
              {
                heading: 'Walkthrough',
                blocks: [
                  {
                    type: 'paragraph',
                    text: 'Assume it is loaded: muzzle safe, finger off the trigger. A closed action already breaks the accept-only-open-and-unloaded rule, and the friend’s check does not transfer. PROVE it yourself, or ask the range officer if you cannot open it.',
                  },
                ],
              },
            ],
            takeaway: 'Safe status is established by the person holding the firearm, every time, never inherited from someone else’s word.',
          },
        ],
        limitations: [
          'Memory and rehearsal only: not the Canadian Firearms Safety Course, not a licence qualification, not proof you can handle a firearm safely.',
          'Handling and inspecting real firearms is taught hands-on by a certified CFSC instructor. This topic teaches nothing about shooting, tactics or use of force.',
          'Wording follows the 2014 Student Handbook; a new national curriculum rolls out from 2026. If your course differs, follow your course.',
        ],
        sources: [
          {
            label: 'RCMP — Canadian Firearms Safety Course, Student Handbook (5th edition, 2014)',
            url: 'https://publications.gc.ca/collections/collection_2015/grc-rcmp/PS99-2-2-1-2014-eng.pdf',
            note: 'Primary doctrine. The Vital Four ACTS (p. 21), PROVE it safe (§3.1.7, Table 4, p. 50), the direct-control rule, the open-and-unloaded passing rule, the warning not to rely on a mechanical safety, and the instruction to seek a qualified individual.',
          },
          {
            label: 'RCMP — Safety courses',
            url: 'https://rcmp.ca/en/firearms/firearms-safety-training-transport-and-storage/safety-courses',
            note: 'Current Canadian Firearms Program page: first-time licence applicants take the CFSC, which ends in both a written and a practical test.',
          },
          {
            label: 'RCMP — 2025 Commissioner of Firearms Report',
            url: 'https://rcmp.ca/en/corporate-information/publications-and-manuals/2025-commissioner-firearms-report',
            note: 'Announces the national rollout of a new firearms safety curriculum and course materials beginning in 2026 — the reason this topic pins its wording to a dated edition.',
          },
          {
            label: 'Firearms Safety Education Service of Ontario — Canadian Firearm Safety Course',
            url: 'https://fseso.org/course/canadian-firearm-safety-course-cfsc/',
            note: 'Ontario delivery agent for the CFSC; as of 2026-09-25 it directs students to the 2014 Student Handbook above.',
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
        ...(item.choice ? { choice: item.choice } : {}),
        ...(item.stimulus ? { stimulus: item.stimulus } : {}),
        ...(item.audio ? { audio: item.audio } : {}),
        ...(item.response ? { response: item.response } : {}),
      })),
      itemEvidence: topic.itemEvidence ?? {},
      lessonProgress: topic.lessonProgress ?? {},
    })),
  }
}
