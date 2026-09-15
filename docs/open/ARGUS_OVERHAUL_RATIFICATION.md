# Argus learning-experience overhaul — ratification package (#92)

> **Closeout addendum — 2026-09-15.** This block supersedes stale implementation-status statements later in this document; the original synthesis is retained below for decision history. Batch 6 has now substantially landed on `main`, and the #90/#92 closeout completes its remaining checkpoint arc. Current implementation/tests are authoritative.
>
> **#90 current matrix:** (1) state boundaries preserved; (2) item-aware review shipped; (3) at most two novel characters per 10-retrieval sitting with remaining budget cumulative review shipped; (4) later-sitting printed success before new-learner readiness shipped with legacy/previously-ready compatibility; (5) need-balanced listening shipped and formative-only; (6–7) Learn→Test independent handoff/bidirectional distribution shipped in batch 4; (8) explicit non-qualifying scheduler handling is already shipped via `advancementEligible: false` and does not reset retention clocks; (9) checkpoints now span Lessons **4, 7, 10 and 13**, include late-acquired material, one bounded local retry after intervening targets where practical, and a local-only summary.
>
> `Topic.morseReview` is the one additive batch-6 review field. It round-trips through the v5 storage/export boundary; absent review state remains valid legacy data. Whole-programme simulations cover visual-only and audio-enabled learners, early/late repeated misses, listening suppression, bounded completion, no late-letter starvation and balanced listening coverage.
>
> **Closeability:** once the closeout PR is green and merged, #90 has no remaining deterministic engineering requirement. #42 remains the separate real-Pixel acceptance track. #92 should remain open only for these owner decisions: **(1)** Morse alphabet link vs embedded 26-card reference; **(2)** ordinary-topic exposure semantics; **(3)** targeted-practice surface/naming; **(4)** spacing copy / same-day continuation presentation. Do not treat any other historical checklist item below as a new #92 gate.

> **Authority status — the #92 synthesis pass.** This is the "one coherent
> package" #92's definition of done asks for. It does not repeat research
> already written; it states what is now true, reconciles the two proposal
> documents, and lists exactly what still needs an owner decision. Full detail
> lives in `docs/open/LEARNING_EXPERIENCE_DESIGN_DECISION.md` (authoritative) and
> `docs/closed/SCREEN_INVENTORY_REVIEW.md` (superseded, kept for research history).

## What is already true

Batches 0–4 of `docs/open/LEARNING_EXPERIENCE_DESIGN_DECISION.md` are merged to
`main` and live in production (`v0.2.0`). Verified directly against shipped
source, not inferred from the design doc's own account:

- `src/features/progress/` is gone; `Progress.tsx` no longer exists.
- `src/features/learn/Learn.tsx` is gone; `MorsePath.tsx` and `LessonRun.tsx`
  exist in its place.
- `src/features/library/CompletionRecord.tsx` exists — the completion record
  moved to the foot of Library, exactly as recorded.
- `AppShell`'s nav array is exactly `[Today, Library]`; `View` still carries
  `'data'` for the route but it is not a nav tab.
- `PRODUCT.md` and `DESIGN.md` have themselves been rewritten to describe this
  state (`Learn` is no longer a user-facing name; navigation is "two
  destinations, Today and Library").
- 598 unit tests and 168 browser tests (4 skipped) pass; production build is
  clean, per the design doc's implementation record.

So the four questions #92 asks in order are answered, and answered in the shipped app, not on paper:

1. **App structure** — `Today` (the docket) and `Library` (browse/author/record), with `Data` as a route reached from the foot of Library. See `LEARNING_EXPERIENCE_DESIGN_DECISION.md` §3.
2. **Topic/course structure** — one topic shell, two bodies: an ordinary topic's body *is* its reference (briefing, if any, then the numbered set); a curriculum topic's (Morse's) body is its path. See §4–§5.
3. **Learning journey** — `Learn` and `Test` survive as internal semantics only; the learner reads `Read`, `Lesson N`, `Test`. See §6 (J1–J10) and §7.
4. **Evidence/state model** — unchanged. Acquisition, formal evidence, retention and current-sitting stay four separate fields, none of it touched by batches 0–4. See §7–§8, and `docs/open/PROGRESS_ARCHITECTURE.md` for the underlying contract.

## Reconciliation of the two proposal documents

| Where they conflicted | Resolution | Authority |
|---|---|---|
| `Home`/`Lessons` nav vs `Today`/`Library` | `Today`/`Library` shipped. `Home`/`Lessons` rejected — wrong for a reference library whose majority object has no lessons. | `LEARNING_EXPERIENCE_DESIGN_DECISION.md` §3, §14.1 |
| Badges / milestone-and-freshness state | Rejected outright — contradicts `PRODUCT.md`'s anti-gamification contract; `completedAt` already solves the stated problem. | §10, §14.2–3 |
| `First Messages` as a milestone of the printed topic | Rejected — #29 territory, or a separate topic with its own criterion. Never a stage of `international-morse-letters-printed`. | §12, §14.4 |
| Standalone Progress destination | Removed. Nothing lost: shelves already existed in Library, completion record moved to Library's foot. | §8, implementation record |
| Morse reference: embedded 26 cards (#76) vs a quiet link | Reversed to a quiet `Morse alphabet` link — the one decision that undoes a previously Pixel-validated call. **Flagged below for explicit owner review.** | §5, §15.3 |
| "Relocate Test's button = final assessment" | Rejected as insufficient on its own — Test started at supported cue rungs and word checkpoints saved no evidence. Fixed structurally by promoting #90 items 6–8 into batch 4 (shipped) rather than by moving a button. | §11 items 6–7, §13.10 |

`docs/closed/SCREEN_INVENTORY_REVIEW.md` is marked superseded accordingly; its
per-surface duplication analysis and its "what other learning apps
demonstrate" research remain useful and are preserved unedited.

## #90 reconciliation (current state)

| # | #90 requirement | Status now |
|---:|---|---|
| 1 | Preserve the four state boundaries | retained — a hard constraint, unaffected by anything here |
| 2, 3, 5, 9 | Item-aware selection; sitting-scope novel budget; listening balance; checkpoint-arc completion | **not yet shipped** — batch 6, lesson-scheduling policy |
| 4 | Consolidation stages after 7/10/13 | absorbed into the path design; **not yet visible** until batch 6 lands |
| 6, 7 | Remove duplicated cue acquisition after Learn; introduce both printed directions earlier | **shipped** — batch 4, `src/lib/learnToTestHandoff.test.ts` |
| 8 | Distinguish non-qualifying from failure | **partly shipped** — `withheldByAcquisition` copy exists; explicit scheduler outcome does not |

Batches 5 (targeted repair) and 6 (#90's own lesson-scheduling policy) are the
only work #90 still owns outright, and neither has landed. **#90 should stay
open** until both land, or be re-split along this exact seam per the design
doc's own recommendation — it should not be closed by this package.

## What still needs your decision

Three decisions were defaulted rather than ratified when batches 0–4 shipped.
Code currently reflects the recommended answer in each case; nothing further
builds on top of them until you've looked.

1. **§15.3 — Morse reference cards.** #76 put all 26 reference cards on the
   Morse topic page and you validated that on a Pixel. Batch 3 replaced it
   with a quiet `Morse alphabet` link so the curriculum path could be the
   page body instead. This is the one shipped change most worth a deliberate
   phone look, because it reverses a call you already made once.
2. **§15.1 — Exposure for an ordinary topic.** With the ordinary Learn route
   gone, opening a topic page now stamps `unstarted → learning` (closest to
   prior behavior). The alternative was stamping it only when the learner
   taps a "test me" action at the foot of the reference. Currently shipped as
   the former.
3. ~~**§15.5 — Is repair scored or formative?**~~ **Decided 2026-09-14:
   formative.** Repair practises, the next check proves, and the evidence
   contract stays untouched. Batch 5 is unblocked and may proceed on that
   basis. A repair run must not write formal `itemEvidence`, must not move
   the retention clock, and must not qualify a topic for completion.

Two smaller ones, lower stakes, already shipped as recommended and listed
here only for completeness: §15.2 (multi-topic Learn dropped, batch Test
kept) and the remaining §15.4/6–9 items, all scoped to batch 6 and not yet
live.

## Execution plan for what remains

| Batch | What | Depends on | Gate |
|---:|---|---|---|
| ~~5~~ | ~~Targeted repair~~ — **shipped 2026-09-14** as *practice*. See `docs/open/TARGETED_PRACTICE.md` | §15.5 — decided: formative | **owner phone review outstanding** |
| 6 | #90 lesson-scheduling policy (items 2, 3, 4, 5, 9) — the only additive migration in the whole programme | none (independent of 1–5 once batch 3 landed) | whole-programme simulation tests; owner review of spacing copy |

### Batch 5, as built

A bounded formative run over what a check just missed, offered from the check's
end screen and — while a miss still stands — from the topic page. It writes
nothing: no cue evidence, no attempt, no `lastTestedAt`, no completion. The
guarantee is structural (the module imports no write path, asserted by test)
rather than documentary.

Two things the paper did not anticipate, both settled in
`docs/open/TARGETED_PRACTICE.md` and both worth your eye:

1. **The word `repair` was already taken.** It ships as `JourneyPhase =
   'repair'`, shown to the learner as `Needs repair` on a *decayed* topic whose
   remedy is a full **scored** Test. Reusing it for an unscored partial run
   would have blurred exactly the boundary this batch protects, so the new
   surface is called **practice** and the decay label is untouched. Reversible,
   but the decay label needs renaming first if you want `Repair` here.
2. **Ordinary topics keep no per-item record.** Only progressive cue-ladder
   cards write `itemEvidence`; an ordinary reveal-and-grade check records a
   tally and nothing else. So the *topic-page* offer can only appear for Morse,
   and an ordinary topic's offer lives on its check's end screen, lasting as
   long as that screen. Closing that gap needs either a new durable field or
   ordinary Test answers writing into the store that gates completion — both
   outside batch 5's "no new durable state" boundary, and both deserving a
   deliberate decision rather than being absorbed.

Batch 6 is now the only implementation work left in this programme. #42's
real-device acceptance gate is unrelated and stays open on its own terms; #29 and #79 stay out of
scope entirely, per `LEARNING_EXPERIENCE_DESIGN_DECISION.md` §12 and the
existing parked status on #79.

## Definition of done, checked against #92's own list

- [x] Current-state screen inventory — this package + implementation record.
- [x] Target information architecture — shipped; `PRODUCT.md`/`DESIGN.md` updated.
- [x] Screen map — `LEARNING_EXPERIENCE_DESIGN_DECISION.md`, "Proposed screen map".
- [x] End-to-end journeys — §6, J1–J10.
- [x] State/evidence transition map — §7–§8, unchanged from `PROGRESS_ARCHITECTURE.md`.
- [x] Migration strategy — none for batches 0–4; batch 6 carries the one additive migration, not yet written.
- [x] #90 reconciliation — table above.
- [x] Execution plan — table above, batches 5–6 only.
- [ ] **Owner phone review of batch 5** — the practice surface, its two entry
      points, and the `practice`-not-`repair` naming call above.
- [ ] **Owner review of §15.1 and §15.3** — the one item this package cannot close by itself. §15.5 was decided on 2026-09-14 (formative); §15.1 and §15.3 still want a deliberate phone look.
