# Seeded content provenance and Test boundaries

Issue: #11  
Research baseline: `f2a3112110356f90f469c8c340f9f0ac69fbb2ee`  
Library format: v4

## Purpose

This document records the research decisions behind the four topics shipped by `src/lib/seed.ts`. It is intentionally an #11 content record, not the final #12 programme/documentation reconciliation.

For every topic, `scope` plus `items` remain the finite scored Test boundary. `topic.learn` is explanatory support only and does not expand the completion claim.

## Boundary matrix

| Topic | Final finite Test boundary | Items | Learn treatment |
| --- | --- | ---: | --- |
| NATO phonetic alphabet | 26 letters A–Z → official NATO code word | 26 | Concise support |
| OODA loop | Four stages in order + one core function for each | 4 | Briefing + integrated case |
| Primary survey | Five ABCDE headings in order only | 5 | Briefing + integrated bounded case + explicit safety limits |
| Cardinal/intercardinal bearings | Eight named compass points → clockwise degree value from north, with north represented as 0° | 8 | Concise support |

The seeded historical attempt totals remain compatible with the rewritten decks: no topic changes its scored item count.

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
- No case-study detail, provenance note, limitation, clinical technique, wider OODA relationship, or contextual explanation is silently counted toward completion.
- NATO and bearings remain compact despite using concise provenance support.
- OODA and Primary Survey use the richer v4 Learn model because understanding the framework/procedure requires more than mapping labels.
