import { useEffect, useRef, useState } from 'react'
import { MORSE_LETTERS, type MorseLetter } from '../../../domain/morse/code'
import { spokenRhythm } from '../../../domain/morse/mnemonics'
import { newMorsePractice, recordPracticeOutcome, selectPracticeLetter, type MorsePractice, type PracticeDirection } from '../../../domain/morse/practice'
import { MorseKeyInput } from '../input/MorseKeyInput'
import { useKeyedResponse } from '../input/useKeyedResponse'
import { MorseListenPlay } from '../MorseListenPlay'
import { MorseMarks } from '../MorseMarks'
import { MorseCharacterSupport } from '../MorseCharacterSupport'
import { useMorseAudio } from '../useMorseAudio'
import { SessionFrame, SessionCorrect, RoundResult } from '../../../shared/ui/SessionFrame'
import { fire } from '../../../shared/haptics'
import './LetterPractice.css'

export function LetterPracticeRun({ eligible, initialProgress = newMorsePractice(), onProgress, onAnother, onExit, direction: fixedDirection }: {
  direction?: PracticeDirection; eligible: MorseLetter[]; initialProgress?: MorsePractice; onProgress: (next: MorsePractice) => void; onAnother: () => void; onExit: () => void
}) {
  const [direction, setDirection] = useState<PracticeDirection>(fixedDirection ?? 'key')
  const [selection, setSelection] = useState(() => selectPracticeLetter(initialProgress, fixedDirection ?? 'key', eligible, { recent: [] }))
  const [correctCount, setCorrectCount] = useState(0)
  const [count, setCount] = useState(0)
  const [recent, setRecent] = useState<MorseLetter[]>([])
  const [result, setResult] = useState<boolean | null>(null)
  const [given, setGiven] = useState('')
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
    setResult(null); setGiven(''); setEntry(''); setHelped(false); setHeard(false)
  })
  useEffect(() => {
    if (result === false) continuation.current?.focus()
    else if (direction !== 'key' && response.armed && result === null && (direction !== 'listen' || (heard && !audio.sounding && !audio.audioError))) input.current?.focus()
  }, [result, response.armed, direction, count, heard, audio.sounding, audio.audioError])
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
    setResult(null); setGiven(''); setEntry(''); setHelped(false); setHeard(false)
  }
  function submit(value: string) {
    if (!response.armed || result !== null || (direction === 'listen' && !heard)) return
    audio.stop()
    const correct = direction === 'key' ? value === pattern : value.trim().toUpperCase() === glyph
    const next = recordPracticeOutcome(selection.progress, direction, glyph, correct, !helped)
    // A helped answer is support, not an independent grading verdict.
    if (!helped) fire(correct ? 'settle' : 'miss')
    if (correct) setCorrectCount(n => n + 1)
    progress.current = next; onProgress(next); setGiven(direction === 'key' ? value : value.trim().toUpperCase()); setResult(correct); response.answered(correct)
  }
  const title = direction[0].toUpperCase() + direction.slice(1)
  if (done) return <SessionFrame kind={direction} title={title} progress={{ current: 10, total: 10 }} onClose={onExit} className="letter-practice">
    <RoundResult correct={correctCount} total={10} onAgain={onAnother} onDone={onExit} /></SessionFrame>
  return <SessionFrame kind={direction} title={title} progress={{ current: count + 1, total: 10 }} onClose={onExit} className="letter-practice">
    {!fixedDirection && <div className="letter-practice-directions" aria-label="Practice direction" inert={result !== null}>
      {(['key', 'read', 'listen'] as const).map(d => <button className="ghost" key={d} aria-pressed={d === direction} onClick={() => changeDirection(d)}>{d[0].toUpperCase() + d.slice(1)}</button>)}
    </div>}
    {/* The stimulus stays on screen through a miss, above its correction (#263). */}
    {result !== true && <div className="letter-practice-stimulus session-stimulus">
      {direction === 'key' ? <p className="lesson-glyph">{glyph}</p>
        : direction === 'read' ? <MorseMarks pattern={pattern} size="stimulus" label={spokenRhythm(pattern)} className="letter-practice-marks" />
          : <MorseListenPlay label={audio.sounding ? 'Stop Morse sound' : 'Play Morse sound'} icon={audio.sounding ? 'stop' : 'play'} pressed={!!audio.sounding}
            onClick={() => { if (audio.sounding) listeningStarted.current = false; setHeard(false); audio.toggle(glyph) }} />}
    </div>}
    {result === null && <>
      {helped && <MorseCharacterSupport glyph={glyph} playing={!!audio.sounding} onToggle={() => audio.toggle(glyph)} />}
      <div className="letter-practice-response session-response">
      {direction === 'key' ? <MorseKeyInput key={`${count}-${direction}`} expectedLength={pattern.length} locked={!response.armed} onSubmit={submit} /> :
        <label className="letter-practice-entry">Letter<input ref={input} className="field" value={entry} maxLength={1} autoComplete="off" autoCapitalize="characters" spellCheck={false} disabled={!response.armed || (direction === 'listen' && (!heard || !!audio.sounding || !!audio.audioError))} onChange={e => { setEntry(e.target.value); if(e.target.value.trim()) submit(e.target.value) }} /></label>}
      {!helped && <button className="quiet" disabled={!response.armed} onClick={() => setHelped(true)}>Help</button>}
      </div>
    </>}
    {result === true && <SessionCorrect target={glyph} />}
    {result === false && <SessionCorrect className="letter-practice-correction" miss={{
      said: direction === 'key' ? (given ? <MorseMarks pattern={given} size="support" label={spokenRhythm(given)} /> : undefined) : given,
      saidLabel: direction === 'key' ? 'You keyed' : 'You said',
      answer: <MorseCharacterSupport glyph={glyph} playing={!!audio.sounding} onToggle={() => audio.toggle(glyph)} />,
      onContinue: response.acknowledge, continueDisabled: !response.holding, continueRef: continuation,
    }} />}
    {audio.audioError && <p role="status">{audio.audioError}</p>}
  </SessionFrame>
}
