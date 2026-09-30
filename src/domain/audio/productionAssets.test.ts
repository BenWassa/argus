import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { catalogDefinitions } from '../library/catalog'
import { validateAudioAssets, type AudioManifestEntry } from './assetManifest'
import manifestJson from './productionManifest.json'

/**
 * The production gate (#151). Every audio item the shipped catalog contains must
 * have an approved manifest row, two independent listens checked against the
 * transcript, a file that matches its pinned hash, and an answer key that agrees
 * with its transcript. The manifest is empty today because no production speech
 * ships yet; the first audio item added to the catalog fails this test until all
 * of that is in place.
 */
const manifest = manifestJson as AudioManifestEntry[]

function readPublic(publicPath: string) {
  const path = resolve(process.cwd(), 'public', publicPath.replace(/^\//, ''))
  if (!existsSync(path)) return null
  const bytes = readFileSync(path)
  return { bytes: new Uint8Array(bytes), sha256: createHash('sha256').update(bytes).digest('hex') }
}

describe('production audio assets', () => {
  it('validate against the real manifest and the real files', () => {
    const problems = validateAudioAssets({ topics: catalogDefinitions(), manifest, readFile: readPublic })
    expect(problems, problems.map((p) => `${p.assetId}: ${p.problem}`).join('\n')).toEqual([])
  })

  it('fail, with no manifest row, for an unreviewed audio item added to the catalog', () => {
    const [first] = catalogDefinitions()
    const unreviewed = {
      ...first,
      items: [
        {
          id: `${first.id}-item-99`,
          kind: 'forward' as const,
          prompt: 'Listen',
          answer: 'A',
          choice: { options: ['A', 'B'] },
          audio: { assetId: 'unreviewed', src: '/media/audio/unreviewed.mp3', transcript: 'Alfa', drill: 'proword' as const },
        },
      ],
    }
    const problems = validateAudioAssets({ topics: [unreviewed], manifest, readFile: readPublic })
    expect(problems.map((p) => p.problem).join(' ')).toMatch(/no manifest row/)
  })
})
