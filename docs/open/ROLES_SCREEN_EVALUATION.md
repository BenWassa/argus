# Roles screen evaluation

**Status:** Active evaluation, 7 October 2026. No Roles runtime implemented.
**Authority:** Repository assessment and implementation recommendation; does not ratify the open product decisions in [#191](ISSUE_191_ROLE_DESIGNATIONS.md) or replace the artwork brief in [#192](ISSUE_192_ROLE_BADGE_ART.md).

## Current starting point

`feat/roles-screen` starts from `main` at `fac05e5`, after the Morse and Home merge. Deployment remains on hold; the automatic Pages demo workflow remains disabled. This work must not create a release or deploy either build.

The app currently has Home and Library navigation, with no Roles route, role definitions, or award records. The 24-topic shipped catalog and existing permanent `Topic.completedAt` provide a useful foundation. Learning activity, Morse sending bests, and formative practice are not role completion evidence.

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

**Owner clarification:** The PNG is a visual reference only. The owner is still creating the SVG; that forthcoming SVG is the intended production artwork. Do not crop, convert, or integrate the reference PNG as a runtime asset.

Source: local untracked `ChatGPT Image Oct 7, 2026, 10_23_13 PM.png`, 1774 × 887, approximately 2.6 MB, RGBA PNG. SHA-256: `5ca25a6a03586b02ff476959ea79f3524c0c0f2e251444d80aa48d39d65819d2`. The file is present in the checkout; it is not committed on local or remote `main`. Its original pixels have not been changed.

The combined sheet contains a silver **LOCKED** medallion and a gold/blue **EARNED** medallion, with baked-in labels and a visible navy backdrop. An alpha channel alone does not establish a usable transparent cutout. Radio tower, signal flags, Morse marks and maritime waves give Communicator a coherent identity. The tower reads clearly; the smaller flags, rope and Morse details need small-size checks.

Use this as the direction for a medallion family. The earned gold/blue palette is more expressive than #192's restrained steel proposal; preserve that owner-supplied direction in the artwork while keeping ordinary interface chrome within the existing design system. Start with a 96–128 px badge on the Roles card/detail, not a tiny navigation icon.

When the owner's SVG is available, inspect its locked and earned treatments at actual display sizes and on the app background. Check framing, small-detail legibility, and accessible state text in the interface. The PNG's background, labels, file size, and differences between the two drawings are properties of the reference sheet, not defects to fix or assumptions about the forthcoming SVG. No asset editing has been performed in this evaluation; generation prompt/model metadata is unavailable and must not be invented.

## Implementation gates

The smallest coherent next build is Communicator only, the forthcoming owner-created SVG with locked and earned treatments, a finite checklist, existing topic navigation, and separate refresh status. Screen structure and behavior can be developed while the SVG is in progress; final artwork acceptance waits for the SVG. Update PRODUCT/DESIGN's blanket badge prohibition with a narrowly scoped Roles exception when that implementation is approved; the existing shipped contract remains authoritative meanwhile.

Before release, verify empty/partial/earned/refresh states, catalog provenance, import/deletion behavior, route/back navigation, keyboard and screen-reader labels, and phone/landscape/desktop layout. Continue the existing deployment hold until explicitly lifted, including the outstanding Morse/Home device acceptance.
