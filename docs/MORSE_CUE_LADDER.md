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

The resulting rule is simpler: **support fades, production stays production.**
