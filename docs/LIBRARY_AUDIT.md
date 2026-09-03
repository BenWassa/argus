# Argus library audit

Issue: #8  
Audit baseline: `7498c55494d5b75fdb99c3316b461a2a5e6eef01`  
Implemented-content baseline: `c1cc753eb89c9aa5379d1a885892703cf20e65ba`

## Scope

This audit covers every topic shipped in `src/lib/seed.ts`. Argus stores user-authored topics locally, so an on-device library may contain additional topics not visible in GitHub. The original #8 findings drove #9 and #11; this document now records both the audit decision and the implemented result.

## Content rubric

For each topic, check:

1. content archetype;
2. finite testable boundary;
3. whether Test items completely cover that boundary;
4. appropriate Learn treatment;
5. conceptual/context gaps;
6. whether an integrated case study is useful;
7. provenance requirements;
8. safety/limitations requirements;
9. whether explanatory support remains outside the scored boundary.

`scope` + `items` define the finite scored Test/completion claim. `topic.learn` is structurally separate explanatory support and never expands that claim merely by existing.

## Final shipped-library matrix

| Topic | Archetype | Final finite Test boundary | Coverage | Learn treatment | Case study |
| --- | --- | --- | --- | --- | --- |
| NATO phonetic alphabet | Mapping/reference | 26 letters A–Z → official NATO code word | Complete | Concise support | No |
| OODA loop | Framework/model | Four stages in order + one core function for each | Complete | Briefing | Yes, integrated |
| Primary survey | Procedure/protocol | Five ABCDE headings in order only | Complete | Briefing with safety limits | Yes, bounded/integrated |
| Cardinal/intercardinal bearings | Mapping/reference | Eight compass points → degree values clockwise from north; north = 0° | Complete | Concise support | No |

All four topics preserve their previous scored item counts: 26 / 4 / 5 / 8. Historical attempt totals therefore remain compatible.

## NATO phonetic alphabet

The mapping itself is the finite competency. #11 verified the official 26 NATO code words, including **Alfa** and **Juliett**, against NATO's official reference.

The shipped topic keeps all 26 letter-first scored mappings and adds only concise Learn context/provenance. A briefing or case study would add friction without improving the finite mapping claim.

## OODA loop

The original audit found a scope/deck mismatch: the scope claimed the four stages **and what each one does**, while the old deck tested stage names only.

#11 resolved that mismatch without making the Test boundary open-ended. The four scored items now each require the ordered stage name plus its core function: Observe, Orient, Decide, Act. The item count remains four.

A briefing explains Boyd's feedback-rich model, orientation inputs, decision-as-hypothesis, action-as-test, feedback/feed-forward and the limitations of the familiar simple four-arrow circle. One integrated service-incident case exercises the framework as a connected adaptive process rather than padding each stage with an isolated example.

## Primary survey

#11 made the boundary decision deliberately: Test covers **the five ABCDE headings and their order only** — Airway, Breathing, Circulation, Disability, Exposure. Detailed clinical techniques, thresholds, interventions, medications, population-specific modifications, CPR algorithms and diagnosis are outside the scored claim.

The briefing supplies the context the acronym alone lacks: priority sequence, high-level assessment focus, early escalation, treating immediate threats within training/current protocol, and reassessment. Its integrated deterioration case deliberately omits treatment technique and diagnosis.

Because this is medical/emergency material, authoritative sources and visible limitations are mandatory. The shipped topic states that Argus is memory/rehearsal support, not clinical training, a credential, or a substitute for supervised practice and current local guidance.

## Cardinal and intercardinal bearings

The eight direction-to-degree mappings already formed a complete finite set. #11 verified the clockwise-from-north convention against NOAA material and made the chosen north representation explicit: **0°**. The equivalent 360° direction is Learn-only clarification so the eight-value Test mapping remains unambiguous.

The topic therefore remains compact: eight scored mappings plus concise context/provenance, with no case study.

## Cross-library conclusions

### Learn treatment must remain proportional

The seed validates three treatments: reference-only is available for self-explanatory topics; concise support suits mapping/reference topics needing small context/provenance notes; briefing support suits frameworks/procedures where understanding relationships matters.

### Boundary integrity is a correctness property

A topic may only claim completion for material fully represented by its finite scored items. Rich Learn explanation does not repair an under-covered Test boundary and does not itself become scored material.

### Integrated cases beat template padding

Where application matters, a case should exercise the framework/procedure as a whole. Do not manufacture one disconnected toy example per term merely to fill a schema.

### Safety-sensitive topics require provenance and limitations

Primary Survey demonstrates why sources and limitations are first-class Learn structures rather than generic README disclaimers.

## Implementation outcome

- #9 — complete: typed optional `Topic.learn` model, v4 migration/export/import and responsive rendering.
- #10 — complete: Practice removed as an active mode; Test is the single recall interaction with protected retention semantics.
- #11 — complete: all four seeded topics researched/reconciled against this audit.
- `docs/SEEDED_CONTENT_PROVENANCE.md` is the authoritative record of #11 source selection and detailed boundary decisions.
