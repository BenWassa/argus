# Issue #149 — Compass & Bearings implementation

**Status:** implementation ready after #146  
**Issue:** #149  
**Depends on:** #146  
**Research authority:** `docs/open/ISSUE_140_COMPASS_BEARINGS_TOPO.md`

## Locked direction

Keep the existing eight-point bearings topic as prerequisite. Implement the four researched follow-on topics for:

1. whole-circle bearing diagrams;
2. reciprocal/back bearings;
3. true, magnetic and grid north plus supplied declination/convergence relationships;
4. combined deterministic diagram/calculation exercises.

Use the exact scored banks, completion claims, signed conventions and examples from the #140 research note.

## Technical rules

- deterministic SVG/React only;
- answer keys derive from tested calculation/figure specs;
- magnetic declination remains east-positive as defined by the research authority;
- no live sensor/GPS/GIS/declination lookup;
- do not add topographic-map work here.

## Handoff status

Blocked on #146's objective visual-choice/figure contract. Once available, #149 is a self-contained implementation lane.