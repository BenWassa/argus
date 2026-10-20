# Pre-release review of open PRs

**Status:** completed review, 2026-10-15. PRs #220, #212, #219, #218 and #215 merged with owner authorization; #214 excluded. Historical review evidence, not a current queue.
**Authority:** historical technical release-readiness evidence and cleanup tracking. Existing product decisions and [human acceptance checklist](../open/HUMAN_ACCEPTANCE_CHECKLIST.md) retain their authority. Checked against main `303ea5b`.

## Release recommendation

Keep the offline migration out of the immediate release until the existing #113 session resolves its durability integration and browser failures. Retain the other five PRs; none is established as wholly obsolete. Documentation fixes can be integrated before the final release gate. Pixel/domain review remains explicitly outstanding, with existing owner waivers distinguished from technical verification.

## #214 — hold; high-priority durability defect

Remote head `8e8009d` is conflicting with main and has a failing browser CI run. The separate `codex/fix-214-browser` branch has `ce05bea`, but that fix is not in the PR head. Do not alter its active worktree or mix it into an unrelated release.

At remote `LibraryProvider.tsx:335–344`, `upsertTopic` queues an IndexedDB transaction but discards its result. Transaction rejection is converted to `false` at lines 327–329. At `useSync.ts:250–262`, remote adoption calls this void method, immediately records the adoption in the sync ledger and reports synced without waiting for local durability. `removeTopic` has the same void contract for local drop.

Failure path: a remote-only topic is planned for adoption; local IndexedDB write fails or the tab closes before commit; the ledger nevertheless says it exists locally. The next sync planner sees no local topic plus a known remote topic and selects **deleteRemote**. This can delete the only durable copy. A source-level planner reproduction using the unchanged planner confirmed `adopt → premature nextLedger → deleteRemote` when local state remains empty. This is not an end-to-end browser reproduction.

Required fix: expose/await local mutation success before ledger advancement or synced status; preserve previous ledger and retryable remote adoption on failure/restart. Add a meaningful failure-path regression proving the remote record survives failed adoption. The active outbox/sync lane may already address this; verify its eventual diff rather than duplicate it. Also review owner binding serialization/generation handling before asserting account isolation under overlapping callbacks; current tests cover sequential switching only.

## #219 — retain; staged preparation

Head reviewed `28be9ff`; four Analyst topics are guarded outside seed/manifest and role earnability. Four photo candidates stay under docs, outside precache. Blind review pack, keys, source limitations and current gates are explicit. Source snapshot hashes and photo hashes verified. All 1,694 unit tests and build passed locally; 445 browser tests passed, 19 intentionally skipped in the full composite gate.

Cleanup commit `bb02997` reconciles the already-selected fifth topic, original research versus staged-source scope and the remaining delivery gates in NEXT_BATCHES. Documentation-only changes after the completed gate do not change runtime results; refresh remote CI after pushing.

## #220 — ready

Head `a7639b4`: two documentation corrections accurately distinguish ratified role decisions, shipped Home behavior and pending Pixel acceptance. CI green; no code changes or substantive conflict found. Merge before final combined gate.

## #212 — retain as design reference; cleanup prepared

Head `f6ca277`: documentation and six static mockups, CI green. Embedded Topic architecture was approved in the owner's October 14 comment; exact visual/runtime acceptance remains separate. The broader proposal is not fully delivered by S1A, so do not close it as obsolete.

Local cleanup `bb9d468` on `review/212-doc-cleanup` moves byte-identical mockups from docs/mockups to docs/open/assets/morse-play, repairs all links, records architecture-only approval and indexes the reference. Worktree `/private/tmp/argus-review-212`. No push/merge performed by this review.

## #215 — retain narrow S1A

Head `694a194`: remote web/browser/rules/demo build green. Existing direct modes, exact recommended challenge and packet-validated checkpoint replay fit the small scope; no new gameplay engine or persistence fields. No concrete source defect found. Detailed [S1A review](../open/morse/ISSUE_201_S1A_SCOPE_REVIEW.md) lists combined entry/exit/Back, fresh/mid-course/repair/imported/all-cleared state and rendered 320/390px checks. Local focused validation passed 32 unit tests and 10 existing browser tests across 320/390px; its production browser-test build succeeded. Actual fresh, acquired and banked Topic screenshots at [320px](../open/morse/assets/morse-play-s1a/320-banked.png) and [390px](../open/morse/assets/morse-play-s1a/390-banked.png) are retained under docs/open/morse/assets/morse-play-s1a. Banked layouts were visually inspected: one-column at 320px, two-column at 390px, wrapped text and no horizontal overflow. These captures are diagnostics from head 694a194, not owner visual or Pixel acceptance. Ad-hoc mid-course/repair captures are excluded because their course-history semantics were not established. Keep #188/#201 open for real-device acceptance.

## #218 — retain; owner-approved delivery with known art limitation

Head `93b7958`: one commit ahead of current main/#217, not a duplicate of that PR. Remote CI green. Mariner uses seven existing shipped topics; its pre-domain-review delivery waiver is recorded. Communicator PNG replacement was expressly owner-authorized. Inspection confirms its checkered flag differs from the previously vetted November geometry; flag/Morse symbol accuracy remains unverified and must stay in the human checklist. Do not turn decorative asset approval into factual-symbol verification.

Documentation cleanup is needed: badge-art §§14/15 still describe removed reference metadata, retained SVG and unavailable Mariner, while NEXT_BATCHES retains stale Navigator/text-only/vector wording. Local cleanup `0a2b1c9` on `review/218-doc-cleanup` reconciles these claims and preserves the owner waiver and pending domain/device reviews. Worktree `/private/tmp/argus-review-218`. No new artwork or role-policy changes are part of cleanup; nothing pushed/merged.

## Verification boundaries

The full local composite gate ran on the Analyst branch at `28be9ff`: 1,694 unit tests, production build and 445 browser passes / 19 skips. It does not validate the combined heads of every PR, #214, #215 or #218. Run the repository release gate on the final integrated main before bump/tag/deploy. No Firestore rules changed relative to v1.5.1 in the checked Analyst candidate.

## Integration closeout

The owner authorized integration after review. Five PRs merged, including the prepared documentation cleanup. Combined main is `08ee4f2`; the full release gate is run against that integrated source. #214 remains draft and excluded. The local review-branch descriptions above describe preparation state at inspection, not outstanding merge work.
