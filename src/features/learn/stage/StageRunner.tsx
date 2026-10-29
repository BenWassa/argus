import { useEffect, useRef, useState } from 'react'
import type { LessonStage } from '../../../domain/learning/stages'
import './StageRunner.css'

export interface StageRunnerProps {
  stage: LessonStage
  /** The two faces of a scored item: what the learner is asked, and what they should recall. */
  itemFace: (itemId: string) => { front: string; back: string }
  onFinish: (stageId: string) => void
  onExit: () => void
}

/** `blocks` is the answer key, so the tiles are shown reversed: tapping them left to right must not pass. */
export function StageRunner(props: StageRunnerProps) {
  return <StageRun key={props.stage.id} {...props} />
}

function StageRun({ stage, itemFace, onFinish, onExit }: StageRunnerProps) {
  const [index, setIndex] = useState(0)
  const [wrong, setWrong] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [card, setCard] = useState(0)
  const [sequence, setSequence] = useState<string[]>([])
  const [finished, setFinished] = useState(false)
  const finishSent = useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const step = stage.steps[index]

  useEffect(() => { heading.current?.focus() }, [index])

  function advance() {
    if (finishSent.current) return
    if (index >= stage.steps.length - 1) {
      finishSent.current = true
      setFinished(true)
      onFinish(stage.id)
    } else {
      setIndex(index + 1)
      setWrong(false)
      setRevealed(false)
      setCard(0)
      setSequence([])
    }
  }

  function answer(correct: boolean) {
    if (correct) advance()
    else setWrong(true)
  }

  const continueButton = <button type="button" className="stage-primary" onClick={advance}>
    {index === stage.steps.length - 1 ? 'Finish lesson' : 'Continue'}
  </button>
  const options = (values: string[], correct: string, labels = false) => (
    <div className="stage-options">
      {values.map((value) => <button type="button" key={value} onClick={() => answer(value === correct)}>
        {labels ? itemFace(value).front : value}
      </button>)}
    </div>
  )

  return <section className="stage-runner" aria-label={stage.title}>
    <header className="stage-header">
      <h2 ref={heading} tabIndex={-1}>{stage.title}</h2>
      <button type="button" onClick={onExit}>Exit lesson</button>
    </header>
    <p className="stage-progress" role="status">{finished ? 'Lesson finished' : `Step ${index + 1} of ${stage.steps.length}`}</p>
    {!finished && step && <div className="stage-task" key={step.id}>
      {step.kind === 'show' && <>
        <h3>{step.title}</h3>
        {step.itemId && <div role={step.altText ? 'img' : undefined} aria-label={step.altText}>
          {step.altText ?? itemFace(step.itemId).front}
        </div>}
        <p>{step.body}</p>{continueButton}
      </>}
      {step.kind === 'choose' && <><h3>{step.prompt}</h3>{options(step.options, step.answer)}</>}
      {step.kind === 'contrast' && <><h3>{step.prompt}</h3>{options(step.itemIds, step.answerItemId, true)}</>}
      {step.kind === 'complete' && <>
        <p>{step.before} <span aria-label="Missing part">___</span> {step.after}</p>
        {options(step.options, step.answer)}
      </>}
      {step.kind === 'order' && <>
        <h3>{step.prompt}</h3>
        <ol aria-label="Your sequence" className="stage-sequence">
          {sequence.map((block) => <li key={block}><button type="button" aria-label={`Remove ${block}`}
            onClick={() => setSequence(sequence.filter((value) => value !== block))}>{block}</button></li>)}
        </ol>
        <div className="stage-options" aria-label="Blocks">
          {[...step.blocks].reverse().map((block) => <button type="button" key={block} aria-pressed={sequence.includes(block)}
            onClick={() => setSequence(sequence.includes(block)
              ? sequence.filter((value) => value !== block) : [...sequence, block])}>{block}</button>)}
        </div>
        <button type="button" className="stage-primary" disabled={sequence.length !== step.blocks.length}
          onClick={() => answer(sequence.every((block, position) => block === step.blocks[position]))}>Check order</button>
      </>}
      {(step.kind === 'recall' || step.kind === 'checkpoint') && (() => {
        const ids = step.kind === 'recall' ? [step.itemId] : step.itemIds
        const face = itemFace(ids[card])
        const last = card >= ids.length - 1
        const next = () => { if (last) advance(); else { setCard(card + 1); setRevealed(false) } }
        return <>
          <h3>{step.kind === 'recall' ? 'Recall' : `Checkpoint, ${card + 1} of ${ids.length}`}</h3>
          <p>{face.front}</p>
          {!revealed ? <button type="button" className="stage-primary" onClick={() => setRevealed(true)}>Reveal</button> : <>
            <p>{face.back}</p>
            <div className="stage-options">
              <button type="button" onClick={next}>Got it</button>
              <button type="button" onClick={next}>Not yet</button>
            </div>
          </>}
        </>
      })()}
      {step.kind === 'summary' && <><p>{step.text}</p>{continueButton}</>}
      {wrong && 'explain' in step && <div className="stage-feedback" role="alert">
        <p>{step.explain}</p>
        <p>Try again, or continue.</p>
        {continueButton}
      </div>}
    </div>}
    {!finished && !step && continueButton}
  </section>
}
