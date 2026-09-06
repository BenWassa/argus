import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MORSE_HOLD_MS, MorseKeyInput, morseElementForPressDuration } from './MorseKeyInput'

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

  it('renders one visible primary key plus Back and Submit', () => {
    const html = renderToStaticMarkup(<MorseKeyInput onSubmit={() => undefined} />)
    expect([...html.matchAll(/class="morse-key"/g)]).toHaveLength(1)
    expect(html).toContain('Tap')
    expect(html).toContain('Hold')
    expect(html).toContain('>Back<')
    expect(html).toContain('>Submit<')
    expect(html).toContain('Your press sounds while held')
    expect(html).toContain('aria-keyshortcuts=". -"')
  })

  it('keeps timing categorical and never exposes press duration to the submit callback', () => {
    const code = source('./MorseKeyInput.tsx')
    expect(code).toContain('append(morseElementForPressDuration')
    expect(code).toContain('onSubmit(entry)')
    expect(code).not.toMatch(/onSubmit\([^)]*(duration|startedAt|MORSE_HOLD_MS)/)
  })

  it('sounds exactly while pointer input is held and stops on release/cancel', () => {
    const code = source('./MorseKeyInput.tsx')
    expect(code).toContain('void startTone(event.pointerId)')
    expect(code).toContain('stopTone()')
    expect(code).toContain('onPointerCancel={(event) => cancelPress(event.pointerId)}')
    expect(code).toContain('onLostPointerCapture={(event) => cancelPress(event.pointerId)}')
    expect(code).toContain('linearRampToValueAtTime(0')
    expect(code).toContain('Never block Morse entry because sound is unavailable')
  })

  it('cancels interrupted pointers without appending phantom input', () => {
    const code = source('./MorseKeyInput.tsx')
    const cancel = code.slice(code.indexOf('const cancelPress'), code.indexOf('useEffect(() =>'))
    expect(cancel).toContain('pressRef.current = null')
    expect(cancel).not.toContain('append(')
  })

  it('prevents long-press browser gestures and provides timing-free keyboard equivalents', () => {
    const code = source('./MorseKeyInput.tsx')
    const css = source('./MorseKeyInput.css')
    expect(code).toContain("event.key === '.'")
    expect(code).toContain("event.key === '-'")
    expect(code).toContain("event.key === 'Backspace'")
    expect(code).toContain("event.key === 'Enter'")
    expect(code).toContain('onContextMenu={(event) => event.preventDefault()}')
    expect(css).toContain('touch-action: none')
    expect(css).toContain('-webkit-touch-callout: none')
  })
})
