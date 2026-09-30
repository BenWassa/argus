# Issue #149 — Compass & Bearings implementation

**Status:** implemented on the feature branch, in review; closes #149 when merged. Stacked on #146 (PR #152), so it merges after it.  
**Issue:** #149  
**Depends on:** #146  
**Research authority:** `docs/open/ISSUE_140_COMPASS_BEARINGS_TOPO.md`  
**Code:** `src/domain/navigation/` (maths, banks, topic definitions), figure kinds in `src/domain/visual/figures.ts`

## Locked direction

Keep the existing eight-point bearings topic as prerequisite. Implement the four researched follow-on topics for:

1. whole-circle bearing diagrams;
2. reciprocal/back bearings;
3. true, magnetic and grid north plus supplied declination/convergence relationships;
4. combined deterministic diagram/calculation exercises.

## Shipped topics

The existing `cardinal-bearings` topic is untouched. Four new catalog topics, all `tradecraft`, all forward objective-choice items, with deterministic ids `<topic-id>-item-NN`:

| Topic id | Title | Items | Bank (per #140 §5) |
| --- | --- | ---: | --- |
| `whole-circle-bearings` | Whole-Circle Bearings | 12 | 6 read a ray, 6 find the ray for a bearing |
| `reciprocal-bearings` | Reciprocal Bearings | 12 | 3 below 180°, 3 at/above, 2 crossing 000, 2 round-number checks, 2 from a diagram |
| `north-references-declination` | True & Magnetic North | 16 | 4 concept, 4 T→M (2 E, 2 W), 4 M→T (2 E, 2 W), 4 that cross 000 |
| `grid-north-map-bearings` | Grid North & Map Bearings | 12 | 4 read a three-north diagram, 4 direct G↔M, 2 mixed T/M/G with D and C, 2 convert-then-reciprocal |

## How answer keys are derived

`src/domain/navigation/bearings.ts` holds the only arithmetic: `normalize`, `reciprocal`, and `convert(b, from, to, {D, C}) = normalize(b + αFrom − αTo)` with `αT = 0, αM = D, αG = C`. Each bank in `bearingBanks.ts` lists **inputs only**; keys and distractors are computed. `bearingBanks.test.ts` recomputes every key by a separate route (plain arithmetic, the add/subtract-180 shortcut, the six named formulas, reciprocal-first versus convert-first) and pins the coverage rules, the research note's independently checked examples, and that no prompt or text alternative contains its own answer.

Distractors model real errors: anticlockwise reading, reading from the wrong end of the line, measuring from east, a declination applied with the wrong sign, no conversion, convergence-only or declination-only, forgetting the reciprocal. They are deterministic, so catalog identity is stable.

## Conventions, and what is source-backed

- **Source-backed (NRCan):** true/magnetic/grid north; magnetic declination is east-positive; grid declination is grid↔magnetic and is not the true-magnetic declination; convergence is true↔grid; margin diagrams may be exaggerated and must not be measured; declination changes with place and time; compass reliability is not uniform in the Arctic.
- **Argus editorial (stated in each topic's limitations):** three-digit bearings with a T/M/G suffix, the signed convergence `C` convention (east of true north positive), the exercise banks and the diagram-stimulus design. No mnemonic is taught; the rule is derived from the diagram.
- Every calculation states its offsets. No item depends on a real declination, and none ships a perishable one.

## Figures

Extends the #146 registry (see that note): `angle-dial` gained `reference` (T/M/G, labels the north mark `TN`/`MN`/`GN`), `quadrantGuides` and `arc`; new `north-reference` draws 2–3 north lines at signed angles from one upright line (true solid, magnetic dashed, grid dotted, so the distinction survives greyscale). Drawn angles are the figure's own data and may be exaggerated; every prompt that uses one says "not to scale" and carries the numbers in text.

Catalog uniqueness rules (unique prompt and unique answer per topic) shaped two designs: diagram prompts are numbered, and "find the ray" answers are lettered rays whose correct letter is unique per item and deliberately mixed high/low, so the key cannot be guessed from alphabet position.

## Accessibility decision

A1's claim is **explicitly visual** (read and select bearings in diagrams). A text alternative that stated the bearing would give the answer away, so the stimulus alt describes the figure without the key, and A1 says so in its scope and limitations. A2–A4 calculations and concept items are fully operable from text. This is the "completion claim must explicitly be visual" branch of the #140 requirement; it is not a claim that the topic is usable without sight.

## Icons

One unique icon per topic, hand-built SVGs to the icon contract (32×32, 1.75 stroke, `#979fac`), checked at 28 px beside the existing compass icon. They were built directly as vectors rather than from generated concepts, so they want the owner's eye at real Library-row size.

## Not built (by design)

Live sensors, GPS, current-declination lookup, GIS, topographic-map work (still P1 and deferred), free numeric entry, route plotting, resection. Change to normalize the existing topic's north to `000°` (research note A0) is left for a later editorial pass.

## Validation

Unit: bearing maths (exhaustive over whole degrees), bank recomputation and coverage, figure parsing/geometry, catalog invariants and seed pinning. Browser (`e2e/bearings.spec.ts`, 320/390/landscape/desktop): each topic's Learn page lists its bank, shows its diagrams, states the no-navigation-competence limitation and has no sideways scroll; the diagram topic tests as a graded choice with the diagram on screen and a non-revealing text alternative; a calculation topic tests with no diagram.
