import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  MORSE_HOLD_MS,
  MorseKeyInput,
  morseElementForPressDuration,
  nextMorseEntry,
} from './MorseKeyInput'

function source(file: string): string {
  return readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8')
}

describe('one-touch Morse key', () => {
  it('classifies a short press as dit and a hold as dah at one explicit threshold', () => {
    expect(MORSE_HOLD_MS).toBe(300)
    expect(morseElementForPressDuration(0)).toBe('.')
    expect(morseElementForPressDuration(MORSE_HOLD_MS - 1)).toBe('.')
    expect(morseElementForPressDuration(MORSE_HOLD_MS)).toBe('-')
    expect(morseElementForPressDuration(MORSE_HOLD_MS + 800)).toBe('-')
  })

  it('knows exactly when the expected pattern is complete', () => {
    expect(nextMorseEntry('', '.', 1)).toEqual({ entry: '.', complete: true })
    expect(nextMorseEntry('', '.', 2)).toEqual({ entry: '.', complete: false })
    expect(nextMorseEntry('.', '-', 2)).toEqual({ entry: '.-', complete: true })
    expect(nextMorseEntry('.-', '.', 2)).toEqual({ entry: '.-', complete: true })
    expect(() => nextMorseEntry('', '.', 0)).toThrow(RangeError)
    expect(() => nextMorseEntry('', '.', 5)).toThrow(RangeError)
  })

  it('renders one uncluttered visible key with no Back or Submit controls', () => {
    const html = renderToStaticMarkup(<MorseKeyInput expectedLength={2} onSubmit={() => undefined} />)
    expect([...html.matchAll(/class="morse-key"/g)]).toHaveLength(1)
    expect(html).toContain('class="morse-key-face"')
    expect(html).not.toContain('>Back<')
    expect(html).not.toContain('>Submit<')
    expect(html).not.toContain('morse-key-hint')
    expect(html).not.toContain('morse-key-short')
    expect(html).not.toContain('morse-key-long')
    expect(html).toContain('grades automatically when complete')
    expect(html).toContain('aria-keyshortcuts=". -"')
  })

  it('starts visually blank instead of drawing a placeholder dash', () => {
    const html = renderToStaticMarkup(<MorseKeyInput expectedLength={2} onSubmit={() => undefined} />)
    expect(html).toContain('Keyed pattern is empty')
    const sourceCode = source('./MorseKeyInput.tsx')
    expect(sourceCode).toContain("entry ? canonicalPattern(entry) : '\\u00a0'")
    expect(sourceCode).not.toContain("entry ? canonicalPattern(entry) : '—'")
  })

  it('auto-submits at the expected length and exposes no correction/confirmation keys', () => {
    const code = source('./MorseKeyInput.tsx')
    expect(code).toContain('if (next.complete)')
    expect(code).toContain('onSubmit(next.entry)')
    expect(code).not.toContain("event.key === 'Backspace'")
    expect(code).not.toContain("event.key === 'Enter'")
    expect(code).not.toContain('deleteLast')
    expect(code).not.toContain('submitLabel')
  })

  it('keeps timing categorical and never exposes press duration to the submit callback', () => {
    const code = source('./MorseKeyInput.tsx')
    expect(code).toContain('morseElementForPressDuration')
    expect(code).toContain('onSubmit(next.entry)')
    expect(code).not.toMatch(/onSubmit\([^)]*(duration|startedAt|MORSE_HOLD_MS)/)
  })

  it('uses the sample audio identity and click-free edge shaping for the sidetone', () => {
    const code = source('./MorseKeyInput.tsx')
    expect(code).toContain('DEFAULT_MORSE_AUDIO')
    expect(code).toContain('MORSE_AUDIO_EDGE_RAMP_MS')
    expect(code).toContain('LEARN_ACQUISITION_MORSE_TIMING')
    expect(code).not.toContain('MORSE_KEY_TONE_HZ')
    expect(code).not.toContain('MORSE_KEY_TONE_GAIN')
    expect(code).toContain('linearRampToValueAtTime(0')
  })

  it('retries a released first press after AudioContext resume instead of losing it', () => {
    const code = source('./MorseKeyInput.tsx')
    expect(code).toContain('releasedElement')
    expect(code).toContain('playReleasedTone')
    expect(code).toContain('void startTone(event.pointerId)')
    expect(code).toContain('A quick first press may beat AudioContext.resume()')
    expect(code).toContain('Never block Morse entry because sound is unavailable')
  })

  it('ignores normal pointer-capture loss after release but cancels interrupted active presses', () => {
    const code = source('./MorseKeyInput.tsx')
    const cancel = code.slice(code.indexOf('const cancelPress'), code.indexOf('useEffect(() =>'))
    expect(cancel).toContain('press.releasedElement')
    expect(cancel).toContain('pressRef.current = null')
    expect(cancel).not.toContain('commitElement(')
    expect(code).toContain('onPointerCancel={(event) => cancelPress(event.pointerId)}')
    expect(code).toContain('onLostPointerCapture={(event) => cancelPress(event.pointerId)}')
  })

  it('prevents long-press browser gestures and keeps timing-free keyboard entry', () => {
    const code = source('./MorseKeyInput.tsx')
    const css = source('./MorseKeyInput.css')
    expect(code).toContain("event.key === '.'")
    expect(code).toContain("event.key === '-'")
    expect(code).toContain('onContextMenu={(event) => event.preventDefault()}')
    expect(css).toContain('touch-action: none')
    expect(css).toContain('-webkit-touch-callout: none')
  })
})
