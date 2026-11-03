# #324 — Staged communications curricula: authored-content review pack

**Status:** Draft for owner approval and independent domain review; **not registered in the app**.  
**Owned by:** #324. **Shared framework / Radio Procedure pilot:** #296, especially PR #304.  
**Marine content authority:** #150, its [maintained programme](ISSUE_150_RADIO_TEXT_PROGRAMME.md) and [independent review worksheet](ISSUE_150_HUMAN_REVIEW.md).  
**Authored data:** [communicationsCurricula.ts](../../src/domain/radio/communicationsCurricula.ts).  
**Deterministic review tests:** [communicationsCurricula.test.ts](../../src/domain/radio/communicationsCurricula.test.ts).

## 1. Delivery boundary

This is a review-only, **unregistered** authored curricula package for four existing topics. It defines small teaching steps, stable IDs, exact formative keys and targeted correction copy without modifying production screens, shared routing, storage, lesson schema or the general Radio Procedure pilot. The four exported objects are intentionally absent from the shared \`AUTHORED\` registry. **Do not wire them in until 390px designs are approved and the source-bound marine material has passed #150's independent review.** Run and record actual checks before release.

| Topic | Existing ID | Existing scored items | Draft stages | Scored Test preserved |
| --- | --- | ---: | ---: | --- |
| NATO Alphabet | \`nato-phonetic\` | 26 | 6 | Letter → official code word |
| Radio Numbers | \`radiotelephony-numbers\` | 13 | 5 | Printed token → Canadian printed spoken form |
| Marine Calling | \`marine-vhf-routine-calling\` | 4 | 4 | Three call/message structures and one broadcast rule |
| Marine Priority Calls | \`marine-vhf-priority-communications\` | 9 | 6 | Priority, three meanings, four call/message structures and working-frequency rule |

No item IDs, scored answers, Test denominator, historic Test records, earned completions, roles or past listening records are changed. The new source-backed composition/order tasks are **formative**; they are not secretly added to the scored Test.

### Coordination, dependencies and exclusions

- **#296** owns \`src/domain/learning/stages.ts\`, \`generatedCurriculum.ts\`, StageRunner, persistence, routing, Test/Reference navigation and Radio Procedure's RIC-22 pilot. This work **uses** its existing \`show\`, \`choose\`, \`contrast\`, \`complete\`, \`order\`, \`checkpoint\`, \`summary\` definitions, without editing them. No second interaction engine or \`radio-procedure\` content is introduced here.
- **#150** is the domain acceptance gate. Its existing 4 and 9 marine item-answer pairs are the fixed source of truth in \`radioTopics.ts\`; the new explanations/choice distractors and their unique-answer assumptions require an **independent qualified Canadian marine-radio reviewer**, including a check of the edition and all conditionals.
- **#151** exclusively owns prerecorded audio and human-listened asset QA. Nothing here claims vocal performance, listening recognition, tone, accuracy of synthesized pronunciation, a radio playback engine or microphone testing.
- **#113** owns persistent storage account isolation. No migration or change in \`stageProgress\` format is included. **#233** owns real-device visual/accessibility acceptance.
- No DSC/GMDSS operation, emergency diagnosis, priority choice for invented accidents, channel selection, operational MAYDAY drill, ROC-M certificate-readiness or permission-to-transmit claims. No RIC-22/general or aviation procedure is treated as marine-specific authority.

## 2. Controlling sources and exact differences

| Subject | Controlling reference | Instructional consequence / review check |
| --- | --- | --- |
| NATO spelling | [NATO phonetic alphabet](https://www.nato.int/en/about-us/nato-history/history-by-theme/symbols-of-nato/nato-phonetic-alphabet); also [ISED RIC-22 §4.3](https://ised-isde.canada.ca/site/spectrum-management-telecommunications/en/licences-and-certificates/radiocom-information-circulars-ricpagination-orphans/ric-22/ric-22-general-radio-operating-procedures) | Exact 26 written forms; especially **Alfa**, **Juliett**. |
| Canadian number printed forms | **RIC-22 Issue 4, January 2008, §4.3**, cross-check RIC-21 §5.3 | Preserve \`TREE\`, \`FIFE\`, \`NIN-er\`, \`FOW-er\`, \`DAY-SEE-MAL\` and all 13 spellings as printed. RIC-22 §4.4 supports supplementary *written* digit-group examples, but grouping is not part of the existing formal score. RIC-22 says it has no status in law. |
| Marine routine | [CCG *Radio Aids to Marine Navigation 2026*, Part 4 §4.1.1.2, Tables 4-1–4-4](https://www.canada.ca/en/canadian-coast-guard/corporate/publications/radio-aids-marine-navigation/general.html) | RAMN calls for the station name/group and vessel identification to be spoken **three times**. RIC-22's general “not more than three times” does **not** override marine wording. |
| Marine broadcast | RAMN §4.1.1.2, paragraph following Table 4-2 | If sending a broadcast rather than establishing a contact, **proceed with the message** instead of giving an invitation to reply. Do **not** assert that this paragraph universally prescribes an \`OUT\` ending. RAMN separately defines \`OUT\`; the production scored item asks about proceeding to the message, not a mandatory sign-off. |
| Marine phonetic table | RAMN §4.1.1.3 vs NATO/RIC-22 §4.3 | The marine RAMN table prints **Juliet**, whereas the **NATO Alphabet** item's source and stored key are **Juliett**. Leave the NATO Test key unchanged; flag the publication spelling distinction in the NATO J correction, and ask the #150 reviewer to confirm display conventions for any later marine alphabet content. |
| Marine distress | RAMN §4.1.2, especially §4.1.2.3 | Distinguish the repeated **call** from the subsequent **message**. The message field order is the §4.1.2.3 list. Figure 4-1's condensed quick reference additionally mentions persons aboard; do not silently treat that illustration as an extra separately scored mandatory field. |
| Marine urgency | RAMN §4.1.3 | Preserve both \`ALL STATIONS\` and the option to address a specific station. Only the **call** is an ordered existing score; do not import a RIC-22 urgency-message field list. |
| Marine safety | RAMN §4.1.4 | Safety **call** declares a brief message, announces a working frequency/channel, and ends \`OUT\`; the **separate message** is on that announced working frequency. Do not teach a specific channel-choice rule from the distractors. |
| Marine priority meanings | RAMN Figure 4-1; RIC-22 §3.1 for general four-tier priority order | MAYDAY = distress, PAN PAN = urgency, SÉCURITÉ = navigational or meteorological safety warning; MAYDAY RELAY is a meaning distractor, not a fourth priority type. Definitions, not scenario judgement. |
| Conditional MMSI | RAMN §§4.1.2.3, 4.1.3, 4.1.4 | Include MMSI **if** a relevant DSC distress alert / urgency announcement / safety announcement was sent. Never imply DSC alert is mandatory for all spoken calls. |

**Source-version policy:** The saved topic keys and authored content are pinned to the named RIC-22 Issue 4 and RAMN 2026 edition, not to unbounded “current Canadian practice.” A later edition requires a new source-diff/review before changing instructional answers. External citations are source locators, **not** evidence of human sign-off.

## 3. Lesson-by-lesson authored sequence

Every packet follows **introduce → recall/apply → targeted error correction → limited checkpoint → continue**, with no perfect-score gate. The four-stage/six-stage marine teaching includes deliberately small source-bound sequences rather than four whole nine-field text options. All stage IDs are stable, distinct from default \`lesson-N\`, and each step has its own stable ID.

### NATO Alphabet — 26 letter-to-word keys

| Stage ID | Title | New letters | Interaction and difficult contrasts |
| --- | --- | --- | --- |
| \`nato-a-e\` | Letters A–E | A–E | Show exact code words, four-option recall; **Alfa**, not Alpha. |
| \`nato-f-j\` | Letters F–J | F–J | Immediate recall, J **Juliett** vs marine-table Juliet. |
| \`nato-k-n\` | Letters K–N | K–N | Mixed recall with one earlier letter. |
| \`nato-o-r\` | Letters O–R | O–R | Mix visually similar letter/code-word pairs. |
| \`nato-s-v\` | Letters S–V | S–V | Revisit the preceding packet. |
| \`nato-w-z\` | Letters W–Z | W–Z | 26-mapping completion; checkpoint retains one previous item. |

Each stage uses code-word show/choose pairs, one bounded fill-the-word pair from the **same packet**, and a checkpoint. Answer keys are the existing 26 \`catalogSeed.ts\` mappings. Exercise variation is between letter→word multiple choice, fill-one-pair and prior-item mixed recall, **not** the unapproved reverse Test direction or code-word hearing. Sample correction: *“The published NATO/ITU form is Juliett. The Canadian Coast Guard marine table prints Juliet; this NATO key uses NATO's spelling.”* No TTS is used or validated.

### Radio Numbers — 13 printed forms

| Stage ID | Title | New scored tokens | Interactions |
| --- | --- | --- | --- |
| \`numbers-zero-three\` | 0–3 | 0/1/2/3 | Printed-form recognition, especially **3 → TREE** (not THREE). |
| \`numbers-four-six\` | 4–6 | 4/5/6 | **5 → FIFE** (not FIVE); mix one earlier token. |
| \`numbers-seven-nine\` | 7–9 | 7/8/9 | **9 → NIN-er**, not NINE/NINER. |
| \`numbers-markers\` | Number Markers | Decimal/Hundred/Thousand | Distinguish \`DAY-SEE-MAL\`, \`HUN-dred\`, \`TOU-SAND\`. |
| \`numbers-written-groups\` | Written Groups | Review only | Short *visible text* fill-gaps: TREE, FIFE and decimal; optional context from RIC-22 §4.4. |

Question: “Which **printed RIC-22 form** belongs to 5?” Correct: \`FIFE\`; wrong \`FIVE\` gets: *“RIC-22 §4.3 prints 5 as FIFE. This only checks the printed form; it is not a listening result.”* Do not equate seeing “NIN-er” with recognizing that word on the air. Radio Numbers' 13-item Test remains printed-token→printed-form only, independent of optional #151 recordings.

### Marine Calling — four RAMN-scored structures

| Stage ID | Title | Original item | Source-tied exercise and correction |
| --- | --- | --- | --- |
| \`marine-specific-station\` | Specific Station | \`...item-01\` | Tap **called station ×3 / THIS IS / vessel type, name, call sign ×3 / OVER**. Missing-\`THIS IS\` exercise; error names which identity is being introduced. RAMN Table 4-1. |
| \`marine-all-stations\` | All Stations | \`...item-02\` | Order **ALL STATIONS ×3 / THIS IS / vessel identity ×3 / OVER**. Contrast specific vs group addressee; RAMN Table 4-2. |
| \`marine-broadcast\` | Broadcast Or Reply | \`...item-03\` | Choose to **proceed with message instead of inviting reply**; short fill-the-next-field. Explicitly **not** universal \`OUT\` claim. RAMN §4.1.1.2. |
| \`marine-ship-message\` | Ship Message | \`...item-04\` | Order **originating ship / date-time / address / text / signature**; missing third field. Explain preamble vs address. RAMN §4.1.1.2. |

For order feedback, show one corrected field pair rather than a dense wrong full transcript. Example: *“You put THIS IS before the called station. RAMN starts with the addressed station repeated three times, then THIS IS, then your vessel.”* Feedback must be relative to the learner's wrong order. The static authored \`explain\` is the source-safe default; wiring field-diff UI and exact first-error detection is owned by #296 and requires separate review.

### Marine Priority Calls — nine source-defined items

| Stage ID | Title | Original scored items | Source-tied sequence |
| --- | --- | --- | --- |
| \`priority-signal-meanings\` | Priority And Meaning | 01–04 | Order distress→urgency→safety→other; choose MAYDAY, PAN PAN, SÉCURITÉ meanings using only four published Figure 4-1 meanings. No “which emergency deserves…” scenarios. |
| \`priority-distress-call\` | Distress Call | 05 | Order **MAYDAY ×3 / THIS IS / ship name ×3 / ID / conditional MMSI**. Fill condition: *if a DSC distress alert was sent*. |
| \`priority-distress-message\` | Distress Message | 06 | Construct opening four fields, then position→nature→assistance→other useful information→OVER. Two short tap-to-order exercises combine exactly to the stored 9-field key; checkpoint compares call vs message. |
| \`priority-urgency-call\` | Urgency Call | 07 | Order PAN PAN×3 / addressee×3 / THIS IS / station name×3 / ID / conditional MMSI. Compare distress/urgency addressee field. |
| \`priority-safety-call\` | Safety Call | 08–09 | Construct opening five and final four fields separately; explain brief warning, announced working frequency and OUT. Choose the separately transmitted safety message's frequency. |
| \`priority-structure-review\` | Structure Review | Review 01–09 | Contrast safety vs urgency vs distress meanings; final formative mixed checkpoint. |

Important correction cases, requiring human review of phrasing:

- **MMSI:** *“The field is conditional on an earlier DSC announcement; it is not required for every voice distress/urgency/safety call.”*
- **Distress call vs message:** *“The initial call repeats MAYDAY three times. The subsequent message begins MAYDAY once and supplies position and assistance information.”*
- **Safety call vs message:** *“The call announces where the safety broadcast follows and ends OUT. The full safety message is sent on that announced working frequency.”*
- **Position vs nature:** *“RAMN §4.1.2.3 lists position before nature of distress; assistance needed follows nature.”*
- **Quick-reference card:** *“Figure 4-1 includes persons aboard as an important detail; the keyed full field order follows §4.1.2.3.”* This is a publication-structure note, **not** advice to omit safety-critical information.

## 4. Deterministic answer/evidence contract

- Every \`choose\` answer is exactly the existing scored key (verified by the fixture assertions); no alternate exact-string answer is accepted silently. \`order\` blocks correspond to original RAMN field order; long nine-field sequences are split into groups of at most eight, without changing the concatenated source order.
- \`complete\` exercises are independent short fragments. They are reviewed as formative examples and **do not** add separate Test items. \`contrast\` chooses between known item IDs, not unsourced procedural variants.
- After a miss, display the correct answer, one source-specific reason and a brief retry opportunity without changing the learner's Test history, \`itemEvidence\`, \`audioEvidence\` or earned completion. No streak, timer, lives, mandatory practice, written exam gate or forced repeated stage passes.
- Completing each required stage once permanently satisfies that staged-learning route; **a clean original Test may also complete the topic** per #296's approved test-out behaviour. The Final Test remains optional and its saved score separate. Prior completed learners remain completed and can replay. Progress migration, \`stageProgress\` writing, account isolation and historical compatibility are #296/#113 responsibilities and **not implemented here**.
- Currently generated curricula have IDs \`lesson-N\`. Authored \`nato-...\` / \`marine-...\` IDs must not silently erase partially completed generated progress when made live. Before registry insertion, owner/framework team must choose a migration/reconciliation rule and test legacy completed users and learners who already began generic lessons.
- No run-time TTS, audio \`src\`, recording asset, listening assessment or transcript-display condition is part of these exports. Future #151 assets must independently meet provenance/licence/transcript/human listening checks and preserve separate evidence.

## 5. 390px interaction mockups — proposed, not approved

See [static phone frames](assets/ISSUE_324_COMMUNICATIONS_MOCKUPS.html). **These are standalone review artefacts, not production UI.** They display four mobile states on a 390px canvas: NATO recall, Radio Numbers error, Marine Calling field order, and Marine Priority conditional-MMSI correction. No new design system, click handler, CSS import or framework ownership is implied.

Required review dimensions: 390px primary; 320px min; short landscape; 200% text; 44px+ taps; TalkBack/keyboard/visible focus; reduced-motion; offline; long strings must wrap and never truncate meaning. In production, a learner must be able to select/reorder source-defined fields without drag. Error feedback names the wrong field/function, not just “Try again.” No voice/play button is to be displayed until #151 assets pass their independent gate. Owner must approve exact visual treatment before an implementation PR.

## 6. Reviewer acceptance and evidence

**Automated content assertions authored in this PR** (not a substitute for executing them or human review):

- Four original topic IDs, denominators and every scored item coverage; no duplicate lesson or step IDs, stage and tap-order maximum constraints.
- Every \`choose\` key equals its original scored answer; distractors are distinct; complete/mixed steps are intentionally formative.
- NATO \`Alfa\` and \`Juliett\`; exact 13 RIC-22 tokens; RAMN three-times pattern; RAMN call/message ordering; distress/safety long-list chunk concatenation.
- Conditional MMSI for distress and urgency, safety working-frequency item, no audio claims or operational scenario scoring.

**Must be recorded before any user-facing release**:

- [ ] #150 qualified independent reviewer marks marine item 01–04 and 01–09 and **all new prose, conditional options and formatively keyed fragments** P/C/U against CCG RAMN 2026. Resolve all C/U before production wiring. Retain source-edition identifiers and reviewer/date/qualification.
- [ ] Owner approves actual 390px mockup and interaction details (not inferred from another topic's approval).
- [ ] A developer runs focused Vitest, \`npm run check\`, the existing radio Playwright specs, 320/390px/a11y screenshots, and records exact commit and results. This document **does not claim those commands have passed**.
- [ ] #296 owner approves a no-history-loss transition from existing generated \`lesson-N\` into authored stage IDs; Test-out and prior Learned remain intact.
- [ ] #151 remains separate for production speech, voice licence, transcripts and human listening QA. No audio result may be inferred from text.
- [ ] Integrate **one topic at a time**, in separate focused production PRs after review. This combined draft exists only to give the owner and reviewer one coherent **content/spec** package.

**Review posture:** source locators and fixed answer-key comparisons are prepared; independent human domain sign-off, mobile owner approval, full CI and real-device acceptance are **pending**. No merge/production readiness is claimed.
