import type { LearnContent, LearnEntry } from '../learning/content'
import type { IdentifiedItem, Topic } from '../library/topic'
import { flagItems } from './flagBank'
import { FLAG_CONFUSION_SETS, SIGNAL_FLAGS, type SignalFlag } from './flags'

/**
 * The shipped topic of Maritime II (#148): twelve selected International Code of
 * Signals single-letter flags. Content authority is
 * `docs/open/ISSUE_138_MARITIME_VISUAL_LITERACY.md` §3D.
 *
 * The twelve are an Argus editorial selection from the Code's already
 * prioritized single-letter signals, not an official sub-code, and the target
 * competence is recognizing a flag and its practical meaning — not signalling
 * procedure, and not a maritime qualification.
 */
export const FLAGS_TOPIC_ID = 'signal-flags'

const IMO_ICS = {
  label: 'IMO — International Code of Signals (2005 edition; Fifth edition 2021, March 2022 errata)',
  url: 'https://www.imo.org/en/publications/pages/currentpublications.aspx',
  note: 'Canonical authority for the meanings of the single-letter signals. The March 2022 errata does not amend the single-letter table.',
}
const NGA_ICS = {
  label: 'NGA — Pub. 102, International Code of Signals',
  url: 'https://msi.nga.mil/Publications/ICOS',
  note: 'Freely accessible official independent cross-check of the single-letter table and flag depictions; the current IMO edition wins where they differ.',
}
const COLREGS = {
  label: 'Canada — Collision Regulations, C.R.C., c. 1416, Schedule 1',
  url: 'https://laws-lois.justice.gc.ca/eng/regulations/C.R.C.%2C_c._1416/',
  note: 'Rule 27(e) requires a rigid replica of Code flag A in a specified diving-operation case, an independent confirmation of the meaning of A.',
}

const GROUPS: { heading: string; group: SignalFlag['group'] }[] = [
  {
    heading: 'Warnings to others',
    group: 'warning',
  },
  {
    heading: 'Vessel state',
    group: 'state',
  },
  {
    heading: 'Assistance',
    group: 'assistance',
  },
]

function sibling(flag: SignalFlag): string | undefined {
  const sets = FLAG_CONFUSION_SETS.filter((set) => set.includes(flag.letter))
  const others = [...new Set(sets.flatMap((set) => set.filter((letter) => letter !== flag.letter)))]
  return others.length ? others.join(', ') : undefined
}

function entry(flag: SignalFlag): LearnEntry {
  const confused = sibling(flag)
  return {
    marker: flag.letter,
    title: flag.name,
    fields: [
      { label: 'Meaning', text: flag.meaning },
      { label: 'Design', text: flag.description },
      ...(confused ? [{ label: 'Do not confuse with', text: confused }] : []),
    ],
    visual: {
      source: { kind: 'figure', figure: { kind: 'signal-flag', letter: flag.letter } },
      alt: `Flag ${flag.letter} (${flag.name}). ${flag.description}`,
    },
  }
}

const learn: LearnContent = {
  kind: 'concise',
  overview:
    'Single-letter flags communicate warnings, vessel states and requests for assistance. The published International Code governs their meanings.',
  sections: [
    ...GROUPS.map(({ heading, group }) => ({
      heading,
      blocks: [
        { type: 'entries' as const, entries: SIGNAL_FLAGS.filter((flag) => flag.group === group).map(entry) },
      ],
    })),
    {
      heading: 'Pairs that get mixed up',
      blocks: [
        {
          type: 'bullets',
          items: [
            'D: manoeuvring with difficulty; F: disabled; M: stopped and making no way. Compare bands, diamond and cross.',
            'U: danger; V: assistance; W: medical assistance. Compare quarters, cross and nested rectangles.',
            'B: dangerous goods; J: fire with dangerous cargo, or dangerous-cargo leak. Plain red versus blue-white-blue.',
            'L tells another vessel to stop; M describes your own stopped vessel.',
            'A: diver down; O: man overboard. White-blue halves versus red-yellow diagonal.',
          ],
        },
      ],
    },
    {
      heading: 'Alphabetical reference',
      blocks: [
        {
          type: 'table',
          columns: ['Flag', 'Name', 'Meaning'],
          rows: [...SIGNAL_FLAGS].map((flag) => [flag.letter, flag.name, flag.meaning]),
        },
      ],
    },
  ],
  limitations: [
    'An Argus selection, not an official sub-code. Flags may have other contextual meanings; the published Code governs.',
    'Argus drawings follow Code designs. Recognition is not signalling procedure or a maritime qualification.',
    'Letter, name, meaning and design remain text; pictures add recognition.',
  ],
  sources: [IMO_ICS, NGA_ICS, COLREGS],
}

export function flagTopic(): Topic {
  const items: IdentifiedItem[] = flagItems().map((item, index) => ({
    id: `${FLAGS_TOPIC_ID}-item-${String(index + 1).padStart(2, '0')}`,
    kind: 'forward' as const,
    ...item,
  }))
  return {
    id: FLAGS_TOPIC_ID,
    title: 'Signal Flags',
    scope:
      'Twelve selected International Code of Signals single-letter flags — A, B, D, F, J, L, M, O, U, V, W and Y — shown as a flag picture, tested flag → letter and practical meaning. An Argus editorial selection, not an official sub-code. Test does not cover the rest of the Code, numeral pennants, two-letter signals, signalling procedure or any qualification.',
    track: 'tradecraft',
    items,
    learn,
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

