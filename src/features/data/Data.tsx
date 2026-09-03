import { useRef, useState } from 'react'
import { useLibrary } from '../../lib/store'
import { exportFilename, parseLibrary } from '../../lib/storage'
import { Confirm } from '../../components/ui/Confirm'

export function Data() {
  const { topics, replaceLibrary, resetLibrary } = useLibrary()
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [pendingImport, setPendingImport] = useState<{ file: File; count: number } | null>(null)

  function exportLibrary() {
    const blob = new Blob([JSON.stringify({ version: 5, topics }, null, 2)], {
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
      <h1>Data</h1>
      <p className="lede-text">
        Everything lives in this browser. Export writes the whole library to a JSON file you own;
        import replaces what is here with the contents of that file.
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

      <h2>Reset</h2>
      <p className="lede-text">
        Clears every topic and its history from this device. Export first if you want to keep a
        copy.
      </p>
      <button
        className="danger"
        type="button"
        disabled={topics.length === 0}
        onClick={() => setConfirmReset(true)}
      >
        Reset library
      </button>

      {pendingImport && (
        <Confirm
          title="Replace library"
          body={`Importing replaces all ${topics.length} topics on this device with the ${pendingImport.count} in this file, including their history, completion records, Learn support, item identity, and cue evidence. Export first if you want to keep what is here.`}
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
          body={`All ${topics.length} topics, their Learn support, test history, completion records, and cue evidence will be removed from this device. This cannot be undone, and an export made now is the only copy you will have.`}
          confirmLabel="Reset library"
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            resetLibrary()
            setConfirmReset(false)
            setMessage({ tone: 'ok', text: 'Library reset. Nothing is stored on this device.' })
          }}
        />
      )}
    </>
  )
}
