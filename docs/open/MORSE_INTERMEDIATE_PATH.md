# Morse after the alphabet — the path into intermediate

**Status:** Implemented

**Authority:** Current for shipped behaviour after A–Z acquisition: the uncued
Test floor, reviews between scheduled checks, Copy, figures and punctuation,
free play and the extended spacing ladder. `MORSE_FLUENCY.md` still governs
the Fluency surface this extends; `MORSE_CUE_LADDER.md` still governs the
ladder for anyone mid-curriculum; `PROGRESS_ARCHITECTURE.md` still governs the
state boundaries none of this crosses.

**Last verified:** 2026-09-25

## Why

The owner finished all 26 letters and reported three things, all true in the
code:

1. **The final test gave part of the answer.** A miss in Test restored one
   rung of support for that letter on the next Test — the element count, then
   the opening of the rhythm phrase. And one supported answer anywhere in a run
   makes that run unable to qualify (#68). So the check handed over help and
   disqualified itself in the same gesture.
2. **Every Test re-asked the whole alphabet.** Once acquired, the topic's
   primary action is always Test, but on most days no check is due, and a Test
   that is not due moves nothing (`resolveAttempt`'s early branch). Twenty-six
   letters, for no possible change.
3. **There was nowhere to go.** Fluency existed, as a text-weight link, and
   every mode in it asked the learner to *key back* what they heard — an echo
   of the rhythm, which never requires naming the letter. There were no
   sentences, no figures and no punctuation.

## 1. Test is uncued once the alphabet is acquired

`withBaselineCue(evidence, 'free')` is now a **floor**, not only an opening.
For a topic whose guided acquisition is finished, every scored card is
presented at an uncued rung whatever the stored cue says, and `TestSession`
re-floors after folding each answer so the stored cue stays `free`.

- A miss is still recorded exactly as before (`attempts`, `correct`,
  `consecutiveCorrect: 0`), which is what Practice and the review selector
  read. It simply does not put support back on a scored card.
- A letter an older build left at a supported rung is lifted on its next
  presentation. Only the presentation moves; stored counts are untouched.
- Topics mid-curriculum, imports and ordinary topics are unchanged: their
  baseline is `rich` and the ladder restores support after a miss as it always
  has.
- `cueNote` applies the same floor, so it never promises "the cue comes back",
  and a move between the two uncued rungs — a change of *direction*, not of
  support — no longer reads as a returning cue anywhere.

Support after the alphabet lives where it is formative: Practice, Learn
replays, and Copy's feedback.

## 2. Reviews between scheduled checks

`src/domain/study/review.ts`.

A Test on a topic that is progressive, acquired, and **not due** runs as a
review: `REVIEW_LENGTH` (10) items, uncued, chosen weakest first —

1. letters missed most recently (any required direction);
2. letters never answered in Test;
3. letters answered unaided less than 80% of the time, least accurate first;
4. everything else, least recently asked first, so successive reviews rotate
   through the roster.

A review is **not an attempt.** It merges its answers into `itemEvidence`
(they are genuine uncued answers) and nothing else: no `resolveAttempt`, no
history entry, no `lastTestedAt`, no status or clock. The scheduled check keeps
its whole-deck contract unchanged, and a decayed topic — always due — still
runs the full deck for repair. The end screen says what happened, including
when the next full check is, and offers Practice for anything missed.

Decided once at session start (`reviewTopics`), like the deck itself.

## 3. The topic page after the alphabet

`journeyFor` gives an acquired progressive topic in the `waiting` phase the
primary label **Keep going**, which opens Fluency and names the next Copy
level. Its action stays `test`, so Library and Today rows still offer Test —
which, between checks, is the review. When a check is due, or the topic needs
repair, Test leads again, because only the check can earn anything; Copy and
speed practice sit beside it at text weight.

## 4. Copy — hear it, write it down

`src/domain/morse/fluency/copy.ts`, `sentences.ts`;
`src/features/morse/fluency/CopyRun.tsx`.

The learner hears Morse at their spacing and types the text. Seven levels, a
ladder of *material*, sharing Fluency's one speed dial:

| Level | Material | Prompts |
| --- | --- | --- |
| Letters | single letters, need-weighted | 10 |
| Common words | the ~90 most frequent English words | 10 |
| Everyday words | the Fluency short and medium corpus | 8 |
| Phrases | 2–3 word generated phrases | 6 |
| Sentences | generated short sentences | 4 |
| Numbers | figures alone, in groups and in phrases | 8 |
| Numbers and punctuation | sentences with figures and `. , ? /` | 4 |

- **Generated, from typed templates.** A place slot only takes a place, a
  carried thing only a thing, so output is plain English someone might send.
  No CW abbreviations, for the reason `corpus.ts` gives. Seeded per run.
- **Scored by character.** Accuracy is edit distance against the target, so
  one wrong letter in a sentence costs one character. Feedback marks missed
  words using a word-level longest common subsequence, so a dropped word does
  not mark every later word wrong. Case, spacing and space around punctuation
  are not copying errors.
- **Heard at most twice** — once, and once more. Typing while it plays is
  allowed; that is how copying works.
- **90% clears a level**, an offer rather than a gate. The home screen marks the
  first uncleared level as *Next*; every level stays open.
- **New characters are introduced before they are asked:** the numbers level
  opens on the ten figures and their rule, the last level on the four marks,
  each tappable to hear.
- Bests are stored in `morseFluency.bests` under `copy:<level>`, as a whole
  percentage. No schema change: `bests` already accepted any key.

Copy is formative and sits inside Fluency's evidence boundary.
`FluencyBoundary.test.ts` holds `CopyRun` to the same import rules as
`FluencyRun`.

## 5. Figures and punctuation

`MORSE_FIGURES` and `MORSE_PUNCTUATION` in `code.ts`, per ITU-R M.1677-1, and
`MORSE_CHARACTERS` as their union with the letters. **`MORSE_LETTERS` is
unchanged** — the course, its completion claim, every per-letter store and
`morsePattern` remain A–Z. The extension widens only what can be *played*
(`buildMorseSchedule`) and decoded (`decodePattern`). The standalone Morse
reference lists the fourteen after the alphabet; the topic page's reference
cards stay the course.

## 6. Free play

`src/domain/morse/fluency/freePlay.ts`; `src/features/morse/fluency/FreePlay.tsx`.

No target, no score, and no write path at all — it receives no `onProgress`.

- **Key it.** The shared Morse key, open-ended. A pause of
  `FREE_LETTER_PAUSE_MS` (900ms) finishes a letter; Space (or the space bar)
  adds a word gap; Delete removes the last letter or gap. A pattern that spells
  nothing stays on screen as what was actually sent. *Play it back* plays the
  decoded text.
- **Hear it.** Type anything and play it; characters with no Morse are named
  and skipped rather than refusing the line.

`MorseKeyInput` gained an optional `onEntry` callback and now accepts up to
`MORSE_MAX_ELEMENTS` (6) so a punctuation mark can be keyed. Every existing
caller passes a length of four or less and no `onEntry`, so their behaviour is
unchanged.

## 7. The spacing ladder reaches 20

`FLUENCY_RUNGS` is now `6 … 13, 15, 18, 20`. At 20 the spacing is at parity
with the pinned 20 WPM character — no Farnsworth stretch — which is real-speed
Morse and the range CW Academy's Intermediate course works in. The ladder
previously stopped at 13 on the grounds that anything further belonged to a
scored auditory boundary; these rungs are practice and grant nothing, and a
learner who has cleared Copy at 13 otherwise had nowhere to go. The scored
boundary (#29) remains separate and unbuilt.

## Also fixed

`FluencyRun`'s miss feedback read the pattern from the *next* prompt, because
the run had already advanced when it rendered. The answered prompt's patterns
now travel with the verdict.

## Not in scope

No scored auditory or copy claim, no sending-speed evidence (press duration is
still discarded), no prosigns or Q-codes, no storage version change.
