# Argus progress architecture

Parent programme: #62  
Baseline assessed: `fd253386118aec7044e99d9c540287a518078121`

## Purpose

Argus has accumulated several valid but independent forms of learner state. That separation is useful where the states answer genuinely different questions, but the product currently lacks one shared interpretation of them. The result is contradictory navigation, incomplete portability and a Progress screen that cannot explain where the learner actually is.

This document defines the durable architecture for learner progress. It is not a proposal to collapse acquisition, evidence, retention and session state into one score. Instead, it establishes one derived learner journey over those distinct dimensions so Today, Library, Topic, Progress, Learn and Test all tell the same story.

The governing product question is:

> **What should the learner do next, and why?**

## Authority

For progress semantics after #62, authority is:

1. merged implementation and invariant tests;
2. this document;
3. `PRODUCT.md` for product-level behavior;
4. Morse-specific documents for curriculum and interaction detail;
5. historical programme/PRD documents for rationale where they do not conflict with newer contracts.

`argus-prd.md` remains a historical vision document. It should not be rewritten to disguise later architectural evolution.

## Core principle: one interpretation, multiple truths

Argus must preserve distinct learner-state dimensions because they answer different questions.

### 1. Acquisition

**Question:** Can the learner retrieve the material without the teaching support currently being used?

Generic topics may have trivial acquisition: reading Learn can be enough to finish exposure and hand the learner to Test.

Progressive topics may have a multi-sitting acquisition programme. Morse is the first such topic.

For Morse, current acquisition state is stored per item in `Topic.lessonProgress`:

```text
taught → cued → solo → settled
```

`settled` means only that Learn can stop scaffolding that item. It is not retention and not completion.

### 2. Formal Test evidence

**Question:** Has the learner demonstrated the response conditions and directions the scored boundary requires?

For Morse this includes per-item cue state and directional evidence in `Topic.itemEvidence`.

Current cue state is:

```text
rich → delayed-choice → reduced → free
```

The historical name `delayed-choice` does not imply current visual multiple choice.

For bidirectional items, evidence is tracked separately for:

- `prompt-to-answer`;
- `answer-to-prompt`.

Formal evidence must remain structurally separate from formative Learn answers.

### 3. Retention

**Question:** Has demonstrated recall survived the required time gap?

Retention is owned by `src/lib/scheduling.ts` and the topic status/timestamps/history:

```text
unstarted → learning → drilled → completed
                         ^           |
                         +— decayed —+
```

`completed` is permanent historical achievement. `decayed` is routing information for repair and does not erase `completedAt`.

### 4. Current finite sitting

**Question:** Where is the learner inside the bounded task currently in progress?

For Morse Learn the current contract is a 10-retrieval sitting with:

- retrieval count;
- correct count;
- unique revisit item ids.

This state is formative and cannot satisfy Test or retention evidence, but it is still learner progress and must be durable when the product promises resume.

## The architecture boundary

The fields above remain separate sources of truth. Argus adds one pure **journey/readiness derivation layer** that interprets them together.

Conceptually:

```ts
interface TopicJourney {
  acquisition: AcquisitionView
  formalEvidence: FormalEvidenceView
  retention: RetentionView
  sitting?: SittingView
  nextAction: TopicAction
  primaryLabel: string
  secondaryLabel?: string
}

function topicJourney(topic: Topic, now: Date): TopicJourney
```

Exact type names are implementation details. The behavior is not.

The journey layer must derive state; it must not become a second persistent progress database.

## Required derived questions

Every major surface should be able to obtain from the same journey derivation:

- Is acquisition complete enough for normal retention progression?
- Is the topic formally advancement-eligible?
- Is the topic due now, waiting, completed or in repair?
- Is there an active finite sitting to resume?
- What is the recommended primary action?
- What concise explanation should the learner see?
- What progress values are meaningful to display?

## Progressive-acquisition readiness

The generic pre-Morse model assumed that Learn was a one-time exposure step. Therefore `modeFor(topic)` could safely treat only `unstarted` as Learn and every later status as Test.

That assumption is invalid for progressive acquisition.

### Required contract

A progressive topic may remain in acquisition across many sittings while its scheduler status is already `learning`.

Therefore:

- `status === 'learning'` does **not** by itself imply that Test is the learner's next recommended action;
- progressive acquisition exposes an explicit derived readiness boundary;
- until readiness is reached, Today, Library and Topic must recommend **Continue Learn** consistently;
- an optional early Test may remain available as a secondary action, but it may not silently advance the retention ladder in contradiction with acquisition readiness;
- the scheduler remains generic and retention-focused; readiness gates whether a result is eligible to advance it.

## Morse acquisition readiness

For the current A–Z Morse programme, acquisition readiness is reached when all 26 required items have reached the defined Learn endpoint under the current programme policy.

Current endpoint:

- all relevant `lessonProgress` entries are `settled`;
- the guided programme reports finished;
- this means the learner has produced every letter unaided at least once in Learn;
- it still does **not** prove the formal printed bidirectional completion claim.

Example journey before readiness:

```text
Acquisition: in progress
8 / 26 letters settled
Packet 4 / 13
Current sitting: 6 / 10 retrievals
Retention: not yet eligible for normal drilling progression
Next action: Continue lesson
```

Example at readiness:

```text
Acquisition: ready
26 / 26 letters settled
Next action: Test
```

## When the retention clock starts

A progressive acquisition programme may take days or weeks. Starting the generic one-day `learning → drilled` clock on the learner's first exposure to packet 1 can make the clock expire before the learner has learned the boundary.

Default #62 policy:

> For progressive acquisition, the qualifying `learning` gap starts or re-anchors when acquisition readiness is reached.

This means first exposure may still set the topic status to `learning`, but the retention advancement clock that matters for the first ordinary qualifying Test must not be considered satisfied before the acquisition-ready event.

Implementation may represent this with an explicit readiness timestamp, a controlled reset of `learningAt`, or an equivalent derivation. Whichever representation is selected must be documented and tested.

Ordinary non-progressive topics preserve existing behavior unless a separate product decision changes them.

## Active Morse sitting: one durable authority

#59 intended the active 10-retrieval sitting to survive exit/reload and export/import. The current repository contains an architectural contradiction:

- `Topic.lessonSitting` exists in the type model and is described as portable durable state;
- `lessonSittingOf()` / `withLessonSitting()` exist;
- runtime Morse Learn still persists the sitting in a separate localStorage sidecar;
- `parseLibrary()` does not currently round-trip `lessonSitting`.

This must be resolved.

### Canonical target

`Topic.lessonSitting` becomes the sole durable authority for the active Morse Learn sitting.

It stores only:

```ts
interface MorseLessonSittingProgress {
  retrievals: number
  correct: number
  revisitItemIds: string[]
}
```

It does **not** store:

- formal Test evidence;
- scheduler state;
- key timing/WPM;
- audio playback state;
- transient feedback animation;
- current pointer/key press;
- arbitrary queue snapshots unless later evidence proves they are required for honest resume.

### Storage requirements

The storage boundary must:

- validate `lessonSitting`;
- reject impossible counters;
- reject/clean unknown item ids according to an explicitly documented compatibility rule;
- accept older v5 records with the field absent as a fresh sitting;
- export/import it losslessly;
- preserve it through catalog reconciliation and normal topic edits;
- clear it deliberately when starting a new finite sitting;
- prevent state from a replaced/reset library leaking into the new library.

### Sidecar migration

The obsolete `argus.morse-learn-sittings.v1` sidecar must not remain a competing source of truth.

A safe migration may:

1. on first upgraded load, read a valid sidecar sitting only if the canonical topic has no `lessonSitting`;
2. merge it once into the topic record;
3. remove/ignore the sidecar thereafter.

Exact migration mechanics are implementation choice. Permanent dual-write is not acceptable.

## Listening suppression and resume

Current listening suppression (`Can't listen now`) is defined as lasting for the current sitting.

If an active sitting itself is now durable across exit/reload, the implementation must make one coherent product decision:

- either persist listening suppression as part of resumable sitting context;
- or redefine suppression as “for the current continuous app session,” not the durable sitting.

Do not leave the system in a contradictory state where the learner resumes at 6/10 but silently regains listening after having said they cannot listen for that sitting.

Recommended behavior: preserve suppression for the durable sitting, while keeping audio-error details and playback state transient.

## Write-composition safety

Argus now has several independent systems mutating sibling fields on the same `Topic`:

- scheduler/history;
- Test cue evidence;
- Learn support;
- finite sitting state;
- content editing/reconciliation.

Whole-object replacement from stale React snapshots is therefore unsafe.

The store should expose a functional update primitive conceptually like:

```ts
updateTopic(id, current => next)
```

Domain policy remains in domain modules. The store's responsibility is only to guarantee that a mutation composes with the latest topic value rather than overwriting unrelated sibling changes.

`upsertTopic(topic)` may remain for creation/import/admin paths where full replacement is intended, but independent learner-progress paths should prefer functional updates.

## Surface consistency contract

The same topic at the same instant must not receive contradictory learner-facing recommendations.

### Today

Today answers what requires attention now.

It must:

- derive primary action from the journey layer;
- keep progressive Morse in Continue Learn until acquisition readiness;
- keep due/waiting wording consistent with actual eligibility;
- avoid presenting a generic Test batch as the required action for acquisition-incomplete progressive topics;
- preserve concise mobile-first presentation.

### Library

Library is the browsable state of the whole collection.

It must:

- derive row action from the journey layer;
- place topics in shelves that agree with that action;
- distinguish acquisition-in-progress from retention waiting;
- keep schedule/waiting bars semantically tied to retention only;
- avoid raw `status` or raw `modeFor()` becoming a second interpretation.

### Topic

Topic is the detailed explanation of one competency.

It must show distinct concepts where relevant:

- acquisition state;
- retention state;
- current sitting/progress;
- formal completion/history;
- one clear primary next action.

For acquisition-incomplete Morse:

- Continue lesson is primary;
- Test, if retained, is explicitly early/secondary;
- the page must not imply that `learning` means acquisition is finished.

### Progress

Progress is not just a completion ledger.

It should communicate four restrained sections:

1. **In progress** — acquisition/drilling work with one concise next-step line;
2. **Waiting** — topics held for a meaningful retention/spot-check gap;
3. **Repair** — decayed topics requiring repair;
4. **Completion record** — permanent completed-topic history.

Morse can include meaningful domain-specific details such as:

- letters settled / total;
- packet position;
- active sitting progress.

Do not force every topic into an arbitrary percentage.

Compact completion totals by track are acceptable. Avoid generic analytics-card layouts.

### Learn

Learn owns formative acquisition only.

It must:

- persist acquisition/sitting changes through canonical topic writes;
- never write formal Test evidence;
- never award retention/completion;
- make its durable progress immediately visible to the shared journey layer.

### Test

Test remains the single scored recall interaction.

It must:

- preserve cue evidence separately from retention;
- honor progressive-acquisition readiness when deciding whether a result can advance retention;
- keep voluntary early Tests possible only under clearly non-advancing semantics if retained;
- continue to run the complete finite scored boundary for a bankable attempt.

## Formal Morse completion evidence audit

The current printed Morse completion claim remains:

> Can independently recall all A–Z printed Morse mappings in both directions.

There are exactly 26 logical scoring units, each typed bidirectional.

#62 must not casually redesign this boundary. However, the final completion gate must be audited independently because current directional evidence accumulates historically in `itemEvidence`.

The audit must answer:

- does the **qualifying delayed attempt itself** demonstrate the required uncued forward and reverse performance?
- can historical supported/cued correct events satisfy directional coverage in a way that overstates the qualifying delayed attempt?
- can any partial-direction route be presented to the scheduler as a clean bidirectional retention result?

If the audit finds a real defect, fix only the evidence semantics needed to make the claim honest. Preserve:

- 26 logical units;
- bidirectional item semantics;
- acquisition vs retention separation;
- no auditory/sending/WPM claims.

### Audit outcome (#68, lane F — settled)

The audit found real defects and they are fixed. Full findings and reasoning are in `docs/MORSE_CUE_LADDER.md` under "#68 — the completion-evidence audit"; the answers to the three questions above are:

- **Did the qualifying delayed attempt itself demonstrate the required uncued forward and reverse performance?** No. It demonstrated one direction per unit at whatever support level that unit had reached, and in steady state that was always reception, because the ladder retired production permanently once reverse opened.
- **Could historical supported/cued correct events satisfy directional coverage?** Yes. `hasCompleteDirectionalCoverage` read `DirectionEvidence.correct`, which counts a correct answer given with half the pattern and the timing artwork on screen exactly like an unaided one.
- **Could a partial-direction route reach the scheduler as a clean bidirectional result?** Not partial-direction, but partial-*independence* could: coverage was a lifetime latch, so once set it could never fall, and a run answered with cues restored still banked.

The fix stays inside the evidence layer:

- `DirectionEvidence.unassistedCorrect` records correct answers given at a rung showing no scaffolding of any kind; `isAssistedRung` is the single predicate deciding that, shared with `UNCUED_RUNGS`;
- directional coverage counts only `unassistedCorrect`;
- the qualifying attempt passes its own answers to `retentionCorrectCount`; one supported answer anywhere in the run withholds the pass, and so does a run that testifies about nothing or skips a unit;
- once both uncued rungs are open, the ladder asks whichever direction holds the weaker independent evidence, so neither half of the claim is retired.

Nothing else moved: 26 logical units, typed bidirectional semantics, `CUE_FADE_STREAK`, fade/restore rules, `scheduling.ts`, the completion claim itself, ordinary-topic behaviour and the Learn/Test evidence boundary are all unchanged. `unassistedCorrect` is additive within v5 and absent means zero, so an upgraded library withholds the claim until it is re-earned rather than assuming independence that was never recorded; no existing status, history or `completedAt` is altered.

Cover: `src/lib/morseCompletionEvidence.test.ts`, including an end-to-end simulation showing completion remains reachable through honest practice and unreachable for a learner still carried by cues.

## Fresh-user progress integrity

The permanent completion record must represent achievements earned by the current learner.

Production seed/catalog content must not fabricate completed learner history on a fresh install.

Required rule:

- fresh production topics begin as unstarted with no earned history unless there is an explicit user migration restoring real prior state;
- demo/test fixture history belongs in test/demo fixtures, not production learner state;
- existing real learner completions must survive catalog reconciliation and upgrades;
- deleting synthetic seed history from future fresh installs must not reset existing users.

## Progress terminology

The 10-answer Morse Learn sitting is a finite retrieval budget, not an economy.

Argus explicitly rejects global XP/gamification. Therefore learner-facing copy should prefer plain terminology such as:

```text
6 / 10 retrievals
```

or

```text
6 / 10 questions
```

Use “XP” only if a later explicit product decision creates a real XP model. Do not imply one accidentally.

## Storage and portability matrix

| State | Durable? | Portable in JSON? | Owner | Can award completion? |
|---|---:|---:|---|---:|
| `status` + scheduler timestamps | yes | yes | scheduler | yes, through scheduler rules |
| `history` | yes | yes | Test/scheduler | historical evidence only |
| `itemEvidence` | yes | yes | Test cue/formal evidence | only through explicit completion gate |
| `DirectionEvidence.unassistedCorrect` | yes | yes | Test formal evidence (#68) | it is the only evidence the completion gate reads |
| `lessonProgress` | yes | yes | Learn acquisition | no |
| `lessonSitting` | yes | yes | Learn finite sitting | no |
| listening suppression for active sitting | recommended yes | yes if durable sitting semantics require it | Learn sitting | no |
| current audio playback | no | no | runtime presentation | no |
| key press duration | no | no | input presentation | no |
| navigation history | session only | no | navigation | no |

## Compatibility and migration

The programme should remain additive within the current v5 boundary where practical.

Requirements:

- older v5 records remain loadable;
- absent new optional fields receive safe defaults;
- imports with invalid learner-state fields fail clearly rather than silently fabricating progress;
- existing catalog topic ids and item ids remain stable;
- editing/reordering preserves state by stable item id and prunes only genuinely deleted item state;
- current completed users are not reset to simplify implementation;
- legacy supported versions continue to migrate through the single storage boundary.

A schema-version bump is acceptable if the implementation demonstrates that additive v5 handling would be ambiguous or unsafe. Do not bump merely for convenience.

## Cross-surface invariant matrix

The implementation is not complete until automated tests cover these product-level invariants.

### Progressive Morse routing

- fresh Morse → Today recommends Learn;
- fresh Morse → Library action says Learn;
- fresh Morse → Topic primary action says Start lesson;
- after one or several incomplete sittings → all three recommend Continue Learn;
- incomplete acquisition cannot become `drilled` through a formally ineligible Test;
- acquisition readiness changes the recommended action coherently across all surfaces;
- the first qualifying retention clock follows the documented readiness anchor.

### Ordinary topics

- ordinary unstarted topic still routes to Learn;
- after normal exposure, ordinary topic preserves existing Test/scheduler behavior;
- #62 does not make every topic use Morse acquisition semantics.

### Persistence

- `lessonProgress` survives reload/export/import;
- `lessonSitting` survives reload/export/import;
- active sitting counters are validated;
- old v5 with no sitting starts fresh;
- replacement import/reset cannot inherit an unrelated old sitting;
- topic editing preserves unrelated learner state;
- sibling scheduler/cue/acquisition/sitting updates cannot overwrite one another from stale snapshots.

### Progress UI

- Today, Library, Topic and Progress use the same derived journey for a given topic/time;
- waiting vs acquisition-in-progress is distinguishable;
- repair topics are consistently identified;
- completed topics remain in the permanent record after decay;
- no fake fresh-install completion appears.

### Evidence boundary

- Learn answers cannot write `DirectionEvidence`;
- sitting counters cannot advance scheduler state;
- progressive readiness alone cannot award completion;
- qualifying Morse completion remains bidirectional and uncued according to the audited contract;
- a supported correct answer fades a cue and contributes nothing to the completion claim;
- one supported answer anywhere in a qualifying run withholds the pass;
- a pre-#68 record loads with zero independent evidence rather than assuming it.

## Workstream decomposition

#62 should be delivered as focused workstreams rather than one large implementation PR.

### A. Architecture and invariant contract — high reasoning

- ratify this document;
- define shared `topicJourney`/readiness types;
- define progressive readiness and clock anchoring;
- add pure invariant tests where possible;
- no broad UI redesign.

### B. Finish Morse sitting persistence — regular implementation

- canonicalize `Topic.lessonSitting`;
- storage validation/import/export;
- safe sidecar migration/removal;
- preserve old v5;
- resolve listening-suppression resume semantics.

### C. Journey implementation and scheduler readiness gate — high reasoning

- implement the shared pure derivation;
- gate progressive retention advancement;
- preserve ordinary-topic behavior;
- add state-transition tests.

### D. Today / Library / Topic integration — regular implementation

- replace raw independent interpretations;
- preserve mobile hierarchy, accessibility and navigation;
- keep optional early Test explicitly secondary where applicable.

### E. Progress view rebuild — regular implementation/design

- In progress;
- Waiting;
- Repair;
- Completion record;
- restrained track totals;
- meaningful Morse detail without dashboard sprawl.

### F. Morse completion-evidence audit — high reasoning

- audit delayed qualifying evidence;
- patch only if a real overclaim exists;
- preserve 26-item bidirectional model.

### G. Fresh-seed cleanup and documentation closeout — regular implementation

- remove synthetic production learner history for fresh installs;
- preserve existing users;
- reconcile current docs/comments/tests;
- verify exact production behavior.

## Non-goals

#62 does not:

- collapse everything into one progress score;
- introduce SM-2 or another scheduler;
- add cloud sync for the learning library;
- redesign Morse mnemonics/audio/keyer;
- start #29 auditory reception/sending/continuous material;
- add badges, streaks, achievements, global XP or leaderboards;
- add a large analytics dashboard;
- reset existing learner progress;
- silently broaden or weaken completion claims.

## Definition of done

The progress architecture is complete when:

1. every learner-state field has one semantic owner and one durable storage authority;
2. active Morse sitting persistence matches the actual schema/export/import contract;
3. one shared pure journey/readiness layer interprets progress for all major surfaces;
4. progressive acquisition cannot be bypassed accidentally by generic status routing;
5. Today, Library, Topic and Progress agree on the primary next action;
6. Progress communicates active work, waiting, repair and permanent completion without dashboard sprawl;
7. fresh-user progress contains only achievements actually earned by that learner;
8. Morse's exact printed bidirectional completion claim remains mechanically honest;
9. ordinary topics preserve current scheduler semantics;
10. migration/export/import remain lossless for durable learner state;
11. full automated gates and exact production acceptance are green.
