# Issue #273 — CI and test-time reduction: measured scope and implementation plan

> **Status:** Proposed scope / owner review required. **Authority:** Investigation record and implementation proposal only; NOT authorization to change CI gates, tests, workflows, deployment, or required checks.  
> **Issue:** https://github.com/BenWassa/argus/issues/273  
> **Measurement date:** 2026-10-19 (America/Toronto; some GitHub API timestamps appear as 2026-10-20 UTC).  
> **Scope:** documentation only. No application, workflow, test, or deployment implementation in this change.

## Executive decision

**Prioritize browser execution parallelism, not dependency caching.** A representative successful PR (Argus CI #596, SHA `dd7560119c5fef9047d1436f7738ac69392545ef`) took **12m29s** end to end. Its browser job occupied **12m25s**, with **11m39s** spent in the step that builds the local-only production artifact and runs Playwright. Meanwhile, the web job took 1m57s, Rules 54s, `npm ci` 8s in the browser, and Chromium setup 27s.

Across the samples below, median browser job time is **11m32s**. The first implementation candidate is a controlled **four-way Playwright parallelization experiment**, preserving all four viewport projects and all test assertions. Hypothesis, **not a verified result**: full required-check wall time could reach **approximately 4–6 minutes**, with the final target and cost trade-off set by a measured comparison against the existing configuration. Do **not** promise this time reduction before testing.

The present `npm` dependency cache is operational. Main optimizations should not sacrifice test coverage to save single-digit-second installs.

## 1. Inventory / current behavior

| Surface | Trigger / equivalent | What actually runs | Gate / constraints |
| --- | --- | --- | --- |
| `.github/workflows/validate.yml` / `web` | PR to `main` or `feat/ui-overhaul`; push to `main`; dispatch | Checkout; Node 22; npm cache; `npm ci`; `npm run test`; `npm run build` (badge prep, `tsc -b`, Vite build, size report) | Unit + type/build evidence |
| `validate.yml` / `browser` | Same | Fresh checkout, Node/npm install, `playwright install --with-deps chromium`, `npm run test:browser`, report on failure | Real Chromium against **built** local-only artifact; four viewports |
| `validate.yml` / `rules` | Same | Fresh checkout/npm install; Java 21; `npm run test:rules` | Firestore security boundary using rendered rules and Firebase CLI emulator |
| `.github/workflows/demo-pages.yml` / `build` | PR to `main` only for configured file paths; any push to `main`; dispatch | Fresh checkout/npm install; `npm run build:demo`, safety checks; Pages upload on main | Demo-specific no-Firebase and subpath invariants |
| `demo-pages.yml` / `deploy` | Main push / manual main, after demo build | Publish **demo** to GitHub Pages | Separate from manually operated production Firebase Hosting |
| Local `npm run check` | Developer command | **Sequential:** `npm run test && npm run build && npm run test:browser` | Does **not** run Rules, and does not install browsers/emulator |
| Local `npm run test:browser` | Developer command | Playwright's `webServer`: `npm run build:e2e` then Vite preview | Four projects; local worker count defaults to Playwright; CI caps at 2 |
| Local `npm run test:rules` | Developer command | Render emulator-only rules; `firebase-tools@14 emulators:exec`; Vitest Rules config | Java required; one Rules file, serialized suite |
| Local `npm run build:demo` | Developer command | TypeScript build, demo-mode Vite build; output `dist-demo/` | **Not equivalent** to production or browser artifact |

**Browser configuration:** `fullyParallel: true`, `retries: CI ? 1 : 0`, `workers: CI ? 2 : undefined`; `phone-320` (320×568), `phone-390` (390×844), `landscape-short` (740×360), `desktop-pointer` (1280×800). `webServer` builds a production bundle with Firebase values intentionally blank; `reuseExistingServer` is false in CI and true locally (with explicit port guard).

**Rules configuration:** `vitest.rules.config.ts` includes `firestore/**/*.test.ts`, sets 30-second timeouts and `fileParallelism: false`. The current tracked file is `firestore/rules.test.ts`. Emulator startup/download dominates its short job more than test execution.

**Caching:** each CI job independently executes `npm ci`; `actions/setup-node@v4` caches the npm download cache keyed by lockfile, **not** `node_modules`. Logs for #596 confirm cache hits in all three jobs (~62 MB cache) and Node 22.23.3 on Ubuntu 24.04. The browser runner downloads Playwright Chrome/FFmpeg/headless shell; the Rules runner downloads the Firestore emulator JAR and prints a caching suggestion. A cache hit does not mean no installation. Browser-report artifacts upload only on failure (7-day retention). No CI timing/test report artifact is currently uploaded on successful jobs.

**Duplicated work:** three `npm ci` executions in `validate.yml`, plus a fourth in the demo workflow when triggered. Separate TypeScript/Vite builds run in `web`, Playwright's `webServer`, and demo. These artifacts have meaningfully different configuration: web can receive Firebase repository variables; E2E deliberately clears Firebase settings; demo changes base URL and excludes service worker. **Never reuse a built artifact across these configurations without a proven equivalent build contract.** A shared `dist` across all three is not safe by default. Changes to test-only files currently trigger all three validation jobs; docs-only changes also trigger full `validate.yml`.

## 2. Evidence-based timing baseline

### Sample method

GitHub Actions REST job and step start/end timestamps plus text job logs were inspected. Values below are **elapsed time**, not CPU time or official GitHub-billed minutes. Sample period: October 16–19 local / October 17–20 UTC, multiple PR and main SHAs; not a fixed-SHA controlled benchmark. `ubuntu-latest` resolved to Ubuntu 24.04 for checked representative runs. This sample includes **11 successful browser**, **14 successful web**, **14 successful Rules**, **five successful demo-build** jobs. Build/test suites evolved within the period; interpret cross-run differences accordingly.

| Job or stage | n | Median | Observed minimum–maximum |
| --- | ---: | ---: | ---: |
| Browser job | 11 | **11m32s** | 10m55s–12m36s |
| Browser test step, including E2E build | 11 | **10m55s** | 10m27s–11m40s |
| Install Chromium | 11 | 21s | 15–33s |
| Browser `npm ci` | 11 | 8s | 5–9s |
| Web job (unit + production build) | 14 | 1m44s | 1m23s–1m57s |
| Unit-test step | 14 | 73s | 55–87s |
| Web typecheck/build | 14 | 15s | 10–16s |
| Rules job | 14 | 47s | 38–57s |
| Rules step (includes emulator) | 14 | 32s | 25–41s |
| Demo build job | 5 | 32s | 27–39s |
| Demo build step | 5 | 12s | 10–14s |

**Representative exact job durations:** https://github.com/BenWassa/argus/actions/runs/39353552934 (PR #596): browser 745s, web 117s, rules 54s. Workflow elapsed time from run timestamps: 12m29s. https://github.com/BenWassa/argus/actions/runs/39353191894 (main #595): browser 756s, web 85s, rules 49s. https://github.com/BenWassa/argus/actions/runs/39351861296 (PR #594): browser 727s, web 100s, rules 47s. Demo example: https://github.com/BenWassa/argus/actions/runs/39353553014 (PR demo build 39s).

**Current suite counts**, from the successful #596 console: 157 unit files, **2,026 passing unit tests**; **544 scheduled browser tests** over four projects, 507 passed, 37 skipped; 33 Rules tests. These supersede the filing-time inventory indicators (156/31/1 and roughly 1,515 unit/rules declarations); counts are not fixed baselines for future PRs. The repo currently has 31 `e2e/*.spec.ts` files.

### Browser per-file hotspot sample (PR #596)

Cumulative durations are extracted from reported individual Playwright test results, summed over all projects; **not** independent wall-clock times and **not** additive to a workflow's elapsed time. Browser workers execute concurrently.

| File | Tests completed in sample | Cumulative duration |
| --- | ---: | ---: |
| `e2e/morseFluency.spec.ts` | 34 | **381.7s** |
| `e2e/morseCheckpointHandoff.spec.ts` | 12 | **120.6s** |
| `e2e/practice.spec.ts` | 5 | **118.6s** |
| `e2e/natoSwipe.spec.ts` | 40 | 86.7s |
| `e2e/maritime.spec.ts` | 20 | 83.2s |
| `e2e/navigationMorseReference.spec.ts` | 24 | 57.8s |
| `e2e/signalFlags.spec.ts` | 8 | 44.7s |
| `e2e/morseLetterPractice.spec.ts` | 8 | 42.2s |

Playwright reports additional test startup/teardown and execution overhead not fully represented by summed reported test durations. The first three files are high-value profiling candidates. In `morseFluency.spec.ts`, genuine pointer holds and audio timing coexist with fixed `waitForTimeout(1000)`, `1400`, `1150`, `240` delays and full multi-prompt runs. Treat each delay based on the contract it proves, not as blanket waste. `morseCheckpointHandoff.spec.ts` repeats progression through Lesson 4 across 12 project/test combinations. `practice.spec.ts` intentionally runs full 26-card behavior only on desktop and skips other projects.

### Failures and retries: do not assume flakiness

- https://github.com/BenWassa/argus/actions/runs/39161193333: browser failed in ~53s on a **duplicate Playwright test title** before a test run; deterministic suite discovery error, not a flake.
- https://github.com/BenWassa/argus/actions/runs/39161246260: browser failed after ~10m15s; one **landscape-short overflow/layout assertion** failed again on its retry; strong indication of a legitimate product/test expectation discrepancy, not evidence for removing the check.
- https://github.com/BenWassa/argus/actions/runs/39136707017: ~12m40s browser failure with **25 failed assertions across viewports** (responsive/layout/Morse). Retried assertions failed again; likely a real regression or systematic test-contract issue. Do not classify these as intermittent without fixed-SHA reproduction.
- `retries: 1` in CI costs little when green and can amplify failure time if a regression is repeatable. A failure with a passing retry warrants separate classification; retry-once is not proof of nondeterminism.

### Evidence limitations to close before accepting issue

- No direct CPU usage or memory/high-watermark measurements from jobs; start/end timestamps alone cannot supply CPU time.
- No controlled same-SHA cache-hot vs cache-cold experiment or cache-miss timing distribution. Observed #596 npm cache **hit** is confirmed; cache savings are not proven.
- No local developer-machine clean-clone and warmed-workspace timing for `npm run check`, `test`, `build`, `test:browser`, or `test:rules`; CI data cannot stand in for local measurements.
- Actual GitHub **required checks/branch protection could not be confirmed**: protection API returned HTTP 403 (integration lacks permission); repository rulesets query returned an empty list. Review GitHub Settings → Branches / Rules / Rulesets with an authorized owner before modifying check names, conditionals, or triggers.
- A per-file **Vitest** breakdown and a controlled Playwright JSON timing artifact are not yet available; current Playwright hotspot sample is extracted from a single console log.
- GitHub `ubuntu-latest` runner labels alone do not establish exact CPU utilization. Record machine vCPU/memory, process CPU and RSS and image version as part of baseline instrumentation.

## 3. Proposed change backlog, ordered by critical-path impact

**Estimate policy:** Savings in this section are *hypotheses requiring same-SHA experiments*, not measured time reductions. Distinguish **required-check wall time** from **aggregate runner minutes**, which may increase when matrix concurrency is introduced.

| Priority | Slice | Specific proposal | Expected wall-time effect | Effort / risk / coverage |
| --- | --- | --- | --- | --- |
| P0 | Metrics, baseline & policy | Script/API snapshots of runs/jobs/steps; capture per-test Vitest and Playwright JSON, cold/warm, CPU/RSS, artifact sizes; verify protected checks | 0 minutes directly; enables reliable choices | S / low / no assertion changes |
| **P1** | **Playwright fan-out experiment** | Test 4-way splitting of existing tests without changing projects/assertions; choose project matrix vs `--shard=1/4..4/4` using same-SHA comparison | **Potential ~5–8 minutes faster** than current ~11.5-minute browser job; validate first | M / medium (aggregation, missing shard, cost, load) / identical tests |
| P2 | Test hot-spot profiling/remediation | Target `morseFluency`, `morseCheckpointHandoff`, `practice`; classify required actual-time waits vs replaceable state waits; remove repetition only with equivalent evidence | Could save tens of seconds to a few minutes; **unverified** | M–L / medium–high / require contract mapping |
| P3 | Browser install + emulator cache | Evaluate caching `~/.cache/ms-playwright` keyed to locked Playwright+runner OS; consider `~/.cache/firebase/emulators` keyed to Firebase CLI/emulator version, with misses tested | Browser install currently 15–33s, Rules step 25–41s; bounded | S–M / low–medium / unchanged coverage |
| P4 | Build artifact/duplication audit | Keep E2E local-only production build explicit. Experiment with separate E2E build artifact once per SHA and fan-out download **only if transfer + dependency time beats per-shard build**; keep demo/variable-configured web builds separate | Production type/build 10–16s, demo build 10–14s; likely secondary | M / medium–high (artifact config isolation) |
| P5 | Local developer feedback | Add clearly named `check:quick`, `check:full` or equivalent; preserve `check` semantics until owner approval; document Rules, Java and browser dependencies; avoid surprise green without Rules | Potential large developer feedback benefit, not automatically CI | S–M / medium (contract confusion) |
| P6 | Trigger/check-policy review | Docs-only **explicit** pass/no-op checks if required; precise path policies and a full main/nightly/manual lane only after classification and owner approval | Docs-only PRs potentially avoid ~11-minute browser wait; code PRs unchanged | M / **high** (required checks / missed dependency) |
| P7 | Workflow hygiene | Investigate action version maintenance (`setup-node@v4`, `setup-java@v4` logs show Node20 deprecation fallback); stable concurrency, report retention, fail-fast semantics | Minimal speed benefit, improved maintenance | S / low–medium |

### P1: exact candidate architectures and safeguards

**Candidate A — four parallel browser jobs by existing project**: a matrix job enumerates `phone-320`, `phone-390`, `landscape-short`, `desktop-pointer`. Each runs one existing Playwright project (`--project=<name>`) with two workers. Advantages: simple viewport attribution, direct correspondence to explicit coverage requirements. Disadvantages: unequal load (in #596 desktop test durations total ~414s; phone 320 ~301s, phone 390 ~327s, landscape ~297s); each shard repeats installation and local-only E2E build.

**Candidate B — four independent Playwright shards across the full project suite**: invoke the same config with `--shard=1/4` through `4/4`, with `fullyParallel` preserved. This may distribute heavy tests more evenly than viewport-only jobs. Risks: harder report consolidation, cross-project evidence must still be explicit, file/test distribution and worker timing must be verified, and CI aggregate cannot pass if any shard is missing/skipped/cancelled.

**Candidate C — increase a single runner's workers** from 2 to 3 or 4 as a separate controlled experiment. Easier configuration, but potential browser/CPU/memory contention; do not assume twice as many workers means twice the speed.

**Recommended pilot:** compare baseline **B0 single browser job/2 workers**, **A four project jobs/2 workers**, **B four distributed shards/2 workers**, and **C one runner/4 workers** on **the same commit** and pinned runtime. At least 3 green runs of each, one deliberately failing-browser fixture to exercise shard result aggregation, plus a cache-miss sample. Record p50/p90, runner-minute sum, runner memory, retry incidence, test totals and full-project inclusion. Choose the simplest model meeting targets, not automatically the most parallel one.

**Blocking-check design:** preserve one stable required check name (for example a final `browser` aggregate) only after confirming its current branch-protection identity. A matrix aggregate must inspect `needs`/result states and **fail** when any shard fails, is cancelled, or is absent; it must not be green via `always()` alone. A failed shard should retain trace/report artifacts; a passing shard should produce machine-readable timing/count data, with short retention. Do not silently narrow the four viewports. Maintain `forbidOnly`, non-reuse of an external preview server in CI, and production-build verification.

**Cost control:** 4 jobs may consume *more* billed runner minutes because npm/Chromium/browser-build setup occurs four times. Compare cost plus time-to-signal. Before enabling larger matrix on every PR, check GitHub Actions plan/concurrency quotas and whether parallel runs of multiple PRs will compete for available runners.

### P2: test-evidence classification contract

Classify every proposed slow-test change as (a) unit/domain only; (b) real browser/compositor; (c) real pointer/audio timing; (d) layout at a specific viewport; (e) Firestore emulator security. Only consider a cheaper test placement if the new checks **prove the same assertion** and the required layers remain covered. Examples to investigate, not implement in this issue:

1. For `morseFluency`, keep at least the approved real Morse press durations, idle boundaries, persisted-field isolation and completion in real Chromium. Measure which waits are actual timing assertions and which could use locator/event-driven state readiness.
2. For `morseCheckpointHandoff`, identify redundant full Lesson 4 progression repeated three times per viewport; consider a single end-to-end path plus focused handoff/viewport assertions **only with explicit evidence mapping**.
3. For `practice`, measure 26-card deck/animation waits; preserve one actual full-deck boundary and durable write-isolation proof. A shorter fake-deck test does not automatically replace a real browser run.
4. Track longest individual tests (not just slow files), p50/p95 by project, explicit skips, slow fixture setup, worker restarts and retries. Detect tests which use `test.skip` at runtime and are actually intentionally single-project.
5. Assert that optimized runs have the same expected number of executed and skipped test/project combinations, or attach a reviewed old→new coverage equivalence matrix.

### P3/P4: cache and build safeguards

- Npm cache already hits; don't replace `npm ci` with `npm install` or cache mutable `node_modules` without compelling proof and secure invalidation.
- Playwright browser binary and OS packages have different cache rules; cache binaries only on a validated lockfile/OS key, leaving `--with-deps` correctness intact. Do not deploy `apt` cache tricks without test evidence.
- Firebase CLI currently invokes `npx --yes firebase-tools@14` on the Rules path, and downloads Firestore emulator assets; pin/cache only if the exact CLI/emulator version is verified, invalidation is controlled, and isolation of emulator rules is preserved.
- The Playwright `webServer` build is **local-only** with deliberate blank Firebase credentials. A generic `web` artifact built with Firebase variables is not a safe substitute. The demo's `dist-demo` build changes base path and service-worker policy and cannot be reused for either.
- If artifact fan-out is chosen, build once **per valid configuration and head SHA**, upload with integrity checks, ensure shards install matching dependencies, fail if the artifact is missing, and compare artifact bytes/config before replacing local build. Avoid serializing unit tests before browser shards merely to share a build; that would lengthen the critical path.
- Keep production Firebase Hosting **manual**. Never extend GitHub Pages demo upload/deploy to production as an optimization.

## 4. Gate/trigger policy recommendation

**Remain blocking on code PRs:** unit/domain tests + typecheck/production build; all four browser viewport projects, including real built-app boundary; Firestore Security Rules emulator suite; applicable demo build safety checks. Maintain failure visibility and trace availability.

**Potential conditional after owner confirmation:** docs-only/comment-only changes can use explicit classification and a stable required-check aggregator that records **intentionally not exercised** (not a false test pass). Any changes to `src/**`, `public/**`, `e2e/**`, `firestore/**`, `scripts/**`, `package*.json`, TS/Vite/Playwright/Vitest configs, `.github/workflows/**`, build or Firebase configuration must default to **full relevant coverage**. Unknown paths fail closed. Full suite on `main` remains required; optional scheduled full coverage is *additional*, not a replacement until the policy is accepted.

**Remain manual:** real Firebase Hosting production deployment; exploratory performance experiments, local clean-vs-warm measurements; any workflow_dispatch comparison runs. The demo GitHub Pages publish remains its separate existing behavior.

**Open gate fact:** `main` branch protection requirements were not readable through the connection (403); the empty rulesets result is insufficient evidence to claim nothing is required. Confirm with owner before editing job identifiers, `if:` clauses, matrix structure or check names.

## 5. Implementation sequence (separate follow-up PRs; NOT in #273 scope PR)

1. **#273-A — instrumentation and immutable benchmark record.** Add JSON timing capture for CI and local commands (wall + CPU/RSS + OS/Node/commit/cache hit). On success and failure retain compact timing metrics, with CI run links. Establish representative cache-hot/miss and local clean/warm baseline. Ensure measurement itself adds little overhead; no gate changes.
2. **#273-B — browser parallelism prototype.** Make branch-only experiments for candidate A/B/C, one change per PR or non-default opt-in workflow; compare 3+ paired same-SHA runs each, warm cache and failure injection; produce coverage count equivalence. Recommend architecture based on measurable gain/cost, with rollback to original single job.
3. **#273-C — required-check-safe browser rollout.** Add chosen parallel execution and stable fail-closed aggregator, reports and traces, required-check mapping, documented 4-project coverage. Merge only after branch protection review; revert on missing tests, unstable failures, or exceeded runner-minute budget.
4. **#273-D — slow browser test remediation.** Isolate small independently reviewable hot spots (`morseFluency` first, then `morseCheckpointHandoff`, then `practice`). Each PR must state protected semantics, before/after per-test time and fixed-SHA pass/retry evidence. No global assertion deletion.
5. **#273-E — secondary startup/cache and build audit.** Benchmark Playwright and Firestore emulator cache, `npm ci` costs, and artifact sharing with strict E2E/demo/production config separation. Retain only changes with demonstrated value.
6. **#273-F — local commands and optional trigger policy.** Clarify quick vs comprehensive local checks, Rules inclusion semantics, and potential docs-only PR exception. Separate policy change from performance code; owner signs off required-check/coverage policy.
7. **#273-G — closeout and maintenance.** Compare 10+ representative post-rollout PR runs with same suite footprint normalized for changes, publish p50/p90/billed runner minutes, flake classification, repeated failure behavior, and final required-check mapping; move scope to `docs/closed` only when the issue is accepted and no longer an active contract.

**Parallel agent opportunities:** instrumentation can proceed alongside proof-of-concept runner matrices (on **separate branches** and compared against a frozen SHA); slow-test audit and local command specification are also independent. Only integrate after the baseline format, gate naming and evidence matrix are agreed. No two agents should edit `validate.yml` simultaneously.

## 6. Acceptance gates and rollback

### Metrics and thresholds (proposed owner targets, not current observations)

- **Primary:** full required CI PR time-to-green p50 **≤5 minutes** and p90 **≤7 minutes**, measured across a comparable cohort; report against measured ~11m32s browser median.
- **Coverage:** exactly the expected Playwright tests/projects run; no accidental lost test, no `test.only`, no disappearance of responsive, local-only production-boundary, security Rules or demo safety assertions. Verify counts including intentional skips.
- **Reliability:** no increase in reproducible failure or false-pass incidence; zero cases of missing/cancelled shard reporting green; retries remain visible.
- **Resources:** record total runner minutes (and any plan quota effect) and compare to baseline; set a maximum acceptable increase before selecting a shard count.
- **Local feedback:** measured clean-clone and warm-workspace `npm run check`, with Rules test separately recorded; document command scope honestly.
- **Deploy:** production deployment remains manual and untouched. Demo must continue to exclude Firebase configuration and service worker.

### Per-change rollback protocol

Record old/new SHA, workflow run links, job timings, Playwright executed/skipped counts, correctness matrix, cost and protected-check identifiers. Keep the prior configuration available. Revert CI matrix/caches/conditional triggers immediately for a missing or misleading required check, missing viewport, broken E2E config separation, CI artifact inconsistency, or material flake increase. Roll back test-specific speedups if real-time interaction semantics can no longer be demonstrated by the revised test.

## 7. Scoping issue closeout checklist

- [x] Inventory workflow triggers, jobs, steps, artifacts, existing npm cache, main scripts and viewport settings.
- [x] Measured sample of successful and failed/retried CI jobs; runner OS/Node and cache-hit evidence from a representative run.
- [x] Preliminary per-file browser hotspot report and failure classification examples.
- [x] Duplicate installation/build matrix and evaluation of incompatible artifact configuration.
- [x] Ranked implementation plan with coverage, reliability and rollback constraints.
- [x] Recommended initial gate policy, explicitly pending branch-protection verification.
- [ ] Per-file Vitest timing report from machine-readable output.
- [ ] Per-file Playwright timing dataset from repeatable JSON/trace instrumentation (current file sample is console-derived).
- [ ] Local clean-clone and warm `npm run check` + `test:rules` timing and CPU/RSS baselines.
- [ ] Cold vs warm npm, Playwright and Firestore emulator cache timing with controlled SHA.
- [ ] Authorized owner verification of required branch checks, protections and GitHub Actions quota/cost constraints.
- [ ] Owner approval of target thresholds and prioritized architecture before any CI implementation.

**Conclusion:** this proposal is technically actionable, but issue #273 should **remain open** until the outstanding instrumentation/local measurements, required-check verification, and owner review are complete. Documentation-only scope work is not implementation approval.
