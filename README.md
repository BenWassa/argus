# Argus

Argus is a mobile-first library of finite, closed-scope competencies. Each topic has an explicit scored boundary and can be genuinely completed through delayed recall rather than mere exposure.

Argus has two learning interactions:

- **Learn** — ungraded reading/exposure. Every topic exposes its complete finite reference; topics may also carry optional typed explanatory support.
- **Test** — the single scored recall interaction. The scheduler decides whether a result is timely enough to advance retention milestones.

`scope` + scored `items` define the finite Test/completion boundary. Optional `topic.learn` content is explanatory only and never silently expands that claim.

The current local library format is **v5**. v5 adds stable item identity, typed item directionality and per-item cue/evidence state while keeping acquisition evidence structurally separate from scheduler/retention history. Older supported libraries migrate forward, and JSON export/import preserves durable learning state.

## Development

Argus is a Vite + React + TypeScript web app. From the repository root:

```sh
npm install
npm run dev
```

Other commands:

- `npm run check` — run the test suite, type-check and production build
- `npm run build` — type-check and create the production build in `dist/`
- `npm run preview` — serve the production build locally
- `npm run typecheck` — run TypeScript without building

The production site is deployed to **https://benwassa.github.io/argus/** by GitHub Actions whenever `main` is updated.

## Durable product and programme documentation

- `PRODUCT.md` — current implemented product contract and design principles.
- `DESIGN.md` / `DESIGN.json` — current visual and interaction system.
- `docs/LEARN_CONTENT_MODEL.md` — structured Learn schema/editorial contract.
- `docs/LIBRARY_AUDIT.md` — reconciled shipped-library boundary/content audit.
- `docs/SEEDED_CONTENT_PROVENANCE.md` — authoritative source record for the original seeded topics.
- `docs/PROGRAMME.md` — Learn/Test + content-quality programme closeout.
- `docs/MORSE_CODE_LEARNING_PRD.md` — dated Morse research/design baseline retained for rationale; later ratified decisions supersede its deliberately open implementation questions.
- `docs/MORSE_PROGRAMME_PLAN.md` — current Morse programme decisions, workstream ownership and implementation status.
- `docs/MORSE_CHARACTER_ORDER.md` — shipped pre-#28 order/packet rule and verified Koch/CW Academy provenance comparison.
- `docs/MORSE_PROVENANCE_RECONCILIATION.md` — provenance/doc-reconciliation closeout for the pre-#28 documentation lane.

`argus-prd.md` is the original July 2026 vision document. Where it describes superseded runtime/schema details, `PRODUCT.md` and the durable programme documents above govern current implemented behaviour.

## Application structure

- `src/app/` — application composition and global providers
- `src/components/` — shared UI and layout components
- `src/features/` — domain features
- `src/lib/` — library types, storage/migration, scheduler, Morse support and seeded data
- `src/styles/` — global tokens and baseline styles
- `public/` — static PWA assets copied directly into the build

## Deployment

The Pages workflow installs dependencies, runs the production build, and deploys `dist/`. Vite's base path is configured for the `/argus/` GitHub Pages project URL.

GitHub Pages must use **GitHub Actions** as its build and deployment source in the repository settings.
