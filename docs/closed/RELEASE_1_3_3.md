# Release v1.3.3

**Status:** shipped and verified, 2026-10-03.
**Authority:** historical release evidence. Maintained contracts are [compact topics](../open/LIBRARY_COMPACT_TOPICS.md), [topic-page revamp](../open/TOPIC_PAGE_REVAMP.md) and [progress architecture](../open/PROGRESS_ARCHITECTURE.md).

Release tag `v1.3.3` points to `abfde3e` on `main`. #175 merged as `e73215c`. The full 19-topic compact-copy project, centred sources/limitations modal, visible survival scopes, guarded library refreshes and topic-page/Test prerequisite are deployed. The prerequisite includes the approved Beaufort and Cloud Genera guides. Production colours remain the current palette; external hero artwork is separate follow-up work.

## Review and gates

The owner instructed “review pass then run release”. [The completed source/code review](COMPACT_LIBRARY_REVIEW.md) records the delegated review and fixes: Juliet’s dangerous-cargo qualifier, explicit refusal of a closed firearm in the handover case, and regular ABCDE reassessment. Scored wording and original source lists remain unchanged.

The first `npm run check` stopped on an existing Free Play wall-clock test: a scheduling stall finished a letter between key events. The test passed in isolation. Commit `75b0c9e` makes its clock deterministic and asserts the actual letter-pause boundary; product keying and curriculum behaviour are unchanged.

The final, unmodified composite release gate passed on `main` with the configured default worker count:

- 1,602 unit tests across 116 files;
- TypeScript and production Vite build;
- 348 Playwright cases across 320 px, 390 px, short landscape and desktop, with 16 intentional viewport/route skips and no failures.

The version bump changed only `package.json` and `package-lock.json`. The annotated tag and `main` were pushed. Firebase Hosting deployment used the repository `deploy:hosting` script with the existing production target `argus-b7a5a`. No Firestore rules, renderer/template or indexes changed since v1.3.2, so no rules deployment was performed.

## Live verification

- Production: https://argus-b7a5a.web.app
- Bundle: `/assets/index-BkfM8mmP.js`, served as `text/javascript; charset=utf-8`.
- Bundle SHA-256: `679b8be0a0033067382fe828cd9bc4892d43a46b2ed7f694cfdb843ac217589b`.
- The live HTML, JavaScript and service worker are byte-identical to the deployed release artifacts; the bundle carries build ID `abfde3e` and the production Firebase project configuration.
- App shell and service worker return `Cache-Control: no-store, max-age=0, must-revalidate`.
- A clean 390 px browser context shows the production “Continue with Google” gate, with no horizontal overflow or uncaught page errors. No account sign-in or learner-data mutation was performed during this smoke check.

Issue #166 is closed by merged #175. Stacked review PRs #169, #171–#174 are closed as superseded slices after verifying their heads are ancestors of `main`; #167, #168 and #170 are included through the merge. Their individual branches were retained.
