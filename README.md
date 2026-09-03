# Argus

Argus is a mobile-first library of finite, closed-scope competencies. Each topic has an explicit scored boundary and can be genuinely completed through delayed recall rather than mere exposure.

Argus has two learning interactions:

- **Learn** — ungraded reading/exposure. Every topic exposes its complete finite reference; topics may also carry optional typed explanatory support.
- **Test** — the single scored flashcard/recall interaction. The scheduler decides whether a result is timely enough to advance retention milestones.

`scope` + scored `items` define the finite Test/completion boundary. Optional `topic.learn` content is explanatory only and may be reference-only, concise support, or a structured briefing with sources, limitations and integrated cases where appropriate. It never silently expands the completion claim.

The current local library format is **v4**. Older v2/v3 libraries migrate forward, and JSON export/import preserves structured Learn content.

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

## Durable product/content documentation

- `PRODUCT.md` — implemented product contract
- `DESIGN.md` / `DESIGN.json` — visual and interaction system
- `docs/LEARN_CONTENT_MODEL.md` — v4 structured Learn schema, migration and editorial guidance
- `docs/LIBRARY_AUDIT.md` — shipped-library content audit and implemented outcomes
- `docs/SEEDED_CONTENT_PROVENANCE.md` — authoritative source/boundary record for shipped seed topics
- `docs/PROGRAMME.md` — Learn/Test and content-quality programme ledger

## Application structure

- `src/app/` — application composition and global providers
- `src/components/` — shared UI and layout components
- `src/features/` — domain features
- `src/lib/` — library types, storage/migration, scheduler and seeded data
- `src/styles/` — global tokens and baseline styles
- `public/` — static PWA assets copied directly into the build
- `argus-prd.md` — original product requirements/vision; current implemented behaviour is governed by `PRODUCT.md` and the programme docs above where the early PRD differs

## Deployment

The Pages workflow installs dependencies, runs the production build, and deploys `dist/`. Vite's base path is configured for the `/argus/` GitHub Pages project URL.

GitHub Pages must use **GitHub Actions** as its build and deployment source in the repository settings.
