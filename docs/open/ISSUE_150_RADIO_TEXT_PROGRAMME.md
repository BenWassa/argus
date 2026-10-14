# Issue #150 — Canadian radio procedure and marine VHF text programme

**Status:** shipped — text programme implemented 2026-10-06 (three topics, 28 scored items); audio remains #151.  
**Issue:** #150  
**Research authority:** `docs/open/ISSUE_139_RADIO_COMMUNICATIONS_AUDIO.md`

## Locked service boundary

- ISED RIC-22: general Canadian radio substrate only;
- Canadian Coast Guard RAMN 2026: marine-specific routine, distress, urgency and safety procedure;
- aeronautical, amateur and military/tactical procedure remain separate or excluded.

## Owned implementation

- reconcile existing radiotelephony-number provenance/title without changing its 13-item scored boundary;
- preserve the existing NATO/ITU phonetic completion boundary while improving Learn support where specified;
- add the researched Canadian general radio-procedure topic;
- add marine VHF routine calling;
- add marine VHF priority communications.

Use the exact finite inventories and completion claims from #139. Do not create scenario-based emergency judgement or live-radio claims.

## Relationship to audio

#151 owns prerecorded speech/listening evidence. #150 is the canonical factual/script foundation and can ship independently of audio.

## Implementation record (2026-10-06)

The 2026-09-30 block (the sandbox could not reach the two controlling publications) is cleared: both were read in full on 2026-10-06 and every scored answer was written from them, not from memory.

- ISED RIC-22, Issue 4, January 2008 (page dated 2017-03-23): §3.1, §§4.3–4.14, §§5–7 and Appendix A;
- Canadian Coast Guard, *Radio Aids to Marine Navigation 2026*, Part 4: Tables 4-1 to 4-4, §§4.1.1–4.1.4 and Figure 4-1.

**Code:** `src/domain/radio/radioTopics.ts`; tests in `radioTopics.test.ts` and `e2e/radioProgramme.spec.ts`.

| Topic | Id | Items | Authority |
|---|---|---:|---|
| Radio Procedure | `radio-procedure` | 15 | RIC-22 |
| Marine Calling | `marine-vhf-routine-calling` | 4 | RAMN 2026 §4.1.1 |
| Marine Priority Calls | `marine-vhf-priority-communications` | 9 | RAMN 2026 §§4.1.2–4.1.4, Figure 4-1; RIC-22 §3.1 for priority |

The existing `radiotelephony-numbers` topic keeps its 13 items. Its source is now RIC-22 §4.3 first, with RIC-21 §5.3 retained as a cross-check, and its scope and Learn no longer call the forms aeronautical. The old scope is registered in `PREVIOUS_SHIPPED_SCOPES` so existing libraries receive the new wording. The title stays `Radio Numbers`.

### Decisions taken in implementation

- **Ordered answers are single-answer choices.** Every field-order and call-order item (11 of them) uses the #146 choice primitive. Each wrong option swaps one adjacent pair of the published order, so the elements are identical and a wrong option is wrong only by order. No new ordering interaction was needed. This means the claim is *choosing the correct order from options*, a recognition claim, where #139 §3 words it as *reconstruct*. The scope text says "chosen from options" so the topics do not overclaim.
- **Meaning items for the three signals are choices too**, against the four published meanings (MAYDAY, MAYDAY RELAY, PAN PAN, SÉCURITÉ) printed in RAMN Figure 4-1, wording kept as printed.
- **Two RIC-22 answers are composed, not quoted.** Appendix A prints only "Self-explanatory" for SAY AGAIN, so its answer is composed from §4.13 and the "never REPEAT" rule. READ BACK drops Appendix A's parenthetical from the scored answer; Learn carries it.
- **Marine controls the marine topics.** RIC-22 allows a call sign "not more than three times"; RAMN says "spoken three times". The marine items use RAMN's wording.
- **Distress message follows §4.1.2.3, not the quick card.** RAMN's Figure 4-1 quick-reference card also lists "number of persons on board"; the §4.1.2.3 list does not. The scored order follows §4.1.2.3 and Learn says so.
- **Urgency has a call item but no message item**, because RAMN §4.1.3 publishes an urgency call and no field-ordered urgency message. RIC-22 §6.4 does publish one, but it is an aeronautical-flavoured general order and is outside the marine boundary.
- **Learn-only:** the 12 Appendix A words that are not scored, the RAMN safety-message order, MAYDAY RELAY, and the message-handling examples.

Not changed: the NATO alphabet topic. #139 allowed RIC-22 context in its Learn "if useful"; it was left alone to avoid widening this change.

### Still open

- A domain reviewer's pass over the answer keys. The text was checked against the sources by the implementer only, so a reviewer should confirm the SAY AGAIN composition and the distractor sets.
- The RIC-22 source is old (Issue 4, 2008) and states it has no status in law. The topics say so.

### Design decisions settled before the build

- Topics A (15 items), B (4) and C (9) use the catalog/`items` model. Long ordered answers (the field-order items) should use the objective choice primitive from #146 or a small ordering interaction rather than reveal and self-score, which cannot judge a long sequence honestly.
- The shared catalog rule that answers be unique applies only to reversible items; choice items may repeat an answer.

## Follow-up source audit — 2026-10-14

**Disposition: leave #150 open pending independent marine/radio domain review and validation gates.** This audit uses the current official online ISED RIC-22 and Canadian Coast Guard *Radio Aids to Marine Navigation 2026*, Part 4. It is not an operator or regulator's technical sign-off.

### Source-to-content checks

| Shipped scored inventory | Source | Audit result |
| --- | --- | --- |
| 12 general procedural words | RIC-22 Appendix A; §4.13 for the composed SAY AGAIN meaning | Published meanings and the previously documented SAY AGAIN composition remain the source; the latter is not a direct Appendix A quotation. Independent reviewer should check this pedagogical paraphrase. |
| General single-station, ALL STATIONS and four-part message handling | RIC-22 §§4.8, 4.10 and 4.14 | The 3 scored element orders match the source. RIC-22 says *not more than three times* rather than the marine source's fixed three-times phrasing. |
| Marine specific-station and ALL STATIONS calls, broadcasting, five-part ship message | RAMN 2026 §4.1.1, Tables 4-1 through 4-4 | Four key structures checked against the specified source; programme correctly uses RAMN's spoken-three-times marine instructions. |
| Radio priority, MAYDAY/PAN PAN/SÉCURITÉ meanings and priority call structures | RAMN 2026 §§4.1.2–4.1.4, Figure 4-1; RIC-22 §3.1 | Core field orders agree with the marine source, including conditional MMSI. Distress message follows §4.1.2.3, not the abridged quick-reference card. The safety working-frequency statement remains confined to the published safety call/message structure. |
| Existing 13 radio-number forms | RIC-22 §4.3 number-pronunciation table | Scope and 13-item boundary already preserved by the shipped migration and tests; no new answer changes here. |

**Substantiated copy defect corrected in this branch:** Marine Priority Calls had claimed “A real distress also involves a DSC alert.” That statement overstated DSC as universally necessary despite RAMN §4.1.2.3 conditionally saying *if a DSC distress alert has been sent* for the spoken call and message MMSI elements. The limitation now accurately describes the DSC procedure without presenting it as a prerequisite to every voice distress call. A regression test asserts the limitation and the conditional scored fields.

Primary publications:
- https://ised-isde.canada.ca/site/spectrum-management-telecommunications/en/licences-and-certificates/radiocom-information-circulars-ricpagination-orphans/ric-22/ric-22-general-radio-operating-procedures
- https://www.canada.ca/en/canadian-coast-guard/corporate/publications/radio-aids-marine-navigation/general.html

### Remaining acceptance gates

- [ ] An **independent qualified Canadian marine radio / ROC-M domain reviewer** checks all 28 item-answer pairs, alternative-choice ambiguity, composed SAY AGAIN answer, priority-signal nuance, and written limitations against the editions named above. Record reviewer, date, and any required changes.
- [ ] Review the marine safety-call and urgency-call long distractors for plausible alternative procedural orders that would create more than one defensible answer. Keep source-bound scope, not emergency judgement.
- [ ] Execute `npm run check` and the representative Playwright radio programme spec against this branch and attach actual outcomes; connector-only edits do not constitute a CI run.
- [ ] Verify the preserved radiotelephony-number/NATO boundaries, migration and export/import behaviour with current project CI and targeted tests.
- [ ] Only then evaluate closure of #150; do not treat PR creation or passing self-derived unit tests as independent domain approval.

