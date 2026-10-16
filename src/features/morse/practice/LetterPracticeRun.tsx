import { useEffect, useRef, useState } from 'react'
import { MORSE_LETTERS, type MorseLetter } from '../../../domain/morse/code'
import { canonicalNotation, spokenRhythm } from '../../../domain/morse/mnemonics'
import { newMorsePractice, recordPracticeOutcome, selectPracticeLetter, type MorsePractice, type PracticeDirection } from '../../../domain/morse/practice'
import { MorseKeyInput } from '../input/MorseKeyInput'
import { useKeyedResponse } from '../input/useKeyedResponse'
import { MorsePlayButton } from '../MorsePlayButton'
import { MorseCharacterSupport } from '../MorseCharacterSupport'
import { useMorseAudio } from '../useMorseAudio'
import './LetterPractice.css'

export function LetterPracticeRun({ eligible, initialProgress = newMorsePractice(), onProgress, onAnother, onExit }: {
  eligible: MorseLetter[]; initialProgress?: MorsePractice; onProgress: (next: MorsePractice) => void; onAnother: () => void; onExit: () => void
}) {
  const [direction, setDirection] = useState<PracticeDirection>('key')
  const [selection, setSelection] = useState(() => selectPracticeLetter(initialProgress, 'key', eligible, { recent: [] }))
  const [count, setCount] = useState(0)
  const [recent, setRecent] = useState<MorseLetter[]>([])
  const [result, setResult] = useState<boolean | null>(null)
  const [entry, setEntry] = useState('')
  const [helped, setHelped] = useState(false)
  const [heard, setHeard] = useState(false)
  const [done, setDone] = useState(false)
  const progress = useRef(initialProgress)
  const audio = useMorseAudio()
  const listeningStarted = useRef(false)
  const input = useRef<HTMLInputElement>(null)
  const continuation = useRef<HTMLButtonElement>(null)
  const glyph = selection.letter!
  const pattern = MORSE_LETTERS[glyph]
  const response = useKeyedResponse(() => {
    audio.stop()
    if (count + 1 >= 10) { setDone(true); return }
    const seen = [...recent, glyph].slice(-2)
    setRecent(seen)
    setSelection(selectPracticeLetter(progress.current, direction, eligible, { recent: seen }))
    setCount(n => n + 1)
    setResult(null); setEntry(''); setHelped(false); setHeard(false)
  })
  useEffect(() => {
    if (result === false) continuation.current?.focus()
    else if (direction !== 'key' && response.armed && result === null) input.current?.focus()
  }, [result, response.armed, direction, count])
  useEffect(() => {
    if (direction !== 'listen' || result !== null) return
    if (audio.sounding) listeningStarted.current = true
    else if (listeningStarted.current && !audio.audioError && !document.hidden) {
      listeningStarted.current = false; setHeard(true)
    }
  }, [audio.sounding, audio.audioError, direction, result])
  // A cancelled or interrupted listening stimulus cannot become an independent hit.
  useEffect(() => {
    const invalidate = () => { if (document.hidden) { listeningStarted.current = false; setHeard(false) } }
    const hide = () => { listeningStarted.current = false; setHeard(false) }
    document.addEventListener('visibilitychange', invalidate)
    window.addEventListener('pagehide', hide)
    return () => { document.removeEventListener('visibilitychange', invalidate); window.removeEventListener('pagehide', hide) }
  }, [])
  function changeDirection(next: PracticeDirection) {
    listeningStarted.current = false
    audio.stop(); audio.clearError(); response.reset(); setDirection(next); setRecent([])
    setSelection(selectPracticeLetter(progress.current, next, eligible, { recent: [] }))
    setResult(null); setEntry(''); setHelped(false); setHeard(false)
  }
  function submit(value: string) {
    if (!response.armed || result !== null || (direction === 'listen' && !heard)) return
    audio.stop()
    const correct = direction === 'key' ? value === pattern : value.trim().toUpperCase() === glyph
    const next = recordPracticeOutcome(selection.progress, direction, glyph, correct, !helped)
    progress.current = next; onProgress(next); setResult(correct); response.answered(correct)
  }
  if (done) return <section className="session letter-practice"><h1>Round complete</h1><p>10 letters practised</p>
    <button onClick={onAnother}>Another round</button><button className="ghost" onClick={onExit}>Back to Morse</button></section>
  return <section className="session letter-practice">
    <div className="session-bar"><span className="session-topic">Morse</span><span className="session-count">{count + 1} / 10</span><button className="ghost small" onClick={onExit}>Close</button></div>
    <h1>Practice letters</h1>
    <div className="letter-practice-directions" aria-label="Practice direction" inert={result !== null}>
      {(['key', 'read', 'listen'] as const).map(d => <button className="ghost" key={d} aria-pressed={d === direction} onClick={() => changeDirection(d)}>{d[0].toUpperCase() + d.slice(1)}</button>)}
    </div>
    {result === null && <>
      <div className="letter-practice-stimulus">
        {direction === 'key' ? <p className="lesson-glyph">{glyph}</p> : direction === 'read' ? <p className="morse-notation" aria-label={spokenRhythm(pattern)}>{canonicalNotation(pattern)}</p> :
          <MorsePlayButton glyph={glyph} concealGlyph playing={!!audio.sounding} onToggle={() => { if (audio.sounding) listeningStarted.current = false; setHeard(false); audio.toggle(glyph) }} />}
      </div>
      {helped && <MorseCharacterSupport glyph={glyph} playing={!!audio.sounding} onToggle={() => audio.toggle(glyph)} />}
      {direction === 'key' ? <MorseKeyInput key={`${count}-${direction}`} expectedLength={pattern.length} locked={!response.armed} onSubmit={submit} /> :
        <label className="letter-practice-entry">Letter<input ref={input} className="field" value={entry} maxLength={1} autoComplete="off" autoCapitalize="characters" spellCheck={false} disabled={!response.armed || (direction === 'listen' && (!heard || !!audio.sounding || !!audio.audioError))} onChange={e => { setEntry(e.target.value); if(e.target.value.trim()) submit(e.target.value) }} /></label>}
      {!helped && <button className="quiet" disabled={!response.armed} onClick={() => setHelped(true)}>Help</button>}
    </>}
    {result === true && <p role="status">Correct</p>}
    {result === false && <div className="letter-practice-correction"><p role="status">Try this letter</p>
      <MorseCharacterSupport glyph={glyph} playing={!!audio.sounding} onToggle={() => audio.toggle(glyph)} />
      <button ref={continuation} disabled={!response.holding} onClick={response.acknowledge}>Continue</button></div>}
    {audio.audioError && <p role="status">{audio.audioError} Choose Read or Key to continue without sound.</p>}
  </section>
}
