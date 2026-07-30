# Argus

Argus is a mobile-first library of finite, closed-scope competencies. Each topic has a defined boundary and can be genuinely completed through delayed recall rather than mere exposure.

## Beta

The beta is a static, local-first progressive web app. Practice data remains in the browser and can be exported or imported as JSON.

**Beta URL:** https://benwassa.github.io/argus/

## Repository contents

- `argus-prd.md` — product requirements and scope
- `argus-pwa.zip` — self-contained beta application package
- `.github/workflows/pages.yml` — GitHub Pages deployment workflow

## Deployment

The Pages workflow extracts `argus-pwa.zip`, renames `argus-app.html` to `index.html`, and deploys the resulting static site. It runs from `main` and `agent/github-pages-beta`.

GitHub Pages must use **GitHub Actions** as its build and deployment source in the repository settings.
