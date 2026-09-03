# Argus: Product Requirements Document

**Working name:** Argus  
**Owner:** Ben  
**Original vision:** 29 July 2026  
**Reconciled:** 3 September 2026

## 1. Vision

Argus is a personal, mobile-first library of finite, closed-scope competencies. Every topic must answer one question before it belongs: **can this be finished?**

The product optimizes for durable recall rather than time spent. Completion requires appropriate delayed evidence, remains a permanent historical achievement once earned, and may later coexist with a decayed/currently-due state.

Argus is not a habit tracker, course marketplace, general-knowledge quiz, gamified streak engine, or credentialing system.

## 2. Product model

Argus has exactly two user-facing learning interactions.

### Learn

Ungraded reading/exposure. Learn always exposes the topic's complete finite prompt/answer reference with answers visible. It may also render optional structured explanatory support above that reference.

Reading may move an `unstarted` topic into `learning`; it does not create a score or satisfy delayed-retention evidence.

### Test

The single scored recall interaction. Test presents every scored item once, supports reveal/self-score/next, and records session history.

The scheduler, not a separate recall mode, decides what a Test result proves. An early Test can record useful evidence but cannot counterfeit a delayed-retention milestone, bypass a required gap, or silently postpone a required spot check.

**Practice is not an active product/runtime mode.** Legacy v2 practice-named fields exist only as migration inputs.

## 3. Content contract

### Topic

A topic is one closed-scope competency. Current runtime data includes identity/title/track, an explicit `scope`, a finite `items` array, status/scheduler/history fields, and optional structured `learn` support.

### Finite scored boundary

`scope` states the completion claim. `items` contain all material that Test is allowed to score. Together they define the finite Test/completion boundary.

A topic must not claim completion for material that its scored items do not cover completely.

### Optional Learn support

`topic.learn` is structurally separate explanatory data. It can explain relationships, provide provenance, state limitations, or analyse an integrated case without becoming Test material.

Three editorial treatments are supported:

1. **Reference-only** — no `topic.learn`; the finite reference is sufficient.
2. **Concise support** — small amounts of context/provenance/limitations.
3. **Briefing required** — structured sections, definitions, lists/tables, sources/limitations, and integrated cases where useful.

The format is simple typed data, not arbitrary HTML or a bespoke CMS. Whole-framework/procedure cases are preferred over one isolated toy example per stage.

### Safety-sensitive material

Argus supports memory and rehearsal only. It does not certify medical, emergency, physical, tactical, or other hazardous competence. Safety-sensitive Learn content must use authoritative provenance and visible limitations appropriate to the subject. Detailed instruction that would make the finite completion claim misleading stays outside Test.

## 4. Current shipped library

| Topic | Finite Test boundary | Learn treatment |
| --- | --- | --- |
| NATO phonetic alphabet | 26 letters A–Z → official NATO code word | Concise support |
| OODA loop | Four stages in order + one core function for each | Briefing + integrated case |
| Primary survey | Five ABCDE headings in order only | Briefing + bounded integrated case + explicit safety limits |
| Cardinal/intercardinal bearings | Eight cardinal/intercardinal points → degree values clockwise from north, north = 0° | Concise support |

Detailed research/provenance is maintained in `docs/SEEDED_CONTENT_PROVENANCE.md`.

## 5. Scheduler and lifecycle requirements

The scheduler's retention semantics are authoritative.

- A first successful Test can establish learning evidence.
- Completion requires qualifying delayed evidence after the required gap.
- Testing early must not reset/postpone the qualifying clock merely because the user chose to test.
- Required spot checks remain due according to scheduler policy; an early Test cannot silently defer them.
- Completion history is durable. Later decay routes future work without erasing that completion once occurred.

Exact timing/state transitions live in the scheduler implementation and tests; this PRD defines the product invariants rather than duplicating constants.

## 6. Functional requirements

### Today / due work

- Make the currently required Test action obvious.
- Keep the primary mobile session short and task-first.
- Do not use streaks, XP, shame, or decorative gamification to drive return behaviour.

### Library

- Browse/filter finite topics.
- View each topic's scope, finite item count/status/history and available Learn/Test actions.
- Create/edit the finite title/scope/items fields.
- Preserve structured Learn support when ordinary finite-boundary editing does not edit that support.

### Learn

- Render reference-only topics compactly.
- Render concise/briefing structured content with semantic headings/lists/definitions/tables.
- Keep sources and limitations visible.
- Keep explanatory content visually distinct from concealed-answer Test cards.
- Remain readable on mobile and at 200% text scaling without page-level horizontal overflow.

### Test

- Present the finite scored item set only.
- Reveal answer, self-score, advance.
- Preserve keyboard, touch/gesture and reduced-motion accessibility.
- Scale medium/long prompts and answers to readable sizes without changing scheduler semantics.

### Data

- Local-first/offline-capable library.
- Current storage/export format: v4.
- Safely migrate supported v2/v3 libraries to v4.
- Full JSON export/import must round-trip optional structured Learn content.
- Reset must not allow obsolete legacy storage to resurrect stale data.

## 7. Non-functional requirements

- **Platform:** mobile-first installable PWA.
- **Stack:** React + Vite + strict TypeScript.
- **Accessibility:** WCAG 2.1 AA target; visible focus, keyboard operation, reduced-motion support, semantic Learn structures and appropriate touch targets.
- **Performance:** Test remains a lightweight, direct interaction suitable for short phone sessions.
- **Ownership:** data remains portable through first-class JSON export/import.
- **Deployment:** green validation is required before merge; `main` deploys through GitHub Pages Actions.

## 8. Design principles

1. **Finishability is the entry gate.** No natural edge, no topic.
2. **Retention over exposure.** Reading is useful but does not masquerade as recall evidence.
3. **The form must tell the truth.** Test cards conceal answers; Learn surfaces are readable editorial/reference structures.
4. **Task-first over showcase-first.** Functional screens optimize for the next action rather than marketing hierarchy.
5. **Portable and owner-owned.** Export/import is part of the product contract.
6. **Restraint reads as competence.** No tactical-game chrome, survivalist theatrics, streaks or dashboard sprawl.
7. **Richness is proportional.** Structured briefing support exists where understanding needs it; mapping/reference topics stay compact.

## 9. Explicitly out of scope

- Multi-user/social/leaderboard systems.
- Streaks, badges, XP.
- A pre-built content marketplace.
- Arbitrary HTML/CMS authoring for Learn.
- Treating Learn-only explanation as scored mastery by implication.
- Certification or competence claims for hazardous/physical/medical material.

## 10. Durable references

- `PRODUCT.md` — implemented product contract and design principles.
- `DESIGN.md` / `DESIGN.json` — visual/interaction system.
- `docs/LEARN_CONTENT_MODEL.md` — v4 Learn schema, migration and editorial rules.
- `docs/LIBRARY_AUDIT.md` — shipped-library audit and final outcomes.
- `docs/SEEDED_CONTENT_PROVENANCE.md` — source and finite-boundary record for shipped topics.
- `docs/PROGRAMME.md` — programme execution/closeout ledger.
