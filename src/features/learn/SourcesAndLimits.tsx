import { useState } from 'react'
import type { LearnContent } from '../../domain/learning/content'
import { Dialog } from '../../shared/ui/Dialog'
import './SourcesAndLimits.css'

/**
 * Provenance and caveats, one tap from the foot of the page and nowhere in the
 * body (#166). Every source and limitation stays, verbatim; only their
 * prominence changes. Scope leads when supplied by the topic page.
 */
export function SourcesAndLimits({ content, scope }: { content?: LearnContent; scope?: string }) {
  const [open, setOpen] = useState(false)
  const limitations = content?.limitations ?? []
  const sources = content?.sources ?? []
  if (!scope && limitations.length === 0 && sources.length === 0) return null

  const label =
    scope || (limitations.length > 0 && sources.length > 0)
      ? 'Sources and limitations'
      : sources.length > 0 ? 'Sources' : 'Limitations'

  return (
    <>
      <button className="quiet sources-link" type="button" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <Dialog title={label} centred closeLabel={`Close ${label.toLowerCase()}`} onClose={() => setOpen(false)}>
          <div className="learn-notes sources-notes">
            {scope && <section><h3>Scope and limits</h3><p>{scope}</p></section>}
            {limitations.length > 0 && (
              <section>
                <h3>Limitations</h3>
                <ul>
                  {limitations.map((limitation, i) => <li key={`${limitation}-${i}`}>{limitation}</li>)}
                </ul>
              </section>
            )}
            {sources.length > 0 && (
              <section>
                <h3>Sources</h3>
                <ol className="learn-sources">
                  {sources.map((source, i) => (
                    <li key={`${source.label}-${i}`}>
                      {source.url ? (
                        <a href={source.url} target="_blank" rel="noreferrer">{source.label}</a>
                      ) : source.label}
                      {source.note && <span className="learn-source-note">: {source.note}</span>}
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        </Dialog>
      )}
    </>
  )
}
