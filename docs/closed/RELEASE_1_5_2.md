# Release v1.5.2

**Status:** released 2026-10-15; Firebase Hosting deployed and live asset bytes verified. Human device/domain acceptance remains open.
**Authority:** historical release record. Maintained behavior contracts and the [human acceptance checklist](../open/HUMAN_ACCEPTANCE_CHECKLIST.md) govern continuing work.

## Scope and source

Release tag `v1.5.2` points to `65d3d45c421ce91aaba8e013595517e8bfa7a8a0`. Owner-authorized merges: #220 status reconciliation, #212 retained Morse design reference, #219 staged Analyst/reviewer packs, #218 Mariner plus approved Communicator PNG replacement, and #215 bounded embedded Morse Play/direct mode access. Prepared documentation cleanup was included.

#214 and the active #113 migration/outbox lane remain excluded. Full offline-first operation is not claimed. Analyst topics and scuba photo candidates remain outside the learner catalog. CAF insignia reproduction remains blocked pending written permission. Mariner's existing owner delivery waiver does not clear independent maritime review; PNG approval does not establish flag/Morse symbol accuracy.

## Verification

The repository composite gate `npm run check` passed on integrated source `08ee4f2`: 1,697 unit tests across 129 files, TypeScript/production build and 453 browser tests across four viewports, with 19 expected skips. Subsequent changes before tagging were documentation closeout and version metadata only. The deploy script rebuilt production at the release tag, with real Firebase configuration. App-shell precache remained within the configured 5 MiB budget at approximately 4.92 MiB.

`npm run deploy:hosting -- --project argus-b7a5a` completed. Hosting version: `1bab793d8526f34c`. Production: https://argus-b7a5a.web.app. No Firestore rules/index changes relative to v1.5.1; no rules deployment.

Live verification fetched HTML, its referenced main JavaScript and `/sw.js` and compared each byte-for-byte with the deployed `dist/` files. Main bundle `/assets/index-DXOVpJp9.js` and service worker both served `text/javascript`. HTML served `Cache-Control: no-store, max-age=0, must-revalidate`.

The production sign-in gate rendered at 390px with the “Continue with Google” action and no page runtime errors. This smoke check did not authenticate or grant device acceptance.

GitHub Pages is a separate CI-managed demo target. The release workflow completed successfully. Live demo HTML and `/argus/assets/index-D66LL_Vw.js` matched the locally rebuilt v1.5.2 demo byte-for-byte, and the JavaScript MIME type was correct. The remote Argus CI run was still in progress at closeout; the local full composite gate above had passed.

## Remaining acceptance

Use the [single checklist](../open/HUMAN_ACCEPTANCE_CHECKLIST.md) for Pixel/PWA navigation, timing/audio/interruptions, badge fidelity/symbols, maritime/radio expertise, Analyst blind/source review, scuba equipment imagery and CAF permission. No human acceptance box was checked by this release. The [PR-review closeout](PRE_RELEASE_PR_REVIEW.md) records the #214 remote-adoption durability blocker and review evidence.
