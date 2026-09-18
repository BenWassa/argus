import { useRef, useState } from 'react'
import { useLibrary } from '../../services/library/LibraryProvider'
import { useSyncState } from '../../services/sync/SyncProvider'
import type { SyncState } from '../../services/sync/useSync'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import { exportFilename } from '../../infrastructure/persistence/localLibraryRepository'
import { collisions } from '../../domain/library/catalog'
import { Confirm } from '../../shared/ui/Confirm'
import './ProfilePage.css'

/**
 * Owner/account utility reached from Today. Sync establishes whose record this
 * is; backup and reset remain lower-frequency controls around that record.
 */
export function ProfilePage({ onBack }: { onBack: () => void }) {
  const { topics, library, catalogReport, replaceLibrary, resetLibrary } = useLibrary()
  const sync = useSyncState()
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [pendingImport, setPendingImport] = useState<{ file: File; count: number } | null>(null)

  function exportLibrary() {
    // The whole durable record, not just the topics: catalog delivery history
    // is part of what makes a re-import behave like the library it came from.
    const blob = new Blob([JSON.stringify(library, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = exportFilename()
    a.click()
    URL.revokeObjectURL(url)
    setMessage({ tone: 'ok', text: `Exported ${topics.length} topics.` })
  }

  // Validate before asking, so the confirmation can state real counts and a
  // bad file never gets as far as a scary dialog.
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
    replaceLibrary(result.library)
    setMessage({ tone: 'ok', text: `Imported ${result.library.topics.length} topics.` })
  }

  return (
    <>
      <button className="quiet topic-back" type="button" aria-label="Back to Today" onClick={onBack}>
        <span aria-hidden="true">←</span> Today
      </button>

      <h1>Profile</h1>
      <p className="lede-text">
        Account, sync and data controls. Learning content stays in Library; these controls manage
        the copy of Argus that belongs to you.
      </p>

      <Sync state={sync.state} onSignIn={sync.signIn} onSignOut={sync.signOut} />

      <h2 className="profile-section-title">Data &amp; backup</h2>
      <p className="lede-text">
        Export writes the whole learner record to a JSON file you own. Import replaces your local
        learner record. An entirely empty legacy record is repaired back to the shipped baseline.
      </p>

      <div className="actions start">
        <button type="button" onClick={exportLibrary} disabled={topics.length === 0}>
          Export JSON
        </button>
        <button className="ghost" type="button" onClick={() => fileInput.current?.click()}>
          Import JSON
        </button>
        {/* Driven by the real button above, and hidden from the accessibility
            tree so it is not announced twice. Keyboard users reach the button,
            never a label wrapping an unfocusable input. */}
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

      <h3 className="profile-subsection-title">Reset learning data</h3>
      <p className="lede-text">
        Removes user-authored topics and learner progress from this device, then restores the
        shipped Argus topics as fresh, unstarted content.
      </p>
      <button
        className="danger"
        type="button"
        disabled={topics.length === 0}
        onClick={() => setConfirmReset(true)}
      >
        Reset learning data
      </button>

      {pendingImport && (
        <Confirm
          title="Replace learner data"
          body={`Importing replaces all ${topics.length} topics on this device with the ${pendingImport.count} in this file, including their history, completion records, Learn support, any lesson sitting in progress, item identity, and cue evidence. An entirely empty legacy record is repaired back to the shipped baseline. Export first if you want to keep what is here.`}
          confirmLabel="Replace data"
          onCancel={() => setPendingImport(null)}
          onConfirm={() => {
            void applyImport(pendingImport.file)
            setPendingImport(null)
          }}
        />
      )}

      {confirmReset && (
        <Confirm
          title="Reset learning data"
          body={`All learner progress and user-authored topics on this device will be removed. The shipped Argus catalog will return as fresh, unstarted content. This cannot be undone; export first if you want a copy of your current record.`}
          confirmLabel="Reset data"
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            resetLibrary()
            setConfirmReset(false)
            setMessage({ tone: 'ok', text: 'Learning data reset. Shipped topics restored.' })
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

/**
 * Catalog delivery is quiet but never silent. New shipped topics are announced
 * because they appeared without being asked for, and a withheld one is
 * announced because the alternative would be overwriting the user's work.
 */
function CatalogNotice({ added, withheld }: CatalogNoticeProps) {
  if (added.length === 0 && withheld.length === 0) return null

  return (
    <section className="catalog-notice">
      <h2>Shipped catalog</h2>
      {added.length > 0 && (
        <p className="note">
          {added.length === 1 ? '1 new shipped topic was' : `${added.length} new shipped topics were`}{' '}
          added to this library as unstarted. Nothing already here was changed.
        </p>
      )}
      {withheld.length > 0 && (
        <>
          <p className="note">
            {withheld.length === 1 ? '1 shipped topic was' : `${withheld.length} shipped topics were`}{' '}
            withheld because a topic of your own already uses the same id. Your version was kept as
            it is. Rename or export yours if you want the shipped version instead.
          </p>
          <ul className="index">
            {withheld.map((id) => (
              <li key={id} className="catalog-notice-id tabular">
                {id}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

/**
 * Sync, stated plainly.
 *
 * The one thing a person needs to be told here is what signing in does and does
 * not do, because a learning record is exactly the kind of thing people expect
 * an account to take custody of. It does not: the copy on this device stays the
 * one Argus reads, and signing out leaves it untouched.
 */
function Sync({
  state,
  onSignIn,
  onSignOut,
}: {
  state: SyncState
  onSignIn: () => Promise<void>
  onSignOut: () => Promise<void>
}) {
  if (state.kind === 'unconfigured') {
    // A build with no Firebase configuration is a supported configuration, not
    // a broken one, so this says so rather than offering a button that cannot
    // work.
    return (
      <>
        <h2 className="profile-section-title">Account &amp; sync</h2>
        <p className="lede-text">
          This build has no Firebase configuration, so there is nothing to sign in to. Export and
          import carry the library between devices instead.
        </p>
      </>
    )
  }

  return (
    <>
      <h2 className="profile-section-title">Account &amp; sync</h2>
      <p className="lede-text">
        Signing in with Google keeps this library on your own devices in step. The copy in this
        browser stays the one Argus reads and writes, so Argus works the same offline, and signing
        out leaves everything here exactly as it is. If the same topic changes on two devices,
        neither copy is overwritten and it is named below for you to settle.
      </p>

      <div className="actions start">
        {state.kind === 'signedOut' || state.kind === 'restoring' ? (
          <button type="button" onClick={() => void onSignIn()}>
            Sign in with Google
          </button>
        ) : (
          <button className="ghost" type="button" onClick={() => void onSignOut()}>
            Sign out
          </button>
        )}
      </div>

      <p className={state.kind === 'error' ? 'error' : 'note'} role="status" aria-live="polite">
        {syncMessage(state)}
      </p>
    </>
  )
}

function syncMessage(state: SyncState): string {
  switch (state.kind) {
    case 'unconfigured':
      return ''
    case 'restoring':
      return 'Checking your session…'
    case 'signedOut':
      return 'Not signed in. This library is on this device only.'
    case 'syncing':
      return `Signed in as ${state.user.email ?? state.user.uid}. Checking for changes…`
    case 'synced': {
      const who = state.user.email ?? state.user.uid
      if (state.conflicts.length === 0) return `Signed in as ${who}. Everything is in step.`
      // Naming them matters, because nothing has been decided: both copies are
      // intact and the person is the only one who can say which is right. The
      // wording has to avoid implying it has been handled.
      const named = state.conflicts.join(', ')
      return `Signed in as ${who}. ${
        state.conflicts.length === 1
          ? 'One topic was changed on two devices and is waiting for you'
          : `${state.conflicts.length} topics were changed on two devices and are waiting for you`
      }: ${named}. Nothing was overwritten on either device. Export from the one you want to keep, then import it on the other.`
    }
    case 'error':
      return `${state.message} The library on this device is unaffected.`
  }
}
