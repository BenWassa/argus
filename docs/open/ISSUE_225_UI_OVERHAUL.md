# #225: UI overhaul (colour, a Morse progress path, four Morse modes, no accordions)

**Status:** scoped 2026-10-17; implementation not started. Integration branch `feat/ui-overhaul` is open.
**Authority:** active plan and orchestration record for issues #226–#233. `DESIGN.md`, `DESIGN.json` and `PRODUCT.md` stay authoritative until each child issue rewrites the rules it reverses, in the same PR.
**Issue:** https://github.com/BenWassa/argus/issues/225
**Related:** #221 (Morse consolidation, Pixel pending), #188 (sending stages), #201, #193 (Home, Pixel pending), #223 (Roles), #113 (offline), `TOPIC_COLOUR_SPIKE.md` (pending since 2026-10-02).

## Owner request, 2026-10-17

> morse code needs a serious review. so many UI screens and info... feels cluttered... hard to see past progress like a visual line in duolingo which would be nicer. perhaps a few options at the surface only. no need for all the prose explanation close by. hate the accordion style collapse things. hate it.
>
> prefer a few gamemodes which would be clearer exemplified via one visual each and a word or two only not a subtitle.
>
> and library via a long full list of progress. auto jump to progress level.
>
> also the app is drab. missing colours.

### Decisions taken in scoping

| Question | Owner choice |
| --- | --- |
| Which "long full list of progress"? | **Morse's own path.** One long visual line covering lessons, checkpoints, the A–Z Test, then words, phrases, sentences and messages. It opens scrolled to the current level; past progress stays visible above. |
| Which game modes on the surface? | **By direction: Key · Listen · Read · Free play.** Each mode auto-picks the learner's level. Practice letters, Send stages, Receive levels and Challenges merge into them; the separate hub goes. |
| How far off grey gunmetal? | **Colour on the dark chassis.** Keep the dark base; give each Morse mode and each track a vivid hue; give the primary action a real hue. This reverses DESIGN.md's One Accent, One Warm Colour and No Track-as-Background rules. |

## Design philosophy (owner direction, 2026-10-17, second pass)

After the first mocks the owner said the design is *"too dark"*, the icons look *"cheap"*, containers must not use *"partial transparency"*, the path should be *"a straight line … top to bottom"*, modes go *"on the bottom"*, and tests need *"visual differentiation … along the way"*. Every overhaul surface follows these rules:

1. **Show the stimulus.** A mode tile shows exactly what that mode puts in front of you first. **Key** shows a letter (you see `A`, you key it). **Listen** shows a sound wave (you hear it). **Read** shows dits and dashes (you see `·−−`, you name it). **Free play** shows your own text appearing at a cursor. No metaphor icons and no thin decorative strokes: glyphs are bold, filled and pixel-aligned.
2. **Solid plates, real contrast.** Every container is opaque: either a step on the chassis ramp or a solid action/mode fill with contrast-checked ink. No alpha washes, translucent borders, glows or gradients standing in for colour. Hierarchy comes from fill steps, size and weight.
3. **A lighter chassis.** The near-black gunmetal goes. The base lifts to **Slate** (or **Light**; the owner picks from the mocks) so plates read as objects and colour has something to sit on.
4. **One straight spine, top to bottom.** The path is a single vertical line on the left, with Lesson 1 at the top and later tiers at the bottom. Rows read left to right: node, letters, label. The line is the action colour where it is done and neutral where it lies ahead. The screen opens scrolled to the current row: a raised full-width plate carrying the one primary action (`Start`).
5. **Tests are milestones.** Word checks and the A–Z Test break the rhythm. Each is a full-width plate that crosses the spine, with a square flag node and an uppercase label, where lessons have round nodes. The A–Z Test is the largest. State (done/current/locked) uses the same colours as lessons; shape, width and label carry "this is a test", so the meaning never rests on colour.
6. **Modes live at the bottom.** Four tiles, one word each, sit in a fixed tray above navigation (**Tray layout, decided**). The path owns the rest of the screen.
7. **Few, large words.** Labels are one or two title-case words. Letters and numbers are large. No sentences in the tray or on the path beyond a word check's one line.

## Baseline critique (Morse surfaces), 2026-10-17

Method: `impeccable critique` in the product register, run on real Chromium renders of the current `main` (`464c36f`) at 390×844 for three seeded learners (fresh, mid-course after lesson 5, finished course), plus source inspection. The deterministic detector (`npx impeccable --json`) on `src/features/{morse,library,today}` returned 48 advisories, all `design-system-font-size` (type-ramp drift), and no banned patterns. The LLM assessment was run inline rather than as an isolated sub-agent, so treat the score as one reviewer's judgment. #233 re-runs it with isolated assessments.

The 2026-10-17 [major-screen review](../closed/IMPECCABLE_UI_REVIEW_2026_10_17.md) scored the app's major screens 31/40. The Morse topic and its activity surfaces score lower on their own:

| # | Heuristic | Score | Key issue |
| --- | --- | ---: | --- |
| 1 | Visibility of system status | 2 | Progress is a mono table inside a fold; after the course, past lessons fold away; post-alphabet progress appears nowhere as progress. |
| 2 | Match system / real world | 3 | Sound domain language; "Curriculum", "Checkpoint", "Fluency" and "Challenges" overlap. |
| 3 | User control and freedom | 3 | Close and replay are everywhere. |
| 4 | Consistency and standards | 2 | Three chooser styles (card grid with subtitles, 21-link list, in-session tabs), two hubs, and session headers that differ per activity. |
| 5 | Error prevention | 3 | Formal/formative boundary is sound. |
| 6 | Recognition rather than recall | 2 | Receive levels and Send stages are only reachable as text links in *More options*. |
| 7 | Flexibility and efficiency | 3 | Every activity is directly linkable, at the cost of #8. |
| 8 | Aesthetic and minimalist design | 1 | About 47 targets on the finished-course page; 3 explanatory folds (~150 words); a subtitle on every tile; grey on grey. |
| 9 | Error recovery | 3 | #221's shared correction body is good and stays. |
| 10 | Help and documentation | 2 | Help is rationale prose parked on the topic page rather than at the point of need. |
| | **Total** | **24/40** | |

Cognitive load: the finished-course page fails 5 of the 8 checklist items (too many choices at one decision point, competing primaries, repeated information, hidden structure, explanatory text in the task path).

### Priority issues
1. **[P1] Too many choices on Morse.** 4 tiles + docked primary + reference + 17 lesson rows + 21 option links + 3 footer links. → #228, #230.
2. **[P1] Past progress is invisible.** The finished course folds its own history away; the path is a table. → #229.
3. **[P1] Accordions and explanatory prose.** 11 `<details>` in shipped UI (6 on TopicPage). → #227.
4. **[P2] The app has no colour.** The accent is near-white, the tracks sit near chroma 0.08, and gauges fill in slate. → #226, #232.
5. **[P2] Every session invents its own frame and instructions.** → #231.

### Evidence (390px, current `main`)
Mid-course: [topic](assets/ui-overhaul/before/phone-390-06-morse-mid.jpg), [topic fully expanded](assets/ui-overhaul/before/phone-390-07-morse-mid-expanded.jpg), [lesson](assets/ui-overhaul/before/phone-390-13-lesson-mid.jpg). Finished: [topic](assets/ui-overhaul/before/phone-390-08-morse-done.jpg), [topic fully expanded](assets/ui-overhaul/before/phone-390-09-morse-done-expanded.jpg), [Practice letters](assets/ui-overhaul/before/phone-390-11-practice.jpg), [Send](assets/ui-overhaul/before/phone-390-12-send.jpg), [Free play](assets/ui-overhaul/before/phone-390-12-free.jpg). App: [Home](assets/ui-overhaul/before/phone-390-04-home-mid.jpg), [Library](assets/ui-overhaul/before/phone-390-05-library-mid.jpg).

Full-page captures overlay the fixed dock and navigation mid-page; that is a capture artifact, not a layout defect.

## Issue map

| Issue | Slice | Wave | Depends on | Owner gate | Primary skill |
| --- | --- | --- | --- | --- | --- |
| [#226](https://github.com/BenWassa/argus/issues/226) | Colour foundation: tokens, rule rewrite, palette sheet | 1 | none | **Pick palette system from 390px sheet** | `impeccable colorize` |
| [#227](https://github.com/BenWassa/argus/issues/227) | Remove every accordion; cut page-level prose | 1 | none | none | `impeccable distill`, `clarify` |
| [#228](https://github.com/BenWassa/argus/issues/228) | Morse modes by direction (domain → tiles) | 1 (domain), 2 (tiles) | #226 for tiles | **Approve 4-tile mock** | `impeccable shape`, `distill` |
| [#229](https://github.com/BenWassa/argus/issues/229) | Morse progress path (model → component) | 1 (model), 2 (component) | #226, #228 tiers | **Approve path mock** | `impeccable craft`, `animate` |
| [#230](https://github.com/BenWassa/argus/issues/230) | Morse topic composition; delete hub and old path | 3 | #227, #228, #229, #226 | Tray layout decided 2026-10-17 | `impeccable layout`, `distill` |
| [#231](https://github.com/BenWassa/argus/issues/231) | One session frame; mode colour; no instruction prose | 4 | #226, #228 | none | `impeccable distill`, `clarify`, `animate` |
| [#232](https://github.com/BenWassa/argus/issues/232) | Colour across Home, Library, Topic, Test, Roles, sign-in | 3 | #226 + palette approval | none | `impeccable colorize` |
| [#233](https://github.com/BenWassa/argus/issues/233) | Acceptance: critique re-score, polish, audit, Pixel | 5 | all | **Pixel sign-off** | `impeccable critique`, `polish`, `audit` |

```
wave 1   #226 palette sheet ─┐   #227 folds   #228 domain   #229 model
                             │ (owner picks palette, approves tile + path mocks)
wave 2   #228 tiles ◄────────┤                #229 component
wave 3   #230 Morse page ◄── #227 + #228 + #229        #232 app colour ◄── #226
wave 4   #231 session frame
wave 5   #233 acceptance → PR feat/ui-overhaul → main → release
```

## Branching, CI and delegation

- **Integration branch:** `feat/ui-overhaul`, cut from `main` at `464c36f`. Each child issue gets its own sub-branch from it, and its PR targets `feat/ui-overhaul`. `.github/workflows/validate.yml` now runs on PRs into `feat/ui-overhaul` as well as `main`.
- **Final merge:** one reviewed, CI-green PR `feat/ui-overhaul` → `main`, then the `release` skill. Rebase or merge `main` into the integration branch whenever `main` moves, so the final PR stays small to review.
- **Delegation:** Claude orchestrates; Codex is the workhorse for bounded slices. Each Codex job runs in its own scratchpad worktree with a real `node_modules` copy, no Playwright, and no git commits; Claude reviews the diff, runs Playwright, commits and pushes. Slices that are safe to delegate before any owner gate: the #226 palette sheet, #227, the #228 domain layer, the #229 path model.
- **Concurrency:** other sessions edit `TopicPage.tsx`, Morse and Roles files. Stage only the files a slice owns, and re-check `git status` and `main` before each merge.

## Invariants for every child issue

- No change to formal evidence, acquisition, completion or retention writes. Formative stores (`morsePractice`, `morseFluency`, lesson sitting) keep their contracts.
- Nothing reads a clock: no due dates, no elapsed-time decay, no day streaks.
- The path is a progress visualisation, not gamification: no XP, streaks, hearts, gems or leaderboards. The #191 role-badge exception is unchanged.
- 44px targets, visible focus, `prefers-reduced-motion`, no page-level horizontal overflow at 320px or 200% text.
- A rule reversal is written into `DESIGN.md` / `DESIGN.json` / `PRODUCT.md` in the same PR that reverses it.

## Definition of done

All child issues closed. #233 records an isolated re-critique with Morse ≥ 32/40 and Aesthetic and minimalist design ≥ 3, a before/after capture matrix, a green `npm run check` on `feat/ui-overhaul`, and owner Pixel sign-off. This document then moves to `docs/closed/` with a closeout, and the #221 and colour-spike documents get their banners updated.
