# Learning progress

> **Ordinary-topic authority update, owner decision 2026-10-29 (#296):** [The lesson contract](ISSUE_296_LEARNING_REDESIGN.md) supersedes ordinary-topic answer-list landing, Learn/Practice/Test tray, Continue-to-Test and standalone Practice descriptions below. Every non-Morse topic with items has short lessons generated from its scored content, unless an authored curriculum overrides them. Finish every lesson or a clean eligible Final Test to complete permanently. Reference retains the entire reading and item bank, with no bottom navigation. Test misses offer the lesson containing the first missed item. Historical Practice routes replace in place with their topic (missing topic → Library), without learner writes. Morse, letter practice, fluency, Test evidence and compatibility rules retain their existing authority.


**Status:** maintained contract, implemented on `feat/ui-overhaul`; release and owner Pixel sign-off pending.
**Authority:** owner decision, 2026-10-22 (#276), superseding the Test-only curriculum rule from 2026-10-19. Supersedes every decay/repair rule in the [previous progress architecture](../closed/PROGRESS_ARCHITECTURE_2026_10_19.md), earlier design documents and historical issue plans.

## One learning path

A topic is not started, in progress, or learned. Learning works toward its finite boundary. Once learned, it stays learned. There is no decay, repair state, expiry, mandatory refresher or return to learning after completion.

Home lists at most three unfinished topics. Its single yellow action continues the first topic's canonical next action: the current Morse lesson or an ordinary topic's Test. When no topic is in progress, the action is Add something to learn. Library and topic plates remain available for browsing.

## Completion

**A lesson-based topic is Learned permanently after each required lesson is completed once.** The final lesson grants completion with no compulsory repeat, later-sitting consolidation or Test. Formal Test stays optional and stores only real scored attempts; lesson answers cannot fabricate formal Test evidence. Ordinary topics without lessons still require one clean Test.

`completedAt` is permanent. A later optional Test keeps its actual score, answers and missed ids in history, but cannot demote the topic, reduce its completed progress reading, put it back on Home, revoke a role, or create a required Practice run. Its result says Learned and offers Done. Further practice, replay and Tests are voluntary.

An unfinished topic may use its latest Test's misses to offer a short formative Practice run. This is help while learning, not a new repair state. Practice records no formal evidence and does not complete a topic.

Progress uses the finite quantity the topic actually records: Morse's learned letter count, item evidence where available, or a Test score. These records are not averaged into a fabricated mastery score. A completed topic reads as its full finite boundary even after a later miss.

## Existing records

The v5 format stays portable. `decayed` and `drilled` remain accepted legacy values, including in historical attempts. They never represent a new live state.

- A topic with `completedAt` loads as `completed`, including old records moved back to `learning` after a failed repair Test.
- A legacy Morse record with `acquisitionReadyAt` or all required packets already settled is read as Learned even if the stored status was `learning` and no Test occurred. The next real lesson-state write stamps a durable completion date; old dates, attempts and evidence remain untouched.
- Old `decayed` records read as learned. Without a completion timestamp they retain the existing legacy `drilled` normalization rather than inventing a completion date during a read.
- Parsing preserves attempts, scores, missed ids, evidence and original completion dates. It does not create success events or rewrite historical outcomes.
- Applying a Test that started before another write completed the topic must preserve that completion.

## Internal boundaries

`scheduling.ts` owns Test transitions and the shared Learned projection; `withAcquisitionReadiness` completes a curriculum in the same functional write as the final lesson. `journeyFor` derives the shared next action. Its historical internal phase name `banked` means learned and never a separate user-facing state. Internal acquisition, evidence and sitting records remain distinct implementation details, with one simple progression on screen.

Morse lesson scaffolding, finite sittings, adaptive Key/Listen/Read practice and open safe levels remain available. Formative modes write only their own stores; Test writes formal scored evidence. Nothing uses elapsed time to schedule work. Export, import and sync preserve the existing learning record and conflict policy.

## Verification

Regression coverage includes repeated misses after completion, old repair imports and export round-trips, concurrent completion, consistent Home/Library/Topic readings, no current required Test on a completed Morse course, and Home Continue entering the canonical next task. Full unit, production build, browser and CI gates apply before merge.
