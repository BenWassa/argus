# Redesign input audit

> **Status:** Current factual input package for design synthesis. Navigation and source paths were revalidated 2026-09-17 during the upgrade reconciliation; deployment observations and test counts below retain their dated audit context. This document records the product and unresolved boundaries. It does not approve further architecture or implementation.

## Repository and verification baseline

- Local `main` is one documentation-housekeeping commit ahead of `origin/main`; the only pre-existing untracked path at audit time was `.claude/` (this audit file is itself being recorded as an untracked audit artifact).
- The remote has `main` and `issue-93-firebase-progress-sync-scope`; PR #94 is open against `main`. Issue #12 is closed.
- GitHub Actions run 34770673109 succeeded for deployed SHA `bc0cf14`. GitHub Pages serves <https://benwassa.github.io/argus/> over HTTPS and returned HTTP 200 during the audit.
- Current local verification passed 598 unit/component tests, the production build, and 168 applicable Playwright tests; four viewport-inapplicable tests were skipped. The authoritative browser result is the stable one-worker rerun. An earlier parallel run lost its preview server during a concurrent commit and is not application evidence.
- Vite reports two JavaScript chunks larger than 500 kB.

The original requested foundation is no longer true: there is more than one remote branch and PR #94 is open.

## Current screen and route inventory

Argus uses one document URL and serializes its internal route in `history.state`. The route controller is `src/app/routing/AppRouter.tsx`; route validation and equality live in `src/app/routing/routes.ts`.

### Durable destinations

1. **Today** is the root. It covers the empty-library primer, topics with no items, nothing-due/coming-up state, and the due docket. Work is labelled as lessons, readings, or Tests. Ordinary reading opens a Topic; Morse acquisition launches the current lesson; scored work launches Test.
2. **Library** owns search, track filters, journey shelves, row actions, multi-topic Test selection, inbox/capture entry, and the permanent Completion record.
3. **Topic** is a durable Library child. An ordinary runnable Topic visibly contains its briefing/reference and opening it records initial exposure. It presents a compact state line, one derived primary action, attempt history, completion note, and authoring controls.
4. **Morse Topic/curriculum** replaces the former programme hub. It shows the 13-lesson path, checkpoints after lessons 4 and 7, replayable completed lessons, an A-Z Test step, and a separate alphabet-reference link.
5. **Profile** is a durable Today child, not a primary navigation destination. It owns account and sync state, export, validated import/replace, reset, and catalog-delivery status. Historical `data` routes resolve here for compatibility.

There is no standalone Progress destination and no generic full-screen Learn screen. Progress is distributed across Today, Library shelves/rows, Topic state, Test summaries, and Library's permanent Completion record.

### Task and reference surfaces

6. **Canonical Morse lesson:** full-screen, resumable lesson containing introduction, visual/keyed production, formative listening, feedback, sitting/lesson completion, and checkpoint handoff.
7. **Morse replay:** bounded formative retrieval; no Test or scheduler mutation.
8. **Morse checkpoint:** formative word-character keying; no durable checkpoint completion or formal evidence.
9. **Test/Session:** full-screen progressive Morse or generic reveal-and-grade assessment, with partial-exit protection and completion/banking summary.
10. **Morse alphabet reference:** standalone, non-mutating 26-character lookup. When opened over a canonical lesson, Back reconstructs the lesson from durable sitting state.
11. **Splash:** persistent first-visit overlay with video/poster, reduced-motion fallback, Skip/Escape/error completion, and focus restoration.
12. **Transient surfaces:** New/Edit Topic, nested discard confirmation, Delete, capture/inbox states, import/reset confirmation, End Test confirmation, and lesson feedback/invitations.

### History, focus, and resume

- Today seeds the root with `replaceState`; Back from the root remains browser-owned.
- Re-selecting the current section adds no entry. Library navigation while Topic is open, or Today navigation while Profile is open, reuses Back.
- Missing Topic routes fall back to Library; on initial restoration, malformed or obsolete Progress routes normalize to Today.
- Test, replay, and checkpoint entries do not resume after reload. A canonical lesson may resume because `lessonSitting` is durable.
- Partial Tests and dirty forms register newest-first Back blockers.
- Section traversal focuses main; Topic entry focuses its heading; Topic close restores the originating Library row where possible; dialogs trap and restore focus.
- Opening an ordinary runnable Topic is now a state-changing exposure event, not purely read-only navigation; opening the Morse curriculum is not.

### Responsive structure

- Mobile uses a fixed two-tab bottom navigation; desktop uses a left rail from approximately 980 px.
- Dialogs are bottom sheets on mobile and centered on desktop.
- Sessions omit the app shell and use dedicated phone/short-landscape layouts.
- Morse path rows collapse at narrow widths; reference cards move from one to two columns and include narrow/200%-text handling.
- Reduced-motion styling removes decoration without removing response-state gates.

## Learning and state dependency map

```text
ordinary Topic opened
-> status/learningAt exposure write, with no Attempt
-> journey derives reading/Test timing and shelf
-> Today, Library and Topic show status/next action
-> Test becomes scheduled after the learning gap
```

```text
Morse lesson response
-> lessonProgress ladder (taught -> cued -> solo -> settled)
-> acquisition position/current lesson/readiness derived
-> Topic curriculum and Today show Lesson N/resume
-> final settlement writes permanent acquisitionReadyAt
-> delayed Test becomes the next scheduled action
```

```text
visual or formative listening retrieval
-> lessonSitting retrieval count, correctness, revisit IDs and listening suppression
-> visible current-sitting/resume state
-> next lesson activity
```

Lesson and checkpoint activity cannot create formal Test evidence or retention history.

```text
Test begins after acquisition readiness
-> untested items receive an ephemeral unsupported baseline
-> stable first-run split exercises both printed directions
-> later selection favors missing/weaker direction
-> baseline selection writes no evidence
```

```text
Test response
-> cue and per-direction attempts/correct/latency/unassisted evidence
-> separate current-attempt testimony ledger
-> complete + unassisted + required-direction qualification
-> scheduler resolution
-> Today/Library/Topic status and permanent completion record
```

```text
fully correct but direction-incomplete Test
-> attempt and lastTestedAt recorded
-> advancementEligible=false
-> no failure, demotion, or clock reset
-> completion copy reports progress without claiming advancement
```

```text
export/import/load
-> version-5 library JSON and strict validation
-> legacy v2-v4 normalization with stable IDs and conservative defaults
-> orphan/deleted item state pruned
-> visible journey/status re-derived
```

Retention remains generic: early Tests record history without moving the clock; clean due work advances learning/decayed to drilled; a clean delayed Test can produce permanent completion; later failure routes repair without deleting `completedAt`.

## Issue #90 reconciliation

Issue #90 remains open. Its historical baseline is partly obsolete after the v0.2.0 learning-experience release.

| Requirement | Current classification |
| --- | --- |
| Separate acquisition, sitting, Test evidence, directional evidence, formative auditory work, and retention | Architectural invariant preserved |
| Item-aware deterministic priority scheduling | Not shipped; likely standalone |
| Sitting-scoped novel-item limit and cumulative fill | Not shipped; likely standalone |
| Later-sitting success and tail consolidation | Absorbed into the path design but not implemented |
| Need-balanced listening and minimal durable auditory coverage | Not shipped; likely standalone and migration-bearing |
| Acquisition-ready Test starts unsupported without fabricated evidence | Shipped |
| Both printed directions appear earlier and within a bounded number of full Tests | Shipped |
| Fully correct nonqualifying Test does not count as failure | Shipped behavior through `advancementEligible=false`; documentation disagrees about whether a named scheduler outcome is still required |
| Later cumulative checkpoints, missed-letter recurrence, useful local summary | Not shipped |
| Conservative migration, permanent completion, defensible character order, no unsupported auditory/sending claim | Architectural invariants preserved |

Unresolved inputs include spacing strength, later-sitting-success count, priority weights, staleness representation, listening imbalance allowance, persisted auditory metadata, and cumulative checkpoint composition. No implementation choice in the issue should be treated as approved merely because its outcome remains valid.

## Issue #42 Pixel/PWA acceptance

Issue #42 remains a physical-device and learner gate. Its latest comment names the old `550e3cf` deployment; acceptance must now record and exercise deployed SHA `bc0cf14`.

### Automatically verified

- Audio scheduling, resume, cancellation, page lifecycle handling, and non-blocking failure.
- Canonical tone duration/envelope and response locking through tone, feedback, and transition.
- Rapid-tap protection in the stable serial browser suite.
- Checkpoint handoff, direct start, non-gating skip, and retained path access.
- Replay/reference isolation and lesson return.
- Mechanical agreement of all 26 mnemonic patterns and SVG/text equivalence.
- Reduced-motion semantics and phone/200%-text checkpoint/reference layout.
- New curriculum, lesson-resume, and reference routes.

### Requires a physical Pixel in Chrome and installed-PWA mode

- [ ] Fresh first sample and first keyed tap are clearly audible.
- [ ] Key/sample level and quality agree; final dit/dah tails do not clip.
- [ ] Repeated real-finger taps cannot cross the locked response boundary.
- [ ] Correct/wrong feedback is perceptible and transitions have no stale frame or double grade.
- [ ] Lessons 4 and 7 offer the correct checkpoint; Start and Skip route correctly.
- [ ] Replay and repeated Play/Stop never overlap or stick.
- [ ] Background/foreground plus explicit re-tap restores audio; no autoplay is expected.
- [ ] Mnemonic, marks, SVG rhythm/highlight, and heard audio agree on representative letters.
- [ ] Reduced motion preserves content and locking.
- [ ] At 200% text, curriculum, lesson, feedback, checkpoint, replay, reference, and exit actions remain usable without page overflow.
- [ ] Blocked audio is announced and visual/keyed learning remains usable.
- [ ] The quieter alphabet link is discoverable and returns without losing resumable lesson state.

### Requires learner judgment

- [ ] Mnemonics are understandable without prior explanation.
- [ ] Mnemonic, SVG, and audio reinforce one memory path rather than compete.
- [ ] The phone composition and ten-retrieval sitting feel usable.
- [ ] Feedback and automatic progression feel comprehensible.
- [ ] The path-first entry and quieter reference support acquisition.

An inaudible or clipped tone, real touch leaking across a lock, double grading, stale transition, broken checkpoint handoff, stuck audio after explicit retry, mnemonic/SVG/audio mismatch, inaccessible reduced-motion/200%-text state, or blocking audio degradation is an objective defect only when reproduced against the recorded production SHA. Timbre and pacing preferences remain learner/product judgments unless they violate a stated boundary.

## Reconciled product decisions and remaining drift

### Settled by the shipped design

- Today and Library remain the primary destinations; Home/Lessons naming was rejected.
- Progress was absorbed into working surfaces and Library's permanent record.
- Learn remains an internal formative concept rather than a required user-facing label.
- Badges, XP, streaks, and a fifth freshness state were rejected.
- First Messages was rejected from the A-Z topic and remains outside current scope with issue #29.
- Printed bidirectional mapping remains distinct from auditory reception and timed sending.
- Completion remains permanent; later weakness routes repair.

### Remaining contradictions or owner decisions

- The #90 requirement-8 documents disagree over whether the eligibility flag counts as the explicit equivalent outcome.
- Issue #92 still lacks owner ratification for ordinary exposure timing, Morse-reference placement, and future repair semantics.
- Issue #21's Learn/Test wording is semantically valid but stale if read as literal UI labels.
- Issues #29 and #90 cite pre-housekeeping document paths.
- Issue #42's acceptance comment names the old production SHA.
- Issue #90's descriptions of rich Test starts, very late reverse direction, and correct nonqualifying failure are no longer current.
- Repair remains unresolved as formative versus scored work.
- Issue #79 remains parked and must not be executed implicitly.

## Likely redesign-sensitive files

- Routing/shell: `src/app/routing/AppRouter.tsx`, `src/shared/layout/AppShell.tsx`, `src/app/routing/routes.ts`, `src/app/routing/history.ts`, `src/styles/global.css`.
- Destinations: `src/features/today/*`, `src/features/library/LibraryPage*`, `TopicPage*`, `CompletionRecord.tsx`, `src/features/data-management/ProfilePage.tsx`.
- Learning: `LessonRun.tsx`, `MorsePath*`, `MorseLesson*`, `MorseCheckpoint*`, `MorseReference*`, `Reading.css`, and `LearnSupport.tsx`.
- Assessment/input: `src/features/test/*` and `src/features/morse/*`.
- Authoring/transients/splash: TopicForm, CaptureSheet, WantToLearn, Dialog, Confirm, StatusTag, and SplashScreen.
- Structural tests: `e2e/navigation*`, `e2e/morse*`, `e2e/nato*`, `src/features/crossSurface.test.tsx`, MorsePath/Session/MorseLesson tests, and `src/app/routing/routes.test.ts`.

## Risk register

- Opening an ordinary Topic writes exposure state; route restoration cannot be treated as purely read-only.
- Only canonical lessons resume. Test, replay, and checkpoints intentionally fall back to their origin after reload.
- Reference-over-lesson assumes each answer durably saves sufficient sitting state before navigation.
- Future repair must not turn lesson/checkpoint/replay activity into formal Test evidence.
- Lifetime directional evidence cannot substitute for the per-run testimony ledger.
- Already-ready learners must remain ready if later-sitting or auditory metadata is introduced.
- Test snapshots and complete-deck qualification must survive any assessment restructuring.
- Checkpoints currently persist no completion or evidence; adding persistence risks inventing a new evidence claim.
- An old Progress entry encountered during initial restoration normalizes to Today rather than Library; non-Argus `popstate` entries are ignored.
- Documentation is currently one local commit ahead of production, and several issue links still target old paths.
- Global CSS/shared classes and copy-sensitive tests give broad screen changes a large blast radius.
- Web Audio automation cannot prove Android speaker audibility, audio routing, installed-PWA lifecycle behavior, or learning effectiveness.
- Existing bundle size makes an all-at-once rewrite harder to isolate and verify.
