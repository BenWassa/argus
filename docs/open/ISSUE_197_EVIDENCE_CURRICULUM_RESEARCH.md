# #197 — Evidence-led research: role architecture, curriculum, and assessment

**Status:** research synthesis / proposals for owner review — 2026-10-07; **not an approved role contract**.
**Authority:** research inputs only. [Parent dossier](ISSUE_197_EXPANDED_ROLE_ARCHITECTURE_RESEARCH.md), [issue #197](https://github.com/BenWassa/argus/issues/197), [#191](ISSUE_191_ROLE_DESIGNATIONS.md) and [#192](ISSUE_192_ROLE_BADGE_ART.md) control approvals. Nothing in this document implements a role or grants a qualification.
**Research method:** broad scan of existing Argus curriculum/architecture, then targeted consultation of official standards, government resources, established safety/training institutions, primary academic reviews and first-party product UX documentation. Source links and strength/limitations below. Review cutoff 2026-10-07. This is a curated research synthesis, not a systematic literature review or legal opinion.

## 1. Executive findings, with confidence

| Finding | Strength | Consequence |
|---|---|---|
| The shipped catalog has exactly **24 topic IDs**, across 8 nonoverlapping *planning* categories; only Communicator has a runtime earning definition | **Confirmed in code**: `src/domain/library/shippedCatalog.json`, `src/domain/roles/definitions.ts`, `src/domain/roles/roles.ts` | Do not present unbuilt roles as earnable; reconcile catalog on every expansion |
| Cross-disciplinary *breadth* is not the same as *transfer to novel situations* | **Strong educational principle**, supported by National Academies [E3]; scenario rubric itself still needs product validation | Advanced capstones require independent transfer items, not simply counting badges |
| A formal Green Beret qualification involves selection, long specialist training and applied validation; JSOC is a command, **not a personal level** | **Direct primary descriptions** [O1, O2]; no official personal “JSOC Tier 1/2” credential ladder verified | Borrow the principle “specialization + integrated application,” never ranks/patches, real-world qualifications or official emblems |
| Retrieval and spacing are useful for memorized facts, but scoring scenario choices cannot establish actual field competence | **Research synthesis** [E1,E2]; real-performance boundary logical | Different item modalities and bounded labels; no pseudo-certification |
| Psychology/human factors is a compelling line **only if** it assesses evidence hygiene and calibrated interpretation, not self-rated intuition or claims to eliminate biases | **Existing Argus deep research plus review evidence** [P1,P2] | Prefer “Human Factors” or “Cognitive Foundations” as learner-facing scope; keep title choice open |
| Diver and Responder are especially under-seeded | **Code-confirmed** (one direct topic each); independent sources [D1,D2,R1,R2] | Do not pad with generic weather/Morse/radio topics |
| Several researched psychology/field course briefs already exist under `docs/open/library-research/`, but are **not shipped** | **Repository-confirmed** | Reuse and reconcile #104, `docs/LIBRARY_ROADMAP.md`, and `docs/LIBRARY_RESEARCH_METHOD.md` rather than duplicate their work |
| Roles should facilitate voluntary choice and clear competence feedback, not streak/XP pressure | **Educational motivation evidence** [E4,E5]; specific screen recommendations are design hypotheses | Open pathways, user-chosen focus, visible raw counts, subtle earned moment |
| Most new names and thresholds need an owner decision | **Scope gate** | “Research candidate” is not “approved,” including all four proposed additions |

### Critical distinction: *role*, *pathway*, *topic*, *assessment*

- **Topic:** finite scored evidence boundary; `completedAt` or legitimate legacy `drilledAt` establishes historical completion.
- **Pathway:** an explanatory grouping **inside** a role; not itself an earned badge (Communicator authority).
- **Ordinary role:** one semantically coherent knowledge promise, authored required-topic set, one earned medallion after all validated evidence.
- **Advanced applied designation (hypothesis):** domain foundations **plus** an independent assessed application boundary; explicit authored scenarios, no field-competence claim.
- **Capstone (hypothesis):** multi-domain integration and information-quality decisions across unfamiliar civilian-safe situations. It may *reuse* prior evidence, but must not be awarded just for collecting ordinary roles.
- **Eligibility vs evidence:** completing prerequisite roles might open an assessment, but never substitutes for passing it. For a personal learning app, prefer a recommendation rather than hard access blocking where possible.

## 2. Reconciled inventory and cross-role rationale

The full 24-row × 10-role L/P/O/— matrix is in the parent dossier; it is the one canonical inventory and is not duplicated here. Cross-checked against `shippedCatalog.json` and `definitions.ts` on main, 2026-10-07: **24 unique IDs = 7 Communications + 5 Navigation + 4 Maritime/Weather + 1 Diving + 2 Emergency/Safety + 1 Decision/Operations + 3 Technical + 1 Military.** The manifest establishes IDs and presence, **not** that topic Test scope proves field application. No on-device user-authored topics were inspected. The parent matrix is a proposed editorial overlay, not actual runtime assignments.

### Every proposed *direct* cluster, and reasons to limit overlap

| Topic IDs / cluster | Most defensible candidate | Why directly fits | Cross-role overlap: what is and isn't demonstrated |
|---|---|---|---|
| `nato-phonetic`, `international-morse-letters-printed`, `signal-flags` | **Communicator LOCKED** | Finite communication codes and signalling | Field may reuse later, but printed Morse ≠ transmitting/aural skills; no automatic field credit |
| `radiotelephony-numbers`, `radio-procedure` | **Communicator LOCKED** | Radio vocabulary and procedure | Operator/Field overlap possible only as a cited communications requirement, not a generic technical badge |
| `marine-vhf-routine-calling`, `marine-vhf-priority-communications` | **Communicator LOCKED**; **Mariner proposal** | Maritime communications have a genuine marine use-context | Diver/Responder may encounter communication concepts but surface VHF ≠ underwater or medical-response competence |
| `cardinal-bearings`, `whole-circle-bearings`, `reciprocal-bearings` | **Navigator proposed direct** | Finite directional reference and transformations | Operator/Field may need bearings, but naming conventions alone do not prove navigation decisions |
| `north-references-declination`, `grid-north-map-bearings` | **Navigator proposed direct** | True/magnetic/grid distinction and cartographic bearings | Mariner supporting only; land grid navigation and marine chart interpretation need different applied questions |
| `navigation-lights`, `vessel-day-shapes` | **Mariner proposed direct** | Authoritative vessel-recognition subject matter under Canadian Collision Regulations | Do not promote isolated visual recognition to safe vessel handling |
| `beaufort-wind-scale`, `cloud-genera` | **Mariner proposed direct** | Environmental vocabulary/recognition; WMO classifies ten cloud genera | Navigator/Field supporting only; a genus name is not reliable forecast competency; one photograph does not prove general photographic recognition |
| `scuba-equipment-abbreviations` | **Diver proposed direct** | Diving-specific equipment vocabulary | Generic Mariner weather/radio not substitutes for dive planning or safety evidence |
| `primary-survey` | **Responder proposed direct** | Bounded first-response framework | Diver/Field supporting only; recall ≠ first-aid certificate or correct hands-on actions |
| `ooda-loop` | **Operator proposed direct**, **Cognitive possible direct** | Descriptive decision cycle, not operational competence | Human Factors membership requires an actual cognition item boundary; don't double-award two near-identical roles |
| `si-prefixes`, `greek-alphabet`, `hex-digits-binary` | **Technical Specialist tentative** | Shared literacy in symbolic representation | Weak coherence until applied measurement/data interpretation is authored; do not equate three memorized tables to “specialist” |
| `firearm-safety-acts-prove` | **No role assignment** | Safety-specific awareness in current scope | Not Operator/Responder/Field by default; no instruction expanding into weapons tactics |
| `caf-rank-equivalencies` | **No role assignment** | Descriptive organization/rank equivalence | Does not demonstrate command, leadership, eligibility, rank or service; keep standalone |

**Coverage check:** 24/24 have one planning home; **22/24** have at least one tentative/locked candidate role seed, and **2/24** intentionally have none. This 22 count is a **hypothesis count**, *not* 22 already earning role credit. All 7 Communicator topics are the only locked award requirements. Optional overlaps should not inflate the role completion count when the same topic occurs twice inside a single role.

## 3. Ten role-definition briefs (owner review, never approval by implication)

**Naming rule:** only the six original names are locked; for Cognitive, Technical, Field and Mission, every title below is tentative. Each proposed pathway is fully open until an explicit future decision changes that rule.

### 3.1 Communicator — APPROVED identity AND seven-topic requirement; already implemented
**Promise:** Recognizes finite codes, radio number/procedure vocabulary and marine VHF/flag concepts in the *specific shipped scored forms*. **Pathways locked:** Codes & Signalling (NATO, printed Morse, flags: 3); Radio Fundamentals (radio numbers, radio procedure: 2); Marine Communications (marine routine/priority calls: 2). **Evidence:** all seven actual banked records; exactly one full-role badge; no separate pathway award. **Exclusions:** real radio operator certification, fluent aural Morse, actual distress-radio competence. **UX:** keep fast entry to one useful unfinished topic. **Readiness:** SHIPPED; do not alter.

### 3.2 Navigator — APPROVED name, PROPOSED requirements
**Promise:** Explains bearings and reference frames and solves bounded map/position interpretation questions. **Draft pathways:** Direction & Bearings (three IDs), North & Reference Frames (two IDs), Position & Planning (future). **Direct seeds:** all five Navigation IDs. **Needed to strengthen promise:** coordinate formats and conversions; chart/map symbols and scales; location and bearing error/uncertainty; simple plotted route cases. **Counterexamples:** “what is 270 degrees?” does not prove wayfinding in fog; identifying magnetic north does not prove compass manipulation. **Assessment:** image/chart-based bearings and correction choices, ambiguity/unknown context cases. **Readiness:** highest near-term candidate, provided title/claim is narrow; do not demand applied field competence.

### 3.3 Mariner — APPROVED name, PROPOSED requirements
**Promise:** Identifies marine vessel aspects/signals, weather vocabulary and communication priorities relevant to a boat's environment. **Draft pathways:** Vessels & Rules (lights/shapes), Marine Environment (Beaufort/clouds), Communication & Priorities (marine VHF x2 and flags). **Direct seeds:** seven listed. **Missing:** chart symbols/depths/buoys, basic right-of-way reasoning with sourced boundaries, voyage planning/equipment checks. **Boundary:** Canadian Collision Regulations are an authority for lights/shapes, but quiz completion cannot establish seamanship or certification. **Navigator distinction:** recognition and marine procedures vs geometry/orientation. **Readiness:** strong foundational candidate; exact mapping/role claim require owner approval.

### 3.4 Diver — APPROVED name, PROPOSED requirements
**Promise:** Recognizes recreational diving equipment, underwater communications, elementary risk factors and planning principles **within independently sourced non-certifying limits**. **Draft pathways:** Equipment Vocabulary, Buddy & Signals, Pressure/Environment Basics, Planning & Safety Decisions. **Seed:** `scuba-equipment-abbreviations` alone. **New topics:** standardized hand-signal recognition, planning terms/equipment checks, pressure/equalization concepts and stopping/asking-for-help boundary. **Assessment:** image, hand-signal and safety-concept scenarios; never autonomous dive instructions. **Exclusions:** dive-computer competence, decompression planning, rescue or medical assessment. **Readiness:** defer award until several genuine dive-specific, reviewed topics exist. Authorities [D1–D4].

### 3.5 Responder — APPROVED name, PROPOSED requirements
**Promise:** Recalls when to check safety, recognize an emergency, call appropriate help and use a bounded first-response framework in authored examples. **Draft pathways:** Initial Scene & Survey; Call/Escalation; Common Response Decisions; Human Support. **Seed:** `primary-survey`. **Adjacent existing (unshipped) research:** PFA, de-escalation, crisis listening; include only if a role's curriculum case justifies them. **Assessment:** explicitly bounded recognition/escalation multiple choice, safe “do not act / seek help” alternatives. **Exclusions:** CPR certification, diagnosis, unsupervised medical rescue; [R1,R2] confirm formal training requires skill demonstration. **Readiness:** defer until authored emergency-specific topics and independent medical review.

### 3.6 Operator — APPROVED name, PROPOSED requirements
**Promise:** Interprets a situation, separates observations from inference, recognizes changing conditions and makes defensible low-risk information decisions. **Draft pathways:** Observation & Evidence; Decision Cycle; Information & Communications; Environment. **Seed:** `ooda-loop`; nav/comms/weather only selectively supporting. **Missing:** scenario-based Observation vs Inference, Bias Control, Situational Awareness I; the repository already researched these, but none is shipped. **Boundaries:** not military/security operator, violence prediction, armed fieldcraft, pursuit or tactical instruction. **Field Specialist distinction:** Operator is **a coherent single integrated decision domain**; advanced Field uses several already-developed domains with independently evaluated synthesis. **Readiness:** research strong; actual earning scope premature.

### 3.7 Cognitive Specialist / Human Factors — NEW candidate
**Best learner-facing alternatives:** **Human Factors** (a subject area, less credential-like), **Cognitive Foundations** (a curriculum), **Decision Scientist** (misleading occupational title), **Cognitive Specialist** (stronger collector appeal but risks implying expertise). **Recommendation:** research a *Human Factors* designation with concise public claim **“Cognition & Judgment”**; request explicit approval before renaming candidate. **Promise:** identifies limitations of attention, memory, decisions, stress/workload and social context, and recognizes evidence-quality errors in examples. **Draft pathways:** Attention & Perception; Memory & Learning; Bias & Uncertainty; Communication & Social Cognition. **Existing direct seed:** at most `ooda-loop` supporting; serious courses are not shipped. **Repository research assets:** `OBSERVATION_VS_INFERENCE`, `BIAS_CONTROL`, `INTERVIEWING_I`, `CRISIS_ACTIVE_LISTENING`. **Assessment:** evidence labels, uncertainty calibration, alternative hypothesis and source-monitoring examples. **Exclusions:** psychologist, behaviour analyst, diagnosis, therapy, violence profiling, “immune to bias.” **Professional-title law:** Ontario reserves *psychologist*, *psychological associate*, *behaviour analyst* and related claims [P3]; this does not prove “Cognitive Specialist” is legally protected, but counsels against credential implications. **Readiness:** major candidate after coherent scenario content.

### 3.8 Technical Specialist — NEW candidate
**Alternative learner-facing name:** **Technical Literacy** / **Systems & Measurement**, rather than implying an engineering designation. **Promise:** understands measurement/scientific notation, data representations and basic interpretation of encoded information. **Draft pathways:** Measurement & Units; Number Representations; Encoding & Data; Evidence/Accuracy. **Seeds:** SI, Greek, Hex (tentative); **high-value missing:** unit conversion, error/precision, binary and hexadecimal use cases, ASCII/UTF-8 at a conceptual level, checksums and simple parsing. **Boundary:** not engineer, technician, cyber operator or coding credential. **Readiness:** needs applied units/data topics; Greek script recognition is supporting literacy only.

### 3.9 Field Specialist — NEW **advanced** candidate
**Alternative:** **Field Integrator**, **Field Reasoning**, **Expedition Analyst**. **Promise:** combines location/environment, communication, safety and human-factor information into risk-aware decisions for realistic *non-operational* situations. **Draft pathways:** Orientation & Conditions; Communications; Safety & Support; Human Judgment. **Prerequisite candidate:** earned ordinary roles in relevant domains, possibly selected banked-topic evidence; **additional requirement:** multi-source transfer assessment that has not shipped. **Capstone differentiation:** smaller number of everyday field decisions, one field context; Mission Integrator combines planning/coordination across broader contexts. **Exclusions:** special-forces analogue, tactical fieldcraft, licensed rescue or security proficiency. **Readiness:** advanced aspirational concept only.

### 3.10 Mission Integrator — NEW **capstone** candidate
**Alternatives:** **Systems Integrator**, **Decision Integrator**, **Mission Planner** (sounds military), **Coordinator** (generalist). **Recommendation:** investigate “Systems Integrator” to avoid mission-language ambiguity. **Promise:** handles conflicting information, coordination roles, ethical constraints, risk and updates in complex fictional civilian cases. **Draft pathways:** Evidence & Information Quality; Options & Trade-offs; Communications & Coordination; Integrated Cases. **Evidence:** prerequisites **and** separately banked authored scenario assessments with traceable answer rubrics. **No current direct seed is sufficient.** **Exclusions:** actual incident command, professional planning or elite military qualification. **Readiness:** late research, not an upcoming badge to make earnable.

## 4. Advanced architecture: serious assessment without arbitrary rank

### Why not “Green Beret 1 / JSOC 2”
U.S. Army sources [O1] describe Green Beret as a formal qualification after selection and intensive preparation. The Special Operations recruiting site [O3] lists distinct specialties such as communications (18E), medical (18D), engineer (18C), etc., plus language/cultural learning. These facts support the *educational abstraction* of specialist domains and integration; they **do not** permit treating military branches/specialties as badge labels or artwork. JSOC's own mission description [O2] describes a subordinate command that coordinates forces; it does not offer learners a “JSOC Level 2” certificate. No authoritative source reviewed substantiates Tier 1/2 as a personal learning rank. **Do not use those as Argus levels.**

### Evaluate alternatives

| Architecture | Advantage | Main defect | Recommendation |
|---|---|---|---|
| A. Six/ten independent ordinary roles, no hierarchy | Simple, immediately understandable | No culminating challenge even after many topics | Keep as baseline |
| B. Ordinary roles + visible “advanced” tier by number of badges | Strong trophy incentive | Evidence-invalid: count does not assess integration, creates artificial ladder | Reject |
| C. Ordinary roles + **applied designation** for specified competencies, separately tested | Meaningful distinction, clear promises | Requires new scenario engine, editorial QA, evidence persistence | **Preferred research hypothesis** |
| D. Two levels within every role (I/II) | Collectibility | Huge content burden and arbitrary symmetry | Defer; only adopt where content justifies |
| E. Single global “elite” rank | Simplifies UI | False equivalence of unrelated knowledge, prestige imitation | Reject |

### Proposed scoring rubric (experimental, not a runtime contract)

Fictional civilian scenario: e.g., a coastal outing changes because conditions worsen and one group member cannot be reached. Show a short weather cue, two conflicting messages, a map, and the role of an assigned helper. The learner must **interpret information**, **state what is unknown**, **identify a proportional, safe communication/escalation choice**, and **revise after a new fact**. Avoid operational response playbooks, rescue simulation, combat, pursuit or medical intervention.

For each authored scenario score **five separately observable dimensions**:
1. **Factual discrimination** (0/1/2): accurately extracts relevant provided observations; no invented facts.
2. **Uncertainty calibration** (0/1/2): records unknowns, alternatives and confidence limits.
3. **Domain connection** (0/1/2): applies correct high-level navigation/environment/communication concepts without overclaiming expertise.
4. **Safety/ethics boundary** (0/1/2): recognizes “stop, disengage, seek qualified help” when indicated; certain unsafe options are **critical failures**.
5. **Update/coordination** (0/1/2): adapts to new evidence and communicates a clear bounded next action.

**Pilot gate, not approved cutoff:** 4 scenarios drawn from ≥2 contexts; each dimension appears at least twice; no critical safety misses; require an acceptable per-dimension floor, *not just* a pooled numerical score. Different contexts and answer alternatives reduce memorization of one script. Test with adversarial ambiguous cases, insufficient information and “do nothing / verify” as correct answers. Do **not** claim a validated psychometric instrument: reliability, item difficulty and transfer would require actual user testing. Source context [E3,F1]. No speed reward.

**Architecture implication:** topic-completion ledger alone cannot describe richer scenario evidence. Research separate `assessmentId`, `assessmentVersion`, `rubricVersion`, `itemIds`, `completedAt`, `criticalFailureCount`, `result`, `provenance`; define migration/export/sync/restore conflict handling before implementation. A role award should point to exact requirement versions and evidence snapshot; freshness still derives independently.

## 5. High-value NEW curriculum candidates — specifically bounded, not shipped

**Research ranking for issue #197 only, NOT implementation priority:** P0 = high-value research soon; P1 = second research wave; P2 = optional/advanced research. These labels do **not** mean the P0/P1 priorities of `docs/LIBRARY_ROADMAP.md`, whose P0 means approved active expansion. None of the topic candidates here is approved for implementation by this research alone. Effort is relative *editorial* complexity (S/M/L/XL), not a duration or development estimate. No topic IDs are reserved. Formats: R=finite recall, V=image/diagram interpretation, A=audio, S=authored scenario. Sources cross-reference §7 and the already researched #104 files. Existing topographic map-literacy research from #140 is deferred under the current Library Roadmap and must be reused before any Map Scale & Symbols expansion.

| P | Candidate topic | Proposed finite score boundary (examples only) | Role(s) / Format | Effort, authority and caution |
|---|---|---|---|---|
| P0 | Coordinate Systems I | Recognize decimal-degree vs degree/minute/second representation; spot hemisphere/sign ambiguity | Navigator; R+V | M; chart/navigation authority [N1]; avoid real navigation guarantee |
| P0 | Map Scale & Symbols | Interpret legend, scale and simple map-distance samples; distinguish map feature vs assumption | Navigator; V+S | M; [N1]; use original/licensed diagrams |
| P0 | Position & Bearing Cases | Solve short static diagram bearing/reciprocal/declination questions under stated conventions | Navigator; V+S | M; [N1]; no instrument-handling claim |
| P0 | Marine Buoyage / Chart Symbols | Recognize bounded vessel navigation symbols, lateral/sign conventions for specified waters | Mariner; V | L; current Canadian nautical authorities needed; not universalize jurisdictions |
| P0 | Collision Signal Scenarios | Distinguish prescribed lights/day-shape configurations in explicitly bounded illustrations | Mariner; V+S | L; Canadian Regulations [M1]; physical/international contexts and permissions reviewed |
| P0 | Marine Weather Decision Literacy | Distinguish forecast/observation, warning terminology, uncertainty; choose low-risk information checks | Mariner; R+S | M; [M2,M3]; *not* forecasting from one cloud photo |
| P0 | Observation vs Inference | Classify observed facts, hypothesis, missing fact and alternative in authored vignette | Human Factors, Operator; S | M; **already deeply researched** `library-research/OBSERVATION_VS_INFERENCE.md`; reuse #104 |
| P0 | Bias Control | Identify bias and update confidence when new evidence contradicts first hypothesis | Human Factors, Operator; S | L; `library-research/BIAS_CONTROL.md`, [P1,P2]; bias elimination/field transfer NOT established |
| P0 | Attention & Perception Limits | Recognize selective attention, change blindness and limits of visual search in constructed examples | Human Factors; V+S | M; primary cognition studies/replication audit required |
| P0 | Memory & Retrieval | Distinguish working vs longer-term retrieval, testing vs rereading, spacing; choose learning example | Human Factors; R+S | M; [E1,E2]; avoid personal neurological diagnosis |
| P0 | Dive Hand Signals | Recognize a bounded set of common recreational signals, including distress and stop | Diver; V | M; [D1,D3]; differences across operators are possible; cite scheme/version |
| P0 | Dive Buddy Briefing | Identify checklist/communication/equipment familiarity purposes in non-operational examples | Diver; R+S | M; [D2,D3]; not sign-off to dive |
| P0 | Emergency Escalation & Scene Safety | Recognize when to call EMS, avoid unsafe scenes and seek trained help, jurisdiction-labelled | Responder; S | L; [R1,R2]; high-liability review; not CPR instructions |
| P0 | Help Request Information | Identify what is known and important to communicate to responders without speculation | Responder, Communicator support; R+S | M; [F1,R1]; no active dispatch role claim |
| P1 | Stress & Cognitive Workload | Recognize overload, interrupted attention, trade-offs and limitations of self-assessed readiness | Human Factors; S | M; specialist human-factor sources to vet; no medical/wellness advice |
| P1 | Group Decisions & Communication | Spot conformity, missing dissent, unclear roles and confirmation drift in safe cases | Human Factors, Mission; S | M; [F1,E3]; avoid overgeneralization |
| P1 | SI Unit Transformations | Apply defined prefixes and mixed-unit expressions, identify incorrect units | Technical; R+S | M; BIPM [T1] (2026 revision), NIST [T2] |
| P1 | Measurement Uncertainty | Distinguish precision, accuracy, significant figures and estimated uncertainty | Technical; R+S | L; NIST [T2]; do not imply laboratory qualification |
| P1 | Binary / Hex in Context | Convert short binary/hex strings and explain where representation changes vs underlying value | Technical; R+S | M; source-backed digital standards still to select |
| P1 | Text Encoding Fundamentals | Recognize code point vs byte/encoding and detect simple ASCII/UTF-8 representation assumptions | Technical; R | M; official Unicode standard needed; avoid teaching operational cybersecurity |
| P1 | Situational Awareness I | Establish benign baseline, notice change, qualify inference, choose low-risk next action | Operator, Field; S | L; **existing** `library-research/SITUATIONAL_AWARENESS_I.md`; guard against stereotyping |
| P1 | Active Listening / De-escalation | Select respectful paraphrase, open question, boundary and escalation in civilian examples | Responder, Human Factors; S | L; **existing** `CRISIS_ACTIVE_LISTENING.md`/`DE_ESCALATION_I.md`; not crisis-negotiation certification |
| P1 | Psychological First Aid | Recognize Look/Listen/Link/Live and when civilian supportive actions are insufficient | Responder; S | L; **existing** `PSYCHOLOGICAL_FIRST_AID.md`; not psychotherapy |
| P2 | Source Quality & Information Handoff | Distinguish observation vs hearsay, source conflict and uncertainty labels | Field, Mission; S | L; anchored to `INTERVIEWING_I.md` + [E3,F1] |
| P2 | Multi-domain Scenario Set | Apply and revise safe coast/outing/event-coordination decisions across supplied source packets | Advanced/Capstone; V+S | XL; [F1,E3], must have novel rubric engine and editorial review |

**Important programme discovery:** #104 has nine-plus related deep-research briefs, including `OBSERVATION_VS_INFERENCE.md`, `BIAS_CONTROL.md`, `SITUATIONAL_AWARENESS_I.md`, `PSYCHOLOGICAL_FIRST_AID.md`, `DE_ESCALATION_I.md`, `CRISIS_ACTIVE_LISTENING.md`, `INTERVIEWING_I.md`, and `THREAT_RECOGNITION_I.md`. Their research-level endorsement does not mean topic is shipped. Current maintained roadmap and research method, not superseded #104 proposal documents, must be consulted for sequencing. Specifically, avoid collapsing “threat recognition” into amateur profiling, and avoid a task that teaches responding to violence.

## 6. Evidence quality and editorial decision rules

**Level A — canonical definitions/regulation:** WMO genus taxonomy, Canadian Collision Regulations, BIPM SI prefixes, Ontario reserved-title law. Can define precise factual Test items. Check effective jurisdiction/date and rights for copied materials.

**Level B — public professional training guidance:** Canadian Red Cross first aid, DAN and PADI recreational safety guidance, FEMA ICS. Can bound educational competencies, but professional training outcomes do not transfer to a recall PWA.

**Level C — peer-reviewed evidence:** retrieval/spaced practice support is comparatively robust [E1,E2]; transfer depends on context [E3]. Evidence on bias-mitigation interventions is mixed [P1,P2]; identify confidence, study quality and out-of-domain uncertainty explicitly.

**Level D — design/product analogues:** Khan/Brilliant patterns and UX guidance support *hypotheses*, not tested effectiveness in Argus. Do not label a pattern “proven” because a competitor has it.

**Source-to-item traceability:** every proposed scored statement needs source URL/title, jurisdiction/version, exact boundary, conflicting variants, asset license, item modality, unsafe misunderstanding, owner/QA reviewer. Record when the cited item is a **first-party provider claim** (e.g., a certification service about its own requirements) rather than independent evidence. Recheck materials that change with legal/clinical standards.

### Research gaps not yet verified (do not fill with guesses)
- Exact complete content/items and provenance of all 24 scored topics; manifest + name list is not a full semantic audit.
- Published individual “Tier 1/Tier 2” credential standard from US military: **not found** in primary sources checked; do not assert it exists.
- Validated mobile scenario-assessment threshold or transfer from a personal PWA to complex decisions: **not established**.
- Copyright permissions for adapted charts, agency schematics, photographs, logos and official insignia: **not granted by citation**.
- Local title/representation law beyond Ontario, and actual user interpretation of “Cognitive Specialist,” “Operator,” “Field Specialist” and “Mission Integrator.”
- Durable award persistence through deletion/replacement/import and changing authored requirements; `roles.ts` currently derives `earned` from local banked topic records and therefore does **not** prove it survives removal.
- Whether the research-ready #104 scenario courses can fit the presently shipped `scope/items/Test` model without a new assessment type.

## 7. Consulted source register (external evidence)

As of 2026-10-07. “Last verified” means publicly available page reviewed in this pass, not the document's original publication. Source URLs support specific claims; hyperlinks are **not** permission to republish text or artwork.

| ID | Authority / publication | Concrete evidence used | Strength / limitations |
|---|---|---|---|
| O1 | [U.S. Army — Special Forces](https://www.goarmy.com/careers-and-jobs/specialty-careers/special-ops/special-forces), current public recruiting page | Selection and formal Special Forces Qualification Course; Green Beret is a military qualification | Direct authority for *its own* course; public recruiting, not general instructional standard |
| O2 | [USSOCOM — JSOC mission](https://www.socom.mil/pages/jsoc.aspx), undated/current | JSOC is a subordinate command with assigned-force mission; no personal Argus-equivalent rank | Direct government description |
| O3 | [U.S. Army Special Operations Recruiting — Special Forces](https://www.goarmysof.army.mil/SF/BPDJ/), undated/current | SF specialties (18B/C/D/E, etc.), language/cultural studies and applied qualification | Direct recruiting source; never copy military training/insignia |
| F1 | [FEMA — ICS Training](https://training.fema.gov/programs/nims-ics-position-specific/icstraining.aspx), current | Staged audience/role training, modular incident command functions, coordination | Government model; **NOT** an Argus credential or operational training template |
| F2 | [U.S. Fire Administration — NIMS Command & Coordination](https://www.usfa.fema.gov/a-z/nims/command-and-coordination.html), current | Cross-organization communication, information sharing, coordination distinctions | Official conceptual analogy only |
| E1 | [Dunlosky et al., *Improving Students' Learning With Effective Learning Techniques*](https://www.psychologicalscience.org/journals/pspi/1529100612453266/), 2013 | Practice testing/distributed practice strong; other techniques context-dependent | Peer-reviewed review, not an Argus product trial |
| E2 | [Weinstein et al., *Teaching the science of learning*](https://pmc.ncbi.nlm.nih.gov/articles/PMC5780548/), 2018 | Spacing, retrieval, interleaving and modality/design principles | Scholarly tutorial synthesis |
| E3 | [National Academies — *How People Learn*, Transfer of Learning](https://www.nationalacademies.org/read/9853/chapter/15), 2000 ed. | Transfer distinguishes flexible learning from reproduction of presented facts | Foundational synthesis, older; applied implementation needs validation |
| E4 | [Wang et al., SDT-based education interventions meta-analysis](https://www.sciencedirect.com/science/article/pii/S0023969024000572), 2024 | Autonomy/competence supports have measured motivation effects | Population/context variance; not evidence any specific badge works |
| E5 | [Li, Hew & Du, Gamification motivation review](https://link.springer.com/article/10.1007/s11423-023-10337-7), 2024 | Gamification outcomes mixed by dimension; motivation effects ≠ competence gains | Systematic review, limited product comparability |
| P1 | [Korteling et al., Bias mitigation transfer review](https://pmc.ncbi.nlm.nih.gov/articles/PMC8397507/), 2021 | Insufficient evidence of durable transfer to real-world decisions | Strong caution against “bias immunity” claims |
| P2 | [Systematic review/meta-analysis of debiasing in students](https://pubmed.ncbi.nlm.nih.gov/40858766/), 2025 | Small task-specific improvements, transfer and study-bias caveats | 54 RCTs; all studies unclear/high bias in abstract |
| P3 | [Ontario Psychology and Applied Behaviour Analysis Act, 2021, s.8](https://www.ontario.ca/laws/statute/21p27/v3), as displayed 2026 | Protected titles and restrictions on representation of qualification | Primary statute; not a substitute for professional legal review |
| M1 | [Canadian Collision Regulations](https://laws.justice.gc.ca/eng/regulations/C.R.C.%2C_c._1416/), current Sept 2026 | Vessel lights, day shapes and applicable regulations | Primary legal text; specific contexts/updates matter |
| M2 | [Canadian Coast Guard — Radio Aids to Marine Navigation 2026](https://www.canada.ca/en/canadian-coast-guard/corporate/publications/radio-aids-marine-navigation/general.html), 2026 | Marine distress/routine communication and pre-departure checks | Official marine guidance, not operator licensing |
| M3 | [WMO International Cloud Atlas — Ten Genera](https://cloudatlas.wmo.int/principles-of-cloud-classification-genera.html), 2017 edition | Exactly ten defined genus groups | Primary technical classification; recognizing natural variation requires more images |
| N1 | [NOAA — Nautical chart compass rose](https://vos.noaa.gov/MWL/aug_07/nauticalcharts.shtml), 2007 | True vs magnetic bearings/nautical chart context | Government technical explainer, older but foundational |
| D1 | [PADI — Scuba diving hand signals](https://blog.padi.com/scuba-diving-hand-signals/), public article | Common recreational hand-signalling vocabulary | Provider guidance; wording/variations require checking |
| D2 | [DAN — Questions to Ask a New Dive Buddy](https://dan.org/alert-diver/article/questions-to-ask-a-new-dive-buddy/), 2025 | Buddy communication, training-level matching, emergency plan, gear familiarization | Expert association guidance, not dive qualification |
| D3 | [DAN — Smart Guides](https://dan.org/health-medicine/health-resources/smart-guides/), current | Scope of safe prep/gas/equalization topics | Public safety educational material |
| D4 | [DAN — Ear Equalization Guidelines](https://dan.org/safety-prevention/diver-safety/divers-blog/ear-equalization-guidelines-for-scuba-divers/), 2020 | Ear pressure/equalization and risk; keep concepts not training instructions | Medical/safety-sensitive; expert review needed |
| R1 | [Canadian Red Cross — Intermediate First Aid & CPR](https://www.redcross.ca/training-and-certification/course-descriptions/first-aid-at-home-courses/standard-first-aid-cpr), current | Certification explicitly involves live skills and knowledge evaluation | First-party certifier; decisive boundary for Argus claim |
| R2 | [AHA — 2025 CPR/ECC Guidelines](https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines), 2025 | Evidence-derived clinical-response guidelines with updates | Clinical content changes; no medical procedures from snippets |
| R3 | [Canadian Red Cross — Choosing a Course](https://helpsupport.redcross.ca/hc/en-ca/articles/41322440211611-Which-Course-Should-I-take), updated July 2026 | Certification vs noncertification distinction | First-party provider rules |
| T1 | [BIPM SI Brochure 9th edition](https://www.bipm.org/en/publications/si-brochure), revised June 2026 | Authoritative SI and current prefixes | Check precise version; official source, not graphic license |
| T2 | [NIST — SI prefix rules](https://www.nist.gov/pml/special-publication-330/sp-330-section-3), current | Decimal SI vs binary prefixes and notation conventions | Official standards explainer |

## 8. Ranked owner decisions / proposed research follow-ups

| Rank | Decision to bring to owner | Default **recommendation**, NOT approval | Implementation dependency |
|---|---|---|---|
| 1 | What is the *most useful next earnable* role? | **Navigator** with narrow knowledge claim, then **Mariner**, no false field competence | Final topic audit; user approval |
| 2 | Is Human Factors a distinct line? | **Yes as research candidate**, prefer bounded “Human Factors / Cognition & Judgment” | Reconcile #104 assets, scenario validation and name test |
| 3 | Do we display tiers? | **No global tiers**; later optional “Advanced” and “Capstone” *descriptors*, not personal ranks | Credible scored evidence first |
| 4 | Can Diver and Responder earn now? | **No**; each lacks sufficient domain-specific topics | Dive/emergency editorial review |
| 5 | Operator or Field Specialist first? | Operator = bounded evidence-reasoning curriculum; Field = later integration | #104 curricula; test engine |
| 6 | Technical name and threshold? | Defer “Specialist” until applied data/measurement cases; consider Technical Literacy | Applied content |
| 7 | Mission Integrator nomenclature? | Compare **Systems Integrator** and **Mission Integrator**, not military titles | Owner language decision |
| 8 | Do we force coverage of two orphans? | **No**; retain Firearm Safety and CAF Rank Equivalencies as standalone | None |
| 9 | What is the permanent-award model? | Immutable award record with definition/evidence version and recovery/import policy, *in addition to* derived freshness | Data architecture research |
| 10 | What is a valid capstone pass? | Mixed authored civilian cases + rubric/critical boundaries, not a total-topic counter | UX, grading, content validation |

### Next research iteration required before scope freeze
1. Inspect each of the 24 actual scored decks, directions, reference assets and source/license entries; the catalog inventory alone is not a scored-boundary audit.
2. Reconcile new role/topic proposals against `docs/LIBRARY_ROADMAP.md`, `docs/LIBRARY_RESEARCH_METHOD.md`, and `docs/open/library-research/*` before opening duplicate issues.
3. Prototype a **text-only** scenario and adversarial answer key; have a reviewer check safety, ambiguity and multiple justifiable choices. Then test non-ideal/unknown cases.
4. Run owner naming/claims test: *“What does this badge prove? What does it not prove?”* Reject any title that prompts a professional or military competence assumption.
5. Specify versioned role awards, import/export and scenario evidence *before* allowing independent advanced badges.
6. Hand off **approved** meanings and original symbol briefs to #192 for PNG → layered SVG fidelity audit. This research produces no artwork.
