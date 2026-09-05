# Argus rhythmic verbal Morse mnemonics

**Status:** implemented under #42; visible grammar corrected by #48  
**Code:** `src/lib/morseVerbalMnemonics.ts` (the authored set),
`src/features/learn/MorsePhrase.tsx` (the one rendering of it)  
**Mechanical verification:** `src/lib/morseVerbalMnemonics.test.ts`,
`src/features/learn/MorseAcquisitionTreatment.test.tsx`

## Purpose

For the printed A–Z topic, the first memory hook is now a short spoken phrase
whose beat lengths reproduce the character's International Morse pattern.

The rule is deliberately simple:

- a **short, clipped beat** means a dit (`.`), one signal unit;
- a **held beat** means a dah (`-`), three signal units;
- one spoken word is used for each Morse element, in transmission order.

Every visible word carries an aligned mark directly beneath it — `·` for a
short beat, `—` for a held one. That mark is the whole of the visible timing
rule. A learner must never have to infer the canonical mapping from typography
or from an argument about how long a particular English speaker happens to
pronounce a word.

## The #48 correction: casing is not semantic

#42 rendered short words lowercase and held words capitalised, and #44 removed
the per-beat `short ·` / `hold —` captions in favour of that casing. Real-phone
review found the result contradictory, and it was:

- the supplied exemplar `A LONG` capitalises `A`, which is the **short** beat,
  so the casing rule was already broken by the one worked example everything
  else was modelled on;
- this document said capitalisation was supplementary while
  `MorseCharacterPacket.css` said casing alone carried the contrast.

#48 settles it in one direction: **casing carries nothing.** `MorsePhrase`
renders every visible word in the same case, so no reader can draw a timing
conclusion from typography and no exemplar can contradict the rule. Duration is
carried by the aligned `·`/`—` mark, which is a function of the authored beat
length alone. `A LONG` therefore reads exactly as #42 supplied it, with `·`
under `A` and `—` under `LONG`.

The authored table keeps its mixed casing, because that is what reaches a screen
reader through `verbalMnemonicTextEquivalent`, and an all-capitals word is
liable to be announced as an initialism. Visible casing and accessible casing
are deliberately different things.

`MorseAcquisitionTreatment.test.tsx` asserts, for all 26 phrases, that every
visible word is cased identically, that the marks reproduce the canonical
pattern element for element, and that the authored set is still mixed-case.

## Repetition is deliberate, and explained once

Several phrases repeat a word because the pattern repeats an element: `up up
ZOOM` for `..-`, `quick quick quick VROOM` for `...-`, `CROSS cut cut CROSS`
for `-..-`, `ZOOM ZOOM zip zip` for `--..`. One spoken word is one Morse
signal, so a repeated word is a repeated beat rather than duplicated data.

Two things make that legible without a caption on every beat:

1. one mark sits under each word, so four words visibly carry four marks;
2. `MorseBeatGrammarNote` states the rule once per surface, in the learner's
   words, using `ZOOM ZOOM ZIP ZIP` as the worked example.

Repetition is never mechanically deduplicated. The tests pin the four repeating
phrases by name.

The phrase is temporary acquisition scaffolding. The completion claim remains
exactly:

> Can independently recall all A–Z printed Morse mappings in both directions.

A learner is never scored on remembering the phrase, and the verbal mnemonic is
completely absent from the uncued production and reverse-recall rungs.

## Provenance and authority

The interaction method was prompted by the reference supplied in #42:

- <https://youtu.be/0CYpik24pRU?si=RX5Bow1eMGFpLdV5>

The supplied `A = "A LONG"` example is retained exactly. The remaining 25
phrases below were authored for Argus rather than copied from a third-party
mnemonic list. The reference is therefore a **method/design precedent**, not the
canonical source for the alphabet or the source of the Argus phrase set.

Canonical Morse content comes only from **ITU-R M.1677-1, International Morse
code**, Annex 1 Part I. The Recommendation defines the A–Z mappings and the
timing relation in which a dash is three dots and the gap between signs inside
a character is one dot:

- <https://www.itu.int/rec/R-REC-M.1677-1-200910-I/en>

`morseVerbalMnemonics.test.ts` converts every authored `short`/`long` beat back
to dot/dash notation and compares all 26 entries with `MORSE_LETTERS`, the same
canonical table used by the scored deck. It also checks that the verbal beat
units, SVG units and synthesized-audio signal units are identical for every
letter. An editorial change that encodes the wrong pattern therefore fails the
repository gate.

## Editorial grammar

The set uses a deliberately constrained vocabulary rather than trying to make
26 clever mini-poems:

1. **One monosyllabic word per element.** This makes the number and order of
   beats explicit.
2. **A short beat must end in a stop** (`bat`, `zip`, `pop`, `cut`, `quick`,
   `back`, `clicked`). A word ending in `/p t k b d g/` physically cannot be
   drawn out, so a learner cannot accidentally lengthen a dit.
3. **A held beat must end in a continuant** — a vowel, nasal, liquid, glide or
   fricative (`MOON`, `GO`, `SLOW`, `FLY`, `HOME`, `QUEEN`, `LONG`, `GLOWS`).
   These can be sustained for as long as breath allows, so stretching the beat
   needs no strange pause after the word.
4. **That contrast is enforced mechanically, not by ear.** `finalSoundClass` in
   `morseVerbalMnemonics.ts` derives the ending class from spelling, and the
   gate asserts it for all 26 phrases. This rule exists because the failure mode
   it prevents is the only one that actively teaches the wrong code: a "held"
   word a learner naturally clips (`KITE`, `COAST`, `CREEPS`) or a "short" word
   they naturally sustain (`can`, `run`, `then`, `wren`, `dim`). Every one of
   those shipped in the first draft of this set and has been replaced.
5. **`A` is the single documented exemption.** #42 supplies `A LONG` verbatim as
   the worked example of the whole treatment; its contrast is carried by the
   vowel length of the two words rather than by their codas. The exemption is
   held in `CODA_RULE_EXEMPT_BEATS` and the gate asserts that it stays a list of
   exactly one. It is an exemption from the *coda* rule only. `A LONG` is not an
   exception to anything visible, because since #48 the visible rule is the
   mark, and `A` carries `·` like every other short beat.
6. **The opening word usually cues the letter.** It begins with the target
   letter where a natural choice exists. `X` uses `CROSS`, the visual meaning of
   an X. `V` is the one letter where no stop-final V-word gave a usable first
   beat, so it leans on its unmistakable three-shorts-then-`VROOM` shape.
7. **Concrete miniature scenes are preferred** (`jet FLIES FAR HOME`, `rat RAN
   back`, `COME cat COME quick`) because they are easier to retain than a random
   word string while remaining rhythmically simple.
8. **The explicit beat mark still resolves accent variation.** The coda rule
   removes the ambiguity that matters, but no English word has a universal
   physical duration. The `·`/`—` mark, the canonical notation, the SVG and the
   actual tone all state the intended timing independently, and none of them is
   typography.

This is an engineered acquisition vocabulary, not a linguistic claim that one
word's natural duration is objectively one or three Morse units.

## A–Z set

The `Phrase` column below shows the authored text. On screen every word is
uppercased and marked; the `Beat rule` column is what the marks render as.

| Letter | Canonical | Phrase | Beat rule | Association |
|---|---|---|---|---|
| A | `.-` | **A LONG** | · — | supplied exemplar; exempt from the coda rule, contrast carried by vowel length |
| B | `-...` | **BOOM bat zip pop** | — · · · | boom, then three clipped impacts |
| C | `-.-.` | **COME cat COME quick** | — · — · | "come cat, come quick"; alternation is the whole shape |
| D | `-..` | **DOWN duck dip** | — · · | one sustained call, two clipped actions |
| E | `.` | **egg** | · | single clipped E-word |
| F | `..-.` | **flip flap FLY back** | · · — · | bird motion; only `FLY` can be stretched |
| G | `--.` | **GROW GREEN quick** | — — · | two sustainable beats, then a hard stop |
| H | `....` | **hip hop hit pop** | · · · · | four percussive beats |
| I | `..` | **it clicked** | · · | two clipped beats; `clicked` ends in a stop cluster |
| J | `.---` | **jet FLIES FAR HOME** | · — — — | a jet followed by three broad held beats |
| K | `-.-` | **KING kick HIGH** | — · — | sustained, clipped, sustained |
| L | `.-..` | **lap LONG lap quick** | · — · · | a pacing cadence: one long lap, then two short |
| M | `--` | **MOON GLOWS** | — — | two continuant-final beats |
| N | `-.` | **NO not** | — · | minimal contrast: sustained `NO`, clipped `not` |
| O | `---` | **OH SO SLOW** | — — — | three naturally stretchable O-heavy beats |
| P | `.--.` | **pup GOES FAR back** | · — — · | concrete out-and-back mini-scene |
| Q | `--.-` | **QUEEN GOES quick HOME** | — — · — | Q cue plus an unmistakably clipped third beat |
| R | `.-.` | **rat RAN back** | · — · | short-long-short out-and-back rhythm |
| S | `...` | **sit sip zip** | · · · | three clipped sibilant beats |
| T | `-` | **TONE** | — | single naturally sustained T-word |
| U | `..-` | **up up ZOOM** | · · — | two clipped beats then a sustained finish |
| V | `...-` | **quick quick quick VROOM** | · · · — | three identical clipped beats make the V shape audible; `VROOM` cues the letter |
| W | `.--` | **web WE WEAVE** | · — — | triple-W image; only the first beat is clipped |
| X | `-..-` | **CROSS cut cut CROSS** | — · · — | X = cross; symmetrical long-short-short-long shape |
| Y | `-.--` | **YAWN quit GO HOME** | — · — — | long opening Y-word, clipped pivot, two held beats |
| Z | `--..` | **ZOOM ZOOM zip zip** | — — · · | paired sustained Z-words followed by paired clipped ones |

## Relationship to the visual and audio scaffolds

The SVG is retained, but it is no longer the primary mnemonic. It is a secondary
visual timing scaffold generated from the same canonical pattern:

- circle = dit = one unit;
- bar = dah = three units;
- left-to-right order = transmission order;
- element highlight is driven from the same schedule and start delay as Web
  Audio.

The resulting acquisition hierarchy is:

> verbal mnemonic + SVG + canonical pattern + audio  
> → reduced verbal/visual rhythm cue  
> → canonical/audio support  
> → uncued production and reverse recall

The supported Test rungs may expose only a **strict prefix** of the verbal/SVG
answer. The canonical-support rung may offer user-triggered audio. The final two
rungs carry no phrase, artwork, answer length, prefix or audio control at all.

Audio remains support for this printed-mapping topic; hearing the sound is not
part of its completion claim.

## Where the phrase appears

One component, `MorsePhrase`, renders it everywhere, so no surface can grow its
own grammar:

- the **guided Learn lesson** (`docs/MORSE_LESSON.md`) shows the whole phrase
  when introducing a character and when reteaching a miss, and at its `taught`
  check;
- the **Morse alphabet reference** shows it on every one of the 26 rows;
- the **`morse-character-packet`** Learn block shows it for authored content;
- the **supported Test rungs** show a strict opening prefix of it, with the
  remaining beats rendered as `?` marks.

## Validation boundary

Automated checks can prove structural facts: all 26 patterns agree with the
canonical table, every visible mark matches the canonical element it stands
for, casing is constant across the whole set, every cue is bounded, channels
share the same timing sequence, and uncued Test contains no mnemonic. They
cannot prove that these phrases are memorable, intuitive or effective for
people.

The exact production build still requires the real-device acceptance stated in
#44 and #48. Genuine novice/rusty learner validation should determine whether
any phrase is awkward enough to revise before #29 extends the programme into
separately claimed auditory/sending work.
