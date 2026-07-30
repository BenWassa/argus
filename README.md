# Argus

Argus is a mobile-first library of finite, closed-scope competencies. Each topic has a defined boundary and can be genuinely completed through delayed recall rather than mere exposure.

## Beta

The beta is a static, local-first progressive web app. Practice data remains in the browser and can be exported or imported as JSON.

**Beta URL:** https://benwassa.github.io/argus/

## Design direction

Argus uses an **Operate-mode** interface: task-first, restrained, accessible, and optimized for short practice sessions. The current design pass follows the open-source Impeccable frontend skill.

- `DESIGN.md` — durable visual system and interaction rules
- `.impeccable/critique/` — archived design critique and remaining issues
- `impeccable.css` — responsive task-first presentation layer
- `impeccable.js` — progressive semantic and interaction enhancements

## Repository contents

- `argus-prd.md` — product requirements and scope
- `argus-pwa.zip` — self-contained application package
- `.github/workflows/pages.yml` — GitHub Pages build and deployment workflow

## Deployment

The Pages workflow extracts `argus-pwa.zip`, preserves `argus-app.html`, creates `index.html`, injects the Impeccable CSS and JavaScript layers, updates the offline cache, and deploys the resulting static site. It runs from `main` and the active design branch.

GitHub Pages must use **GitHub Actions** as its build and deployment source in the repository settings.
