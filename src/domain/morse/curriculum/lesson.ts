/**
 * The guided Morse lesson policy (#48).
 *
 * This module is the whole acquisition policy, expressed as pure functions over
 * a plain value. The React surface renders `currentStep()` and calls
 * `answerLesson()`; it holds no rules of its own, so every decision below is
 * testable without a DOM and without a scheduler.
 *
 * ## The invariant this module exists to protect
 *
 * ```text
 * retention state: learning / drilled / completed / decayed   (scheduler owns)
 * cue state:       rich / delayed-choice / reduced / free     (Test owns)
 * lesson support:  taught / cued / solo / settled             (Learn owns)
 * ```
 *
 * Learn retrieval is **formative**. Nothing here imports `scheduling.ts`,
 * `cueLadder.ts`, `distractors.ts` or `items.ts`, so a lesson answer
 * structurally cannot record a retention attempt, advance a scheduler interval,
 * write `DirectionEvidence`, satisfy bidirectional coverage or award
 * completion. The single value this
 * module hands back for persistence is an `ItemLessonStore`: one enum per item.
 *
 * ## The policy, and why each parameter has the value it has
 *
 * **Packet ordering and new-item load.** Reused verbatim from the ratified P1/P2
 * decisions in `docs/open/morse/MORSE_CHARACTER_ORDER.md`: complexity-ascending with
 * final-element confusables split, two novel characters per packet, up to five
 * characters on the packet roster. #48 does not re-litigate them; it stops
 * presenting a packet as five cards to scroll and starts presenting it as a
 * lesson. The five-card figure was never the acquisition load and still is not:
 * a lesson introduces exactly `DEFAULT_PACKET_PLAN.novel` new mappings.
 *
 * **First retrieval after introduction.** Every not-yet-introduced character on
 * the roster is introduced first, in packet order, and retrieval begins after
 * the last of them. With two novel characters, the first character is retrieved
 * one step after its own introduction: soon enough to be retrieval rather than
 * recognition of what is still on screen, with one item of intervening material
 * so it is not an echo.
 *
 * **Fast confirmation after success.** A new character gets one supported
 * retrieval and one unaided retrieval: `taught → solo → settled`. Learn is
 * formative, so a correct answer should move the learner on rather than turn
 * a two-letter lesson into repetitive drilling. Test remains responsible for
 * durable scored evidence.
 *
 * **Errors retain repair support.** A miss restores the support that was
 * actually being withheld: one level below the *format* the check used. `solo`
 * and `settled` share the unaided format, so a miss at either records `cued`
 * rather than a level that would show nothing. The immediate confirmation is
 * still unaided: only an unaided success may settle the character.
 *
 * **Errors get one confirmation.** A miss is re-taught in feedback and returns
 * after any available intervening material. The next correct answer settles
 * it; repeated misses keep it pending until one is correct. Completed entries
 * are never reopened merely to fill time.
 *
 * **Interleaving prior material.** Returning characters are selected from
 * previously introduced material by current retrieval need. They are retrieved
 * once unaided, and a miss blocks packet advancement until its unaided
 * confirmation succeeds — interleaving is reinforcement, not decoration.
 *
 * **Packet readiness.** A packet advances only when every roster character —
 * novel and returning — is `settled`. There is no other route: the packet index
 * is derived from durable support levels rather than stored as a counter, so
 * there is no separate "current packet" field that could drift away from what
 * the learner has actually produced.
 *
 * **Leaving and resuming.** Support levels are persisted after every step, so an
 * interrupted lesson never loses ground already earned. The within-lesson queue
 * is not persisted: reopening Learn rebuilds the current packet's lesson from
 * durable support levels, skipping introductions the learner has already had.
 * One deliberate consequence: a learner who settles the new characters and
 * leaves before the returning characters come round advances the packet, and
 * meets those characters again as returning material in a later packet.
 *
 * **Returning learners.** `startLesson` always resolves to the first packet
 * that is not fully settled. A learner who has never opened Learn starts at
 * packet 1; a learner who settled through packet 6 resumes at packet 7. Nobody
 * is restarted from zero and nobody is dropped into material they never met.
 */

export {
  WEAK_ITEM_DELAY_STEPS,
  LESSON_CHOICE_OPTIONS,
  checkFormat,
  fadedSupport,
  restoredSupport,
  type LessonCheckFormat,
  type LessonEntry,
  type LessonFeedback,
  type LessonRun,
  type LessonStep,
} from './lesson/support'
export {
  lessonPackets,
  morseAcquisitionPosition,
  firstUnsettledPacket,
  introducedGlyphs,
  type MorseAcquisitionPosition,
} from './lesson/packets'
export { owedLetters, startAfterCourse, startLesson, type StartLessonOptions } from './lesson/construction'
export {
  currentStep,
  introduceLesson,
  answerLesson,
  advanceLesson,
  lessonOptions,
  lessonProgressCount,
} from './lesson/engine'
export { lessonProgressOf, withLessonProgress, pruneLessonProgress } from './lesson/persistence'
