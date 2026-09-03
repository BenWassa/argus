# Argus programme — progressive Morse-code fluency

Parent issue: #21
Design baseline: PR #22 (`docs/MORSE_CODE_LEARNING_PRD.md`)
Planning baseline: `c1cc753eb89c9aa5379d1a885892703cf20e65ba`

## Control model

This programme is coordinated from the planning chat. Implementation happens only
through the focused issues listed below, each on its own branch and pull request.
No single pull request may carry more than one workstream.

The PRD is authoritative for *what* Morse learning should do. This document is
authoritative for *the order in which Argus is allowed to change* to support it,
and for the invariants each workstream must not break.

## The invariant that governs everything

```text
retention state: learning / drilled / completed / decayed   (scheduler owns this)
cue state:       rich / reduced / delayed-choice / free / auditory   (acquisition owns this)
```

These are separate dimensions. Cue state must never become a second spelling of
the status ladder, and cue progression must never qualify, skip or reset a
retention gap. `src/lib/scheduling.ts` remains the sole authority over whether
recall evidence advances completion.

## Decisions register

Nothing in workstream 1 can open until these are answered. D-entries are forced
by the current v4 code and are argued in the next section; P-entries are left
open by the PRD and are argued in the section after that.

| # | Decision | Recommendation | Blocks |
|---|---|---|---|
| D1 | Bidirectional scoring against `PASS_THRESHOLD = 1` | Typed bidirectional item, 26 scoring units | 1, 4, 5 |
| D2 | How item identity is created and preserved | Generated stable id, preserved across authoring edits | 1, 3, 4 |
| D3 | Where acquisition stages A/B live | Cue rungs inside Test; scheduler untouched | 3, 4 |
| D4 | How Learn expresses a character packet | Narrow typed block in the validated union | 1, 3 |
| D5 | Where per-item cue evidence is stored | Sibling of `history` on the topic, keyed by item id | 1, 4 |
| P1 | Character order | Ascending complexity, aural-confusable pairs split across packets | 3, 5 |
| P2 | Novel characters per packet | 5 visible, 2 novel, both configurable | 3, 4 |
| P3 | What triggers cue fading | Consecutive correct at a rung; record latency, do not gate on it | 4 |
| P4 | Initial character and effective speed | 20 WPM character, ~9 WPM effective, adjustable | 2 |
| P5 | Original SVG mnemonic set | Yes — original, single grammar | 3, 5 |
| P6 | Ship the workstream-0 baseline topic | Your call; the programme works either way | 0 |

D1, D3 and P1 are the expensive ones. The rest are cheap to revise later.

## What the existing code forces into Phase 0

The PRD leaves several questions to implementation. Five of them are not
implementation details, because the current v4 model cannot express them at all.
They must be decided before workstream 1 opens.

### D1 — Pass threshold against a 52-prompt deck

`PASS_THRESHOLD = 1` in `src/lib/scheduling.ts`, and `Session` snapshots *every*
item in a topic per attempt. A bankable Test is therefore an all-or-nothing run
of the whole deck. The PRD's §6.2 option 1 (52 deterministic prompts, one per
direction) means a completion requires 52 consecutive correct self-scored answers
after a 30-day gap. NATO already shows the shape of this at 26; doubling it may
make the first Morse completion practically unreachable.

Resolve one of:

1. ship §6.2 option 2 — a typed bidirectional item whose coverage accounting
   proves both directions, scored as 26 units rather than 52;
2. keep 52 flat prompts and accept the difficulty;
3. change threshold policy — which is a change to the core product contract and
   affects every existing topic, so it needs its own issue and justification.

Recommendation: option 1. It keeps the deck at 26 scoring units, makes complete
bidirectional coverage mechanically provable, and leaves `PASS_THRESHOLD`
untouched for existing topics.

### D2 — Stable item identity

`Item` is `{ prompt: string; answer: string }` with no id, authored as free text
(`prompt | answer` lines) and round-tripped through
`TopicForm.serialiseItems`/`parseItems` on every edit. Per-item cue state,
latency and confusion metadata all need a key that survives an author reordering
lines. Any per-item state keyed by array index is silently corrupt after the
first edit.

Options: a generated id persisted per item and preserved when the authoring
form round-trips; a content-derived key such as a hash of the prompt; or an
author-visible id in the `prompt | answer` text format.

Recommendation: a generated id. A content-derived key breaks the moment an
author fixes a typo in a prompt, silently orphaning that item's evidence, and an
author-visible id makes the plainest authoring surface in the app worse for
every topic in order to serve one. `TopicForm` matches edited lines back to
existing ids on save and mints ids only for genuinely new lines.

Workstream 1 must introduce durable item identity *and* that authoring path
together. This is the substance of that workstream, not a detail inside it.

### D3 — Where Stage A/B actually live

`modeFor()` returns `'learn'` only while a topic is `unstarted`. After first
exposure Learn is reachable only by the manual button on `TopicPage`, and the
scheduler never routes to it again. The PRD's acquisition ladder assumes
repeated per-packet acquisition sessions across days, which the current
scheduler cannot express.

Resolve one of:

1. Stage A/B are the richest *cue rungs inside Test*. Learn keeps its current
   job — ungraded first exposure — and the ladder is entirely a Test-side cue
   concern. No scheduler change.
2. `modeFor()` gains a notion of unfinished acquisition, routing back to Learn
   until every character has been encoded.

Recommendation: option 1. It leaves the scheduler untouched, keeps Learn honest
as exposure, and satisfies the standing "no third mode" constraint without
inventing Practice under a new name. It also decides the seam between
workstreams 3 and 4, so it cannot be deferred.

### D4 — Learn content model extension

`LearnBlock` is a closed union, validated by `storage.ts::parseBlock` and
round-tripped through export/import. A Morse character packet with glyph, SVG
mnemonic, canonical notation and audio is not expressible as any existing block.
Extending that union is schema work in workstream 1, not UI work in workstream 3.

### D5 — Per-item evidence is a new durable store

`Attempt` records only `{ at, correct, total, resolvedTo }`. There is no
per-item outcome anywhere in the model. Cue fading needs per-item evidence, and
per the governing invariant it must be a sibling of `history`, not folded into
it. This is what forces `Library.version` 4 → 5 and a migration.

Options: hold it on the topic, keyed by item id, or as a separate top-level
store on the library.

Recommendation: on the topic. Export already carries `history`, so user learning
state is portable today, and keeping cue evidence next to it means one migration
and no chance of a topic and its evidence being exported apart from each other.

## Phase 0 — decisions the PRD leaves open

### P1 — Character order

Options: Koch-style incremental, current CW Academy ordering, complexity-based
easy-first, or a confusion-aware custom sequence.

The observation that decides this: Koch and CW Academy orders are tuned for
**auditory** acquisition, and the first shipped boundary is **printed**.
Rothkopf's separation result concerns aural similarity specifically. An order
borrowed wholesale from CW practice therefore optimises for a competency this
topic does not claim. But picking a purely visual order means re-teaching the
alphabet in a different sequence when workstream 6 arrives.

Recommendation: ascending element-count complexity, constrained so that two
characters differing only in a final element — Spragg's strongest confusion
family — never share a packet. That serves printed acquisition now without
sabotaging reception later. Record the full comparison per PRD §10.2, and do not
describe the result as official or optimal.

### P2 — Novel characters per packet

Recommendation: five visible cards, two novel, the remainder already-encoded
characters returning for retrieval. Hold both values as separate configuration.
The failure mode to design out is a packet size that silently defines the
acquisition load, which is exactly what PRD §10.1 warns against.

### P3 — What triggers cue fading

Options: accuracy alone, accuracy plus latency, or a repeated-retrieval count.

Recommendation: fade on N consecutive correct answers at a rung, starting at
N = 2, accuracy-primary. Record latency from the first session but do not let it
gate anything in v1 — per PRD §11.2 latency must not quietly become a completion
requirement for a topic whose scope says nothing about speed, and you need the
distribution before any threshold on it is more than a guess.

### P4 — Initial character and effective speed

CW Academy's Fundamental curriculum uses 25 WPM character speed with much lower
effective speed. That is practice precedent, not evidence of optimality.

Recommendation: ship 20 WPM character speed with roughly 9 WPM effective speed
through Farnsworth spacing, user-adjustable. Never stretch the character itself
to slow it down. This is the cheapest decision on the list to revise — it is a
runtime setting, not schema — but it does shape the representation a learner
encodes, so revisit it deliberately when workstream 6 makes audio the scored
stimulus rather than drifting into a default.

### P5 — Original SVG mnemonic set

Recommendation: confirm original, as PRD §8.5 already leans. Google's
`morse-learn` is Apache-2.0 at repository level, but per-asset provenance is
unverified and would need clearing illustration by illustration. A single
coherent grammar across all 26 characters matters more than any individual
borrowed drawing. Study its interaction patterns; draw nothing from it.

### P6 — Whether to ship the workstream-0 baseline

Argued under workstream 0 below. The programme is unaffected either way.

## Workstreams

| # | Workstream | Depends on | Ships |
|---|---|---|---|
| 0 | Printed letter→code baseline topic | PR #22 | A real seeded topic on a phone, current schema |
| 1 | Item identity, cue/evidence data model, migration | Phase 0 | v5 schema, migration, lossless export/import |
| 2 | Morse synthesis, timing, accessibility | — | Deterministic engine, unit-tested |
| 3 | SVG mnemonic grammar + progressive Learn surface | 1, 2 | Acquisition UI |
| 4 | Progressive Test modalities + cue fading | 1 | Acquisition ladder in Test |
| 5 | A–Z curriculum, provenance, mobile acceptance | 3, 4 | The shipped competency |
| 6 | Auditory reception / sending / continuous material | validated 5 | Later, separate claims |

Two corrections to the proposed dependency table:

**Workstream 2 does not depend on PR #22.** The 1:3:7 unit ratios are fixed by
ITU-R M.1677-1 and do not move regardless of any product decision. Only the
*default* speed depends on Phase 0. Build the engine speed-parameterised and it
is unblocked today — it can start before the PRD merges.

**Workstream 4 does not hard-depend on 2.** For stages B–E the scored stimulus
is visual; audio is feedback only. Workstream 4's blocking dependency is 1
alone. It needs 2 merged before *stage F*, which is workstream 6.

So 0, 1 and 2 run in parallel, and 4 opens as soon as 1's schema is stable.

### Workstream 0 — printed baseline (recommended, optional)

A 26-item `letter → canonical dit/dah` topic seeded exactly like the NATO
alphabet, using the current v4 schema and the existing reveal/self-score card.
No new architecture.

Rationale: it puts a correct, provenance-checked ITU mapping table on a phone
within days, validates the seed and provenance path, and gives the progressive
system a control to be measured against. Its scope claims one direction only,
which is narrower than the PRD's first boundary but honest about what it covers.

Cost: a second Morse topic exists during the programme, and workstream 5 must
either supersede or absorb it. Skip this if that overlap is unacceptable; the
programme is otherwise unaffected.

### Workstream 1 — item identity, cue/evidence model, migration

Owns D1, D2, D4, D5. Extends the durable schema to v5 with item identity, a
per-item acquisition/cue store held separate from `history`, response-mode
metadata, and the Learn block extension. Migrates v4 libraries, and keeps
export/import lossless for every new durable field.

Hard acceptance: every existing topic — NATO, OODA and the rest — behaves
byte-identically to today. `scheduling.test.ts`, `storage.test.ts` and
`seed.test.ts` pass unchanged except where a test asserts the version literal.

Explicitly decides, per PRD §13, which new information is content definition,
which is user learning state, and which is derivable runtime presentation. The
canonical `A = .-` mapping is content. Current cue strength is learning state. A
generated five-character group is neither and is not persisted.

### Workstream 2 — Morse synthesis, timing, accessibility

Canonical ITU-R M.1677-1 mappings, 1:3:7 timing, configurable character speed,
Farnsworth spacing computed independently of character rhythm, Web Audio
synthesis with a safe lifecycle across backgrounding and mobile browsers,
cancellation and replay, and no autoplay after navigation.

Timing generation must be pure and unit-testable without an audible device:
tests assert the element/gap schedule, not the sound. Everything downstream
depends on this, so it carries the heaviest test burden in the programme.

Reduced-motion independence belongs here: the audio channel and the visual
channel must be separately usable, per PRD §12.

### Workstream 3 — SVG mnemonic grammar + progressive Learn

The distinctive acquisition surface: a study packet of characters, each showing
the uppercase glyph, canonical dots and dashes, an integrated SVG mnemonic
following transmission order, and synchronised audio.

The governing constraint is that the SVG teaches the *temporal pattern* by
direct association. If a learner has to decode the picture to derive the letter,
the mnemonic has become the analytic translation layer PRD §5.3 rules out.

Prototype the visual grammar across 8–10 deliberately dissimilar characters —
covering single elements, uniform runs, mixed patterns and a confusable pair —
and validate it before drawing all 26. This is the highest design risk in the
programme and the one place where a wrong answer is expensive to unwind.

Every SVG needs a semantic text equivalent. The mnemonic must never be the only
viable acquisition path.

### Workstream 4 — progressive Test modalities + cue fading

The acquisition ladder as cue rungs inside Test:

1. rich prompted recognition;
2. prompt → retrieval opportunity → delayed alternatives;
3. weaker cues;
4. uncued letter → Morse production;
5. uncued printed Morse → letter response.

Errors may temporarily restore stronger scaffolding; success removes it.
Introduces evidence-informed distractors: confusable novel characters are
separated during acquisition per Rothkopf, then deliberately contrasted once
both are learned per Spragg.

Hard acceptance: cue-bearing artwork cannot leak into the uncued rungs, and the
delayed-retention scheduler remains the sole authority over completion.

### Workstream 5 — A–Z curriculum and mobile acceptance

Seeds the 26-letter curriculum only once 3 and 4 are validated. Populates the
original SVG assets and their provenance, verifies every mapping against
ITU-R M.1677-1, confirms both directions cover all 26, runs the accessibility
checks in PRD §12 and physical mobile acceptance.

The completion claim stays deliberately narrow:

> Can independently recall all A–Z printed Morse mappings in both directions.

A learner who finishes this has not earned an auditory or CW-fluency claim.

### Workstream 6 — reception, sending, continuous material

Not built in this programme. Auditory reception, sending and groups/words each
need an explicit performance boundary — character speed, effective speed and an
accuracy criterion — before they can be topics at all. Groups and words also
need a finite completion criterion over generated samples, since generated
material is infinite and cannot be enumerated as deck items.

Deferred deliberately: get A–Z acquisition genuinely excellent on a phone first.
That gives the new progressive-scaffolding architecture a real laboratory before
Argus commits to a generalised training engine.

## Immediate sequence

1. get PR #22 reviewed and merged, with D1–D5 and the Phase 0 decisions settled;
2. open the workstream issues under #21;
3. execute 1 and 2 in parallel, optionally 0 alongside;
4. prototype the SVG visual grammar on 8–10 characters and validate it;
5. build the progressive Test ladder;
6. ship and physically test the 26-letter competency.
