# IndexedDB persistence foundation (#113 Lane A)

**Status:** repository boundary merged via #205, 2026-10-13. Production LibraryProvider integration is carried by the PR that supersedes draft #214 (branch `fix/214-durability-v2`), which closes #214's two review blockers (account-switch serialization and completion durability, below); the foreground durable Firebase sync worker is now implemented with unit coverage in the #113 runtime worktree; production browser/Pixel acceptance remains open.
**Authority:** maintained schema/repository contract under [#113 offline runtime](ISSUE_113_OFFLINE_FIRST_RUNTIME.md). [Progress architecture](PROGRESS_ARCHITECTURE.md) and the existing v5 parser remain semantic authorities.

## Schema v1

The native `argus.local.v1` database has four owner-keyed stores:

| Store | Contents |
|---|---|
| `libraries` | `{ owner, revision, library }`: validated complete v5 learner record |
| `outbox` | Latest cumulative library snapshot/revision and explicit pending deleted-topic ids |
| `ledgers` | Last acknowledged sync ledger, committed with outbox acknowledgement |
| `migrations` | Legacy source key and read-back verification status |

No Firebase SDK, React state, storage key deletion or fresh-seed fallback exists inside the repository. The caller must select the owner and supply a seed or legacy bytes. Anonymous/unprovisioned bootstrap, owner claiming and auth restoration belong to the integration lanes.

## Initialization and migration

The canonical IndexedDB record wins over any stale legacy copy. Absent canonical data, legacy bytes pass through JSON parsing and the existing version migration/validation boundary. Invalid legacy or canonical data rejects initialization and remains untouched, rather than being replaced with a seed.

The initial library, initial sync intent and unverified migration marker commit together. Initialization reads the committed library back through the parser before marking verification complete. Restarting between these steps resumes verification; a corrupt abandoned legacy key cannot override a valid canonical record. The repository never removes localStorage keys. Cleanup requires a separate explicit policy after the integration verifies the owner’s migrated copy.

## Atomic mutations and queue

Functional `update(owner, current => next)` reads the latest canonical state inside a read/write transaction. Library and sync-intent writes succeed or abort together. The returned promise resolves only on transaction completion. Strict durability is requested when supported; older implementations fall back to the browser default.

The outbox coalesces by retaining one cumulative snapshot per owner. This preserves all history/evidence represented by the learner schema. Deletions accumulate as topic ids until acknowledgement; re-adding a topic clears its pending tombstone. No-op updates create neither a new revision nor new work. Independent owners never share queues.

An acknowledgement removes pending work only if its revision matches the snapshot actually sent. The ledger and queue removal commit atomically. A stale acknowledgement leaves newer work intact; failed ledger writes cannot clear the queue. The runtime checkpoints each successful remote action with `acknowledge(..., keepPending = true)`, which updates the owner ledger without clearing any pending revision. The final acknowledgement still requires the exact sent revision and no conflicts. `readLedger(owner, legacy)` imports the legacy ledger only when no IndexedDB ledger record exists, including an explicit empty baseline, so retired localStorage bytes cannot revive after deletions.

Connections close on version-change requests. A client cannot downgrade a newer database. Blocked upgrades and unavailable storage reject explicitly. Quota/clone failures reject and roll back, preserving the last committed learner state and queue.

## Account lifecycle contract (owner binds)

`bindOwner(uid)` is part of the provider's single write queue, so a bind never overlaps another bind or a library transaction. Each call takes an epoch when it is *called*. A bind that is no longer the newest when it is allowed to start, or at the last point before its first durable write, rejects with `BindSupersededError` having done nothing: it cannot seed a namespace, claim the unclaimed library, move the `argus.library.owner.v1` marker, change the active owner or publish a library. Once its first write has started, a bind is committed and finishes as one step (initialize, reconcile, then marker, active owner and published library with no await between). The newer bind then runs, finds the library already claimed (or the marker set), and seeds its own account from its own parked/legacy data. The unclaimed library therefore seeds at most one UID namespace, and the last-requested account is always the one finally visible. Regressions: `LibraryProvider.test.tsx` (deferred overlapping binds, in both race windows, and an A/B/C overlap).

Write ownership. Every write function the provider hands out (`updateTopic`, `upsertTopic`, `removeTopic`, `replaceLibrary`, `resetLibrary`, the sync merges) is bound to the namespace of the render that returned it, not to whichever account is active when the queue reaches it. If the active account has changed by then, the write is refused (`false`, no global storage alert) and nothing is written: a Test bank, a retry or a late callback made for account A cannot land in account B's namespace or its outbox. Writes issued for A before `bindOwner(B)` was called are queued ahead of the bind and still commit to A. `useSync`'s apply loop checks, before every action and before recording the ledger, that the planned account is still the signed-in one and still owns the library, so a switch mid-loop stops it.

Sign-out calls `cancelPendingBinds()`, which supersedes any bind that has not started writing, so a slow bind cannot publish a library after the learner signed out.

Claiming. The unclaimed library is copied into the claiming account's namespace first and the `argus.library.owner.v1` marker is written last. If that marker write fails, the bind fails and the provider remembers in memory that the unclaimed library was claimed by that account, so no other account can be offered it during the session; the same account can claim again idempotently.

Unreadable legacy data. A corrupt or strict-invalid `argus.library.v5` (or parked) record is copied to the recovery list (`recoveryEntries`) and the learner starts from a fresh seed, as the retired loader did. The original key is never modified, and the canonical IndexedDB record takes precedence on every later start.

Import and reset report the catalog reconciliation of the library actually imported (the first reconciliation), not of the already-reconciled result.

Residual: if `localStorage` rejects the owner marker and the tab is then reloaded, the in-memory claim is forgotten; a different account binding first after that reload could be offered the unclaimed library as well. The marker lives in `localStorage` by design until the owner marker moves into the database.

## Completion durability contract

Durability is awaited at every boundary that announces earned progress; the earned result is retained until it commits.

- **Test and review** (`TestSession`): each bank is tracked (`useDurableWrites`). The result screen is replaced by "Saving your result" while any write is in flight, and by "Result not saved" with *Try saving again* and *Leave without saving* when the device refused one. The banked entries stay in component state, a retry repeats the identical functional update, and `TestDone` (including its completion haptic) mounts only when every write committed. Back is blocked in those two states so a result is never dropped silently.
- **Morse lesson** (`useLessonProgression`/`useLessonRecord`): every lesson write is tracked. The answer that completes a packet is held back from "Lesson N done" until its writes commit (`completionUnconfirmed`); every verdict-to-next-step advance and `nextPacket` (which also closes the sitting) wait for the same. A refused write leaves the verdict on screen with an alert and *Try saving again*; retrying repeats the writes in order and then performs the held move. A second press on *Next lesson* while the close is saving is ignored, so a sitting is never closed twice.
- The synchronous demo/test store returns no promise; tracking is then a no-op and behavior is unchanged.

Regressions: `TestSession.durability.test.tsx` and `useLessonProgression.durability.test.tsx` run the production provider over a repository whose writes can be held and refused.

Not covered (no completion announcement depends on them, failures surface through the provider alert): early-exit cue evidence, Morse placement result, fluency and letter-practice progress, topic-page study resolution.

## Verification and remaining work

Forty real-Chromium checks across 320px phone, 390px phone, short landscape and desktop cover creation, legacy migration, interrupted verification, corruption preservation, update composition, atomic rollback, deletion/recreation, reload/offline database access, owner isolation, stale acknowledgements, failed acknowledgements, no-op writes and schema upgrades.

The production-provider integration (originally draft #214) integrates the provider with the canonical database, awaits local commits before publishing state, retains recoverable legacy bytes, and gates sync on asynchronous UID binding. Its review blockers are closed by the two contracts below. #113’s durable sync/retry and provisioned offline auth fallback now have unit coverage. Production cold offline shell/update checks and physical Pixel traces remain open. These repository checks do not establish the full production offline guarantee.

Implementation references: [repository](../../src/infrastructure/persistence/indexedLibraryRepository.ts), [browser tests](../../e2e/indexedLibraryRepository.spec.ts). Durability behavior follows the [IndexedDB standard](https://www.w3.org/TR/IndexedDB/) and browser transaction completion events.
