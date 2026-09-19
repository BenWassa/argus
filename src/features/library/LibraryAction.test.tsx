// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LibraryProvider } from '../../services/library/LibraryProvider'
import { LibraryPage } from './LibraryPage'

/**
 * #117 §B — Library's row action must read as a control.
 *
 * It was already a `<button>`, and its verb already came from the shared
 * journey derivation, so the semantics and the wording were never the problem.
 * The problem was that it was painted as muted text on the page ground: the one
 * surface in Library whose whole job is to answer "what can I do with this"
 * looked like a caption on the row it belonged to.
 *
 * So this pins both halves — the semantics, which a render can check, and the
 * affordance, which only the stylesheet carries.
 */

function css(): string {
  return readFileSync(resolve('src/features/library/LibraryPage.css'), 'utf8')
}

function actionRule(): string {
  const text = css()
  const start = text.indexOf('.lib-action {')
  return text.slice(start, text.indexOf('}', start))
}

afterEach(cleanup)

describe('the Library row action', () => {
  it('is a real control with an accessible name, not a decorated span', () => {
    render(
      <LibraryProvider>
        <LibraryPage
          onStart={vi.fn()}
          onReference={vi.fn()}
          onOpenTopic={vi.fn()}
          onCloseTopic={vi.fn()}
        />
      </LibraryProvider>,
    )

    const actions = document.querySelectorAll('.lib-action')
    expect(actions.length).toBeGreaterThan(0)
    for (const action of actions) {
      expect(action.tagName).toBe('BUTTON')
      expect(action.getAttribute('type')).toBe('button')
      expect(action.textContent?.trim()).toBeTruthy()
    }
    // The shipped Morse curriculum is one of them, and it says what it does.
    expect(screen.getByRole('button', { name: /^(Start lesson|Continue|Test)$/ })).toBeTruthy()
  })

  it('is painted as a control rather than as muted text on the page ground', () => {
    const rule = actionRule()
    // A raised face with the system's ghost treatment: the top highlight and
    // lower lip are what make it read as pressable at a glance.
    expect(rule).toContain('background: linear-gradient(180deg, var(--surface-3), var(--surface-2))')
    expect(rule).toContain('box-shadow: var(--edge), var(--edge-under)')
    expect(rule).toContain('color: var(--ink)')
    expect(rule).not.toContain('background: transparent')
    // Interactivity is never carried by colour alone, and a press is felt.
    expect(css()).toContain('.lib-action:active')
    expect(css()).toContain('.lib-action:focus-visible')
  })

  it('keeps the One Lit Surface rule: a bevel, never a lift or the accent', () => {
    const rule = actionRule()
    expect(rule).not.toContain('--shadow-sm')
    expect(rule).not.toContain('--accent')
  })

  it('leaves the row a 44px target at the narrowest supported width', () => {
    const text = css()
    // The action fills its grid cell, and the row is taller than a lone button
    // would be, so the touch target comes from `align-self: stretch` plus the
    // cell width rather than from a min-height on the control.
    expect(actionRule()).toContain('align-self: stretch')
    expect(text).toContain('grid-template-columns: minmax(0, 1fr) 96px')
  })
})
