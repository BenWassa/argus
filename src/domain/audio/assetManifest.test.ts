import { describe, expect, it } from 'vitest'
import { validateAudioAssets, type AudioManifestEntry } from './assetManifest'
import type { Topic } from '../library/topic'

const topic = (items: Topic['items']): Topic => ({
  id: 'listening',
  title: 'Listening',
  scope: 's',
  track: 'learning',
  items,
  status: 'unstarted',
  createdAt: '2026-01-01T00:00:00.000Z',
  drilledAt: null,
  learningAt: null,
  completedAt: null,
  lastTestedAt: null,
  spotCheckedAt: null,
  history: [],
})

const item = (over: Partial<NonNullable<Topic['items'][number]['audio']>> = {}, answer = 'A12'): Topic['items'][number] => ({
  id: 'listening-item-01',
  kind: 'forward',
  prompt: 'Copy what you hear',
  answer,
  response: { mode: 'copy', normalizer: 'compact' },
  audio: { assetId: 'a1', src: '/media/audio/a1.wav', transcript: 'Alfa WUN TOO', drill: 'token-copy', ...over },
})

const entry = (over: Partial<AudioManifestEntry> = {}): AudioManifestEntry => ({
  assetId: 'a1',
  src: '/media/audio/a1.wav',
  topicId: 'listening',
  drill: 'token-copy',
  transcript: 'Alfa WUN TOO',
  sources: ['ISED RIC-22 §4.3'],
  engine: 'fixture',
  engineVersion: '0',
  model: 'fixture',
  voice: 'fixture',
  voiceLicence: 'Test fixture; no licence burden',
  parameters: {},
  format: 'wav',
  durationMs: 1000,
  byteSize: 4,
  sha256: 'abc',
  qa: {
    status: 'approved',
    listens: [
      { reviewer: 'r1', date: '2026-10-01', againstTranscript: true },
      { reviewer: 'r2', date: '2026-10-01', againstTranscript: true },
    ],
  },
  ...over,
})

const file = { bytes: new Uint8Array([1, 2, 3, 4]), sha256: 'abc' }
const run = (items: Topic['items'], manifest: AudioManifestEntry[], read = () => file as typeof file | null) =>
  validateAudioAssets({ topics: [topic(items)], manifest, readFile: read })
const messages = (problems: { problem: string }[]) => problems.map((p) => p.problem).join(' | ')

describe('audio asset QA', () => {
  it('passes a fully approved, consistent asset', () => {
    expect(run([item()], [entry()])).toEqual([])
  })

  it('fails an audio item with no manifest row', () => {
    expect(messages(run([item()], []))).toMatch(/no manifest row/)
  })

  it('fails an unapproved or pending generation', () => {
    const pending = entry({ qa: { status: 'pending', listens: [] } })
    expect(messages(run([item()], [pending]))).toMatch(/not approved/)
  })

  it('fails approval without two independent listens against the transcript', () => {
    const one = entry({ qa: { status: 'approved', listens: [{ reviewer: 'r1', date: 'd', againstTranscript: true }] } })
    expect(messages(run([item()], [one]))).toMatch(/fewer than 2 independent listens/)
    const same = entry({
      qa: {
        status: 'approved',
        listens: [
          { reviewer: 'r1', date: 'd', againstTranscript: true },
          { reviewer: 'r1', date: 'd', againstTranscript: true },
        ],
      },
    })
    expect(messages(run([item()], [same]))).toMatch(/fewer than 2 independent listens/)
    const unchecked = entry({
      qa: {
        status: 'approved',
        listens: [
          { reviewer: 'r1', date: 'd', againstTranscript: true },
          { reviewer: 'r2', date: 'd', againstTranscript: false },
        ],
      },
    })
    expect(messages(run([item()], [unchecked]))).toMatch(/fewer than 2 independent listens/)
  })

  it('fails a missing, empty or changed file', () => {
    expect(messages(run([item()], [entry()], () => null))).toMatch(/is missing/)
    expect(messages(run([item()], [entry()], () => ({ bytes: new Uint8Array(), sha256: 'abc' })))).toMatch(/empty/)
    expect(messages(run([item()], [entry()], () => ({ ...file, sha256: 'zzz' })))).toMatch(/hash does not match/)
    expect(messages(run([item()], [entry({ byteSize: 99 })]))).toMatch(/size does not match/)
  })

  it('fails a transcript, path, topic or drill that disagrees with the manifest', () => {
    expect(messages(run([item()], [entry({ transcript: 'Alfa WUN TREE' })]))).toMatch(/transcript and item transcript differ/)
    expect(messages(run([item()], [entry({ src: '/media/audio/other.wav' })]))).toMatch(/path differ/)
    expect(messages(run([item()], [entry({ topicId: 'other' })]))).toMatch(/topic differ/)
    expect(messages(run([item()], [entry({ drill: 'proword' })]))).toMatch(/drill differ/)
  })

  it('ignores spacing and punctuation differences in the transcript, nothing else', () => {
    expect(run([item()], [entry({ transcript: 'alfa,  wun too.' })])).toEqual([])
  })

  it('fails when the authoritative tokens and the answer key disagree', () => {
    expect(messages(run([item({}, 'A13')], [entry()]))).toMatch(/decodes to "A12" but the answer key is "A13"/)
    expect(messages(run([item({ transcript: 'Alfa Banana' })], [entry({ transcript: 'Alfa Banana' })]))).toMatch(/cannot decode: BANANA/)
  })

  it('fails a row with no sources or licence, and an unused or duplicate row', () => {
    expect(messages(run([item()], [entry({ sources: [] })]))).toMatch(/No source reference/)
    expect(messages(run([item()], [entry({ voiceLicence: ' ' })]))).toMatch(/licence/)
    expect(messages(run([item()], [entry(), entry({ assetId: 'unused', src: '/media/audio/u.wav' })]))).toMatch(/not used by any item/)
    expect(messages(run([item()], [entry(), entry()]))).toMatch(/more than once/)
  })

  it('does not require manifest rows for topics without audio', () => {
    expect(run([{ id: 'x', kind: 'forward', prompt: 'p', answer: 'a' }], [])).toEqual([])
  })
})
