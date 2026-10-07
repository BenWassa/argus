import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function read(path: string): string {
  return readFileSync(resolve(path), 'utf8')
}

describe('guided Morse sending surface', () => {
  const source = read('src/features/morse/fluency/SendRun.tsx')
  const css = read('src/features/morse/fluency/SendRun.css')
  const domain = read('src/domain/morse/fluency/send.ts')

  it('reuses the shared Morse key and removes target-length grading after Spotlight', () => {
    expect(source).toContain("import { MORSE_MAX_ELEMENTS, MorseKeyInput } from '../input/MorseKeyInput'")
    expect(source).toContain('expectedLength={MORSE_LETTERS[spotlightLetter].length}')
    expect(source).toContain('expectedLength={MORSE_MAX_ELEMENTS}')
    expect(source).toContain('FREE_LETTER_PAUSE_MS')
    expect(source).toContain('onEntry={onFlowEntry}')
    expect(source).not.toContain('MORSE_HOLD_MS')
    expect(source).not.toContain('pressDuration')
  })

  it('keeps sending formative and away from scored evidence', () => {
    expect(source).not.toContain('LibraryProvider')
    expect(source).not.toContain('resolveAttempt')
    expect(source).not.toContain('itemEvidence')
    expect(source).not.toContain('DirectionEvidence')
    expect(source).toContain('recordFluencyBest')
    expect(source).toContain('sendBestKey(stage)')
  })

  it('keeps the themed stage explicitly fictional rather than official procedure', () => {
    expect(domain).toContain("title: 'Dispatch'")
    expect(domain).toContain('Fictional field-communications messages')
    expect(domain).toContain('not official CAF/NATO procedure')
  })

  it('uses the Argus session grammar instead of an arcade skin', () => {
    expect(source).toContain('className="session send-run"')
    expect(source).toContain('className="session-bar"')
    expect(source).toContain('className="morse-key')
    expect(css).toContain('var(--bg)')
    expect(css).toContain('var(--surface)')
    expect(css).toContain('var(--accent)')
    expect(css).toContain('var(--font-mono)')
    expect(css).toContain('min-height: 100svh')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).not.toMatch(/#[0-9a-f]{3,8}/i)
  })
})
