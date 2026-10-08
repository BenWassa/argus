# Combined Morse and Home release candidate

**Status:** merged via #195 on 2026-10-07; deployment held pending the forthcoming Roles screen.
**Authority:** owner instruction “do morse and home next” (2026-10-07), #188/#193 contracts, and the verification recorded below.
**Branch:** `feat/morse-home-release`, based on main `e7c609f`, integrating Morse runtime #194 and design contract #189.

## Result

- Guided formative sending leads post-alphabet Morse Fluency: Spotlight words, Word flow, Phrases, Short messages and fictional Dispatch.
- The sending session owns its viewport without an extra shell gutter. Listening-spacing assertions follow the actual control. Idle letter segmentation pauses during a held element, preserving a dit followed by a long-held dah as A.
- Home replaces the learner-facing Today label, with historical Completed, never-completed In progress and latest durable Last active readings. Repair never erases completion.
- Three active topics retain existing journey priority. Neutral dials show real finite acquisition/evidence ratios or discrete states; no artificial ordinary-topic percentage or redundant horizontal gauge appears.
- Home shares Library's capture lifecycle, opens capture directly when available, and otherwise uses the existing new-topic form. See all opens Library without authoring.
- Mobile navigation is inset, rounded and modestly raised; desktop keeps the attached rail. Existing `today` history remains compatible.

## Boundaries

No topic completion, scheduler, scored item inventory, schema version or Firestore rules change. Sending bests remain inside `morseFluency`, separate from Test evidence. No Roles/badges, radio audio, CAF insignia or offline-first claim is included. In-course sending entry, target replay and missed-letter sending rounds are later enhancements.

## Verification

- Initial focused browser run: 40 passed across 320px, 390px, short landscape and desktop; the five original Morse browser failures are cleared.
- Full unit suite after continuous-input fix: 123 files, 1,645 tests passed.
- Typecheck and production build passed. Build footprint: 3.08 MiB. Existing large-chunk warnings remain.
- Demo build passed.
- Full combined browser regression: 381 passed, 19 skipped (4.5 minutes). The skips are the existing viewport-specific exclusions plus the continuous sending check restricted to the 390px phone. Continuous sending and the long-held dah passed.
- Home visual inspection at 390px confirms selected hierarchy and restrained production materials. Browser coverage includes 200% text, reduced motion, repair and authoring fallback; unit coverage exercises ready-inbox capture without production writes.
- Import-boundary test preserves `send:words`, `send:flow` and `send:dispatch` bests.

## Remaining release acceptance

The owner authorized merging #195 on 2026-10-07 while explicitly withholding deployment until the forthcoming Roles screen. This overrides the earlier pre-merge Pixel gate; real-device verification remains pending for release/closeout. Verify continuous letter pauses, word gaps, first-press sound, cancellation/backgrounding and Home/navigation in the installed PWA. Automated pointer/keyboard tests cannot substitute for that hardware check.

No version bump, tag, GitHub Release or Firebase deployment has been performed. After acceptance, run final gates on the release commit, confirm the live baseline, and record deployment evidence in a closeout under `docs/closed/`. Keep the maintained Home/Morse contracts in `docs/open/`; move this candidate record when superseded and update links.

## Merge and deployment hold

PR #195 merged as `49ab1f6` after web, browser, rules and demo-build CI passed. Local main is synchronized. The integrated source PRs #194/#189 are superseded by this merge.

Neither Firebase nor the GitHub Pages demo was deployed. The `demo-pages.yml` workflow was disabled before the merge because pushes to main normally publish the demo automatically. Keep it disabled during the release hold; re-enable with `gh workflow enable demo-pages.yml` only when deployment is authorized, then explicitly run/verify the intended demo publication. Firebase Hosting remains manual.

Do not bump a version, tag or deploy just because Roles merges. The combined release scope and owner deployment instruction govern the next release.
