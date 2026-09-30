# Issue #140 — Compass, bearings, and topographic map literacy

**Status:** research complete; implementation not started  
**Priority:** P0 compass/bearings; P1 topo spike  
**Issue:** #140  
**Roadmap:** `docs/LIBRARY_ROADMAP.md`  
**Method:** `docs/LIBRARY_RESEARCH_METHOD.md`  
**Research baseline:** `main` at `47767b9ea14e4c1fb2741b4f4650582c15e89acf` (2026-09-30)

## Executive decision

Keep the two research lanes separate.

| Lane | Decision | Why |
| --- | --- | --- |
| A — compass and bearings | **BUILD NEXT, bounded** | The core skills are deterministic, useful, sourceable from Canadian authorities, and can be taught on a phone without pretending the phone substitutes for field practice. The main product gap is a reusable objectively graded visual/choice exercise primitive. |
| B — topographic-map literacy | **LATER, not now** | A useful beginner subset exists, but good topo teaching has materially higher cartographic, media, accessibility and QA costs. Real-map work also pushes Argus toward crop/zoom/GIS concerns. Revisit after Lane A proves the shared visual-exercise primitive. |

Topographic maps are therefore **not rejected as a domain**. They are rejected as the next implementation priority.

This issue does not authorize implementation.

---

# 1. Repository and overlap audit

## Existing Argus content

Argus already has a small finite **Cardinal/intercardinal bearings** reference in `src/domain/library/catalogSeed.ts`: the eight named directions mapped to `0°`, `45°`, `90°`, `135°`, `180°`, `225°`, `270°`, and `315°`. The Today primer describes that boundary as “The eight compass points and their degree values.”

That topic is a valid prerequisite. Do not duplicate it in a new programme.

## Current content and Learn/Test primitives

Current generic topics are deliberately finite:

- `Topic.scope` states the boundary;
- `Topic.items` is the complete scored set;
- an ordinary `Item` is fundamentally prompt/answer text;
- structured Learn supports paragraphs, bullets, steps, definitions, tables, entries and the Morse-specific character packet;
- there is **no generic diagram/image Learn block**;
- generic Test reveals the answer and then asks the learner to self-grade correct/incorrect;
- Morse has bespoke objectively graded input, but that is not a generic content primitive.

This matters. Bearings can be *explained* with the existing model, but the desired claim — “can read/calculate a bearing from a precise diagram” — is stronger than a text-only reveal/self-grade card honestly establishes.

## Overlap

At the research baseline:

- there are no open PRs;
- no other open issue owns compass/bearing/topographic-map content;
- `docs/open/NAVIGATION_HISTORY.md` concerns browser/system navigation history, not land-navigation content, so there is no scope collision;
- issue #131/#141 weather/cloud work is visually adjacent only; it does not own deterministic technical diagrams.

---

# 2. Source hierarchy

## Tier A — normative Canadian sources

Use these for definitions, Canadian map conventions and any claim that can affect a calculation.

1. **Natural Resources Canada — Magnetic components**  
   https://www.geomag.nrcan.gc.ca/mag_fld/comp-en.php  
   Authority for true north vs magnetic north, magnetic declination `D`, and the sign convention that declination is positive eastward.

2. **Natural Resources Canada — Magnetic declination**  
   https://geomag.nrcan.gc.ca/mag_fld/magdec-en.php  
   Authority for the distinction among true declination, grid declination and convergence, and for the warning that declination changes with time.

3. **Natural Resources Canada — Using a compass**  
   https://www.geomag.nrcan.gc.ca/mag_fld/compass-en.php  
   Authority for the map/compass relationship and the practical distinction between grid bearings and magnetic bearings. Also establishes that compass reliability is not uniform in the Canadian Arctic.

4. **Natural Resources Canada — Topographic maps**  
   https://natural-resources.canada.ca/maps-tools-publications/maps/topographic-maps  
   Authority for Canada's NTS context and standard `1:50 000` / `1:250 000` map scales.

5. **Natural Resources Canada — Topographic Maps: Tips and Hints**  
   https://natural-resources.canada.ca/maps-tools-publications/maps/topographic-maps/topographic-maps-tips-hints  
   Authority for map-scale examples, contour-spacing interpretation and basic NTS map-reading guidance.

6. **Natural Resources Canada — Orienting a Topographic Map**  
   https://natural-resources.canada.ca/maps-tools-publications/maps/topographic-maps/orienting-topographic-map  
   Authority for the grid/magnetic relationship shown in an NTS margin diagram and the warning not to measure the printed north-reference diagram because its angles may be exaggerated.

7. **Government of Canada Open Data — Topographic Data of Canada, CanVec Series**  
   https://open.canada.ca/data/en/dataset/8ba2aa2a-7bb9-4448-b4d7-f164409fe056  
   Preferred Canadian data source if a later topo pilot needs real vector topographic material.

8. **Open Government Licence — Canada, v2.0**  
   https://open.canada.ca/en/open-government-licence-canada  
   Governs reuse of covered federal open information. It permits copying/modification/adaptation and requires source acknowledgement; it does not permit implying government endorsement.

## Tier B — official supporting sources

Use only when Tier A does not state a teaching convention clearly enough.

- **Ontario Land contour open data** — useful evidence that contour interval and contour types can vary by region/product; not a national convention.  
  https://open.canada.ca/data/dataset/f4b5af30-19a4-40fd-8807-76fdae8923fd
- **U.S. Geological Survey educational/topographic specifications** — acceptable support for general contour and depression-symbol pedagogy, but U.S. cartographic conventions must never override NTS/Canadian convention.  
  https://www.usgs.gov/educational-resources/topographic-mapping  
  https://www.usgs.gov/educational-resources/topographic-map-symbols

## Tier C — secondary explanation

Reputable outdoor-navigation texts can inform wording, exercise sequencing or common learner errors, but must not be the authority for Canadian declination/grid rules or NTS symbology.

## Source freshness rule

Magnetic declination is time- and location-dependent. Argus should **not** ship a memorized “Toronto declination,” a current magnetic-pole coordinate, or any other perishable value as scored knowledge. Calculation exercises should use explicitly hypothetical authored values. Real-world current declination lookup belongs outside the completion claim unless a future feature integrates a maintained authoritative calculator.

---

# Lane A — P0 compass and bearings

# 3. Lane A completion claim

A learner who completes the proposed compass/bearing sequence may be described as able to:

> **Interpret whole-circle bearings in authored diagrams, calculate reciprocal bearings, distinguish true/magnetic/grid north, and perform bounded bearing conversions when the relevant signed north-reference offset is supplied.**

The completion claim **does not** say that the learner can navigate safely in the field.

## Explicit exclusions

Completion does not establish competence in:

- physically holding, levelling or sighting a compass;
- taking a field bearing to an object;
- walking an azimuth accurately;
- pace counting or distance estimation on the ground;
- resection, triangulation or position fixing;
- terrain association;
- route selection/safety;
- GPS/GNSS use;
- phone magnetometer calibration or reliability;
- finding a current local declination;
- navigating in low visibility, emergencies or the Canadian Arctic.

Those require separate instruction and, for several skills, real-world practice.

---

# 4. Lane A terminology and calculation contract

## 4.1 Whole-circle bearings

For Argus exercises:

- bearings increase clockwise from the stated north reference;
- canonical stored/displayed answers are normalized to `000°` through `359°`;
- `360°` is the same direction as `000°`, but answer keys normalize it to `000°`;
- always show the north reference when ambiguity is possible: e.g. `037°T`, `080°M`, `100°G`.

Do not let “bearing” silently change its north reference between cards.

## 4.2 Reciprocal / back bearing

The reciprocal is the opposite direction on the same north reference:

`reciprocal(b) = normalize(b + 180°)`

where:

`normalize(x) = ((x mod 360) + 360) mod 360`

Worked examples, independently recomputed:

| Forward | Reciprocal |
| --- | --- |
| `037°` | `217°` |
| `225°` | `045°` |
| `350°` | `170°` |
| `000°` | `180°` |
| `180°` | `000°` |

The common “add 180 below 180, subtract 180 at/above 180” shortcut may be taught only as an equivalent mental method, not as a second rule.

## 4.3 True, magnetic and grid north

Teach these as separate references:

- **True north (T):** direction toward geographic north.
- **Magnetic north (M):** direction of the local horizontal geomagnetic field to which a compass aligns.
- **Grid north (G):** north defined by the map grid/projection.

Critical Canadian-map distinction:

- **magnetic declination `D`** is the angle between true and magnetic north;
- an NTS map margin may instead give the angle between **grid north and magnetic north** (grid declination);
- the angle between true north and grid north is the **convergence**;
- the printed margin diagram is explanatory and can be exaggerated; do not measure the drawn angle.

Do not call all three angles “declination.”

## 4.4 Signed calculation convention for authored Argus exercises

NRCan defines magnetic declination `D` as positive eastward. Preserve that.

For deterministic Argus calculation exercises, define a signed clockwise offset from true north:

- `αT = 0`
- `αM = D`
- `αG = C`, where `C` is an **Argus exercise convention** for signed grid convergence: east of true is positive, west is negative.

Then the general reference conversion is:

`bearing_B = normalize(bearing_A + αA - αB)`

This is preferable to a mnemonic because the reference change is explicit.

Consequences:

- true → magnetic: `M = normalize(T - D)`
- magnetic → true: `T = normalize(M + D)`
- true → grid: `G = normalize(T - C)`
- grid → true: `T = normalize(G + C)`
- grid → magnetic: `M = normalize(G + C - D)`
- magnetic → grid: `G = normalize(M + D - C)`

### Independently checked examples

| Given | Required | Answer |
| --- | --- | --- |
| `T = 090°`, `D = +10°` (10°E) | magnetic bearing | `080°M` |
| `M = 080°`, `D = +10°` | true bearing | `090°T` |
| `T = 070°`, `D = -12°` (12°W) | magnetic bearing | `082°M` |
| `M = 082°`, `D = -12°` | true bearing | `070°T` |
| `G = 100°`, `C = +2°`, `D = +10°` | magnetic bearing | `092°M` |
| `M = 092°`, `C = +2°`, `D = +10°` | grid bearing | `100°G` |

The mixed `T/M/G` formula is for **authored exercises with explicitly supplied offsets**. In real NTS use, if the margin already states the grid↔magnetic relationship, teach the learner to use the stated numeric relation rather than reconstructing it by measuring the diagram.

## 4.5 Mnemonics

NRCan publishes traditional add/subtract mnemonics. Argus should not make one the rule.

A mnemonic can appear only after:

1. the learner knows which two north references are being converted;
2. the signed relationship is shown geometrically;
3. the numeric rule is stated.

Reason: a mnemonic that omits the starting and target references is easy to apply in the wrong direction, and grid declination is not identical to true magnetic declination.

---

# 5. Lane A curriculum specification

Keep the existing eight-point bearing topic as the prerequisite. Add four bounded topics rather than one large deck.

## A0 — existing: Cardinal/intercardinal bearings

**Keep/revise:** keep the eight-item boundary.  
**Claim:** recall the eight named compass points and their degree values.  
**Change later:** editorially normalize north as `000°` where the broader programme uses three-digit bearing notation, while explaining `0° = 000° = 360°` directionally.

## A1 — Whole-circle bearing diagrams

**Completion claim:** read and select whole-circle bearings in deterministic compass-rose diagrams.

Learn:

- clockwise measurement from the stated north;
- three-digit notation;
- quadrant sanity checks;
- `000°/360°` equivalence;
- examples not confined to 45° increments.

Scored bank: **12 fixed exercise specifications**.

- 6 `diagram → bearing` exercises;
- 6 `bearing → diagram` exercises;
- cover every quadrant;
- include at least two near-north wrap cases (e.g. `005°`, `355°`);
- include no more than two cardinal/intercardinal exact angles so the existing topic does not carry the test.

The 12 specifications may render deterministic variants, but the scored boundary must remain inspectable and exportable.

## A2 — Reciprocal bearings

**Completion claim:** calculate the opposite/back bearing on the same north reference.

Learn:

- geometric meaning: same line, opposite direction;
- `+180°` and normalization;
- equivalent mental shortcut;
- reference suffix remains unchanged (`T→T`, `M→M`, `G→G`).

Scored bank: **12 calculations**.

Coverage:

- 3 inputs below `180°`;
- 3 at/above `180°`;
- 2 wrap-around near `000°`;
- 2 cardinal/intercardinal checks;
- 2 diagram-based reciprocal questions.

Do not reuse only memorable round numbers.

## A3 — North references and declination

**Completion claim:** distinguish T/M/G and correctly convert true↔magnetic bearings when a signed declination is supplied.

Learn:

- definitions of T/M/G;
- declination `D`, east-positive;
- why magnetic values are local/time-dependent;
- `M = T - D`, `T = M + D`, derived from a diagram;
- NTS warning: map margin's grid declination is G↔M, not automatically true declination;
- do not measure an exaggerated north-reference diagram.

Scored bank: **16 items**:

- 4 concept/reference-identification items;
- 4 true→magnetic calculations: two east, two west;
- 4 magnetic→true calculations: two east, two west;
- 4 wrap/boundary calculations, including a result crossing `000°`.

All calculations must state `D` explicitly. No question may depend on the learner knowing a current real-world declination.

## A4 — Grid north and combined map-bearing application

**Completion claim:** interpret a three-north diagram and convert between stated north references when the necessary numeric relation/offsets are supplied.

Learn:

- grid convergence concept;
- direct map-margin G↔M relation;
- the signed reference-offset model as the general calculation method;
- reciprocal before/after conversion as a consistency check;
- one worked NTS-style schematic explicitly labelled “not to scale.”

Scored bank: **12 items**:

- 4 read a north-reference relationship from an authored diagram;
- 4 direct G↔M conversions with an explicit numeric relationship;
- 2 mixed T/M/G conversions with both `D` and `C` supplied;
- 2 two-step problems combining conversion + reciprocal.

This is the upper bound for the first release. Do not extend into field route plotting, coordinate navigation or resection under #140.

---

# 6. Lane A exercise and media plan

## Preferred media: deterministic SVG/React

Technical geometry should be rendered from parameters, not generated as raster art.

Required figure families:

1. **Bearing rose**
   - centre point;
   - north marker/reference suffix;
   - optional 90° quadrant guides;
   - ray generated from exact bearing;
   - optional clockwise arc;
   - no decorative map texture.

2. **Reciprocal line**
   - forward and reverse arrows on one exact axis;
   - labels withheld when they are the answer.

3. **Three-north diagram**
   - T/M/G rays generated from exact offsets;
   - explicit E/W labels or signed values;
   - numeric text is authoritative;
   - a visible “schematic / not to scale” note when angles are exaggerated for legibility.

4. **Map-bearing schematic**
   - simple start/end symbols;
   - optional square grid;
   - exact generated line;
   - no pseudo-topography.

No AI image generation is justified for Lane A. It would add nondeterminism to content whose value is exact geometry.

## Responsive requirements

- designed first at ~360–430 CSS px viewport width;
- all important geometry remains legible at 200% text scaling;
- no required horizontal page scroll;
- minimum touch targets follow the app's existing control standard;
- choice labels remain text, not text baked into an image;
- angle/reference information cannot rely on colour alone.

## Accessibility

A visual bearing exercise is intrinsically spatial. Do not pretend an `alt` string can make every spatial-recognition item equivalent without also revealing the answer.

Requirements:

- diagrams are accompanied by meaningful figure labels and all non-answer instructional information in text;
- calculations and conceptual T/M/G questions must be fully operable with keyboard/screen reader;
- any completion gate that includes a visual-only spatial item must have an equivalent non-visual calculation/relationship form, or the completion claim must explicitly be visual;
- controls never require drag as the sole input;
- answer state is announced programmatically.

---

# 7. Smallest product primitive required for Lane A

Do **not** create a navigation-specific mini-game architecture.

Add one reusable objectively graded exercise primitive whose content is plain validated data.

Minimum conceptual shape:

```ts
type ExerciseItem = {
  kind: 'choice'
  prompt: string
  choices: string[]
  answer: string
  figure?: BearingFigureSpec
}
```

The exact TypeScript is an implementation decision, not prescribed here. The contract is:

- deterministic serializable figure parameters, not arbitrary component names/HTML;
- single-choice objective grading;
- answer/choices validated at import/build time;
- choices shuffled without changing the answer key;
- figure can render in Learn examples and Test without duplicating geometry logic;
- text-only items continue to work unchanged;
- export/import preserves the exercise;
- offline operation requires no external service;
- no sensor/GPS dependency.

### Why objective choice first

The current generic Test is reveal + self-grade. That is adequate for simple recall but weaker for calculations. A generic choice response is the smallest improvement that can objectively score:

- a numeric reciprocal;
- a T↔M conversion;
- selection of the correct ray;
- interpretation of a schematic relationship.

A free numeric-entry primitive may be useful later, but it is not required to ship a rigorous first bearings programme.

---

# 8. Exercise answer-key and QA method

All numeric answer keys must be derived from parameters, never manually copied into a separate prose answer.

## Canonical helpers

Implementation should have one tested pure geometry module with equivalents of:

```text
normalize(x)
reciprocal(b)
convertReference(bearing, fromOffset, toOffset)
```

## Required invariants

For all authored whole-degree bearings:

- `0 <= normalize(b) < 360`;
- `reciprocal(reciprocal(b)) == normalize(b)`;
- converting A→B→A returns the normalized original;
- converting A→A is identity;
- diagram ray angle and displayed canonical answer derive from the same parameter;
- all distractors are unique after normalization.

## Boundary test set

At minimum include:

`000, 001, 005, 045, 090, 179, 180, 181, 270, 350, 355, 359`

and declination/convergence cases with:

- positive/east;
- negative/west;
- zero;
- wrap across `000°`.

## Independent validation

Use two checks before content acceptance:

1. **programmatic invariant check** over the complete authored fixture bank plus exhaustive `000–359` reciprocal round-trip;
2. **independent manual/geometric review** of every unique calculation pattern by a second reviewer, working from the diagram/reference definition rather than reading the implementation formula.

Research-stage recomputation on 2026-09-30 checked:

- the reciprocal identity across all 360 whole-degree bearings;
- conversion round-trips across all 360 bearings for 49 pairs drawn from reference offsets `[-20, -12, -5, 0, 2, 10, 25]`;
- every worked example printed in this document.

No discrepancy was found.

## Distractor policy

Wrong choices should represent plausible errors, not random nearby numbers:

- reversed `+/-180` logic;
- failed `360°` normalization;
- adding declination when the required conversion subtracts it;
- ignoring declination;
- using the reciprocal of the correct result.

Never include duplicate choices after normalization.

---

# 9. Lane A claim ledger

| Claim | Type | Authority / validation | Product use |
| --- | --- | --- | --- |
| Magnetic declination is the angle between true and magnetic north; east is positive | factual/calculation | NRCan Magnetic components | A3 formula/sign convention |
| Magnetic north is the direction of the local horizontal magnetic field, not simply a line to a memorized pole coordinate | factual | NRCan Magnetic declination | conceptual correction |
| NTS map north-reference diagram may give grid↔magnetic angle; true↔grid is convergence | factual/calculation | NRCan Magnetic declination | A3/A4 |
| Do not measure the drawn NTS margin diagram; angles may be exaggerated | operational | NRCan Orienting a Topographic Map | A4 |
| Magnetic declination varies with time; old annual-change extrapolation can introduce error | factual/safety boundary | NRCan Magnetic declination | exclude memorized live values |
| Reciprocal is a 180° opposite-direction transformation | mathematical | geometry; independently recomputed | A2 |
| General signed reference conversion formula in §4.4 | authored mathematical convention | derived from defined reference offsets; round-trip validated | A3/A4 |
| Phone completion is not field-navigation competence | product boundary | research decision | all Lane A copy |

---

# Lane B — P1 topographic-map spike

# 10. Lane B decision

**Decision: LATER.**

Do not build a topo programme in the next implementation batch.

There is enough value to preserve a future scoped pilot, but the first implementation should wait until:

1. Lane A's deterministic visual/choice primitive exists and is proven on phone;
2. its accessibility and export/import model are settled;
3. a topo-specific SME/cartographic review is available for the terrain-pattern portion.

This avoids creating a second visual-content subsystem before the first has been validated.

---

# 11. What a beginner actually needs

A beginner does not need “GIS.” A useful topo-literacy sequence can remain much smaller.

## B1 — Map scale and what a topo map represents

Teach:

- topographic maps represent terrain and mapped features at a defined scale;
- Canadian NTS standard scales include `1:50 000` and `1:250 000`;
- at `1:50 000`, 1 cm on the map represents 0.5 km on the ground;
- scale bar / ratio conversion;
- maps are dated products, not a guarantee of current ground conditions.

Phone-testable:

- simple distance conversions;
- choose which of two scales shows more local detail;
- read a clearly cropped scale/legend excerpt.

## B2 — Contours, elevation and interval

Teach:

- a contour joins points of equal elevation;
- contour interval is the elevation difference between successive contour lines;
- close spacing means steeper slope; wider spacing means gentler slope;
- labelled/index contours and intermediate contours where the chosen Canadian source/product supports the treatment;
- contour interval must be read from the map/product, not assumed nationally.

Phone-testable:

- calculate an unlabeled contour elevation from a stated interval;
- rank two slopes by steepness;
- identify uphill/downhill direction from labelled contours.

## B3 — Basic landform patterns

Candidate concepts:

- summit/hill;
- valley;
- ridge/spur;
- saddle/pass;
- depression, only where the selected cartographic convention/source clearly supports its symbol.

This is the point where source discipline becomes more important. NRCan's public beginner pages strongly support contour/elevation/slope basics, but they do not provide a single complete beginner taxonomy for every ridge/valley/saddle pattern. Before shipping B3, validate the exact visual grammar against a Canadian cartographic/geomatics reviewer and the actual Canadian source material selected for the programme. U.S. or outdoor-navigation diagrams may support pedagogy but cannot silently become Canadian convention.

Phone-testable:

- choose the matching schematic landform from 3–4 deterministic contour diagrams;
- identify higher/lower side;
- distinguish a valley-like from ridge-like pattern when the diagram is unambiguous.

## B4 — Real-map transfer

Use small official Canadian excerpts to transfer the schematic skill:

- find contour interval;
- infer relative steepness;
- measure a simple map distance;
- identify a clearly supported feature.

This should be **practice/reference first**, not scored completion, until crop/zoom and ambiguity QA have been proven.

## B5 — Route comparison

Defer.

Comparing routes across real terrain sounds attractive but quickly requires judgments about:

- vegetation and surface;
- cliffs/impassable features;
- water crossings;
- roads/trails and their currency;
- total ascent/descent;
- private/restricted land;
- season/weather;
- user fitness and risk tolerance.

A phone can present a toy “which route is shorter/steeper?” diagram, but that is not honest evidence of outdoor route-selection competence. Do not ship route-choice scoring under the first topo programme.

---

# 12. Suitable topo media

## Preferred order

### 1. Deterministic synthetic contour SVG — primary teaching/scoring medium

Best for B2/B3 because:

- answer truth is known;
- contour interval/elevation can be generated exactly;
- diagrams can be simplified for phone size;
- no map copyright/provenance ambiguity;
- offline by construction;
- no accidental unsafe route advice.

Synthetic contour diagrams must still be cartographically plausible and reviewed. “Synthetic” does not mean arbitrary squiggles.

### 2. Official Canadian map/data excerpts — transfer examples

Preferred source: NRCan/Open Government CanVec or other explicitly licensed Canadian official data.

Use real excerpts to show that clean schematics transfer to actual cartography, not as the first teaching surface.

Every derived/cropped excerpt must record:

- information provider/dataset;
- source URL;
- dataset/resource version or access date;
- geographic extent or NTS sheet where applicable;
- original scale/resolution where relevant;
- transformations/crop/styling performed by Argus;
- licence;
- required attribution.

For Open Government Licence — Canada information, use the provider's specified attribution if present; otherwise the licence's default acknowledgement (“Contains information licensed under the Open Government Licence – Canada.”) and link to the licence where practical. Do not imply NRCan endorsement.

### 3. AI-generated topo/map imagery — reject

There is no good reason to ask a generative image model to invent technical contour geometry or map symbology. Deterministic authoring is cheaper to verify and more accurate.

AI may assist with code/content drafting, but the rendered technical truth must come from parameters or licensed authoritative map data.

---

# 13. Topo engineering implications

A real topo programme would require more than content.

## Shared with Lane A

- generic figure-capable Learn rendering;
- objectively graded choice exercise;
- serializable figure specifications;
- responsive SVG;
- offline-safe assets;
- source/provenance metadata;
- accessible alternatives.

## Topo-specific likely work

For a schematic-only B1/B2 pilot:

- contour SVG generator or authored SVG fixtures;
- elevation/interval validation;
- simple scale-distance calculation helper.

For real-map B4:

- image/excerpt figure block;
- responsive pan/zoom or carefully bounded fixed crops;
- source/attribution rendering;
- asset-size/offline strategy;
- provenance manifest;
- visual QA at actual phone dimensions.

For CanVec-derived custom cartography:

- GIS/data extraction and reprojection/styling workflow;
- repeatable export pipeline;
- cartographic label/contour decisions;
- more specialist QA.

A live tile/WMS/GIS viewer is **not** justified for the learning goal and would be a scope failure.

---

# 14. Topo cost and expertise assessment

Relative to an ordinary Argus finite-reference topic:

| Area | Lane A bearings | Topo B1/B2 synthetic | Topo real-map B3/B4 |
| --- | --- | --- | --- |
| Research/content | medium | medium | high |
| Engineering | medium | medium | high |
| Media authoring | low-medium | medium | high |
| QA burden | medium | high | high |
| Accessibility difficulty | medium | medium-high | high |
| Licensing/provenance | low | low | medium-high |
| Domain expertise | land-navigation/geomatics review | cartographic review | cartographer/geomatics + experienced navigator |
| Offline complexity | low | low | medium-high |

The decisive difference is not “can React draw contours?” It can. The expensive part is ensuring that schematic landforms, real-map excerpts and claimed interpretations remain unambiguous, Canadian-appropriate, legible on a phone and honestly scoped.

---

# 15. Topo claim ledger

| Claim | Type | Authority / validation | Product use |
| --- | --- | --- | --- |
| Canadian NTS maps are available at standard `1:50 000` and `1:250 000` scales | factual | NRCan Topographic maps | B1 |
| At `1:50 000`, 1 cm represents 0.5 km; at `1:250 000`, 1 cm represents 2.5 km | calculation convention | NRCan Tips and Hints | B1 |
| Contours represent elevation; closer spacing indicates steeper slope | factual/interpretive | NRCan Tips and Hints / Elevation data | B2 |
| Contour interval can vary by product/region and must not be assumed | factual boundary | official Canadian datasets incl. Ontario contour metadata | B2 |
| CanVec supplies official Canadian vector topographic data suitable for derived maps | factual | Government of Canada Open Data / NRCan | B4 media |
| Open Government Licence — Canada permits covered information to be copied/adapted with attribution requirements | licensing | OGL-Canada v2.0 | provenance |
| Ridge/valley/saddle pattern taxonomy is ready for Canadian scored content | **not yet established** | requires selected source + SME review | gate B3 |
| Real route comparison is honestly assessable as beginner phone-only topo literacy | **rejected for first programme** | product/safety boundary | exclude B5 |

---

# 16. Lane B completion claims if revisited later

Do not use one broad “topographic map literacy” badge.

A future pilot should have narrow claims such as:

### Topo foundations
> Can use a stated map scale, contour interval and labelled contours to calculate simple distances/elevations and compare relative slope in authored diagrams.

### Terrain-pattern interpretation
> Can recognize a bounded set of explicitly taught contour patterns in unambiguous authored diagrams.

Neither claim means:

- can navigate outdoors from a topo map;
- can judge route safety;
- can identify every landform in a real map;
- can keep position in terrain;
- can replace field instruction or local/current mapping.

---

# 17. Bounded implementation handoffs

## Handoff A — supported now

Open one implementation issue for **Compass/bearings programme + reusable visual-choice primitive**.

It may own only:

1. generic validated choice item with optional deterministic bearing figure spec;
2. Learn rendering for the same figure data;
3. A1–A4 authored finite banks specified above;
4. pure geometry helpers and exhaustive tests;
5. responsive/accessibility work;
6. source/limitations text;
7. migration/export/import support required by the new item shape.

Acceptance gates:

- no AI-generated technical diagrams;
- no sensor/GPS work;
- no field-navigation claim;
- all exercise answer keys generated from parameters;
- all worked fixtures pass independent calculation QA;
- current eight-point topic remains prerequisite rather than duplicated;
- completion copy exactly matches §3.

Do not split A1–A4 into multiple engineering issues unless implementation review finds a real sequencing dependency. The research is one bounded programme.

## Handoff B — not supported now

Do **not** open a topo implementation issue yet.

A future topo follow-up may be opened only after Lane A lands and should initially own a **schematic B1/B2 pilot**, not a GIS viewer or full route-navigation programme.

Prerequisites for that future issue:

- reuse the shipped visual-choice primitive;
- select a Canadian cartographic reviewer;
- lock the exact Canadian source set;
- prove contour diagrams at phone scale;
- decide whether any real-map excerpt is needed for v1;
- if real excerpts are included, define provenance/attribution storage before asset production.

B3 landforms and B4 real-map transfer should remain optional follow-ons; B5 route comparison remains deferred.

---

# 18. Research-method closeout

## Completion claims stated exactly

- Lane A: §3.
- Lane B future bounded claims: §16.
- No field-navigation or route-safety claim is authorized.

## Source hierarchy recorded

See §2.

## Claim ledger recorded

See §§9 and 15.

## Negative boundary recorded

See §§3, 11 and 16.

## Media/provenance policy recorded

See §§6 and 12.

## Calculation inventory and validation recorded

See §§4, 5 and 8.

## Smallest product primitive identified

One generic objectively graded choice item with an optional deterministic serializable figure specification. No GIS, sensor or navigation-specific game engine.

## Decisions

- **Compass/bearings:** build next.
- **Topographic maps:** later.
- **AI technical diagrams:** reject.
- **Live map/GIS system:** reject for this programme.
- **Field-navigation competence claim:** reject.

## Research status

Issue #140 has enough evidence to hand Lane A to implementation planning. Lane B has completed its spike and should remain parked until the stated prerequisites are met.
