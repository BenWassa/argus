# Next batches — current Argus execution checkpoint

**Status:** active, updated 2026-10-22 after GitHub issue reconciliation. **Authority:** operational queue and dependency map only; product requirements remain in their owning issue, `PRODUCT.md`, `DESIGN.md`, [progress architecture](PROGRESS_ARCHITECTURE.md), [role decisions](ISSUE_197_ROLE_DECISION_RECORD.md) and the [offline-first contract](ISSUE_113_OFFLINE_FIRST_RUNTIME.md). This document is not a release record or a substitute for real-device and domain review.

## Verified implementation baseline

- [PR #271](https://github.com/BenWassa/argus/pull/271) merged Signal-on-Slate to `main` on **2026-10-20**: tokens, common screen/session kit, the open Morse progress path, Key/Listen/Read/Free play, compact Home/Library/Topic/Role surfaces, and round-2 polish. [PR #272](https://github.com/BenWassa/argus/pull/272) subsequently restored visible Morse Back navigation in the sticky header. **Neither merge is a Pixel acceptance or production release record.**
- Child implementation issues **#226–#232, #242–#248, #257–#259, #263–#264** were closed as implemented on 2026-10-22. The umbrella [#225](https://github.com/BenWassa/argus/issues/225) and final owner/device acceptance [#233](https://github.com/BenWassa/argus/issues/233) remain open.
- Permanent completion and Home Continue were integrated through [#270](https://github.com/BenWassa/argus/pull/270). Owner's newer lesson-completion rule is separately scoped in [#276](https://github.com/BenWassa/argus/issues/276) and is **not yet claimed implemented**.
- [#201](https://github.com/BenWassa/argus/issues/201) is closed for its bounded documentation/handoff scope, not proof that every proposed endless-play extension has shipped. Use the merged #271 UX and active Morse contracts as current navigation truth.
- Roles: Communicator, Navigator and Mariner runtime/badge work has been delivered, while badge device review, independent maritime acceptance and further role requirements are not universally approved. Analyst Human Factors material is staged for review only and is not earnable.
- [#113](https://github.com/BenWassa/argus/issues/113) remains open. IndexedDB repository/outbox foundation and shell safety are merged (#205/#206); [draft PR #214](https://github.com/BenWassa/argus/pull/214) is **not merged**, so full offline-first and durable sync must not be claimed.

## Execute before further feature expansion

| Priority | Workstream | Current truth and next action | Boundary |
| --- | --- | --- | --- |
| P0 | [UI/Pixel acceptance #225/#233](ISSUE_225_UI_OVERHAUL.md) | Run/record installed-PWA and Chrome acceptance, accessibility, audio, Back, path jump, and five-minute Morse route. Re-score against existing target, log defects | No implicit owner sign-off; no release inferred |
| P1 | [Morse speed #279](https://github.com/BenWassa/argus/issues/279) | Implement independently graded timing bands and four large letter options; review 390px interactions first | Session variant of Read/Listen, not a fifth mode |
| P1 | [Shared haptics #280](https://github.com/BenWassa/argus/issues/280) and [Pixel calibration #281](https://github.com/BenWassa/argus/issues/281) | Complete existing shared service coverage, then tune on real Pixel | No duplicate keyer; tactile perception is not established by tests |
| P1 | [Offline-first #113](ISSUE_113_OFFLINE_FIRST_RUNTIME.md) | Reconcile and review #214 against current main, then durable outbox/drain, offline auth/bootstrap and recovery | Preserve user data, namespaces and conflict policy; no blind merge |
| P1 | [Learning rule #276](https://github.com/BenWassa/argus/issues/276) | Implement owner-approved 'required lessons once → Learned; Test optional' with evidence separation | Preserve original history and scores |
| P2 | [UI polish #223/#274–#277](https://github.com/BenWassa/argus/issues/223) | Small reviewable changes: Roles collection, Library bars, icons, safe removal of Delete. Coordinate with #276 | No unapproved new roles or change to storage deletion semantics |
| P2 | [CI measurement #273](https://github.com/BenWassa/argus/issues/273) | Review [draft scoping PR #278](https://github.com/BenWassa/argus/pull/278), establish clean-run numbers and same-SHA pilot before changing gates | Do not remove coverage or rename branch-protection jobs blindly |
| P2 | Radio/maritime/role review | Complete [radio #150](ISSUE_150_HUMAN_REVIEW.md), [maritime independent review](ISSUE_147_148_MARITIME_DOMAIN_REVIEW.md), [badge #192](ISSUE_192_ROLE_BADGE_ART.md), [Analyst #197](ISSUE_197_EXPANDED_ROLE_ARCHITECTURE_RESEARCH.md) | Authoritative review and owner gates remain separate from CI |

## PR triage (inspected 2026-10-22; #222 now closed)

| PR | Scope | Disposition |
| --- | --- | --- |
| [#214](https://github.com/BenWassa/argus/pull/214) | IndexedDB provider, draft | Keep open; needs current-main reconciliation, fresh tests and data-safety review |
| [#222](https://github.com/BenWassa/argus/pull/222) | 2026-10-16 #221 documentation proposal | **Closed unmerged 2026-10-22:** duplicate/superseded by the maintained Morse #221 contract and merged #271 runtime |
| [#278](https://github.com/BenWassa/argus/pull/278) | #273 CI scope, draft | Scope-only review; its companion file is in this PR, **not** on `main` |
| [#282](https://github.com/BenWassa/argus/pull/282) | #280/#281 haptics scope | PR targets old `feat/ui-overhaul`; evaluate retargeting/rebasing to `main` after checking for duplicate integration, without treating document merge as haptic implementation |

## Human and release gates

Use the [consolidated checklist](HUMAN_ACCEPTANCE_CHECKLIST.md) for exact candidate/build identity, Pixel Chrome and installed-PWA results, role badge review, radio/IMO maritime keys, Analyst vignette keys, scuba/licensing and CAF permission. A checked CI job, owner-approved mockup, merged PR and physical acceptance are **different evidence types**. The full offline-first guarantee, production voice pack, unapproved new role earnability and release/deployment require separate sign-off.

**Historical checkpoint:** [15 October 2026 execution record](../closed/NEXT_BATCHES_2026_10_15.md). It is retained for provenance, not active PR state.
