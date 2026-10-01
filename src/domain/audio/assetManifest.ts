import type { Item, Topic } from '../library/topic'
import { decodeSpokenTokens } from './tokens'
import { normalizeCompact, normalizeWords } from './response'

/**
 * The audio asset manifest and its automated QA (#151), as the #139 §10 contract
 * requires. Automated checks prove packaging and transcript agreement. They do
 * **not** prove the voice pronounced the words correctly: that is human listening
 * QA, recorded here as reviews, and never inferred from a model being good.
 *
 * A row exists per recording. A production audio item with no approved row, a
 * file that no longer matches its hash, or an answer key that disagrees with its
 * transcript fails validation.
 */
export interface AudioListen {
  reviewer: string
  date: string
  /** Checked against the canonical transcript while listening. */
  againstTranscript: boolean
}

export interface AudioManifestEntry {
  assetId: string
  /** Project-relative public path, e.g. `/media/audio/phonetic-01.mp3`. */
  src: string
  topicId: string
  drill: string
  transcript: string
  /** Where the script's facts come from, by source and version. */
  sources: string[]
  /** What the synthesizer was given, if it differs from the transcript. */
  synthesisString?: string
  pronunciationOverrides?: string[]
  engine: string
  engineVersion: string
  model: string
  voice: string
  voiceLicence: string
  parameters: Record<string, string | number | boolean>
  format: string
  durationMs: number
  byteSize: number
  sha256: string
  qa: { status: 'approved' | 'pending' | 'rejected'; listens: AudioListen[]; note?: string }
}

/** Two independent human listens for every production asset. */
export const REQUIRED_LISTENS = 2

export interface AudioAssetFile {
  bytes: Uint8Array
  sha256: string
}

export interface AudioProblem {
  assetId: string
  problem: string
}

function audioItems(topics: Topic[]): { topic: Topic; item: Item }[] {
  return topics.flatMap((topic) =>
    topic.items.filter((item) => item.audio).map((item) => ({ topic, item })),
  )
}

/**
 * Validate every audio item in `topics` against `manifest`, reading files through
 * `readFile` (so the same function runs in a test, a script and the build).
 */
export function validateAudioAssets(input: {
  topics: Topic[]
  manifest: AudioManifestEntry[]
  readFile: (publicPath: string) => AudioAssetFile | null
}): AudioProblem[] {
  const { topics, manifest, readFile } = input
  const problems: AudioProblem[] = []
  const byId = new Map<string, AudioManifestEntry>()
  for (const entry of manifest) {
    if (byId.has(entry.assetId)) problems.push({ assetId: entry.assetId, problem: 'The manifest lists this asset more than once.' })
    byId.set(entry.assetId, entry)
  }

  const assetIdsUsed = new Set<string>()
  for (const { topic, item } of audioItems(topics)) {
    const audio = item.audio!
    const at = audio.assetId
    if (assetIdsUsed.has(at)) problems.push({ assetId: at, problem: 'Two items use this asset id.' })
    assetIdsUsed.add(at)

    const entry = byId.get(at)
    if (!entry) {
      problems.push({ assetId: at, problem: `Item ${item.id} in "${topic.id}" has no manifest row; an unreviewed generation cannot be in production.` })
      continue
    }
    if (entry.qa.status !== 'approved') {
      problems.push({ assetId: at, problem: `Manifest status is "${entry.qa.status}", not approved.` })
    }
    const honest = entry.qa.listens.filter((listen) => listen.againstTranscript)
    if (entry.qa.status === 'approved' && new Set(honest.map((l) => l.reviewer)).size < REQUIRED_LISTENS) {
      problems.push({ assetId: at, problem: `Approved, but fewer than ${REQUIRED_LISTENS} independent listens checked against the transcript.` })
    }
    if (entry.src !== audio.src) problems.push({ assetId: at, problem: 'Manifest path and item path differ.' })
    if (entry.topicId !== topic.id) problems.push({ assetId: at, problem: 'Manifest topic and item topic differ.' })
    if (entry.drill !== audio.drill) problems.push({ assetId: at, problem: 'Manifest drill and item drill differ.' })
    if (normalizeWords(entry.transcript).join(' ') !== normalizeWords(audio.transcript).join(' ')) {
      problems.push({ assetId: at, problem: 'Manifest transcript and item transcript differ.' })
    }
    if (entry.sources.length === 0) problems.push({ assetId: at, problem: 'No source reference for the script.' })
    if (!entry.voiceLicence.trim()) problems.push({ assetId: at, problem: 'No voice/model licence note.' })

    const file = readFile(entry.src)
    if (!file) {
      problems.push({ assetId: at, problem: `File ${entry.src} is missing.` })
    } else {
      if (file.bytes.length === 0) problems.push({ assetId: at, problem: 'The audio file is empty.' })
      if (file.sha256 !== entry.sha256) problems.push({ assetId: at, problem: 'File hash does not match the approved manifest.' })
      if (file.bytes.length !== entry.byteSize) problems.push({ assetId: at, problem: 'File size does not match the manifest.' })
    }

    // The authoritative tokens and the answer key must agree.
    if (audio.drill === 'token-copy') {
      const decoded = decodeSpokenTokens(audio.transcript)
      if (!decoded.ok) {
        problems.push({ assetId: at, problem: `Transcript has words the token check cannot decode: ${decoded.unknown.join(', ')}.` })
      } else if (decoded.text !== normalizeCompact(item.answer)) {
        problems.push({ assetId: at, problem: `Transcript decodes to "${decoded.text}" but the answer key is "${item.answer}".` })
      }
    }
  }

  for (const entry of manifest) {
    if (!assetIdsUsed.has(entry.assetId)) {
      problems.push({ assetId: entry.assetId, problem: 'Manifest row is not used by any item.' })
    }
  }
  return problems
}
