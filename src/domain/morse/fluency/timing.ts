import type { MorseTimingOptions } from '../code'

/**
 * Post-acquisition timing, and the one rule that makes it work.
 *
 * Argus has two existing timing configurations and neither is right here.
 * `DEFAULT_MORSE_TIMING` (20/9) is reserved for the deferred auditory
 * competency. `LEARN_ACQUISITION_MORSE_TIMING` (12/12) is the acquisition
 * rate, and reusing it would be actively harmful — which is worth stating
 * plainly, because it is the obvious thing to do and it is wrong.
 *
 * The 12 WPM decision is correct for what it decides. A Learn card plays one
 * character, never reaches an inter-character gap, and therefore cannot use
 * Farnsworth spacing at all; the only way to make a first exposure hearable as
 * short-versus-long is to slow the character itself, and 12 WPM does that.
 *
 * But a learner who already knows all 26 mappings is no longer trying to hear
 * short-versus-long. They are trying to stop hearing elements at all, and a dit
 * of 100ms is comfortably slow enough to count. Every post-acquisition
 * curriculum converges on the same mechanism: make the character too fast to
 * count, and recognition is the only strategy left. CW Academy's Fundamental
 * course — whose entry profile is precisely this learner, characters known and
 * copying around 6 WPM — states it as an instruction rather than a suggestion:
 * students "need to be hearing the speed at a rate where it is difficult to
 * count dits and dahs".
 *
 * So the rule here is:
 *
 *   character speed is pinned and is never a learner control;
 *   effective speed is the only number that moves.
 *
 * Farnsworth already implements exactly that split, and `buildMorseSchedule`
 * already implements Farnsworth, so this module adds no scheduling logic. It
 * adds two numbers and the ladder between them.
 */

/**
 * The pinned character speed.
 *
 * 20 rather than Fundamental's 25 for one Argus-specific reason. `code.ts`
 * records a device observation from this product's own audio work: at 20 WPM a
 * dit is 60ms and, on a phone speaker, already "reads as a fast double click".
 * At 25 WPM it is 48ms, of which the mandatory 2ms edge ramp at each end
 * consumes 4ms. That observation was made about a learner trying to *decompose*
 * a first exposure and does not straightforwardly transfer — but it is a real
 * measurement about a real speaker, and 48ms tones on that speaker have not
 * been tried.
 *
 * 20 is comfortably above the counting threshold and comfortably inside what
 * this product has already shipped audibly. Raising it to 25 is a one-line
 * change here, because every duration downstream is derived from it.
 */
export const FLUENCY_CHARACTER_WPM = 20

/**
 * The Farnsworth ladder, in effective WPM.
 *
 * Not invented. CW Academy Fundamental moves 6 → 7 → 8 → 9 → 10 across
 * fourteen advisor-led sessions and exits at 10–13 WPM with instant character
 * recognition, so these are calibrated rungs for this exact learner rather
 * than a guess at a difficulty curve.
 *
 * The ladder stops at 13 deliberately. Past that the honest next step is a
 * scored auditory boundary with a stated criterion, which is a different
 * workstream; extending this ladder to parity with character speed would be
 * promising something the source curriculum treats as beyond its own exit.
 */
export const FLUENCY_RUNGS = [6, 7, 8, 9, 10, 11, 12, 13] as const
export type FluencyRung = (typeof FLUENCY_RUNGS)[number]

export const FIRST_FLUENCY_RUNG: FluencyRung = FLUENCY_RUNGS[0]

export function isFluencyRung(value: unknown): value is FluencyRung {
  return FLUENCY_RUNGS.includes(value as FluencyRung)
}

/** Snap any stored or supplied number onto the nearest legal rung. */
export function nearestRung(value: number): FluencyRung {
  if (!Number.isFinite(value)) return FIRST_FLUENCY_RUNG
  return FLUENCY_RUNGS.reduce((best, rung) =>
    Math.abs(rung - value) < Math.abs(best - value) ? rung : best,
  )
}

export function nextRung(rung: FluencyRung): FluencyRung {
  const at = FLUENCY_RUNGS.indexOf(rung)
  return FLUENCY_RUNGS[Math.min(at + 1, FLUENCY_RUNGS.length - 1)]
}

export function previousRung(rung: FluencyRung): FluencyRung {
  const at = FLUENCY_RUNGS.indexOf(rung)
  return FLUENCY_RUNGS[Math.max(at - 1, 0)]
}

/**
 * The timing for one rung, in the shape `buildMorseSchedule` already takes.
 *
 * `characterWpm` is the constant on every rung. That invariant is the whole
 * point of the module and `timing.test.ts` asserts it directly, so a future
 * edit that "makes the early rungs easier" by slowing the character fails the
 * suite instead of quietly reintroducing counting.
 */
export function fluencyTiming(rung: FluencyRung): Required<MorseTimingOptions> {
  return { characterWpm: FLUENCY_CHARACTER_WPM, effectiveWpm: rung }
}

/**
 * How generous this rung's spacing is, as a sentence fragment for the surface.
 *
 * The learner is choosing between numbers whose meaning is not obvious — 6 and
 * 13 are both "WPM" and neither is the speed of the characters they will hear.
 * Naming the thing that actually changes is more useful than the number.
 */
export function rungDescription(rung: FluencyRung): string {
  if (rung <= 7) return 'long gaps between characters'
  if (rung <= 9) return 'comfortable gaps'
  if (rung <= 11) return 'short gaps'
  return 'barely any gap'
}
