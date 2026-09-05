# The Argus Morse visual rhythm grammar

Workstream 3 (#26), repositioned by #42. The SVG system remains the one
canonical visual representation of Morse timing, but it is now explicitly a
**secondary visual scaffold** under the rhythmic verbal mnemonic described in
`docs/MORSE_VERBAL_MNEMONICS.md`.

Code: `src/lib/morseMnemonics.ts` (geometry), `src/features/learn/MorseMnemonic.tsx`
(drawing), `src/features/learn/MorseCharacterPacket.tsx` (the packet surface).

## Role after #42

The shipped #26 treatment made the generated SVG rhythm the most prominent
acquisition device. Production use showed that this was not the intended first
memory hook. #42 corrects that hierarchy:

> verbal mnemonic + SVG + canonical pattern + audio  
> → reduced verbal/visual rhythm cue  
> → canonical/audio support  
> → uncued production/reverse recall

The SVG remains valuable because it visualises the *same temporal sequence* as
the spoken phrase and synthesized audio without introducing a separate symbolic
code. It should reinforce memory, not compete with the phrase or become the
endpoint a learner is scored on.

## The constraint the visual grammar exists to satisfy

PRD §5.3 rules out an analytic translation layer:

> first inspect dot → then inspect dash → traverse a tree → derive the letter

Allan (1958) and Clawson et al. (2001) both point at unitized whole-pattern
representation as the target. So the visual scaffold must be something a
learner can recognise alongside the letter and phrase, not an illustration they
must solve in order to derive the pattern.

Per-letter pictorial illustrations fail that test by construction. A bespoke
rocket for `V`, for example, creates another association to decode. The Argus
visual grammar therefore contains **no letter-specific pictorial artwork**.
Each card draws the character's own timing next to its glyph, identically for
all 26. The letter-specific memory association now comes from the verbal phrase;
the SVG's job is simply to make that phrase's short/long rhythm visible.

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
5. **glyph dominant** — the uppercase letter remains inside the drawing, so the
   letter and rhythm read as one object rather than a caption beside a diagram.
6. **canonical notation** — plain `·`/`—` sits beneath the scaffold, with the
   spoken `dit`/`dah` rhythm available as semantic text.
7. **sound sync** — playing a character illuminates each SVG element in time
   with the audio. #42 moved the Web Audio start delay into the shared
   `MORSE_AUDIO_START_DELAY_MS` constant, so the oscillator and highlight timers
   no longer have separate hard-coded offsets.
8. **no positional motion** — illumination is a colour/state change. Nothing
   translates, scales or rotates. Reduced-motion users therefore lose no
   sequence information.

`src/lib/morseMnemonics.test.ts` asserts the geometry rules mechanically for
every character. `src/lib/morseVerbalMnemonics.test.ts` adds the #42 cross-channel
invariant: verbal short/held units, SVG element units and synthesized-audio
signal units must be identical for all 26 letters.

## Prototype cohort — validated before the alphabet was drawn

Ten deliberately dissimilar characters remain pinned in
`morseMnemonics.test.ts` so the visual grammar cannot quietly regress on hard
cases:

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

The important failure modes remain:

- **`E` vs `H` — a per-card scale would destroy length information.** The shared
  rail and unit prevent it.
- **`S` vs `U` — a final-element difference must survive greyscale, small size
  and reduced motion.** The final circle/bar difference does.
- **`H` and `O` — gaps are timing, not decorative padding.** The visual extent
  is derived from the same units as the schedule.
- **`J` and `Q` — the rail has headroom.** Its sizing does not require per-letter
  scaling.
- **`E` and `T` — degenerate one-element patterns still remain visibly attached
  to the glyph.**

The all-26 suite runs the same invariants over the full alphabet.

## Accessibility

- Every drawing is `role="img"` with a meaningful `<title>` and `<desc>` that
  state the canonical pattern/rhythm independent of the drawing.
- The verbal mnemonic is separately labelled in text; neither the SVG nor the
  typography is the only route to the mapping.
- Audio is optional. Failure produces a status message and leaves verbal,
  canonical and visual representations usable.
- The scaffold scales with the reading surface and remains usable at 200% text.
- Cards remain one column at phone widths; controls retain the existing touch
  target requirements.
- Reduced motion removes transitions without removing order, duration labels or
  canonical notation.

## Cue fading and no-leakage rule

#42 makes the visual hierarchy explicit in Test:

- rich Test may render only the strict disclosed SVG prefix;
- delayed Test may render only the first SVG element when a prefix exists;
- canonical-support Test has **no SVG**;
- free production and printed pattern → letter reverse recall have **no SVG,
  verbal mnemonic, audio cue, length hint or answer prefix**.

The same `buildCuePayload` object controls verbal, SVG, canonical and audio
support, and tests assert that an uncued payload contains only its rung id.
Answer-bearing artwork therefore cannot accidentally survive into the evidence
that supports the completion claim.

## Provenance of the visual system

Original, and structurally so: nothing is drawn per letter. The artwork is
generated from the canonical pattern by `buildMnemonic`; its content inputs are
the A–Z mapping and the 1:3:1 signal/gap unit relationships from ITU-R M.1677-1.

Google Creative Lab's `morse-learn` was studied as an interaction precedent, but
no asset, drawing or per-character visual mnemonic from it is used here.

`mnemonicId()` retains the existing identity
`argus-morse-rhythm-v1-<GLYPH>`. #42 does not repoint that id to different
artwork, so existing content and learner state do not need a migration.

The new verbal phrases have separate provenance and are documented in
`docs/MORSE_VERBAL_MNEMONICS.md`; they are not silently treated as a new version
of the SVG asset set.

## What this work does not do

- It does not change `src/lib/scheduling.ts`.
- It does not add scoring units or change any durable item id.
- It does not make recalling the verbal phrase part of completion.
- It does not claim auditory reception, sending, WPM, groups, words or phrases;
  those remain #29 territory after the printed A–Z foundation is validated.
