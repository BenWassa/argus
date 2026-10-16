# Next batches: implementation checkpoint

**Status:** active work and owner gates, updated 2026-10-15 (role/artwork reconciliation).
**Authority:** execution checkpoint for the owner’s request to tackle the batches one by one. The [ratified #197 record](ISSUE_197_ROLE_DECISION_RECORD.md), [offline contract](ISSUE_113_OFFLINE_FIRST_RUNTIME.md) and Library Roadmap retain their respective product/implementation authority. This is not a release closeout.

## Completed repository work

- Housekeeping: #198, #199, #185 and #200 merged; obsolete #104 redirects removed; historical banners/references repaired; Morse marked shipped. `fix/communicator-symbols` deleted. #126/#127 closed; #193 remains open for Pixel acceptance.
- Role decisions: D1–D9 ratified by the owner. The owner will create artwork.
- Navigator/receipts: #203/#207 merged. Learn limits, role/manifest drift checks, permanent versioned awards, import/export/account isolation, transactional metadata sync, explicit reset generations, optional-version proof reuse and the two-role focus/Continue UI are implemented. Navigator uses the owner-approved locked/earned PNG pair on main via #217. PR #218 adds Mariner and replaces Communicator’s SVG with the owner-authorized PNG pair; its merge/deployment is not implied by this checkpoint.
- Maritime: #204 merged. Official NGA plate/meaning source inspected; unresolved proportions and current IMO comparison recorded. No flags are marked finally accepted. PR #218 makes Mariner available under the owner’s waiver of the pre-release #147/#148 independent reviews (2026-10-15); the owner will review deployed content. Neither independent review is accepted by that release decision.
- Offline foundations: #205 native owner-isolated IndexedDB repository/outbox and #206 generation-safe app shell are merged. The database boundary is not yet the production provider’s storage mechanism.

## Next engineering steps

1. Integrate the IndexedDB repository with LibraryProvider. Await local transactions before treating actions as saved; surface local failure and preserve recovery bytes. Keep demo behavior isolated. Update component/browser fixtures to read the canonical store rather than assuming localStorage is authoritative.
2. Integrate the durable ledger/outbox with the existing conservative sync planner. Handle partial acknowledgements, conflicts, bounded retries, reconnect/restart drain and owner isolation without losing a newer queued revision.
3. Add provisioned-owner offline auth/bootstrap, including new-device connection-required behavior and corrupt/missing-local cloud recovery before seeding.
4. Complete Profile status/retry/recovery and the end-to-end offline learner traces. Build precaching and footprint reporting already existed; shell update safety is now covered separately.
5. Wave 1’s four S1 vignette topics are authored and staged (2026-10-15) in `src/domain/humanFactors/`, outside the seed and manifest, with Decision Under Uncertainty I as the fifth topic. Next: independent human key review, item-level source verification, ethical/content review, authorized delivery work and phone/Pixel presentation acceptance. Catalog registration and any role earnability remain separate gated changes. See [Wave 1 §8](ISSUE_197_ANALYST_WAVE1_HUMAN_FACTORS.md).

## Owner and external gates

| Gate | Needed |
|---|---|
| Role artwork device QA | Navigator PNGs are approved and integrated via #217; PR #218 adds approved Mariner/Communicator PNGs. Physical Pixel, installed-PWA and high-DPI checks remain open |
| Communicator symbols | Owner authorized PNG replacement (“pngs replace”); former vector-fidelity choice is resolved. PNG flag/Morse accuracy is unverified; do not transfer archived SVG verification to it |
| Mariner (post-deploy) | Owner review of the deployed #147 light/day-shape keys and #148 flags; disposition of the current IMO flag comparison/proportions. Corrections ship as a versioned optional update |
| v1.5.0 Pixel | Continuous Morse timing/word gaps, first-press audio, interruption/backgrounding, installed-PWA navigation and high-DPI badge checks |
| #113 Pixel | Production offline bootstrap, cold restart, durable Morse/Test writes, prolonged pending state, reconnect and sync/recovery traces after integration |
| CAF/DND imagery | Written permission covering the intended repo/PWA use; #185 research does not remove this gate |
| Audio production pack | Model access and human listening QA; the closed implementation issue #151 does not prove production pack acceptance |
| Scuba reference scope | Owner choice: original six visuals, or all 13 terms using ten equipment references plus a shared HP/LP/IP diagram |

## Verification and release state

#203 CI passed web/browser/rules. The combined #205/#206 workflow passed web/browser/rules, including 40 native database checks and eight shell checks across four viewports. #207 additionally passed 74 focused role/persistence/sync tests and 16 Roles browser checks. These are automated checks, not Pixel or domain-review acceptance.

No version, tag or deployment was changed. Production remains v1.5.0. Main now contains the merged follow-up source; #113 remains open and the full offline-first guarantee is not complete.

## October 14 housekeeping closeout — historical execution state

**Historical checkpoint:** the role-artwork statements below are superseded by the October 15 state above. Other lanes retain their own PR status and acceptance evidence; this role-only reconciliation does not re-audit #113.

**Completed on `main`:** PR [#210](https://github.com/BenWassa/argus/pull/210) (radio DSC wording correction; CI passed), [#211](https://github.com/BenWassa/argus/pull/211) (maritime evidence and unresolved reviewer gate), [#213](https://github.com/BenWassa/argus/pull/213) (Analyst Wave 1 research), and [#216](https://github.com/BenWassa/argus/pull/216) (agent-work reconciliation). Direct housekeeping commit [`1339c85`](https://github.com/BenWassa/argus/commit/1339c85118745c1d90efe586e0d1583ade2bcc4c) archived ten completed issue specifications to `docs/closed/`, created open/closed folder indexes, and repaired in-repository references. GitHub issue links were updated separately.

**Still open (do not merge without the named gate):**

| Lane | PR | Status | Blocking gate |
|---|---|---|---|
| Morse UX review #201 | [#212](https://github.com/BenWassa/argus/pull/212) | CI passed; design proposal | Owner visual approval of the remaining mockup decisions |
| IndexedDB LibraryProvider #113 | [#214](https://github.com/BenWassa/argus/pull/214) | **Draft; latest browser CI failed** (web/rules passed) | Resolve navigation/focus/practice browser regressions, then full CI and migration safety review |
| Morse Play entry #201 | [#215](https://github.com/BenWassa/argus/pull/215) | Draft; CI passed | Confirm complete scope against approved design, then real Pixel acceptance |

**External acceptance remains open even after merging a document or corrective PR:** marine-radio #150 independent qualified review; maritime #147/#148 lights, day-shape and flag review; Analyst #197 source/answer-key/ethical review; role-artwork device QA; CAF imagery rights; Morse real-device acceptance.

### Next engineering order

1. Fix #214 browser failures and re-run all checks. Preserve migration bytes and account isolation; only merge after persistence review.
2. Resolve #212 owner mockup decisions and confirm #215 implementation alignment, then validate on Pixel.
3. Once #214 lands, work on separate durable outbox/retry, offline auth/bootstrap, and Profile recovery lanes.
4. After #213 research sign-off, author/implement Analyst content in a separate workstream without making the role prematurely earnable.
5. Maintain open and closed documentation indexes and release gate records. **No production release or issue closure is implied by these housekeeping changes.**
