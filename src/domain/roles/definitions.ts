/** Stable, authored role taxonomy. Safe to import in browser-test Node without runtime catalog dependencies. */
export const ROLE_IDS = ['communicator', 'navigator', 'mariner', 'diver', 'responder', 'operator'] as const

export interface RoleDefinition {
  id: (typeof ROLE_IDS)[number]
  version: number
  title: string
  description: string
  pathways: readonly { id: string; title: string; topicIds: readonly string[] }[]
}

/** Communicator v1: one earned badge, three fully open pathways, all seven requirements. */
export const COMMUNICATOR = {
  id: 'communicator',
  version: 1,
  title: 'Communicator',
  description: 'Foundational communication and signalling knowledge across codes, radio and marine procedures.',
  pathways: [
    {
      id: 'codes-signalling',
      title: 'Codes & Signalling',
      topicIds: ['nato-phonetic', 'international-morse-letters-printed', 'signal-flags'],
    },
    {
      id: 'radio-fundamentals',
      title: 'Radio Fundamentals',
      topicIds: ['radiotelephony-numbers', 'radio-procedure'],
    },
    {
      id: 'marine-communications',
      title: 'Marine Communications',
      topicIds: ['marine-vhf-routine-calling', 'marine-vhf-priority-communications'],
    },
  ],
} as const

/** Owner-ratified #197 D3. Artwork is supplied separately by the owner. */
export const NAVIGATOR = {
  id: 'navigator',
  version: 1,
  title: 'Navigator',
  description: 'Recalls compass points and converts bearings between north references.',
  pathways: [
    { id: 'direction-bearings', title: 'Direction & Bearings', topicIds: ['cardinal-bearings', 'whole-circle-bearings', 'reciprocal-bearings'] },
    { id: 'north-maps', title: 'North & Maps', topicIds: ['north-references-declination', 'grid-north-map-bearings'] },
  ],
} as const satisfies RoleDefinition

export const AVAILABLE_ROLES: readonly RoleDefinition[] = [COMMUNICATOR, NAVIGATOR]
