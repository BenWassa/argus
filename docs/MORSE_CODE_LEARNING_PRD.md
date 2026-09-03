# Morse code progressive learning — research and product requirements

**Status:** Proposed design/research baseline  
**Issue:** #21  
**Repository baseline:** `c1cc753eb89c9aa5379d1a885892703cf20e65ba`  
**Date:** 2026-09-03  
**Product model:** Learn + Test only

## 1. Executive decision

Argus should add International Morse code, but not as a conventional 26-card deck whose completion vaguely means “knows Morse.” Morse exposes a useful new content class: a finite symbol system in which the learner should encounter **different representations as proficiency develops**.

The target learning progression is:

> **encode → assisted retrieval → prompt-first multiple choice → diminishing/adaptive cues → uncued production → auditory recognition → confusable-item discrimination → groups → words/phrases**

The first implementation should preserve Argus’s strongest invariant: every completion claim is explicit, finite and completely testable.

The recommended first shipped boundary is:

> **International Morse — Letters:** independently map all 26 letters A–Z to their canonical International Morse code patterns and map those 26 printed patterns back to their letters, without mnemonic artwork or other answer-bearing cues.

This first completion claim **does not mean** that the learner can receive continuous Morse by ear, send well-timed Morse, copy words at a stated speed, use numerals/punctuation/prosigns, or operate CW on air. Those are distinct finite skills and should be represented by later topics only when their own completion criteria are explicit.

The core product hypothesis is that a purpose-designed visual mnemonic layer can make the first mappings easier to encode, while correct Morse audio is introduced from the first encounter. The visual layer is temporary scaffolding: it should fade as recall strengthens and should never become the learner’s required decoding algorithm.

This document records the research basis, product decisions, unresolved questions and architecture implications. It is not authorization for one large implementation PR. #21 should be decomposed into focused implementation issues after the design decisions below are accepted.

---

## 2. Why Morse belongs in Argus

Morse has unusually good structural fit with Argus:

- **Finite authoritative content.** International Morse mappings and timing are standardized by ITU-R M.1677-1.
- **Clear subskills.** Printed mapping recall, auditory reception, sending and continuous-message fluency can be distinguished rather than conflated.
- **Complete testability.** A–Z, 0–9 and other enumerated symbol sets can each have explicit coverage.
- **Strong retrieval component.** The learner must ultimately produce or identify mappings without answer-bearing cues.
- **Natural progression.** Isolated symbols can progress into groups, words and phrases.
- **Multimodal learning.** The same underlying code has visual, auditory and motor representations.
- **Useful architecture pressure.** Morse forces Argus to solve progressive cueing, non-MC answers, deterministic audio and representation changes without weakening the finite Test boundary.

The original Argus PRD already named Morse code as a candidate recall topic. The research now indicates that treating it as plain flashcards would leave substantial learning value on the table.

---

## 3. The central distinction: mapping knowledge is not Morse fluency

“Morse code” can refer to several different competencies. Product copy, topic scopes and completion states must not collapse them.

| Skill | Example stimulus | Expected response | What it proves |
|---|---|---|---|
| Printed mapping recognition | `.-` | `A` | Visual pattern → letter mapping |
| Printed mapping production | `A` | `.-` | Letter → visual pattern mapping |
| Auditory character reception | `dit-dah` | `A` | Whole sound-pattern → letter |
| Timed sending | `A` | correctly timed `dit-dah` | Productive motor/timing skill |
| Group reception | audio stream | copied group | Serial character reception |
| Word/phrase reception | audio stream | word/meaning | Chunked continuous reception |

The visual letter-mapping topic is therefore useful but deliberately modest. It establishes the symbol system. It is not a proxy for auditory CW competence.

This distinction also protects Argus’s completion semantics. Rich Learn support may prepare the learner for later abilities, but the current topic’s `scope + scored items/criteria` remain the complete claim.

---

## 4. Evidence model

Not all sources answer the same question. Product decisions should distinguish five evidence classes.

### A. Standards / primary authority

Used for canonical content and timing.

- **ITU-R M.1677-1, International Morse code.** Current in-force ITU recommendation for mappings and timing.

### B. Direct Morse-learning experiments

Used for claims about acquisition, whole-pattern recognition, stimulus similarity and modality.

- Allan (1958), whole-pattern recognition.
- Rothkopf (1958), similarity and presentation sequence.
- Jarus (1994), visual/auditory/combined learning.
- Clawson et al. (2001), part-whole training and unitization.
- Spragg (1943), character difficulty/confusions.

These studies are directly relevant but differ in age, task, sample and outcome. None should be treated as a complete modern curriculum specification.

### C. Large contemporary observational evidence

- Wade, Hamid, Holder & Henderson (2026), based on 699,562 telemetry records from 34,641 anonymous Morse learners over five years.

This is highly relevant to cueing at scale but is observational rather than randomized. Associations should not be rewritten as causal proof.

### D. General learning-science evidence

Used for retrieval, spacing and cue-fading mechanisms rather than Morse-specific timing or symbol order.

- Fiechter & Benjamin on diminishing/adaptive retrieval cues.
- van den Broek et al. on prompt-first/delayed-answer multiple choice.
- Carpenter, Pan & Butler on spacing and retrieval practice.

### E. Operational and contemporary trainer practice

Used as design precedent and ecological evidence, not as controlled proof of optimality.

- ARRL learning guidance.
- CW Academy Fundamental curriculum.
- Google Creative Lab Morse Typing Trainer.
- Ace Centre Morse Learn.
- Morse Code World.
- Morse Code Master.

When a trainer uses a particular character speed, order or threshold, Argus may study the pattern without calling it scientifically optimal unless the underlying evidence supports that claim.

---

## 5. Research findings and product implications

### 5.1 Visual cues appear especially useful early, while sound becomes more important later

Wade et al. (2026) analysed 699,562 telemetry records from 34,641 anonymous users of a Morse-learning system over five years. Their abstract reports 90.3% final accuracy for learners using visual cueing versus 82.2% without visual cueing, with Cohen’s `d = 0.79`, and progression rates of 51.6% versus 39.3%. The modeled advantage of visual cueing was strongest early and diminished across the teaching sequence, while the association with sound cueing increased; their model crossed around teaching position 13.

The strongest safe product interpretation is not “pictures cause Morse mastery.” The study is observational; cue choice, prior skill and learner behavior may confound outcomes. The stronger design inference is:

- visual scaffolding is credible for early acquisition;
- auditory exposure should not be postponed until the visual alphabet is complete;
- the relative instructional weight can move from visual toward auditory as mappings stabilize;
- cue configuration/fading should be adaptable rather than permanently fixed.

**Argus decision:** expose correct Morse sound from the first encounter. Use rich visual support early, then remove answer-bearing visual support as retrieval succeeds.

### 5.2 Combined visual and auditory learning has direct experimental precedent

Jarus (1994) randomly assigned 60 adults with no prior Morse knowledge to visual, auditory or combined teaching conditions. The combined condition was faster than the visual condition and produced fewer errors than the auditory condition on the study’s encoding task.

The study was short, used a handwriting-oriented outcome and predates modern digital trainers. It does not prove that a particular Argus SVG treatment is optimal. It does support avoiding an artificial visual-first/auditory-later split.

**Argus decision:** use sound alongside visual encoding from the beginning.

### 5.3 Fluent reception should unitize a character rather than analytically count its elements

Allan’s 1958 work compared a pattern-recognition method with more analytic Morse learning and provides historical evidence for learning whole sound patterns. Clawson, Healy, Ericsson & Bourne (2001) found disadvantages from beginning with a hard subset/subtask and reported that easier initial training encouraged an effective **unitization strategy** for representing Morse codes.

This matters for the SVG system. A mnemonic should help the learner associate a letter with one temporal pattern; it should not teach a permanent algorithm such as:

> first inspect dot → then inspect dash → traverse a tree → derive the letter.

**Argus decision:** optimize early materials for direct character ↔ pattern association. A classic Morse binary tree may exist as an optional reference, but it should not be the primary acquisition mechanism.

### 5.4 Similar characters should be handled differently during acquisition and discrimination

Spragg (1943) found systematic differences in Morse character difficulty and reported strong confusions among characters identical except for the final element. Rothkopf (1958), using aural Morse stimuli, found that maximizing separation of similar stimuli in the initial presentation sequence facilitated acquisition.

This suggests a two-stage strategy:

- **Initial acquisition:** avoid loading a beginner packet with highly confusable sound patterns merely to make the task “harder.”
- **Later discrimination:** once mappings exist, deliberately contrast/interleave confusable pairs or families to eliminate systematic errors.

**Argus decision:** do not generate MC distractors randomly forever. Store or derive confusion relationships and use them deliberately at the appropriate stage.

### 5.5 Diminishing cues are a defensible bridge from exposure to retrieval

Fiechter & Benjamin found that diminishing-cue retrieval practice can improve later memory under conditions where ordinary retrieval is initially too difficult, and later work found value in adaptive cueing when a fixed fading schedule is too blunt.

This closely matches the intended Argus transition:

1. rich mnemonic;
2. reduced mnemonic;
3. prompt first, answer options later;
4. uncued production;
5. for reception topics, audio-only stimulus.

**Argus decision:** represent cue strength separately from the long-term retention scheduler. The two systems solve different problems.

### 5.6 Multiple choice can be made more retrieval-like before it disappears

Van den Broek et al. (2023) tested a “stepwise” multiple-choice format in which the question was shown before the answer alternatives. In their experiments, delaying alternatives improved delayed retention in three of four experiments, consistent with giving learners an opportunity to retrieve before recognition support appears.

This does not establish a universal Morse-specific four-second delay. It supports the interaction pattern.

**Argus decision:** supported Test can progress from immediate options to **prompt-first options** before free response. The exact delay should be tuned for mobile usability and validated rather than copied blindly.

### 5.7 Spacing and retrieval remain orthogonal to cue difficulty

The broader retrieval-practice literature supports repeated retrieval separated over time. Argus already has a retention ladder and explicit early-Test semantics: an early Test may produce evidence without counterfeit delayed retention.

A learner can therefore be capable of uncued Morse recall today while still lacking the delayed evidence required for durable completion.

**Argus decision:** do not turn “cue level” into another name for `learning / drilled / completed / decayed`. Cue difficulty and retention evidence are separate dimensions.

---

## 6. First shipped topic boundary

### 6.1 Recommended topic

**Title:** International Morse — Letters

**Scope definition:**

> The 26 International Morse mappings for A–Z, recalled uncued in both directions: letter → canonical dit/dah pattern and printed canonical pattern → letter.

**Completion does cover:**

- all 26 letters;
- all 26 canonical mappings;
- both stated visual mapping directions;
- full item coverage rather than a sampled subset.

**Completion does not cover:**

- numbers;
- punctuation or prosigns;
- auditory reception;
- stated-WPM continuous copying;
- sending rhythm/timing;
- words, phrases or QSOs;
- amateur-radio operating conventions.

### 6.2 Scored coverage

The Test contract must make complete coverage mechanically obvious. Two implementation approaches remain open:

1. represent 52 deterministic scored prompts, one for each direction; or
2. add a typed bidirectional item mechanic whose coverage accounting proves both directions for all 26 mappings.

Either is acceptable only if the scheduler and completion evidence cannot accidentally treat partial directional coverage as complete.

### 6.3 Audio in this topic

Correct Morse audio should accompany Learn from the first exposure and may be used in feedback. It does **not** become part of this first topic’s scored completion claim unless the scope is explicitly changed.

This is intentional. Early audio exposure helps build the right representation without overstating what a visual mapping Test proves.

---

## 7. Progressive acquisition model

The following is the working design ladder. It describes cueing and response mechanics, not the retention ladder.

### Stage A — Encode

For a small packet of characters, Learn shows:

- a large uppercase glyph;
- a purpose-designed SVG mnemonic integrated with the glyph;
- canonical Morse beneath it;
- a replayable correct Morse sound;
- optional transmission-order animation;
- concise plain-text equivalent for accessibility.

The learner can move rapidly among the packet rather than reading a long article.

This stage is exposure, not evidence of mastery.

### Stage B — Assisted recognition

Begin with high-success retrieval:

- printed Morse → letter MC;
- letter → Morse MC;
- immediate corrective feedback;
- rich cue may reappear after an error.

This should feel like guided acquisition rather than a high-stakes quiz.

### Stage C — Prompt-first MC

The prompt appears alone briefly. Options then become available if the learner has not already answered through an available free-response path.

The purpose is to create a retrieval opportunity before recognition support arrives.

### Stage D — Reduced visual cue

The integrated illustration disappears or becomes substantially subtler. Canonical notation and sound remain available as appropriate to Learn/feedback, but answer-bearing cueing is no longer the default Test surface.

### Stage E — Uncued visual production

The learner receives `A` and enters `.-`, or receives `.-` and enters `A`, with no mnemonic artwork.

For letter → code on touch devices, two large tactile controls for dit and dah are a strong candidate. Keyboard input must remain efficient.

This stage is the basis of the first topic’s final scored boundary.

### Stage F — Auditory character reception

This is best treated as a separate explicit skill claim. The learner hears a properly timed character and responds with the letter; the printed code appears after the response as feedback, not as a simultaneous decoding aid.

### Stage G — Contrastive discrimination

The system intentionally targets confusable characters based on known similarity structure and the learner’s own error history.

### Stage H — Groups

Progress from 2-character to longer groups, ultimately including conventional 5-character practice groups where useful. Group material is generated from known symbols; it should not silently add new scored content to the alphabet topic.

### Stage I — Words and phrases

Use common short words and then short phrases/continuous material. At this point the system is training serial reception/chunking rather than merely a lookup table.

These later stages require their own explicit performance criteria before Argus can call them completed topics.

---

## 8. The visual mnemonic system

### 8.1 Product goal

The mnemonic should create a fast direct association between the uppercase letter and the temporal Morse pattern. It should be memorable enough to bootstrap retrieval and disposable enough to disappear later.

### 8.2 Proposed visual grammar

Prefer an original Argus SVG system with consistent rules across all 26 letters:

- **dit:** always represented by the same small/circular visual event;
- **dah:** always represented by the same elongated visual event;
- **order:** the trace/path follows transmission order;
- **glyph:** the uppercase letter remains visually dominant and recognizable;
- **canonical notation:** plain `·` / `—` or `.` / `-` appears beneath the mnemonic;
- **sound synchronization:** optional animation can illuminate/trace each element in sync with audio;
- **reduced motion:** removes movement without removing sequence information;
- **contrast:** mnemonic elements remain legible at small phone sizes and high text scaling.

A useful progression is:

> full integrated mnemonic → reduced trace → canonical code only → prompt only

For later reception topics the stimulus can become sound only.

### 8.3 Verbal/syllabic mnemonics

Resources such as Morse Code Master use spoken-word mnemonics in which syllable length cues dit/dah structure. These can be memorable, but they introduce another possible translation layer:

> `A` → mnemonic word → short/long syllables → Morse

There is not yet evidence establishing that the proposed SVG approach is superior to a verbal mnemonic approach.

**Decision:** verbal mnemonics may be considered as optional rescue cues, not the default representation in the first design.

### 8.4 Morse trees

Binary dot/dash trees are useful references but encourage sequential traversal. They should not be the primary Learn mechanic when the intended endpoint is unitized recognition.

### 8.5 Asset provenance

Google Creative Lab’s `morse-learn` repository is published under Apache-2.0 at repository level and should be studied for interaction and visual-learning precedent. Before reusing or modifying any particular illustration or third-party asset, verify its exact provenance/license.

Ace Centre’s Morse Learn work should likewise be treated as a research/design reference unless the relevant asset licensing is explicitly confirmed.

Unless there is a compelling licensed asset advantage, Argus should create an original mnemonic set with a single coherent visual grammar.

---

## 9. Audio and timing requirements

ITU-R M.1677-1 defines the basic temporal relationships:

- dit = 1 unit;
- dah = 3 units;
- gap between elements within a character = 1 unit;
- gap between characters = 3 units;
- gap between words = 7 units.

Argus should synthesize Morse deterministically from the underlying symbol data rather than shipping a large library of arbitrary recordings.

### 9.1 Character speed vs effective speed

Operational training commonly preserves a relatively fast internal character rhythm while widening spacing between characters/words (Farnsworth-style training). ARRL resources and the current CW Academy curriculum are important practice precedents. CW Academy’s Fundamental curriculum, for example, uses 25 WPM character speed with much lower effective speed early in training.

This does **not** prove that 25 WPM is optimal for Argus.

**Decision:** do not teach beginner audio by stretching each character into very slow constituent dots/dashes. Preserve a coherent character rhythm and create beginner breathing room through spacing. The exact initial character/effective-speed pair remains a design-validation question.

### 9.2 Audio implementation requirements

- deterministic timing from canonical data;
- configurable tone and volume within sensible accessibility limits;
- no sound asset required to identify the correct answer visually;
- replay in Learn/feedback;
- no autoplay behavior that surprises users after navigation;
- safe Web Audio lifecycle across background/foreground and mobile browsers;
- unit tests for timing generation independent of audible-device tests.

---

## 10. Packet size and character order

### 10.1 Five-at-a-time is a UI hypothesis, not a cognitive law

A five-card visual packet is a strong phone interaction: small enough to scan repeatedly, large enough to feel like meaningful progress, and compatible with an attractive horizontal/stacked presentation.

However, the research does not establish that five **simultaneously novel mappings** is optimal.

Keep two parameters distinct:

- **Study packet size:** candidate default = 5 visible/browsable characters.
- **New-item acquisition load:** candidate initial value may be 2–3 or adaptive, with already-known items occupying the rest of the packet.

The implementation should make these separable rather than hard-wiring “packet of five = five new items.”

### 10.2 Character order is unresolved

Compare at minimum:

- Koch-style incremental orders;
- current CW Academy ordering;
- simple/complexity-based easy-first sequences;
- confusion-aware ordering informed by Spragg/Rothkopf;
- any contemporary telemetry that can justify a different sequence.

Selection criteria should include:

- early acquisition success;
- avoiding dense clusters of highly confusable aural patterns;
- balanced representation of dits/dahs;
- useful early combinations;
- compatibility with gradual auditory exposure;
- simplicity of explanation.

Do not call a sequence “official,” “ARRL-certified” or scientifically optimal without primary evidence for that exact claim.

---

## 11. Test mechanics and adaptive evidence

### 11.1 Response modes

Morse may require Test responses beyond the current reveal/self-score card:

- MC recognition;
- prompt-first/delayed MC;
- single-character keyboard entry;
- dit/dah tactile entry;
- later audio stimulus → character entry.

Any new Test mechanic must preserve the current Learn + Test product model. Do not add a separate Practice/Rehearsal mode to house these interactions.

### 11.2 Accuracy and latency

Accuracy remains the primary correctness signal for the first mapping topic. Response latency can be useful for:

- determining whether an item still needs a cue;
- identifying hesitation/problem items;
- differentiating fluent recognition from slow analytic decoding in later reception training;
- choosing targeted discrimination material.

Latency must not silently become a completion requirement for a topic whose scope does not mention speed.

### 11.3 Cue state vs scheduler state

A useful conceptual model is:

```text
retention state: learning / drilled / completed / decayed
cue state:       rich / reduced / delayed-choice / free / auditory
```

They can evolve independently.

Examples:

- a newly introduced `A` may quickly reach free response but still need tomorrow’s delayed retrieval;
- an old `Q` may remain completed historically but receive a temporary richer feedback cue after a failure;
- an early voluntary Test may adjust item-confidence/cue data while still being unable to satisfy a future qualifying retention milestone.

The early-Test semantics implemented under #10 remain authoritative.

### 11.4 Generated groups are not extra completion items

When the system generates `KTA`, `SOS` or a 5-character group from known symbols, that material is a training presentation built from the finite symbol set. It must not make the original topic’s completion boundary ambiguous.

If group/word performance is itself scored as a distinct skill, give it an explicit separate scope/criterion.

---

## 12. Accessibility requirements

Morse has longstanding assistive-technology applications, so an image-centric learning design would be particularly inappropriate if it excluded learners who cannot use that channel.

Requirements:

- SVG artwork has meaningful semantic text equivalents.
- Visual and auditory cue channels are not needlessly entangled.
- A learner can complete the printed mapping topic without relying on animation.
- Reduced motion preserves sequence/order information.
- Touch targets support comfortable one-handed phone use.
- Keyboard operation is first-class.
- Architecture should not preclude switch-accessible input.
- Audio controls expose sensible replay/volume behavior.
- Color is never the only carrier of dit/dah or correctness information.
- 200% text scaling and narrow mobile layouts remain usable.
- Hearing-dependent and vision-dependent future topics must state their modality requirements honestly rather than pretending to be universally equivalent.

---

## 13. Data and architecture implications

The existing v4 model deliberately separates finite scored `items` from optional `Topic.learn` explanatory material. Morse should preserve that principle.

Potential reusable capability additions include:

- typed mnemonic/visual asset references;
- canonical symbol-code data separate from rendered mnemonic art;
- deterministic Morse audio synthesis;
- per-item acquisition/cue state;
- response-mode metadata;
- optional response-latency evidence;
- known confusion relationships;
- generated group/word item families;
- explicit modality/speed criteria for later topics;
- migration-safe export/import for any durable learning state.

### 13.1 Do not overgeneralize prematurely

Morse is the first use case. The data model should support the required learning behavior without becoming a bespoke CMS or speculative universal skill engine.

Before modifying the durable library schema, explicitly decide which information is:

1. **content definition** — portable with the topic/library;
2. **learning state** — user-specific and scheduled;
3. **runtime presentation** — derivable and need not be persisted.

For example, the canonical A=`.-` mapping belongs to content; current cue strength likely belongs to user learning state; a generated 5-character group may be transient runtime presentation.

---

## 14. Contemporary trainer landscape

### Google Creative Lab Morse Typing Trainer

Relevant because it demonstrates a visually mnemonic, accessible zero-to-Morse learning experience and has public source. Study:

- visual mnemonic integration;
- short-step onboarding;
- tactile input;
- accessibility motivation;
- how quickly cues are introduced/removed.

Do not assume its curriculum is optimal merely because the UX is compelling.

### Ace Centre Morse Learn

Especially relevant because its visual/auditory cueing system produced the telemetry analysed by Wade et al. Study:

- independently configurable cues;
- multimodal accessibility;
- the exact intervention behind the 2026 observational results;
- what can and cannot be inferred from learner telemetry.

### Morse Code World

Relevant as a mature trainer ecosystem. It demonstrates:

- adaptive character work;
- response-time/ICR concepts;
- word-list training;
- QSO-style material;
- configurable character/Farnsworth speeds;
- progression beyond isolated symbols.

Use it as a feature/ecological benchmark, not a source of canonical completion semantics for Argus.

### Morse Code Master

Relevant for simple beginner lesson packaging, combined input types, verbal mnemonic examples and a Koch-style trainer. Treat claims about “official” sequences cautiously unless independently verified.

### ARRL and CW Academy

Relevant for contemporary amateur-radio training practice, particularly sound-first guidance, keeping character rhythm relatively fast and controlling effective speed through spacing. They are important operational precedents but should not be presented as randomized evidence that one exact WPM setting is universally optimal.

---

## 15. Measurement and validation

The first implementation should be validated at three levels.

### 15.1 Mechanical correctness

- every A–Z mapping matches ITU-R M.1677-1;
- synthesized timing preserves canonical unit ratios;
- both test directions cover all 26 letters;
- cue-bearing artwork cannot leak into uncued final Test;
- reduced-motion mode preserves sequence semantics;
- export/import remains lossless for any new durable fields.

### 15.2 Learning interaction validation

Before declaring the progression settled, test with real novice or rusty users where practical:

- can a learner understand the visual grammar without explanation?
- does the integrated SVG help recall or merely provide a decoding trick?
- is a five-card study packet comfortable?
- how many simultaneously new characters feels manageable?
- does prompt-first MC encourage an answer before options appear?
- can learners use dit/dah input rapidly on a phone?
- do errors cluster around predicted confusion families?
- does cue fading feel earned rather than abrupt?

Do not simulate human evidence and call it usability evidence.

### 15.3 Instrumentation

Useful local metrics include:

- item accuracy;
- response latency;
- cue level when answered;
- confusion pair/error;
- number of retrievals before cue reduction;
- delayed-retrieval success.

Argus is currently a personal/local-first product. Do not introduce remote analytics merely because a research paper used telemetry. If aggregated telemetry is ever proposed, it requires a separate privacy/product decision and explicit consent design.

---

## 16. Phased implementation plan

Do not implement #21 as one giant branch. After this research/design baseline is accepted, split work into focused lanes.

### Phase 1 — Capability/data contract

Define:

- first topic representation;
- finite bidirectional coverage model;
- content vs user-state boundary;
- cue-state model;
- migration/export/import implications.

No visual polish before this contract is stable.

### Phase 2 — Morse engine and accessibility foundation

Implement:

- canonical mapping table;
- deterministic timing/audio engine;
- audio controls;
- reduced-motion/nonvisual semantics;
- unit/regression tests.

### Phase 3 — Visual acquisition system

Design and implement:

- original 26-character SVG grammar;
- packet browsing;
- synchronized optional tracing;
- cue reduction states;
- responsive mobile treatment.

This phase requires rendered review, not only DOM tests.

### Phase 4 — Test interaction extensions

Add only the response mechanics required by the first finite topic:

- MC where pedagogically useful;
- prompt-first option delay;
- keyboard character entry;
- dit/dah input;
- item-level cue evidence;
- scheduler-safe scoring.

### Phase 5 — Seeded Morse letters topic

Ship the researched A–Z topic with:

- explicit scope;
- complete test coverage;
- provenance;
- learning progression;
- no overclaim of auditory fluency.

### Phase 6 — Reception / numbers / words only after foundation validation

Potential later focused topics:

- International Morse — Numbers;
- Morse Reception — Letters;
- Morse Sending — Letters;
- Character Groups;
- Words/Phrases.

Each requires a new explicit completion criterion and should not be assumed part of Phase 5.

---

## 17. Open research and design questions

These must be resolved or explicitly deferred before the relevant implementation lane merges.

1. **Character order:** Which order best balances easy early unitization, auditory separation and useful combinations?
2. **Acquisition load:** Should the active new-character set begin at two, three or adapt dynamically?
3. **Five-card packet:** Does five remain the right visual study size on representative phones?
4. **Cue-fading criterion:** Accuracy only, repeated correct retrieval, latency, recency, or a combination?
5. **Cue recovery:** After an error, should the richer SVG return immediately for that item, only in feedback, or on the next Learn view?
6. **Prompt-first delay:** What delay is long enough to invite retrieval without making Test feel sluggish?
7. **SVG grammar:** Can all 26 letters support a coherent transmission-order visual system without contrived illustrations?
8. **Verbal mnemonics:** Omit by default or expose as an optional rescue channel?
9. **Audio settings:** What character/effective speed should first exposure use?
10. **Reception boundary:** What explicit speed and accuracy criterion constitutes completion when auditory reception ships?
11. **Sending:** When should sending enter the curriculum, and how will timing quality be scored?
12. **Confusion model:** Use historical aggregate relationships, personal error history, or both?
13. **Durable schema:** Which new fields genuinely belong in exported topic data?
14. **Asset licensing:** Are any Google/Ace assets worth adapting after exact provenance review, or should all mnemonic artwork be original?

---

## 18. Non-goals

The first Morse implementation is not intended to be:

- a complete amateur-radio operating course;
- a Q-code/prosign curriculum;
- proof of on-air CW fluency;
- a replacement for advanced contest/QSO trainers;
- a general arbitrary-media CMS;
- a reason to weaken finite completion semantics;
- a reason to reintroduce Practice under another name.

---

## 19. Acceptance criteria for the research/design baseline

This PRD is ready to drive implementation when:

- [x] the first finite completion boundary is explicit;
- [x] visual mapping competence is separated from auditory reception and sending;
- [x] visual mnemonic support is defined as temporary/fadeable scaffolding;
- [x] correct Morse audio is present from first exposure in the intended design;
- [x] canonical timing is anchored to ITU-R M.1677-1;
- [x] cue difficulty is separated from Argus retention/scheduler state;
- [x] five-at-a-time is recorded as a UI hypothesis rather than an unsupported new-item rule;
- [x] character order and fading criteria remain explicit research decisions;
- [x] accessibility is part of the foundation rather than retrofit work;
- [x] implementation is decomposed into focused follow-on lanes;
- [x] evidence limitations are recorded rather than converting observational/practice precedent into causal fact.

---

## 20. Source register

### Standards and direct Morse research

1. International Telecommunication Union. **Recommendation ITU-R M.1677-1: International Morse code.** 2009.  
   https://www.itu.int/rec/R-REC-M.1677-1-200910-I/en

2. Wade W, Hamid A, Holder C, Henderson G. **Morse code learning for assistive technology access: engagement, learning time, and cue associations in a large observational study.** *Disability and Rehabilitation: Assistive Technology*. Published online 2026-08-10. DOI: `10.1080/17483107.2026.2715256`. PMID: 42574304.  
   https://pubmed.ncbi.nlm.nih.gov/42574304/

3. Jarus T. **Learning Morse Code in Rehabilitation: Visual, Auditory, or Combined Method?** *British Journal of Occupational Therapy*. 1994;57(4):127–130. DOI: `10.1177/030802269405700405`.  
   https://doi.org/10.1177/030802269405700405

4. Allan MD. **A pattern recognition method of learning Morse code.** *British Journal of Psychology*. 1958;49(1):59–64. DOI: `10.1111/j.2044-8295.1958.tb00639.x`. PMID: 13536308.  
   https://pubmed.ncbi.nlm.nih.gov/13536308/

5. Clawson DM, Healy AF, Ericsson KA, Bourne LE Jr. **Retention and transfer of morse code reception skill by novices: part-whole training.** *Journal of Experimental Psychology: Applied*. 2001;7(2):129–142. DOI: `10.1037/1076-898X.7.2.129`. PMID: 11477980.  
   https://pubmed.ncbi.nlm.nih.gov/11477980/

6. Spragg SDS. **The relative difficulty of Morse code alphabet characters learned by the whole method.** *Journal of Experimental Psychology*. 1943;33(2):108–114. DOI: `10.1037/h0054213`.  
   https://doi.org/10.1037/h0054213

7. Rothkopf EZ. **Stimulus similarity and sequence of stimulus presentation in paired-associate learning.** *Journal of Experimental Psychology*. 1958;56(2):114–122. DOI: `10.1037/h0042909`.  
   https://doi.org/10.1037/h0042909

### Learning science

8. Fiechter JL, Benjamin AS. **Diminishing-cues retrieval practice: A memory-enhancing technique that works when regular testing doesn't.** *Psychonomic Bulletin & Review*. 2018;25(5):1868–1876. DOI: `10.3758/s13423-017-1366-9`.  
   https://pubmed.ncbi.nlm.nih.gov/28849580/

9. Fiechter JL, Benjamin AS. **Adaptive retrieval practice: a more effective and efficient method of learning with retrieval practice?** *Psychonomic Bulletin & Review*. 2019. DOI: `10.3758/s13423-019-01617-6`. PMID: 31161529.  
   https://pubmed.ncbi.nlm.nih.gov/31161529/

10. van den Broek GSE, et al. **Optimizing multiple-choice questions for retrieval practice: Delayed display of answer alternatives enhances vocabulary learning.** *Journal of Educational Psychology*. 2023;115(8):1087–1109. DOI: `10.1037/edu0000810`.  
    https://doi.org/10.1037/edu0000810

11. Carpenter SK, Pan SC, Butler AC. **The science of effective learning with spacing and retrieval practice.** *Nature Reviews Psychology*. 2022;1:496–511. DOI: `10.1038/s44159-022-00089-1`.  
    https://www.nature.com/articles/s44159-022-00089-1

### Operational and product precedents

12. ARRL. **Learning Morse Code.**  
    https://www.arrl.org/Learning-Morse-Code

13. CWops / CW Academy. **Fundamental curriculum v2.0.**  
    https://cwops.org/wp-content/uploads/2025/04/CW-Academy-Fundamental-Curriculum-v2.0.htm

14. Google Creative Lab. **Morse Typing Trainer.**  
    https://morse.withgoogle.com/learn/  
    Source: https://github.com/googlecreativelab/morse-learn

15. Ace Centre. **Morse Learn.**  
    https://acecentre.org.uk/resources/morse-learn

16. Morse Code World. **International Morse trainer.**  
    https://morsecode.world/international/trainer/

17. Morse Code Master. **Morse learning lessons and Koch trainer.**  
    https://morsecodemaster.com/

### Source-use rule

For implementation, canonical data must come from the ITU recommendation. Research papers justify learning-design hypotheses only to the extent their methods support them. Trainer websites are design/operational precedents, not substitutes for standards or experimental evidence.
