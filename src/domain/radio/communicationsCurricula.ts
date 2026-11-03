import type { Curriculum, LessonStage, LessonStep } from '../learning/stages'

/**
 * #324 REVIEW-ONLY authored content. Deliberately NOT registered in
 * generatedCurriculum.ts until #150 domain review and owner design approval.
 * #296 owns the runner/schema; #151 owns any prerecorded audio.
 * Source trace: docs/open/ISSUE_324_COMMUNICATIONS_STAGED_CURRICULA.md
 */
const NATO = [
  ['A', 'Alfa'], ['B', 'Bravo'], ['C', 'Charlie'], ['D', 'Delta'], ['E', 'Echo'],
  ['F', 'Foxtrot'], ['G', 'Golf'], ['H', 'Hotel'], ['I', 'India'], ['J', 'Juliett'],
  ['K', 'Kilo'], ['L', 'Lima'], ['M', 'Mike'], ['N', 'November'],
  ['O', 'Oscar'], ['P', 'Papa'], ['Q', 'Quebec'], ['R', 'Romeo'],
  ['S', 'Sierra'], ['T', 'Tango'], ['U', 'Uniform'], ['V', 'Victor'],
  ['W', 'Whiskey'], ['X', 'X-ray'], ['Y', 'Yankee'], ['Z', 'Zulu'],
] as const

const NUMBERS = [
  ['0', 'ZE-RO'], ['1', 'WUN'], ['2', 'TOO'], ['3', 'TREE'],
  ['4', 'FOW-er'], ['5', 'FIFE'], ['6', 'SIX'],
  ['7', 'SEV-en'], ['8', 'AIT'], ['9', 'NIN-er'],
  ['Decimal', 'DAY-SEE-MAL'], ['Hundred', 'HUN-dred'], ['Thousand', 'TOU-SAND'],
] as const

function id(topic: string, oneBased: number): string {
  return topic + '-item-' + String(oneBased).padStart(2, '0')
}
function choose(idText: string, itemId: string, prompt: string, answer: string,
  otherOptions: readonly string[], explain: string): LessonStep {
  return { kind: 'choose', id: idText, itemId, prompt, answer,
    options: [answer, ...otherOptions.filter(option => option !== answer)].slice(0, 4),
    explain }
}
function order(idText: string, itemId: string, prompt: string,
  blocks: readonly string[], explain: string): LessonStep {
  return { kind: 'order', id: idText, itemId, prompt, blocks: [...blocks], explain }
}
function show(idText: string, title: string, body: string, itemId?: string): LessonStep {
  return { kind: 'show', id: idText, title, body, ...(itemId ? { itemId } : {}) }
}
function summary(idText: string, text: string): LessonStep {
  return { kind: 'summary', id: idText, text }
}
function checkpoint(idText: string, itemIds: string[]): LessonStep {
  return { kind: 'checkpoint', id: idText, itemIds }
}

/** Six packets of 4-5 new mappings, with spaced earlier examples and written-only application. */
function wordPackets(): Curriculum {
  const spans: [string, number, number][] = [
    ['a-e', 0, 5], ['f-j', 5, 10], ['k-n', 10, 14],
    ['o-r', 14, 18], ['s-v', 18, 22], ['w-z', 22, 26],
  ]
  return { stages: spans.map(([slug, from, to], stageIndex): LessonStage => {
    const stageId = 'nato-' + slug
    const packet = NATO.slice(from, to)
    const steps: LessonStep[] = []
    for (let index = from; index < to; index++) {
      const [letter, word] = NATO[index]
      const itemId = id('nato-phonetic', index + 1)
      const alternate = packet.filter(p => p[0] !== letter).map(p => p[1])
      let options: string[] = alternate
      let note = 'NATO and ISED RIC-22 map ' + letter + ' to ' + word + '. This is a written code-word mapping, not a pronunciation score.'
      if (letter === 'A') {
        options = ['Alpha', 'Bravo', 'Charlie']
        note = 'The published NATO/ITU code word is Alfa (not Alpha).'
      }
      if (letter === 'J') {
        options = ['Juliet', 'India', 'Hotel']
        note = 'The NATO/ITU code word is Juliett. RAMN 2026 prints Juliet in its marine table; that separate publication does not change this topic key.'
      }
      steps.push(show(stageId + '-show-' + letter.toLowerCase(), letter, word, itemId))
      steps.push(choose(stageId + '-choose-' + letter.toLowerCase(), itemId, 'Which NATO code word represents ' + letter + '?', word, options, note))
    }
    const [sampleLetter, sampleWord] = packet[Math.floor(packet.length / 2)]
    const sampleIndex = from + Math.floor(packet.length / 2)
    steps.push({
      kind: 'complete', id: stageId + '-written-pair',
      itemId: id('nato-phonetic', sampleIndex + 1),
      before: 'Written practice: ' + sampleLetter + ' maps to',
      after: '(no audio or live transmission).',
      options: [sampleWord, ...packet.filter(p => p[0] !== sampleLetter).map(p => p[1])].slice(0, 4),
      answer: sampleWord,
      explain: sampleLetter + ' is written as ' + sampleWord + ' in the NATO alphabet.',
    })
    const current = Array.from({ length: to - from }, (_, n) => id('nato-phonetic', from + n + 1))
    const previous = stageIndex === 0 ? [] : [id('nato-phonetic', from - 1)]
    steps.push(checkpoint(stageId + '-checkpoint', [...previous, ...current]))
    steps.push(summary(stageId + '-summary', 'Use the official written forms, including Alfa and Juliett; no voice or listening credit is awarded.'))
    return { id: stageId, title: 'Letters ' + NATO[from][0] + '–' + NATO[to - 1][0], steps }
  }) }
}

/** Thirteen printed tokens remain the entire scored boundary. */
function numberPackets(): Curriculum {
  const spans: [string, number, number][] = [
    ['zero-three', 0, 4], ['four-six', 4, 7],
    ['seven-nine', 7, 10], ['markers', 10, 13],
  ]
  const stages = spans.map(([slug, from, to], stageIndex): LessonStage => {
    const stageId = 'numbers-' + slug
    const packet = NUMBERS.slice(from, to)
    const steps: LessonStep[] = []
    for (let n = from; n < to; n++) {
      const [token, spelling] = NUMBERS[n]
      const itemId = id('radiotelephony-numbers', n + 1)
      let others = packet.filter(x => x[0] !== token).map(x => x[1])
      if (token === '3') others = ['THREE', 'TREEE', 'TOO']
      if (token === '5') others = ['FIVE', 'FOW-er', 'SIX']
      if (token === '9') others = ['NINE', 'NINER', 'AIT']
      steps.push(show(stageId + '-show-' + n, token, spelling, itemId))
      steps.push(choose(stageId + '-choose-' + n, itemId,
        'Which printed RIC-22 form belongs to ' + token + '?', spelling, others,
        'RIC-22 §4.3 prints ' + token + ' as ' + spelling + '. This checks the printed form, not the ability to hear or say it.'))
    }
    steps.push(checkpoint(stageId + '-checkpoint',
      [ ...(stageIndex ? [id('radiotelephony-numbers', from)] : []),
        ...Array.from({ length: to - from }, (_, n) => id('radiotelephony-numbers', from + n + 1)) ]))
    steps.push(summary(stageId + '-summary', 'These are RIC-22 printed phonetic forms; sound recognition is outside this lesson.'))
    return { id: stageId, title: slug === 'markers' ? 'Number Markers' : NUMBERS[from][0] + '–' + NUMBERS[to - 1][0], steps }
  })
  stages.push({
    id: 'numbers-written-groups', title: 'Written Groups',
    steps: [
      show('groups-explain', 'Digit groups',
        'RIC-22 §4.4 transmits ordinary digits separately, except whole thousands. These short exercises interpret text; they are not listening drills.'),
      { kind: 'complete', id: 'groups-choose-tree', itemId: id('radiotelephony-numbers', 4),
        before: 'Written practice: 3 →', after: '; 5 → FIFE',
        options: ['TREE', 'THREE', 'TOO', 'FOW-er'], answer: 'TREE',
        explain: 'The RIC-22 printed form for 3 is TREE, not THREE.' },
      { kind: 'complete', id: 'groups-choose-fife', itemId: id('radiotelephony-numbers', 6),
        before: 'Written practice: 7 → SEV-en; 5 →', after: '.',
        options: ['FIFE', 'FIVE', 'FOW-er', 'SIX'], answer: 'FIFE',
        explain: 'The RIC-22 printed form for 5 is FIFE, not FIVE.' },
      { kind: 'complete', id: 'groups-decimal', itemId: id('radiotelephony-numbers', 11),
        before: 'The word for a decimal point in RIC-22 §4.3 is', after: '.',
        options: ['DAY-SEE-MAL', 'HUN-dred', 'TOU-SAND', 'NIN-er'], answer: 'DAY-SEE-MAL',
        explain: 'The published decimal-point form is DAY-SEE-MAL.' },
      checkpoint('groups-checkpoint', [id('radiotelephony-numbers', 4), id('radiotelephony-numbers', 6),
        id('radiotelephony-numbers', 10), id('radiotelephony-numbers', 11), id('radiotelephony-numbers', 13)]),
      summary('groups-summary', 'Text composition is formative only; the 13 original printed-token Test items stay unchanged.'),
    ],
  })
  return { stages }
}

const CALL = 'marine-vhf-routine-calling'
const PRIORITY = 'marine-vhf-priority-communications'
const VESSEL = 'Type, name and call sign of your vessel (three times)'
const ROUTINE_SPECIFIC = ['Station called (three times)', 'THIS IS', VESSEL, 'OVER']
const ROUTINE_ALL = ['ALL STATIONS (three times)', 'THIS IS', VESSEL, 'OVER']
const MESSAGE_FIELDS = ['Originating ship', 'Date and time', 'Address', 'Text', 'Signature']

export const natoAlphabetCurriculum: Curriculum = wordPackets()
export const radioNumbersCurriculum: Curriculum = numberPackets()

/** RAMN 2026 Part 4 §4.1.1, Tables 4-1–4-4. Not adapted from RIC-22. */
export const marineCallingCurriculum: Curriculum = { stages: [
  {
    id: 'marine-specific-station', title: 'Specific Station',
    steps: [
      show('call-specific-show', 'Call the station',
        'RAMN Table 4-1: station called (three times), THIS IS, your vessel type/name/call sign (three times), OVER.', id(CALL, 1)),
      order('call-specific-order', id(CALL, 1), 'Arrange the initial specific-station call.', ROUTINE_SPECIFIC,
        'The called station is first, followed by THIS IS; the vessel identifies itself before OVER. Both station groups repeat three times.'),
      { kind: 'complete', id: 'call-specific-this-is', itemId: id(CALL, 1),
        before: 'Station called (three times) /', after: '/ Vessel identity (three times) / OVER',
        options: ['THIS IS', 'OVER', 'OUT', 'ALL STATIONS'], answer: 'THIS IS',
        explain: 'THIS IS separates the called station from the vessel making the call.' },
      checkpoint('call-specific-check', [id(CALL, 1)]),
    ],
  },
  {
    id: 'marine-all-stations', title: 'All Stations',
    steps: [
      show('call-all-show', 'Area-wide call',
        'RAMN Table 4-2 uses ALL STATIONS, or a geographically limited group, three times before THIS IS.', id(CALL, 2)),
      order('call-all-order', id(CALL, 2), 'Arrange the ALL STATIONS initial call.', ROUTINE_ALL,
        'ALL STATIONS is the addressee, not the transmitting vessel; repeat that address and the vessel identity three times.'),
      { kind: 'contrast', id: 'call-all-contrast', itemIds: [id(CALL, 1), id(CALL, 2)],
        prompt: 'The initial call is addressed to any station in range. Which call structure applies?',
        answerItemId: id(CALL, 2),
        explain: 'Use ALL STATIONS for an open call, not the named-station pattern in Table 4-1.' },
      checkpoint('call-all-check', [id(CALL, 1), id(CALL, 2)]),
    ],
  },
  {
    id: 'marine-broadcast', title: 'Broadcast Or Reply',
    steps: [
      show('call-broadcast-show', 'Broadcasting information',
        'RAMN §4.1.1.2: when broadcasting information rather than establishing communication, proceed with the message instead of an invitation to reply.', id(CALL, 3)),
      choose('call-broadcast-choose', id(CALL, 3), 'For a broadcast, what replaces the invitation to reply?',
        'It proceeds with the message instead of giving the invitation to reply',
        ['It says OVER and waits for the called station to answer',
          'It says OUT and then waits for a reply',
          'It repeats the call three more times before the message'],
        'A broadcast proceeds with its message rather than inviting a reply. RAMN does not prescribe a universal OUT ending in that paragraph.'),
      { kind: 'complete', id: 'call-broadcast-gap', itemId: id(CALL, 3),
        before: 'Broadcast initial call →', after: '(instead of an invitation to reply).',
        options: ['Message', 'OVER and wait', 'Repeat the initial call', 'Request acknowledgement'],
        answer: 'Message',
        explain: 'A broadcast proceeds into the information; it does not stop to solicit a reply.' },
      checkpoint('call-broadcast-check', [id(CALL, 2), id(CALL, 3)]),
    ],
  },
  {
    id: 'marine-ship-message', title: 'Ship Message',
    steps: [
      show('call-message-show', 'Five-part ship message',
        'RAMN §4.1.1.2 orders the originating ship, date/time, address, text, signature. The first two form the preamble.', id(CALL, 4)),
      order('call-message-order', id(CALL, 4), 'Arrange the five published ship-message fields.', MESSAGE_FIELDS,
        'The vessel and origin date/time form the preamble; the addressee precedes text and signature.'),
      { kind: 'complete', id: 'call-message-gap', itemId: id(CALL, 4),
        before: 'Originating ship / Date and time /', after: '/ Text / Signature',
        options: ['Address', 'OVER', 'Vessel repeated three times', 'MMSI'],
        answer: 'Address',
        explain: 'The address is the third field, following the two-part preamble.' },
      checkpoint('call-message-check', [id(CALL, 3), id(CALL, 4)]),
      summary('call-message-summary', 'Routine text structures only; no channels, live-radio exercise, or competence certification.'),
    ],
  },
] }

/** RAMN 2026 Part 4 §§4.1.2–4.1.4; RIC-22 §3.1 only for priority order. */
const MAYDAY_MEANING = 'A mobile unit or person is threatened by grave and imminent danger and requests immediate assistance'
const PANPAN_MEANING = 'The calling station has a very urgent message to transmit concerning the safety of a mobile unit or a person'
const SECURITE_MEANING = 'The calling station has an important navigational or meteorological warning to transmit'
const RELAY_MEANING = 'The calling station is relaying a distress message on behalf of a mobile unit or person in grave and imminent danger'
const MEANINGS = [MAYDAY_MEANING, PANPAN_MEANING, SECURITE_MEANING, RELAY_MEANING]
const DISTRESS_CALL = ['MAYDAY (three times)', 'THIS IS', 'Ship name (three times)',
  'Call sign or other identification', 'MMSI (if a DSC distress alert was sent)']
const DISTRESS_MESSAGE = ['MAYDAY', 'Ship name', 'Call sign or other identification',
  'MMSI (if a DSC distress alert was sent)', 'Position', 'Nature of distress',
  'Assistance needed', 'Other useful information', 'OVER']
const URGENCY_CALL = ['PAN PAN (three times)', 'ALL STATIONS or a specific station (three times)',
  'THIS IS', 'Station name (three times)', 'Call sign or other identification',
  'MMSI (if a DSC urgency announcement was sent)']
const SAFETY_CALL = ['SÉCURITÉ (three times)', 'ALL STATIONS (three times)', 'THIS IS',
  'Station name (three times)', 'Call sign or other identification',
  'MMSI (if a DSC safety announcement was sent)', 'Brief description of the safety message',
  'Channel or frequency for the safety broadcast', 'OUT']
const WORKING_FREQUENCY = 'On the working frequency announced at the end of the safety call'

export const marinePriorityCurriculum: Curriculum = { stages: [
  {
    id: 'priority-signal-meanings', title: 'Priority And Meaning',
    steps: [
      show('priority-show-order', 'Priority',
        'RIC-22 §3.1: distress, urgency, safety, then all other communications.', id(PRIORITY, 1)),
      order('priority-order', id(PRIORITY, 1), 'Put published communications priorities in order.',
        ['Distress', 'Urgency', 'Safety', 'All other communications'],
        'Distress outranks urgency, which outranks safety; routine communications follow.'),
      ...([['MAYDAY', MAYDAY_MEANING], ['PAN PAN', PANPAN_MEANING], ['SÉCURITÉ', SECURITE_MEANING]] as const)
        .flatMap(([signal, meaning], index): LessonStep[] => [
          show('priority-meaning-show-' + index, signal, meaning, id(PRIORITY, index + 2)),
          choose('priority-meaning-choose-' + index, id(PRIORITY, index + 2),
            'What does ' + signal + ' announce?', meaning,
            MEANINGS.filter(item => item !== meaning),
            signal + ' has this specific published meaning in RAMN Figure 4-1; it is not a scenario-based emergency classification.'),
        ]),
      checkpoint('priority-meanings-check', [id(PRIORITY, 1), id(PRIORITY, 2), id(PRIORITY, 3), id(PRIORITY, 4)]),
    ],
  },
  {
    id: 'priority-distress-call', title: 'Distress Call',
    steps: [
      show('distress-call-show', 'Distress call',
        'RAMN §4.1.2.3: MAYDAY three times; THIS IS; ship name three times; identifier; MMSI only if a DSC distress alert was sent.', id(PRIORITY, 5)),
      order('distress-call-order', id(PRIORITY, 5), 'Arrange the RAMN distress-call fields.', DISTRESS_CALL,
        'The repeated MAYDAY signal leads; THIS IS introduces the ship; MMSI is conditional on an earlier DSC alert.'),
      { kind: 'complete', id: 'distress-call-dsc', itemId: id(PRIORITY, 5),
        before: 'MMSI is included in this voice call', after: '.',
        options: ['if a DSC distress alert was sent', 'for every distress call', 'only when addressed to one station', 'instead of the vessel name'],
        answer: 'if a DSC distress alert was sent',
        explain: 'RAMN §4.1.2.3 explicitly makes spoken MMSI conditional; DSC is not a universal prerequisite for voice calls.' },
      checkpoint('distress-call-check', [id(PRIORITY, 2), id(PRIORITY, 5)]),
    ],
  },
  {
    id: 'priority-distress-message', title: 'Distress Message',
    steps: [
      show('distress-message-show', 'Call versus message',
        'A distress message begins MAYDAY once, then identifies the vessel, gives position, nature, assistance, other useful information and ends OVER. MMSI is conditional. The full key follows §4.1.2.3, not the condensed Figure 4-1.', id(PRIORITY, 6)),
      order('distress-message-preamble', id(PRIORITY, 6),
        'First, order the opening four fields of the distress message.',
        DISTRESS_MESSAGE.slice(0, 4),
        'Unlike the initial call, the distress message starts MAYDAY once; the MMSI field exists only if a DSC alert was sent.'),
      order('distress-message-details', id(PRIORITY, 6),
        'Next, order the distress-message information and ending.',
        DISTRESS_MESSAGE.slice(4),
        'Position precedes nature, assistance, useful details, and OVER for a reply.'),
      { kind: 'complete', id: 'distress-message-end', itemId: id(PRIORITY, 6),
        before: 'Position / Nature / Assistance / Other information /', after: '.',
        options: ['OVER', 'OUT', 'THIS IS', 'SÉCURITÉ'], answer: 'OVER',
        explain: 'The full distress message ends OVER because it invites acknowledgement and a reply.' },
      checkpoint('distress-message-check', [id(PRIORITY, 5), id(PRIORITY, 6)]),
      summary('distress-message-summary',
        'Figure 4-1 additionally illustrates persons on board as useful detail; it is not an extra mandatory field in the §4.1.2.3 order.'),
    ],
  },
  {
    id: 'priority-urgency-call', title: 'Urgency Call',
    steps: [
      show('urgency-call-show', 'PAN PAN call',
        'RAMN §4.1.3: PAN PAN three times; ALL STATIONS or a specific station three times; THIS IS; station name three times; identifier; MMSI if a DSC urgency announcement was sent.', id(PRIORITY, 7)),
      order('urgency-call-order', id(PRIORITY, 7), 'Arrange the published urgency-call fields.', URGENCY_CALL,
        'PAN PAN precedes the address; the transmitting station follows THIS IS. Unlike distress, urgency can address a specific station.'),
      { kind: 'complete', id: 'urgency-call-condition', itemId: id(PRIORITY, 7),
        before: 'The urgency call contains MMSI', after: '.',
        options: ['if a DSC urgency announcement was sent', 'without exception', 'only when no DSC was used', 'instead of THIS IS'],
        answer: 'if a DSC urgency announcement was sent',
        explain: 'MMSI is conditional on a DSC urgency announcement, not a compulsory voice-call field.' },
      checkpoint('urgency-call-check', [id(PRIORITY, 3), id(PRIORITY, 7)]),
    ],
  },
  {
    id: 'priority-safety-call', title: 'Safety Call',
    steps: [
      show('safety-call-show', 'SÉCURITÉ call',
        'RAMN §4.1.4 announces an important navigation or weather warning, identifies the station, states the brief context and working frequency, and ends OUT. MMSI is conditional.', id(PRIORITY, 8)),
      order('safety-call-first', id(PRIORITY, 8), 'Order the opening five safety-call fields.', SAFETY_CALL.slice(0, 5),
        'The SÉCURITÉ signal and ALL STATIONS come before THIS IS and the transmitting station identity.'),
      order('safety-call-last', id(PRIORITY, 8), 'Now order the safety call after station identification.',
        SAFETY_CALL.slice(5),
        'After conditional MMSI comes the warning context, announced working channel/frequency, then OUT.'),
      choose('safety-message-frequency', id(PRIORITY, 9),
        'Where is the safety message sent?', WORKING_FREQUENCY,
        ['On Ch16, straight after the safety call', 'On 2182 kHz only', 'On any frequency the sender chooses'],
        'The initial safety call announces a working frequency; the separate safety message is sent there.'),
      checkpoint('safety-call-check', [id(PRIORITY, 4), id(PRIORITY, 8), id(PRIORITY, 9)]),
      summary('safety-call-summary',
        'The safety message is distinct from the safety call. No operational frequency selection, distress judgement, or DSC use is taught.'),
    ],
  },
  {
    id: 'priority-structure-review', title: 'Structure Review',
    steps: [
      show('structure-review-show', 'Source-bound structures',
        'Review the published definitions and field orders. Every result here is a written formative exercise, not a live-radio claim.'),
      { kind: 'contrast', id: 'structure-review-contrast', itemIds: [id(PRIORITY, 2), id(PRIORITY, 3), id(PRIORITY, 4)],
        answerItemId: id(PRIORITY, 4),
        prompt: 'Which source-defined signal announces an important navigational or meteorological warning?',
        explain: 'SÉCURITÉ announces safety information; PAN PAN concerns urgency; MAYDAY concerns distress.' },
      checkpoint('structure-review-check', Array.from({ length: 9 }, (_, n) => id(PRIORITY, n + 1))),
      summary('structure-review-summary', 'Final Test remains the original nine scored printed items, separately recorded and optional.'),
    ],
  },
] }

/** Content exported solely for independent source/unit review. No runtime registry mutation. */
export const communicationsCurricula: Readonly<Record<string, Curriculum>> = {
  'nato-phonetic': natoAlphabetCurriculum,
  'radiotelephony-numbers': radioNumbersCurriculum,
  [CALL]: marineCallingCurriculum,
  [PRIORITY]: marinePriorityCurriculum,
}
