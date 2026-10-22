// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { RoundResult, SessionCorrect, SessionFrame } from './SessionFrame'

afterEach(cleanup)
const noop = () => undefined

describe('SessionFrame', () => {
  it('focuses its only h1 when the launcher has gone, including a keyed restart', () => {
    const { rerender } = render(<SessionFrame key="first" kind="key" title="Key" onClose={noop} />)
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1, name: 'Key' }))
    rerender(<SessionFrame key="second" kind="key" title="Key" onClose={noop} />)
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1, name: 'Key' }))
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('preserves focus already owned by a control', () => {
    const launcher = document.createElement('button')
    document.body.append(launcher)
    launcher.focus()
    render(<SessionFrame kind="test" title="Test" onClose={noop} />)
    expect(document.activeElement).toBe(launcher)
    launcher.remove()
  })

  it('keeps the frame as the only h1 when showing a result', () => {
    render(<SessionFrame kind="key" title="Key" onClose={noop}><RoundResult correct={8} total={10} onDone={noop} /></SessionFrame>)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Key')
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2, name: '8 of 10 correct' }))
  })

  it.each(['key', 'listen', 'read', 'free', 'lesson', 'checkpoint', 'test', 'practice'] as const)('gives %s its own colour and matching ink', kind => {
    const { container } = render(<SessionFrame kind={kind} title="Session" onClose={noop}>Stimulus</SessionFrame>)
    const frame = container.querySelector<HTMLElement>('.session-frame')!
    const token = ['key', 'listen', 'read', 'free'].includes(kind) ? `mode-${kind}` : 'action'
    expect(frame.style.getPropertyValue('--session-colour')).toBe(`var(--${token}, var(--accent))`)
    expect(frame.style.getPropertyValue('--session-ink')).toBe(`var(--${token}-ink, var(--accent-ink))`)
    expect(frame.dataset.sessionKind).toBe(kind)
    expect(screen.getByText('Stimulus')).toBeTruthy()
    expect(screen.queryByRole('progressbar')).toBeNull()
  })

  it('takes any colour pair, so Practice can wear its track colour', () => {
    const { container } = render(<SessionFrame kind="practice" title="Practice" colour="var(--survival)" ink="var(--bg)" onClose={noop} />)
    const frame = container.querySelector<HTMLElement>('.session-frame')!
    expect(frame.style.getPropertyValue('--session-colour')).toBe('var(--survival)')
    expect(frame.style.getPropertyValue('--session-ink')).toBe('var(--bg)')
  })

  it('names finite progress, clamps its fill and closes on request', () => {
    const close = vi.fn()
    const { rerender } = render(<SessionFrame kind="key" title="Key" progress={{ current: 3, total: 10 }} onClose={close} />)
    expect(screen.getByRole('progressbar', { name: '3 of 10' }).getAttribute('aria-valuenow')).toBe('3')
    expect(screen.getByRole('progressbar').firstElementChild?.getAttribute('style')).toContain('scaleX(0.3)')
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(close).toHaveBeenCalledOnce()
    rerender(<SessionFrame kind="key" title="Key" progress={{ current: 20, total: 10 }} onClose={close} />)
    expect(screen.getByRole('progressbar', { name: '10 of 10' })).toBeTruthy()
    rerender(<SessionFrame kind="key" title="Key" progress={{ current: 1, total: 0 }} onClose={close} />)
    expect(screen.getByRole('progressbar').firstElementChild?.getAttribute('style')).toContain('scaleX(0)')
  })

  it('keeps a textual verdict and disables feedback motion for reduced motion', () => {
    render(<SessionCorrect target="E" />)
    expect(screen.getByText('Correct')).toBeTruthy()
    expect(screen.getByText('E ✓')).toBeTruthy()
    const css = readFileSync('src/shared/ui/SessionFrame.css', 'utf8')
    expect(css).toMatch(/animation: session-correct 150ms/)
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.session-correct \{ animation: none; \}/)
  })

  it('gives every miss one correction: verdict, what was given, the answer and a docked Continue (#263)', () => {
    const go = vi.fn()
    const { rerender } = render(<SessionCorrect miss={{ said: 'Q', answer: <p>L · — · ·</p>, onContinue: go }} />)
    const miss = screen.getByRole('status')
    expect(miss.className).toBe('session-miss session-response')
    expect(miss.getAttribute('aria-live')).toBe('assertive')
    expect(miss.querySelector('.session-miss-verdict')?.textContent).toBe('Not that one')
    expect(miss.querySelector('.session-miss-said')?.textContent).toBe('You said Q')
    expect(screen.getByText('L · — · ·')).toBeTruthy()
    expect(screen.queryByText('Correct')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(go).toHaveBeenCalledOnce()
    rerender(<SessionCorrect announce={false} className="extra" miss={{ saidLabel: 'You keyed', onContinue: go, continueDisabled: true, continueLabel: 'Next' }} />)
    expect(screen.queryByRole('status')).toBeNull()
    expect(document.querySelector('.session-miss')?.className).toBe('session-miss session-response extra')
    expect(document.querySelector('.session-miss-said')?.textContent).toBe('You keyed —')
    expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(true)
    const css = readFileSync('src/shared/ui/SessionFrame.css', 'utf8')
    expect(css).toMatch(/\.session-miss > \.session-miss-continue \{[^}]*width: 100%;/)
  })

  it('ends with one reading and two actions, with focus on the result', () => {
    const again = vi.fn(), done = vi.fn()
    render(<RoundResult correct={8} total={10} onAgain={again} onDone={done} />)
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: '8 of 10 correct' }))
    expect(screen.getAllByRole('button')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Again' }))
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(again).toHaveBeenCalledOnce()
    expect(done).toHaveBeenCalledOnce()
  })

  it('may drop Again, rename its actions, and then Done is the one primary', () => {
    const again = vi.fn(), done = vi.fn()
    const { rerender } = render(<RoundResult correct={1} total={3} onDone={done} doneLabel="Back to today" extra={<p>Held.</p>} />)
    expect(screen.queryByRole('button', { name: 'Again' })).toBeNull()
    expect(screen.getByText('Held.')).toBeTruthy()
    const back = screen.getByRole('button', { name: 'Back to today' })
    expect(back.className).not.toContain('ghost')
    fireEvent.click(back)
    expect(done).toHaveBeenCalledOnce()
    rerender(<RoundResult correct={1} total={3} onAgain={again} againLabel="Practise 2 items" onDone={done} doneLabel="Back to today" />)
    fireEvent.click(screen.getByRole('button', { name: 'Practise 2 items' }))
    expect(again).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Back to today' }).className).toContain('ghost')
  })

  it('docks a response slot after the stimulus, and leaves it out when there is none', () => {
    const { container, rerender } = render(<SessionFrame kind="key" title="Key" onClose={noop} response={<button type="button">Check</button>}><p>Stimulus</p></SessionFrame>)
    const frame = container.querySelector('.session-frame')!
    const slot = frame.lastElementChild!
    expect(slot.className).toBe('session-frame-response session-response')
    expect(slot.textContent).toBe('Check')
    expect(slot.previousElementSibling?.textContent).toBe('Stimulus')
    rerender(<SessionFrame kind="key" title="Key" onClose={noop}><p>Stimulus</p></SessionFrame>)
    expect(container.querySelector('.session-frame-response')).toBeNull()
  })

  it('lays every run out as header, centred stimulus and docked response', () => {
    const css = readFileSync('src/shared/ui/SessionFrame.css', 'utf8')
    expect(css).toMatch(/\.session\.session-frame \{[^}]*display: flex;[^}]*flex-direction: column;[^}]*min-height: 100svh;[^}]*env\(safe-area-inset-bottom\)/)
    expect(css).toMatch(/\.session-stimulus \{\s*margin-block-start: auto;/)
    expect(css).toMatch(/\.session-response \{\s*margin-block-start: auto;/)
    expect(css).toMatch(/\.session-round-actions \{[^}]*margin-block-start: auto;/)
    // The result is a reading in ink; signal yellow is the action's alone.
    expect(css).toMatch(/\.session-frame \.session-round-reading \{[^}]*color: var\(--ink\);/)
  })
})
