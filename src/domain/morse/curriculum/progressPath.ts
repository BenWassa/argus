import type { Topic } from '../../library/topic'
import { journeyFor } from '../../study/journey'
import type { MorseLetter } from '../code'
import {
  MORSE_MODES, MORSE_TIERS, levelReadiness, levelsFor, modeEntry, modeLevelCleared,
  type MorseMode, type MorseModeEntry, type MorseTier,
} from '../modes'
import { morseWordCheckpointPath, type MorseWordCheckpointId } from './checkpoints'
import { morseLessonPath } from './lessonPath'

export type MorseProgressNodeState = 'done' | 'current' | 'reached' | 'locked'

export type MorseProgressAction =
  | { kind: 'start-lesson'; packetIndex: number }
  | { kind: 'replay-lesson'; packetIndex: number }
  | { kind: 'after-course' }
  | { kind: 'checkpoint'; checkpointId: MorseWordCheckpointId }
  | { kind: 'test'; early: boolean }
  | { kind: 'mode'; entry: MorseModeEntry }

interface ProgressNode {
  id: string
  state: MorseProgressNodeState
  label: string
  accessibleLabel: string
  action: MorseProgressAction | null
  /** One line saying why a locked node cannot start (#257); null when it can. */
  lockedReason?: string | null
}

export interface MorseTierPip {
  mode: MorseMode
  state: 'locked' | 'available' | 'cleared'
  action: Extract<MorseProgressAction, { kind: 'mode' }> | null
  /** One line saying why a locked pip cannot start; null otherwise. */
  reason: string | null
}

export type MorseProgressNode = ProgressNode & (
  | { kind: 'start'; offersPlacement: boolean }
  | { kind: 'lesson'; number: number; novel: MorseLetter[] }
  | { kind: 'checkpoint'; checkpointId: MorseWordCheckpointId; afterLesson: number; words: string[] }
  | { kind: 'test'; testState: 'locked' | 'available' | 'banked' | 'repair'; earlyRunPossible: boolean; testAction: Extract<MorseProgressAction, { kind: 'test' }> }
  | { kind: 'tier'; tier: MorseTier; pips: MorseTierPip[] }
)

export interface MorseProgressPath {
  nodes: MorseProgressNode[]
  /** Learner position for scrolling, independent of which activities are available. */
  currentNodeId: string
}

const TIER_LABELS: Record<MorseTier, string> = {
  letters: 'Letters', words: 'Words', phrases: 'Phrases', sentences: 'Sentences',
  messages: 'Messages', numbers: 'Numbers', groups: 'Groups',
}

function tierPips(topic: Topic, tier: MorseTier): MorseTierPip[] {
  return MORSE_MODES.flatMap(({ id: mode }): MorseTierPip[] => {
    const levels = levelsFor(mode).filter((level) => level.tier === tier)
    if (!levels.length) return []
    const cleared = levels.every((level) => modeLevelCleared(topic, mode, level))
    const next = levels.find((level) => !modeLevelCleared(topic, mode, level)) ?? levels[0]
    const readiness = levelReadiness(topic, next)
    const entry = readiness.startable ? modeEntry(topic, mode, next.id) : null
    return [{
      mode, state: !entry ? 'locked' : cleared ? 'cleared' : 'available',
      action: entry ? { kind: 'mode', entry } : null,
      reason: readiness.startable ? null : readiness.reason,
    }]
  })
}

/**
 * One projection of the existing journey, never a second progression policy.
 * Checkpoints have no completion record, so unlocked means reached, not done.
 * Test stays current for banked learners because the shared journey still says
 * `test`; later formative tiers are replayable offers, not formal obligations.
 */
export function morseProgressPath(topic: Topic): MorseProgressPath | null {
  const lessons = morseLessonPath(topic)
  const checkpoints = morseWordCheckpointPath(topic)
  if (!lessons || !checkpoints) return null
  const journey = journeyFor(topic)
  const unstarted = journey.action === 'learn' && !journey.acquisition.started
  const afterCourse = journey.action === 'learn' && journey.acquisition.afterCourse && journey.acquisition.owed.length > 0
  const currentNodeId = journey.action === 'test' || afterCourse
    ? 'test'
    : unstarted ? 'start' : `lesson-${journey.acquisition.packet}`
  const nodes: MorseProgressNode[] = []
  const add = (node: MorseProgressNode) => {
    if (node.id === currentNodeId) node.state = 'current'
    if (node.state !== 'locked') node.lockedReason = null
    const detail = node.kind === 'lesson' ? `, ${node.novel.join(' and ')}`
      // The test's own state is said once: "A–Z Test, locked", never "locked, locked".
      : node.kind === 'test' ? (afterCourse ? ', Confirm letters' : node.testState === node.state ? '' : `, ${node.testState}`) : ''
    node.accessibleLabel = `${node.label}${detail}, ${node.state}`
    nodes.push(node)
  }

  add({ id: 'start', kind: 'start', label: 'Start', accessibleLabel: '',
    state: unstarted ? 'current' : 'done', offersPlacement: unstarted,
    action: { kind: lessons[0].replayable ? 'replay-lesson' : 'start-lesson', packetIndex: 0 } })

  for (const lesson of lessons) {
    const state: MorseProgressNodeState = lesson.state === 'completed' ? 'done'
      : lesson.state === 'locked' ? 'locked' : 'reached'
    add({ id: `lesson-${lesson.number}`, kind: 'lesson', label: `Lesson ${lesson.number}`, accessibleLabel: '',
      state, number: lesson.number, novel: [...lesson.novel], lockedReason: `After Lesson ${lesson.number - 1}`,
      action: state === 'locked' ? null : { kind: lesson.replayable ? 'replay-lesson' : 'start-lesson', packetIndex: lesson.index } })
    for (const checkpoint of checkpoints.filter((candidate) => candidate.afterLesson === lesson.number)) {
      add({ id: `checkpoint-${checkpoint.id}`, kind: 'checkpoint', label: `Words after Lesson ${lesson.number}`, accessibleLabel: '',
        state: checkpoint.unlocked ? 'reached' : 'locked', checkpointId: checkpoint.id,
        lockedReason: `After Lesson ${checkpoint.afterLesson}`,
        afterLesson: checkpoint.afterLesson, words: [...checkpoint.words],
        action: checkpoint.unlocked ? { kind: 'checkpoint', checkpointId: checkpoint.id } : null })
    }
  }

  const testState = journey.phase === 'repair' ? 'repair' : journey.phase === 'banked' ? 'banked'
    : journey.advancementEligible ? 'available' : 'locked'
  const testAction = { kind: 'test', early: !journey.advancementEligible } as const
  add({ id: 'test', kind: 'test', label: 'A–Z Test', accessibleLabel: '',
    state: testState === 'banked' ? 'done' : testState === 'locked' ? 'locked' : 'reached',
    testState, earlyRunPossible: testAction.early, testAction, lockedReason: 'After the lessons, or test early',
    action: afterCourse ? { kind: 'after-course' } : testAction })

  for (const tier of MORSE_TIERS.filter((candidate) => candidate !== 'letters')) {
    const pips = tierPips(topic, tier)
    if (!pips.length) continue
    const state = pips.every((pip) => pip.state === 'cleared') ? 'done'
      : pips.some((pip) => pip.state !== 'locked') ? 'reached' : 'locked'
    add({ id: `tier-${tier}`, kind: 'tier', tier, label: TIER_LABELS[tier], accessibleLabel: '', state, pips,
      lockedReason: pips.find((pip) => pip.reason)?.reason ?? null,
      action: pips.find((pip) => pip.state === 'available')?.action ?? pips.find((pip) => pip.action)?.action ?? null })
  }
  return { nodes, currentNodeId }
}
