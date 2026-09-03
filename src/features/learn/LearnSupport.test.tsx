import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { LearnContent } from '../../lib/types'
import { LearnSupport } from './LearnSupport'

describe('structured Learn rendering', () => {
  it('renders concise support with visible limitations and provenance', () => {
    const content: LearnContent = {
      kind: 'concise',
      overview: 'A small amount of context is enough for this topic.',
      limitations: ['Memory support only.'],
      sources: [{ label: 'Reference', url: 'https://example.com/reference', note: 'Source note.' }],
    }

    const html = renderToStaticMarkup(<LearnSupport content={content} />)
    expect(html).toContain('Concise support')
    expect(html).toContain('A small amount of context')
    expect(html).toContain('<h3>Limitations</h3>')
    expect(html).toContain('<h3>Sources</h3>')
    expect(html).toContain('href="https://example.com/reference"')
    expect(html).not.toContain('flip-card')
    expect(html).not.toContain('<button')
  })

  it('renders briefing structures and one integrated case with semantic elements', () => {
    const content: LearnContent = {
      kind: 'briefing',
      overview: 'The framework is best understood as a connected whole.',
      sections: [
        {
          heading: 'Relationships',
          blocks: [
            { type: 'paragraph', text: 'A plain explanatory paragraph.' },
            { type: 'bullets', items: ['One relationship', 'Another relationship'] },
            { type: 'steps', items: ['First', 'Second'] },
            {
              type: 'definitions',
              items: [{ term: 'Orient', definition: 'Interpret observations through context.' }],
            },
            {
              type: 'table',
              columns: ['Stage', 'Function'],
              rows: [['Observe', 'Gather changing information']],
            },
          ],
        },
      ],
      caseStudies: [
        {
          title: 'Integrated decision case',
          scenario: 'A changing situation requires the framework to be traced end to end.',
          analysis: [
            {
              heading: 'Trace the whole loop',
              blocks: [{ type: 'paragraph', text: 'The stages affect one another across the case.' }],
            },
          ],
          takeaway: 'The framework is iterative rather than four isolated flashcards.',
        },
      ],
      limitations: ['This model simplifies a more complex real-world process.'],
      sources: [{ label: 'Primary source' }],
    }

    const html = renderToStaticMarkup(<LearnSupport content={content} />)
    expect(html).toContain('Briefing')
    expect(html).toContain('<h3>Relationships</h3>')
    expect(html).toContain('<ul class="learn-list">')
    expect(html).toContain('<ol class="learn-list learn-steps">')
    expect(html).toContain('<dl class="learn-definitions">')
    expect(html).toContain('<th scope="col">Stage</th>')
    expect(html).toContain('<p class="learn-case-label">Case study</p>')
    expect(html).toContain('<h3>Integrated decision case</h3>')
    expect(html).toContain('<h4>Trace the whole loop</h4>')
    expect(html).toContain('The framework is iterative')
    expect(html).not.toContain('dangerouslySetInnerHTML')
    expect(html).not.toContain('flip-card')
  })
})
