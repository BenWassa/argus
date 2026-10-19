import { useCallback, useState } from 'react'
import { useLibrary } from '../../../services/library/LibraryProvider'
import {
  newFluencyProgress,
  setFluencyRung,
  type MorseFluencyProgress,
} from '../../../domain/morse/fluency/progress'
import type { FluencyMode } from '../../../domain/morse/fluency/session'
import type { CopyLevel } from '../../../domain/morse/fluency/copy'
import type { SendStage } from '../../../domain/morse/fluency/send'
import { morseFocusLetters } from '../../../domain/morse/fluency/focus'
import type { MorseLetter } from '../../../domain/morse/code'
import { LEVEL_REASON_LETTERS, levelReadiness, levelsFor, modeMaterialCharacters, type MorseMode } from '../../../domain/morse/modes'
import type { Topic } from '../../../domain/library/topic'
import { SessionFrame } from '../../../shared/ui/SessionFrame'
import { CopyRun } from './CopyRun'
import { FreePlay } from './FreePlay'
import { FluencyRun } from './FluencyRun'
import { SendRun } from './SendRun'
import { ListeningSpacing } from './ListeningSpacing'

/** Why the requested level cannot start for this learner (#257), or null when it can. */
function blockedReason(topic: Topic, mode: Exclude<MorseMode, 'free'>, levelId: string): string | null {
  const level = levelsFor(mode).find((candidate) => candidate.id === levelId)
  if (!level) return null
  const readiness = levelReadiness(topic, level)
  return readiness.startable ? null : readiness.reason
}

interface FluencySurfaceProps {
  topicId: string
  /** Set when the route named a mode directly. */
  initialMode?: FluencyMode
  /** Set when the route went straight into a sending stage (a handoff, not the hub). */
  initialSend?: SendStage
  /** Opens the first receiving round directly from Morse Topic. */
  initialCopy?: CopyLevel
  /** Free transmission has no score or evidence write. */
  initialFree?: true
  /** Set when the route asked to practise just these letters. */
  letters?: string[]
  onExit: () => void
}

/**
 * The one place Fluency is allowed to write.
 *
 * Runs import no store. This wrapper writes only `morseFluency`.
 */
export function FluencySurface({ topicId, initialMode, initialSend, initialCopy, initialFree, letters, onExit }: FluencySurfaceProps) {
  const { topics, updateTopic } = useLibrary()
  const topic = topics.find((candidate) => candidate.id === topicId)
  // Read once, when Fluency opens: what the learner is missing weights every
  // run, and a practise-missed entry asks only those letters, in its first run.
  const [focus] = useState<ReadonlySet<MorseLetter>>(() => new Set(topic ? morseFocusLetters(topic) : []))
  const [only] = useState<MorseLetter[]>(() =>
    (letters ?? []).filter((letter): letter is MorseLetter => /^[A-Z]$/.test(letter)),
  )
  const mode = initialMode ?? null
  const [copy, setCopy] = useState<{ level: CopyLevel; run: number } | null>(
    initialCopy ? { level: initialCopy, run: 0 } : null,
  )
  const [send, setSend] = useState<{ stage: SendStage; run: number } | null>(
    initialSend ? { stage: initialSend, run: 0 } : null,
  )
  const free = Boolean(initialFree)
  // Read once, like focus: before acquisition, material keeps to taught letters.
  const [allowed] = useState<ReadonlySet<string> | undefined>(() => (topic ? modeMaterialCharacters(topic) ?? undefined : undefined))

  const commit = useCallback(
    (next: MorseFluencyProgress) => {
      updateTopic(topicId, (current) => ({ ...current, morseFluency: next }))
    },
    [topicId, updateTopic],
  )

  if (!topic) return null

  const progress = topic.morseFluency
  const current = progress ?? newFluencyProgress()
  const spacing = <ListeningSpacing rung={current.rung} onChange={(rung) => commit(setFluencyRung(current, rung))} />

  if (free) {
    return <FreePlay rung={(progress ?? newFluencyProgress()).rung} onExit={onExit} />
  }

  const blocked = send ? blockedReason(topic, 'key', `send:${send.stage}`)
    : copy ? blockedReason(topic, 'listen', `copy:${copy.level}`)
      : mode ? (() => {
        const readiness = levelReadiness(topic, { kind: 'fluency', challenge: mode, id: `fluency:${mode}`, label: mode, tier: mode === 'groups' ? 'groups' : mode === 'words' ? 'words' : 'letters' })
        if (!readiness.startable) return readiness.reason
        if (only.length && allowed && !only.some((letter) => allowed.has(letter)) && mode !== 'words') return LEVEL_REASON_LETTERS
        return null
      })() : null
  if (blocked) {
    return (
      <SessionFrame kind={send ? 'key' : 'listen'} title={send ? 'Key' : 'Listen'} onClose={onExit}>
        <h1>{blocked}</h1>
      </SessionFrame>
    )
  }

  if (send) {
    return (
      <SendRun
        key={`send-${send.stage}-${send.run}`}
        stage={send.stage}
        seed={send.run}
        progress={progress ?? newFluencyProgress()}
        onProgress={commit}
        allowed={allowed}
        onStage={(stage) =>
          setSend((previous) => ({ stage, run: (previous?.run ?? 0) + 1 }))
        }
        onExit={onExit}
      />
    )
  }

  if (copy) {
    return (
      <CopyRun
        // A new key per run, so "Another run" draws fresh material.
        key={`copy-${copy.level}-${copy.run}`}
        level={copy.level}
        seed={copy.run}
        rung={(progress ?? newFluencyProgress()).rung}
        progress={progress ?? newFluencyProgress()}
        focus={focus}
        allowed={allowed}
        toolbar={spacing}
        onProgress={commit}
        onLevel={(level) => setCopy((previous) => ({ level, run: (previous?.run ?? 0) + 1 }))}
        onExit={onExit}
      />
    )
  }

  if (mode) {
    return (
      <FluencyRun
        key={mode}
        mode={mode}
        rung={(progress ?? newFluencyProgress()).rung}
        progress={progress ?? newFluencyProgress()}
        focus={focus}
        only={only}
        allowed={allowed}
        toolbar={spacing}
        onProgress={commit}
        onExit={onExit}
      />
    )
  }

  return null
}
