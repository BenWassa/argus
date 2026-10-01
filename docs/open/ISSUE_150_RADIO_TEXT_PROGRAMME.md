# Issue #150 — Canadian radio procedure and marine VHF text programme

**Status:** implementation ready  
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

## Implementation status — blocked on primary sources (2026-09-30)

**Not started. Blocked, not abandoned.** The item inventory and claims in #139 are exact, but the *wording* of every scored answer has to come from the two controlling publications, and neither could be read in the environment that attempted this:

- ISED RIC-22, General Radio Operating Procedures (`ised-isde.canada.ca`): needed for the 12 Appendix A procedural-word meanings, the §3.1 priority order, the §4.7–4.8 call order and the message-handling sequence;
- Canadian Coast Guard *Radio Aids to Marine Navigation 2026*, Part 4 (`www.canada.ca`): needed for Tables 4-1 and 4-2 and the distress, urgency and safety call/message field orders.

Both hosts were refused by the sandbox egress policy. The fields of a MAYDAY call and the exact order of a marine safety message are high-consequence, source-scoped facts, so they were deliberately **not** written from memory and attributed to RAMN 2026. A scored answer that is slightly off in a published field order would teach a false procedure under an authoritative label.

### To unblock

Either of:

1. allow the agent network policy to reach `ised-isde.canada.ca`, `www.canada.ca` and `laws-lois.justice.gc.ca`; or
2. paste or attach the relevant RIC-22 sections (§3.1, §4.3, §4.7–4.8, §4.13, Appendix A) and RAMN 2026 Part 4 §§4.1.1–4.1.4 with Tables 4-1 and 4-2.

Everything else in this note is ready to implement as written, and the work is a text-only catalog change on existing primitives (no new runtime capability). Note for the implementer: the 13 radiotelephony-number items and 26 phonetic items keep their scored boundary; only provenance and title change.

### Design decisions already settled for when it starts

- Topics A (15 items), B (4) and C (9) use the catalog/`items` model. Long ordered answers (the field-order items) should use the objective choice primitive from #146 or a small ordering interaction rather than reveal and self-score, which cannot judge a long sequence honestly.
- The shared catalog rule that answers be unique applies only to reversible items; choice items may repeat an answer.
