# #197 — Scored-content audit of all 24 shipped topics

**Status:** completed audit, 2026-10-08. Evidence for owner decisions; **no runtime, catalog, scoring or role change**.
**Authority:** measured facts about what Test actually scores today. Role names, thresholds and sequencing live in the [decision record](ISSUE_197_ROLE_DECISION_RECORD.md); the 24×10 matrix in the [parent dossier](ISSUE_197_EXPANDED_ROLE_ARCHITECTURE_RESEARCH.md) stays a hypothesis overlay.
**Closes the gate:** the per-scored-item audit that PR #198 named as the next step after the 24-topic inventory.

## 1. Method and limits

- **Source of truth:** `catalogDefinitions()` from `src/domain/library/catalog.ts` on `main` at `a67a8cb` (v1.5.0), run through a throwaway Vitest file that dumped every topic's `scope`, `items`, `choice`, `stimulus`, and `learn` summary to JSON. The scratch file was deleted; nothing is committed. Re-run it whenever the manifest changes (see §8).
- **Counted as the app counts:** one `Item` is one scored prompt. `bidirectional` Morse items are one item each (52 directional prompts); CAF's 38 items are 19 facts tested in both directions.
- **Objective vs self-scored:** an item with a `choice` is objective (answer is checked by the app). An item without one is reveal-and-self-grade. PRODUCT.md: a clean Test banks a topic, so completion means every item correct.
- **Checked mechanically (98 items, 0 errors):** 12 reciprocal bearings, 12 true↔magnetic conversions, 16 hex→binary, 24 SI prefix exponents/names, 26 NATO code words, and the 8 grid-north conversions by hand (including the two-offset and convert-then-reciprocal cases).
- **Spot-checked against my own knowledge, not against primary sources:** the 12 Beaufort ranges, the 12 International Code of Signals flag meanings, ACTS/PROVE wording, and the navigation-light sector logic (e.g. 135° off the bow sees the sternlight only). All consistent.
- **Not verified here:** RIC-22, RAMN 2026, WMO, IMO/Pub. 102 and Canadian Collision Regulations wording. The independent domain reviews already open for #147, #148 and #150 remain the authority and are not closed by this audit.

## 2. Headline numbers

| Measure | Value |
|---|---|
| Topics / scored items | 24 / **342** |
| Objective (app-checked) items | **101** (29.5%) |
| Self-scored reveal-and-grade items | **241** (70.5%) |
| Pure association recall (label ↔ label) | 211 (61.7%) |
| Ordered-structure or definition recall | 54 (15.8%): 30 self-scored, 24 objective |
| Apply a rule to given inputs, or read a diagram to a number | 44 (12.9%) — **all in Navigation** |
| Recognise a pictured state or flag | 33 (9.6%) |
| Objective items by option count | all 101 are single-answer, four options |
| Topics under 10 items | 7 (OODA 4, Marine Calling 4, Primary Survey 5, Day Shapes 5, Compass Bearings 8, Marine Priority 9, Firearm 9) |

## 3. Demand classes

| Class | Meaning | Example |
|---|---|---|
| **ASSOC** | Recall a label for a cue, no inference | `Force 7 → Near gale — 28–33 knots` |
| **SEQ/DEF** | Recall an ordered set or a definition | Marine distress-call field order |
| **APPLY** | Transform given inputs, or read a diagram to a value | `064°M with D = 9° W → true bearing` |
| **VIS** | Recognise a state from a picture | Light signal 6 → restricted in ability to manoeuvre |

## 4. Per-topic audit

`s` = self-scored, `o` = objective. Direction is the tested direction.

| # | Topic (`id`) | Items | Mode | Class | Findings |
|---:|---|---:|---|---|---|
| 1 | NATO Alphabet (`nato-phonetic`) | 26 | 26s | ASSOC | Letter → word only; decoding a spelled word is untested. **No `limitations` in Learn; one source.** A Communicator requirement. |
| 2 | International Morse Code (`international-morse-letters-printed`) | 26 | 26s | ASSOC | Bidirectional (52 prompts). Printed form only; Fluency, listening and sending are formative and never reach Test evidence. Strongest recall depth in the set. |
| 3 | OODA Loop (`ooda-loop`) | 4 | 4s | SEQ/DEF | Four stage-and-function pairs. Scope is honest; too thin to carry a role. |
| 4 | Primary Survey (`primary-survey`) | 5 | 5s | SEQ | ABCDE headings in order. Explicitly not first aid. Too thin to carry a role. |
| 5 | Compass Bearings (`cardinal-bearings`) | 8 | 8s | ASSOC | Name → degrees only. **No `limitations`; one source.** The only self-scored Navigation topic. |
| 6 | Cloud Genera (`cloud-genera`) | 10 | 10s | ASSOC | Abbreviation → name. The Learn guide is photographic (13 sources) but the score is vocabulary only; the Learn limitations say so. |
| 7 | Whole-Circle Bearings (`whole-circle-bearings`) | 12 | 12o | APPLY | 6 read a ray to a bearing, 6 find the ray for a bearing. Distractors in the item inspected include the reciprocal and the mirror bearing. |
| 8 | Reciprocal Bearings (`reciprocal-bearings`) | 12 | 12o | APPLY | T/M/G mixed, including wrap past 000°; 2 diagram items. |
| 9 | True & Magnetic North (`north-references-declination`) | 16 | 16o | 4 SEQ/DEF + 12 APPLY | Declination always supplied; east-positive convention stated. |
| 10 | Grid North & Map Bearings (`grid-north-map-bearings`) | 12 | 12o | 4 VIS/DEF + 8 APPLY | Three-norths schematic, single offsets, two offsets, convert-then-reciprocal. Offsets always supplied. |
| 11 | Navigation Lights & Aspect (`navigation-lights`) | 16 | 16o | VIS | 8 sector items (which lights are visible from each of eight bearings) plus 8 state-recognition items. Aspect items cover **power-driven vessels under 50 m only**. |
| 12 | Vessel Day Shapes (`vessel-day-shapes`) | 5 | 5o | VIS | Five states. Very thin; strong for the claim it makes. |
| 13 | Signal Flags (`signal-flags`) | 12 | 12o | VIS | **Compound answer** (letter and meaning). A learner who knows the letter but not the meaning fails the item with no partial credit; this is stricter than it looks. |
| 14 | CAF Rank Equivalencies (`caf-rank-equivalencies`) | 38 | 38s | ASSOC | 19 facts doubled by direction; the largest deck by item count and not a role seed. |
| 15 | SCUBA Equipment (`scuba-equipment-abbreviations`) | 13 | 13s | ASSOC | Abbreviation → meaning. Well-bounded; 9 sources. Entire Diver evidence today. |
| 16 | Radio Numbers (`radiotelephony-numbers`) | 13 | 13s | ASSOC | Digit → printed spoken form. No audio evidence (drills blocked, #151). |
| 17 | Radio Procedure (`radio-procedure`) | 15 | 12s + 3o | 12 SEQ/DEF + 3 SEQ | The only mixed deck: 12 words are self-scored, three call-order items are objective. One source. |
| 18 | Marine Calling (`marine-vhf-routine-calling`) | 4 | 4o | SEQ | Four structures. Thin but fully objective. One source. |
| 19 | Marine Priority Calls (`marine-vhf-priority-communications`) | 9 | 9o | SEQ/DEF | Meanings, priority order and four field orders. Memory of published structure only. |
| 20 | SI Prefixes (`si-prefixes`) | 24 | 24s | ASSOC | Exponent → name and symbol (compound). All 24 exponents verified. One source. |
| 21 | Greek Alphabet (`greek-alphabet`) | 24 | 24s | ASSOC | Letter → name. One source. |
| 22 | Hex to Binary (`hex-digits-binary`) | 16 | 16s | ASSOC | All 16 verified. Digits 0–9 are plain binary and add little beyond A–F. |
| 23 | Beaufort Scale (`beaufort-wind-scale`) | 13 | 13s | ASSOC | Force → term **and** range (compound). Reverse (speed → force) explicitly untested. |
| 24 | Firearm Safety (`firearm-safety-acts-prove`) | 9 | 9s | SEQ | Nine rules in RCMP handbook wording. Recall of a safety checklist only. |

## 5. Cross-cutting findings

1. **The library is overwhelmingly recall.** 62% of items are label association and 70% are self-graded. Completion therefore certifies "can recall this table", not "can use it", for most of the catalogue.
2. **Application exists only in Navigation.** All 44 APPLY items sit in four Navigation topics. No Communicator, Mariner, Diver, Responder or Operator evidence asks the learner to use knowledge on a novel input. Role claim text must use the verbs the evidence supports: *recalls*, *recognises*, *converts*.
3. **Self-scoring dilutes role evidence.** Communicator's 105 items are 27% objective (28 of 105). Navigator's 60 are 87% objective. This is a property of existing decks, not a defect, but it is why two roles with the same "seven topics" shape are not equal evidence.
4. **Compound answers are inconsistent.** Flags, Beaufort and SI score two attributes as one item; NATO, Greek and Cardinal score one. For self-graded decks the learner decides whether a half-right answer passes.
5. **Almost everything is one-way.** Only Morse and CAF test both directions. NATO decoding, Greek-name → letter, hex → binary → hex, Beaufort speed → force, and bearing → compass-point are untested. Role copy must not imply the reverse skill.
6. **Thin decks cannot carry a role.** Operator's only seed has 4 items, Responder's 5, Diver's 13. See the gates in the decision record.
7. **Documentation gaps on role seeds.** `nato-phonetic` and `cardinal-bearings` have no `limitations` in Learn, and nine topics cite a single source (NATO, Morse, Compass Bearings, Reciprocal, Radio Procedure, Marine Calling, SI, Greek, Hex). The first two are seeds of Communicator and Navigator.
8. **Scenario items do not need a new engine at the single-answer level.** The shipped objective-choice item already carries a prose prompt and four options (the marine VHF decks use it). A vignette item with one best answer is an authoring and review problem, not an engine problem. **Rubric scoring** (multiple dimensions, critical failures, floors) does need new runtime and persistence. The psychology and field research briefs call this "scenario practice"; the two tiers should be separated.
9. **Arithmetic and lookup content is correct.** No errors in 98 mechanically or hand-checked items.
10. **External factual accuracy is still gated on domain reviews** for lights and shapes (#147), flags (#148) and radio/marine VHF (#150). This audit adds no confidence beyond internal consistency and my spot checks.

## 6. Evidence profile by role candidate

Objective % is of the role's items. Topics shared between roles are counted in each.

| Role (status) | Topics | Items | Objective | APPLY | VIS | ASSOC | SEQ/DEF |
|---|---:|---:|---:|---:|---:|---:|---:|
| Communicator (locked, shipped) | 7 | 105 | 28 (27%) | 0 | 12 | 65 | 28 |
| Navigator (proposed requirements) | 5 | 60 | 52 (87%) | 44 | 0 | 8 | 8 |
| Mariner (proposed requirements) | 7 | 69 | 46 (67%) | 0 | 33 | 23 | 13 |
| Diver | 1 | 13 | 0 | 0 | 0 | 13 | 0 |
| Responder | 1 | 5 | 0 | 0 | 0 | 0 | 5 |
| Operator | 1 | 4 | 0 | 0 | 0 | 0 | 4 |
| Technical (candidate) | 3 | 64 | 0 | 0 | 0 | 64 | 0 |
| Unassigned: CAF Rank Equivalencies, Firearm Safety | 2 | 47 | 0 | 0 | 0 | 38 | 9 |

Mariner shares Signal Flags and both Marine VHF topics (25 of its 69 items, 36%) with Communicator. Distinct topics seeding an earnable role today: Communicator 7 + Navigator 5 + Mariner's four own (lights, shapes, Beaufort, clouds) = **16 of 24**. The other 8 (SCUBA, Primary Survey, OODA, SI, Greek, Hex, CAF, Firearm) have no sufficient role home.

## 7. Defects and small actions (none made here)

| Action | Why | Risk |
|---|---|---|
| Add `limitations` to NATO Alphabet and Compass Bearings Learn content | Only role seeds without a stated boundary | Learn-only; no scored change |
| Add a drift test: every role `topicIds` exists in the manifest, and the parent matrix row IDs equal the manifest | The parent dossier's own P0 deliverable | Test-only |
| Record the compound-answer rule in `docs/LIBRARY_RESEARCH_METHOD.md` | Finding 4 | Docs-only |
| **Do not** add reverse-direction items to shipped decks | Changing a shipped topic's item set changes its completion boundary for learners who already banked it | A scored-item change is a role-version event; see the decision record |

## 8. Reproducing the audit

Write a temporary `src/*.test.ts` that maps `catalogDefinitions()` to `{id, title, scope, items: [{prompt, answer, choice, stimulus}], learn}` and writes JSON outside the repo, run it with `npx vitest run <file>`, then delete the file. Counts above follow directly from `choice` presence per item. Do not commit the dump; regenerate it per iteration, as the parent dossier already requires for the manifest.
