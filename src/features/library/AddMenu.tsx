import { useId } from 'react'
import { Dialog } from '../../shared/ui/Dialog'

interface AddMenuProps {
  onNewTopic: () => void
  onWantToLearn: () => void
  onClose: () => void
}

/**
 * The one "+" affordance on Library opens this rather than two adjacent
 * header buttons, because the two actions were being read as peers when they
 * are not: one authors a finite, testable topic now, the other drops an idea
 * in a queue for later. Naming that difference here, once, replaced two
 * unlabelled buttons that only stated it by their relative emphasis.
 */
export function AddMenu({ onNewTopic, onWantToLearn, onClose }: AddMenuProps) {
  const newTopicNoteId = useId()
  const wantNoteId = useId()

  return (
    <Dialog title="Add to the library" onClose={onClose}>
      <div className="add-menu">
        <button
          type="button"
          className="add-menu-option"
          aria-label="New topic"
          aria-describedby={newTopicNoteId}
          onClick={onNewTopic}
        >
          <span className="add-menu-option-title">New topic</span>
          <span className="add-menu-option-note" id={newTopicNoteId}>
            Define a fixed, testable scope and its items now.
          </span>
        </button>
        <button
          type="button"
          className="add-menu-option"
          aria-label="Want to learn"
          aria-describedby={wantNoteId}
          onClick={onWantToLearn}
        >
          <span className="add-menu-option-title">Want to learn</span>
          <span className="add-menu-option-note" id={wantNoteId}>
            Drop an idea in the queue. It stays a note until you write it up.
          </span>
        </button>
      </div>
    </Dialog>
  )
}
