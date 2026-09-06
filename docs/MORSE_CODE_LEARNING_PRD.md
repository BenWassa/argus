# Morse code progressive learning — research and product requirements

**Status:** Research baseline; implementation truth amended by #24–#29 and #42  
**Issue:** #21  
**Original repository baseline:** `c1cc753eb89c9aa5379d1a885892703cf20e65ba`  
**Original date:** 2026-09-03  
**#42 amendment:** 2026-09-04  
**Product model:** Learn + Test only

> **Document hierarchy:** the ratified decisions in `docs/MORSE_PROGRAMME_PLAN.md`
> and focused implementation documents override unresolved hypotheses in this
> research baseline. #42 specifically supersedes the original PRD decision that
> verbal mnemonics should be merely optional rescue cues.

## 1. Executive decision

Argus should add International Morse code, but not as a conventional 26-card deck whose completion vaguely means “knows Morse.” Morse exposes a useful content class: a finite symbol system in which the learner encounters **different representations as proficiency develops**.

The target learning progression is:

> **encode → assisted retrieval → prompt-first multiple choice → diminishing/adaptive cues → uncued production → later auditory recognition → confusable-item discrimination → later groups → later words/phrases**

The first implementation preserves Argus’s strongest invariant: every completion claim is explicit, finite and completely testable.

The shipped printed-mapping boundary is:

> **International Morse — Letters:** independently map all 26 letters A–Z to their canonical International Morse code patterns and map those 26 printed patterns back to their letters, without mnemonic artwork, verbal mnemonics, audio cues or other answer-bearing support at the uncued evidence boundary.

The exact user-facing completion claim is:

> **Can independently recall all A–Z printed Morse mappings in both directions.**

This first completion claim **does not mean** that the learner can receive continuous Morse by ear, send well-timed Morse, copy words at a stated speed, use numerals/punctuation/prosigns, or operate CW on air. Those are distinct finite skills and should be represented by later topics only when their own completion criteria are explicit.

### #42 acquisition correction

The intended first-memory treatment is now explicit:

> **rhythmic verbal mnemonic + SVG timing scaffold + canonical pattern + audio**  
> → **reduced verbal/visual rhythm cue**  
> → **canonical/audio support**  
> → **uncued production and printed reverse recall**

The **rhythmic verbal mnemonic is the primary early memory hook**. The generated SVG remains a secondary visual scaffold that reinforces the same short/long sequence. Both are temporary: neither is part of the completion criterion and neither may leak into the final uncued Test rungs.

This correction is an implementation/product decision prompted by production use, not a claim that controlled evidence has proved verbal mnemonics superior to visual mnemonics. The A–Z phrase set and provenance are recorded in `docs/MORSE_VERBAL_MNEMONICS.md`; the SVG grammar is recorded in `docs/MORSE_MNEMONIC_GRAMMAR.md`.

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

Treating Morse as plain flashcards would leave substantial learning value on the table, but adding richer acquisition support must never blur what has actually been proved.

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

The printed letter-mapping topic is useful but deliberately modest. It establishes the symbol system. It is not a proxy for auditory CW competence.

Rich Learn support may prepare the learner for later abilities, but the current topic’s `scope + scored items/criteria` remain the complete claim. Optional sound heard during acquisition is therefore support, not evidence of auditory reception.

---

## 4. Evidence model

Not all sources answer the same question. Product decisions distinguish five evidence classes.

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

These studies are directly relevant but differ in age, task, sample and outcome. None is a complete modern curriculum specification.

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
- the rhythmic verbal method reference supplied in #42.

When a trainer uses a particular mnemonic, character speed, order or threshold, Argus may study the pattern without calling it scientifically optimal unless the underlying evidence supports that exact claim.

---

## 5. Research findings and product implications

### 5.1 Visual cues appear especially useful early, while sound becomes more important later

Wade et al. (2026) analysed 699,562 telemetry records from 34,641 anonymous users of a Morse-learning system over five years. Their abstract reports 90.3% final accuracy for learners using visual cueing versus 82.2% without visual cueing, with Cohen’s `d = 0.79`, and progression rates of 51.6% versus 39.3%. The modeled advantage of visual cueing was strongest early and diminished across the teaching sequence, while the association with sound cueing increased.

The safe product interpretation is not “pictures cause Morse mastery.” The study is observational; cue choice, prior skill and learner behavior may confound outcomes. The stronger design inference is:

- visual scaffolding is credible for early acquisition;
- auditory exposure should not be postponed until the visual alphabet is complete;
- instructional weight can move away from answer-bearing visual support as mappings stabilize;
- cue configuration/fading should be adaptable rather than permanently fixed.

**Argus decision:** expose correct Morse sound from the first encounter. Retain useful visual timing support early, but make it subordinate to the #42 verbal-first acquisition hierarchy and remove it before uncued evidence.

### 5.2 Combined visual and auditory learning has direct experimental precedent

Jarus (1994) randomly assigned 60 adults with no prior Morse knowledge to visual, auditory or combined teaching conditions. The combined condition was faster than the visual condition and produced fewer errors than the auditory condition on the study’s encoding task.

The study was short, used a handwriting-oriented outcome and predates modern digital trainers. It does not prove that a particular Argus SVG or verbal treatment is optimal. It does support avoiding an artificial visual-first/auditory-later split.

**Argus decision:** use sound alongside visual/verbal encoding from the beginning, while keeping sound optional for completion of the printed-mapping topic.

### 5.3 Fluent reception should unitize a character rather than analytically count its elements

Allan’s 1958 work compared a pattern-recognition method with more analytic Morse learning. Clawson, Healy, Ericsson & Bourne (2001) found disadvantages from beginning with a hard subset/subtask and reported that easier initial training encouraged an effective **unitization strategy** for representing Morse codes.

Neither the verbal mnemonic nor the SVG should become a permanent decoding algorithm. The phrase is a temporary bridge from letter to rhythm; the SVG is a direct timing picture of that rhythm. Both fade.

**Argus decision:** optimize early materials for direct character ↔ temporal-pattern association. A classic Morse binary tree may exist as an optional reference, but it should not be the primary acquisition mechanism.

### 5.4 Similar characters should be handled differently during acquisition and discrimination

Spragg (1943) found systematic differences in Morse character difficulty and reported strong confusions among characters identical except for the final element. Rothkopf (1958), using aural Morse stimuli, found that maximizing separation of similar stimuli in the initial presentation sequence facilitated acquisition.

This suggests a two-stage strategy:

- **Initial acquisition:** avoid loading a beginner packet with highly confusable sound patterns merely to make the task “harder.”
- **Later discrimination:** once mappings exist, deliberately contrast/interleave confusable pairs or families to eliminate systematic errors.

**Argus decision:** distractors are evidence-informed and stage-aware rather than permanently random.

### 5.5 Diminishing cues are a defensible bridge from exposure to retrieval

Fiechter & Benjamin found that diminishing-cue retrieval practice can improve later memory under conditions where ordinary retrieval is initially too difficult, and later work found value in adaptive cueing when a fixed fading schedule is too blunt.

For the implemented printed topic, the bridge is now:

1. full verbal + SVG + canonical + audio in Learn;
2. reduced verbal/SVG prefix inside supported Test;
3. canonical support with optional audio;
4. uncued production;
5. uncued printed reverse recall.

A later sound-only reception topic is separate work.

**Argus decision:** cue strength remains separate from the long-term retention scheduler. The two systems solve different problems.

### 5.6 Multiple choice can be made more retrieval-like before it disappears

Van den Broek et al. (2023) tested a “stepwise” multiple-choice format in which the question was shown before answer alternatives. Delaying alternatives improved delayed retention in three of four experiments, consistent with giving learners an opportunity to retrieve before recognition support appears.

This does not establish a universal Morse-specific delay. It supports the interaction pattern.

**Argus decision:** supported Test progresses from immediate options to prompt-first options before free response. The implemented delay is 1.5 seconds and remains a product-tuned parameter rather than a published scientific constant.

### 5.7 Spacing and retrieval remain orthogonal to cue difficulty

The broader retrieval-practice literature supports repeated retrieval separated over time. Argus already has a retention ladder and explicit early-Test semantics: an early Test may produce evidence without counterfeit delayed retention.

A learner can therefore be capable of uncued Morse recall today while still lacking the delayed evidence required for durable completion.

**Argus decision:** cue level is not another name for `learning / drilled / completed / decayed`.

---

## 6. First shipped topic boundary

### 6.1 Shipped topic

**Title:** International Morse — Letters

**Scope definition:**

> The 26 International Morse mappings for A–Z, recalled uncued in both directions: letter → canonical dit/dah pattern and printed canonical pattern → letter.

**Completion does cover:**

- all 26 letters;
- all 26 canonical mappings;
- both stated printed mapping directions;
- full item coverage rather than a sampled subset.

**Completion does not cover:**

- numbers;
- punctuation or prosigns;
- auditory reception;
- stated-WPM continuous copying;
- sending rhythm/timing;
- words, phrases or QSOs;
- amateur-radio operating conventions.

### 6.2 Scored coverage — resolved by #24/#28

Argus uses **exactly 26 logical items**, each typed `bidirectional`. Stable item identity and per-direction evidence prove both directions without duplicating the logical unit into 52 cards. `retentionCorrectCount` prevents a partial-direction path from presenting a passing attempt to the unchanged scheduler. After #68 it also prevents a partially *supported* one: only answers given with no scaffolding on screen count toward the claim, and a qualifying run in which any answer was cued cannot pass. See `docs/MORSE_CUE_LADDER.md`.

This is the implemented resolution of the original 52-prompts-vs-bidirectional design question.

### 6.3 Audio in this topic

Correct Morse audio accompanies Learn and may be offered as a supported Test cue before the uncued boundary. It does **not** become part of this topic’s scored completion claim.

This is intentional. Early audio exposure can help establish the temporal representation without overstating what a printed mapping Test proves.

---

## 7. Progressive acquisition model

This ladder describes cueing and response mechanics, not the retention ladder.

### Stage A — Encode

For a small packet of characters, Learn shows:

- a large uppercase glyph;
- the rhythmic verbal mnemonic as the **primary first-memory hook**;
- explicit `short ·` / `hold —` labels so pronunciation is never the only carrier of correctness;
- the generated SVG timing scaffold as a secondary visual representation;
- canonical Morse beneath it;
- a replayable correct Morse sound;
- synchronized element highlighting driven by the same timing schedule;
- concise semantic text equivalents for accessibility.

The learner can move rapidly among the packet rather than reading a long article. This stage is exposure, not evidence of mastery.

### Stage B — Assisted recognition / rhythm cue

Begin with high-success retrieval. The supported letter → pattern card may show only a **strict opening prefix** of the verbal mnemonic, SVG timing and canonical pattern, plus pattern length. It may never reveal the entire answer.

### Stage C — Prompt-first reduced rhythm

The prompt appears alone before alternatives. Only the first verbal/SVG beat may remain, with the canonical first element and total length. Options arrive after the retrieval opportunity.

### Stage D — Canonical support

The verbal mnemonic and SVG disappear. The learner gets only the total length and may explicitly play the canonical Morse rhythm as optional support before delayed alternatives arrive.

This audio is a cue for the printed-mapping task, not a sound-only reception test.

### Stage E — Uncued printed production and reverse recall

The learner receives `A` and enters `.-`, or receives printed `.-` and enters `A`, with no verbal mnemonic, SVG, audio support, length hint or answer prefix.

For letter → code on touch devices, two large tactile controls for dit and dah are used; keyboard input remains efficient.

This stage supplies the directional evidence required by the first topic’s final scored boundary.

### Stage F — Auditory character reception

This is a **separate future explicit skill claim**. The learner hears a properly timed character and responds with the letter; printed code appears only as feedback. It is #29 territory, not part of #42.

### Stage G — Contrastive discrimination

The system intentionally targets confusable characters based on known similarity structure and the learner’s own evidence once both members are established.

### Stage H — Groups

Progress from 2-character to longer groups, ultimately including conventional 5-character practice groups where useful. Group material generated from known symbols must not silently add scored content to the alphabet topic.

### Stage I — Words and phrases

Use common short words and then phrases/continuous material. These later stages require their own explicit performance criteria before Argus can call them completed topics.

---

## 8. The mnemonic system

### 8.1 Product goal

The acquisition system should create a fast association between the uppercase letter and its temporal Morse pattern. The scaffolds should be memorable enough to bootstrap retrieval and disposable enough to disappear later.

#42 establishes an explicit channel hierarchy rather than asking one representation to do everything:

1. rhythmic verbal phrase — primary early memory hook;
2. SVG — secondary visual timing reinforcement;
3. canonical notation — authoritative printed representation;
4. synthesized audio — authoritative temporal rendering.

All four must agree element-for-element.

### 8.2 Visual grammar — secondary scaffold

Argus retains an original generated SVG system with consistent rules across all 26 letters:

- **dit:** small/circular one-unit event;
- **dah:** elongated three-unit event;
- **order:** transmission order left to right;
- **glyph:** uppercase letter remains visibly attached to the timing trace;
- **canonical notation:** plain `·` / `—` or `.` / `-` remains available;
- **sound synchronization:** highlighting uses the same schedule/start delay as audio;
- **reduced motion:** sequence semantics survive without positional motion;
- **contrast:** short vs long remains distinguishable without colour alone.

The SVG is not a bespoke pictorial illustration per letter and no longer carries the role of primary mnemonic. See `docs/MORSE_MNEMONIC_GRAMMAR.md`.

### 8.3 Verbal/syllabic mnemonics — #42 decision

The original PRD treated verbal mnemonics as optional rescue cues. Production use showed that this was the wrong product hierarchy for the intended method.

**Decision (#42): rhythmic verbal mnemonics are the primary early acquisition scaffold.**

The Argus grammar is:

- one monosyllabic spoken word per Morse element;
- clipped/short beat → dit;
- deliberately held beat → dah;
- transmission order preserved exactly;
- explicit `short`/`hold` labels always accompany the phrase in Learn, so accent or natural word duration cannot silently invert the mapping;
- the phrase is a temporary bridge and is never scored;
- reduced Test may show only a strict opening prefix;
- uncued Test shows none of it.

The supplied method/example `A = "A LONG"` is retained. The other 25 phrases are original Argus editorial work, not a copied third-party mnemonic list. `docs/MORSE_VERBAL_MNEMONICS.md` records every phrase, rationale and provenance.

Automated structural agreement is not evidence that the phrase set is maximally memorable. Human learner validation remains necessary.

### 8.4 Morse trees

Binary dot/dash trees are useful references but encourage sequential traversal. They should not be the primary Learn mechanic when the intended endpoint is unitized recognition.

### 8.5 Asset/content provenance

Google Creative Lab’s `morse-learn`, Ace Centre Morse Learn, Morse Code Master and the #42 video are research/design precedents. Argus does not silently copy their per-letter assets or phrase lists.

The canonical A–Z mappings and timing come only from ITU-R M.1677-1. The SVG is generated from those canonical patterns. The verbal set is original except for the user-supplied `A LONG` exemplar, and is mechanically checked back against the canonical table.

---

## 9. Audio and timing requirements

ITU-R M.1677-1 defines the basic temporal relationships:

- dit = 1 unit;
- dah = 3 units;
- gap between elements within a character = 1 unit;
- gap between characters = 3 units;
- gap between words = 7 units.

Argus synthesizes Morse deterministically from underlying symbol data rather than shipping arbitrary prerecorded clips.

### 9.1 Character speed vs effective speed

Operational training commonly preserves a coherent internal character rhythm while widening spacing between characters/words (Farnsworth-style training). ARRL resources and CW Academy are practice precedents, not proof that one exact speed is universally optimal.

**Decision:** do not teach beginner audio by stretching each character into unnaturally slow constituent dots/dashes. Preserve a coherent character rhythm and create breathing room through spacing where applicable.

### 9.2 Audio implementation requirements

- deterministic timing from canonical data;
- configurable tone and deliberate default gain within sensible limits;
- no sound asset required to identify the correct answer visually;
- replay in Learn and supported cueing;
- no autoplay after navigation/render;
- `AudioContext` creation/resume stays on the direct Play activation path;
- any non-running mobile context is resumed and verified as `running` before scheduling nodes;
- app code does not race browser lifecycle suspension with its own asynchronous background `suspend()` call;
- background/pagehide cancels scheduled playback/highlighting cleanly;
- a closed context can be recreated;
- audio failure is clearly reported and never blocks Learn;
- oscillator/highlight timing shares one schedule/start delay;
- unit tests cover timing/lifecycle but do not claim audible physical-device success.

#42 deliberately raises the default linear gain from `0.12` to `0.25` after the reported production audibility failure. Device media volume and routing remain final output controls; the exact production build still requires real-device acceptance.

#42 also shapes the gain envelope. Each element previously began and ended with an instantaneous gain step, which leaves a waveform discontinuity that a speaker reproduces as a broadband click. On a phone that click can be louder than the tone it brackets, so a dit is heard as a tick and the short/held contrast the whole treatment rests on is degraded at exactly the shortest element. A 2ms linear ramp is now applied at both edges, shaped strictly inside each element's own window so `buildMorseSchedule` remains the only timing authority, and clamped to a quarter of the element for very fast dits so a short element still reaches full amplitude. Loudness is unchanged by this; it is a waveform-continuity fix, independent of the device-evidence question that governs gain.

---

## 10. Packet size and character order

### 10.1 Five-at-a-time is a UI hypothesis, not a cognitive law

A five-card visual packet is a strong phone interaction: small enough to scan repeatedly, large enough to feel meaningful, and compatible with the current mobile surface.

The research does not establish that five **simultaneously novel mappings** is optimal. Study packet size and new-item acquisition load remain conceptually separate.

### 10.2 Character order

The implemented order is documented in the programme/curriculum work. Order claims must distinguish historical/practice precedent from controlled evidence. Do not call an order “official,” “ARRL-certified” or scientifically optimal without primary evidence for that exact claim.

Selection criteria remain:

- early acquisition success;
- avoiding dense clusters of highly confusable patterns;
- balanced dit/dah representation;
- useful early combinations;
- compatibility with gradual audio exposure;
- simplicity of explanation.

---

## 11. Test mechanics and adaptive evidence

### 11.1 Response modes

Morse extends Test without adding another product mode:

- supported MC recognition;
- prompt-first/delayed MC;
- single-character keyboard entry;
- dit/dah tactile entry;
- later sound-only stimulus → character entry only in a separately scoped topic.

### 11.2 Accuracy and latency

Accuracy remains the primary correctness signal for the printed mapping topic. Response latency is recorded from the first session for later analysis but **gates nothing** in the current completion claim.

Latency must not silently become a completion requirement for a topic whose scope does not mention speed.

### 11.3 Cue state vs scheduler state

```text
retention state: learning / drilled / completed / decayed
cue state:       rich / delayed-choice / reduced / free
```

They evolve independently. Cue evidence can withhold a passing bidirectional attempt until both directions have actually been demonstrated; it cannot grant, skip or reset retention evidence. `src/lib/scheduling.ts` remains authoritative for retention resolution.

### 11.4 Generated groups are not extra completion items

When the system later generates a group from known symbols, that material is training presentation built from the finite symbol set. It must not make the printed alphabet topic’s completion boundary ambiguous.

---

## 12. Accessibility requirements

Morse has longstanding assistive-technology applications, so a rich learning design cannot make one modality the only route to the printed topic.

Requirements:

- SVG has meaningful semantic text equivalents.
- The verbal phrase has semantic duration labels; capitalization is not load-bearing.
- Visual and auditory channels are independently usable.
- The printed mapping topic can be completed without animation or working audio.
- Reduced motion preserves sequence/order information.
- Touch targets support comfortable phone use.
- Keyboard operation is first-class.
- Architecture does not preclude switch-accessible input.
- Audio controls expose replay and clear media-volume guidance.
- Color is never the only carrier of dit/dah or correctness information.
- 200% text scaling and narrow mobile layouts remain usable.
- Hearing-dependent and vision-dependent future topics state modality requirements honestly rather than pretending to be universally equivalent.

---

## 13. Data and architecture implications

The existing model separates finite scored `items` from optional `Topic.learn` explanatory/acquisition material. Morse preserves that principle.

Reusable capability additions now include:

- typed mnemonic/visual asset references;
- canonical symbol-code data separate from rendered scaffold;
- deterministic Morse audio synthesis;
- stable item identity;
- typed bidirectional item semantics;
- per-item acquisition/cue state;
- response-mode metadata;
- optional response-latency evidence;
- derived confusion relationships;
- migration-safe export/import for durable learning state.

The verbal phrase table itself is presentation/content code keyed by canonical letter; it is not learner state and does not require a schema migration.

### 13.1 Do not overgeneralize prematurely

Before modifying durable library state, distinguish:

1. **content definition** — portable with the topic/library;
2. **learning state** — user-specific and scheduled;
3. **runtime presentation** — derivable and need not be persisted.

The canonical A=`.-` mapping is content; current cue strength is user learning state; the rendered phrase/SVG/audio schedule is derivable presentation.

---

## 14. Contemporary trainer landscape

### Google Creative Lab Morse Typing Trainer

Relevant for visual mnemonic integration, short-step onboarding, tactile input and accessibility motivation. It is a precedent, not proof of optimal curriculum.

### Ace Centre Morse Learn

Relevant because its cueing system produced the telemetry analysed by Wade et al. Independently configurable cues and multimodal accessibility are especially pertinent.

### Morse Code World

Relevant as a mature trainer ecosystem with adaptive character work, speed configuration, word lists and progression beyond isolated symbols. It is not the source of Argus completion semantics.

### Morse Code Master

Relevant for beginner packaging, combined input types, verbal-mnemonic examples and Koch-style training. Argus does not copy its mnemonic list, and “official” sequence claims require independent authority.

### ARRL and CW Academy

Relevant for contemporary amateur-radio training practice, particularly maintaining coherent character rhythm and controlling effective speed through spacing. They are operational precedents, not randomized proof of an exact WPM setting.

### #42 supplied rhythmic-verbal reference

Relevant for the **method** of mapping short/held spoken beats to dits/dahs. The user-supplied `A LONG` exemplar is retained. Argus authors its remaining phrases independently and verifies them against ITU content.

---

## 15. Measurement and validation

The implementation is validated at three levels.

### 15.1 Mechanical correctness

- every A–Z mapping matches ITU-R M.1677-1;
- every A–Z verbal phrase maps short/held beats exactly to that canonical pattern;
- verbal, SVG and synthesized-audio signal-unit sequences agree for all 26;
- synthesized timing preserves canonical unit ratios;
- both Test directions cover all 26 logical items;
- verbal mnemonic, SVG, audio support, prefix and length cannot leak into the uncued final Test;
- reduced-motion mode preserves sequence semantics;
- export/import and existing learner state remain lossless.

### 15.2 Learning and real-device interaction validation

Automated tests are not human evidence. Before #42 can merge/close, the exact production build must be exercised on a real Android Chrome / installed-PWA path and confirm at minimum:

- fresh-load Play is clearly audible after direct user activation;
- repeated Play / Stop / Replay works across cards;
- background/resume does not leave playback stuck silent;
- visual highlight stays synchronized with the sounding dit/dah;
- the verbal mnemonic rule is understandable without prior explanation;
- verbal + SVG + audio reinforce the same mapping rather than compete;
- five-card packets remain usable on phone;
- 200% text and reduced motion remain usable;
- unavailable audio degrades clearly without blocking Learn.

After #42 lands, genuine novice/rusty learner validation should examine memorability, awkward phrases, cue fading and confusion patterns before #29 expands the skill claim.

Do not simulate human evidence and call it usability evidence.

### 15.3 Instrumentation

Useful local metrics include item accuracy, response latency, cue level, confusion/error and delayed-retrieval success. Argus remains local-first; no remote analytics are introduced by the Morse programme.

---

## 16. Phased implementation plan and current status

The programme was decomposed rather than implemented as one giant branch.

### Phase 1 — Capability/data contract — implemented (#24/#28)

Stable item identity, bidirectional coverage, cue-state/evidence separation, migration and export/import are in place.

### Phase 2 — Morse engine and accessibility foundation — implemented, corrected by #42

Canonical mapping/timing and synthesized Web Audio exist. #42 hardens the mobile audio lifecycle and audibility defaults without changing the canonical schedule.

### Phase 3 — Acquisition system — implemented, corrected by #42

The generated SVG remains, but #42 makes the original A–Z rhythmic verbal set the primary first-memory scaffold and keeps SVG secondary.

### Phase 4 — Test interaction extensions — implemented (#27/#28), corrected by #42

Supported MC, delay, dit/dah entry, character entry and item-level cue evidence are in place. #42 aligns the cue channels with the verbal-first hierarchy while preserving rung identities and scheduler semantics.

### Phase 5 — Seeded Morse letters topic — implemented (#28)

Exactly 26 bidirectional logical scoring units with the fixed printed-mapping completion claim.

### Phase 6 — Reception / sending / groups / words — deferred (#29)

Do not begin competency expansion until #42's exact production build and the A–Z acquisition flow receive genuine device/learner validation.

---

## 17. Resolved and open design questions

1. **Character order:** resolved for the shipped A–Z curriculum; provenance wording remains conservative.
2. **Acquisition load:** packet is five visible cards; do not infer a cognitive optimum from that UI choice.
3. **Five-card packet:** implemented; still subject to real learner/phone validation.
4. **Cue-fading criterion:** resolved for v1 — two consecutive correct at a rung; latency recorded but does not gate.
5. **Cue recovery:** resolved — an error restores one stronger rung.
6. **Prompt-first delay:** resolved for v1 — 1.5 seconds; product-tuned, not a scientific constant.
7. **SVG grammar:** resolved — generated canonical timing grammar, retained as secondary visual scaffold.
8. **Verbal mnemonics:** **resolved by #42 — primary early acquisition scaffold**, original Argus A–Z set with explicit duration labels and mechanical canonical verification.
9. **Audio settings:** canonical timing remains deterministic; #42 raises default gain to 0.25 and requires physical-device acceptance before the issue closes.
10. **Reception boundary:** deliberately unresolved for #29; requires explicit speed/accuracy/modality criteria.
11. **Sending:** deferred to #29/later work with its own timing-quality criterion.
12. **Confusion model:** implemented from pattern similarity plus learner evidence/stage.
13. **Durable schema:** cue/evidence fields landed in v5; #42 adds no durable learner-state field.
14. **Asset licensing:** current SVG and verbal set are original/generated; third-party assets are not required.

---

## 18. Non-goals

The first Morse implementation is not intended to be:

- a complete amateur-radio operating course;
- a Q-code/prosign curriculum;
- proof of on-air CW fluency;
- proof of auditory reception or sending;
- a WPM claim;
- a replacement for advanced contest/QSO trainers;
- a general arbitrary-media CMS;
- a reason to weaken finite completion semantics;
- a reason to reintroduce Practice under another name.

---

## 19. Acceptance criteria for the design baseline

- [x] the first finite completion boundary is explicit;
- [x] visual mapping competence is separated from auditory reception and sending;
- [x] rhythmic verbal mnemonic support is the primary early acquisition scaffold;
- [x] the generated SVG is retained as a secondary, temporary visual scaffold;
- [x] verbal, SVG, canonical and audio channels encode the same temporal sequence;
- [x] correct Morse audio is present from first exposure in the intended design;
- [x] canonical content/timing is anchored to ITU-R M.1677-1;
- [x] cue difficulty is separated from Argus retention/scheduler state;
- [x] exactly 26 logical bidirectional items define the printed A–Z boundary;
- [x] accessibility is part of the foundation rather than retrofit work;
- [x] evidence limitations are recorded rather than converting observational/practice precedent into causal fact;
- [ ] #42 exact-production real-device acceptance is satisfied before merge/close;
- [ ] genuine learner validation is completed before #29 competency expansion.

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

18. **Rhythmic verbal mnemonic method reference supplied in #42.** Used as a design/method precedent; only the user-supplied `A LONG` exemplar is retained directly.  
    https://youtu.be/0CYpik24pRU?si=RX5Bow1eMGFpLdV5

### Source-use rule

For implementation, canonical data comes from the ITU recommendation. Research papers justify learning-design hypotheses only to the extent their methods support them. Trainer/video resources are design/operational precedents, not substitutes for standards or experimental evidence. The #42 A–Z verbal set must not be described as scientifically validated until genuine learner evidence exists.
