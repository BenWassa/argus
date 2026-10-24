import './SaveBar.css'

/**
 * A local save in progress, as something moving. The length of a write is not
 * known, so this travels rather than fills; the words beside it carry the state.
 */
export function SaveBar() {
  return <div className="save-bar" aria-hidden="true" />
}
