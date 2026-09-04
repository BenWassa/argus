# Argus programme — progressive Morse-code learning

Parent issue: #21  
Research baseline: `docs/MORSE_CODE_LEARNING_PRD.md` (PR #22)  
Execution-plan origin: PR #30  
Current reconciliation baseline: post-#22 `main` at `e24ca45b62be5348e26ca2f291f633e1fe56cda3`

## Document hierarchy

The Morse PRD is retained as the **dated research/design baseline** that motivated
the programme. It deliberately left implementation questions open.

For settled/current behaviour, authority is narrower and newer:

1. merged implementation + tests;
2. ratified decisions in this programme plan;
3. focused durable design records such as `MORSE_CHARACTER_ORDER.md`,
   `MORSE_MNEMONIC_GRAMMAR.md`, and `MORSE_CUE_LADDER.md`;
4. the PRD for research rationale and future-skill framing.

Where the PRD still describes an option as unresolved but a later decision below
is ratified/implemented, the later decision governs. This prevents a historical
research document from silently reopening v5 architecture or completion
semantics.

## Governing invariant

```text
retention state: learning / drilled / completed / decayed   (scheduler owns this)
cue state:       rich / delayed-choice / reduced / free      (acquisition owns this)
```

The durable type also reserves `auditory` cue state for later work, but auditory
reception is **not** part of the current scored Morse competency.

Cue/acquisition evidence and retention/completion evidence are separate
dimensions. Cue progress must never qualify, skip, reset, or counterfeit a
retention gap. `src/lib/scheduling.ts` remains the authority for completion.

## Current implementation state before #28

Workstreams #23–#27 are merged. The repository is now v5 at the storage boundary.
The seeded Morse topic is intentionally still the narrow #23 control topic:

> **International Morse — Letters (printed):** 26 printed letter → canonical
> dit/dah mappings, one direction only.

It has progressive Learn packets and the progressive Test ladder, but its items
remain `forward`. The reverse free-response rung therefore remains dormant for
that seed topic. That is correct: activating reverse scoring would widen the
completion claim and belongs to #28.

Nothing in this documentation lane changes runtime code, learner state, item
identity, scheduler history, cue evidence, or the #28 migration/absorption job.

## Decisions register

| # | Decision | Settled answer | Status | Implemented by |
|---|---|---|---|---|
| D1 | Bidirectional scoring against whole-deck completion | Typed bidirectional item; 26 logical scoring units | Ratified | #24 / PR #33; activation for full A–Z topic belongs to #28 |
| D2 | Stable item identity | Generated durable item id preserved through authoring | Implemented default | #24 / PR #33 |
| D3 | Where acquisition rungs live | Cue rungs inside Test; scheduler untouched | Ratified | #27 / PR #35 |
| D4 | Morse Learn representation | Narrow typed `morse-character-packet` block | Implemented default | #24 / PR #33; rendered by #26 |
| D5 | Per-item acquisition evidence | Topic sibling of scheduler `history`, keyed by item id | Implemented default | #24 / PR #33 |
| P1 | Character order | Complexity-ascending with final-element confusables split | Ratified | #26 / PR #34 |
| P2 | Novel characters per packet | Up to 5 visible, 2 novel; independent config | Implemented default | #26 / PR #34 |
| P3 | Cue fading | Two consecutive correct at current rung; latency recorded but not gating | Implemented default | #27 / PR #35 |
| P4 | Default audio speed | 20 WPM character, ~9 WPM effective; adjustable | Implemented default | #25 / PR #31 |
| P5 | Mnemonic asset model | Original timing-grammar SVGs; no borrowed per-letter artwork | Implemented default | #26 / PR #34 |
| P6 | Temporary printed baseline | Ship it, then #28 must absorb/supersede it cleanly | Ratified | #23 / PR #32 |

## Why v5 exists

The pre-Morse v4 model could not safely express per-item acquisition evidence or
bidirectional coverage:

- items had no durable identity;
- item directionality was implicit;
- `Attempt` contained only whole-session retention evidence;
- `LearnBlock` could not represent a Morse packet.

#24 therefore made v5 the storage/export boundary while preserving the legacy
v4 seed as a migration input. Current exported/runtime libraries are normalized
to v5; supported older libraries migrate forward. Cue evidence is portable but
remains structurally separate from scheduler history.

## P1 — character order: reconciled provenance

### The decision

Argus uses a deterministic complexity-first order, then separates characters
that differ only in the final element so that those strongest documented
confusables are not introduced together.

```text
E I T A N S M U R D W K G H O V F L B P X C Z J Y Q
```

The result is **not official and not claimed optimal**. It is a product decision
for the printed first boundary, constrained by documented aural-confusion
research so it does not gratuitously work against later reception training.

### Corrected external comparison

Earlier planning shorthand referred to “Koch and CW Academy orders.” The
provenance review has tightened that wording:

- **Koch (1936):** primary source for an auditory/whole-character training
  method. No single fixed instructional “Koch sequence” is treated as verified.
  Modern trainers use differing Koch-style orders and thresholds; those are
  implementation conventions, not an official Koch list.
- **CW Academy Beginner:** the current published character-acquisition source.
  Beginner Release 4.7 (19 February 2025) introduces letters, numerals,
  punctuation and prosigns across sessions while combining copying, sending,
  words and operating material. Its derived letter-only introduction order is
  documented in `MORSE_CHARACTER_ORDER.md`.
- **CW Academy Fundamental:** not a beginner order source. Current Fundamental
  v2.0 assumes the learner already knows the characters and focuses on instant
  recognition, sending and on-air progression.

Therefore P1 remains unchanged, but the rationale no longer depends on an
unsupported fixed Koch list or on calling Fundamental a character-order
curriculum. See `docs/MORSE_CHARACTER_ORDER.md` for the full source record.

## P2 — packet composition

Five is a maximum visible-card target, not an acquisition quota. Two new
characters are introduced per packet; remaining cards are already-encoded
characters returning for retrieval. Both values are separately configurable.

The same-screen confusable constraint outranks visual padding, so early packets
may contain fewer than five cards. This is intentional and tested.

## P3 — cue fading and Test ladder

#27 implemented five interaction rungs:

1. rich prompted recognition;
2. prompt-first delayed choice (1.5 s before alternatives);
3. reduced cue (length only);
4. uncued letter → Morse production using dit/dah input;
5. uncued printed Morse → letter response for items whose semantics require the
   reverse direction.

A cue may never reveal the whole answer. Single-element characters therefore
receive no prefix cue. Two consecutive correct answers at the current rung fade
support; an error moves one rung stronger. Latency is recorded but has no gating
power.

The ladder writes acquisition evidence even when a partial Test is abandoned,
but a partial attempt still does not become bankable retention evidence. That is
the intended separation of concerns.

## P4 — audio-speed precedent

The shipped engine defaults to **20 WPM character speed with roughly 9 WPM
effective spacing**, adjustable, without stretching the character itself.

Contemporary CW Academy material uses high character speed with wider spacing as
an operational precedent: its Beginner curriculum specifies 25 CPM copy practice
with Farnsworth spacing around 6 CPM, while Fundamental also uses 25 WPM
character speed with lower effective speeds during progression. This supports
the *pattern* of fast character rhythm + wider spacing; it is not evidence that
25/6, 20/9, or any other exact pair is universally optimal.

The 20/~9 default remains a product default that can be revisited when auditory
reception becomes a scored skill. It is not part of the current completion
claim.

## P5 — mnemonic grammar

#26 rejected per-letter borrowed illustrations and implemented an original,
uniform timing grammar:

- dit = one-unit circle;
- dah = three-unit bar;
- one-unit inter-element gap;
- left-to-right transmission order;
- visible canonical notation + spoken rhythm;
- optional illumination driven from the same timing schedule as audio;
- semantic text equivalents and no load-bearing motion.

The asset model is original by construction and does not depend on external
illustration licensing.

## Workstreams

| # | Issue | Workstream | State before #28 |
|---|---|---|---|
| 0 | #23 | Printed letter→code baseline | **Merged** via PR #32; temporary control topic remains seeded |
| 1 | #24 | Item identity, cue/evidence model, v5 migration | **Merged** via PR #33 |
| 2 | #25 | Morse synthesis, timing, accessibility | **Merged** via PR #31 |
| 3 | #26 | SVG grammar + progressive Learn | **Merged** via PR #34; provenance wording reconciled in docs lane |
| 4 | #27 | Progressive Test + cue fading | **Merged** via PR #35 |
| 5 | #28 | A–Z bidirectional curriculum + mobile acceptance | **Next implementation workstream; untouched by this docs lane** |
| 6 | #29 | Auditory reception / sending / continuous material | Deferred until validated #28 |

## #28 handoff boundary

#28 may safely rely on the following already-implemented contracts:

- v5 stable item identity and migration/export/import;
- typed forward/bidirectional item semantics;
- exactly 26 logical Morse mapping units as the intended final A–Z shape;
- per-direction cue evidence separated from retention history;
- progressive Learn packets and deterministic order;
- progressive Test rungs, including dormant reverse free response;
- canonical ITU mapping/timing engine.

#28 still owns the **content/state transition** from the temporary one-direction
#23 topic to the final bidirectional A–Z curriculum. It must absorb/supersede #23
without creating two overlapping completion claims or corrupting existing
learner state.

The exact final completion claim belongs to #28 and must remain limited to
printed A–Z mapping recall in both directions. Auditory reception, sending,
words/phrases, and WPM competence remain outside it.

## Provenance sources for the order/speed comparison

- Koch, Ludwig (1936), *Arbeitspsychologische Untersuchung der Tätigkeit bei
  der Aufnahme von Morsezeichen, zugleich ein neues Anlernverfahren für Funker*.
  Bibliographic record: https://d-nb.info/570787017
- CW Academy Beginner Level CW Curriculum, Release 4.7 (19 February 2025):
  https://cwops.org/wp-content/uploads/2025/02/Beginner-curriculum.htm
- CW Academy Fundamental Level CW Curriculum, v2.0 (20 April 2025):
  https://cwops.org/wp-content/uploads/2025/04/CW-Academy-Fundamental-Curriculum-v2.0.htm
- Long Island CW Club, *The LICW Method Guide* v1.6 (2026), secondary historical
  review distinguishing Koch's method from the commonly repeated KMR sequence:
  https://longislandcwclub.org/wp-content/uploads/2026/04/The-LICW-Method-Guide-Version-1.6.pdf
- Spragg (1943): https://doi.org/10.1037/h0054213
- Rothkopf (1958): https://doi.org/10.1037/h0042909

## Non-negotiable invariants

- Every completion claim stays explicit, finite, and completely testable.
- The temporary #23 one-direction scope remains honest until #28 deliberately
  changes it.
- Cue-bearing content cannot reach uncued rungs.
- Cue progress cannot advance, skip, reset, or postpone retention milestones.
- Bidirectional completion cannot be inferred from one-direction evidence.
- Audio exposure does not imply an auditory-reception completion claim.
- No external character order is described as official or optimal without
  evidence establishing that status.
- Existing non-Morse topics keep their scheduler and completion semantics.
- Export/import and migration preserve durable learner state.
