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
- `npm run build:firebase` / `npm run deploy:hosting` — build for the Firebase root path and deploy to Firebase Hosting
- `npm run inbox -- list` / `npm run inbox -- mark-added ...` — maintainer content-inbox ingestion

### Content inbox

Argus can capture "want to learn" notes into a small Firestore inbox, kept entirely outside the local learning library. It is optional: with no Firebase configuration the capture surface reports itself unavailable and the rest of Argus is unaffected. Copy `.env.example` to `.env.local` to configure it. Everything it reads is public web configuration; no privileged credential belongs in the client. See `docs/open/CONTENT_INBOX.md`.

The production site is deployed to **https://benwassa.github.io/argus/** by GitHub Actions whenever `main` is updated.

Argus is also hosted on Firebase at **https://argus-b7a5a.web.app**, which is where signing in and library sync work. The two differ only in where they are served from: Pages uses Vite's default `/argus/` base and Firebase serves from the root, so a Firebase deploy must go through `npm run deploy:hosting` (which sets `ARGUS_BASE=/`). A bundle built for the subpath cannot boot at the root.

## Sync

Signing in with Google keeps the library in step across the owner's own devices. It is optional and local-first: the copy in the browser is what Argus reads and writes, every surface works signed out and offline, and signing out changes nothing locally. Where the same topic changed on two devices, neither copy is overwritten — the conflict is reported on the Data screen. See `PRODUCT.md` and `docs/open/ISSUE_93_FIREBASE_PROGRESS_SYNC.md`.

## Durable product and programme documentation

- `docs/README.md` — documentation lifecycle and open/closed housekeeping.
- `PRODUCT.md` — current implemented product contract and design principles.
- `DESIGN.md` / `DESIGN.json` — current visual and interaction system.
- `docs/open/LEARN_CONTENT_MODEL.md` — structured Learn schema/editorial contract.
- `docs/closed/LIBRARY_AUDIT.md` — reconciled shipped-library boundary/content audit.
- `docs/closed/SEEDED_CONTENT_PROVENANCE.md` — authoritative source record for the original seeded topics.
- `docs/open/CONTENT_INBOX.md` — content-inbox and curated-ingestion architecture, and the Firebase setup it needs.
- `docs/open/REDESIGN_INPUT_AUDIT.md` — current factual screen, state, issue-reconciliation, acceptance, and redesign-risk input package.
- `docs/open/TARGETED_PRACTICE.md` — the formative practice run: its evidence boundary, how it selects what to practise, and why it is not called repair.
- `docs/closed/PROGRAMME.md` — Learn/Test + content-quality programme closeout.
- `docs/closed/MORSE_CODE_LEARNING_PRD.md` — dated Morse research/design baseline retained for rationale; later ratified decisions supersede its deliberately open implementation questions.
- `docs/open/MORSE_PROGRAMME_PLAN.md` — current Morse programme decisions, workstream ownership and implementation status.
- `docs/open/MORSE_CHARACTER_ORDER.md` — shipped character order/packet rule and verified Koch/CW Academy provenance comparison.
- `docs/closed/MORSE_PROVENANCE_RECONCILIATION.md` — provenance/doc-reconciliation closeout for the pre-#28 documentation lane.

`argus-prd.md` is the original July 2026 vision document. Where it describes superseded runtime/schema details, `PRODUCT.md` and the durable programme documents above govern current implemented behaviour.

## Application structure

- `src/app/` — application composition and global providers
- `src/components/` — shared UI and layout components
- `src/features/` — domain features
- `src/lib/` — library types, storage/migration, scheduler, shipped-catalog reconciliation, Morse support and seeded data
- `src/lib/inbox/` — the content-inbox boundary; imports nothing from the learning library
- `scripts/` — maintainer tooling: rules rendering and content-inbox ingestion
- `firestore/` — Firestore Security Rules tests, run against the emulator
- `src/styles/` — global tokens and baseline styles
- `public/` — static PWA assets copied directly into the build

## Deployment

The Pages workflow installs dependencies, runs the production build, and deploys `dist/`. Vite's base path defaults to the `/argus/` GitHub Pages project URL; `ARGUS_BASE` overrides it for a root-served host such as Firebase Hosting.

GitHub Pages must use **GitHub Actions** as its build and deployment source in the repository settings.
