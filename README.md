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
- `npm run inbox -- list` / `npm run inbox -- mark-added ...` — maintainer content-inbox ingestion

### Content inbox

Argus can capture "want to learn" notes into a small Firestore inbox, kept entirely outside the local learning library. It is optional: with no Firebase configuration the capture surface reports itself unavailable and the rest of Argus is unaffected. Copy `.env.example` to `.env.local` to configure it. Everything it reads is public web configuration; no privileged credential belongs in the client. See `docs/open/CONTENT_INBOX.md`.

The production site is **https://argus-b7a5a.web.app**, on Firebase Hosting. GitHub Pages is retired; the app is served from the root of its own domain and `npm run deploy:hosting` is the whole deploy.

## Sync

Signing in with Google keeps the library in step across the owner's own devices. Once signed in, the copy in the browser is what Argus reads and writes and every surface works offline exactly as before, and signing out changes nothing locally. Where the same topic changed on two devices, neither copy is overwritten — the conflict is reported in Profile.

The production build asks who you are before showing anything, so sign-in is not optional there. A build with no Firebase configuration — what the browser test suite runs against — has nothing to gate and stays entirely local. See `PRODUCT.md` and `docs/open/ISSUE_93_FIREBASE_PROGRESS_SYNC.md`.

## Durable product and programme documentation

- `docs/README.md` — documentation lifecycle and open/closed housekeeping.
- `PRODUCT.md` — current implemented product contract and design principles.
- `DESIGN.md` / `DESIGN.json` — current visual and interaction system.
- `docs/open/LEARN_CONTENT_MODEL.md` — structured Learn schema/editorial contract.
- `docs/open/ISSUE_104_EDITORIAL_IDENTITY.md` — active editorial direction for expanding Argus as an evidence-based practical miscellany.
- `docs/open/ISSUE_104_LIBRARY_EXPANSION_RESEARCH.md` — first-pass research and admission criteria for compact finite-recall topics.
- `docs/open/ISSUE_104_FIELD_HUMAN_SKILLS_EXPANSION.md` — companion research for practical human-systems skills and scenario-based learning; detailed candidate papers live under `docs/open/library-research/`.
- `docs/closed/LIBRARY_AUDIT.md` — reconciled shipped-library boundary/content audit.
- `docs/closed/SEEDED_CONTENT_PROVENANCE.md` — authoritative source record for the original seeded topics.
- `docs/open/CONTENT_INBOX.md` — content-inbox and curated-ingestion architecture, and the Firebase setup it needs.
- `docs/open/REDESIGN_INPUT_AUDIT.md` — current factual screen, state, issue-reconciliation, acceptance, and redesign-risk input package.
- `docs/open/TARGETED_PRACTICE.md` — the formative practice run: its evidence boundary, how it selects what to practise, and why it is not called repair.
- `docs/closed/PROGRAMME.md` — Learn/Test + content-quality programme closeout.
- `docs/closed/MORSE_CODE_LEARNING_PRD.md` — dated Morse research/design baseline retained for rationale; later ratified decisions supersede its deliberately open implementation questions.
- `docs/open/MORSE_PROGRAMME_PLAN.md` — current Morse programme decisions, workstream ownership and implementation status.
- `docs/open/MORSE_CHARACTER_ORDER.md` — shipped character order/packet rule and verified Koch/CW Academy provenance comparison.
- `docs/open/ISSUE_105_MORSE_PLACEMENT_ASSESSMENT.md` — maintained contract for fresh-start Morse placement, bounded confirmation, and evidence-safe progress application.
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
