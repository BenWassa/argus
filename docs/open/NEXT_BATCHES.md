# Next batches: implementation checkpoint

**Status:** active work and owner gates, updated 2026-10-13.
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
