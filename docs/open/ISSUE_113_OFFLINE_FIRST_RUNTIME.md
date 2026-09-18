# Issue #113 — Offline-first runtime, IndexedDB persistence and durable sync

> **Status: scoped, not implemented — 2026-09-18.**
>
> **Authority:** this document is the durable implementation contract for GitHub issue [#113](https://github.com/BenWassa/argus/issues/113). It extends the local-first/cloud-mirror direction in `PRODUCT.md` and #93 without changing the learning/progress semantics defined by `docs/open/PROGRESS_ARCHITECTURE.md`.
>
> **Baseline assessed:** `main` at `7bc020275cdccf0e18fdb1ac767096479e37b019` (`v1.0.1`).
>
> **Relationship to #93:** #93 owns authenticated Firebase persistence, cloud recovery, owner isolation and conservative cross-device conflict behavior. #113 owns the local runtime required to make those cloud features optional during ordinary use: IndexedDB durability, atomic local writes, the durable sync outbox, deterministic offline app-shell caching, offline auth bootstrap behavior, storage lifecycle, sizing policy and offline UX. #113 must reuse #93's validated learner schema and conflict planner rather than create another sync model.

## Product contract

Argus is to be **offline-first**, not merely tolerant of a temporary network failure.

After one successful online authentication/bootstrap on a device, an installed Argus PWA must be able to:

- cold-launch with no network;
- render Today, Library, Topic, Learn, Practice and Test from local state;
- complete durable learning actions with no network;
- preserve those actions through reload, browser/PWA process death and device restart;
- continue accumulating local progress for an extended offline period;
- reconcile that progress with Firebase when connectivity returns;
- report conflicts rather than silently discarding earned progress.

The network is therefore a synchronization and recovery dependency, not an interaction dependency.

A genuinely new device with no cached Argus identity/data may require connectivity for first Google authentication and initial recovery. That is the one deliberate bootstrap exception.

## Why this issue exists

The repository already uses the phrase "local-first" and the intended product behavior is correct, but the implementation does not yet provide a complete offline guarantee.

At the baseline:

- `src/infrastructure/persistence/localLibraryRepository.ts` stores the whole v5 library in one `localStorage` key;
- `src/services/library/LibraryProvider.tsx` renders and mutates an in-memory React copy, then saves the complete library in an effect;
- `src/services/sync/` mirrors per-topic records to Firebase and contains the existing non-destructive conflict planner;
- #93 explicitly leaves coalescing/retry and some local-recovery work open;
- `public/sw.js` caches a small hand-maintained shell and runtime GETs, but does not derive a complete precache list from the Vite build;
- `AuthGate` waits for Firebase Auth in configured builds and does not yet define a provisioned-device offline bootstrap contract;
- storage quota, persistence/eviction and storage failure are not first-class states;
- the app has no durable outbound mutation queue;
- curriculum/download sizing has not been turned into a maintained policy or build measurement.

The result is locally usable code, but not yet a guarantee that a learner can install Argus, enable airplane mode, kill and reopen the PWA, continue learning for days, and later reconcile safely.

## Current size baseline

The baseline repository is small enough that **full curriculum availability should remain the default**.

Repository-file measurements at the baseline SHA:

| Area | Approximate source/static size | Interpretation |
| --- | ---: | --- |
| Production `src/` files excluding tests | 767,729 bytes | Source size only; not the built JS/CSS footprint |
| `public/` | 1,442,337 bytes | Includes icons, splash poster/video, manifest and service worker |
| Current `catalogSeed.ts` | 21,560 bytes | Current shipped catalog source; text/data is negligible |
| Public splash video | 819,686 bytes | A single media asset is already much larger than the catalog data |

These are repository-file indicators, **not an installed-storage measurement**. #113 must add reproducible build/runtime sizing rather than treat these numbers as a permanent budget.

The product decision is nevertheless clear: do not add per-topic or per-library download UX for text/data at current scale. Media, not curriculum text, is the likely future reason to introduce optional packs.

## Architectural invariants

### 1. Local storage is authoritative for interaction

Every learning surface reads from the canonical local store.

Every durable learner action is successful only when its local transaction succeeds. Firebase availability must never determine whether a Test result, lesson answer, evidence update, topic edit or completion survives.

The runtime order is:

1. apply domain validation/policy;
2. commit the canonical local state and required sync intent atomically;
3. update/render the UI from local state;
4. synchronize asynchronously when possible.

A network error after step 2 is a sync problem, not a learner-action failure.

### 2. One learner schema

#113 does not create an "offline schema" and does not create a Firebase schema for progress.

The validated Argus library/topic model remains the semantic record. Existing parser, migration, catalog reconciliation, export/import, progress architecture, evidence rules and Morse acquisition rules continue to decide what learner state means.

IndexedDB changes the **persistence mechanism**, not the learning model.

### 3. Firebase remains a mirror/recovery layer

The existing #93 per-topic remote shape and conservative planner remain the starting point.

Do not adopt Firestore's ordinary same-document last-write-wins semantics as Argus's conflict policy. A remote cache may be useful internally, but it cannot replace Argus's own evidence-preserving reconciliation rules.

### 4. Offline operation cannot depend on background execution

Service Worker Background Sync or similar browser facilities may be used as an optimization where supported, but correctness must not depend on them.

Opening Argus or restoring connectivity in the foreground must always be enough to retry outstanding work.

### 5. No silent data loss

Storage write failure, quota exhaustion, parser failure, migration failure, remote conflict and failed cloud writes must be represented explicitly.

The current `saveLibrary()` behavior intentionally swallows localStorage errors so the session can continue. That is not sufficient once local durable commit is the product guarantee. Under #113, a durable mutation that could not be persisted must not be presented as safely saved.

## Target local database

Use one versioned IndexedDB database behind an infrastructure repository boundary. Exact store names are implementation details, but the responsibilities are not.

The database must support at least:

### Canonical learner records

The current durable library/topic state, including:

- topic identity/content;
- status and scheduler timestamps;
- test history;
- item evidence;
- Morse lesson/acquisition progress;
- active durable lesson sitting;
- placement provenance once #105 lands;
- user-authored topics;
- catalog provenance needed by reconciliation.

Implementation may persist the library as one document initially or decompose it by topic, but the write model must support atomic composition of a topic mutation plus its sync intent. If a single-document library makes that unnecessarily expensive, per-topic records are preferred because the remote side is already per-topic.

### Sync ledger

The device's last agreed remote revision/baseline per synced unit, replacing or migrating any localStorage ledger used by #93.

### Durable outbox

A queue of local work that has been durably committed but not yet acknowledged by the cloud.

An outbox record needs enough identity to be:

- retried safely;
- coalesced where safe;
- associated with the correct UID;
- distinguished from a remote deletion;
- removed only after the corresponding remote operation is known to have succeeded.

Do not model every answer as a network event if a later safe coalesced topic snapshot is enough. The outbox represents **sync intent**, not an analytics event log.

### Tombstones/deletions

Deletion must survive offline operation. If removing a user-authored topic or another remotely represented record requires a tombstone until Firebase acknowledges deletion, store it explicitly.

Shipped-catalog reconciliation rules must still prevent an old remote deletion from erasing a shipped topic that the current catalog restores.

### Local identity/provisioning metadata

Store only what the runtime needs to determine whether this device has been successfully provisioned for a given authenticated owner and can open from local state while Firebase is unreachable.

Do not invent a local authentication system. Cached local provisioning is permission to open the already-local owner's data while offline; it is not a replacement credential for authenticating a new device.

### App/content metadata

Track database/schema version, catalog/content version, migration state and future content-pack state.

## IndexedDB migration from current localStorage

Migration is a high-risk data operation and must be deliberately one-way only after verification.

### Inputs

At minimum inspect:

- `argus.library.v5`;
- supported legacy library keys already handled by the current repository;
- the #93 sync ledger/session keys;
- any sidecars that remain valid migration inputs at the time implementation begins.

### Required migration behavior

1. Read existing storage through the same parser/migration boundary used today.
2. Never seed a fresh library merely because migration encountered an error if recoverable local/cloud data may exist.
3. Write the migrated representation into IndexedDB in a transaction.
4. Read it back and validate it.
5. Mark migration complete.
6. Keep the old localStorage record until the new copy has been successfully committed and verified.
7. Remove or retire old keys only under an explicit cleanup rule.

Migration must be idempotent. Reloading halfway through cannot duplicate history, erase evidence or create a second source of truth.

### Failure policy

If migration cannot establish a valid local copy:

- preserve the original bytes/keys;
- surface a recoverable error state;
- if authenticated and online, allow the #93 cloud recovery path;
- do not silently replace the learner with a fresh seed.

## Atomic local mutation + outbox

The most important implementation property is that local state and its eventual sync intent cannot diverge because the process died between two separate writes.

Conceptually:

```text
IndexedDB transaction
  ├── update canonical topic/library record
  └── create/update pending sync intent
commit

UI may now treat the action as durable.
```

If the transaction fails, the action is not durably saved and the UI must say so.

This also preserves the existing `updateTopic(id, current => next)` composition rule: multiple independent domain systems continue to apply functional updates against the latest canonical topic.

## Durable sync lifecycle

### Trigger conditions

The sync worker may run when:

- authentication/bootstrap completes;
- the app starts with a provisioned owner;
- a local mutation commits;
- the browser reports connectivity restoration;
- the remote snapshot changes;
- the user explicitly retries after an error.

### High-level pass

1. establish current owner/UID;
2. load local records, ledger and outbox;
3. obtain remote records when network permits;
4. apply the existing #93 planner/conflict rules;
5. execute bounded remote operations;
6. record remote acknowledgements/ledger changes transactionally;
7. remove only acknowledged outbox entries;
8. leave conflicts and failed operations durable for later resolution/retry.

### Retry

Retry needs:

- bounded exponential backoff while the app remains open;
- immediate reconsideration after a meaningful reconnect/relaunch;
- no hot loop when Firebase is unavailable;
- durable pending count even after reload;
- clear distinction between ordinary offline state and an actual sync error.

### Coalescing

Coalescing is desirable because a learner may perform many local writes to one topic while offline.

Safe target behavior:

- many unacknowledged mutations to the same topic may collapse to the latest validated topic snapshot when doing so preserves the complete cumulative learner state;
- deletion supersedes an earlier unacknowledged write when the local final state is deletion;
- do not coalesce across different owners;
- do not discard a state needed by conflict detection/ledger comparison;
- history/evidence monotonicity protections remain in force.

### Conflicts

#93's explicit-detection rule remains authoritative unless separately redesigned.

When local and remote copies both changed since the last agreed revision:

- neither is overwritten automatically;
- the topic remains usable locally;
- conflict is exposed in Profile;
- sync for unrelated topics continues;
- resolution must preserve earned history/evidence.

#113 may improve the resolution UX, but it must not weaken the policy just to make queued sync easier.

## Offline authentication/bootstrap

The current configured build gates learning surfaces until Firebase resolves a user. That behavior needs an offline branch.

### Provisioned returning device

If this device previously completed an authenticated bootstrap for an owner and holds a valid local library for that owner:

- an unreachable network must not strand the app indefinitely on "Checking your session…";
- Argus may enter an explicit locally provisioned/offline state;
- the local owner's library becomes available;
- sync remains pending until Firebase can re-establish the remote session;
- if Firebase later establishes a **different** owner, no existing local library may be exposed under that UID.

Implementation must verify Firebase Auth persistence behavior in the actual production browser/PWA environment rather than assuming all platforms behave identically.

### New/unprovisioned device

If no trustworthy local owner/library bootstrap exists and Google authentication cannot be reached:

- do not fabricate a fresh account library behind the production auth gate;
- show a restrained connection-required state;
- retry once connectivity returns.

### Account switching

Local records, ledger and outbox must be namespaced or otherwise isolated so one UID can never inherit another UID's data.

Signing out must define whether the previous owner's local data remains on-device for later re-entry. The current product contract says signing out leaves the local copy untouched; #113 should preserve that unless a separate privacy decision changes it. Even if retained, that copy must not be exposed to a different signed-in UID.

## Service worker and offline application shell

The present `public/sw.js` hand-maintains a short `APP_SHELL`. That cannot guarantee that the hashed JS/CSS output produced by Vite is available after first install.

### Required target

The production build must generate or inject a versioned asset manifest that covers every resource required for a cold offline launch.

At minimum:

- navigation/root document;
- current hashed JS entry/chunks;
- current hashed CSS;
- web manifest;
- required icons;
- required fonts, if any;
- essential local splash assets.

Optional/lazy routes that are part of the normal learning product must either be precached or have an explicit first-use download policy. At current Argus scale, precaching the normal executable app is preferred.

### Update safety

An update cannot delete the previous known-good cache before the replacement is fully installable.

Required behavior:

- install the next cache generation completely;
- only activate/switch once required assets exist;
- retain the previous generation if installation fails;
- never serve new HTML that points to missing old/new chunks;
- clean obsolete generations only after a successful activation policy permits it.

Tests must simulate an interrupted/failed update.

### Caching policy

Use distinct strategies by resource class rather than one blanket rule:

- hashed immutable build assets: cache-first;
- navigation: version-aware app-shell strategy with safe offline fallback;
- static catalog bundled into JS/data: part of build generation;
- remote Firebase/API calls: network/sync layer, never mistaken for app-shell assets;
- future optional media packs: managed explicitly by pack metadata.

## Curriculum/content availability

### Current policy

All shipped text/data curriculum is installed automatically.

Reasons:

- current catalog data is tiny;
- even a substantially larger text curriculum is unlikely to justify user-managed downloads;
- complete reference availability is part of the utility of an offline field-library product;
- download controls would add state and failure modes without present benefit.

### Future content packs

Build an internal boundary now so future large media can be optional without another persistence redesign.

A future pack record should be able to express:

- stable pack id;
- content/catalog version;
- approximate/downloaded bytes;
- installed/not-installed/update-available state;
- integrity/version metadata;
- topic/content dependencies.

Do **not** build pack-picker UI under #113 unless the measured footprint actually crosses the later threshold.

### Sizing trigger

Do not hard-code an arbitrary 4 GB concern into UX. Add measurement first.

At minimum report:

- production build total;
- app-shell precache total;
- curriculum/catalog data total;
- static bundled media total;
- optional-pack totals if packs exist.

A later issue may ratify thresholds such as "consider selective downloads when optional media exceeds tens of MB"; #113's job is to make the decision measurable.

## Browser storage durability

### Persistent storage

Where supported, request persistent origin storage after the app is successfully provisioned or installed, at a non-disruptive point.

A denial is not fatal. Argus must continue while making its backup/sync/export status understandable.

### Storage estimate

Use browser storage-estimate APIs where reliable to support diagnostics/Profile:

- current origin usage;
- quota;
- whether persistence was granted.

Treat estimates as approximate platform information, not accounting-grade values.

### Quota and write failure

A quota or IndexedDB write failure is a durability failure.

Required response:

- do not claim the learner action is safely stored;
- preserve the in-memory state only long enough to offer recovery/export if possible;
- stop piling additional unsaved mutations onto a false "saved" state;
- explain the condition in Profile/error UI;
- provide retry/export/recovery paths.

## Profile/runtime UX

Offline is a normal runtime state.

Profile should be able to show:

- account identity;
- Online / Offline;
- Synced / Syncing / N changes pending / Conflict / Sync error;
- last successful sync time;
- local data persistence status where knowable;
- approximate local storage usage where useful;
- current offline-content availability;
- retry/recovery controls when action is actually required.

Ordinary learning surfaces should not become cluttered with offline warnings. A small global status cue is acceptable if it conveys pending durability/sync information, but no blocking modal/banner should appear simply because connectivity is absent.

A failed **local** save is different: that is actionable and must be visible because progress may otherwise be lost.

## Startup/recovery state machine

Implementation should make startup states explicit rather than infer them from scattered booleans.

The product needs to distinguish at least:

```text
unprovisioned + offline
unprovisioned + online/authenticating
provisioned local + offline
provisioned local + online/restoring remote session
provisioned + syncing
provisioned + synced
provisioned + sync conflict
local recovery required
local durability failure
```

The exact type names are implementation details. The distinctions are not.

The key rule is that **provisioned local + offline is an open application state**, not an auth spinner.

## Export/import and recovery

JSON export/import remains a first-class owner escape hatch.

### Export

Export reads the canonical local learner state, including all durable progress represented by the normal library schema.

Pending sync queue metadata is not part of the portable learner claim and should not be embedded into the ordinary library JSON unless a separate migration reason requires it.

### Import

Import must deliberately interact with sync:

- validate/migrate first;
- replace/reconcile the local canonical learner state atomically;
- generate the required new sync intents;
- avoid allowing an old remote snapshot to immediately restore the pre-import library;
- preserve explicit conflict behavior where remote divergence exists.

### Missing/corrupt local recovery

This completes the unfinished #93 path.

When the local IndexedDB library is missing or invalid:

1. preserve diagnostics/raw recoverable material where feasible;
2. if authenticated and online, attempt cloud recovery before seeding;
3. validate every adopted remote record through the same parser;
4. only seed a genuinely new library when there is no recoverable local or remote learner state.

## Testing contract

Unit tests alone are insufficient. The issue is specifically about browser persistence and process/network boundaries.

### Persistence tests

Cover:

- empty first creation;
- localStorage v5 migration;
- supported legacy migration;
- interrupted/idempotent migration;
- IndexedDB schema upgrade;
- functional topic-update composition;
- atomic topic + outbox commit;
- deletion/tombstone commit;
- quota/write failure;
- parser failure without silent reset.

### Sync tests

Cover:

- one offline topic update then reconnect;
- many updates coalesced safely;
- many topics offline;
- app restart with pending outbox;
- remote-only change;
- local-only change;
- both-sides conflict;
- remote late/shorter evidence refusal;
- deletion both directions;
- retry after transient Firebase failure;
- unrelated topics continue syncing around one conflict;
- UID separation/account switch.

### Service-worker/browser tests

At production-build level:

- install online, then cold-launch offline;
- navigate to each normal learning route offline;
- reload a deep route offline;
- fail network during an app update;
- confirm previous generation still launches;
- activate successful next generation without missing chunks;
- verify required lazy chunks/assets are available.

### End-to-end learner traces

At minimum:

1. online bootstrap → airplane mode → start Morse sitting → answer several items → kill PWA → reopen offline → resume exact durable sitting;
2. airplane mode → complete a Test → kill/reopen → result/history/evidence still present;
3. remain offline while changing multiple topics → reconnect → queue drains without data loss;
4. second device changes same topic → first device reconnects → explicit conflict, no overwrite;
5. corrupt/remove local copy while valid cloud exists → online startup restores cloud before any fresh seed;
6. first-ever unprovisioned device starts offline → connection-required state, no fabricated learner library.

### Physical Pixel acceptance

Before closing #113, test the installed production PWA on Pixel:

- initial online Google sign-in/bootstrap;
- home-screen launch;
- airplane mode;
- full cold process restart;
- Today/Library/reference navigation;
- Morse lesson write/resume;
- Test completion;
- extended local pending state;
- reconnect;
- Firebase sync completes;
- Profile reports correct state throughout.

## Implementation lanes and ownership boundaries

### Lane A — IndexedDB persistence foundation

Own:

- database/schema;
- repository interface;
- localStorage migration;
- atomic learner mutation + sync-intent transaction;
- storage persistence/quota handling;
- persistence unit tests.

Must not redesign scheduler/progress semantics.

### Lane B — durable sync

Own:

- IndexedDB ledger/outbox;
- retry/coalescing;
- deletion/tombstone behavior;
- #93 backend/planner integration;
- reconnect/startup drain;
- conflict/pending status derivation.

Depends on Lane A.

### Lane C — production offline shell

Own:

- build-derived precache manifest/injection;
- service-worker version/update policy;
- offline route/chunk coverage;
- browser tests for cold launch/update failure.

May proceed in parallel after the local-runtime boundary is stable.

### Lane D — auth/bootstrap state machine

Own:

- provisioned-device metadata;
- offline gate behavior;
- new-device connection-required state;
- UID isolation/account switching;
- auth + local-store startup integration.

Must not create a local credential system.

### Lane E — content sizing/pack boundary

Own:

- reproducible build/content-size report;
- size budget output in CI or maintainer tooling;
- "all text/data installed" implementation;
- future pack metadata/interface only.

No pack-picker UX unless a later measured need is ratified.

### Lane F — Profile UX and hardening

Own:

- connectivity/sync/pending/conflict/storage status;
- retry/recovery affordances;
- integration/browser tests;
- physical Pixel acceptance;
- documentation closeout.

## Acceptance criteria

#113 is complete only when all of the following are true:

- [ ] IndexedDB is the canonical local durable store.
- [ ] Existing valid v5/legacy local learner state migrates without loss and without premature deletion of the old copy.
- [ ] Every durable learner mutation commits locally before network work.
- [ ] A committed action survives immediate reload/process death while offline.
- [ ] Sync intent is durable and survives restart.
- [ ] Reconnect/relaunch retries outstanding work automatically.
- [ ] #93's explicit conflict behavior still prevents silent loss.
- [ ] Missing/corrupt local state attempts cloud recovery before any fresh seed.
- [ ] A provisioned production device cold-launches offline instead of hanging at auth restoration.
- [ ] A new/unprovisioned offline device does not fabricate an authenticated learner library.
- [ ] UID/account switching cannot expose or merge another owner's local data.
- [ ] Production service-worker caching covers the complete executable app required for offline cold launch.
- [ ] Failed/interrupted updates leave the previous known-good app runnable.
- [ ] Today, Library, Topic, Learn, Practice and Test work offline.
- [ ] Active Morse sitting state resumes correctly offline.
- [ ] Test history/evidence/completion written offline remains intact after restart.
- [ ] Full current shipped curriculum/reference data is available offline with no per-topic download control.
- [ ] Build tooling reports app-shell, catalog and media sizes reproducibly.
- [ ] Persistent-storage request/estimate handling exists where supported.
- [ ] Quota/local-write failure is surfaced and never silently presented as saved progress.
- [ ] Profile accurately exposes offline/sync/pending/conflict/recovery state.
- [ ] Export/import remains lossless for the canonical learner record and has defined sync interaction.
- [ ] Browser/E2E coverage exercises true offline cold launch, reconnect, migration and failed-update paths.
- [ ] Production Pixel PWA acceptance passes.
- [ ] `npm run check` passes.
- [ ] #93 and #113 documentation are reconciled so there is no competing authority.

## Non-goals

This issue does not:

- redesign acquisition, evidence, retention or completion semantics;
- add a new scheduler;
- change Morse competency boundaries;
- introduce a Firebase-specific progress model;
- accept silent last-write-wins conflict resolution;
- require continuous service-worker/background execution;
- build per-topic download controls at current content sizes;
- add large media libraries;
- redesign unrelated screens;
- replace Google authentication with a local credential system;
- move maintainer research documents into the runtime app.

## Closeout documentation

When implementation is complete:

1. update this status banner from scoped to implemented with the merged PR(s)/date;
2. reconcile `PRODUCT.md`, README and #93 with the actual shipped behavior;
3. record the final IndexedDB schema/version and migration path;
4. record the measured production/offline footprint;
5. record the final service-worker update strategy;
6. record physical Pixel acceptance evidence;
7. move this document to `docs/closed/` only if it no longer serves as a maintained runtime contract. If it remains the canonical offline-runtime contract, keep it in `docs/open/` per repository housekeeping rules.
