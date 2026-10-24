# Handoff: UI overhaul ("Signal on Slate"), epic #225

> **Status:** open handoff; checkpoints recorded through 2026-10-22. Archive under `docs/closed/` when the remaining work is finished.
>
> **Authority:** historical session context, not the current product contract. The durable records are `docs/open/ISSUE_225_UI_OVERHAUL.md`, DESIGN.md, DESIGN.json and PRODUCT.md; later checkpoints supersede earlier notes below.

Written 2026-10-19 by Claude when the owner handed everything to Codex. Work was paused mid-step (see "In flight").

## Completed queued implementation, 2026-10-22

- Reviewed, fully CI-green PRs #289 (Delete removal), #286 (one-pass lesson completion), #287 (compact Roles collection) and #290 (Library/Home/nav polish) were squash-merged; all branches retained.
- Primary main and origin/main are now 84851d1a242bf48ddb641b40f6e9290ac1148572. Tree exactly equals tested combined tree 2b5a2780b121eb28933557752dbc018017eb9f74.
- Full combined npm run check passed: 2,029 units/build, 520 browser passes/37 skips/3 diagnosed lazy-image fixture flakes passing retries. The final test-only Roles readiness fix reran32/32 without retries; fresh PR287 CI also fully green. PR290 browser CI passed18m55s.
- Dev server localhost:5174 still runs from primary main. HTTP checks confirm new Home readouts, role collection and no TopicPage onDelete. Own former live-copy edits and temporary hide-Delete CSS were consumed into merged code. Only unrelated README CI-scope link, untracked CI-scope doc and this temporary handoff remain dirty.
- Reviewed captures and validation: export/queued-ui-2026-10-22/index.html. No Pixel acceptance or production release claimed. Existing owner Pixel/release gates remain.
- #223/#274/#275/#276/#277/#288 are now closed by their implementation PRs. Sign-in art269 stays open. Old unfinished Roles/learning branches remain preserved; newer PRs supersede them.
- Newer other-branch review: PR285 stale late-answer guard fixed at4097de4;23 focused tests andTypeScript pass, CI rerunning. PR214 has recorded P1 account-switch and async completion durability blockers; do not merge. PR282/284 still need isolated intended patches onto main, haptics279 integration andPixel281. PR278 is documentation-only proposal, not CI implementation approval.
- The dated NEXT_BATCHES/README operational checkpoint predates these queued merges; refresh it with the next tracking/release documentation pass. Product/design/learning/role contracts in the merged PRs are updated. Keep the overhaul plan open until real acceptance.

## Earlier resumed checkpoint, 2026-10-22 (superseded)


This checkpoint supersedes the older in-flight notes below. Remote main advanced to 96209c3 via documentation reconciliation PR #283. Primary checkout remains 1c383f2 with preserved local edits and dev server on 5174.

- Owner's newer PR #287 (`feature/223-role-collection`) supersedes old local Roles implementation. Review fixes pushed at 6ecf717: compact three-badge hero, role/route fixture fixes and remounted badge focus restoration. TypeScript, 83 focused units and 32 browser cases pass. Root reviewed code/capture; fresh full CI pending (test-only lazy-image readiness fix subsequently pushed at 6fad5ec).
- Owner's newer PR #286 (`feature/276-one-pass-lessons`) supersedes old uncommitted lesson branch. Review fixes committed/pushed as 8035145 at `/private/tmp/argus-review-learning-20261022`; 2,026 units and 62 browser cases pass (10 intended skips); independently reviewed with 60 focused tests. Preserve old worktree unchanged.
- PR #289 removes learner Delete control/wiring, branch `fix/277-remove-topic-delete`, commit 5bec02e. Root reviewed; 109 focused units, 65 browser passes/3 expected skips, TypeScript clean. Full CI pending.
- PR #290 bundles reviewed Library #274/nav #275 commits plus Home #288: existing topic glyphs centre rings and readout icons sit beside values. Head ae5e3be after fixing the stale cross-surface visible-quantity selector; TypeScript, 7 Home units, 12 Home/Library browser cases and final 4-viewports Home rerun pass. Independent agent review found no blockers. Full CI pending.
- New issue #288 records the last two Home icon requests. Do not omit them.
- Other owner branches: #285 recognition domain, #284 haptics, #282 haptic scope, #278 CI scope and #214 IndexedDB all currently have green checks, but require their separate review/integration. #284/#282 target old feat/ui-overhaul. Do not claim runtime speed UI or physical acceptance shipped.
- Other-branch review found and fixed PR #285 stale answers after a different prompt: 4097de4, 23 focused tests/TypeScript pass; CI rerunning, PR remains draft and domain-only. PR #214 review found two P1 blockers despite green CI: overlapping owner binds can publish stale account/copy unclaimed data, and Test/lesson completion screens do not await async durability. Review recorded at https://github.com/BenWassa/argus/pull/214#pullrequestreview-5622828850 ; no storage branch edits made.
- Combined local preflight on review/queued-ui-integration-20261022 merges requested four PR heads cleanly; 2,029 units and build pass. Full browser suite running; only old Roles lazy-decode race seen and passed on retries. After completion merge test-only 6fad5ec and rerun Roles. Final combined tree must match eventual main before claiming tested integration.
- Reviewed captures copied to ignored export/queued-ui-2026-10-22/ (Home390, Roles390, desktop detail), with primary edit backups and README/CI-scope originals. Backup branch backup/main-before-queued-ui-20261022 retained.
- Never overwrite primary README.md or untracked CI scope doc. LibraryPage.css, TopicGauge.tsx, AppShell.tsx live changes are our reviewed copies; TopicPage.css includes our temporary hide-Delete stopgap. Consume only verified own edits when updating main after green merges.

## Earlier queued Codex UI requests (historical checkpoint)


The owner means queued Codex messages, not the historical GitHub backlog. Do not start unrelated old backlog work. The owner explicitly authorized GitHub issues, subagent delegation, end-to-end implementation, and significant commits.

- #274 Library full-width progress/no visible numeric quantities: agent branch fix/library-full-width-progress, reviewed commit 056599d; integrated as f1a050b. Meaningful browser checks passed four viewports plus 200% text (8 cases); 23 focused unit checks and typecheck passed. DESIGN.md owner rule updated. Learned remains visible; numeric readings stay screen-reader-only.
- #275 Home/Roles navicons: agent branch fix/home-roles-icons, reviewed source 0f81592 and provenance 232d793; integrated as f93b4ec and ba5e713. Lucide house/medal, exact pinned ISC notice verified, no new dependency, Library unchanged. 44 navigation browser checks and typecheck passed.
- Existing #223 reused for the newly reaffirmed Roles collection: remove dropdown, compact all-role badges with locked/earned status, centered desktop modal and roomy mobile details. Issue body was updated to current permanent-learning/Slate decisions. Agent roles_collection is implementing in /private/tmp/argus-roles-collection-20261019 on feat/roles-badge-collection, owns routing/roles/sharedDialog plus focused tests and new maintained role doc. No Pixel acceptance fabricated.
- #276 global one-pass learning: owner explicitly answered “Lessons complete → Learned; Test optional.” Agent learn_once in /private/tmp/argus-learn-once-20261019 on fix/learn-lessons-once is implementing monotonic lesson completion, no forced consolidation/repeated passes, no fabricated Test evidence. It owns learning PRODUCT/progress/Morse contracts and relevant tests. This overrides prior only-Test-completes-topic for lesson curricula; ordinary topics have no lessons and keep their current one-Test route. Root owns PRODUCT Roles paragraph reconciliation.
- #277 remove learner topic Delete: agent nav_icons reassigned to /private/tmp/argus-no-delete-20261019 on fix/remove-topic-delete-ui. It owns TopicPage/LibraryPage deletion wiring and relevant navigation tests, not backend deletion. Profile Reset outside scope. Root applied a small temporary .topic-delete display:none rule to primary TopicPage.css so the dangerous action is immediately absent; replace/consume this own working override once reviewed removal is integrated. Root must reconcile stale Delete guidance in DESIGN.md.
- Integration worktree /private/tmp/argus-queued-ui-20261019, branch fix/queued-ui-followups. Review and integrate agent commits, reconcile Roles DESIGN/PRODUCT guidance, then one reviewed green-CI PR to main for compatible queued changes. No PR opened yet; collect further queued messages as they arrive.
- The primary main devserver localhost:5174 already displays exact reviewed working copies of LibraryPage.css, TopicGauge.tsx and AppShell.tsx from integration for immediate local use. Before final main fast-forward, verify these still equal the integrated files, then consume only those own working edits. Preserve unrelated README.md and docs/open/ISSUE_CI_TESTING_SCOPE.md edits. No primary main commit was created for these pending changes.

## Sticky Back follow-up completed, 2026-10-19

The owner withdrew the app-wide style sweep after seeing the overhaul was already present. Only the Morse sticky-header fix was made.

- Reviewed PR #272 was squash-merged after CI web, browser, rules and demo build passed. Main and the primary checkout are now `1c383f2372c3683899f8e111c0eb715fc02012e5`; reviewed/merged tree `a621fae3a5f48d2f07fa5634cfe26573821fef8b`. Branch `fix/app-style-consistency` was retained.
- Back stays visible in the compact Morse header beside the title and A–Z, including short landscape. Focused browser checks passed at all four viewports, including 200% text and clicking Back after scrolling; 96 focused unit checks passed. Full CI passed.
- The normal main dev server remains localhost:5174 (session 36742); its temporary CSS working edit has been consumed by the fast-forward. Unrelated new README.md edits and docs/open/ISSUE_CI_TESTING_SCOPE.md were left untouched.
- Twenty new captures passed, including four Verdana landscape captures: `export/ui-signoff-2026-10-19-sticky-back/index.html`. They supersede the old Morse topic viewport captures. Reproduction script is copied into that folder; scratch source is `/private/tmp/argus-ui-consistency-20261019/.shots/capture-sticky.mjs`.
- Port 5495 still serves the older pre-sticky-fix preview. Rebuild the latest main candidate before the outstanding physical Pixel sign-off. Production release remains pending; no deployment was made.

## Latest update: main dev server delivered, 2026-10-19

This update supersedes the prior main-integration gate and preview-only instructions below. The owner explicitly requested the latest UI in the normal dev server running from main.

- Reviewed PR #271 was squash-merged into main as `573051176751f849fbf693e5908a26f52ad6b79d` after CI web, browser, rules and demo build all passed. Branches retained. The main tree equals the reviewed/tested tree `bafa895197ee67630f58c3844c2349ea98c69f36`.
- Main's #224 Morse modularisation and docs relocation were integrated with the overhaul. The full final `npm run check` passed: 157 unit-test files, 2,026 unit tests, production build/typecheck, 507 browser passes and 37 viewport-specific skips, no failures.
- Primary checkout now runs main at that merged commit. Normal dev server is `http://localhost:5174/`, exec session 36742. The original Opera tab was reloaded and the new Morse path and four mode colours were verified with its existing 26/26-letter progress. No browser learner data was cleared.
- Prior local main commits are preserved on `backup/main-before-ui-20261019` at `956d82d`. All previous uncommitted edits, including untracked files, are in stash commit `43a0e81a05994720e855165a71e1fada53d1164e`, also pinned by `backup/wip-before-ui-20261019`. Its tracked diff checksum matches the pre-update working diff. Do not blindly reapply this stash: some edits target UI superseded by the overhaul. The old handoff and untracked Morse test are in that stash's third parent.
- Real Pixel acceptance is still outstanding. The #225 plan remains accurately open; after acceptance, update results, close out the plan and issue checklist, then release through the release workflow. Production was not deployed. Keep #237 and #269 open. Delete this temporary handoff only when the entire workstream is finished.

## Codex resume update, 2026-10-19

This update supersedes the original in-flight instructions below.

### Completed

- PR #268 reviewed, all three CI jobs green, squash-merged into `feat/ui-overhaul` as `483f94d`. No branches deleted.
- Owner changed the product policy: learned stays learned, with no decay/repair or mandatory extra learning after completion. Home Continue should enter the top unfinished topic's canonical next task. Keep the sign-in image; replacement issue #269 is open with pinned documentation, assets, implementation and auth requirements.
- PR #270 implements that decision, reviewed and all three CI jobs green, squash-merged as `d03a07d25e2a43ce5adda314eea28a1231169f36`. It preserves completion and actual Test scores, reads old repair records as learned, removes required current Test from learned Morse, updates Home Continue and all affected maintained contracts, and archives the superseded progress architecture under `docs/closed/PROGRESS_ARCHITECTURE_2026_10_19.md`.
- Full local `npm run check` passed: 156 unit-test files, 2,014 unit tests; TypeScript and production build; 507 browser tests passed, 37 viewport-specific skips, no failures. CI web, browser and rules passed. The merged tree is identical to the reviewed/tested source tree `103428311fd85654a75121e5bc3c9fdb1d97dd2c`.
- Final merged-head captures passed: 31 screens at 390, 320, 1280 and 740x360 (124 PNGs), plus 31 additional landscape captures with Verdana. Zero capture or horizontal-overflow failures. Original 108-screen captures are an obsolete pre-simplification baseline.
- Final artifacts in the primary checkout: `export/ui-signoff-2026-10-19-permanent-learning/index.html`, `review-overview.jpg`, `metadata.json`, `VALIDATION.txt`, `capture-source.mjs`, all PNGs and `verdana/`. ZIP: `export/argus-ui-signoff-2026-10-19.zip`.
- `wt-cap/.shots/capture-permanent.mjs` is the current 31-screen capture script. `capture.mjs` documents the old 27-screen baseline. Both have been executed; the original handoff's "never run" note is historical.
- Integration worktree `argus-overhaul` is fast-forwarded to `d03a07d`; clean. `wt-simple` / `fix/permanent-learning` is clean at reviewed head `7b77f61`. Both fix branches are retained locally and remotely. The primary checkout's unrelated edits remain untouched.

### Remaining

1. **Owner Pixel sign-off is the next gate.** Do not skip it. Current preview serves merged `d03a07d` from `wt-cap` on port 5495, process session 98820, reachable on the same Wi-Fi at http://192.168.1.178:5495/. This is a local-only production build, without sign-in/sync. This is the only preview started by Codex that remains running; rehearsal port 5499 was stopped.
2. After owner sign-off, update `docs/open/ISSUE_225_UI_OVERHAUL.md` with #270, final captures/results and acceptance. Move it to `docs/closed/`, update every repository link and accurate banners, then close the overhaul issues from the original checklist. Keep #237 and #269 open. Last critique scores are still Morse 31/40 and rest of app 30/40; no third critique was run.
3. Final reviewed, CI-green squash PR `feat/ui-overhaul` -> `main`, final full check and release through the release skill. Never delete branches. Keep this temporary handoff until the entire work is finished.

The three former owner questions are resolved; do not ask them again or restore repair/decay behavior.

## Original handoff (historical)

## State in one paragraph

All overhaul work is merged into the integration branch `feat/ui-overhaul` (not yet in `main`), except one branch of review fixes (below). Critique scores: Morse 24/40 baseline, 29 round 1, 31 round 2 (target 32); rest of the app 28 then 30. Round-2 fixes (#263 Morse, #264 topics/Test/Practice) are merged (#265, #267). A third critique has not been run; the owner's Pixel sign-off is the real gate.

## In flight: finish this first

Worktree `/private/tmp/claude-501/-Users-benjaminhaddon-Github-Repos-argus/8936a322-c1f8-4686-932c-1bf5c6aa47bc/scratchpad/wt-fix1`, branch `fix/morse-safe-runs` (temp path; if gone, the branch may need re-creating from the notes below).

- **Committed** on that branch (+ synced with `origin/feat/ui-overhaul` after #267): runs never ask untaught letters (session.ts, Sprint/Ladder readiness), startable send levels always have a non-empty task (`eligibleSendPool`, SendRun reason frame), route equality compares letter-practice `direction`. These came from an independent Codex code review.
- **Uncommitted** on that branch (Codex, two passes): SessionFrame title is a focusable `<h1 tabIndex=-1>` that takes focus on mount only when focus is on body; session prompts demoted to `h2` (30 files, copy and look unchanged); Practice tile launches exactly the items it counts (`TopicPage.tsx` passes ids); dead Fluency CSS removed.
- **Verified:** `tsc` clean; vitest 2,007 passed; full Playwright locally 503 passed, 0 failed, 37 skipped (viewport-gated).
- **Next:** review the diff, `git add -A src e2e`, commit (end the message with the Co-Authored-By line the harness asks for), push, open a PR into `feat/ui-overhaul`, wait for CI green, squash-merge.
- If it conflicts after a merge: this repo hits a recurring squash-merge artefact (branch contains commits whose squashed twin is already on integration). Fix by 3-way merging each conflicted file against the common starting tree: `git merge-file -p ours base theirs` with `base` taken from the branch's starting commit; hand-resolve only the real conflicts.

## Remaining, in order

1. Land the branch above (PR, CI, merge).
2. **Sign-off captures.** A Codex-written script exists at `.../scratchpad/wt-cap/.shots/capture.mjs` (README beside it): `node .shots/capture.mjs <baseUrl> <outDir>`. It was syntax-checked, never run. Run it against a dev or preview server on the merged head, fix any screen that fails, and send the owner the images (every screen at 390, 320, 1280 and 740x360).
3. **Owner Pixel sign-off** on a real device. Do not skip.
4. **Owner questions** (also on #225; none blocked work):
   - After a failed repair Test on a once-completed topic, should it stay "Needs repair"? Today `resolveAttempt` sends it back to "learning" (so NATO reads "Ready to test" and can fall off Home's top three). Recommendation: stay in repair. It is a scheduling change, so it needs the owner's yes. UI already shows copper ◆ on missed items and "22 / 26 · 4 to practise".
   - Sign-in hero art is the rugged "handbook" look PRODUCT.md calls an anti-reference and carries a small generator mark. Keep, crop or replace? Asset untouched.
   - Home's single yellow action: "+ Add something to learn" (built) vs "continue" on the top active topic.
5. Optional: a third critique (impeccable `critique`, product register) targeting Morse >= 32/40. Open items it would check: single-dit letters (E) are a small lone dot; Home ranking can still push a failed-repair topic out of the top three (domain `dueEntries`, same owner question).
6. **Close out docs** (AGENTS.md lifecycle): update `docs/open/ISSUE_225_UI_OVERHAUL.md` Results (add #263/#264 as #267/#265, the review fixes, final scores), then move it to `docs/closed/` with an accurate banner; update links in README.md and docs/open/README.md; `docs/open/ISSUE_221_MORSE_UX_CONSOLIDATION.md` banner. Close issues #225 to #233 and #242 to #248, #257 to #259, #263, #264 (some auto-close; check). Keep #237 (light mode, parked) open.
7. **Final PR `feat/ui-overhaul` -> `main`** (about 310 files). Run `npm run check` (full gate) first. Then release with the `/release` skill (versioning, deploy). Note `main` has unrelated local uncommitted changes in the primary checkout; do not touch them.

## Rules and gotchas

- **Merge gates (owner rule):** merge only reviewed PRs, CI green, squash-merge; never delete branches (the owner does); never merge a PR you did not review.
- **Product invariants:** only Test writes formal evidence/acquisition/completion (Practice and Morse modes write none); nothing reads a clock; no XP/streaks; 44px targets; reduced motion; no page overflow at 320px or 200% text. Owner hates accordions and tile subtitles; solid fills only (no alpha, gradients, blur; `src/styles/solidSurfaces.test.ts` enforces it, including opacity); yellow only for the one action and the position/done spine; copper only for decay with a ◆. No forced path: levels stay open but draw only taught letters.
- **Playwright:** run with a unique `ARGUS_E2E_PORT`; it overwrites `docs/open/assets/morse-221/*.png`, so run `git restore --source=HEAD --worktree docs/open/assets/morse-221` after. Linux CI fonts are wider than macOS: check landscape-short (740x360) with `* { font-family: Verdana, sans-serif !important }` injected. A pre-merge unclosed CSS brace once broke every stylesheet; `src/styles/stylesheets.test.ts` now parses all CSS.
- **Codex recipe:** binary `~/.vscode/extensions/openai.chatgpt-*/bin/macos-aarch64/codex`; `exec -C <worktree> -s workspace-write --ephemeral -o out.md "<prompt>" </dev/null`; one worktree per job with `cp -cR node_modules`; no commits or Playwright inside Codex, review and commit yourself.
- **Key code:** kit in `src/shared/ui/` (ScreenHeader, ProgressSpine, ModeTray, Plate, SessionFrame); Morse domain `src/domain/morse/modes.ts` and `curriculum/progressPath.ts`; Morse UI `src/features/morse/play/`; topic page `src/features/library/TopicPage.tsx`, `topicItems.ts`; `Attempt.missedItemIds` (Test only) in `src/domain/library/topic.ts`.

## Merged so far (for reference)

#235 #236 #238 #239 #240 #241 #249 #250 #251 #252 #253 #254 #255 #256 #260 #261 #262 #265 #266 #267. Old unrelated open PRs #214, #222 are not part of this work.

## Local-only leftovers

Many worktrees and dev servers (ports 5391 to 5471) from this session live under the scratchpad directory above; they are safe to delete (`git worktree prune`). Branch deletion is the owner's call.
