import { describe, expect, it } from 'vitest'
import {
  MorseAudioPlayer,
  type AudioContextLike,
  type AudioNodeLike,
  type AudioParamLike,
  type GainLike,
  type OscillatorLike,
  type VisibilitySource,
} from './morseAudio'

class FakeParam implements AudioParamLike {
  value = 0
  changes: { value: number; at: number }[] = []
  setValueAtTime(value: number, startTime: number) {
    this.changes.push({ value, at: startTime })
  }
}

class FakeNode implements AudioNodeLike {
  connected = 0
  disconnected = 0
  connect(_destination: AudioNodeLike) {
    this.connected += 1
    return undefined
  }
  disconnect() {
    this.disconnected += 1
  }
}

class FakeOscillator extends FakeNode implements OscillatorLike {
  type: OscillatorType = 'sine'
  frequency = new FakeParam()
  starts: number[] = []
  stops: (number | undefined)[] = []
  start(when?: number) {
    this.starts.push(when ?? 0)
  }
  stop(when?: number) {
    this.stops.push(when)
  }
}

class FakeGain extends FakeNode implements GainLike {
  gain = new FakeParam()
}

class FakeContext implements AudioContextLike {
  currentTime = 10
  state = 'suspended'
  destination = new FakeNode()
  oscillators: FakeOscillator[] = []
  gains: FakeGain[] = []
  resumes = 0
  suspends = 0
  closes = 0

  createOscillator() {
    const oscillator = new FakeOscillator()
    this.oscillators.push(oscillator)
    return oscillator
  }
  createGain() {
    const gain = new FakeGain()
    this.gains.push(gain)
    return gain
  }
  async resume() {
    this.resumes += 1
    this.state = 'running'
  }
  async suspend() {
    this.suspends += 1
    this.state = 'suspended'
  }
  async close() {
    this.closes += 1
    this.state = 'closed'
  }
}

class FakeVisibility implements VisibilitySource {
  hidden = false
  private listeners = new Map<string, Set<() => void>>()

  addEventListener(type: 'visibilitychange' | 'pagehide', listener: () => void) {
    const listeners = this.listeners.get(type) ?? new Set<() => void>()
    listeners.add(listener)
    this.listeners.set(type, listeners)
  }
  removeEventListener(type: 'visibilitychange' | 'pagehide', listener: () => void) {
    this.listeners.get(type)?.delete(listener)
  }
  dispatch(type: 'visibilitychange' | 'pagehide') {
    for (const listener of this.listeners.get(type) ?? []) listener()
  }
  listenerCount(type: 'visibilitychange' | 'pagehide') {
    return this.listeners.get(type)?.size ?? 0
  }
}

describe('MorseAudioPlayer', () => {
  it('has no autoplay side effect: construction does not create an AudioContext', async () => {
    let contexts = 0
    const visibility = new FakeVisibility()
    const player = new MorseAudioPlayer(() => {
      contexts += 1
      return new FakeContext()
    }, visibility)

    expect(contexts).toBe(0)
    await player.dispose()
    expect(contexts).toBe(0)
  })

  it('resumes Web Audio only on explicit play and schedules the pure timeline', async () => {
    const context = new FakeContext()
    const player = new MorseAudioPlayer(() => context, new FakeVisibility())

    const schedule = await player.play('A', { characterWpm: 20, effectiveWpm: 20, toneHz: 650, volume: 0.2 })

    expect(context.resumes).toBe(1)
    expect(context.oscillators).toHaveLength(1)
    expect(context.oscillators[0].frequency.value).toBe(650)
    expect(context.oscillators[0].starts).toHaveLength(1)
    expect(context.oscillators[0].stops[0]).toBeCloseTo(10.015 + schedule.durationMs / 1000, 10)
    expect(context.gains[0].gain.changes.some((change) => change.value === 0.2)).toBe(true)
  })

  it('cancels current playback before a new play or replay', async () => {
    const context = new FakeContext()
    const player = new MorseAudioPlayer(() => context, new FakeVisibility())

    await player.play('A', { characterWpm: 20, effectiveWpm: 20 })
    const first = context.oscillators[0]
    await player.play('B', { characterWpm: 20, effectiveWpm: 20 })
    expect(first.stops.at(-1)).toBeUndefined()
    expect(first.disconnected).toBe(1)

    const second = context.oscillators[1]
    const replay = await player.replay()
    expect(second.stops.at(-1)).toBeUndefined()
    expect(replay.text).toBe('B')
  })

  it('cancels and suspends on backgrounding, then permits a later explicit foreground play', async () => {
    const visibility = new FakeVisibility()
    const context = new FakeContext()
    const player = new MorseAudioPlayer(() => context, visibility)

    await player.play('SOS', { characterWpm: 20, effectiveWpm: 20 })
    const active = context.oscillators[0]
    visibility.hidden = true
    visibility.dispatch('visibilitychange')
    await Promise.resolve()

    expect(active.stops.at(-1)).toBeUndefined()
    expect(context.suspends).toBe(1)
    await expect(player.play('E')).rejects.toThrow(/background/)

    visibility.hidden = false
    await player.play('E', { characterWpm: 20, effectiveWpm: 20 })
    expect(context.resumes).toBe(2)
    expect(context.oscillators).toHaveLength(2)
  })

  it('also cancels on pagehide for mobile navigation/background lifecycle', async () => {
    const visibility = new FakeVisibility()
    const context = new FakeContext()
    const player = new MorseAudioPlayer(() => context, visibility)
    await player.play('E', { characterWpm: 20, effectiveWpm: 20 })

    visibility.dispatch('pagehide')
    await Promise.resolve()
    expect(context.oscillators[0].stops.at(-1)).toBeUndefined()
    expect(context.suspends).toBe(1)
  })

  it('validates tone and volume before creating an audible node', async () => {
    const context = new FakeContext()
    const player = new MorseAudioPlayer(() => context, new FakeVisibility())

    await expect(player.play('E', { toneHz: 100 })).rejects.toThrow(/toneHz/)
    await expect(player.play('E', { volume: 2 })).rejects.toThrow(/volume/)
    expect(context.oscillators).toHaveLength(0)
  })

  it('disposal unregisters lifecycle hooks, cancels audio, and closes the context', async () => {
    const visibility = new FakeVisibility()
    const context = new FakeContext()
    const player = new MorseAudioPlayer(() => context, visibility)
    expect(visibility.listenerCount('visibilitychange')).toBe(1)
    expect(visibility.listenerCount('pagehide')).toBe(1)

    await player.play('E', { characterWpm: 20, effectiveWpm: 20 })
    await player.dispose()

    expect(visibility.listenerCount('visibilitychange')).toBe(0)
    expect(visibility.listenerCount('pagehide')).toBe(0)
    expect(context.closes).toBe(1)
    await expect(player.play('E')).rejects.toThrow(/disposed/)
  })
})
