# Issue #296 — hand-authored lessons: scope and gate

> **Status: active. Wave 1 registered; Vessel Day Shapes registered (2026-11-03).** Extends [the #296 brief](ISSUE_296_LEARNING_REDESIGN.md). Where this document and the brief differ on generated lessons, the owner decision of 2026-10-29 wins: every ordinary topic gets generated lessons by default, and a hand-authored curriculum overrides them where one exists.

## What "authored" means

A generated lesson shows an item and asks it back. That is right for a list (NATO, SI prefixes). It is weak where the learner must *do* something with the item: read a dial, add declination, wrap past 000°, order a procedure. An authored curriculum is a hand-written `Curriculum` (`src/domain/learning/stages.ts`) in `src/domain/learning/authored/<topic>.ts`, registered by topic id in `AUTHORED` (`generatedCurriculum.ts`).

Rules every authored curriculum follows:

- **Teach only what the topic already says.** Lessons restate the scored answers and the topic's own Learn content and sources. No new facts, conventions or sources.
- **Readable stage ids, never `lesson-N`**, so they cannot collide with the generated ones. Stage titles are rows on the path: title case, at most 40 characters.
- **Every scored item is asked** somewhere (`checkCurriculum` enforces it) and each stage ends in a checkpoint.
- **Worked arithmetic is verified by a test** that calls the real bearing functions.
- **A source trace** for each curriculum lives in [ISSUE_296_AUTHORED_LESSONS_TRACE.md](ISSUE_296_AUTHORED_LESSONS_TRACE.md).
- Options are written answer-first by authors; the runner shows a fixed shuffle.
- Lessons write no history and no item evidence.

## The gate

Safety and procedure text requires the independent domain review in the earlier owner decisions, except for the topic-specific owner exception below. So the work splits in two:

| Wave | Topics | Ships when |
|---|---|---|
| **1: checkable, no outside review open** | OODA Loop · Whole-Circle Bearings · Reciprocal Bearings · True & Magnetic North · Grid North & Map Bearings | Merged and registered: the bearing arithmetic is verified by test, OODA restates its own scored text. |
| **2: gated on a review** | Signal Flags · Radio Procedure (drafts in #304) · Marine Calling · Marine Priority Calls (#150) · Navigation Lights · Primary Survey · Firearm Safety | Drafted as data, **not registered** until the matching review is recorded. They keep the generated lessons, which only use already-shipped scored text, until then. |
| **2: Vessel Day Shapes approved** | Vessel Day Shapes (#147/#148) | Authored curriculum registered on 2026-11-03 after the owner accepted a source check in place of a separate maritime reviewer for this topic only. |

The 10 "class B" topics (NATO, Compass Bearings, Cloud Genera, CAF ranks, SCUBA, Radio Numbers, SI Prefixes, Greek Alphabet, Beaufort) keep the generated lessons.

## Existing progress

Generated lessons shipped on 2026-10-30. A topic switching to an authored curriculum changes its stage ids, so lesson ticks from the generated path do not carry over and an in-progress learner starts the authored path from its first stage. Their Test history, evidence and any completion are untouched, and a completed topic still shows every lesson done.

## Vessel Day Shapes acceptance (2026-11-03)

The owner approved registration and accepted a source check instead of a separate maritime reviewer **for Vessel Day Shapes only**. Checked the five shipped answers, figure geometry, Learn “Five arrangements” and existing Collision Regulations citations: Rules 26(b)(i)/26(c)(i), 27(a)(ii)/27(b)(ii), 30(a)/30(d), plus Annex I §6 for black shapes. The source trace records each claim. All other wave 2 topics retain their human review gate.

All four stages had a checkpoint followed by a summary, breaching the final-checkpoint rule. Each summary now precedes its checkpoint. All stage titles are title case and at most 40 characters, stage ids are readable, and all five scored items are asked and included in checkpoints. No scored content or ids changed. Existing progress follows the accepted wave 1 behavior above; no migration is built.

Owner feedback decision (2026-11-03), for every lesson: a first miss shows colour, a visual cue and styled “Try again”, with no explanation. Explanations appear after a second miss, as today. Runner implementation remains separate work.
