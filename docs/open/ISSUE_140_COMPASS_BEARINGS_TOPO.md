# Issue #140 — Compass, bearings, and topographic map literacy

**Status:** research ready  
**Priority:** P0 compass/bearings; P1 topo spike  
**Issue:** #140  
**Roadmap:** `docs/LIBRARY_ROADMAP.md`  
**Method:** `docs/LIBRARY_RESEARCH_METHOD.md`

## Purpose

Define a phone-first navigation programme around compass/bearing interpretation and determine whether topographic-map literacy is worth a larger Argus investment.

## Owned research

### P0 — Compass & bearings

- degree bearings;
- reciprocal/back bearings;
- true, magnetic and grid north at the required level;
- declination concepts/calculations;
- deterministic diagram/interaction treatment.

### P1 — Topographic map spike

- contour-line meaning/interval;
- slope from spacing;
- common terrain forms;
- map scale/distance;
- terrain interpretation and route comparison;
- scope, expertise, content-generation and implementation cost.

## Current owner direction

- Compass/bearing material is strongly approved if accurate.
- Topographic maps are interesting but unfamiliar and potentially large; research must determine difficulty and value before implementation.
- Deterministic diagrams are preferred where precision matters.

## Research contract

Use the required note structure in `LIBRARY_RESEARCH_METHOD.md`.

The research must finish with:

1. build/revise/defer decision for the compass programme;
2. explicit proceed-now/later/reject decision for topographic maps;
3. source hierarchy and claim ledger;
4. exact completion claims and exclusions;
5. calculation/exercise inventory and independent validation method;
6. deterministic SVG/React or map-source plan;
7. accessibility/offline implications;
8. smallest required product primitive;
9. bounded implementation issues to open next.

## Key decision points

- correct Canadian source/convention boundary;
- what can be learned without real compass/GPS fieldwork;
- whether topo exercises should use public map excerpts, synthetic deterministic contours, or both;
- whether authoring/QA burden is proportionate to the learning value.

## Non-goals

No claim of field-navigation competence, no full GIS system, no live sensor requirement, and no implementation inside this research issue.

## Handoff status

Compass implementation waits for a complete content/calculation specification. Topographic-map implementation requires an explicit go decision from this spike.