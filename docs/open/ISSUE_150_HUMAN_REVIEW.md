# #150 — independent radio review pack

**Status:** ready for independent review; no domain acceptance granted.  
**Authority:** review worksheet only. [The maintained #150 contract](ISSUE_150_RADIO_TEXT_PROGRAMME.md) controls scope; the publications below control factual content.  
**Prepared:** 2026-10-15 against repository commit `8d927f322e4ccae58a734531ed4b059f3e2fbb1d`. Recheck the inventory if radio content changes before review.

## Reviewer task

An independent qualified Canadian marine radio / ROC-M reviewer should inspect the 28 scored items, every alternative answer, and the three Learn pages. Record relevant qualification and independence from implementation. This is content acceptance for a published-structure memory aid, not certification or operational approval.

Open Radio Procedure, Marine Calling and Marine Priority Calls in Learn, then inspect their practice/test presentation on a phone. The complete, exact prompt/key/options inventory is in [radioTopics.ts](../../src/domain/radio/radioTopics.ts): `radioProcedureItems`, `marineCallingItems`, `marinePriorityItems`. Stable IDs below identify the review unit; line numbers are intentionally not the identity.

For prowords, `SCORED_PROWORDS` contains the exact prompt/key pairs in item-number order. For sequence items, `elements` is the keyed order and `swaps` generates all wrong options through `sequenceChoice`; inspect the generated choices as rendered, not only the key. For meaning items, inspect all four `SIGNAL_MEANINGS`. The other two multiple-choice items explicitly list all alternatives in code.

Use **P** (pass), **C** (correction required), or **U** (unresolved) in each row. A pass means: prompt has the stated scope, key is supported, no alternative is also defensible within that scope, and presentation preserves meaning. For every C/U, attach item ID, source locator, proposed correction and reason. Blank rows are unreviewed.

## Primary sources

- **R:** [ISED RIC-22, General Radio Operating Procedures](https://ised-isde.canada.ca/site/spectrum-management-telecommunications/en/licences-and-certificates/radiocom-information-circulars-ricpagination-orphans/ric-22/ric-22-general-radio-operating-procedures), Issue 4, January 2008. General substrate only; not the marine procedure authority. Its age and non-law status must remain visible.
- **M:** [Canadian Coast Guard, Radio Aids to Marine Navigation 2026, Part 4](https://www.canada.ca/en/canadian-coast-guard/corporate/publications/radio-aids-marine-navigation/general.html). Marine procedure authority. Both official online publications were accessible during pack preparation; this is source-location verification, not independent human sign-off.

## Item worksheet

Each suffix below is appended to the topic ID followed by `-item-`, for example `radio-procedure-item-01`.

| Topic / suffix | Review unit | Source locator | P/C/U; evidence or correction |
| --- | --- | --- | --- |
| radio-procedure / 01 | ACKNOWLEDGE | R Appendix A | |
| radio-procedure / 02 | AFFIRMATIVE | R Appendix A | |
| radio-procedure / 03 | CORRECTION | R Appendix A; §4.13 context | |
| radio-procedure / 04 | GO AHEAD | R Appendix A | |
| radio-procedure / 05 | NEGATIVE | R Appendix A | |
| radio-procedure / 06 | OUT | R Appendix A | |
| radio-procedure / 07 | OVER | R Appendix A | |
| radio-procedure / 08 | READ BACK; parenthetical retained in Learn | R Appendix A | |
| radio-procedure / 09 | ROGER | R Appendix A | |
| radio-procedure / 10 | SAY AGAIN; composed definition | R §4.13, §4.5; Appendix A | |
| radio-procedure / 11 | STAND BY | R Appendix A | |
| radio-procedure / 12 | WILCO | R Appendix A | |
| radio-procedure / 13 | Specific-station call order; all choices | R §4.8 | |
| radio-procedure / 14 | ALL STATIONS order; all choices | R §4.10 | |
| radio-procedure / 15 | Four-part message handling; all choices | R §4.14 | |
| marine-vhf-routine-calling / 01 | Specific-station initial call; repetitions/options | M §4.1.1.2, Table 4-1 | |
| marine-vhf-routine-calling / 02 | ALL STATIONS initial call; repetitions/options | M §4.1.1.2, Table 4-2 | |
| marine-vhf-routine-calling / 03 | Broadcast instead of invitation to reply; all options | M §4.1.1.2, paragraph after Table 4-2 | |
| marine-vhf-routine-calling / 04 | Five-part ship message; all choices | M §4.1.1.2, list before Table 4-3 | |
| marine-vhf-priority-communications / 01 | Priority order; all choices | R §3.1 | |
| marine-vhf-priority-communications / 02 | MAYDAY meaning; four meanings | M Figure 4-1 text version | |
| marine-vhf-priority-communications / 03 | PAN PAN meaning; four meanings | M Figure 4-1 text version; §4.1.3 | |
| marine-vhf-priority-communications / 04 | SÉCURITÉ meaning; four meanings | M Figure 4-1 text version; §4.1.4 | |
| marine-vhf-priority-communications / 05 | Distress call; conditional MMSI/all choices | M §4.1.2.3 | |
| marine-vhf-priority-communications / 06 | Distress message; conditional MMSI/all choices | M §4.1.2.3, not quick card | |
| marine-vhf-priority-communications / 07 | Urgency call; repetitions/conditional MMSI/all choices | M §4.1.3 | |
| marine-vhf-priority-communications / 08 | Safety call; repetitions/conditional MMSI/all choices | M §4.1.4 | |
| marine-vhf-priority-communications / 09 | Safety message working frequency; all options | M §4.1.4 | |

## Decisions requiring explicit reviewer disposition

- [ ] Is the composed SAY AGAIN key faithful and sufficiently clear? Appendix A itself does not supply the full scored definition. Does READ BACK remain accurate with its parenthetical in Learn rather than the key?
- [ ] Do the general/marine boundaries prevent transfer of conflicting instructions? In particular, R permits up to three repetitions while M specifies three; general broadcast ending and marine broadcast invitation handling must remain distinct.
- [ ] Is the priority-signal meaning set unambiguous, including the unscored MAYDAY RELAY meaning used as a distractor? Do not infer operational scenario judgement from definition recognition.
- [ ] Are all urgency/safety/distress sequence distractors uniquely wrong for the named publication, even where other real-world procedures exist? Check long choices on a phone without truncation.
- [ ] Is following M §4.1.2.3 for distress message order acceptable despite the quick card's additional persons-on-board field? Learn discloses the distinction; it must not imply persons on board are unimportant.
- [ ] Are the DSC limitation and conditional MMSI fields accurate and sufficient? Do not interpret conditional fields as teaching the complete DSC/voice workflow.
- [ ] Are Learn-only prowords, examples, frequency statements, safety-message order and limitations accurate within their source boundary? No urgency-message order or operational certification is claimed.

## Preserved boundaries and separate gates

The existing Radio Numbers inventory has 13 forms; NATO phonetic scoring is unchanged. Inspect [catalogSeed.ts](../../src/domain/library/catalogSeed.ts), topics `radiotelephony-numbers` and `nato-phonetic`, if reviewing their presentation/provenance. These are regression checks, not 28 additional #150 items. R §4.3 contains the number-pronunciation list after its alphabet table; §4.4 covers transmitting numbers.

Engineering must record the reviewed commit and actual `npm run check` outcome, including [radioProgramme.spec.ts](../../e2e/radioProgramme.spec.ts), and preserved library migration/export-import results. Automated tests cannot grant domain acceptance. No tests were run solely to prepare this document.

Lights, day shapes and flags have their own [#147/#148 review record](ISSUE_147_148_MARITIME_DOMAIN_REVIEW.md). Radio acceptance neither approves those assets nor clears Mariner availability. A reviewer qualified for both may work in one session but must record separate dispositions in the owning records.

## Sign-off record

- Reviewer / relevant qualification: **pending**
- Independence from implementation: **pending**
- Review date and exact commit: **pending**
- Source editions / retrieved copy identifiers: **pending**
- 28 item dispositions complete, Learn reviewed, all C/U issues resolved: **pending**
- Corrections / follow-up issue links and retest evidence: **pending**
- Engineering verification record: **pending**
- Decision (accept / changes required / unresolved), scope and signature: **pending**

Keep #150 open until independent review and its existing validation gates are actually satisfied. Completion of this worksheet must be recorded, not assumed from preparation of the pack.
