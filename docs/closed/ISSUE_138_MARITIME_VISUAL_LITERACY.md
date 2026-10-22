# Issue #138 — Maritime visual literacy

**Status:** research complete — specification ready for implementation handoff  
**Priority:** P0  
**Issue:** #138  
**Roadmap:** `docs/LIBRARY_ROADMAP.md`  
**Method:** `docs/LIBRARY_RESEARCH_METHOD.md`  
**Research date:** 2026-09-30

## 1. Decision summary

The first Maritime programme should teach **standardized visual decoding**, not broad seamanship and not boating qualification.

| Proposed topic | Decision | Why |
| --- | --- | --- |
| Vessel orientation / terminology | **REVISE** | Keep only the vocabulary required to understand the visual rules. Make it Learn-only prerequisite material inside the navigation-lights topic rather than a standalone scored topic. |
| Navigation lights + aspect logic | **BUILD** | Strong phone fit. The sector geometry is deterministic, the source rules are authoritative, and a finite set can teach both what a light means and why different aspects reveal different lights. |
| Selected day shapes | **BUILD** | A small recognition set is stable, objective, visually distinctive and directly connected to the light-status material. |
| Selected International Code of Signals single-letter flags | **BUILD** | A safety/action-focused subset is finite, sourceable and useful without forcing memorization of the entire code. |
| Advanced COLREG light/shape cases | **DEFER** | Towing/pushing, dredging details, mineclearance, pilotage, constrained-by-draught, detailed fishing exceptions and length-specific arrangements add substantial exceptions before they add enough beginner value. |
| Full International Code of Signals flag alphabet / general code | **DEFER** | The full alphabet, numeral pennants, substitutes, complements and two-letter code exceed the first useful retention boundary. |

The recommended first programme therefore has **33 scored visual items**:

- 16 navigation-light items;
- 5 day-shape items;
- 12 signal-flag items;
- 0 standalone vessel-terminology items.

The 33-item count is intentionally not a claim that all COLREG lights/shapes or all International Code of Signals material have been learned.

### Programme-level completion claim

> After completing the first Maritime programme, the learner can orient a vessel diagram, reason about the basic navigation-light sectors from observer aspect, identify a bounded set of common vessel-status light and day-shape signals, and interpret twelve selected International Code of Signals flags.

Completion does **not** prove safe navigation, collision-avoidance competence, watchkeeping competence, legal compliance for a particular vessel, or a Pleasure Craft Operator Card / professional maritime qualification.

## 2. Proposed programme and sequence

Recommended sequence:

1. **Orientation prerequisite — Learn only**
   - bow, stern, port, starboard;
   - ahead, astern;
   - beam / abeam;
   - fore-and-aft centreline;
   - the phrase `22.5° abaft the beam`;
   - `underway` versus `making way through the water` as operational-state support.
2. **Navigation-light sectors and aspect**
   - masthead, sidelights, sternlight, all-round light;
   - observer position around a canonical vessel;
   - which basic lights are visible from eight unambiguous aspects.
3. **Core vessel-status light signatures**
   - eight bounded reference configurations/signatures.
4. **Selected day shapes**
   - five recognition targets that reinforce the same state vocabulary.
5. **Selected International Code of Signals flags**
   - twelve high-value safety/action single-letter signals.

Do not put sound signals, collision-avoidance manoeuvre rules, buoyage, distress pyrotechnics, radio procedure, or vessel-handling instruction into this programme. Radio procedure is separately owned by #139.

## 3. Completion claims and explicit exclusions

### A. Vessel orientation / terminology — REVISE

**Completion treatment:** no separate completion claim. This is acquisition support for the navigation-light topic.

A learner needs to be able to read a top-down vessel diagram consistently before aspect questions are meaningful. The minimum vocabulary is:

| Term | Why it is retained |
| --- | --- |
| bow | establishes forward end |
| stern | establishes after end and sternlight location |
| port | required for red sidelight reasoning |
| starboard | required for green sidelight reasoning |
| ahead | required for Rule 21 sectors and observer aspect |
| astern | required for stern-sector reasoning |
| beam / abeam | required to understand the angular sector boundary language |
| fore-and-aft centreline | required to understand masthead-light placement and diagram orientation |
| 22.5° abaft the beam | source language that defines the masthead/sidelight cut-off |
| underway vs making way through the water | required to understand why some status signals gain sidelights/sternlight only when making way |

**Excluded:** hull construction vocabulary, amidships as a standalone memorization target, quarters, freeboard, draft/draught, transom, keel, helm, deck fittings and other general boat anatomy unless a later approved topic needs them.

### B. Navigation lights and aspect logic — BUILD

**Completion claim:**

> Given a source-derived schematic, the learner can identify the four basic navigation-light classes, determine which basic lights are visible from eight canonical observer aspects of a power-driven vessel, and identify eight selected vessel-status light configurations/signatures.

**Scored boundary: 16 visual items.**

#### B1. Eight aspect items

Use one canonical **power-driven vessel under 50 m, underway**, with one masthead light, red/green sidelights and a sternlight. Ask which basic navigation lights are visible from these observer positions relative to the vessel's bow:

1. 0° — dead ahead;
2. 45° — starboard bow;
3. 90° — starboard beam;
4. 135° — starboard quarter;
5. 180° — dead astern;
6. 225° — port quarter;
7. 270° — port beam;
8. 315° — port bow.

These positions intentionally avoid the 112.5° / 247.5° sector cut-off boundaries, where a teaching diagram could imply unrealistic precision. The renderer and answer key still need tests immediately inside/outside the source boundaries.

The four source-defined light classes used by these items are:

- **masthead light:** white, 225°, from right ahead to 22.5° abaft the beam on each side;
- **starboard sidelight:** green, 112.5°;
- **port sidelight:** red, 112.5°;
- **sternlight:** white, 135° centred aft.

An **all-round light (360°)** is taught before the status signatures but does not create another aspect item because its visibility does not vary with observer bearing.

#### B2. Eight core status/configuration items

The scored stimulus should identify the **distinguishing legal configuration/signature**, not imply that every optional or length-dependent light is being exhaustively shown.

1. **Power-driven vessel underway, under 50 m — base configuration:** masthead white + sidelights + sternlight. The optional second masthead light for a vessel under 50 m is Learn-only.
2. **Sailing vessel underway — base configuration:** sidelights + sternlight. Optional red-over-green and small-vessel alternatives are Learn-only.
3. **Trawling:** all-round green over white as the distinguishing fishing signal. Making-way and masthead additions are Learn-only context.
4. **Fishing other than trawling:** all-round red over white as the distinguishing fishing signal. Outlying-gear and making-way additions are Learn-only context.
5. **Not under command (NUC):** two all-round red lights vertically as the distinguishing signal.
6. **Restricted in ability to manoeuvre (RAM):** all-round red-white-red vertically as the distinguishing signal.
7. **At anchor, under 50 m — canonical permitted configuration:** one all-round white light.
8. **Aground, under 50 m — canonical reference:** anchor light plus two all-round red lights vertically.

The Test asks the learner to interpret a shown legal reference configuration/signature. **It must never ask the inverse proposition that absence of a signal proves a vessel is not in that state**, because the Collision Regulations contain size and situation exemptions.

**Learn-only support:**

- Rule 20 timing: lights from sunset to sunrise; shapes by day; lights also in restricted visibility as prescribed;
- all-round light = 360°;
- `underway` versus `making way through the water`;
- optional and small-vessel variants for Rules 23, 25 and 30;
- Rule 27's under-12 m exemption except diving operations;
- fishing vessels add sidelights/sternlight when making way;
- status signals do not by themselves teach right-of-way or collision-avoidance action;
- Great Lakes / Canadian positioning modifications exist and are outside this first scored boundary.

**Deferred from the first light set:**

- towing and pushing (Rule 24);
- dredging/underwater obstruction-side lights;
- mineclearance;
- pilot vessels;
- constrained-by-draught signals;
- second masthead / exact length-dependent layouts;
- outlying fishing-gear directional signals;
- seaplanes/WIG craft;
- visibility-distance requirements and photometric/chromaticity details.

### C. Selected day shapes — BUILD

**Completion claim:**

> Given a deterministic day-shape diagram, the learner can identify the vessel state represented by five selected COLREG shape arrangements.

**Scored boundary: 5 visual-recognition items.**

1. **one black ball** — vessel at anchor;
2. **two black balls vertically** — vessel not under command;
3. **ball-diamond-ball vertically** — vessel restricted in ability to manoeuvre;
4. **three black balls vertically** — vessel aground;
5. **two black cones with apexes together** — vessel engaged in fishing under Rule 26 (trawling or other fishing).

**Learn-only support:**

- Annex I shape construction: black shapes; ball, cone, cylinder and diamond definitions/proportions;
- shapes can be smaller in vessels under 20 m, proportionate to vessel size;
- Rule 27 and Rule 30 size exemptions mean the learner is being taught **what a displayed shape means**, not that every vessel in that state must display it in every circumstance.

**Explicitly deferred day shapes:**

- **cone apex down for sail + machinery:** the international rule exists, but Canada's Rule 25(f) removes the requirement for vessels under 12 m in Canadian roadsteads, harbours, rivers, lakes and inland waterways, though they may display it. It is poor first-set material because a simple card would hide the jurisdiction/size condition.
- **cylinder for constrained by draught:** Canada expressly prohibits this signal in Canadian roadsteads, harbours, rivers, lakes and inland waterways. Do not score it as a context-free Canadian signal.
- tow-over-200 m diamond;
- dredging safe/obstructed-side shape arrays;
- mineclearance three-ball arrangement;
- specialized outlying fishing-gear cone.

### D. Selected International Code of Signals flags — BUILD

**Completion claim:**

> Given one of twelve selected International Code of Signals flag designs, the learner can identify its letter and practical single-letter meaning.

**Scored boundary: 12 visual-recognition items.**

Recommended first set:

| Flag | Retained single-letter meaning | Why this set retains it |
| --- | --- | --- |
| **A** | Diver down; keep well clear and proceed slowly | Direct visual-safety value; also cross-checks COLREG Rule 27(e), which requires a rigid Code flag A in the specified diving-operation case. |
| **B** | Taking in, discharging or carrying dangerous goods | High-value hazard state. |
| **D** | Keep clear; vessel manoeuvring with difficulty | Immediate action/hazard value. |
| **F** | Vessel disabled; communicate with me | Common casualty/communication state. |
| **J** | On fire with dangerous cargo, or leaking dangerous cargo; keep well clear | High-consequence hazard signal. |
| **L** | You should stop your vessel immediately | Direct action signal. |
| **M** | My vessel is stopped and making no way through the water | Useful declarative vessel-state signal; contrasts cleanly with L. |
| **O** | Man overboard | Immediate personnel-safety value. |
| **U** | You are running into danger | Direct warning. |
| **V** | Assistance required | Direct assistance request. |
| **W** | Medical assistance required | Distinct and high-value assistance request. |
| **Y** | Vessel is dragging anchor | Common visually observable hazard/state. |

This subset is an **Argus editorial selection**, not a claim that these twelve are an official sub-code. The International Code itself allocates single-letter signals to meanings that are very urgent, important or of very common use; Argus is narrowing that already-prioritized set further for first-pass retention.

**Confusion sets to design deliberately:**

- D vs F vs M — manoeuvring difficulty / disabled / stopped and making no way;
- U vs V vs W — warning to the other vessel / assistance / medical assistance;
- B vs J — dangerous-goods operation versus fire/leak involving dangerous goods;
- L vs M — command to stop versus statement that own vessel is stopped;
- A vs O — diver-down warning versus man-overboard emergency.

**Deferred single-letter signals:**

- C / N — affirmative / negative procedure value is real but lower first-set retention value;
- E / I / S — course/astern-propulsion signals should be considered together with a later manoeuvring-signals topic so flag meaning is not confused with COLREG Rule 34 sound/light signalling;
- G / H / P / Q / T / Z — pilotage, pratique and fishing-context meanings introduce specialized or context-dependent use;
- K / X — legitimate general signals but lower priority than the first twelve.

**Deferred code material:** all numeral pennants, substitutes, answering pennant, complements, two-letter General Signal Code and three-letter Medical Signal Code.

## 4. Authority and source hierarchy

### Tier A — controlling / canonical sources

1. **Canada — Collision Regulations, C.R.C., c. 1416, Schedule 1**  
   Justice Laws: <https://laws-lois.justice.gc.ca/eng/regulations/C.R.C.%2C_c._1416/>  
   Use as the controlling Canadian source for every scored navigation-light/day-shape fact and for Canadian modifications. Relevant rules: 20, 21, 23, 25–30 and Annex I §6. The current consolidated page reviewed for this research was current to 2026-09-21 and notes the last amendment as 2023-06-07.

2. **IMO — Convention on the International Regulations for Preventing Collisions at Sea, 1972 (COLREGs)**  
   <https://www.imo.org/en/about/conventions/pages/colreg.aspx>  
   International owner/cross-check for the Rule 20–31 structure and Annex I scope. Use Canada’s incorporated text where Canadian modifications control the learner-facing boundary.

3. **IMO — International Code of Signals, 2005 Edition (IB994E), current IMO listing; Fifth edition 2021 with March 2022 errata**  
   Current-publications listing: <https://www.imo.org/en/publications/pages/currentpublications.aspx>  
   2022 errata listing: <https://www.imo.org/en/publications/pages/english.aspx>  
   Errata PDF: <https://wwwcdn.imo.org/localresources/en/publications/Documents/Supplements/English/IB994E_errata_February2022_PQ.pdf>  
   This is the canonical version authority for International Code of Signals meanings. The March 2022 errata reviewed here does not amend the single-letter table.

### Tier A — official explanatory / independent operational cross-check

4. **Transport Canada — Safe Boating Guide, TP 511E, 2026**  
   Publication index: <https://tc.canada.ca/en/marine-transportation/publications>  
   PDF: <https://tc.canada.ca/sites/default/files/2026-05/boating_guide_2026_en_acc.pdf>  
   Use for the learner-facing orientation/light-sector explanation and as a Canadian visual cross-check. The guide itself says the regulations control if they differ.

5. **U.S. National Geospatial-Intelligence Agency — Pub. 102, International Code of Signals**  
   Publication landing page: <https://msi.nga.mil/Publications/ICOS>  
   Use as a freely accessible official independent cross-check for the single-letter table and flag depictions. Pub. 102 is not the version authority over the current IMO edition; where they conflict, the current IMO edition/errata wins.

### Source policy for implementation

- No blog, quiz site, sailing-school mnemonic or generated image may define a scored fact.
- A secondary source can help discover a teaching problem but must not override the sources above.
- Do not copy a convenient third-party navigation-light graphic and treat its geometry as authoritative. Reconstruct the diagram from the rule data.

## 5. Claim ledger

| Claim / item family | Authority | Version / boundary | Scored? | Notes / ambiguity |
| --- | --- | --- | --- | --- |
| Light/shape timing | Collision Regulations Rule 20 | Canadian incorporated COLREG | Learn only | Lights sunset–sunrise; shapes by day; restricted-visibility provision retained in Learn. |
| Masthead/sidelight/stern/all-round sectors | Collision Regulations Rule 21 | Canadian incorporated COLREG | **Yes** | Geometry must come from rule values, not art. |
| Power-driven base light configuration | Rule 23 | Canonical scored example limited to vessel under 50 m | **Yes** | Second masthead optional under 50 m; do not score it as required in this example. |
| Sailing base configuration | Rule 25(a) | Base mandatory pattern only | **Yes** | Optional red-over-green and small-vessel alternatives Learn-only. |
| Sail + machinery cone | Rule 25(e), Canadian 25(f) | Canadian size/jurisdiction exception | No — deferred | Not a clean context-free first item. |
| Trawling green-over-white | Rule 26(b) | Distinguishing signal only | **Yes** | Making-way and length-dependent additions Learn-only. |
| Other fishing red-over-white | Rule 26(c) | Distinguishing signal only | **Yes** | Outlying-gear signal Learn-only/deferred. |
| Fishing two-cones apexes together | Rule 26(b),(c) | Shared fishing day shape | **Yes** | It does not distinguish trawling from other fishing. |
| NUC red-red / two balls | Rule 27(a) | Recognition of displayed signal | **Yes** | Under-12 m exemption in Rule 27(g) means no inverse absence claim. |
| RAM red-white-red / ball-diamond-ball | Rule 27(b) | Recognition of displayed signal | **Yes** | Same under-12 m caveat. |
| Code flag A in specified diving operation | Rule 27(e) | COLREG cross-link | Flag A scored in ICS topic | Useful independent confirmation of A's safety meaning. |
| Constrained-by-draught three red / cylinder | Rule 28(a), Canadian 28(b) | Canadian inland prohibition | No — deferred | Do not present as universal Canadian signal. |
| Anchor all-round white / one ball | Rule 30(a),(b) | Canonical scored light example limited to under 50 m; shape recognition | **Yes** | Rule 30(e) contains a small-vessel exemption. |
| Aground anchor light(s) + red-red / three balls | Rule 30(d) | Canonical under-50 m reference | **Yes** | Rule 30(f) exempts under-12 m vessels from extra aground lights/shapes. |
| Shape form/proportions | Annex I §6 | Canada | Learn + renderer QA | Shapes black; dimensions/proportions source renderer. |
| ICS single-letter meanings | Current IMO International Code of Signals; NGA Pub. 102 cross-check | IMO 2005 edition, Fifth edition 2021 + Mar 2022 errata | **Yes: selected 12** | The 12-signal subset is an Argus editorial choice. |

## 6. Content specification

### A. Scored inventory

| Topic | Scored count | Direction | Stimulus |
| --- | ---: | --- | --- |
| Navigation-light aspect | 8 | visual diagram → visible light set | deterministic vessel/top-view SVG |
| Core light/status signatures | 8 | visual configuration → vessel state | deterministic SVG schematic |
| Day shapes | 5 | visual shape arrangement → meaning | deterministic SVG |
| Signal flags | 12 | flag visual → letter + meaning | deterministic/redrawn SVG |
| **Total** | **33** | — | — |

Do not mark the 10 orientation/support terms as scored merely to increase item count.

### B. Learn/reference structure

A single programme can use four Learn sections:

1. **Orient the vessel** — labelled top-down diagram + terms.
2. **How the light sectors work** — sector diagram, then base light definitions.
3. **What vessel states add** — core light stacks and day shapes with explicit exception notes.
4. **Signal flags worth recognizing first** — the 12 retained flags, grouped by warning/state/assistance rather than alphabetically first, with an alphabetical reference below.

Use the existing `entries` Learn block where structured text is sufficient. The current Learn model has no generic visual block, so the actual diagrams need the visual capability described below rather than image URLs embedded into prose.

### C. Difficulty progression

**Navigation lights:**

1. labelled vessel orientation;
2. coloured sectors visible over a top-down hull;
3. observer placed at one of eight aspects with sectors still shown;
4. same aspect question with sector guides removed;
5. status-signature recognition.

Do not introduce photorealistic night scenes as a harder level. Real night photography adds uncontrolled distance, glare, occlusion and exposure rather than a clean test of the rule.

**Day shapes:**

1. Learn reference with label and meaning;
2. isolated unlabelled shape stack;
3. later optional mixed review alongside status-light signatures.

**Flags:**

1. grouped reference with letter, design and meaning;
2. unlabelled flag → letter + meaning;
3. mixed confusion-set review.

### D. Confusion quality

A valid question should require the learner to discriminate between plausible alternatives. Avoid distractors such as `aircraft landing` or unrelated non-maritime meanings.

For lights, wrong answers should come from the same rule family: port vs starboard aspect, NUC vs aground, trawling vs other fishing, sailing vs power-driven.

For day shapes, the strongest confusions are one/two/three balls and two-cones versus ball-diamond-ball.

For flags, use the confusion sets listed in section 3D.

## 7. Visual / media approach

### Design principle

These topics should be **drawn from rules, not illustrated from imagination**.

AI-generated imagery is the wrong primary medium for navigation lights, day shapes and signal flags because tiny positional or colour/pattern errors would directly teach false facts. Unlike Beaufort #129, natural visual variation is not the lesson here.

### Vessel orientation and navigation lights

Use deterministic SVG/React:

- one simple top-down hull silhouette with an explicit bow axis;
- one coordinate system for all aspect questions;
- source data for sector start/end angles and colour rather than hand-positioned decorative arcs;
- status-light diagrams generated from structured definitions;
- observer marker placed at fixed authored bearings;
- optional sector overlays only during Learn/acquisition.

The 2026 Transport Canada Safe Boating Guide is a useful visual precedent for the sector layout, but Argus should redraw the concept from Rule 21 rather than reproduce the government page as an image.

### Day shapes

Use deterministic black SVG primitives:

- circle/ball;
- cone/triangle treatment preserving cone orientation;
- diamond as the source-defined paired-cone form in the reference spec;
- vertical stack spacing proportional and consistent.

At phone size, preserve recognition first; do not attempt literal metre-scale rendering. Keep the Annex I proportions in the source data / QA contract.

### Signal flags

Prefer deterministic/redrawn SVG flags based on the current International Code of Signals designs, verified against IMO/NGA depictions.

- Do not use AI-generated flags.
- Do not use emoji flags or operating-system glyphs.
- Do not depend on exact display hue as the only distinguishing feature; pattern/geometry must remain clear.
- The flag image contains only the signal design. Letter and meaning stay in accessible HTML.
- If third-party reusable SVGs are used as production inputs, record creator, original URL, licence and any modifications, then independently re-check every pattern against the authoritative code.

A project-authored deterministic redraw is preferable because the designs are simple, small and easier to validate than a mixed external asset library.

### Beaufort precedent retained

The useful #129 rules remain:

- essential facts outside images as HTML;
- visual material supplements rather than silently redefining the scored rule;
- explicit asset/provenance records;
- phone-size review before acceptance.

The maritime work differs in one important respect: where Beaufort benefits from realistic environmental imagery, maritime signals benefit from exact deterministic diagrams.

## 8. Product / engineering implications

### Current capability gap

Current `Topic.items` are text-only `prompt` / `answer` items, and the generic Learn schema supports text/table/entry structures but has no generic visual-stimulus block. Therefore the scored visual claims above **cannot be implemented honestly by only adding catalog data**.

### Smallest required generic capability

Add one reusable **visual stimulus slot** that can be attached to:

- a Learn/reference block; and
- a scored item before its text prompt/answer control.

It needs only to support:

1. a static image/SVG asset **or** a deterministic React/SVG renderer specification;
2. an accessible semantic description;
3. an optional visible caption/reference label;
4. a provenance/asset identifier;
5. ordinary existing answer/scoring semantics underneath it.

Do **not** create a generic media framework, scenario engine, maritime simulator, free-rotation 3D vessel or bespoke navigation game.

The maritime-specific sector/status renderer can remain domain-specific on top of the generic stimulus slot.

### Cross-lane reuse rule

Issue #140 (compass/bearings) and #141 (cloud/weather recognition) are independently researching visual stimuli. Before implementation, compare their returned requirements with #138 and define the **smallest common visual-stimulus contract**. Do not pre-build it from #138 alone.

Beaufort #129 may also consume a Learn visual block/carousel, but a carousel is not required for maritime scored recognition and should not be made part of the minimum shared Test primitive.

### Offline / storage implications

- deterministic SVG/React carries negligible media storage;
- 12 simple flag SVGs are small enough for normal shipped/offline catalog packaging;
- no runtime network dependency is justified;
- no learner-state schema should be added solely for these topics;
- visual stimuli remain content definition, not learner state.

## 9. QA, validation and provenance

### Factual QA

1. Every scored item maps to the claim ledger and a specific rule/code entry.
2. Re-check all Canadian modifications before authoring examples.
3. Never infer a mandatory display rule from an Argus canonical example unless the length/jurisdiction assumptions are stated.
4. Every light/status configuration receives a second review pass against the controlling rule before production acceptance.

### Deterministic light QA

The renderer should be tested independently of the authored questions.

At minimum:

- unit-test sector membership for the eight scored aspects;
- unit-test values immediately inside and outside the 112.5° sidelight/masthead boundary and the stern-sector boundary;
- test the port/starboard transform so rotation cannot swap red and green;
- fixture-test each of the eight status signatures against an explicit expected light set/order;
- render snapshots at phone width and verify white/red/green lights remain distinguishable without relying on glow effects;
- avoid placing scored observers exactly on cut-off boundaries.

### Day-shape QA

- renderer uses black shapes as specified by Annex I;
- stack order is data-driven and tested (`ball–diamond–ball` must never become `diamond–ball–diamond`);
- cone orientation is explicit;
- reference proportions are checked even if the on-screen drawing is scaled;
- recognition remains clear at the minimum supported phone width.

### Flag QA

Maintain a 12-row asset manifest containing:

- signal letter;
- canonical meaning source/version;
- authoritative design reference;
- production asset path or renderer ID;
- authoring method (`project redraw` or sourced asset);
- source URL / creator / licence where externally sourced;
- reviewer and QA date;
- SHA-256 if a static production asset is committed.

Compare every accepted flag against at least the current IMO code/design source available to the implementation team and the NGA Pub. 102 depiction as an independent check where possible.

### Accessibility

Essential meaning is HTML, never pixels.

For a **scored** visual stimulus, accessible text must describe the observable stimulus without giving away the answer. Examples:

- light item: `Three all-round lights vertically: red, white, red.`
- day shape: `Three black shapes vertically: ball, diamond, ball.`
- flag: `Rectangular flag divided vertically into white and blue halves.`

Learn/reference alt text can include the identity because it is instructional rather than scored.

Do not make colour the only accessible distinction. Text descriptions must name the visible colours/patterns, and UI state must not rely on colour alone.

### Provenance record

For every authored visual family, retain:

- source URL;
- source owner;
- rule/code edition or consolidation date;
- rule/section/page reference;
- authoring method;
- licence/public-domain/reproduction status if external media is incorporated;
- QA reviewer/date;
- asset hash for committed static media.

Generated media is never factual authority. For this first Maritime programme, there is no identified need for AI-generated media at all.

## 10. Risks and unresolved questions

### Resolved by scope reduction

- **Canadian/international divergence:** handled by excluding context-sensitive constrained-by-draught and sail-plus-machinery day-shape scoring from Level I and recording Canada-specific exceptions in Learn.
- **Small-vessel exemptions:** completion is interpretation of displayed signals, not inference from absence.
- **Photo realism versus technical accuracy:** deterministic diagrams chosen.
- **Full signal-code size:** reduced to twelve single-letter safety/action flags.

### Still to resolve before implementation

1. The shared visual-stimulus data shape should be chosen only after #140/#141 report, so three research lanes do not create three incompatible primitives.
2. If the current IMO International Code of Signals publication cannot be redistributed directly, implementation must use project-authored redraws and record the standard as factual/design authority rather than bundling copyrighted pages.
3. A domain-informed second reviewer should review the final light/day-shape answer-key fixtures. This is a production QA requirement, not a reason to expand research scope.

None of these block the **build** recommendation.

## 11. Bounded implementation handoffs

Do not implement these inside #138. Open bounded follow-up issues after the cross-lane visual-capability comparison.

### Handoff 1 — generic visual stimulus capability

**Own only:**

- optional visual stimulus in generic Learn content;
- optional visual stimulus on ordinary scored items;
- static asset and deterministic renderer support;
- accessible description/caption/provenance reference;
- phone-width rendering/tests;
- no scoring/scheduler/progress redesign.

**Explicitly exclude:** carousel framework, audio, animation engine, scenario engine, 3D, maritime domain rules.

### Handoff 2 — maritime orientation + navigation lights

**Own only:**

- Learn-only orientation prerequisite;
- Rule 21 sector model;
- eight aspect items;
- eight status/configuration items;
- deterministic SVG/React renderer;
- Canadian caveats and source references;
- unit/fixture/accessibility QA above.

**Acceptance boundary:** exactly 16 scored items; no towing/pushing, pilotage, constrained-draught or collision-avoidance curriculum.

### Handoff 3 — five COLREG day shapes

**Own only:**

- one ball;
- two balls;
- ball-diamond-ball;
- three balls;
- two cones apexes together;
- deterministic SVG shapes + five visual-recognition items;
- Annex I provenance and exemption notes.

### Handoff 4 — twelve International Code of Signals flags

**Own only:**

- A, B, D, F, J, L, M, O, U, V, W, Y;
- verified SVG design/redraw for each;
- 12 visual-recognition items;
- canonical meanings and explicit current-version source;
- asset/provenance manifest and QA.

No numeral pennants, substitutes, full alphabet, general code or medical code.

## Admission-gate result

| Gate | Orientation support | Navigation lights | Day shapes | Selected flags |
| --- | --- | --- | --- | --- |
| Finite | Pass | Pass | Pass | Pass |
| Stable | Pass | Pass with Canadian boundary | Pass with Canadian boundary | Pass with versioned IMO source |
| Objective | Pass | Pass | Pass | Pass |
| Useful | Pass as prerequisite | Pass | Pass | Pass |
| Phone-teachable | Pass | Pass | Pass | Pass |
| Phone-assessable | Not separately scored | Pass with visual stimulus | Pass with visual stimulus | Pass with visual stimulus |
| Sourceable | Pass | Pass | Pass | Pass |
| Retainable | Pass | Pass at 16 items | Pass at 5 items | Pass at 12 items |

## Final recommendation

- **Vessel orientation / terminology — REVISE:** fold the minimum vocabulary into navigation-lights Learn; do not create an isolated memorization topic.
- **Navigation lights / aspect logic — BUILD:** 16-item deterministic visual boundary.
- **Selected day shapes — BUILD:** 5-item deterministic visual-recognition boundary.
- **Selected ICS flags — BUILD:** 12-item safety/action subset.
- **Advanced COLREG configurations — DEFER.**
- **Full ICS flag/general code — DEFER.**

Research exit criteria for #138 are met. The next decision is product-level: reconcile #138's small visual-stimulus requirement with #140 and #141 before opening implementation work.