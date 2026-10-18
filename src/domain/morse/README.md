# Morse domain module map

Status: maintained module map. Authority: source navigation; the linked contracts own product policy.

This tree contains no React or components. It owns Morse rules and plain state;
features compose them with rendering, playback and persistence boundaries.

Paths below are relative to this directory. Adjacent `*.test.ts` files verify
individual modules; the additional programme-wide tests are listed separately.

- `code.ts` — canonical letters, figures and punctuation, decoding and timed signal schedules.
- `audio.ts` — cancellable audio playback and audio-context lifecycle over `code.ts` schedules.
- `progress.ts` — durable formative lesson support, sitting and review record types.
- `response.ts` — shared keyed-response phases, feedback timing and element duration.
- `correction.ts` — identifies the letter behind an unambiguous response miss.
- `mnemonics.ts` — visual rhythm geometry, notation and accessible text equivalents.
- `verbalMnemonics.ts` — authored rhythmic phrases, beat grammar and canonical validation.
- `practice.ts` — independent directional practice history, validation and weighted letter selection.
- `placement.ts` — returning-learner placement targets, verdicts and application to a topic.
- `testing/` — canonical acquisition profiles and cue interpretation for scored Test.
- `testing/acquisitionProfile.ts` — recognises supported topic content and derives characters, cues and answer rules.
- `curriculum/` — guided acquisition, formative review, lesson paths and word checkpoints.
- `curriculum/packetOrder.ts` — complexity order and confusable-separated novel/review packet plan.
- `curriculum/lesson.ts` — stable public lesson exports and acquisition-policy rationale.
- `curriculum/lesson/` — internal modules behind the lesson public surface.
- `curriculum/lesson/support.ts` — lesson value types, support ladder transitions and constants.
- `curriculum/lesson/packets.ts` — topic roster identity, cached packets and acquisition position.
- `curriculum/lesson/construction.ts` — review roster selection, course debt and fresh lesson runs.
- `curriculum/lesson/engine.ts` — introductions, retrieval ordering, feedback and check alternatives.
- `curriculum/lesson/persistence.ts` — support deltas, immutable topic updates and removed-item pruning.
- `curriculum/lessonPriority.ts` — explicit retrieval-need weights and stable priority ordering.
- `curriculum/lessonPath.ts` — lesson path states and replay run construction.
- `curriculum/lessonSitting.ts` — finite sitting budget, retrieval bookkeeping and topic updates.
- `curriculum/lessonSittingStorage.ts` — reads and clears the retired local-storage sitting sidecar for migration.
- `curriculum/review.ts` — sitting-based formative history, later confirmation, repair debt and listening coverage.
- `curriculum/listening.ts` — listening slots, target selection and formative listening answers.
- `curriculum/checkpoints.ts` — curated word checkpoints, eligibility and checkpoint run transitions.
- `fluency/` — formative post-acquisition recognition, copying, sending and free play.
- `fluency/timing.ts` — fixed character speed and effective-speed rungs.
- `fluency/progress.ts` — latency and stability records, rung progress, validation and practice need.
- `fluency/corpus.ts` — authored word pools, seeded selection and random letter groups.
- `fluency/sentences.ts` — template-generated phrases, sentences, numbers and mixed material.
- `fluency/session.ts` — seeded sprint, ladder, word and group runs and their outcomes.
- `fluency/copy.ts` — listening-to-text material levels, judgements and best scores.
- `fluency/send.ts` — guided sending stages, prompts and formative scores.
- `fluency/freePlay.ts` — untargeted keyed tokens, text decoding and playable typed text.
- `fluency/focus.ts` — combines course debt and missed Test targets into a practice focus set.
- `completionEvidence.test.ts` — protects the boundary between formative progress and completion evidence.
- `consolidation.test.ts` — verifies later-sitting confirmation and after-course repair obligations.
- `listeningBalance.test.ts` — verifies cumulative listening coverage across the programme.
- `novelBudget.test.ts` — verifies the per-sitting novel-letter budget and cumulative review.
- `placementHardening.test.ts` — verifies placement edge cases and durable-state boundaries.
- `programmeSimulation.test.ts` — simulates whole-course progress and review distribution.
- `audio.test.ts` — audio playback, cancellation and lifecycle checks.
- `code.test.ts` — canonical patterns, decoding and schedule checks.
- `correction.test.ts` — unambiguous correction checks.
- `mnemonics.test.ts` — visual mnemonic grammar checks.
- `placement.test.ts` — placement run and topic application checks.
- `practice.test.ts` — practice history and scheduling checks.
- `verbalMnemonics.test.ts` — phrase rhythm and canonical-pattern checks.

Dependencies point from consumers to foundations: `audio`, mnemonic grammars,
practice and response use `code`; `testing` builds on code, mnemonics and the
shared study cue ladder. Curriculum uses those foundations, topic types and
formative `progress`; packet ordering uses shared study confusion rules.
Within `lesson/`, construction uses packets and support, the engine uses
support, and persistence uses the run type; none imports the public barrel.
Placement composes curriculum with shared study scheduling. Fluency builds on
code, its own timing/progress/material modules and, through `focus`, curriculum
debt and shared study practice targets. Curriculum does not depend on fluency.
Scored retention and completion authority remain in `domain/study`; formative
lesson and fluency records do not supply scored evidence.

Contract: [Lesson policy](../../../docs/open/MORSE_LESSON.md)

Contract: [Character order](../../../docs/open/MORSE_CHARACTER_ORDER.md)

Contract: [Cue ladder](../../../docs/open/MORSE_CUE_LADDER.md)

Contract: [Mnemonic grammar](../../../docs/open/MORSE_MNEMONIC_GRAMMAR.md)

Contract: [Verbal mnemonics](../../../docs/open/MORSE_VERBAL_MNEMONICS.md)

Contract: [Audio runtime](../../../docs/open/MORSE_AUDIO_RUNTIME.md)

Contract: [Word checkpoints](../../../docs/open/MORSE_WORD_CHECKPOINTS.md)

Contract: [Fluency](../../../docs/open/MORSE_FLUENCY.md)

Contract: [Intermediate path](../../../docs/open/MORSE_INTERMEDIATE_PATH.md)

Contract: [Programme plan](../../../docs/open/MORSE_PROGRAMME_PLAN.md)
