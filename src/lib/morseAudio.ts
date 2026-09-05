import { buildMorseSchedule, type MorseSchedule, type MorseTimingOptions } from './morse'

export interface AudioParamLike {
  value: number
  setValueAtTime(value: number, startTime: number): void
}

export interface AudioNodeLike {
  connect(destination: AudioNodeLike): unknown
  disconnect(): void
}

export interface OscillatorLike extends AudioNodeLike {
  type: OscillatorType
  frequency: AudioParamLike
  start(when?: number): void
  stop(when?: number): void
}

export interface GainLike extends AudioNodeLike {
  gain: AudioParamLike
}

/** Safari exposes `interrupted`; Chromium normally reports suspended/running/closed. */
export type MorseAudioContextState = AudioContextState | 'interrupted'

export interface AudioContextLike {
  currentTime: number
  state: MorseAudioContextState
  destination: AudioNodeLike
  createOscillator(): OscillatorLike
  createGain(): GainLike
  resume(): Promise<void>
  close(): Promise<void>
}

export interface VisibilitySource {
  hidden: boolean
  addEventListener(type: 'visibilitychange' | 'pagehide', listener: () => void): void
  removeEventListener(type: 'visibilitychange' | 'pagehide', listener: () => void): void
}

export interface MorseAudioOptions extends MorseTimingOptions {
  toneHz?: number
  /** Linear Web Audio gain, 0–1. Device media volume remains the final output control. */
  volume?: number
}

/** Shared by the oscillator schedule and the visual highlight timers. */
export const MORSE_AUDIO_START_DELAY_MS = 20

/**
 * 0.25 is intentionally stronger than the original 0.12 default (+6.4 dB in
 * amplitude terms) after the production-phone report that the tone was not
 * practically audible. It remains well below full-scale; the device's media
 * volume is still authoritative.
 */
export const DEFAULT_MORSE_AUDIO = {
  toneHz: 700,
  volume: 0.25,
} as const

function defaultContextFactory(): AudioContextLike {
  if (typeof window === 'undefined') throw new Error('Morse audio is unavailable outside a browser.')
  const AudioContextCtor = window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextCtor) throw new Error('This browser does not provide Web Audio for Morse playback.')
  return new AudioContextCtor()
}

function defaultVisibilitySource(): VisibilitySource | undefined {
  return typeof document === 'undefined' ? undefined : document
}

function finiteInRange(value: number, min: number, max: number, name: string): number {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${name} must be between ${min} and ${max}.`)
  }
  return value
}

interface ActiveAudio {
  oscillator: OscillatorLike
  gain: GainLike
}

/**
 * Explicit, user-driven Morse playback.
 *
 * Important mobile lifecycle rule: backgrounding cancels scheduled nodes but
 * does not call `AudioContext.suspend()` itself. Mobile browsers already own
 * lifecycle suspension, and an app-issued asynchronous suspend can race the
 * next foreground tap and leave a just-resumed context silent. On every direct
 * Play tap we instead resume *any* non-running context (including interrupted
 * implementations) and verify that it actually reached `running` before
 * scheduling audible nodes.
 */
export class MorseAudioPlayer {
  private context: AudioContextLike | null = null
  private active: ActiveAudio | null = null
  private lastRequest: { text: string; options: MorseAudioOptions } | null = null
  private disposed = false

  private readonly visibilityChanged = () => {
    if (this.visibility?.hidden) this.cancel()
  }

  private readonly pageHidden = () => {
    this.cancel()
  }

  constructor(
    private readonly createContext: () => AudioContextLike = defaultContextFactory,
    private readonly visibility: VisibilitySource | undefined = defaultVisibilitySource(),
  ) {
    this.visibility?.addEventListener('visibilitychange', this.visibilityChanged)
    this.visibility?.addEventListener('pagehide', this.pageHidden)
  }

  private ensureContext(): AudioContextLike {
    if (this.disposed) throw new Error('Morse audio player has been disposed.')
    if (!this.context || this.context.state === 'closed') this.context = this.createContext()
    return this.context
  }

  /**
   * Must be reached directly from the user-triggered `play()` call. Creating
   * the context and invoking resume happen before any unrelated async work, so
   * first-play retains the browser's transient user activation.
   */
  private async ensureRunningContext(): Promise<AudioContextLike> {
    const context = this.ensureContext()
    if (context.state !== 'running') {
      try {
        await context.resume()
      } catch {
        throw new Error('Morse audio could not start. Tap Play again after returning to the app and check your device media volume.')
      }
    }
    if (context.state !== 'running') {
      throw new Error(`Morse audio is still ${context.state}. Tap Play again after returning to the app and check your device media volume.`)
    }
    return context
  }

  /**
   * Starts only when called by an explicit interaction. Construction, render,
   * navigation and visibility changes never autoplay.
   */
  async play(text: string, options: MorseAudioOptions = {}): Promise<MorseSchedule> {
    if (this.disposed) throw new Error('Morse audio player has been disposed.')
    if (this.visibility?.hidden) throw new Error('Morse audio is paused while the app is in the background.')

    const toneHz = finiteInRange(options.toneHz ?? DEFAULT_MORSE_AUDIO.toneHz, 300, 1200, 'toneHz')
    const volume = finiteInRange(options.volume ?? DEFAULT_MORSE_AUDIO.volume, 0, 1, 'volume')
    const schedule = buildMorseSchedule(text, options)

    this.cancel()
    const context = await this.ensureRunningContext()

    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = toneHz
    oscillator.connect(gain)
    gain.connect(context.destination)

    const startAt = context.currentTime + MORSE_AUDIO_START_DELAY_MS / 1000
    gain.gain.setValueAtTime(0, startAt)

    let at = startAt
    for (const event of schedule.events) {
      if (event.kind === 'signal') {
        gain.gain.setValueAtTime(volume, at)
        at += event.durationMs / 1000
        gain.gain.setValueAtTime(0, at)
      } else {
        at += event.durationMs / 1000
      }
    }

    this.active = { oscillator, gain }
    this.lastRequest = { text, options: { ...options } }
    oscillator.start(startAt)
    oscillator.stop(at)
    return schedule
  }

  async replay(): Promise<MorseSchedule> {
    if (!this.lastRequest) throw new Error('Nothing has been played yet.')
    return this.play(this.lastRequest.text, this.lastRequest.options)
  }

  cancel(): void {
    if (!this.active) return
    try {
      this.active.oscillator.stop()
    } catch {
      // An oscillator that has naturally ended may reject a second stop in a
      // browser implementation. Disconnecting still releases the graph.
    }
    this.active.oscillator.disconnect()
    this.active.gain.disconnect()
    this.active = null
  }

  async dispose(): Promise<void> {
    if (this.disposed) return
    this.disposed = true
    this.visibility?.removeEventListener('visibilitychange', this.visibilityChanged)
    this.visibility?.removeEventListener('pagehide', this.pageHidden)
    this.cancel()
    if (this.context && this.context.state !== 'closed') await this.context.close()
    this.context = null
  }
}
