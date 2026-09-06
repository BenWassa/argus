# The acquisition ladder inside Test

Workstream 4 (#27), corrected by #42 and #56. Implements **D3 (ratified)** and
**P3 (default)** from `docs/MORSE_PROGRAMME_PLAN.md` while preserving #28's
bidirectional completion boundary.

Learn has its own formative support ladder (`taught / cued / solo / settled`) in
`Topic.lessonProgress`; see `docs/MORSE_LESSON.md`. Test has the separate durable
cue/evidence ladder documented here. Learn cannot write `ItemCueEvidence`.

Primary code:

- `src/lib/cueLadder.ts` — rungs, fading and cue evidence;
- `src/lib/acquisition.ts` — Morse profile, cue payload and objective grading;
- `src/features/test/ProgressiveCard.tsx` — graded Test surface;
- `src/features/morse/MorseKeyInput.tsx` — shared letter → Morse production
  control used by Learn and Test.

## Architectural boundary

The acquisition ladder stays **inside Test** rather than changing scheduler
semantics. `src/lib/scheduling.ts` remains the retention authority; `Session`
feeds it one completed topic attempt exactly as before. Cue state may withhold a
stronger claim until required evidence exists, but it cannot grant, skip or
reset a retention interval.

The core state separation remains:

```text
retention state: learning / drilled / completed / decayed   (scheduler owns)
cue state:       rich / delayed-choice / reduced / free     (Test acquisition owns)
lesson support:  taught / cued / solo / settled             (Learn owns)
```

The historical durable cue-state name `delayed-choice` is retained for migration
compatibility. After #56 it no longer means that the current UI presents answer
choices.

## #56 response rule

#56 separates **what support is visible** from **how the learner answers**.

> If the answer is a Morse pattern, the learner produces the pattern.

The first four rungs are all printed letter → Morse production. The amount of
support fades; the response control does not change. The fifth rung reverses the
printed mapping and takes a typed character.

| # | Rung | Stored cue | Direction | Response | Scaffolding |
|---|---|---|---|---|---|
| 1 | Rhythm support | `rich` | letter → pattern | shared Morse key | strict opening verbal/SVG prefix, canonical prefix, plus length |
| 2 | Reduced rhythm | `delayed-choice` | letter → pattern | shared Morse key | first verbal/SVG beat, canonical first element, plus length |
| 3 | Element count | `reduced` | letter → pattern | shared Morse key | element count only |
| 4 | Free production | `free` | letter → pattern | shared Morse key | none |
| 5 | Free reception | `free` | printed pattern → letter | character entry | none |

There are **no visual pattern alternatives** on these Test rungs. There is also
no target-audio control while a printed letter → pattern question is live. This
carries #52's answer-safety principle into Test: playing the canonical target
would disclose the pattern the learner is supposed to produce.

Listening multiple choice belongs to the distinct sound → letter formative
interaction in Learn and is not part of this printed Test ladder.

## Shared Morse key

The forward Test rungs use the same `MorseKeyInput` as Learn:

- one visible primary touch target;
- tap / short press → dit `·`;
- press-and-hold → dah `—`;
- Back removes the last element;
- Submit grades the accumulated pattern;
- keyboard equivalents: `.`, `-`, Backspace and Enter.

The tap/hold threshold is categorical input only. Duration is not exposed to the
caller or persisted, so this UI cannot become evidence of sending skill or WPM.
Pointer cancellation/lost capture emits nothing, and long-press browser behavior
is suppressed on the key.

## Cue payload safety

Everything a rung may show besides its prompt is built by `buildCuePayload`.
The first two rungs may reveal only a **strict prefix** of the canonical answer;
a cue can never equal the whole pattern. For a one-element character, prefix
reveal is therefore empty.

Rung 3 exposes only element count. Rungs 4 and 5 are fully uncued.

Tests assert for every character and rung that an uncued payload contains only:

```ts
{ rungId }
```

and that rendered uncued cards contain no verbal mnemonic, SVG cue, answer
notation, target audio or length hint.

The `mnemonicId` path renders only `revealedRawPattern`, never the whole pattern.
That keeps the SVG a secondary partial timing scaffold rather than an answer
surface.

## Why rungs 4 and 5 share one stored cue state

`CueState` has one `free` value because both final rungs are genuinely uncued.
The difference is direction, already represented in per-direction evidence.
Production comes first. Printed reverse recall opens only after forward
production has held a full fade streak and only for items whose declared content
semantics require the reverse direction.

A `forward` item therefore tops out at free production. A `bidirectional` item
can reach free reception. The name `free-reception` means **printed pattern →
letter** reverse recall; it is historical implementation vocabulary and is not
an auditory-reception competency.

## P3 — fading and errors

Fade on **N consecutive correct answers at a rung**, with `N = 2`.

- The streak means consecutive correct answers at the current rung and resets
  when the rung changes.
- An error breaks the streak and restores stronger scaffolding by one rung,
  never below the richest rung.
- Latency is recorded but gates nothing. It cannot silently become a speed or
  WPM completion requirement.

Changing the response widget in #56 does not alter these state transitions.

## Cue state is not retention state

This is structural rather than conventional:

- `recordAnswer` takes and returns cue evidence only; it does not receive a
  `Topic` and cannot modify retention status/history/timestamps.
- `withItemEvidence` and `mergeItemEvidence` copy every non-evidence topic field
  through unchanged.
- `resolveAttempt` produces the same retention resolution for the same attempt
  regardless of cue-state depth.
- cue and retention state remain independently settable.

A graded Morse Test answer still feeds the same topic tally. #28 adds the
bidirectional evidence gate in `Session`: `retentionCorrectCount` prevents an
incomplete-direction run from being presented to the scheduler as a passing
attempt. Cue evidence can therefore **block** an unsupported completion; it
cannot create one.

Leaving Test early still discards the partial retention attempt while preserving
cue evidence already earned. That distinction is intentional: retention attempts
are atomic at topic level; acquisition evidence is per item/direction.

## #68 — the completion-evidence audit

#62 lane F asked one question about the exact claim:

> Can independently recall all A–Z printed Morse mappings in both directions.

> Does the completion-qualifying delayed Test itself honestly support it, and can
> historical supported/cued evidence improperly supply part of it?

### What the audit found

Two real defects, both in the evidence layer rather than the scheduler.

**1. Supported answers counted as independent recall.** `DirectionEvidence`
carried one counter, `correct`, and `hasCompleteDirectionalCoverage` read it.
`correct` is the right input for *fading* — getting a letter right with support
is genuine acquisition progress and should fade the cue. It is the wrong input
for a claim containing the word `independently`. A correct answer at the rich
rung is given with half the pattern, the timing artwork, a verbal beat and the
element count on screen. Under the old gate, 26 letters answered entirely that
way satisfied directional coverage, and the delayed attempt completed.

**2. The gate had no view of the attempt at all.** `itemEvidence` is a lifetime,
monotonically non-decreasing store. Once each letter had ever been answered
correctly in each direction, coverage was permanently true and could never fall
again. It had stopped being a gate on the qualifying run and become a one-time
historical latch. A learner whose letters had slipped back to a cued rung could
answer the delayed test with cues visible and still bank the claim.

A third finding follows from the ladder rather than the gate. `rungIndexFor`
opened reverse recall on `forward.consecutiveCorrect >= CUE_FADE_STREAK`, and
that counter only falls on a forward error. Once an item reached free reception
it was never asked forward again, so there were no forward answers left to make
one. Production was permanently abandoned after two answers, and **every** later
qualifying Test was reception-only — while the claim asserted both directions.

### What #68 changes

**Independence is recorded, not assumed.** `DirectionEvidence` gains
`unassistedCorrect`: correct answers given at a rung that shows no artwork, no
verbal fragment, no revealed prefix, no element count and no audio. One
predicate, `isAssistedRung`, defines that for both the evidence layer and
`UNCUED_RUNGS`, so "was this independent?" cannot drift from what the card
actually showed. Fading still reads `correct` and is unchanged.

**Coverage counts only independent evidence.** `hasCompleteDirectionalCoverage`
reads `unassistedCorrect`. Supported history can no longer supply any part of
the claim, in either direction.

**The attempt gives its own testimony.** `Session` records what each card asked
and how it was supported, and passes it to `retentionCorrectCount` alongside the
store. One supported answer anywhere in the run means the learner did not recall
all 26 mappings unaided today, and the run cannot present as passing. A run that
testifies about nothing, or that skips a unit, is not taken to have asked it
unaided either: silence withholds the claim rather than letting a fully
independent lifetime store be cashed in by a surface that records nothing. That
record is part of the attempt, so an early exit discards it exactly as it
discards the tally.

**The ladder keeps both directions alive.** Once both uncued rungs are open, an
item is asked in whichever required direction currently holds the weaker
independent evidence, ties going to reception so the moment reverse first opens
is unchanged. Reverse still opens only after forward production has held a full
fade streak, and a `forward` item still tops out at free production.

### What the qualifying attempt now establishes, exactly

- all 26 logical units were asked and answered correctly in this run;
- every answer in this run was given with no scaffolding of any kind;
- every unit holds independent correct evidence in both required directions,
  counting this run's answers;
- at least `COMPLETION_GAP_DAYS` had passed since the topic was drilled.

### The limit that remains, stated deliberately

One attempt asks each unit once, so it carries at most 26 of the claim's 52
directional requirements. The complementary direction is established by an
earlier attempt.

That is a property of the ratified model, not an oversight, and it is the reason
#68 does not "fix" it. The topic has exactly 26 logical scoring units. Asking
both directions of one mapping inside one card would disclose each answer with
the other — show `A`, take `·—`, then ask what `·—` is — which makes the second
response worthless. Separating them far enough apart to be honest means 52 cards,
which is the duplication the model exists to avoid.

So the strongest available contract is the one now implemented: no single
attempt can demonstrate all 52 requirements, but **every event that contributes
to the claim is now independent recall**, and the direction-alternating ladder
keeps both halves under continuing examination instead of retiring one.

### Compatibility

`unassistedCorrect` is additive within v5 and absent means zero. A pre-#68 record
never stored the support level of its answers, so an upgraded library withholds
the formal claim until it is re-earned rather than inventing independence that
was never observed. This can only withhold a claim, never fabricate one, and it
touches no scheduler state: status, history, timestamps and existing
`completedAt` records all stand. An import claiming more independent answers than
correct ones is rejected at the storage boundary.

Regression cover lives in `src/lib/morseCompletionEvidence.test.ts`, including an
end-to-end simulation proving that completion remains reachable through ordinary
honest practice and unreachable for a learner still being carried by the cues.

## Confusion model after #56

`src/lib/confusion.ts` still provides the shared derived confusability model used
by curriculum ordering and available discrimination logic. #56 removes visual
multiple-choice pattern selection from the active Morse Test ladder, so
`distractors.ts` no longer defines the learner's response on these rungs.

The research principle remains useful for sequencing and future discrimination
work:

- during acquisition, separate highly confusable characters;
- once established, contrast confusables deliberately when the task actually
  calls for discrimination.

It is no longer a reason to make letter → Morse recall multiple choice.

## Which topics the ladder drives

A topic qualifies only when **every** scored item is a canonical ITU-R M.1677-1
letter → pattern mapping. A partial deck, a mapping that disagrees with the
standard, or a topic that merely mentions Morse falls through to the existing
reveal/self-score surface unchanged.

The profile is derived from canonical content rather than depending on Learn
artwork. Authored Learn mnemonic metadata may override derived presentation
metadata without changing scored item identity or evidence semantics.

## What #56 changes and preserves

#56 intentionally changes:

- supported forward Test rungs from visual multiple choice to keyed production;
- the forward response UI to the same one-touch Morse key used in Learn;
- the former reduced-rung target-audio cue to non-answer-bearing element-count
  support only.

#56 preserves:

- all five rung identifiers and durable cue-state values;
- `CUE_FADE_STREAK` and fade/restore semantics;
- per-direction evidence;
- #28's exact completion claim and 26 logical bidirectional scoring units;
- scheduler and retention resolution;
- migration/export/import semantics;
- non-Morse Test behavior;
- #29's separate future auditory reception, sending, WPM, groups, words and
  continuous-material boundary.

#68 preserves all of the above. It adds one durable counter, changes which
counter the completion gate reads, gives that gate the attempt's own testimony,
and stops the ladder retiring a direction the claim still asserts. It changes no
rung identifier, no cue state, no fade or restore rule, no scheduler behaviour
and no completion claim.

The resulting rule is simpler: **support fades, production stays production.**
