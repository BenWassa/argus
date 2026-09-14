# Seeded content provenance and Test boundaries

Issue: #11; Morse baseline: #23; final A–Z curriculum: #28; acquisition/audio correction: #42  
Research baseline: `f2a3112110356f90f469c8c340f9f0ac69fbb2ee`  
Library format: v5

## Purpose

This document records the research decisions behind the topics shipped by `src/lib/seed.ts`. For every topic, `scope` plus `items` remain the finite scored Test boundary. `topic.learn` is explanatory/acquisition support only and does not expand the completion claim.

## Boundary matrix

| Topic | Final finite Test boundary | Items | Learn treatment |
| --- | --- | ---: | --- |
| NATO phonetic alphabet | 26 letters A–Z → official NATO code word | 26 | Concise support |
| International Morse — Letters (printed) | 26 printed A–Z mappings recalled in both directions | 26 bidirectional logical units | Rhythmic verbal-first progressive packets + secondary SVG + canonical audio |
| OODA loop | Four stages in order + one core function for each | 4 | Briefing + integrated case |
| Primary survey | Five ABCDE headings in order only | 5 | Briefing + integrated bounded case + explicit safety limits |
| Cardinal/intercardinal bearings | Eight named compass points → clockwise degree value from north, with north represented as 0° | 8 | Concise support |

Existing seeded historical attempt totals remain compatible with their decks. #42 adds no durable learner-state field and does not change any scored item.

## NATO phonetic alphabet

### Research decision

NATO’s official reference confirms the 26 standardized code words and the spellings used by the existing deck, including **Alfa** and **Juliett**. The mapping itself remains the material worth recalling, so #11 does not turn it into a briefing.

### Test boundary

**The 26 letters A–Z and their official NATO code words, tested letter → code word.**

All 26 mappings are present as scored items. Context about the purpose/history of the spelling alphabet is Learn-only.

### Learn treatment

Concise support only: one short purpose/spelling note plus provenance. No case study.

### Authoritative source

- NATO, **The NATO phonetic alphabet**: https://www.nato.int/en/about-us/nato-history/history-by-theme/symbols-of-nato/nato-phonetic-alphabet

## International Morse — Letters (printed)

### Research decision

Workstream #28 absorbed the temporary #23 forward-only control in place: the topic id and all 26 deterministic item ids remain stable, while each logical item requires both printed directions. No duplicate or overlapping Morse topic is shipped. ITU-R M.1677-1 Annex 1 supplies the authoritative International Morse A–Z mapping and canonical timing relationships.

#42 corrects the acquisition treatment without touching that content/state boundary. The first memory hook is now an original rhythmic verbal phrase whose short/held beat sequence exactly matches the canonical mapping. The generated SVG remains a secondary timing scaffold, and deterministic Morse audio is available from first exposure. All channels are temporary support and disappear before uncued evidence.

The 26 canonical mappings are:

| Letter | Pattern | Letter | Pattern | Letter | Pattern |
| --- | --- | --- | --- | --- | --- |
| A | `.-` | J | `.---` | S | `...` |
| B | `-...` | K | `-.-` | T | `-` |
| C | `-.-.` | L | `.-..` | U | `..-` |
| D | `-..` | M | `--` | V | `...-` |
| E | `.` | N | `-.` | W | `.--` |
| F | `..-.` | O | `---` | X | `-..-` |
| G | `--.` | P | `.--.` | Y | `-.--` |
| H | `....` | Q | `--.-` | Z | `--..` |
| I | `..` | R | `.-.` |  |  |

### Test boundary

**Can independently recall all A–Z printed Morse mappings in both directions.**

Every A–Z mapping appears once as one bidirectional logical scoring unit—not as 52 duplicated cards. Directional evidence gates a passing retention attempt, so forward-only evidence cannot award completion. Completion does **not** claim auditory reception, sending, WPM, words, phrases, or operating fluency.

### Learn/acquisition treatment after #42

The hierarchy is:

> verbal mnemonic + SVG + canonical pattern + audio  
> → reduced verbal/visual rhythm cue  
> → canonical/audio support  
> → uncued production and printed reverse recall

The verbal A–Z set is documented in `MORSE_VERBAL_MNEMONICS.md`.

- the supplied `A LONG` example is retained;
- the other 25 phrases are original Argus content, not copied from a third-party mnemonic list;
- each phrase has one labelled short/held beat per canonical element;
- tests convert every phrase back to dots/dashes and compare all 26 against the same canonical table used by the scored deck;
- tests also enforce the coda rule that keeps the length contrast unambiguous: a short beat must end in a stop and a held beat in a continuant, with `A` the single documented exemption;
- tests also compare verbal beat units to SVG units and synthesized-audio signal units.

The SVG remains the original generated `argus-morse-rhythm-v1-<GLYPH>` timing grammar from #26. #42 does not repoint those ids to different artwork and therefore requires no learner-state/content migration.

Supported Test may reveal only a strict opening verbal/SVG/canonical prefix. The next rung removes verbal and SVG support and may offer user-triggered canonical audio. Both uncued rungs mechanically receive a cue payload containing only the rung id: no phrase, SVG, audio support, length or answer prefix can leak into the evidence that supports completion.

### Audio provenance and boundary

Audio is synthesized from canonical data; Argus does not ship arbitrary prerecorded clips. ITU timing remains the sole timing authority.

#42 hardens the production mobile path around direct user activation and mobile browser lifecycle handling. The fix resumes and verifies any non-running `AudioContext`, avoids app-driven background `suspend()` races, cancels playback on background/pagehide, recreates closed contexts, shares the oscillator/highlight start delay and raises the deliberate default linear gain from 0.12 to 0.25. Device media volume/routing remain final output controls.

These implementation changes do **not** add auditory evidence to the topic. A printed prompt answered after optional audio support remains acquisition/cue evidence, not proof of sound-only reception.

### Acquisition provenance

- ITU-R M.1677-1 supplies canonical mappings and timing.
- The rhythmic-verbal method reference supplied in #42 is used as a design precedent: https://youtu.be/0CYpik24pRU?si=RX5Bow1eMGFpLdV5
- Only the user-supplied `A LONG` exemplar is retained directly from that request; the remaining Argus phrases are independently authored and mechanically checked.
- Google Creative Lab/Ace Centre/Morse Code Master remain research/product precedents; no per-letter asset or full mnemonic list is silently copied.

Automated checks prove structural agreement, not human-learning effectiveness. #42 cannot close until its exact production build receives the issue's genuine physical-device acceptance, and learner validation should follow before #29 expands the competency claim.

### Authoritative source

- ITU-R, **Recommendation M.1677-1 — International Morse code**: https://www.itu.int/rec/R-REC-M.1677-1-200910-I/en
  - Annex 1 §1.1.1 defines the A–Z letter signals.
  - Annex 1 §§2.1–2.4 define dash = three dots, one-dot intra-character spacing, three-dot inter-character spacing, and seven-dot inter-word spacing.

## OODA loop

### Research decision

The prior four-card deck tested stage names but not the stated “what each one does” boundary. Boyd’s published final OODA sketch also shows why a simple four-arrow circle is insufficient explanatory support: orientation has multiple inputs; decision is a hypothesis; action is a test; and feedback, feed-forward, and implicit guidance/control make the model non-linear and iterative.

The scored boundary therefore remains four items, preserving finishability and historical attempt totals, but each item now requires the stage name **and its core function**. Richer relationships stay in Learn rather than becoming an open-ended Test claim.

### Test boundary

1. **Observe** — notice unfolding circumstances, outside information, and interaction with the environment.
2. **Orient** — interpret observations through analysis/synthesis shaped by experience, culture, heritage, and new information.
3. **Decide** — select a course of action as a hypothesis to test.
4. **Act** — carry out the decision as a test; results feed subsequent observation/orientation.

Stage-number prompts make order explicit, so these four items completely cover the declared boundary.

### Learn treatment

Briefing required. It explains the four functions, relationships, feedback/iteration, implicit guidance, and the limits of the familiar four-arrow mnemonic. One integrated software-service incident traces repeated observation → orientation → hypothesis → test → new evidence across the situation as a whole rather than manufacturing one disconnected example per stage.

### Primary-quality sources

- John R. Boyd, **A Discourse on Winning and Losing**, Air University Press: https://www.airuniversity.af.edu/AUPress/Display/Article/1528758/a-discourse-on-winning-and-losing/
  - The published appendix reproduces Boyd’s final OODA-loop sketch and accompanying explanation of feedback/feed-forward, decision-as-hypothesis, action-as-test, non-linearity, and the shortcomings of the simple circular diagram.
- U.S. Marine Corps Officer Candidates School, **Academic Preparation Guide**: https://www.ocs.marines.mil/Portals/243/Docs/Candidates/Academic%20Prep%20Guide.pdf
  - Used as a current military-training cross-check for the four stage labels/functions and continuous-feedback framing.

## Primary survey

### Research decision

Current Resuscitation Council UK guidance uses a structured ABCDE approach and emphasizes early help, treating life-threatening problems before simply moving on, reassessment, and acting within training. Those principles make the sequence meaningful, but converting detailed clinical actions into scored Argus cards would create a misleading completion claim.

#11 therefore deliberately keeps the finite Test boundary at the five headings **and their order only**. Clinical purpose, priority, reassessment, and the high-level focus of each heading are explanatory Learn support.

### Test boundary

1. **A — Airway**
2. **B — Breathing**
3. **C — Circulation**
4. **D — Disability**
5. **E — Exposure**

The five stage-number/letter prompts cover the boundary completely.

### Learn treatment

Briefing required because an acronym expansion without context is too shallow. Learn covers:

- the sequence as a priority framework rather than a checklist to finish mechanically;
- the high-level assessment focus of A/B/C/D/E;
- treatment/escalation of immediate threats within training before progression;
- reassessment after intervention or change;
- one integrated clinical-deterioration case focused on order and reassessment, with treatment details deliberately omitted.

### Safety boundary

The topic states visibly that Argus is for memory/rehearsal only and is not first-aid or clinical training, a credential, or a substitute for supervised practice and current local protocols. Detailed techniques, thresholds, interventions, medications, population-specific modifications, CPR algorithms, and diagnosis remain outside the scored boundary.

### Authoritative sources

- Resuscitation Council UK, **First Aid Guidelines 2025**: https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/first-aid-guidelines
  - Current official guidance supporting structured ABCDE assessment, early help, and acting within training.
- Resuscitation Council UK, **The ABCDE Approach** (updated July 2024): https://www.resus.org.uk/library/abcde-approach
  - Official reference for the sequence, treatment of life-threatening problems before progression, reassessment, and the meaning of each heading.

## Cardinal and intercardinal bearings

### Research decision

NOAA navigation training material defines degree bearings clockwise from north and gives the eight cardinal/intercardinal values used here: N 0°, NE 45°, E 90°, SE 135°, S 180°, SW 225°, W 270°, NW 315°.

North can also be represented by 360° after a full turn, but testing both 0° and 360° would make the chosen eight-value mapping ambiguous. The topic therefore declares **0°** as its north convention and keeps 360° as Learn-only clarification.

### Test boundary

The eight named compass points mapped to: **0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°**.

All eight mappings are present as scored items.

### Learn treatment

Concise support only: clockwise-from-north convention, 45° spacing, the 0°/360° clarification, and provenance. No case study.

### Authoritative source

- NOAA, **Navigation Training Manual**: https://repository.library.noaa.gov/view/noaa/42218/noaa_42218_DS1.pdf

## Scope-integrity check

- Every topic has an explicit finite scope.
- Every stated scored boundary is completely enumerated by `items`.
- The final Morse topic requires both printed directions and does not count verbal-mnemonic recall, SVG use, timing context, audio exposure/support, sending, speed, words, phrases, or operating fluency toward completion.
- No case-study detail, provenance note, limitation, clinical technique, wider OODA relationship, or contextual explanation is silently counted toward completion.
- NATO, Morse and bearings remain compact despite using provenance/acquisition support.
- OODA and Primary Survey use the richer Learn model because understanding the framework/procedure requires more than mapping labels.
