# Argus

Argus is a mobile-first library of finite, closed-scope competencies. Each topic has a defined boundary and can be genuinely completed through delayed recall rather than mere exposure.

## Development

Argus is a Vite + React + TypeScript web app. From the repository root:

```sh
npm install
npm run dev
```

Other commands:

- `npm run build` — type-check and create the production build in `dist/`
- `npm run preview` — serve the production build locally
- `npm run typecheck` — run TypeScript without building

The production site is deployed to **https://benwassa.github.io/argus/** by GitHub Actions whenever `main` is updated.

## Design direction

Argus uses an **Operate-mode** interface: task-first, restrained, accessible, and optimized for short practice sessions. The current design pass follows the open-source Impeccable frontend skill.

- `DESIGN.md` — durable visual system and interaction rules
- `src/styles/tokens.css` — the design system as CSS custom properties, and the only place a colour, radius, or type step is defined
- `.impeccable/critique/` — archived design critique and remaining issues

## Application structure

- `src/app/` — application composition and global providers
- `src/components/` — shared UI and layout components
- `src/features/` — domain features, kept independent as they grow
- `src/styles/` — global tokens and baseline styles
- `public/` — static PWA assets copied directly into the build
- `argus-prd.md` — product requirements and scope

## Deployment

The Pages workflow installs dependencies, runs the Vite production build, and deploys `dist/`. Vite's base path is configured for the `/argus/` GitHub Pages project URL.

GitHub Pages must use **GitHub Actions** as its build and deployment source in the repository settings.
