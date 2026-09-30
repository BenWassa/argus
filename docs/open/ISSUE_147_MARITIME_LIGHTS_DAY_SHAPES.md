# Issue #147 — Maritime I: lights, aspect and day shapes

**Status:** implementation ready after #146  
**Issue:** #147  
**Depends on:** #146  
**Research authority:** `docs/open/ISSUE_138_MARITIME_VISUAL_LITERACY.md`

## Locked boundary

- Learn-only vessel-orientation prerequisite;
- 16 scored navigation-light/aspect items;
- 5 scored day-shape items;
- deterministic SVG/React diagrams;
- no collision-avoidance or boating-qualification claim.

The exact item inventory, legal exceptions, source hierarchy and completion wording remain in the #138 research note and should not be re-derived during implementation.

## Implementation rules

- derive rendered light visibility and answer keys from one tested geometry model;
- test source sector cut-offs even though scored observer positions avoid ambiguous boundaries;
- keep optional/size/jurisdiction exceptions in Learn/limitations rather than silently widening Test;
- no AI-generated technical imagery;
- preserve catalog/evidence/migration behavior.

## Handoff status

Blocked only on the final #146 visual-choice/figure contract. Once that lands, this issue can proceed independently of signal flags (#148).