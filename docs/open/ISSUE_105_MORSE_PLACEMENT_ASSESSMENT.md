# Issue #105 — Morse adaptive placement assessment

**Status:** Implemented; maintained product and implementation contract

**Authority:** Current for the shipped Morse placement behavior; later ratified product decisions supersede this document

**Last verified:** 2026-09-17

**Issue:** #105

**Parent:** #21

**Original PR:** #107

## Product decision

Argus provides a bounded placement check for a learner who already knows some
Morse or is returning after progress loss. It answers one question:

> Where should this learner enter the existing 13-lesson A–Z acquisition
> programme?

It does not establish the formal Morse competency. The scored boundary remains
independent recall of all A–Z printed Morse mappings in both directions.
Placement may establish that teaching support is no longer required for a
contiguous prerequisite portion of the curriculum. It cannot create Test
evidence, retention success, auditory competence, sending competence, or WPM
evidence.

The curriculum remains locked and sequential.

## Entry and experience choice

At a deliberate first start, Argus offers exactly:

- **New to Morse**
- **Know some Morse**
- **Know most Morse**

The self-report selects a strategy; it never grants progress. `New to Morse`
skips the diagnostic and launches the ordinary first lesson.

Placement is offered only for a genuinely fresh, valid 26-letter Morse topic.
`canOfferMorsePlacement()` requires an unstarted topic with no acquisition
readiness, lesson progress, active lesson sitting, Morse review state, Test
history, or per-item Test attempts. Once meaningful progress exists, normal
resume behavior wins and the prompt is not offered again.

Passive browsing is read-only. The prompt appears only when the learner starts
the current Morse lesson from the Topic page.

## Placement policy

Placement uses uncued printed **letter → Morse-pattern production** through the
shared Morse key. One miss makes an item uncertain and schedules one later
confirmation after two intervening prompts. A correct confirmation clears that
isolated miss; a repeated miss is a sticky failure for the rest of the run.

The earliest demonstrated weakness controls placement. Later knowledge cannot
bypass an earlier gap, so the durable result is always a contiguous prefix of
the canonical lesson sequence.

### Know some Morse

`Some` performs a forward-biased boundary search:

1. Visit canonical lessons in order and ask both novel letters.
2. At Lessons 4, 7, 10, and 13, use the first mechanically eligible checkpoint
   word as integrated sequence confirmation.
3. Apply the same uncertainty and confirmation rule to letters encountered in
   words.
4. Stop once a repeated miss fixes the earliest required lesson.

A perfect run contains 42 prompts before any miss-triggered rechecks: 26
isolated letters plus `TIME`, `TRAIN`, `FLOW`, and `BOX`.

### Know most Morse

`Most` is shorter for an experienced learner:

1. Ask one character from each canonical lesson.
2. Ask the partner character from each lesson.
3. Apply the same spaced confirmation and sticky repeated-failure rules.
4. End with the final eligible checkpoint word, `QUIZ`.
5. Scan from the beginning for the earliest letter that did not finish in a
   passing state.

A perfect run contains 30 prompts: 26 isolated mappings and the four letters in
`QUIZ`.

## Curriculum and persistence authority

Placement derives its lesson boundaries and integrated word material from the
existing curriculum:

- `lessonPackets()` defines the 13 lessons and character order;
- `morseLessonPath()` derives completed, current, and locked presentation;
- the placement policy derives each lesson's novel pair from those packets;
- the existing checkpoint definitions provide eligible word material.

No second alphabet order or lesson map is persisted.

When a run completes, `TopicPage` makes one functional topic update through
`applyMorsePlacement()`. The update uses existing learner-state authorities:

- verified prerequisite items become `settled` in `Topic.lessonProgress`;
- ordinary `unstarted → learning` enrollment occurs through `resolveStudy()`;
- placing out all 13 lessons sets the existing permanent
  `Topic.acquisitionReadyAt` anchor.

There is no placement-specific durable field or raw diagnostic transcript.
Existing parsing, export/import, catalog reconciliation, and per-UID Firebase
library sync carry the resulting canonical topic state.

Placement never writes or fabricates:

- `Topic.itemEvidence` or directional unassisted evidence;
- Test attempts or history;
- `drilledAt`, `completedAt`, `lastTestedAt`, or `spotCheckedAt`;
- ordinary lesson-sitting or Morse-review history;
- listening evidence;
- sending timing or WPM state.

The run itself is local component state. Closing, navigating back, reloading, or
leaving before a final result writes no partial progress. Re-entry starts a new
placement run.

## Result semantics

A result is one of:

- **Start at Lesson 1**;
- **Start at Lesson N**, after placing out Lessons 1 through N−1;
- **Alphabet lessons complete**, after placing out all 13 lessons.

The ephemeral result records the settled-through lesson, next lesson, verified
prefix letters, prompt count, retry count, and word-confirmation count.

Placed-out prerequisite lessons appear completed and routing continues from the
first required lesson. V1 deliberately does not distinguish placement
provenance in the UI or fabricate ordinary lesson sittings. A future product
need for that distinction requires a separately scoped migration and consumer.

There is no upward override or free lesson picker. The placement result
determines the entry point.

## Implemented code surfaces

### Domain

- `src/domain/morse/placement.ts` — pure deterministic policy, fresh-start
  eligibility, bounded retries, result calculation, and atomic application.
- `src/domain/morse/placement.test.ts` — policy, noise, uneven-knowledge, and
  evidence-safety coverage.
- `src/domain/morse/placementHardening.test.ts` — adversarial and tail-retry
  hardening coverage.
- `src/domain/morse/curriculum/` — canonical lesson and checkpoint sources.

### Features

- `src/features/morse/MorsePlacementDialog.tsx` — experience choice,
  diagnostic runner, and result surface.
- `src/features/morse/MorsePlacement.css` — mobile-first placement styling.
- `src/features/morse/MorsePlacementDialog.test.tsx` — interaction contract.
- `src/features/library/TopicPage.tsx` — deliberate-start interception and
  atomic result commit.
- `src/features/library/TopicPage.morsePlacement.test.tsx` — fresh-start,
  normal-start, and abandonment integration coverage.
- `e2e/morsePlacement.spec.ts` — browser and viewport acceptance coverage.

The implementation follows the current repository layering: policy is under
`src/domain/morse/`, the placement UI is under `src/features/morse/`, and the
Library topic surface only integrates those public responsibilities. Placement
does not require a schema, parser, Firebase, scheduler, or Test-specific model.

## Automated acceptance

The integrated branch has verified:

- curriculum-derived `Some` and `Most` strategies;
- spaced confirmation after a first miss, including tail prompts;
- recovery from one noisy miss;
- sticky repeated failure and earliest-weakness placement;
- bounded prompt and retry accounting;
- contiguous prerequisite settlement only;
- acquisition enrollment and full-placement readiness behavior;
- preservation of Test, retention, and item-evidence state;
- fresh-start UI entry, `New` bypass, abandonment safety, and ordinary resume;
- phone, short-landscape, and desktop browser coverage.

At the last verification point, the repository unit/component suite, production
build, and browser suite were green. Firestore rules are unaffected by this
feature and remain part of the repository-wide release gate.

## Manual device acceptance

Before closing the issue or treating a production deployment as accepted,
verify on the target Pixel/PWA:

- fresh Morse → start lesson → all three experience choices;
- `New` enters Lesson 1 normally;
- `Some` and `Most` are comfortable with the existing Morse control;
- one miss returns after intervening material;
- Android Back or close during placement writes nothing;
- partial placement shows the correct next lesson and completed prefix;
- full placement leaves formal Test and retention requirements intact;
- narrow portrait and 200% text remain usable.

This is device/product acceptance, not grounds for a second progress model.

## Non-goals

Issue #105 does not add a free lesson picker, arbitrary unlocks, an alternate
alphabetic curriculum, placement score or badge, self-reported mastery,
auditory reception, WPM assessment, advanced Morse scope, a new retention
algorithm, a new Firebase progress model, or durable diagnostic transcripts.

## Definition of done

Engineering is complete when the three experience choices appear only at the
fresh deliberate start; `Some` and `Most` remain genuinely different bounded
policies; misses receive spaced confirmation; earliest persistent weakness
controls a contiguous prefix; no scored or retention evidence is fabricated;
abandonment is atomic; existing progress cannot regress; full placement enters
the ordinary readiness journey; and the automated repository gate is green.

Issue closure additionally requires the production/Pixel acceptance above.
