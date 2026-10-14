# Next batches: implementation checkpoint

**Status:** active work and owner gates, updated 2026-10-14.
**Authority:** execution checkpoint for the owner’s request to tackle the batches one by one. The [ratified #197 record](ISSUE_197_ROLE_DECISION_RECORD.md), [offline contract](ISSUE_113_OFFLINE_FIRST_RUNTIME.md) and Library Roadmap retain their respective product/implementation authority. This is not a release closeout.

## Completed repository work

- Housekeeping: #198, #199, #185 and #200 merged; obsolete #104 redirects removed; historical banners/references repaired; Morse marked shipped. `fix/communicator-symbols` deleted. #126/#127 closed; #193 remains open for Pixel acceptance.
- Role decisions: D1–D9 ratified by the owner. The owner will create artwork.
- Navigator/receipts: #203/#207 merged. Learn limits, role/manifest drift checks, permanent versioned awards, import/export/account isolation, transactional metadata sync, explicit reset generations, optional-version proof reuse and the two-role focus/Continue UI are implemented. Navigator’s award is text-only pending artwork.
- Maritime: #204 merged. Official NGA plate/meaning source inspected; unresolved proportions and current IMO comparison recorded. No flags are marked finally accepted and Mariner is not available.
- Offline foundations: #205 native owner-isolated IndexedDB repository/outbox and #206 generation-safe app shell are merged. The database boundary is not yet the production provider’s storage mechanism.

## Next engineering steps

1. Integrate the IndexedDB repository with LibraryProvider. Await local transactions before treating actions as saved; surface local failure and preserve recovery bytes. Keep demo behavior isolated. Update component/browser fixtures to read the canonical store rather than assuming localStorage is authoritative.
2. Integrate the durable ledger/outbox with the existing conservative sync planner. Handle partial acknowledgements, conflicts, bounded retries, reconnect/restart drain and owner isolation without losing a newer queued revision.
3. Add provisioned-owner offline auth/bootstrap, including new-device connection-required behavior and corrupt/missing-local cloud recovery before seeding.
4. Complete Profile status/retry/recovery and the end-to-end offline learner traces. Build precaching and footprint reporting already existed; shell update safety is now covered separately.
5. Author Wave 1’s bounded S1 vignette topics from the existing Human Factors briefs. Plan four new topics beside OODA to meet the five-topic gate, with at least 40 total scored items. Ratification is complete, but no new scored topic was registered by this checkpoint.

## Owner and external gates

| Gate | Needed |
|---|---|
| Navigator artwork | Owner-supplied artwork and acceptance; no agent-generated substitute |
| Communicator fidelity | Owner acceptance of the existing vector’s fidelity remains separate from role-policy ratification |
| Mariner | Domain-informed second review of #147 light/day-shape keys; disposition of the #148 current IMO flag comparison/proportions |
| v1.5.0 Pixel | Continuous Morse timing/word gaps, first-press audio, interruption/backgrounding, installed-PWA navigation and high-DPI badge checks |
| #113 Pixel | Production offline bootstrap, cold restart, durable Morse/Test writes, prolonged pending state, reconnect and sync/recovery traces after integration |
| CAF/DND imagery | Written permission covering the intended repo/PWA use; #185 research does not remove this gate |
| Audio production pack | Model access and human listening QA; the closed implementation issue #151 does not prove production pack acceptance |
| Scuba reference scope | Owner choice: original six visuals, or all 13 terms using ten equipment references plus a shared HP/LP/IP diagram |

## Verification and release state

#203 CI passed web/browser/rules. The combined #205/#206 workflow passed web/browser/rules, including 40 native database checks and eight shell checks across four viewports. #207 additionally passed 74 focused role/persistence/sync tests and 16 Roles browser checks. These are automated checks, not Pixel or domain-review acceptance.

No version, tag or deployment was changed. Production remains v1.5.0. Main now contains the merged follow-up source; #113 remains open and the full offline-first guarantee is not complete.

## October 14 agent-batch PR checkpoint (pending review; not merged)

This checkpoint supersedes the earlier *next engineering steps* as a work allocation, **not** as proof of completion or release. At the time of this audit six PRs were open. No PR below was merged, no issue closed, and production remains v1.5.0.

| Lane | PR | Current evidence | Required gate before merge/close |
|---|---|---|---|
| Canadian radio #150 | [#210](https://github.com/BenWassa/argus/pull/210) | Corrects conditional DSC/MMSI wording with regression checks; source audit documented | Project CI, qualified Canadian radio/marine review; do not auto-close #150 |
| Maritime #147/#148 | [#211](https://github.com/BenWassa/argus/pull/211) | Documents Canadian/IMO/NGA comparison and unresolved aground schematic/flag proportions | Documentation review; independent maritime domain acceptance still outstanding |
| Persistent Morse Play #201 | [#212](https://github.com/BenWassa/argus/pull/212) | Six static token-faithful 390×844 SVG review mockups | Owner visual approval for complete proposed design; no UI rollout on design-doc merge |
| Analyst Wave 1 #197 | [#213](https://github.com/BenWassa/argus/pull/213) | Four draft Human Factors S1 topics (36 objective items); with four-item OODA reaches proposed 5 topics/40 items | Owner scope approval, independent answer-key/source review, editorial/ethical gates; not earnable |
| IndexedDB LibraryProvider #113 | [#214](https://github.com/BenWassa/argus/pull/214) **draft** | Moves production provider to local transactions with migration/account-isolation tests | Full CI and careful persistence safety review; durable cloud outbox drain/auth not in scope |
| Morse Play implementation #201 | [#215](https://github.com/BenWassa/argus/pull/215) **draft** | Embedded Play entry, direct Send/Receive/Challenges/Free Play routes | Check design approval scope from #212, CI, behavioural tests, real Pixel acceptance |

### Sequencing and housekeeping constraints

1. Review smaller source/doc PRs #210/#211/#213 independently; a merge of research or fixes **does not** satisfy external domain/owner acceptance gates.
2. Review #212 against the owner-approved direction and its remaining design decisions before accepting implementation #215; maintain separate real-device sign-off.
3. Keep #214 draft until migration/corruption/recovery tests and full CI are resolved; only then start the separate outbox drain/retry, offline auth/bootstrap and Profile recovery lanes.
4. Continue using `docs/open/` for live issue authority and `docs/closed/` only for fully accepted closeout. Do not move #113, #150, #188, #191, #192, #193, #197 or #201 prematurely. Research docs referencing #147/#148 remain open until domain sign-off.
5. Do not tag or deploy production as part of housekeeping. Verify issue titles/descriptions and documentation links after merging each PR rather than batch-closing on PR merge alone.
