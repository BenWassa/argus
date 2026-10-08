# Next release review

**Status:** combined Morse + Home selected by owner on 2026-10-07; implementation merged via #195; Communicator Roles subsequently merged via #196; deployment remains held, no release/deployment performed.
**Authority:** repository/GitHub review as of 2026-10-07; feature contracts and current checks govern implementation.
**Baseline:** main `e7c609f`, package/tag `v1.4.0` (`23a5673`).

## Current position

Local main was fast-forwarded to remote main. The four commits after v1.4.0 are documentation for roles (#191), custom badges (#192), and the selected Home redesign (#193 and #127). No runtime feature has landed since the release tag.

v1.4.0 includes Canadian radio text (#184), Cloud Genera and radio topic icons (#186/#187), and the duplicate-import fix (#190). Radio adds three topics and 28 scored items. #150 remains open, and its contract still requests independent answer-key review. The library roadmap previously called this work source-blocked; that stale entry is corrected with this review.

Latest main CI and demo workflow passed: [main CI](https://github.com/BenWassa/argus/actions/runs/37678310155). GitHub has version tags but no published GitHub Releases. Firebase deployment is manual; this review does not establish the live production build or verify v1.4.0 deployment.

## Release choices

Versions below are proposals, not reservations.

| Option | Proposed version | User-visible result | Readiness / required work |
| --- | --- | --- | --- |
| Hold at current baseline | v1.4.0 | Keep current library and interactions | No new runtime on main warrants another feature release. Verify live Firebase build and reconcile radio acceptance before the next release. |
| Focused Morse release — recommended first | v1.5.0 | Spotlight words, word flow, phrases, messages and fictional Dispatch within formative Fluency | [PR #194](https://github.com/BenWassa/argus/pull/194) exists. Fix browser failures, reconcile design contract [#189](https://github.com/BenWassa/argus/pull/189), verify continuous sending on a real phone, and rerun full gates. |
| Focused Home release | v1.5.0 if first; otherwise v1.6.0 | Home readout, active topics, circular progress, existing capture flow and rounded mobile navigation | #193 has selected scope, but no implementation PR in the reviewed open-PR list. Preserve completion/evidence semantics and validate responsive, keyboard and reduced-motion behavior against its contract. Can ship independently of Roles. |
| Combined Morse + Home | v1.5.0 | Both improvements in one release | Wait for both independent acceptance gates. Larger interaction regression surface and slower delivery than a focused Morse release. |
| Roles and custom badges | Later minor release | A third destination with finite role requirements and original badge art | #191 is design/scoping; taxonomy, earned/freshness semantics and owner approval remain required. #192 depends on that model and visual approval. Not implementation-ready. |

## Selected combined candidate

Owner selected **Morse + Home** on 2026-10-07. Branch `feat/morse-home-release` integrates #194 and #189 and implements #193. The original five Morse failures are addressed: listening-spacing assertions now match the control, and the sending session no longer inherits a second top gutter. Continuous sending also suspends idle-letter segmentation during pointer holds. Home uses true finite ratios or discrete dials, historical completion counts, existing durable study timestamps and shared capture.

The proposed release remains v1.5.0. No version bump, tag, release publication or Firebase deployment has occurred. Full candidate verification and owner real-device review are recorded in the PR/validation follow-up; keep #188/#193 open until that acceptance is complete.

## Candidate blockers and later work

- **Original Morse #194 CI (before combined fixes):** reviewed CI has 371 browser passes, 5 failures and 16 skips. Four failures cannot find the expected Spacing label; the new sending test finds 870 px page height in an 844 px viewport. Unit/build, rules and demo build checks passed. [Failing run](https://github.com/BenWassa/argus/actions/runs/37680782972). These observations identify failures, not a verified root cause or code review approval.
- **Radio audio #151:** reusable runtime exists; text foundation is now available. Voice bake-off/model access, human listening QA and transcript behavior in scored Test remain unresolved. #151 is absent from the current open-issue list despite production work remaining in its document; reconcile tracking before scheduling it.
- **Offline-first #113:** active architecture work, not a current product guarantee. Treat persistence migration, durable sync and offline startup as a separate release with explicit data-safety verification.
- **SCUBA #132:** asset scope needs a decision after the topic expanded from six to thirteen terms. Choose physical component references versus an annotated kit diagram before production.
- **CAF insignia #178:** prepared but rights-gated. Alternative-route research is open in #185; no visual release is ready.
- **Topographic literacy:** researched later candidate; requires a bounded implementation scope and cartographic QA.

## Before any next release

1. Confirm the live Firebase build, release tag and intended deployment baseline.
2. Resolve selected-feature blockers and reconcile related documents/issues; do not treat merged research or staged assets as a shipped feature.
3. Run the repository release gates on the exact candidate, including browser coverage and demo build; apply rules checks when relevant. Record phone validation for Morse input changes.
4. Review existing-library delivery, export/import and evidence preservation for affected features.
5. Record the final scope, version, checks and deployment evidence in a release closeout under `docs/closed/`; update repository links and this planning snapshot when superseded.

This review uses existing CI evidence rather than a fresh local test run. It does not merge PRs, publish a release or deploy.

## Owner deployment hold (2026-10-07)

Owner authorized #195 to merge but explicitly instructed not to deploy while the new Roles screen is added. Main now contains Morse + Home. GitHub Pages demo auto-publication is paused by disabling `demo-pages.yml`; Firebase remains untouched. See `MORSE_HOME_RELEASE_CANDIDATE.md` for the hold and workflow restoration record.

## Main catch-up (2026-10-07)

The owner authorized #196 to merge, including Communicator Roles, the layered SVG, the evaluation and demo asset-path correction. Main now includes Morse, Home and Roles. The earlier readiness table is a historical planning snapshot: Communicator is implemented, with automated gates passed and real-device/final-art acceptance still required before release. The deployment hold continues; `demo-pages.yml` remains disabled and Firebase remains untouched. See [Roles evaluation closeout](../closed/ROLES_SCREEN_EVALUATION.md).
