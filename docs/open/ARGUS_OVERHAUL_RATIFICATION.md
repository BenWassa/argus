# Argus learning-experience overhaul — ratification package (#92)

> **#109 navigation addendum — 2026-09-17.** Profile now owns account, sync,
> export, import, reset, and catalog-delivery status as a Today child. It is not
> a primary navigation destination. This supersedes historical statements below
> that place Data under Library; old `data` history entries remain compatible.

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
> documents, and records the owner's decisions. Full detail lives in
> `docs/open/LEARNING_EXPERIENCE_DESIGN_DECISION.md` (authoritative) and
> `docs/closed/SCREEN_INVENTORY_REVIEW.md` (superseded, kept for research
> history).

## What is already true

Batches 0–6 of `docs/open/LEARNING_EXPERIENCE_DESIGN_DECISION.md` — the
programme's entire execution plan — are merged to `main`. Verified directly
against shipped source, not inferred from any document's own account:

- `src/features/progress/` is gone; `Progress.tsx` no longer exists.
- `src/features/learn/Learn.tsx` is gone; `MorsePath.tsx` and `LessonRun.tsx`
  exist in its place.
- `src/features/library/CompletionRecord.tsx` exists — the completion record
  moved to the foot of Library, exactly as recorded.
- `AppShell`'s nav array is exactly `[Today, Library]`; `View` still carries
  `'data'` for the route but it is not a nav tab.
- `docs/open/TARGETED_PRACTICE.md` and `src/domain/study/practiceTargets.ts` exist — batch 5,
  shipped as *practice*, formative by construction.
- `src/domain/morse/curriculum/lessonPriority.ts`, `MorseReviewProgress`, and
  `src/domain/morse/listeningBalance.test.ts` / `morseProgrammeSimulation.test.ts`
  exist — batch 6, #90 items 2, 3, 4, 5 and 9, with whole-programme simulation
  coverage.
- `PRODUCT.md` and `DESIGN.md` have themselves been rewritten to describe this
  state (`Learn` is no longer a user-facing name; navigation is "two
  destinations, Today and Library").
- `src/features/library/TopicPage.tsx`'s `startLearning` — not its mount
  effect — now owns the `unstarted → learning` write, reached through
  `journeyFor`'s `enroll` action, per the §15.1 decision below (2026-09-15).

So the four questions #92 asks in order are answered, and answered in the shipped app, not on paper:

1. **App structure** — `Today` (the docket) and `Library` (browse/author/record), with `Profile` as a Today child for account, sync, and data controls. See the #109 addendum in `LEARNING_EXPERIENCE_DESIGN_DECISION.md`.
2. **Topic/course structure** — one topic shell, two bodies: an ordinary topic's body *is* its reference (briefing, if any, then the numbered set); a curriculum topic's (Morse's) body is its path. See §4–§5.
3. **Learning journey** — `Learn` and `Test` survive as internal semantics only; the learner reads `Read`, `Lesson N`, `Test`, and — since batch 5 — `Practise the N items you missed`. See §6 (J1–J10) and §7.
4. **Evidence/state model** — unchanged in its boundaries, extended within them: `MorseReviewProgress` (batch 6) and practice (batch 5) both write only formative state, asserted structurally by test. Acquisition, formal evidence, retention and current-sitting stay four separate fields. See §7–§8, and `docs/open/PROGRESS_ARCHITECTURE.md` for the underlying contract.

## Reconciliation of the two proposal documents

| Where they conflicted | Resolution | Authority |
|---|---|---|
| `Home`/`Lessons` nav vs `Today`/`Library` | `Today`/`Library` shipped. `Home`/`Lessons` rejected — wrong for a reference library whose majority object has no lessons. | `LEARNING_EXPERIENCE_DESIGN_DECISION.md` §3, §14.1 |
| Badges / milestone-and-freshness state | Rejected outright — contradicts `PRODUCT.md`'s anti-gamification contract; `completedAt` already solves the stated problem. | §10, §14.2–3 |
| `First Messages` as a milestone of the printed topic | Rejected — #29 territory, or a separate topic with its own criterion. Never a stage of `international-morse-letters-printed`. | §12, §14.4 |
| Standalone Progress destination | Removed. Nothing lost: shelves already existed in Library, completion record moved to Library's foot. | §8, implementation record |
| Morse reference: embedded 26 cards (#76) vs a quiet link | Reversed to a quiet `Morse alphabet` link. **Owner-confirmed 2026-09-15 — see below.** | §5, §15.3 |
| "Relocate Test's button = final assessment" | Rejected as insufficient on its own — Test started at supported cue rungs and word checkpoints saved no evidence. Fixed structurally by promoting #90 items 6–8 into batch 4 (shipped) rather than by moving a button. | §11 items 6–7, §13.10 |
| Repair: a fourth `practice` surface vs reusing the existing `repair` name | `repair` was already taken — `JourneyPhase = 'repair'` names a decayed topic's remedy, a full scored Test. The new unscored surface is called **practice** to keep that boundary legible. | `TARGETED_PRACTICE.md` |

`docs/closed/SCREEN_INVENTORY_REVIEW.md` is marked superseded accordingly; its
per-surface duplication analysis and its "what other learning apps
demonstrate" research remain useful and are preserved unedited.

## #90 reconciliation (final)

| # | #90 requirement | Status |
|---:|---|---|
| 1 | Preserve the four state boundaries | retained — a hard constraint |
| 2 | Item-aware question selection | **shipped** — batch 6, `morseLessonPriority.ts` |
| 3 | Novel-item budget at sitting scope | **shipped** — batch 6, one new pair per sitting |
| 4 | Cumulative review coverage; consolidation | **shipped** — batch 6, `MorseReviewProgress` |
| 5 | Balance listening by item need | **shipped** — batch 6, `chooseListeningTarget` |
| 6, 7 | Remove duplicated cue acquisition after Learn; both printed directions earlier | **shipped** — batch 4, `learnToTestHandoff.test.ts` |
| 8 | Distinguish non-qualifying from failure | **partly shipped** — `withheldByAcquisition` copy exists; an explicit scheduler outcome does not |
| 9 | Complete the checkpoint arc | **shipped** — batch 6 |

Every #90 requirement except the remaining half of item 8 has shipped.
**#90 may be closed once item 8's explicit scheduler outcome is either
written or deliberately deferred to its own issue** — it is the one loose
end, not a reason to hold the whole issue open indefinitely.

## Owner decisions — resolved 2026-09-15

Three decisions were defaulted rather than ratified when batches 0–4 shipped.
The owner reviewed all three directly:

1. **§15.3 — Morse reference cards.** #76 put all 26 reference cards on the
   Morse topic page, validated on a Pixel. Batch 3 replaced it with a quiet
   `Morse alphabet` link so the curriculum path could be the page body.
   **Confirmed as shipped** — the quiet link stays.
2. **§15.1 — Exposure for an ordinary topic.** Previously shipped as "opening
   the topic page stamps `unstarted → learning`". **Changed** (#97, landed in
   #99): browsing and enrolment are separated outright. Mounting, revisiting
   or restoring the page writes no `status`, `learningAt`, history, scheduler
   or evidence state, and the journey reads the stored topic exactly as it
   stands rather than projecting a resolved one. A fresh ordinary topic
   instead offers a deliberate `Start learning` action — `journeyFor`'s new
   `enroll` phase, handled by `TopicPage`'s `startLearning` — which performs
   the `unstarted → learning` transition and nothing else: no score, no
   formal evidence. Test keeps its existing scheduler and evidence semantics.
   A topic opened and abandoned stays `unstarted`. Covered by
   `crossSurface.test.tsx` asserting browsing leaves a learner topic
   unchanged; the pre-existing 28-test cross-surface
   consistency suite passes unchanged, because no displayed label moved.
3. **§15.5 — Is practice scored or formative?** **Confirmed formative**,
   matching what had already shipped 2026-09-14: practice practises, the next
   check proves, and the evidence contract stays untouched.

## What remains

One item from batch 5 has not been reviewed on a device:

- **Owner phone review of the `practice` surface** — its two entry points
  (the check's end screen, and the topic page while a miss stands) and the
  `practice`-not-`repair` naming call. Recorded in
  `docs/open/TARGETED_PRACTICE.md`.

Nothing else is outstanding from this programme. #42's real-device acceptance
gate is unrelated and stays open on its own terms; #29 and #79 stay out of
scope entirely, per `LEARNING_EXPERIENCE_DESIGN_DECISION.md` §12 and the
existing parked status on #79.

## Definition of done, checked against #92's own list

- [x] Current-state screen inventory — this package + implementation record.
- [x] Target information architecture — shipped; `PRODUCT.md`/`DESIGN.md` updated.
- [x] Screen map — `LEARNING_EXPERIENCE_DESIGN_DECISION.md`, "Proposed screen map".
- [x] End-to-end journeys — §6, J1–J10.
- [x] State/evidence transition map — §7–§8, extended by batches 5–6 within the same boundaries.
- [x] Migration strategy — none for batches 0–4; batch 6's additive `MorseReviewProgress` migration has landed and is tested.
- [x] #90 reconciliation — table above; only item 8's second half remains.
- [x] Execution plan — batches 0–6 all shipped.
- [x] Owner review of §15.1, §15.3, §15.5 — resolved 2026-09-15, recorded above.
- [ ] **Owner phone review of batch 5's `practice` surface** — the one item this package cannot close by itself.
