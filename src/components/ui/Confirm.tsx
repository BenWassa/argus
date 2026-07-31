import { Dialog } from './Dialog'

interface ConfirmProps {
  title: string
  /** Say exactly what is about to be lost, and what survives. */
  body: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * In-product confirmation. Replaces window.confirm, which cannot be focus
 * managed, cannot be styled, and gives the user no idea what survives.
 */
export function Confirm({ title, body, confirmLabel, onConfirm, onCancel }: ConfirmProps) {
  return (
    <Dialog title={title} onClose={onCancel} closeLabel={`Cancel ${title.toLowerCase()}`}>
      <p>{body}</p>
      <div className="actions">
        <button className="ghost" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="danger" type="button" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  )
}
