# Issue #115 — Morse word checkpoints must run as atomic words

Status: **open / scoped**
Issue: #115
Parent: #21
Branch: `issue-115-morse-checkpoint-atomic-flow`

## Owner finding

The word checkpoint between Lessons 10 and 11 feels broken because the learner can be interrupted between letters of the active word.

A word checkpoint must let the learner complete **one whole word at a time**. Once a word starts, no warm-up, retry, lesson item, repair item, or unrelated target may appear until the final letter of that word has been answered.

The checkpoint is an application activity, not another presentation of the ordinary adaptive Learn/Test game.

## Current implementation and confirmed defect

Current production code:

- `src/domain/morse/curriculum/checkpoints.ts`
- `src/features/morse/lesson/MorseCheckpoint.tsx`

The checkpoint curriculum is flattened by `checkpointTargets()` into individual targets:

```text
warm-up
warm-up
warm-up
warm-up
word 1 / character 1
word 1 / character 2
...
word 2 / character 1
...
```

`MorseCheckpoint.tsx` applies `withCheckpointRetry()` to any missed target. That helper reinserts the missed target after up to two later targets.

This target-level retry rule can cross semantic boundaries.

For the checkpoint after Lesson 10:

```text
Warm-ups: V F B P
Words:    FLOW PLANT
```

If the final warm-up `P` is missed, the flattened/retry sequence can become:

```text
P miss -> F -> L -> P retry -> O -> W
```

The warm-up has therefore been inserted inside `FLOW`.

A missed word character can likewise be reinserted later inside the same word or inside a following word.

This is not merely a presentation bug. The progression model is wrong for a word checkpoint.

## Product decision

### 1. A word is atomic

Within word mode, the active word is the unit of progression.

For a word such as `FLOW`, the only legal progression is:

```text
F -> L -> O -> W -> word boundary
```

Each letter may still:

- use the shared Morse key;
- auto-grade at expected pattern length;
- show brief correct/miss feedback;
- use the existing touch-safe transition lifecycle.

But after feedback, the next target must be the next character of the same word until that word ends.

### 2. Checkpoint sequencing is distinct from adaptive scheduling

Word checkpoints should own a small local progression state instead of behaving as a flat adaptive target queue.

Conceptually:

```text
warmup phase
  -> word { wordIndex: 0, characterIndex: 0..N }
  -> word { wordIndex: 1, characterIndex: 0..N }
  -> ...
  -> complete
```

The exact implementation may differ, but word boundaries must be explicit and structurally enforced.

The checkpoint may reuse:

- `MorseKeyInput`;
- `useKeyedResponse`;
- shared audio primitives;
- pointer/keyboard safety behavior.

It must not inherit ordinary Learn/Test scheduling semantics simply because those lower-level interaction primitives are shared.

### 3. Remove target-level spaced requeue from checkpoints

For this correction, a missed individual checkpoint target must **not** be automatically reinserted later in the run.

A miss may:

- show immediate local feedback;
- increment local attempt/correct counts;
- continue to the next character when inside a word.

It must not:

- reinsert a warm-up after word mode starts;
- jump backward to an earlier word character;
- place a missed character into another word;
- invoke canonical lesson repair/support;
- behave like an adaptive testing queue.

If future product work adds remediation, it must operate at a word boundary and be separately justified. It must not interrupt a word already in progress.

## Desired learner flow

For the Lesson-10 checkpoint:

```text
Warm-up V
Warm-up F
Warm-up B
Warm-up P

FLOW
  F
  L
  O
  W

PLANT
  P
  L
  A
  N
  T

Summary
```

Once `FLOW` starts, no other surface or target is allowed until `W` has been answered.

`PLANT` starts only after the `FLOW` boundary.

The same rule applies to the Lesson-4, Lesson-7 and Lesson-13 checkpoints.

## UI contract

During an active word:

- keep the entire word visible;
- emphasize the current character;
- do not replace the word with a warm-up or unrelated prompt;
- do not add Continue, Submit, Check, Back or correction controls between characters;
- after the current letter's feedback lifecycle finishes, automatically advance to the next letter in the same word;
- move to the next word only after the current word's last character finishes.

The existing input lock/arming behavior from #87 remains required so the same press cannot accidentally answer two letters.

## State and evidence boundary

This issue does not change durable learning semantics.

A checkpoint remains local/formative and must not mutate:

- `Topic.lessonProgress`;
- `Topic.lessonSitting`;
- `Topic.acquisitionReadyAt`;
- `morseReview`;
- Test attempt/history state;
- `DirectionEvidence`;
- scheduler/retention timestamps;
- topic completion;
- the 26-item printed bidirectional completion claim.

No durable checkpoint-completion or checkpoint-retry store is needed.

## Scope

### In scope

- replace target-level adaptive checkpoint retry behavior;
- make word boundaries explicit in checkpoint progression;
- guarantee contiguous word runs;
- preserve per-letter keyed feedback;
- preserve existing checkpoint unlock, path and automatic-handoff behavior;
- update tests around checkpoint sequencing;
- reconcile durable checkpoint documentation with the new rule.

### Out of scope

- changing the canonical 13-lesson order;
- changing checkpoint placement after Lessons 4, 7, 10 and 13;
- changing checkpoint words/corpus unless required by a separate content issue;
- making checkpoint completion durable or gating;
- changing Test scoring/evidence;
- changing lesson acquisition/support policy;
- adding sending-speed/WPM assessment;
- adding phrases or continuous Morse.

## Required implementation review

At minimum, inspect and update as needed:

- `src/domain/morse/curriculum/checkpoints.ts`;
- `src/domain/morse/curriculum/checkpoints.test.ts`;
- `src/features/morse/lesson/MorseCheckpoint.tsx`;
- checkpoint component/browser tests;
- `docs/open/MORSE_WORD_CHECKPOINTS.md`.

The #90 addendum in `MORSE_WORD_CHECKPOINTS.md` currently states that a first miss is reinserted once after up to two intervening targets. That contract conflicts with this issue and must be replaced/reconciled during implementation.

## Deterministic regression cases

### Warm-up miss cannot enter a word

Given Lesson-10 checkpoint:

```text
V F B P | FLOW | PLANT
```

When `P` is missed, starting `FLOW` must still produce exactly:

```text
F -> L -> O -> W
```

No `P` retry may appear between these letters.

### Word-letter miss stays local

When `L` in `FLOW` is missed:

```text
F -> L(miss) -> O -> W
```

The learner receives local feedback, then continues to `O`.

`L` is not reinserted before `O`, before `W`, or inside `PLANT`.

### Word boundary

After `W` in `FLOW` completes, the next word may begin.

No following word begins before the active word reaches its last-character boundary.

## Test requirements

Add deterministic coverage proving:

- all warm-ups finish before word mode begins;
- every word's characters are contiguous in canonical order;
- warm-up misses cannot be scheduled inside a word;
- word-character misses cannot be reinserted inside the same word;
- word-character misses cannot interrupt a later word;
- `FLOW` is always `F -> L -> O -> W`;
- `PLANT` is always `P -> L -> A -> N -> T`;
- all four milestone checkpoints obey the same rule;
- per-letter feedback still auto-advances correctly;
- #87 input locking/arming behavior is preserved;
- replay and automatic checkpoint handoff still work;
- no checkpoint answer mutates Learn/Test evidence or durable lesson state;
- keyboard/focus, reduced motion, phone portrait and Android Back remain coherent.

## Acceptance

- [ ] Between Lessons 10 and 11, a learner can finish each word one letter at a time without any unrelated interruption.
- [ ] Once a word begins, only letters from that word appear until it is complete.
- [ ] Warm-ups never appear inside words.
- [ ] Target-level retry/requeue is removed from checkpoint progression.
- [ ] Misses remain local formative feedback and do not invoke lesson repair or Test scheduling.
- [ ] Checkpoint sequencing is explicitly distinct from ordinary adaptive Learn/Test scheduling.
- [ ] Shared input/audio/safety primitives remain reused.
- [ ] Existing checkpoint unlock, replay and handoff behavior is preserved.
- [ ] Durable learner evidence/state semantics remain unchanged.
- [ ] `docs/open/MORSE_WORD_CHECKPOINTS.md` is reconciled with this contract.
- [ ] Full repository gate and production build are green.

## Definition of done

Issue #115 is complete when the word checkpoint runner structurally enforces atomic word progression, the Lesson-10 regression is covered, target-level adaptive requeue no longer crosses word boundaries, durable Morse state remains untouched, and repository tests/documentation agree with the corrected checkpoint semantics.
