import { useRef, useState } from 'react'
import { useLibrary } from '../../lib/store'
import { useProgressSync } from '../../lib/progressSyncReact'
import { exportFilename, parseLibrary } from '../../lib/storage'
import { collisions } from '../../lib/catalog'
import { Confirm } from '../../components/ui/Confirm'

interface DataProps {
  onBack: () => void
  accountLabel: string
  onSignOut: () => void
}

export function Data({ onBack, accountLabel, onSignOut }: DataProps) {
  const { topics, library, catalogReport, replaceLibrary, resetLibrary } = useLibrary()
  const sync = useProgressSync()
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [pendingImport, setPendingImport] = useState<{ file: File; count: number } | null>(null)

  function exportLibrary() {
    const blob = new Blob([JSON.stringify(library, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = exportFilename()
    a.click()
    URL.revokeObjectURL(url)
    setMessage({ tone: 'ok', text: `Exported ${topics.length} topics.` })
  }

  async function reviewImport(file: File) {
    try {
      const result = parseLibrary(JSON.parse(await file.text()))
      if (!result.ok) {
        setMessage({ tone: 'error', text: `${result.error} Nothing was changed.` })
        return
      }
      setPendingImport({ file, count: result.library.topics.length })
    } catch {
      setMessage({ tone: 'error', text: 'That file is not valid JSON. Nothing was changed.' })
    }
  }

  async function applyImport(file: File) {
    const result = parseLibrary(JSON.parse(await file.text()))
    if (!result.ok) return
    sync?.preserveBeforeChange('pre-import-library')
    replaceLibrary(result.library)
    setMessage({ tone: 'ok', text: `Imported ${result.library.topics.length} topics. Backup will reconcile this replacement.` })
  }

  const syncLabel = sync?.status === 'synced'
    ? 'Backed up'
    : sync?.status === 'pending'
      ? 'Saving backup…'
      : sync?.status === 'offline'
        ? 'Saved on this device · cloud offline'
        : sync?.status === 'conflict'
          ? 'Backup conflict protected'
          : sync?.status === 'error'
            ? 'Backup needs attention'
            : 'Backup unavailable'

  return (
    <>
      <button className="quiet topic-back" type="button" aria-label="Back to Library" onClick={onBack}>
        <span aria-hidden="true">←</span> Library
      </button>

      <h1>Data</h1>
      <p className="lede-text">
        Your learner library is saved on this device first and backed up to your signed-in account.
        Export writes the complete portable JSON record to a file you own.
      </p>

      <section className="catalog-notice" aria-labelledby="backup-heading">
        <h2 id="backup-heading">Account and backup</h2>
        <p className="note">{accountLabel}</p>
        <p className={sync?.status === 'error' || sync?.status === 'conflict' ? 'error' : 'note'} role="status" aria-live="polite">
          {syncLabel}{sync?.error ? ` — ${sync.error}` : ''}
        </p>
        {sync && sync.recoveryCount > 0 && (
          <p className="note">
            {sync.recoveryCount} protected recovery {sync.recoveryCount === 1 ? 'copy is' : 'copies are'} retained on this device.
          </p>
        )}
        <div className="actions start">
          {sync && (sync.status === 'offline' || sync.status === 'error') && (
            <button className="ghost" type="button" onClick={sync.retry}>Retry backup</button>
          )}
          {sync?.status === 'conflict' && (
            <>
              <button type="button" onClick={() => void sync.resolveConflict('local')}>Keep this device</button>
              {sync.conflict?.cloud && (
                <button className="ghost" type="button" onClick={() => void sync.resolveConflict('cloud')}>Use cloud copy</button>
              )}
            </>
          )}
          <button className="quiet" type="button" onClick={onSignOut}>Sign out</button>
        </div>
      </section>

      <div className="actions start">
        <button type="button" onClick={exportLibrary} disabled={topics.length === 0}>Export JSON</button>
        <button className="ghost" type="button" onClick={() => fileInput.current?.click()}>Import JSON</button>
        <input
          ref={fileInput}
          className="sr-only"
          type="file"
          accept="application/json,.json"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void reviewImport(file)
            e.target.value = ''
          }}
        />
      </div>

      <p className={message?.tone === 'error' ? 'error' : 'note'} role="status" aria-live="polite">
        {message?.text ?? ''}
      </p>

      <CatalogNotice added={catalogReport.added} withheld={collisions(catalogReport)} />

      <h2>Reset</h2>
      <p className="lede-text">
        Clears the learner library for this signed-in account. A pre-reset recovery copy is kept on this device.
      </p>
      <button className="danger" type="button" disabled={topics.length === 0} onClick={() => setConfirmReset(true)}>
        Reset library
      </button>

      {pendingImport && (
        <Confirm
          title="Replace library"
          body={`Importing replaces all ${topics.length} current topics with the ${pendingImport.count} in this file, including history, completion, lesson progress, Morse review state and cue evidence. The current account copy is preserved on this device first, then the imported library becomes the synced copy.`}
          confirmLabel="Replace library"
          onCancel={() => setPendingImport(null)}
          onConfirm={() => {
            void applyImport(pendingImport.file)
            setPendingImport(null)
          }}
        />
      )}

      {confirmReset && (
        <Confirm
          title="Reset library"
          body={`All ${topics.length} topics and their durable learner state will be removed from this account backup. A pre-reset recovery copy is retained on this device.`}
          confirmLabel="Reset library"
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            sync?.preserveBeforeChange('pre-reset-library')
            resetLibrary()
            setConfirmReset(false)
            setMessage({ tone: 'ok', text: 'Library reset. The account backup will be updated to match.' })
          }}
        />
      )}
    </>
  )
}

interface CatalogNoticeProps {
  added: string[]
  withheld: string[]
}

function CatalogNotice({ added, withheld }: CatalogNoticeProps) {
  if (added.length === 0 && withheld.length === 0) return null
  return (
    <section className="catalog-notice">
      <h2>Shipped catalog</h2>
      {added.length > 0 && (
        <p className="note">
          {added.length === 1 ? '1 new shipped topic was' : `${added.length} new shipped topics were`} added to this library as unstarted. Nothing already here was changed.
        </p>
      )}
      {withheld.length > 0 && (
        <>
          <p className="note">
            {withheld.length === 1 ? '1 shipped topic was' : `${withheld.length} shipped topics were`} withheld because a topic of your own already uses the same id. Your version was kept as it is.
          </p>
          <ul className="index">
            {withheld.map((id) => <li key={id} className="catalog-notice-id tabular">{id}</li>)}
          </ul>
        </>
      )}
    </section>
  )
}
