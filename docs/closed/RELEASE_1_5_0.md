# Release v1.5.0

**Status:** released and verified, 2026-10-07 (America/Toronto).
**Authority:** historical release and deployment evidence. Maintained contracts remain under `docs/open/`; this record does not claim real-device acceptance.

Annotated tag `v1.5.0` points to `04ae10d` on `main`. The owner requested a full release after the Roles artwork refinements, superseding the earlier merge-only deployment hold.

## Integrated feature scope

- Morse: formative guided Send (Spotlight words, Word flow, Phrases, Short messages and fictional Dispatch), corrected viewport/spacing checks and pause handling during a held dah. Sending bests remain separate from Test evidence.
- Home: truthful completed/in-progress/last-active readout, three prioritized active topics, finite or discrete neutral progress dials, shared capture lifecycle and responsive raised navigation. Existing `today` history remains compatible.
- Roles: Home · Roles · Library navigation, one Communicator designation, three open pathways and seven required catalog topics. The badge derives from permanent completion, survives retention decay and exposes refresh separately; it is not a professional credential.
- Artwork: editable vector medallion, source-only PNG retained outside runtime files, vetted A (`.-`)/Z (`--..`) Morse and N/Z/V/A international flags, symmetric evenly spaced radio arcs and a balanced eight-point compass rose. Badge loading respects the demo base path.

No library schema, scheduler, scored item inventory, Firestore rules or index changes. Other roles, formal Morse sending proficiency, in-course sending entry and further sending modes remain deferred.

## Release gate

The repository's unmodified composite `npm run check` passed on the integrated feature source with the normal configured worker count:

- 125 unit-test files / 1,654 tests passed.
- TypeScript and production build passed; offline footprint approximately 3.11 MiB. Existing large-chunk warnings remain.
- 389 Playwright tests passed across 320 px, 390 px, short landscape and desktop; 19 expected skips, no failures (3.6 minutes).

The subsequent reconciliation changed documentation and the asset manifest's descriptive QA fields. The minor version bump changed only `package.json` and `package-lock.json`, with no dependency updates. The demo build and its artifact checks passed: `/argus/` base path, no service worker, no embedded Firebase project configuration, no source-reference PNG. Production was rebuilt from tagged commit `04ae10d` by the configured `deploy:hosting` script. Post-push CI runs separately from this verified local release gate.

## Deployment verification

Firebase Hosting deployed to [https://argus-b7a5a.web.app](https://argus-b7a5a.web.app). Live HTML, JavaScript, service worker, SVG and asset manifest were byte-identical to the release files.

- Build ID: `04ae10d`; app version: `1.5.0`.
- Bundle: `/assets/index-9Yw3suHp.js`, served as `text/javascript; charset=utf-8`.
- Bundle SHA-256: `8da217622c0577a881a0febbe2b5f083a9c3668346c270639d0aae3799aea375`.
- SVG SHA-256: `6ecd594575402b242b1aff19c270669d9801edcf4ef66b3f106cf2cbdf29e0f2`.
- HTML, service worker and mutable SVG returned `no-store, max-age=0, must-revalidate`; hashed bundles retain immutable caching.
- Clean 390 px production smoke check rendered the Google sign-in gate without uncaught page errors or horizontal overflow. No account sign-in or learner-data mutation was performed.

The disabled `demo-pages.yml` workflow was restored to active for this release. [Pages deployment run](https://github.com/BenWassa/argus/actions/runs/37721937567) succeeded for `04ae10d`. The [live demo](https://benwassa.github.io/argus/) reports version 1.5.0/build 04ae10d in its bundle, opens Communicator with seven topic rows, successfully decodes the matching SVG under `/argus/`, and has no page errors or horizontal overflow at 390 px.

- Demo bundle: `/argus/assets/index-KG6WOjJ0.js`.
- Demo bundle SHA-256: `4794ad86e6d1bc22b84777d5fbabadc036b9e2ea7af1b1a02cd2f897ac11dbbe`.

Firestore rules and indexes were unchanged from v1.4.0, so no rules deployment was performed. Firebase remains manually deployed; restored Pages automation may publish subsequent main commits independently.

## Remaining acceptance

The owner authorized releasing the integrated feature. Real Pixel verification is still unperformed: continuous Morse pauses/word gaps, first-press sound, cancellation/backgrounding, installed-PWA navigation and high-DPI artwork rendering remain device checks. Automated browser coverage and desktop SVG review must not be described as that acceptance. Final subjective artwork acceptance remains with the owner.
