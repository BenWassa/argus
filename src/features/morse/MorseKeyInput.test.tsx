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
    // Element length is no longer computed inline from the WPM constant; it
    // comes from the shared policy so keyed and played Morse cannot diverge.
    expect(code).toContain('morseElementDurationMs')
    expect(code).not.toContain('MORSE_KEY_TONE_HZ')
    expect(code).not.toContain('MORSE_KEY_TONE_GAIN')
    expect(code).toContain('linearRampToValueAtTime(0')
  })

  it('sounds a complete element rather than cutting the tone at finger-contact duration', () => {
    const code = source('./MorseKeyInput.tsx')
    expect(code).toContain('finishSustainedTone')
    // The release path extends the live tone to the canonical element length
    // measured from when the tone started, then commits when it ends.
    expect(code).toContain('startedAt + morseElementDurationMs(element) / 1000')
    expect(code).toContain('commitElement(element, Math.max(0, (end - at) * 1000)')
    // The old behaviour stopped the oscillator and graded in the same breath.
    expect(code).not.toMatch(/stopTone\(\)\n\s+commitElement\(element\)\n\s+\} else \{/)
  })

  it('refuses pointer, click and keyboard entry while the parent holds the gate', () => {
    const code = source('./MorseKeyInput.tsx')
    expect(code).toContain('locked?: boolean')
    expect(code).toContain('const inputBlocked = locked')
    expect(code).toContain('if (typing || inputBlocked || event.repeat) return')
    expect(code).toContain('lockedRef.current || inputBlocked) return')
    expect(code).toContain("if (event.detail === 0 && !inputBlocked) keyElement('.')")
    expect(code).toContain('disabled={inputBlocked || entry.length >= expectedLength}')
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

  it('presses as a physical key rather than repainting itself in an unrelated colour', () => {
    const css = source('./MorseKeyInput.css')
    // Pressed state is elevation and tone. The key keeps its own identity.
    expect(css).toContain("[data-pressed='true']")
    expect(css).toContain('transform: translateY(2px)')
    expect(css).toContain('box-shadow: none')
    expect(css).toContain('filter: brightness(0.88)')
    // Chrome on Android otherwise washes the tapped control in blue.
    expect(css).toContain('-webkit-tap-highlight-color: transparent')
    // And otherwise latches :hover on it after the tap that caused it.
    expect(css).toContain('@media (hover: hover) and (pointer: fine)')
    expect(css).toContain('.morse-key,\n.morse-key:hover')
    // Nothing may recolour the key into a track/state hue.
    expect(css).not.toMatch(/--(learning|survival|tradecraft|danger|ok)\)/)
  })

  it('keeps the interaction gate out of CSS so reduced motion cannot unlock it', () => {
    const css = source('./MorseKeyInput.css')
    const code = source('./MorseKeyInput.tsx')
    // Reduced motion removes travel and transition, never the refusal: the
    // refusal is `disabled` plus the parent's `inert`, both in markup.
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).not.toContain('pointer-events: none')
    expect(code).toContain('disabled={inputBlocked || entry.length >= expectedLength}')
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
