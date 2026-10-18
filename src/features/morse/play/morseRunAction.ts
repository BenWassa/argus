import type { RunTarget } from '../../../app/routing/routes'
import type { Mode } from '../../../domain/study/mode'
import type { MorseModeEntry } from '../../../domain/morse/modes'
import type { MorseProgressAction } from '../../../domain/morse/curriculum/progressPath'
import { morseWordCheckpoints } from '../../../domain/morse/curriculum/checkpoints'

/** Translate read-only path and mode descriptors into the existing run routes. */
export function morseRunAction(action: MorseProgressAction | MorseModeEntry): { mode: Mode; target?: RunTarget } {
  switch (action.kind) {
    case 'mode': return morseRunAction(action.entry)
    case 'start-lesson': return { mode: 'learn', target: { kind: 'lesson' } }
    case 'replay-lesson': return { mode: 'learn', target: { kind: 'replay', index: action.packetIndex } }
    case 'after-course': return { mode: 'learn', target: { kind: 'after-course' } }
    case 'checkpoint': return { mode: 'learn', target: { kind: 'checkpoint', afterLesson: morseWordCheckpoints().find(checkpoint => checkpoint.id === action.checkpointId)!.afterLesson } }
    case 'test': return { mode: 'test' }
    case 'practice': return { mode: 'learn', target: { kind: 'letter-practice', direction: action.direction } }
    case 'send': return { mode: 'learn', target: { kind: 'fluency', send: action.stage } }
    case 'copy': return { mode: 'learn', target: { kind: 'fluency', copy: action.level } }
    case 'fluency': return { mode: 'learn', target: { kind: 'fluency', mode: action.challenge } }
    case 'free': return { mode: 'learn', target: { kind: 'fluency', free: true } }
  }
}
