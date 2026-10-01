# Argus Library Roadmap

**Status:** authoritative current library-expansion priority index  
**Last reviewed:** 2026-09-30  
**Research method:** `docs/LIBRARY_RESEARCH_METHOD.md`

## Purpose

This file is the single current answer to:

- which Argus library families are being expanded;
- which candidates are priority, exploratory, parked, or shipped;
- which GitHub issue owns the next decision or implementation;
- which work is research versus implementation.

Detailed evidence belongs in issue-specific notes under `docs/open/`. Completed or superseded work belongs under `docs/closed/`. Historical research remains available for rationale but does not override this roadmap.

## Product rule

Argus should favour **phone-first practical knowledge that changes what the learner can perceive, decode, recall, calculate, or interpret**.

A candidate is strongest when the phone can honestly train and assess it through one or more of:

- finite recall;
- visual recognition;
- audio recognition/copying;
- sequencing;
- calculation or transformation;
- deterministic diagram interpretation;
- constrained application with an objective answer key.

Do not build a subject merely because it sounds practical, military, survival-oriented, or difficult. Physical skills that require equipment, tactile feedback, supervised practice, or reliable video demonstration are weak app candidates unless the app teaches a narrower supporting knowledge claim.

## Priority definitions

- **P0 — active expansion:** approved for implementation or immediate enabling work.
- **P1 — later / research spike:** worthwhile, but not the next implementation priority.
- **P2 — backlog:** plausible Argus material but not worth active work while higher-value families remain open.
- **Shipped:** current catalog/product capability; may still have enhancement issues.

Research approval does not itself authorize implementation. A build issue exists only after the research fixes the completion claim, source boundary, medium and QA approach.

## Current programme

| Priority | Family / candidate | Current state | Owner issue | Intended medium | Decision / note |
| --- | --- | --- | --- | --- | --- |
| **P0** | Shared visual content primitives | **Shipped** | #146 | Learn media + deterministic visual-choice item | Shipped shapes recorded in `docs/open/ISSUE_146_VISUAL_CONTENT_PRIMITIVES.md`. Unblocks #147/#148/#149 and #131's UI integration once merged. |
| **P0** | Maritime — vessel orientation, navigation lights & day shapes | **Shipped** | #147 | HTML + deterministic SVG/React + objective visual choice | Learn-only orientation prerequisite; 16 light/aspect items + 5 day shapes. Detail and the pending domain-review note in `docs/open/ISSUE_147_MARITIME_LIGHTS_DAY_SHAPES.md`. |
| **P0** | Maritime — selected International Code of Signals flags | **Implemented as a draft; two flags corrected, awaiting sign-off** | #148 | deterministic/redrawn SVG + visual recognition | 12 signals: A, B, D, F, J, L, M, O, U, V, W, Y. Designs await comparison with IMO/NGA depictions before merge; checklist in `docs/open/ISSUE_148_SIGNAL_FLAGS.md`. |
| **P0** | Communications — Canadian radio procedure + marine VHF | **Blocked on primary sources** | #150 | HTML + finite recall / structured sequence | Canadian general substrate from ISED RIC-22; marine procedure from CCG RAMN 2026. Scored wording must come from those texts, which were not reachable when this was attempted; see the note for how to unblock. |
| **P0** | Communications — prerecorded listening/copy drills | **Runtime implemented; production blocked** | #151 | local prerecorded speech + transcript + objective drill | Runtime shipped (`docs/open/AUDIO_DRILLS_RUNTIME.md`); production scripts depend on #150 and the TTS bake-off needs model access and human listening QA. No microphone/ASR in first release. |
| **P0** | Environment — WMO cloud genera visual field guide | **Hero images sourced** | #131 | sourced real imagery + HTML Learn guide | Ten CC BY-SA hero images sourced, QA'd and packaged under `public/media/clouds/` (2026-09-30); UI integration uses #146. Scored photographic recognition remains deferred. |
| **P0** | Navigation — compass & bearing skills | **Shipped** | #149 | deterministic SVG/React + calculations | Existing eight-point topic remains prerequisite; four follow-on topics (12/12/16/12 items) shipped per #140. Detail in `docs/open/ISSUE_149_COMPASS_BEARINGS_IMPLEMENTATION.md`. |
| **P1** | Navigation — topographic map literacy | **Later, research completed** | #140 research | synthetic deterministic contours / later real-map transfer | Valid beginner subset exists, but defer until #149 proves the shared visual-exercise system and cartographic QA is available. |
| **P2** | Rigging / mechanical advantage | Parked | — | deterministic diagrams + calculations | Principles may fit; physical knot/rigging execution does not. |
| **P2** | Hazard symbols / placards | Parked | — | official pictograms + recognition | Strong phone fit but lower owner priority than current families. |

## Existing related work

| Issue | Relationship |
| --- | --- |
| #129 — Beaufort visual guide | Existing environment visual-reference implementation; may reuse #146's Learn-media primitive if it fits without widening #146. |
| #131 — WMO cloud genera visual field guide | Active implementation issue after completed #141 research. Hero images and provenance are done; app integration follows #146. |
| #132 — SCUBA equipment visual reference set | Existing visual-reference production work; useful for asset QA patterns but outside this expansion batch. |
| #138 — Maritime research | Completed research authority for #147/#148. |
| #139 — Radio communications/audio research | Completed research authority for #150/#151. |
| #140 — Compass/bearings + topo research | Completed research authority for #149; topo deferred. |
| #141 — Cloud/weather research | Completed research authority for #131; fronts/maps deferred. |
| #104 — practical skills / library expansion research | Historical research umbrella; superseded as priority authority by this roadmap. |

## Coherent capability families

### Maritime

The first programme is locked as:

1. minimum vessel orientation/terminology as **Learn-only prerequisite**;
2. 16 scored navigation-light items covering aspect logic and selected status signatures;
3. 5 scored day-shape recognition items;
4. 12 scored International Code of Signals safety/action flags;
5. advanced light/shape cases and the full signal code deferred until the first programme proves useful.

The target competence is **decoding standardized vessel information**, not recreational-boating certification, collision-avoidance competence or navigation qualification.

### Communications

Current shipped adjacency includes NATO phonetics, radiotelephony numbers and Morse.

The next programme is explicitly Canadian and service-scoped:

1. reconcile the existing phonetic/number foundations without changing their scored claims;
2. Canadian general radio procedure from ISED RIC-22;
3. Canadian marine VHF routine and priority communication from CCG RAMN 2026;
4. clean prerecorded listening/copy as a separate evidence dimension.

Aeronautical and amateur procedure remain separate future programmes. Military/tactical communications remain out of scope.

### Navigation

The existing eight-point bearings topic remains prerequisite. #149 adds whole-circle bearings, reciprocals, true/magnetic/grid references, supplied declination/convergence relationships and combined deterministic exercises.

Topographic-map literacy is a valid later domain but intentionally deferred. Do not add live GIS, GPS or sensor dependencies to the first programme.

### Environment

Clouds proceed as a real-image-first WMO genus field guide. Natural variation is part of the lesson, so source-controlled photography is preferred over generated imagery.

The first cloud release is Learn/reference only. Scored photo recognition requires the later dataset and held-out-image gate defined by #141. Weather associations remain narrower than forecasting. Fronts/weather-map literacy is a separate future topic.

Beaufort remains a useful shipped environmental reference and should not be duplicated inside cloud work.

## Admission gate for a proposed topic

Before a build issue exists, the research must show that the proposed completion claim is:

1. **Finite** — the scored boundary can be enumerated or generated from a bounded rule set.
2. **Stable** — answers are durable or tied to a named/versioned authority.
3. **Objective** — Argus can determine correctness honestly.
4. **Useful** — recall/recognition without reopening a reference has a plausible real use.
5. **Phone-teachable** — the medium available in Argus can materially teach the claim.
6. **Phone-assessable** — success in the app provides evidence for the stated completion claim.
7. **Sourceable** — authoritative sources exist for the factual boundary.
8. **Retainable** — scope is small enough to keep in long-term memory without turning every domain into another Morse-sized bespoke programme.

A candidate failing any hard gate is revised, reduced to a narrower claim, or deferred.

## Media doctrine

Prefer the simplest medium that carries the information accurately:

1. **HTML/text/data** for definitions, rules, tables, explanations and accessible labels.
2. **Deterministic SVG/React** for geometry, bearings, lights, diagrams, transformations and anything where precision matters.
3. **Sourced real imagery** when natural visual variation is itself the lesson, especially clouds and real-world identification.
4. **AI-generated still imagery** only when sourced/redrawn assets are impractical and the result can be independently QA'd against authoritative references.
5. **Generated audio** when listening is part of the competence; keep authoritative transcripts/scripts and QA every asset.
6. **Video** only when motion uniquely carries the lesson and simpler media cannot.

Do not bake essential labels or explanations into image assets.

## Issue lifecycle

1. Candidate appears here with priority/state.
2. One scoped research issue owns the evidence and specification.
3. Research follows `LIBRARY_RESEARCH_METHOD.md` and writes one durable note under `docs/open/`.
4. Owner/research decision is **build / revise / defer**.
5. Only then open bounded implementation issues. Prefer reusable capability issues when several approved topics genuinely need the same primitive.
6. Implementation issues keep lightweight status notes under `docs/open/`.
7. On completion, move completed issue notes to `docs/closed/` and update this roadmap in the same PR or immediate follow-up.

Do not use one perpetual umbrella issue for successive generations of library work.

## Current execution order

### Start now

1. **#146 — shared visual Learn + objective visual-choice primitives.** This is the critical dependency for #147, #148 and #149, and for #131's app integration.
2. **#150 — Canadian radio procedure / marine VHF text programme.** Independent of #146 and safe to run in parallel.
3. **#131 — cloud asset sourcing and QA.** Can run in parallel with #146 because real-image acquisition/provenance does not depend on the final Learn renderer.

### After #146

4. **#147 — Maritime I: orientation, navigation lights and day shapes.**
5. **#148 — Maritime II: selected signal flags.**
6. **#149 — Compass & Bearings.**
7. Integrate **#131** cloud assets/copy into the shared visual Learn primitive.
8. Reconcile **#129** Beaufort with #146 only where the generic Learn-media primitive cleanly replaces bespoke work.

### Radio follow-on

9. **#151 — prerecorded speech drills.** Architecture may be explored alongside #150, but production scripts/audio must follow the landed #150 authority and wording.

### Later

- Topographic map literacy after #149 proves the shared visual exercise path and a cartographic QA approach is available.
- Fronts/weather-map literacy as a separate future research/build topic.
- Rigging and hazard placards remain parked P2 candidates.