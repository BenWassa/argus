import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MORSE_AUDIO,
  MORSE_AUDIO_EDGE_RAMP_MS,
  MORSE_AUDIO_START_DELAY_MS,
  MorseAudioPlayer,
  MorsePlaybackCancelledError,
  type AudioContextLike,
  type AudioNodeLike,
  type AudioParamLike,
  type GainLike,
  type MorseAudioContextState,
  type OscillatorLike,
  type VisibilitySource,
} from './morseAudio'

class FakeParam implements AudioParamLike {
  value = 0
  changes: { value: number; at: number; kind: 'set' | 'ramp' }[] = []
  setValueAtTime(value: number, startTime: number) {
    this.changes.push({ value, at: startTime, kind: 'set' })
  }
  linearRampToValueAtTime(value: number, endTime: number) {
    this.changes.push({ value, at: endTime, kind: 'ramp' })
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
  state: MorseAudioContextState = 'suspended'
  destination = new FakeNode()
  oscillators: FakeOscillator[] = []
  gains: FakeGain[] = []
  resumes = 0
  closes = 0
  resumeState: MorseAudioContextState = 'running'
  rejectResume = false
  resumeGate: Promise<void> | null = null

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
    if (this.rejectResume) throw new Error('blocked')
    if (this.resumeGate) await this.resumeGate
    this.state = this.resumeState
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

function closeTo(value: number) {
  return expect.closeTo(value, 9) as unknown as number
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

  it('resumes Web Audio on the direct play path and schedules the pure timeline', async () => {
    const context = new FakeContext()
    const player = new MorseAudioPlayer(() => context, new FakeVisibility())

    const schedule = await player.play('A', { characterWpm: 20, effectiveWpm: 20, toneHz: 650, volume: 0.2 })

    expect(context.resumes).toBe(1)
    expect(context.oscillators).toHaveLength(1)
    expect(context.oscillators[0].frequency.value).toBe(650)
    expect(context.oscillators[0].starts).toEqual([10 + MORSE_AUDIO_START_DELAY_MS / 1000])
    expect(context.oscillators[0].stops[0]).toBeCloseTo(
      10 + MORSE_AUDIO_START_DELAY_MS / 1000 + schedule.durationMs / 1000,
      10,
    )
    expect(context.gains[0].gain.changes.some((change) => change.value === 0.2)).toBe(true)
  })

  it('shapes every element edge so a dit is a tone rather than a click', async () => {
    const context = new FakeContext()
    const player = new MorseAudioPlayer(() => context, new FakeVisibility())

    // K is -.- : a long, a short and a long, so both element lengths and both
    // inter-element gaps are exercised in one schedule.
    const schedule = await player.play('K', { characterWpm: 20, effectiveWpm: 20, volume: 0.4 })
    const changes = context.gains[0].gain.changes
    const start = 10 + MORSE_AUDIO_START_DELAY_MS / 1000
    const ramp = MORSE_AUDIO_EDGE_RAMP_MS / 1000

    const signals = schedule.events.filter((event) => event.kind === 'signal')
    expect(signals).toHaveLength(3)

    let at = start
    for (const event of schedule.events) {
      const duration = event.durationMs / 1000
      if (event.kind === 'signal') {
        const end = at + duration
        // Silent at the element's exact start, at full level within the ramp,
        // held, then back to silence exactly on the element's end. The element
        // window itself is untouched, so canonical timing is preserved.
        expect(changes).toContainEqual({ value: 0, at: closeTo(at), kind: 'set' })
        expect(changes).toContainEqual({ value: 0.4, at: closeTo(at + ramp), kind: 'ramp' })
        expect(changes).toContainEqual({ value: 0.4, at: closeTo(end - ramp), kind: 'set' })
        expect(changes).toContainEqual({ value: 0, at: closeTo(end), kind: 'ramp' })
        at = end
      } else {
        at += duration
      }
    }

    // Nothing is scheduled past the oscillator's own stop time.
    for (const change of changes) expect(change.at).toBeLessThanOrEqual(at + 1e-9)
  })

  it('keeps both edge ramps inside an element even when a dit is very short', async () => {
    const context = new FakeContext()
    const player = new MorseAudioPlayer(() => context, new FakeVisibility())

    // 60 WPM puts a dit at 20ms, an order below twice the nominal ramp.
    const schedule = await player.play('E', { characterWpm: 60, effectiveWpm: 60, volume: 0.5 })
    const dit = schedule.events.find((event) => event.kind === 'signal')
    expect(dit).toBeDefined()

    const changes = context.gains[0].gain.changes
    const ramps = changes.filter((change) => change.kind === 'ramp')
    const attack = ramps.find((change) => change.value === 0.5)
    const release = ramps.find((change) => change.value === 0)
    expect(attack).toBeDefined()
    expect(release).toBeDefined()
    // Full amplitude is still reached, and the attack finishes strictly before
    // the release begins, so a fast dit never degenerates into a triangle.
    expect(release!.at - attack!.at).toBeGreaterThan(0)
    expect(attack!.at - (10 + MORSE_AUDIO_START_DELAY_MS / 1000)).toBeLessThanOrEqual(
      dit!.durationMs / 1000 / 4 + 1e-9,
    )
  })

  it('uses a deliberately audible default gain while leaving final level to device media volume', async () => {
    const context = new FakeContext()
    const player = new MorseAudioPlayer(() => context, new FakeVisibility())
    await player.play('E', { characterWpm: 20, effectiveWpm: 20 })

    expect(DEFAULT_MORSE_AUDIO.volume).toBe(0.25)
    expect(context.gains[0].gain.changes.some((change) => change.value === DEFAULT_MORSE_AUDIO.volume)).toBe(true)
  })

  it('resumes interrupted as well as suspended contexts before scheduling output', async () => {
    const context = new FakeContext()
    context.state = 'interrupted'
    const player = new MorseAudioPlayer(() => context, new FakeVisibility())

    await player.play('E', { characterWpm: 20, effectiveWpm: 20 })
    expect(context.resumes).toBe(1)
    expect(context.state).toBe('running')
    expect(context.oscillators).toHaveLength(1)
  })

  it('fails clearly instead of scheduling silent nodes when resume does not reach running', async () => {
    const context = new FakeContext()
    context.state = 'interrupted'
    context.resumeState = 'interrupted'
    const player = new MorseAudioPlayer(() => context, new FakeVisibility())

    await expect(player.play('E')).rejects.toThrow(/still interrupted/)
    expect(context.oscillators).toHaveLength(0)
  })

  it('turns a rejected mobile resume into actionable non-blocking feedback', async () => {
    const context = new FakeContext()
    context.rejectResume = true
    const player = new MorseAudioPlayer(() => context, new FakeVisibility())

    await expect(player.play('E')).rejects.toThrow(/Tap Play again/)
    expect(context.oscillators).toHaveLength(0)
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

  it('lets only the newest Play own output when resume is still in flight', async () => {
    const context = new FakeContext()
    let releaseResume!: () => void
    context.resumeGate = new Promise<void>((resolve) => {
      releaseResume = resolve
    })
    const player = new MorseAudioPlayer(() => context, new FakeVisibility())

    const first = player.play('A', { characterWpm: 20, effectiveWpm: 20 })
    const second = player.play('B', { characterWpm: 20, effectiveWpm: 20 })
    releaseResume()

    await expect(first).rejects.toBeInstanceOf(MorsePlaybackCancelledError)
    const schedule = await second
    expect(schedule.text).toBe('B')
    expect(context.oscillators).toHaveLength(1)
  })

  it('cannot start a stale oscillator after Stop while resume is still in flight', async () => {
    const context = new FakeContext()
    let releaseResume!: () => void
    context.resumeGate = new Promise<void>((resolve) => {
      releaseResume = resolve
    })
    const player = new MorseAudioPlayer(() => context, new FakeVisibility())

    const pending = player.play('A')
    player.cancel()
    releaseResume()

    await expect(pending).rejects.toBeInstanceOf(MorsePlaybackCancelledError)
    expect(context.oscillators).toHaveLength(0)
  })

  it('cancels on background without racing an app-issued suspend, then resumes browser-suspended audio on the next tap', async () => {
    const visibility = new FakeVisibility()
    const context = new FakeContext()
    const player = new MorseAudioPlayer(() => context, visibility)

    await player.play('SOS', { characterWpm: 20, effectiveWpm: 20 })
    const active = context.oscillators[0]
    visibility.hidden = true
    visibility.dispatch('visibilitychange')

    expect(active.stops.at(-1)).toBeUndefined()
    await expect(player.play('E')).rejects.toThrow(/background/)

    // Model the state a mobile browser may impose while the page is hidden.
    context.state = 'suspended'
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
    expect(context.oscillators[0].stops.at(-1)).toBeUndefined()
  })

  it('recreates a context that the browser closed between navigations', async () => {
    const contexts: FakeContext[] = []
    const player = new MorseAudioPlayer(() => {
      const context = new FakeContext()
      contexts.push(context)
      return context
    }, new FakeVisibility())

    await player.play('E')
    contexts[0].state = 'closed'
    await player.play('T')
    expect(contexts).toHaveLength(2)
    expect(contexts[1].oscillators).toHaveLength(1)
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
