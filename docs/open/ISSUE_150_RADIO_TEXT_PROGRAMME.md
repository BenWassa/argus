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
