# Argus library audit

Issue: #8  
Original audit baseline: `7498c55494d5b75fdb99c3316b461a2a5e6eef01`  
Original researched-content baseline: `c1cc753eb89c9aa5379d1a885892703cf20e65ba`  
Current reconciliation: post-#28 v5/Morse programme

## Scope

The original #8 audit covered the four topics then shipped in `src/lib/seed.ts`
and drove #9/#11. This reconciled record also covers the International Morse
topic — seeded as a temporary forward-only control by #23 and absorbed in place
into the final bidirectional A–Z curriculum by #28 — so the document does not
imply the current seed still contains only four topics.

Argus also stores user-authored topics locally; repository seed content is not a
claim about the complete contents of any one device library.

## Content rubric

For every topic, check:

1. content archetype;
2. explicit finite Test/completion boundary;
3. whether scored items completely cover that boundary;
4. appropriate Learn treatment;
5. conceptual/context gaps;
6. whether an integrated case study is useful;
7. provenance requirements;
8. safety/limitations requirements;
9. whether explanatory support remains outside the scored boundary.

`scope` + scored `items` define the finite claim. `topic.learn` is structurally
separate explanatory/acquisition support and never expands that claim merely by
existing.

## Current seeded-library matrix

| Topic | Archetype | Finite Test boundary | Coverage | Learn treatment |
|---|---|---|---|---|
| NATO phonetic alphabet | Mapping/reference | 26 letters A–Z → official NATO code word | Complete | Concise support |
| International Morse — Letters (printed) | Mapping/reference + progressive acquisition | 26 printed A–Z mappings recalled in **both** printed directions | Complete | Concise support + Morse packets |
| OODA loop | Framework/model | Four stages in order + one core function for each | Complete | Briefing + integrated case |
| Primary survey | Procedure/protocol | Five ABCDE headings in order only | Complete | Briefing + bounded case + safety limits |
| Cardinal/intercardinal bearings | Mapping/reference | Eight compass points → clockwise degree values from north; north = 0° | Complete | Concise support |

The original four topics retain their 26 / 4 / 5 / 8 scored-unit counts. The
Morse topic adds 26 bidirectional logical scoring units — one per letter, not 52
duplicated cards. Current v5 storage normalizes item identity/kind and
acquisition evidence without changing those finite scored counts.

## NATO phonetic alphabet

The mapping itself is the finite competency. #11 verified the official 26 NATO
code words, including **Alfa** and **Juliett**, against NATO's official reference.

The topic therefore remains compact: 26 letter-first scored mappings plus concise
context/provenance. A briefing or case study would add friction without improving
the finite mapping claim.

## International Morse — Letters (printed)

This topic was added by #23 as an intentionally narrow forward-only
control/baseline. #26 added progressive Learn packets and #27 added the
progressive Test ladder without changing that scored claim. #28 then absorbed the
control topic in place — same topic id, same 26 item ids — and typed every item
`bidirectional`, so the shipped library carries exactly one Morse completion
claim rather than two overlapping ones.

Current scope:

> Can independently recall all A–Z printed Morse mappings in both directions.

That scope is completely covered by 26 bidirectional logical items. Directional
coverage gates a passing retention attempt, so forward-only evidence cannot award
completion.

Boundary discipline that still holds:

- audio in Learn/feedback does **not** prove auditory reception;
- mnemonic/timing graphics are acquisition support, not completion evidence;
- the free-reception rung is live for this topic, because its items now declare
  the reverse direction; it stays dormant for any `forward` topic;
- the claim is printed recall in both directions only. It does not assert
  auditory reception, sending, WPM, words, phrases, operating fluency, or
  “knowing Morse.” Those remain #29's scope.

Canonical mapping/timing provenance is ITU-R M.1677-1. Character-order/training
provenance is recorded in `docs/MORSE_CHARACTER_ORDER.md` and
`docs/MORSE_PROVENANCE_RECONCILIATION.md`.

## OODA loop

The original audit found a scope/deck mismatch: the scope claimed the four stages
**and what each one does**, while the old deck tested stage names only.

#11 resolved that mismatch without opening the boundary. Each of the four scored
items now requires the ordered stage name plus its core function: Observe,
Orient, Decide, Act. The item count remains four.

A briefing explains Boyd's feedback-rich model, orientation inputs,
decision-as-hypothesis, action-as-test, feedback/feed-forward and the limitations
of the familiar simple four-arrow circle. One integrated case exercises the
framework as a connected adaptive process.

## Primary survey

#11 made the finite boundary deliberate: Test covers **the five ABCDE headings and
their order only** — Airway, Breathing, Circulation, Disability, Exposure.
Detailed clinical techniques, thresholds, interventions, medications,
population-specific modifications, CPR algorithms and diagnosis stay outside the
scored claim.

The briefing supplies high-level context, priority/reassessment principles and a
bounded case without turning the completion claim into clinical competence.
Because this is medical/emergency material, authoritative sources and visible
limitations are mandatory. Argus remains memory/rehearsal support, not clinical
training or a credential.

## Cardinal and intercardinal bearings

The eight direction-to-degree mappings form a complete finite set. #11 verified
the clockwise-from-north convention against NOAA material and made the chosen
north representation explicit: **0°**. The equivalent 360° direction remains a
Learn-only clarification so the scored mapping is unambiguous.

The topic therefore stays compact with no case study.

## Cross-library conclusions

### Learn treatment must remain proportional

Reference-only remains available; concise support fits mapping/reference topics;
briefing support fits frameworks/procedures where relationships or safety context
matter. Morse demonstrates that a compact mapping topic can also have a
specialized acquisition surface without turning that surface into new scored
content.

### Boundary integrity is a correctness property

A topic may only claim completion for material fully represented by its finite
scored items. Rich Learn content, audio exposure, cue fading, or a more advanced
runtime response mechanic does not repair an under-covered Test boundary and does
not independently widen the claim.

### Acquisition evidence is not retention evidence

v5 adds per-item cue/evidence state for Morse, but that state is a sibling of
scheduler `history`, not a replacement for it. A learner may climb to uncued
production without having satisfied the delayed evidence required for durable
completion.

### Safety-sensitive topics require provenance and limitations

Primary Survey remains the clearest example: sources and limitations are
first-class content requirements, not generic README disclaimers.

## Source records

- `docs/SEEDED_CONTENT_PROVENANCE.md` — original four-topic research/source record.
- `docs/MORSE_CHARACTER_ORDER.md` — Morse order rule + corrected Koch/CW Academy
  comparison.
- `docs/MORSE_PROVENANCE_RECONCILIATION.md` — pre-#28 provenance/docs closeout.
- `docs/MORSE_PROGRAMME_PLAN.md` — v5 Morse decisions and implementation status.
