# Release v1.5.3

**Status:** released 2026-10-16; Firebase Hosting and the separate Pages demo deployed and live asset bytes verified. Physical Pixel acceptance remains open.

**Authority:** historical release record. Maintained Morse behavior is documented in [#221](../open/ISSUE_221_MORSE_UX_CONSOLIDATION.md), [Morse Fluency](../open/MORSE_FLUENCY.md) and [progress architecture](../open/PROGRESS_ARCHITECTURE.md).

## Source and scope

Tag `v1.5.3` points to `a733ec0e05923d7e712f0d8bc6ff2c09ef58275e`; implementation commit is `fdabf9b`. The owner explicitly requested full verification, commit, push and release.

This release adds one-tap adaptive Key/Read/Listen letter practice with event-order scheduling and separate formative persistence. It consolidates character correction and reference content around canonical notation, rhythmic mnemonic and shared audio, simplifies Morse Topic navigation, and preserves direct access to every existing Send stage, Receive level and recognition mode. Formal acquisition, Test evidence, roles and completion remain separate from practice. Single-letter targets and unambiguous word substitutions receive consistent support; ambiguous multicharacter shifts do not invent a culprit.

The separate #113/#214 IndexedDB migration lane is excluded. No Security Rules or indexes changed, and none were deployed.

## Verification

The repository composite gate `ARGUS_E2E_PORT=4197 npm run check` passed on the integrated implementation: 1,732 unit tests across 134 files, TypeScript/production build, and 465 browser tests across four viewports, with 19 intentional skips. The first composite attempt lost its default-port preview server; the isolated-port rerun passed without reduced workers or weakened assertions. The separate `npm run test:rules` passed all 33 emulator tests. Version metadata was then bumped using the repository release recipe.

`npm run deploy:hosting -- --project argus-b7a5a --non-interactive` rebuilt the tagged production source with Firebase configuration and deployed Hosting version `595bf9ab62841e1f` to https://argus-b7a5a.web.app. The offline app shell remains approximately 4.93 MiB, within its configured budget.

Live HTML, `/assets/index-Cu0HHL6g.js` and `/sw.js` matched the deployment's local `dist/` files byte-for-byte. Main JavaScript and service worker served `text/javascript`; HTML served `Cache-Control: no-store, max-age=0, must-revalidate`. The production sign-in gate rendered at 390px with Continue with Google and no page runtime errors. This smoke did not authenticate or establish physical-device acceptance.

The separate [Pages workflow](https://github.com/BenWassa/argus/actions/runs/38978689092) deployed successfully. Live demo HTML and `/argus/assets/index-COmtqDtW.js` matched the local v1.5.3 demo build byte-for-byte; the bundle served JavaScript. Production and demo are independent deployments.

Hosted CI results are recorded by the [Argus CI workflow](https://github.com/BenWassa/argus/actions/workflows/validate.yml) for the release and documentation-closeout commits. The closeout changes documentation only; deployed source and tag remain unchanged.

## Remaining acceptance

Physical Pixel touch/audio/interruption acceptance for #221 and the existing #188 flows remains outstanding. This release does not check any physical-device or independent-domain acceptance box. See the [human acceptance checklist](../open/HUMAN_ACCEPTANCE_CHECKLIST.md) and #221's browser captures and acceptance matrix.
