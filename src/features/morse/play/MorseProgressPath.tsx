import { useState, type ReactNode } from 'react'
import type { Topic } from '../../../domain/library/topic'
import { morseProgressPath, type MorseProgressAction, type MorseProgressNode } from '../../../domain/morse/curriculum/progressPath'
import { MORSE_MODES } from '../../../domain/morse/modes'
import { ProgressSpine, type SpineRow, type SpineState } from '../../../shared/ui/ProgressSpine'
import { MorseModeGlyph } from './MorseModeTray'
import './MorseProgressPath.css'

interface MorseProgressPathProps {
  topic: Topic
  onAction: (action: MorseProgressAction) => void
  /** The topic keeps its nine fixed controls; standalone paths may offer a return control. */
  showJump?: boolean
  /** Opens placement; given only while the Begin row offers it. Drawn inside the Begin plate. */
  onPlacement?: () => void
}

interface Notice {
  nodeId: string
  text: string
}

const FLAG = <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor" focusable="false"><path d="M3 2h3v18H3V2Zm4 1h12l-3 5 3 5H7V3Z" /></svg>
const PLAY = <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" focusable="false"><path d="M4 2.5v11l9.5-5.5L4 2.5Z" /></svg>

/** Lessons are round; the two tests are square, and each test has its own mark. */
function mark(node: MorseProgressNode): ReactNode {
  if (node.kind === 'test') return 'A–Z'
  if (node.kind === 'checkpoint') return FLAG
  if (node.kind === 'start') return node.state === 'done' ? '✓' : PLAY
  if (node.kind === 'lesson') return node.state === 'done' ? '✓' : node.number
  return null
}

function spineState(node: MorseProgressNode): SpineState {
  if (node.state === 'current') return 'position'
  if (node.kind === 'test' && node.testState === 'repair') return 'repair'
  return node.state
}

function words(node: MorseProgressNode): Pick<SpineRow, 'label' | 'detail' | 'trailing'> {
  if (node.kind === 'start') return { label: 'Begin' }
  if (node.kind === 'lesson') return { label: node.novel.join(' '), trailing: <span className="morse-progress-label">{node.label}</span> }
  if (node.kind === 'checkpoint') return { label: 'WORD CHECK', detail: node.words.slice(0, 3).join(' · ') }
  if (node.kind === 'test') return {
    label: 'A–Z TEST',
    detail: node.testState === 'repair' ? <span className="morse-progress-repair">◆ Needs repair</span>
      : node.testState === 'banked' ? 'Banked' : node.testState === 'available' ? 'Ready' : 'Locked',
  }
  return { label: node.label }
}

function TierPips({ node, onAction, onLocked }: {
  node: Extract<MorseProgressNode, { kind: 'tier' }>
  onAction: (action: MorseProgressAction) => void
  onLocked: (text: string) => void
}) {
  return (
    <span className="morse-progress-pips">
      {node.pips.map((pip) => <button key={pip.mode} type="button"
        className={`morse-progress-pip morse-progress-pip-${pip.mode} is-${pip.state}`}
        aria-label={`${node.label}, ${MORSE_MODES.find((mode) => mode.id === pip.mode)!.label}, ${pip.state}`}
        aria-disabled={pip.state === 'locked' || undefined}
        onClick={() => {
          if (pip.state !== 'locked' && pip.action) onAction(pip.action)
          else if (pip.reason) onLocked(pip.reason)
        }}>
        <span className="morse-progress-pip-chip" aria-hidden="true"><MorseModeGlyph mode={pip.mode} small /></span>
      </button>)}
    </span>
  )
}

/**
 * A straight projection of the course, with no local unlock or progress state.
 * The current node is a position mark only (#242): every reached node is
 * equally tappable, and nothing on the line says "Start". A tap on anything
 * that cannot start says why in one line under its row (#257).
 */
export function MorseProgressPath({ topic, onAction, showJump = true, onPlacement }: MorseProgressPathProps) {
  const [notice, setNotice] = useState<Notice | null>(null)
  const path = morseProgressPath(topic)
  if (!path) return null
  const act = (action: MorseProgressAction) => {
    setNotice(null)
    onAction(action)
  }
  const current = path.nodes.find((node) => node.id === path.currentNodeId)!
  const rows: SpineRow[] = path.nodes.map((node) => {
    const say = (text: string) => setNotice({ nodeId: node.id, text })
    const aside = node.kind === 'test' && node.earlyRunPossible
      ? <button className="ghost small morse-progress-aside" type="button" onClick={() => act(node.testAction)}>Test early</button>
      : node.kind === 'start' && node.offersPlacement && onPlacement
        ? <button className="ghost small morse-progress-aside" type="button" onClick={() => { setNotice(null); onPlacement() }}>Skip ahead</button>
        : undefined
    return {
      id: node.id,
      shape: node.kind === 'checkpoint' || node.kind === 'test' ? 'square' : 'round',
      mark: mark(node),
      state: spineState(node),
      ...words(node),
      ...(node.kind === 'tier' ? { group: true, trailing: <TierPips node={node} onAction={act} onLocked={say} /> } : {}),
      accessibleLabel: node.accessibleLabel,
      plate: node.kind === 'checkpoint' || node.kind === 'test' || node.kind === 'tier',
      className: `morse-progress-row morse-progress-${node.kind}`,
      onSelect: node.action ? () => act(node.action!) : undefined,
      onLockedSelect: node.lockedReason ? () => say(node.lockedReason!) : undefined,
      aside,
      after: notice?.nodeId === node.id
        ? <p className="morse-progress-notice" role="status">{notice.text}</p>
        : undefined,
    }
  })
  return <ProgressSpine rows={rows} label="Course path" className="morse-progress-path"
    positionId={path.currentNodeId} jump={showJump ? current.label : undefined} />
}
