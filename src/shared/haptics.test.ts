// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  HAPTIC_EFFECTS,
  HAPTIC_PATTERNS,
  cancelHaptics,
  fire,
  hapticsEnabled,
  hapticsSupported,
  setHapticsEnabled,
} from './haptics'

const original = Object.getOwnPropertyDescriptor(navigator, 'vibrate')

function stubVibrate(implementation: ((pattern: number | number[]) => boolean) | undefined) {
  Object.defineProperty(navigator, 'vibrate', {
    value: implementation,
    configurable: true,
    writable: true,
  })
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  if (original) Object.defineProperty(navigator, 'vibrate', original)
  else delete (navigator as { vibrate?: unknown }).vibrate
  localStorage.clear()
})

describe('the vocabulary', () => {
  it('defines a pattern for every effect and nothing else', () => {
    expect(Object.keys(HAPTIC_PATTERNS).sort()).toEqual([...HAPTIC_EFFECTS].sort())
  })

  /**
   * The Vibration API truncates a pattern past ten entries silently, so an
   * over-long effect would be cut mid-rhythm on a real device and nowhere else.
   */
  it('keeps every pattern inside the spec entry cap', () => {
    for (const pattern of Object.values(HAPTIC_PATTERNS)) {
      const entries = Array.isArray(pattern) ? pattern.length : 1
      expect(entries).toBeLessThanOrEqual(10)
    }
  })

  it('orders weight by rarity, so a celebration cannot be out-weighed by an element', () => {
    const total = (effect: keyof typeof HAPTIC_PATTERNS) => {
      const pattern = HAPTIC_PATTERNS[effect]
      return Array.isArray(pattern) ? pattern.reduce((sum, value) => sum + value, 0) : pattern
    }
    expect(total('element')).toBeLessThan(total('settle'))
    expect(total('settle')).toBeLessThan(total('miss'))
    expect(total('miss')).toBeLessThan(total('word'))
    expect(total('word')).toBeLessThan(total('crest'))
  })

  it('keeps the routine effects short enough not to read as a buzz', () => {
    expect(HAPTIC_PATTERNS.element).toBeLessThanOrEqual(10)
    expect(HAPTIC_PATTERNS.settle).toBeLessThanOrEqual(20)
  })
})

describe('firing', () => {
  it('sends the named pattern', () => {
    const vibrate = vi.fn(() => true)
    stubVibrate(vibrate)
    expect(fire('settle')).toBe(true)
    expect(vibrate).toHaveBeenCalledWith(HAPTIC_PATTERNS.settle)
  })

  it('is a silent no-op where the API does not exist', () => {
    stubVibrate(undefined)
    expect(hapticsSupported()).toBe(false)
    expect(fire('crest')).toBe(false)
  })

  it('never throws when the platform does', () => {
    stubVibrate(() => {
      throw new Error('blocked by the user agent')
    })
    expect(() => fire('miss')).not.toThrow()
    expect(fire('miss')).toBe(false)
  })

  it('reports a refusal from the platform honestly', () => {
    // A hidden document returns false per spec; the caller must not be told
    // the learner felt something they did not.
    stubVibrate(() => false)
    expect(fire('word')).toBe(false)
  })

  it('does nothing at all once the learner turns it off', () => {
    const vibrate = vi.fn(() => true)
    stubVibrate(vibrate)
    setHapticsEnabled(false)
    for (const effect of HAPTIC_EFFECTS) expect(fire(effect)).toBe(false)
    expect(vibrate).not.toHaveBeenCalled()
  })

  it('cancels in place', () => {
    const vibrate = vi.fn(() => true)
    stubVibrate(vibrate)
    cancelHaptics()
    expect(vibrate).toHaveBeenCalledWith(0)
  })
})

describe('the preference', () => {
  it('is on by default', () => {
    expect(hapticsEnabled()).toBe(true)
  })

  it('round-trips', () => {
    setHapticsEnabled(false)
    expect(hapticsEnabled()).toBe(false)
    setHapticsEnabled(true)
    expect(hapticsEnabled()).toBe(true)
  })

  it('stores nothing when it is on, so the default has one representation', () => {
    setHapticsEnabled(false)
    setHapticsEnabled(true)
    expect(localStorage.getItem('argus.haptics.v1')).toBeNull()
  })
})
