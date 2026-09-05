# Argus programme — Learn/Test simplification and content quality

Parent issue: #7  
Programme start baseline: `7498c55494d5b75fdb99c3316b461a2a5e6eef01`  
Original content-rewrite baseline: `c1cc753eb89c9aa5379d1a885892703cf20e65ba`

## Status

The Learn/Test + content-quality product work is implemented. This document is a
programme closeout/ledger, not the authority for the newer Morse architecture.
Morse-specific work is tracked under #21 and `docs/MORSE_PROGRAMME_PLAN.md`.

The current durable library boundary is **v5**, introduced later by Morse
workstream #24. The original #7 programme produced v4 structured Learn content;
v5 preserves that model and adds stable item identity, typed directionality and
per-item cue/evidence state.

## Implemented product model

Argus has exactly two user-facing learning interactions:

- **Learn** — ungraded reading/exposure. Reading may move an unstarted topic into
  learning, but it records no score and cannot satisfy delayed-retention evidence.
- **Test** — the single scored recall interaction. The scheduler determines what
  a result is allowed to prove.

Practice is not an active product/runtime mode. Legacy practice-named data exists
only where required as a migration input.

An early Test may create useful evidence, but it cannot counterfeit a delayed
retention milestone, bypass a required gap, or silently postpone a required spot
check.

## Content model

A topic has two structurally separate layers.

### Finite Test boundary

`scope` states the completion claim and `items` contain the complete scored
material. Together they define the finite boundary Test/completion is allowed to
use.

### Optional Learn support

`topic.learn` is explanatory support only. It may add context, relationships,
provenance, limitations or an integrated case study, but it does not become
scored material merely because it is shown in Learn.

Three editorial treatments remain supported:

1. **Reference-only** — no structured Learn support.
2. **Concise support** — small amounts of context/provenance/limitations.
3. **Briefing required** — structured sections, definitions, lists/tables and
   integrated cases where useful.

The model is typed data rather than arbitrary HTML or a bespoke CMS.

## Original programme workstreams

- #8 — **complete**: audited the shipped library and established content
  archetypes/boundary discipline.
- #10 — **complete** via PR #14: removed Practice and protected early-Test
  scheduler semantics.
- #9 — **complete** via PR #18: added optional typed structured Learn content,
  v4 migration/portability and responsive rendering.
- #11 — **complete** via PR #19: researched and rewrote the four original seed
  topics against the v4 model.
- #15 — **complete** via PR #17: hardened Test-card styling/typography.
- #12 — housekeeping/documentation reconciliation lane. Phase A was recorded in
  PR #16. Its old PR #20 was later superseded because it described a v4 snapshot
  after v5/Morse had already landed; current-main reconciliation now lives in the
  pre-#28 Morse docs lane instead of merging that stale snapshot.

## Shipped content after the original programme

The original research/rewrite covered:

| Topic | Finite Test boundary | Learn treatment |
|---|---|---|
| NATO phonetic alphabet | 26 letters A–Z → official NATO code word | Concise support |
| OODA loop | Four stages in order + one core function for each | Briefing + integrated case |
| Primary survey | Five ABCDE headings in order only | Briefing + bounded case + safety limits |
| Cardinal/intercardinal bearings | Eight compass points → clockwise degree values from north | Concise support |

The current seed additionally includes the International Morse topic, seeded as a
temporary forward-only control by #23 and absorbed in place into its final
bidirectional form by #28:

| Topic | Finite Test boundary | Learn treatment |
|---|---|---|
| International Morse — Letters (printed) | 26 printed A–Z mappings recalled in **both** printed directions | Concise support + progressive Morse packets |

Only one Morse completion claim ships. It covers printed recall in both
directions and nothing else; auditory reception, sending, WPM, words and phrases
remain outside it, under #29.

Detailed source decisions for the original four topics remain in
`docs/SEEDED_CONTENT_PROVENANCE.md`. Morse provenance and programme decisions are
recorded separately in the Morse docs.

## Editorial standard

- Keep every scored boundary explicit and finishable.
- Use short, information-dense Learn sections rather than essay padding.
- Prefer tables/lists where they communicate more efficiently.
- Use cases to exercise a framework/procedure as a whole rather than one toy
  example per term.
- Keep factual explanation, cases, sources and limitations distinct.
- Keep mapping/reference topics compact when richer prose adds little value.
- Safety-sensitive content requires authoritative provenance and visible
  limitations; Argus is a memory/rehearsal tool, not a credential.

## Non-negotiable invariants

- Every topic stays finishable.
- The scored boundary is explicit, finite and completely covered by Test items.
- Completion requires appropriate delayed evidence and remains permanent once
  earned; later decay is routing information.
- Learn never masquerades as a hidden-answer Test card.
- Rich Learn content remains optional.
- Export/import and supported migrations preserve durable state.
- New acquisition systems such as Morse cue fading remain separate from the
  retention scheduler unless the product contract is deliberately changed in
  its own workstream.

## Repository-documentation rule

`PRODUCT.md` is the current implemented product contract. `argus-prd.md` remains
the original July 2026 vision document. Later programme/architecture documents
govern where that early PRD describes superseded runtime details.
