# Morse Fluency — the post-acquisition surface

**Status:** Implemented under #119

**Authority:** Current for shipped Fluency behaviour. `MORSE_PROGRAMME_PLAN.md`
still governs the A–Z acquisition programme, `PROGRESS_ARCHITECTURE.md` still
governs the state boundaries this surface must not cross, and
`MORSE_AUDIO_RUNTIME.md` still governs every Morse audio entry point including
this one.

**Last verified:** 2026-09-25

**Extended by:** `docs/open/MORSE_INTERMEDIATE_PATH.md` — Copy, free play,
figures and punctuation, and the ladder past 13 WPM.

**Issue:** #119

**Research:** `docs/open/ISSUE_119_MORSE_POST_ACQUISITION_FLUENCY_RESEARCH.md`
holds the sources, the architecture audit and the rejected options. This
document records what was built.

## What it is

Learn teaches the alphabet and stops. Fluency is what a learner does after
that: the same 26 characters, presented by ear, at a speed too fast to count
them, with the gaps closing as they improve.

It is reached from the Morse topic page once the alphabet is acquired — as the
primary *Keep going* between scheduled checks, and at text weight beside a due
check — that is, once every letter has been produced unaided at least once
in Learn. Gated on acquisition rather than on completion deliberately: a
learner waiting out a spacing interval before their qualifying check has
finished learning the alphabet and should not be told there is nothing to do.

The gate reads `journeyFor(topic).acquisition.ready`, **not**
`topic.acquisitionReadyAt`. The stored anchor postdates the programme, so a
learner who finished the alphabet before the field existed has every letter
settled and no timestamp — and an early build of this surface gated on the raw
field, which hid Fluency from exactly the learner it was built for. `journeyFor`
already resolves the derived and stored answers into one, and it is the same
fallback `acquisitionStartedAt` makes for the same records.
`TopicPage.fluencyEntry.test.tsx` covers that case directly.

## The one rule

> Character speed is pinned. Only the spacing moves.

`FLUENCY_CHARACTER_WPM` is 20 and is not a learner control. Everything the
learner can change is Farnsworth spacing: `FLUENCY_RUNGS` runs 6 → 13 WPM
effective and then 15, 18, 20 (see `MORSE_INTERMEDIATE_PATH.md`), and
`fluencyTiming(rung)` is the only thing that reaches `buildMorseSchedule`.

This is the whole design and it is worth stating why, because the obvious
alternative is wrong in a way that is not obvious. Argus's acquisition rate is
12 WPM, chosen with care so a first exposure is hearable as short-versus-long.
At 12 WPM a dit is 100ms, which is comfortably slow enough to count — and
counting is the habit that produces the well-documented plateau around 10–15
WPM. A post-acquisition surface that inherited the acquisition rate would
train the exact habit it exists to remove.

So the character speed is above the counting threshold and it is not on screen,
because the one thing a learner reliably does with a speed control is turn it
down. `timing.test.ts` asserts the pin directly: an edit that makes the early
rungs "easier" by slowing the character fails the suite.

The ladder itself is not invented. CW Academy's Fundamental course — whose
entry profile is this learner almost exactly, characters known and copying
around 6 WPM — pins 25 WPM and moves effective speed 6 → 10 across fourteen
sessions, exiting at 10–13 WPM. Argus takes that shape at 20 rather than 25,
one notch down, because `code.ts` already records a phone-speaker observation
about 60ms dits and 48ms tones have not been tried on the target device.
Raising it is a one-line change.

## Modes

Four speed drills, sharing one state machine in
`domain/morse/fluency/session.ts`. Four bespoke runners would be four places to
get the answer gate wrong, and the answer gate took #87 to get right once.

Above them the home screen now leads with **Copy** (hear it, type the text —
letters up to sentences) and offers **Free play**; both are specified in
`MORSE_INTERMEDIATE_PATH.md`. The drills keep training recognition time and are
what to reach for when a Copy level stalls.

| Mode | Asks | Length | Best is |
| --- | --- | --- | --- |
| **Sprint** | one character | 10 | characters a minute, from median latency |
| **Ladder** | one character | 10 | the rung, when cleared cleanly |
| **Words** | one word, heard as a unit | 6 | longest unbroken run |
| **Groups** | 2–5 random characters | 6 | longest unbroken run |

Group length (2 → 3 → 4 → 5) and word tier grow with the rung rather than
being a second control, so the learner has one dial.

Groups exist because words carry redundancy: a learner who catches `T_ME`
recovers `TIME` from English, which is a real skill but is not character
recognition, and a word-only progression lets weak characters hide behind it
permanently.

## What it measures, and why not accuracy

A learner who knows the alphabet gets almost everything right eventually, so
accuracy says nothing about whether they are recognising or assembling. Three
measures do.

**Median latency**, not mean — one answer interrupted by a notification drags
a mean of twenty samples by half a second and the median does not care.

**Coefficient of variation** (`SD / mean`) over the latency window. This is
the measure that distinguishes *speedup* from *automatization*: a process can
get uniformly faster without becoming more automatic, and that leaves CV
unchanged, because everything scaled together. Only a narrowing spread moves
it. `progress.test.ts` asserts exactly that — halving every latency leaves CV
identical.

**Element-count ratio**, the median latency of 3–4 element characters over
that of 1–2 element ones. This is the counting signal, and it is the one worth
saying out loud to the learner. Recognition is roughly constant-cost; counting
is serial, so a four-element character costs about twice a two-element one.
Around 1.0 is recognition. Around 2.0 is counting, however good the accuracy
looks.

The surface says so in words rather than printing the number alone.

## The evidence boundary

Fluency writes `Topic.morseFluency` and nothing else.

`PracticeRun` can make the stronger claim — writes nothing — because it
imports nothing that could write. Fluency legitimately keeps statistics, so
the claim is one step weaker and is stated precisely:

- `FluencyRun` and `FluencyHome` import no store, no scheduler and no evidence
  recorder;
- `FluencySurface` holds the feature's only `updateTopic` call, and that call
  is a spread plus one field;
- `FluencyBoundary.test.ts` asserts all of it against the source, so an edit
  that reaches for `useLibrary` inside a run fails the suite rather than
  quietly widening what Fluency can touch;
- `e2e/morseFluency.spec.ts` checks the behavioural half field by field: after
  a completed run, `status`, `lastTestedAt`, `completedAt`, `drilledAt`,
  `spotCheckedAt`, `itemEvidence`, `history`, `lessonProgress`, `morseReview`
  and `acquisitionReadyAt` all come out unchanged.

Fluency cannot complete anything, cannot move a retention clock, cannot resolve
an attempt and cannot write `DirectionEvidence`. Its statistics appear inside
Fluency and nowhere else — never on the topic card, never in Today, never
adjacent to retention state, because adjacency is how a formative number
quietly becomes perceived evidence.

**Press duration stays discarded.** `MorseKeyInput` still never returns it, so
no Fluency output can become sending-speed evidence, and the boundary test
asserts the feature never mentions `MORSE_HOLD_MS` or `wpm`.

### Latency hygiene

A number is only recorded when it means something. All four rules are enforced
in `FluencyRun`:

- the clock starts at the **end of the stimulus**, not the start of playback —
  otherwise every latency contains its own audible length and `Q` looks slow
  because it *is* long;
- a replayed prompt records no latency; hearing it twice is a different task;
- a prompt interrupted by backgrounding records no latency;
- a miss records no latency at all, because a wrong answer's response time
  mixes a fast guess with a long failed search.

A run abandoned halfway writes nothing. Statistics are committed once, at the
end.

## Haptics

`src/shared/haptics.ts` is now the only place Argus vibrates, and it exports
effects rather than durations.

| Effect | Pattern | Fires on |
| --- | --- | --- |
| `element` | `8` | a keyed element, at press onset |
| `settle` | `12` | one correct character |
| `miss` | `[10, 24, 10]` | any incorrect answer |
| `word` | `[14, 40, 22]` | a whole word or group correct |
| `crest` | `[18, 40, 18, 40, 30]` | a personal best |

`settle` and `miss` are the values the scored check already shipped, promoted
unchanged. `element` closes the gap that motivated this: before #119 the app's
only tactile feedback was on the *scored* surface, while `MorseKeyInput` — the
one interaction that is physically a key — had none.

Four rules, all refusals:

1. **Nothing is conveyed by vibration alone.** Every effect accompanies a
   visible state. This is what makes the platform reality survivable.
2. **Callers pass names, never numbers.** Adding a sixth effect is a
   deliberate edit to `HAPTIC_PATTERNS`, which is what stops the set drifting
   to fifteen subtly different taps.
3. **Weight is ordered by rarity** and `haptics.test.ts` asserts the ordering.
   A celebration reads as one because the ordinary case stayed quiet.
4. **One preference**, default on, hidden entirely where the API is absent.

### Platform reality

- Safari has never implemented the Vibration API, on iOS or macOS. The
  `<input type="checkbox" switch>` label-click workaround was patched out in
  iOS 26.5 and is deliberately not used.
- The spec truncates a pattern past **10 entries** and caps a single entry at
  10,000ms. Every effect above is well inside that; `haptics.test.ts` asserts
  it, because an over-long pattern would be silently cut on a device and
  nowhere else.
- `navigator.vibrate` returns `false` for a hidden document, may be rate
  limited, and may be disabled per origin. `fire()` reports that honestly
  rather than pretending.

**Tactile Morse is deliberately not built.** The passive-haptic-learning
evidence behind it is for hours of audio-paired wearable exposure, and OS
vibration scheduling makes no timing guarantee — so a vibrated pattern cannot
be relied on to carry the 1:3 ratio that distinguishes a dit from a dah. The
research document holds the full argument.

## Celebration hierarchy

Feedback weight is proportional to how rare the event is. The fix for
"celebrations feel too small" is a wider scale, not a louder bottom end.

| Scale | Event | Budget | Haptic |
| --- | --- | --- | --- |
| 1 | one correct character | within `MORSE_FEEDBACK_CORRECT_MS` (550ms) | `settle` |
| 2 | a word or group correct | ≤ 900ms | `word` |
| 3 | a run finished | ≤ 1600ms | `word` |
| 4 | a personal best | ≤ 2500ms, once a session | `crest` |

Only scale 4 gets a lit full-width moment, and it is still one line of text.

Every celebration has a non-motion, non-haptic form: a learner with reduced
motion set, haptics off and the phone muted must still be able to tell a
milestone from an ordinary screen. `prefers-reduced-motion` removes the
entrance and keeps the message.

## A word is now keyed as a word

`MorseKeyInput` gained an `advanceToken` prop, and `MorseWordKeyInput` was
rewritten around it.

Before, a word mounted a fresh `MorseKeyInput` per character, keyed by the
character index. Two things followed. The learner's experience of "key the
word GARDEN" was six separate letter drills sharing a heading — the structural
reason words did not feel like whole-word play. And every letter tore down the
control along with its AudioContext, because the unmount cleanup closes it: a
six-letter word created and closed six audio contexts, on the one platform
where audio unlocking is fragile and hard-won.

Now one key stays mounted and clears in place. There is still no per-character
verdict, no pause and no confirmation step; the control under the finger is
simply continuous. Fluency mounts one key for an entire run.

This change improves the existing Lesson 4/7/10/13 checkpoints too, since they
share the same input.

## Files

| File | What it holds |
| --- | --- |
| `src/shared/haptics.ts` | the whole haptic vocabulary and the preference |
| `src/domain/morse/fluency/timing.ts` | the pinned character speed and the rung ladder |
| `src/domain/morse/fluency/progress.ts` | the durable store, its parser, and the derived measures |
| `src/domain/morse/fluency/session.ts` | the run state machine for all four modes |
| `src/domain/morse/fluency/corpus.ts` | the authored word list and the group generator |
| `src/features/morse/fluency/FluencySurface.tsx` | the feature's only write path |
| `src/features/morse/fluency/FluencyHome.tsx` | modes, the one dial, the diagnostics |
| `src/features/morse/fluency/FluencyRun.tsx` | one run, and the latency hygiene |
| `src/features/morse/fluency/CopyRun.tsx` | one Copy run |
| `src/features/morse/fluency/FreePlay.tsx` | free keying and listening; writes nothing |

## Not in scope

No change to the printed A–Z completion boundary. No scored auditory or
sending claim — the deferred #29 remains the only home for either, and the
`auditory` value reserved in `CUE_STATES` stays reserved and unused. No
leaderboards, opponents or shared streaks. No storage version change:
`morseFluency` is additive within v5, absent by default, exactly as
`morseReview` was.
