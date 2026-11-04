# #296 — Stage bookmark compatibility and owner design gate

**Status:** active parser-first contract; no production cursor writer.

**Scope:** implementation slice for the shared learning contract; no production UI changes. Coordinate app-wide teaching and assessment directions with #320 and #321–#326. The Radio Procedure / Signal Flags authored drafts (#304) remain gated on independent review. Do not couple this work to #113's IndexedDB provider or sync code.

## Current state on main (2026-11-03)

- The ordinary-topic stage schema and validator, full-screen stage runner, generated fallback lessons, five hand-authored curricula, lesson completion receipts and optional Test are already shipped on main. Morse keeps its own engine.
- `Topic.stageProgress` holds completed stage IDs and dates; it is preserved across parse/export/import. `withStageCompleted` never writes Test results.
- **Gap:** an unfinished StageRunner stores its step/card index in React memory only. Reload returns to the beginning. Generated stage IDs are positional, so reusing a tick after a topic's item bank materially changes needs deliberate migration rules; do not silently call a newly revised stage completed just because its index matches.
- The earlier #296 design notes record owner approval for the existing direction. New visuals and expanded topics must follow the #320 mobile approval gate.

## Parser-first contract in this PR

`Topic.lessonCursor` is **optional**, format **version 1**, and strictly validated by `parseLessonCursor` at the v5 import boundary. Unknown versions, corrupt IDs, invalid card indexes, unrecognized keys or malformed revision keys fail cursor validation and are omitted from the parsed topic. The library still opens and the lesson resumes at its first step; all other topic fields retain their existing validation.

| Field | Meaning |
| --- | --- |
| `version: 1` | Reader/writer compatibility and explicit future migration |
| `stageId` / `stepId` | Stable authored destinations, not array indexes |
| `cardIndex` | Next unfinished card of a checkpoint; no answer grade or transcript stored |
| `stageKey` | Deterministic, non-security hash over the stage definition; invalidates a bookmark after any change |

The pure helpers `withLessonCursor` and `lessonResumePoint` encode the safe resume invariant: a cursor is a **navigation bookmark**, not a pass, attempt, score, item evidence or proof of assistance-free recall. When a stage changes or a target step is removed, resume starts at the beginning of that stage without rewriting or clearing any completed-stage receipts. Completion of that same stage clears its bookmark, not another stage's concurrent bookmark. No credential or date is fabricated.

**Sequencing constraint:** parser support must be deployed and supported by all writers before beginning to persist `lessonCursor`. Old builds that reconstruct Topic without the field can otherwise lose it. This PR intentionally ships only the reader/data contract; the first live cursor write is a separate, release-gated follow-up. This keeps the current UI and #113's storage authority untouched.

## Staggered rollout and old clients

A build without this parser strips the field on save, and sync can push that loss to other devices. The only consequence is that the lesson restarts at its first step: stage receipts, `completedAt` and Test evidence are separate fields and remain intact. An export from an old build has no cursor and imports cleanly. A newer cursor version is ignored by this build rather than blocking the library or topic import.

No writer may ship until this parser has been on every installed client for one release.

## Remaining explicit handoff

1. **UI approval:** review the five 390px screenshots with current Signal-on-Slate tokens. They are a proposal, not confirmation that visual-asset reviews have passed; radio/flags content stays behind #150/#148.
2. **Writer integration after parser rollout:** the StageRunner records the **next safe step** via `updateTopic(topicId, current => withLessonCursor(current, liveStage, nextStepId))`, awaiting UID-scoped durable completion before advancing. For checkpoints, persist the next unfinished card, not the answered card. Recheck stage ID and revision against the latest topic before writing. Restore with `lessonResumePoint` on entry. If durable write fails, keep the current interaction and offer retry.
3. **Stability of edited user topics:** because existing `lesson-N` ticks lack content revisions, retain their historic completion and do **not** reinterpret them as proof of newly added items. Specify an opt-in, non-destructive authoring migration for in-progress generated lessons; do not invalidate already-Learned topics or manipulate role awards. Prefer revising the curriculum version over resetting old completions.
4. **Acceptance:** build/CI, browser reload and back/forward, offline airplane-mode kill/relaunch, account switching, import/export and Pixel 390px/320px/200%-text checks. No staged lesson responses should touch history or formal Test evidence.

## No changes in this PR

No Firebase/IndexedDB writes, sync changes, generated lesson content, Morse, UI routing, Test item boundaries, history, roles or learning completion semantics. This PR must not merge merely because CI passes; release and owner design/QA gates remain.
