import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MorseAudioPlayer } from '../../../domain/morse/audio'
import type { MorseLetter } from '../../../domain/morse/code'
import {
  COPY_LEVEL_INFO,
  COPY_PLAYS_PER_PROMPT,
  copyBestKey,
  copyPrompts,
  copyRunScore,
  judgeCopy,
  type CopyJudgement,
  type CopyLevel,
} from '../../../domain/morse/fluency/copy'
import { recordFluencyBest, type MorseFluencyProgress } from '../../../domain/morse/fluency/progress'
import { fluencyTiming, type FluencyRung } from '../../../domain/morse/fluency/timing'
import { fire } from '../../../shared/haptics'
import { useMorseAudio } from '../useMorseAudio'
export interface CopyRunProps {
  /** Between-round controls on the result screen (Listen's spacing). */
  toolbar?: ReactNode
  level: CopyLevel
  rung: FluencyRung
  progress: MorseFluencyProgress
  /** Letters the learner is missing, weighted up in the letters level. */
  focus?: ReadonlySet<MorseLetter>
  /** Characters material may contain (#257): the taught roster before acquisition; absent, no limit. */
  allowed?: ReadonlySet<string>
  /** The single durable write, handed in. See `FluencyRun` for why. */
  onProgress: (next: MorseFluencyProgress) => void
  onLevel: (level: CopyLevel) => void
  onExit: () => void
  seed?: number
}
const CORRECT_HOLD_MS = 900
type Phase =
  | { kind: 'intro' }
  | { kind: 'asking' }
  | { kind: 'feedback'; judgement: CopyJudgement }
  | { kind: 'done' }
export function useCopyRun({ level, rung, progress, focus, allowed, onProgress, onExit, seed = 0 }: CopyRunProps) {
  const info = COPY_LEVEL_INFO[level]
  const correctionAudio = useMorseAudio()
  const [prompts] = useState(() => copyPrompts(level, progress, seed, focus, allowed))
  const [at, setAt] = useState(0)
  const [phase, setPhase] = useState<Phase>(() => (info.introduces ? { kind: 'intro' } : { kind: 'asking' }))
  const [typed, setTyped] = useState('')
  const [plays, setPlays] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [judgements, setJudgements] = useState<CopyJudgement[]>([])

  const playerRef = useRef<MorseAudioPlayer | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const playTimer = useRef<number | null>(null)
  const timing = fluencyTiming(rung)
  const prompt = prompts[at]

  useEffect(() => {
    playerRef.current = new MorseAudioPlayer()
    return () => {
      if (playTimer.current !== null) window.clearTimeout(playTimer.current)
      void playerRef.current?.dispose()
      playerRef.current = null
    }
  }, [])

  // Focus stays in the field for the whole run, feedback included, so a phone
  // keyboard does not drop and rise between prompts and Enter can continue.
  useEffect(() => {
    if (phase.kind === 'done' || phase.kind === 'intro') headingRef.current?.focus({ preventScroll: true })
    else inputRef.current?.focus({ preventScroll: true })
  }, [phase, at])

  async function play(text: string, counted: boolean) {
    const player = playerRef.current
    if (!player) return
    setAudioError(null)
    setPlaying(true)
    if (counted) setPlays((count) => count + 1)
    try {
      const schedule = await player.play(text, timing)
      if (playTimer.current !== null) window.clearTimeout(playTimer.current)
      playTimer.current = window.setTimeout(() => setPlaying(false), schedule.durationMs)
    } catch (error) {
      setPlaying(false)
      setAudioError(error instanceof Error ? error.message : 'Morse audio could not start.')
    }
  }

  const canPlay = phase.kind === 'asking' && !playing && plays < COPY_PLAYS_PER_PROMPT
  const canCheck = phase.kind === 'asking' && plays > 0 && typed.trim().length > 0

  function check() {
    if (!canCheck || !prompt) return
    // Answering mid-playback is allowed; the rest of the prompt stops with it.
    playerRef.current?.cancel()
    if (playTimer.current !== null) window.clearTimeout(playTimer.current)
    setPlaying(false)
    const judgement = judgeCopy(prompt, typed)
    setJudgements((previous) => [...previous, judgement])
    fire(judgement.correct ? (prompt.length > 1 ? 'word' : 'settle') : 'miss')
    setPhase({ kind: 'feedback', judgement })
  }

  function advance() {
    correctionAudio.stop()
    const next = at + 1
    setTyped('')
    setPlays(0)
    if (next >= prompts.length) {
      setPhase({ kind: 'done' })
      return
    }
    setAt(next)
    setPhase({ kind: 'asking' })
    // The learner's own tap or keypress got here, or the audio is already
    // unlocked from the first prompt; either way the next one can start itself.
    void play(prompts[next], true)
  }

  useEffect(() => {
    if (phase.kind !== 'feedback' || !phase.judgement.correct) return
    const timer = window.setTimeout(advance, CORRECT_HOLD_MS)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const score = useMemo(() => copyRunScore(judgements), [judgements])
  const committed = useRef(false)
  useEffect(() => {
    if (phase.kind !== 'done' || committed.current) return
    committed.current = true
    const hadBest = progress.bests[copyBestKey(level)] !== undefined
    const result = recordFluencyBest(progress, copyBestKey(level), score)
    // A first run is a baseline, not a best; celebrating it would make the
    // scale-4 moment the most common one on the surface.
    if (result.improved && hadBest) {
      fire('crest')
    }
    onProgress(result.progress)
  }, [phase, progress, level, score, onProgress])

  const frame = { kind: 'listen' as const, title: 'Listen', onClose: onExit, progress: { current: phase.kind === 'done' ? prompts.length : at + 1, total: prompts.length } }


  return { info, correctionAudio, prompts, phase, setPhase, typed, setTyped, plays, playing, audioError, judgements, inputRef, headingRef, prompt, play, canPlay, canCheck, check, advance, frame }
}
