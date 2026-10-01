# Issue #147 — Maritime I: lights, aspect and day shapes

**Status:** shipped (PR #154, merged 2026-09-30); the domain reviewer's second pass of the answer keys is still owed (see below).  
**Issue:** #147  
**Depends on:** #146  
**Research authority:** `docs/open/ISSUE_138_MARITIME_VISUAL_LITERACY.md`  
**Code:** `src/domain/maritime/` (light model, statuses, geometry, banks, topic definitions); figure kinds in `src/domain/visual/figures.ts`

## Locked boundary (met)

- Learn-only vessel-orientation prerequisite;
- 16 scored navigation-light/aspect items;
- 5 scored day-shape items;
- deterministic SVG/React diagrams;
- no collision-avoidance or boating-qualification claim.

## Shipped topics

| Topic id | Title | Items | Bank |
| --- | --- | ---: | --- |
| `navigation-lights` | Navigation Lights & Aspect | 16 | 8 observer aspects (0°, 45° … 315°) + 8 vessel-state light signatures |
| `vessel-day-shapes` | Vessel Day Shapes | 5 | one ball, two balls, ball–diamond–ball, three balls, two cones apexes together |

The orientation vocabulary (bow, stern, port, starboard, ahead, astern, beam/abeam, fore-and-aft centreline, 22.5° abaft the beam, underway vs making way) is a Learn-only section of Navigation Lights, with no scored items. Both topics are `tradecraft`, forward objective-choice items with ids `<topic-id>-item-NN`.

## One geometry model

`src/domain/maritime/lights.ts` holds Collision Regulations Rule 21 as data: masthead white 225° (right ahead to 22.5° abaft the beam each side), starboard sidelight green 112.5°, port sidelight red 112.5°, sternlight white 135° centred aft, all-round 360°. `visibleLights(bearing)` is the only place visibility is decided; the answer keys, the sector arcs in Learn and the tests all read it. Edges are inclusive, so exactly 112.5° sees masthead, green and stern. The scored aspects avoid every edge; dead ahead (0°) is asked on purpose as the one place both sidelights and the masthead show.

`statuses.ts` holds the eight light signatures and five day shapes with their rule references. `geometry.ts` holds every coordinate the figures draw; `maritimeBanks.ts` lists inputs only.

## Figures (registered in the #146 registry)

| Kind | Params | Notes |
| --- | --- | --- |
| `vessel-plan` | `lights?`, `observer?` (0–359), `sectors?`, `labels?` | Top-down, bow up; port left, starboard right. Scored aspect items draw the observer only: sector arcs are Learn-only because they would draw the answer. |
| `light-stack` | `lights: ('white'\|'red'\|'green')[]` (1–4, top first) | All-round lights in a vertical line. |
| `day-shape-stack` | `shapes: ('ball'\|'diamond'\|'cone-apex-up'\|'cone-apex-down')[]` (1–4, top first) | Black shapes on a light ground. Annex I proportions: ball D, cone base D and height D, diamond two cones on a common base; the gap between shapes is an editorial drawing choice. |

## Decisions

- **Claim-first items.** Every signature item shows a *displayed* signal and asks what it means. None asks that the absence of a signal proves a state (tested), because the Regulations exempt small vessels and some situations.
- **Fishing shape.** The two-cone shape is shared by trawling and other fishing (Rule 26(b), (c)), so its answer names both and does not claim to distinguish them. Trawling and other fishing are distinguished by their lights.
- **Aground depiction.** Rule 30(d) puts the two red lights "where they can best be seen", with no fixed position relative to the anchor light. The stack drawn is a teaching depiction and Learn says so.
- **Deferred shapes stay out.** Sail-plus-machinery cone (Canadian size/waters exception) and constrained-by-draught cylinder (prohibited in Canadian inland waters) are not scored, and Learn says why.
- **Accessibility.** For every scored stimulus the text alternative describes what is drawn and never names the vessel state. Aspect prompts also state the observer's position in words and degrees, so those items are fully operable from text. Colour is never the only carrier: lights differ by position and stack order, sector arcs are lettered M/G/R/S, and the alt names the colours.
- **Catalog invariant narrowed.** The shared "unique answer per topic" rule now binds only items that can be reversed. A forward-only objective choice is never asked in reverse, and three aspects legitimately share one answer (135°, 180° and 225° all see only the sternlight). Prompts must still be unique.
- **Sources.** Collision Regulations (Justice Laws, controlling), IMO COLREG (cross-check), Transport Canada Safe Boating Guide (Canadian explanation). Argus editorial choices (example vessel, signature selection, drawing style, distractors) are separated from source-backed rules in each topic's limitations.

## Validation

Unit: Rule 21 sector data and cut-offs immediately inside/outside 112.5° and 247.5°, the port/starboard transform, symmetry, the eight aspects against the note's table, the eight signatures and five shape stacks against fixtures typed from the note, stack order (`ball–diamond–ball` never reordered), cone orientation, Annex I proportions, label clearance and figure validation. Browser (`e2e/maritime.spec.ts`, 320/390/landscape/desktop): both Learn pages list their banks and diagrams without sideways scroll; the orientation and sector teaching appears before scoring; all 5 shapes and all 16 light items are answered end to end using keys typed from the research note and bank a clean run.

## Needs a domain reviewer

The research note asks for a domain-informed second reviewer of the final light and day-shape answer-key fixtures, and for every light configuration to receive a second pass against the controlling rule. That review is a production QA step, not something this PR can self-certify. The Collision Regulations page could not be reached from the sandbox that built this, so the rule values were taken from the research note's Rule 21 text, and the Learn-only statements beyond it (for example Rule 3 "underway", Rule 25(b)/(c) alternatives, the 50 m anchor-light distinction) are from general knowledge of the same Regulations and should be checked against the current consolidation.

## Icons

Hand-built SVGs to the icon contract, checked at 28 px: a top-down hull with four light dots, and a stacked ball–diamond–ball.

## Not built

Towing/pushing, dredging, mineclearance, pilot vessels, constrained by draught, length-dependent layouts, outlying-gear signals, sound signals, collision-avoidance rules and any photographic night scene. Signal flags are #148.
