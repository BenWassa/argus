import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatStorageBytes, inspectStorage } from './storageStatus'

afterEach(() => vi.unstubAllGlobals())

describe('storage diagnostics', () => {
  it('requests persistence and reports the browser estimate', async () => {
    vi.stubGlobal('navigator', {
      storage: {
        persisted: vi.fn().mockResolvedValue(false),
        persist: vi.fn().mockResolvedValue(true),
        estimate: vi.fn().mockResolvedValue({ usage: 1536, quota: 4096 }),
      },
    })

    await expect(inspectStorage()).resolves.toEqual({
      persistence: 'granted',
      usage: 1536,
      quota: 4096,
    })
  })

  it('treats denied and unavailable browser capabilities as non-fatal', async () => {
    vi.stubGlobal('navigator', {
      storage: {
        persisted: vi.fn().mockRejectedValue(new Error('blocked')),
        persist: vi.fn().mockRejectedValue(new Error('blocked')),
        estimate: vi.fn().mockRejectedValue(new Error('blocked')),
      },
    })

    await expect(inspectStorage()).resolves.toEqual({
      persistence: 'denied',
      usage: null,
      quota: null,
    })
  })

  it('formats approximate sizes without false precision', () => {
    expect(formatStorageBytes(512)).toBe('512 B')
    expect(formatStorageBytes(1536)).toBe('1.5 KB')
    expect(formatStorageBytes(2.25 * 1024 * 1024)).toBe('2.3 MB')
  })
})
