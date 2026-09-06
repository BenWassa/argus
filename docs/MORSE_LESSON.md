# Morse Learn: guided acquisition, finite sittings, listening, and reference

Issues #48, #51, #52 and #56. Parent #21. Preserves #28's completion boundary
and the #42/#44 mnemonic treatment. #29 remains the separate future boundary for
a claimed auditory-reception competency, sending, WPM, groups, words and
continuous material.

Primary code:

- `src/lib/morseLesson.ts` — durable printed-acquisition and packet policy;
- `src/lib/morseLessonSitting.ts` — runtime-only finite-sitting policy;
- `src/lib/morseLessonListening.ts` — runtime-only listening-question policy;
- `src/features/learn/MorseLesson.tsx` — guided lesson surface;
- `src/features/morse/MorseKeyInput.tsx` — shared letter → Morse response control;
- `src/features/learn/MorseReference.tsx` — A–Z lookup surface.

## Product model and evidence boundary

Morse still has only **Learn + Test** as product modes. Learn is guided
acquisition; Test is the sole formal scored retention/completion path; Morse
alphabet is a freely available non-scored reference.

The formal completion claim remains exactly:

> Can independently recall all A–Z printed Morse mappings in both directions.

There are exactly 26 logical scoring units, all typed bidirectional. Nothing in
Learn — including a listening answer — can satisfy directional evidence,
advance the scheduler or award completion.

Learn persists only `Topic.lessonProgress`, one printed-acquisition support enum
per item. Session XP and listening state are runtime-only and are never written
to the learner record, export/import data, cue evidence or scheduler state.

## Two independent progress clocks

Every normal Morse Learn sitting has a fixed target of **10 answered formative
retrievals**.

- each answered retrieval consumes one unit and earns one session XP whether
  correct or wrong;
- introductions and correction/reteach screens consume no budget;
- `Can't listen now` consumes no budget because it is not an answered retrieval;
- mistakes change teaching/support, not sitting length;
- a packet may span several sittings;
- if a packet genuinely settles before the tenth retrieval, the same sitting may
  continue into the next packet.

Packet readiness remains separate durable acquisition state: every character on
the roster must be `settled` under the **printed** Learn support ladder. The
packet index is derived from that state rather than stored independently.

The UI therefore shows `Packet N of 13` and `X / 10 XP`. The main bar is the
finite sitting target; the packet settled count is secondary context. The
endpoint summary reports XP, correct count, unique letters to revisit, current
packet progress and packet(s) settled during the sitting.

There is no global XP, streak, league, currency, shop or daily-goal schema.

## Printed acquisition support ladder

#56 makes the response rule intentionally simple:

> **If the answer is a Morse pattern, the learner produces the pattern.**

The support level changes only what help is visible. It never switches the
learner between recognition and production.

| Support | Printed letter → Morse question | Response |
| --- | --- | --- |
| `taught` | rhythmic phrase with beat marks | shared Morse key |
| `cued` | element count only | shared Morse key |
| `solo` | glyph only | shared Morse key |
| `settled` | same unaided format as `solo` when interleaved | shared Morse key |

The shared `MorseKeyInput` is used by both Learn and Test:

- one visible primary touch target;
- tap / short press appends dit `·`;
- press-and-hold appends dah `—`;
- the accumulated pattern is visible immediately;
- `Back` removes one element;
- `Check` / `Submit` evaluates the complete sequence;
- keyboard equivalents are `.` for dit, `-` for dah, Backspace to delete and
  Enter to submit.

The hold threshold is an **input classification**, not sending evidence. Press
duration is not returned to Learn, Test, the scheduler or the evidence store and
must never become a WPM/sending claim through this control.

Pointer cancellation/lost capture produces no element. The key suppresses
long-press browser UI and touch scrolling while an active press is being
classified, so one press cannot accidentally become a dit plus a dah or a page
gesture.

The #52 answer-safety rule remains: **no unanswered printed recall question
exposes target playback**. A one-signal question such as `T` may show `1 signal`,
but there is no Play control that can reveal whether the answer is dit or dah.

Instructional target audio remains available during introduction, after an
answer in correction/reteach, and in the A–Z reference. Audio is either teaching
outside the live recall decision, or it is the stimulus of a distinct listening
question.

One correct printed retrieval fades support one level. A printed miss restores
support appropriate to the failed format and enters the existing delayed weak-
item recurrence policy. `settled` is only a Learn-scaffold state; it is not
retention or completion.

## Listening is a separate formative question type

A listening question is **Morse sound → letter** and is the one V1 Morse Learn
interaction that retains multiple-choice recognition.

While unanswered:

- the sound is the stimulus;
- the target letter, canonical pattern, mnemonic and SVG are not shown as the
  identified answer;
- the Play/Stop control has the neutral accessible name `Play Morse sound` /
  `Stop Morse sound`, so a screen reader does not receive the hidden answer;
- replay is allowed;
- the learner chooses from a compact deterministic set containing only
  characters already introduced.

Listening is deliberately restrained and deterministic in V1. It is eligible on
retrieval slots 3, 6 and 9, only after the target has moved beyond `taught` in
printed acquisition. The immediately previous target is excluded from an
instant modality flip, and answering a listening question defers that target in
the ephemeral queue so the next question is not simply the same answer visually.

### Auditory answers do not change printed packet readiness

`answerListeningQuestion` does not fade or restore `LessonSupport`, does not set
`asked`/`done`, and therefore cannot settle a printed packet. It changes only
runtime queue timing and returns runtime feedback.

A correct or wrong listening answer does count as one of the sitting's 10
formative retrievals, because the learner completed a question, but the result
is not durable auditory evidence and does not create an auditory competency
claim. A listening miss may be shown corrective material after the answer; it
still carries no printed-support penalty.

## `Can't listen now` and technical audio failure

Every live listening prompt exposes the secondary action:

> Can't listen now

Choosing it:

- applies no correctness or support penalty;
- earns no XP and consumes no retrieval slot;
- writes no formal or auditory evidence;
- suppresses further listening prompts for the rest of the current sitting;
- immediately leaves eligible visual work to occupy the unanswered slot.

Suppression is runtime-only. `Next lesson` starts a new finite sitting with
listening eligible again.

A technical audio error follows the same non-blocking product path: playback is
stopped, listening is suppressed for the rest of that sitting, a concise status
message is announced, and Learn continues visually. The audio-error state is
cleared when the next sitting begins.

A fully visual sitting still reaches the same 10-retrieval endpoint, including
when all listening is skipped or unavailable.

## Packet ordering, weak items and interleaving

P1/P2 from `docs/MORSE_CHARACTER_ORDER.md` remain authoritative:
complexity-ascending ordering with final-element confusables separated, two novel
characters per packet, and up to five characters on a roster.

Printed misses remain barred for `WEAK_ITEM_DELAY_STEPS = 2` lesson steps and
are not immediately repeated after correction. Returning characters from prior
packets arrive settled and are retrieved unaided; a printed miss on one can
restore support and block true packet readiness.

Visual pattern distractors are no longer part of the Learn response model.
Confusion metadata still informs curriculum sequencing and can remain useful in
other discrimination contexts. Listening choices remain deterministic and never
pad with an unintroduced letter.

## Leaving and resuming

`Topic.lessonProgress` persists meaningful printed acquisition changes. The
within-sitting queue, XP tally, listening suppression and listening feedback do
not.

Therefore reopening Learn starts a fresh 10-retrieval sitting reconstructed from
the first packet not fully settled. Already introduced items stay introduced;
weak printed items retain their support level; listening availability resets.
There is no second durable session or auditory state machine.

## Morse alphabet and acquisition audio

The reference still exposes all 26 letters alphabetically with rhythmic phrase,
canonical notation, timing drawing and compact Play/Stop control, and writes no
learner progress.

#42/#44 remain in force:

- rhythmic verbal mnemonic is the primary early memory hook;
- SVG is secondary;
- audio is generated from canonical Morse timing;
- acquisition playback uses `LEARN_ACQUISITION_MORSE_TIMING` at 12 character
  WPM;
- canonical dit:dah timing remains 1:3;
- the compact audio control remains touch-sized and accessible;
- no mnemonic/SVG/audio cue leaks into the formal uncued Test boundary.

See `docs/MORSE_VERBAL_MNEMONICS.md` for mnemonic grammar and provenance.

## Structural safeguards

1. `morseLesson.ts` imports no scheduler or formal Test-evidence module.
2. `answerLesson` mutates only a `LessonRun` and never receives a `Topic`.
3. `withLessonProgress` is the only acquisition write path and changes only
   `lessonProgress`.
4. `morseLessonSitting.ts` and `morseLessonListening.ts` are runtime-only policy
   modules and do not write a learner record.
5. `MorseLesson.tsx` has one `upsertTopic` path, behind
   `withLessonProgress(topicRef.current, lessonProgressOf(next))`.
6. Listening answers do not call that durable write path.
7. `MorseKeyInput` reports only the completed dot/dash string. It does not report
   press duration, speed or sending metrics.
8. Learn and Test import that same shared input rather than maintaining separate
   dit/dah entry widgets.

The existing first-exposure `unstarted → learning` transition remains in
`Learn.tsx`; it is not evidence from a formative retrieval.

## Preserved boundaries

#56 does not change:

- the exact printed A–Z completion claim;
- the 26 typed bidirectional scoring units;
- scheduler/retention resolution or the requirement for both directions;
- Learn acquisition evidence vs formal Test evidence separation;
- migration or export/import integrity;
- any non-Morse topic;
- #29's future separately stated auditory-reception, sending, WPM, groups, words
  or continuous-material competency.

It does intentionally change the **response mechanism** on supported printed
Test rungs from multiple choice to keyed production. The cue state names remain
durable-compatible even where an older state name contains `choice`.

## Validation boundary

Automated coverage establishes, among other invariants:

- every unanswered visual letter → Morse Learn check uses keyed production and
  exposes no pattern alternatives;
- all forward printed Test rungs use the same shared keyed-production control;
- one short press classifies as one dit and one hold as one dah;
- interrupted pointers produce no phantom element;
- keyboard and accessible alternatives remain available;
- no target Play control exists on unanswered printed questions, including the
  one-signal `T` case;
- listening prompt/control text does not identify the hidden target;
- listening remains the only Morse Learn multiple-choice prompt;
- listening answers do not fade, restore, settle or durably write printed
  acquisition state;
- `Can't listen now` applies no retrieval/support penalty and suppresses the
  rest of the sitting;
- a fully audio-suppressed sitting still ends at exactly 10 answered retrievals;
- #51 packet/sitting separation remains intact;
- Learn still cannot award formal directional, retention, scheduler or
  completion evidence;
- touch sizing, keyboard/screen-reader semantics, text scaling and reduced
  motion remain covered by the repository gate.

These tests establish product/evidence correctness, not auditory learning
effectiveness or a reception-performance claim. Real-device learner validation
remains necessary for those pedagogical judgments.
