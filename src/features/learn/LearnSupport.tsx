import type { LearnBlock, LearnContent, LearnSection } from '../../lib/types'
import { MorseCharacterPacket } from './MorseCharacterPacket'

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
    case 'morse-character-packet':
      return <MorseCharacterPacket characters={block.characters} />
  }
}

function LearnSections({ sections, inCase = false }: { sections: LearnSection[]; inCase?: boolean }) {
  return (
    <>
      {sections.map((section, i) => {
        const Heading = inCase ? 'h4' : 'h3'
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

export function LearnSupport({ content }: { content: LearnContent }) {
  const hasNotes = Boolean(content.limitations?.length || content.sources?.length)

  return (
    <section className={`learn-support learn-support-${content.kind}`} aria-label="Explanatory support">
      <p className="learn-support-kind">{content.kind === 'briefing' ? 'Briefing' : 'Concise support'}</p>

      {content.overview && <p className="learn-overview">{content.overview}</p>}

      {content.sections && <LearnSections sections={content.sections} />}

      {content.caseStudies?.map((caseStudy, i) => (
        <section className="learn-case" key={`${caseStudy.title}-${i}`}>
          <p className="learn-case-label">Case study</p>
          <h3>{caseStudy.title}</h3>
          <p className="learn-case-scenario"><strong>Scenario.</strong> {caseStudy.scenario}</p>
          <LearnSections sections={caseStudy.analysis} inCase />
          {caseStudy.takeaway && (
            <p className="learn-case-takeaway"><strong>Takeaway.</strong> {caseStudy.takeaway}</p>
          )}
        </section>
      ))}

      {hasNotes && (
        <div className="learn-notes">
          {content.limitations && (
            <section>
              <h3>Limitations</h3>
              <ul>
                {content.limitations.map((limitation, i) => <li key={`${limitation}-${i}`}>{limitation}</li>)}
              </ul>
            </section>
          )}
          {content.sources && (
            <section>
              <h3>Sources</h3>
              <ol className="learn-sources">
                {content.sources.map((source, i) => (
                  <li key={`${source.label}-${i}`}>
                    {source.url ? (
                      <a href={source.url} target="_blank" rel="noreferrer">{source.label}</a>
                    ) : source.label}
                    {source.note && <span className="learn-source-note"> — {source.note}</span>}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      )}
    </section>
  )
}
