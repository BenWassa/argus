# Argus

Argus is a mobile-first library of finite, closed-scope competencies. Each topic has an explicit scored boundary and can be genuinely completed through delayed recall rather than mere exposure.

Argus has two learning interactions:

- **Learn** — ungraded/formative acquisition. Ordinary topics use reading/exposure and their complete finite reference; progressive topics such as Morse may also use guided formative retrieval, replay and application activities. Learn never creates formal Test evidence or retention completion.
- **Test** — the single scored recall interaction. The scheduler decides whether a result is timely enough to advance retention milestones.

`scope` + scored `items` define the finite Test/completion boundary. Optional `topic.learn` content is explanatory only and never silently expands that claim.

The current local library format is **v5**. v5 adds stable item identity, typed item directionality and per-item cue/evidence state while keeping acquisition evidence structurally separate from scheduler/retention history. Older supported libraries migrate forward, and JSON export/import preserves durable learning state. v5 records additionally carry catalog provenance (`Topic.origin` and the library's `catalogDelivered` list) so newly shipped topics can be delivered to an existing library without touching anything already in it.

## Development

Argus is a Vite + React + TypeScript web app. From the repository root:

```sh
npm install
npm run dev
```

Other commands:

- `npm run check` — run the test suite, type-check, production build and the browser suite
- `npm run build` — type-check and create the production build in `dist/`
- `npm run preview` — serve the production build locally
- `npm run typecheck` — run TypeScript without building
- `npm run test:browser` — run the Playwright suite against the built app at phone, short-landscape and desktop sizes (needs `npx playwright install chromium` once)
- `npm run test:rules` — run the Firestore Security Rules suite against a local emulator (needs Java)
- `npm run inbox:rules` — render `firestore.rules` from its template for the configured owner (`ARGUS_OWNER_EMAIL`)
- `npm run rules:deploy` — re-render the rules and deploy them; `npm run rules:check` refuses a ruleset left behind by the emulator suite
- `npm run deploy:hosting` — build and deploy to Firebase Hosting
- `npm run build:demo` / `npm run preview:demo` — build the embeddable demo into `dist-demo/` and serve it at http://localhost:4174/argus/ (see Demo build)
- `npm run inbox -- list` / `npm run inbox -- mark-added ...` — maintainer content-inbox ingestion

### Content inbox

Argus can capture "want to learn" notes into a small Firestore inbox, kept entirely outside the local learning library. It is optional: with no Firebase configuration the capture surface reports itself unavailable and the rest of Argus is unaffected. Copy `.env.example` to `.env.local` to configure it. Everything it reads is public web configuration; no privileged credential belongs in the client. See `docs/open/CONTENT_INBOX.md`.

The production site is **https://argus-b7a5a.web.app**, on Firebase Hosting. GitHub Pages no longer serves the app, only the embeddable demo (see Demo build); the app is served from the root of its own domain and `npm run deploy:hosting` is the whole deploy.

## Demo build

`npm run build:demo` (`vite build --mode demo`) produces an embeddable, local-only copy of Argus for the portfolio. It needs no secrets: `.env.demo` is committed and blanks every Firebase value, and a demo build ignores Firebase configuration regardless.

- It opens on the shipped catalog with sample progress already on it (the repository's own `seedLibrary()` fixture: a drilled NATO alphabet, an OODA loop in learning, a banked bearings topic), so Today and Library are populated on first load.
- It is local by construction: no sign-in, no sync, no inbox and no service worker.
- It never reads or writes the library in browser storage, so a reload always returns to the same sample and a real library under the same origin is never touched. Reset in Profile returns to the sample.
- It is a property of the build, not the URL. `?mode=demo` does nothing, and the production build cannot enter demo mode.
- It writes to `dist-demo/`, never `dist/`, so `firebase deploy` can never upload a demo.

`.github/workflows/demo-pages.yml` builds it with base `/argus/` and publishes it to https://benwassa.github.io/argus/ on every push to `main`. Pull requests build and check the artifact without deploying. Production is unchanged: Firebase Hosting, deployed by hand with `npm run deploy:hosting`.

## Sync

Signing in with Google keeps the library in step across the owner's own devices. The copy in the browser remains the interaction authority, and signing out leaves that local copy untouched. Where the same topic changed on two devices, neither copy is overwritten — the conflict is reported in Profile.

The production build asks who you are before showing anything, so sign-in is not optional there. A build with no Firebase configuration — what the browser test suite runs against — has nothing to gate and stays entirely local.

The **full offline-first runtime guarantee is active scope in #113**, not yet a claim about the current localStorage/service-worker implementation. #113 moves canonical persistence to IndexedDB, makes sync intent durable across restart, hardens provisioned-device offline auth startup and makes the production Vite app shell deterministic for cold offline launch. See `PRODUCT.md`, `docs/open/ISSUE_93_FIREBASE_PROGRESS_SYNC.md` and `docs/open/ISSUE_113_OFFLINE_FIRST_RUNTIME.md`.

## Durable product and programme documentation

- `docs/README.md` — documentation lifecycle and open/closed housekeeping.
- `PRODUCT.md` — current implemented product contract and design principles.
- `DESIGN.md` / `DESIGN.json` — current visual and interaction system.
- `docs/LIBRARY_ROADMAP.md` — authoritative library-expansion priorities, families, issue ownership and execution order.
- `docs/LIBRARY_RESEARCH_METHOD.md` — authoritative method for source hierarchy, completion claims, media choice, claim traceability, QA and implementation handoff for new library topics.
- `docs/open/LIBRARY_TOPIC_ICONS.md` — active visual and asset contract for shipped topic icons on Library and Today.
- `docs/open/LEARN_CONTENT_MODEL.md` — structured Learn schema/editorial contract.
- `docs/open/AUDIO_DRILLS_RUNTIME.md` — maintained contract for prerecorded speech drills: audio stimulus and response modes, deterministic grading, separate listening evidence, transcript-assisted rule and the production asset-QA gate.
- `docs/open/ISSUE_146_VISUAL_CONTENT_PRIMITIVES.md` — maintained contract for the shared visual Learn block, visual-choice items and the finite figure registry.
- `docs/closed/ISSUE_104_EDITORIAL_IDENTITY.md` — historical editorial framing from the completed #104 expansion programme.
- `docs/closed/ISSUE_104_LIBRARY_EXPANSION_RESEARCH.md` — historical first-pass library research; its Batch A shipped as five catalog topics.
- `docs/closed/ISSUE_104_FIELD_HUMAN_SKILLS_EXPANSION.md` — historical practical human-systems research; detailed candidate papers remain under `docs/open/library-research/` as source material.
- `docs/closed/ISSUE_104_SCENARIO_ITEMS.md` — historical proposal for generic authored scenario items.
- `docs/open/ISSUE_138_MARITIME_VISUAL_LITERACY.md` — active P0 research brief for vessel orientation, navigation lights/day shapes and signal flags.
- `docs/open/ISSUE_139_RADIO_COMMUNICATIONS_AUDIO.md` — active P0 research brief for source-scoped radio procedure and audio drills.
- `docs/open/ISSUE_140_COMPASS_BEARINGS_TOPO.md` — active P0 compass/bearings research plus the P1 topographic-map spike.
- `docs/open/ISSUE_141_CLOUD_WEATHER_RECOGNITION.md` — active P0 cloud/weather recognition research; #131 remains downstream.
- `docs/open/ISSUE_127_TODAY_REDESIGN_CONCEPTS.md` — proposed concepts for what Today holds and how it behaves (#127), companion to the visual-styling exploration in #126.
- `docs/closed/LIBRARY_AUDIT.md` — reconciled shipped-library boundary/content audit.
- `docs/closed/SEEDED_CONTENT_PROVENANCE.md` — authoritative source record and Test boundary for every shipped catalog topic.
- `docs/open/CONTENT_INBOX.md` — content-inbox and curated-ingestion architecture, and the Firebase setup it needs.
- [Topic colour comparison](docs/open/TOPIC_COLOUR_SPIKE.md) — development-only current/raised previews and reproducible 390 px screen captures; owner choice pending.
- `docs/open/REDESIGN_INPUT_AUDIT.md` — current factual screen, state, issue-reconciliation, acceptance, and redesign-risk input package.
- `docs/open/TARGETED_PRACTICE.md` — the formative practice run: its evidence boundary, how it selects what to practise, and why it is not called repair.
- `docs/closed/PROGRAMME.md` — Learn/Test + content-quality programme closeout.
- `docs/closed/MORSE_CODE_LEARNING_PRD.md` — dated Morse research/design baseline retained for rationale; later ratified decisions supersede its deliberately open implementation questions.
- `docs/open/MORSE_PROGRAMME_PLAN.md` — current Morse programme decisions, workstream ownership and implementation status.
- `docs/open/MORSE_CHARACTER_ORDER.md` — shipped character order/packet rule and verified Koch/CW Academy provenance comparison.
- `docs/open/ISSUE_105_MORSE_PLACEMENT_ASSESSMENT.md` — maintained contract for fresh-start Morse placement, bounded confirmation, and evidence-safe progress application.
- `docs/open/MORSE_AUDIO_RUNTIME.md` — maintained Web Audio lifecycle and first-press regression contract for every Morse audio surface.
- `docs/open/MORSE_FLUENCY.md` — maintained contract for the post-acquisition Fluency surface: the pinned character speed and Farnsworth ladder, the four modes, the automaticity measures, the haptic vocabulary and the formative-only evidence boundary.
- `docs/open/MORSE_INTERMEDIATE_PATH.md` — maintained contract for Morse after the alphabet: the uncued Test floor, a full check or a short review whenever the learner chooses, Copy (letters to sentences, figures and punctuation), free play and the spacing ladder to 20 WPM.
- `docs/closed/ISSUE_119_MORSE_POST_ACQUISITION_FLUENCY_RESEARCH.md` — the sources, architecture audit and rejected options behind `MORSE_FLUENCY.md`.
- `docs/open/ISSUE_113_OFFLINE_FIRST_RUNTIME.md` — active contract for IndexedDB local authority, durable sync/outbox, deterministic offline PWA launch, storage lifecycle and content-size/download policy.
- `docs/closed/MORSE_PROVENANCE_RECONCILIATION.md` — provenance/doc-reconciliation closeout for the pre-#28 documentation lane.

`argus-prd.md` is the original July 2026 vision document. Where it describes superseded runtime/schema details, `PRODUCT.md` and the durable programme documents above govern current implemented behaviour.

## Application structure

- `src/app/` — application composition: providers, routing and the sign-in gate
- `src/domain/` — the learning model and the rules over it, with no React in
  it: `library/` (topics, items, shipped catalog), `study/` (scheduling, the
  journey, the cue ladder, practice) and `morse/` (the code, its curriculum and
  its acquisition profile). Two modules here do touch the browser —
  `morse/audio.ts` for Web Audio and `morse/curriculum/lessonSittingStorage.ts`
  for the retired sitting sidecar — and are the exceptions, not the rule
- `src/features/` — the surfaces a learner sees, one folder per feature
- `src/services/` — application services: `sync/`, `inbox/` and the library
  provider. `inbox/` is a boundary that imports nothing from the learning library
- `src/infrastructure/` — `persistence/`: parsing, migration and the local
  library repository
- `src/shared/` — UI and layout used across features
- Layer boundaries are enforced by `src/architecture.test.ts`, which is what keeps
  the folders above meaning something: dependencies run domain -> infrastructure
  -> services -> features -> app, the domain holds no React, and no feature
  reaches inside another
- `src/styles/` — global tokens and baseline styles
- `scripts/` — maintainer tooling: rules rendering and content-inbox ingestion
- `firestore/` — Firestore Security Rules tests, run against the emulator
- `public/` — static PWA assets copied directly into the build

## Deployment

Firebase Hosting is the sole deployment target, at the root of its own domain. CI (`.github/workflows/validate.yml`) runs tests and a build sanity check on every push and pull request, but does not deploy; shipping is a deliberate manual step:

```sh
npm run deploy:hosting                  # dist/ -> Firebase Hosting
npm run rules:deploy                    # render + deploy Firestore Security Rules
```

`npm run rules:deploy` needs `ARGUS_OWNER_EMAIL` set to the owner's Google address; see `.env.example`.