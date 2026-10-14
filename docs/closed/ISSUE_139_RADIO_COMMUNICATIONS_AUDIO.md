# Issue #139 — Radio communications and audio drills

**Status:** research complete — implementation handoff ready  
**Priority:** P0  
**Issue:** #139  
**Roadmap:** `docs/LIBRARY_ROADMAP.md`  
**Method:** `docs/LIBRARY_RESEARCH_METHOD.md`  
**Research completed:** 2026-09-30

## 1. Decision summary

### Service boundary

**Build the first programme around Canadian marine VHF voice procedure.**

Do not create a blended “radio procedure” curriculum by borrowing whichever marine, aeronautical, amateur or military phrase happens to be convenient. The programme has two deliberately different authority layers:

1. **Canadian general radio substrate — ISED RIC-22 only.** RIC-22 explicitly says its general information remains relevant to all radio operators. It can therefore support the common substrate that it actually publishes: the ITU phonetic alphabet, Canadian radiotelephony-number pronunciations, selected procedural words, call mechanics, correction/repetition, and the general priority order.
2. **Canadian marine procedure — Canadian Coast Guard RAMN 2026.** Marine-specific routine calling, vessel identification, working-frequency behaviour, MAYDAY/PAN PAN/SÉCURITÉ calls, and marine message structures come from the current Canadian Coast Guard publication, not from aeronautical examples or amateur convention.

This is a source boundary, not an assertion that every radio service behaves identically. Where RIC-22 and a service publication differ in detail, the service publication controls that service module.

### Why marine first

Marine is the strongest first service for Argus because the Canadian source set is unusually complete and phone-teachable:

- the Canadian Coast Guard publishes current routine radiotelephone call examples and explicit distress, urgency and safety call/message structures in one maintained source;
- the programme has practical beginner value without requiring an aviation operating context;
- the content can be decomposed into finite recognition/order/meaning items before audio exists;
- the audio competence can be bounded to clean listening/copy rather than pretending that a phone drill proves live radio operation;
- the service boundary is easy to label and preserve.

Aeronautical procedure is also sourceable, especially through ISED RIC-21 and Transport Canada material, but it should be a separate later programme. Amateur radio has a separate regulatory/certification regime and less reason to force a standardized voice-procedure curriculum into the marine/aeronautical model. Military/tactical communications remain out of scope.

### Build / revise / defer

| Decision | Work |
|---|---|
| **BUILD** | Canadian general radio-procedure foundation using only claims supported by RIC-22. |
| **BUILD** | Canadian marine VHF routine-calling and priority-communications topics using CCG RAMN 2026. |
| **BUILD** | A small reusable prerecorded-audio stimulus/drill capability, then clean marine listening/copy drills. This is an implementation handoff, not work inside #139. |
| **REVISE** | Existing `radiotelephony-numbers` provenance: the same 13 forms are published in RIC-22 and should be sourced there for the programme instead of implying an aeronautical-only RIC-21 boundary. Prefer the learner-facing title **Canadian radiotelephony numbers** unless later research establishes a broader international claim. |
| **REVISE** | Existing NATO/phonetic-alphabet Learn support may cite RIC-22 as the Canadian radio-application/pronunciation source while preserving its existing 26-item completion boundary. Do not silently turn the current code-word recall topic into an audio-pronunciation claim. |
| **DEFER** | Aeronautical operating procedure, ATC phraseology, clearances/readbacks and aviation emergencies to a separate source-scoped programme. |
| **DEFER** | Amateur-radio operating practice to a separate programme if later research finds a finite, useful boundary. |
| **DEFER** | DSC/GMDSS equipment operation, frequency/channel memorization beyond what is essential context, microphone/speech-recognition scoring, live transmitting practice, runtime TTS, RF/noise simulation and degraded-channel scoring. |
| **EXCLUDE** | Tactical/military communications curriculum and any claim that Argus grants or prepares the user for a radio operator certificate. |

## 2. Programme sequence

### Prerequisites already in Argus

1. **NATO / ITU phonetic alphabet** — retain the current finite letter → code-word claim.
2. **Radiotelephony numbers** — retain the current 13 written-token → spoken-form items, but revise provenance as above.
3. **Morse** — adjacent communications training only. It is not a prerequisite for marine VHF voice procedure and its bespoke tone/audio runtime should not become the speech-audio architecture.

### New text-first sequence

#### Topic A — Canadian radio procedure: core call language

Authority: ISED RIC-22.

Teach only the high-value common material that RIC-22 itself presents as general radio-operating guidance:

- priority order: distress → urgency → safety → all other communications;
- selected procedural words and their exact intended meanings;
- called station first, then `THIS IS`, then calling station;
- `OVER` versus `OUT`;
- single-station and all-stations call structure;
- `CORRECTION` and `SAY AGAIN` behaviour;
- the four-part message-handling shape: call, reply, message, acknowledgement/ending.

Do not import aeronautical clearance/readback rules, marine DSC details, amateur Q-codes or military prowords into this topic.

#### Topic B — Canadian marine VHF: routine calling

Authority: CCG *Radio Aids to Marine Navigation 2026*, Part 4.

Teach:

- initial call to a specific station;
- initial `ALL STATIONS` call;
- marine vessel identity fields in those calls;
- invitation to reply versus a broadcast that proceeds directly to its message;
- high-level working-frequency principle: a calling/distress frequency is not a default place for routine traffic when the source directs transfer to a working frequency;
- the published five-part ship-to-shore radio-message structure as reference support, without claiming that memorizing it makes the learner a radio operator.

#### Topic C — Canadian marine VHF: priority communications

Authority: CCG *Radio Aids to Marine Navigation 2026*, Part 4.

Teach:

- MAYDAY = distress;
- PAN PAN = urgency;
- SÉCURITÉ = safety;
- priority order and what each signal announces;
- published marine distress call structure;
- published marine distress message structure;
- published marine urgency call structure;
- published marine safety call and safety-message structures;
- the distinction between a voice call/message memory drill and complete emergency operation, which can include DSC/GMDSS actions outside this programme.

Do **not** create unsourced scenario cards that ask the learner to diagnose whether a real-world situation “deserves” MAYDAY or PAN PAN. Recognition of the published definitions is finite; operational judgment is not.

### Audio sequence after the text programme exists

Audio is a separate competence dimension and must not be inferred from text recall.

1. **Token copy — clean:** hear short sequences made only from already-sourced phonetic code words and radiotelephony numbers; transcribe the intended letters/digits.
2. **Proword recognition — clean:** hear one selected RIC-22 procedural word/phrase and identify its meaning.
3. **Routine call extraction — clean:** hear a short marine initial call and extract called station / calling vessel identifiers.
4. **Routine call copy — clean:** transcribe or reconstruct a bounded CCG-style marine call.
5. **Priority-signal recognition — clean:** distinguish heard MAYDAY, PAN PAN and SÉCURITÉ and recall the published meaning/priority. This tests recognition of an explicit signal, not emergency judgment.
6. **Structured message extraction — clean:** from short authored marine training messages, extract explicitly spoken fields such as position, nature of distress and assistance needed.
7. **Voice variability — later:** add a second independently QA-approved voice only after the single-voice pack is stable.
8. **Channel degradation — later/deferred:** do not introduce static, clipping, radio filters or speed manipulation until clean listening has its own stable claim and a later issue defines what degradation is educationally defensible.

No audio drill should require speaking, microphone permission or automatic speech recognition in the first implementation.

## 3. Exact completion claims and exclusions

### Existing prerequisites

**NATO/ITU phonetic alphabet — current claim remains:** can independently recall the 26 letter → official code-word mappings that Argus scores. No pronunciation/listening claim is added merely because later audio reuses the words.

**Canadian radiotelephony numbers — revised wording:** can independently recall the 13 ISED-published written token → spoken-form mappings scored by Argus: digits 0–9 plus decimal, hundred and thousand. This does not claim live-radio listening or transmission skill.

### Topic A — Canadian radio procedure: core call language

**Completion claim:** can independently recall the selected RIC-22 procedural-word meanings and reconstruct the bounded single-station/all-stations call and message-handling sequences included in the topic.

**Does not claim:** ability to operate radio equipment, choose a legal frequency/channel, interpret service-specific clearances, transmit effectively, or hold any operator qualification.

### Topic B — Canadian marine VHF: routine calling

**Completion claim:** can independently recall the CCG RAMN 2026 structures included for a marine initial call to a specific station, an `ALL STATIONS` call, and the bounded routine message/reference sequence.

**Does not claim:** practical marine-radio competence, correct channel selection in every Canadian area, DSC operation, vessel licensing knowledge, or ROC-M readiness/certification.

### Topic C — Canadian marine VHF: priority communications

**Completion claim:** can distinguish the published meanings and priority of MAYDAY, PAN PAN and SÉCURITÉ and independently reconstruct the specific CCG RAMN 2026 voice call/message field sequences included in the topic.

**Does not claim:** emergency decision-making, ability to operate DSC/GMDSS equipment, ability to conduct or control real distress traffic, or certification.

### Audio topic — clean marine listening/copy

**Completion claim for the first audio release:** can correctly identify, copy or extract fields from the programme's finite set of **clean, prerecorded, QA-approved training utterances** using the sourced code words, number pronunciations, selected procedural words and marine structures already taught in text.

**Does not claim:** comprehension of live radio, weak-signal/noisy reception, arbitrary accents/speakers, high-speed traffic, ATC or amateur procedure, speaking/transmitting ability, emergency judgment, or operator certification.

If a later release adds independently QA-approved voices or degradation levels, each added condition must be named in the completion claim rather than silently broadening “audio proficiency”.

## 4. Authority and source hierarchy

### Tier 1 — current Canadian marine authority

1. **Canadian Coast Guard — Radio Aids to Marine Navigation 2026, Part 4: General**  
   https://www.canada.ca/en/canadian-coast-guard/corporate/publications/radio-aids-marine-navigation/general.html  
   Use for current Canadian marine routine-call examples, marine distress/urgency/safety signals, marine call/message structures, Ch16/distress-working-frequency context, and DSC context.

2. **ISED — RBR-2, Technical Requirements for the Operation of Mobile Stations in the Maritime Service**  
   https://www.ised-isde.canada.ca/site/spectrum-management-telecommunications/en/official-publications/information/regulations-reference-rbr/rbr-2-technical-requirements-operation-mobile-stations-maritime-service  
   Use for maritime-service regulatory/technical boundaries such as station identification and channel/frequency restrictions. Do not use it as a substitute for RAMN phraseology.

3. **ISED — Radio operator certification**  
   https://ised-isde.canada.ca/site/spectrum-management-telecommunications/en/licences-and-certificates/radio-authorizations/radio-operator-certification  
   Use to maintain the explicit certification boundary: pleasure boaters require ROC-M and commercial/international services have different certificates. Argus does not grant one.

### Tier 2 — Canadian general radio-operating guidance

4. **ISED — RIC-22, General Radio Operating Procedures, Issue 4**  
   https://ised-isde.canada.ca/site/spectrum-management-telecommunications/en/licences-and-certificates/radiocom-information-circulars-ricpagination-orphans/ric-22/ric-22-general-radio-operating-procedures  
   RIC-22 says its general information remains relevant to all radio operators. Use only for the general substrate: speech technique, ITU phonetic alphabet and pronunciations, transmission of numbers, procedural words, calling mechanics, corrections/repetitions, general message handling and high-level priority. RICs are guidance and RIC-22 itself says they have no status in law.

### Tier 3 — service-specific cross-checks, not merge sources

5. **ISED — RIC-21, Study Guide for the Restricted Operator Certificate With Aeronautical Qualification**  
   https://ised-isde.canada.ca/site/spectrum-management-telecommunications/en/official-publications/information/radiocom-information-circulars-ric/ric-21-study-guide-restricted-operator-certificate-aeronautical-qualification  
   Keep for a later aeronautical programme and as provenance for current historical content. Do not copy its aeronautical call examples/procedure into the marine module.

6. **Transport Canada aeronautical publications** may be authoritative for a later aviation lane but are not authority for marine content.

7. **Amateur-radio ISED material** belongs to a future amateur lane. It is not evidence that amateur operating convention is a marine/aeronautical universal.

### Accessibility authority

8. **W3C — WCAG 2.2, SC 1.2.1 / Understanding prerecorded audio-only content**  
   https://www.w3.org/WAI/WCAG22/Understanding/audio-only-and-video-only-prerecorded  
   Prerecorded audio needs an equivalent text alternative unless it is clearly a media alternative for existing text. Argus should therefore preserve an authoritative transcript for every speech asset. In a scored listening attempt, revealing that transcript changes what was tested and must not be banked as unaided audio evidence.

### Generated-audio tooling sources

Tool documentation is evidence about generation capability only. It is never phraseology authority.

- **Kokoro** inference library/model: https://github.com/hexgrad/kokoro and https://huggingface.co/hexgrad/Kokoro-82M
- **Piper** local TTS: https://github.com/OHF-Voice/piper1-gpl
- **eSpeak NG**: https://github.com/espeak-ng/espeak-ng
- **Web Speech API / SpeechSynthesis**: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis

## 5. Claim ledger

| Claim used by Argus | Authority | Decision |
|---|---|---|
| RIC-22 general information is intended to remain useful to all radio operators | ISED RIC-22 §§1–2 | Allows a narrow general substrate; does not authorize importing service-specific detail. |
| Priority is distress → urgency → safety → all other communications | ISED RIC-22 §3.1 | Build in Topic A; repeat in marine context with CCG source. |
| ITU alphabet and the 13 standardized number/spoken forms used by current Argus | ISED RIC-22 §4.3 | Revise existing radio-number provenance to RIC-22; preserve finite set. |
| A specific-station call uses called station → THIS IS → calling station → invitation to reply | ISED RIC-22 §§4.7–4.8 | Build as general text recall. |
| OVER expects a response; OUT ends conversation/no response expected | ISED RIC-22 Appendix A | Build. |
| CORRECTION and SAY AGAIN have distinct purposes | ISED RIC-22 §4.13 / Appendix A | Build. |
| Routine marine initial-call formats and vessel identifiers | CCG RAMN 2026 Part 4 §4.1.1 | Build marine-specific topic; do not backfill from aviation. |
| Marine MAYDAY call/message fields | CCG RAMN 2026 §4.1.2 | Build as field-order recall; explain DSC context. |
| Marine PAN PAN urgency call and meaning | CCG RAMN 2026 §4.1.3 | Build. |
| Marine SÉCURITÉ call/message and working-frequency handling | CCG RAMN 2026 §4.1.4 | Build. |
| Marine VHF operation requires an operator certificate in Canada | ISED certification guidance | State as limitation/context; Argus makes no credential claim. |
| A transcript must exist for prerecorded speech accessibility | W3C WCAG 2.2 SC 1.2.1 | Required asset/content field; transcript-assisted attempts do not prove audio listening. |
| Local TTS can generate reproducible files without a hosted API | Piper/Kokoro/eSpeak project docs | Feasible as build-time tooling only; output still requires independent content/audio QA. |

## 6. Text-only item inventory

This inventory is the proposed finite boundary for implementation. Exact prompt wording can change without changing the claim, but the item set should not silently expand during build.

### Existing: NATO/ITU phonetic alphabet — 26 items

Keep the current A–Z → code-word deck. Add radio-context/pronunciation support in Learn only if useful; do not expand its scored claim to pronunciation.

### Existing/revised: Canadian radiotelephony numbers — 13 items

Keep exactly:

- `0 → ZE-RO`
- `1 → WUN`
- `2 → TOO`
- `3 → TREE`
- `4 → FOW-er`
- `5 → FIFE`
- `6 → SIX`
- `7 → SEV-en`
- `8 → AIT`
- `9 → NIN-er`
- `Decimal → DAY-SEE-MAL`
- `Hundred → HUN-dred`
- `Thousand → TOU-SAND`

Source these to RIC-22 §4.3 for the Canadian general-radio boundary.

### Topic A: Canadian radio procedure — 15 items

**Twelve meaning items:**

1. ACKNOWLEDGE
2. AFFIRMATIVE
3. CORRECTION
4. GO AHEAD
5. NEGATIVE
6. OUT
7. OVER
8. READ BACK
9. ROGER
10. SAY AGAIN
11. STAND BY
12. WILCO

**Three structure items:**

13. Specific-station call order: called station → `THIS IS` → calling station → invitation to reply.
14. `ALL STATIONS` call order: `ALL STATIONS` → `THIS IS` → calling station → invitation to reply.
15. General message-handling sequence: call → addressee reply → message → acknowledgement/ending.

Learn support should also explain `I SAY AGAIN`, `CONFIRM`, `DISREGARD`, `MONITOR`, `VERIFY`, `WORDS TWICE` and the remaining Appendix A terms without claiming the learner completed them unless they are later deliberately added to the scored boundary.

### Topic B: Canadian marine VHF routine calling — 4 items

1. Specific-station initial marine call order from RAMN Table 4-1.
2. `ALL STATIONS` initial marine call order from RAMN Table 4-2.
3. Broadcast versus invitation-to-reply behaviour: a broadcast proceeds with its message rather than asking for a reply.
4. Published ship radio-message reference structure: originating ship → date/time originated → address → text/body → signature.

### Topic C: Canadian marine VHF priority communications — 9 items

1. Priority order: distress → urgency → safety → other.
2. MAYDAY meaning.
3. PAN PAN meaning.
4. SÉCURITÉ meaning.
5. Marine distress-call field order.
6. Marine distress-message field order.
7. Marine urgency-call field order.
8. Marine safety-call field order.
9. Marine safety-message/working-frequency rule: the call announces a working frequency and the safety message is sent there as directed by RAMN.

Long ordered answers should be rendered clearly in Learn as steps. If ordinary reveal/self-score cards make those items hard to judge honestly, implementation should use a deterministic ordering interaction rather than weakening the answer key.

## 7. Audio-drill specification

### Factual model

Every audio item needs two separate representations:

- **canonical transcript / structured tokens** — source-backed factual authority and grading basis;
- **generated waveform** — presentation material derived from the canonical script.

A TTS-friendly synthesis string or phoneme override may differ from the visible transcript to force correct pronunciation, but it is never authoritative and must never change the semantic/token sequence.

### Proposed drill types

| Drill | Learner action | First-release status |
|---|---|---|
| Phonetic/number token copy | Hear clean tokens; enter decoded letters/digits | Build |
| Proword recognition | Hear one sourced proword; choose/recall meaning | Build |
| Routine call field extraction | Hear call; identify called/calling station | Build |
| Routine call copy | Hear bounded call; transcribe/reconstruct | Build after basic audio input is proven |
| Priority signal recognition | Hear MAYDAY/PAN PAN/SÉCURITÉ; identify published meaning/priority | Build |
| Structured priority-message extraction | Hear authored training message; extract explicitly spoken fields | Build after routine-call copy is stable |
| Multiple voices | Repeat approved scripts using second QA-approved voice | Revise/later |
| Faster speech | Additional separately claimed difficulty | Defer |
| Static/RF filtering/dropouts | Degraded-channel listening | Defer |
| Spoken-response/pronunciation scoring | Microphone/ASR | Defer |

### Scoring rules

- Text recall and audio listening are separate evidence. Passing one cannot mark the other complete.
- Audio-copy normalization may ignore case and non-semantic punctuation/spacing, but never ignore a wrong letter, digit, code word, field or order that the drill claims to test.
- For structured extraction, score the requested fields deterministically rather than asking the learner to self-grade a long transcript.
- Replaying clean audio is allowed unless a future speed/one-shot claim explicitly says otherwise.
- Revealing the transcript before answering changes the attempt to **transcript-assisted practice**. It remains useful but cannot satisfy the unaided audio-listening completion claim.
- Audio failure must never prevent access to the text curriculum.

## 8. Smallest reusable Argus audio capability

Do not reuse the Morse oscillator/sidetone runtime. Morse generates timed tones and has mobile `AudioContext` lifecycle constraints that speech files do not need.

The smallest reusable speech capability is:

1. **An authored audio stimulus on a scored/practice item**
   - stable `assetId`;
   - canonical transcript or structured token source;
   - source/provenance reference;
   - declared drill kind;
   - QA status/version.
2. **A native prerecorded-audio player**
   - explicit Play/Replay control;
   - no autoplay;
   - keyboard/screen-reader-labelled controls;
   - cancellation/cleanup on navigation;
   - works from locally cached assets.
3. **Transcript state**
   - visible in Learn/reference mode;
   - available as an accessibility/practice alternative;
   - concealed during an unaided scored exposure until the learner chooses to reveal it;
   - reveal marks that attempt transcript-assisted rather than audio-qualified.
4. **Deterministic response modes**
   - choice/meaning selection;
   - short text copy with explicit normalizer;
   - small structured-field entry.
5. **Modality-specific evidence**
   - the runtime must be able to say that an item was answered from audio rather than from a revealed transcript/text card;
   - generic text completion must not be reused as proof of listening skill.

Prefer native `HTMLMediaElement`/`<audio>` playback for prerecorded speech. Web Audio processing is not needed for v1 and would add complexity without improving the completion claim.

No runtime TTS engine, microphone, speech recognition, waveform visualizer, channel simulator or bespoke radio UI is needed for the first capability.

## 9. TTS / voice-generation feasibility

### Decision: feasible at build time

Use local/free TTS as an **offline authoring tool** that emits immutable reviewed audio assets. Do not synthesize scored speech at runtime.

Build-time generation gives Argus:

- one exact waveform per approved asset;
- deterministic source/transcript pairing;
- repeatable QA and content hashes;
- offline playback after the asset is shipped/cached;
- no dependence on whatever system voice a phone happens to expose;
- no model download or inference cost in the PWA runtime.

### Candidate A — Kokoro

Current upstream library/model are Apache-licensed and can run locally. It is the leading quality candidate for a generation bake-off because it is compact for a neural model and produces more natural speech than formant synthesis.

**Use:** build-time candidate.  
**Risk:** exact handling of unusual code words, callsigns, hyphenated standardized number forms and `SÉCURITÉ` still requires script-by-script listening QA and potentially pronunciation overrides. License/model/voice provenance must be pinned in the generation manifest.

### Candidate B — Piper

Current OHF Piper is actively maintained, runs locally, can emit WAV, exposes phoneme information/alignments, and supports raw-phoneme control. That is attractive for standardized radio pronunciation.

**Use:** build-time candidate, especially if Kokoro cannot reliably control critical pronunciations.  
**Risk:** current engine is GPL-3.0-or-later and Piper explicitly warns that individual voice models can have their own restrictive licences. Any selected voice requires its model card/licence to be captured and reviewed before assets ship.

### Candidate C — eSpeak NG

Compact, deterministic and highly controllable, but intentionally less natural than neural TTS.

**Use:** pronunciation/debugging baseline or fallback for a tightly controlled prototype.  
**Do not prefer:** learner-facing production voice unless it wins intelligibility testing; naturalness matters for realistic listening practice.

### Browser `speechSynthesis`

The Web Speech API is broadly available, but the actual voices are device/browser dependent and therefore cannot give Argus one reproducible, QA-approved scored stimulus.

**Use:** optional local developer experiment only.  
**Defer:** production/scored audio.

### Required bake-off before audio production

A later implementation issue should generate a **small acceptance corpus**, not the full curriculum, with at least:

- the 26 phonetic code words;
- all 13 standardized radiotelephony-number forms;
- MAYDAY, PAN PAN and SÉCURITÉ;
- representative mixed letter/digit identifiers;
- decimals and times;
- representative vessel/station names;
- a short routine call;
- one distress-message training script.

Compare Kokoro and Piper on intelligibility, token fidelity, controllability, artifact rate, reproducibility, licence/provenance burden and mobile-speaker clarity. Pick the engine/voice only after human QA. Generated audio is never accepted because a model is generally “high quality”.

## 10. Audio asset and QA contract

### Required manifest per asset

At minimum record:

- stable asset/script id;
- owning topic/drill id;
- canonical transcript and/or canonical tokens;
- source reference(s) and source publication/version;
- synthesis string if different from transcript;
- pronunciation/phoneme overrides;
- TTS engine/version;
- model/voice id and immutable version/hash where available;
- model/voice licence/provenance note;
- generation parameters relevant to reproducibility;
- audio format/duration;
- SHA-256 of the output file;
- human QA status, reviewers/date and rejection/revision note.

### Automated QA

Fail the build/asset validation when:

- an audio file has no canonical transcript/source;
- a manifest points to a missing/unapproved asset;
- a file/hash no longer matches its approved manifest;
- an authoritative token sequence and the drill answer disagree;
- an asset is empty/corrupt or contains clipping/silence outside authored bounds;
- a production audio item has no transcript/accessibility route;
- an unreviewed generation appears in the production manifest.

Automated checks prove packaging and transcript agreement; they do **not** prove that the voice pronounced the words correctly.

### Human listening QA

Every production asset must be listened to in full. Critical standardized tokens cannot be spot-checked.

Acceptance requires:

1. canonical word/token order is complete — no omission, duplication or hallucinated expansion;
2. every code word, digit form and procedural word is intelligible and matches the intended standardized pronunciation;
3. no pause or prosody changes the apparent grouping/meaning;
4. vessel/station identifiers remain unambiguous;
5. audio is clear on both headphones and a phone speaker at ordinary volume;
6. no clipping, harsh artifact or long unintended silence;
7. the displayed transcript exactly represents the heard informational content;
8. a content reviewer confirms that the script itself matches the cited source boundary.

For the initial pack, use two independent human listens for every asset, with at least one reviewer checking against the canonical transcript while listening. Any ambiguity in a standardized token is a rejection, not a “close enough” acceptance.

### No fake realism

Do not add static, squelch, clipping, compression artifacts or a “radio voice” effect merely to make generated speech sound authentic. Such processing can corrupt the skill being measured. If a later degradation lane is built, preserve the clean master, document the transformation, QA the transformed asset separately, and state the narrower completion claim.

## 11. Transcript and accessibility requirements

- The canonical transcript is content, not optional metadata.
- Learn/reference presentation exposes the transcript normally.
- Scored listening starts with audio plus a concise task label, not the answer transcript.
- A learner can reveal/read the transcript at any time; doing so changes that attempt to practice/assisted mode and prevents it from being counted as unaided listening evidence.
- A non-audio route must preserve access to the same factual curriculum for users who cannot use audio. It can satisfy the text topic, but must not falsely award the audio-listening claim.
- Play, Replay, transcript reveal and response controls must be keyboard-operable and have programmatic labels/states.
- No information needed to understand the curriculum may exist only in the waveform.
- Do not use audio autoplay.

This separates accessibility from claim inflation: Argus can provide the information in text while still being honest that an auditory test was not completed unaided.

## 12. Offline and packaging requirements

Issue #113 already establishes offline-first direction and says not to add per-library download controls until real media size warrants them.

For #139:

- generate speech before release;
- ship/cache the first bounded audio pack as static application media if its measured size is modest;
- record asset byte size so the offline work can make a real threshold decision;
- do not require network TTS or streaming for a scored drill;
- if later audio libraries become materially large, integrate them with the future content-pack abstraction from #113 instead of inventing a radio-specific downloader.

## 13. Product/engineering implications

### Existing architecture that can be reused

- structured Learn blocks for definitions, steps, tables and limitations;
- existing finite text `items` for simple meaning/order recall;
- ordinary topic provenance/source display;
- text completion/retention for the text-only topics.

### Architecture that must not be reused blindly

- Morse Web Audio/sidetone: it solves generated timing/tone input, not prerecorded speech;
- generic text item evidence as proof of audio listening;
- long reveal/self-score cards where a deterministic structured answer can be checked objectively.

### Likely minimal schema/runtime addition

The implementation should prefer one reusable **audio stimulus + response mode** extension over a `marine-radio` special case. A concrete type is an implementation decision, but it needs to represent at least:

- audio asset id;
- canonical transcript/tokens;
- drill kind;
- deterministic expected response;
- transcript-revealed/assisted state;
- modality-specific evidence.

The first UI can be a plain prompt, Play/Replay, response control and transcript/review area. No simulator/dashboard/waveform is justified.

## 14. Risks and open questions

1. **RIC-22 age:** Issue 4 is old and explicitly guidance, not law. Keep it to claims the current ISED page still publishes as general guidance; use current service publications for service-specific behaviour.
2. **Marine safety content:** emergency procedure is high consequence. The scored boundary must remain memory of published definitions/structure, with explicit limits. Do not convert Argus into an emergency decision engine.
3. **Long sequence cards:** current self-score Test may be too weak for long message structures. Prefer a small deterministic ordering/field interaction if implementation shows self-grading is ambiguous.
4. **TTS pronunciation:** natural voices may mishandle code words, spelled identifiers, hyphenated pronunciations or French-derived `SÉCURITÉ`. The bake-off and per-asset listening QA are release gates.
5. **Voice licensing:** local/free engine does not mean every voice/model is safe to redistribute or use to generate distributable assets without review. Capture the exact terms for the selected model/voice.
6. **Accent variability:** one clean synthetic voice only proves performance against that bounded voice. Do not claim general radio listening until multiple independently QA-approved voices/conditions have their own evidence.
7. **Transcript accessibility versus scoring:** the transcript must exist, but transcript-assisted attempts cannot be counted as unaided auditory evidence.

## 15. Bounded implementation handoffs

Open implementation work only after this research lands. Keep these as separate issues so content, runtime and audio-asset QA can be reviewed independently.

### Handoff A — revise existing communications prerequisites

**Own:**

- change `radiotelephony-numbers` source/provenance from RIC-21-only framing to the identical RIC-22 general-radio source;
- consider learner-facing title `Canadian radiotelephony numbers`;
- add RIC-22 radio application/pronunciation support to the existing phonetic-alphabet Learn material if useful;
- preserve existing finite item counts and historical completion semantics.

**Do not own:** new marine topics or audio.

### Handoff B — build the text-only radio programme

**Own:**

- Topic A: Canadian radio procedure core;
- Topic B: Canadian marine VHF routine calling;
- Topic C: Canadian marine VHF priority communications;
- authoritative Learn support, sources, limitations and exact finite item inventory from this note;
- deterministic ordering interaction only if needed for honest grading.

**Do not own:** production speech assets, TTS runtime, microphone/ASR, aviation/amateur content.

### Handoff C — reusable prerecorded-audio drill primitive

**Own:**

- generic audio-stimulus content contract;
- native Play/Replay UI;
- transcript/accessibility path;
- transcript-assisted state;
- short text / choice / structured-field response modes needed by the first radio drills;
- modality-specific evidence so text cannot qualify audio;
- offline/static-asset behaviour and tests.

**Do not own:** Morse audio refactor, runtime TTS or content-specific radio simulation.

### Handoff D — TTS bake-off and audio asset pipeline

**Own:**

- acceptance corpus;
- Kokoro vs Piper evaluation;
- generation manifest and immutable hashing;
- selected engine/voice licence/provenance capture;
- automated packaging QA;
- human listening-QA workflow.

**Deliver:** approved generation method and a small set of QA fixtures, not the full curriculum.

### Handoff E — first marine audio drill pack

Only after C and D land.

**Own:**

- clean single-voice token, proword, routine-call and priority-signal drills;
- canonical transcripts and source links;
- deterministic answer keys;
- full human listening QA;
- exact clean-audio completion claim.

**Defer from this handoff:** second voice, speed ladder, noise/RF effects, live transmission, microphone/ASR, aeronautical/amateur content.

## 16. Final disposition

### Build

- Canadian general radio core, bounded strictly to RIC-22's published general guidance.
- Canadian marine VHF routine calling and priority communications, bounded to CCG RAMN 2026.
- A reusable prerecorded-audio stimulus/drill capability.
- Clean, generated-at-build-time audio drills after the capability and QA pipeline are independently implemented.

### Revise

- `radiotelephony-numbers` provenance/title framing so the current 13 items rest on RIC-22's general Canadian-radio source rather than being implicitly aeronautical.
- phonetic-alphabet Learn provenance/context where needed, without changing its current text completion claim.

### Defer

- aeronautical and amateur procedure to separate research/programmes;
- DSC/GMDSS equipment operation and broad channel/frequency study;
- multi-voice and speed/degraded-channel ladders until clean audio is validated;
- runtime TTS, speech recognition, microphone scoring and simulated radio effects.

### Exclude

- tactical/military communications training;
- any implication that Argus completion is an ROC-M, ROC-MC, ROC-A, amateur certificate, licence or substitute for required training/examination.

#139 has therefore met its research gate: it establishes a real service boundary, finite text programme, honest audio claim, viable local-generation path, QA/accessibility contract and bounded implementation sequence without producing implementation or production audio.