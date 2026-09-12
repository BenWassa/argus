# Argus screen inventory and consolidation brief

> **Authority status — proposed next programme, not current product behavior.**
> This document contains the next major screen/learning-experience overhaul to be
> revisited and designed before implementation. Its proposed information
> architecture, assessment model and durable state do **not** supersede current
> `PRODUCT.md`, `docs/PROGRESS_ARCHITECTURE.md` or shipped behavior merely by
> appearing here. In particular, badges/achievement state, First Messages, new
> milestone/freshness state, Home/Lessons navigation and removal of Progress are
> unratified proposals. Badge concepts directly conflict with the current
> `PRODUCT.md` anti-gamification contract and require an explicit product decision
> before implementation. #90 may be reshaped or partly superseded by this
> programme; it must not be implemented simply because it remains open.

## Revised direction following owner feedback

This section supersedes the recommendations below. The original inventory remains useful as a description of the implementation, but its retain/reject decisions were too restrictive: distinct learning semantics do not require separate user-facing destinations. This revision is a researched proposal for the next reviewer, not an implemented UI change. No browser walkthrough or usage analytics informed this review; overlap findings come from source inspection.

### Owner preferences

- Keep the splash. It is enjoyable; show it on the first fresh visit, then remember that it was seen across subsequent opens and refreshes.
- Reconsider Today as Home: current learning, a direct way to resume, and useful upcoming lessons/reviews.
- Give lessons one clear home. Progress belongs within relevant pages instead of its own navigation destination.
- Opening Morse should land on its learning stages. The complete alphabet should be a reference reached deliberately.
- Embed assessment in the curated curriculum. Remove the prominent Learn-versus-Test choice. Place an always-available full assessment at the end of the path.

These preferences set the direction for the next design programme, not a ratified production contract. Exact layout, assessment semantics, migration/state changes and any conflict with current product principles must be resolved explicitly before implementation.

## Proposed overhaul scope requiring ratification: Morse milestones and independent use

### Proposed core decision

**Independent use is the milestone.** Cue fading stays inside Learning as an adaptive aid to reach independence; it is never a compulsory gate before an assessment can demonstrate independent ability. Assessment prompts begin uncued. When a learner asks for or needs help, the attempt continues as useful practice, while the recorded response is marked assisted and cannot count as independent evidence.

Speed is captured from the first release, but does not decide an initial achievement. It becomes a later progression axis once observed learner performance gives the product a basis for fair criteria.

### Milestone model

| Milestone | Independent demonstration | Initial release | Notes |
|---|---|---:|---|
| Letter foundations | Recognize and produce A–Z independently, with no speed requirement | Yes | Keep letter-level, per-direction evidence; recognition/receiving does not imply production/sending, or vice versa. |
| First messages | Handle short unfamiliar words and simple sentences without cues, at the learner's own pace | Yes | Finish with a practical message challenge; sentence success never substitutes for letter-level coverage because context can supply a missing character. |
| Building fluency | Handle longer, varied messages with consistent accuracy and progressively less hesitation | Later | Store timing now; defer speed tiers, formal criteria and advanced badges until use data exists. |

The proposal currently suggests that an achievement badge record a milestone once earned, while later practice/retention describe freshness. **This is not ratified production behavior:** current `PRODUCT.md` explicitly rejects badges/gamification, so this concept must be reconsidered or separately approved before any state/schema/UI implementation.

### Assessment rules

1. **Learning flow:** present lessons, adaptive cue fading, replays and formative word checkpoints. These help the learner become independent and may record formative state, but they do not award an independent milestone.
2. **Uncued checks:** begin with no answer-bearing aid. Record accuracy, response timing, direction and whether assistance was used.
3. **Assistance:** make help available when the learner is stuck. Continue the check as practice and show the answer/support, but mark that response as assisted. It may guide targeted practice but cannot satisfy independent evidence.
4. **Letter evidence:** check A–Z coverage in short uncued checks rather than one exhausting 52-response finale. A letter must retain its own independent evidence in each required direction.
5. **Message evidence:** use short unfamiliar words and simple sentences as a separate practical challenge. It demonstrates use in context, but does not fill a missing letter-evidence requirement.
6. **Remediation:** a missed letter or direction routes to targeted practice. It must not force a repeat of a whole completed lesson.
7. **Retention:** scheduled checks sample previously learned letters and occasional short messages. Weak or stale areas expand into targeted practice. Retention changes current readiness, not the achievement badge.

### User-facing screen scope

The initial Morse experience needs four reusable screen families. Beginner and later curricula share the families and differ only in content, criteria and presentation.

| Screen family | Job | Initial content |
|---|---|---|
| Milestone overview | Show the learner's current position, next meaningful action, earned badges and freshness | Letter foundations and First messages; direct resume/start action; alphabet reference link |
| Uncued check | Ask one clear letter or message prompt, capture a response and offer deliberate help | Short letter-coverage checks, receiving/production directions, short message challenge |
| Results and targeted practice | Explain what was demonstrated, what remains, and the smallest useful next practice | Missed letters/directions, assisted answers, next check or practical message challenge |
| Retention check | Run a compact scheduled sample and route any weak areas back to practice | Previously demonstrated letters plus occasional short messages |

The full Alphabet remains a secondary reference screen, entered deliberately from the milestone overview or active learning. It returns to the invoking course/task. The active lesson and the reference must not discard a resumable lesson state.

### Information architecture target

Primary navigation contains **Home** and **Lessons**.

| Destination | Purpose | Included progress |
|---|---|---|
| Home | Resume current work, show due retention checks and show other active learning | Current milestone, current lesson/sitting, next review, current readiness |
| Lessons | Browse/search the whole collection and open a course | Per-topic milestone/status, completed achievement record, authoring and capture actions |

Morse opens to its milestone/course overview, with the learning path as the main content. The standalone Progress destination is removed. Data remains easy to find as a clearly labelled utility entry, rather than equal-weight daily navigation.

Ordinary finite-reference topics use the same Home and Lessons structure without pretending to be a multi-stage Morse course. Their topic page contains reading support, independent checks, targeted practice and retention status as appropriate to the topic.

### Initial delivery boundary

The proposal currently groups these for a possible first delivery; none is authorized for implementation by this document alone:

- Persistent first-visit splash preference, independent of library data.
- Home and Lessons navigation, with current Today/Library content reorganized around the new responsibilities.
- Morse milestone overview for Letter foundations and First messages.
- Uncued letter checks, split across short sessions, with per-direction evidence and optional assisted practice.
- A small uncued practical message challenge for First messages.
- Results/targeted-practice and scheduled retention-check flows.
- Durable badges, freshness/readiness display and capture of accuracy, timing, direction and assistance.
- Browser Back, focus restoration, reduced-motion and local export/import support for all new durable state.

Defer these deliberately:

- Formal speed thresholds, fluency tiers and advanced badges.
- Long-message or high-speed curriculum.
- Treating contextual message success as a substitute for letter coverage.
- Any migration that converts older formative lesson/checkpoint answers into independent assessment evidence.

### Implementation workstreams

| Order | Workstream | Scope and dependencies |
|---:|---|---|
| 1 | Product/state contract | Define milestone, badge, independent evidence, assistance and freshness types. Advance the storage version with a conservative migration: existing history remains history, but no legacy formative answer becomes independent evidence. |
| 2 | Assessment engine | Create uncued letter and message check builders; record direction, accuracy, latency and assistance; derive targeted practice and retention samples. Keep it independent from visual components. |
| 3 | Navigation and shell | Replace Today/Library/Progress navigation with Home/Lessons; preserve route restoration and destructive-action safeguards; make splash dismissal persistent. |
| 4 | Course and practice UI | Build milestone overview, check, result/targeted-practice and retention screen families. Reuse the Morse key, audio and accessibility primitives where their semantics fit. |
| 5 | Content | Author the first-message corpus and challenge criteria, ensuring messages are unfamiliar and all required characters/content claims are explicit. |
| 6 | Verification | Unit-test evidence/assistance/retention derivations; browser-test Home resume, help-in-check, targeted remediation, reference return, delayed review, export/import and keyboard/mobile flows. |

### Acceptance criteria for the first release

- A learner can enter Morse, see Letter foundations and First messages, and resume the exact current lesson or practice task.
- A learner can attempt an uncued letter check before finishing cue-fading practice; only unaided correct responses count toward the independent milestone.
- Sending and receiving evidence remain separate in the UI and persisted state.
- A completed message challenge cannot hide missing letter coverage.
- A miss creates a focused practice route; it never restarts the whole curriculum.
- An earned milestone badge remains visible after later weak retention performance, while current readiness explains the need to review.
- A due review is reachable from Home without locating the final assessment inside the course.
- The alphabet reference returns to the calling milestone or lesson without discarding its saved state.
- A first visit shows the splash once per browser/device storage; refreshing or reopening does not replay it unless site storage is cleared.
- Export/import preserves milestone, evidence, badge and freshness state.

### What other learning apps demonstrate

| Example and source | Documented structure | Relevant lesson for Argus |
|---|---|---|
| [Duolingo home-path redesign](https://blog.duolingo.com/new-duolingo-home-screen-design/) | Its 2022 redesign ordered learning and practice in one path, incorporated stories into that sequence and put reference tips in unit guidebooks. Completed lessons remained revisitable. | Let the curriculum choose the next activity; keep reference available beside the path. This is a documented design precedent, not a claim that every current screen is unchanged. |
| [Babbel learning-path architecture](https://www.babbel.com/en/magazine/from-old-school-structure-to-learning-for-real-life-situations) and [course structure](https://support.babbel.com/hc/en-gb/articles/205600448-Babbel-courses) | Home brings together current learning and other relevant activities; Today and the learning plan offer different views of the same path. Units include lessons and recap. | Home should summarize the learner's active work; the course page should show the full sequence. Review can be a curriculum activity. |
| [Khan Academy Mastery Challenges](https://support.khanacademy.org/hc/en-us/articles/360037494231-What-are-Mastery-Challenges) and [example course](https://www.khanacademy.org/get-ready-for-sat-prep-math) | Personalized review challenges appear on course pages when eligible. Course content includes unit tests and a course-wide challenge. | Place assessment at an appropriate scope within the course, and bring eligible review back to the learner. |

These sources show workable patterns, not evidence that a particular number of tabs is optimal. The inference for Argus is to organize navigation around continuing and finding learning, with progress and assessment attached to that learning.

### Proposed structure: two primary destinations

| Destination | Responsibility | What moves here |
|---|---|---|
| Home | Resume current learning directly; surface a due retention check; show other active topics and brief relevant progress | Today's scheduling logic, resumable lesson entry and selected progress information |
| Lessons | Browse/search all topics, including completed ones; choose a topic to open its course page | Library browsing, collection management and a quiet completion summary/filter |

Data remains accessible through a clearly labelled utility entry. Topic editing and idea capture remain available from Lessons. Neither needs equal weight with daily learning navigation. “Lessons” is a proposed label: test whether it adequately describes a collection of topics/courses as well as individual lessons.

Morse course structure:

1. Course header: title, concise scope, contextual progress and a secondary Alphabet reference link.
2. Current lesson and curriculum path as the main content. Home's Resume can enter the saved task directly; opening the course from Lessons lands on the path.
3. Lesson and checkpoint activities inside the same course flow, with consistent exit behavior.
4. Full A–Z assessment as the final path entry, visible and available even before reaching it. Explain early-attempt consequences when invoked, rather than displaying a standing second mode choice everywhere.
5. Later retention checks surfaced on Home when due and reflected on the course page.

The alphabet reference may remain a dedicated child page. That fits the owner's proposal and keeps a long lookup readable. Removing it solely to reduce the route count is unnecessary. It should return to the invoking course/activity, preserving a resumable lesson. Currently `App.openReference` leaves the Learn run and routes reference Back to Topic, so this requires deliberate navigation work.

Ordinary topics need a lighter version of the course structure: read the reference/briefing, complete a recall activity, return for scheduled recall. Do not manufacture thirteen lessons for content that needs one reading. Scope, reference/support, history and administration can live within that topic page with progressive disclosure.

Progress should be specific: lesson position, letters learned, next review date, assessment evidence or completion date. Removing the Progress page does not require inventing an overall percentage or discarding completion history. A completed filter/record within Lessons preserves that history.

### Assessment decision that needs explicit resolution

The owner is right that the learner is already answering questions within the curriculum. However, the implementation treats those answers differently:

| Activity | Current effect |
|---|---|
| Canonical Morse lesson | Saves formative acquisition and sitting state |
| Replay and word checkpoint | Saves no learner, formal evidence or retention state |
| Test | Saves formal cue/directional evidence and complete-topic attempt history; eligible results affect retention |

Therefore removing the Test entry point is straightforward conceptually; replacing its evidence with checkpoint answers is a curriculum/data-model change. Current word checkpoints after lessons 4 and 7 cover selected letters in words and do not establish full A–Z recall in both printed directions.

There is another issue to resolve before calling the final path entry a full assessment: the current Test starts at supported cue levels unless its separate evidence store has advanced. Finishing Learn does not automatically make Test an uncued examination. Simply relocating its button would expose an unexpected second support progression at the end of the course.

Recommended proposal for review: retain the existing distinctions in stored evidence, but design a clear final assessment contract. Decide whether it directly checks all letters without support in both directions, how missed material returns to learning, and what counts as an early diagnostic versus delayed retention evidence. Treat 26 logical items and potentially 52 directional responses as different counts. Do not silently migrate formative checkpoint results into formal evidence.

The always-available end assessment should allow the owner to try it early. Its location at the bottom describes curriculum order, not an unlock condition. Due retention checks should still be directly accessible from Home; the learner should not scroll to the bottom whenever the schedule asks for one.

### Splash clarification

The implementation uses `sessionStorage`, which ordinarily survives a refresh of the same tab but can reset with a new browsing session. The requested behavior calls for a persistent local seen flag, written when the intro finishes or is skipped. On this local-first app, “first visit” means per browser/device storage, not globally per person. Clearing site data can make it appear again. Keep this preference separate from library import/reset. This brief records the change; it has not changed the splash code.

### Replacement task for the next reviewer

> Design Argus around two primary destinations, Home and Lessons, using the owner's preferences and source inventory in this document. Home resumes active learning and surfaces due recall; Lessons browses the collection. Opening Morse lands on its curriculum path, with the alphabet as a secondary reference page. Put progress within Home, course pages and collection rows; retain completion history within Lessons. Remove the prominent Learn/Test mode choice and locate an always-available full assessment at the end of the curriculum, with due retention checks accessible from Home. Keep the splash for the first fresh visit using a persistent seen flag. Produce a proposed navigation map, mobile page outlines, concrete before/after journeys and a phased implementation plan. Explicitly resolve the assessment contract: today's word checkpoints save no formal evidence, and today's Test has a separate support-fading ladder, so moving its button alone does not create a final uncued assessment. Distinguish UI reorganization from changes to learning/evidence semantics, specify early diagnostic behavior and delayed recall, and cover ordinary reference-based topics as well as Morse. Use the learning-app sources above as precedents. Treat the earlier recommendations below as superseded hypotheses, not constraints. Deliver the design decision before implementing the broad redesign.

---

Reviewed: 2026-09-11  
Scope: implemented React UI in `src/app`, `src/features`, and `src/components`; this is a product-architecture review, not a visual-polish review.

## Executive finding

Argus is not literally a large routed application. It has **8 route-level screen types**, **13 full-screen screen archetypes** when nested Morse flows and the launch splash are included, and **6 overlay variants**. The feeling of “too many screens” comes chiefly from the Morse curriculum's many terminal and transition states, plus duplicated topic/reference material across Today, Library, Topic and Learn.

The app's screen model is defensible where a surface changes the learner's task, response mechanism, persistence semantics or consequence. It is least defensible where it repeats the same topic reference or same next-action status without adding a distinct job.

The strongest consolidation candidates are:

1. Remove the launch splash, which is a 6.5-second optional full-screen interruption before the task-first home screen.
2. Decide whether ordinary-topic Learn needs a separate full-screen reading route when Topic already contains the same scope and a collapsible full reference.
3. Collapse the standalone Morse reference into a temporary panel/drawer from the Morse programme, because it renders the same `MorseReferenceCards` component already embedded in the Morse Topic page.
4. Re-evaluate Progress as a separate navigation destination versus a review section of Library. Its data is intentionally derived from the same `journeyFor` state Library already groups and displays.

The Morse programme, lesson, replay and checkpoint should **not** be merged merely to reduce a count. They demand different input, scoring/persistence and exit semantics. They can share a flow shell, but they are not redundant product jobs.

## Counting method

The word “screen” is ambiguous, so this review uses three distinct counts.

| Layer | Count | What is counted |
|---|---:|---|
| Router screen types | 8 | Each visual type reachable through `AppRoute`: 4 sections, Topic, Learn run, Test run, Morse reference |
| Full-screen archetypes | 13 | Router types plus nested Morse programme, lesson, replay, checkpoint, and the optional splash |
| Overlay variants | 6 | Topic form, dirty-form discard, inbox capture, topic-delete confirmation, import confirmation, reset confirmation |

There are also **30+ conditional visual configurations**. These are deliberately not added to the screen total because “a card revealed” and “a card asking” are states within the same Test task, not independently navigable pages.

### Route-level count: 8

`src/lib/navigation.ts` models four route categories. Expanded into visual types, they are:

1. **Today** section
2. **Library** section
3. **Progress** section
4. **Data** section
5. **Topic** detail
6. **Learn** run
7. **Test** run
8. **Morse reference**

Only section, Topic and reference state can be restored meaningfully after traversal. A Learn or Test run intentionally falls back to its origin on reload/Forward, so it should be treated as an active task, not durable navigation content.

### Full-screen archetype count: 13

| # | Surface | Route / owner | Primary job | Why it is distinct |
|---:|---|---|---|---|
| 1 | Launch splash | `SplashScreen` | Brand/intro | Optional first-session gate, no library task |
| 2 | Today | section | Do the next scheduled thing | Agenda and batch launcher |
| 3 | Library | section | Find, author and administer topics | Inventory, search, filters and selection |
| 4 | Topic | child route | Understand one topic and choose a mode | Scope, separate status dimensions, history and administration |
| 5 | Progress | section | Review the portfolio of work | Cross-topic state and permanent completion record, no run controls |
| 6 | Data | section | Export, import and reset the local library | Ownership/recovery actions |
| 7 | Ordinary Learn sheet | Learn run | Read complete reference/support | Unscored, answer-visible editorial reading |
| 8 | Test session | Test run | Recall and score every item | Answer-hidden recall with grading consequences |
| 9 | Morse reference | reference route | Look up letter/pattern/mnemonic/audio | Explicitly non-progressing lookup |
| 10 | Morse programme | nested inside Learn | Choose/continue a lesson path | A–Z curriculum map, locked/unlocked/replayable lessons |
| 11 | Morse lesson | nested inside programme | Acquire two letters through guided retrieval | Writes formative lesson state, can include audio/listening/keyed entry |
| 12 | Morse replay | nested inside programme | Refresh an unlocked packet | Deliberately ephemeral, cannot write learner state |
| 13 | Morse word checkpoint | nested inside programme/lesson | Apply letters in words | Deliberately formative and ephemeral, keyed word context |

## Per-view inventory

### Today

**Job:** answer “what should I do next, and why?” then launch it.

**Mutually exclusive macro states (4):**

| State | Trigger | Content/action |
|---|---|---|
| No library | `topics.length === 0` | Explains finishable topics; creates first topic |
| Nothing runnable | Topics have no items | Routes to Library to add items |
| Nothing due | Schedule is holding all runnable topics | “Coming up” list and optional early Test |
| Work due | At least one journey entry is due | Due list, one primary batch Learn/Test action, optional other group |

**Overlaps:**

- Shows topic title, item count, schedule reason and an immediate Learn/Test action, all of which Library rows also show.
- Its unique value is priority and batch execution. It does not support searching, filtering, topic inspection or authoring.

**Assessment:** retain as the default mobile/home view. It is the clearest expression of the stated job-to-be-done. Reduce duplicated explanation/copy before removing it.

### Library

**Job:** maintain and browse the complete owned collection.

**Macro states/configurations:**

- Empty library, with first-topic and example-topic entry points.
- Populated shelf browse, grouped by derived journey phase.
- Search/track filtering and no-results state.
- Batch selection and batch Test launcher.
- Optional “Want to learn” inbox in loading, signed-out, unauthorized, empty, populated and error conditions.
- Topic detail is mounted in this section but represented by its own history route.

**Overlaps:**

- With Today: same derived next action, schedule language, item counts and topic labels.
- With Progress: same derived journey phases, including waiting, repair and acquisition detail.
- With Topic: title, scope/status and run entry points, although Topic adds the complete per-topic explanation/history.

**Unique value:** discoverability, filters, bulk selection, editing, deletion and capture. This is the necessary “library” surface even if some review content moves elsewhere.

**Assessment:** retain. It is overloaded, however: collection browsing, authoring, inbox review, batch testing and an embedded detail flow coexist here. The first design question is whether Progress and Data belong in this information architecture, not whether Library itself should disappear.

### Topic

**Job:** orient the learner to one finite competency and make an informed Learn/Test choice.

**Content:** scope statement, status, schedule, acquisition/evidence/current-sitting facts for progressive topics, two mode choices, reference/items, history and quiet edit/delete actions.

**Overlaps:**

- With ordinary Learn: Topic repeats title, scope and all finite items via “Show all items”; Learn repeats title, scope and all finite items in an editorial reading sheet.
- With Library row: repeats current action and status in substantially more detail.
- With Progress: repeats individual progress dimensions and completion date.

**Unique value:** the one place where acquisition, evidence, retention, current sitting and administrative history are deliberately separated rather than summarized. It also provides a safe, explicit place to choose between unscored Learn and scored Test.

**Assessment:** retain as a detail view. Its direct duplication with ordinary Learn is the most credible route-reduction opportunity after the splash.

### Progress

**Job:** review the whole portfolio, not start work.

**Conditional sections:** empty library; In progress; Waiting; Repair; unfinished-authoring aside; completion record; per-track completion totals. Each section is omitted when empty.

**Overlaps:**

- Library already groups the same topics into journey shelves and displays schedule/status detail.
- Topic shows the more granular per-topic facts and test history.
- Today is the action-oriented projection of the same data.

**Unique value:** portfolio-level completion record and a deliberately non-actionable, no-dashboard review mode. `PRODUCT.md` explicitly describes it as a review surface rather than a dashboard.

**Assessment:** valid but the weakest persistent navigation destination. A future design should test whether “Review” can be a Library subview/segmented mode while preserving a calm, non-actionable completion record. Do not merge it by simply adding more cards to Library.

### Data

**Job:** keep the owner in control of local data.

**States:** default export/import/reset surface; validation feedback; conditional shipped-catalog notice; import-replace confirmation; reset confirmation.

**Overlaps:** no functional duplicate. Its low-frequency utility creates navigation cost, not content duplication.

**Unique value:** export/import is a named product principle, not an incidental setting. The user needs a clear recovery/portability path.

**Assessment:** retain the capability. Its placement is a legitimate IA question: dedicated nav item versus a clearly labelled Library utility panel. Moving it to an obscure settings menu would violate the product contract.

### Ordinary Learn

**Job:** read all material openly, without scoring or concealment.

**States:** valid multi-topic reading sheet; “Nothing to read” fallback if the target topic vanished. The Morse topic uses a different branch and opens the Morse programme instead.

**Overlaps:** strong overlap with Topic for ordinary topics. Both show title, scope, item count and all prompt/answer mappings. Learn adds optional structured briefing content and enables a multi-topic read run with one “Test me” footer.

**Unique value:** reading is deliberately distinct from card-like recall, and structured support belongs in an editorial, answer-visible treatment. The design must preserve that distinction even if the route is removed.

**Assessment:** investigate consolidation for ordinary topics only. A viable direction is a Topic “Read reference” mode/section that expands the complete reference and structured support in the same editorial treatment, then starts Test. Keep the multi-topic use case explicitly in scope before deciding.

### Test

**Job:** conduct the only scored recall interaction.

**Macro states:** no runnable cards; ordinary card asking/revealed/exiting; progressive Morse card; early-exit confirmation; completion/result summary. The ordinary card can use a swipe-first or button-first grading presentation depending on content.

**Overlaps:** visually related to Learn only at the topic level. It is not functionally redundant: answers are structurally concealed until reveal, grading writes history/evidence, and a full-topic attempt is required to bank a result.

**Assessment:** retain as a dedicated immersive task. Do not merge into Topic or Learn.

### Morse reference

**Job:** fast, unscored A–Z lookup with optional audio.

**States:** complete alphabet plus optional audio-error state.

**Overlaps:** exact component-level duplication with the reference embedded in the Morse Topic page. Both use `MorseReferenceCards`; the standalone view adds a session bar, explanation and footer. The programme can also open it from Learn.

**Unique value:** lets a learner consult the alphabet without navigating to Topic and without changing progress.

**Assessment:** strongest content duplication. Preserve the lookup function, but test a context panel/drawer or an in-flow reference layer opened from the programme/lesson instead of a separate screen route. A full route may still be justified if the reference needs long independent browsing or shareable/deep-linkable access, neither of which the current app establishes.

### Morse programme, lesson, replay and checkpoint

These form one curriculum family but four different tasks:

| Surface | Input and persistence | Why it should remain distinct |
|---|---|---|
| Programme | Path navigation, starts/continues/replays; no separate progress model | Chooses where to work and explains locked/current/unlocked sequence |
| Lesson | Introduce, visual keyed production or listening choice; writes formative lesson/sitting state | Active acquisition with a finite sitting budget |
| Replay | Visual keyed retrieval only; writes no learner/scheduler/evidence state | Safe refresher for previously unlocked material |
| Checkpoint | Keyed application in word context; writes no saved state | Formative transfer/application without claiming formal progress |

Morse Lesson itself has multiple state layouts: introduction, visual retrieval, listening retrieval, feedback, packet transition, sitting end, all-letters endpoint, checkpoint invitation and automatic checkpoint handoff. These are task states inside one active learning flow, not independent IA destinations.

**Assessment:** preserve the semantic distinction. If visual simplification is desired, introduce one shared “Morse flow” shell with a stable header/progress/close affordance and render these as internal steps. That reduces perceived fragmentation without falsely collapsing their rules.

## Overlay inventory: 6 variants

| Overlay | Invocation | Appropriate as overlay? | Note |
|---|---|---|---|
| New/Edit topic form | Library or Topic | Yes | Short administrative task, focus-managed |
| Discard unsaved topic edits | Inside topic form | Yes | Guards typed work |
| Want to learn capture | Library | Yes | One-field idea capture, intentionally not a topic |
| Delete topic confirmation | Library/Topic | Yes | Destructive action |
| Replace-library import confirmation | Data | Yes | Destructive action |
| Reset-library confirmation | Data | Yes | Destructive action |

These are not evidence of excessive information architecture. They are mostly safeguards and short tasks, and the shared `Dialog` handles focus and browser Back consistently.

## Overlap map

| Shared information / action | Today | Library | Topic | Progress | Learn | Test | Morse reference |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Derived “next action” / schedule reason | Yes | Yes | Yes | Yes, descriptive | No | Executes it | No |
| Topic title / count / track | Yes | Yes | Yes | Yes | Yes | Yes | Morse only |
| Scope / finite boundary | No | Search only | Yes | No | Yes | Implicit in deck | Morse only |
| Full prompt/answer reference | No | No | Yes, folded | No | Yes | Answer hidden | Yes, Morse only |
| Test history / completion | No | Indirect | Yes | Portfolio-level | No | Creates it | No |
| Authoring / data management | Launches Library | Yes | Edit/delete | No | No | No | No |
| Direct run action | Yes | Yes | Yes | No by design | Test footer | Active task | No |

The two highest-overlap pairs are **Topic ↔ ordinary Learn** (same topic reference) and **Library ↔ Progress** (same cross-topic journey data). **Today ↔ Library** overlaps intentionally but serves a useful agenda-versus-inventory split.

## Decision matrix for a follow-up redesign

| Candidate | Potential reduction | Main benefit | Principal risk / invariant to preserve | Suggested disposition |
|---|---:|---|---|---|
| Remove splash | 1 archetype | App opens directly to the next task; eliminates a 6.5-second first-session delay | None to learning semantics; retain reduced-motion respect if any replacement exists | Strong candidate |
| Merge ordinary Learn into Topic | 1 archetype for ordinary topics | Removes duplicated title/scope/reference; fewer transitions | Learn must remain answer-visible, editorial and unscored; support multi-topic Learn or consciously remove it | Investigate with prototype |
| Make Morse reference contextual | 1 archetype/route | Removes exact duplicated listing while preserving lookup | Reference must remain non-progressing and usable mid-lesson | Strong candidate for prototype |
| Fold Progress into Library review mode | 1 persistent nav destination | Fewer top-level nav options; one collection home | Preserve separate portfolio reading, completion record and no-action intent; avoid turning Library into a dashboard | Research/test before choosing |
| Fold Data into Library utilities | 1 persistent nav destination | Fewer top-level nav options | Export/import must stay first-class and easy to find | Optional, lower priority |
| Merge programme/lesson/replay/checkpoint | Superficial only | Fewer labels/routes | Would blur different task/input/persistence rules | Reject as a screen-count-only change |
| Remove Topic detail | 1 archetype | Fewer drill-ins | Loses the only clear per-topic orientation, history and intentional mode choice | Reject |
| Merge Test into another screen | Superficial only | Fewer transitions | Breaks answer confidentiality and task focus | Reject |

## Product constraints that the next reviewer must preserve

- There are exactly two user-facing learning interactions: **Learn** (ungraded exposure) and **Test** (scored recall). Their visual treatment must not imply the same thing.
- A finite `scope` plus scored `items` is the completion boundary. Learn support cannot silently become testable material.
- Acquisition, formal evidence, retention and current sitting are distinct. Do not introduce a single progress percentage.
- Today, Library, Topic and Progress intentionally read one shared derived journey so they cannot contradict each other about the next action.
- Morse has more state because it is a progressive acquisition programme. Formative Learn, replay and checkpoints must not accidentally claim scheduler/retention evidence.
- Export/import remains first-class and local-first. The optional inbox must stay outside learning state.
- Preserve focus management, 44px primary targets, reduced motion and the Test answer-confidentiality guarantees.

## Recommended next task

Do not start by implementing a large navigation rewrite. First make a **screen-consolidation decision brief with two low-risk prototypes**:

1. Remove or bypass the launch splash so Today is immediately available.
2. Prototype one of these, preferably on the ordinary-topic flow:
   - Topic page with an explicit editorial “Read reference” section replacing the separate ordinary Learn sheet, or
   - Morse programme with an in-context reference panel replacing the standalone Morse reference route.

Evaluate each prototype against a fixed journey: open app → identify due topic → understand its boundary → Learn/read → Test → return → review status. Also test Library authoring, batch Learn/Test, mid-lesson Morse lookup, browser Back, keyboard focus, and phone/desktop layouts.

Only after that prototype decision should the team decide whether Progress or Data needs navigation consolidation. Those changes alter information architecture, whereas splash removal and one content-duplication prototype produce clearer evidence quickly.

## Paste-ready prompt for a follow-up design reviewer

> Review `docs/SCREEN_INVENTORY_REVIEW.md`, `PRODUCT.md`, `DESIGN.md`, `src/app/App.tsx`, and the named feature components before proposing changes. Argus is a personal, mobile-first finite-skill library. Its central home job is “show what is due, do the one scheduled thing, leave.” We suspect the app feels fragmented despite having only 8 router-level screen types and 13 full-screen archetypes. Produce a decision, not a generic critique: (1) which of the five consolidation candidates should be accepted, rejected or prototyped first; (2) a before/after navigation and screen map; (3) the exact user journeys that improve or worsen; (4) an MVP implementation plan with file-level changes; and (5) a verification plan. Preserve Learn versus Test semantics, finite completion boundaries, no aggregate progress score, local-first data ownership, focus/back behavior, and the Morse programme's formative-versus-formal evidence boundaries. Do not recommend merging screens solely because they look similar; distinguish duplicate content from distinct task/persistence semantics.

## Evidence consulted

- `PRODUCT.md` for users, primary job, Learn/Test contract, progress and data-ownership principles.
- `DESIGN.md` for task-first product design rules and the explicit ban on page-load sequences.
- `src/app/App.tsx` and `src/lib/navigation.ts` for route model and history behavior.
- `src/features/today/Today.tsx`, `library/Library.tsx`, `library/TopicPage.tsx`, `progress/Progress.tsx`, and `data/Data.tsx` for section responsibilities.
- `src/features/learn/*` and `src/features/test/*` for full-screen task flows and state boundaries.
- `docs/PROGRAMME.md` and `docs/PROGRESS_ARCHITECTURE.md` for current learning/progress authority.
