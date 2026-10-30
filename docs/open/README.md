# Open documents — live work and unresolved gates

This folder contains maintained specifications, active implementation plans, and unresolved owner or independent-domain acceptance gates. It is **not** a one-to-one mirror of open GitHub issues: implemented visual programmes can still have independent review outstanding.

- **Active issues:** see [GitHub open issues](https://github.com/BenWassa/argus/issues?q=is%3Aissue+is%3Aopen), and individual maintained `ISSUE_*.md` files.
- **Consolidated human review:** [acceptance checklist](HUMAN_ACCEPTANCE_CHECKLIST.md), with links to reviewer packs and permission draft.
- **Morse UX consolidation:** [#221 practice/teaching contract and historical mobile evidence](morse/ISSUE_221_MORSE_UX_CONSOLIDATION.md); navigation superseded by the UI overhaul merged in #271, with Pixel acceptance outstanding.
- **UI overhaul (#225):** [scope, decisions, delivery map and critique results](ISSUE_225_UI_OVERHAUL.md); integrated into `main` in PR #271; 19 child implementation issues closed 2026-10-22, but owner Pixel/release acceptance still outstanding. Morse round 2: 31/40 against a 32/40 target.
- **Morse Fluency:** [runner, timing and evidence contract](morse/MORSE_FLUENCY.md), with historical hub navigation and the current four-mode integration mapping.
- **Learning progress:** [permanent completion and the unfinished-learning queue](PROGRESS_ARCHITECTURE.md), owner decision 2026-10-19. No decay or repair state; later Tests are optional.
- **Current implementation queue:** [NEXT_BATCHES.md](NEXT_BATCHES.md) (2026-10-22, replacing archived October 15 PR-status tables).
- **New Morse work:** [speed recognition #279](https://github.com/BenWassa/argus/issues/279), [shared haptics #280](https://github.com/BenWassa/argus/issues/280) and [physical Pixel haptics #281](https://github.com/BenWassa/argus/issues/281) remain open; [#282](https://github.com/BenWassa/argus/pull/282) is documentation only.
- **User-selected refinements:** [lesson completion #276](https://github.com/BenWassa/argus/issues/276), [Roles #223](https://github.com/BenWassa/argus/issues/223), [Library #274](https://github.com/BenWassa/argus/issues/274), [navigation #275](https://github.com/BenWassa/argus/issues/275), [remove Delete #277](https://github.com/BenWassa/argus/issues/277). The changes are scoped, not claimed merged.
- **Independent maritime review:** [#147/#148 review](ISSUE_147_148_MARITIME_DOMAIN_REVIEW.md). Implementations #147 and #148 are closed, but maritime approval and Mariner earnability remain outstanding.
- **Archived issue-specific contracts:** [docs/closed](../closed/README.md).

When an implementation issue is completed, move its historical issue specification to `docs/closed/` and update all repository and GitHub-issue references. Keep follow-on active work in separate open documents rather than leaving completed specs in this folder indefinitely. Do not equate a merged PR with independent domain, owner, real-device, or release acceptance.

- **Morse documentation hub:** [reading order, contracts and code maps](morse/README.md).
