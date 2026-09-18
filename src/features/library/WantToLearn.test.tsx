// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { WantToLearn } from './WantToLearn'
import { CaptureSheet } from './CaptureSheet'
import type { ContentRequest } from '../../services/inbox/inboxModel'

const requests: ContentRequest[] = [
  {
    id: 'req-1',
    text: 'Maritime signal flags',
    status: 'pending',
    trackHint: 'tradecraft',
    createdAt: '2026-02-01T09:00:00.000Z',
    topicIds: [],
    addedAt: null,
  },
  {
    id: 'req-2',
    text: 'https://example.com/article — the knots section',
    status: 'pending',
    trackHint: null,
    createdAt: null,
    topicIds: [],
    addedAt: null,
  },
]

/**
 * Renders the queue and returns its markup. `open: true` clicks the
 * disclosure open first — needed for the "ready" status, which now collapses
 * by default so the note-to-self queue does not compete with the shelves in
 * the same scroll. Every other status (loading, signed-out, unauthorized) is
 * never collapsible, and an error is never hidden by the disclosure either
 * way, so those assertions do not need to open anything.
 */
function queue(overrides: Partial<Parameters<typeof WantToLearn>[0]> = {}, { open = false } = {}) {
  const { container } = render(
    <WantToLearn
      status="ready"
      requests={requests}
      error={null}
      removing={null}
      onSignIn={() => {}}
      onRemove={() => {}}
      {...overrides}
    />,
  )
  if (open) {
    fireEvent.click(screen.getByRole('button', { name: /Want to learn/ }))
  }
  return container.innerHTML
}

describe('the pending queue in Library', () => {
  afterEach(cleanup)

  it('shows captured text and a count once opened', () => {
    const html = queue({}, { open: true })
    expect(html).toContain('Want to learn')
    expect(html).toContain('Maritime signal flags')
    expect(html).toContain('the knots section')
    expect(html).toContain('>2<')
  })

  it('holds the ready queue behind a closed disclosure until opened', () => {
    // The routine case collapses by default: the count still shows in the
    // header, but the request text waits for one explicit tap.
    const html = queue()
    expect(html).toContain('Want to learn')
    expect(html).toContain('>2<')
    expect(html).not.toContain('Maritime signal flags')
  })

  it('uses none of the language a topic uses', () => {
    // The product rule made visible: a request has no boundary to finish, so it
    // may not borrow the vocabulary of something that does.
    const html = queue({}, { open: true })
    for (const word of [
      'unstarted',
      'drilled',
      'completed',
      'decayed',
      'Due now',
      'In progress',
      'Spot check',
      'Delayed test',
      'items',
      'scope',
    ]) {
      expect(html.includes(word), `queue says "${word}"`).toBe(false)
    }
  })

  it('offers no way to run, test or schedule a request', () => {
    const html = queue({}, { open: true })
    expect(html).not.toContain('lib-action')
    expect(html).not.toContain('index-row')
    expect(html).not.toContain('>Test<')
    expect(html).not.toContain('>Learn<')
  })

  it('names the request in the control that removes it', () => {
    expect(queue({}, { open: true })).toContain(
      'aria-label="Remove request: Maritime signal flags"',
    )
  })

  it('marks a request the server has not acknowledged yet', () => {
    expect(queue({}, { open: true })).toContain('saving…')
  })

  it('offers a one-time sign-in and says the library is unaffected', () => {
    // Not the routine "ready" status, so nothing here waits behind a tap.
    const html = queue({ status: 'signed-out', requests: [] })
    expect(html).toContain('Sign in to the inbox')
    expect(html).toContain('stay on this device')
  })

  it('disappears entirely when the build has no inbox', () => {
    expect(queue({ status: 'unconfigured' })).toBe('')
  })

  it('says when the queue could not be read, without hiding it', () => {
    // An error is never worth a tap to discover, so it surfaces even while
    // the routine queue itself stays collapsed.
    const html = queue({ error: 'The inbox could not be reached.' })
    expect(html).toContain('The inbox could not be reached.')
  })
})

describe('the capture sheet', () => {
  const html = renderToStaticMarkup(
    <CaptureSheet onSubmit={async () => {}} onClose={() => {}} onCaptured={() => {}} />,
  )

  it('asks one question and defaults the track to Auto', () => {
    expect(html).toContain('What do you want to learn?')
    expect(html).toContain('An idea, a link, or a link and a note')
    expect(html).toContain('<option value="auto" selected="">Auto</option>')
  })

  it('asks for nothing that belongs to a researched topic', () => {
    for (const label of ['Scope', 'Items', 'Sources', 'Title', 'prompt | answer', 'Completion']) {
      expect(html.includes(label), `capture asks for "${label}"`).toBe(false)
    }
    // Exactly one place to type.
    expect(html.match(/<textarea/g)?.length).toBe(1)
    expect(html.includes('<input')).toBe(false)
  })

  it('is a labelled modal with the field described', () => {
    expect(html).toContain('role="dialog"')
    expect(html).toContain('aria-modal="true"')
    expect(html).toMatch(/<label for="[^"]+">What do you want to learn\?<\/label>/)
    expect(html).toContain('aria-describedby')
  })

  it('cannot be submitted empty', () => {
    expect(html).toMatch(/<button disabled[^>]*type="submit"|<button type="submit" disabled/)
  })
})
