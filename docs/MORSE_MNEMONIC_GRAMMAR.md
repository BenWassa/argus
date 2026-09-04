# The Argus Morse mnemonic grammar

Workstream 3 (#26). Owns decisions **P2** and **P5**; implements **P1** from
`docs/MORSE_PROGRAMME_PLAN.md`.

Code: `src/lib/morseMnemonics.ts` (geometry), `src/features/learn/MorseMnemonic.tsx`
(drawing), `src/features/learn/MorseCharacterPacket.tsx` (the packet surface).

## The constraint the grammar exists to satisfy

PRD §5.3 rules out an analytic translation layer:

> first inspect dot → then inspect dash → traverse a tree → derive the letter

Allan (1958) and Clawson et al. (2001) both point at unitized whole-pattern
representation as the target. So the mnemonic must be something a learner
*recognises alongside the letter*, not something they *solve to obtain* it.

Per-letter illustrations fail that test by construction. A drawing of a rocket
for `V` is a puzzle whose solution is the letter: the learner recalls the
picture, decodes it, and only then reaches the pattern. That is the derivation
step the PRD forbids, dressed as a mnemonic.

The grammar therefore contains **no letter-specific artwork at all**. Each card
draws the character's own timing next to its glyph, identically for all 26.
There is nothing to interpret, so `letter ↔ rhythm` is the only thing available
to encode, which is exactly the association the topic scores.

## The rules

1. **dit** — always the same visual event: a circle one unit wide.
2. **dah** — always the same visual event: a bar three units wide, the same
   height as the dit. The 1:3 ratio is ITU-R M.1677-1's ratio, not a style
   choice; the picture *is* the timing.
3. **order** — elements run left to right in transmission order, separated by
   exactly one unit, the canonical intra-character gap. The inter-character gap
   belongs to the schedule, not the card, so it is never drawn.
4. **one rail** — every character is drawn at the same unit size, from the same
   origin, on a rail of the same length. Pattern length is therefore directly
   comparable card to card: `E` visibly occupies less time than `J`. Length is
   information and the grammar refuses to normalise it away.
5. **glyph dominant** — the uppercase letter is the largest mark on the card and
   the rail emanates from it, so the pair reads as one object rather than a
   letter beside a diagram.
6. **canonical notation** — plain `·`/`—` sits beneath the mnemonic, with the
   spoken rhythm ("dit dah dit") beside it as visible text.
7. **sound sync** — playing a character illuminates each element in time with
   the audio, driven by the same `buildMorseSchedule` the tone is driven by, so
   the two channels cannot drift.
8. **no motion** — illumination is a colour change. Nothing translates, scales
   or rotates anywhere in the drawing, in any state. Reduced-motion users
   therefore lose nothing at all: the sequence is carried by left-to-right
   order, the origin tick, the canonical notation and the spoken rhythm, none of
   which depend on movement.

`src/lib/morseMnemonics.test.ts` asserts rules 1–4 mechanically for every
character; `MorseCharacterPacket.test.tsx` asserts rules 5–8 on rendered output,
including that the illuminated and quiet renderings differ by nothing but a
class name.

## Prototype cohort — validated before the alphabet was drawn

Ten deliberately dissimilar characters, each present for a stated reason. The
cohort is pinned in `morseMnemonics.test.ts` and the grammar invariants are
asserted against it as a distinct suite from the all-26 suite, so "the grammar
was validated on hard cases first" is a standing check rather than a claim about
the past.

| Character | Pattern | What it stresses |
|---|---|---|
| E | `.` | single dit; the shortest event in the alphabet |
| T | `-` | single dah; the other single-element character |
| H | `....` | uniform run of dits |
| O | `---` | uniform run of dahs |
| R | `.-.` | short mixed pattern |
| F | `..-.` | four-element mixed pattern, dit-heavy |
| Q | `--.-` | four-element mixed pattern, dah-heavy |
| J | `.---` | longest keying time in the alphabet |
| S | `...` | confusable pair, member A |
| U | `..-` | confusable pair, member B — differs only in its final element |

Each cohort member exists to rule out a specific way the grammar could fail.
These are the failure modes, and the rule each one forces:

- **`E` vs `H` — a per-card scale would destroy length information.** If each
  character were scaled to fill its own card, `.` and `....` would draw the same
  width and the single strongest whole-pattern cue would be normalised away.
  Rule 4 (one shared rail, fixed unit, fixed origin) exists to prevent this, and
  is asserted for every character.
- **`S` vs `U` — a pair differing only in its final element must differ in
  silhouette, not colour.** This is Spragg's hardest family. Under the grammar
  the difference is a circle where the other has a bar, at the identical x
  coordinate: it survives greyscale, low contrast, small sizes and suppressed
  motion. There is a test asserting exactly that shared prefix and divergent
  final element.
- **`H` and `O` — the gap must be one unit, not decorative padding.** Padding
  chosen for looks makes a uniform run read as separate events rather than one
  rhythm. Deriving the gap from the same unit as the elements keeps the run
  coherent and has the useful consequence that the drawn extent equals the
  played duration — asserted directly against `buildMorseSchedule`.
- **`J` and `Q` — the rail must be sized for the longest character the grammar
  will ever carry.** It is sized for five dahs and four gaps, beyond anything in
  A–Z, so adding digits later cannot change the unit size and silently re-scale
  every existing letter.
- **`E` and `T` — the glyph has to be inside the drawing.** For a one-element
  character there is almost no rhythm to look at, and a glyph placed outside the
  SVG reads as a caption on a diagram. Placing it at the rail's origin (rule 5)
  keeps letter and rhythm one object even at the degenerate end of the range.

The all-26 suite runs the same invariants over the full alphabet, so extending
from ten to twenty-six could not quietly introduce an exception.

## Accessibility

- Every drawing is `role="img"` with `<title>` (the semantic equivalent: glyph,
  spoken rhythm, element count, order) and `<desc>` (canonical notation and
  reading direction).
- The spoken rhythm is *also* visible text outside the SVG, so the mapping is
  never available only through the visual channel. A learner who cannot use the
  drawing still reaches the topic's completion boundary from the card alone.
- Audio and visual channels are independently usable. Audio failure degrades to
  a status message plus the written pattern; no drawing depends on audio, and no
  audio depends on the drawing.
- The mnemonic is sized in `em`, so it grows with the page at 200% text scaling
  rather than staying pinned to a pixel size.
- Cards are a single column on a phone and touch targets are at least 44px.

## P5 — provenance of the mnemonic set

Original, and structurally so: nothing is drawn per letter, so there is nothing
that could have been borrowed. The artwork is generated from the ITU pattern by
`buildMnemonic`, and the only inputs are the canonical mapping and the 1:3:1
unit ratios from ITU-R M.1677-1.

Google Creative Lab's `morse-learn` is Apache-2.0 at repository level with
unverified per-asset provenance. Its interaction patterns were studied; no asset,
no drawing and no per-character mnemonic from it is used here. Its approach —
one bespoke illustration per letter — is the approach this grammar deliberately
rejects, for the reason given at the top of this document.

`mnemonicId()` records asset identity as `argus-morse-rhythm-v1-<GLYPH>`. The
version segment exists so that a future grammar can be introduced without
silently re-pointing existing content at different artwork.

## What this workstream does not do

- It does not touch `src/lib/scheduling.ts` (D3).
- It does not add a Test cue rung, a cue level or any progression. Learn remains
  ungraded first exposure and a reference you can reopen; no packet is locked,
  gated or scored. The acquisition ladder is #27's, inside Test.
- It does not change any topic's scored boundary. The seeded Morse topic gains
  Learn packets and keeps exactly the 26 `letter → pattern` items it had.
- Curriculum ownership, per-mapping ITU verification and physical mobile
  acceptance remain workstream 5 (#28).
