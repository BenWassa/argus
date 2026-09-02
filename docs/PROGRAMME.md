# Argus programme — Learn/Test simplification and content quality

Parent issue: #7  
Planning baseline: `7498c55494d5b75fdb99c3316b461a2a5e6eef01`

## Control model

This programme is coordinated from the planning/status chat. Product implementation happens only through focused GitHub issues, branches and pull requests. Planning documentation and repository housekeeping may be maintained from the control chat; application code should not be changed opportunistically outside the selected issue.

## Product direction

Argus should have two user-facing learning interactions:

- **Learn** — ungraded reading/exposure.
- **Test** — the single flashcard/recall interaction.

Practice is to be removed as a separate mode. The scheduler, not a second recall mode, determines what a Test result is allowed to prove.

An early Test may produce useful recall evidence, but it must not counterfeit a delayed-retention milestone, bypass a required gap, or postpone a later required spot check merely because the user chose to test early.

## Content direction

A topic has two layers with different jobs.

### Testable boundary

The finite material the user must be able to recall and that Argus can score completely. Scope and Test items define this boundary.

### Explanatory support

Optional Learn-only material that makes the testable boundary understandable without silently expanding the completion claim.

Depending on the topic, explanatory support may include:

- a concise overview;
- structured explanatory sections;
- definitions and relationships;
- ordered/comparison lists;
- compact reference tables;
- limitations and common confusions;
- provenance/source notes;
- integrated case studies.

The richer layer is optional. Mapping/reference topics should remain compact when added prose would not improve understanding.

## Editorial standard

Rich Learn content should be dense and structured rather than essay-like.

- Use short meaningful sections.
- Prefer tables and lists when they carry information more efficiently than paragraphs.
- Keep terminology concrete and precise.
- Use case studies to exercise a framework or procedure as a whole.
- Do not create one isolated toy example per stage/term merely to fill a template.
- Keep factual explanation, case analysis, sources and limitations distinct.
- Do not repeat facts already obvious from a reference table.

## Programme issues

- #8 — audit the shipped library and define content archetypes.
- #9 — add optional structured Learn briefings and integrated case studies.
- #10 — collapse Practice into Test without weakening retention semantics.
- #11 — research and rewrite seeded topics against the audit.
- #12 — repository housekeeping and documentation reconciliation.

## Recommended execution order

1. **#8 Audit** — lock the content rubric and classify the current library.
2. **#10 Learn/Test simplification** — can proceed independently once its early-Test policy is explicit and tested.
3. **#9 Structured Learn model** — use #8 findings to avoid overbuilding a universal article system.
4. **#11 Topic research/rewrite** — only after the richer data/rendering model exists.
5. **#12 Reconciliation/housekeeping** — continuous branch hygiene, with final durable-doc cleanup after #9 and #10.

#8 and the product-policy part of #10 can run in parallel. #11 should not start before #9.

## Non-negotiable invariants

- Every topic stays finishable.
- The scored boundary is explicit and finite.
- Completion still requires appropriate delayed evidence.
- Completion remains permanent even when later recall decays.
- Learn is never shaped like a hidden-answer card.
- Test remains fast on mobile: reveal, self-score, next.
- Rich content is not mandatory for every topic.
- Export/import remains first-class and migration-safe.
- Safety-sensitive content retains provenance and limitations; Argus is a memory tool, not a credential.

## Repository hygiene

At programme start, `main` is green and there are no open PRs. Historical merged/superseded branches should be deleted under #12. The branch `claude/splash-screen-redesign-zr425a` has one unique unmerged commit and must be reviewed before deletion.

### Housekeeping Phase A — 2026-09-02

The unique splash commit `98726197ae30da403ac43c2b9cd99cbe17d0fc76` was reviewed against post-#10 `main`. Its splash redesign, navigation treatment, dark-chrome suggestion, and legacy splash cleanup are superseded by later merged design/splash work and should not be revived.

One still-valid Test-card concern was extracted to #15: isolate the flashcard from global button hover styling and fit long prompts at an appropriate reading scale. That work belongs to its own implementation issue, not housekeeping.

Phase A deletes the historical merged/superseded branches and the reviewed Claude branch. Final documentation reconciliation remains deferred until #9 lands, as required by #12.
