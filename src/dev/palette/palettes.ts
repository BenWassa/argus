import { contrastRatio, hueDistance, toOklch, type Colour } from './colour'

export const candidateIds = ['current', 'signal', 'peacock', 'families'] as const
export type CandidateId = typeof candidateIds[number]
export const modeRoles = ['key', 'listen', 'read', 'free'] as const
export const trackRoles = ['knowledge', 'survival', 'tradecraft'] as const
export const roleIds = ['action', ...modeRoles, ...trackRoles, 'correct', 'miss', 'decay'] as const
export type Role = typeof roleIds[number]
export type Palette = Record<Role, Colour | null> & { actionInk: Colour }

const semantic = { correct: [0.78, 0.09, 170] as const, miss: '#d98078', decay: '#d68d5e' }
export const palettes: Record<CandidateId, Palette> = {
  current: {
    ...semantic, correct: '#92b5ae', action: '#e9edf3', actionInk: '#0b0d10',
    key: null, listen: null, read: null, free: null,
    knowledge: [0.76, 0.085, 250], survival: [0.77, 0.075, 205], tradecraft: [0.75, 0.085, 300],
  },
  signal: {
    ...semantic, action: [0.87, 0.15, 95], actionInk: [0.22, 0.03, 95],
    key: [0.80, 0.15, 150], listen: [0.78, 0.12, 250], read: [0.76, 0.13, 300], free: [0.80, 0.11, 205],
    knowledge: [0.78, 0.12, 250], survival: [0.80, 0.11, 205], tradecraft: [0.76, 0.13, 300],
  },
  peacock: {
    ...semantic, action: [0.80, 0.13, 190], actionInk: [0.18, 0.03, 220],
    key: [0.85, 0.14, 90], listen: [0.78, 0.12, 255], read: [0.76, 0.13, 305], free: [0.78, 0.12, 350],
    knowledge: [0.78, 0.12, 255], survival: [0.80, 0.13, 150], tradecraft: [0.76, 0.13, 305],
  },
  families: {
    ...semantic, action: [0.87, 0.15, 95], actionInk: [0.22, 0.03, 95],
    key: [0.80, 0.16, 140], listen: [0.80, 0.15, 228], read: [0.76, 0.16, 330], free: [0.82, 0.14, 175],
    knowledge: [0.76, 0.10, 250], survival: [0.77, 0.10, 205], tradecraft: [0.75, 0.10, 300],
  },
}

export const surfaces = {
  bg: '#101215', surface: '#16191d', 'surface-2': '#1d2126',
  'surface-3': '#272c33', 'surface-4': '#343a42', field: '#0b0d10',
} as const

export const screenRoles: Record<'Morse' | 'App', readonly Role[]> = {
  Morse: ['action', ...modeRoles, 'miss', 'decay'],
  App: ['action', ...trackRoles, 'correct', 'miss', 'decay'],
}

/** Every co-occurring pair stays visible, including pairs that pass. */
export function pairReport(palette: Palette, roles: readonly Role[]) {
  return roles.flatMap((a, index) => roles.slice(index + 1).map(b => {
    const first = palette[a]
    const second = palette[b]
    if (!first || !second) return { a, b, hue: null, lightness: null, conflict: false }
    const [l1, , h1] = toOklch(first)
    const [l2, , h2] = toOklch(second)
    const hue = hueDistance(h1, h2)
    const lightness = Math.abs(l1 - l2)
    return { a, b, hue, lightness, conflict: hue < 30 && lightness < 0.08 }
  }))
}

export function contrastReport(palette: Palette) {
  return roleIds.flatMap(role => {
    const colour = palette[role]
    return colour ? Object.entries(surfaces).map(([surface, background]) => {
      const ratio = contrastRatio(colour, background)
      return { role, surface, ratio, textPass: ratio >= 4.5, iconPass: ratio >= 3 }
    }) : []
  })
}
