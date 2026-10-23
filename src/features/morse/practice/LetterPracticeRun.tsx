import { useEffect, useRef, useState } from 'react'
import { MORSE_LETTERS, type MorseLetter } from '../../../domain/morse/code'
import { spokenRhythm } from '../../../domain/morse/mnemonics'
import { newMorsePractice, recordPracticeOutcome, selectPracticeLetter, type MorsePractice, type PracticeDirection } from '../../../domain/morse/practice'
import { letterChoices, type LetterChoiceSet } from '../../../domain/morse/recognition/letterChoices'
import {
  newMorseRecognition, recognitionStreamFor, recordRecognitionOutcome, selectRecognitionLetter,
  type MorseRecognition, type RecognitionStream,
} from '../../../domain/morse/recognition/progress'
import {
  armRecognitionClock, IDLE_RECOGNITION_CLOCK, invalidateRecognitionClock, RECOGNITION_SPEED,
  stopRecognitionClock, summarizeRecognitionRound, type RecognitionAttempt, type RecognitionClock,
} from '../../../domain/morse/recognition/speed'
import { MorseKeyInput } from '../input/MorseKeyInput'
import { useKeyedResponse } from '../input/useKeyedResponse'
import { MorseListenPlay } from '../MorseListenPlay'
import { MorseMarks } from '../MorseMarks'
import { MorseCharacterSupport } from '../MorseCharacterSupport'
import { useMorseAudio } from '../useMorseAudio'
import { SessionFrame, SessionCorrect, RoundResult } from '../../../shared/ui/SessionFrame'
import { fire } from '../../../shared/haptics'
import { LetterChoiceTiles } from './LetterChoiceTiles'
import './LetterPractice.css'

const ROUND_LENGTH = 10
/** Long enough that a second tap on the same spot cannot reach Continue. */
const TAP_THROUGH_GUARD_MS = 350

/** One presented question, with the progress it will be graded against. */
interface Prompt {
  letter: MorseLetter
  practice: MorsePractice
  recognition: MorseRecognition
  stream: RecognitionStream | null
  /** The stream sequence this prompt was drawn at; a stale grade cannot match it. */
  sequence: number
  /** Null for Key, which is keyed rather than chosen. */
  choices: LetterChoiceSet | null
}

function presentPrompt(
  practice: MorsePractice, recognition: MorseRecognition, direction: PracticeDirection, speed: boolean,
  eligible: readonly MorseLetter[], recent: readonly MorseLetter[],
): Prompt {
  if (direction === 'key') {
    const selected = selectPracticeLetter(practice, 'key', eligible, { recent })
    return { letter: selected.letter!, practice: selected.progress, recognition, stream: null, sequence: 0, choices: null }
  }
  const stream = recognitionStreamFor(direction, speed)
  const selected = selectRecognitionLetter(recognition, stream, eligible, { recent })
  return {
    letter: selected.letter!, practice, recognition: selected.progress, stream,
    sequence: selected.progress.streams[stream]!.sequence,
    choices: letterChoices(selected.letter!, eligible),
  }
}

const seconds = (ms: number) => ms >= RECOGNITION_SPEED.capMs ? '10s+' : `${(ms / 1000).toFixed(1)}s`

export function LetterPracticeRun({
  eligible, initialProgress = newMorsePractice(), onProgress, initialRecognition = newMorseRecognition(), onRecognition,
  initialSpeed = false, onAnother, onExit, direction: fixedDirection,
}: {
  direction?: PracticeDirection; eligible: MorseLetter[]
  /** Typed/keyed practice history; Key writes it, Read and Listen never do. */
  initialProgress?: MorsePractice; onProgress: (next: MorsePractice) => void
  /** Four-choice recognition history, a record of its own (#279). */
  initialRecognition?: MorseRecognition; onRecognition?: (next: MorseRecognition) => void
  initialSpeed?: boolean; onAnother: (speed: boolean) => void; onExit: () => void
}) {
  // Speed needs four honest choices; with fewer taught letters there is nothing to time.
  const canSpeed = new Set(eligible).size >= 4
  const [direction, setDirection] = useState<PracticeDirection>(fixedDirection ?? 'key')
  const [speed, setSpeed] = useState(initialSpeed && canSpeed && (fixedDirection ?? 'key') !== 'key')
  const [prompt, setPrompt] = useState(() =>
    presentPrompt(initialProgress, initialRecognition, fixedDirection ?? 'key', initialSpeed && canSpeed, eligible, []))
  const [correctCount, setCorrectCount] = useState(0)
  const [count, setCount] = useState(0)
  const [recent, setRecent] = useState<MorseLetter[]>([])
  const [result, setResult] = useState<boolean | null>(null)
  const [given, setGiven] = useState('')
  const [helped, setHelped] = useState(false)
  const [heard, setHeard] = useState(false)
  const [done, setDone] = useState(false)
  const [attempts, setAttempts] = useState<RecognitionAttempt[]>([])
  const [tapGuard, setTapGuard] = useState(false)
  const practiceRef = useRef(initialProgress)
  const recognitionRef = useRef(initialRecognition)
  const clockRef = useRef<RecognitionClock>(IDLE_RECOGNITION_CLOCK)
  const playStarts = useRef(0)
  const locked = useRef(false)
  const guardTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audio = useMorseAudio()
  const listeningStarted = useRef(false)
  const tiles = useRef<HTMLDivElement>(null)
  const continuation = useRef<HTMLButtonElement>(null)
  const glyph = prompt.letter
  const pattern = MORSE_LETTERS[glyph]
  const choices = prompt.choices
  const chosen = direction !== 'key'

  function clearGuard() {
    if (guardTimer.current) clearTimeout(guardTimer.current)
    guardTimer.current = null
    setTapGuard(false)
  }
  /** Everything that belongs to one presented question, cleared as the next appears. */
  function resetQuestion() {
    clearGuard()
    locked.current = false
    clockRef.current = IDLE_RECOGNITION_CLOCK
    playStarts.current = 0
    listeningStarted.current = false
    setResult(null); setGiven(''); setHelped(false); setHeard(false)
  }
  useEffect(() => () => { if (guardTimer.current) clearTimeout(guardTimer.current) }, [])

  const response = useKeyedResponse(() => {
    audio.stop()
    if (count + 1 >= ROUND_LENGTH) { setDone(true); return }
    const seen = [...recent, glyph].slice(-2)
    setRecent(seen)
    setPrompt(presentPrompt(practiceRef.current, recognitionRef.current, direction, speed, eligible, seen))
    setCount(n => n + 1)
    resetQuestion()
  })

  // A miss's Continue takes focus once it can be pressed.
  useEffect(() => { if (result === false && !tapGuard) continuation.current?.focus() }, [result, tapGuard])
  // A new question hands focus to the tile group, never to a text field: nothing here may open a keyboard.
  useEffect(() => {
    if (!chosen || result !== null || done) return
    const active = document.activeElement
    if (!active || active === document.body || (heard && active.closest('.letter-practice-stimulus'))) tiles.current?.focus({ preventScroll: true })
  }, [chosen, result, done, count, direction, heard, prompt])

  useEffect(() => {
    if (direction !== 'listen' || result !== null) return
    if (audio.sounding) listeningStarted.current = true
    else if (listeningStarted.current && !audio.audioError && !document.hidden) {
      listeningStarted.current = false; setHeard(true)
    }
  }, [audio.sounding, audio.audioError, direction, result])
  // A cancelled or interrupted listening stimulus cannot become an independent hit.
  useEffect(() => {
    const interrupt = () => {
      listeningStarted.current = false; setHeard(false)
      clockRef.current = invalidateRecognitionClock(clockRef.current)
    }
    const invalidate = () => { if (document.hidden) interrupt() }
    document.addEventListener('visibilitychange', invalidate)
    window.addEventListener('pagehide', interrupt)
    return () => { document.removeEventListener('visibilitychange', invalidate); window.removeEventListener('pagehide', interrupt) }
  }, [])
  // Speed: the monotonic clock starts only once the stimulus is complete and the tiles are live.
  useEffect(() => {
    if (!speed || !chosen || result !== null || !choices) return
    if (audio.audioError) { clockRef.current = invalidateRecognitionClock(clockRef.current); return }
    clockRef.current = armRecognitionClock(performance.now(), {
      direction: direction as 'read' | 'listen', choices: choices.choices.length,
      tilesReady: response.armed, playbackFinished: direction === 'listen' ? heard && !audio.sounding : undefined,
      visible: !document.hidden,
    }, clockRef.current)
  }, [speed, chosen, result, choices, direction, response.armed, heard, audio.sounding, audio.audioError])

  function restart(nextDirection: PracticeDirection, nextSpeed: boolean) {
    audio.stop(); audio.clearError(); response.reset(); resetQuestion()
    setDirection(nextDirection); setSpeed(nextSpeed); setRecent([])
    setPrompt(presentPrompt(practiceRef.current, recognitionRef.current, nextDirection, nextSpeed, eligible, []))
  }
  function changeDirection(next: PracticeDirection) {
    restart(next, speed && next !== 'key' && canSpeed)
  }

  function gradeKey(value: string) {
    if (!response.armed || result !== null) return
    audio.stop()
    const correct = value === pattern
    const next = recordPracticeOutcome(prompt.practice, 'key', glyph, correct, !helped)
    // A helped answer is support, not an independent grading verdict.
    if (!helped) fire(correct ? 'settle' : 'miss')
    if (correct) setCorrectCount(n => n + 1)
    practiceRef.current = next; onProgress(next); setGiven(value); setResult(correct); response.answered(correct)
  }
  /** The first accepted tile grades; the lock is a ref so a double tap in one frame cannot grade twice. */
  function choose(value: MorseLetter) {
    if (!choices || locked.current || !response.armed || result !== null || (direction === 'listen' && (!heard || !!audio.sounding || !!audio.audioError))) return
    if (!choices.choices.includes(value)) return
    locked.current = true
    audio.stop()
    const stopped = stopRecognitionClock(clockRef.current, performance.now(), { visible: !document.hidden, independent: !helped })
    clockRef.current = stopped.clock
    const correct = value === glyph
    const next = prompt.stream
      ? recordRecognitionOutcome(prompt.recognition, prompt.stream, glyph, correct, {
        independent: !helped, choices: choices.choices.length, presentedSequence: prompt.sequence,
        elapsedMs: speed ? stopped.elapsedMs : null,
      })
      : prompt.recognition
    if (speed) setAttempts(list => [...list, { correct, elapsedMs: stopped.elapsedMs, choices: choices.choices.length, independent: !helped }])
    // The one semantic verdict; a helped answer is support, not a graded hit.
    if (!helped) fire(correct ? 'settle' : 'miss')
    if (correct) setCorrectCount(n => n + 1)
    else {
      setTapGuard(true)
      guardTimer.current = setTimeout(() => { guardTimer.current = null; setTapGuard(false) }, TAP_THROUGH_GUARD_MS)
    }
    recognitionRef.current = next; onRecognition?.(next)
    setGiven(value); setResult(correct); response.answered(correct)
  }
  // A physical keyboard answers by letter, with no field to type into. Only a letter on a tile counts.
  const chooseRef = useRef(choose)
  chooseRef.current = choose
  useEffect(() => {
    if (!chosen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || event.key.length !== 1) return
      const target = event.target instanceof Element ? event.target : null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      const letter = event.key.toUpperCase() as MorseLetter
      if (choices?.choices.includes(letter)) { event.preventDefault(); chooseRef.current(letter) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [chosen, choices])

  function help() {
    clockRef.current = invalidateRecognitionClock(clockRef.current)
    setHelped(true)
  }
  function togglePlay() {
    if (audio.sounding) listeningStarted.current = false
    else {
      // Only the first uninterrupted hearing can be timed; a replay never is.
      playStarts.current += 1
      if (playStarts.current > 1) clockRef.current = invalidateRecognitionClock(clockRef.current)
    }
    setHeard(false); audio.toggle(glyph)
  }

  const title = direction[0].toUpperCase() + direction.slice(1)
  if (done) {
    const round = speed ? summarizeRecognitionRound(attempts) : null
    const extra = round && <div className="letter-practice-speed-result">
      <p>{round.typicalCorrectMs !== null ? `Typical correct choice ${seconds(round.typicalCorrectMs)}` : 'No timed correct answers'}</p>
      <p className="letter-practice-speed-basis">{round.validSpeedSamples} timed {round.validSpeedSamples === 1 ? 'answer' : 'answers'}</p>
    </div>
    return <SessionFrame kind={direction} title={title} progress={{ current: ROUND_LENGTH, total: ROUND_LENGTH }} onClose={onExit} className="letter-practice">
      <RoundResult correct={correctCount} total={ROUND_LENGTH} extra={extra} onAgain={() => onAnother(speed)} onDone={onExit} /></SessionFrame>
  }
  // One taught letter is no question: show it, unscored, and leave.
  if (choices?.teachingOnly) return <SessionFrame kind={direction} title={title} onClose={onExit} className="letter-practice">
    <div className="letter-practice-stimulus session-stimulus">
      <MorseCharacterSupport glyph={glyph} playing={!!audio.sounding} onToggle={() => audio.toggle(glyph)} />
    </div>
    <div className="letter-practice-response session-response"><button type="button" onClick={onExit}>Got it</button></div>
  </SessionFrame>

  const roundStarted = count > 0 || result !== null
  const toolbar = chosen && canSpeed ? <div className="letter-practice-speed">
    <button type="button" className="ghost small" aria-pressed={speed} disabled={roundStarted} onClick={() => restart(direction, !speed)}>Speed</button>
    {speed && <span className="letter-practice-speed-note">10 letters · no countdown</span>}
  </div> : undefined
  const tilesLive = response.armed && (direction !== 'listen' || (heard && !audio.sounding && !audio.audioError))
  return <SessionFrame kind={direction} title={title} progress={{ current: count + 1, total: ROUND_LENGTH }} onClose={onExit} toolbar={toolbar} className="letter-practice">
    {!fixedDirection && <div className="letter-practice-directions" aria-label="Practice direction" inert={result !== null}>
      {(['key', 'read', 'listen'] as const).map(d => <button className="ghost" key={d} aria-pressed={d === direction} onClick={() => changeDirection(d)}>{d[0].toUpperCase() + d.slice(1)}</button>)}
    </div>}
    {/* The stimulus stays on screen through a miss, above its correction (#263). */}
    {result !== true && <div className="letter-practice-stimulus session-stimulus">
      {direction === 'key' ? <p className="lesson-glyph">{glyph}</p>
        : direction === 'read' ? <MorseMarks pattern={pattern} size="stimulus" label={spokenRhythm(pattern)} className="letter-practice-marks" />
          : <MorseListenPlay label={audio.sounding ? 'Stop Morse sound' : 'Play Morse sound'} icon={audio.sounding ? 'stop' : 'play'} pressed={!!audio.sounding}
            onClick={togglePlay} />}
      {result === null && chosen && <p className="letter-practice-cue">{direction === 'read' ? 'Which letter is this' : heard ? 'Which letter did you hear' : 'Play the sound, then choose'}</p>}
    </div>}
    {result === null && <>
      {helped && <MorseCharacterSupport glyph={glyph} playing={!!audio.sounding} onToggle={() => audio.toggle(glyph)} />}
      <div className="letter-practice-response session-response">
      {direction === 'key' ? <MorseKeyInput key={`${count}-${direction}`} expectedLength={pattern.length} locked={!response.armed} onSubmit={gradeKey} /> :
        choices && <LetterChoiceTiles key={`${count}-${direction}-${speed}`} ref={tiles} choices={choices.choices} disabled={!tilesLive} onChoose={choose} />}
      {!helped && <button className="quiet" disabled={!response.armed} onClick={help}>Help</button>}
      </div>
    </>}
    {result === true && <SessionCorrect target={glyph} />}
    {result === false && <SessionCorrect className="letter-practice-correction" miss={{
      said: direction === 'key' ? (given ? <MorseMarks pattern={given} size="support" label={spokenRhythm(given)} /> : undefined) : given,
      saidLabel: direction === 'key' ? 'You keyed' : 'You said',
      answer: <MorseCharacterSupport glyph={glyph} playing={!!audio.sounding} onToggle={() => audio.toggle(glyph)} />,
      onContinue: response.acknowledge, continueDisabled: !response.holding || tapGuard, continueRef: continuation,
    }} />}
    {audio.audioError && <p role="status">{audio.audioError}</p>}
  </SessionFrame>
}
