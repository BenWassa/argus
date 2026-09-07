import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { MORSE_REPLAY_RETRIEVAL_LIMIT } from './MorseReplay'

function source(file: string): string {
  return readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8')
}

describe('Morse lesson replay', () => {
  it('has a guaranteed finite retrieval ceiling', () => {
    expect(MORSE_REPLAY_RETRIEVAL_LIMIT).toBe(10)
    const code = source('./MorseReplay.tsx')
    expect(code).toContain('run.complete || retrievals >= MORSE_REPLAY_RETRIEVAL_LIMIT')
  })

  it('cannot write learner, scheduler or evidence state', () => {
    const code = source('./MorseReplay.tsx')
    const imports = [...code.matchAll(/from '([^']+)'/g)].map((match) => match[1])
    for (const forbidden of [
      '../../lib/store',
      '../../lib/scheduling',
      '../../lib/cueLadder',
      '../../lib/journey',
      '../../lib/morseLessonSitting',
    ]) expect(imports).not.toContain(forbidden)
    expect(code).not.toContain('updateTopic')
    expect(code).not.toContain('upsertTopic')
    expect(code).not.toContain('resolveAttempt')
  })

  it('reuses the real lesson answer/advance policy locally', () => {
    const code = source('./MorseReplay.tsx')
    expect(code).toContain('answerLesson(run, itemId, response)')
    expect(code).toContain('advanceLesson(answered)')
    expect(code).toContain('<VisualCheckStep')
  })

  it('states explicitly that replay changes neither saved lesson position nor Test evidence', () => {
    const code = source('./MorseReplay.tsx')
    expect(code).toContain('without changing your saved lesson position or formal Test evidence')
  })
})
