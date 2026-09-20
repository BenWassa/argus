# Issue #119 — Morse post-acquisition fluency, haptics and play

**Status:** research/design  
**Issue:** #119  
**Date opened:** 2026-09-19  
**Trigger:** owner completed the full 26-letter A–Z acquisition programme in real phone use  
**Implementation:** explicitly out of scope until this research is ratified

## Executive finding

Argus now needs a distinct **post-acquisition fluency stage**.

The learner has already crossed the boundary the original Morse programme was designed to reach: all 26 letters are familiar, a substantial subset is already fast/automatic, and the remaining problem is no longer encoding the alphabet. The next product job is to make recall:

- faster;
- increasingly sound-first;
- usable in whole words and groups;
- enjoyable enough to invite voluntary repetition;
- physically satisfying on a phone;
- measurable without corrupting formal Test/retention evidence.

This should not be implemented by extending the old #21 umbrella or reopening deferred #29. Those issues mixed several generations of product questions. #119 should produce a new bounded plan and then split implementation into small issues.

The strongest direction is:

> **letters -> automatic characters -> uninterrupted words/groups -> sound-first reception -> short continuous material**

with haptics and responsive game feedback supporting the interaction rather than becoming a new scoring system.

## 1. Current Argus baseline

Current `main` already has most of the low-level infrastructure needed:

- the 13-lesson A–Z acquisition path;
- faithful non-destructive Replay;
- a shared `MorseKeyInput`;
- categorical tap/hold entry;
- canonical generated Morse audio;
- a shared keyed-response lifecycle;
- safe feedback/transition locking;
- four word checkpoints;
- separation between formative Learn state and formal Test evidence.

The key input is therefore already the correct architectural choke point for tactile feedback.

### Missing today

Current code has no shared haptic service and no `navigator.vibrate()` use.

The product also lacks a coherent post-A–Z practice model. Existing word checkpoints remain acquisition milestones, not a persistent game layer, and the current evidence model intentionally does not interpret touchscreen timing as sending competence.

That separation should remain.

## 2. Learning transition: acquisition -> automaticity

### 2.1 2026 observational evidence

Wade, Hamid, Holder and Henderson (2026) analysed a very large public self-directed Morse trainer dataset to study learning speed, engagement and cue effects. Their results are especially relevant because the product question here is what happens after the learner has already progressed through much of the alphabet.

The practical implication for Argus is not that visual cues should disappear everywhere. It is that the relative value of cue channels changes with experience: early visual support is useful, while sound becomes increasingly important as learners progress.

Source:

- Wade et al. (2026), *Morse code learning for assistive technology access*:  
  https://pubmed.ncbi.nlm.nih.gov/42574304/  
  https://doi.org/10.1080/17483107.2026.2715256

### 2.2 Instant character recognition

CW Academy's post-beginner material treats **Instant Character Recognition (ICR)** as a central next-stage skill rather than continuing to teach characters as strings of counted dits and dahs.

Morse Code World's ICR and Adaptive ICR tools follow the same operational pattern: present characters at meaningful internal speed, measure recognition, and concentrate additional work on weaker/slower characters.

Sources:

- CW Academy Fundamental Curriculum v2.0:  
  https://cwops.org/wp-content/uploads/2025/04/CW-Academy-Fundamental-Curriculum-v2.0.htm
- Morse Code World ICR / Adaptive ICR:  
  https://morsecode.world/international/trainer/character.html

**Product implication:** post-acquisition Argus should aim to reduce conscious symbol decomposition. The practice loop should increasingly reward recognising or producing a character as one unit.

### 2.3 Farnsworth timing

ARRL's Farnsworth timing standard preserves normal/high internal character rhythm while widening inter-character and inter-word spacing. The method exists specifically to avoid teaching learners to count stretched elements and then relearn the characters later at real speed.

Source:

- ARRL, *A Standard for Morse Timing Using the Farnsworth Method*:  
  https://www.arrl.org/files/file/Technology/x9004008.pdf

**Product implication:** Sound-first practice should vary **spacing**, not distort the 1:3 internal dit:dah ratio or make individual characters unnaturally slow.

A reasonable future progression is therefore:

- stable character speed;
- generous effective spacing;
- progressively reduced spacing as recognition becomes more automatic.

The exact shipped WPM pair remains a product/test decision for a later implementation issue.

## 3. Whole words must become atomic play units

The current checkpoint architecture correctly prevents retries from interrupting an active word after #115. Post-acquisition play should go further: a word should be treated as the primary interaction unit.

For a prompt such as:

`TRAIN`

the ideal production experience is:

1. the whole word is visible;
2. current character advances in-place;
3. keying continues without a modal "Correct" interruption after every letter;
4. local character state may still update quietly;
5. the meaningful success event occurs at the word boundary.

This changes the learner's mental framing from:

> T done -> R done -> A done ...

toward:

> TRAIN

That matters because post-acquisition practice is trying to build unitization and rhythm, not merely repeat the original letter drill with longer strings.

The same principle should later apply to received groups and short phrases.

## 4. Haptics: a missing first-class interaction channel

### 4.1 Android guidance

Android's current haptics guidance is unusually clear:

- "less is more";
- frequent events should be subtle;
- important events may be stronger;
- haptics should be consistent;
- visual, audio and haptic feedback should be designed together;
- long/buzzy vibration is worse than no haptic feedback for ordinary touch interaction.

Android also describes crisp, discrete "clear haptics" as appropriate for physical-button-like events.

Source:

- Android Developers, *Haptics design principles*, updated 2026-02-26:  
  https://developer.android.com/develop/ui/views/haptics/haptics-principles

**Product implication:** Argus should not vibrate for everything. It needs a small semantic haptic vocabulary.

### 4.2 Web/PWA constraint

The current app is a PWA, so the immediate web primitive is the Vibration API.

MDN currently marks the Vibration API as **Limited availability**. It supports one vibration or alternating vibration/pause patterns through `Navigator.vibrate()`, and unsupported devices simply do nothing.

Source:

- MDN, *Vibration API*:  
  https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API

Important constraints:

- browser support is not universal;
- web vibration is cruder than Android native `HapticFeedbackConstants`;
- the app cannot assume identical actuator quality across devices;
- it needs capability detection and a no-haptics fallback;
- haptics should be user-disableable.

### 4.3 Recommended semantic haptic vocabulary

Research recommendation for later physical tuning:

| Event | Intended feel | Importance |
|---|---|---|
| primary key press | subtle, crisp acknowledgement | very frequent |
| crossing the dit/dah hold threshold | one distinct tick | frequent and informational |
| incorrect response | short reject pattern | occasional |
| correct word/group | clean confirmation pulse | meaningful |
| notable streak / personal best | richer but brief pattern | rare |
| major progression unlock | strongest allowed celebration pattern | very rare |

The exact millisecond patterns should **not** be frozen in this research document. They require Pixel acceptance because Android explicitly warns against poorly tuned buzzy feedback.

### 4.4 Haptic Morse itself

Haptics may also be useful as content rather than only feedback.

Georgia Tech research has explored **Passive Haptic Learning of Morse Code**, transmitting Morse rhythms through tactile taps. A later reevaluation cautions against overclaiming passive-learning effects, so Argus should treat tactile Morse as an experimental practice modality, not as a proven superior teaching method.

Sources:

- Seim et al., *Tactile Taps Teach Rhythmic Text Entry: Passive Haptic Learning of Morse Code*:  
  https://morse.gatech.edu/
- *Reevaluating passive haptic learning of Morse code*:  
  https://dl.acm.org/doi/10.1145/3341163.3347741

**Recommendation:** prototype **Haptic Decode** only after ordinary interaction haptics are stable. Do not make passive haptic learning a core completion claim.

## 5. Gamification: design the activity, not a currency

The older Morse programme deliberately rejected generic badges/gamification because the acquisition problem did not require them. That decision does not mean game feel should remain weak.

The relevant distinction is:

- **game feel / competence feedback** — immediate sensory acknowledgement of meaningful success;
- **extrinsic economy** — coins, generic XP, badges, leaderboards, streak punishment.

Meta-analysis finds gamification can improve learning, motivation and behavioural outcomes on average, but effects depend on design rather than the mere presence of points or badges.

Source:

- Sailer & Homner (2020), *The Gamification of Learning: a Meta-analysis*:  
  https://doi.org/10.1007/s10648-019-09498-w

Research on "juicy" game feedback also suggests that successful, well-coupled action/outcome feedback can support competence and engagement, but simply adding more audiovisual effects is not inherently better.

Source:

- Kao et al. (2024), *How does Juicy Game Feedback Motivate?*:  
  https://people.csail.mit.edu/dkao/pdf/kao2024juice.pdf

### Recommendation

Do not begin with a new XP economy.

Instead build a **reward hierarchy proportional to achievement**:

#### Character correct
Tiny acknowledgement only.

- no blocking celebration;
- optional small haptic;
- minimal visual confirmation.

#### Word/group correct
First clearly satisfying moment.

- whole word resolves;
- small motion/particle/ripple treatment;
- clean haptic;
- score/streak advances.

#### Streak
Rare enough to matter.

- 5 / 10 / 20 clean units;
- small escalation in feedback;
- should not stop the run.

#### Personal best
Large success event.

Examples:

- fastest clean production round;
- longest clean word streak;
- best auditory accuracy at a given spacing;
- first perfect random-group run.

#### Major progression unlock
Largest treatment.

Examples:

- Sound Sprint available;
- first continuous-copy tier;
- tighter Farnsworth spacing unlocked.

The point is not to reward screen taps. It is to make genuine competence perceptible.

## 6. Competitor / trainer patterns worth borrowing

No external trainer should define Argus architecture, but several current products demonstrate useful patterns.

### Morse Mania

Current Google Play listing includes:

- audio, visual and vibration modes;
- receiving and sending tracks;
- challenge levels;
- weak-symbol practice;
- words, callsigns, phrases and sentences;
- adjustable WPM and Farnsworth speed;
- offline use.

Source:

- https://play.google.com/store/apps/details?id=net.countrymania.morse

Useful idea: **modality variety and weak-item practice**.

Do not copy: a 270-level content ladder merely because it exists.

### Morse Code World

Current trainer set includes:

- ICR;
- Adaptive ICR;
- word lists;
- QSO material;
- sending practice;
- vibration output;
- Farnsworth/Wordsworth timing.

Source:

- https://morsecode.world/international/trainer/

Useful idea: clearly separated practice tools for different skill targets.

Argus can be more opinionated and avoid exposing every parameter as a settings panel.

### Google Hello Morse

Google explicitly framed its Morse trainer as an attempt to make Morse learning more fun and sponsored small game experiments using Morse as the input mechanic.

Source:

- https://morse.withgoogle.com/learn/

Useful idea: Morse itself can be the game input, rather than a flashcard answer mechanism.

## 7. Proposed post-acquisition mode family

These are research recommendations, not implementation commitments.

### A. Word Run

**Stimulus:** printed common word  
**Action:** key the complete word continuously  
**Primary skill:** production automaticity + chunking  
**Feedback boundary:** word  
**Formal evidence:** none

Design note: no modal success interruption between letters.

### B. Signal Sprint

**Stimulus:** printed letter  
**Action:** key the pattern quickly and cleanly  
**Primary skill:** instant letter -> pattern production  
**Metric:** correctness + prompt-to-first-input latency, not total raw keying duration  
**Formal evidence:** none

Why first-input latency: four-element letters naturally take longer to physically enter than `E`; total completion time would confound code length with retrieval speed.

### C. Sound Sprint

**Stimulus:** one audio character  
**Action:** type/name the character  
**Primary skill:** auditory ICR  
**Progression:** stable character speed, progressively tighter spacing / larger pools  
**Formal evidence:** none until a separately scoped auditory competency exists

### D. Group Copy / Memory Burst

**Stimulus:** 2–5 character random group, eventually audio-only  
**Action:** reproduce after or during playback  
**Primary skill:** strict recognition without lexical guessing; short working-memory chunks  
**Formal evidence:** none

Random groups are important because real words permit contextual guessing.

### E. Secret Message

**Stimulus:** short phrase/message  
**Action:** decode progressively  
**Primary skill:** enjoyable applied use and sustained attention  
**Formal evidence:** none

This is deliberately entertainment-forward and should remain downstream of character/group competence.

### F. Haptic Decode — experimental

**Stimulus:** vibration Morse  
**Action:** identify character/group  
**Primary skill:** tactile pattern recognition / novelty  
**Formal evidence:** none

This should be optional and capability-dependent.

## 8. Adaptive practice model

A post-acquisition selector can remain deterministic and understandable.

Per character, practice may track:

- rolling accuracy;
- recent misses;
- prompt-to-first-response latency;
- auditory recognition latency where applicable;
- last-practised time;
- number of clean recent encounters.

These statistics can drive **practice priority** without becoming Test evidence.

A simple selector should favour:

1. weak/error-prone items;
2. correct but slow items;
3. items not seen recently;
4. a controlled proportion of strong material to preserve breadth.

Do not create one opaque global "Morse level".

### State boundary

Recommended architecture:

- formal Test evidence remains where it is;
- practice statistics, if persisted, live in a clearly separate formative namespace;
- game scores/PBs never satisfy Test directional evidence;
- Play cannot award retention completion;
- abandoning a game must not corrupt the canonical lesson/Test state.

This is the same separation Argus already handles well for Learn.

## 9. Progression without fake levels

Progression should unlock **new task forms**, not merely larger numbers.

Possible structure:

1. **Letters** — Signal Sprint / Weak Links;
2. **Words** — uninterrupted printed Word Run;
3. **Sound** — Sound Sprint with generous Farnsworth spacing;
4. **Groups** — short random groups;
5. **Continuous** — short copy/head-copy material;
6. **Experimental** — haptic/tactile modes.

Unlock criteria should use practice competence where needed, but must not be marketed as formal Morse certification.

The unlock itself can be one of the rare large celebration events.

## 10. Relationship to formal competencies

The current printed A–Z topic remains exactly what it says it is.

Post-acquisition Play should **not** silently transform it into a broad "knows Morse" claim.

After #119 and initial play implementation, later bounded topics/issues can define separate finite claims such as:

- auditory reception — letters at a stated character/effective speed and accuracy;
- sending — clearly defined touchscreen exercise, explicitly not equivalent to radio-key proficiency;
- numbers/punctuation/prosigns;
- continuous reception at a stated performance boundary.

The old #29 should remain closed rather than becoming another multi-year umbrella.

## 11. Recommended implementation sequence after ratification

### Lane 1 — shared game-feel foundation
- semantic haptic service;
- capability detection and user preference;
- celebration/event vocabulary;
- motion + reduced-motion contract;
- common personal-best event model.

### Lane 2 — post-acquisition Play shell
- one Morse Play entry point;
- practice-only run/session model;
- clean separation from Replay and formal Test;
- practice metrics namespace.

### Lane 3 — Word Run + Signal Sprint
- uninterrupted word interaction;
- prompt-to-first-input timing;
- streak/PB feedback;
- weak-letter weighting.

This should be the first playable batch because it reuses the existing key and directly addresses the owner's current learning stage.

### Lane 4 — Sound Sprint / adaptive ICR
- sound-first stimulus;
- Farnsworth progression;
- auditory latency;
- no visual answer leakage.

### Lane 5 — groups + short continuous material
- random groups;
- memory burst;
- short copy/message activities.

### Lane 6 — tactile experiments
- Haptic Decode;
- optional vibration-mode trials;
- no dependency for core progression.

Each lane should be a separate issue after owner review.

## 12. Decisions still required before implementation

1. Is the learner-facing name **Play**, **Practice**, or another term?
2. Should interaction haptics default on where supported?
3. Does crossing the dit/dah hold threshold receive a tactile tick, or only completed elements/outcomes?
4. Which first two modes ship in V1? Research recommends **Word Run + Signal Sprint**.
5. Should personal bests/streaks persist across sessions?
6. What minimum practice telemetry is worth durable storage?
7. At what point should Sound Sprint unlock?
8. What character/effective speed pair should initial sound-first practice use?
9. Should real words and random groups be mixed inside one mode or remain separate?
10. Which event justifies the largest celebration without making ordinary success noisy?

## 13. Explicit non-goals

#119 does not:

- redesign the printed A–Z Test;
- reopen first-acquisition mnemonics;
- claim that haptics improve learning merely because they feel good;
- claim passive haptic learning is settled science;
- create coins, purchasable items or leaderboards;
- convert a phone key into a certified CW sending test;
- define final auditory/sending competency thresholds;
- implement a general-purpose game engine for all Argus topics;
- merge future work back into #21 or #29.

## Source register

Primary / strong sources:

- Wade et al. (2026), Morse learning dataset:  
  https://pubmed.ncbi.nlm.nih.gov/42574304/  
  https://doi.org/10.1080/17483107.2026.2715256
- ARRL Farnsworth timing standard:  
  https://www.arrl.org/files/file/Technology/x9004008.pdf
- CW Academy Fundamental Curriculum v2.0:  
  https://cwops.org/wp-content/uploads/2025/04/CW-Academy-Fundamental-Curriculum-v2.0.htm
- Android haptics design principles:  
  https://developer.android.com/develop/ui/views/haptics/haptics-principles
- MDN Vibration API:  
  https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API
- Seim et al., passive haptic Morse research and bibliography:  
  https://morse.gatech.edu/
- Reevaluation of passive haptic Morse learning:  
  https://dl.acm.org/doi/10.1145/3341163.3347741
- Sailer & Homner (2020), gamification meta-analysis:  
  https://doi.org/10.1007/s10648-019-09498-w
- Kao et al. (2024), juicy game feedback:  
  https://people.csail.mit.edu/dkao/pdf/kao2024juice.pdf

Product/trainer comparison sources:

- Morse Code World: https://morsecode.world/international/trainer/
- Morse Mania: https://play.google.com/store/apps/details?id=net.countrymania.morse
- Google Hello Morse: https://morse.withgoogle.com/learn/

## Research conclusion

The appropriate next Argus Morse product is not "more alphabet lessons" and not yet a formal advanced CW course.

It is a deliberately bounded **post-acquisition play and automaticity layer** that:

- makes the phone interaction physically satisfying;
- shifts reward from letters to words, streaks and personal improvement;
- introduces sound-first recognition without prematurely awarding an auditory competency;
- measures practice weakness/speed separately from formal evidence;
- gives the learner several short game forms instead of one repetitive Test loop;
- preserves Argus's strongest architectural property: the distinction between practice and proof.
