# #197 Analyst — facilitator key and evidence worksheet

**Status:** Prepared 2026-10-15; independent human review pending. Staged content must remain unavailable to learners until its gates are cleared.
**Authority:** Review worksheet for [Wave 1](ISSUE_197_ANALYST_WAVE1_HUMAN_FACTORS.md) under the [ratified role decisions](ISSUE_197_ROLE_DECISION_RECORD.md). This document does not approve content or authorize shipping.

**Do not give this document to the reviewer until the blind worksheet is complete.** The key below is code-verified, not independently validated.

## Evidence status

Verified here: the 36 stems, four options, implemented answer strings, deterministic item IDs and lexicographic source option ordering match the local source snapshot recorded in the [blind worksheet](ISSUE_197_ANALYST_HUMAN_REVIEW.md). Rationales below are editorial explanations, not external quotations.

External sources were reopened on 2026-10-15. The verification log below distinguishes readable primary-source content, search-indexed official content, abstract-only access and failed access. These checks establish limited background support, not independent validation of a keyed answer. Decision rules remain authored; no psychometric or transfer claim is established.

Source snapshot: `src/domain/humanFactors/humanFactorsTopics.ts`, SHA-256 `a190db44428d385716a03ae78cea4c6273037cd2737bfb3d35565608382fbaca` (after citation-only correction).

## Source leads

- **R** — [Ontario report-writing syllabus](https://www.ontario.ca/document/training-syllabus-security-guards/section-4-report-writing). See the verification log below for access, scope and remaining gaps.
- **J** — [Johnson et al. (1993), Source monitoring](https://pubmed.ncbi.nlm.nih.gov/8346328/). See the verification log below for access, scope and remaining gaps.
- **N** — [Nickerson (1998), Confirmation bias](https://doi.org/10.1037/1089-2680.2.2.175). See the verification log below for access, scope and remaining gaps.
- **T** — [Tversky & Kahneman (1974)](https://pubmed.ncbi.nlm.nih.gov/17835457/). See the verification log below for access, scope and remaining gaps.
- **E** — [Ontario PI ethical reasoning syllabus](https://www.ontario.ca/document/training-syllabus-private-investigators/section-6-principles-ethical-reasoning-and-decision-making). See the verification log below for access, scope and remaining gaps.
- **H** — [OHRC racial-profiling fact sheet](https://www.ohrc.on.ca/en/what-racial-profiling-fact-sheet). See the verification log below for access, scope and remaining gaps.
- **B** — [Ontario basic security procedures syllabus](https://www.ontario.ca/document/training-syllabus-security-guards/section-3-basic-security-procedures). See the verification log below for access, scope and remaining gaps.
- **I** — [Ontario PI investigative techniques syllabus](https://www.ontario.ca/document/training-syllabus-private-investigators/section-5-investigative-techniques). See the verification log below for access, scope and remaining gaps.
- **W** — [Wolfe et al. (2007), visual-search paper as linked in implementation](https://pmc.ncbi.nlm.nih.gov/articles/PMC2662480/). See the verification log below for access, scope and remaining gaps.
- **L** — [National Academies, How People Learn II](https://nap.nationalacademies.org/catalog/24783/how-people-learn-ii-learners-contexts-and-cultures). See the verification log below for access, scope and remaining gaps.
- **F** — [NIST Risk Management Framework](https://csrc.nist.gov/projects/risk-management/about-rmf). See the verification log below for access, scope and remaining gaps.

## Primary-source verification log — 2026-10-15

**R — Official text, search-index access.** Direct opening returned HTTP 403; the search tool returned the official [Ontario Section 4 page](https://www.ontario.ca/document/training-syllabus-security-guards/section-4-report-writing). Its “Outline” requires factual report content; “Suggested methodology”, step 3, specifies objective reporting without emotional terms or introspection. Supports the factual-versus-added-inference distinction across Observation items. It does not validate the nine vignettes or directly establish the effect of leading questions (item 06). The separately indexed [official study guide, Section 4](https://www.ontario.ca/page/security-guard-study-guide) also distinguishes observations from assumptions. No occupational certification claim follows.

**B — Official text, search-index access.** Direct opening returned HTTP 403; indexed [Ontario Section 3](https://www.ontario.ca/document/training-syllabus-security-guards/section-3-basic-security-procedures) was readable. “Surveillance” and suggested methodology step 2 cover comparing conditions with an initial benchmark, noticing changes and identifying hazards. Supports Awareness’s baseline/change construct. It does not prescribe the exact corridor, staff-direction, evacuation or reopened-stairwell keys; these are applications of explicit vignette facts needing review.

**E — Official text, search-index access.** Direct opening returned HTTP 403; indexed [Ontario PI Section 6](https://www.ontario.ca/document/training-syllabus-private-investigators/section-6-principles-ethical-reasoning-and-decision-making) was readable. “Minimum requirements”, point 2, calls for relevant facts, defensible decisions grounded in facts/research, and attention to situation-specific risks. This supplies broad context for checking evidence, not a study of attribution error, confidence calibration or the individual keys.

**I — Official text, search-index access.** Direct opening returned HTTP 403; indexed [Ontario PI Section 5](https://www.ontario.ca/document/training-syllabus-private-investigators/section-5-investigative-techniques) was readable. “Minimum requirements”, point 5, includes environmental observation, accurate records and continued reassessment. Its report-writing subsection also requires objective reports. Curriculum background only; this pack assigns no item’s sole justification to surveillance training.

**J — Abstract and metadata only.** Direct PubMed opening returned no article text; the indexed [Johnson, Hashtroudi & Lindsay abstract](https://pubmed.ncbi.nlm.nih.gov/8346328/) was readable. It identifies source judgments as fallible evaluations shaped by perceptual and reflective processes. Background for distinguishing attribution from observation; it does not supply the silent-camera logic, source-attribution wording or open-question rule in these keys. Full paper not reviewed.

**T — Abstract and metadata only.** Direct PubMed opening returned a site shell; the indexed [Tversky & Kahneman abstract](https://pubmed.ncbi.nlm.nih.gov/17835457/?dopt=Abstract) was readable. It identifies availability for frequency judgments and adjustment from an anchor for numerical prediction. Supports mechanism labels for Bias 02 and 03. It does not establish that anchoring caused the fictional estimates, validate a debiasing intervention, or justify the forecast-range planning rule in Decision 08. Full paper not reviewed.

**N — Inaccessible.** The [Nickerson DOI](https://doi.org/10.1037/1089-2680.2.2.175) timed out; APA search access was blocked by robots.txt. No article passage was verified. Confirmation-bias item mappings remain leads; no secondary summary was substituted for the cited review.

**H — Direct official page readable.** The [OHRC fact sheet](https://www.ohrc.on.ca/en/what-racial-profiling-fact-sheet), opening definition and following paragraph, distinguishes stereotyped identity-based scrutiny from conduct-based grounds. Supports the anti-profiling context for Bias 08 and Awareness 05. Its specific definition concerns protected identity grounds; the broader rule about any unfamiliar clothing is an Argus editorial extension requiring review.

**W — Direct primary paper readable; metadata defect confirmed.** The linked [Wolfe et al. paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC2662480/) is **2007**; the staged implementation’s incorrect “2005” label was corrected to “2007” on 2026-10-15. The abstract and Experiment 1a Results show more visual-search misses at low target prevalence. The introduction explicitly distinguishes this phenomenon from time-on-task vigilance decrements. This supports limited detection reliability in the studied tasks, **not** the efficacy of set-point checks after an hour of concentration (Awareness 09). A better source or narrower instructional wording is needed for that intervention. Only the staged source citation year was corrected; questions, options and keys are unchanged.

**L — Official publisher metadata/context readable via alternate URL.** Original NAP catalog returned HTTP 429; [National Academies’ official reader](https://www.nationalacademies.org/read/24783) supplied the 2018 book metadata and contents. This establishes the cited learning-science context, not item-level support. No chapter passage validating the Decision rules was reviewed.

**F — Direct official page readable; context mismatch confirmed.** [NIST “About the Risk Management Framework”](https://csrc.nist.gov/projects/risk-management/about-rmf), overview and step descriptions, concerns organisational systems, security/privacy controls and ongoing monitoring. It supplies no direct authority for calendar checks, document dates, supplier trials, tax comparison or repair choices. Those item mappings are labelled analogy-only below and cannot clear an evidence gate.

## Remaining source work

The machine checks above reduce source discovery work. A human still needs to judge every key and resolve gaps: Observation 06 (leading-question mechanism); Bias 01/04/05/06/07/09 (specific support or explicit editorial scope); Awareness 09 (check strategy); all Decision items (editorial decision rules, not NIST-derived rules). Emergency keys rely on their explicit fictional directions and still need scope review. No item is marked accepted by this source check.

## Item keys, rationales and proposed mapping

## Observation vs Inference

### observation-vs-inference-item-01

**Implemented key: B. Lobby door opened at 09:10.**

The other entries add force, speed or purpose absent from the stated recording.

Source check: R: factual-reporting curriculum support; exact key editorial. Reviewer must adjudicate the answer and record any stronger direct support.

### observation-vs-inference-item-02

**Implemented key: A. Colleague reports the parcel arrived at noon; I did not see it.**

Attributing the report preserves the distinction between testimony and direct observation.

Source check: R: factual-reporting curriculum support; exact key editorial; J: abstract background only. Reviewer must adjudicate the answer and record any stronger direct support.

### observation-vs-inference-item-03

**Implemented key: A. The visitor found the notice confusing.**

Confusion assigns a mental state; the other choices describe visible actions.

Source check: R: factual-reporting curriculum support; exact key editorial. Reviewer must adjudicate the answer and record any stronger direct support.

### observation-vs-inference-item-04

**Implemented key: D. Two people were talking quietly near reception.**

The key records speech volume and location without supplying motive or subject matter.

Source check: R: factual-reporting curriculum support; exact key editorial. Reviewer must adjudicate the answer and record any stronger direct support.

### observation-vs-inference-item-05

**Implemented key: C. The person walked toward the stairwell; what happened next is not shown.**

The recording cannot establish events outside its coverage.

Source check: R: factual-reporting curriculum support; exact key editorial; J: abstract background only. Reviewer must adjudicate the answer and record any stronger direct support.

### observation-vs-inference-item-06

**Implemented key: D. What can you tell me about the vehicle?**

The open question does not supply a proposed colour, speed or mental state.

Source check: R: factual-reporting curriculum support; exact key editorial. Reviewer must adjudicate the answer and record any stronger direct support.

### observation-vs-inference-item-07

**Implemented key: D. I spoke and the visitor kept walking; I do not know whether they heard me.**

Continued walking is observed; hearing and intention remain unknown.

Source check: R: factual-reporting curriculum support; exact key editorial. Reviewer must adjudicate the answer and record any stronger direct support.

### observation-vs-inference-item-08

**Implemented key: B. The crash is only reported; the silent footage cannot confirm or rule it out.**

Silent footage neither confirms the reported sound nor disproves it.

Source check: R: factual-reporting curriculum support; exact key editorial; J: abstract background only. Reviewer must adjudicate the answer and record any stronger direct support.

### observation-vs-inference-item-09

**Implemented key: A. The door was locked at 18:00.**

The observation fixes the state and time, not actor, timing of locking or purpose.

Source check: R: factual-reporting curriculum support; exact key editorial. Reviewer must adjudicate the answer and record any stronger direct support.

## Bias Control

### bias-control-item-01

**Implemented key: C. List what would count against the supplier explanation and check for it.**

Seeking contrary evidence tests the initial hypothesis instead of selectively confirming it.

Source check: N: inaccessible; passage unresolved. Reviewer must adjudicate the answer and record any stronger direct support.

### bias-control-item-02

**Implemented key: A. Anchoring on the supervisor’s number.**

An initial numerical suggestion can pull subsequent estimates toward it; the wording describes a possible mechanism, not proof of causation.

Source check: T: abstract mechanism support only; no exact-key validation. Reviewer must adjudicate the answer and record any stronger direct support.

### bias-control-item-03

**Implemented key: C. How often trains on the line were actually late over several weeks.**

Frequency data tests the generalisation; popularity and vividness do not measure delays.

Source check: T: abstract mechanism support only; no exact-key validation. Reviewer must adjudicate the answer and record any stronger direct support.

### bias-control-item-04

**Implemented key: B. Check for circumstances that could explain the lateness, such as a disruption.**

One late arrival does not establish a stable trait; context should be checked.

Source check: E: broad fact-based-reasoning curriculum context only. Reviewer must adjudicate the answer and record any stronger direct support.

### bias-control-item-05

**Implemented key: A. Give all three reports and note that one conflicts with the hypothesis.**

The summary must retain conflicting evidence rather than hide or discredit it without grounds.

Source check: N: inaccessible; passage unresolved. Reviewer must adjudicate the answer and record any stronger direct support.

### bias-control-item-06

**Implemented key: D. Nothing by itself; the source of the figure still needs checking.**

Confidence without a source does not establish the figure’s accuracy.

Source check: E: broad fact-based-reasoning curriculum context only. Reviewer must adjudicate the answer and record any stronger direct support.

### bias-control-item-07

**Implemented key: C. Revise the conclusion and note where the invoice was found.**

The found invoice contradicts the missing-invoice conclusion and calls for revision.

Source check: N: inaccessible; passage unresolved. Reviewer must adjudicate the answer and record any stronger direct support.

### bias-control-item-08

**Implemented key: B. Clothing alone is not evidence of risk; rely on what the visitor does.**

Unfamiliar clothing alone supplies no conduct-based evidence of risk.

Source check: H: anti-profiling context verified; unfamiliar-clothing generalisation editorial. Reviewer must adjudicate the answer and record any stronger direct support.

### bias-control-item-09

**Implemented key: A. What observation would be more likely under one explanation than the other?**

A discriminating observation can separate explanations that fit the same evidence.

Source check: N: inaccessible; passage unresolved. Reviewer must adjudicate the answer and record any stronger direct support.

## Situational Awareness I

### situational-awareness-i-item-01

**Implemented key: C. As expected: it matches the posted baseline.**

The closure matches the explicitly posted time.

Source check: B: baseline/change curriculum context; exact action editorial. Reviewer must adjudicate the answer and record any stronger direct support.

### situational-awareness-i-item-02

**Implemented key: C. Use the route the current notice gives.**

The current explicit repair notice updates yesterday’s route.

Source check: B: baseline/change curriculum context; exact action editorial. Reviewer must adjudicate the answer and record any stronger direct support.

### situational-awareness-i-item-03

**Implemented key: A. The cancellation likely explains the crowd; reassess your position and exit.**

The announced cancellation supplies an ordinary explanation; reassessment follows the actual crowding.

Source check: B: baseline/change curriculum context; exact action editorial. Reviewer must adjudicate the answer and record any stronger direct support.

### situational-awareness-i-item-04

**Implemented key: A. Keep clear of it and tell the staff responsible for the area.**

The visible spreading wet patch warrants avoiding it and alerting responsible staff without resolving cause.

Source check: B: baseline/change curriculum context; exact action editorial. Reviewer must adjudicate the answer and record any stronger direct support.

### situational-awareness-i-item-05

**Implemented key: D. Nothing: unfamiliar clothing is not a change in behaviour or conditions.**

Clothing unfamiliarity is not itself hazardous behaviour; the stem supplies no other concern.

Source check: H: anti-profiling context verified; unfamiliar-clothing generalisation editorial. Reviewer must adjudicate the answer and record any stronger direct support.

### situational-awareness-i-item-06

**Implemented key: D. The cause is unknown; stay aware of any change and do not assume a cause.**

The isolated sound has no established cause; neither danger nor harmlessness is established.

Source check: B: baseline/change curriculum context; exact action editorial. Reviewer must adjudicate the answer and record any stronger direct support.

### situational-awareness-i-item-07

**Implemented key: B. Following the lit exit signs and the staff direction.**

The vignette gives lit exit signs and a specific staff direction.

Source check: B: baseline/change curriculum context; exact action editorial. Reviewer must adjudicate the answer and record any stronger direct support.

### situational-awareness-i-item-08

**Implemented key: D. Update it: the stairwell is now open for use.**

Staff remove the stated barrier and sign, supplying a changed condition.

Source check: B: baseline/change curriculum context; exact action editorial. Reviewer must adjudicate the answer and record any stronger direct support.

### situational-awareness-i-item-09

**Implemented key: D. You may have missed changes, so planned checks at set points are useful.**

Sustained focus does not guarantee detection of environmental changes; checks are a limited aid.

Source check: W: limited-detection evidence verified; set-point-check intervention unsupported. Reviewer must adjudicate the answer and record any stronger direct support.

## Decision Under Uncertainty I

### decision-under-uncertainty-i-item-01

**Implemented key: B. Check the calendar for the meeting before moving either booking.**

Checking the calendar resolves information before changing either reversible booking.

Source check: F: verified organisational analogy only; no direct item support. Reviewer must adjudicate the answer and record any stronger direct support.

### decision-under-uncertainty-i-item-02

**Implemented key: A. Ask the author to confirm the date.**

A reachable author can resolve the missing date instead of guessing from another timestamp.

Source check: F: verified organisational analogy only; no direct item support. Reviewer must adjudicate the answer and record any stronger direct support.

### decision-under-uncertainty-i-item-03

**Implemented key: C. Start a small trial with a review point rather than wait for full information.**

A cancellable no-cost trial with review is the authored reversible-action rule; assess whether quality, safety and selection criteria are sufficiently specified.

Source check: F: verified organisational analogy only; no direct item support. Reviewer must adjudicate the answer and record any stronger direct support.

### decision-under-uncertainty-i-item-04

**Implemented key: A. Flag the difference and confirm which version is authoritative.**

An unresolved discrepancy should be exposed and the authoritative version identified rather than silently combined.

Source check: F: verified organisational analogy only; no direct item support. Reviewer must adjudicate the answer and record any stronger direct support.

### decision-under-uncertainty-i-item-05

**Implemented key: A. Follow the newer notice and use Room C.**

The newer official notice explicitly changes the destination.

Source check: B: baseline/change curriculum context; exact action editorial. Reviewer must adjudicate the answer and record any stronger direct support.

### decision-under-uncertainty-i-item-06

**Implemented key: B. Whether the 1,200 includes tax.**

Tax inclusion is the missing definition needed to compare the two quotes.

Source check: F: verified organisational analogy only; no direct item support. Reviewer must adjudicate the answer and record any stronger direct support.

### decision-under-uncertainty-i-item-07

**Implemented key: C. Following the staff directions to the exit now.**

The stem explicitly supplies a venue alarm and staff evacuation direction.

Source check: B: baseline/change curriculum context; exact action editorial. Reviewer must adjudicate the answer and record any stronger direct support.

### decision-under-uncertainty-i-item-08

**Implemented key: A. About 10% is expected, but the range is wide; plan for 4% to 16%.**

The keyed summary retains both central estimate and range; assess whether “plan for” overstates the forecast interval.

Source check: T: abstract mechanism support only; no exact-key validation. Reviewer must adjudicate the answer and record any stronger direct support.

### decision-under-uncertainty-i-item-09

**Implemented key: B. Do the 10-minute check before starting either plan.**

An available short discriminating check reduces uncertainty before an irreversible repair.

Source check: F: verified organisational analogy only; no direct item support. Reviewer must adjudicate the answer and record any stronger direct support.

## Facilitator concerns to resolve

1. Decision item 03 assumes that beginning a supplier trial is preferable without specifying selection criteria, quality/safety costs or the value of further information. “No cost” of ending is narrower than no cost of starting. Ask whether two choices are defensible.
2. Decision item 08 gives no confidence or prediction interval interpretation. “Plan for 4% to 16%” may imply bounds or sufficient risk coverage the stem does not establish.
3. Bias item 06 uses “Nothing by itself” about confidence. Check whether this absolute wording is intended only to mean that accuracy is not established.
4. Awareness item 08 assumes removal of a barrier and sign establishes permission to use the stairwell. Check whether staff authority and any remaining hazards need stating.
5. Confirmed citation correction: the linked Wolfe paper is 2007; its staged label now matches. Its low-prevalence experiment does not establish the efficacy of planned environmental checks; resolve that support gap before release.
6. Everyday emergency and hazard examples need scope review. Occupational Ontario syllabi are background and do not by themselves authorize universal civilian safety advice.
7. Repeated patterns and implausible distractors may let learners select a socially desirable answer without applying the intended distinction. Review each item, rather than accepting counts as coverage.

The ambiguity concerns remain review flags. The citation-year mismatch was confirmed and corrected; no stems, options or answer keys were changed.
