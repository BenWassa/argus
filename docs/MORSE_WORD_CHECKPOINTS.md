# Morse Learn — early word-application checkpoints

Issue: #78  
Parent: #21  
Status: **planned Batch 3; not yet implemented**

This document records the durable product/architecture contract for the first
whole-word application moments inside the existing Morse Learn journey.

It does not change the formal Morse completion boundary, create a Practice mode,
or define a new competency. Until #78 is implemented and merged, this file is
planning authority only; current runtime behaviour remains whatever is present on
`main`.

## Purpose

The guided A–Z programme currently teaches and retrieves individual printed
letter → Morse mappings. #78 adds two deliberately small moments where the
learner combines mappings they have already encountered into familiar words.

The objective is application and motivation, not broader Morse fluency.

## Curriculum authority

Checkpoint content must never rely on a duplicated hand-written acquisition
sequence.

Production authority remains:

- `src/lib/morseLesson.ts` → `lessonPackets()`;
- `src/lib/morseOrder.ts` → `buildCharacterPackets()` / generated acquisition
  order;
- `docs/MORSE_CHARACTER_ORDER.md` for the rationale and pinned sequence.

The current generated acquisition order is:

```text
E I T A N S M U R D W K G H O V F L B P X C Z J Y Q
```

With two novel characters per lesson, the current milestone sets are:

- after Lesson 4: `E I T A N S M U`;
- after Lesson 7: `E I T A N S M U R D W K G H`.

`O` is introduced in Lesson 8, not Lesson 7.

Implementation tests must derive milestone sets from `lessonPackets()` and fail
if any curated warm-up or word contains a letter not available at that point.
The literal sets above document current truth; they are not a second runtime
source of truth.

## Checkpoint 1 — after Lesson 4

The first checkpoint appears immediately after Lesson 4 in the visible Morse
lesson path.

Before Lesson 4 is complete it is locked. After Lesson 4 is complete it remains
available to run again.

Flow:

1. four brief individual-letter keyed warm-ups chosen deterministically from the
   known set;
2. one simple familiar word;
3. concise completion state;
4. return to the lesson path.

`TIME` is a suitable default word for the current Lesson-4 set.

## Checkpoint 2 — after Lesson 7

The second checkpoint appears immediately after Lesson 7.

Flow:

1. four brief individual-letter keyed warm-ups;
2. two modest familiar words, or one short plus one longer word;
3. concise completion state;
4. return to the lesson path.

Suitable examples for the current Lesson-7 set include `TRAIN`, `WATER`,
`NIGHT`, `DREAM`, `HEART` and `GARDEN`.

Do not use stale examples containing `O` before Lesson 8.

## Lesson-path contract

The canonical programme still contains exactly **13 lessons**.

The checkpoints are interstitial milestones. They must not:

- renumber the canonical lessons;
- become Lesson 5 or Lesson 8;
- gate access to later lessons;
- create a parallel unlock database;
- require a durable `checkpointCompleted` flag merely for presentation.

Availability should be derived from the existing lesson-path/acquisition
authority. Once a milestone has genuinely been reached, its checkpoint remains
available even if later repair causes an older lesson to become current again.

Checkpoint completion itself is not an acquisition prerequisite. A learner may
continue to Lesson 5 or Lesson 8 without passing the checkpoint.

## Interaction contract

Reuse the shared direct Morse key introduced by #77. Do not create a second
keying widget or response model.

For every warm-up target and every character in a word:

- show the plaintext target;
- for a word, keep the full word visible and clearly emphasize the current
  character;
- learner enters Morse with the same tap/hold interaction as existing keyed
  production;
- expected element count auto-grades exactly once;
- a mis-key is a miss and cannot be edited away;
- show lightweight immediate correct/wrong feedback;
- advance automatically to the next target.

Do not introduce Back, delete, Submit, Check, or Continue between characters.

Touch duration remains categorical input only. It is not sending timing, WPM,
or formal evidence.

## Formative-only state boundary

A checkpoint run is ephemeral application inside Learn.

It must not mutate:

- `Topic.lessonProgress`;
- `Topic.lessonSitting`;
- `Topic.acquisitionReadyAt`;
- Test attempts/history;
- `DirectionEvidence`;
- scheduler/retention state;
- completion state;
- the 26-item printed bidirectional competency claim.

A wrong response affects only transient checkpoint feedback and never invokes
the canonical lesson support/repair ladder.

Running an unlocked checkpoint again must not disturb the canonical current
lesson, the active 10-retrieval sitting, acquisition support, formal evidence or
retention state.

## Content policy

V1 intentionally uses a tiny deterministic curated corpus.

Requirements:

- every target mechanically validated against canonical milestone letters;
- familiar everyday English words;
- no dictionary generation;
- no infinite practice stream;
- no obscure words merely to satisfy the character set;
- no phrases or sentences;
- no auditory-only word reception;
- no sending/WPM scoring.

## UI/accessibility boundary

The checkpoint should look and behave like part of the existing phone-first
Morse programme, not like a separate dashboard or mode.

Preserve:

- whole-word visibility with an unmistakable current character;
- >=44 CSS px primary touch targets;
- keyboard access and sensible focus restoration;
- reduced-motion behaviour;
- usable 200% text scaling;
- #45 History API / Android Back semantics.

## Validation contract

#78 implementation must add deterministic coverage for:

- exact Lesson-4 and Lesson-7 unlock boundaries;
- locked-before / available-after behaviour;
- availability surviving later lesson repair;
- 13 canonical lessons remaining 13 and later lessons not being gated;
- milestone sets derived from `lessonPackets()`;
- all curated content using only eligible letters;
- explicit protection against `O` leaking into Lesson-7 content;
- warm-up → word flow;
- whole-word/current-character rendering;
- per-character expected-length auto-grading;
- correct and wrong progression without correction controls;
- replayability;
- no mutation of acquisition, sitting, scheduler, Test evidence or completion;
- phone width, focus/accessibility and 200% text;
- preservation of #45, #75, corrected #76 and #77 behaviour.

The full repository gate and exact production build must be green before #78 is
merged.

## Explicit non-goals

#78 does not implement:

- later-half alphabet checkpoints;
- phrases, sentences or continuous Morse;
- auditory reception as a scored competency;
- sending or WPM competence;
- generated practice;
- #29 advanced Morse work;
- parked #79 desktop specialist review.

## Relationship to later Morse work

These checkpoints deliberately stop short of the broader groups/words/continuous
material contemplated by #29. Their purpose is to test whether tiny formative
application moments improve the A–Z learning journey without changing its
completion claim.

After #78 is merged, the next product step is integrated real-device validation
of the Morse journey before deciding whether the A–Z foundation is mature enough
to open the next competency stream.
