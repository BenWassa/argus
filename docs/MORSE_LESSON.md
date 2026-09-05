# The guided Morse lesson, and the Morse alphabet reference

Issue #48. Parent #21. Refines #42/#44; preserves #28's completion boundary;
implements nothing from #29 and nothing from #45.

Code: `src/lib/morseLesson.ts` (the whole policy),
`src/features/learn/MorseLesson.tsx` (the lesson surface),
`src/features/learn/MorseReference.tsx` (the alphabet),
`src/features/learn/MorsePhrase.tsx` (the one phrase rendering).
Tests: `src/lib/morseLesson.test.ts`, `src/features/learn/MorseLesson.test.tsx`,
`src/features/learn/MorseReference.test.tsx`,
`src/features/learn/MorseAcquisitionTreatment.test.tsx`.

## The product correction

The Morse topic was doing two jobs on one surface. Learn was a scrollable
curriculum: thirteen packets of up to five cards, each with a phrase, a drawing
and a Play button, all present at once. That is a fine **reference** and a poor
**lesson** — it asks the learner to infer `study → test → repeat → advance` for
themselves, and it never checks whether any of it landed.

#48 splits the two and leaves the global product model alone:

| Surface | Job | Writes |
|---|---|---|
| **Learn / Continue lesson** | guided acquisition: introduce, retrieve, reteach, interleave, advance | `Topic.lessonProgress` only |
| **Test** | the sole scored retention/completion path | scheduler state and cue evidence, exactly as before |
| **Morse alphabet** | freely available A–Z lookup | nothing |

Practice is **not** back as a third product mode. `Mode` is still
`learn | test`, the scheduler still routes only to those two, and the formative
retrieval that a Practice mode would have carried lives inside Learn. The
alphabet is a lookup surface, not a mode: it is never scheduled, never scored
and never routed to by `modeFor`.

## The lesson policy

The whole policy is `src/lib/morseLesson.ts`: pure functions over a plain
`LessonRun` value. The React surface renders `currentStep()` and reports one
answer back through `answerLesson()`, so every decision below is exercised
exhaustively in tests without a DOM.

### Packet ordering and new-item load — unchanged

P1 and P2 from `docs/MORSE_CHARACTER_ORDER.md` are reused verbatim:
complexity-ascending order with final-element confusables split; two novel
characters per packet; up to five characters on the roster. #48 does not
re-litigate them. It stops presenting a packet as five cards to scroll.

The five-card figure was never the acquisition load and still is not. A lesson
introduces exactly `DEFAULT_PACKET_PLAN.novel` = 2 new mappings; the rest of the
roster is prior-packet material returning for retrieval.

### The support ladder

Learn has its own ladder, deliberately separate from the Test cue ladder:

| Support | The check shows | Response |
|---|---|---|
| `taught` | the whole rhythmic phrase, with its beat marks | choose 1 of 3 patterns |
| `cued` | the element count, and an optional Play | choose 1 of 3 patterns |
| `solo` | the glyph, and nothing else | key the pattern |
| `settled` | (same unaided format as `solo`) | key the pattern |

`settled` is a statement about scaffolding and nothing else. It is not
retention, not completion, and it satisfies no part of the Test boundary.

### The decisions #48 asked to be resolved explicitly

**New-item load vs packet size.** Two novel characters per lesson, five roster
characters maximum. Independent configuration, as P2 requires.

**First retrieval after introduction.** Every not-yet-introduced roster
character is introduced first, in packet order; retrieval begins after the last
of them. With two novel characters, the first is retrieved one step after its
own introduction — soon enough to be retrieval, with one item of intervening
material so it is not an echo of what is still on screen.

**Cue reduction after success.** One correct retrieval fades one level. This is
faster than Test's `CUE_FADE_STREAK` of two, deliberately: Test's streak governs
durable evidence about scored performance, while a lesson is a few minutes long
and its job is to hand the learner to the unaided format quickly (PRD §5.5,
diminishing cues). A novel character therefore needs three correct retrievals —
one at each level — to settle.

**Errors restore support.** A miss restores one level below the *format* that
was used. `solo` and `settled` share the unaided format, so a miss at either
returns to `cued` rather than to a level that would show nothing. A miss never
resets to the bottom: an error is evidence about the character, not a verdict on
the learner. The feedback panel reteaches — phrase, drawing, Play, canonical
pattern — rather than only marking the answer wrong.

**Delayed recurrence of weak items.** A missed character is barred for
`WEAK_ITEM_DELAY_STEPS` = 2 steps. On top of that, `nextStepIndex` guarantees
the missed character is never the very next step: when nothing else is pending
it reopens the roster's least recently retrieved settled character as genuine
interleaved retrieval. There is no `miss → reteach → same question` loop with
the answer still on screen. The guarantee is asserted exhaustively — every
packet, every position in the lesson.

**Interleaving prior packets.** The roster's returning characters come from
`buildCharacterPackets` and arrive already `settled`, so they are retrieved
unaided. A miss on one drops it back down the ladder and blocks the packet until
it is produced unaided again. That is the difference between interleaving and
decoration.

**Packet readiness.** A packet advances only when **every** roster character —
novel and returning — is `settled`. Nothing else advances it. The packet index
is *derived* from durable support levels rather than stored as a counter, so
there is no separate field that could drift from what the learner has produced.

**Leaving and resuming.** Support levels are written after every step, so an
interrupted lesson never loses ground already earned. The within-lesson queue is
not persisted: reopening Learn rebuilds the current packet's lesson from durable
support levels and skips introductions the learner has already had. One
deliberate consequence — a learner who settles the new characters and leaves
before the returning ones come round advances the packet, and meets those
characters again as returning material in a later packet.

**Returning learners.** `startLesson` always resolves to the first packet that is
not fully settled. A learner who has never opened Learn starts at packet 1; one
who settled through packet 6 resumes at packet 7. Nobody restarts from zero and
nobody is dropped into material they never met. Once all thirteen packets are
settled, the lesson says so and points at Test and the alphabet.

### Alternatives

Deterministic, never random: the sequence a learner sees is a property of their
own answers, and can therefore be asserted. Distractors are drawn from
characters the learner has met, then padded from complexity order, and:

- a **confusable** of the target is never offered during acquisition (Rothkopf
  1958). Contrasting a pair is the Test ladder's discrimination stage, once both
  members are established. The relation is `src/lib/confusion.ts`, the same
  model Test distractors use;
- **same-length** alternatives are preferred, because the `cued` check discloses
  the element count and alternatives of a different length would let a learner
  solve it off the count rather than off the rhythm;
- the answer's position rotates with the step, so it is neither fixed nor random.

## Learn checks are formative — how that is enforced

Structurally, not by convention.

1. `src/lib/morseLesson.ts` imports no `scheduling.ts`, no `cueLadder.ts`, no
   `distractors.ts` and no `items.ts`. A lesson answer therefore *cannot* record
   a retention attempt, advance a scheduler interval, write `DirectionEvidence`,
   satisfy directional coverage or award completion.
2. `answerLesson` takes and returns a `LessonRun`. Like `recordAnswer` in the
   Test ladder, it never receives a `Topic`.
3. `withLessonProgress` is the only function in the module that sees a `Topic`,
   and it copies every other field through verbatim. A test asserts that a topic
   before and after a whole lesson is identical in every field but
   `lessonProgress`.
4. `MorseLesson.tsx` calls `upsertTopic` exactly once, with the value
   `withLessonProgress` returned. It imports no scheduler and no cue ladder;
   tests assert both the import list and the single write.
5. A perfect run through all thirteen packets leaves `status`, `history`,
   `completedAt`, `drilledAt`, `learningAt`, `lastTestedAt` and `spotCheckedAt`
   untouched, leaves `itemEvidence` empty, leaves
   `hasCompleteTopicDirectionalCoverage` false, and therefore leaves
   `retentionCorrectCount` withholding the tally. A test drives exactly that and
   then submits a full-marks attempt to `resolveAttempt`: it does not complete.
6. `resolveAttempt` resolves an identical attempt identically whether or not a
   lesson ever happened.

The one scheduler transition Learn has always made — first exposure moving an
`unstarted` topic to `learning`, which is what `modeFor` reads — is still made
once by `Learn.tsx` when the surface opens, exactly as it was for the reading
sheet. No retrieval inside the lesson adds another; `MorseLesson.tsx` does not
import `resolveStudy` at all.

## Durable state

One optional field, one enum per item:

```ts
export type LessonSupport = 'taught' | 'cued' | 'solo' | 'settled'
export type ItemLessonStore = Record<string, LessonSupport>
// Topic.lessonProgress?: ItemLessonStore
```

Everything else the lesson needs — which packet, which step, which queue, which
alternatives — is derived, so there is no second source of truth to migrate or
to drift.

**Why not reuse `ItemCueEvidence`?** Its `directions` field is what
`hasCompleteDirectionalCoverage` reads to gate a bidirectional retention
attempt. A Learn answer written there would satisfy formal Test evidence, which
is the one thing #48 forbids. Its `cue` field is the Test surface's own
scaffolding state, on a five-rung ladder with different semantics (choice
delays, directions, uncued boundaries); mapping a three-format lesson onto it
would be a lie about what the learner has demonstrated. Separate question,
separate field.

**Why no schema version bump?** There is nothing to migrate. Absent means "this
learner has no lesson progress", which is exactly right for every record written
before the guided lesson existed. `parseLessonProgress` validates as strictly as
cue evidence — unknown item ids and unknown support levels are rejected rather
than dropped — so an import either round-trips losslessly or says why it cannot.
A pre-v5 record has no durable item identity to key progress by, so its
`lessonProgress` is ignored rather than treated as an error. Editing a topic's
items prunes lesson progress for deleted items exactly as it prunes cue
evidence.

## The Morse alphabet reference

All 26 letters, alphabetically, always available. Each row carries the letter,
the rhythmic phrase with its beat marks, the canonical `·`/`—` notation with its
spoken reading, the timing drawing and one compact Play/Stop control.

It writes nothing, and that is structural: the module imports no store, no
scheduler and no cue ladder, takes no topic and no mutation callback, and
derives every letter from `MORSE_LETTERS`. `MorseReference.test.tsx` asserts
that import boundary directly, so a later edit that reaches for the store fails
the gate rather than quietly recording progress for a lookup.

The mnemonic-grammar defect #44 reported is fixed here and in the lesson by one
shared component; see `docs/MORSE_VERBAL_MNEMONICS.md` for the full account.
In short: casing is no longer semantic anywhere (every visible word is cased
identically, so `A LONG` cannot contradict a rule that no longer exists),
duration is carried by an aligned `·`/`—` mark under each word, deliberate
repetition is preserved, and one sentence per surface explains that one word is
one signal so a repeated word is a repeated beat.

## What #48 does not change

- the completion claim, verbatim: *Can independently recall all A–Z printed
  Morse mappings in both directions.*
- exactly 26 logical scoring units, typed `bidirectional`;
- typed bidirectional Test evidence and full A–Z coverage;
- `src/lib/scheduling.ts`, `PASS_THRESHOLD`, retention semantics;
- the uncued final evidence boundary, and cue evidence's separation from
  retention and completion;
- existing learner state, migration, export and import;
- every non-Morse topic's behaviour, and the reading sheet they use in Learn;
- #42/#44's corrections: the rhythmic phrase is the primary early scaffold, the
  SVG is secondary, audio is canonical and generated, acquisition playback stays
  at `LEARN_ACQUISITION_MORSE_TIMING` (12 WPM), the Play control is a compact
  accessible icon, and none of it leaks into uncued Test.

The `morse-character-packet` Learn block remains part of the durable content
model and the import/export contract, and still renders, for authored or
imported content that carries it. The seeded topic no longer embeds thirteen
packets, because the lesson derives packet composition from the same
`buildCharacterPackets` rule at run time; `src/lib/morsePacketContent.ts`, whose
only caller was the seed, is deleted rather than left as dead code propped up by
its own tests. The Test ladder's SVG cue no longer
depends on that authored metadata either: `morseAcquisitionProfile` derives
`mnemonicId` and `textLabel` from the canonical letter, and authored metadata
still overrides where a topic supplies it.

### Out of scope, deliberately

- **#29** — no auditory-reception competency, no sending, no WPM claim, no
  groups, words or continuous material. Audio in the lesson is acquisition
  support for a *printed* mapping task, exactly as it is in Test rung 3.
- **#45** — no history layer here. The lesson and the alphabet are compatible
  with its contract: the alphabet's identity is a plain serializable topic id
  held next to `run` in `App.tsx`, and the lesson is reached through the
  existing `run` route with no new microstate that would want to be a Back stop.
- **#47** — no Actions changes.
- No universal lesson engine. The one small abstraction that fell out naturally
  is `src/lib/confusion.ts`, which removes a duplicated definition rather than
  adding a layer.

## Validation boundary

Automated coverage proves structural facts: the reference is complete and
alphabetical and mutates nothing; every mnemonic, drawing and audio schedule
agrees with the canonical table; casing carries no timing information; the first
lesson introduces two characters; support fades on success and returns on error;
weak items recur after intervening material and never immediately; prior-packet
material is interleaved; a packet cannot advance without its readiness
condition; leaving and resuming behave as documented; a lesson cannot award
retention, coverage or completion; Test stays bidirectional and uncued at the
boundary; migration and export/import stay lossless.

**None of that proves the lesson teaches anyone anything.** Whether two new
characters per lesson is the right load, whether one correct retrieval is enough
to fade support, whether the reteach panel is the right amount of correction and
whether a packet feels finishable on a phone are questions for real learners on
real devices. They remain a post-deploy user-validation gate, per #48's
real-device acceptance list and PRD §15.2.
