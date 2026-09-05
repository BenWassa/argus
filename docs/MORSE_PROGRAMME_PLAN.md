# Argus programme — progressive Morse-code learning

Parent issue: #21  
Research baseline: `docs/MORSE_CODE_LEARNING_PRD.md` (PR #22; amended by #42)  
Execution-plan origin: PR #30  
Current correction: #42 — rhythmic verbal acquisition + production mobile audio

## Document hierarchy

The Morse PRD is retained as the **dated research/design baseline** that motivated
the programme. It originally left implementation questions open; #42 amends the
specific verbal-mnemonic decision that production use proved wrong.

For settled/current behaviour, authority is narrower and newer:

1. merged/current implementation + tests;
2. ratified decisions in this programme plan;
3. focused durable design records such as `MORSE_CHARACTER_ORDER.md`,
   `MORSE_VERBAL_MNEMONICS.md`, `MORSE_MNEMONIC_GRAMMAR.md`, and
   `MORSE_CUE_LADDER.md`;
4. the PRD for research rationale and future-skill framing.

Where the PRD still describes an option as unresolved but a later decision below
is ratified/implemented, the later decision governs.

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

## Current implementation state through #42

#28 absorbed the narrow #23 control topic in place. The same topic id and 26
stable item ids define 26 `bidirectional` logical units. Existing history,
retention timestamps and cue evidence survive the upgrade; a historical
forward-only completion cannot remain the active completion state for the
stronger claim.

The final boundary remains exactly:

> Can independently recall all A–Z printed Morse mappings in both directions.

#42 changes **acquisition presentation and audio robustness only**. It does not
change item identity, direction requirements, cue-state storage, fade counts,
scheduler semantics, migration, export/import, or the completion claim.

Its corrected acquisition hierarchy is:

> rhythmic verbal mnemonic + SVG + canonical pattern + audio  
> → reduced verbal/visual rhythm cue  
> → canonical/audio support  
> → uncued production and printed reverse recall

The verbal mnemonic is the primary early memory hook. The existing SVG is a
secondary timing scaffold. Neither survives into the uncued evidence boundary.

#42 is not complete until the exact production build passes genuine real-device
Android Chrome / installed-PWA acceptance. Automated Web Audio tests do not
satisfy that release gate.

## Decisions register

| # | Decision | Settled answer | Status | Implemented by |
|---|---|---|---|---|
| D1 | Bidirectional scoring against whole-deck completion | Typed bidirectional item; 26 logical scoring units | Ratified | #24 / PR #33; activated by #28 |
| D2 | Stable item identity | Generated durable item id preserved through authoring | Implemented default | #24 / PR #33 |
| D3 | Where acquisition rungs live | Cue rungs inside Test; scheduler untouched | Ratified | #27 / PR #35 |
| D4 | Morse Learn representation | Narrow typed `morse-character-packet` block | Implemented default | #24 / PR #33; rendered by #26/#42 |
| D5 | Per-item acquisition evidence | Topic sibling of scheduler `history`, keyed by item id | Implemented default | #24 / PR #33 |
| D6 | Primary early acquisition channel | Original rhythmic verbal A–Z set; SVG retained as secondary timing scaffold | Implemented in #42 branch; merge gated by real device | #42 / PR #43 |
| P1 | Character order | Complexity-ascending with final-element confusables split | Ratified | #26 / PR #34 |
| P2 | Novel characters per packet | Up to 5 visible, 2 novel; independent config | Implemented default | #26 / PR #34 |
| P3 | Cue fading | Two consecutive correct at current rung; latency recorded but not gating | Implemented default | #27 / PR #35; channels reconciled by #42 |
| P4 | Default audio rhythm | 20 WPM character, ~9 WPM effective; adjustable | Implemented default | #25 / PR #31 |
| P5 | Visual asset model | Original generated timing SVG; no borrowed per-letter artwork; secondary to verbal cue | Implemented | #26 / PR #34; role corrected by #42 |
| P6 | Temporary printed baseline | Absorb in place; retain ids/evidence/history, activate bidirectional semantics | Implemented | #28 |
| P7 | Mobile Web Audio lifecycle | Direct-play context create/resume; verify running; browser owns lifecycle suspension; explicit cancel/replay; deliberate gain; click-free 2ms element edges | Implemented in #42 branch; physical acceptance pending | #42 / PR #43 |

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

#42 adds no durable state field and no schema version. The verbal phrase table,
SVG rendering and Web Audio schedule are derivable presentation/content keyed by
canonical letter.

## P1 — character order: reconciled provenance

### The decision

Argus uses a deterministic complexity-first order, then separates characters
that differ only in the final element so those strongest documented confusables
are not introduced together.

```text
E I T A N S M U R D W K G H O V F L B P X C Z J Y Q
```

The result is **not official and not claimed optimal**. It is a product decision
for the printed first boundary, constrained by documented aural-confusion
research so it does not gratuitously work against later reception training.

### Corrected external comparison

Earlier planning shorthand referred to “Koch and CW Academy orders.” Provenance
review tightened that wording:

- **Koch (1936):** primary source for an auditory/whole-character training
  method. No single fixed instructional “Koch sequence” is treated as verified.
  Modern trainers use differing Koch-style orders and thresholds; those are
  implementation conventions, not an official Koch list.
- **CW Academy Beginner:** the published character-acquisition source used for
  comparison. Beginner Release 4.7 (19 February 2025) introduces letters,
  numerals, punctuation and prosigns across sessions while combining copying,
  sending, words and operating material. Its derived letter-only introduction
  order is documented in `MORSE_CHARACTER_ORDER.md`.
- **CW Academy Fundamental:** not a beginner order source. Fundamental v2.0
  assumes the learner already knows the characters and focuses on instant
  recognition, sending and on-air progression.

Therefore P1 remains unchanged, but the rationale does not depend on an
unsupported fixed Koch list or on calling Fundamental a character-order
curriculum. See `docs/MORSE_CHARACTER_ORDER.md` for the full source record.

## P2 — packet composition

Five is a maximum visible-card target, not an acquisition quota. Two new
characters are introduced per packet; remaining cards are already-encoded
characters returning for retrieval. Both values are separately configurable.

The same-screen confusable constraint outranks visual padding, so early packets
may contain fewer than five cards. This is intentional and tested.

## P3 — cue fading and Test ladder after #42

The durable five-rung ladder and its identifiers remain unchanged:

1. `rich-recognition` — **rhythm cue**: immediate choice, strict opening verbal
   + SVG + canonical prefix and length;
2. `delayed-recognition` — **reduced rhythm**: 1.5 s before alternatives, first
   verbal/SVG/canonical beat and length;
3. `reduced-recognition` — **canonical support**: 1.5 s before alternatives,
   length plus optional user-triggered canonical Morse audio, no verbal/SVG;
4. `free-production` — uncued letter → Morse dit/dah entry;
5. `free-reception` — uncued **printed** Morse → letter response for items whose
   semantics require the reverse direction.

The historical implementation name `free-reception` means printed pattern →
letter reverse recall here. It is not an auditory-reception claim.

A cue may never reveal the whole answer. Single-element characters receive no
prefix cue. Two consecutive correct answers at the current rung fade support;
an error moves one rung stronger. Latency is recorded but has no gating power.

`buildCuePayload` is the single cue-channel boundary. For either uncued rung its
only key is `rungId`: no verbal phrase, SVG, audio, length or canonical prefix can
reach the scored uncued surface.

The ladder writes acquisition evidence even when a partial Test is abandoned,
but a partial attempt still does not become bankable retention evidence.

## P4 — audio-speed precedent

The engine defaults to **20 WPM character speed with roughly 9 WPM effective
spacing**, adjustable, without stretching the character itself.

Contemporary CW Academy material uses high character speed with wider spacing as
an operational precedent. This supports the *pattern* of coherent character
rhythm + wider spacing; it is not evidence that an exact pair is universally
optimal.

The 20/~9 default is not part of the current completion claim.

### #42 audio correction

The original Web Audio implementation was structurally vulnerable on mobile:

- it resumed only the literal `suspended` state rather than any non-running
  context;
- it did not verify that `resume()` actually reached `running`;
- app-driven asynchronous `suspend()` on background could race the next direct
  foreground Play activation;
- UI highlight timing used a separate hard-coded start offset;
- every element was gated with instantaneous gain steps, so each edge carried a
  waveform discontinuity audible as a click; at dit length that click competes
  with the tone itself;
- the default linear gain was only `0.12` despite a production-phone audibility
  report.

#42 corrects the lifecycle contract:

- context creation/resume occurs on the direct Play path;
- any non-running state (including interrupted implementations) is resumed and
  checked before oscillator/gain nodes are scheduled;
- background/pagehide cancels playback, while the browser owns context lifecycle
  suspension;
- a closed context is recreated;
- replay/stop remain explicit;
- oscillator and SVG highlight share `MORSE_AUDIO_START_DELAY_MS` and the same
  canonical schedule;
- element edges carry a 2ms linear ramp, shaped inside the element window so
  canonical timing is untouched and clamped for very fast dits;
- default gain is deliberately `0.25` while device media volume/routing remain
  final controls;
- failure is actionable and non-blocking.

This is the identified implementation-level root-cause family. Physical-device
acceptance is still required to prove it resolves the reported production path.

## D6 / P5 — verbal mnemonic + visual grammar

#42 makes the intended hierarchy durable.

### Primary: rhythmic verbal mnemonic

The A–Z set is documented in `MORSE_VERBAL_MNEMONICS.md`.

- one monosyllabic word per Morse element;
- clipped beat = dit;
- held beat = dah;
- explicit `short ·` / `hold —` labels prevent accent-dependent ambiguity;
- supplied `A LONG` exemplar retained;
- remaining 25 phrases authored for Argus, not copied from a third-party list;
- all 26 convert mechanically back to the canonical `MORSE_LETTERS` table.

The phrases are acquisition scaffolding, not scored content. Automated tests can
prove pattern agreement; they do not prove human memorability/effectiveness.

### Secondary: generated SVG timing grammar

#26's useful original visual system remains:

- dit = one-unit circle;
- dah = three-unit bar;
- one-unit inter-element gap;
- left-to-right transmission order;
- canonical notation + spoken dit/dah semantics;
- optional illumination driven from the same schedule/start delay as audio;
- semantic text equivalents and no load-bearing motion.

No per-letter borrowed artwork is introduced. The existing
`argus-morse-rhythm-v1-<GLYPH>` identity remains stable, so #42 does not silently
repoint old content at new artwork.

## Workstreams

| # | Issue | Workstream | State |
|---|---|---|---|
| 0 | #23 | Printed letter→code baseline | **Merged** via PR #32; absorbed in place by #28 |
| 1 | #24 | Item identity, cue/evidence model, v5 migration | **Merged** via PR #33 |
| 2 | #25 | Morse synthesis, timing, accessibility | **Merged** via PR #31 |
| 3 | #26 | SVG grammar + progressive Learn | **Merged** via PR #34; visual role corrected by #42 |
| 4 | #27 | Progressive Test + cue fading | **Merged** via PR #35; cue channels reconciled by #42 |
| 5 | #28 | A–Z bidirectional curriculum + mobile acceptance | **Merged**, but later production use exposed #42 correction needs |
| C | #42 | Rhythmic verbal acquisition + working mobile audio | **PR #43 open; automated gate and real-device evidence required** |
| 6 | #29 | Auditory reception / sending / continuous material | **Deferred until #42 + learner validation** |

## #28/#42 completion boundary

The final printed A–Z topic preserves:

- v5 stable item identity and migration/export/import;
- exactly 26 logical bidirectional Morse mapping units;
- per-direction evidence separated from retention history;
- complete correct evidence in both required directions before a potentially
  passing retention attempt reaches the unchanged scheduler;
- no stronger claim from audio exposure or mnemonic use.

#42 does not make the topic auditory. Its final completion claim remains limited
to printed A–Z mapping recall in both directions. Auditory reception, sending,
words/phrases and WPM competence remain outside it.

## Provenance sources for order/speed/mnemonic comparison

- ITU-R M.1677-1: https://www.itu.int/rec/R-REC-M.1677-1-200910-I/en
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
- #42 rhythmic verbal method reference:
  https://youtu.be/0CYpik24pRU?si=RX5Bow1eMGFpLdV5

The video is a method/design precedent, not the canonical source of Morse and
not the source of the full Argus A–Z phrase set.

## Non-negotiable invariants

- Every completion claim stays explicit, finite and completely testable.
- Exactly 26 logical scoring units remain for printed A–Z.
- Bidirectional completion cannot be inferred from one-direction evidence.
- Cue-bearing content — verbal, visual, canonical prefix, length or audio —
  cannot reach uncued rungs.
- Cue progress cannot advance, skip, reset or postpone retention milestones.
- Audio exposure/support does not imply an auditory-reception completion claim.
- The verbal phrase is never itself a completion requirement.
- No external character order or mnemonic method is described as official or
  optimal without evidence establishing that status.
- Existing non-Morse topics keep their scheduler/completion semantics.
- Export/import and migration preserve durable learner state.
- #42 does not merge/close without genuine exact-production physical-device
  acceptance; mocked/emulated Web Audio is insufficient.
- #29 stays deferred until the corrected A–Z foundation receives real learner
  validation.
