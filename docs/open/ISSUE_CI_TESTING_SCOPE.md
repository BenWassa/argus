# CI and test-time scope — Issue #273

> **Status:** open discovery and measurement work, 2026-10-19. No CI behavior is changed by this document.
>
> **Authority:** durable scope and acceptance contract for [GitHub issue #273](https://github.com/BenWassa/argus/issues/273). This document records the current repository surface and the evidence required before implementation issues are split out.

## Why this exists

Argus CI and the local `npm run check` path now exercise several distinct
quality boundaries. They are valuable, but increasingly slow to use as the
application and test suites grow. The immediate need is to understand where
time is spent and where work is duplicated before changing coverage, required
checks, or execution policy.

This is an investigation issue, not a request to remove tests. The first
deliverable is a measured, reviewable proposal. Any optimization that changes
coverage or blocking behavior should be implemented in a separate follow-up
issue.

## Baseline inventory

Baseline commit: `573051176751f849fbf693e5908a26f52ad6b79d` on `main`,
recorded 2026-10-19.

| Surface | Current baseline |
| --- | --- |
| Unit/application test files | 156 |
| Browser spec files | 31 |
| Firestore Rules spec files | 1 |
| Unit and Rules test declarations | approximately 1,515 |
| Playwright test declarations | approximately 134 |
| CI validation jobs | `web`, `browser`, `rules` |
| Demo workflow jobs | `build`, `deploy` |
| Browser projects | `phone-320`, `phone-390`, `landscape-short`, `desktop-pointer` |

The counts are inventory indicators, not performance measurements. They should
be refreshed when baseline timing is collected.

## Current local commands

| Command | What it exercises | Important setup |
| --- | --- | --- |
| `npm run test` | Vitest application/unit suite | No emulator or browser required |
| `npm run build` | TypeScript build, Vite production build, badge preparation, size report | May receive Firebase variables in CI |
| `npm run test:browser` | Playwright against a production preview | The Playwright web server runs `npm run build:e2e` first |
| `npm run test:rules` | Firestore Rules tests | Renders rules, starts a Firestore emulator, requires Java |
| `npm run check` | Unit tests, build, then browser tests | Sequential local convenience command; Rules are separate |
| `npm run build:demo` | Demo-mode TypeScript/Vite build | Used by the Pages workflow |

The browser command is not just a test runner: its configured web server
performs a separate `build:e2e` before starting Vite Preview. The normal
validation `web` job also runs `npm run build`.

## Current GitHub Actions graph

### `.github/workflows/validate.yml`

The workflow runs for pull requests targeting `main` or `feat/ui-overhaul`, for
pushes to `main`, and manually. Concurrency cancels older runs for the same
ref.

| Job | Steps with likely time cost | Notes |
| --- | --- | --- |
| `web` | `npm ci`, `npm run test`, `npm run build` | Own runner and dependency install |
| `browser` | `npm ci`, `npx playwright install --with-deps chromium`, browser suite | Own runner, two CI workers, one retry, report artifact on failure |
| `rules` | Java setup, `npm ci`, `npm run test:rules` | Own runner, Firestore emulator, serialized Rules suite |

The three jobs intentionally preserve separate failure boundaries, but they
also repeat dependency installation. The browser job performs its own build
through `playwright.config.ts`; that build is not reused from `web`.

### `.github/workflows/demo-pages.yml`

This workflow runs a demo build/check on pull requests with selected demo
inputs, and builds/deploys on `main`. Its build job independently runs
`npm ci` and `npm run build:demo`. The workflow is deliberately separate from
production validation and deployment, so any deduplication proposal must
preserve that separation and the demo artifact safety checks.

## Questions the investigation must answer

### Timing and resource use

- What is the wall-clock duration of each job and each step on cache hits and
  misses?
- How much time is spent in `npm ci`, Playwright browser/dependency setup,
  Java/emulator startup, test discovery, test execution, builds, retries, and
  artifact upload?
- Which tests or files dominate unit, browser, and Rules runtime?
- How much CPU and memory do the suites use, and are the current worker limits
  throughput-optimal or contention-bound?
- How often do retries add time, and which tests cause them?

### Duplication and caching

- Can a build artifact be safely shared with browser tests instead of building
  again?
- Can dependency installation be reduced without coupling unrelated failure
  boundaries?
- Are npm and Playwright caches effective on the actual hosted runners?
- Does the demo workflow duplicate work that should remain independent because
  it validates a different artifact?
- Does `npm run check` need a fast local lane in addition to the full lane?

### Policy and coverage

- Which workflow checks are required branch protections?
- Which checks must block every pull request, and which can be conditional on
  changed paths or run asynchronously?
- Can tests be partitioned by stable ownership or duration without making
  failures harder to diagnose?
- Are the four browser viewports still the right blocking matrix?
- What coverage or confidence would be lost by every proposed optimization?

## Required evidence

Record timing data with:

- workflow run URL, commit SHA, date, event type, and runner image;
- cache state (warm/cold/unknown), Node/Java/Playwright versions, and worker
  count;
- job and step wall-clock durations;
- retry counts, failed steps, and artifact-upload time;
- test-level or file-level timing where the runner supports it;
- enough repeated runs to distinguish normal variance from a bottleneck.

Local measurements should record the same command, Node version, machine
class, warm/cold dependency state, and whether browsers/emulator prerequisites
were already installed. A single unusually slow run is not a baseline.

## Suggested investigation sequence

1. **Inventory and instrumentation:** confirm workflow triggers, required
   checks, cache keys, artifacts, and command boundaries; add measurement only
   if it does not alter behavior.
2. **Baseline collection:** capture successful, cache-hit, cache-miss, and
   retrying runs; collect local `test`, `build`, `test:browser`, `test:rules`,
   and `check` timings.
3. **Duplication map:** compare the normal build, browser build, and demo build;
   identify safe artifact/dependency reuse opportunities.
4. **Suite analysis:** rank slow files/tests, emulator startup cost, browser
   project cost, serial sections, and retry amplification.
5. **Proposal:** rank changes by expected minutes saved, implementation effort,
   reliability risk, coverage impact, and rollback simplicity.
6. **Follow-up issues:** split accepted implementation slices, each with an
   explicit before/after measurement and preserved quality boundary.

## Constraints and invariants

- Do not remove Firestore Rules coverage or the real-browser production-artifact
  boundary without explicit replacement evidence.
- Preserve the distinction between JSDOM/unit checks, real-browser checks, and
  Firestore emulator checks.
- Preserve the four supported browser viewports unless measured evidence and
  an accepted decision record support a change.
- Optimize execution, caching, partitioning, and duplication before reducing
  assertions.
- Keep pull-request confidence and `main` protection explicit.
- Do not make production deployment automatic as part of this investigation.

## Acceptance criteria

The scoping work is complete when this document or linked follow-up evidence
contains:

- a current inventory of workflows, triggers, jobs, steps, caches, artifacts,
  required checks, and local equivalents;
- baseline timing data from successful and failed/retried runs;
- a per-suite/per-file timing report, or a documented instrumentation limit;
- a dependency and build duplication map;
- a ranked list of measured bottlenecks;
- follow-up recommendations with effort, expected savings, reliability risk,
  coverage impact, and rollback plan;
- a recommendation for what remains blocking, what may become conditional, and
  what remains manual;
- links to each implementation issue or pull request created from the plan.

Close #273 only after the scope and prioritized plan are reviewed. The
implementation work may remain in separate issues.
