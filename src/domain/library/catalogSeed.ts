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
      title: 'Recreational scuba gear shorthand',
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
        overview: 'The useful part of scuba gear vocabulary is not memorizing isolated initials; it is knowing where each label sits in the equipment system. A cylinder holds high-pressure breathing gas. The regulator first stage reduces that pressure and distributes gas to the breathing, buoyancy and pressure-monitoring components. Surface-signalling and propulsion equipment sit outside that breathing-gas path. This topic teaches that system map and its common shorthand only.',
        sections: [
          {
            heading: 'Breathing-gas path',
            blocks: [
              {
                type: 'steps',
                items: [
                  'The cylinder and valve hold and release breathing gas at high pressure (HP).',
                  'The regulator first stage attaches to the cylinder valve and reduces cylinder pressure to intermediate pressure (IP).',
                  'A primary second stage — also called a demand valve (DV) — reduces that gas to surrounding ambient pressure and supplies it when the diver inhales.',
                  'An alternate air source (AAS), commonly an alternate second stage or “octopus” in recreational open-circuit setups, provides a second breathing-gas outlet for gas sharing.',
                  'A submersible pressure gauge (SPG), or an equivalent pressure transmitter/display, reads the cylinder-pressure side so the diver can monitor the remaining gas supply.',
                  'Low-pressure (LP) outlets also supply devices such as the BCD low-pressure inflator (LPI), and may supply a dry-suit inflator where that equipment is used.',
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
                  'DIN describes the screw-in regulator/cylinder-valve connection. The common alternative is a yoke or bracket connection; adapters exist between some configurations.',
                  '“Regulator” can mean the complete regulator set or, informally, the second stage alone. “Reg” is common shorthand.',
                  '“Octopus”, “octo” or “occy” commonly refers to an alternate second stage. AAS is the broader functional term: alternate air source.',
                  '“Tank”, “cylinder” and “bottle” may all be heard. “Cylinder” is the more precise equipment term; none of these names means the cylinder necessarily contains pure oxygen.',
                ],
              },
            ],
          },
        ],
        limitations: [
          'Argus supports vocabulary, system recognition and memory rehearsal only. This topic is not diver training, certification, an equipment-selection guide, a pre-dive checklist, a maintenance procedure or a substitute for a qualified instructor, dive professional, manufacturer manual or local dive operator.',
          'Knowing an abbreviation does not establish competence in assembly, inspection, gas management, buoyancy control, emergency response, DSMB deployment, regulator configuration, servicing or ascent decisions. Those require appropriate instruction and current equipment-specific procedures.',
          'Terminology varies between agencies, regions and equipment configurations. The Learn notes call out common synonyms rather than treating one brand or regional term as universal.',
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
    }
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
