import { useEffect, useRef, useState } from 'react'
import { useLibrary } from '../../services/library/LibraryProvider'
import { useSyncState } from '../../services/sync/SyncProvider'
import type { SyncState } from '../../services/sync/useSync'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import {
  exportFilename,
  recoveryEntries,
} from '../../infrastructure/persistence/localLibraryRepository'
import {
  formatStorageBytes,
  inspectStorage,
  type StorageStatus,
} from '../../infrastructure/persistence/storageStatus'
import { collisions } from '../../domain/library/catalog'
import { Confirm } from '../../shared/ui/Confirm'
import { Plate } from '../../shared/ui/Plate'
import { ScreenHeader } from '../../shared/ui/ScreenHeader'
import { hapticsEnabled, hapticsSupported, setHapticsEnabled } from '../../shared/haptics'
import packageMetadata from '../../../package.json'
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
  const [online, setOnline] = useState(() => navigator.onLine)
  const [storage, setStorage] = useState<StorageStatus | null>(null)
  const [recovered] = useState(recoveryEntries)

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine)
    window.addEventListener('online', updateOnline)
    window.addEventListener('offline', updateOnline)
    void inspectStorage().then(setStorage)
    return () => {
      window.removeEventListener('online', updateOnline)
      window.removeEventListener('offline', updateOnline)
    }
  }, [])

  function downloadRecovered() {
    // Exactly what was stored, for a person or a later build to repair.
    const blob = new Blob([JSON.stringify(recovered, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `argus-unreadable-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

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
    const saved = await replaceLibrary(result.library)
    setMessage(saved === false
      ? { tone: 'error', text: 'Import was not saved on this device. Your previous library is intact.' }
      : { tone: 'ok', text: `Imported ${result.library.topics.length} topics.` })
  }

  const lastRecovery = recovered[recovered.length - 1]
  return (
    <div className="profile-page">
      <ScreenHeader title="Profile" onBack={onBack} backLabel="Back to Home" />

      <Sync state={sync.state} onSignIn={sync.signIn} onSignOut={sync.signOut} />

      <Plate as="section" className="profile-section" aria-labelledby="profile-device">
        <h2 id="profile-device">This device</h2>
        <dl className="profile-readouts">
          <Readout label="Network" value={online ? 'Online' : 'Offline'} />
          <Readout label="Storage" value={storage === null ? 'Checking…' : storageProtection(storage)} />
          {storage?.usage != null && (
            <Readout
              label="Used"
              value={storage.quota === null
                ? formatStorageBytes(storage.usage)
                : `${formatStorageBytes(storage.usage)} of ${formatStorageBytes(storage.quota)}`}
            />
          )}
          <Readout label="Offline reopen" value="Not guaranteed" />
        </dl>
        <Haptics />
      </Plate>

      <Plate as="section" className="profile-section" aria-labelledby="profile-backup">
        <h2 id="profile-backup">Data &amp; backup</h2>
        <dl className="profile-readouts">
          <Readout label="Topics" value={String(topics.length)} />
        </dl>
        <div className="profile-actions">
          <button className="ghost" type="button" onClick={exportLibrary} disabled={topics.length === 0}>
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

        <p className={`profile-message${message?.tone === 'error' ? ' error' : ''}`} role="status" aria-live="polite">
          {message?.text ?? ''}
        </p>

        {recovered.length > 0 && (
          <div className="profile-recovered">
            <p className="profile-recovered-text">
              A stored library this version could not read was kept, not overwritten.
              {lastRecovery && <span className="tabular"> Last on {new Date(lastRecovery.at).toLocaleDateString()}.</span>}
            </p>
            <button className="ghost" type="button" onClick={downloadRecovered}>
              Download unreadable copy
            </button>
          </div>
        )}
      </Plate>

      <CatalogNotice added={catalogReport.added} withheld={collisions(catalogReport)} />

      <Plate as="section" className="profile-section profile-danger-zone" aria-labelledby="profile-reset">
        <h2 id="profile-reset">Reset</h2>
        <button
          className="profile-danger"
          type="button"
          disabled={topics.length === 0}
          onClick={() => setConfirmReset(true)}
        >
          Reset learning data
        </button>
      </Plate>

      <p className="profile-about tabular">App version {packageMetadata.version} · build {__ARGUS_BUILD_ID__}</p>

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
            setConfirmReset(false)
            void Promise.resolve(resetLibrary()).then((saved) => {
              setMessage(saved === false
                ? { tone: 'error', text: 'Reset was not saved on this device. Your previous library is intact.' }
                : { tone: 'ok', text: 'Learning data reset. Shipped topics restored.' })
            })
          }}
        />
      )}
    </div>
  )
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="profile-readout">
      <dt>{label}</dt>
      <dd className="tabular">{value}</dd>
    </div>
  )
}

function storageProtection(storage: StorageStatus): string {
  switch (storage.persistence) {
    case 'granted':
      return 'Protected'
    case 'denied':
      return 'Not granted'
    case 'unsupported':
      return 'Not reported'
  }
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
    <Plate as="section" className="profile-section" aria-labelledby="profile-catalog">
      <h2 id="profile-catalog">Shipped catalog</h2>
      <dl className="profile-readouts">
        {added.length > 0 && <Readout label="Added, unstarted" value={String(added.length)} />}
        {withheld.length > 0 && <Readout label="Withheld, id in use" value={String(withheld.length)} />}
      </dl>
      {withheld.length > 0 && (
        <ul className="profile-ids">
          {withheld.map((id) => (
            <li key={id} className="catalog-notice-id tabular">
              {id}
            </li>
          ))}
        </ul>
      )}
    </Plate>
  )
}

/**
 * Sync, stated plainly.
 *
 * The one thing a person needs to be told here is what signing in does and does
 * not do, because a learning record is exactly the kind of thing people expect
 * an account to take custody of. It does not: the copy on this device stays the
 * one Argus reads, and signing out leaves it untouched. The status line carries
 * that, so the section is a reading and one action.
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
      <Plate as="section" className="profile-section" aria-labelledby="profile-account">
        <h2 id="profile-account">Account &amp; sync</h2>
        <dl className="profile-readouts">
          <Readout label="Sync" value="Unavailable in this build" />
        </dl>
      </Plate>
    )
  }

  const signedOut = state.kind === 'signedOut' || state.kind === 'restoring'
  return (
    <Plate as="section" className="profile-section" aria-labelledby="profile-account">
      <h2 id="profile-account">Account &amp; sync</h2>
      <p className={`profile-message${state.kind === 'error' ? ' error' : ''}`} role="status" aria-live="polite">
        {syncMessage(state)}
      </p>
      <div className="profile-actions">
        {signedOut ? (
          <button type="button" onClick={() => void onSignIn()}>
            Sign in with Google
          </button>
        ) : (
          <button className="ghost" type="button" onClick={() => void onSignOut()}>
            Sign out
          </button>
        )}
      </div>
    </Plate>
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


/**
 * The one haptics control.
 *
 * Hidden entirely where the browser has no Vibration API rather than shown
 * disabled, because a disabled switch invites the learner to go looking for
 * the reason it is off — and on an iPhone the reason is "Safari has never
 * implemented this", which is not something a settings row can fix. Nothing in
 * Argus is conveyed by vibration alone, so its absence costs them nothing and
 * saying so would be noise.
 */
function Haptics() {
  const [supported] = useState(hapticsSupported)
  const [enabled, setEnabled] = useState(hapticsEnabled)

  if (!supported) return null

  return (
    <label className="profile-toggle">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(event) => {
          setHapticsEnabled(event.target.checked)
          setEnabled(event.target.checked)
        }}
      />
      <span>Vibration</span>
    </label>
  )
}
