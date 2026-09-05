# Argus rhythmic verbal Morse mnemonics

**Status:** implemented under #42  
**Code:** `src/lib/morseVerbalMnemonics.ts`  
**Mechanical verification:** `src/lib/morseVerbalMnemonics.test.ts`

## Purpose

For the printed A–Z topic, the first memory hook is now a short spoken phrase
whose beat lengths reproduce the character's International Morse pattern.

The rule is deliberately simple:

- a **short, clipped beat** means a dit (`.`), one signal unit;
- a **held beat** means a dah (`-`), three signal units;
- one spoken word is used for each Morse element, in transmission order.

The visible Learn surface labels every word `short ·` or `hold —`. Capitalising
the held words is a supplementary visual cue, not the rule itself. A learner
must never have to infer the canonical mapping from typography or from an
argument about how long a particular English speaker happens to pronounce a
word.

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
2. **Short beats prefer clipped endings and short vowels** (`bat`, `zip`, `pop`,
   `cut`, `sit`) so they are natural to say quickly.
3. **Held beats prefer sustain-able vowels or continuants** (`MOON`, `GO`,
   `SLOW`, `FLY`, `HOME`, `QUEEN`) so stretching the beat does not require a
   strange pause after the word.
4. **The opening word usually cues the letter.** It begins with the target
   letter where a natural choice exists. `X` uses `CROSS`, the visual meaning of
   an X, rather than forcing an awkward X-initial English word.
5. **Concrete miniature scenes are preferred** (`jet FLIES FAR HOME`, `wren
   FLIES HOME`, `pup GOES FAR back`) because they are easier to retain than a
   random word string while remaining rhythmically simple.
6. **Explicit duration labels resolve accent variation.** The words were chosen
   to reduce ambiguity in ordinary English, but no English word has a universal
   physical duration. `short`/`hold`, the canonical notation, the SVG and the
   actual tone all state the intended timing independently.

This is an engineered acquisition vocabulary, not a linguistic claim that one
word's natural duration is objectively one or three Morse units.

## A–Z set

| Letter | Canonical | Phrase | Beat rule | Association |
|---|---|---|---|---|
| A | `.-` | **A LONG** | short · hold — | supplied exemplar; the phrase states its own contrast |
| B | `-...` | **BOOM bat zip pop** | hold — short · short · short · | boom, then three clipped impacts |
| C | `-.-.` | **COAST cat CREEPS quick** | hold — short · hold — short · | C-alliteration with alternating stretched/clipped beats |
| D | `-..` | **DRONE dips quick** | hold — short · short · | a sustained drone followed by two clipped beats |
| E | `.` | **egg** | short · | single clipped E-word |
| F | `..-.` | **fish can FLY fast** | short · short · hold — short · | simple action phrase with the sustained third beat |
| G | `--.` | **GLOW GROWS dim** | hold — hold — short · | two naturally sustain-able G-words, then a clipped ending |
| H | `....` | **hip hop hit pop** | short · short · short · short · | four percussive beats |
| I | `..` | **it fits** | short · short · | compact two-beat phrase |
| J | `.---` | **jet FLIES FAR HOME** | short · hold — hold — hold — | a jet followed by three broad held beats |
| K | `-.-` | **KITE dips HIGH** | hold — short · hold — | a kite's down-up motion mirrors long-short-long |
| L | `.-..` | **lamp GLOWS then dims** | short · hold — short · short · | concrete light scene with one sustained second beat |
| M | `--` | **MOON GLOWS** | hold — hold — | two long-vowel/continuant beats |
| N | `-.` | **NO not** | hold — short · | minimal contrast: sustained `NO`, clipped `not` |
| O | `---` | **OH SO SLOW** | hold — hold — hold — | three naturally stretchable O-heavy beats |
| P | `.--.` | **pup GOES FAR back** | short · hold — hold — short · | concrete out-and-back mini-scene |
| Q | `--.-` | **QUEEN GOES quick HOME** | hold — hold — short · hold — | Q cue plus an unmistakably clipped third beat |
| R | `.-.` | **run FAR back** | short · hold — short · | short-long-short out-and-back rhythm |
| S | `...` | **sit sip zip** | short · short · short · | three clipped sibilant beats |
| T | `-` | **TONE** | hold — | single naturally sustained T-word |
| U | `..-` | **up then ZOOM** | short · short · hold — | two clipped beats then a sustained finish |
| V | `...-` | **van can zip FAR** | short · short · short · hold — | three compact beats then a long finish |
| W | `.--` | **wren FLIES HOME** | short · hold — hold — | short subject followed by two held actions |
| X | `-..-` | **CROSS cut cut CROSS** | hold — short · short · hold — | X = cross; symmetrical long-short-short-long shape |
| Y | `-.--` | **YAWN then GO HOME** | hold — short · hold — hold — | a long opening Y-word, clipped pivot, two held beats |
| Z | `--..` | **ZOOM ZOOM zip zip** | hold — hold — short · short · | paired sustained Z-words followed by paired clipped ones |

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

## Validation boundary

Automated checks can prove structural facts: all 26 patterns agree with the
canonical table, every cue is bounded, channels share the same timing sequence,
and uncued Test contains no mnemonic. They cannot prove that these phrases are
memorable, intuitive or effective for people.

Before #42 closes, the exact production build still requires the real-device
acceptance stated in the issue. After #42 lands, genuine novice/rusty learner
validation should determine whether any phrase is awkward enough to revise
before #29 extends the programme into separately claimed auditory/sending work.
