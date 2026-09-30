# Argus Library Research Method

**Status:** authoritative research standard for new library topics  
**Last reviewed:** 2026-09-30  
**Priority authority:** `docs/LIBRARY_ROADMAP.md`

## Purpose

This method exists to make library research **rigorous without becoming slow or repetitive**.

Every research agent should answer the same questions in the same order so separate domains can be compared directly and implementation agents can work without reconstructing decisions.

The output is not a literature review. It is a **build decision and content specification** backed by enough evidence to defend the scored claim.

## Core rule

Research the **competence Argus can honestly teach and assess**, not the entire subject.

Start from the smallest useful claim, prove it is sourceable and phone-suitable, then expand only where the next layer adds practical value.

## Phase 0 — repository preflight

Before external research:

1. read `docs/LIBRARY_ROADMAP.md`;
2. read the owning GitHub issue and its `docs/open/` note;
3. inspect current shipped topics, Learn primitives and any adjacent implementation;
4. inspect related open/closed issues and PRs for overlap;
5. record what already exists so the research does not re-propose shipped capability.

Do not redesign the product architecture during domain research unless the content genuinely requires a missing primitive.

## Phase 1 — define the candidate claim

Write one provisional sentence:

> **After completing this topic, the learner can ...**

Then state what completion **does not** prove.

A claim must be narrow enough that the phone can provide evidence for it. If the real skill requires supervised physical execution, narrow the app claim to recognition, recall, sequencing, interpretation or calculation.

Examples:

- acceptable: `Can identify selected standardized navigation-light configurations from authored diagrams.`
- too broad: `Can navigate safely at night.`

Do this before collecting large amounts of material.

## Phase 2 — source hierarchy

Use the strongest source that actually owns the claim.

### Tier A — authority

Prefer:

- legislation/regulation and official schedules;
- standards bodies and code owners;
- government departments/agencies;
- canonical international organizations;
- official technical manuals or training standards.

Tier A should define scored facts whenever available.

### Tier B — recognized professional guidance

Use recognized professional/technical bodies for explanation, training interpretation, and implementation detail when Tier A is incomplete or not pedagogical.

### Tier C — academic / expert evidence

Use peer-reviewed research, textbooks, or specialist expert references when needed to establish learning limits, ambiguity, perception, or evidence quality.

### Tier D — secondary discovery only

Blogs, forums, commercial summaries, Reddit, social media and general explainers can reveal terminology or useful questions, but they should not become the factual authority where stronger sources exist.

### Source efficiency rule

Do not collect ten sources to prove one stable fact. Usually:

- one controlling primary source;
- one useful explanatory source;
- one independent cross-check for technically sensitive material

is enough.

Add more only where authorities conflict, the domain is safety-sensitive, or the teaching inference is disputed.

## Phase 3 — build a claim ledger

Maintain a compact table for material that may become scored or materially influence the learner:

| Claim / item family | Source | Version/date | Scored? | Notes / ambiguity |
| --- | --- | --- | --- | --- |

The ledger is the traceability layer between research and implementation.

Rules:

- separate **source fact** from **Argus editorial choice**;
- record jurisdiction/service/version where relevant;
- record conflicts rather than silently choosing one source;
- every scored fact must be traceable to an authority;
- generated media is never a source.

## Phase 4 — apply the admission gate early

Test the candidate against all eight gates from `LIBRARY_ROADMAP.md`:

- finite;
- stable;
- objective;
- useful;
- phone-teachable;
- phone-assessable;
- sourceable;
- retainable.

If a candidate fails, stop and either:

1. narrow the claim;
2. split it into separate topics;
3. convert it to unscored Learn/reference material;
4. defer it.

Do not continue deep research on a candidate that cannot pass the product gate.

## Phase 5 — choose the teaching medium

Choose the simplest medium that carries the knowledge accurately.

### Text / structured HTML

Use for:

- exact mappings;
- definitions;
- procedures;
- tables;
- limitations;
- source-backed explanation.

### Deterministic SVG / React

Prefer for:

- geometry;
- compass/bearings;
- vessel-light arrangements;
- maps/contours generated from known rules;
- mechanical diagrams;
- anything where AI visual approximation would introduce factual error.

### Sourced real images

Prefer when natural appearance/variation is part of the competence:

- clouds;
- equipment identification;
- real-world signs/objects where licensing permits.

For every asset candidate record:

- original source URL;
- creator/owner;
- license/public-domain status;
- attribution requirement;
- factual classification basis;
- crop/edit restrictions if relevant.

The fact that an image is reusable does not prove its label is correct; verify both **license** and **identity**.

### AI-generated stills

Use only when:

- a real/source-controlled asset is unavailable or unsuitable;
- the visual can be independently checked against authoritative criteria;
- small errors will not teach a false rule.

Maintain an explicit QA checklist. Reject plausible-looking but technically wrong art.

### Generated audio

Use where listening is part of the claim.

Every audio asset needs:

- authoritative source script/transcript;
- pronunciation/phraseology authority where standardized;
- generation parameters/model recorded sufficiently for reproducibility where practical;
- human listening QA;
- accessible transcript;
- no factual content that exists only in audio.

### Video

Use only if motion is indispensable. Do not select video merely because it is more dramatic.

## Phase 6 — define the exact content specification

For every recommended topic, provide:

### 1. Completion claim

One sentence.

### 2. Explicit exclusions

What completion does not prove.

### 3. Scored boundary

Enumerate the items or define the bounded generation rule.

Include expected count and direction:

- forward;
- reverse;
- bidirectional;
- recognition;
- calculation;
- sequencing;
- audio copy/recognition.

### 4. Learn-only support

List concepts needed to understand the scored material but not themselves claimed as retained competence.

### 5. Confusion set

Identify the mistakes a competent learner must discriminate between. Avoid toy questions where one answer is obviously absurd.

### 6. Difficulty progression

Where applicable, specify how assistance can fall away:

- clean exemplar → varied exemplar;
- labelled → unlabelled;
- isolated item → contextual item;
- slow/clean audio → normal/noisier audio;
- direct mapping → application/calculation.

Do not invent a custom progression where ordinary Argus recall is sufficient.

## Phase 7 — technical and QA specification

Before recommending implementation, state:

- existing product primitive that can carry the topic;
- smallest missing primitive, if any;
- whether that primitive is reusable by another approved topic;
- asset count and expected storage footprint where media is involved;
- offline implications;
- accessibility requirements;
- deterministic validation opportunities;
- human/domain-expert QA still required.

### Reuse rule

Do not propose a generic platform abstraction for one hypothetical topic.

A new reusable primitive is strongest when at least **two approved topics** need it, or when one topic cannot be implemented honestly without it and the primitive is small.

## Phase 8 — independent verification

Before marking research complete:

1. re-check every scored fact against the claim ledger;
2. independently recompute calculations and generated answer keys;
3. check that visual examples do not contradict the written rule;
4. check that a learner could not pass while lacking the claimed competence because the questions are too obvious;
5. check that completion language does not imply field/professional qualification;
6. check that cited versions/jurisdictions are explicit where needed;
7. verify licensing/provenance for every proposed sourced asset.

For high-risk or technically dense material, require a second review pass by a separate agent or domain-informed reviewer before production.

## Required research-note structure

Every issue research note under `docs/open/` should use this order:

1. **Decision summary** — build / revise / defer and why.
2. **Proposed programme/topics** — priority and sequence.
3. **Completion claims and exclusions.**
4. **Authority/source hierarchy.**
5. **Claim ledger.**
6. **Content specification** — scored boundary, Learn-only support, confusion sets.
7. **Medium/asset plan.**
8. **Product/engineering implications.**
9. **QA and validation plan.**
10. **Risks / unresolved questions.**
11. **Implementation handoff** — bounded follow-up issues to open.

Put detailed background after the decision material, not before it.

## Stop conditions

Stop research and report rather than filling pages when:

- no authoritative source can support the proposed scored claim;
- standards conflict and the issue cannot be resolved by explicit jurisdiction/versioning;
- the phone cannot honestly assess the practical competence;
- the topic requires physical practice that is the majority of the skill;
- the proposed scope is too large to retain and cannot be split coherently;
- implementation would require a large bespoke subsystem for low-value content;
- licensing prevents a credible visual dataset and deterministic/synthetic alternatives are unsuitable.

A **defer** decision is a successful research result.

## Efficiency expectations for agents

- Start with primary sources rather than broad web synthesis.
- Resolve the completion claim before exhaustive content gathering.
- Keep one claim ledger instead of duplicating source discussion throughout the note.
- Use scripts/tests for calculations and repetitive validation rather than hand-checking every generated item.
- Reuse existing Argus primitives and source patterns.
- Do not implement during a research issue.
- Do not open implementation issues until the research ends with a build recommendation.
- Surface meaningful uncertainty; do not spend time polishing prose around unresolved fundamentals.

## Definition of research done

Research is complete when another agent can open the note and implement the approved topic **without having to decide what the topic means, what counts as correct, where the facts came from, what medium to use, or what completion is allowed to claim**.
