# Maritime #147/#148 — outstanding domain-review evidence and disposition

**Review date:** 2026-10-14. **Status:** source-based follow-up only; **independent maritime domain acceptance NOT granted**. Supersedes neither the #138 scope nor the already-recorded [NGA rendered comparison](ISSUE_148_PUB102_COMPARISON.md) from PR #204. No scored content, diagram geometry, manifest acceptance, or release gate changed in this review.

## Source hierarchy and evidence

1. [Canadian Collision Regulations, C.R.C., c. 1416, Schedule 1](https://laws-lois.justice.gc.ca/eng/regulations/C.R.C.,_c._1416/FullText.html), government consolidation current to **2026-09-21**, last amended **2023-06-07**: controlling Canadian rules for vessel lights and shapes, especially Rules 21, 23, 25–27, 30 and Annex I.
2. [IMO International Code of Signals, official publication page](https://imo-epublications.org/content/books/9789280117387), 2005 edition / fifth edition 2021, electronic publication February 2022. IMO explicitly states that 2005 and fifth editions remain equally valid because the newer edition makes editorial improvements rather than substantive amendments. The official full design plate was **not available for authenticated visual verification** in this review. Do not infer precise drawing ratios from its catalog listing.
3. [IMO March 2022 errata](https://wwwcdn.imo.org/localresources/en/publications/Documents/Supplements/English/IB994E_errata_February2022_PQ.pdf): inspected publicly available errata; listed changes do not revise the selected twelve single-letter signals.
4. [NGA Pub. 102, revised 2020](https://msi.nga.mil/api/publications/download?key=16694273%2FSFH00000%2FPub102bk.pdf): official flag plate and printed p. 21 already visually inspected, hash and 12-flag comparisons recorded in [PR #204's report](ISSUE_148_PUB102_COMPARISON.md). **Do not count this follow-up as a second independent review.** This session's web retrieval of the publisher PDF returned an error, so original visual evidence is attributed to #204 rather than claimed to have been re-inspected.

## #147 — code-to-regulation review observations

| Signal or teaching choice | Primary-source finding | Disposition |
| --- | --- | --- |
| Rule 21 sectors | Masthead 225°, each sidelight 112.5°, sternlight 135°, all-round 360°; code's single visibility model and its inclusive mathematical edges are a deterministic teaching abstraction. Annex I §9 describes real intensity decay and practical cut-off around sector limits. | No identified numerical discrepancy. Keep boundary unit tests; reviewer must distinguish ideal sector geometry from real optical cut-off. |
| Power-driven under 50 m | Rule 23 reference arrangement is a legitimate selected example; smaller-vessel alternatives and exemptions mean missing lights cannot prove a negative vessel state. | Keep selected-state framing and Learn exceptions; independently verify each of the 8 state cues. |
| Sailing, trawling and other fishing | Rule 25 provides sailing alternatives; Rule 26 distinguishes green-over-white trawling from red-over-white other fishing; the two cones apexes together identify fishing without differentiating those methods. | No correction to scored identities proposed. Review alongside exceptions, gear signals and underway additions. |
| Not under command / restricted manoeuvrability | Rule 27 uses two red lights/two balls for NUC and red-white-red/ball-diamond-ball for RAM, with underway and small-vessel qualifications. | No identified discrepancy in selected stacks; domain confirmation remains pending. |
| At anchor | Rule 30(b) allows a vessel below 50 m to use one all-round white light; Rule 30(a) gives the usual fore-and-aft arrangement. | Single-white selected reference remains safe with length qualification. |
| Aground | Rule 30(d) adds two vertically aligned red lights **where best seen** to the Rule 30(a)/(b) anchor lights, plus three balls; it **does not** require a common white-red-red vertical stack. It exempts vessels below 12 m from those extra red lights/shapes under Rule 30(f). | **Presentation caveat remains important.** Existing white/red/red artwork is schematic, not a mandated combined installation. Domain reviewer must decide whether a separated-light depiction is needed before release; do not silently treat layout as a required configuration. |
| Day-shape geometry | Annex I §6 gives minimum shape dimensions and special allowances; stylized spacing is not a normative dimension. | Confirm all five illustrations and accessibility text; no unsubstantiated geometry changes. |

**Answer-key verification gate:** reviewer with maritime lights/shapes expertise must inspect all eight aspect keys, eight status light keys and five day-shape keys against the relevant rules and the rendered phone stimuli, recording name, date, edition/consolidation and per-item dispositions. Engineering source checks and automated tests do not satisfy this gate.

## #148 — flag discrepancy ledger (continuation of PR #204)

All **12** selected letters A/B/D/F/J/L/M/O/U/V/W/Y have matching identifying colour placement and practical meanings in the recorded NGA comparison. Previously corrected **O** colour orientation and **W** nested-colour order remain retained; **J** meaning retains *dangerous cargo* in its fire branch. The following are **not** proven errors: illustrated vs app proportions for A white-hoist split/notch, B notch, D blue-band width, J centre band, M/V saltire width, W centre rectangle, and Y count/spacing. F diamond, L/U quadrants and O diagonal identify correctly in the previously inspected plate.

**Disposition:** do not change ratios or re-pin `designSha256` on the strength of undimensioned NGA artwork. A production correction requires a traceable normative IMO construction specification or an approved documented editorial decision after comparison with authoritative IMO depictions, followed by visual QA, hash update and unit/browser checks.

**Still required:**
- Obtain or inspect the **current IMO full-colour flag plate** and distinguish normative requirements from non-dimensioned illustration choices; settle every proportional discrepancy explicitly.
- Conduct separate domain-informed visual review of each flag and its scored wording; record reviewer, date, editions and accepted discrepancies before setting **any** `flagManifest.review` field. Leave all `review: null` meanwhile.
- Retain all twelve selected signals, their stable item IDs and provenance; do not claim that a selected subset is an official sub-code.
- Keep **Mariner role availability/acceptance blocked** pending both #147 and #148 independent gates. Ship history is not acceptance.

## Changes authorized by this pass

Documentation correction only: recognize the completed 2026-10-13 NGA evidence rather than referring to the comparison as still undone; clarify that the **current IMO design/proportion disposition** and **independent reviews** remain outstanding. No evidence justifies changing a scored key, vessel configuration, flag primitive or production release status here.

## Reviewer completion record (leave blank until performed)

| Gate | Independent reviewer / qualification | Date | Edition and pages | Item-by-item disposition | Status |
| --- | --- | --- | --- | --- | --- |
| #147 16 light keys + 5 shape keys | — | — | — | — | **Open** |
| #148 12 flag designs + meanings | — | — | — | — | **Open** |
