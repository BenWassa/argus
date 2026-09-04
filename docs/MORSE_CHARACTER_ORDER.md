# Morse character order and packet composition

Workstream 3 (#26). Implements **P1 (ratified)** and **P2 (default)** from
`docs/MORSE_PROGRAMME_PLAN.md`, and records the comparison PRD §10.2 requires.

Code: `src/lib/morseOrder.ts`. Tests: `src/lib/morseOrder.test.ts`.

**This order is not official and not optimal.** It is a defensible sequence for
the boundary Argus actually ships first — *printed* letter ↔ pattern — derived
from a stated rule rather than transcribed from folklore, so that the rule can
be argued with and the sequence re-derived if the rule changes.

## The rule

Complexity-ascending, with confusables split:

1. fewest elements first;
2. then shortest keying time (dit units including intra-character gaps);
3. then dits before dahs, most significant element first, as a stable tie-break;
4. then, applied on top: a character is deferred to the next available slot if it
   would be introduced alongside a character it differs from **only in its final
   element**.

Rule 4 is Spragg's strongest confusion family, and it is the only constraint
allowed to disturb the complexity ordering. Deferral is minimal — a deferred
character takes the first later slot where the constraint holds — and the test
suite asserts that no character drifts more than one novel pair from its plain
complexity position.

## The sequence

```
E I T A N S M U R D W K G H O V F L B P X C Z J Y Q
```

Plain complexity order, before rule 4 is applied, is
`E T I A N M S U R D W K G O H V F L B P X C Z J Y Q`. The differences are
entirely the deferrals: `E`/`T`, `I`/`A`, `N`/`M`, `R`/`W`... each pair differs
only in a final element and is therefore split.

The sequence is pinned in `morseOrder.test.ts` against this document. A change
to the generator that changes the sequence fails that test, so the shipped order
and the recorded order cannot drift apart.

## Packets (P2)

Five visible cards, two of them novel, both independently configurable —
`visible` is a mobile layout decision, `novel` is the acquisition load, and
changing one must never silently change the other. That is the failure mode
PRD §10.1 warns about, and there is a test for it.

Review cards are already-encoded characters returning for retrieval, least
recently seen first. A packet may be **smaller** than `visible`: the
final-element constraint applies to everything on screen together, novel and
returning alike, and the constraint outranks the layout.

| Packet | New | Returning |
|---|---|---|
| 1 | E, I | — |
| 2 | T, A | — |
| 3 | N, S | E, I |
| 4 | M, U | T, A |
| 5 | R, D | E, I, N |
| 6 | W, K | S, T, A |
| 7 | G, H | M, U, E |
| 8 | O, V | I, N, R |
| 9 | F, L | D, T, A |
| 10 | B, P | S, W, K |
| 11 | X, C | E, M, U |
| 12 | Z, J | G, H, I |
| 13 | Y, Q | N, R, O |

Packets 1–4 are short because there are not yet four non-colliding encoded
characters to draw on. Shipping a four-card packet is the honest outcome of the
constraint; padding it would mean putting `E` and `T` on screen together.

## Comparison against Koch and CW Academy orders

### The observation that decides it

Koch-style orders and the CW Academy curricula are tuned for **auditory**
acquisition, and Argus's first shipped boundary is **printed**. Rothkopf's (1958)
separation result concerns *aural* similarity specifically. An order borrowed
wholesale from CW practice optimises for a competency this topic does not claim.

A purely visual order, meanwhile, would mean re-teaching the alphabet in a
different sequence when workstream 6 introduces reception. The rule above threads
both: complexity ordering serves printed acquisition now, and the confusable-pair
constraint is drawn from the *aural* confusion literature, so the sequence does
not sabotage reception later.

### What each order optimises for

| Order | Optimises for | What it assumes | Fit to a printed first boundary |
|---|---|---|---|
| Koch-style incremental | Full-speed aural discrimination from the first character; adding a character only once accuracy holds | The learner is listening at target character speed from day one, with a speed/accuracy criterion driving progression | Poor fit as-is. Its progression gate is an *audio accuracy* criterion Argus does not measure, and Argus's scheduler — not a per-session accuracy gate — owns completion |
| CW Academy Fundamental | On-air CW readiness across a fixed session calendar, characters interleaved with words and on-air procedure from early on | A cohort, an instructor and a calendar; sending is introduced alongside receiving | Poor fit as-is. It sequences against instructor sessions and an operating goal, neither of which Argus has |
| Complexity-ascending, easy-first | Encoding load per character; shortest, simplest patterns first | Nothing about the channel — it is a property of the pattern, not the modality | Good fit. It is modality-neutral, which is exactly what a printed boundary that must not sabotage a later aural one needs |
| **Argus (complexity-ascending, confusables split)** | Printed encoding load, with the aural confusion families kept apart | Only the ITU mapping and Spragg's confusion family | The shipped order |

### Where the orders agree and disagree

All three published approaches and this one agree on the general shape — short,
high-contrast characters early — and disagree on what drives progression. Koch's
gate is aural accuracy at speed; CW Academy's is a session calendar; Argus's is
the delayed-retention scheduler that already owns every other topic. That
difference is the substantive one, and it is why the sequence is derived here
rather than adopted.

Both Koch-style orders and the CW Academy curricula also start from a small set
of maximally *dissimilar* characters, which the confusable-split constraint
reproduces from a different direction: Argus does not choose dissimilar
characters to start, it chooses simple ones and then forbids the similar ones
from arriving together.

### Verification status — open for #28

The exact published sequences could **not** be retrieved in this environment:
`cwops.org` and `morsecode.world` are blocked by the network egress policy, so
the CW Academy Fundamental v2.0 session-by-session introduction order and a
primary-source Koch sequence were not obtainable. The comparison above is
therefore structural — what each order optimises for and what it assumes — and
deliberately asserts **no specific letter sequence** for either.

Widely reproduced secondary accounts describe Koch's method as beginning with
`K` and `M`, but the full sequence has several circulating variants and none was
verified against a primary source here.

Workstream 5 (#28) owns provenance verification. It should retrieve both primary
sources and either extend this section with the verified sequences and a
letter-by-letter comparison, or record that they remain unavailable. Nothing in
the Argus sequence depends on that verification — the rule is stated
independently of both — so this is a completeness gap in the *record*, not in
the design.

## Sources

- ITU-R M.1677-1 — International Morse code, the canonical A–Z mappings and the
  1:3:7 timing relationships every part of this order is computed from.
  https://www.itu.int/rec/R-REC-M.1677-1-200910-I/en
- Spragg (1943), character difficulty and confusion. https://doi.org/10.1037/h0054213
  — the final-element confusion family the constraint is built on.
- Rothkopf (1958), spacing similar aural stimuli during acquisition.
  https://doi.org/10.1037/h0042909 — why separation applies during acquisition
  specifically, and why it is an *aural* result being applied cautiously to a
  printed boundary.
