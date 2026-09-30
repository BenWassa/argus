# Issue #139 — Radio communications and audio drills

**Status:** research ready  
**Priority:** P0  
**Issue:** #139  
**Roadmap:** `docs/LIBRARY_ROADMAP.md`  
**Method:** `docs/LIBRARY_RESEARCH_METHOD.md`

## Purpose

Define a phone-first radio-communications programme that deepens existing NATO, radiotelephony-number and Morse capability without mixing incompatible service procedures.

## Owned research

- service/source boundary for beginner radio procedure;
- callsigns, call structure, acknowledgements/readbacks and selected procedural words;
- distress/urgency/routine distinctions where appropriate;
- concise message structure;
- generated-audio feasibility for listening/copy drills;
- transcript, QA, accessibility and offline implications.

## Current owner direction

- Radio is a high-interest expansion area.
- Audio is explicitly in scope and may become a major Argus medium.
- Free/local voice generation is attractive if pronunciation and standardized phraseology can be made reliable.
- The app should teach a real communication system, not disconnected jargon.
- Morse remains adjacent but separate.

## Research contract

Use the required note structure in `LIBRARY_RESEARCH_METHOD.md`.

The research must finish with:

1. selected service/jurisdiction boundary;
2. build/revise/defer decision for each proposed topic/drill type;
3. exact completion claims and exclusions;
4. source hierarchy and claim ledger;
5. text-only item inventory;
6. audio progression and drill specification;
7. TTS/voice-generation feasibility and QA method;
8. transcript/accessibility/offline requirements;
9. smallest reusable Argus audio primitive, if justified;
10. bounded implementation issues to open next.

## Key decision points

- marine vs aeronautical vs amateur vs separated source-scoped topics;
- which procedures are genuinely transferable;
- how much audio variability improves learning without corrupting standardized pronunciation;
- whether audio should be generated at build time or runtime;
- what needs deterministic scripting/testing versus human listening QA.

## Non-goals

No tactical/military communications curriculum, operator-certificate claim, or production audio implementation inside this research issue.

## Handoff status

No implementation issue should be opened until the research establishes a service-specific, source-backed first programme and credible audio QA contract.