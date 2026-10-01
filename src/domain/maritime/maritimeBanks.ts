import type { BankItem } from '../navigation/bearingBanks'
import type { Visual } from '../visual/visual'
import type { FigureSpec } from '../visual/figures'
import {
  SCORED_ASPECTS,
  describeAspect,
  describeVisibleLights,
  visibleLights,
  type SectorLight,
} from './lights'
import {
  DAY_SHAPE_STATUS_ORDER,
  FISHING_SHAPE_STATE,
  VESSEL_STATUSES,
  describeLightStack,
  describePlanLights,
  describeShapeStack,
  statusById,
  type StatusId,
} from './statuses'

/**
 * The scored banks of Maritime I (#147): 8 aspect items, 8 light-signature
 * items and 5 day-shape items. Inputs only — every key comes from the tested
 * light model and status table, never from a separate typed answer.
 *
 * Each item is an objectively graded choice (#146). Distractors are drawn from
 * the same rule family, as the research requires: a different aspect, a
 * neighbouring vessel state. No item asks the inverse proposition that the
 * absence of a signal proves a state, because the Collision Regulations exempt
 * small vessels and some situations.
 */
function fig(figure: FigureSpec, alt: string): Visual {
  return { source: { kind: 'figure', figure }, alt }
}

function options(answer: string, wrong: string[]): string[] {
  return [answer, ...wrong].sort()
}

// ---------------------------------------------------------------------------
// Aspect items

/** Plausible alternatives when the learner mislocates or mirrors the observer. */
const FALLBACK_SETS: SectorLight[][] = [
  ['masthead'],
  ['starboard-sidelight', 'port-sidelight'],
  ['masthead', 'starboard-sidelight', 'port-sidelight'],
  ['starboard-sidelight', 'sternlight'],
  ['port-sidelight', 'sternlight'],
]

export function aspectItems(): BankItem[] {
  return SCORED_ASPECTS.map((bearing) => {
    const answer = describeVisibleLights(visibleLights(bearing))
    const candidates = [
      360 - bearing, // the mirror position, the classic port/starboard slip
      bearing + 180, // the opposite side of the vessel
      bearing + 90,
      bearing - 90,
      bearing + 45,
      bearing - 45,
    ].map((b) => describeVisibleLights(visibleLights(((b % 360) + 360) % 360)))
    candidates.push(...FALLBACK_SETS.map(describeVisibleLights))
    const wrong: string[] = []
    for (const candidate of candidates) {
      if (candidate === answer || wrong.includes(candidate)) continue
      wrong.push(candidate)
      if (wrong.length === 3) break
    }
    return {
      prompt: `An observer is ${describeAspect(bearing)} of a power-driven vessel under 50 m, underway (${String(bearing).padStart(3, '0')}° clockwise from the bow). Which of its navigation lights can the observer see?`,
      answer,
      choice: { options: options(answer, wrong) },
      stimulus: fig(
        { kind: 'vessel-plan', observer: bearing },
        `A top-down vessel with its bow at the top and an observer marker ${describeAspect(bearing)} of it, ${bearing}° clockwise from the bow.`,
      ),
    }
  })
}

// ---------------------------------------------------------------------------
// Light signatures

/** The three neighbouring states each signature is most easily confused with. */
const LIGHT_CONFUSIONS: Record<StatusId, [StatusId, StatusId, StatusId]> = {
  'power-driven': ['sailing', 'not-under-command', 'anchor'],
  sailing: ['power-driven', 'trawling', 'anchor'],
  trawling: ['fishing', 'restricted-manoeuvre', 'not-under-command'],
  fishing: ['trawling', 'restricted-manoeuvre', 'not-under-command'],
  'not-under-command': ['aground', 'restricted-manoeuvre', 'anchor'],
  'restricted-manoeuvre': ['not-under-command', 'fishing', 'aground'],
  anchor: ['aground', 'power-driven', 'not-under-command'],
  aground: ['not-under-command', 'anchor', 'restricted-manoeuvre'],
}

export function lightSignatureItems(): BankItem[] {
  return VESSEL_STATUSES.map((status, index) => {
    const { arrangement } = status
    const figure: FigureSpec =
      arrangement.kind === 'plan'
        ? { kind: 'vessel-plan', lights: arrangement.lights }
        : { kind: 'light-stack', lights: arrangement.lights }
    const alt =
      arrangement.kind === 'plan'
        ? describePlanLights(arrangement.lights)
        : describeLightStack(arrangement.lights)
    const wrong = LIGHT_CONFUSIONS[status.id].map((id) => statusById(id).state)
    return {
      prompt: `Light signal ${index + 1} — which vessel state does this light arrangement show?`,
      answer: status.state,
      choice: { options: options(status.state, wrong) },
      stimulus: fig(figure, alt),
    }
  })
}

// ---------------------------------------------------------------------------
// Day shapes

/** The state a day shape means. Fishing is shared by trawling and other fishing. */
export function shapeState(id: StatusId): string {
  if (id === 'fishing') return FISHING_SHAPE_STATE
  if (id === 'anchor') return 'Vessel at anchor'
  if (id === 'aground') return 'Vessel aground'
  return statusById(id).state
}

const SHAPE_CONFUSIONS: Record<string, [StatusId, StatusId, StatusId]> = {
  anchor: ['not-under-command', 'aground', 'restricted-manoeuvre'],
  'not-under-command': ['anchor', 'aground', 'restricted-manoeuvre'],
  'restricted-manoeuvre': ['fishing', 'not-under-command', 'aground'],
  aground: ['not-under-command', 'anchor', 'restricted-manoeuvre'],
  fishing: ['restricted-manoeuvre', 'not-under-command', 'anchor'],
}

export function dayShapeItems(): BankItem[] {
  return DAY_SHAPE_STATUS_ORDER.map((id, index) => {
    const status = statusById(id)
    const shapes = status.shapes!
    const answer = shapeState(id)
    const wrong = SHAPE_CONFUSIONS[id].map(shapeState)
    return {
      prompt: `Day shape ${index + 1} — which vessel state does this arrangement of black shapes show?`,
      answer,
      choice: { options: options(answer, wrong) },
      stimulus: fig({ kind: 'day-shape-stack', shapes }, describeShapeStack(shapes)),
    }
  })
}
