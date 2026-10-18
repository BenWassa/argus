import { Dialog } from '../../shared/ui/Dialog'
import './Sheets.css'

interface AddMenuProps {
  onNewTopic: () => void
  onWantToLearn: () => void
  onClose: () => void
}

/**
 * The one "+" affordance on Library opens this rather than two adjacent
 * header buttons. Each way in is a plate carrying its own mark and its name:
 * one authors a finite, testable topic now, the other drops an idea in a queue
 * for later. The difference is in the mark and the words, never a subtitle.
 */
export function AddMenu({ onNewTopic, onWantToLearn, onClose }: AddMenuProps) {
  return (
    <Dialog title="Add to the library" onClose={onClose}>
      <div className="add-menu">
        <button type="button" className="add-menu-option" aria-label="New topic" onClick={onNewTopic}>
          <svg className="add-menu-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M6 3h8l4 4v14H6z M14 3v4h4 M12 11v6 M9 14h6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="add-menu-option-title">New topic</span>
        </button>
        <button type="button" className="add-menu-option" aria-label="Want to learn" onClick={onWantToLearn}>
          <svg className="add-menu-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M7 3h10v18l-5-4-5 4z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          </svg>
          <span className="add-menu-option-title">Want to learn</span>
        </button>
      </div>
    </Dialog>
  )
}
