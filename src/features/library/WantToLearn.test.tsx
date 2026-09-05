import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { WantToLearn } from './WantToLearn'
import { CaptureSheet } from './CaptureSheet'
import type { ContentRequest } from '../../lib/inbox/model'

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

function queue(overrides: Partial<Parameters<typeof WantToLearn>[0]> = {}) {
  return renderToStaticMarkup(
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
}

describe('the pending queue in Library', () => {
  it('shows captured text and a count, and nothing else', () => {
    const html = queue()
    expect(html).toContain('Want to learn')
    expect(html).toContain('Maritime signal flags')
    expect(html).toContain('the knots section')
    expect(html).toContain('>2<')
  })

  it('uses none of the language a topic uses', () => {
    // The product rule made visible: a request has no boundary to finish, so it
    // may not borrow the vocabulary of something that does.
    const html = queue()
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
    const html = queue()
    expect(html).not.toContain('lib-action')
    expect(html).not.toContain('index-row')
    expect(html).not.toContain('>Test<')
    expect(html).not.toContain('>Learn<')
  })

  it('names the request in the control that removes it', () => {
    expect(queue()).toContain('aria-label="Remove request: Maritime signal flags"')
  })

  it('marks a request the server has not acknowledged yet', () => {
    expect(queue()).toContain('saving…')
  })

  it('offers a one-time sign-in and says the library is unaffected', () => {
    const html = queue({ status: 'signed-out', requests: [] })
    expect(html).toContain('Sign in to the inbox')
    expect(html).toContain('stay on this device')
  })

  it('disappears entirely when the build has no inbox', () => {
    expect(queue({ status: 'unconfigured' })).toBe('')
  })

  it('says when the queue could not be read, without hiding it', () => {
    const html = queue({ error: 'The inbox could not be reached.' })
    expect(html).toContain('The inbox could not be reached.')
    expect(html).toContain('Maritime signal flags')
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
