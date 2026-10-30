// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AppShell } from './AppShell'

afterEach(cleanup)

describe('AppShell', () => {
  it('offers a skip link before the navigation that moves focus to the content', () => {
    render(<AppShell view="today" onNavigate={() => undefined}><p>Content</p></AppShell>)
    const skip = screen.getByRole('link', { name: 'Skip to content' })
    const nav = screen.getByRole('navigation', { name: 'Sections' })
    expect(skip.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    fireEvent.click(skip)
    expect(document.activeElement).toBe(screen.getByRole('main'))
    expect(window.location.hash).toBe('')
  })
})
