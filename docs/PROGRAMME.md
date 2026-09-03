# Argus programme — Learn/Test simplification and content quality

Parent issue: #7  
Programme start baseline: `7498c55494d5b75fdb99c3316b461a2a5e6eef01`  
Final-reconciliation baseline: `c1cc753eb89c9aa5379d1a885892703cf20e65ba`

## Implemented product model

Argus has exactly two user-facing learning interactions:

- **Learn** — ungraded reading/exposure. Reading may move an unstarted topic into learning, but it records no score and cannot satisfy retention evidence.
- **Test** — the single scored flashcard/recall interaction. Every finite item is tested once in a session and self-scored.

Practice was removed as an active product/runtime mode under #10. Historical v2 practice-named storage fields remain migration inputs only.

The scheduler determines what a Test result is allowed to prove. An early Test may create useful score/history evidence, but it cannot counterfeit a delayed-retention milestone, bypass a required gap, or silently postpone a required spot check.

## Content model

A topic has two structurally separate layers.

### Finite Test boundary

`scope` states the completion claim and `items` contain the complete scored material. Together they define the finite boundary that Test and completion semantics are allowed to use.

### Optional Learn support

`topic.learn` is explanatory support only. It may make the finite boundary understandable, add relationships/context, provenance, limitations, or an integrated case study, but it never silently expands the Test/completion claim.

Library format v4 supports three editorial treatments:

1. **Reference-only** — no structured Learn support.
2. **Concise support** — limited context, provenance, or limitations.
3. **Briefing required** — structured sections, definitions, lists/tables and integrated cases where useful.

The model is simple typed data rather than arbitrary HTML or a bespoke CMS. v2/v3 libraries migrate safely to v4, and export/import round-trips structured Learn data. Existing finite-boundary editing preserves Learn content it does not edit.

## Editorial standard

- Keep every scored boundary explicit and finishable.
- Use short, information-dense Learn sections rather than essay padding.
- Prefer tables/lists where they communicate more efficiently.
- Use case studies to exercise a framework/procedure as a whole, not one disconnected toy example per stage.
- Keep factual explanation, cases, sources and limitations distinct.
- Keep mapping/reference topics compact when richer prose adds little value.
- Safety-sensitive content requires authoritative provenance and visible limitations; Argus is a memory/rehearsal tool, not a credential.

## Shipped library after #11

| Topic | Finite Test boundary | Learn treatment |
| --- | --- | --- |
| NATO phonetic alphabet | 26 letters A–Z → official NATO code word | Concise support |
| OODA loop | Four ordered stages + one core function for each | Briefing + integrated case |
| Primary survey | Five ABCDE headings in order only | Briefing + bounded integrated case + explicit safety limits |
| Cardinal/intercardinal bearings | Eight compass points → clockwise degree value from north, using north = 0° | Concise support |

Research decisions and authoritative sources are recorded in `docs/SEEDED_CONTENT_PROVENANCE.md`.

## Programme workstreams

- #8 — **complete**: audited the shipped library and established content archetypes/boundary discipline.
- #10 — **complete** via PR #14: removed Practice and implemented Learn + Test with protected early-Test scheduler semantics.
- #9 — **complete** via PR #18: added optional typed structured Learn content, v4 migration/portability and rendering.
- #11 — **complete** via PR #19: researched and rewrote all four shipped seed topics against the v4 model.
- #15 — **complete** via PR #17: fixed Test-card hover isolation and length-aware typography with regression coverage.
- #12 — final reconciliation/housekeeping workstream. Phase A resolved the unique Claude splash commit; final durable-doc reconciliation follows #11.

## Non-negotiable invariants

- Every topic stays finishable.
- The scored boundary is explicit and finite.
- Completion requires appropriate delayed evidence and remains permanent once earned.
- Learn never masquerades as a hidden-answer Test card.
- Test stays fast on mobile: reveal, self-score, next.
- Rich Learn content is optional.
- Export/import remains first-class and migration-safe.
- Safety-sensitive content retains provenance and limitations.

## Repository hygiene

Housekeeping Phase A reviewed `claude/splash-screen-redesign-zr425a` commit `98726197ae30da403ac43c2b9cd99cbe17d0fc76`. Its splash/navigation/dark-chrome/legacy-cleanup work was superseded; its still-valid Test-card concern was extracted to and completed under #15.

The branch refs already recorded on #12 are deletion-ready and must not be re-audited or revived. Branch deletion remains mechanical hygiene where the authenticated execution environment lacks a delete-ref operation; that limitation does not justify product changes.

## Closeout

After #12's documentation PR is green and merged, verify merged-main validation and Pages deployment, record any residual mechanical branch-deletion debt on #12, then close #12. #7 can close once that ledger is current and `main` remains green/deployable.
