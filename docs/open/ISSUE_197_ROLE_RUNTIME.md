# Role receipts and Navigator runtime

**Status:** implemented on main via #203, 2026-10-13; not yet released or deployed. Owner-supplied Navigator artwork and physical Pixel acceptance remain outstanding.
**Authority:** maintained runtime contract implementing ratified [#197 decisions](ISSUE_197_ROLE_DECISION_RECORD.md). Topic evidence and completion remain governed by [progress architecture](PROGRESS_ARCHITECTURE.md); Firebase isolation/conflicts remain governed by [#93](../closed/ISSUE_93_FIREBASE_PROGRESS_SYNC.md).

## Available roles

Communicator v1 retains its seven topics and three pathways. Navigator v1 has five topics and two fully open pathways:

- Direction & Bearings: `cardinal-bearings`, `whole-circle-bearings`, `reciprocal-bearings`.
- North & Maps: `north-references-declination`, `grid-north-map-bearings`.

Navigator’s claim is “Recalls compass points and converts bearings between north references.” It does not claim practical wayfinding, position fixing or navigation qualification. Mariner remains unavailable pending the independent reviews documented in #147/#148; Diver, Responder, Operator and Analyst remain outside the learner UI.

The native labelled role selector keeps one focused role. Continue chooses a refresh topic first, then an in-progress topic, then the first unstarted requirement, using the shared journey action. Opening a topic or returning from a run retains the selected role during the app session. Missing topics remain visibly unavailable; historical awards do not fabricate current topic completion counts.

Navigator uses a text award until the owner supplies artwork. No generated badge or Communicator artwork is substituted. Artwork production and acceptance remain with the owner under [#192](ISSUE_192_ROLE_BADGE_ART.md).

## Receipt lifecycle

The optional v5 library field `roleAwards` carries `{ roleId, roleVersion, earnedAt, topicIds }` records. A receipt is written in the same library record as a completing topic mutation; loading an existing fully completed library backfills a receipt once. `earnedAt` is the time Argus first records the award, not a reconstructed historical achievement date. Scored evidence is not inferred from receipts.

A role is earned when a receipt for that role exists or its current live requirements are complete. Topic deletion, repair, import and definition updates do not revoke a receipt. Import unions incoming receipts with existing awards even when replacing all topics. Unknown future role names/versions survive valid imports; malformed or duplicate receipts fail validation rather than silently disappearing. Adding requirements needs a new authored role version. A prior receipt proves its original topic ids even if those topic records were deleted: an optional extension therefore asks only for new, not-yet-proved requirements. Current topic counts remain literal and missing topics are not recreated. Completing the extension writes a new-version receipt while keeping the earlier one; future-version receipts are never downgraded by an older definition.

Only explicit reset removes awards. It clears receipts and increments `roleAwardGeneration`, a nonnegative integer reset generation. This is an explicit reset protocol, not a clock-based topic conflict rule. Metadata merges receipt sets within one generation; a higher generation supersedes awards in older generations. Imports retain the device’s current generation while preserving both sets of valid receipts, so importing a file never implicitly resets awards.

Account switching parks the whole record, including receipts and generation, under its existing owner. Another UID receives its own library and cannot inherit the previous owner’s awards.

## Sync and rules check

Receipts and their reset generation travel in `users/{uid}/libraryMeta/library`, inside the existing `{ json, revision, updatedAt }` envelope. The existing owner-only rules already bound JSON size and require a server timestamp; no rule broadening, new path or production rules deployment is needed. The configured `(default)` database in `argus-b7a5a` is Standard edition. Emulator tests cover an award payload, denied cross-owner reads/writes and rejected device-chosen timestamps.

Topic records still use #93’s conservative per-topic conflict planner. Receipt union does not choose a winner for topic history/evidence. Unsupported or corrupt metadata is not overwritten. An old client predating receipt support can drop unknown metadata on its next write; use updated clients on the owner’s devices before relying on portable awards. Metadata writes transactionally re-read and merge the server record, so concurrent updated clients cannot overwrite independently earned awards. Durable retry and transaction-before-UI local writes remain #113 work.

## Validation

- Role/manifest drift checks include Learn sources and limitations for every available-role requirement.
- Receipt tests cover backfill, version changes, partial completion, malformed input, export/import, deletion, reload, reset and account parking.
- Sync tests cover concurrent role union, cloud recovery, reset generations and unreadable metadata.
- Browser checks cover the selector, direct Continue and persisted Navigator awards across deletion/reload/reset at all four configured viewports.
- Physical Pixel acceptance and owner artwork acceptance are separate from automated checks.
