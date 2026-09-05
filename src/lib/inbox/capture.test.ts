import { describe, expect, it } from 'vitest'
import {
  EMPTY_CAPTURE,
  beginSubmit,
  canSubmit,
  chooseTrack,
  hasUnsentText,
  submitFailed,
  submitSucceeded,
  typeText,
} from './capture'

const typed = typeText(EMPTY_CAPTURE, 'https://example.com/article — the knots section')

describe('capturing an idea', () => {
  it('is ready to send as soon as there is something to send', () => {
    expect(canSubmit(EMPTY_CAPTURE)).toBe(false)
    expect(canSubmit(typed)).toBe(true)
    expect(canSubmit(typeText(EMPTY_CAPTURE, '    '))).toBe(false)
  })

  it('normalizes the text into the field when the send starts', () => {
    const start = beginSubmit(typeText(EMPTY_CAPTURE, '  Maritime signal flags  '))
    expect(start.ok).toBe(true)
    if (!start.ok) return
    expect(start.draft.text).toBe('Maritime signal flags')
    expect(start.state.text).toBe('Maritime signal flags')
    expect(start.state.phase).toBe('submitting')
  })

  it('keeps a chosen track hint and defaults to none', () => {
    expect(EMPTY_CAPTURE.trackHint).toBeNull()
    const hinted = chooseTrack(typed, 'tradecraft')
    const start = beginSubmit(hinted)
    expect(start.ok && start.draft.trackHint).toBe('tradecraft')
  })
})

describe('when the write does not land', () => {
  it('keeps every character of what was typed', () => {
    const start = beginSubmit(typed)
    expect(start.ok).toBe(true)
    if (!start.ok) return

    const failed = submitFailed(start.state, 'The inbox could not be reached.')

    // The only copy of this request is on screen. Losing it is the one failure
    // capture is not allowed to have.
    expect(failed.text).toBe('https://example.com/article — the knots section')
    expect(failed.phase).toBe('editing')
    expect(failed.error).toBe('The inbox could not be reached.')
    expect(hasUnsentText(failed)).toBe(true)
  })

  it('keeps the track hint too, and can be sent again unchanged', () => {
    const hinted = chooseTrack(typed, 'survival')
    const start = beginSubmit(hinted)
    if (!start.ok) throw new Error('expected a valid draft')

    const failed = submitFailed(start.state, 'Offline.')
    expect(failed.trackHint).toBe('survival')

    const retry = beginSubmit(failed)
    expect(retry.ok).toBe(true)
    if (retry.ok) expect(retry.draft).toEqual(start.draft)
  })

  it('clears the error the moment the user edits, without clearing the text', () => {
    const failed = submitFailed(beginSubmit(typed).state, 'Offline.')
    const edited = typeText(failed, `${failed.text} (chapter 3)`)
    expect(edited.error).toBeNull()
    expect(edited.text).toContain('https://example.com/article')
  })

  it('reports validation failure without starting a write or losing text', () => {
    const blank = beginSubmit(typeText(EMPTY_CAPTURE, '   '))
    expect(blank.ok).toBe(false)
    expect(blank.state.phase).toBe('editing')
    expect(blank.state.error).toBeTruthy()
    expect(blank.state.text).toBe('   ')
  })

  it('ignores edits and a second send while one is in flight', () => {
    const start = beginSubmit(typed)
    if (!start.ok) throw new Error('expected a valid draft')

    expect(typeText(start.state, 'something else')).toBe(start.state)
    expect(chooseTrack(start.state, 'survival')).toBe(start.state)
    expect(beginSubmit(start.state).ok).toBe(false)
  })
})

describe('when the inbox acknowledges the request', () => {
  it('clears the text only then, and keeps the track for the next capture', () => {
    const start = beginSubmit(chooseTrack(typed, 'tradecraft'))
    if (!start.ok) throw new Error('expected a valid draft')

    const saved = submitSucceeded(start.state)
    expect(saved.text).toBe('')
    expect(saved.error).toBeNull()
    expect(saved.phase).toBe('saved')
    expect(saved.trackHint).toBe('tradecraft')
    expect(hasUnsentText(saved)).toBe(false)
  })
})
