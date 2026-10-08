/** Stable, authored role taxonomy. Safe to import in browser-test Node without runtime catalog dependencies. */
export const ROLE_IDS = ['communicator', 'navigator', 'mariner', 'diver', 'responder', 'operator'] as const

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
