import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { Topic } from '../../../domain/library/topic'
import { morseProgressPath, type MorseProgressAction, type MorseProgressNode } from '../../../domain/morse/curriculum/progressPath'
import { MORSE_MODES } from '../../../domain/morse/modes'
import './MorseProgressPath.css'

interface MorseProgressPathProps {
  topic: Topic
  onAction: (action: MorseProgressAction) => void
  /** The topic keeps its nine fixed controls; standalone paths may offer a return control. */
  showJump?: boolean
}

/** Lessons are round; the two tests are square, and each test has its own mark. */
function NodeMark({ node }: { node: MorseProgressNode }) {
  const square = node.kind === 'checkpoint' || node.kind === 'test'
  let mark: ReactNode = null
  if (node.kind === 'test') mark = 'A–Z'
  else if (node.kind === 'checkpoint') mark = <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor" focusable="false"><path d="M3 2h3v18H3V2Zm4 1h12l-3 5 3 5H7V3Z" /></svg>
  else if (node.kind === 'start') mark = <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" focusable="false"><path d="M4 2.5v11l9.5-5.5L4 2.5Z" /></svg>
  else if (node.kind === 'lesson') mark = node.state === 'done' ? '✓' : node.number
  return (
    <span className={`morse-progress-node${square ? ' morse-progress-node-square' : ''}${node.kind === 'test' ? ' morse-progress-node-test' : ''}`} aria-hidden="true">
      {mark}
    </span>
  )
}

function NodeWords({ node }: { node: MorseProgressNode }) {
  if (node.kind === 'start') return <strong className="morse-progress-title">Begin</strong>
  if (node.kind === 'lesson') return <><strong className="morse-progress-letters">{node.novel.join(' ')}</strong><span className="morse-progress-label">{node.label}</span></>
  if (node.kind === 'checkpoint') return <span className="morse-progress-copy"><strong>WORD CHECK</strong><span className="morse-progress-detail">{node.words.slice(0, 3).join(' · ')}</span></span>
  if (node.kind === 'test') return <span className="morse-progress-copy"><strong>A–Z TEST</strong><span className={`morse-progress-detail${node.testState === 'repair' ? ' is-repair' : ''}`}>
    {node.testState === 'repair' ? '◆ Needs repair' : node.testState === 'banked' ? 'Banked' : node.testState === 'available' ? 'Ready' : 'Locked'}
  </span></span>
  return <strong className="morse-progress-title">{node.label}</strong>
}

/** A straight projection of the course, with no local unlock or progress state. */
export function MorseProgressPath({ topic, onAction, showJump = true }: MorseProgressPathProps) {
  const path = morseProgressPath(topic)
  const listRef = useRef<HTMLOListElement>(null)
  const currentRef = useRef<HTMLButtonElement>(null)
  const [jump, setJump] = useState<'↑' | '↓' | null>(null)
  const currentId = path?.currentNodeId

  useLayoutEffect(() => {
    const list = listRef.current
    const current = currentRef.current
    if (!list || !current) return
    const measure = () => {
      const marks = list.querySelectorAll<HTMLElement>('.morse-progress-node')
      const centre = (element: Element) => {
        const rect = element.getBoundingClientRect()
        return rect.top + rect.height / 2 - list.getBoundingClientRect().top
      }
      if (!marks.length) return
      list.style.setProperty('--spine-top', `${centre(marks[0])}px`)
      list.style.setProperty('--spine-bottom', `${centre(marks[marks.length - 1])}px`)
      list.style.setProperty('--spine-current', `${centre(current.querySelector('.morse-progress-node')!)}px`)
    }
    measure()
    current.scrollIntoView?.({ block: 'center', behavior: 'instant' })
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    resize?.observe(list)
    window.addEventListener('resize', measure)
    const observer = !showJump || typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      if (entry) setJump(entry.isIntersecting ? null : entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0) ? '↑' : '↓')
    })
    observer?.observe(current)
    return () => {
      resize?.disconnect()
      observer?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [topic, currentId, showJump])

  if (!path) return null
  const current = path.nodes.find((node) => node.id === currentId)!
  return (
    <>
      <ol className="morse-progress-path" aria-label="Course path" ref={listRef}>
        {path.nodes.map((node) => {
          const isCurrent = node.id === currentId
          const locked = node.state === 'locked'
          const className = `morse-progress-row is-${node.state} morse-progress-${node.kind}`
          return (
            <li key={node.id} data-node-id={node.id}>
              {node.kind === 'tier' ? (
                <div className={className} role="group" aria-label={node.accessibleLabel} aria-disabled={locked || undefined}>
                  <NodeMark node={node} /><NodeWords node={node} />
                  <span className="morse-progress-pips">
                    {node.pips.map((pip) => <button key={pip.mode} type="button"
                      className={`morse-progress-pip morse-progress-pip-${pip.mode} is-${pip.state}`}
                      aria-label={`${node.label}, ${MORSE_MODES.find((mode) => mode.id === pip.mode)!.label}, ${pip.state}`}
                      aria-disabled={pip.state === 'locked' || undefined}
                      onClick={() => { if (pip.state !== 'locked' && pip.action) onAction(pip.action) }}>
                      <span aria-hidden="true" />
                    </button>)}
                  </span>
                </div>
              ) : (
                <button type="button" className={className} ref={isCurrent ? currentRef : undefined}
                  aria-label={node.accessibleLabel} aria-current={isCurrent ? 'step' : undefined}
                  aria-disabled={locked || undefined}
                  onClick={() => { if (!locked && node.action) onAction(node.action) }}>
                  <NodeMark node={node} /><NodeWords node={node} />
                  {isCurrent && <span className="morse-progress-go" aria-hidden="true">Start</span>}
                </button>
              )}
              {node.kind === 'test' && node.earlyRunPossible && (
                <button className="quiet" type="button" onClick={() => onAction(node.testAction)}>Test A–Z early</button>
              )}
            </li>
          )
        })}
      </ol>
      {showJump && jump && <button type="button" className="morse-progress-jump"
        onClick={() => currentRef.current?.scrollIntoView?.({ block: 'center', behavior: 'instant' })}>
        {current.label} {jump}
      </button>}
    </>
  )
}
