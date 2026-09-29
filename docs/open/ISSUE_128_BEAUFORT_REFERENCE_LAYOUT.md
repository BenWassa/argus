# Issue #128 — Beaufort Scale reference layout redesign

Status: **Design locked; implementation pending**

GitHub issue: #128 — Redesign Beaufort Scale reference layout around force levels

## Why this change

The Beaufort topic currently separates observational effects into two long tables: one for sea conditions and one for land conditions. That organization is faithful to the source table but weak as a learning interface. A learner trying to understand Beaufort Force 7 should not have to find Force 7 in two different places and combine them mentally.

The page should instead organize information around the thing being learned: **the force level**.

The scored boundary does not change. Argus tests:

> Beaufort force → descriptive term + wind-speed range in knots

Sea and land effects are supporting recognition and estimation cues. They help the learner understand what a force means in the world, but they are not scored.

## Locked information architecture

The Beaufort topic page should use this order:

1. **Introduction / How to read the scale**
2. **Visual guide / infographic carousel** — reserved position; implemented separately
3. **The scale** — Forces 0 through 12 as the main content structure
4. **What to remember** — compact scored recall reference
5. **Limitations**
6. **Sources**

This order separates explanation, visual intuition, detailed reference, memorization, and provenance.

## 1. Introduction / How to read the scale

Keep this brief. It should establish only the core model:

- the Beaufort scale runs from Force 0 to Force 12;
- each force has a descriptive term and wind-speed range;
- visible effects at sea and on land help estimate or picture that force;
- Test asks only for the force's descriptive term and knot range.

Do not turn this into a second explanation of all 13 forces.

## 2. Visual guide / infographic carousel

Reserve this position directly after the introduction.

The carousel is a separate design/implementation task. The layout work in #128 should not depend on finished artwork, but it should leave a clear insertion point for it.

The carousel's purpose will be visual understanding, not duplication of the complete textual reference.

## 3. The scale — organize by force

Replace the current separate sea and land tables with 13 vertically ordered force entries.

Each entry should keep the complete mental unit together:

- **Force number** — strongest visual element
- **Descriptive term**
- **Knot range**
- **At sea** observation
- **On land** observation

Conceptual example:

### 7 · Near gale

**28–33 kt**

**At sea** — Sea heaps up and white foam from breaking waves begins to blow in streaks along the direction of the wind.

**On land** — Whole trees are in motion. Walking against the wind becomes difficult.

The precise source wording can remain where appropriate; this example describes the information hierarchy rather than prescribing final copy.

### Mobile hierarchy

On a phone, the visual order should be immediately apparent:

1. `07`
2. `Near gale`
3. `28–33 kt`
4. `SEA`
5. sea observation
6. `LAND`
7. land observation

The force number should carry the greatest visual weight. The descriptive term is second. The speed range is concise factual metadata. Observed effects are explanatory detail.

Do not recreate a table visually through tightly aligned columns. The page should remain comfortable at narrow widths and should not require horizontal scrolling.

## 4. What to remember

After the detailed scale, provide a compact recall reference containing exactly the scored mapping:

```text
0   Calm             <1 kt
1   Light air         1–3 kt
2   Light breeze      4–6 kt
3   Gentle breeze     7–10 kt
4   Moderate breeze  11–16 kt
5   Fresh breeze     17–21 kt
6   Strong breeze    22–27 kt
7   Near gale        28–33 kt
8   Gale             34–40 kt
9   Strong gale      41–47 kt
10  Storm            48–55 kt
11  Violent storm    56–63 kt
12  Hurricane        64+ kt
```

This is a memorization reference, not another explanatory section. It should be visually compact and fast to scan.

## Force 12 treatment

Remove the current separate **The top of the scale** section.

The explanation belongs with Force 12 itself because it qualifies that specific entry.

Argus continues to test:

> **Force 12 — Hurricane — 64 knots or more**

Environment and Climate Change Canada's table prints 64–71 knots for Force 12. The World Meteorological Organization treats hurricane force as Beaufort Force 12 or over, and the Met Office expresses Force 12 as 64 knots or more. The existing source rationale should therefore be preserved as a short inline note under Force 12 rather than isolated after the entire scale.

## Content-model requirement

The existing Learn content model has section headings and block types such as paragraph, bullets, definitions, and table. It does not currently provide a clean reusable representation for a repeated nested entry with its own heading and structured supporting fields.

Implementation should add the **smallest general-purpose content primitive** required to express this cleanly rather than:

- keeping the old tables;
- encoding the entries as fake definition lists;
- hard-coding Beaufort-specific JSX into the generic renderer;
- using CSS to make ordinary paragraphs imitate a content hierarchy.

The new primitive should be reusable by other Argus library topics that need repeated structured reference entries.

## Content that does not change

Unless implementation exposes a factual problem, retain:

- the existing 13 Beaufort terms and knot ranges;
- the sea observations;
- the land observations;
- the Force 12 WMO/Met Office rationale;
- the current limitations;
- the current sources;
- the existing testing scope.

## Out of scope for #128

- infographic artwork;
- carousel interaction design;
- adding km/h values;
- adding wave-height ranges;
- changing Test to speed → force;
- scoring observed effects;
- broader Beaufort curriculum changes.

## Acceptance criteria

- Sea and land are no longer separate 13-row tables.
- Forces 0–12 are the primary content units.
- Every force keeps number, term, knots, sea cue, and land cue together.
- Force number is the primary visual anchor on mobile.
- The page has a reserved location for the later infographic carousel.
- A compact `What to remember` reference exposes the scored 13 mappings.
- Force 12's upper-bound explanation is attached to Force 12.
- Limitations and sources remain at the end.
- The testing contract remains unchanged.
- The result requires no horizontal scrolling on a normal phone viewport.

## Follow-on

Infographic/carousel concept design is intentionally tracked separately so visual exploration can iterate without reopening the information architecture settled here.
