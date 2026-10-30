# Issue #296 — Authored lessons: source trace

> **Status: Wave 1 authored and registered, 2026-10-30; Pixel acceptance pending.** Provenance for each hand-authored curriculum. It records where each step's content comes from and adds no source, convention or subject authority of its own. Scope and gate: [ISSUE_296_AUTHORED_LESSONS.md](ISSUE_296_AUTHORED_LESSONS.md).
> **Authority:** the existing topic scope, Learn content and sources in [`bearingTopics.ts`](../../src/domain/navigation/bearingTopics.ts) and the scored banks in [`bearingBanks.ts`](../../src/domain/navigation/bearingBanks.ts), and for OODA Loop the topic in [`catalogSeed.ts`](../../src/domain/library/catalogSeed.ts). Argus notation and exercise conventions keep their editorial status.

## OODA Loop (`ooda-loop`)

Every step restates the four scored stage/function answers or the topic's own "How the stages connect" bullets (orientation shaped by experience, culture and heritage; a decision is a hypothesis; action is the test and its result is new information; the circle is a mnemonic for order and feedback runs between stages). Nothing else is claimed. Source: Boyd, *A Discourse on Winning and Losing* (Air University Press); USMC OCS Academic Preparation Guide, as already cited by the topic.

## Whole-Circle Bearings

Curriculum: [whole-circle-bearings.ts](../../src/domain/learning/authored/whole-circle-bearings.ts). Verification: [whole-circle-bearings.test.ts](../../src/domain/learning/authored/whole-circle-bearings.test.ts).

Topic/item authority: [bearingTopics.ts](../../src/domain/navigation/bearingTopics.ts), `wholeCircleLearn` and the `whole-circle-bearings` scope; [bearingBanks.ts](../../src/domain/navigation/bearingBanks.ts), `A1_READ_BEARINGS`, `A1_FIND_BEARINGS`, `readBearingItems()` and `findBearingItems()`. The topic already cites NOAA — Navigation Training Manual and NRCan — Using a compass. No sources are added.

All item numbers below use the full prefix `whole-circle-bearings-item-`. Every listed item is asked directly and repeated in its stage's final checkpoint.

| Stage ID / Title | Scored items | Instruction and feedback traced | Existing Learn / bank source |
| --- | --- | --- | --- |
| `reading-the-dial` / Reading the Dial | `01`, `02`, `03` (037°T, 128°T, 205°T) | Clockwise from true north; three digits and T suffix; cardinal anchors; quadrant check; errors from counting anticlockwise, changing the origin or reading the opposite end. | “Reading a bearing” bullets and 037°T visual; “Quadrant check” paragraph and table; first three A1 read cases and `misreadings()`. |
| `close-to-north` / Close to North | `04`, `05`, `06` (291°T, 005°T, 355°T) | North-west reading; 005° just east and 355° just west of north; 10° separation; 360° written 000°; confusion between the two sides. | “Reading a bearing” notation bullet; “Quadrant check” north-west row; “Close to north” paragraph and visual; remaining A1 read cases. |
| `finding-the-ray` / Finding the Ray | `07`, `08`, `09` (072°T → A, 163°T → B, 250°T → C) | Start at true north, check the quadrant, count clockwise to the lettered ray; feedback identifies anticlockwise and wrong-origin readings. | “Reading a bearing”; “Quadrant check”; first three A1 find cases and their computed ray distractors. |
| `checking-the-quadrant` / Checking the Quadrant | `10`, `11`, `12` (344°T → D, 135°T → E, 270°T → F) | North-west, south-east and due-west checks; feedback identifies the specific mirrored ray or wrong quadrant. | “Reading a bearing” west anchor; “Quadrant check” table; final three A1 find cases and their computed ray distractors. |

Shown dials use the scored item's existing figure. Their authored `altText` describes that figure's actual ray angles and labels; it does not substitute the Learn example's different figure. The test checks each shown ray against the real figure data. Every answer and all four options are checked against the banks; numeric answers and selected ray bearings are also checked with `formatBearing()` / `normalize()` from [bearings.ts](../../src/domain/navigation/bearings.ts). The 005°/355° separation and full-turn notation are verified with `angularSeparation()` and `formatBearing()`.

Ray-finding uses `complete` so the target bearing remains visible beside the lettered figure: the current runner replaces a pictured `choose` prompt with “Which one is this?”. No runner change is included. Scope remains visual dial reading and ray finding; no declination, reciprocal calculations, compass handling or field navigation is added.

## Reciprocal Bearings

Curriculum: [reciprocal-bearings.ts](../../src/domain/learning/authored/reciprocal-bearings.ts). Verification: [reciprocal-bearings.test.ts](../../src/domain/learning/authored/reciprocal-bearings.test.ts).

Topic/item authority: [bearingTopics.ts](../../src/domain/navigation/bearingTopics.ts), `reciprocalLearn` and the `reciprocal-bearings` scope; [bearingBanks.ts](../../src/domain/navigation/bearingBanks.ts), `A2_CASES` and `reciprocalItems()`. The topic already cites NOAA — Navigation Training Manual. No sources are added.

All item numbers below use the full prefix `reciprocal-bearings-item-`. Every listed item is asked directly and repeated in its stage's final checkpoint.

| Stage ID / Title | Scored items | Instruction and feedback traced | Existing Learn / bank source |
| --- | --- | --- | --- |
| `adding-a-half-turn` / Adding a Half Turn | `01`, `02`, `03` (037°T → 217°T, 112°M → 292°M, 146°G → 326°G) | Opposite direction on the same line and north reference; add 180°; distinguish mirror readings and 90° turns. | Overview; “The rule” steps, 037°T example and straight-line visual caption; first three A2 cases and their mirrored/quarter-turn distractors. |
| `wrapping-the-turn` / Wrapping the Turn | `04`, `05`, `06` (203°T → 023°T, 264°M → 084°M, 350°T → 170°T) | Add 180°, then subtract 360° at or above 360°; worked sums 383°, 444°, 530°; distinguish unwrapped sums from mirrors. | “The rule” steps and 225°/350° wrap examples; A2 cases 4–6. Unwrapped choices expose omission of the existing normalization step. |
| `checking-the-return` / Checking the Return | `07`, `08`, `09` (183°G → 003°G, 357°M → 177°M, 000°T → 180°T) | Wrap near north; keep three digits; take the reciprocal again to return to the start; exact 000°/180° boundary. | “The rule” steps and 000°/180° table rows; “Two checks” reciprocal-of-answer bullet; A2 cases 7–9. |
| `reversing-the-ray` / Reversing the Ray | `10`, `11`, `12` (225°M → 045°M, 071°T → 251°T, 295°G → 115°G) | Below 180° add, otherwise subtract 180°; back along the same diagrammed line; preserve T/M/G; conversion is a separate step. | Overview; “The rule” shortcut, 225° example and straight-line visual caption; north-reference limitation; final three A2 cases, including the two diagram cases. |

The numeric practice examples are the existing A2 inputs, using only the rule already taught in Learn. Every `choose` / `complete` answer is checked against `reciprocal()`, `formatBearing()` and `reciprocalItems()`. Tests also verify the intermediate sums, wrapping, shortcut examples, 180° separation, and return to the original bearing. Both diagram `show` steps retain the existing scored figure's exact alternative text. Diagram questions use `complete` to keep “from B back to A” visible in the current runner.

Scope remains one north reference per reciprocal. There are no declination values, reference conversions, new north definitions or field-navigation claims. The source's existing limitations remain in Reference. No `AUTHORED` registry wiring is included in this content draft.


## True & Magnetic North (`north-references-declination`)

Data: [`north-references-declination.ts`](../../src/domain/learning/authored/north-references-declination.ts). Verification: [`north-references-declination.test.ts`](../../src/domain/learning/authored/north-references-declination.test.ts).

Item numbers below are the suffixes of the actual `north-references-declination-item-NN` ids returned by `bearingTopics()`. All 16 items are asked before their stage's final checkpoint. No grid conversions are introduced in this topic.

| Stage id / title | Scored items | Teaching and feedback trace | Existing source authority |
|---|---|---|---|
| `naming-the-norths` / Naming the Norths | 02, 04 | `northReferencesLearn` → **Three norths**: true north points toward the geographic North Pole; magnetic north follows the local horizontal magnetic field; a compass needle aligns with it; grid north follows the vertical map grid. T/M/G names reuse those definitions. Choices distinguish the pole, field and grid. Bank: `northConceptItems()` entries 2 and 4. | Topic's NRCan **Magnetic components** and **Using a compass** sources; T/M/G notation is the stated Argus convention. |
| `signing-declination` / Signing Declination | 01, 03 | **Three norths** defines D between true and magnetic north, positive east and negative west. **Why declination is always supplied** states location/time dependence and the need for a current authoritative local value. Topic limitations state that practice offsets are invented. Wrong choices confuse the pair, reverse the sign or assume a fixed value/threshold. Bank: `northConceptItems()` entries 1 and 3. | Topic's NRCan **Magnetic components** and **Magnetic declination** sources; invented practice offsets are explicitly editorial. |
| `true-to-magnetic` / True to Magnetic | 05–08 | **Converting true and magnetic bearings** gives M = T − D and the 090°T / +10° and 070°T / −12° examples. All four exercises are exactly `A3_CASES[0..3]`. Wrong choices add instead of subtracting D, drop the west sign, or omit conversion. | Same existing NRCan definitions and east-positive convention, expressed using the topic's Argus notation and exercise bank. |
| `magnetic-to-true` / Magnetic to True | 09–12 | The same Learn table gives T = M + D. Examples and questions use only `A3_CASES[4..7]`, including signed west values. Wrong choices subtract instead of adding D, drop the west sign, or omit conversion. | Same existing sources and Argus exercise convention; numerical examples are bank cases. |
| `wrapping-through-north` / Wrapping Through North | 13–16 | **Converting true and magnetic bearings** explicitly normalizes to 000°–359°, including 365° → 005° and −5° → 355°. Exercises are exactly `A3_CASES[8..11]`. Wrong choices retain an unnormalized number or reverse the sign/operation. Three digits and T/M suffixes reuse the stated Argus convention. | Existing Learn normalization rule, topic scope and A3 exercise bank; no local declination is asserted. |

The test builds the topic through `bearingTopics()`, passes full coverage and figure ids to `checkCurriculum`, checks unique stage/step ids and checkpoint membership, and recomputes all 12 arithmetic `choose`/`complete` answers with `convert` and `formatBearing`. It also checks the six worked `show` bodies against real conversion/normalization results. The topic has no scored figure items; its Learn-only north schematic is not copied into a new scored item. Compass handling, field navigation and current local declination remain outside these lessons' scored boundary, as in the topic scope.

## Grid North & Map Bearings (`grid-north-map-bearings`)

Data: [`grid-north-map-bearings.ts`](../../src/domain/learning/authored/grid-north-map-bearings.ts). Verification: [`grid-north-map-bearings.test.ts`](../../src/domain/learning/authored/grid-north-map-bearings.test.ts).

Item numbers below are the suffixes of the actual `grid-north-map-bearings-item-NN` ids returned by `bearingTopics()`. All 12 items are asked before their stage's final checkpoint. The four figure items have authored text equivalents on their `show` steps.

| Stage id / title | Scored items | Teaching and feedback trace | Existing source authority |
|---|---|---|---|
| `reading-north-diagrams` / Reading North Diagrams | 01–04 | `gridNorthLearn` → **Three angles, three names** defines magnetic declination, grid declination and convergence. Its visual caption names solid/dashed/dotted north lines and warns against measuring exaggerated angles. Limitations require the printed values and date. **One rule for every conversion** supplies the signed C convention. The east/west positions and clockwise order come from `A4_DIAGRAMS[0..3]`; alt text describes those actual rays without treating the drawn angle as a margin value. Wrong choices reverse side, confuse coincident lines or select the wrong pair of norths. | Topic's existing NRCan **Magnetic declination**, **Orienting a Topographic Map**, **Using a compass** and **Magnetic components** sources. Signed C is explicitly the topic's Argus convention. |
| `using-the-map-margin` / Using the Map Margin | 05–08 | **One rule for every conversion** gives M = G − g and G = M + g for MN east of GN. Its signed-offset rule covers west as negative. Cases are exactly `A4_DIRECT_CASES[0..3]`, including 004°M with g = −7°, which wraps to 357°G. Wrong choices reverse conversion, omit it, drop the west sign or omit normalization. | Existing grid/magnetic relation and Argus signed-offset practice bank; no current margin value is supplied. |
| `using-signed-offsets` / Using Signed Offsets | 09–10 | **One rule for every conversion**: offsets T = 0°, M = D, G = C; add the starting offset and subtract the target offset. The Learn table gives M = G + C − D and G = M + D − C. Exercises and the signed-C worked example are exactly `A4_MIXED_CASES[0..1]`. Wrong choices swap offsets, omit C or drop C's west sign. The ordered steps apply the existing general rule. | Existing NRCan distinctions; the signed-convergence arithmetic and exercise values are stated Argus conventions. |
| `converting-a-back-bearing` / Converting a Back Bearing | 11–12 | **A margin relation and a back bearing** supplies the 060°G → 050°M → 230°M trace and the reciprocal-first 240°G → 230°M check. **One rule for every conversion** says both routes must agree. Second case is exactly `A4_TWO_STEP_CASES[1]`: 330°M → 320°G → 140°G. The first gap asks the intermediate conversion of item 11; its final choice and checkpoint ask the scored back bearing. Wrong choices omit conversion, omit the reciprocal or reverse the offset signs. | Existing Learn case study, topic's combined-conversion scope and `A4_TWO_STEP_CASES`; normalization/reciprocal arithmetic uses the existing bearing functions. |

The test builds the topic through `bearingTopics()`, supplies all four scored figure ids and full coverage to `checkCurriculum`, checks stage/step identity and local checkpoint membership, and compares the clockwise order to the actual diagram bank. All nine arithmetic `choose`/`complete` answers are verified with `convert`, `gridDeclination`, `reciprocal` and `formatBearing`, including the intermediate forward conversion. Six worked `show` bodies are verified against the same real functions; both reciprocal/conversion routes are checked for both combined cases. No plotting, coordinates, resection or field competence is added. Direct T↔G numeric exercises are not added because the existing scored bank has none; the existing general offset rule still names T, M and G.
