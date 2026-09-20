# Issue #119 — Morse post-acquisition fluency, haptics and play

**Status:** Research complete; implemented as the Fluency surface

**Authority:** Research and rationale only. `docs/open/MORSE_FLUENCY.md` is the
maintained contract for what actually shipped and governs where the two differ.
`MORSE_PROGRAMME_PLAN.md`, `PROGRESS_ARCHITECTURE.md` and
`MORSE_AUDIO_RUNTIME.md` are unchanged by this workstream.

> **Implementation note.** Sections 4–9 were written as proposals and are kept
> in that voice for the reasoning they carry. What shipped follows them with
> two deliberate changes, both made after this document's own sources were
> read more closely: the pinned character speed is **20 WPM** (§4.1), and the
> Farnsworth ladder runs **6 → 13** in single steps rather than the wider
> spread first sketched, because CW Academy Fundamental's published ladder is
> calibrated for exactly this learner. Issue **H** (tactile character replay)
> was not built; §6.5 recommends against it and that recommendation stands.

**Last verified:** 2026-09-19

**Issue:** #119

**Parent:** none. This is a fresh workstream. It deliberately does not extend
the closed #21 umbrella and does not reopen the deferred #29.

**Depends on:** a completed printed A–Z acquisition, which the owner now has.

## What this document is

The owner has finished all 26 Morse letters through the shipped 13-lesson
mobile programme. The problem has changed. It is no longer *how does a person
first meet a mapping*; it is *how does a known mapping become fast, effortless,
sound-first and worth coming back to*.

This document audits what Argus currently has, reviews the evidence for what
comes next, and proposes a bounded implementation programme. It makes
recommendations. It does not make changes.

The word **Play** is used throughout as the working name for the proposed
post-acquisition surface, to keep it lexically distinct from **Learn** (the
guided acquisition lesson), **Practice** (the #92 batch-5 repair run) and
**Test** (the only scored surface). Naming is an owner decision; see §12.

## What this document is not

It is not an auditory-reception competency. It is not a sending competency. It
does not propose a scored boundary of any kind, does not touch the completed
printed A–Z claim, and does not define completion criteria for #29. Those
remain exactly where they are.

---

## 1. Architecture audit

This section is a prerequisite, not preamble. Several recommendations below are
shaped by what already exists, and two of them are corrections to things that
would otherwise be inherited silently.

### 1.1 Timing authority

`src/domain/morse/code.ts` is the only place that turns text into a schedule.
`buildMorseSchedule()` is pure, emits explicit `signal`/`gap` events, and
already implements canonical ITU 1:3:7 ratios with a correct Farnsworth
spacing scale derived from the 50-unit PARIS word (31 character units, 19
spacing units).

Two named timing configurations exist:

| Constant | characterWpm | effectiveWpm | Used by |
| --- | --- | --- | --- |
| `DEFAULT_MORSE_TIMING` | 20 | 9 | reserved; not used by any learner-facing single-letter path |
| `LEARN_ACQUISITION_MORSE_TIMING` | 12 | 12 | Learn packet Play, `MorseKeyInput` sidetone length |

The Farnsworth machinery is therefore already built and already tested. Nothing
in §4 needs new scheduling code; it needs a third named configuration and a
caller that varies one of its two numbers.

### 1.2 The 12 WPM decision, and why Play must not inherit it

`LEARN_ACQUISITION_MORSE_TIMING` carries a long and correct rationale: a Learn
card plays exactly one character, so it never reaches an inter-character gap,
so `effectiveWpm` has no audible effect, so the only way to make a first
exposure hearable as short-versus-long is to lower `characterWpm` itself. 12 WPM
was chosen over 20, 15 and 8 with the reasoning recorded in the source.

That decision remains right for what it decides. It is exactly wrong for Play.

The rationale for 12 WPM is that the learner must be able to map the sound onto
a mnemonic phrase — that is, onto a *deliberate, attended, decomposable*
representation. Post-acquisition, the mnemonic phrase is the thing being
discarded. The entire post-acquisition literature and every trainer convention
agrees on one mechanism: a character speed low enough to count elements
*teaches counting*, and counting is the habit that produces the well-documented
plateau at roughly 10–15 WPM (§3.1).

So the single most consequential recommendation in this document is a negative
one:

> **Play must not reuse `LEARN_ACQUISITION_MORSE_TIMING`.** A post-acquisition
> surface that inherits the 12 WPM acquisition character speed will actively
> train the habit it exists to remove.

### 1.3 Audio runtime

`MorseAudioPlayer` in `src/domain/morse/audio.ts` owns sampled playback;
`MorseKeyInput` owns keyed sidetone. They share tone, gain and the 2ms
click-free edge ramp. `MORSE_AUDIO_RUNTIME.md` is a maintained contract with a
specific, hard-won mobile rule: start the oscillator inside the direct gesture,
before awaiting `resume()`.

Play inherits this contract unchanged and adds nothing to it. Play's audio is
multi-character, which `buildMorseSchedule` already supports and
`MorseAudioPlayer` already plays; no new AudioContext lifecycle is permitted.

### 1.4 Keyed input

`MorseKeyInput` is the one shared key. Relevant properties:

- one categorical control: tap = dit, hold ≥ `MORSE_HOLD_MS` (300ms) = dah;
- **press duration is never returned to the caller.** The comment says why:
  so it cannot become sending-speed evidence. Play must preserve this;
- a released press is *extended* to the canonical element length, so keyed and
  played Morse are one sound;
- there is no edit or submit path. A mis-key is a miss;
- `locked` is a parent-owned gate, and `morseResponseArmed()` in
  `response.ts` is the single definition of "accepting input".

`MorseWordKeyInput` wraps it for a word, but only mechanically: it advances a
character index and concatenates patterns. It has no per-character verdict,
which is right, but it also has no whole-word representation — the learner
keys a word as a sequence of separate letter widgets that happen to share a
label. This is the structural reason the issue reports words "still feel like
interrupted letter drills": they are.

### 1.5 Listening, as it exists today

`curriculum/listening.ts` already implements a real sound-first path inside
Learn:

- one listening prompt every third completed retrieval
  (`LISTENING_RETRIEVAL_INTERVAL = 3`);
- eligibility requires a character already at `solo` or `settled` support, so
  audio is reinforcement rather than first exposure;
- `listeningNeed()` selects by coverage first, then by fewest times heard,
  then by recent misses — the #90 §5 correction to a baseline that landed 51
  listening questions on a repeating subset;
- the stimulus is **sound → choose one of three letters**. It is recognition.

Two things follow. First, a genuine sound-first capability already exists and
Play should extend it rather than start over. Second, three-option recognition
is the wrong instrument for automaticity, because a forced choice among three
can be answered by elimination and its latency is contaminated by reading the
options (§3.3).

### 1.6 Word checkpoints

Four formative checkpoints at Lessons 4/7/10/13, content mechanically validated
against `lessonPackets()`, warm-up → word-character → complete, writing nothing
durable. `MORSE_WORD_CHECKPOINTS.md` is the contract.

They are keyed-production only. There is no path anywhere in the product where
a *word* is heard as a unit.

### 1.7 Haptics, as they exist today

One private function, in one file:

```ts
// src/features/test/TestSession.tsx:64
function haptic(pattern: number | number[]) {
  try { navigator.vibrate?.(pattern) } catch { /* … never block a Test */ }
}
```

Called three times: `haptic(8)` on reveal, and `haptic(correct ? 12 : [10,24,10])`
on the two grade paths. Grep confirms there is no other `navigator.vibrate` call
in the repository.

So the issue's first observation is exactly right, and slightly worse than
stated: the app's only tactile feedback lives on the *scored* surface, and the
*keyed* surface — the one interaction that is physically a key — has none. The
existing patterns are good ones and should be promoted, not replaced (§6.3).

### 1.8 Latency, as it exists today

`DirectionEvidence.lastLatencyMs` is declared in `evidence.ts`, written by
`cueLadder.recordAnswer()` from `ProgressiveCard`'s measured response time,
validated by `libraryParser`, and **read by nothing**. It is a stored value with
no consumer.

Two consequences for §9. It is evidence-side state, so a formative Play surface
may not write it. And it is a single last value, which cannot support the
measure automaticity actually requires (§3.3) — that needs a distribution.

### 1.9 Evidence boundaries Play must respect

From `PROGRESS_ARCHITECTURE.md` and the three ladders in
`MORSE_PROGRAMME_PLAN.md`:

```text
retention state: learning / drilled / completed / decayed   (scheduler owns)
cue state:       rich / delayed-choice / reduced / free      (Test owns)
lesson support:  taught / cued / solo / settled              (Learn owns)
```

`PracticeRun` demonstrates the enforcement pattern that works, and it is
structural rather than documentary: the module imports no store write path, no
scheduler and no evidence recorder, and its test asserts the *absence of those
imports*. A surface that cannot reach durable state cannot corrupt it.

Play must be built the same way. See §9.

### 1.10 Audit findings, collected

| # | Finding | Where |
| --- | --- | --- |
| A1 | Play would inherit a 12 WPM character speed that trains counting | §1.2 |
| A2 | Haptics are a private helper on the one surface that least needs them | §1.7 |
| A3 | `lastLatencyMs` is written and never read | §1.8 |
| A4 | Words are keyed as a sequence of letter widgets, never heard as a unit | §1.4, §1.6 |
| A5 | The only sound-first retrieval is 3-option recognition | §1.5 |
| A6 | No surface varies Farnsworth spacing, though the machinery exists | §1.1 |

---

## 2. Research method and source strength

### 2.1 The three tiers

This section distinguishes three tiers, because the issue's acceptance criteria
require it:

- **Experimental evidence** — peer-reviewed measurement. Available for
  automaticity measurement and for passive haptic learning.
- **Institutional convention** — ARRL and CW Academy curricula. Widely
  practised, internally consistent, taught to thousands, but the published
  numbers are pedagogical convention rather than controlled comparison.
- **Trainer convention** — trainer, forum and club advice. Directionally
  consistent and worth knowing, but never load-bearing on its own.

The Koch method is a special case, and the repository has already settled how
to talk about it. `MORSE_CHARACTER_ORDER.md` closed this provenance gap: Koch's
1936 primary work is bibliographically established and supports referring to a
**Koch method** or **Koch-style auditory training**, but it does not establish a
single canonical character sequence or a universal accuracy threshold, and the
repository wording rule forbids attaching either to Koch without a primary
source.

This document follows that rule without restating the analysis. What is relevant
here is only the method's core claim — whole-character auditory recognition
rather than element decoding — which is separately supported by contemporary
practice (§3.2) and separately measurable (§3.3). No numeric claim in this
document rests on Koch.

## 3. Research: what post-acquisition actually requires

### 3.1 The counting habit and the plateau

The consistent claim across every teaching source is that slow character speeds
let a learner count elements, that counting is a different cognitive operation
from recognition, and that the counting strategy fails somewhere around 10–15
WPM and must then be unlearned.

> "Older teaching methods used lower character speeds … had many people
> counting the patterns and at about 12~28 WPM a 'mental barrier' to increasing
> speeds was observed, where the mind had to 're-learn' the process of
> character recognition."

— trainer convention, widely repeated across ICR training material.

Two things about this claim are worth separating. The *existence* of a plateau
is convention, widely reported and not controlled. The *mechanism* is not
speculative: counting elements is a serial, capacity-limited operation whose
cost scales with element count, whereas recognising a pattern as a unit does
not. A four-element character takes measurably longer to count than a
two-element one; it does not take meaningfully longer to recognise. That
asymmetry is directly observable in per-character latency, which is what makes
it a **measurable design target** rather than a belief (§9.2).

The practical rule the sources converge on is unambiguous, and the strongest
statement of it is institutional rather than folkloric. CW Academy's published
Fundamental curriculum — the post-alphabet course, §3.2 — states the mechanism
as a direct instruction:

> "It is CW Academy's practice to send Morse code … at a character speed of
> 25 wpm … Students need to be hearing the speed at a rate where it is
> difficult to count dits and dahs!!"

Counting is not discouraged by exhortation. It is made impossible by the speed,
and then recognition is the only strategy left.

### 3.2 Farnsworth: which number carries difficulty

Farnsworth timing sends characters at a high character speed and stretches only
the gaps between them. Argus already implements it correctly. The pedagogical
point is what the two numbers *mean*:

- **character speed** determines whether the character can be heard as a unit.
  It should be set above the counting threshold and then **pinned**.
- **effective speed** determines how much thinking time the learner gets.
  It is the only number that should move as the learner improves.

ARRL adopted Farnsworth as its standard recommendation and used it for practice
and test transmissions up to 18 WPM. Common beginner settings quoted across
trainers run 18–20 WPM character speed against 5–10 WPM effective.

The far more useful comparator, though, is one `MORSE_CHARACTER_ORDER.md`
already identified and verified for a different purpose. **CW Academy
Fundamental v2.0** is the post-alphabet course, and its entry profile is
Argus's learner almost exactly:

> students who have "learned the Morse code characters and can copy and receive
> Morse code at around 6 words per minute", progressing to "about 10–13 words
> per minute" with "good grasp of Instant Character Recognition".

Its prescription is a pinned character speed of **25 WPM** with Farnsworth
spacing carrying the entire progression:

| Sessions | Character speed | Effective speed |
| --- | --- | --- |
| 1–2 | 25 | 6 |
| 3–5 | 25 | 7 |
| 6–8 | 25 | 8 |
| 9–11 | 25 | 9 |
| 12–14 | 25 | 10 |

Fourteen sessions, roughly an hour of daily homework, and the character speed
never moves once. Everything that changes is spacing and material. That is the
clearest available external validation of the design in §4, and it is worth
being explicit that Argus did not invent this shape — it is copying a published
curriculum written for precisely this learner.

Two calibrations follow, and both are reasons to copy rather than invent.
First, the effective-speed ladder should start low — **6** — and climb in
single steps, because that is the tested shape. Second, the realistic ceiling
for this stage is **10–13 WPM effective**, not parity between the two numbers:
a ladder that closes the Farnsworth gap completely is promising something
Fundamental treats as beyond its own exit criterion.

This is institutional convention rather than controlled comparison. But it is
convention with unusual consistency, a published mechanism that matches §3.1,
and an entry profile that matches Argus's learner, which is about as close to
transferable evidence as this domain offers.

### 3.3 What "automatic" means, and how to measure it

This is the one part of the post-acquisition problem with genuine experimental
grounding, and it matters because the obvious measure is the wrong one.

The obvious measure is mean response time. Segalowitz and Segalowitz showed it
is insufficient: a process can get uniformly faster without becoming any more
automatic. They distinguish

- **speedup** — mean RT and the standard deviation of RT fall together, and
- **automatization** — the standard deviation falls *faster* than the mean.

The discriminating statistic is the **coefficient of variation of response
time**, `CV = SD(RT) / mean(RT)`. Under pure speedup CV is unchanged; under
automatization CV falls. The interpretation is that attentional, strategic
routes produce variable timing while automatic retrieval produces stable
timing, so a falling CV indexes a restructuring of the underlying process
rather than a faster version of the same process.

This maps onto Morse with unusual directness. A learner who counts elements
produces latencies that scale with element count — `E` fast, `Q` slow — and that
scatter is exactly high CV. A learner with instant character recognition
produces latencies that are both lower and *flatter across characters*. The
same statistic that distinguishes automatization from speedup in lexical access
distinguishes recognition from counting in Morse.

Three consequences for design:

1. **A single last latency cannot express this.** `lastLatencyMs` (§1.8) is
   structurally the wrong shape. Play needs a small rolling window per
   character.
2. **The stimulus must be latency-clean.** A three-option forced choice (§1.5)
   measures reading the options as much as recognising the sound. A free
   response — key the character back, or type it — is a much better instrument.
3. **Low CV is the target, not high speed.** This gives Play a goal that is
   honest, learner-legible and cannot be gamed by rushing.

### 3.4 Passive haptic learning: what the evidence actually supports

The relevant experimental result is the Georgia Tech passive haptic learning
(PHL) study. Participants wearing Google Glass, playing a distractor game, felt
tap patterns near the ear paired with spoken letters. After roughly four hours
they keyed a pangram at **94% accuracy** and wrote per-letter codes at **98%**,
against a control group near 50%.

That is a strong result and it is frequently mis-cited. What it supports:

- tactile presentation of Morse patterns, *synchronised with audio*, can build
  the mapping;
- it works **passively**, over hours, while attention is elsewhere;
- taps were produced by driving a speaker below 15 Hz at a fixed body location.

What it does not support:

- that vibration alone, without paired audio, teaches anything;
- that a few seconds of phone vibration during an active drill has any
  acquisition effect;
- that a phone in a hand or pocket is equivalent to a fixed transducer at the
  ear.

The honest reading: PHL is evidence that the tactile channel *can* carry Morse
structure. It is not evidence for any haptic feature that fits inside Argus's
actual interaction, which is a few hundred milliseconds of attended, foreground
phone use. §6 therefore treats interaction haptics and tactile Morse as two
different proposals with two different justifications and two different risk
levels.

---

## 4. Recommended progression model

Five stages after printed A–Z. Each names what changes, the timing, the
stimulus, the response, and what it is *not*.

The governing rule across all five: **character speed is pinned; only spacing,
material and response mode move.**

### 4.1 The proposed timing authority

A third named configuration, sibling to the two that exist:

```ts
/**
 * Post-acquisition fluency timing. Deliberately NOT the acquisition rate.
 *
 * `characterWpm` is pinned and is not a learner control. Below roughly 15 WPM
 * a character can be counted element by element, and a surface whose purpose
 * is to remove counting must not run at a speed that rewards it. CW Academy's
 * post-alphabet course pins 25 for exactly this reason and never moves it.
 *
 * `effectiveWpm` is the only number Play varies. Farnsworth stretches the gaps
 * between characters, so thinking time shrinks while the character's own sound
 * never changes. 20/6 is a Farnsworth scale of roughly 6.2 — very generous —
 * and the ladder closes it toward 20/12.
 */
export const PLAY_FLUENCY_MORSE_TIMING = {
  characterWpm: 20,
  effectiveWpm: 6,
} as const
```

**Why 20 and not 25.** 25 is the published CW Academy Fundamental value and the
straightforwardly evidence-backed choice, and this document would recommend it
outright but for one Argus-specific fact. `code.ts` records a device
observation from this product's own audio work: at 20 WPM a dit is 60ms and, on
a phone speaker, "reads as a fast double click". At 25 WPM it is 48ms, of which
the mandatory 2ms edge ramps at each end consume 4ms. That observation was made
about a learner trying to *decompose* a first exposure, and post-acquisition
the learner is not decomposing — so it does not straightforwardly transfer. But
it is a real measurement about a real speaker, and 48ms tones on that speaker
have never been tried.

20 is therefore the recommendation as a *starting* pin: comfortably above the
counting threshold, comfortably below the point where this product has
documented phone-speaker trouble, and exactly one notch below the value the
external curriculum uses. Raising it to 25 is a one-line change, because
`buildMorseSchedule` derives everything from these two numbers, and it should be
made if device testing shows 48ms dits reproduce cleanly on the Pixel. This is
owner decision 3 in §12, and it is the number most worth hearing on the actual
device before it is fixed.

**Why 6 and not 5.** Fundamental starts its ladder at 6 and climbs in single
steps to 10 over fourteen sessions. There is no reason to invent a different
starting rung when a calibrated one exists.

`DEFAULT_MORSE_TIMING` (20/9) stays untouched and stays reserved for #29. Note
that it shares a character speed with the proposed Play constant; they remain
separate constants because they answer different questions and #29 must be free
to change its own numbers without moving Play's.

### 4.2 The five stages

Character speed is 20 throughout. Only the second number moves.

| Stage | Stimulus | Response | Effective WPM | Purpose |
| --- | --- | --- | --- | --- |
| **P1 Single, free** | one character, sound | key it back | 6 | replace 3-option recognition with free recall |
| **P2 Single, tight** | one character, sound | key it back | 7 → 9 | drive latency down and CV flat |
| **P3 Groups** | 2 → 5 random characters | key the group | 7 → 10 | survive a stream; no word-shape help |
| **P4 Words** | one known word | key the word as a unit | 8 → 12 | whole-word recognition |
| **P5 Continuous** | a short phrase | key or transcribe | 10 → 13 | sustained copy |

The group-length progression in P3 (2 → 3 → 4 → 5 characters) and the 13 WPM
ceiling are both taken from Fundamental rather than invented. 13 is a stage
ceiling, not a cap on the learner: past it, the honest next step is #29's
scored boundary, not a longer Play ladder.

Stage advancement is **learner-chosen, not gated**. This follows the shipped
checkpoint precedent: a formative surface that gates itself needs a durable
completion flag, and a durable completion flag on a formative surface is
exactly the thing `MORSE_WORD_CHECKPOINTS.md` refuses. Play may *recommend* a
stage from its own statistics; it may not lock one.

### 4.3 Why groups precede words

Words carry redundancy. A learner who catches `T`, `_`, `M`, `E` recovers
`TIME` from English, and that recovery is a real and useful skill — but it is
not character recognition, and a word-only progression lets weak characters
hide behind it permanently. Random groups remove the redundancy and are the
standard instrument for exactly that reason.

The corollary is that groups are *less enjoyable* than words, which is a real
tension with this issue's motivation. The resolution proposed in §8 is to make
groups short and fast rather than long and grinding, and to let word modes be
the place where the product is generous.

---

## 5. Words, groups and continuous material

### 5.1 The current word problem, precisely

§1.4 identified it structurally. `MorseWordKeyInput` mounts a fresh
`MorseKeyInput` per character, keyed `` `${word}-${characterIndex}` `` — so
every letter of a word tears down and rebuilds the control, its entry readout
and its audio state. The learner's experience is a sequence of letter drills
sharing a heading. Nothing anywhere in the product is presented, heard, or
responded to as a word.

### 5.2 What a word activity should be

Three concrete changes, in order of importance:

1. **A word must be hearable as a word.** `buildMorseSchedule` already emits
   inter-character and inter-word gaps correctly. Playing `TIME` at 20/8 is a
   single call. This does not exist anywhere in the product today and is the
   largest single gap between the issue's ambition and the shipped code.
2. **A word must be answerable as a word.** The response should complete and
   then be judged, with no per-character verdict, no per-character
   re-anchoring, and a single continuous keyed run. The existing checkpoint
   already forbids per-character verdicts; it should also stop re-mounting.
3. **A word miss should name the word, not the letter.** Showing which
   character broke is diagnostically useful and should be available, but the
   headline outcome of a word activity is the word.

### 5.3 Corpus

The existing checkpoint corpus is four curated sets validated mechanically
against `lessonPackets()`. Post-acquisition that constraint dissolves — all 26
letters are available — which removes the constraint that made the corpus
small and hand-curated.

Recommendation: a curated word list of roughly 150–300 items, tiered by length
(3–4, 5–6, 7+), authored rather than generated, and validated to A–Z only by
the same mechanical check `checkpoints.ts` already uses. Common CW words and
abbreviations belong here, but CW abbreviations edge toward operating practice,
which is #29's territory; keep the list to ordinary English words for now and
revisit.

### 5.4 Continuous material

Stage P5 should stay deliberately short: phrases of 3–6 words, not paragraphs.
The failure mode of continuous copy is that one dropped character cascades and
the learner loses the thread, which produces a bad session rather than a hard
one. Short phrases bound the damage and keep the feedback loop tight.

---

## 6. Haptics

### 6.1 Two proposals, separated

The issue treats haptics as one topic. It is two, with very different evidence
and very different risk:

- **Interaction haptics** — short semantic pulses confirming a keyed element,
  a correct answer, a miss, a word, a milestone. Low risk, no learning claim,
  well-established platform convention, and Argus already does a restrained
  version of it on one screen.
- **Tactile Morse** — vibrating the dit/dah pattern itself as a presentation
  modality. High risk, a real but narrow evidence base (§3.4), and a hard
  platform constraint (§6.2) that most proposals do not survive.

They should be scoped, shipped and judged separately.

### 6.2 Platform reality

The Vibration API's normative processing model imposes limits that decide the
tactile-Morse question:

| Constraint | Value | Consequence |
| --- | --- | --- |
| Max pattern entries | **10** (`max length`); longer patterns are **silently truncated** | one character always fits (`Q` = 4 on + 3 off = 7 entries); most two-character pairs do not (`A`+`B` needs 11 and would be cut mid-pattern) |
| Max single duration | **10,000ms** | not binding here |
| Document visibility | must be `visible`, else returns `false` | matches the existing background-cancel rule in `MORSE_AUDIO_RUNTIME.md` |
| Sticky activation | required | Play is always gesture-initiated, so this is satisfied |
| Rate limiting | user agents may throttle; may disable per origin for fingerprinting | never assume a call succeeded |

Browser support, which is the decisive fact for a phone-first product:

| Browser | Vibration API |
| --- | --- |
| Chrome for Android | supported |
| Samsung Internet | supported |
| Firefox for Android | not supported |
| Safari on iOS — **all versions** | **not supported** |
| Safari on macOS | not supported |

Argus's acceptance device is an installed Pixel PWA (`MORSE_AUDIO_RUNTIME.md`,
`ISSUE_113_OFFLINE_FIRST_RUNTIME.md`, and #42), so the primary target *does*
support vibration. That makes interaction haptics genuinely worth building.

It also means haptics can never be load-bearing. iOS has no Vibration API and
never has. The community workaround — programmatically clicking a label bound
to a hidden `<input type="checkbox" switch>` — worked from Safari 17.4 and was
patched out in iOS 26.5. It is a quirk of one element's implementation, it has
already broken once, and it should not be adopted. iOS gets the visual and
audible feedback and nothing else, silently.

The last constraint is the one that kills naive tactile Morse even on Android:
**`navigator.vibrate` timing is OS-scheduled and not sample-accurate.** A dit
and a dah differ by a 1:3 ratio of 60ms and 180ms at 20 WPM. Nothing in the API
guarantees those are reproduced faithfully, and on a device under load they
will not be. A vibrated pattern therefore **cannot be trusted to carry the
element ratio** and must never be the only presentation of a pattern.

### 6.3 Proposed haptic vocabulary

Semantic names, not raw numbers, in one shared module — the correction to
finding A2. Every entry is within the 10-entry cap.

| Name | Pattern | Fires on | Rationale |
| --- | --- | --- | --- |
| `element` | `8` | keyed element **press onset** | a key should feel like a key. Onset only: a second pulse on release would compete with the sidetone's own tail, and press onset is the moment the learner's intent lands |
| `settle` | `12` | correct single-character answer | the existing Test value, promoted unchanged |
| `miss` | `[10, 24, 10]` | any incorrect answer | the existing Test value, promoted unchanged. Distinct by rhythm, not by force |
| `word` | `[14, 40, 22]` | a whole word or group answered correctly | asymmetric and slightly longer, so a word does not feel like a louder letter |
| `crest` | `[18, 40, 18, 40, 30]` | stage advance, personal best, session complete | the only pattern above ~100ms total. Rare by construction |

Rules, all of which are refusals:

1. **One shared module** (`src/shared/haptics.ts`), capability-detected, never
   throwing, returning `false` rather than reporting success it cannot verify.
   `TestSession`'s private helper is deleted and re-imported from it.
2. **A haptic never fires alone.** Every entry above accompanies a visual state
   the learner can also see. Vibration is a second channel on an existing
   event, never the only signal of one.
3. **Semantic call sites only.** No caller passes a number. Adding a sixth
   effect is a deliberate edit to the vocabulary, which is the mechanism that
   stops the set drifting to fifteen.
4. **Frequency ceiling.** `crest` may fire at most once per session. If it
   fires on every third screen it is not a crest.
5. **One user setting**, default on, honoured by the shared module, and a
   `prefers-reduced-motion` reading that also suppresses `crest` (§6.4).

### 6.4 Accessibility

- `prefers-reduced-motion: reduce` suppresses `crest` and every celebration
  animation. `element`, `settle`, `miss` and `word` are informational feedback
  rather than motion and remain, which matches the existing precedent in
  `response.ts`: under reduced motion the visual transition is removed and the
  input gate is not.
- A single **Haptics** toggle in settings, default on, suppressing all five.
  Argus does not currently have a settings surface for this; that is scoped as
  part of issue **B** in §13.
- Every celebration must have a non-motion, non-haptic form. A learner with
  reduced motion set, haptics off and the phone muted must still be able to
  tell a correct answer from a wrong one and a milestone from an ordinary
  screen. This is a hard acceptance criterion, not a preference.
- Nothing may be conveyed by haptics alone (rule 2 above), which makes the
  API's silent failure mode harmless rather than a correctness bug.

### 6.5 Tactile Morse: a bounded experiment, not a feature

Recommendation: **do not build tactile Morse as a learning modality.** The
evidence (§3.4) is for hours of passive, audio-paired, fixed-transducer
exposure, which Argus's interaction is not, and the timing-fidelity problem
(§6.2) means a vibrated pattern cannot be relied on to carry the thing that
distinguishes a dit from a dah.

What is defensible is much smaller, and worth having:

> A **single character** may optionally be replayed as vibration *alongside*
> its audio, on explicit request, as a second channel on a pattern the learner
> is already hearing. Never as the only presentation. Never for a group or a
> word — the 10-entry cap forbids it anyway. Never scored. Never counted.

That is issue **H** in §13, sequenced last, and it should be built only if the
owner wants to try it after using the rest.

---

## 7. Celebration and game-feedback hierarchy

### 7.1 The governing rule

> Feedback magnitude is proportional to how rare the event is, and rarity is
> defined by the product, not by the learner's mood.

The issue reports celebrations are "too weak/small". The fix is not to make
everything bigger — that flattens the hierarchy and makes nothing feel like
anything. The fix is to make the *scale* wide: keep the character-level
acknowledgement smaller than it currently is in perceived weight, and let the
rare events be genuinely large by comparison.

### 7.2 Four scales

| Scale | Event | Budget | Visual | Haptic | Audio |
| --- | --- | --- | --- | --- | --- |
| **1 — character** | one correct character | ≤ `MORSE_FEEDBACK_CORRECT_MS` (550ms), and should use far less | state change on the target only; no layout movement | `settle` | none |
| **2 — word/group** | a whole word or group correct | ≤ 900ms | the word resolves as one object; the completed word is briefly the only lit thing | `word` | none |
| **3 — run** | a session's targets finished; a streak closed | ≤ 1600ms | a summary that *states a number*; motion permitted but bounded | `word` | none |
| **4 — crest** | stage advance, personal best, first clean run at a new speed | ≤ 2500ms, at most once per session | the only place a full-surface moment is allowed | `crest` | optional, off by default |

Scale 1 is explicitly capped by the constant that already exists. `response.ts`
argues at length that a hit should be acknowledged and move on, and that ten
retrievals must never feel gated behind an animation. Nothing in this issue
overrides that, and a Play mode that runs 40 characters a minute needs it more
than Learn does.

### 7.3 Misses

A miss gets no celebration hierarchy and no escalation. The `response.ts`
policy stands: a hit has a short automatic dwell, a miss holds until dismissed.
A Play surface running against a latency budget is the one place worth
re-examining that, because holding stops the clock — but the correct resolution
is to hold *and* stop the clock, never to rush the correction.

### 7.4 What "personal best" may be

A personal best is defensible where a badge is not, because it is a statement
about the learner's own record rather than a token awarded by the product. It
should be:

- per mode and per stage, so it is a real comparison;
- expressed in the units the mode uses (characters per minute copied, median
  latency, longest clean run);
- never a completion, never a status, never displayed on the topic card
  alongside retention state.

---

## 8. Game modes shortlist

Four, each with a stated learning purpose, a mechanic and an explicit statement
of what it writes. A fifth is listed and rejected.

### 8.1 Sprint — sound to character, free response

- **Purpose:** the core ICR drill. Replaces three-option recognition with free
  recall (§3.3, finding A5).
- **Mechanic:** one character at the pinned 20 WPM character speed, generous
  spacing. The
  learner keys it back. Correct → next, immediately. The run is a fixed count
  (10, matching `PRACTICE_LIMIT` and the lesson sitting, so the pace is one the
  learner already recognises), not a fixed time.
- **Selection:** by need, reusing `listeningNeed()`'s shape — coverage first,
  then fewest exposures, then recent misses. Extended with a latency term once
  §9's data exists.
- **Feedback:** scale 1 per character, scale 3 at the end, reporting median
  latency and the slowest three characters by name.
- **Writes:** `morsePlay` only.

### 8.2 Ladder — the Farnsworth close

- **Purpose:** the direct mechanism of §3.2. Character speed pinned, spacing
  closing.
- **Mechanic:** a run at the learner's current `effectiveWpm`. A clean run
  offers the next rung; a poor run offers the previous. The rungs are
  Fundamental's, in single steps: **6 → 7 → 8 → 9 → 10 → 11 → 12 → 13**. The
  offer is always an offer; the learner sets the rung.
- **Why it is a separate mode from Sprint:** Sprint measures where the learner
  is at a fixed speed; Ladder changes the speed. Merging them means a falling
  latency and a rising speed move at once and neither is interpretable.
- **Writes:** `morsePlay` only, including the current rung.

### 8.3 Word catch — whole-word reception

- **Purpose:** the whole-pattern recognition the issue asks for, and the
  answer to finding A4.
- **Mechanic:** a word is played as one unit with correct inter-character
  spacing. The learner keys it back as one continuous run — no per-character
  verdict, no re-anchoring, no pause between letters. Replay is allowed and
  counted.
- **Feedback:** scale 2. A miss shows the word with the broken character
  marked, after the word-level outcome, not instead of it.
- **Writes:** `morsePlay` only.

### 8.4 Groups — the redundancy-free stream

- **Purpose:** §4.3. Stops weak characters hiding behind English.
- **Mechanic:** 2–5 random characters, weighted toward the learner's slowest,
  keyed back as one run. Group length grows 2 → 3 → 4 → 5 with the stage,
  following Fundamental's LCWO code-group progression. Deliberately short runs:
  five groups, not fifty.
- **Writes:** `morsePlay` only.

### 8.5 Rejected: a competitive or social mode

Leaderboards, opponents, shared streaks, daily-challenge coins. Rejected for
three reasons, in increasing order of importance: Argus has one learner and no
social graph; the product constraint in #119 asks for it not to be added
without a concrete learning purpose, and none of these has one; and every one
of them creates pressure to make Play's numbers look like achievement, which is
precisely the pressure §9 exists to resist.

A **personal** best (§7.4) is not in this category and is recommended.

### 8.6 Competitor patterns, briefly

The trainer landscape splits cleanly. Ham-radio trainers implement
Koch-style/Farnsworth training faithfully and are pedagogically sound, but
present as configuration screens and raw accuracy percentages — and the best of
them are not products at all. CW Academy Fundamental, the most directly
relevant, is a fourteen-session advisor-led course that assigns roughly an hour
of daily homework driven through LCWO; its pedagogy is excellent and its
delivery assumes a human advisor and a desktop browser. Consumer Morse apps
invert it: strong feedback, streaks and levels, but usually a slow character
speed that trains counting.

The available position — and it is genuinely available — is the ham-radio
pedagogy with the consumer product's feedback quality. That is the whole thesis
of this issue and it is a defensible one. It requires resisting exactly one
temptation: slowing the character speed to make the modes feel achievable.

---

## 9. Practice-only measurement model

### 9.1 The boundary, structurally

Play writes exactly one durable field and reads several. Mirroring the
`PracticeRun` pattern that already works (§1.9):

- Play modules import **no** scheduler, **no** evidence recorder, and **no**
  write path other than the single `morsePlay` writer.
- A test asserts the absence of those imports directly, so an edit that
  reintroduces one fails the suite rather than quietly changing what Play
  means.
- Play cannot write `itemEvidence`, cannot write `lastLatencyMs` (§1.8), cannot
  move `lastTestedAt`, cannot resolve an attempt, cannot change `status`, and
  cannot qualify a completion.

### 9.2 The proposed store

Additive and optional on `Topic`, inside storage v5 — the same shape and the
same legacy-safe default that `morseReview` established, so no migration is
required:

```ts
/**
 * Post-acquisition Play statistics. Formative throughout.
 *
 * Deliberately a fourth store rather than a field on `morseReview`, for the
 * same reason `lessonProgress` is not `itemEvidence`: it answers a different
 * question, and a shared field is how two questions quietly become one claim.
 * `morseReview` says what the guided lesson has covered. This says how fast
 * and how stably the learner now recognises a character by ear. Neither can
 * qualify the other, and neither reaches Test evidence.
 *
 * `recentLatencyMs` is a bounded rolling window rather than a last value
 * because the measure that distinguishes automatization from mere speedup is
 * the coefficient of variation of response time, and a single value has no
 * variance. The window is capped so the record cannot grow without bound.
 */
export interface MorsePlayCharacter {
  heard: number
  correct: number
  /** Most recent correct-answer latencies, newest last. Capped at 20. */
  recentLatencyMs: number[]
}

export interface MorsePlayProgress {
  /** Current Farnsworth rung. characterWpm is never stored: it is pinned. */
  effectiveWpm: number
  characters: Record<string, MorsePlayCharacter>
  /** Per mode, per stage. Never a completion. */
  bests: Record<string, number>
}
```

### 9.3 The derived measures

Pure functions over the store, no new state:

- **median latency** per character — robust to the one answer interrupted by a
  notification, which a mean is not;
- **coefficient of variation** per character and across the roster —
  `SD/mean` over `recentLatencyMs`, the §3.3 automaticity index;
- **latency spread by element count** — the direct counting signal. If
  four-element characters are systematically slower than two-element ones, the
  learner is still counting, and that is the single most useful thing Play can
  tell them.

The third is the measure worth surfacing to the learner in plain words, because
it is diagnostic and actionable: *"`Q`, `Y` and `J` are taking you about twice
as long as `E` and `T`. That usually means you are still counting those
three."*

### 9.4 The presentation rule

Play statistics may be shown **inside Play**. They may not appear on the topic
card, in Today, or anywhere adjacent to retention status, because adjacency is
how a formative number becomes read as evidence. This is the same reasoning
`TARGETED_PRACTICE.md` applies to the practice offer's placement, and the same
reason the practice control is a quiet text-weight control rather than a
primary action.

### 9.5 Latency hygiene

A latency is only recorded when it means something:

- measured from the **end of the stimulus**, not from the start of playback,
  or every character's latency includes its own audible length and a `Q` looks
  slow because it *is* long;
- discarded if the document was hidden at any point during the item — the
  existing visibility plumbing in `MorseKeyInput` and `MorseAudioPlayer`
  already detects this;
- discarded on a replay, because a replayed stimulus is a different task;
- recorded only for correct answers. A miss's latency is uninterpretable —
  it mixes a fast wrong guess with a long failed search.

---

## 10. Relationship to future formal competencies

The printed A–Z boundary is unchanged and unchallenged:

> Can independently recall all A–Z printed Morse mappings in both directions.

#29 remains deferred and remains the only home for a scored auditory or sending
claim. The boundary between it and Play:

| | Play (#119) | Auditory reception (#29) |
| --- | --- | --- |
| Status | formative | scored competency |
| Speed | learner-chosen rung, `characterWpm` pinned at 20 | a single stated criterion, owner-decided |
| Criterion | none | explicit character speed, effective speed, accuracy |
| Writes | `morsePlay` | `itemEvidence`, `cue: 'auditory'`, retention state |
| Can complete anything | no | yes |

Play is allowed to **inform** #29 and is forbidden to **satisfy** it. Concretely:
after six months of Play the owner will know what character speed and effective
speed a real learner actually reaches, which is the evidence #29's deferred
"revisit P4 here" note asks for and does not currently have. That is a genuine
contribution and it happens without Play recording a single unit of evidence.

On sending: `MorseKeyInput` deliberately discards press duration so it cannot
become WPM evidence (§1.4). Play preserves that unchanged. **No Play mode may
measure, display or store keying timing**, and no Play output may be described
as sending competence. A touchscreen slab is not a key, and #29 already says so.

The `auditory` value reserved in `CUE_STATES` stays reserved and unused. Play
must not write it.

---

## 11. Rejected

| Rejected | Why |
| --- | --- |
| Reusing `LEARN_ACQUISITION_MORSE_TIMING` for Play | trains the counting habit Play exists to remove (§1.2) |
| A learner-facing character-speed control | the one number that must stay pinned; exposing it guarantees it gets lowered |
| A Farnsworth ladder that closes to parity | past ~13 WPM effective the honest next step is #29, not a longer formative ladder (§4.2) |
| Inventing Argus-specific speed rungs | a calibrated published ladder exists for this exact learner profile (§3.2) |
| Badges, coins, leaderboards, streak freezes | no learning purpose; creates pressure to dress formative numbers as achievement (§8.5) |
| Tactile Morse as a learning modality | evidence is for passive, hours-long, audio-paired exposure; vibration timing cannot carry the 1:3 ratio (§3.4, §6.2, §6.5) |
| The iOS `<input switch>` haptic workaround | undocumented quirk, already patched out in iOS 26.5 (§6.2) |
| Writing Play latency to `DirectionEvidence.lastLatencyMs` | evidence-side state, and the wrong shape for CV (§1.8, §9.2) |
| Gating stage advance | needs a durable completion flag on a formative surface (§4.2) |
| Play statistics on the topic card or Today | adjacency turns a formative number into perceived evidence (§9.4) |
| Extending Replay into a game hub | product constraint; Replay is faithful course replay |
| One umbrella issue | the explicit lesson of #21/#90 (§13) |

---

## 12. Open owner decisions

Four, and none of them blocks the audit or the research. They block
implementation issue **B** onward.

1. **The name.** "Play" is this document's working label. Argus already uses
   Learn / Practice / Test, and `TARGETED_PRACTICE.md` records that "practice"
   vs "repair" was itself a deliberate, reversible labelling call. "Play" reads
   as unserious next to three sober mode names; "Fluency" or "Drill" are the
   obvious alternatives. Whatever is chosen, it must not be a synonym of any of
   the three existing modes.
2. **Where Play lives.** On the Morse topic page beside the lesson path, or as
   a Today entry, or both. This is an information-architecture decision and the
   ratified Today + Library structure should constrain it.
3. **The pinned character speed: 20 or 25.** §4.1 recommends 20 and explains
   the one Argus-specific reason not to simply take CW Academy's 25. The
   deciding evidence is not available from a desk: it is whether 48ms dits
   reproduce cleanly on the Pixel speaker, which the owner can answer in
   about a minute with a built copy. 25 is the better-evidenced number if the
   device allows it. Either way the value is pinned and never a learner
   control.
4. **Whether to run the tactile-character experiment at all** (§6.5, issue H).

---

## 13. Implementation issue map

Eight bounded issues, not one umbrella. This is the explicit lesson of #21 and
#90 and the issue's own final acceptance criterion. Each is independently
shippable and independently revertible.

### A — Shared semantic haptics

Extract `TestSession`'s private helper into `src/shared/haptics.ts` with the
five named effects from §6.3, capability detection, a never-throwing contract,
and the settings toggle. Re-point `TestSession` at it unchanged. Add `element`
to `MorseKeyInput`.

*Depends on:* nothing. *Durable state:* one preference.
*Acceptance:* existing Test haptics byte-identical in behaviour; keyed elements
produce `element` on press onset; every effect is a no-op with the toggle off,
under an unsupported browser, and under a thrown exception; no caller passes a
number. **This issue is shippable today and improves the product on its own.**

### B — Play timing authority and multi-character playback

Add `PLAY_FLUENCY_MORSE_TIMING`. Add a Play-owned player call that schedules
multi-character text through the existing `MorseAudioPlayer`. No UI.

*Depends on:* owner decision 3. *Durable state:* none.
*Acceptance:* `buildMorseSchedule('TIME', PLAY_FLUENCY_MORSE_TIMING)` produces
correct inter-character and inter-word gaps at a pinned 20 WPM character speed;
`MORSE_AUDIO_RUNTIME.md`'s four device cases pass for a multi-character stimulus;
`LEARN_ACQUISITION_MORSE_TIMING` and `DEFAULT_MORSE_TIMING` are untouched.

### C — The `morsePlay` store and the Play shell

The §9.2 store, its parser validation, its derived measures as pure functions,
the route, and an empty Play surface. No modes yet.

*Depends on:* owner decisions 1 and 2. *Durable state:* `Topic.morsePlay`,
additive within v5.
*Acceptance:* the import-boundary test (§9.1) passes; an absent field parses as
a legacy-safe default; export/import round-trips; a completed Play session
leaves `itemEvidence`, `lastTestedAt`, `status` and `history` byte-identical.

### D — Sprint

§8.1. The first real mode and the first free-response sound stimulus in the
product.

*Depends on:* B, C. *Acceptance:* latency hygiene rules in §9.5 all hold, each
with a test; selection covers every character before repeating any.

### E — Ladder

§8.2. Farnsworth rung movement.

*Depends on:* D. *Acceptance:* `characterWpm` is identical at every rung;
advancement is offered and never forced.

### F — Word and group modes

§8.3, §8.4, and the §5.2 fix to whole-word response. Includes the §5.3 corpus.

*Depends on:* B, C. *Acceptance:* a word is played as one scheduled unit; the
keyed response does not re-mount per character; the corpus validates
mechanically to A–Z; a miss reports the word first.

### G — Celebration hierarchy

§7, applied across Play and audited for consistency against Learn, checkpoints
and Test.

*Depends on:* A, and at least one of D/F to have something to celebrate.
*Acceptance:* scale 1 stays within `MORSE_FEEDBACK_CORRECT_MS`; `crest` fires at
most once per session; the full reduced-motion + haptics-off + muted path is
tested end to end and every outcome remains distinguishable.

### H — Tactile character replay (optional)

§6.5, single characters only, alongside audio, on request, behind capability
detection and the haptics toggle.

*Depends on:* A, owner decision 4. *Acceptance:* refuses any input longer than
one character; never fires without audio; documented as non-evidential in the
surface itself.

### Sequence

```text
A ──────────────────────────────┬─→ G
B ──┬─→ D ─→ E                  │
C ──┘                           │
    └─→ F ──────────────────────┘
A ─────────────────────→ H (optional)
```

A is independent and immediately useful. B and C are the foundation. D/E/F are
the product. G is the polish pass that needs something to polish. H is optional
and last.

---

## 14. Sources

Tier is marked per §2.1: **[E]** experimental, **[I]** institutional
convention, **[S]** specification/platform data, **[C]** trainer convention.

- **[S]** [Vibration API — W3C](https://w3c.github.io/vibration/) — normative
  processing model; `max length` = 10 entries, `max duration` = 10,000ms;
  visibility and sticky-activation requirements; fingerprinting and
  rate-limiting considerations.
- **[S]** [Navigator.vibrate — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate)
  — pattern semantics, user-activation requirement, "not Baseline" status.
- **[S]** [Vibration API support — Can I Use](https://caniuse.com/vibration) —
  Chrome for Android and Samsung Internet supported; Safari iOS and macOS
  unsupported at every version; Firefox for Android unsupported.
- **[E]** [Tactile taps teach rhythmic text entry: passive haptic learning of Morse code](https://www.researchgate.net/publication/310820790_Tactile_taps_teach_rhythmic_text_entry_passive_haptic_learning_of_morse_code)
  (Georgia Tech, ISWC 2016) — 94% keying / 98% written accuracy after ~4 hours
  of passive audio-paired tactile exposure; control near 50%. Summaries:
  [Georgia Tech News](https://news.gatech.edu/news/2016/10/27/learning-morse-code-without-trying),
  [Scientific American](https://www.scientificamerican.com/article/how-to-learn-morse-code-mdash-semiconsciously/).
- **[E]** Segalowitz & Segalowitz, *Skilled performance, practice, and the
  differentiation of speed-up from automatization effects* — the CV of RT as
  the discriminator between speedup and automatization. See also
  [Automatization in second language acquisition: what does the coefficient of variation tell us?](https://www.cambridge.org/core/journals/applied-psycholinguistics/article/abs/automatization-in-second-language-acquisition-what-does-the-coefficient-of-variation-tell-us/554D00B8D979BD1CFF17774087D14326)
  (*Applied Psycholinguistics*, 2009) for the critical review, and
  [Assessing the development of automaticity in second language word recognition](https://www.cambridge.org/core/journals/applied-psycholinguistics/article/abs/assessing-the-development-of-automaticity-in-second-language-word-recognition/58465581E3C8C24144D881FD8F1ACD52).
- **[I]** [CW Academy *Fundamental* Level CW Curriculum, v2.0, 20 April 2025](https://cwops.org/wp-content/uploads/2025/04/CW-Academy-Fundamental-Curriculum-v2.0.htm)
  — **the primary external comparator for this workstream.** Entry profile:
  characters already learned, copying around 6 WPM. Exit: 10–13 WPM with a
  good grasp of ICR. Character speed pinned at 25 WPM throughout; effective
  speed 6 → 7 → 8 → 9 → 10 across sessions 1–14. ICR trained through LCWO code
  groups growing 2 → 3 → 4 → 5 characters; words from week 3; callsigns and
  pangrams weeks 4–5; abbreviations weeks 6–8; QSO and continuous text weeks
  9–14. "Students need to be hearing the speed at a rate where it is difficult
  to count dits and dahs!!" Roughly an hour of homework a day.
- **[I]** [CW Academy *Beginner* Level CW Curriculum, 4th ed. rel. 4.7, 19 February 2025](https://cwops.org/wp-content/uploads/2025/02/Beginner-curriculum.htm)
  — the pre-alphabet course; 25 CPM character speed with Farnsworth 6 CPM;
  "we said sound the pattern", explicit against naming dots and dashes.
  Already transcribed and verified in `MORSE_CHARACTER_ORDER.md`.
- **[I]** [Farnsworth timing — Morse Code World](https://morsecode.world/international/timing/farnsworth.html)
  and [Farnsworth timing — justlearnmorsecode.com](https://justlearnmorsecode.com/farnsworth.html)
  — ARRL adoption; use for practice and test transmissions up to 18 WPM;
  typical 18–20 WPM character against 5–10 WPM effective.
- **[I]** `docs/open/MORSE_CHARACTER_ORDER.md` §"Provenance comparison" — the
  repository's own verified Koch and CW Academy provenance record, including
  the primary Koch 1936 bibliographic citation, the Long Island CW Club
  secondary review, and the **repository wording rule** this document follows:
  Koch supports a *method*, not a canonical sequence or threshold. No numeric
  claim here rests on Koch.
- **[C]** [Koch's method — justlearnmorsecode.com](https://justlearnmorsecode.com/koch.html),
  [The Koch method of CW learning — NW7US](https://hfradio.org/koch_2.html) —
  modern Koch-*style* trainer descriptions. Cited only as evidence of what
  contemporary trainers do; per the wording rule above, their sequences and
  thresholds are implementation choices, not Koch findings.
- **[C]** [Instant Character Recognition — Morse Code World](https://morsecode.world/international/trainer/character.html),
  [ICR — WA7PGE](https://wa7pge.com/home/operating_modes/cw/instant_character_recognition),
  [Morse Code Ninja advice](https://morsecode.ninja/advice/) — the counting
  plateau at roughly 12–15 WPM; raise character speed to starve counting.
- **[S]** [Playing haptics — Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/playing-haptics)
  — the semantic-effect model (success / warning / error / selection / impact
  levels) that §6.3's vocabulary follows in shape, and the rules on pairing
  haptics with visible feedback and honouring system settings.
- **[C]** [iOS Safari haptics workaround](https://github.com/tijnjh/ios-haptics)
  and [Ionic issue #29942](https://github.com/ionic-team/ionic-framework/issues/29942)
  — the `<input type="checkbox" switch>` label-click quirk, working from Safari
  17.4 and patched in iOS 26.5. Documented here as rejected.

### Repository sources audited

`src/domain/morse/code.ts`, `audio.ts`, `response.ts`, `progress.ts`,
`curriculum/listening.ts`, `curriculum/checkpoints.ts`;
`src/features/morse/input/MorseKeyInput.tsx`, `MorseWordKeyInput.tsx`;
`src/features/morse/lesson/MorseCheckpoint.tsx`;
`src/features/test/TestSession.tsx`; `src/features/practice/PracticeRun.tsx`;
`src/domain/study/evidence.ts`, `cueLadder.ts`;
`src/infrastructure/persistence/libraryParser.ts`;
`docs/open/MORSE_PROGRAMME_PLAN.md`, `MORSE_AUDIO_RUNTIME.md`,
`MORSE_WORD_CHECKPOINTS.md`, `TARGETED_PRACTICE.md`,
`PROGRESS_ARCHITECTURE.md`, `MORSE_CHARACTER_ORDER.md`,
`ISSUE_105_MORSE_PLACEMENT_ASSESSMENT.md`.

---

## 15. Acceptance mapping

| #119 acceptance criterion | Where |
| --- | --- |
| Primary/strong sources where available; evidence distinguished from convention | §2.1, §14 tier markers |
| Current Argus Morse architecture audited before recommendations | §1, findings table §1.10 |
| Haptics treated as a real interaction modality, not decorative vibration | §6, vocabulary §6.3, platform limits §6.2 |
| Word/group/continuous progression explicitly designed | §4.2, §5 |
| Sound-first / ICR / Farnsworth progression explicit | §3.1–§3.2, §4.1–§4.2 |
| Game feel and reward timing designed at character, word, streak and milestone scales | §7.2 |
| Practice metrics separate from formal evidence | §9, §10 |
| PWA/browser limitations documented | §6.2 |
| Implementation split into bounded follow-on issues, not an umbrella | §13 |
