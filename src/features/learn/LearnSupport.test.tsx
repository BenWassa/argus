// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { seedLibrary } from '../../domain/library/catalogSeed'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import { morseLessonPath } from '../../domain/morse/curriculum/lessonPath'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { LearnContent } from '../../domain/learning/content'
import { LearnSupport } from './LearnSupport'

describe('structured Learn rendering', () => {
  it('renders concise support without limitations or provenance in the body', () => {
    const content: LearnContent = {
      kind: 'concise',
      overview: 'A small amount of context is enough for this topic.',
      limitations: ['Memory support only.'],
      sources: [{ label: 'Reference', url: 'https://example.com/reference', note: 'Source note.' }],
    }

    const html = renderToStaticMarkup(<LearnSupport content={content} />)
    expect(html).not.toContain('<details')
    expect(html).toContain('A small amount of context')
    // Provenance and caveats are not in the body; `SourcesAndLimits` owns them.
    expect(html).not.toContain('Memory support only.')
    expect(html).not.toContain('https://example.com/reference')
    expect(html).not.toContain('learn-notes')
    expect(html).not.toContain('flip-card')
    expect(html).not.toContain(' open=')
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
    expect(html).not.toContain('learn-support-kind')
    expect(html).toContain('<h3>Relationships</h3>')
    expect(html).toContain('<ul class="learn-list">')
    expect(html).toContain('<ol class="learn-list learn-steps">')
    expect(html).toContain('<dl class="learn-definitions">')
    expect(html).toContain('<th scope="col">Stage</th>')
    expect(html).toContain('<h3>Case study: Integrated decision case</h3>')
    expect(html).toContain('<h4>Trace the whole loop</h4>')
    expect(html).toContain('The framework is iterative')
    expect(html).not.toContain('dangerouslySetInnerHTML')
    expect(html).not.toContain('flip-card')
    expect(html).not.toContain(' open=')
  })

  it('keeps each entry together, and sets the recall slot first', () => {
    const content: LearnContent = {
      kind: 'concise',
      sections: [{
        heading: 'The scale',
        blocks: [{
          type: 'entries',
          entries: [{
            marker: '7',
            title: 'Near gale',
            meta: '28–33 knots',
            fields: [{ label: 'At sea', text: 'Sea heaps up.' }, { label: 'On land', text: 'Whole trees in motion.' }],
            note: 'An inline note.',
          }],
        }],
      }],
      limitations: ['Memory support only.'],
      sources: [{ label: 'Reference' }],
    }

    const html = renderToStaticMarkup(
      <LearnSupport content={content} recall={<h2 className="recall-slot">What to remember</h2>} />,
    )
    expect(html).toContain('<h4 class="learn-entry-head"><span class="learn-entry-marker tabular">7</span><span class="learn-entry-title">Near gale</span></h4>')
    expect(html).toContain('<dt>At sea</dt><dd>Sea heaps up.</dd>')
    expect(html).toContain('<dt>On land</dt><dd>Whole trees in motion.</dd>')
    expect(html).toContain('An inline note.')
    expect(html).not.toContain('<table')
    expect(html.indexOf('recall-slot')).toBeLessThan(html.indexOf('Near gale'))
  })
})


it('renders every ordinary catalogue topic’s authored Learn headings and text openly', () => {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  const topics = parsed.library.topics.filter((topic) => topic.learn && !morseLessonPath(topic))
  expect(topics.some((topic) => topic.learn?.kind === 'briefing')).toBe(true)
  expect(topics.some((topic) => topic.learn?.kind === 'concise')).toBe(true)
  for (const topic of topics) {
    const content = topic.learn!
    const { container } = render(<LearnSupport content={content} />)
    for (const section of [...(content.sections ?? []), ...(content.caseStudies ?? []).flatMap((study) => study.analysis)]) {
      expect(screen.getAllByRole('heading', { name: section.heading }).length, topic.id).toBeGreaterThan(0)
      for (const block of section.blocks) {
        if (block.type === 'paragraph') expect(container.textContent, topic.id).toContain(block.text)
      }
    }
    for (const study of content.caseStudies ?? []) {
      expect(screen.getByRole('heading', { name: `Case study: ${study.title}` }), topic.id).toBeTruthy()
      expect(container.textContent, topic.id).toContain(study.scenario)
      if (study.takeaway) expect(container.textContent, topic.id).toContain(study.takeaway)
    }
    if (content.overview) expect(container.textContent, topic.id).toContain(content.overview)
    expect(container.querySelector('details, summary'), topic.id).toBeNull()
    cleanup()
  }
})
