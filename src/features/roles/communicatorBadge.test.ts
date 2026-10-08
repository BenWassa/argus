import { describe, expect, it } from 'vitest'
import badgeSvg from '../../../public/media/roles/communicator.svg?raw'
import manifest from '../../../public/media/roles/manifest.json'

describe('Communicator nautical badge asset', () => {
  it('is a real independently editable vector, not a raster wrapper', () => {
    expect(badgeSvg).toMatch(/<svg[^>]+viewBox="0 0 512 512"/)
    expect(badgeSvg).not.toMatch(/<image\b|<foreignObject\b|data:image\/|<script\b/i)
    for (const id of [
      'rope-border', 'enamel-field', 'mast-assembly', 'signal-arcs',
      'signal-left', 'signal-right', 'signal-flags', 'morse-code',
      'sea-waves', 'wave-back', 'wave-mid', 'wave-front', 'compass-rose',
    ]) {
      expect(badgeSvg).toContain(`id="${id}"`)
    }
    expect(badgeSvg).toContain('prefers-reduced-motion')
  })

  it('uses the sole visible role, with an original self-contained Nautical asset', () => {
    expect(manifest.role).toBe('communicator')
    expect(manifest.runtime).toBe('/media/roles/communicator.svg')
    expect(manifest.family).toBe('Nautical (current)')
    expect(manifest.format).toContain('pure-vector')
    expect(badgeSvg).not.toMatch(/https?:\/\//i)
  })
})
