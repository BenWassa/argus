# Argus learning-experience design decision

> **#97 owner decision — 2026-09-15.** **Browse/reference ≠ enrolled learning.** This decision supersedes §4/§15.1 and every implementation-record statement below that treats opening an ordinary Topic page as exposure. The ordinary Topic body remains freely browsable, but mounting, revisiting or restoring that page writes no `status`, `learningAt`, history, scheduler or evidence state. A fresh ordinary topic instead exposes a deliberate **Start learning** action; that action may perform the existing `unstarted → learning` / learning-gap transition but creates no score or formal evidence. A first Test remains a deliberate check and keeps its existing scheduler/evidence semantics. Existing legitimate `learning`, `drilled`, `completed` or `decayed` state is preserved; there is no backwards migration. Morse and the settled navigation architecture are unchanged.

> **#90/#92 closeout addendum — 2026-09-15.** The proposal/history below is retained, but its implementation-status and unresolved-decision lists are superseded where this block conflicts. Batches **0–5 are shipped**, batch 6’s review/scheduling/listening work was already on starting `main`, and this closeout completes its remaining #90 checkpoint arc. Batch 6’s one additive field is `Topic.morseReview`, validated/portable inside v5 with absence as the legacy-safe default. #90 item 8 is not partial: clean non-qualifying Test work already uses `advancementEligible: false`, recording the run without moving/resetting retention status or clocks. The path’s cumulative formative checkpoints are now **4 / 7 / 10 / 13**, with late-acquired material, one bounded local retry and #88 first-unlock handoff at all four. The already-ratified **Today + Library** information architecture is unchanged; rejected Home/Lessons, badges, First Messages and standalone Progress remain rejected. After the closeout engineering is green, #92 should remain open only for exactly four owner judgments: **(1)** Morse alphabet link vs embedded 26-card reference; **(2)** ordinary-topic exposure semantics; **(3)** targeted-practice surface/naming; **(4)** spacing copy / same-day continuation presentation. #42 remains a separate real-Pixel acceptance track, not another #92 gate. #29 and #79 remain outside this programme.

> **Status — batches 0 to 6 shipped and merged to `main`. All nine §15
> decisions have been made, three of them explicitly by the owner.**
> The paper below was written first, as an independent proposal, and is now the
> authoritative record of Argus's shipped information architecture: `PRODUCT.md`
> and `DESIGN.md` have themselves been updated to match it, and it formally
> supersedes `docs/closed/SCREEN_INVENTORY_REVIEW.md`'s Home/Lessons/badge/milestone
> proposal (see that document's own superseded banner). The implementation record
> at the end says exactly what shipped, what changed during implementation, and
> what was deliberately left. §15.1, §15.3 and §15.5 were the three the owner
> reviewed directly, on 2026-09-15, recorded in
> `docs/open/ARGUS_OVERHAUL_RATIFICATION.md`: §15.3 (Morse reference cards) and
> §15.5 (practice is formative) confirmed as shipped; §15.1 (exposure) changed
> by the #97 decision above — browsing the reference writes nothing, and a
> fresh ordinary topic carries a deliberate `Start learning` action that owns
> the `unstarted → learning` write.
> The other six were taken as this paper's own recommendation and have not had
> a separate owner look. One item remains outstanding: **owner phone review of
> batch 5's `practice` surface**, including the `practice`-not-`repair` naming
> call recorded in the ratification package.
>
> **Original authority note — independent design proposal for #92.**
> This paper is a first-principles frontend/product architecture proposal written
> from fresh `main` at `550e3cf1ec9bbfb9e0ee823d80cbedae29b5b066`. §§1–16 (the
> proposal, before "Implementation record") do not themselves supersede
> `PRODUCT.md`, `DESIGN.md` or `docs/open/PROGRESS_ARCHITECTURE.md` by appearing here;
> they became authoritative only once batches 0–4 actually shipped, as recorded
> below. No state, schema, scheduler or evidence behaviour was changed by the
> proposal itself, and batch 6's migration has still not landed.

Scope reviewed: `PRODUCT.md`, `DESIGN.md`, `README.md`,
`docs/closed/SCREEN_INVENTORY_REVIEW.md`, `docs/open/PROGRESS_ARCHITECTURE.md`,
`docs/closed/PROGRAMME.md`, `docs/open/MORSE_LESSON.md`, `docs/open/MORSE_PROGRAMME_PLAN.md`,
`docs/open/MORSE_CUE_LADDER.md`, `docs/open/MORSE_WORD_CHECKPOINTS.md`,
`docs/open/MORSE_CHARACTER_ORDER.md`, `docs/open/NAVIGATION_HISTORY.md`,
`docs/open/LEARN_CONTENT_MODEL.md`, `docs/closed/LIBRARY_AUDIT.md`; `src/app/App.tsx`,
`src/app/routing/routes.ts`, `src/domain/study/journey.ts`, `src/domain/study/scheduling.ts`,
`src/domain/study/cueLadder.ts`, `src/lib/types.ts`, the Today/Library/Topic/Progress/Data
surfaces, generic Learn, Test `Session`, the Morse programme/lesson/replay/
reference/checkpoint surfaces, `src/styles/global.css` shell and desktop rail,
and the Playwright navigation/Morse/grading specs; issues #21, #29, #42, #90, #92.

---

## 1. The user problem

One user, one phone, five-minute windows. The job on open is a single sentence:

> Open the app, understand what useful learning or review action is next, do it, and leave.

Two secondary jobs exist and are genuinely different in frequency and posture:

| Job | Frequency | Posture |
|---|---|---|
| Do the next scheduled thing | every session | phone, thumb, 2–5 minutes |
| Work a topic deliberately, outside the schedule | occasional | phone or desk |
| Author topics, capture ideas | weekly-ish | desk |
| Read what has been finished | monthly-ish | either |
| Export / import / reset | rarely, or once | desk |

The shipped library is five topics: four ordinary finite-reference topics of 4,
5, 8 and 26 items, and one 13-lesson curriculum with 26 bidirectional scoring
units. The twelve-month target is 40–60 topics. **The overwhelmingly common
object in Argus is a small finite reference deck, and the rare object is a
curriculum.** Any architecture that makes the rare object the template is wrong
at the shape level, no matter how good the curriculum is.

The corollary matters just as much: the product already knows what the learner
should do next. `journeyFor(topic, now)` in `src/domain/study/journey.ts` is a pure
derivation over acquisition, evidence, retention and sitting, and it returns
`action`, `actionLabel`, `primaryLabel`, `statusLabel` and `detail`. Four
surfaces read it and cannot disagree. That work is done and it is good. The
present defect is that **the interface then asks the learner to make the choice
the derivation has already made.**

---

## 2. Current structural problems

Stated as defects, each with its evidence in the shipped code.

**2.1 Navigation is allocated by noun, not by frequency.** Four permanent
thumb-level destinations — Today, Library, Progress, Data
(`src/components/layout/AppShell.tsx`). Two of the four serve jobs performed
monthly or never. Half the primary navigation is spent on under 5% of sessions.

**2.2 Progress is a third projection of one derivation.** `Progress.tsx` calls
`journeysFor(topics)` and groups by `journey.phase`; `Library.tsx` calls
`journeyShelves(journeysFor(filtered))` and already produces `Due now`,
`In progress`, `Completed`, `Needs items`; `Today.tsx` calls `dueEntries` over
the same derivation. Progress owns exactly one thing that exists nowhere else:
the numbered, dated permanent completion record and its per-track totals. That
is one section of a page, not a destination.

**2.3 The mode choice is presented after the product has already decided.**
`TopicPage.tsx` computes `journey.action`, then renders two `mode-btn` controls
and marks one `is-primary`. `Today.tsx` computes a `leadMode` and then also
renders an alternate-group button. The learner is asked to ratify a decision the
system made and displayed. The worst instance is the Morse topic page's second
control, `Test early`, whose own note explains that the run will be recorded
without moving anything — a button whose label argues against pressing it.

**2.4 Topic and ordinary Learn are the same page twice.** `TopicPage` renders
title, scope, status facts, mode choice and — for an ordinary topic — a
`<details>` fold containing every item. The Learn run renders title, scope, item
count, optional `LearnSupport` briefing and every item as an editorial sheet. The
entire justification for route 7 existing is that it adds a briefing and a
`Test me` footer to content route 5 already has.

**2.5 Morse's home is a door labelled with a mode.** `Learn.tsx` branches on
`morseLessonPath(topic)` and renders `MorseProgramme` instead of a reading sheet.
The curriculum path — the thing a learner opening Morse actually wants — is
therefore nested inside a generic `run` route and reachable only by pressing a
button called `Learn`/`Continue lesson`. Opening Morse from Library lands instead
on a facts table plus 26 reference cards.

**2.6 The reference is rendered in three places and needs history surgery to
behave.** `MorseReferenceCards` is embedded in the Morse topic page (#76), is the
body of the standalone `reference` route, and is reachable from inside a lesson.
`App.openReference` contains a bespoke branch that rewrites the run history entry
into a Topic entry and pushes the reference above it, specifically because the
reference's natural parent is not where the learner came from. That code is a
symptom, not a bug.

**2.7 Internal state vocabulary is rendered raw.** The Morse topic page's `<dl>`
shows `Status`, `Schedule`, `Acquisition`, `Current sitting`,
`Both-direction evidence · 4 of 26 unaided`, `Track`, `Items`, `First completed`.
Every one is true and internally necessary. Together they are a debug view of
four progress dimensions the learner was never asked to hold.

**2.8 The Learn → Test seam discards everything Learn proved.** Measured in #90
against the production pure functions: a perfect learner answers ~218 formative
retrievals to reach acquisition readiness, having produced all 26 characters
unaided — and then Test starts every item at the `rich` rung, because
`cueLadder.ts` reads only `itemEvidence`. Reverse printed recall does not appear
until the ninth clean full-deck run. ~452 questions precede the first result that
could even qualify, before the 30-day gap and its second full run. This is the
single largest journey defect in the product and it sits exactly at the seam this
redesign is about.

**2.9 There is no repair.** A missed item restores a cue rung; a decayed topic is
routed back to a full 26-item Test. Lesson replay exists but replays a whole
lesson. Nothing anywhere asks the learner only about what they just got wrong.

**2.10 A 6.5-second full-screen interruption precedes a task-first home**, and
its seen-flag is in `sessionStorage`, so it can replay on a new browsing session.

---

## 3. Recommended top-level information architecture

### Decision: two primary destinations — **Today** and **Library** — plus Data as a labelled utility route reached from Library.

Not Home/Lessons. Reasoning, decision by decision.

**Today, not Home.** `Today` names the job. `Home` names a location and invites
exactly the dashboard creep `PRODUCT.md` lists as an anti-reference. Argus's
Today is not Babbel's Home: Babbel's Home aggregates because Babbel owns a large
catalogue the user browses; Argus opens on a docket of at most a handful of rows
because the schedule has already chosen. Keep the name and keep the behaviour:
verdict headline, docket of due rows where the whole row launches that one topic,
one primary batch action beneath.

**Library, not Lessons.** Four of the five shipped topics have no lessons and
never will. `Lessons` imports course vocabulary into a reference library and
would be wrong for the majority object. `Library` is already the product's own
word in `PRODUCT.md`. The earlier proposal flags its own label as untested;
reject it.

**Standalone Progress is removed as a destination; nothing in it is lost.**
Its three live sections are already Library's shelves derived from the same
function. Its permanent completion record moves to the foot of Library as the
composed numbered index `DESIGN.md` §6 specifies, with the per-track totals
beneath it. Its per-topic detail lines move onto the topic page as one sentence.
This removes a tab and a third reading of `journeysFor` without removing a
single fact.

**Data remains a full route, loses its tab.** `PRODUCT.md` principle 4 requires
export/import to be first-class and easy to find; it does not require a
permanent thumb-level slot for an action performed a handful of times a year. A
clearly labelled `Data and backup` entry at the foot of Library, opening the
existing Data route unchanged, satisfies the principle. It must not be buried in
a gear menu.

**Auth and capture stay in Library.** The content inbox is explicitly a
neighbour of the library, never part of it (`useInbox` state never enters
`topics`). `+ Want to learn` and its sign-in belong beside the collection they
feed, at the lighter weight they already carry.

**Are two destinations sufficient?** Test every job against them: due work →
Today; deliberate work → Library → Topic; authoring → Library; capture →
Library; the record → Library; export → Library → Data; reference lookup →
inside the topic that owns it. Yes. There is no orphan.

**Desktop** keeps the real side rail (`@media (min-width: 980px)` in
`global.css`), now carrying two entries plus the quiet Data link. A two-item rail
is not a waste of the rail; the rail's value was never the number of buttons.

### Honest accounting

This is not primarily a screen-count reduction, and it should not be sold as
one. Route-level types go from 8 to 6; full-screen archetypes from 13 to about
11. What actually changes is that **the number of decisions the learner makes on
the daily path goes from three (which tab / which topic / which mode) to one
(which topic, and only when they want to override the schedule)**, and two
duplicated renderings of the same content disappear.

---

## 4. Generic topic architecture

### Decision: one topic surface, whose *body is the content*, with the recommended action as the only prominent control.

Argus has three ordinary content densities, already specified in
`docs/open/LEARN_CONTENT_MODEL.md` and already implemented in `LearnSupport.tsx`:
reference-only, concise support, briefing. They do not need three UIs and they
do not need a separate route. They need one page that renders what the topic
actually has.

The ordinary topic page becomes, in order:

1. **Title** (serif display) and **scope** sentence. The scope is the reason the
   topic is allowed to exist; it reads as content, not as a caption.
2. **One line of state, in the learner's words.** `Due now`. `Held until 4 March`.
   `Finished 12 January · next spot check in 61 days`. `Needs repair`. This is
   `journey.statusLabel` plus `journey.detail`, which already exist. The `<dl>` of
   internal dimensions is deleted.
3. **One primary action**, which is `journey.action` with its consequence in the
   label, exactly as the derivation already computes it. The non-recommended path
   remains reachable as a quiet text-weight control, never as a second large
   button of equal shape.
4. **The content itself, visible, editorial, unconcealed** — `LearnSupport` when
   the topic has one, then the `Recall reference` under its strong hairline, then
   every item numbered. This is verbatim what the Learn sheet renders today. No
   `<details>` fold. `DESIGN.md`'s rule that a reading surface must not be
   card-shaped is preserved because the treatment moves unchanged.
5. **Quiet administration** below the content: history fold, Edit, Delete.

**The ordinary Learn route is deleted.** Nothing it rendered is lost; it is
rendered here instead, once.

What this costs, stated plainly:

- **Multi-topic Learn disappears.** Reading three topics back-to-back is not a
  task with a beginning and an end; batch *Test* is, and it stays. Today's
  secondary "Learn the other three" control becomes "open them" — or is dropped.
  Flagged as an open decision (§15.2).
- **The exposure event needs a new home.** `Learn.tsx` currently calls
  `resolveStudy` on mount, which is what moves `unstarted → learning`. With no
  Learn route, the honest options are (a) opening the topic page deliberately is
  the exposure event, or (b) exposure is stamped by the primary action at the
  foot of the reference (`I've read this — test me`). Flagged as an open
  decision (§15.1); (a) is closest to current behaviour and simplest.

### Distinguishing the three kinds in the UI

The three kinds the brief asks about are distinguished by **what the page's body
is**, not by a badge, a label or a different navigation shape:

| Kind | Body of the topic page | Primary action |
|---|---|---|
| Simple finite reference (NATO, bearings) | the numbered reference, immediately | Test / Held / Repair |
| Richer Learn support (OODA, primary survey) | briefing sections, then `Recall reference` | same |
| Structured curriculum (Morse) | **the path** | Continue lesson N / Check / Repair |

One shell, two bodies. A topic whose `learn.kind` is `briefing` is not a
different species from one that is reference-only; it simply has more to read
before the reference. A topic with a curriculum *is* a different species, and it
gets a different body — but not a different app, a different route family or a
different navigation model.

---

## 5. Morse course architecture

### Decision: the Morse path is the body of the Morse topic page. Lessons, checkpoints, checks and repair are runs entered from it.

**Opening Morse lands on the curriculum.** Header: title, scope, and the scope's
explicit disclaimer (printed mappings, both directions; not auditory reception,
not sending, not words). Then one line of position in plain language —
`Lesson 5 of 13 · 9 of 26 letters learned` — then one primary action that is an
*exact resume*: `Continue lesson 5` enters the saved sitting at its stored
position, because `Topic.lessonSitting` is already the durable authority and
already round-trips through export/import. Then the path itself as the page body.

**The path carries every stage as a visible entry**, in curriculum order:

```
01  E · I        completed
02  T · A        completed
    ── word checkpoint (after 4) ──
05  N · S        current          ← resume here
06  M · U        locked
    ── consolidation (after 7) ──   [#90 §4, when that lands]
13  Y · Q        locked
    ── independent check ──         always visible, always tappable
    ── retention check ──           appears when the schedule asks
```

Four properties of that list matter:

- **The check is the last path entry and is always available.** Its position
  describes curriculum order, not an unlock condition. Tapping it early states
  its consequence at the moment of invocation — the run is recorded, the clock
  does not move — rather than standing as a permanent second mode button
  everywhere. This is the earlier proposal's best structural idea and it is kept.
- **Checkpoints are path entries, not surprises.** #88's automatic handoff at
  lesson completion stays; the path entry is where a skipped checkpoint is found
  again.
- **Locked entries stay visible.** The learner should be able to see the whole
  finite shape of the thing they are finishing. That is the product's entire
  premise.
- **The path owns no progress.** It projects `morseLessonPath(topic)` and
  `morseWordCheckpointPath(topic)` exactly as `MorseProgramme.tsx` does now. No
  new durable state, no course record, no milestone database.

**The alphabet reference becomes a quiet entry, not the page.** #76 put all 26
reference cards on the Morse topic page and was validated on a Pixel — correctly,
because at that time the topic page had nothing better to be. Once the path is
the body, 26 cards push the curriculum below the fold and make the lookup the
page. Recommendation: a single persistent `Morse alphabet` control in the topic
header, opening the existing reference route, which returns to its invoker. This
reverses part of a previously owner-validated decision and therefore needs owner
confirmation (§15.3).

**Reference return behaviour is fixed at the root.** The reference opened from
inside a lesson should return *to the lesson*, not abandon it to the topic page.
The durable sitting makes this safe: the lesson rebuilds from `lessonSitting` and
`lessonProgress` and the learner loses nothing. Doing this deletes the bespoke
history rewriting in `App.openReference`.

**Later advanced Morse is new topics, not new stages.** See §12.

---

## 6. Proposed end-to-end journeys

Written phone-first. Taps counted from cold open.

**J1 — ordinary topic, first time.** Open → Today shows `Two to read, one to
prove`; NATO row says `Not started`. Tap row → topic page: title, scope,
`Not started`, the 26 mappings visible, action bar reads `Test me · 26 items`.
Read, tap. Test runs, self-scored, ends with what changed and why. Back lands on
Today, now one row shorter. *2 taps to content, 3 to scored work.*

**J2 — ordinary topic, due for its delayed test.** Open → docket row says
`Ready for the delayed test`. Tap row → Test starts immediately, because for a
due drilled topic the row *is* the action, exactly as Today already behaves.
*1 tap.* The topic page is not on this path and should not be.

**J3 — first entry into Morse.** Open → Today: `Morse · Not started`. Tap →
Morse topic page: scope, `Lesson 1 of 13 · 0 of 26 letters learned`, path with
lesson 1 current and everything else visible-but-locked, `Start lesson 1`. Tap →
lesson: introduce, key, feedback, ten retrievals, end screen with real counts.
Close → back on the path with lesson 1 completed and lesson 2 current.

**J4 — resume mid-sitting.** Open → Today: `Morse · Lesson 5 · 6 of 10
retrievals`. Tap → straight into retrieval 7. Nothing asks which lesson, nothing
asks Learn-or-Test, nothing shows a path first. *1 tap to the next question.*
This is the journey the product is for, and it should be the shortest one in the
app.

**J5 — lesson completion and checkpoint.** Tenth retrieval lands → end screen:
retrievals, correct, letters to revisit, packet position, `Next lesson` /
`Stop here`. When completion newly unlocks a checkpoint, the invitation appears
here (#88, unchanged); skipping leaves it on the path.

**J6 — the independent check.** All 13 lessons settled → path's check entry
becomes the primary action and the topic page says so. Tap → 26 items, **uncued
from the first question**, directions distributed across the run (§11, #90 items
6 and 7). End screen states one of three honest outcomes: banked and what moved;
recorded but not qualifying, and precisely why; or what was missed and what
happens next.

**J7 — miss → targeted repair.** The check ends with misses → the end screen
offers `Repair 4 letters` as its primary action, and the topic page carries the
same offer until it is taken. Repair asks only those items, formative, restoring
support on the way as the cue ladder already does. Completing repair does not
re-bank anything; the *next* check is what re-earns evidence. The learner then
sees `Check again` rather than being sent silently back to a full 26-item run.

**J8 — completion, then retention.** A clean qualifying check ≥30 days after
drilling banks completion; the end screen is the one place brass marks an event
rather than an action (`DESIGN.md` One Accent Rule). The topic joins the numbered
record at the foot of Library. 90 days later Today shows `Spot check ready`; a
failed spot check shows `Needs repair` and routes to repair — never to a scolding
— and `completedAt` is untouched.

**J9 — reference lookup mid-lesson.** In a lesson, tap `Morse alphabet` → the
reference → Back → the same lesson, same position, nothing scored, nothing lost.

**J10 — authoring and export.** Library → `New topic` (unchanged form, unchanged
finite-boundary gate) or `+ Want to learn` for an idea with no boundary yet.
Library foot → `Data and backup` → the existing export/import/reset route.

---

## 7. What happens to Learn and Test

### Decision: they stop being user-facing choices and survive unchanged as internal semantics.

| Concept | Status after the redesign |
|---|---|
| `Learn` as a word the learner reads | **gone.** For an ordinary topic the reading is the page; for Morse it is `Lesson 5`. |
| `Test` as a word the learner reads | **kept, as the name of the scored run** — because the product must state consequences, and the consequence needs a noun. Inside Morse's path the same run may read as `Independent check`; see §15.7. |
| The two-button mode choice | **gone from every surface.** The journey's action is the action. |
| `Mode = 'learn' \| 'test'` in the route model | kept internally; the `run` route gains a repair mode. |
| `resolveStudy`, `resolveAttempt`, `advancementEligible` | **unchanged.** |
| Cue ladder, `CueState`, `DirectionEvidence.unassistedCorrect` | **unchanged.** |
| `lessonProgress`, `lessonSitting`, `acquisitionReadyAt` | **unchanged.** |
| The #68 completion-evidence contract | **unchanged.** |

The curriculum-owned journey the brief proposes maps onto existing machinery
with exactly one genuinely new element:

```
learn                 Morse lesson / the topic page's reference        exists
formative retrieval   lesson retrievals, replay, word checkpoints      exists
independent check     the Test run, uncued                             exists — but see §11
targeted repair       a bounded run over what just failed              NEW
further check         the next Test run                                exists
completion            the qualifying delayed attempt                   exists
retention             the 90-day spot check                            exists
```

**Concepts that belong to the user:** lesson, checkpoint, check, repair, due,
held, finished, reference, and the honest counts (`6 of 10 retrievals`,
`9 of 26 letters`, `26 items`).

**Concepts that must remain implementation detail:** acquisition readiness,
`settled`, cue rungs and their names, `unassistedCorrect`, directional evidence
coverage, `advancementEligible`, journey phases, the anchored clock. Their
*consequences* are stated at the moment they bite — on a check's end screen, on a
row's status line — never as a standing table of internal dimensions.

---

## 8. What happens to Progress

- **The destination is removed.**
- **In progress / Waiting / Repair** already exist as Library shelves from the
  same derivation; Library's shelf labels adopt Progress's clearer wording and
  one-line notes.
- **The completion record** — numbered descending, serif titles, small-caps
  track labels, tabular dates — moves to the foot of Library, composed exactly as
  `DESIGN.md` §6 specifies. It stays deliberately non-actionable: this is the
  artifact the product exists to build, and it is read, not tapped.
- **Per-track completion totals** stay beneath it, as counts of real things.
- **Per-topic progress** becomes one sentence on the topic page.
- **No aggregate percentage** is introduced. Removing the page does not require
  inventing one, and it must not be read as licence to.

---

## 9. Reference behaviour

1. A reference is a lookup that changes nothing. `MorseReference` already imports
   no store, scheduler or cue ladder, and a test asserts it. Preserve that
   structurally.
2. **For ordinary topics there is no separate reference concept.** The topic
   page's body is the reference.
3. **For Morse**, the alphabet remains a dedicated child route: it is a long
   browse and it deserves its own Back stop and its own scroll position. Reject
   collapsing it into a drawer purely to reduce a route count.
4. It is reachable from the Morse topic header and from inside a lesson,
   checkpoint and repair run.
5. **It always returns to its invoker**, and a lesson it returns to resumes from
   durable state. This is the change that lets `App.openReference` lose its
   special case.
6. It never appears inside a scored run's question surface. No cue leakage; the
   existing uncued-rung guarantees are untouched.

---

## 10. Completion and retention presentation

**Permanent completion is a record, not a token.** `completedAt` is already
permanent and decay already does not erase it. The numbered index in Library is
the presentation. A badge would add a second, weaker representation of the same
fact — weaker because a badge asserts status while a record asserts a claim with
a date attached.

**Current freshness is a status line, not a meter.** `Held until`, `Spot check in
61 days`, `Needs repair`. Already derived; already correct; just phrased for the
learner and shown once per topic instead of three times across three surfaces.

**Milestones: reject as durable state.** The proposal's `Letter foundations /
First messages / Building fluency` are three *competencies* with three different
completion criteria. Argus already has a name for that object: a topic. Modelling
them as milestones inside one topic would create a fifth progress database and
would blur three completion claims into one. If they are wanted, they are topics
(§12). Meanwhile the path already displays real, legible milestones — 13 lessons,
2 checkpoints, the check — derived from state that already exists.

**Badges: reject.** They contradict `PRODUCT.md`'s explicit anti-gamification
contract and `docs/open/PROGRESS_ARCHITECTURE.md`'s non-goals. The stated motivation —
"an earned milestone should stay visible after later weak retention" — describes
behaviour Argus already has, in `completedAt` and the record that survives decay.
A badge would solve a problem the product solved two programmes ago, at the cost
of a principle it has held throughout.

---

## 11. #90 reconciliation

#90 is research and a measured baseline, not an approved implementation. Its
findings are sound and its measurements are the most valuable artefact in the
repository on this subject. It should be **split**, not absorbed whole.

| # | #90 requirement | Disposition | Where it goes |
|---:|---|---|---|
| 1 | Preserve the four state boundaries | **retained unchanged** | it is a constraint; this paper adopts it verbatim |
| 2 | Item-aware question selection | **retained, separable** | lesson-policy workstream; pure function; invisible to IA |
| 3 | Novel-item budget at sitting scope + spacing policy | **retained, separable, with a UI consequence** | policy in the lesson; the path page must state the chosen rule honestly (§15.4) |
| 4 | Cumulative review coverage; consolidation after 7/10/13 | **absorbed into the path** | consolidation stages become visible path entries |
| 5 | Balance listening by item need | **retained, separable** | formative only; no user-visible IA impact |
| 6 | **Remove duplicated cue acquisition after Learn** | **promoted into the redesign** | prerequisite: without it the "independent check" is not independent |
| 7 | **Introduce both printed directions earlier** | **promoted into the redesign** | same seam; the check must exercise the claim it certifies |
| 8 | Distinguish non-qualifying from failure | **promoted, partly done** | `withheldByAcquisition` copy exists in `TestDone`; the explicit scheduler outcome does not |
| 9 | Complete the checkpoint arc | **absorbed into the path** | checkpoints at 4/7/10/13 as path entries |
| — | Character-order policy (retain, do not change) | **retained unchanged** | do nothing, deliberately |
| — | Migration rules | **retained unchanged** | applies to the lesson-policy workstream only |

The split has a clean seam. Items 6, 7 and 8 are **the Learn → Test handoff**:
they are what makes the end of the curriculum an honest independent check rather
than a second, slower acquisition ladder. They belong inside this redesign
because the redesign's central promise — the path ends in a check — is false
without them. Items 2, 3, 4, 5 and 9 are **lesson scheduling policy**: pure
functions behind the lesson surface, valuable, independently testable by
deterministic whole-programme simulation, and unaffected by any navigation
decision in this paper. They ship separately, before or after, without leaving a
hybrid state.

**Nothing in #90 is superseded.** The issue should be closed only when both
halves have landed, or re-split into two issues along that seam.

---

## 12. The #29 boundary

**Rule: a competency is a topic. Advanced Morse is new topics, never new stages
of `international-morse-letters-printed`.**

This is not a policy bolted on; it is what the topic model already enforces. A
topic owns one `scope`, one finite item set and one completion claim. Auditory
reception has a different stimulus, a different criterion (character speed,
effective speed, accuracy) and a different claim. Sending has a different
response channel and a measurement Argus cannot honestly make on a touchscreen.
Groups and continuous material need a performance standard over generated
samples rather than a finite deck. Three claims, three scopes, three topics —
each appearing in Library with its own path when it exists.

Therefore this redesign may **not**:

- add an audio-scored prompt to the printed A–Z path;
- record or display WPM, sending quality or keying timing as learner state;
- introduce `First Messages` as a milestone, stage or completion of the printed
  topic — it is continuous material and belongs to #29, or to a separate finite
  topic with its own criterion;
- let a word or phrase satisfy any part of the printed 26-unit claim.

Word checkpoints stay exactly what `docs/open/MORSE_WORD_CHECKPOINTS.md` says they
are: formative, ephemeral, non-gating application inside the printed topic. Making
them path entries changes their visibility, not their semantics.

The reusable asset this redesign produces is the **course shell** — path body,
resume, check, repair, reference — which a future reception topic inherits by
being a curriculum topic, without any of its content leaking backwards.

---

## 13. Concepts to keep from the previous proposal

1. Opening Morse lands on its learning stages, not on a facts sheet.
2. The alphabet is reached deliberately and returns to its invoker.
3. Remove the prominent Learn-versus-Test choice.
4. Embed assessment in the curriculum, always available at the end of the path,
   with its consequence stated at invocation rather than as a standing second
   mode everywhere.
5. Progress belongs inside the pages it describes; removing the destination does
   not require inventing an aggregate score or discarding completion history.
6. Keep the splash; make its seen-flag persistent (`localStorage`, separate from
   library data, cleared by clearing site storage — not by import or reset).
7. The reference may remain a dedicated child page; do not remove it merely to
   reduce a route count.
8. Ordinary topics get a lighter structure. Do not manufacture thirteen lessons
   for content that needs one reading.
9. Do not merge surfaces that differ in task, input or persistence semantics —
   the programme/lesson/replay/checkpoint distinction is real and stays.
10. **Its sharpest finding:** relocating Test's button does not create a final
    uncued assessment, because Test starts at supported rungs and word
    checkpoints save no formal evidence. This paper's §11 is the answer to that
    finding.

---

## 14. Concepts to reject

1. **`Home` and `Lessons` as navigation labels.** Wrong for a reference library
   whose majority object has no lessons; `Home` invites dashboard drift.
2. **Badges and achievement state.** Contradicts the product contract; solves a
   problem `completedAt` already solves.
3. **Durable milestone/freshness state** (`Letter foundations`, `First messages`,
   `Building fluency`). A fifth progress database and three claims collapsed into
   one. If wanted, they are topics.
4. **`First Messages` content in this programme.** #29 territory (§12).
5. **A new "assessment engine" as a subsystem.** `Session.tsx` plus `cueLadder.ts`
   plus `scheduling.ts` already are it. What they need is item 6 and item 7 of
   #90, not a rewrite.
6. **Durable latency/timing storage now.** `DirectionEvidence.lastLatencyMs`
   already exists; nothing in this design reads it. Defer until a real criterion
   needs it, per #29.
7. **Retention redesign.** 1 / 30 / 90 days with `PASS_THRESHOLD = 1` is coherent
   and untouched by anything here.
8. **Removing the splash.** The owner likes it; the defect is the storage key,
   not the sequence.
9. **A migration.** Sections 3 through 10 of this paper require **no schema
   change and no new durable field.** Every value they display already exists.
   The only additive state in the whole programme belongs to #90's lesson-policy
   workstream (per-item review metadata), and it is isolated there.
10. **Shipping the whole thing as one release** (§16).

---

## 15. Unresolved product decisions requiring owner judgement

Each of these changes the work materially and none of them can be resolved from
the code or the documents.

1. ~~**Exposure for an ordinary topic.**~~ **Decided 2026-09-15: the deliberate
   action, not opening the page.** Implemented as the tap on the page's
   primary `Test` action rather than a relocated foot-of-reference button —
   the display projection was never in question, only the write timing. See
   `docs/open/ARGUS_OVERHAUL_RATIFICATION.md`.
2. **Multi-topic reading.** Drop batch Learn entirely, or keep a "read these
   three" stacked sheet? *Recommendation: drop it; keep batch Test.*
3. **The Morse topic page's 26 reference cards (#76).** Owner-validated on Pixel.
   Replacing them with a quiet `Morse alphabet` link is what makes room for the
   path. *Recommendation: replace, but this is the owner's call.*
4. **Spacing policy for a second novel pair in one day** (#90 §3). Hard spacing
   (unavailable until tomorrow) or soft (continue, but review-only)?
   *Recommendation: soft — hard spacing punishes the five-minute-window learner
   who happens to have twenty minutes today.*
5. **Is repair scored or formative?** **Decided 2026-09-14: formative.** Repair
   practises, the next check proves; the evidence contract stays untouched. A
   repair run writes no formal `itemEvidence`, does not move the retention
   clock, and cannot qualify a topic for completion. Batch 5 proceeds on this
   basis.
6. **Where the completion record lives** in Library: a permanent final section, or
   a `Finished` filter? *Recommendation: permanent final section — a filter hides
   the artifact behind an interaction.*
7. **Naming the scored run.** Keep `Test` everywhere, or `Test` for ordinary
   topics and `Independent check` inside a curriculum? Two names for one object is
   a real risk. *Recommendation: one name, `Test`, described in the path as
   "the check that proves it".*
8. **Does Library keep batch selection** for multi-topic Test now that Today owns
   the batch action? *Recommendation: keep; it is the desk-posture path.*
9. **Data as a route or a sheet.** *Recommendation: route, unchanged — it holds
   destructive actions that deserve a page.*

---

## 16. Recommended implementation boundaries

The earlier proposal's single-release list — Home/Lessons, navigation rewrite,
milestone state, badges, First Messages, an assessment engine, a retention
redesign, migration and new content — is rejected as a shape. It bundles
ratified and unratified decisions, couples UI reorganisation to schema change,
and would land a second architecture immediately before the one that replaces
it. The following batches are each independently valuable, independently
verifiable, and leave the app coherent if the programme stops after any one of
them.

| # | Batch | Touches | Durable state | Gate |
|---:|---|---|---|---|
| 0 | Splash seen-flag → `localStorage`, isolated from library data | `SplashScreen.tsx` | none (a UI preference key) | auto-merge on green |
| 1 | **Navigation reduction.** Today + Library; Progress's record and shelves fold into Library; Data demoted to a Library utility entry | `AppShell`, `navigation.ts`, `App.tsx`, `Library`, delete `Progress` destination | **none** | owner phone review |
| 2 | **Ordinary topic consolidation.** Topic page absorbs the reading sheet; one derived action; ordinary Learn route removed | `TopicPage`, `Learn`, `LearnSupport`, `App.tsx` | **none** (decisions §15.1, §15.2 first) | owner phone review |
| 3 | **Morse course home.** Path becomes the topic page body; lesson/replay/checkpoint remain runs entered from it; reference returns to its invoker; `App.openReference` surgery deleted | `TopicPage`, `MorseProgramme`, `App.tsx`, `MorseReference` | **none** (decision §15.3 first) | owner Pixel review |
| 4 | **Learn → Test seam.** #90 items 6, 7, 8: acquisition-ready items present uncued; directions balanced across a bounded number of runs; explicit non-qualifying scheduler outcome | `cueLadder.ts`, `Session.tsx`, `scheduling.ts`, `journey.ts` | **none new** — derives presentation from existing `lessonProgress` | deterministic tests; auto-merge on green |
| 5 | **Targeted repair.** A bounded formative run over what just failed, offered from the check's end screen and the topic page | new small surface reusing `Session`/`MorseKeyInput` primitives | **none** (decision §15.5 first) | owner phone review |
| 6 | **#90 lesson scheduling policy.** Items 2, 3, 4, 5, 9: item-aware selection, sitting-scope novel budget, cumulative coverage, listening balance, checkpoint arc | `morseLesson.ts`, `morseLessonListening.ts`, `morseOrder.ts`, `morseWordCheckpoints.ts` | **the one additive migration** in the programme | whole-programme simulations; owner review of the spacing copy |

**Dependencies.** 1 → 2 → 3 (batch 3 depends on batch 2 having split the topic
shell into header + body). 4 is independent of 1–3 and can run in parallel, but
must land before 5, because repair is defined against what a check reports. 6 is
independent of 1–5 once 3 has landed, because it changes what the lesson asks,
not where the lesson lives.

**What is deliberately not in this programme.** #42's real-device acceptance
gate (unchanged, still the Pixel gate on the current production flow); #29 in any
form; #79 (parked); new content; any change to the completion claim, the
scheduler, the cue-evidence contract or the storage version outside batch 6.

**Sequencing note.** Batches 1–3 are pure reorganisation with zero durable-state
risk and should be validated on a phone before batch 4 changes what a check
feels like. That ordering also means the largest correctness work (batch 4)
lands into an app whose seams the owner has already accepted.

---

## Proposed screen map

```
Splash                                      first visit only; persistent seen flag

┌─ Today ──────────────────────────────────  [tab 1] the docket
│    verdict headline · due rows (row = launch that one topic) · one batch action
│
└─ Library ───────────────────────────────   [tab 2] everything owned
     search · track filters · + Want to learn · New topic
     shelves:  Due now → In progress → Waiting → Repair → Needs items
     completion record  (numbered, dated, non-actionable) · track totals
     Data and backup ──────────────────────► Data route (export / import / reset)

     └─ Topic ────────────────────────────   one shell, two bodies
          header:  title · scope · one state line · one primary action

          body A — reference topic
              briefing (when present) → Recall reference → history · edit · delete
              └─► Test run
              └─► Repair run

          body B — curriculum topic (Morse)
              position line · path:
                 lessons 01–13 · checkpoints · consolidations · the check
              quiet:  Morse alphabet ──────► Reference route (returns to invoker)
              └─► Lesson run   (introduce / retrieve / feedback / checkpoint / end)
              └─► Replay run
              └─► Test run     ("the check")
              └─► Repair run

Overlays (unchanged):  topic form · discard-edits · capture · delete · import · reset
```

**Counts.** Route-level types 8 → 6 (section ×2, topic, run, reference, data).
Full-screen archetypes 13 → ~11. Primary navigation destinations 4 → 2. Decisions
on the daily path 3 → 0. The last row is the one that matters.

---

## What this paper does not claim

- No browser walkthrough or device session informed it; it is source, document
  and issue inspection, like the review it responds to.
- No usage data exists, so every frequency claim here is inferred from
  `PRODUCT.md`'s stated user and the shipped library's actual shape.
- It ratifies nothing, changes nothing, and should be reconciled against
  `docs/closed/SCREEN_INVENTORY_REVIEW.md` by the #92 synthesis pass rather than
  replacing it unread.


---

# Implementation record

Written after the fact, against the branch that carries the work. The gate is
green: 598 unit tests, 168 browser tests across four viewport projects, and a
clean `npm run build`.

## What shipped

**Batch 0 — splash persistence.** The seen flag moved from `sessionStorage` to
`localStorage`, kept outside `argus.library.v5` so importing or resetting a
library cannot resurrect a 6.5-second interruption in front of a task-first home.

**Batch 1 — navigation reduction.** Two destinations, `Today` and `Library`.
`View` lost `progress`; a stored history entry naming it now fails validation and
falls back to the root rather than restoring a route that cannot render.
`Progress.tsx` is deleted: its shelves were Library's, and its completion record
is now `CompletionRecord.tsx` at the foot of Library. `journeyShelves` went from
four shelves to three (`Due now`, `Waiting`, `Needs items`) — repair is not a
fourth, because a decayed topic is due and its row already says so in warning.
Data keeps its route, reached from the foot of Library, marks Library current
while open, and its Back control is named `Back to Library` so it no longer
collides with the nav button of the same name.

**Batch 2 — ordinary topic consolidation.** `TopicPage` is one shell with two
bodies. The header is title, scope, one line of state and exactly one prominent
action. For an ordinary topic the body is the reference itself, in the editorial
treatment the reading route used, which is why that route is gone rather than
hidden: `Learn.tsx` is deleted and `Learn.css` became `Reading.css`. The
`<dl>` of five internal dimensions and the `Show all N items` fold are gone.
Multi-topic reading was dropped while batch Test stayed (§15.2). §15.1
originally shipped as recommended — opening the page was the exposure event —
but was revisited and changed on 2026-09-15 by the #97 decision at the head of
this document: browsing writes nothing at all, and a fresh ordinary topic
carries a deliberate `Start learning` action that owns the transition. Test is
left as it was, a check. See `TopicPage.tsx`'s `startLearning` and the `enroll`
branch of `journeyFor`.

**Batch 3 — Morse course home.** `MorseProgramme.tsx` is deleted and its path is
`MorsePath.tsx`, the body of the Morse topic page. Opening Morse lands on the
curriculum; the lesson, replay, word checkpoints and Test are runs launched from
it, carried by a new optional `RunTarget` on the run route. The path was
redesigned from fifteen bordered tiles into a dense spined index, which is both
`DESIGN.md`'s own vocabulary and the only way the whole thirteen-lesson shape
fits a phone. Twenty-six reference cards left the topic page for a quiet
`Morse alphabet` control (§15.3, and the one decision most worth overturning if
the owner disagrees — it reverses part of the Pixel-validated #76).

The reference's history surgery in `App.openReference` is deleted. A canonical
lesson is now restorable from its durable sitting, so the alphabet is simply
pushed and Back returns to the lesson it interrupted instead of abandoning it.

**Batch 4 — the Learn → Test seam.** #90 items 6, 7 and 8, covered by
`src/domain/study/learnToTestHandoff.test.ts`. Every mapping now receives both printed
directions within two full runs rather than nine.

**Vocabulary.** One name per thing. `Learn` left the interface; `packet` became
`lesson` everywhere a learner reads it, keeping its internal name in
`morseLesson.ts` where it describes roster construction; the curriculum's last
entry is a `Test`, not a differently-named cousin of one.

## Found and fixed along the way

- **The session gutter was applied twice.** `main` and `.session` each added one,
  costing every full-screen task 36px against the same content on a section page.
  At 320px with 200% text that was the difference between the alphabet fitting
  and overflowing. One element owns the gutter now.
- **`Drilled today` described a drill that never happened** for an ordinary topic
  that had only been read. It says `Read today` / `Read, ready to test`, which
  matters much more now that opening the page is the exposure event.
- **Fifteen path controls all announced `Continue`, `Replay` or `Start`.** Each
  now carries the entry it belongs to as its accessible name.
- **First exposure for a curriculum topic** was owned by the deleted Learn route
  and is now owned by the lesson run, excluded for replays and checkpoints.

## What did not ship, and why

**Batch 5, targeted repair.** ~~Not implemented.~~ **Shipped 2026-09-14**, once
§15.5 was decided formative. It is documented as its own contract in
`docs/open/TARGETED_PRACTICE.md`; the account below is what this paper got right
and wrong about it.

Right: it *is* genuinely new product behaviour, and a partial-deck run that could
reach `resolveAttempt` was indeed the one change here able to weaken the
completion boundary. That is why the built surface never reaches it — the
practice module imports no store write, no scheduler and no evidence recorder at
all, and a test asserts the absence of those imports rather than trusting the
prose. It does not touch the Session banking path; it sits beside it.

Wrong, in two places worth recording:

- This paper calls the surface `repair`, which the shipped product already uses
  for `JourneyPhase = 'repair'` — the learner-visible `Needs repair` on a
  *decayed* topic, whose remedy is a full **scored** Test. The new surface is
  therefore called **practice**, and the decay label is untouched.
- "Batch 4 delivered most of what repair was for" holds only for Morse. An
  ordinary reveal-and-grade check writes no per-item evidence at all, so it
  neither asks weaker directions nor restores support on the items that failed —
  there is nothing per-item to restore. This is also why practice can be offered
  from an ordinary topic's *end screen* but not later from its topic page.

**Batch 6, #90 lesson scheduling policy.** Not implemented, as the paper
recommends: it is pure-function work behind the lesson surface, unaffected by any
navigation decision here, and it carries the only additive migration in the
programme.

**Nothing in the state model moved.** No schema change, no new durable field, no
migration, and no change to the scheduler, the cue-evidence contract, the #68
completion gate or the printed A–Z claim. Batch 5 held that line too: practice
reads state that already exists and writes none of it.

## Still needing the owner

The nine decisions in §15 were resolved by taking this paper's recommendation in
each case, and every one is reversible. **Resolved 2026-09-15, by the owner
directly:** §15.3, the Morse reference cards, is confirmed as shipped (the
quiet `Morse alphabet` link stays); §15.1 was changed — see the #97 decision
above — from opening the page to a deliberate `Start learning` action, with
browsing left write-free; §15.5 (targeted practice) was
confirmed formative, matching what had already shipped. #42's real-device
acceptance gate is untouched and still open. Batch 5's phone review (the
`practice` surface and its `practice`-not-`repair` naming) remains
outstanding.

Batch 5 adds a third: the **practice** naming above, and the fact that its
topic-page offer reaches only topics that keep per-item evidence. Both are set
out in `docs/open/TARGETED_PRACTICE.md` and both are reversible.