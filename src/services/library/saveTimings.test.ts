import { describe, expect, it } from 'vitest'
import { formatDuration, recentSaves, recordSave } from './saveTimings'

describe('save timings', () => {
  it('keeps the newest five, newest first, rounded', () => {
    for (let i = 1; i <= 7; i += 1) recordSave({ waitMs: i * 10.4, writeMs: i * 100.6, ok: i !== 7 })
    const saves = recentSaves()
    expect(saves).toHaveLength(5)
    expect(saves[0]).toEqual({ waitMs: 73, writeMs: 704, ok: false })
    expect(saves[4].writeMs).toBe(302)
  })

  it('formats short durations in ms and long ones in seconds', () => {
    expect(formatDuration(412)).toBe('412 ms')
    expect(formatDuration(61_300)).toBe('61.3 s')
  })
})
