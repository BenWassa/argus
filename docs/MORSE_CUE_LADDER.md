# The acquisition ladder inside Test

Workstream 4 (#27). Implements **D3 (ratified)** and **P3 (default)** from
`docs/MORSE_PROGRAMME_PLAN.md`.

Code: `src/lib/cueLadder.ts` (rungs, fading, evidence), `src/lib/acquisition.ts`
(which topics the ladder drives, and what a rung may show),
`src/lib/distractors.ts` (evidence-informed alternatives),
`src/features/test/ProgressiveCard.tsx` (the surface).

## D3 — the ladder is cue rungs inside Test

`modeFor()` returns `'learn'` only while a topic is `unstarted`, and after first
exposure the scheduler never routes back. Rather than teaching the scheduler
about unfinished acquisition, stages A and B are the richest cue rungs *inside
Test*. Learn keeps its job — ungraded first exposure and reference — and there
is no third mode.

**`src/lib/scheduling.ts` is not modified and is not imported by any module in
this workstream except `Session`, which calls `resolveAttempt` exactly as it
did before.**

## The rungs

| # | Rung | Stored cue | Direction | Response | Alternatives | Scaffolding |
|---|---|---|---|---|---|---|
| 1 | Prompted recognition | `rich` | letter → pattern | choice | immediate | first ⌈n/2⌉ elements, plus the length |
| 2 | Delayed choice | `delayed-choice` | letter → pattern | choice | after 1.5s | first element, plus the length |
| 3 | Reduced cue | `reduced` | letter → pattern | choice | after 1.5s | the length only |
| 4 | Free production | `free` | letter → pattern | dit/dah entry | — | none |
| 5 | Free reception | `free` | pattern → letter | character entry | — | none |

A cue is never the whole answer: the revealed prefix is capped at one element
short of the pattern, so a single-element character gets no prefix cue at all.
There is a test asserting this for every rung and every character.

### Why 1.5 seconds

Per van den Broek et al. (2023) the prompt stands alone briefly before
alternatives become available, creating a retrieval opportunity before
recognition support arrives. The delay is tuned for a phone rather than copied
from the published figure: long enough to attempt retrieval, short enough that a
26-item run does not become an exercise in waiting.

### Why rungs 4 and 5 share one stored cue state

`CueState` has one `free` value, and both uncued rungs are genuinely uncued —
the thing that differs is the *direction*, which the evidence store already
records per direction. So the rung is derived: production comes first, and
reception opens only once production has held a full fade streak, and only for
an item whose content semantics require the reverse direction.

This keeps directional coverage mechanically correct. A `forward` item tops out
at free production, because that is all its declared coverage claims; only a
`bidirectional` item reaches reception. `hasCompleteDirectionalCoverage` from
workstream 1 remains the authority on what an item has actually proved.

## P3 — what triggers fading

Fade on **N consecutive correct answers at a rung**, N = 2, accuracy-primary.

- The streak means *consecutive correct at the current rung*, so it resets when
  the rung changes.
- An error breaks the streak and restores stronger scaffolding by **one** rung,
  never below the richest. An error is evidence about this item, not a verdict
  on the learner.
- **Latency is recorded from the first session and gates nothing.** Per PRD
  §11.2 it must not quietly become a completion requirement for a topic whose
  scope says nothing about speed, and the distribution has to exist before any
  threshold on it is better than a guess. There is a test asserting that two
  identical answer sequences 375× apart in latency produce identical cue state.

## The invariant: cue state is not retention state

```text
retention state: learning / drilled / completed / decayed   (scheduler owns this)
cue state:       rich / delayed-choice / reduced / free     (acquisition owns this)
```

Enforced structurally rather than by convention:

- `recordAnswer` takes and returns cue evidence only. It never receives a
  `Topic`, so it *cannot* touch status, history or a retention timestamp.
- `withItemEvidence` and `mergeItemEvidence` are the only functions here that
  see a topic, and they copy every other field through verbatim. A test asserts
  that a topic before and after a full climb up the ladder is identical in every
  field except `itemEvidence`.
- `resolveAttempt` resolves the same attempt identically whether cue evidence is
  absent, at the richest rung, or at the top of the ladder — also tested.
- Cue state and retention state are independently settable in both directions.

A ladder answer is objectively graded rather than self-scored, but it feeds the
*identical* tally: the scheduler still sees one clean run of every item in the
topic, and `PASS_THRESHOLD` is untouched.

One deliberate difference from the self-scored card: leaving a Test early
discards the partial attempt, exactly as it always has, but **writes out the cue
evidence**. The all-or-nothing rule is a statement about retention, not about
acquisition evidence, and treating them the same would collapse the distinction
this document exists to protect.

## Cue-bearing content cannot reach an uncued rung

Everything a rung may show besides the prompt is built by one function,
`buildCuePayload`, into a plain object. Whether a cue can reach an uncued rung
is therefore a property of a value, and is asserted mechanically for every rung
and every character rather than checked by reading JSX:

```ts
expect(Object.keys(buildCuePayload(uncuedRung, character))).toEqual(['rungId'])
```

A cue field added later without a rung check fails that test rather than
reaching a learner. Rendering is checked too: no cue panel, no mnemonic id, no
authored label and no notation appears above the response controls at rungs 4
and 5, and the reception rung never shows the glyph it is asking for.

The `mnemonicId` slot exists so that workstream 5 can render artwork for the
disclosed prefix at the cued rungs. Artwork at that slot must draw
`revealedPattern` only — never the full pattern.

## Distractors

Evidence-informed and stage-aware, implementing the programme rule:

> during acquisition — separate highly confusable characters, per Rothkopf;
> during discrimination — deliberately contrast confusable pairs once both are
> learned, per Spragg.

The confusion relationship is **derived from the answers**, not hard-coded: a
weighted blend of edit distance, shared opening and equal length, calibrated so
that a same-length pair differing only in its final element is caught from two
elements upward, along with near-misses like `...`/`....`.

`.` and `-` score *below* the threshold, correctly. They differ only in a final
element, but there is no shared opening to hold in mind before the difference
arrives, which is the mechanism the confusion families describe. Treating E and
T as a confusable pair here would misapply the finding.

Selection, then:

- **Acquisition** (item on rung 1 or 2): prefer alternatives the learner has
  already established *and* that are clearly different, so a wrong option is
  wrong for an obvious reason.
- **Discrimination** (item on rung 3 or beyond): prefer established confusables.
  That is the whole point of the stage.
- **In both**: a confusable that is not itself established is never used.
  Contrasting a pair requires both members to be learned, not one. It is
  admitted only as a last resort, when the pool cannot otherwise fill the
  alternatives at all — a prompt with no alternatives is worse than a hard one.

Within equally suitable candidates the choice is randomised, so a learner is not
asked the same three alternatives every time.

## Which topics the ladder drives

A topic qualifies only when **every** scored item is a canonical
ITU-R M.1677-1 `letter → pattern` mapping. A partial deck, a mapping that
disagrees with the standard, or a topic that merely mentions Morse falls through
to the existing reveal-and-self-score card, unchanged. Tests assert that every
other seeded topic — NATO, OODA, Primary Survey, bearings — still does.

Recognition is derived from the standard rather than from the presence of Learn
artwork, so the ladder does not depend on which workstream supplied the Learn
content. When a topic's Learn content *does* carry a `morse-character-packet`,
its `mnemonicId` and `textLabel` are picked up and attached to the profile.

## Handoff to workstream 5 (#28)

The seeded printed Morse topic's items are `forward`, and its scope says so:
"One direction only: letter → canonical dit/dah pattern." Rung 5 is therefore
implemented, tested and correctly dormant for that topic — asking for the
reverse direction would claim coverage the topic does not declare.

Typing those items `bidirectional` widens a completion claim, which is
workstream 5's decision to make, not this workstream's. When #28 makes it, rung
5 activates for the seeded topic with no further change here.

## Out of scope

- No auditory-reception competency and no sending architecture. Audio is not the
  scored stimulus at any rung in this workstream; that is stage F, workstream 6.
- No change to `src/lib/scheduling.ts`, `PASS_THRESHOLD`, or any existing topic's
  behaviour.
- No cue state is written by Learn, and no Learn surface reads one.
