# Issue #105 — Morse adaptive placement assessment

**Status:** implemented on PR #107; automated acceptance in progress  
**Date:** 2026-09-17  
**Issue:** #105  
**Parent:** #21  
**PR:** #107

## Product decision

Argus adds a bounded placement check for a learner who already knows some Morse or is returning after progress loss.

It answers one question:

> **Where should this learner enter the existing 13-lesson A–Z acquisition programme?**

It does **not** answer whether the learner has completed the formal Morse competency. The existing scored boundary remains:

> Can independently recall all A–Z printed Morse mappings in both directions.

Placement can establish that teaching support is no longer required for a contiguous prerequisite portion of the curriculum. It cannot create Test evidence, retention success, auditory competence, sending competence or WPM evidence.

The curriculum remains locked and sequential.

---

## Ratified owner decisions

### Experience choice

At the deliberate first-start boundary, offer exactly:

- **New to Morse**
- **Know some Morse**
- **Know most Morse**

The self-report only chooses the placement strategy. It never grants progress.

`New to Morse` skips the diagnostic and launches the ordinary first lesson.

### Uneven knowledge

Placement uses the **earliest demonstrated weakness**.

Knowing later letters does not bypass an earlier gap. Persisted placement is always a contiguous prefix of the canonical lesson sequence.

### Strictness

Placement is balanced:

- one miss means **uncertain**, not failed;
- the item returns after intervening prompts;
- one later correct response can clear that isolated miss;
- a repeated miss makes the weakness persistent for this assessment;
- later correct appearances cannot erase a mapping that already failed its bounded confirmation.

### Placed-out lessons

For V1, placed-out prerequisite lessons appear **Completed** and routing continues from the first required lesson.

The learner did not literally perform those ordinary lesson sittings. V1 therefore does **not** fabricate `lessonSitting` or `morseReview` history.

The owner explicitly chose the simple V1 presentation. A later UI may distinguish “completed through lessons” from “placed out”, but that is not part of #105.

### Result override

There is no upward override and no free lesson picker. The placement result determines the course entry point.

---

## Final V1 architecture

The implementation intentionally uses existing Argus learner-state authorities rather than adding a placement-specific persistence model.

### Curriculum authority

All lesson boundaries come from the existing canonical Morse curriculum:

- `lessonPackets()` defines the 13 lessons and character order;
- `morseLessonPath()` derives completed/current/locked presentation;
- the placement policy derives each lesson's novel pair from those same packets;
- existing checkpoint definitions provide mechanically eligible word material.

No alphabet order or second lesson map is copied into placement state.

### Durable state after placement

A completed placement updates only existing acquisition fields:

- `Topic.lessonProgress` — verified prerequisite items are set to `settled`;
- normal `unstarted -> learning` enrollment occurs through `resolveStudy()`;
- when all 13 lessons are placed out, the existing permanent `Topic.acquisitionReadyAt` anchor is set.

Placement does **not** add a new `morsePlacement` field in V1.

This is deliberate. A provenance field was considered during scoping, but the current owner decision is simply to treat placed-out lessons as complete for V1. Adding a new canonical field solely for a distinction the product does not yet surface would increase parser/reconciliation/sync complexity without changing current behavior.

If a future feature needs to distinguish lesson attendance from placement provenance, scope that as a separate migration with a concrete consumer.

### State placement never writes

Placement cannot write or fabricate:

- `Topic.itemEvidence`;
- `DirectionEvidence` or `unassistedCorrect`;
- Test attempts/history;
- `drilledAt`, `completedAt`, `lastTestedAt` or `spotCheckedAt`;
- ordinary `Topic.lessonSitting` progress;
- ordinary `Topic.morseReview` counters/history;
- listening evidence;
- sending timing or WPM state.

Because the result uses already-canonical `lessonProgress` and `acquisitionReadyAt`, the existing parser, export/import, catalog reconciliation and per-UID Firebase library sync carry the resulting state without a new storage path or sidecar.

---

## Entry and eligibility

Placement is offered only from a genuinely fresh Morse curriculum start.

`canOfferMorsePlacement()` requires:

- topic status is `unstarted`;
- no `acquisitionReadyAt`;
- no lesson progress;
- no active lesson sitting;
- no Morse review state;
- no Test history;
- no per-item Test attempts;
- a valid canonical 26-letter Morse acquisition profile.

Once meaningful progress exists, normal journey/resume behavior wins and the placement prompt is not re-offered.

Passive topic browsing remains read-only. The placement prompt appears only when the learner deliberately starts the current Morse lesson from the Topic page/curriculum path.

---

## Assessment stimulus

Placement uses uncued printed **letter -> Morse-pattern production** through the existing shared `MorseKeyInput`.

This directly measures the acquisition ability needed to skip teaching support while preserving the stronger formal Test boundary for later.

Placement does not require:

- sound-to-letter listening;
- pattern-to-letter formal direction coverage;
- WPM or physical sending quality;
- sentences, phrases or continuous material;
- #29 advanced Morse scope.

The runner reuses the #87 keyed-response lifecycle so final-element audio, feedback dwell, input gating and transition safety stay consistent with normal Morse work.

A miss receives restrained feedback and no answer-bearing mnemonic/reteach content. Normal teaching resumes only after the learner enters the resulting lesson.

---

## `Know some Morse` policy

`Some` is a forward-biased boundary search.

1. Traverse canonical lessons in order.
2. Ask both novel letters for each lesson.
3. A first miss schedules one later confirmation after up to two intervening prompts.
4. A correct confirmation clears an isolated miss.
5. A second miss fixes that character as failed and ends the `Some` assessment at the earliest affected lesson.
6. At Lessons 4, 7, 10 and 13, reuse the first mechanically valid word from the existing checkpoint as integrated sequence confirmation.
7. Word letters participate in the same uncertainty/confirmation rule; a word slip does not automatically reset an entire block.

Perfect `Some` currently contains **42 prompts before any error-triggered rechecks**:

- 26 isolated letters;
- `TIME` after Lesson 4;
- `TRAIN` after Lesson 7;
- `FLOW` after Lesson 10;
- `BOX` after Lesson 13.

An early persistent gap ends much sooner. For example, a repeated weakness on the first mapping resolves after four prompts: first miss, two intervening prompts, confirmation miss.

---

## `Know most Morse` policy

`Most` is intentionally different and shorter for an experienced learner.

1. First ask one character from every canonical lesson — a 13-lesson broad sweep.
2. Then ask the partner character from every lesson.
3. A first miss receives the same spaced one-time confirmation.
4. Repeated failure is sticky for the remainder of the assessment; later appearances cannot compensate for it.
5. End with `QUIZ`, the final existing checkpoint word, as integrated confirmation.
6. Resolve placement by scanning lessons from the beginning for the earliest character that did not finish `pass`.

Perfect `Most` is **30 prompts**:

- 26 isolated A–Z mappings;
- four letters in `QUIZ`.

One isolated noisy miss adds one confirmation prompt. Later strong answers can characterize the learner but never leapfrog an earlier failed lesson.

---

## Result semantics

A result is one of:

- `Start at Lesson 1`;
- `Start at Lesson N` after placing out Lessons 1 through N-1;
- `Alphabet lessons complete` after placing out all 13 lessons.

The result object records only ephemeral calculation data:

- `throughLesson`;
- `nextLesson`;
- verified prefix letters;
- prompt count;
- retry count;
- word-confirmation count.

The assessment run itself is component/local state. It is not durable.

### Atomic commit

No learner progress is written while the diagnostic is running.

Only when a final result exists does `TopicPage` perform one functional `updateTopic()` using `applyMorsePlacement()`.

If the learner:

- closes the assessment;
- uses browser/Android Back;
- reloads;
- closes the PWA;
- otherwise leaves before the result;

then no partial lesson progress is committed. V1 restarts placement from the beginning on re-entry.

---

## Journey after placement

### Partial placement

Example result:

> **Start at Lesson 5**
>
> Lessons 1–4 are now marked complete from this check.

The settled prefix causes the existing lesson-path derivation to make Lesson 5 current. Starting it uses the ordinary `LessonRun` and normal acquisition machinery.

### No placed-out prefix

> **Start at Lesson 1**
>
> The check found an early gap, so Argus will start with the first lesson.

This is placement, not a failed exam; no score or failure record is persisted.

### Full A–Z placement

> **Alphabet lessons complete**

All 26 acquisition items are settled and `acquisitionReadyAt` is stamped at placement completion. The shared learner journey then owns the next action.

The formal A–Z Test still starts with zero newly fabricated placement evidence and the normal retention contract still applies.

---

## Edge cases covered by policy

- **New learner:** chooses `New`; no diagnostic work is written.
- **Early partial knowledge:** `Some` stops at the first repeated weak mapping.
- **Nearly complete learner:** `Most` surveys the whole programme efficiently.
- **Later knowledge with early gap:** early gap controls placement regardless of later successes.
- **One accidental/motor miss:** later confirmation may clear it.
- **Repeated early miss:** early lesson remains required.
- **Repeated late miss:** late lesson remains required even if the same letter is later answered correctly inside `QUIZ`.
- **Word slip:** implicated letter gets normal uncertainty/confirmation treatment; one slip does not reset a block.
- **No audio output:** the categorical Morse key remains functional; placement makes no listening claim.
- **Assessment abandonment/reload:** no partial commit.
- **Existing learner progress:** placement is not offered and cannot regress it.
- **Full placement:** acquisition readiness may be reached, but formal Test/retention remains untouched.

---

## Code surfaces

PR #107 is deliberately narrow.

### New

- `src/lib/morsePlacement.ts`
  - pure deterministic policy;
  - fresh-start eligibility;
  - atomic result application.
- `src/lib/morsePlacement.test.ts`
  - policy, noise, uneven-knowledge and evidence-safety coverage.
- `src/features/learn/MorsePlacementDialog.tsx`
  - experience choice, diagnostic runner and result surface.
- `src/features/learn/MorsePlacement.css`
  - mobile-first placement treatment.
- `src/features/library/TopicPage.morsePlacement.test.tsx`
  - fresh-start integration and abandonment safety.

### Modified

- `src/features/library/TopicPage.tsx`
  - placement intercept at the fresh deliberate Morse start boundary;
  - atomic result commit;
  - normal lesson launch afterward.

No schema/parser/Firebase/scheduler/Test module is changed.

---

## Automated acceptance matrix

### Pure policy

- [x] curriculum derives from current canonical packets;
- [x] `Some` and `Most` use different deterministic strategies;
- [x] first miss creates uncertainty;
- [x] confirmation occurs after intervening prompts;
- [x] one recovered miss can continue placement;
- [x] repeated early weakness fixes the earliest boundary;
- [x] strong later performance cannot compensate for an early repeated weakness;
- [x] repeated late weakness remains failed even if the letter appears correctly later in a word;
- [x] perfect `Most` places through all 13 lessons;
- [x] prompt/retry counts are measurable and bounded by the deterministic run.

### Progress/evidence safety

- [x] partial result settles only the contiguous prerequisite prefix;
- [x] placement deliberately enrolls the topic as `learning`;
- [x] partial placement does not set `acquisitionReadyAt`;
- [x] full placement settles all 26 and sets `acquisitionReadyAt`;
- [x] `itemEvidence` is unchanged;
- [x] no Test history is created;
- [x] no `drilledAt` or `completedAt` is created;
- [x] no `lastTestedAt` is created;
- [x] placement is no longer offered after learner progress exists.

### UI integration

- [x] fresh Morse start exposes `New / Some / Most`;
- [x] `New` launches the canonical lesson run directly;
- [x] `Some` enters the placement runner;
- [x] closing before a result leaves stored learner progress untouched;
- [x] existing meaningful progress bypasses placement and launches the normal lesson.

### Repository gate

- [ ] unit suite green on final PR head;
- [ ] TypeScript/production build green on final PR head;
- [ ] browser suite green on final PR head;
- [ ] Firestore rules suite green on final PR head.

The first PR gate found one narrow TypeScript inference issue in the checkpoint lookup; unit tests themselves were green. That typing defect was corrected on the branch. Final gate results should be recorded here or in the PR before merge.

---

## Manual acceptance remaining

Before closing #105, verify the exact deployed/preview flow on Pixel/PWA:

- fresh Morse -> start lesson -> three experience choices;
- `New` enters Lesson 1 normally;
- `Some` and `Most` key comfortably with the existing Morse control;
- one miss returns after intervening material rather than immediately;
- Android Back/close during placement writes nothing;
- partial result shows the correct next lesson and the path marks the prerequisite prefix completed;
- full result leaves the formal Test/retention requirement intact;
- narrow portrait and 200% text remain usable.

This is product/device acceptance, not a reason to introduce a second progress model.

---

## Non-goals

#105 does not add:

- a free lesson picker;
- arbitrary unlocks;
- alphabetic alternate curriculum;
- a placement score/rank/badge;
- a new top-level mode;
- self-reported mastery grants;
- formal auditory reception;
- WPM/sending-quality assessment;
- numerals, punctuation or prosigns;
- sentences/continuous copy;
- #29 advanced Morse;
- a new retention algorithm;
- an accordion/mastery redesign;
- a new Firebase progress model;
- durable raw diagnostic transcripts.

---

## Definition of done

#105 is engineering-complete when:

1. fresh deliberate Morse start offers exactly `New / Some / Most`;
2. `Some` and `Most` are genuinely different bounded policies;
3. one noisy miss receives spaced confirmation;
4. the earliest persistent weakness determines placement;
5. placed-out lessons become a contiguous completed prerequisite prefix;
6. no formal Test/retention/auditory/sending evidence is fabricated;
7. abandonment before a final result writes nothing;
8. existing learner progress is never downgraded;
9. full placement integrates with the existing readiness/journey architecture;
10. the full automated repository gate is green.

Issue close additionally requires the exact production/Pixel acceptance noted above.