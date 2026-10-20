import { FLUENCY_RUNGS, nextRung, previousRung, type FluencyRung } from '../../../domain/morse/fluency/timing'
import './Fluency.css'

/**
 * The one listening dial, moved from the retired Fluency hub into the Listen
 * session itself (#230/#231). It changes only the room between characters;
 * characters stay at 20 WPM, and guided sending is unaffected.
 */
export function ListeningSpacing({ rung, onChange }: { rung: FluencyRung; onChange: (rung: FluencyRung) => void }) {
  return (
    <div className="listening-spacing" role="group" aria-label="Listening spacing">
      <span className="listening-spacing-value tabular" aria-live="polite" aria-atomic="true">Spacing {rung} WPM</span>
      <button type="button" className="ghost small" aria-label="More room between characters"
        disabled={rung === FLUENCY_RUNGS[0]} onClick={() => onChange(previousRung(rung))}>More room</button>
      <button type="button" className="ghost small" aria-label="Less room between characters"
        disabled={rung === FLUENCY_RUNGS[FLUENCY_RUNGS.length - 1]} onClick={() => onChange(nextRung(rung))}>Less room</button>
    </div>
  )
}
