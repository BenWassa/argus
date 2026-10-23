import { useCallback, useEffect, useReducer, useRef, useState } from 'react'

/** What a store write returns: nothing (synchronous legacy store) or whether it committed. */
export type StoreWrite = void | Promise<boolean>

/** How long a write may stay unanswered before a surface should offer a way out. */
export const STALLED_AFTER_MS = 3000

export interface DurableWrites {
  /** Writes issued and not yet committed or failed. */
  pending: number
  /**
   * Writes have been pending for a long time without an answer. This is not a
   * failure: the transaction may still commit, and when it does `pending` falls
   * to zero and `stalled` clears by itself. A pending write is never repeated.
   */
  stalled: boolean
  /** Writes whose transaction was rejected and which are still owed. */
  failed: number
  /**
   * Issue a write and remember how to repeat it. `run` must be safe to call
   * again after a failure: store updates are functional against the current
   * topic, and a failed transaction committed nothing.
   */
  track(run: () => StoreWrite): void
  /**
   * `true` immediately when everything issued is already committed, which is
   * always the case on the synchronous store; otherwise a promise of whether
   * every write has now committed. Settling never discards a failure.
   */
  settle(): true | Promise<boolean>
  /** Issue every failed write again, in its original order, and settle. */
  retry(): true | Promise<boolean>
}

/**
 * Track the durability of the writes one learning surface makes.
 *
 * The production provider commits to IndexedDB before it publishes, so a write
 * is a promise that can come back `false`. A surface that moves on at once —
 * "Lesson done", "Test banked" — would announce progress the canonical record
 * does not hold. This keeps the earned result (the write itself) so that a
 * surface can wait for it, say plainly when it did not save, and repeat it
 * without the learner losing what they did.
 */
export function useDurableWrites(stalledAfterMs: number = STALLED_AFTER_MS): DurableWrites {
  const inflight = useRef(new Set<Promise<boolean>>())
  const owed = useRef<Array<() => StoreWrite>>([])
  const [, render] = useReducer((n: number) => n + 1, 0)
  const [stalled, setStalled] = useState(false)

  const track = useCallback((run: () => StoreWrite) => {
    const result = run()
    if (result === undefined) return
    const tracked: Promise<boolean> = result
      .then((ok) => ok, () => false)
      .then((ok) => {
        inflight.current.delete(tracked)
        if (!ok) owed.current.push(run)
        render()
        return ok
      })
    inflight.current.add(tracked)
    render()
  }, [])

  const settle = useCallback((): true | Promise<boolean> => {
    if (inflight.current.size === 0 && owed.current.length === 0) return true
    return (async () => {
      while (inflight.current.size > 0) await Promise.all([...inflight.current])
      return owed.current.length === 0
    })()
  }, [])

  const retry = useCallback((): true | Promise<boolean> => {
    const again = owed.current
    owed.current = []
    for (const run of again) track(run)
    render()
    return settle()
  }, [settle, track])

  const pending = inflight.current.size
  useEffect(() => {
    if (pending === 0) { setStalled(false); return }
    const timer = setTimeout(() => setStalled(true), stalledAfterMs)
    return () => clearTimeout(timer)
  }, [pending, stalledAfterMs])

  return {
    pending,
    stalled: pending > 0 && stalled,
    failed: owed.current.length,
    track,
    settle,
    retry,
  }
}
