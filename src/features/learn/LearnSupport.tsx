import type { ReactNode } from 'react'
import type { LearnBlock, LearnContent, LearnSection } from '../../domain/learning/content'
import { MorseCharacterPacket } from '../morse/MorseCharacterPacket'
import { VisualGuide } from './VisualGuide'
import { VisualView } from '../visual/VisualView'

function LearnBlockView({ block }: { block: LearnBlock }) {
  switch (block.type) {
    case 'paragraph':
      return <p className="learn-paragraph">{block.text}</p>
    case 'bullets':
      return (
        <ul className="learn-list">
          {block.items.map((item, i) => <li key={`${item}-${i}`}>{item}</li>)}
        </ul>
      )
    case 'steps':
      return (
        <ol className="learn-list learn-steps">
          {block.items.map((item, i) => <li key={`${item}-${i}`}>{item}</li>)}
        </ol>
      )
    case 'definitions':
      return (
        <dl className="learn-definitions">
          {block.items.map((item, i) => (
            <div key={`${item.term}-${i}`}>
              <dt>{item.term}</dt>
              <dd>{item.definition}</dd>
            </div>
          ))}
        </dl>
      )
    case 'table':
      return (
        <div className="learn-table-wrap" tabIndex={0} role="region" aria-label="Reference table">
          <table className="learn-table">
            <thead>
              <tr>
                {block.columns.map((column, i) => <th key={`${column}-${i}`} scope="col">{column}</th>)}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'entries':
      if (block.presentation === 'visual-guide') return <VisualGuide entries={block.entries} />
      return (
        <ol className="learn-entries">
          {block.entries.map((entry, i) => (
            <li className="learn-entry" key={`${entry.marker}-${i}`}>
              <h4 className="learn-entry-head">
                <span className="learn-entry-marker tabular">{entry.marker}</span>
                <span className="learn-entry-title">{entry.title}</span>
              </h4>
              {entry.visual && <VisualView visual={entry.visual} />}
              {entry.meta && <p className="learn-entry-meta tabular">{entry.meta}</p>}
              {entry.fields.length > 0 && (
                <dl className="learn-entry-fields">
                  {entry.fields.map((field, f) => (
                    <div key={`${field.label}-${f}`}>
                      <dt>{field.label}</dt>
                      <dd>{field.text}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {entry.note && <p className="learn-entry-note">{entry.note}</p>}
            </li>
          ))}
        </ol>
      )
    case 'visual':
      return <VisualView visual={block.visual} />
    case 'morse-character-packet':
      return <MorseCharacterPacket characters={block.characters} />
  }
}

function LearnSections({ sections, inCase = false }: { sections: LearnSection[]; inCase?: boolean }) {
  return (
    <>
      {sections.map((section, i) => {
        const Heading = inCase ? 'h4' : 'h3'
        if (!inCase) return (
          <details className="fold learn-section" key={`${section.heading}-${i}`}>
            <summary><span>{section.heading}</span>{section.blocks[0]?.type === 'paragraph' && <span className="learn-section-lead">{section.blocks[0].text}</span>}</summary>
            <div className="learn-blocks">{section.blocks.map((block, index) => <LearnBlockView block={block} key={index} />)}</div>
          </details>
        )
        return (
          <section className={inCase ? 'learn-case-analysis' : 'learn-section'} key={`${section.heading}-${i}`}>
            <Heading>{section.heading}</Heading>
            <div className="learn-blocks">
              {section.blocks.map((block, blockIndex) => (
                <LearnBlockView block={block} key={`${block.type}-${blockIndex}`} />
              ))}
            </div>
          </section>
        )
      })}
    </>
  )
}

/**
 * Optional recall leads the page. Explanatory support and provenance expand
 * in place through native disclosures, all closed on arrival.
 */
export function LearnSupport({ content, recall }: { content: LearnContent; recall?: ReactNode }) {
  const hasNotes = Boolean(content.limitations?.length || content.sources?.length)

  return (
    <section className={`learn-support learn-support-${content.kind}`} aria-label="Explanatory support">
      {recall}

      {content.overview && <details className="fold"><summary>Why it works</summary><p className="learn-overview">{content.overview}</p></details>}

      {content.sections && <LearnSections sections={content.sections} />}

      {content.caseStudies?.map((caseStudy, i) => (
        <details className="fold learn-case" key={`${caseStudy.title}-${i}`}>
          <summary>Case study: {caseStudy.title}</summary>
          <p className="learn-case-scenario"><strong>Scenario.</strong> {caseStudy.scenario}</p>
          <LearnSections sections={caseStudy.analysis} inCase />
          {caseStudy.takeaway && (
            <p className="learn-case-takeaway"><strong>Takeaway.</strong> {caseStudy.takeaway}</p>
          )}
        </details>
      ))}

      {hasNotes && (
        <div className="learn-notes">
          {content.limitations && (
            <details className="fold">
              <summary>What this doesn’t cover</summary>
              <ul>
                {content.limitations.map((limitation, i) => <li key={`${limitation}-${i}`}>{limitation}</li>)}
              </ul>
            </details>
          )}
          {content.sources && (
            <details className="fold">
              <summary>Sources</summary>
              <ol className="learn-sources">
                {content.sources.map((source, i) => (
                  <li key={`${source.label}-${i}`}>
                    {source.url ? (
                      <a href={source.url} target="_blank" rel="noreferrer">{source.label}</a>
                    ) : source.label}
                    {source.note && <span className="learn-source-note">: {source.note}</span>}
                  </li>
                ))}
              </ol>
            </details>
          )}
        </div>
      )}
    </section>
  )
}
