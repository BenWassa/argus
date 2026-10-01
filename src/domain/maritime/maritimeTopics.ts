import type { LearnContent, LearnEntry } from '../learning/content'
import type { IdentifiedItem, Topic } from '../library/topic'
import type { FigureSpec } from '../visual/figures'
import type { Visual } from '../visual/visual'
import type { BankItem } from '../navigation/bearingBanks'
import { aspectItems, dayShapeItems, lightSignatureItems, shapeState } from './maritimeBanks'
import {
  DAY_SHAPE_STATUS_ORDER,
  VESSEL_STATUSES,
  describeLightStack,
  describePlanLights,
  describeShapeStack,
  statusById,
} from './statuses'

/**
 * The two shipped topics of Maritime I (#147): Navigation Lights & Aspect (16
 * scored items, with the vessel-orientation vocabulary as Learn-only
 * prerequisite) and Vessel Day Shapes (5). Content authority is
 * `docs/open/ISSUE_138_MARITIME_VISUAL_LITERACY.md`, which traces every item to
 * the Collision Regulations.
 *
 * The target competence is decoding standardized vessel information. It is not
 * collision avoidance, watchkeeping, legal compliance for a particular vessel or
 * a boating qualification, and each topic says so.
 */
const COLREGS = {
  label: 'Canada — Collision Regulations, C.R.C., c. 1416, Schedule 1',
  url: 'https://laws-lois.justice.gc.ca/eng/regulations/C.R.C.%2C_c._1416/',
  note: 'Controlling Canadian source for Rules 20, 21, 23 and 25–30 and Annex I, including Canadian modifications.',
}
const IMO_COLREG = {
  label: 'IMO — COLREG Convention',
  url: 'https://www.imo.org/en/about/conventions/pages/colreg.aspx',
  note: 'International owner of the Regulations; cross-check for the Rule 20–31 structure.',
}
const TC_GUIDE = {
  label: 'Transport Canada — Safe Boating Guide (TP 511E)',
  url: 'https://tc.canada.ca/en/marine-transportation/publications',
  note: 'Learner-facing Canadian explanation of orientation and light sectors; the Regulations control where they differ.',
}

const SCOPE_LIMITS =
  'Completing this topic does not show that you can navigate safely, avoid collisions, keep a watch, meet the legal requirements of a particular vessel, or hold a Pleasure Craft Operator Card or any maritime qualification. It teaches what standardized signals mean, not what to do about them.'

const ABSENCE =
  'A displayed signal is interpreted; the absence of one proves nothing. The Regulations exempt small vessels and some situations, so never conclude from what you do not see that a vessel is not in a given state.'

const EDITORIAL =
  'The example vessel (power-driven, under 50 m), the eight light signatures, the five day shapes, the drawing style and the choice of distractors are Argus editorial choices. The sector arcs, colours and shape meanings are from the Collision Regulations.'

function figure(f: FigureSpec, alt: string, caption?: string): Visual {
  return { source: { kind: 'figure', figure: f }, alt, ...(caption ? { caption } : {}) }
}

function withIds(topicId: string, items: BankItem[]): IdentifiedItem[] {
  return items.map((item, index) => ({
    id: `${topicId}-item-${String(index + 1).padStart(2, '0')}`,
    kind: 'forward' as const,
    ...item,
  }))
}

function unstarted(base: Pick<Topic, 'id' | 'title' | 'scope' | 'items' | 'learn'>): Topic {
  return {
    ...base,
    track: 'tradecraft',
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

// ---------------------------------------------------------------------------

const LIGHTS_ID = 'navigation-lights'

/** Learn alt text may name the state: it is instruction, not a scored stimulus. */
const signatureEntries: LearnEntry[] = VESSEL_STATUSES.map((status) => {
  const { arrangement } = status
  const f: FigureSpec =
    arrangement.kind === 'plan'
      ? { kind: 'vessel-plan', lights: arrangement.lights }
      : { kind: 'light-stack', lights: arrangement.lights }
  const description =
    arrangement.kind === 'plan' ? describePlanLights(arrangement.lights) : describeLightStack(arrangement.lights)
  const extra: Record<string, string> = {
    'power-driven': 'A vessel under 50 m may also show a second masthead light; that option is not scored.',
    sailing: 'Optional alternatives exist, including a red-over-green all-round pair at the masthead and combined lanterns for small vessels; they are not scored.',
    trawling: 'Sidelights and a sternlight are added when the vessel is making way, and the masthead light arrangement depends on length. Only the distinguishing pair is scored.',
    fishing: 'Sidelights and a sternlight are added when making way, and a further signal marks outlying gear. Only the distinguishing pair is scored.',
    'not-under-command': 'Sidelights and a sternlight are added when the vessel is making way through the water.',
    'restricted-manoeuvre': 'Further lights are added when the vessel is making way and when at anchor. Only the distinguishing three are scored.',
    anchor: 'A vessel of 50 m or more shows more anchor lights than this. Rule 30 also exempts some small vessels.',
    aground: 'The two red lights go where they can best be seen; the stack drawn here is a teaching depiction, not a rule about their position.',
  }
  return {
    marker: status.rule.replace('Rule ', ''),
    title: status.state,
    meta: `Collision Regulations, ${status.rule}`,
    fields: [
      { label: 'Lights', text: description },
      { label: 'Not scored', text: extra[status.id] },
    ],
    visual: figure(f, `${status.state}. ${description}`),
  }
})

const lightsLearn: LearnContent = {
  kind: 'briefing',
  overview:
    'Navigation lights let you read, from the lights alone, which way a vessel is facing and what it is doing. This topic teaches which lights an observer can see from each side of a vessel, and what eight common light arrangements say. It teaches decoding, not manoeuvring.',
  sections: [
    {
      heading: 'Orient the vessel',
      blocks: [
        {
          type: 'paragraph',
          text: 'Every question here uses one top-down drawing with the bow at the top. You only need these terms; none of them is scored.',
        },
        {
          type: 'definitions',
          items: [
            { term: 'Bow and stern', definition: 'The bow is the forward end of the vessel. The stern is the after end.' },
            { term: 'Port and starboard', definition: 'Looking forward toward the bow, port is the left side and starboard is the right. Red goes with port and green with starboard.' },
            { term: 'Ahead and astern', definition: 'Ahead is the direction the bow points. Astern is the opposite direction, behind the stern.' },
            { term: 'Beam and abeam', definition: 'The beam is at right angles to the centreline, directly out to either side. Abeam means on that line.' },
            { term: 'Fore-and-aft centreline', definition: 'The line down the middle of the hull from bow to stern.' },
            { term: '22.5° abaft the beam', definition: 'Abaft means toward the stern. 22.5° abaft the beam is 112.5° from dead ahead, where the masthead and sidelight sectors end.' },
            { term: 'Underway', definition: 'Not at anchor, made fast to the shore or aground. A vessel can be underway and stopped.' },
            { term: 'Making way through the water', definition: 'Actually moving through the water. Some vessel states add sidelights and a sternlight only when making way.' },
          ],
        },
        {
          type: 'visual',
          visual: figure(
            { kind: 'vessel-plan', labels: true },
            'A top-down vessel with the bow at the top and a dashed centreline. Port is labelled on the left and starboard on the right, with bow and stern labelled at the ends.',
            'Bow up: port is on the left, starboard on the right.',
          ),
        },
      ],
    },
    {
      heading: 'How the light sectors work',
      blocks: [
        {
          type: 'paragraph',
          text: 'Lights are shown from sunset to sunrise, and in restricted visibility; day shapes are shown by day. Each light is visible only over a fixed arc, so which lights you see depends on where you stand around the vessel. Bearings here are your position clockwise from the bow: 045° is on the starboard bow.',
        },
        {
          type: 'table',
          columns: ['Light', 'Colour', 'Arc', 'Visible from'],
          rows: [
            ['Masthead', 'White', '225°', 'Right ahead to 22.5° abaft the beam on each side'],
            ['Starboard sidelight', 'Green', '112.5°', 'Right ahead to 22.5° abaft the starboard beam'],
            ['Port sidelight', 'Red', '112.5°', 'Right ahead to 22.5° abaft the port beam'],
            ['Sternlight', 'White', '135°', 'Centred astern: 67.5° either side of dead astern'],
            ['All-round light', 'Various', '360°', 'Everywhere, so it does not change with where you stand'],
          ],
        },
        {
          type: 'visual',
          visual: figure(
            { kind: 'vessel-plan', sectors: true },
            'A top-down vessel with four arcs drawn around it. A long white arc lettered M runs from abaft the port beam over the bow to abaft the starboard beam. A green arc lettered G covers the starboard bow. A red arc lettered R covers the port bow. A white arc lettered S covers the stern.',
            'M masthead, G green sidelight, R red sidelight, S sternlight. The arcs are drawn from the rule values. Where two arcs overlap, you see both lights.',
          ),
        },
        {
          type: 'steps',
          items: [
            'Place yourself around the vessel as a bearing clockwise from the bow.',
            'Check each arc: is your bearing inside it?',
            'Dead ahead is the one edge worth remembering: there you see the masthead light and both sidelights, and no sternlight.',
          ],
        },
      ],
    },
    {
      heading: 'What vessel states add',
      blocks: [
        {
          type: 'paragraph',
          text: 'Some lights are all-round lights, shown in a vertical line. The colours and their order say what the vessel is doing. Learn the distinguishing part of each signal; the notes say what is left out.',
        },
        { type: 'entries', entries: signatureEntries },
        {
          type: 'bullets',
          items: [
            'Vessels under 12 m are exempt from the Rule 27 signals, except in diving operations, so their absence says nothing.',
            'A status signal tells you what a vessel is doing. It does not tell you who gives way or what to do about it.',
            'Canada adds positioning modifications for the Great Lakes and inland waters that are outside this topic.',
          ],
        },
      ],
    },
  ],
  limitations: [ABSENCE, EDITORIAL, SCOPE_LIMITS],
  sources: [COLREGS, IMO_COLREG, TC_GUIDE],
}

// ---------------------------------------------------------------------------

const SHAPES_ID = 'vessel-day-shapes'

const shapeEntries: LearnEntry[] = DAY_SHAPE_STATUS_ORDER.map((id) => {
  const status = statusById(id)
  const shapes = status.shapes!
  return {
    marker: status.rule.replace('Rule ', ''),
    title: shapeState(id),
    meta: `Collision Regulations, ${status.rule}`,
    fields: [{ label: 'Shapes', text: describeShapeStack(shapes) }],
    ...(id === 'fishing'
      ? { note: 'The same two cones mean trawling and other fishing; the lights tell them apart.' }
      : {}),
    visual: figure({ kind: 'day-shape-stack', shapes }, `${shapeState(id)}. ${describeShapeStack(shapes)}`),
  }
})

const shapesLearn: LearnContent = {
  kind: 'concise',
  overview:
    'By day, vessels show black shapes instead of lights. Five arrangements matter first, and they reinforce the light signals: one ball, two balls, ball-diamond-ball, three balls, and two cones with their apexes together.',
  sections: [
    {
      heading: 'Five arrangements',
      blocks: [
        { type: 'entries', entries: shapeEntries },
        {
          type: 'paragraph',
          text: 'The strongest confusions are one, two and three balls, and two cones against ball-diamond-ball. Count the shapes, then note their order.',
        },
      ],
    },
    {
      heading: 'What the shapes are',
      blocks: [
        {
          type: 'definitions',
          items: [
            { term: 'Ball', definition: 'A black sphere, diameter at least 0.6 m.' },
            { term: 'Cone', definition: 'Base diameter at least 0.6 m and height equal to its diameter. The apex is the point.' },
            { term: 'Cylinder', definition: 'Diameter at least 0.6 m and height twice its diameter. It is not used in this topic.' },
            { term: 'Diamond', definition: 'Two cones with a common base.' },
          ],
        },
        {
          type: 'paragraph',
          text: 'Shapes are black. On vessels under 20 m they may be smaller, in proportion to the vessel. The drawings here keep the shapes’ proportions but not their size.',
        },
        {
          type: 'paragraph',
          text: 'Two shapes are left out on purpose. The cone with its apex down for a vessel under sail and power has a Canadian size and waters exception, and the cylinder for a vessel constrained by her draught is prohibited in Canadian inland waters. Neither fits a context-free card.',
        },
      ],
    },
  ],
  limitations: [
    'This topic teaches what a displayed shape means, not that every vessel in that state must display it. The Regulations exempt small vessels, so a missing shape proves nothing.',
    EDITORIAL,
    SCOPE_LIMITS,
  ],
  sources: [COLREGS, IMO_COLREG],
}

// ---------------------------------------------------------------------------

export const MARITIME_TOPIC_IDS = [LIGHTS_ID, SHAPES_ID] as const

export function maritimeTopics(): Topic[] {
  return [
    unstarted({
      id: LIGHTS_ID,
      title: 'Navigation Lights & Aspect',
      scope:
        'Sixteen visual items on a canonical power-driven vessel under 50 m, underway: which basic navigation lights an observer sees from eight positions around it (8), and which vessel state eight light arrangements show (8): power-driven, sailing, trawling, other fishing, not under command, restricted in ability to manoeuvre, at anchor and aground. Vessel orientation terms are Learn-only. Test does not cover collision avoidance, sound signals, towing, pilotage, constrained by draught or any vessel not shown.',
      items: withIds(LIGHTS_ID, [...aspectItems(), ...lightSignatureItems()]),
      learn: lightsLearn,
    }),
    unstarted({
      id: SHAPES_ID,
      title: 'Vessel Day Shapes',
      scope:
        'Five visual items: which vessel state five day-shape arrangements show — one ball (at anchor), two balls (not under command), ball-diamond-ball (restricted in ability to manoeuvre), three balls (aground) and two cones apexes together (fishing). Test does not cover shape construction, size rules, other shapes or collision avoidance.',
      items: withIds(SHAPES_ID, dayShapeItems()),
      learn: shapesLearn,
    }),
  ]
}
