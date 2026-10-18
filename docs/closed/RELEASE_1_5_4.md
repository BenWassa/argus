# Release v1.5.4

**Status:** released 2026-10-17; Firebase Hosting deployment verified.
**Authority:** historical release record. The [Apple Home Screen investigation](../open/APPLE_PWA_GOOGLE_SIGN_IN.md) remains active; authentication remediation and physical-device verification are outstanding.

## Scope and source

The owner requested a patch release limited to the investigation changes. Tag `v1.5.4` points to `b0b2019d1bce03769724a70d8335e2a9e4ab9852`, on `release/apple-pwa-investigation-1.5.4`, based on `v1.5.3`. Investigation commit `ddd4f2f` is the isolated equivalent of `fc12236` in the original checkout.

The release contains the investigation document, its README links and package version metadata only. It does not fix Google sign-in. The unreleased UI overhaul (`464c36f`) and remote-main Morse refactor (`1b5e215`) are excluded. Main history was not rewritten or pushed; the release branch and annotated tag were pushed independently to preserve this scope.

## Verification and deployment

`ARGUS_E2E_PORT=4296 npm run check` passed: 1,732 unit tests across 134 files, TypeScript/production build and 465 browser tests, with 19 expected skips. Browser-generated tracked screenshots were restored before tagging. No application source changed from v1.5.3.

After the version bump, `npm run deploy:hosting -- --project argus-b7a5a --non-interactive` rebuilt the tagged source with the existing production configuration and deployed Hosting version `430ebba2143558f7` to https://argus-b7a5a.web.app.

Live HTML, `/assets/index-C2iHhzWb.js` and `/sw.js` matched local deployment artifacts byte-for-byte. JavaScript and service worker served `text/javascript`; HTML served `Cache-Control: no-store, max-age=0, must-revalidate`.

No Security Rules, indexes or Hosting configuration changed. Rules were not deployed. The separate Pages demo was not redeployed: its workflow deploys from main, and this isolated release does not change application source. No physical iPhone/iPad OAuth acceptance is claimed.
