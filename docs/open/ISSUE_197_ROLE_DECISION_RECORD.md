# #197 — Role names, achievement model and curriculum sequencing: decision record

**Status:** recommended resolutions, 2026-10-08, **awaiting owner ratification**. Nothing here changes `src/domain/roles/definitions.ts`, makes a role earnable, or approves artwork.
**Authority:** once ratified, the decisions below supersede the open questions in parent dossier §9. Until then they are recommendations backed by the [scored-content audit](ISSUE_197_SCORED_CONTENT_AUDIT.md).
**Inputs:** [parent dossier](ISSUE_197_EXPANDED_ROLE_ARCHITECTURE_RESEARCH.md), [evidence and curriculum research](ISSUE_197_EVIDENCE_CURRICULUM_RESEARCH.md), [role UX research](ISSUE_197_ROLE_UX_ARCHITECTURE_RESEARCH.md), [#191](ISSUE_191_ROLE_DESIGNATIONS.md), [#192](ISSUE_192_ROLE_BADGE_ART.md). `docs/LIBRARY_ROADMAP.md` remains the implementation-priority authority.

## 1. Summary

1. Only **two** further roles can be honestly earnable from content that already ships: **Navigator** (5 topics, 60 items) and **Mariner** (7 topics, 69 items). Ship them in that order.
2. **Diver, Responder and Operator keep their locked names but are not earnable.** Each has a single seed deck of 13, 5 and 4 items. Padding them from other domains is rejected.
3. **Four of the five candidate lines should not become roles yet**: Technical Specialist is dropped for now; Field Specialist and Mission Integrator merge into one deferred capstone; the psychology line gets a noun-style working title, **Analyst**.
4. A **minimal award receipt** must exist before a second role ships, so a "permanent" badge survives deletion, import and definition changes.
5. Every role claim uses the verbs the evidence supports. The audit shows application is tested only in Navigation.

## 2. Decisions

### D1 — Names

| Candidate | Recommendation | Reason |
|---|---|---|
| Communicator, Navigator, Mariner, Diver, Responder, Operator | **Unchanged (locked)** | Owner decision, 2026-10-07 |
| Cognitive Specialist | **Analyst** (working title, not locked); public claim "Observation, inference and judgement"; "Human Factors" stays the *curriculum line* name, not a badge title | The locked six are single agent nouns; "Specialist" is a credential-flavoured suffix. "Analyst" fits the evidence content (observation vs inference, bias, situational awareness). Fallback if it reads as an intelligence job: keep "Human Factors" as the badge title. |
| Technical Specialist | **No role.** Keep SI, Greek and Hex as unassigned Library topics | 64 items, all self-scored association recall, no application. Fails the gates in D4 on its own merits. "Technician" and "Technologist" may be protected titles for certified people in some Canadian provinces; verify before any future use. |
| Field Specialist + Mission Integrator | **One deferred capstone**, working title **Integrator**; no art, no UI, no reserved name in the product | The proposed distinction (one field context vs broader coordination) cannot be defended with zero scenario assessment. Two names invite two sets of requirements nobody can score. |

### D2 — Achievement model

- **Learner-visible:** one flat set of roles. No tiers, levels, "advanced" labels or global rank.
- **Internal:** *standard role* (topic-completion evidence) and, later, *capstone* (independently assessed integration). The capstone is architecture option C from the evidence research.
- A count of earned badges may **recommend** a capstone assessment but never **substitutes** for passing it, and never hard-blocks it.
- XP, speed rewards and "Tier 1/2" language remain rejected. No JSOC or Special Forces ranks, patches or qualifications are implied anywhere.

### D3 — Navigator and Mariner requirements (proposed locks)

**Navigator v1** — claim: *"Recalls compass points and converts bearings between north references."* Five topics, two fully open pathways:

| Pathway | Topics |
|---|---|
| Direction & Bearings | Compass Bearings, Whole-Circle Bearings, Reciprocal Bearings |
| North & Maps | True & Magnetic North, Grid North & Map Bearings |

Evidence: 60 items, 87% objective, 44 of them application. The claim deliberately omits wayfinding, position fixing and map reading: nothing shipped scores those. Prerequisite: add a `limitations` list to Compass Bearings (audit finding 7).

**Mariner v1** — claim: *"Recognises vessel lights, shapes and flags, marine weather terms and marine radio call structures."* Seven topics, three fully open pathways:

| Pathway | Topics |
|---|---|
| Vessels & Signals | Navigation Lights & Aspect, Vessel Day Shapes, Signal Flags |
| Sea & Sky | Beaufort Scale, Cloud Genera |
| Marine Radio | Marine Calling, Marine Priority Calls |

Evidence: 69 items, 67% objective, no application items. Signal Flags and both Marine Radio topics are shared with Communicator (25 items); a Communicator holder needs 44 items across four topics for Mariner. Shared topics count fully in both roles; this is intended and visible in the UI as topic counts, not a combined percentage. Aspect questions cover power-driven vessels under 50 m only, so the claim says "recognises", never "applies the collision regulations".

### D4 — Minimum bar for an earnable role

A role becomes earnable only when all six gates hold. These are proposed editorial gates, validated against the three roles above, not a runtime contract.

| Gate | Rule |
|---|---|
| G1 | At least 5 required topics |
| G2 | At least 40 scored items |
| G3 | At least 2 pathways, each with at least 2 topics |
| G4 | At least one objective topic that asks the learner to apply or visually interpret, not only recall |
| G5 | At least 3 topics not shared with any other earnable role |
| G6 | Every required topic has a reviewed `limitations` list and sources; domain review done where the roadmap requires it |

| Role | G1 | G2 | G3 | G4 | G5 | G6 | Result |
|---|---|---|---|---|---|---|---|
| Communicator | 7 | 105 | 3 pathways | Signal Flags | 4 own | NATO lacks limitations | Pass after a Learn-only fix |
| Navigator | 5 | 60 | 2 pathways | 44 apply items | 5 own | Compass Bearings lacks limitations | Pass after a Learn-only fix |
| Mariner | 7 | 69 | 3 pathways | Lights, shapes, flags | 4 own | #147 and #148 domain reviews open | **Pass once #147 and #148 reviews close** |
| Diver | 1 | 13 | no | no | — | — | Fail |
| Responder | 1 | 5 | no | no | — | — | Fail |
| Operator / Analyst | 1 | 4 | no | no | — | — | Fail |
| Technical | 3 | 64 | no | no | — | — | Fail |

Mariner is therefore **blocked on content review, not on engineering**. Navigator has no review dependency.

### D5 — Capstone and advanced evidence

- Prefer a **capstone designation** assessed by civilian-safe vignettes over a count of badges.
- Two scenario tiers, per audit finding 8:
  - **S1 — single-best-answer vignette** on the existing objective-choice item. No new engine; usable by ordinary topics now.
  - **S2 — rubric scenario** with dimensions, floors and critical failures. Needs new runtime and persistence. Required for the capstone only.
- The five-dimension rubric in the evidence research is an experiment for S2, not a contract. Do not build S2 before at least four ordinary roles are earnable.

### D6 — Permanence (build before the second role)

Today `earned` is derived from local topic records, so deleting or importing topics can silently un-earn a badge.

- Add a small **award receipt**: `{ roleId, roleVersion, earnedAt, topicIds }`, written the first time a derivation passes, stored with learner data, and carried through export, import and sync.
- `earned` = a receipt exists **or** the live derivation passes. Retention decay and topic deletion never remove a receipt. Only the existing reset-all-data action does.
- Role definitions are **versioned**. Adding a requirement creates v2 as an optional update; the learner keeps "Earned v1" and sees "2 new topics" for v2. Never un-earn.
- Open check before building: how a new field interacts with the owner-only Firebase sync and its rules (conflicts are detected, not resolved). Verify against `docs/open/ISSUE_93_FIREBASE_PROGRESS_SYNC.md` first.
- This also settles the gap for Communicator, which currently has no receipt.

### D7 — Roles UX

Keep the single Communicator detail view until a second role is earnable. When Navigator ships, add the compact focus selector prototyped in the UX research: current role, direct Continue, other roles one tap away. No gallery of locked or reserved roles; unearnable names (Diver, Responder, Operator, Analyst) do not appear in the product until their gates pass.

### D8 — Artwork order

Art follows earnability. Navigator badge first, Mariner second, each PNG-first then audited SVG under #192. No badge art for Diver, Responder, Operator, Analyst or the capstone before their gates pass.

### D9 — Unassigned topics

Firearm Safety and CAF Rank Equivalencies stay standalone. CAF insignia work stays behind the DND/CAF licence gate (#178, #185).

## 3. Refined curriculum sequencing

Re-ranked by **gates closed per authored topic**, replacing the earlier research-only P0/P1 labels. Roadmap priorities still decide what is built.

| Wave | Work | Closes | Content needed | Gate / review |
|---|---|---|---|---|
| 0a | Learn-only `limitations` for NATO and Compass Bearings; role/manifest drift test | G6 for Communicator and Navigator | None scored | None |
| 0b | Award receipt (D6) | Permanence | None | Sync-rules check |
| 0c | **Navigator** live | — | None | Owner ratifies D3 and artwork |
| 0d | **Mariner** live | — | None | #147 and #148 domain reviews closed |
| 1 | **Analyst**: Observation vs Inference, Bias Control, Situational Awareness I, plus OODA | G1–G4 | 3 new S1-vignette topics of at least 8 items each. With OODA that is 4 topics; G1 needs a fifth (candidate: Threat Recognition I after a safety review, or a new Decision Under Uncertainty topic) | Existing briefs in `docs/open/library-research/` are the sourced input; roadmap entry required first, since #104 is superseded |
| 2 | **Diver**: Dive Hand Signals (VIS, objective), Buddy Briefing, Pressure and Equalisation Basics, Dive Planning Terms | G1–G5 | 4 new topics beside SCUBA Equipment | Independent dive-professional review; non-certifying limits |
| 3 | **Responder**: Scene Safety & Escalation, Help-Request Information, plus Primary Survey; Psychological First Aid is held as thin | G1–G5 | 3–4 new S1 topics | Medical and liability review |
| 4 | Navigator and Mariner v2 extension topics (Coordinate Systems I, Map Scale & Symbols, Marine Buoyage) | Depth | 3 topics | Versioned optional update only (D6); #140 topographic research reused |
| 5 | **Integrator** capstone | — | S2 engine and at least 4 scenarios across 2 contexts | After four earnable ordinary roles |

Wave 1 beats Waves 2 and 3 because the sourced research already exists and the vignette format needs no new engine. Waves 2 and 3 are slower because their review burden is external and liability-sensitive.

Each new topic ships under the existing method in `docs/LIBRARY_RESEARCH_METHOD.md`, with its own scope sentence, `limitations` and objective items first. A new topic is never added to an already-earned role version.

## 4. Ratification checklist (owner)

- [ ] D1 names: keep the six; adopt **Analyst** as the working title; drop Technical Specialist; merge Field and Mission into **Integrator** (deferred)
- [ ] D2 one flat learner-visible set, internal standard vs capstone
- [ ] D3 Navigator and Mariner requirement sets and claim wording
- [ ] D4 the six earnability gates
- [ ] D6 receipt before the second role
- [ ] D8 art order: Navigator, then Mariner

## 5. Decision log

| Date | Decision | Authority / notes |
|---|---|---|
| 2026-10-08 | Scored-content audit of all 24 topics complete; 342 items, 29.5% objective | [Audit](ISSUE_197_SCORED_CONTENT_AUDIT.md) |
| 2026-10-08 | D1–D9 recommended | This record; **not yet ratified** |
