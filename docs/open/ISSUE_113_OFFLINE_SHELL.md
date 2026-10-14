# Production offline shell and update safety (#113 Lane C)

**Status:** hardening merged via #206, 2026-10-13; browser verification complete, not yet released or deployed.
**Authority:** maintained service-worker contract under [#113](ISSUE_113_OFFLINE_FIRST_RUNTIME.md). This proves app-shell availability, not provisioned Firebase offline auth or IndexedDB integration.

## Build and installation

The existing Vite plugin derives precache files from the built output. It installs all ordinary code, curriculum/reference data and bundled media; no topic download controls are added. The cache revision now hashes worker behavior as well as the asset names/content, so a changed worker cannot accidentally reuse the active cache generation.

Installation completes the entire required precache before requesting activation. Failed installation deletes only its failed generation and leaves the previous active shell usable. Cross-origin calls and non-GET requests bypass the worker.

## Navigation and assets

A worker serves the HTML installed with its own generation, including when online. It never caches newer network HTML under an older worker’s shell; that would make an offline launch reference unavailable chunks. Update discovery remains the existing hourly/reconnect/pageshow/visibility registration policy. The updated worker claims clients; the existing controllerchange handler reloads a previously controlled app once.

Precached resources prefer the current generation. Hashed assets requested by older still-open clients may fall back to the retained previous generation, preserving lazy chunks through the controller/reload handoff. Non-precache same-origin requests bypass shell caching, so a future API route cannot silently become an app-shell cache entry.

Activation retains the current and most recent known-good previous generation. Later successful activation removes older generations. Failed-generation cleanup prevents an incomplete cache from displacing the previous known-good cache.

## Verification

Eight browser checks across the four configured viewports cover:

- installation of the actual production artifact, offline document navigation, ordinary topic navigation and reload;
- a fixture update whose required chunk returns 503, leaving the previous shell available offline;
- a successful update serving its own HTML offline and retaining an old lazy chunk;
- a third successful generation cleaning only the oldest cache.

The artifact test uses the supported local-only build. It does not certify configured Firebase’s returning-owner offline startup; that remains #113 Lane D plus Pixel acceptance. Build sizing already reports the executable shell and media footprint under a maintained budget; this work does not claim that sizing was absent.

Implementation references: [worker generator](../../scripts/serviceWorker.ts), [Vite integration](../../vite.config.ts), [browser tests](../../e2e/offlineShell.spec.ts).
