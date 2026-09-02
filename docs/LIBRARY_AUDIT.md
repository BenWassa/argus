# Argus library audit

Issue: #8  
Audit baseline: `7498c55494d5b75fdb99c3316b461a2a5e6eef01`

## Scope

This audit covers every topic shipped in `src/lib/seed.ts` at the baseline above. Argus stores user-authored topics locally, so an on-device library may contain additional topics that are not visible in GitHub. Extend this document when a current exported library is available rather than assuming the seed is the complete personal library.

## Audit rubric

For each topic, check:

1. content archetype;
2. finite testable boundary;
3. whether the current Test items actually cover that boundary;
4. appropriate Learn treatment;
5. conceptual/context gaps;
6. whether integrated case studies are useful;
7. provenance requirements;
8. safety/limitations requirements;
9. whether explanatory support can stay outside the scored boundary;
10. recommended action.

## Summary matrix

| Topic | Archetype | Current boundary coverage | Learn treatment | Case study | Provisional action |
| --- | --- | --- | --- | --- | --- |
| NATO phonetic alphabet | Mapping/reference | Strong | Compact reference | No | Keep deck; verify source/spelling |
| OODA loop | Framework/model | **Insufficient** | Structured briefing | **Yes** | Major enrichment + deck rewrite |
| Primary survey | Procedure/protocol | Minimal / boundary decision required | Structured concise briefing | Likely, bounded | Research, enrich, review scope |
| Cardinal/intercardinal bearings | Mapping/reference | Strong | Compact reference | No | Keep deck; verify conventions |

## NATO phonetic alphabet

### Current boundary

“The 26 letters A to Z and their code words. Nothing else.”

The deck contains one mapping for every letter and therefore matches the declared finite boundary well.

### Learn requirement

**Compact reference only.** The mapping is the content. A long explanation would increase friction without adding much understanding.

Useful supporting material, if retained at all, should be small: authoritative source attribution and any genuinely relevant terminology/spelling note.

### Case-study need

None.

### Recommended action

- Keep the 26-card mapping deck.
- Preserve letter-first testing.
- Verify official code-word spelling/provenance during #11.
- Do not add long-form prose merely because the richer Learn schema exists.

## OODA loop

### Current boundary

“The four stages in order, and what each one does.”

### Coverage finding

**The current Test deck does not satisfy the topic’s own scope.** It asks only:

- Stage 1 → Observe
- Stage 2 → Orient
- Stage 3 → Decide
- Stage 4 → Act

Nothing tests what each stage does, even though that is explicitly part of the stated boundary.

### Learn requirement

**Structured briefing required.** Stage-name memorisation alone does not explain the framework as a model. Learn should explain the system at topic level, including relationships, iteration/feedback, and important limitations or common oversimplifications where supported by research.

### Case-study need

**Yes.** The preferred teaching device is an integrated case that can be traced and analysed through the framework as a whole. Avoid four disconnected “example for Observe / example for Orient / …” snippets as the primary explanation.

### Boundary discipline

Explanatory material may be richer than the scored deck. The scored boundary should remain finite and explicit; if the intended test scope includes stage functions, the deck must gain finite prompts that cover those functions completely.

### Recommended action

- Research the framework from authoritative/primary-quality material.
- Rewrite the deck so it actually covers the declared boundary.
- Add structured explanation and at least one integrated case study.
- Re-check whether the existing scope is the right finite boundary after research.

## Primary survey

### Current boundary

“The five ABCDE steps in assessment order.”

### Coverage finding

The deck expands A/B/C/D/E to Airway/Breathing/Circulation/Disability/Exposure. That technically covers the labels and order only at a very shallow level. It does not provide context for why the sequence exists or what the stages mean as a procedure.

A product decision is required: is the intended scored boundary deliberately only the five labels/order, or should a finite set of additional recall material be included? The answer should come from authoritative research, not from adding detail opportunistically.

### Learn requirement

**Structured, concise briefing required.** The user should understand the purpose and sequence rather than merely memorise an acronym expansion.

### Case-study need

Likely useful if it demonstrates the sequence as one integrated process. It must remain explicitly educational/memory-oriented and must not imply that reading Argus constitutes clinical competence or training.

### Provenance and safety

Mandatory. This is medical/emergency material. Enrichment requires authoritative sourcing and a visible limitations statement consistent with Argus’s product boundary: memory/rehearsal support, not a credential or substitute for training.

### Recommended action

- Research current authoritative sources appropriate to the chosen scope.
- Decide and document the finite scored boundary before expanding cards.
- Add concise structured explanation.
- Add an integrated case only if it improves understanding without turning Argus into procedural instruction beyond its memory-tool role.

## Cardinal and intercardinal bearings

### Current boundary

“The eight compass points and their degree values.”

### Coverage finding

The eight direction-to-degree mappings cover the stated boundary directly and completely.

### Learn requirement

**Compact reference only.** A table or similarly dense reference representation is sufficient. At most, add a concise convention note if research shows it materially prevents confusion.

### Case-study need

None for the current boundary.

### Recommended action

- Keep the eight-card mapping deck.
- Verify terminology and degree conventions.
- Prefer a compact reference treatment over prose.

## Cross-library findings

### 1. One Learn template is not enough

The current Learn surface treats all topics as scope + prompt/answer rows. The seed itself proves this is too uniform: NATO benefits from that compact treatment, while OODA clearly does not.

### 2. Richer Learn content must remain optional

Adding a structured briefing capability should not make every topic longer. Content architecture should support reference-only, concise-support and briefing-required topics.

### 3. Scope and deck need an explicit integrity check

OODA demonstrates that a topic can state a broader finite boundary than its deck actually tests. Future authoring/editorial review should check scope-to-deck coverage directly.

### 4. Testable boundary and explanatory support are different

Case studies, context, provenance and limitations can improve understanding without automatically becoming scored items. Argus should model that distinction explicitly so finishability remains honest.

### 5. Safety-sensitive topics need stronger provenance rules

Primary Survey shows that the richer content model needs first-class source/limitations support rather than relying on generic prose or README disclaimers.

## Next actions

- #9 defines and implements the optional structured Learn-content layer.
- #10 removes Practice and makes Test the single recall interaction while protecting retention semantics.
- #11 researches and rewrites the seed topics against this audit.
