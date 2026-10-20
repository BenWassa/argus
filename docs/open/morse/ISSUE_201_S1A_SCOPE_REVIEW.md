# #201 S1A — scope and evidence review

**Status:** read-only technical review prepared 2026-10-15; #215 remains an open draft. No runtime edits, merge decision, visual approval or Pixel acceptance supplied by this document.  
**Authority:** reconciliation of existing work against [the next-slice recommendation](ISSUE_201_NEXT_SLICE_RECOMMENDATION.md). Maintained Morse contracts continue to govern evidence and scoring.

## Recommendation

Finish validation of the existing #215 slice instead of building another entry experience. It already implements most of the narrow recommendation, with one small addition: replay of an existing unlocked beginner word checkpoint. That is bounded reuse, not a new generated known-letter game. Keep new gameplay, scores, storage and milestones deferred.

## Reviewed evidence

- [#209, merged S0](https://github.com/BenWassa/argus/pull/209), merge commit [`335ade9`](https://github.com/BenWassa/argus/commit/335ade9d37a15523dc22c29710e56621ea3c11d2): post-Test and final-Learn direct Send handoff, plain-view Topic entry, all-cleared Send recommendation. It does not complete #201.
- [#212, static design proposal](https://github.com/BenWassa/argus/pull/212), head [`f6ca277`](https://github.com/BenWassa/argus/commit/f6ca277693eba3744d4c6f343be77dda03249bb8): proposed embedded Play, four mode families and six illustrative 390px states. The maintained design document still says proposed/not approved. A PR comment dated 2026-10-14 records the owner's approval of **embedded Topic-page information architecture**. That supports the architecture decision, not blanket approval of every mockup state, beginner treatment or runtime rendering.
- [#215, draft S1A](https://github.com/BenWassa/argus/pull/215), head [`694a194`](https://github.com/BenWassa/argus/commit/694a19468d7930d154aed1f74f04a616f3c70ee7): full diff and current metadata inspected. Base is `main`; no schema/auth/sync or gameplay-engine files are changed.

## Already implemented in #215

`TopicPage.tsx` embeds Play before the curriculum for acquisition-ready learners. Its recommended Send launch uses existing `recommendedSendStage` and `SEND_STAGE_INFO`. For banked learners it replaces generic Keep going with the actual challenge; Test/repair retain their primary position when due. Four controls route directly to Send, next Copy level, Sprint and Free Play.

`routes.ts` adds validated `copy` and `free` direct destinations, allows at most one of mode/send/copy/free, and includes those fields in route identity. `AppRouter.tsx` passes them to `FluencySurface`, which initializes existing mode state. Exit from direct Free Play returns to the Fluency hub; this is explicitly tested. No new durable field is added.

For developing learners, the Topic page selects the latest existing unlocked word checkpoint and routes to its existing warm-up/replay. The checkpoint domain already validates packet word material and milestone eligibility. This differs from the recommendation's blanket beginner deferral only by exposing existing replay more visibly. It does not supply arbitrary early known-letter rounds or alter acquisition evidence.

Tests cover route identity/invalid destinations, direct Copy/Free Play initialization, Topic choices, banked challenge label, an unlocked beginner checkpoint and browser direct navigation. Existing S0 Learn/Test handoff components are untouched in this diff. That preserves their implementation but is not proof of every combined acceptance state.

## Concrete gaps and risks before merge

1. **Combined navigation needs actual acceptance evidence.** Test explicit exits, result continuation and browser/Android Back from each direct entry and from the #209 handoffs. The existing hub is a retained return context; the broader #212 wording asks for a persistent Play context. Decide whether that retained hub satisfies the narrow slice before claiming full design fidelity.
2. **Beginner claims need bounded wording.** #212 sketches roster-driven early rounds; #215 exposes packet checkpoints. Confirm first eligible checkpoint, never-eligible fresh state, later checkpoints and repair states. Do not label the larger S1 known-letter game delivered. If minimizing scope further, defer only this affordance; do not rebuild its engine.
3. **No combined skill readout is delivered.** This matches the narrow recommendation. #212's illustrative readouts, adaptive cross-mode ranking and result/miss refinements are not implemented by #215 and should not be counted as missing requirements of this bounded slice.
4. **Returning/imported state coverage is incomplete evidence.** Review all-cleared Send, all-cleared Copy (falls back to `sentences`), no history, partial valid imports and repair priority. Source coverage for one advancing Copy example does not establish all these states on device.
5. **Visual fidelity is unverified.** CSS defines a two-column activity grid and switches to one column below 360px. That is implementation intent, not rendered 320/390px proof. Capture fresh, mid-course, acquired-unqualified, banked/returning and repair Topic states, plus active/miss/result/handoff states. Check large text, focus, touch targets, scroll and docked action overlap.
6. **Approval wording needs reconciliation.** The recorded owner comment approves architecture, while #212's document still says not approved and #215 calls the slice owner-approved. Keep architecture approval separate from exact visual approval in the final documentation; no need to ask the owner to re-decide architecture.

No concrete runtime defect is asserted by this scope review. These gaps describe evidence still needed and boundaries the PR must state accurately.

## Latest remote CI

At review, all completed checks for #215 head `694a194` passed: Argus CI `web`, `browser` and `rules`, plus demo `build`. Demo `deploy` was skipped. [CI run](https://github.com/BenWassa/argus/actions/runs/38577215163) completed on 2026-10-14; [demo build run](https://github.com/BenWassa/argus/actions/runs/38577215143) is separate. These are remote check results, not tests run by this review. Recheck when head/base changes; mergeability was reported `UNKNOWN` and was not independently resolved here.

Passing browser CI does not establish real-Pixel acceptance, Android interruption behavior or owner visual approval. Keep #188 and #201 open. Add this slice to the consolidated end-of-batch human checklist with the exact candidate commit and captured states rather than asking for seven new product decisions.
