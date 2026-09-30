# Issue #148 — Maritime II: selected signal flags

**Status:** implemented on the feature branch as a **draft**; **blocked on one human verification step** (below) before it should merge. Stacked on #147 → #149 → #146 (PRs #154, #153, #152).  
**Issue:** #148  
**Depends on:** #146  
**Research authority:** `docs/open/ISSUE_138_MARITIME_VISUAL_LITERACY.md` §3D  
**Code:** `src/domain/maritime/flags.ts` (designs, meanings), `flagBank.ts`, `flagTopic.ts`, `flagManifest.ts`, `flagHash.ts`; figure kind `signal-flag`

## Locked boundary (met)

Twelve selected International Code of Signals single-letter flags only: A, B, D, F, J, L, M, O, U, V, W, Y. Completion is visual recognition of the flag, letter and retained practical single-letter meaning. This is an Argus-selected subset, not an official sub-code.

## Shipped

One catalog topic, `signal-flags` ("Signal Flags"), `tradecraft`, 12 forward objective-choice items (`signal-flags-item-01…12`). Each shows a flag and asks which flag it is and what it means; the answer is `A (Alfa) — Diver down; keep well clear and proceed slowly` and so on, with the meanings exactly as retained in #138 §3D.

- **Deterministic, no generated art.** Each flag is a finite design (shape, background, a few rects/polygons/lines in a 150 × 100 frame) drawn by `signal-flag` in the #146 registry. No AI imagery, no emoji or OS flag glyphs, no third-party SVG.
- **Distractors are the designed confusion sets** — D/F/M, U/V/W, B/J, L/M, A/O — siblings first, then near neighbours. Tests assert every flag's siblings are offered.
- **Learn** groups the flags by use (warnings to others, vessel state, assistance) rather than alphabetically, names the confusable pairs, and ends with an alphabetical reference table. Letter, name, meaning and a design description are text beside each picture. Every flag is told apart by pattern and shape, not hue alone.
- **Scored stimulus alt text** describes the pattern and colours and never names the letter, the name or the meaning (tested).
- **Manifest.** `flagManifest.ts` is the 12-row asset manifest the research note requires (meaning source, design authority, authoring method, renderer id, licence, design hash, review). `designSha256` pins each drawn design, so an accidental change fails a test until deliberately re-pinned.

## The verification gate (why this is a draft)

The authoritative flag depictions — the IMO *International Code of Signals* and NGA Pub. 102 — could not be reached from the environment that produced these redraws, and no reusable reference set was available from the registries that could be reached. The designs were drawn from memory of the standard flags. **No flag has been compared against an authoritative depiction**, so every manifest row has `review: null`, and a test documents that honestly.

A reviewer should compare each flag with Pub. 102 (and the current IMO depiction where available), then fill in `review` for that row. Details most worth checking:

| Flag | Drawn as | Check |
| --- | --- | --- |
| A | swallow-tailed; white hoist half, blue fly half | split direction; swallow-tail proportions |
| B | swallow-tailed, plain red | swallow-tail proportions |
| D | yellow / blue / yellow horizontal bands, blue twice as wide | **band proportions** |
| F | white with a red diamond touching the mid-edges | diamond size |
| J | blue / white / blue, equal thirds | **band proportions** |
| L | quarters: yellow top-hoist, black top-fly, black bottom-hoist, yellow bottom-fly | quarter colour placement |
| M | blue with a white saltire | saltire band width |
| O | diagonal upper-hoist → lower-fly; **red lower-left, yellow upper-right** | **which triangle is which colour** |
| U | quarters: red top-hoist, white top-fly, white bottom-hoist, red bottom-fly | quarter colour placement |
| V | white with a red saltire | saltire band width |
| W | red, white, blue nested rectangles | nested proportions |
| Y | diagonal yellow and red stripes, running lower-hoist to upper-fly, five red bands | **stripe direction, count and width** |

Also confirm the rectangular aspect (drawn 3:2) and that the swallow-tail notch depth is reasonable. If a design changes, edit it in `flags.ts`, re-run, and re-pin its `designSha256`. The meanings themselves come from the research note and need no separate check beyond the IMO errata the note already cites.

Learner-facing text says the flags are "drawn by Argus from the International Code's designs" and that the published Code governs. It does not claim an official check; the verification status lives here, in the manifest and in the PR.

## Not built

Numeral pennants, substitutes, the answering pennant, the two-letter general signal code, the three-letter medical code, the remaining single letters (C, N, E, I, S, G, H, P, Q, T, Z, K, X), signalling procedure, and sound or light signalling.

## Validation

Unit: the twelve letters, names and retained meanings against the research note; palette and frame bounds; distinct designs; swallow-tail only for A and B; alt text that never names letter or meaning; item keys, distractors and confusion-set coverage; manifest rows and design hashes; topic structure and grouping. Browser (`e2e/signalFlags.spec.ts`, 320/390/landscape/desktop): Learn groups the twelve flags with their text and pictures without sideways scroll; all twelve flags are answered end to end from their text alternatives against keys typed from the note and bank a clean run.
