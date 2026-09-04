# Morse character order and packet composition

Workstream 3 (#26). Implements **P1 (ratified)** and **P2 (default)** from
`docs/MORSE_PROGRAMME_PLAN.md` and records the comparison requested by the Morse
research PRD.

Code: `src/lib/morseOrder.ts`. Tests: `src/lib/morseOrder.test.ts`.

**This order is not official and is not claimed to be optimal.** It is a
defensible sequence for the boundary Argus ships before #28 — *printed* letter →
pattern — derived from a stated rule rather than copied from a named training
tradition. The rule can therefore be reviewed and the sequence re-derived if the
product boundary or evidence changes.

## The Argus rule

Complexity-ascending, with the strongest documented confusable family split:

1. fewest elements first;
2. then shortest keying time (dit units including intra-character gaps);
3. then dits before dahs, most significant element first, as a stable tie-break;
4. then, applied on top: a character is deferred to the next available slot if it
   would be introduced alongside a character it differs from **only in its final
   element**.

Rule 4 uses Spragg's strongest reported confusion family. It is the only
constraint allowed to disturb the complexity ordering. Deferral is minimal — a
deferred character takes the first later slot where the constraint holds — and
the test suite asserts that no character drifts more than one novel pair from
its plain-complexity position.

## The sequence

```text
E I T A N S M U R D W K G H O V F L B P X C Z J Y Q
```

Plain complexity order, before rule 4 is applied, is:

```text
E T I A N M S U R D W K G O H V F L B P X C Z J Y Q
```

The differences are the minimal deferrals needed to keep final-element
confusables out of the same introduction packet. The sequence is pinned in
`morseOrder.test.ts` against this document, so implementation and documentation
cannot silently drift.

## Packets (P2)

Five visible cards, two novel, both independently configurable. `visible` is a
mobile-layout decision; `novel` is acquisition load. Changing one must never
silently change the other.

Returning cards are already-encoded characters selected for retrieval. A packet
may be **smaller** than `visible`: the final-element constraint applies to
all characters shown together, novel and returning, and that constraint outranks
padding the layout.

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

Early packets are short because there are not yet enough returning characters
that satisfy the same-screen confusion constraint. Padding them would violate
the rule the packet system exists to preserve.

## Provenance comparison: Koch and CW Academy

This section closes the provenance gap left by #26. The important correction is
to distinguish a **training method** from a supposedly canonical **character
order**.

### Koch: method verified; fixed “Koch sequence” not established

Ludwig Koch's 1936 dissertation/article is:

> Ludwig Koch, *Arbeitspsychologische Untersuchung der Tätigkeit bei der
> Aufnahme von Morsezeichen, zugleich ein neues Anlernverfahren für Funker*,
> *Zeitschrift für angewandte Psychologie und Charakterkunde* 50 (1936), 1–70.

The bibliographic record establishes the primary work. Koch's research concerns
learning Morse by sound and developing whole-character auditory recognition. It
supports referring to a **Koch method** or **Koch-style auditory training**.

It does **not** justify treating one modern `K M R S U …` list as an official or
scientifically established “Koch order.” The strongest accessible historical
review found for this reconciliation — Long Island CW Club's 2026 review of the
original Koch report — states that Koch did not publish one single explicit
instructional sequence and used more than one sequence in his experiments. The
same review traces the commonly repeated opening `K M R S U` to Otto Lipmann's
earlier aptitude work rather than to Koch. That historical attribution is a
secondary scholarly/technical-club finding, not a new Argus claim of primary
proof about every later list.

**Repository wording rule:**

- use **Koch method** for the auditory/whole-character training approach;
- use **Koch-style** for modern incremental trainers inspired by that approach;
- do not write **the Koch sequence/order** as though Koch established a single
  official list;
- do not attach a universal accuracy threshold or exact letter order to Koch
  unless a primary source for that exact claim is produced.

Modern trainers may choose their own sequence and progression threshold while
calling the surrounding method “Koch.” Those implementation choices are useful
comparators, not primary Koch findings.

### CW Academy: Beginner is the character-acquisition source

CW Academy's current published character-acquisition curriculum located for this
review is the official **Beginner Level CW Curriculum, Fourth Edition, Release
4.7 (19 February 2025)**. It is an eight-week, 16-session, advisor-led course.
Sessions 1–10 introduce characters; the curriculum combines receiving and
sending practice and begins using words/abbreviations/phrases while the character
set is still being learned.

For letters only, the first-introduction order in that published curriculum is:

```text
A E N T S I O D H L R C U M W F Y G P Q B V J K X Z
```

That is a transcription of the current published Beginner session sequence, not
an Argus recommendation and not evidence that the order is optimal. The
curriculum also interleaves numerals, punctuation and prosigns, so the letter-only
line above is a derived comparison view rather than the course's complete
sequence.

The same Beginner document prescribes fast character formation with wider
spacing for initial practice — copy practice at 25 CPM with Farnsworth spacing
of 6 CPM, and slower sending practice — as an operational training choice. This
is contemporary practice precedent, not experimental proof of a universally
best speed.

CW Academy **Fundamental** is not the source for a beginner character order. Its
current published curriculum (v2.0, 20 April 2025) explicitly accepts students
who have already learned the Morse characters and can copy/receive around 6 WPM;
it then concentrates on instant character recognition, sending and progression
toward roughly 10–13 WPM. Earlier Argus wording that described a “Fundamental
character order” was therefore unsupported and has been removed.

## What the comparison does and does not show

| Comparator | Verified purpose | Exact order status | Fit to Argus's pre-#28 printed boundary |
|---|---|---|---|
| Koch 1936 | Auditory Morse learning / whole-character recognition method | No single fixed instructional order verified from Koch; modern “Koch-style” orders vary | Useful method precedent, not an order to copy |
| CW Academy Beginner 4.7 | Advisor-led auditory acquisition plus sending and early operating material | Current published session order verified above | Useful contemporary practice comparator, but targets broader auditory/sending competence |
| CW Academy Fundamental 2.0 | Post-alphabet ICR, sending and on-air progression | Not a beginner character-order source | Not an order comparator |
| Complexity-ascending | Minimise printed pattern complexity | Deterministic from the ITU mappings | Direct fit to the printed boundary |
| **Argus: complexity-ascending + confusables split** | Printed encoding load with one evidence-backed aural confusion constraint | Deterministic and pinned in tests | Shipped pre-#28 order |

The comparison does **not** establish that Argus's sequence is superior to Koch,
CW Academy, or any other curriculum. It explains why Argus did not import an
auditory/on-air curriculum order wholesale into a topic whose current scored
claim is printed mapping recall.

## Provenance status

**Closed for the pre-#28 documentation lane.** The runtime sequence is unchanged.
This reconciliation changes only the record: it removes the unsupported fixed
“Koch order” implication, identifies CW Academy Beginner rather than Fundamental
as the current character-acquisition source, records the published Beginner
letter order, and leaves all external orders described as precedents rather than
official or optimal prescriptions.

#28 remains responsible for its own A–Z curriculum/mobile acceptance work; it
must not need to repair this provenance record or change learner state merely to
close #26's documentation gap.

## Sources

### Primary / authoritative

- ITU-R M.1677-1 — *International Morse code*; canonical A–Z mappings and timing.
  https://www.itu.int/rec/R-REC-M.1677-1-200910-I/en
- Koch, Ludwig (1936) — *Arbeitspsychologische Untersuchung der Tätigkeit bei
  der Aufnahme von Morsezeichen, zugleich ein neues Anlernverfahren für Funker*.
  German National Library bibliographic record: https://d-nb.info/570787017
- CW Academy — *BEGINNER Level CW Curriculum*, Fourth Edition, Release 4.7,
  19 February 2025.
  https://cwops.org/wp-content/uploads/2025/02/Beginner-curriculum.htm
- CW Academy — *FUNDAMENTAL Level CW Curriculum*, Version 2.0,
  20 April 2025.
  https://cwops.org/wp-content/uploads/2025/04/CW-Academy-Fundamental-Curriculum-v2.0.htm
- Spragg (1943), character difficulty/confusion.
  https://doi.org/10.1037/h0054213
- Rothkopf (1958), presentation spacing for similar aural Morse stimuli.
  https://doi.org/10.1037/h0042909

### Secondary historical cross-check

- Long Island CW Club, *The LICW Method Guide*, v1.6 (2026), section on the
  origins of the KMR sequence. It reports a review of Koch's original work and
  distinguishes Koch's method from the later fixed KMR sequence.
  https://longislandcwclub.org/wp-content/uploads/2026/04/The-LICW-Method-Guide-Version-1.6.pdf
