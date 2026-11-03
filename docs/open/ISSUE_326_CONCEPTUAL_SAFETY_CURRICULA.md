# #326 — Guided conceptual learning and source-bounded safety mnemonics

**Status:** content/spec review; OODA extension implemented in its own existing authored data file; Primary Survey and Firearm Safety are **specifications only, not registered or playable authored curricula**.  
**Owner approval:** 390 px mockups are proposals, not UI approval. No shared runner, registry, route, persistence or scored bank is changed.  
**Issue:** [#326](https://github.com/BenWassa/argus/issues/326) · **Dependencies:** [#296](https://github.com/BenWassa/argus/issues/296), [#320](https://github.com/BenWassa/argus/issues/320), [#276](https://github.com/BenWassa/argus/issues/276), [#113](https://github.com/BenWassa/argus/issues/113).

## 1. Answerability contract (must be visible to learner)

| Topic / stable id | Existing formal Test proves | Formative Learn may teach | Must **not** conclude |
| --- | --- | --- | --- |
| OODA / ooda-loop | Four ordered name/function pairs (items 01–04) | Observe vs Orient, Decide vs Act, sequence, feedback; one fictional service-incident illustration | That the learner can make better or faster decisions, diagnose incidents, or apply military strategy |
| Primary Survey / primary-survey | Five headings in order (items 01–05) | ABCDE letters, ordered labels and (after qualified review only) heading-level descriptors | Clinical assessment, triage, diagnosis, treatment, emergency response or first-aid certification |
| Firearm Safety / firearm-safety-acts-prove | Nine printed ACTS/PROVE statements in the 2014 handbook's order (items 01–09) | Source-pinned acronym-to-text matching, printed-rule ordering, independent textual recall | Safe firearm handling, verifying an actual firearm, loading/unloading, operating an action, licensing or CFSC completion |

**No transfer of evidence.** Formative attempts do not create Test results, competency badges, pass scores or new certification claims. Completing each required lesson once satisfies its learning progression; mistakes may be corrected immediately without a timer, minimum streak or required repeat. The independently scored original 4/5/9-item Final Test remains optional after the course. Already-completed learners retain historical dates, evidence, item ids and roles, even if a revised curriculum adds stages.

**No improvised quizzes.** Every prompt, expected answer, distinction and correction below is authored. In particular, do not use generic choice distractors for clinical intervention or hands-on firearm handling.

## 2. OODA Loop — implemented first, as the conceptual teaching example

**Live baseline:** Two pre-existing stages named 'the-four-stages' and 'how-they-connect' already ask the four scored pairs, rebuild Observe / Orient / Decide / Act, and explain the hypothesis/test/feedback relationship. The current PR preserves these stage IDs and original step IDs and adds two stages; it does not reword the four original scored answers or adjust the Test denominator.

| Stage | Recall/action | Deterministic key | Specific corrective feedback |
| --- | --- | --- | --- |
| 1. The Four Stages (existing) | Introduce and recognize four labels, then tap four blocks in order | Observe → Orient → Decide → Act | Observe gathers information; Orient interprets it; Decide selects a hypothesis; Act carries it out as a test |
| 2. How They Connect (existing) | Complete 'decision is a ___'; 'result of acting is new ___'; identify contextual interpretation | hypothesis; information; Orient | A decision is a hypothesis, not proof; action produces information that informs later observation/orientation |
| 3. Seeing vs Interpreting (new) | Identify 'dashboard shows an error increase'; 'team interprets the trend using context'; choose a statement that is inference rather than observation | Observe; Orient; 'A dependency change may be causing the errors.' | An observed measurement does not independently establish a cause. Contextual interpretation belongs to Orient |
| 4. Test and Re-observe (new) | Distinguish selecting a proposed fix from executing its test; interpret partial improvement; reconstruct four names | Decide; Act; 'It feeds new observation and orientation.'; Observe→Orient→Decide→Act | The result is new information, not proof that the initial explanation is complete; Boyd's sketch includes cross-stage feedback and implicit guidance |

**Case limit:** This is the existing *fictional software-service incident* in catalogSeed. It is not a medical, tactical or firearm scenario. The four arrows are a useful recall sequence, **not** a strict stopping-and-starting algorithm or guarantee of success. The inference question is an illustration within Learn, not a new graded scenario Test.

**Authoritative trace:** Existing scored answers and incident text in [catalogSeed.ts](../../src/domain/library/catalogSeed.ts), plus [Boyd, *A Discourse on Winning and Losing*, Air University Press](https://www.airuniversity.af.edu/AUPress/Display/Article/1528758/a-discourse-on-winning-and-losing/) and [Canadian DND's explanation of the detailed OODA sketch](https://www.canada.ca/en/department-national-defence/maple-leaf/defence/2023/11/ooda-loop-halfbeat.html). The new concept questions use only these existing distinctions.

**Fixture rule:** Each of the four item IDs (ooda-loop-item-01 through -04) remains present; new question and stage IDs are unique and semantic. Failure explains the missed distinction and permits a short local retry, never marking a Test failure. Stage 3/4 do not add scored items.

## 3. Primary Survey — proposed lesson script, blocked pending qualified medical review

**Authority:** [Resuscitation Council UK, ABCDE Approach (updated July 2024)](https://www.resus.org.uk/library/abcde-approach); [Resuscitation Council UK, First Aid Guidelines (published October 2025)](https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/first-aid-guidelines). Canonical item IDs and spellings: primary-survey-item-01 through -05 in catalogSeed.ts. Only the A–E **heading names and order** are eligible for current authoring; do not use the source's clinical instruction sections as practice prompts.

| Planned stage ID / title | Small lesson, then exact formative question | Answer | Wrong-answer explanation |
| --- | --- | --- | --- |
| abcde-airway-breathing / A and B | Show 'A — Airway', 'B — Breathing' one at a time. Ask 'Which heading belongs to A?' and 'Which comes directly after Airway?' | Airway; Breathing | A names Airway. B names Breathing; this mnemonic describes an assessment order, not a treatment instruction |
| abcde-circulation / Add C | Reveal the third letter only after recall of A/B. Ask 'Which heading does C stand for?' | Circulation | C is Circulation, third after Airway and Breathing. No clinical conclusion follows from naming it |
| abcde-disability-exposure / D and E | Show 'D — Disability', 'E — Exposure'. Ask each initial, without patient observations | Disability; Exposure | D means Disability; E means Exposure. Do not infer diagnosis or treatment from a label |
| abcde-reconstruct / Build ABCDE | Tap-to-order five full heading names (not an emergency action simulation) | Airway → Breathing → Circulation → Disability → Exposure | Highlight the first misplaced label and show the canonical five-heading mnemonic |
| abcde-mixed-recall / Mix the Headings | Five fixed letter-to-heading tiles using the seed answers; source and limitation reappear before stage completion | A=Airway, B=Breathing, C=Circulation, D=Disability, E=Exposure | Show the correctly paired heading and its position; link back to the relevant first stage |

**Do not add yet:** Questions about symptoms, airway interventions, medication, CPR, pulse values, urgent prioritization, clinical judgement, treatment sequencing, or 'what would you do?' scenarios. Even choosing a heading from a patient observation is explicitly **review-gated** rather than implicitly approved by the mnemonic source. The source discusses clinical management, but this course does not teach it.

**Learner-visible limit (first and last stages):** 'ABCDE here is a memory aid for the five assessment headings. It does not teach first aid, clinical examination or emergency treatment. For real emergencies, seek appropriate help and follow your training and local guidance.'

**Future independent content PR gate:** qualified clinical/first-aid reviewer confirms exact canonical headings, stage-by-stage prompts and exclusions, localized warning, and any proposed illustration; owner approves mobile mock and wording. Registration of an authored curriculum is a separate reviewed change.

## 4. Firearm Safety — proposed text-only lesson script, blocked pending qualified safety/doctrine review

**Authority is versioned:** The current scored bank uses the [RCMP Canadian Firearms Safety Course Student Handbook, 5th ed. (2014)](https://publications.gc.ca/collections/collection_2015/grc-rcmp/PS99-2-2-1-2014-eng.pdf), ACTS p. 21 and PROVE Table 4 p. 50. Item IDs firearm-safety-acts-prove-item-01 through -09 in catalogSeed.ts are the **single exact source of display text and answer keys**. The [RCMP's 2025 Commissioner report](https://rcmp.ca/en/corporate-information/publications-and-manuals/2025-commissioner-firearms-report) announces a new national course-material rollout in 2026; neither a replacement mnemonic nor jurisdictional adoption is assumed here. The [RCMP safety-course page](https://rcmp.ca/en/firearms/firearms-safety-training-transport-and-storage/safety-courses) requires in-person course instruction with written and practical testing.

| Planned stage ID / title | Source-bound printed-rule exercise | Key and corrective feedback |
| --- | --- | --- |
| acts-assume-control / ACTS: A and C | Show seed items 01, 02. Display A/C initials and ask the learner to match them to their two **printed** statements | A=item 01; C=item 02. Correction reprints the canonical statement, identifying the mixed-up initial. No physical gesture or direction-selection prompt |
| acts-trigger-see / ACTS: T and S | Show items 03, 04; match letter to the canonical statement; rebuild ACTS as initials | T=item 03; S=item 04; A-C-T-S. Correction notes that S references PROVE in the printed mnemonic. No operation or trigger interaction |
| prove-first-three / PROVE: P, R, O | Show source sentences for items 05–07 in turn; select the missing mnemonic letter from text-only tiles | P=item 05; R=item 06; O=item 07. Feedback displays the original answer string only, without adding handling instructions |
| prove-last-two / PROVE: V, E | Show source sentences for items 08–09; select the paired initial and order the letters P-R-O-V-E | V=item 08; E=item 09; P-R-O-V-E. No chamber animation, hands-on technique or component manipulation |
| acts-prove-written-recall / Two Printed Sequences | Two separate text-only group reconstructions (ACTS and PROVE); mixed A/C/T/S and P/R/O/V/E-to-seed-statement matching, with explicit source edition | Keep the original nine items and two group boundaries. An incorrect response reveals the canonical source sentence, not a simulated procedure |

**Potential misconception card, not approved or enabled:** A printed sentence claims that somebody else's assurance alone establishes firearm safety. The proposed corrective *text* is 'An assertion is not a substitute for the handbook's rules.' This card is **not** permission to demonstrate handling or ask the learner to choose practical next steps. Obtain domain reviewer sign-off if it is later used.

**Forbidden content:** Clicking or positioning a gun, chamber/magazine inspection simulations, selecting handling techniques or mechanical action variants, loading/unloading walkthroughs, troubleshooting, range/tactical scenarios, or any practical pass/certification. Even when the mnemonic itself contains verbs, the exercise only evaluates **printed text recognition**.

**Learner-visible limit (first and last stages):** 'This is recall of nine printed statements from the 2014 CFSC handbook, not firearm-handling instruction, safety certification, the CFSC, its tests or a licence. Follow current certified instruction for practical safety.'

**Future independent content PR gate:** RCMP/CFP current curriculum and version verified for target jurisdiction; knowledgeable CFSC reviewer confirms exact words, no misleading safety implications, display warning and review of every distractor; owner approves mobile mock. Only then author/register safety data in its own PR. Do not silently update the historical scored item strings or rename saved evidence.

## 5. 390 px interactions — proposed visual direction, not an approved UI build

[Three side-by-side 390 px static mobile screens](./mockups/issue-326-lesson-states.svg) depict:
1. **OODA:** an Observe-vs-Orient four-tile question; concise explanation appears after an incorrect answer.
2. **ABCDE:** tap-to-order five text labels with 'first misplaced heading' feedback; no patient picture or treatment options.
3. **ACTS/PROVE:** a two-column printed-rule comparison with the 2014 source edition; no firearm imagery, equipment controls, audio or handling simulation.

Interaction states are illustrative. Current shared runner capabilities may not support first-mismatch highlighting or the proposed grouped layout; #296 owns any such primitive or runner changes. Do not modify shared components or call this owner approval. Static SVG uses 390 px artboards, the Signal-on-Slate palette, 44 px-or-larger controls, and no hidden keyboard or mandatory drag operation.

**Accessibility/QA before implementation:** verify layouts at 320 px, 390 px, landscape and 200% text; ordered selection must have tap alternatives, accessible numbered labels, announced selection/incorrect-position text and a visible reset/undo. Check focus order and source/limitation persistence with a screen reader. Reduced-motion and offline/Pixel checks require real implementation; a static mock cannot pass them.

## 6. Acceptance, ownership and sequencing

- **This PR:** OODA's two existing stage IDs and all four scored item IDs retained; two additional authored stages + deterministic tests; no scope/certification claim, framework or Test changes. Safety topics are review-ready scripts **only**.
- **After owner visual approval:** #296 can implement any missing shared UI primitives. Do not duplicate them here.
- **Separate Primary Survey PR:** clinical review recorded; all five source-bound keys covered by staged recall; no medical scenarios or practice-competency claims.
- **Separate Firearm Safety PR:** current-course provenance and qualified CFSC review recorded; all nine source-bound keys covered only by printed-rule interactions.
- **Regression gate:** no historical Test/role/completion migration, original item IDs and denominators unchanged, no mandatory final Test, no generic Practice tile reintroduction, no audio claims or simulated real-world work.
- **Evidence status:** static authoring/spec and repository tests are not owner approval, clinical sign-off, CFSC sign-off, accessibility acceptance or Pixel verification.

## 7. Source and review register (checked 2026-11-03)

| Subject | Controlling source in seed | Reviewed now | Status |
| --- | --- | --- | --- |
| OODA | Air University Press, Boyd, *A Discourse on Winning and Losing*; existing case in catalogSeed.ts | Air University catalogue; Canadian DND explanation of feedback and non-linearity | Suitable for non-safety conceptual Learn, original four-item Test unchanged |
| Primary Survey | Resuscitation Council UK, ABCDE approach (July 2024); first aid guidelines (October 2025) | Resuscitation Council UK official pages | Heading recall draft only; qualified clinical review **outstanding** |
| Firearm Safety | RCMP CFSC Student Handbook (2014); RCMP safety courses; 2025 Commissioner report | RCMP official course page and 2026 rollout announcement; original exact bank pinned to 2014 | Printed-rule draft only; current-course / qualified CFSC review **outstanding** |
