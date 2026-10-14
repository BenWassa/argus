# IndexedDB persistence foundation (#113 Lane A)

**Status:** repository boundary implemented and browser-tested, 2026-10-13; not yet connected to the production LibraryProvider or Firebase sync worker.
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

An acknowledgement removes pending work only if its revision matches the snapshot actually sent. The ledger and queue removal commit atomically. A stale acknowledgement leaves newer work intact; failed ledger writes cannot clear the queue. The future sync integration must account for successful partial remote writes without acknowledging an entire conflicted/failed snapshot.

Connections close on version-change requests. A client cannot downgrade a newer database. Blocked upgrades and unavailable storage reject explicitly. Quota/clone failures reject and roll back, preserving the last committed learner state and queue.

## Verification and remaining work

Forty real-Chromium checks across 320px phone, 390px phone, short landscape and desktop cover creation, legacy migration, interrupted verification, corruption preservation, update composition, atomic rollback, deletion/recreation, reload/offline database access, owner isolation, stale acknowledgements, failed acknowledgements, no-op writes and schema upgrades.

Production provider integration must still make this database canonical and await commits before reporting successful learning actions. #113’s durable sync/retry, provisioned offline auth, cold offline shell/update tests and physical Pixel traces remain open. These repository checks do not establish the full production offline guarantee.

Implementation references: [repository](../../src/infrastructure/persistence/indexedLibraryRepository.ts), [browser tests](../../e2e/indexedLibraryRepository.spec.ts). Durability behavior follows the [IndexedDB standard](https://www.w3.org/TR/IndexedDB/) and browser transaction completion events.
