# Issue #93 — Firebase learner-progress safety closeout

Status: **deterministic engineering complete; physical Pixel acceptance remains.**

Issue: #93  
Closeout PR: #101  
Production host: `https://argus-b7a5a.web.app`

This document records the implementation that supersedes the original open #93 proposal. `PRODUCT.md` remains product authority and `docs/open/PROGRESS_ARCHITECTURE.md` remains progress-semantics authority.

## Shipped architecture

Argus remains local-first after authentication. A configured production build requires Google sign-in before any learner surface mounts. After Firebase identifies a UID, the gate remains closed while Argus resolves that UID's local/cloud recovery matrix; authenticated identity alone does not expose a fresh or stale learner library.

The canonical model remains `CurrentLibrary` / `Topic` v5. Firestore stores the exact parser-accepted topic JSON under `users/{uid}/library/{topicId}` plus library-level catalog-delivery metadata under `users/{uid}/libraryMeta/library`. Cloud data always re-enters through the existing parser and catalog reconciliation boundary. Sync does not create a parallel progress schema or change acquisition, evidence, retention, scheduler, completion, or Morse policy.

Each authenticated UID has a separate local cache envelope. The former global `argus.library.v5` record is a one-time migration source only; once claimed it cannot be silently reused for another UID. Signing out clears the active in-memory learner view but does not destroy that UID's local cache or cloud copy. Account switching therefore cannot expose or upload another UID's learner library.

## Startup recovery matrix

After auth restoration resolves, startup behaves as follows:

- **Missing local + valid cloud:** restore the validated cloud library before opening the app.
- **Corrupt local + valid cloud:** preserve the raw corrupt local payload in the UID recovery store, then restore cloud.
- **Valid existing local + no cloud:** migrate/validate the local library and seed the authenticated cloud namespace.
- **Neither local nor cloud:** create the normal shipped fresh library once, then persist it locally and to cloud.
- **Established UID cache + temporary cloud outage:** open the validated UID cache offline and keep sync pending.
- **First binding with only legacy/fresh state + cloud unavailable:** keep the learner gate closed. Argus cannot prove that a recoverable remote library does not exist, so it does not risk replacing one.

A stale sync ledger is ignored when there is no trustworthy shared ancestor, including a totally absent cloud namespace. This prevents an old ledger from turning recovery into a mass deletion.

## Local-first writes and retry

Learner mutations write the authenticated UID cache immediately. Cloud writes are coalesced and run behind the learner interaction. Failed writes leave a durable per-UID pending marker and retry with bounded exponential backoff; reconnect also triggers a retry. A cloud failure never rolls back a successful local learner action.

Import remains an explicit local replacement through the existing parser/reconciliation boundary; after replacement it follows the same UID-cache and cloud-sync path. Reset remains deliberate and propagates as an explicit replacement/deletion set rather than as an implicit recovery decision. JSON export remains independent recovery/portability.

## Conflict and write safety

Argus still does **not** use timestamp last-write-wins.

`src/lib/sync/plan.ts` remains the semantic conflict policy:

- independent topics can synchronize independently;
- incompatible concurrent edits are reported and neither copy is overwritten;
- a remote copy that would reduce attempts/history or item evidence is refused;
- local edit versus remote delete is a conflict;
- local delete versus newer remote edit is a conflict.

The Firestore boundary now enforces the planner's assumptions with transactions and monotonic revisions. Topic creation starts at revision 1; updates must advance exactly one revision; push and delete transactions compare the revision they observed before committing. An idempotent retry of the same revision and JSON is accepted. This closes the race where two devices could previously plan safely against a snapshot and then blind-write over each other.

Firestore Security Rules continue to enforce verified-owner identity plus UID path isolation, bounded payloads and server timestamps, and now also enforce topic revision monotonicity.

## Durable learner state

Sync carries every durable field accepted by the canonical parser, including scheduler timestamps/status, history, completion record, user topics, catalog-delivery state, `lessonProgress`, `itemEvidence`, `morseReview`, acquisition-readiness state and Morse `lessonSitting`.

`lessonSitting` was already made canonical durable topic state by #66; #93 does not introduce a second sitting store. The closeout matrix explicitly verifies its cloud round-trip together with history/evidence.

## Automated closeout matrix

The #101 tests cover:

- local-only existing learner migration to an empty cloud account;
- fresh install / cloud restore;
- corrupt-local quarantine and cloud recovery;
- neither-side fresh creation only after cloud absence is known;
- no transient learner-surface exposure before bootstrap completes;
- established offline UID-cache entry;
- local write coalescing, failed-write durability and retry;
- reconnect-compatible pending state;
- account-switch cache isolation;
- Morse `lessonSitting` + history/evidence parser/cloud round-trip;
- deliberate import followed by synchronization;
- concurrent edit/edit and edit/delete conflict preservation;
- Firestore Security Rules through the emulator;
- the existing full unit, production-build and browser regression gates.

## Production closeout

Repository production configuration remains:

- Firebase Hosting is the sole production host;
- Firestore uses `firestore.rules` rendered from `firestore.rules.template`;
- Google Auth is the configured provider;
- deployment is deliberately manual through `npm run deploy:hosting` and `npm run rules:deploy`;
- CI validates but does not deploy.

The repository/API execution environment used for #101 can validate the production build and emulator rules but does not hold the maintainer's Firebase CLI credentials, rendered owner-specific rules file or local Firebase project alias. Therefore a production rules deployment must be verified from the authenticated maintainer environment after #101 is merged. Do not infer deployment from green CI.

Required maintainer verification:

```sh
ARGUS_OWNER_EMAIL=<owner-address> npm run rules:deploy
npm run rules:check
npm run deploy:hosting
```

Then confirm the production host serves the merged build and that an authenticated sync write succeeds under the deployed rules.

## Pixel acceptance checklist

Physical-device acceptance may follow deterministic engineering closeout:

- launch/install the production PWA and verify Google sign-in completes;
- confirm no Today/Library learner state appears before bootstrap finishes;
- advance ordinary and Morse progress, including an in-progress Morse sitting;
- go offline, continue learning, close/relaunch, and confirm the UID cache resumes safely;
- reconnect and confirm the pending work synchronizes without a rollback;
- clear/reinstall local app storage, sign back in, and confirm cloud progress restores;
- sign out and, if testing another Google account, confirm no prior-account learner data flashes or migrates;
- verify export/import/reset remain explicit and behave as described above.

No #29 or #79 work is part of this closeout.
