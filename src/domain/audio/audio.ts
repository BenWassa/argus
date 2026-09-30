/**
 * The prerecorded-speech stimulus (#151): content definition only, never learner
 * state. A recording is **presentation**; the canonical transcript beside it is
 * the content, and the item's answer key is what grades a response. A generated
 * waveform is never factual authority.
 *
 * The audio is a local shipped file under `/media/audio/`: Argus must work
 * offline, so nothing here names a remote address and nothing is synthesized at
 * runtime.
 */
export const AUDIO_DRILL_KINDS = [
  'token-copy',
  'proword',
  'call-extraction',
  'call-copy',
  'priority-signal',
  'message-extraction',
] as const
export type AudioDrillKind = (typeof AUDIO_DRILL_KINDS)[number]

export interface AudioStimulus {
  /** Durable identifier tying the recording to its manifest row and QA record. */
  assetId: string
  /** A local shipped file under `/media/audio/`. */
  src: string
  /**
   * The canonical transcript. Content, not metadata: Learn shows it normally,
   * and in a scored exposure it stays concealed until the learner chooses to
   * reveal it, which makes that attempt transcript-assisted.
   */
  transcript: string
  drill: AudioDrillKind
}

/**
 * How a learner answers an audio item when it is not a choice. Both modes are
 * graded deterministically against the item's own content; nothing is self-
 * scored and nothing is fuzzy-matched past what the named normalizer allows.
 *
 * - `copy`: one piece of text. `compact` ignores case, spacing and punctuation,
 *   for identifiers where spacing carries no meaning (`A12` = `a 1 2`); `words`
 *   compares whole words, for a transcribed call. Neither ever forgives a wrong
 *   letter, digit, word or order.
 * - `fields`: several named values, each compared as `words`; the answer is
 *   correct only when every field is.
 */
export type ItemResponse =
  | { mode: 'copy'; normalizer: CopyNormalizer }
  | { mode: 'fields'; fields: ResponseField[] }

export const COPY_NORMALIZERS = ['compact', 'words'] as const
export type CopyNormalizer = (typeof COPY_NORMALIZERS)[number]

export interface ResponseField {
  label: string
  expected: string
}

export const MIN_RESPONSE_FIELDS = 2
export const MAX_RESPONSE_FIELDS = 5

/** Local shipped speech only, under `/media/audio/`, with a conventional audio extension. */
export const LOCAL_AUDIO_PATTERN =
  /^\/media\/audio\/(?:[A-Za-z0-9][A-Za-z0-9._-]*\/)*[A-Za-z0-9][A-Za-z0-9._-]*\.(?:mp3|m4a|ogg|opus|wav)$/
