import type { Track } from '../../domain/library/topic'

/** User-facing subject names. Persisted track keys stay stable for existing libraries. */
export const TRACK_LABELS: Record<Track, string> = {
  learning: 'Knowledge',
  survival: 'Survival',
  tradecraft: 'Tradecraft',
}
