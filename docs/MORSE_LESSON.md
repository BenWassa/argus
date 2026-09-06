# Morse Learn: guided acquisition, finite sittings, and reference

Issues #48 and #51. Parent #21. Preserves #28's completion boundary and the
#42/#44 mnemonic/audio treatment. This document describes the shipped Morse
Learn contract; #29 remains the separate future boundary for auditory reception,
sending, WPM, groups, words, and continuous material.

Primary code:

- `src/lib/morseLesson.ts` — durable acquisition/packet policy;
- `src/lib/morseLessonSitting.ts` — runtime-only finite-sitting policy;
- `src/features/learn/MorseLesson.tsx` — lesson surface;
- `src/features/learn/MorseReference.tsx` — A–Z lookup surface;
- `src/features/learn/MorsePhrase.tsx` — shared rhythmic phrase rendering.

Primary tests:

- `src/lib/morseLesson.test.ts`;
- `src/lib/morseLessonSitting.test.ts`;
- `src/features/learn/MorseLesson.test.tsx`;
- `src/features/learn/MorseReference.test.tsx`;
- `src/features/learn/MorseAcquisitionTreatment.test.tsx`.

## Product model

Morse exposes three jobs without changing Argus's global **Learn + Test** model.

| Surface | Job | Durable writes |
| --- | --- | --- |
| **Learn / Continue lesson** | guided acquisition: introduce, retrieve, reteach, interleave, fade support | `Topic.lessonProgress` only |
| **Test** | formal scored retention/completion | scheduler state + cue/directional evidence |
| **Morse alphabet** | freely available A–Z lookup | none |

Practice is not a third mode. Formative retrieval lives inside Learn. The
alphabet is a reference surface, not a scheduled/scored mode.

The formal completion claim remains exactly:

> Can independently recall all A–Z printed Morse mappings in both directions.

There are exactly 26 logical scoring units, all typed bidirectional. Learn never
satisfies that claim by itself.

## Two independent progress clocks

#51 separates **how long the current sitting lasts** from **whether the current
packet is acquisition-ready**.

### Sitting progress — finite and runtime-only

Every normal Morse Learn sitting has a target of **10 answered formative
retrievals**.

- one answered retrieval consumes one unit whether correct or wrong;
- one answered retrieval earns one session XP/point;
- introductions do not consume the budget;
- feedback/reteach screens do not consume the budget;
- mistakes cannot extend the sitting beyond the target;
- `Close` remains available at any time;
- if the whole A–Z Learn programme finishes before another retrieval is
  possible, the programme-complete screen is the natural earlier endpoint.

Session XP is deliberately simple: it is a visible finite-work target, not a
measure of mastery. Correctness still controls acquisition support and weak-item
routing. There is no lifetime XP, streak, league, currency, shop, daily goal, or
reward economy.

The sitting state is a plain runtime value in `morseLessonSitting.ts`:

```ts
interface LessonSitting {
  retrievals: number
  correct: number
  revisitItemIds: string[]
}
```

It is never written to `Topic`, storage, export/import data, cue evidence,
directional evidence, or scheduler state. Dismissing the summary discards it.

### Packet progress — durable acquisition state

Packet readiness remains exactly the #48 contract. A packet advances only when
every roster character is `settled` under the Learn support model. The packet
index is derived from durable per-item support rather than stored as an
independent counter.

Consequences:

- one packet can span several finite sittings;
- a strong sitting can settle a packet before 10 retrievals;
- when that happens and retrieval budget remains, the same sitting may continue
  into the next packet;
- ending a sitting never falsely settles a packet;
- reopening Learn rebuilds from the durable unresolved acquisition state rather
  than replaying the prior sitting's transient queue.

The UI makes the distinction explicit. The header presents **Packet N of 13**
and **X / 10 XP**. The main progress bar represents the finite sitting target.
The current packet's settled count remains visible as secondary acquisition
context rather than the dominant goal.

At the endpoint the summary shows:

- XP earned in this sitting;
- number correct;
- unique letters to revisit;
- current packet progress;
- packet(s) settled during the sitting when applicable;
- a primary `Next lesson` action and a quiet exit.

## Packet ordering and new-item load

P1/P2 from `docs/MORSE_CHARACTER_ORDER.md` remain authoritative:
complexity-ascending ordering with final-element confusables separated, two novel
characters per packet, and up to five characters on the roster.

The roster size is not the simultaneous new-item load. A packet introduces two
new mappings; later rosters include prior material for interleaved retrieval.

## Learn support ladder

Learn support remains separate from the Test cue ladder:

| Support | Live printed check | Response |
| --- | --- | --- |
| `taught` | rhythmic phrase with beat marks | choose a pattern |
| `cued` | element count and, until #52 changes the modality contract, optional target playback | choose a pattern |
| `solo` | glyph only | key the pattern |
| `settled` | same unaided format as `solo` | key the pattern when returned for interleaving |

`settled` means only that Learn can withhold its acquisition scaffold. It is not
retention, completion, or formal Test evidence.

One correct printed retrieval fades one support level. A miss restores support
appropriate to the format that failed. A miss at an unaided format therefore
returns to `cued`, not to another visually identical unaided state.

The correction screen reteaches the useful material — rhythmic phrase, SVG,
canonical pattern, and acquisition-speed audio — rather than only displaying a
wrong marker.

## Weak-item recurrence and interleaving

A missed character is barred for `WEAK_ITEM_DELAY_STEPS = 2` lesson steps.
`nextStepIndex` additionally avoids `miss → correction → same question` when
possible by reopening other settled roster material as interleaved retrieval.

Returning characters from earlier packets arrive settled and are asked unaided.
A miss on a returning character restores support and can block true packet
readiness until it is produced unaided again.

Sequencing and distractors are deterministic. Supported-check alternatives are
drawn from encountered material and deterministic padding, avoid a target's
final-element confusable during initial acquisition, and prefer same-length
patterns where the element count is disclosed.

## Leaving, resuming, and sitting boundaries

`Topic.lessonProgress` is written after meaningful acquisition changes. The
within-sitting queue and session XP are not persisted.

Therefore:

- leaving midway preserves support already earned;
- reopening starts a fresh 10-retrieval sitting;
- already introduced items are not introduced again merely because the prior
  sitting ended;
- the first packet not fully settled is reconstructed from durable support;
- weak items remain weak because their support level persisted, while transient
  queue timing is rebuilt deterministically.

This deliberately avoids a second durable session-state machine.

## Why Learn cannot award formal evidence

The separation is structural, not copywriting.

1. `morseLesson.ts` imports no scheduler, Test cue ladder, distractor engine, or
   item-completion module.
2. `answerLesson` takes and returns a `LessonRun`; it does not receive a `Topic`.
3. `withLessonProgress` is the only acquisition function that writes a topic,
   and it changes only `lessonProgress`.
4. `MorseLesson.tsx` has one `upsertTopic` path, through
   `withLessonProgress(topicRef.current, lessonProgressOf(next))`.
5. `morseLessonSitting.ts` does not receive or mutate a topic at all.
6. A perfect Learn programme leaves formal directional coverage absent, so a
   later formal Test still has to demonstrate the exact bidirectional boundary.

The existing first-exposure transition from `unstarted` to `learning` still
belongs to `Learn.tsx` when Learn opens. Formative retrievals do not create
additional scheduler transitions.

## Durable state

The only Morse-Learn-specific durable state is:

```ts
export type LessonSupport = 'taught' | 'cued' | 'solo' | 'settled'
export type ItemLessonStore = Record<string, LessonSupport>
// Topic.lessonProgress?: ItemLessonStore
```

No schema version bump was required for #48 or #51. An absent field means no
lesson progress. Parsing validates item IDs and support values, edit operations
prune deleted items, and export/import remains lossless.

The Test `ItemCueEvidence` store is intentionally not reused. Its directional
fields participate in formal completion gating; writing Learn activity there
would blur the exact evidence boundary this programme exists to preserve.

## Morse alphabet reference

The reference exposes all 26 letters alphabetically at all times. Each entry
contains the letter, rhythmic phrase with aligned beat marks, canonical notation,
secondary timing drawing, and compact Play/Stop control.

It imports no learner store/scheduler/cue ladder and therefore mutates nothing.
The mnemonic grammar is shared with Learn; casing carries no timing semantics,
and aligned `·`/`—` marks make deliberate repeated words read as repeated Morse
beats rather than duplicated text.

See `docs/MORSE_VERBAL_MNEMONICS.md` for the mnemonic grammar and provenance.

## Audio and visual acquisition treatment

#42/#44 remain in force:

- rhythmic verbal mnemonic is the primary early memory hook;
- SVG is secondary;
- audio is generated from canonical Morse timing;
- acquisition playback uses `LEARN_ACQUISITION_MORSE_TIMING` at 12 character
  WPM;
- the compact Play control is accessible and touch-sized;
- none of these cues may leak into the uncued formal Test boundary.

#52 follows #51 and corrects one remaining Learn defect: target playback inside a
printed recall question can reveal the answer. That change is deliberately not
pre-implemented by #51.

## Preserved boundaries

#48/#51 do not change:

- the exact printed A–Z completion claim;
- 26 bidirectional scoring units;
- formal Test directional evidence;
- scheduler/retention semantics;
- the uncued completion boundary;
- migration/export/import integrity;
- any non-Morse topic;
- #29's separate auditory-reception/sending/WPM/groups/words/continuous-material
  claims.

## Validation boundary

Automated coverage proves the structural contract, including:

- all A–Z reference content remains canonical and non-mutating;
- first-packet new-item load and support fading/restoration;
- delayed weak-item recurrence and interleaving;
- packet readiness remains dependent on settled acquisition state;
- an all-wrong sitting still ends after 10 answered retrievals;
- introductions do not consume the sitting budget;
- every completed retrieval earns exactly one session XP;
- one packet may span sittings;
- a sitting may cross into a subsequent packet after genuine readiness;
- session XP stays outside durable learner state;
- Learn cannot award scheduler, directional, retention, or completion evidence;
- Test remains bidirectional and uncued at the completion boundary;
- reduced motion, text scaling, focus, touch sizing, and readable progress copy
  remain covered.

Automated checks establish correctness, not learning effectiveness. Real-device
learner validation remains the evidence for whether the 10-retrieval sitting,
new-item load, cue-fade pace, and correction treatment feel appropriate in
practice.
