import type { LearnContent } from '../learning/content'
import type { IdentifiedItem, Topic } from '../library/topic'

/**
 * The three shipped text topics of the Canadian radio programme (#150). Content
 * authority is `docs/open/ISSUE_139_RADIO_COMMUNICATIONS_AUDIO.md`, with every
 * scored answer checked against its controlling publication on 2026-10-06:
 *
 * - Radio Procedure: ISED RIC-22 only, the general Canadian radio substrate;
 * - Marine Calling and Marine Priority Calls: Canadian Coast Guard, Radio Aids to
 *   Marine Navigation 2026, Part 4 §§4.1.1–4.1.4. Where RIC-22 and RAMN differ
 *   (RIC-22 allows "not more than three times", RAMN says "spoken three times"),
 *   the marine publication controls the marine topic.
 *
 * The scored claim is memory of published wording and structure. It is not radio
 * operation, emergency judgement or an operator certificate, and each topic says
 * so. Ordered sequences are single-answer choices rather than self-scored cards,
 * because a long sequence cannot be judged honestly by the learner.
 */
export const RADIO_PROCEDURE_ID = 'radio-procedure'
export const MARINE_CALLING_ID = 'marine-vhf-routine-calling'
export const MARINE_PRIORITY_ID = 'marine-vhf-priority-communications'

const RIC_22 = {
  label: 'ISED — RIC-22, General Radio Operating Procedures (Issue 4, January 2008)',
  url: 'https://ised-isde.canada.ca/site/spectrum-management-telecommunications/en/licences-and-certificates/radiocom-information-circulars-ricpagination-orphans/ric-22/ric-22-general-radio-operating-procedures',
  note: 'Government of Canada guidance, which RIC-22 itself says has no status in law. Its general information applies to all radio operators.',
}

const RAMN_PART_4 = {
  label: 'Canadian Coast Guard — Radio Aids to Marine Navigation 2026, Part 4: General',
  url: 'https://www.canada.ca/en/canadian-coast-guard/corporate/publications/radio-aids-marine-navigation/general.html',
  note: 'Controlling Canadian marine source for radiotelephone procedure.',
}

const SEQUENCE_ARROW = ' → '

/**
 * An ordered-sequence choice. The key is `elements` in published order; each
 * wrong option swaps one adjacent pair, so the elements are identical and a
 * wrong option is wrong only by order. Options are sorted for a stable bank.
 */
function sequenceChoice(
  elements: readonly string[],
  swaps: readonly (readonly [number, number])[],
): { answer: string; choice: { options: string[] } } {
  const answer = elements.join(SEQUENCE_ARROW)
  const wrong = swaps.map(([a, b]) => {
    const swapped = [...elements]
    ;[swapped[a], swapped[b]] = [swapped[b], swapped[a]]
    return swapped.join(SEQUENCE_ARROW)
  })
  return { answer, choice: { options: [answer, ...wrong].sort() } }
}

function sequenceItem(
  topicId: string,
  index: number,
  prompt: string,
  elements: readonly string[],
  swaps: readonly (readonly [number, number])[],
): IdentifiedItem {
  return {
    id: `${topicId}-item-${String(index).padStart(2, '0')}`,
    kind: 'forward',
    prompt,
    ...sequenceChoice(elements, swaps),
  }
}

function plainItem(topicId: string, index: number, prompt: string, answer: string): IdentifiedItem {
  return {
    id: `${topicId}-item-${String(index).padStart(2, '0')}`,
    kind: 'forward',
    prompt,
    answer,
  }
}

function choiceItem(
  topicId: string,
  index: number,
  prompt: string,
  answer: string,
  wrong: readonly string[],
): IdentifiedItem {
  return {
    id: `${topicId}-item-${String(index).padStart(2, '0')}`,
    kind: 'forward',
    prompt,
    answer,
    choice: { options: [answer, ...wrong].sort() },
  }
}

function unstarted(base: Pick<Topic, 'id' | 'title' | 'scope' | 'items' | 'learn'>): Topic {
  return {
    ...base,
    track: 'learning',
    status: 'unstarted',
    createdAt: new Date(0).toISOString(),
    drilledAt: null,
    learningAt: null,
    completedAt: null,
    lastTestedAt: null,
    spotCheckedAt: null,
    history: [],
  }
}

/* ------------------------------------------------------------------ A */

/** ISED RIC-22 Appendix A, wording as printed except where a note says otherwise. */
export const SCORED_PROWORDS = [
  ['ACKNOWLEDGE', 'Let me know that you have received and understood this message.'],
  ['AFFIRMATIVE', 'Yes, or permission granted.'],
  ['CORRECTION', 'An error has been made in this transmission (message indicated). The correct version is…'],
  ['GO AHEAD', 'Proceed with your message.'],
  ['NEGATIVE', 'No, or that is not correct, or I do not agree.'],
  ['OUT', 'Conversation is ended and no response is expected.'],
  ['OVER', 'My transmission is ended and I expect a response from you.'],
  // Appendix A prints "Repeat all, or the specified part of this message back to
  // me exactly as received (do not use the word “REPEAT”)". The parenthesis is
  // carried in Learn, not in the scored answer.
  ['READ BACK', 'Repeat all, or the specified part of this message back to me exactly as received.'],
  ['ROGER', 'I have received all of your last transmission.'],
  // Appendix A prints only "Self-explanatory"; the meaning is RIC-22 §4.13, which
  // gives SAY AGAIN as the request for a whole message or a named part of one.
  ['SAY AGAIN', 'Send your transmission again, in whole or the part named. Never say “REPEAT”.'],
  ['STAND BY', 'I must pause for a few seconds or minutes, please wait and I will call you.'],
  ['WILCO', 'Your instructions received, understood and will be complied with.'],
] as const

/** The remaining Appendix A entries. Learn only; never scored. */
const OTHER_PROWORDS = [
  { term: 'BREAK', definition: 'Indicates the separation between portions of the message. (To be used where there is no clear distinction between the text and other portions of the message.)' },
  { term: 'CHANNEL', definition: 'Change to channel … before proceeding.' },
  { term: 'CLEARED', definition: 'Authorized to proceed under the conditions specified.' },
  { term: 'CONFIRM', definition: 'Have I received the following … or Did you receive the message?' },
  { term: 'DISREGARD', definition: 'Consider this transmission as not sent.' },
  { term: 'HOW DO YOU READ?', definition: 'What is the readability of my transmission?' },
  { term: 'I SAY AGAIN', definition: 'Self-explanatory (use instead of “I REPEAT”).' },
  { term: 'MONITOR', definition: 'Listen on (frequency).' },
  { term: 'ROGER NUMBER', definition: 'I have received your message Number __.' },
  { term: 'THAT IS CORRECT', definition: 'Self-explanatory.' },
  { term: 'VERIFY', definition: 'Check coding, check text with originator and send correct version.' },
  { term: 'WORDS TWICE', definition: '(a) As a request: Communication is difficult, please send each word, or group of words, twice. (b) As information: Since communication is difficult, I will send each word or group of words, twice.' },
] as const

const radioProcedureLearn: LearnContent = {
  kind: 'concise',
  overview:
    'Radio procedure keeps calls short and unambiguous: fixed procedural words, a set call order, and a priority order for distress, urgency and safety.',
  sections: [
    {
      heading: 'Scored words',
      blocks: [
        {
          type: 'definitions',
          items: [
            ...SCORED_PROWORDS.map(([term, definition]) => ({ term, definition })),
          ],
        },
      ],
    },
    {
      heading: 'Also in Appendix A (not scored)',
      blocks: [{ type: 'definitions', items: OTHER_PROWORDS.map((entry) => ({ ...entry })) }],
    },
    {
      heading: 'Call order',
      blocks: [
        {
          type: 'table',
          columns: ['Call', 'Order'],
          rows: [
            ['One station', 'Called station → THIS IS → calling station → invitation to reply'],
            ['All stations', 'ALL STATIONS → THIS IS → calling station → invitation to reply'],
            ['Broadcast', 'As an all-stations call, but end with OUT when no reply is wanted'],
            ['Message handling', 'Call → addressee reply → message → acknowledgement or ending'],
          ],
        },
        {
          type: 'bullets',
          items: [
            'Priority: distress, urgency, safety, then all other communications.',
            'The called station is always named first.',
            'Use SAY AGAIN or READ BACK, never “REPEAT”. Avoid OK, TEN-FOUR and OVER AND OUT.',
          ],
        },
      ],
    },
  ],
  limitations: [
    'Recall only. Not radio training, an operator certificate or permission to transmit.',
    'RIC-22 is general guidance with no status in law; marine procedure is in the two marine topics.',
  ],
  sources: [RIC_22],
}

const radioProcedureItems: IdentifiedItem[] = [
  ...SCORED_PROWORDS.map(([prompt, answer], index) =>
    plainItem(RADIO_PROCEDURE_ID, index + 1, prompt, answer),
  ),
  sequenceItem(
    RADIO_PROCEDURE_ID,
    13,
    'In a call to one specific station, in what order does RIC-22 give the call?',
    ['Called station', 'THIS IS', 'Calling station', 'Invitation to reply'],
    [[0, 2], [1, 2], [2, 3]],
  ),
  sequenceItem(
    RADIO_PROCEDURE_ID,
    14,
    'In an ALL STATIONS call, in what order does RIC-22 give the call?',
    ['ALL STATIONS', 'THIS IS', 'Calling station', 'Invitation to reply'],
    [[0, 2], [1, 2], [2, 3]],
  ),
  sequenceItem(
    RADIO_PROCEDURE_ID,
    15,
    'What are the four parts of the RIC-22 message-handling format, in order?',
    ['Call', 'Addressee reply', 'Message', 'Acknowledgement or ending'],
    [[0, 1], [1, 2], [2, 3]],
  ),
]

export function radioProcedureTopic(): Topic {
  return unstarted({
    id: RADIO_PROCEDURE_ID,
    title: 'Radio Procedure',
    scope:
      'Twelve ISED RIC-22 procedural words, tested word → meaning, and the order of a single-station call, an ALL STATIONS call and the four-part message-handling format, each chosen from options. Marine, aeronautical, amateur and military procedure are not scored.',
    items: radioProcedureItems,
    learn: radioProcedureLearn,
  })
}

/* ------------------------------------------------------------------ B */

const marineCallingLearn: LearnContent = {
  kind: 'concise',
  overview:
    'A Canadian Coast Guard marine call follows a fixed order: station called, THIS IS, calling vessel, then an invitation to reply.',
  sections: [
    {
      heading: 'Initial calls',
      blocks: [
        {
          type: 'table',
          columns: ['Item', 'To a specific station', 'To all stations'],
          rows: [
            ['Station called (spoken three times)', 'PRESCOTT COAST GUARD RADIO', 'ALL STATIONS (or ALL SHIPS IN JOHNSTONE STRAITS)'],
            ['The words', 'THIS IS', 'THIS IS'],
            ['Type, name and call sign of the calling vessel (spoken three times)', 'STEAMER FAIRMOUNT CYLD', 'TANKER IMPERIAL CORNWALL/VCVC'],
            ['Invitation to reply', 'OVER', 'OVER'],
          ],
        },
      ],
    },
    {
      heading: 'A ship’s radio message',
      blocks: [
        {
          type: 'table',
          columns: ['Part', 'Example'],
          rows: [
            ['Originating ship: type, name, call sign', 'FROM M/V WEST WIND, CALL SIGN V2AG'],
            ['Date and time (preferably UTC)', 'FILED 071225UTC'],
            ['Address', 'ECAREG CANADA'],
            ['Text', 'SECURED SYDNEY GOVERNMENT WHARF'],
            ['Signature', 'MASTER'],
          ],
        },
        {
          type: 'bullets',
          items: [
            'Make the initial call on Ch16 (156.800 MHz) or 2182 kHz; MCTS Centres do not monitor working frequencies.',
            'Those two frequencies are only for distress, urgency, safety and calling.',
            'A broadcast skips the invitation to reply and goes straight to its message.',
            'Do not acknowledge a message until sure it was received correctly.',
          ],
        },
      ],
    },
  ],
  limitations: [
    'Recall of published call structure. Not marine-radio competence, DSC operation or operator certification.',
  ],
  sources: [RAMN_PART_4],
}

const THIS_IS_VESSEL = 'Type, name and call sign of your vessel (three times)'

const marineCallingItems: IdentifiedItem[] = [
  sequenceItem(
    MARINE_CALLING_ID,
    1,
    'In an initial call to a specific station, in what order does RAMN give the call?',
    ['Station called (three times)', 'THIS IS', THIS_IS_VESSEL, 'OVER'],
    [[0, 2], [1, 2], [2, 3]],
  ),
  sequenceItem(
    MARINE_CALLING_ID,
    2,
    'In an initial ALL STATIONS call, in what order does RAMN give the call?',
    ['ALL STATIONS (three times)', 'THIS IS', THIS_IS_VESSEL, 'OVER'],
    [[0, 2], [1, 2], [2, 3]],
  ),
  choiceItem(
    MARINE_CALLING_ID,
    3,
    'A station wants to broadcast information, not open a conversation. How does it end its initial call?',
    'It proceeds with the message instead of giving the invitation to reply',
    [
      'It says OVER and waits for the called station to answer',
      'It says OUT and then waits for a reply',
      'It repeats the call three more times before the message',
    ],
  ),
  sequenceItem(
    MARINE_CALLING_ID,
    4,
    'In what order are the five parts of a ship’s radio message sent?',
    ['Originating ship', 'Date and time', 'Address', 'Text', 'Signature'],
    [[0, 1], [2, 3], [3, 4]],
  ),
]

export function marineRoutineCallingTopic(): Topic {
  return unstarted({
    id: MARINE_CALLING_ID,
    title: 'Marine Calling',
    scope:
      'Four published Canadian Coast Guard marine radiotelephone structures from RAMN 2026 Part 4: the initial call to a specific station, the ALL STATIONS call, the broadcast rule and the five-part ship radio message, each chosen from options. Channel choice, DSC and certification are not scored.',
    items: marineCallingItems,
    learn: marineCallingLearn,
  })
}

/* ------------------------------------------------------------------ C */

/** RAMN 2026 Part 4, Figure 4-1 (text version): the meanings, as printed. */
const MAYDAY_MEANING = 'A mobile unit or person is threatened by grave and imminent danger and requests immediate assistance'
const PAN_PAN_MEANING = 'The calling station has a very urgent message to transmit concerning the safety of a mobile unit or a person'
const SECURITE_MEANING = 'The calling station has an important navigational or meteorological warning to transmit'
const RELAY_MEANING = 'The calling station is relaying a distress message on behalf of a mobile unit or person in grave and imminent danger'

const marinePriorityLearn: LearnContent = {
  kind: 'concise',
  overview:
    'MAYDAY announces distress, PAN PAN urgency, SÉCURITÉ safety, in that order of priority. Each has a published call and message order.',
  sections: [
    {
      heading: 'What each signal means',
      blocks: [
        {
          type: 'definitions',
          items: [
            { term: 'MAYDAY', definition: `${MAYDAY_MEANING}.` },
            { term: 'MAYDAY RELAY', definition: `${RELAY_MEANING}.` },
            { term: 'PAN PAN', definition: `${PAN_PAN_MEANING}.` },
            { term: 'SÉCURITÉ', definition: `${SECURITE_MEANING}.` },
          ],
        },
      ],
    },
    {
      heading: 'Published order',
      blocks: [
        {
          type: 'table',
          columns: ['Part', 'Order'],
          rows: [
            ['Distress call', 'MAYDAY (three times) → THIS IS → ship name (three times) → call sign or other identification → MMSI (if a DSC distress alert was sent)'],
            ['Distress message', 'MAYDAY → ship name → call sign or other identification → MMSI (if a DSC distress alert was sent) → position → nature of distress → assistance needed → other useful information → OVER'],
            ['Urgency call', 'PAN PAN (three times) → ALL STATIONS or a specific station (three times) → THIS IS → station name (three times) → call sign or other identification → MMSI (if a DSC urgency announcement was sent)'],
            ['Safety call', 'SÉCURITÉ (three times) → ALL STATIONS (three times) → THIS IS → station name (three times) → call sign or other identification → MMSI (if a DSC safety announcement was sent) → brief description of the safety message → channel or frequency for the safety broadcast → OUT'],
            ['Safety message', 'SÉCURITÉ → ALL STATIONS (three times) → THIS IS → station name (three times) → call sign or other identification → MMSI (if a DSC safety announcement was sent) → details of the safety message → OUT'],
          ],
        },
        {
          type: 'bullets',
          items: [
            'Priority: distress, urgency, safety, then all other communications.',
            'A distress call is not addressed to any particular station.',
            'The safety message goes on the working frequency named at the end of the safety call.',
            'RAMN’s quick-reference card also lists persons on board; the scored order follows §4.1.2.3.',
          ],
        },
      ],
    },
  ],
  limitations: [
    'Memory of published structure only. Not emergency decision-making, DSC operation or certification.',
    'A real distress also involves a DSC alert; this topic scores only the spoken call and message.',
  ],
  sources: [
    RAMN_PART_4,
    {
      ...RIC_22,
      note: 'Source for the priority order (§3.1); the marine publication controls where the two differ.',
    },
  ],
}

const SIGNAL_MEANINGS = [MAYDAY_MEANING, PAN_PAN_MEANING, SECURITE_MEANING, RELAY_MEANING]

function meaningItem(index: number, signal: string, meaning: string): IdentifiedItem {
  return choiceItem(
    MARINE_PRIORITY_ID,
    index,
    `What does ${signal} announce?`,
    meaning,
    SIGNAL_MEANINGS.filter((other) => other !== meaning),
  )
}

const marinePriorityItems: IdentifiedItem[] = [
  sequenceItem(
    MARINE_PRIORITY_ID,
    1,
    'What is the order of priority for radio communications?',
    ['Distress', 'Urgency', 'Safety', 'All other communications'],
    [[0, 1], [1, 2], [2, 3]],
  ),
  meaningItem(2, 'MAYDAY', MAYDAY_MEANING),
  meaningItem(3, 'PAN PAN', PAN_PAN_MEANING),
  meaningItem(4, 'SÉCURITÉ', SECURITE_MEANING),
  sequenceItem(
    MARINE_PRIORITY_ID,
    5,
    'In what order does RAMN give the marine distress call?',
    ['MAYDAY (three times)', 'THIS IS', 'Ship name (three times)', 'Call sign or other identification', 'MMSI (if a DSC distress alert was sent)'],
    [[0, 1], [2, 3], [3, 4]],
  ),
  sequenceItem(
    MARINE_PRIORITY_ID,
    6,
    'In what order does RAMN give the marine distress message?',
    [
      'MAYDAY',
      'Ship name',
      'Call sign or other identification',
      'MMSI (if a DSC distress alert was sent)',
      'Position',
      'Nature of distress',
      'Assistance needed',
      'Other useful information',
      'OVER',
    ],
    [[4, 5], [5, 6], [7, 8]],
  ),
  sequenceItem(
    MARINE_PRIORITY_ID,
    7,
    'In what order does RAMN give the marine urgency call?',
    [
      'PAN PAN (three times)',
      'ALL STATIONS or a specific station (three times)',
      'THIS IS',
      'Station name (three times)',
      'Call sign or other identification',
      'MMSI (if a DSC urgency announcement was sent)',
    ],
    [[0, 1], [1, 2], [3, 4]],
  ),
  sequenceItem(
    MARINE_PRIORITY_ID,
    8,
    'In what order does RAMN give the marine safety call?',
    [
      'SÉCURITÉ (three times)',
      'ALL STATIONS (three times)',
      'THIS IS',
      'Station name (three times)',
      'Call sign or other identification',
      'MMSI (if a DSC safety announcement was sent)',
      'Brief description of the safety message',
      'Channel or frequency for the safety broadcast',
      'OUT',
    ],
    [[1, 2], [6, 7], [7, 8]],
  ),
  choiceItem(
    MARINE_PRIORITY_ID,
    9,
    'Where is the safety message itself sent?',
    'On the working frequency announced at the end of the safety call',
    [
      'On Ch16, straight after the safety call',
      'On 2182 kHz only',
      'On any frequency the sender chooses',
    ],
  ),
]

export function marinePriorityCommunicationsTopic(): Topic {
  return unstarted({
    id: MARINE_PRIORITY_ID,
    title: 'Marine Priority Calls',
    scope:
      'The published meanings of MAYDAY, PAN PAN and SÉCURITÉ, the order of priority, the RAMN 2026 field order of the distress call, distress message, urgency call and safety call, and where the safety message is sent. Memory of published structure only, not emergency judgement or DSC operation.',
    items: marinePriorityItems,
    learn: marinePriorityLearn,
  })
}

export function radioTopics(): Topic[] {
  return [radioProcedureTopic(), marineRoutineCallingTopic(), marinePriorityCommunicationsTopic()]
}
