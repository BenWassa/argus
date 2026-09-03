import { buildMorseSchedule, type MorseSchedule, type MorseTimingOptions } from './morse'

export interface AudioParamLike {
  value: number
  setValueAtTime(value: number, startTime: number): unknown
}

export interface AudioNodeLike {
  connect(destination: AudioNodeLike): unknown
  disconnect(): unknown
}

export interface OscillatorLike extends AudioNodeLike {
  type: OscillatorType
  frequency: AudioParamLike
  start(when?: number): unknown
  stop(when?: number): unknown
}

export interface GainLike extends AudioNodeLike {
  gain: AudioParamLike
}

export interface AudioContextLike {
  currentTime: number
  state: string
  destination: AudioNodeLike
  createOscillator(): OscillatorLike
  createGain(): GainLike
  resume(): Promise<unknown>
  suspend(): Promise<unknown>
  close(): Promise<unknown>
}

export type AudioContextFactory = () => AudioContextLike

export interface VisibilitySource {
  hidden?: boolean
  addEventListener(type: 'visibilitychange' | 'pagehide', listener: () => void): void
  removeEventListener(type: 'visibilitychange' | 'pagehide', listener: () => void): void
}

export interface MorsePlaybackOptions extends MorseTimingOptions {
  /** Audible carrier. Kept in a conservative speech-adjacent range by validation. */
  toneHz?: number
  /** Linear Web Audio gain, 0..1. Default is intentionally modest. */
  volume?: number
}

export const DEFAULT_MORSE_AUDIO = {
  toneHz: 700,
  volume: 0.12,
} as const

function defaultAudioContextFactory(): AudioContextLike {
  if (typeof window === 'undefined') throw new Error('Web Audio is unavailable outside a browser.')
  const withWebkit = window as typeof window & { webkitAudioContext?: typeof AudioContext }
  const Constructor = window.AudioContext ?? withWebkit.webkitAudioContext
  if (!Constructor) throw new Error('This browser does not expose Web Audio.')
  return new Constructor() as unknown as AudioContextLike
}

function defaultVisibilitySource(): VisibilitySource | null {
  return typeof document === 'undefined' ? null : document
}

function validateAudioOptions(options: MorsePlaybackOptions): { toneHz: number; volume: number } {
  const toneHz = options.toneHz ?? DEFAULT_MORSE_AUDIO.toneHz
  const volume = options.volume ?? DEFAULT_MORSE_AUDIO.volume
  if (!Number.isFinite(toneHz) || toneHz < 200 || toneHz > 1200) {
    throw new RangeError('toneHz must be between 200 and 1200 Hz.')
  }
  if (!Number.isFinite(volume) || volume < 0 || volume > 1) {
    throw new RangeError('volume must be between 0 and 1.')
  }
  return { toneHz, volume }
}

/**
 * Thin playback adapter around the pure schedule generator.
 *
 * Construction has no audible side effects and does not even create an
 * AudioContext. `play` and `replay` are deliberately explicit methods intended
 * to be called from a user activation. Navigation/background lifecycle never
 * restarts playback; it only cancels/suspends it.
 */
export class MorseAudioPlayer {
  private context: AudioContextLike | null = null
  private activeOscillator: OscillatorLike | null = null
  private activeGain: GainLike | null = null
  private lastRequest: { text: string; options: MorsePlaybackOptions } | null = null
  private disposed = false

  private readonly onVisibilityChange = () => {
    if (this.visibility?.hidden) this.background()
  }

  private readonly onPageHide = () => {
    this.background()
  }

  constructor(
    private readonly contextFactory: AudioContextFactory = defaultAudioContextFactory,
    private readonly visibility: VisibilitySource | null = defaultVisibilitySource(),
  ) {
    visibility?.addEventListener('visibilitychange', this.onVisibilityChange)
    visibility?.addEventListener('pagehide', this.onPageHide)
  }

  private background(): void {
    this.cancel()
    if (this.context && this.context.state !== 'closed') {
      void this.context.suspend().catch(() => undefined)
    }
  }

  private ensureContext(): AudioContextLike {
    if (this.disposed) throw new Error('MorseAudioPlayer has been disposed.')
    if (!this.context || this.context.state === 'closed') this.context = this.contextFactory()
    return this.context
  }

  /** Start playback only in response to an explicit caller action. */
  async play(text: string, options: MorsePlaybackOptions = {}): Promise<MorseSchedule> {
    if (this.visibility?.hidden) throw new Error('Morse playback is disabled while the page is in the background.')
    const schedule = buildMorseSchedule(text, options)
    const { toneHz, volume } = validateAudioOptions(options)

    this.cancel()
    const context = this.ensureContext()
    if (context.state === 'suspended') await context.resume()
    if (context.state === 'closed') throw new Error('The Web Audio context closed before playback could start.')

    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = toneHz
    oscillator.connect(gain)
    gain.connect(context.destination)

    const startAt = context.currentTime + 0.015
    let at = startAt
    gain.gain.setValueAtTime(0, at)
    for (const event of schedule.events) {
      const end = at + event.durationMs / 1000
      if (event.kind === 'signal') {
        gain.gain.setValueAtTime(volume, at)
        gain.gain.setValueAtTime(0, end)
      }
      at = end
    }

    this.activeOscillator = oscillator
    this.activeGain = gain
    this.lastRequest = { text, options: { ...options } }
    oscillator.start(startAt)
    oscillator.stop(at)
    return schedule
  }

  /** Replay is explicit too; there is intentionally no automatic resume path. */
  async replay(): Promise<MorseSchedule> {
    if (!this.lastRequest) throw new Error('Nothing has been played yet.')
    return this.play(this.lastRequest.text, this.lastRequest.options)
  }

  cancel(): void {
    if (this.activeOscillator) {
      try {
        this.activeOscillator.stop()
      } catch {
        // Browsers may throw when stop is repeated after an already-ended node.
      }
      try {
        this.activeOscillator.disconnect()
      } catch {
        // A disconnected/ended node is already safely silent.
      }
    }
    if (this.activeGain) {
      try {
        this.activeGain.disconnect()
      } catch {
        // A disconnected node needs no further cleanup.
      }
    }
    this.activeOscillator = null
    this.activeGain = null
  }

  async dispose(): Promise<void> {
    if (this.disposed) return
    this.disposed = true
    this.visibility?.removeEventListener('visibilitychange', this.onVisibilityChange)
    this.visibility?.removeEventListener('pagehide', this.onPageHide)
    this.cancel()
    if (this.context && this.context.state !== 'closed') await this.context.close()
    this.context = null
  }
}
