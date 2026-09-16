# /release (argus)

Verified release recipe for this repo. Follow it verbatim — do not re-derive.

ARGUMENTS: `patch` (default) | `minor` | `major` | `--verify-only`

## Facts

- Package manager: npm, lockfile `package-lock.json`.
- `private: true`, no `publishConfig` — nothing is published to a registry.
- No custom `version:*` script — the plain `npm version` command is correct.
- No prior release convention existed before v0.2.0; this file defines it going forward.
- Deploy is **manual, not CI-triggered**, as of v1.0.0. GitHub Pages is retired; Firebase
  Hosting is the sole deployment target. `.github/workflows/validate.yml` runs `web`
  (test + build sanity check), `browser` and `rules` on every push and pull request —
  it does not deploy. Ship with:
  ```bash
  npm run deploy:hosting   # build + firebase deploy --only hosting
  npm run rules:deploy     # re-render + firebase deploy --only firestore:rules
  ```
  `rules:deploy` needs `ARGUS_OWNER_EMAIL` in the environment (the owner's Google
  address; see `.env.example`). A keyless CI deploy via Workload Identity Federation
  was attempted once and blocked by the auto-mode classifier as a genuine IAM
  trust-relationship change — that block was correct, and this remains a manual step
  by design, not an oversight.
- The project defines its own composite gate: `npm run check` = `test` (vitest) +
  `build` (`tsc -b && vite build`) + `test:browser` (Playwright across phone-320,
  phone-390, landscape-short, desktop-pointer). Use this script, not the individual
  commands, so the release record matches what CI itself would run.
- `npm run test:rules` (Firestore Security Rules against the emulator) is **not** part
  of `check` and is not part of this release gate — it's a separate CI job.

## Known flake (read before treating a `check` failure as a regression)

`e2e/navigation.spec.ts` › "Back unwinds Topic and Library, and Forward restores the
Topic without duplication" (desktop-pointer, sometimes landscape-short) can fail
`toBeFocused()` on a `requestAnimationFrame`-scheduled focus restore when Playwright's
parallel workers are competing with heavy CPU load elsewhere on the machine. This user
routinely runs many concurrent Claude Code sessions on this same checkout — check
`ps aux | grep -c "claude "` if you see this test fail.

Do not loosen the test or reduce Playwright's worker count to paper over this. To
confirm it's the known flake and not a real regression:

```bash
npx playwright test e2e/navigation.spec.ts --project=desktop-pointer \
  -g "Back unwinds Topic and Library" --reporter=line --workers=1 --repeat-each=8
```

If that's 8/8 green serially, it's the known contention flake — rerun `npm run check`
once more (it usually passes clean on a second pass) and proceed. If it fails serially
with workers=1, that's a real regression — stop and investigate, do not release.

## Recipe

1. **Pre-flight**: confirm branch is `main`, `git status --short` clean (or only the
   expected release-adjacent files), `git pull --rebase` if behind.
2. **Gate**: `npm run check`. All three sub-steps must pass. See the flake note above
   before concluding a failure is real.
3. **Bump**: `npm version <bump> --no-git-tag-version` (default `patch`). This edits
   `package.json` and `package-lock.json` only — no dist/build artifacts are committed.
4. **Review**: `git status --short` and `git diff -- package.json` — expect exactly
   `package.json` + `package-lock.json` changed, nothing else.
5. **Commit**: 
   ```
   git add package.json package-lock.json
   git commit -m "release: vX.Y.Z"
   ```
   (append the `Co-Authored-By` trailer per current session attribution guidance)
6. **Tag**: `git tag -a vX.Y.Z -m "vX.Y.Z"`
7. **Push**: `git push --follow-tags`
8. **Deploy**: not automatic. Ask explicitly before running `npm run deploy:hosting`
   even if the release request already said "release and deploy" — it's outward-facing.
   If confirmed, run it and verify the live site afterward rather than trusting exit 0:
   fetch `https://argus-b7a5a.web.app/`, extract the referenced `/assets/index-*.js`,
   and confirm it actually serves `text/javascript` (a stale SPA rewrite serving
   `index.html` for that path has happened before and looks fine from curl's exit
   code alone). If nothing under `firestore.rules.template`, `scripts/renderRules.mjs`
   or the Security Rules changed since the last deploy, `rules:deploy` is not needed —
   don't run it reflexively on every release.

## `--verify-only`

Run step 2 (`npm run check`) only. Report pass/fail. Do not touch git state, do not
bump the version.

## History

- v0.2.0 (2026-09-13): first tagged release. Bootstrapped this recipe.
- v1.0.0 (2026-09-16): major bump for Firebase Auth + Firestore sync, the sign-in
  entry gate (#93 §1), and GitHub Pages' retirement in favor of Firebase Hosting as
  the sole deploy target — the deploy-step rewrite above. The gate `npm run check`
  ran against here was 784 unit tests + build + 172 browser tests, all green; a
  1-failure blip in `useSync.test.tsx` on the first attempt was a load flake (4/4
  green in isolation immediately after, ~10ms each) rather than a real regression —
  the same signature as the navigation flake documented above, just in newer code.
  Hosting had already been deployed and verified earlier in the session with
  functionally identical code (only `package.json`'s version string differs, and
  nothing in the app reads it), so this release did not require a fresh deploy.
