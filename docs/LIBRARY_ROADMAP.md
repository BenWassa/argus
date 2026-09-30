# Argus Library Roadmap

**Status:** authoritative current library-expansion priority index  
**Last reviewed:** 2026-09-30  
**Research method:** `docs/LIBRARY_RESEARCH_METHOD.md`

## Purpose

This file is the single current answer to:

- which Argus library families are being expanded;
- which candidates are priority, exploratory, parked, or shipped;
- which GitHub issue owns the next decision;
- which work is research versus implementation.

Detailed evidence belongs in issue-specific research notes under `docs/open/`. Completed issue notes belong under `docs/closed/`. Historical research can remain available, but it does not override this roadmap.

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

- **P0 — active expansion:** approved for research now; likely implementation if the evidence supports the proposed boundary.
- **P1 — research spike:** worth investigating, but scope/cost/medium fit is not yet proven.
- **P2 — backlog:** plausible Argus material but not worth active research while higher-value families remain open.
- **Shipped:** current catalog/product capability; may still have enhancement issues.

Research approval is not implementation approval. Research must finish with exact completion claims and implementation handoffs before build issues are opened.

## Current programme

| Priority | Family / candidate | Current state | Owner issue | Intended medium | Decision / note |
| --- | --- | --- | --- | --- | --- |
| **P0** | Maritime — vessel orientation & terminology | Research approved | #138 | HTML + diagram/SVG + visual drill | Prerequisite vocabulary should exist only where it supports later visual decoding. |
| **P0** | Maritime — navigation lights & day shapes | Research approved | #138 | deterministic diagram/SVG + visual drill | Strong visual-learning candidate; viewing angle/orientation matters more than memorizing one picture. |
| **P0** | Maritime — International Code of Signals flags | Research approved | #138 | sourced/redrawn flag assets + recall/recognition | Prioritize useful single-letter signals; do not memorize the full system without a use case. |
| **P0** | Communications — radio procedure | Research approved | #139 | HTML + finite recall + structured interaction | Extend existing NATO/radiotelephony knowledge into source-scoped procedures. |
| **P0** | Communications — audio listening/copy drills | Feasibility research approved | #139 | generated audio + transcript + interactive drill | Audio is promising; generated audio is presentation, never factual authority. |
| **P0** | Environment — cloud & weather recognition | Research approved | #141 | sourced imagery first + HTML + visual drill | Ten WMO genera are the likely foundation; weather inference must remain narrower than forecasting. |
| **P0** | Navigation — compass & bearing skills | Research approved | #140 | deterministic SVG/React + calculations | Bearings, reciprocal bearings, north references and declination are the likely core. |
| **P1** | Navigation — topographic map literacy | Research spike | #140 | topo excerpts/synthetic deterministic diagrams + interaction | Scope, authoring difficulty and honest app-assessable competence are not yet known. |
| **P2** | Rigging / mechanical advantage | Parked | — | deterministic diagrams + calculations | Principles may fit; physical knot/rigging execution does not. |
| **P2** | Hazard symbols / placards | Parked | — | official pictograms + recognition | Strong phone fit but lower owner priority than current families. |

## Existing related work

| Issue | Relationship |
| --- | --- |
| #129 — Beaufort visual guide | Existing environment visual-reference work; informs visual asset/layout practices. |
| #131 — WMO cloud genera visual guide | Narrow downstream implementation/design issue. #141 now owns the broader research sequence and must determine whether #131 proceeds unchanged, is revised, or is superseded. |
| #132 — SCUBA equipment visual reference set | Existing visual-reference production work; useful for asset QA patterns but not part of this expansion programme. |
| #104 — practical skills / library expansion research | Historical research umbrella. Superseded as the current priority authority by this roadmap and #138–#141. |

## Coherent capability families

### Maritime

Provisional progression:

1. minimum vessel orientation/terminology;
2. navigation lights and aspect/viewing logic;
3. selected day shapes;
4. selected International Code of Signals flags;
5. consider sound signals only after the visual foundation is scoped.

The target competence is **decoding standardized vessel information**, not recreational-boating certification or navigation qualification.

### Communications

Current shipped adjacency includes NATO phonetics, radiotelephony numbers and Morse. The next programme should determine whether a small source-scoped radio procedure curriculum plus audio listening/copy drills can deepen this into practical communications literacy.

Avoid treating marine, aeronautical, amateur and military phraseology as interchangeable.

### Navigation & environment

Compass/bearings and cloud/weather recognition are active P0 directions. Topographic map literacy is intentionally a P1 spike because the domain may require greater subject expertise, content generation and custom interaction than ordinary Argus topics.

Beaufort remains a useful shipped environmental reference and should not be duplicated inside weather research.

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
5. Only then open bounded implementation issues. Prefer reusable capability issues when several approved topics need the same primitive.
6. On completion, move issue-specific notes to `docs/closed/` and update this roadmap in the same PR or immediate follow-up.

Do not use one perpetual umbrella issue for successive generations of library work.

## Current execution order

The four research lanes can run in parallel because they own distinct domains:

- **#138 Maritime**
- **#139 Radio communications/audio**
- **#140 Compass/bearings + topo spike**
- **#141 Cloud/weather**

After those return, compare them together before opening implementation work. Prefer shared product primitives only where at least two approved topics genuinely need them; do not pre-build a generic media framework from speculation.
