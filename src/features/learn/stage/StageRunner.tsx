import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Item } from '../../../domain/library/topic'
import { ordered } from '../../../domain/learning/generatedCurriculum'
import type { LessonStage } from '../../../domain/learning/stages'
import { SessionFrame } from '../../../shared/ui/SessionFrame'
import { VisualView } from '../../visual/VisualView'
import { AudioReference } from '../../audio/AudioReference'
import './StageRunner.css'

export interface StageRunnerProps {
  stage: LessonStage
  itemFace: (itemId: string) => { front: string; back: string }
  itemFor?: (itemId: string) => Item | undefined
  onFinish: (stageId: string) => void | Promise<boolean | void>
  onExit: () => void
  onNext?: () => void
  nextLabel?: string
}

export function StageRunner(props: StageRunnerProps) {
  return <StageRun key={props.stage.id} {...props} />
}

function StageRun({ stage, itemFace, itemFor, onFinish, onExit, onNext, nextLabel }: StageRunnerProps) {
  const [index, setIndex] = useState(0)
  const [wrong, setWrong] = useState<string | null>(null)
  const [wrongCount, setWrongCount] = useState(0)
  const [correct, setCorrect] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [card, setCard] = useState(0)
  const [sequence, setSequence] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [finished, setFinished] = useState(false)
  const finishSent = useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const primary = useRef<HTMLButtonElement>(null)
  const step = stage.steps[index]
  useEffect(() => {
    primary.current?.focus({ preventScroll: true })
  }, [correct, revealed])
  useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [index, card, finished])

  function advance() {
    if (finishSent.current) return
    if (index >= stage.steps.length - 1) {
      finishSent.current = true
      setSaveError(false)
      const failed = () => { finishSent.current = false; setSaving(false); setSaveError(true) }
      try {
        const result = onFinish(stage.id)
        if (result && typeof result.then === 'function') {
          setSaving(true)
          void result.then(saved => {
            if (saved === false) failed()
            else { setSaving(false); setFinished(true) }
          }, failed)
        } else setFinished(true)
      } catch { failed() }
    } else {
      setIndex(index + 1)
      setWrong(null); setWrongCount(0); setCorrect(false); setRevealed(false); setCard(0); setSequence([])
    }
  }
  const continueButton = <button ref={primary} type="button" onClick={advance} disabled={saving}>{saving ? 'Saving…' : index === stage.steps.length - 1 ? 'Finish lesson' : 'Continue'}</button>
  let title = 'Recall'
  let content: ReactNode
  let response: ReactNode = continueButton
  let itemId: string | undefined

  // Authored options are written answer-first for the author's sake; the learner
  // sees a fixed shuffle so position never gives the answer away.
  function options(rawValues: string[], answer: string, labels = false) {
    const values = ordered(rawValues, `${stage.id}:${step?.id ?? ''}`)
    return <div className={`choice-options stage-options${values.some(value => value.length > 100) ? ' is-wordy' : ''}`}>{values.map(value => <button type="button" key={value}
      className={`choice-option${wrong === value ? ' is-wrong' : ''}${(correct || wrongCount >= 2) && value === answer ? ' is-correct' : ''}`}
      aria-pressed={correct ? value === answer : wrong === value} disabled={correct}
      onClick={() => { if (value === answer) { setCorrect(true); setWrong(null) } else { setWrong(value); setWrongCount(count => count + 1) } }}>
      {labels ? itemFace(value).front : value}
    </button>)}</div>
  }

  if (step) {
    if ('itemId' in step) itemId = step.itemId
    switch (step.kind) {
      case 'show':
        title = step.title
        content = step.body ? <p className={`stage-answer${step.body.length > 40 ? ' is-long' : ''}`}>{step.body}</p> : undefined
        break
      case 'choose':
        // A pictured item's authored prompt is written for the Test ("Flag 1 of
        // 12 — …"); in a generated lesson the picture is the question.
        const shown = itemFor?.(step.itemId)
        // Only a generated step repeats the item's own authored prompt; an authored
        // step's prompt is its question and is always shown.
        title = shown?.stimulus && step.prompt === shown.prompt ? 'Which one is this?' : step.prompt
        response = <>{options(step.options, step.answer)}{correct && continueButton}</>
        break
      case 'contrast':
        title = step.prompt
        response = <>{options(step.itemIds, step.answerItemId, true)}{correct && continueButton}</>
        break
      case 'complete':
        title = `${step.before} ___ ${step.after}`
        response = <>{options(step.options, step.answer)}{correct && continueButton}</>
        break
      case 'order':
        title = step.prompt
        content = <ol className="stage-sequence" aria-label="Your sequence">{sequence.map(block => <li key={block}>
          <button type="button" onClick={() => { setCorrect(false); setSequence(sequence.filter(value => value !== block)) }} aria-label={`Remove ${block}`}>{block}</button>
        </li>)}</ol>
        response = <><div className="choice-options stage-options">{[...step.blocks].reverse().map(block => <button type="button" key={block} aria-pressed={sequence.includes(block)}
          onClick={() => { setCorrect(false); setSequence(sequence.includes(block) ? sequence.filter(value => value !== block) : [...sequence, block]) }}>{block}</button>)}</div>
          {correct ? continueButton : <button type="button" disabled={sequence.length !== step.blocks.length} onClick={() => {
            if (sequence.every((block, position) => block === step.blocks[position])) { setCorrect(true); setWrong(null) } else setWrong('order')
          }}>Check order</button>}</>
        break
      case 'recall':
      case 'checkpoint': {
        const ids = step.kind === 'recall' ? [step.itemId] : step.itemIds
        itemId = ids[card]
        const face = itemId ? itemFace(itemId) : undefined
        title = face?.front ?? 'Checkpoint'
        content = revealed && face ? <p className="stage-answer">{face.back}</p> : undefined
        const next = () => {
          if (card >= ids.length - 1) setCorrect(true)
          else { setCard(card + 1); setRevealed(false) }
        }
        response = correct || !face ? continueButton : !revealed
          ? <button ref={primary} type="button" onClick={() => setRevealed(true)}>Reveal</button>
          : <div className="choice-options stage-options"><button ref={primary} type="button" onClick={next}>Got it</button><button type="button" onClick={() => { setRevealed(false) }}>Not yet</button></div>
        break
      }
      case 'summary': title = step.text; break
    }
  }
  const item = itemId ? itemFor?.(itemId) : undefined
  const media = item && <>
    {item.stimulus && <VisualView visual={item.stimulus} compact />}
    {item.audio && <AudioReference item={{ ...item, audio: item.audio }} />}
  </>
  const feedback = wrong && step && 'explain' in step
    ? <p className="stage-feedback" role="alert">{wrongCount >= 2 ? `${step.explain} · ` : ''}Try again</p> : null

  return <SessionFrame kind="lesson" title={stage.title} onClose={onExit} className="stage-runner"
    progress={{ current: finished ? stage.steps.length : index + 1, total: stage.steps.length }}
    response={finished ? <>
      {onNext && <button type="button" onClick={onNext}>{nextLabel ?? 'Next lesson'}</button>}
      <button type="button" className="ghost" onClick={onExit}>Done</button>
    </> : <>{saveError && <p role="alert">Could not save this lesson. Try Finish lesson again.</p>}{feedback}{response}</>}>
    <div className="session-stimulus stage-stimulus">
      <div className={`stage-card${step?.kind === 'show' && !finished ? ' is-teaching' : ''}`}>
        {!finished && media}
        <h2 ref={heading} tabIndex={-1} className={`stage-title${!finished && title.length <= 3 ? ' is-glyph' : ''}`}>{finished ? 'Lesson complete' : title}</h2>
        {!finished && content}
      </div>
    </div>
  </SessionFrame>
}
