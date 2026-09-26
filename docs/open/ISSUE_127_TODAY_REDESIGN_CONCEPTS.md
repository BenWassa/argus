# Issue #127 — Today redesign concepts

**Status:** concept proposal / owner decision — not implemented, apart from the interim plate layout in §2
**Date:** 2026-09-25
**Issue:** #127
**Relationship:** companion to #126. #126 explores how Today *looks* through owner-reviewed mockups and keeps Today's content and behaviour fixed. This paper is about what Today *holds* and how it *behaves*; its concepts are inputs #126's mockups can dress. Scheduling semantics stay with `PROGRESS_ARCHITECTURE.md`.

## Summary

Today exists to answer one question in one glance: what should I do next? Until this change it answered with a list, a batch button, a second link, a standing note about scoring and a column of counts, under a stencil wordmark. The interim layout (§2) removes the noise but is still a short list.

Six concepts follow. The recommendation (§5) is **A (The One Thing) + D (Ladder strip) + E (The clear day)**, plus a masthead fix, in that order of value.

---

## 1. What is wrong with Today

Observed on the layout this change replaced:

1. **It was a list, not an answer.** Up to five equally weighted rows, then `Test 3 topics · 45 items`, then `Test the other two`, then a paragraph. The learner had to work out "the one thing" from four competing controls.
2. **Quantities everywhere.** Item counts on every row, topic counts in words, sitting counts (`6 retrievals this sitting`), `+2 more due`. `PRODUCT.md` asks each surface to state one sentence about a topic; Today stated three or four.
3. **Unstarted topics counted as due.** On a fresh library every shipped topic surfaced as `Start`, so Today was a second copy of Library.
4. **The masthead contradicts the brand.** `ARGUS` is set in a stencil face (Black Ops One) over a military-format date (`25 SEP 2026`). It is the one place the product uses the military visual language `PRODUCT.md` explicitly refuses, and on a phone it spends the top of a task-first screen on branding.
5. **The nothing-due day is a hedge.** "Recall needs the gap to mean anything, so the schedule is holding", then a list of early-Test rows under a disclaimer. The most common day had the least designed screen.
6. **No sense of the journey.** A row said `Ready for the delayed test` but not where that sits between starting and banking.

## 2. Interim layout (shipped with this issue's first change)

- At most **three plates**, and only for topics already in motion: started, and either due or waiting out a gap. Unstarted topics are Library's to offer; a banked topic resting between spot checks stays in Library until its check is due.
- Each plate is larger than a Library plate: section-size title, a stud in its track metal, one mono line and a **bare gauge** (no label; the reading stays available to screen readers).
- **No quantities** anywhere on the page. No batch button, no `Test the other`, no scoring note.
- The first due plate carries the key shadow; due plates are raised, waiting plates sit flush.
- A due plate starts its work. A waiting plate says `Not due yet` and **opens the topic** rather than starting an early Test, because the topic page is where an early Test's consequence is stated.

It fixes 1–3. It does not fix 4–6, and three plates are still a list.

## 3. Constraints every concept keeps

- **One derivation.** `journeyFor` / `dueEntries` decide what is due and what the action is. No concept adds scheduling logic.
- **One primary action** when work is due, and none when nothing is.
- **No gamification**: no streaks, badges, points, and no single aggregate percentage.
- **Decay is routing, not punishment.** Tarnish stays reserved for `Needs repair`.
- **An early Test's consequence is stated** before it runs.
- **The owner's standing asks:** containers rather than ruled rows, no chevrons, fewer items, and no quantities on Today.
- WCAG 2.1 AA, 44px targets, 200% text without horizontal overflow, and full reduced-motion support.

## 4. Concepts

### A. The One Thing

Today is one large plate, the lead topic, filling roughly the top half of a phone. The plate is the button. Below it, under a quiet `After that` label, at most two compact plates. Nothing else.

```
┌──────────────────────────────────┐
│ ● SCUBA Equipment                │
│                                  │
│   NEEDS REPAIR                   │
│                                  │
│   ▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱   │
│                                  │
│   Repair                         │  ← verb set large, in the plate
└──────────────────────────────────┘
 AFTER THAT
┌──────────────────────────────────┐
│ ● International Morse Code       │
└──────────────────────────────────┘
┌──────────────────────────────────┐
│ ● OODA Loop                      │
└──────────────────────────────────┘
```

- **For:** the literal answer to "what next". It fits a five-minute window, and the key shadow finally sits on one unmistakable object.
- **Against:** less visible choice. A learner who wants the second topic taps once more, and that is the right cost.
- **Effort:** small. The layout changes; the data is `dueEntries()[0]` plus the next two in-motion topics.

### B. Session composer

The learner says how much time they have in words (`Quick`, `Usual`, `Long`), and Today composes one run across in-motion topics to fit, started with one press.

- **For:** matches the real context of spare five-minute windows.
- **Against:** needs new session-assembly logic and a per-item time estimate. It puts a decision before the action, and it breaks "one plate, one topic". Batching across topics also mixes lessons and Tests, which the product keeps apart.
- **Recommendation:** park it. Revisit only if the owner finds themselves wanting it.

### C. The Bench

In-motion topics as tall plates in a horizontal snap-scroll tray, with the lead centred and its neighbours peeking in from the edges.

- **For:** tactile, suits the machined-plate material, and very large targets.
- **Against:** it is a carousel. Items sit off-screen, it is weaker for keyboard and screen-reader users, and it needs a separate desktop layout.
- **Recommendation:** park it, or let #126 try it as a visual variant of A.

### D. Ladder strip (progress without numbers)

A component rather than a layout. Replace the gauge on Today with a stepped, engraved track showing the topic's rungs, with the current rung lit in its track metal and the gap to the next rung filling:

```
  START ── DRILL ── RECALL ── BANKED
    ■━━━━━━━■━━━━━━━▰▰▱▱▱▱▱────□
```

- **For:** progress with no numbers, and never an average. It shows the ladder that actually exists, so it also explains *why* a topic is on Today. Morse acquisition gets its own variant: lesson segments rather than rungs.
- **Against:** the rung vocabulary must match `PROGRESS_ARCHITECTURE.md`, and any change to the scheduler's rungs or gaps changes the component. Keep it driven from `journeyFor`, not from raw status.
- **Effort:** medium. It is one component, reusable on the topic page.

### E. The clear day

Design the nothing-due day as a real screen. One calm statement (`Nothing needs you today.`), then the in-motion topics as dimmed plates with their ladder strips, each opening its topic. No counts, no "come back in N days", no disclaimer.

- **For:** the most common day stops being the least designed one. It closes the session without inventing a reason to stay.
- **Effort:** small once D exists.

### F. Daily brief

Replace the list with one sentence composed from the derivation, with the titles as controls: "Repair **SCUBA Equipment**, then continue **International Morse Code**."

- **For:** the field-manual voice at its calmest; nothing to scan.
- **Against:** sentence generation across every state, weaker scannability, small tap targets inside prose, and harder to localise.
- **Recommendation:** worth one mockup in #126 as the editorial extreme, not as the default.

### Cross-cutting: the masthead

Retire the stencil wordmark and the military-format date on Today. The destination is already named by the navigation; the date adds nothing a learner needs to act on. If a brand mark is wanted, set it small in the sans, and let the lead plate own the top of the screen. The profile control stays top-right.

## 5. Recommendation

**A + D + E**, plus the masthead fix:

1. **Masthead.** Smallest change, removes the one anti-reference in the product.
2. **Ladder strip (D).** One component, and the progress language every other concept needs.
3. **The One Thing (A).** Lead plate with its verb, and `After that` for at most two more.
4. **The clear day (E).** The nothing-due screen built from A's parts.

B and C are parked. F goes to #126 as a mockup direction only.

## 6. Open questions for the owner

1. Should Today ever show a topic that is **not** due? The interim layout does, as `Not due yet`. Concept E keeps them only on the clear day.
2. Is the ARGUS wordmark part of the brand to keep somewhere (for example the sign-in screen), or retired entirely?
3. Is the lead plate's verb (`Repair`, `Continue`, `Test`) welcome inside the plate, or should the plate stay wordless apart from its reason?
4. Batching across topics has left Today. Should a multi-topic Test run exist anywhere else, or is one topic per run the rule now?
5. Scheduler dependency: any change to the scheduler's gaps changes how often "waiting" happens at all. If waiting becomes rare, A matters more (everything started is due), and D's rungs must follow the new ladder.
6. Desktop: should A put the lead plate and `After that` side by side in the wider column, or stay a single stack?

## 7. Acceptance for choosing a direction

- [ ] Owner has picked, combined or rejected the concepts above.
- [ ] #126's mockups show the chosen concept at a realistic phone viewport, with the interim state as the baseline.
- [ ] The empty-library, no-items, nothing-started, clear-day, repair and acquisition states are each drawn.
- [ ] Any change to `DESIGN.md` (ladder strip, masthead, Today plates) is written down before implementation.
- [ ] Implementation is scoped as its own PR from current `main`.
