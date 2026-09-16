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

A Firebase-configured build requires Google sign-in before learning surfaces mount. After Firebase identifies a UID, Argus still keeps the entry gate closed until that account's UID-bound local cache and cloud library have been reconciled. Missing local state restores from cloud; corrupt local bytes are quarantined before cloud recovery; an existing validated local-only library seeds an empty cloud account; a genuinely empty local/cloud pair creates the shipped fresh library only after cloud absence is known.

Once that bootstrap completes, the browser copy is immediate authority for interaction and works offline. Every durable change is written to the UID cache first, cloud writes are coalesced, and failed writes remain pending and retry on backoff/reconnect. Signing out does not destroy that UID's local cache or cloud copy, but the active in-memory learner library is cleared so a different account can never see or inherit it.

The cloud record is still the exact parser-accepted v5 topic JSON, including Morse `lessonSitting`; there is no second Firebase progress model. Concurrent writes use per-topic revisions plus Firestore transactions, and the conservative conflict policy remains: incompatible concurrent edits, edit/delete races, and evidence-reducing remote copies are reported rather than resolved by timestamp last-write-wins.

See `PRODUCT.md`, `docs/closed/ISSUE_93_FIREBASE_PROGRESS_SYNC.md`, and `docs/open/PROGRESS_ARCHITECTURE.md`.

## Durable product and programme documentation

- `docs/README.md` — documentation lifecycle and open/closed housekeeping.
- `PRODUCT.md` — current implemented product contract and design principles.
- `DESIGN.md` / `DESIGN.json` — current visual and interaction system.
- `docs/open/LEARN_CONTENT_MODEL.md` — structured Learn schema/editorial contract.
- `docs/closed/LIBRARY_AUDIT.md` — reconciled shipped-library boundary/content audit.
- `docs/closed/SEEDED_CONTENT_PROVENANCE.md` — authoritative source record for the original seeded topics.
- `docs/open/CONTENT_INBOX.md` — content-inbox and curated-ingestion architecture, and the Firebase setup it needs.
- `docs/closed/ISSUE_93_FIREBASE_PROGRESS_SYNC.md` — Firebase learner-progress recovery/synchronization closeout and Pixel acceptance checklist.
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

Firebase Hosting is the sole deployment target, at the root of its own domain. CI (`.github/workflows/validate.yml`) runs tests and a build sanity check on every push and pull request, but does not deploy; shipping is a deliberate manual step:

```sh
npm run deploy:hosting                  # dist/ -> Firebase Hosting
npm run rules:deploy                    # render + deploy Firestore Security Rules
```

`npm run rules:deploy` needs `ARGUS_OWNER_EMAIL` set to the owner's Google address; see `.env.example`.
