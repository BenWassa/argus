# Roles screen evaluation

**Status:** Completed evaluation and main catch-up, 7 October 2026. Communicator MVP, supplied SVG and demo asset-path correction merged via #196 as `5482544`. No deployment or version change.
**Authority:** Historical assessment and merge record. Maintained role and asset contracts are [#191](../open/ISSUE_191_ROLE_DESIGNATIONS.md) and [#192](../open/ISSUE_192_ROLE_BADGE_ART.md); recommendations below preserve the assessment's original reasoning.

**Final checks:** 1,652 unit tests passed locally; eight focused Roles browser checks passed; full PR CI passed web, rules and 389 browser tests with 19 expected skips. Production and demo builds passed. Actual SVG decoding succeeded with the demo served under `/argus/`. The extra local full-browser run was stopped after full CI passed; it is not claimed as a completed run. Real Pixel and final owner artwork acceptance remain release checks. Automatic demo publication remains disabled, and deployment requires a separate explicit instruction.

## Main-branch starting point

`feat/roles-screen` starts from `main` at `fac05e5`, after the Morse and Home merge. Deployment remains on hold; the automatic Pages demo workflow remains disabled. This work must not create a release or deploy either build.

At that baseline the app had Home and Library navigation, with no Roles route, role definitions, or award records. The 24-topic shipped catalog and existing permanent `Topic.completedAt` provide a useful foundation. Learning activity, Morse sending bests, and formative practice are not role completion evidence.

## Communicator MVP review

The owner identified `public/media/roles/communicator.svg` on `feat/communicator-roles-mvp`. That branch also implements the Roles route/navigation, a single Communicator destination, three open pathways containing all seven requirements, catalog-provenance checks, and an earned badge that survives retention decay. It was integrated into the evaluation branch and merged into main via #196.

The SVG is 19,897 bytes, uses editable vector groups and gradients, contains no embedded raster, and matches the asset manifest's Git blob hash `49e4621a83ebaccdb88ddd9775d3e4eddb8374f8`. The screen renders the same gold/blue SVG with grayscale and brightness filters for the unearned state. Both states were visually inspected at 390 px: the central transmission mast, rim, compass and waves remain legible at the screen's approximately 200 px display size. The artwork is a stylized reconstruction of the PNG reference, not an identical trace.

Focused verification passed: seven role/asset unit tests and eight Roles browser tests across the four configured viewports. Production and demo builds passed, with the existing large-chunk warning. These checks do not replace full regression or real Pixel acceptance.

**Resolved release defect:** `RolesPage.tsx` uses `/media/roles/communicator.svg`, which fails to load when the demo is served under `/argus/`. The same asset returns HTTP 200 at `/argus/media/roles/communicator.svg`. The integration follow-up resolves its URL using `import.meta.env.BASE_URL`, as existing audio/visual assets do. Both Roles browser scenarios now require successful image decoding, rather than element visibility alone. Demo decoding under `/argus/` passed before merge.

**Asset behavior limitation:** SVG-internal hover selectors cannot be driven by hovering its host `<img>`; the page's earned-image lift works, but the manifest's internal signal/compass hover interactions should not be claimed as verified runtime behavior. Inline SVG or another explicit interaction mechanism would be needed if those internal effects are desired.

The initial review changed no runtime code. The owner subsequently authorized the main merge; the follow-up fixes the asset URL and verifies decoding. No version change or deployment is authorized. Earlier recommendations below describe the initial proposal; this section records the subsequently located candidate.

## Recommended first scope

Ship one earnable role, **Communicator**, with a detail screen and seven required catalog topics:

- NATO phonetic alphabet (`nato-phonetic`)
- Printed Morse letters (`international-morse-letters-printed`)
- Radiotelephony numbers (`radiotelephony-numbers`)
- Radio procedure (`radio-procedure`)
- Marine VHF routine calling (`marine-vhf-routine-calling`)
- Marine VHF priority communications (`marine-vhf-priority-communications`)
- Signal flags (`signal-flags`)

All seven exist today. This is a finite Argus learning designation, not a professional qualification or a claim of operational radio competence. In particular, printed-letter Morse completion does not certify listening or sending proficiency.

Operator has eight plausible existing topics in #191, but its navigation/weather/OODA boundary still needs an editorial decision. Diver and Medic each have only one direct topic today; defer them rather than manufacture a broad completion claim. The current artwork supports Communicator only.

## Screen and state recommendation

Add `Home · Roles · Library`, following the existing raised mobile navigation and desktop rail. A role card opens a detail screen even while locked. The detail contains the badge, required-topic count, finite checklist, and a next-topic action into the existing topic route. Avoid XP, global ranks, and a second learning scheduler.

Derive initial states from required catalog-topic completion: locked at zero, in progress at one through six, earned at seven. Display explicit text alongside artwork. The supplied right-hand treatment means **earned**, not merely access to an unlocked screen. All incomplete states use the silver badge; checklist/count carries partial progress.

Repair must not revoke an earned role. Show “Needs refresh” separately when the existing retention state indicates it; never turn the earned badge silver again. Validate catalog provenance, so a user-authored topic with a coincidentally matching identifier cannot satisfy a role.

Freeze the first definition's required IDs for the initial release. Future additions need an explicit versioning policy. Deriving awards from current topic records alone cannot preserve them after deletion or replacement by an import lacking those records. If awards must survive those operations, a durable award model and its export/import/sync behavior must be designed first. Do not silently promise that stronger permanence.

## Supplied artwork assessment

**Owner clarification:** The PNG is a visual reference only. The SVG was subsequently supplied on `feat/communicator-roles-mvp` and is the intended production artwork. Do not crop, convert, or integrate the reference PNG as a runtime asset.

Source: local untracked `ChatGPT Image Oct 7, 2026, 10_23_13 PM.png`, 1774 × 887, approximately 2.6 MB, RGBA PNG. SHA-256: `5ca25a6a03586b02ff476959ea79f3524c0c0f2e251444d80aa48d39d65819d2`. The file is present in the checkout; it is not committed on local or remote `main`. Its original pixels have not been changed.

The combined sheet contains a silver **LOCKED** medallion and a gold/blue **EARNED** medallion, with baked-in labels and a visible navy backdrop. An alpha channel alone does not establish a usable transparent cutout. Radio tower, signal flags, Morse marks and maritime waves give Communicator a coherent identity. The tower reads clearly; the smaller flags, rope and Morse details need small-size checks.

Use this as the direction for a medallion family. The earned gold/blue palette is more expressive than #192's restrained steel proposal; preserve that owner-supplied direction in the artwork while keeping ordinary interface chrome within the existing design system. Start with a 96–128 px badge on the Roles card/detail, not a tiny navigation icon.

The supplied SVG has been inspected in both states at the actual mobile display size and on the app background. Check framing, small-detail legibility, and accessible state text in the interface. The PNG's background, labels, file size, and differences between the two drawings are properties of the reference sheet, not defects to fix or assumptions about the forthcoming SVG. No asset editing has been performed in this evaluation; generation prompt/model metadata is unavailable and must not be invented.

## Implementation gates

The smallest coherent next build is Communicator only, the supplied owner-created SVG with locked and earned treatments, a finite checklist, existing topic navigation, and separate refresh status. The MVP implements that structure with three open pathways; real-device artwork acceptance remains a release check. PRODUCT/DESIGN now contain the narrow Roles exception; other progress and anti-gamification rules remain authoritative.

Before release, verify empty/partial/earned/refresh states, catalog provenance, import/deletion behavior, route/back navigation, keyboard and screen-reader labels, and phone/landscape/desktop layout. Continue the existing deployment hold until explicitly lifted, including the outstanding Morse/Home device acceptance.
