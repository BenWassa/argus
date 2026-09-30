# Issue #146 — Visual content primitives

**Status:** implementation ready  
**Issue:** #146  
**Priority:** shared dependency  
**Research inputs:** #138, #140, #141

## Purpose

Add the smallest reusable Argus primitives needed for phone-first visual learning without creating a second curriculum system.

## Owned capability

1. A Learn visual/media block for local images or constrained deterministic visuals with accessible HTML support.
2. An objectively graded finite choice item that can carry a visual/diagram stimulus and an optional serializable figure specification.

## Dependents

- #147 Maritime I — navigation lights/day shapes
- #148 Maritime II — signal flags
- #149 Compass & Bearings
- #131 WMO cloud visual guide
- potentially #129 Beaufort visual guide where the same Learn media primitive fits cleanly

## Guardrails

- existing Topic/evidence/export/import/sync architecture remains authoritative;
- no arbitrary executable renderer data or generic drawing language;
- visual figures are deterministic and inspectable;
- essential text stays in HTML;
- accessibility and offline behavior are first-class;
- do not implement domain curricula here.

## Handoff

Read #146 plus the completed research notes for #138/#140/#141 before coding. Record implementation decisions here as they are made, especially the final serialized item/media shapes and supported figure registry.