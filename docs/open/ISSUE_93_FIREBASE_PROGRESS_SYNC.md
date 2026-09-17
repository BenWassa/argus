# Issue #93 — Firebase-authenticated learner progress sync

Status: **mostly implemented — 2026-09-16.** The sync layer, Security Rules and the sign-in entry boundary are built and tested; the local-data recovery rules are not.

This document is the durable implementation scope for GitHub issue #93.

> **What has landed.** `src/lib/sync/` carries the library to
> `users/{uid}/library/{topicId}` for a signed-in owner, and back. It honours
> the sections below on *local-first remains the interaction model*, *one
> learner-library schema* (the record travels as the exact v5 JSON and arrives
> back through the same parser, so no parallel schema exists), *existing
> progress architecture remains authoritative*, and *the inbox shares
> authentication* (auth is now app-level, in `SyncProvider`). Security Rules
> identify the owner by verified address and are covered by the emulator suite.
>
> **Conflict policy, as built.** This takes the explicit-detection fallback the
> *Conflict policy* section permits, not a field-level merge: where both sides
> changed a topic, neither copy is written and the topic is reported for the
> owner to settle. A remote copy is also refused if applying it would shorten
> history or drop item evidence. Nothing silently discards progress.
> `src/lib/sync/plan.ts` is the whole policy and `plan.test.ts` pins it.
>
> **Deliberately decomposed per topic.** The *Cloud data model* section suggests
> one `library/current` document first. This ships one document per topic
> instead, because it is what makes the non-destructive policy useful: with a
> single document every concurrent edit is a whole-library conflict, whereas per
> topic two devices working on different topics never collide at all.
>
> **The sign-in entry boundary, as built (2026-09-16).** `src/app/App.tsx`'s
> `Gate` renders `SignInScreen` in place of `Routes` for any configured build
> where the owner is not signed in, so `Today`, `Library` and every learning
> surface never mount — not a route guard hiding them after the fact. A device
> that has signed in before shows a `restoring` state rather than a sign-in
> button, so a returning owner is never asked twice, and never sees the library
> before Firebase has actually confirmed the session. `src/app/gate/AuthGate.test.tsx`
> covers all four states (signed out, restoring, open, and a failed sign-in
> that must not open the door) because the browser suite deliberately runs the
> *unconfigured* build (`npm run build:e2e`) and cannot exercise this: it
> cannot sign in to real Google, and the gate does not exist for a build with
> nothing to sign in to. A build with no Firebase configuration remains
> ungated, exactly as `Owner decisions` below records.
>
> **What has not landed, and is still open:**
>
> 1. **Local invalid/missing data recovery** and **first migration for existing
>    users**. Today an empty local library does not attempt authenticated
>    recovery before seeding a fresh one, which is the specific data-loss hole
>    this issue opens with.
> 2. **Coalescing and retry** of cloud writes. Writes are made as plans are
>    carried out, and a failure is surfaced rather than retried.
> 3. `lessonSitting` state is local-only and still excluded.
>
> **Owner decision — 2026-09-16.** Gating every learning surface behind Google
> sign-in makes an account mandatory for what was a local-first app. This
> document flagged that as an explicit decision for the owner rather than
> something to take on its own strength; the owner asked for exactly this
> ("login page before anything — that's the idea I had of using the splash
> page"), so it is no longer an open question.

## Goal

Protect Argus learner progress from local-storage loss by making Google-authenticated Firebase storage the durable cloud copy of the learner library while preserving Argus as a local-first, offline-capable PWA.

The user should be asked to sign in before using the learning product. Authentication should be integrated into the opening experience rather than hidden inside the Library inbox. The opening composition should keep the existing Argus splash/identity at the top and present the app name plus Google sign-in immediately below it.

The result must not create a second independent progress model. The existing Argus library remains the canonical schema and the existing progress architecture remains authoritative for learner semantics.

## Current problem

Argus currently stores the learner library and progress only in device-local browser/PWA storage. Firebase Authentication and Firestore are used only by the separate `Want to learn` inbox. Losing or replacing browser/PWA storage can therefore make a learner appear fresh even after meaningful progress.

The current local loader also falls back to a fresh library if no valid local record can be loaded. That behaviour is acceptable only when there is genuinely no recoverable learner state; once cloud backup exists, a missing or invalid local record must first attempt authenticated recovery.

## Product decisions

### 1. Authentication is a product-level entry boundary

- Argus presents Google sign-in before the learner can enter Today, Library, a Topic, a lesson or a Test. (Standalone Progress and the generic Learn screen no longer exist as of v0.2.0; the gate is every learning surface, whatever it is named.)
- The sign-in surface is part of the opening/splash experience, not buried in Library.
- Preserve the existing visual splash/brand treatment at the top.
- Place the Argus name and a clear Google sign-in action directly below it.
- Keep the screen restrained and mobile-first; do not turn it into a marketing/onboarding carousel.
- The authenticated session should persist using Firebase Auth's normal durable web session behaviour.
- A signed-in user should not be asked to sign in again on every launch.
- Loading/auth-restoration must be explicit so the app does not briefly expose a fresh local library before Firebase auth resolves.

### 2. Local-first remains the interaction model

- Normal reads and writes continue against the existing local Argus store for immediate, offline-capable interaction.
- Cloud sync runs behind that local experience.
- A temporary network outage must not block Learn/Test or discard progress.
- Local writes must be durable immediately and queued/retried for cloud persistence.
- Firebase is the durable cross-install/account backup and synchronization layer, not a reason to make every UI action network-dependent.

### 3. One learner-library schema

Do not invent a parallel Firestore-specific progress schema.

The cloud representation must preserve the same durable learner state already governed by the Argus library contract, including where present:

- topic identity and catalog reconciliation metadata;
- scheduler/retention status and timestamps;
- attempt/history records;
- completion records;
- Morse `lessonProgress` acquisition state;
- Morse `lessonSitting` finite-sitting state;
- formal `itemEvidence` / directional evidence;
- user-authored topics;
- other durable fields accepted by the current storage parser.

Transient UI/audio/animation/navigation state must not be synchronized merely because Firebase exists.

### 4. Existing progress architecture remains authoritative

This work must not change the semantic ownership established by `docs/open/PROGRESS_ARCHITECTURE.md`.

Cloud sync persists the durable library; it does not redefine acquisition, formal evidence, retention, completion, sitting state, journey derivation or scheduling.

### 5. The existing Firebase inbox shares authentication

- Reuse the existing Firebase project/configuration and Google provider unless implementation evidence requires separation.
- Authentication should become application-level rather than inbox-owned.
- `Want to learn` continues to use its existing Firestore collection/semantics.
- The inbox must not become a second source of learner-library truth.
- Remove duplicate/secondary sign-in UX from the inbox once product-level authentication is established.

## Cloud data model

Use an authenticated, per-user namespace. Exact collection/document names are implementation details, but the intended boundary is conceptually:

```text
users/{uid}/library/current
users/{uid}/inbox/{requestId}
```

The library document may be stored as one validated versioned payload initially because Argus is a single-user personal learning app with a bounded library. Do not prematurely decompose every topic/evidence field into many Firestore documents unless Firestore document-size or conflict evidence requires it.

The cloud payload must include explicit metadata sufficient for safe synchronization, such as:

- schema/library version;
- logical revision or monotonic update marker;
- server-side update timestamp;
- optional device/client identifier for diagnostics;
- the validated Argus library payload.

Do not use client wall-clock timestamps alone as conflict authority.

## Synchronization contract

### Startup

After Firebase Auth restoration resolves:

1. If the user is signed out, show the sign-in entry screen and do not enter the learning UI.
2. If signed in, load the local library through the existing parser/migration boundary.
3. Fetch the user's cloud library if available.
4. Reconcile local and cloud state using an explicit deterministic policy.
5. Only then expose the resolved learner library to normal product surfaces.
6. Persist the resolved state locally and ensure the cloud copy is brought to the same revision.

A fresh/default library must not appear transiently and then overwrite an older cloud record.

### Normal writes

- Existing store/domain mutations remain local-first.
- A durable library change schedules cloud persistence.
- Coalesce rapid sequential writes where appropriate rather than writing on every animation/frame.
- Retry failed cloud writes without rolling back successful local learner actions.
- Surface persistent sync failure in a restrained status/recovery surface; do not interrupt every learning interaction.

### Conflict policy

Do not use naive last-write-wins on an entire library based only on timestamps. It can erase legitimate progress when two installations were used offline.

Implementation must define and test one conservative policy before coding the sync layer. Preferred direction:

- treat the Argus library as the semantic merge unit but merge topics/fields using known stable identity and current reconciliation rules where safe;
- never replace a richer progress/evidence/history record with a demonstrably older/weaker copy merely because one write arrived later;
- preserve user-authored topics from both sides when IDs do not collide;
- require an explicit conflict/recovery path for incompatible user-authored ID collisions or irreconcilable divergent edits;
- completion/history must not silently regress;
- active finite sitting state may choose the most recent coherent sitting only under documented rules;
- catalog reconciliation still runs through the existing catalog authority rather than through arbitrary cloud payload overwrites.

If the implementation team judges field-level merge too risky for the first safe release, phase 1 may enforce single-active-device conflict protection with explicit conflict detection rather than silently discarding one side. Silent destructive last-write-wins is not acceptable.

## Local invalid/missing data recovery

The current behaviour of silently falling back to a fresh library needs hardening.

With authenticated cloud sync:

- missing local state + valid cloud state => restore cloud state;
- invalid/corrupt local state + valid cloud state => preserve the raw invalid local payload for diagnostics/recovery and restore from cloud;
- valid local state + no cloud state => upload the validated local state after confirmation that the account has no existing library;
- neither local nor cloud state => create the normal fresh production library and persist it to both;
- invalid local + no cloud => do not silently destroy the raw local data; show a recovery warning and retain/export the invalid payload where technically possible.

No migration or sync path may fabricate learner evidence.

## First migration for existing users

The first authenticated rollout is a sensitive migration because existing users may already have local progress while their Firebase account has no learner-library document.

Required behaviour:

1. restore/sign in to the known authorized Google account;
2. validate and migrate the existing local library through the current storage boundary;
3. if no cloud library exists, seed the cloud library from that existing local record;
4. preserve all valid progress/history/evidence;
5. mark/record successful initial sync so a later fresh-install recovery can trust the cloud copy.

Do not replace an existing non-empty local library with a fresh cloud bootstrap.

## Sign-in / splash UX

Target opening hierarchy:

```text
[ existing Argus splash / mark ]

ARGUS

[ Continue with Google ]

short account/progress note if needed
```

Requirements:

- one primary action;
- no access to learning navigation until auth restoration/sign-in has resolved;
- accessible focus order and screen-reader naming;
- clear loading state during session restoration;
- clear recoverable error for popup/network/auth failures;
- use redirect instead of popup on installed/mobile PWA if platform testing shows popup reliability problems;
- no blue/default-browser pressed-state regression where Argus interaction styling already defines a different tactile state;
- sign-out must be available later from an appropriate settings/data/account surface, not as clutter on the opening screen;
- signing out must not automatically erase local data. Define explicit local-data handling separately.

## Backend / Firebase lane

The backend pass owns:

- application-level Firebase Auth boundary;
- Google provider/session restoration;
- per-UID Firestore learner-library storage;
- security rules restricting learner-library reads/writes to the authenticated UID;
- payload validation/version boundary;
- cloud revision/update metadata;
- sync repository/service abstraction;
- startup fetch/restore contract;
- local-first write queue/coalescing/retry;
- conflict detection/reconciliation implementation;
- emulator/rules tests;
- production Firebase rules/index/config deployment where required;
- diagnostics sufficient to distinguish auth, local-storage, network and conflict failures.

Security requirements:

- no privileged Firebase/Admin credential in the browser;
- Firebase web configuration remains public configuration, not a secret;
- Firestore rules are the authorization boundary;
- users can access only their own learner-library/inbox namespace;
- validate allowed document shape/version as far as Firestore rules reasonably permit, with the full schema validated again in application code;
- do not trust arbitrary client-supplied UID fields inside payloads.

## Frontend / product lane

The frontend pass owns:

- entry/splash/sign-in screen;
- auth loading/restoration state;
- route/navigation gating until auth is resolved;
- authenticated app composition;
- removal/reconciliation of inbox-only sign-in UX;
- restrained sync status/error/recovery presentation;
- account/sign-out entry point;
- accessibility and Pixel/PWA behaviour;
- ensuring no fresh-state flash appears while cloud/local reconciliation is running.

Frontend must consume a clear application-level auth/sync contract and must not implement Firebase persistence logic directly inside feature components.

## Storage boundary changes

Refactor only as needed to make the existing storage parser reusable for both local and cloud payloads.

The validated library parser remains the trust boundary for imported/cloud state. Cloud data must not bypass migration, normalization or invariant checks.

Recommended separation:

```text
parse/validate/migrate Argus library
        ↑
local adapter      cloud adapter
        \            /
         resolved store
```

Avoid duplicating parser/migration rules in a Firebase module.

## Export/import

JSON export/import remains supported as a user-controlled backup/recovery mechanism.

Define the effect of import explicitly:

- import validates locally first;
- after explicit user confirmation, the imported library becomes the current local state;
- then it is synchronized to the authenticated cloud account as a deliberate replacement/merge according to the documented import policy;
- imports must not race with background cloud restoration.

Cloud sync complements export/import; it does not remove it.

## Sign-out and account switching

Must be explicitly safe:

- sign-out ends access to the authenticated cloud namespace;
- do not silently upload one account's local library into another account after account switching;
- bind local cached state to the authenticated UID or clear/quarantine it on account transition;
- prompt/handle account change before exposing learner data from a prior UID;
- never merge two users' progress automatically.

For the current single-owner deployment, keep the implementation simple while still preventing cross-account contamination.

## Observability and recovery

Provide enough diagnostic state to answer:

- which Firebase UID is active;
- whether auth restoration completed;
- whether local library load succeeded/migrated/failed;
- whether cloud library exists and parsed successfully;
- current sync revision/status;
- whether unsynced local writes remain;
- whether a conflict was detected.

Do not log learner-library contents or sensitive free-text content unnecessarily.

## Testing matrix

### Auth / entry

- signed-out first launch shows splash + Google sign-in and no learning UI;
- successful sign-in enters the resolved library;
- returning signed-in launch restores without requiring another sign-in;
- auth restoration has a stable loading state;
- failed/cancelled sign-in remains recoverable;
- installed Pixel/PWA sign-in path works reliably.

### Local/cloud startup

- existing local + no cloud => cloud seeded from local without progress loss;
- no local + existing cloud => local restored from cloud;
- same local/cloud revision => no destructive rewrite;
- corrupt local + valid cloud => cloud recovery and raw-local preservation path;
- valid local + corrupt cloud => do not destroy local; surface cloud failure;
- neither state => fresh library exactly once, then persisted;
- old local schema versions still migrate before sync;
- no transient fresh-library flash before resolution.

### Durable progress

Verify round-trip for:

- ordinary topic status/timestamps/history;
- completion records;
- user-authored topics;
- Morse `lessonProgress`;
- Morse `lessonSitting`;
- `itemEvidence`, cue and directional evidence;
- catalog delivery/reconciliation metadata;
- export/import after sync.

### Offline/retry

- app remains usable offline after authenticated bootstrap;
- Learn/Test writes remain local immediately;
- unsynced progress survives reload;
- reconnect pushes pending changes;
- failed network write cannot roll learner state back.

### Conflicts

- two installations starting from same revision and diverging do not silently erase one side;
- completed/history evidence cannot regress through conflict resolution;
- incompatible user-authored collision triggers explicit conflict handling;
- account switch cannot cross-contaminate local/cloud libraries.

### Firebase security

- unauthenticated learner-library reads/writes denied;
- user A cannot read/write user B library;
- inbox security remains intact;
- malformed/unsupported cloud payload cannot become the live library;
- rules/emulator tests green.

## Delivery decomposition

This issue should be executed in coordinated lanes but merged as one coherent programme or in strictly ordered PRs whose intermediate production state is safe.

### Lane A — architecture and migration contract

High-reasoning pass.

- inspect current auth/inbox/storage/progress code and Firebase deployment;
- finalize sync/conflict strategy;
- finalize UID-bound local cache strategy;
- document any schema/version change;
- add invariant tests before broad implementation.

### Lane B — backend/auth/sync foundation

Strong implementation pass.

- application-level auth provider;
- cloud library adapter;
- security rules;
- startup reconciliation;
- write queue/retry;
- migration from existing local-only user;
- emulator/integration coverage.

### Lane C — entry/splash/account UX

Frontend implementation pass after Lane B exposes stable contracts.

- splash + app name + Google sign-in;
- loading/error states;
- app gating;
- inbox auth cleanup;
- account/sign-out surface;
- Pixel/PWA verification.

### Lane D — end-to-end hardening and production verification

- multi-install/conflict scenarios;
- offline/reconnect;
- export/import interactions;
- production Firebase rules/config deploy;
- fresh install restores cloud progress;
- existing install preserves local progress on first sync;
- full repository gate and production build;
- physical Pixel acceptance.

## Recommended execution order

A -> B -> C -> D

B may split backend internals in parallel only after A freezes the persistence/conflict contract. Frontend visual work can begin in parallel with late B work once the auth/sync provider interface is stable, but it must not invent a competing auth state model.

## Non-goals

- redesigning Argus learning/progress semantics;
- replacing the scheduler;
- changing Morse completion requirements;
- making the app online-only;
- adding social/multi-user sharing;
- adding password/email authentication unless separately required;
- moving curriculum/catalog source authority out of Git;
- storing transient navigation/audio/animation state in Firestore;
- removing JSON export/import;
- broad unrelated screen redesign.

## Definition of done

Issue #93 is complete when:

1. Google sign-in is an application-level entry boundary integrated with the opening splash experience.
2. A returning authenticated user restores their learner library without manually importing data.
3. Existing local-only progress is migrated to the user's cloud library without loss.
4. Normal learner actions remain local-first and usable offline.
5. Durable learner state synchronizes to the authenticated Firebase account and survives clearing/reinstalling local app storage.
6. Startup reconciliation cannot allow a fresh/default library to overwrite recoverable progress.
7. Invalid local data is preserved/recoverable rather than silently discarded.
8. Conflict behaviour is deterministic, tested and non-destructive.
9. Account switching cannot mix learner data between UIDs.
10. Existing inbox authentication is unified with product-level auth without changing inbox semantics.
11. Firestore rules enforce per-user isolation and all emulator/security tests pass.
12. Export/import remains valid and interoperates deliberately with cloud state.
13. Full repository validation and exact production build pass.
14. Production Firebase configuration/rules are deployed and verified.
15. Physical Pixel/PWA acceptance confirms sign-in, persistence, offline use, relaunch and cloud restore.

## Closeout / housekeeping

When implementation is complete:

- update this document with final implementation decisions that differ from the preferred design above;
- reconcile `docs/open/PROGRESS_ARCHITECTURE.md`, `docs/open/CONTENT_INBOX.md`, README/data-storage documentation and any account/privacy copy;
- move this file from `docs/open/` to `docs/closed/`;
- update issue #93 with the closing evidence/PRs;
- remove obsolete inbox-only auth wording and stale local-only progress claims;
- keep repository status/docs synchronized with merged production reality.
