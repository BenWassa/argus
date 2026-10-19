# Learning progress

**Status:** maintained contract, implemented on `feat/ui-overhaul`; release and owner Pixel sign-off pending.
**Authority:** owner decision, 2026-10-19. Supersedes every decay/repair rule in the [previous progress architecture](../closed/PROGRESS_ARCHITECTURE_2026_10_19.md), earlier design documents and historical issue plans.

## One learning path

A topic is not started, in progress, or learned. Learning works toward its finite boundary. Once learned, it stays learned. There is no decay, repair state, expiry, mandatory refresher or return to learning after completion.

Home lists at most three unfinished topics. Its single yellow action continues the first topic's canonical next action: the current Morse lesson or an ordinary topic's Test. When no topic is in progress, the action is Add something to learn. Library and topic plates remain available for browsing.

## Completion

Only a qualifying full Test completes a topic. An ordinary topic needs one clean Test. Morse keeps its existing acquisition and independent printed bidirectional evidence boundary; lessons and formative modes do not fabricate Test evidence. No new proof requirement is added.

`completedAt` is permanent. A later optional Test keeps its actual score, answers and missed ids in history, but cannot demote the topic, reduce its completed progress reading, put it back on Home, revoke a role, or create a required Practice run. Its result says Learned and offers Done. Further practice, replay and Tests are voluntary.

An unfinished topic may use its latest Test's misses to offer a short formative Practice run. This is help while learning, not a new repair state. Practice records no formal evidence and does not complete a topic.

Progress uses the finite quantity the topic actually records: Morse's learned letter count, item evidence where available, or a Test score. These records are not averaged into a fabricated mastery score. A completed topic reads as its full finite boundary even after a later miss.

## Existing records

The v5 format stays portable. `decayed` and `drilled` remain accepted legacy values, including in historical attempts. They never represent a new live state.

- A topic with `completedAt` loads as `completed`, including old records moved back to `learning` after a failed repair Test.
- Old `decayed` records read as learned. Without a completion timestamp they retain the existing legacy `drilled` normalization rather than inventing a completion date during a read.
- Parsing preserves attempts, scores, missed ids, evidence and original completion dates. It does not create success events or rewrite historical outcomes.
- Applying a Test that started before another write completed the topic must preserve that completion.

## Internal boundaries

`scheduling.ts` owns completion transitions; `journeyFor` derives the shared next action. Its historical internal phase name `banked` means learned and never a separate user-facing state. Internal acquisition, evidence and sitting records remain distinct implementation details, with one simple progression on screen.

Morse lesson scaffolding, finite sittings, adaptive Key/Listen/Read practice and open safe levels remain available. Formative modes write only their own stores; Test writes formal scored evidence. Nothing uses elapsed time to schedule work. Export, import and sync preserve the existing learning record and conflict policy.

## Verification

Regression coverage includes repeated misses after completion, old repair imports and export round-trips, concurrent completion, consistent Home/Library/Topic readings, no current required Test on a completed Morse course, and Home Continue entering the canonical next task. Full unit, production build, browser and CI gates apply before merge.
