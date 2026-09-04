# Morse provenance + documentation reconciliation

Date: 2026-09-03  
Lane: documentation/research only  
Baseline: post-#22 `main` at `e24ca45b62be5348e26ca2f291f633e1fe56cda3`  
Runtime changes: **none**

## Purpose

Close the provenance gap left by #26, review stale open documentation PRs against
the current v5/Morse programme, and make the durable documentation hierarchy
match implemented truth without entering #28's runtime/state scope.

## Provenance findings

### Koch

The 1936 primary work is Ludwig Koch's *Arbeitspsychologische Untersuchung der
Tätigkeit bei der Aufnahme von Morsezeichen, zugleich ein neues Anlernverfahren
für Funker* (`Zeitschrift für angewandte Psychologie und Charakterkunde`, 50,
1–70). The German National Library bibliographic record confirms the publication.

Safe claim: Koch is primary authority for a historical auditory/whole-character
Morse learning method.

Unsafe claim removed: that one modern `K M R S U …` list is **the** official or
scientifically established Koch character order.

The strongest accessible historical review found during this lane, Long Island
CW Club's 2026 *Method Guide*, reports that Koch did not publish one single
explicit instructional sequence and used more than one sequence in the original
work. LICW further traces the familiar `K M R S U` opening to Otto Lipmann's
earlier aptitude work. Because that provenance claim comes through a secondary
historical review rather than an accessible primary Lipmann text, Argus records
it as LICW's finding rather than upgrading it to an independent primary-source
claim.

Repository rule: distinguish **Koch method** from modern **Koch-style trainer
orders**; do not call a fixed sequence “official Koch” without primary evidence.

### CW Academy

The authoritative current published character-acquisition source found is CW
Academy's **Beginner Level CW Curriculum, Fourth Edition, Release 4.7,
19 February 2025**.

Its letter introductions, read in session order and omitting the interleaved
numbers/punctuation/prosigns, are:

```text
A E N T S I O D H L R C U M W F Y G P Q B V J K X Z
```

The curriculum is auditory and advisor-led, combines copying and sending, uses
words/abbreviations/phrases while the character inventory is still growing, and
specifies high character speed with wider Farnsworth spacing for copy practice.
Those are verified contemporary training-practice facts; they are not evidence
that the exact sequence or exact speed is universally optimal.

The current **Fundamental** curriculum is not a beginner character-order source.
Fundamental v2.0 explicitly assumes the learner already knows the Morse
characters and can copy/receive around 6 WPM, then concentrates on instant
character recognition, sending, and on-air progression. Earlier Argus wording
that referred to a “CW Academy Fundamental character order” was therefore
incorrect and has been removed.

## Effect on Argus P1

No runtime or sequence change is required.

The shipped pre-#28 Argus order remains:

```text
E I T A N S M U R D W K G H O V F L B P X C Z J Y Q
```

It is still generated from Argus's own complexity + confusable-split rule. The
provenance correction weakens unsupported external attributions; it does not add
new evidence that would make the Argus sequence “official” or “optimal.”

`docs/MORSE_CHARACTER_ORDER.md` now contains the detailed comparison and source
record. `docs/MORSE_PROGRAMME_PLAN.md` uses the same corrected terminology.

## PR #22 — decision and action

**Decision: reconcile in status, then merge.**  
**Action: merged 2026-09-03.**

Why:

- #22 adds the standalone Morse research PRD that the later programme explicitly
  relied on;
- it is additive and docs-only rather than a stale rewrite of current files;
- its validation was green;
- deleting/superseding the research record would make later decisions harder to
  audit.

The PR record now states that the PRD is a **dated research/design baseline**, not
a verbatim current implementation specification. Ratified decisions and merged
workstreams #23–#27 supersede the PRD's deliberately open implementation
questions. The reconciled programme plan records that document hierarchy in the
repository itself.

## PR #20 — decision and action

**Decision: supersede; do not merge.**  
**Action: closed as superseded by PR #36 on 2026-09-03.**

Why:

- #20 was written against pre-Morse baseline `c1cc753…`;
- it explicitly rewrites current truth as **v4**;
- it predates the v5 item-identity/directional/cue-evidence model;
- it omits the temporary Morse seed and the #23–#27 programme state;
- blindly merging it now would make README/PRD/programme/audit documentation
  older than the code it describes.

Useful #20 material is carried forward selectively here: clear Learn/Test
language, finite-boundary terminology, programme closeout structure, and better
README navigation. The stale v4 snapshot itself is not merged.

## Durable-doc reconciliation performed in this lane

- `README.md`
  - points to `PRODUCT.md` as current implemented product contract;
  - labels `argus-prd.md` as the original historical vision where runtime details
    differ;
  - records v5 as the current storage/export boundary;
  - adds the durable Morse research/programme/order/provenance documents.
- `docs/MORSE_CHARACTER_ORDER.md`
  - removes the unsupported fixed-Koch-sequence implication;
  - identifies CW Academy Beginner as the current character-acquisition source;
  - records the verified published letter introduction order;
  - removes the false implication that Fundamental supplies that order;
  - keeps the Argus order explicitly non-official/non-optimal.
- `docs/MORSE_PROGRAMME_PLAN.md`
  - changes the old “current v4” framing into historical pre-v5 context;
  - records #23–#27 as merged and #28 as the untouched next runtime workstream;
  - reconciles P1/P4 provenance language;
  - records the PRD/current-implementation authority hierarchy;
  - preserves the retention-vs-cue separation and #28 handoff boundary.
- `docs/PROGRAMME.md` / `docs/LIBRARY_AUDIT.md`
  - reconciled separately in this branch so the older Learn/Test programme no
    longer reads as unfinished or omits the current temporary Morse seed.

## Sources

### Primary / authoritative

- German National Library record for Koch (1936):
  https://d-nb.info/570787017
- CW Academy Beginner Level CW Curriculum, Release 4.7:
  https://cwops.org/wp-content/uploads/2025/02/Beginner-curriculum.htm
- CW Academy Fundamental Level CW Curriculum, v2.0:
  https://cwops.org/wp-content/uploads/2025/04/CW-Academy-Fundamental-Curriculum-v2.0.htm
- ITU-R M.1677-1:
  https://www.itu.int/rec/R-REC-M.1677-1-200910-I/en

### Secondary historical cross-check

- Long Island CW Club, *The LICW Method Guide* v1.6 (2026):
  https://longislandcwclub.org/wp-content/uploads/2026/04/The-LICW-Method-Guide-Version-1.6.pdf

## Scope boundary

This lane intentionally does **not**:

- modify `src/`;
- alter v5 migration/import/export logic;
- change the seeded Morse topic or any item kind;
- migrate/merge #23 learner state into the final #28 curriculum;
- change cue fading, Test rendering, audio, SVGs, scheduling, or completion;
- pre-implement #28.

The only outcome is a corrected research record and current documentation.
