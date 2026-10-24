# Issue #296 — Staged learning, optional final Test: design brief

> **Status: owner decisions D1-D7 approved on 2026-10-23. Implementation is authorized slice by slice (§8).** Lesson text for any safety or procedure topic still needs the independent domain review named in §5-6 before it ships.
> **Authority:** the design contract for [#296](https://github.com/BenWassa/argus/issues/296). It extends [Learning progress](PROGRESS_ARCHITECTURE.md) (#276) to topics that do not have lessons yet, and it does not change that contract's rules about permanence, no clocks or no decay. Where this brief and the issue disagree, the issue's owner decision (2026-10-23) wins.
> **Written:** 2026-10-23. **Evidence for the code references:** `main` at v1.6.1.

## 1. What is wrong today, and what changes

Today an ordinary topic offers a Learn / Practice / Test tray. Learn is reference material, Practice is locked (“—”) until a failed Test creates missed items, and Test is the most prominent action although nothing has been taught. A new learner must sit an exam before they can rehearse.

The target is one route:

| | Today | Target |
|---|---|---|
| Landing page | Full list of scored items with answers, then a three-tile tray | Where you are on a short lesson path, one action |
| Learn | Reading material, no stages, no completion | Short staged lessons that ask before they tell; finishing each once completes the topic |
| Practice | Standalone mode, locked until a miss | Gone as a mode. Recall happens inside lessons; a missed Test links to the lesson that covers the miss |
| Test | Primary action, required for completion | Optional, separate, independently scored; appears after the lessons |
| Reference | Called “Learn” | Called Reference, quiet link |

Morse is untouched. It already has packeted lessons and its own Key / Listen / Read / Free play modes, and `#279` and `#280` are still in flight.

## 2. Principles carried over from earlier owner decisions

These are constraints on every screen below, not new proposals.

- **Signal on Slate**, solid opaque plates, the Morse screen's structure as the app-wide standard (#225).
- **No forced path** (#225, 2026-10-18): the learner chooses what to do. A position marker only scrolls the path; it never locks a node.
- **No accordions or folds**, no tile subtitles, no explanatory prose near the task, no chevrons, no quantities on Today, short title-case names.
- Tiles show the literal stimulus (for example the real flag), never a metaphor icon.
- A test node must look visibly different from a lesson node. The shared `ProgressSpine` already does this: round nodes for steps, square nodes for tests and milestones.
- No streaks, XP, lives, currencies, timers, cooldowns or repetition gates. Nothing reads a clock.
- 44 px targets, taps first, no mandatory drag, no on-screen keyboard for objective choices, no horizontal overflow at 320 px or 200% text, `prefers-reduced-motion` honoured.
- Formal evidence is unchanged: lesson answers write **no** `itemEvidence`, **no** `history` and no Test result. Only a real Test does.

## 3. Landing page

```
┌──────────────────────────────┐
│ ← Radio Procedure            │  ScreenHeader: title, one reading
│   Lesson 2 of 5              │
├──────────────────────────────┤
│  ●  Words that agree         │  round, done
│  │                           │
│  ◉  Ending and turns         │  round, current (position marker)
│  │                           │
│  ○  Fixing mistakes          │  round
│  │                           │
│  ○  Call order               │  round
│  │                           │
│  ○  Putting it together      │  round
│  │                           │
│  ■  Final Test               │  square, visibly different
├──────────────────────────────┤
│        [ Continue ]          │  one tray action, solid action colour
│          Reference           │  quiet link
└──────────────────────────────┘
```

- **One action.** The tray holds a single tile whose label is the next thing: *Start*, *Continue*, or *Review* once finished. It replaces the three-tile tray. There is no locked tile, because there is nothing to lock.
- **Path rows are tappable** and never locked. Tapping a finished lesson replays it without overwriting completion. Tapping a later lesson is allowed (no forced path); the position marker still points at the next unfinished one. This follows the Morse path.
- **Final Test is a square node at the end of the path.** It is reachable from the start, in line with “no forced path”, but it carries no prominence until the lessons are done, then it takes the quiet secondary action. The open question is in §9 (D1).
- **No answer list.** The scored bank is not shown on the landing page. Items, answers, sources and limitations live in Reference, which is also where a learned topic's inventory stays.
- **No subtitle per row.** A row is a number and a name.
- **Reading:** *Lesson n of N* while learning. After completion the usual full reading (Learned) appears and the action becomes *Review*. Final Test result reads as a score and never lowers the topic.

Reuse: `ScreenHeader`, `ProgressSpine`, `ModeTray`, `Plate` (all in `src/shared/ui`). The page itself is the existing topic page in `src/features/library/TopicPage.tsx`; the Morse branch is left as is.

## 4. A lesson stage

A stage is short: **one idea, shown briefly, then recall on it, immediate feedback, a one-line summary, then next.** Scaffolding fades across stages. The learner is asked before being told whenever earlier teaching makes that fair.

### Step kinds (the small authored schema)

A stage is a list of steps. Eight kinds cover Radio Procedure, Signal Flags and every simple topic in the inventory (§8). Each step has a deterministic id independent of display order, so progress survives reordering and resume.

| Kind | What the learner does | Typical use |
|---|---|---|
| `show` | Reads or looks at one thing (a proword with its meaning, a flag and its name). Continue. | Introducing |
| `choose` | Picks one of four large tiles for a prompt. | Recognition with the literal stimulus |
| `contrast` | Chooses between two or three confusable items side by side. | Look-alikes (Flags), near-synonyms (ROGER / WILCO) |
| `order` | Taps blocks into a sequence. **New interaction**: today ordered recall means choosing the whole correct sequence from four, and no tap-to-reorder answer type exists. The Test keeps its current form. | Call order, message format |
| `complete` | Picks the missing part of a short, source-bounded exchange. | “…, THIS IS …, OVER” |
| `recall` | Self-checks: reveal, then “Got it / Missed”. | Vocabulary with no objective distractor |
| `checkpoint` | A short mix of earlier and current items, weighted to confusables. | End of stage |
| `summary` | One line of what was just covered. | Close |

Rules that apply to every step:

- A wrong answer explains the distinction in one line, shows the correct step, and allows **one in-lesson retry**. No penalty, no repeat gate, no extra sitting. A learner finishes a stage once.
- Answer keys come only from authored, sourced content. Nothing is generated.
- A step may write to the stage-progress store (§6). It never writes `itemEvidence`, `history`, `lessonProgress` for Morse, or anything a Test reads.
- Each `show` and `choose` has a text equivalent for any visual, for screen readers.

Reuse, as the catalog audit found it: items carry `choice.options` (four tiles, `choose`), whole-sequence choices generated from authored elements (usable as a `choose` over sequences), figure sources (Flags) and authored confusion sets (`contrast`). What does not exist yet: a tap-to-order answer, and distractors for self-scored cards. Radio Procedure's 12 prowords are flip cards, so a `choose` step on them needs authored wrong meanings, which is content work and part of the domain review. `PracticeRun` (reveal and self-grade, `src/features/practice/PracticeRun.tsx`) is the basis for `recall` and `checkpoint`, which is why standalone Practice can go without losing a useful mechanism.

## 5. Pilot A — Radio Procedure

Scored boundary stays exactly as it is: 12 RIC-22 prowords (word → meaning) plus 3 ordered structures (one-station call, ALL STATIONS call, four-part message handling). 15 items, same denominators, same sources.

| # | Stage | Teaches | Item coverage | Contrast focus |
|---|---|---|---|---|
| 1 | Words that agree | ROGER, WILCO, ACKNOWLEDGE, AFFIRMATIVE, NEGATIVE | 5 prowords | ROGER vs WILCO vs ACKNOWLEDGE |
| 2 | Ending and turns | OVER, OUT, GO AHEAD, STAND BY | 4 prowords | OVER vs OUT |
| 3 | Fixing mistakes | SAY AGAIN, READ BACK, CORRECTION | 3 prowords | SAY AGAIN vs READ BACK; never “REPEAT” |
| 4 | Call order | One-station call, ALL STATIONS call, message handling | 3 ordered items | Called station first |
| 5 | Putting it together | Mixed checkpoint and one short exchange per call type | all 15 | The confusables from stages 1-3 |

Item kinds (verified): the 12 prowords are self-scored flip cards; the 3 structures are four-way choices over a whole sequence. Stage 4's tap-to-order is therefore the one new interaction in this pilot.

Not in the lessons: the 12 unscored Appendix A words and the priority order. They stay in Reference, as now. If the owner wants them taught, that is a Test-boundary question, not a side effect (the issue is explicit).

Sequence is a proposal for review, not a fact. Staging and every explanation line need the independent domain review that #150 already requires (`ISSUE_150_HUMAN_REVIEW.md`), and no lesson text ships before that.

## 6. Pilot B — Signal Flags

Scored boundary unchanged: 12 selected International Code of Signals flags, visual choice.

The reference groups (warnings, vessel state, assistance) are a good way to look things up and a poor way to learn them, because the flags that get confused sit in different groups. Proposed staging follows the confusion sets in `flags.ts` instead:

| # | Stage | Flags | Why |
|---|---|---|---|
| 1 | Serious signals | A, B, O | High consequence and visually distinct, so the first win is easy |
| 2 | Look-alikes I | U, V, W | One confusion set |
| 3 | Look-alikes II | D, F, M | One confusion set |
| 4 | The rest | J, L, Y | J pairs with B, L with M, so the contrast steps revisit stages 1 and 3 |
| 5 | All twelve | mixed checkpoint | Weighted to the five confusion sets |

Each stage: `show` the flag large with its name and practical meaning, `choose` the meaning from four literal flag or meaning tiles, `contrast` within the set, `checkpoint`. The flag artwork and source review remain with #147 / #148.

## 7. What changes in code (outline only)

- **Stage progress** is a new optional per-topic store, for example `stageProgress: { [stageId]: completedAt }`, keyed by deterministic ids. It is formative only. Completing the last required stage sets `completedAt` in the same functional write, the way `withAcquisitionReadiness` does for Morse today.
- **Compatibility is the first risk, and it is a silent-drop risk, not a refusal.** Checked with a test on 2026-10-23: `parseLibrary` does **not** reject an unknown topic field; the topic builder copies known fields only, so an older build parses a library containing `stageProgress`, drops the field, and writes the stripped topic back. Sync pushes topics as raw JSON, and `weigh()` / `covers()` in `syncPlanner.ts` (the "would this lose progress?" check) count only history, evidence, settled lessons and acquisition readiness, so a stripped copy would not be flagged as a conflict. The permanent `completedAt` is stored separately, so a **Learned topic stays Learned**; what can regress on a mixed-version pair of devices is the lesson ticks of a topic still in progress. Mitigation: ship the accept-and-preserve parser, with `stageProgress` added to the sync weight, as its own release first (slice 1a), and only then the writer (slice 1b). The parser header's claim of strictness does not cover topic fields.
- **A stage runner** in `src/features/learn` (the current reading screens stay as Reference). Pure domain functions for the schema, validation and “next step”, so they test like `src/domain/morse/curriculum/lesson.ts`.
- **Test** keeps its engine and results. Its end screen swaps *Practise these* for *Review lessons*, deep-linked to the stage that covers the missed ids.
- **Removing Practice** is an audit first (§8), then redirects. A removed route's old history entries return to the topic page, with no automatic writes.

## 8. Fan-out plan, after approval

| Slice | Who | Needs |
|---|---|---|
| 0. Practice call-site audit and catalog inventory (read-only) | Codex | Done: [`ISSUE_296_AUDITS.md`](ISSUE_296_AUDITS.md). |
| 1a. Step schema, validators and the `stageProgress` parser that **accepts and preserves** the field, with no writer | Claude | Approved (D1-D7). Ships as its own release |
| 1b. Lesson runner and stage-progress writes | Claude | Release 1a out for at least one release on every device |
| 2. Landing page and tray change | Claude | Slice 1b; mockup approved (D7) |
| 3. Radio Procedure content | Codex drafts as data; Claude checks each line against RIC-22; owner/domain review before it ships | Slice 1; #150 review |
| 4. Signal Flags content | Same | Slice 1; #147 / #148 review |
| 5. Practice removal and Test end-screen redirect | Codex implements from the audit; Claude reviews and runs the browser suite | Slices 1-2 |
| 6. Remaining topics | Per inventory, one topic per slice | Pilot sign-off |

Two jobs cannot be fanned out: the visual decisions, and the domain review of any safety or procedure text. Codex's own sandbox cannot run Playwright or commit, so all browser verification and commits stay with Claude, as in earlier waves.

## 9. Owner decisions (approved 2026-10-23)

| | Decision |
|---|---|
| **D1** | **Test-out is allowed.** A learner who already knows a topic can go straight to the Final Test, and a clean result completes the topic exactly as it does today. Completion is therefore lessons *or* one clean Test. |
| **D2** | **The Final Test is always a quiet square node on the path**, never the tray action until the lessons are done; then it becomes the tray action in a quiet fill. |
| **D3** | **About two minutes per lesson, 3-5 items.** Five lessons each for Radio Procedure and Signal Flags (§5-6). |
| **D4** | **The unscored Radio words stay in Reference.** Teaching them would widen the topic, which is a separate Test-boundary decision. |
| **D5** | **Existing learners are never reset.** A topic with `completedAt` shows every lesson done and the Final Test available. A topic in progress keeps its history, starts the path at lesson 1, and shows the Final Test immediately. |
| **D6** | **Topics without lessons keep a clearly marked transitional Test and their reading, now called Reference.** User-authored and imported topics get a guided small-batch recall mode and no custom lessons. No one is stranded. |
| **D7** | **The four mockup frames are approved as drawn.** |

## 10. Verification outline

Domain: schema validation (unique ids, every `choose` has exactly one key, every `order` is a permutation, every text equivalent present), a stage cannot write evidence or history, completion fires once and is permanent, resume after reload, account switch isolation, export/import round trip, old-client read of the new field.
UI: landing path at 320 / 390 / landscape-short / desktop, 200% text, reduced motion, no horizontal overflow, 44 px targets, focus order, `aria-current` on the path.
Browser: first lesson to Learned with no Test, Test-out per D1, a missed Test linking to the right stage, old Practice history entry returning to the topic page.
Content: every Radio and Flags line traced to RIC-22 or the International Code of Signals, with the independent reviewer's sign-off recorded.

## Appendix — what the read-only audits found

Full tables: [`ISSUE_296_AUDITS.md`](ISSUE_296_AUDITS.md).

**Catalog (24 shipped topics, 342 scored items: 241 flip cards, 101 four-way choices, 51 with figures, none with catalog audio).**

| Class | Count | Topics |
|---|---:|---|
| A. Hand-authored stages and independent review | 13 | OODA Loop, Primary Survey, Whole-Circle / Reciprocal Bearings, True & Magnetic North, Grid North & Map Bearings, Navigation Lights & Aspect, Vessel Day Shapes, Signal Flags, Radio Procedure, Marine Calling, Marine Priority Calls, Firearm Safety |
| B. A reusable teaching stage over the existing items is honest | 10 | NATO Alphabet, Compass Bearings, Cloud Genera, CAF Rank Equivalencies, SCUBA Equipment, Radio Numbers, SI Prefixes, Greek Alphabet, Hex to Binary, Beaufort Scale |
| C. Reference only | 0 | None: every topic has useful finite recall |
| D. Own engine | 1 | International Morse Code |

Four of the B topics (Cloud Genera, SCUBA Equipment, Radio Numbers, Beaufort Scale) are B only for their existing scored boundary. Photo identification, equipment use, pronunciation and weather interpretation would be new reviewed content. The seven topics with an open or pending domain review (#147/#148, #150, #132) cannot ship lesson text before that review.

**Practice (about 60 call sites).**

- **Remove:** the tray's Practice tile and its locked state, the standalone `PracticeRun` shell and completion copy, the `practice` branch of `AppRouter`, `hasPractice` / `missedTargets` / `practiceItemCount` as offer logic, and the “N to practise” status copy.
- **Redirect:** the result screen's “Practise N items” offer becomes Review lessons, and Home's wording follows.
- **Keep untouched:** every Morse formative mode, including letter practice, fluency, Send/Copy and the post-Test missed-letter sprint. `src/domain/morse/fluency/focus.ts` imports `practiceTargets`, so that module must not be deleted wholesale.
- **Reuse:** `practiceSession.ts` (queue, revisit gap, feedback) and the reveal and self-grade controls become the `recall` and `checkpoint` steps.
- **No learner data is written by generic Practice.** Only its navigation identity enters browser history, so removing it needs no data migration.
- **History hazard (important):** the `practice` route target is stored in `history.state`. If its validator branch is simply deleted, a reload falls back to Today and the popstate handler treats old entries as foreign. Old Practice entries must be normalized to their topic (or Library if the topic is gone) in both the live and restored paths, without pushing a new entry. Today Practice restores to its origin, which can be Home or Library rather than its topic.
- **Documents to re-banner or archive when slice 5 lands:** `TARGETED_PRACTICE.md`, `PROGRESS_ARCHITECTURE.md`, `NAVIGATION_HISTORY.md`, `TOPIC_PAGE_REVAMP.md`, `ISSUE_225_UI_OVERHAUL.md`, `LEARNING_EXPERIENCE_DESIGN_DECISION.md`, `ARGUS_OVERHAUL_RATIFICATION.md`, `AUDIO_DRILLS_RUNTIME.md`, and two README index lines.
- **Stale comment found:** `TestSession.tsx` says missed items never persist; the Test banks them in `Attempt.missedItemIds`. “Review lessons” relies on exactly that record.
