# #197 Analyst — Wave 1 bounded Human Factors research specification

**Status:** content authored and staged 2026-10-15 (see §8); not delivered and not an earnable role. Originally a documentation-only proposal, 2026-10-14.
**Authority:** [ratified #197 decisions](ISSUE_197_ROLE_DECISION_RECORD.md), [scored audit](ISSUE_197_SCORED_CONTENT_AUDIT.md), [`LIBRARY_ROADMAP.md`](../LIBRARY_ROADMAP.md), [`LIBRARY_RESEARCH_METHOD.md`](../LIBRARY_RESEARCH_METHOD.md). Reuses #104 research; does not supersede roadmap priorities.

## 1. Decision summary

**Recommend revise → owner/independent subject-matter review → separate build decisions**, not shipping immediately. *Update 2026-10-15: the owner chose Decision Under Uncertainty I as the fifth topic and asked to start; the content is authored and staged (§8) and still awaits independent review.* Use four deliberately bounded objective-choice S1 topics, **nine scored items each** (36 proposed items). Existing shipped `ooda-loop` has **four self-scored definition/sequence items**, verified by the October 8 scored-content audit; together **5 topics / 40 items**, meeting the numerical G1/G2 minima **only if all four drafts are implemented and approved**. This is a proposed allocation, not 40 implemented items; no role is currently earnable. Prefer *Decision Under Uncertainty I* over Threat Recognition I for the fifth topic because it avoids the additional professional threat-assessment and safety-validation burden. That choice remains editorial, not owner-ratified.

## 2. Proposed role composition, scope and remaining gates

| Proposed pathway | Required topic | Scored items | Mode |
|---|---|---:|---|
| Evidence & Interpretation | Observation vs Inference (new) | 9 | S1 objective |
| Evidence & Interpretation | Bias Control (new) | 9 | S1 objective |
| Awareness & Decisions | Situational Awareness I (new) | 9 | S1 objective |
| Awareness & Decisions | Decision Under Uncertainty I (new) | 9 | S1 objective |
| Awareness & Decisions | OODA Loop (`ooda-loop`, shipped) | 4 | Self-scored recall |
| **Total** | **5 topics** | **40** | **36 proposed objective S1 + 4 shipped self-scored** |

Two pathways have 2 and 3 topics (G3). Four new topics are not shared with any currently earnable role (G5, assuming the future approved role definitions do not share them). Objective application examples satisfy G4 **in the proposed design**, contingent on independent item validity review. G6 remains **open** until every topic's Learn `sources` and `limitations`, scientific/ethical review, source verification, and roadmap admission have passed. Counts alone do not clear these gates. Analyst remains the owner-ratified **working name**, not a locked public credential. Candidate limited role claim: **'Distinguishes observations from inferences and selects evidence-aware responses to uncertainty in authored scenarios.'** Do not claim real-world judgment reliability, safety performance, psychological expertise, threat recognition, or qualification.

**Existing OODA boundary:** keep the four current items and completion unchanged; they establish recollection of cycle terminology, **not** evidence of professional decision performance. The research must not retrofit application claims onto OODA or mutate its shipped score boundary. Neither OODA nor Analyst implies tactical competence.

## 3. Source reuse and evidence hierarchy

- Existing full dossiers: [`OBSERVATION_VS_INFERENCE.md`](library-research/OBSERVATION_VS_INFERENCE.md), [`BIAS_CONTROL.md`](library-research/BIAS_CONTROL.md), [`SITUATIONAL_AWARENESS_I.md`](library-research/SITUATIONAL_AWARENESS_I.md). These describe broader multi-lesson programmes; this Wave 1 intentionally reduces the scored claim to nine S1 items apiece. Superseded #104 implementation recommendation: [`ISSUE_104_SCENARIO_ITEMS.md`](../closed/ISSUE_104_SCENARIO_ITEMS.md).
- Ontario professional syllabi are **Tier A jurisdictional curriculum anchors**, not proof that Argus improves real-world performance. Academic reviews/primary studies are **Tier C evidence on cognitive limits and mechanisms**. NIST and National Academies are **context**, not a prescribed single-best decision rule for ordinary civilian dilemmas. Every sample answer below follows the *explicit vignette facts and an authored conservative editorial rule*; it is not a direct quotation of an external authority.
- Research links below are source leads reused from existing repository work; each must be re-opened and source-mapped at item level by a second reviewer before production. Sample stems and options are **new Argus editorial constructions**, not validated psychometric instruments.

## 4. Topic specifications and answer-key samples

Shared S1 contract: short fictional everyday context, exactly four unambiguous options with **one** best answer conditional on stated facts, deterministic `choice`, no free-text judgment grader, no hidden physiological/personality inference. Rotate correct-answer position during implementation; **the keyed first option below is an editorial review convenience only**. Mix benign/no-action and uncertainty outcomes; no speed limits, demographic clues, deceptive-cue scoring or situational threat prediction. Nine independent scored item families per topic; distractors must be revised in UX/content QA to avoid trivially absurd choices.


### 1. Observation vs Inference — `observation-vs-inference`

**Provisional completion claim:** Classifies observations, attributed reports and inferences in authored reports; chooses neutral language and missing evidence.
**Explicit limitations:** Not objective eyewitness accuracy, investigative competence, lie detection or real-world reporting certification.
**Authority leads:** [Ontario report-writing syllabus](https://www.ontario.ca/document/training-syllabus-security-guards/section-4-report-writing); [Ontario security guard study guide](https://www.ontario.ca/page/security-guard-study-guide); [Johnson et al., source monitoring](https://pubmed.ncbi.nlm.nih.gov/8346328/).
**Content boundary:** 9 independent S1 items; Learn-only definitions and two contrasting worked examples; first application to authored contexts, then mixed contexts. No images/audio/assets required. Scenario ambiguity resolved in stem, not by subjective marking.

| # | Authored vignette / question | Key (correct answer) | Distractors (incorrect) |
|---|---|---|---|
| 1 | Camera shows the door opening at 09:10. Which is direct recorded observation? | **The door visibly opens at 09:10** | The person was fleeing; The person was angry; The building was unsafe |
| 2 | A colleague says a package arrived at noon; you did not see it. How should it be logged? | **Colleague reported arrival at noon** | I saw it arrive at noon; Delivery is confirmed independently; Courier was late |
| 3 | A visitor walks away after checking a sign. Which is inference? | **The visitor was confused** | The visitor walked away; The visitor checked the sign; The visitor entered the hall |
| 4 | Two people speak quietly. Which report is best? | **Two people spoke quietly near reception** | Two conspirators planned something; The people were hiding evidence; The people were afraid |
| 5 | Only one camera angle is available. What is justified about an obscured event? | **The footage does not establish what happened outside view** | Nothing happened outside view; A crime occurred; The obscured person caused it |
| 6 | Which question least suggests an answer to a witness? | **What did you observe next?** | Was the driver speeding?; Was that person lying?; You saw a red coat, correct? |
| 7 | A log says 'The visitor intentionally ignored me.' What correction best preserves evidence? | **The visitor continued walking after I spoke; whether they heard me is unknown** | The visitor was rude; The visitor was hostile; The visitor deliberately disobeyed |
| 8 | A witness describes a noise; camera shows no sound. Which conclusion is warranted? | **The sound is reported by the witness, not independently confirmed by silent video** | The witness is lying; The video proves there was no noise; The noise was definitely a crash |
| 9 | An observer notes a locked door at 18:00 but not who locked it. What remains unknown? | **Who locked the door** | Whether the door was locked at 18:00; Whether the observer saw the door; Whether a door existed |

### 2. Bias Control — `bias-control`

**Provisional completion claim:** Identifies biased selection of evidence and chooses an evidence-check or calibrated revision in authored examples.
**Explicit limitations:** Does not eliminate implicit bias, establish reduced field error, or qualify psychological or behavioural assessment.
**Authority leads:** [Nickerson, confirmation bias review](https://doi.org/10.1037/1089-2680.2.2.175); [Tversky & Kahneman, judgment under uncertainty](https://pubmed.ncbi.nlm.nih.gov/17835457/); [Ontario PI ethics syllabus](https://www.ontario.ca/document/training-syllabus-private-investigators/section-6-principles-ethical-reasoning-and-decision-making).
**Content boundary:** 9 independent S1 items; Learn-only definitions and two contrasting worked examples; first application to authored contexts, then mixed contexts. No images/audio/assets required. Scenario ambiguity resolved in stem, not by subjective marking.

| # | Authored vignette / question | Key (correct answer) | Distractors (incorrect) |
|---|---|---|---|
| 1 | An early guess is treated as true despite contradicting data. Which corrective step is best? | **List evidence against the initial guess** | Seek only matching examples; Keep the first conclusion; Ignore new records |
| 2 | A supervisor announces a 20-minute estimate before anyone measures. Later estimates cluster near 20. What may explain this? | **Anchoring** | Perfect measurement; Randomization; Source independence |
| 3 | A highly publicized delay leads someone to assume all trains are delayed. Which missing information matters? | **Actual delay frequency across trains** | The headline's font; How memorable the story felt; Number of social shares |
| 4 | One late arrival is labelled 'lazy' without considering transit disruption. What is the stronger alternative? | **Check contextual explanations before inferring disposition** | Assume laziness; Infer a diagnosis; Treat punctuality as proof of character |
| 5 | After two supportive reports and one contrary report, which summary is best? | **Record both supporting and contrary evidence** | Delete contrary evidence; Declare certainty; Assume contrary source is malicious |
| 6 | A colleague sounds confident but offers no data. What follows? | **Confidence alone does not establish accuracy** | The claim is proven; Confidence proves expertise; Disagreement is impossible |
| 7 | An initial hypothesis predicts a missing invoice. The invoice is found. What should happen? | **Revise the hypothesis in light of new evidence** | Preserve original certainty; Ignore the invoice; Change the timeline secretly |
| 8 | A person is deemed suspicious because of clothing alone. What is the appropriate response? | **Avoid demographic or appearance profiling; use relevant conduct and context** | Escalate solely from appearance; Guess intent from clothing; Assume deception |
| 9 | Two explanations fit the same observation. What is the best next question? | **What evidence would distinguish the explanations?** | Which story sounds dramatic?; Which one did I choose first?; Which would impress others? |

### 3. Situational Awareness I — `situational-awareness-i`

**Provisional completion claim:** Identifies a relevant change against a stated baseline and selects proportionate reassessment in authored everyday scenarios.
**Explicit limitations:** Not continuous vigilance, threat prediction, surveillance proficiency, safety assurance or a basis for profiling.
**Authority leads:** [Ontario security procedures syllabus](https://www.ontario.ca/document/training-syllabus-security-guards/section-3-basic-security-procedures); [Ontario PI investigative techniques](https://www.ontario.ca/document/training-syllabus-private-investigators/section-5-investigative-techniques); [Wolfe et al., rare target detection](https://pmc.ncbi.nlm.nih.gov/articles/PMC2662480/).
**Content boundary:** 9 independent S1 items; Learn-only definitions and two contrasting worked examples; first application to authored contexts, then mixed contexts. No images/audio/assets required. Scenario ambiguity resolved in stem, not by subjective marking.

| # | Authored vignette / question | Key (correct answer) | Distractors (incorrect) |
|---|---|---|---|
| 1 | A posted entrance closes at 18:00 every day; it is closed at 18:05. What is the best classification? | **Expected condition under the known baseline** | An urgent threat; Proof of sabotage; Impossible to describe |
| 2 | An exit previously marked open now has a temporary closure notice. What matters? | **Update the route using current posted information** | Assume the old route remains open; Interpret staff motives; Ignore the sign |
| 3 | A station platform grows crowded after a service cancellation. Which interpretation is justified? | **The cancellation plausibly explains the change; reassess access and movement** | Crowding proves hostility; Crowding proves danger from one person; Everyone is panicking |
| 4 | You see a puddle near a public walkway. What is the relevant response? | **Avoid the slip hazard and alert responsible staff** | Diagnose a person nearby; Follow someone; Ignore because the cause is unknown |
| 5 | A quiet room has a visitor wearing an unfamiliar style of clothing. What follows? | **Appearance alone is not a meaningful hazard indicator** | The visitor is dangerous; An anomaly proves threat; Report their identity as a risk |
| 6 | An unfamiliar sound occurs once with no corroboration. What is the best assessment? | **Insufficient information; attend to context without asserting a cause** | Definite emergency; Definite harmlessness; Evidence of intent |
| 7 | During a power outage, lit exit signs remain visible. What deserves priority? | **Current marked safe egress and official instructions** | Guess who caused the outage; Count clothing colours; Keep the original plan regardless |
| 8 | A once-blocked passage is reopened by staff. What should you do cognitively? | **Update the earlier assessment using the new condition** | Keep describing it as blocked; Ignore the change; Infer wrongdoing |
| 9 | A task occupies your attention. What is a defensible statement about awareness? | **Attention is limited; periodic relevant checks cannot guarantee noticing everything** | Constant perfect surveillance is possible; All rare hazards are easy to detect; Scanning proves expertise |

### 4. Decision Under Uncertainty I — `decision-under-uncertainty-i`

**Provisional completion claim:** Selects a reversible, information-seeking or appropriately escalated response when facts, costs and thresholds are explicit in authored civilian vignettes.
**Explicit limitations:** Not risk-management certification, emergency command judgment, probabilistic forecasting proficiency, medical triage or real-world action readiness.
**Authority leads:** [National Academies, How People Learn II](https://nap.nationalacademies.org/catalog/24783/how-people-learn-ii-learners-contexts-and-cultures); [Tversky & Kahneman](https://pubmed.ncbi.nlm.nih.gov/17835457/); [NIST risk management framework](https://csrc.nist.gov/projects/risk-management/about-rmf) (framework analogy only, not direct civilian-choice rule).
**Content boundary:** 9 independent S1 items; Learn-only definitions and two contrasting worked examples; first application to authored contexts, then mixed contexts. No images/audio/assets required. Scenario ambiguity resolved in stem, not by subjective marking.

| # | Authored vignette / question | Key (correct answer) | Distractors (incorrect) |
|---|---|---|---|
| 1 | A nonurgent room booking may conflict with an unconfirmed meeting. Which action preserves options? | **Check the booking calendar before cancelling** | Cancel all meetings; Declare the room free; Ignore the conflict |
| 2 | A document date is missing and publication is tomorrow. What is the first information-quality step? | **Verify the date with the record owner** | Invent a plausible date; Publish it as verified; Use an unrelated date |
| 3 | A choice is reversible and low cost while evidence is incomplete. Which principle is appropriate? | **Prefer a reversible provisional step with a check-in point** | Assume certainty; Hide the uncertainty; Make an irreversible commitment by default |
| 4 | Two different source documents disagree about a figure. What is justified? | **Flag the discrepancy and verify the authoritative version** | Average them without a rule; Pick the larger number; Claim both are true |
| 5 | A new official notice supersedes yesterday's instructions. What follows? | **Reassess using the newer authoritative instruction** | Follow yesterday regardless; Ignore the notice; Assume all notices are equal |
| 6 | A decision depends on whether a quoted figure is gross or net, and it is unlabeled. What is the best next information? | **Ask for the figure's definition and basis** | Guess gross; Guess net; Use either interchangeably |
| 7 | A fictional venue alarm sounds and staff direct people to exit. What takes precedence? | **Follow official safety directions promptly** | Run a prolonged bias worksheet first; Wait for perfect causal knowledge; Guess the cause before moving |
| 8 | A memo states 30% uncertainty in a numerical estimate. Which summary is calibrated? | **The estimate is uncertain; communicate the assumption and range** | The figure is exact; The uncertainty can be ignored; The estimate has no possible use |
| 9 | A quick check could distinguish two alternatives before an irreversible purchase. What is best? | **Perform the discriminating check first** | Choose by initial impression; Suppress the alternative; Purchase both without evaluating |

## 5. Claim ledger / provenance boundaries

| Claim family | Authority type and source | Scored link | Caution |
|---|---|---|
| Objective observable versus inferred/reported statements | Ontario Security Guard Report Writing syllabus; source-monitoring review | Observation #1–9 | Practical reporting habit, not proof of eyewitness memory fidelity |
| Confirmation, anchoring, availability and context neglect | Nickerson review; Tversky–Kahneman; Ontario PI ethics | Bias #1–9 | Names/mechanisms are evidence-informed; single-best remediation is authored, not experimentally validated |
| Environment baseline, changed conditions, selective attention limits | Ontario Security Procedures/PI syllabus; Wolfe visual-search study | Awareness #1–9 | Occupational syllabus and laboratory findings do not prove civilian threat-detection transfer |
| Verification, information value, reversible action and escalation | National Academies learning research; NIST contextual framework; authored choice rules | Uncertainty #1–9 | Editorial rule requiring explicit facts; not a universal scientifically proven optimal action |
| OODA stage terminology | Shipped `ooda-loop` catalog and #197 scored audit | Existing 4 items | Self-scored recall only; cannot claim S1 application |

## 6. Editorial and technical acceptance (not yet satisfied)

1. Validate all 36 keys against exact vignette premises, not just plausible reasoning; independently review misleading distractors and ambiguity. Replace obvious distractors and run blinded second-rater key concordance before build.
2. Vary cases, include *no material anomaly* / *insufficient evidence* / *appropriate early safety action*, and balance response types; ensure there is no default 'always investigate' strategy.
3. Each authored item maps to a specific claim-ledger row and labelled source rationale. Confirm source edition, jurisdiction, source licensing and any relevant changes.
4. Add per-topic `limitations` and `sources`; check keyboard/screen reader announcement of complete option text, 320/390px layout, offline deterministic evaluation and audit of correct-index placement.
5. Run existing objective-choice engine and Test/banking semantics; no S2 rubric, free-response grading, social profiling, alarmist UX, or new achievement rules.
6. Independently re-count live `catalogDefinitions()` on fresh `main` before any implementation: proposed 36 + existing 4 = 40 is *planning arithmetic*, not a runtime result. Require unique IDs, stable test definitions and no modification of OODA historical completions.
7. Add Human Factors entry to authoritative `docs/LIBRARY_ROADMAP.md` through owner-approved prioritization before implementation; #104 research alone cannot authorize it. Open four distinct build issues only after content/source and roadmap gates pass.
8. Preserve permanent award receipts and role versions if a future Analyst v1 is approved. Nothing in this PR defines an earnable role, runtime `roleId`, badge art or a visible locked role.

## 7. Unresolved review gates and handoff

- **Owner:** approve Decision Under Uncertainty I as fifth topic vs alternative; approve exact two-pathway structure and bounded role claim. Analyst title remains working, not a professional credential.
- **Independent domain/content reviewer:** audit all 36 individual keys, source support, nontrivial difficulty, ethical boundary and examples where alternative action is equally defensible; split or reject ambiguous items.
- **Methodology:** nine samples per topic meet the numeric goal but may be too shallow for reliable competence; verify exposure diversity and item quality rather than padding; expand if testing demonstrates weakness, with a separately approved stable boundary.
- **Safety:** no profiling, mental-health/deception/violence forecasts, professional assessment or emergency-response instruction; prioritize actual emergency procedures where the vignette establishes danger.
- **Implementation owner:** separate scoped decisions after roadmap approval; no role earnability or badge until all six D4 gates demonstrably pass.

**Change scope:** documentation/research only; no source, runtime, role definitions, scoring, asset, deployment or library-manifest modification.
## 8. Implementation status (2026-10-15)

**Authority for answer keys:** the implemented items in `src/domain/humanFactors/humanFactorsTopics.ts` now supersede the sample tables in §4. The samples were a starting point; many keys were visibly the longest, most qualified option and several distractors were obviously absurd, so every vignette was rewritten with similar-length plausible distractors and a clearer single best answer. The §4 tables are retained as research provenance only.

**What exists:** four topics, nine four-option items each, Learn overview, two contrasting worked examples, `limitations` and `sources` per topic (ids `observation-vs-inference`, `bias-control`, `situational-awareness-i`, `decision-under-uncertainty-i`). Decision Under Uncertainty I replaced the original weaker items (the “30% uncertainty” item became an explicit 4%–16% range; the absurd “bias worksheet” distractor was removed).

**Staged deliberately:** the topics are not in `catalogSeed.ts` or `shippedCatalog.json`. A test fails if they are, so shipping is a visible, reviewed change. Releasing them means spreading `humanFactorsTopics()` into the seed, adding the four ids to the manifest, and deleting the staging test.

**Defects found while implementing:** the §3 link to the Ontario PI ethics syllabus returned 404; the correct page is `…/section-6-principles-ethical-reasoning-and-decision-making` and is now used everywhere. The Nickerson DOI blocks automated fetches (HTTP 403) and was not machine-verified.

**Automated checks now in place:** 36 items, unique ids/prompts/answers, four distinct options containing the key, forward choice only, key not the longest option in more than four items per topic, sources with https URL and note, two worked examples, and a parse-boundary round-trip. The Test card shuffles options per card, so authored option order and key position carry no information.

**Model second-rater (2026-10-15):** OpenAI Codex (codex-cli 0.162) answered all 36 vignettes blind, with keys removed and option order shuffled. It matched the authored key on 36 of 36, flagged none as ambiguous and gave confidence 5 throughout. This catches keys that contradict their vignettes, but it is not the human subject-matter review the gate requires. Unanimous top confidence also suggests the distractors may be easy; a human reviewer should judge difficulty.

**Still open before delivery:** human independent key concordance on all 36 items; item-level source mapping by a second reviewer; a decision on the Analyst role id and claim; roadmap-authorised build issues; Pixel review of long vignettes at 320 px. None of these has been done.
