import { useCallback, useState } from 'react'
import { useLibrary } from '../../../services/library/LibraryProvider'
import {
  newFluencyProgress,
  type MorseFluencyProgress,
} from '../../../domain/morse/fluency/progress'
import type { FluencyMode } from '../../../domain/morse/fluency/session'
import type { CopyLevel } from '../../../domain/morse/fluency/copy'
import { CopyRun } from './CopyRun'
import { FreePlay } from './FreePlay'
import { FluencyHome } from './FluencyHome'
import { FluencyRun } from './FluencyRun'

interface FluencySurfaceProps {
  topicId: string
  /** Set when the route named a mode directly. */
  initialMode?: FluencyMode
  onExit: () => void
}

/**
 * The one place Fluency is allowed to write.
 *
 * `FluencyHome` and `FluencyRun` import no store at all. This wrapper holds
 * the only `updateTopic` call in the feature, and it writes exactly one field.
 * That is the same structural boundary `PracticeRun` uses — a surface that
 * cannot reach durable state cannot corrupt it — adapted for a surface that
 * legitimately keeps statistics: instead of "writes nothing", the guarantee is
 * "writes `morseFluency` and nothing else, from one function".
 *
 * `FluencySurface.test.tsx` asserts that the run and home modules import no
 * write path, so an edit that reaches for `useLibrary` inside one of them
 * fails the suite rather than quietly widening what Fluency can touch.
 */
export function FluencySurface({ topicId, initialMode, onExit }: FluencySurfaceProps) {
  const { topics, updateTopic } = useLibrary()
  const topic = topics.find((candidate) => candidate.id === topicId)
  const [mode, setMode] = useState<FluencyMode | null>(initialMode ?? null)
  const [copy, setCopy] = useState<{ level: CopyLevel; run: number } | null>(null)
  const [free, setFree] = useState(false)

  const commit = useCallback(
    (next: MorseFluencyProgress) => {
      updateTopic(topicId, (current) => ({ ...current, morseFluency: next }))
    },
    [topicId, updateTopic],
  )

  if (!topic) return null

  const progress = topic.morseFluency

  if (free) {
    return <FreePlay rung={(progress ?? newFluencyProgress()).rung} onExit={() => setFree(false)} />
  }

  if (copy) {
    return (
      <CopyRun
        // A new key per run, so "Another run" draws fresh material.
        key={`copy-${copy.level}-${copy.run}`}
        level={copy.level}
        rung={(progress ?? newFluencyProgress()).rung}
        progress={progress ?? newFluencyProgress()}
        onProgress={commit}
        onLevel={(level) => setCopy((previous) => ({ level, run: (previous?.run ?? 0) + 1 }))}
        onExit={() => setCopy(null)}
      />
    )
  }

  if (mode) {
    return (
      <FluencyRun
        key={`${mode}-${progress?.rung ?? 'first'}`}
        mode={mode}
        rung={(progress ?? newFluencyProgress()).rung}
        progress={progress ?? newFluencyProgress()}
        onProgress={commit}
        onExit={() => setMode(null)}
      />
    )
  }

  return (
    <FluencyHome
      progress={progress}
      onProgress={commit}
      onStart={setMode}
      onCopy={(level) => setCopy({ level, run: 0 })}
      onFreePlay={() => setFree(true)}
      onExit={onExit}
    />
  )
}
