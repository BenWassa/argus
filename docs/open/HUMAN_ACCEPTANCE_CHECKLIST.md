# Consolidated human acceptance checklist

**Status:** open; prepared 2026-10-15. No checks below are passed by preparation, automated tests, PR merge or model review.
**Authority:** coordination and evidence index only. Issue-specific contracts retain product, rights and release authority. Collect reviews here at the end of the small-work batch; preserve prerequisite gates before publishing gated content.

## How to use

Current released review baseline: **v1.5.2**, tag commit `65d3d45`, deployed 2026-10-15. Record any later candidate changes before testing. Release alone does not pass any item below.

Before the session, record the reviewed branch/commit, app version, deployment URL, Pixel model, Android/Chrome versions and installed-PWA status. For each completed check record reviewer name/qualification where relevant, date, result, evidence link and defects. Use **pass / fail / blocked / not run**, never an empty implied pass. Any changed reviewed source invalidates affected checks until rechecked.

### 1. Scuba references — #132

Review the [six-asset sourcing pack](ISSUE_132_SCUBA_ASSET_REVIEW.md) against the [scope](ISSUE_132_SCUBA_EQUIPMENT_VISUAL_REFERENCE.md).

- [ ] Six original targets: SCUBA system, BCD, SPG, LPI, DSMB and DPV. Expanded 13-term illustration set is deferred.
- [ ] Qualified/domain-informed reviewer confirms component identity, fittings, controls, hose relationships and absence of misleading procedural detail.
- [ ] Inspect each selected photo at phone size; target stays distinct from context.
- [ ] Confirm author, file-page licence, attribution, derivative terms and runtime image credits before integration. Review candidates stay under docs/open/assets/, outside public/, because every public asset is included in the app-shell precache.
- [ ] Confirm imagery supports Learn only and does not expand Test or imply equipment-use competence.

### 2. Analyst — #197

Use the [blind questionnaire](ISSUE_197_ANALYST_HUMAN_REVIEW.md) first; keep the [key and source map](ISSUE_197_ANALYST_REVIEW_KEY.md) separate until answers are recorded.

- [ ] Independent human answers all 36 implemented items without consulting keys.
- [ ] Compare every answer; document disagreements and equally defensible alternatives.
- [ ] Verify item-level source support, difficulty, distractors, ethical boundary and limited claim.
- [ ] Resolve ambiguous items before catalog registration; model concordance is not human acceptance.
- [ ] Review long vignettes at 320px, enlarged text and on Pixel once a review build exposes them.
- [ ] Confirm separate roadmap/build authorization and role-claim decisions before earnability.

### 3. Radio and maritime

Use the [radio reviewer pack](ISSUE_150_HUMAN_REVIEW.md) and maintained [maritime review](ISSUE_147_148_MARITIME_DOMAIN_REVIEW.md).

- [ ] #150 independent reviewer with Canadian radio/marine VHF expertise reviews every scored item and its sourced claim, including DSC wording.
- [ ] #147 lights/day-shape keys and limitations accepted by an independent domain-informed reviewer.
- [ ] #148 current IMO comparison, meanings, visual proportions and unresolved source gaps dispositioned.
- [ ] Record the existing #218 Mariner owner waiver separately; it does not count as independent domain acceptance.
- [ ] Production audio, if included in the candidate, gets human listening review; text review does not accept an audio pack.

### 4. Badge art — #192 / Roles

- [ ] Compare actual candidate art with owner-selected PNG concepts at 220/96/48/32px; inspect alpha edges, braid detail and high-DPI rendering.
- [ ] Recheck Communicator flags and Morse symbols against vetted meanings; #218 explicitly states the replacement PNG symbols were not re-vetted.
- [ ] Confirm locked/earned treatments and role labels remain readable, with no unintended role unlocks.
- [ ] Review Responder resemblance concerns if that asset is proposed for publication; do not treat unshipped art as already accepted.

### 5. Pixel / installed PWA — #193, #188, #191, #201

- [ ] Home navigation, available next actions, bottom navigation and installed-PWA back/relaunch behave correctly.
- [ ] Roles selector, permanent awards and badge rendering match the exact candidate role set.
- [ ] First press produces Morse audio reliably after cold open and after interruption.
- [ ] Sending timing, word gaps, touch release/cancel, background/foreground and interrupted sessions behave correctly.
- [ ] Final Learn, qualified Test, nonqualifying/review/repair and returning Morse states offer truthful actions; direct “Send five words” launches the named challenge.
- [ ] Owner reviews actual 390px active/miss/result/handoff states against #212/#215. Embedded architecture already has owner approval; record exact visual acceptance separately. Use the [S1A scope review](morse/ISSUE_201_S1A_SCOPE_REVIEW.md) for combined navigation, checkpoint and imported-state checks.

### 6. Offline / sync — #113 after integration

This lane is owned by the existing outbox/sync session. [#113 contract](ISSUE_113_OFFLINE_FIRST_RUNTIME.md) governs the full matrix; this is a session index, not replacement acceptance criteria.

- [ ] Record the exact merged candidate and automated/browser results; #214's last visible remote browser run failed on 2026-10-14, so do not assume the local fix is uploaded.
- [ ] Provisioned-owner offline cold launch and restart retain durable Morse/Test writes.
- [ ] New-device offline startup explains connection requirement truthfully.
- [ ] Prolonged pending writes survive restart; reconnect drains safely, including partial acknowledgements, retries, conflicts and newer queued revisions.
- [ ] Account switching/sign-out/reset preserve owner isolation and generation safety.
- [ ] Missing/corrupt local state and recovery/export flows preserve recoverable data; no false saved/synced state.

### 7. CAF permission — #178

- [ ] Owner completes and submits the [prepared request](ISSUE_178_PERMISSION_REQUEST_DRAFT.md).
- [ ] Written permission explicitly covers actual public PWA, offline copies, public repository distribution and transformations.
- [ ] Any restrictions and Crown-version changes are dispositioned before image acquisition/runtime delivery.

## Batch state

Reviewer packs and recommendations are preparation, not issue closeouts. Scuba asset sourcing is six visuals only. Analyst remains staged. CAF imagery remains blocked. #113 worktrees remain with their current session. No deployment, release, external message or acceptance sign-off is implied.

## Review record

Copy this small record for each section or failed item:

- Candidate commit/version:
- Reviewer and relevant expertise:
- Device/build context:
- Date:
- Result (pass / fail / blocked / not run):
- Evidence:
- Defects and follow-up:
