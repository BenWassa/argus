# Issue #197 — Expanded role architecture and new learning-line research

**Status:** Active **research and owner-decision dossier** — 2026-10-07. No additional roles approved or earnable through this document.
**Authority:** Candidate taxonomy, catalog coverage, evidence standards and research backlog; **not** a runtime role contract or approval to produce awards/art.
**Issue:** [#197](https://github.com/BenWassa/argus/issues/197).
**Related authorities:** [#191](ISSUE_191_ROLE_DESIGNATIONS.md) (merged Communicator contract), [#192](ISSUE_192_ROLE_BADGE_ART.md) (locked Nautical visual family), `src/domain/roles/definitions.ts`, `src/domain/library/shippedCatalog.json`; historical topic-archetype audit #8.


**Deep research pass (2026-10-07):** Source-led findings, ten detailed role candidate briefs, curriculum proposals and a 25-source external evidence register are maintained in [#197 evidence and curriculum research](ISSUE_197_EVIDENCE_CURRICULUM_RESEARCH.md). Existing UI audit, options, accessibility, interactive scenarios, award persistence and prioritized mobile prototypes are in [#197 role UX and architecture research](ISSUE_197_ROLE_UX_ARCHITECTURE_RESEARCH.md). **Both are research only; neither approves new roles, implementation, art or a change in priority.** `docs/LIBRARY_ROADMAP.md` remains the implementation-priority authority.

## 1. Why this document exists

Argus's six initially approved role *names* make sense, but their initial topic mapping is neither comprehensive nor a compelling upper-end achievement architecture. The owner also wants a substantive psychology/human-factors line, technical literacy, and challenging multi-domain achievements inspired by the breadth of specialized operational curricula (Green Berets / U.S. Army Special Forces, JSOC mentioned as an inspiration). Those comparisons require careful factual research; they must **never** suggest an Argus badge equals an actual special-operations billet, selection, qualification or license.

A first deliverable is a **complete, auditable, mutually exclusive and collectively exhaustive classification of the 24 current shipped topics**. The second is an intentionally **non-MECE overlay of role pathways** with sensible cross-role reuse. The third is a research-based framework to add new topics and credible advanced/capstone roles.

Research these questions without moving unapproved definitions into the app. Future topic-count growth should update this inventory from the manifest, not by memory.

## 2. Locked decisions (do not reopen without explicit owner direction)

- The top-level destination is **Roles**; implemented MVP opens **Communicator** directly, with no empty role-gallery UI.
- The **six approved identities** are **Communicator, Navigator, Mariner, Diver, Responder, Operator**. Only the Communicator requirements are locked and currently earnable; do **not** mark the other five role requirements as approved.
- **Communicator v1** is complete only upon **all seven** shipped catalog topics being banked:
  - **Codes & Signalling:** NATO Alphabet, International Morse Code, Signal Flags.
  - **Radio Fundamentals:** Radio Numbers, Radio Procedure.
  - **Marine Communications:** Marine Calling, Marine Priority Calls.
- Pathways are *fully open* (suggested order only, no sequencing/prerequisites); pathway completion displays **Complete** but never awards a separate badge.
- One badge per *entire completed role*; avoid XP, leaderboards, tiers and global ranks. Show real pathway state and **raw topic counts**, not simplistic “% mastered.”
- An earned role is a **permanent historical achievement** across later retention decay. Record freshness separately. **Gap to research:** evidence deriving from topic records may disappear on deletion/replacement/import; durable award ledger/versioning must be designed separately if this stronger promise is to survive those cases.
- Roles are Argus finite knowledge designations, **not professional or military credentials**.
- **Nautical medallion** is locked as the visual family. For future badges: approve concept/PNG **first**, then manually reconstruct editable-layer SVG, compare at 220/96/48/32 px, reject visual deterioration. Full earned colour only after role completion; monochrome locked previews permitted; never animate pathway “badges.”
- New roles are researched and potentially illustrated ahead of earnable curriculum, but only become available when their coherent curriculum and evidence threshold are approved.

## 3. MECE primary Library categories — 24 of 24

This primary classification is a **product planning taxonomy**, not confirmation that a new Library categories UI has shipped. It answers *what type of topic is this?* Role memberships answer *which broader learning designation may draw upon this topic?* One shipped topic has exactly one primary category, irrespective of how many roles reuse it.

| Primary category | Count | Inclusion criterion | Boundary |
|---|---:|---|---|
| Communications & Signalling | 7 | Codes, alphabets, signals and radio procedure | Marine radio stays here as its primary knowledge type, despite maritime context |
| Navigation | 5 | Compass orientation, bearings, north reference frames and map bearings | Conditions/weather separate |
| Maritime & Weather | 4 | Vessel-light/shape recognition and atmospheric/weather classifications | Marine VHF stays in Communications |
| Diving | 1 | Diving-specific equipment | Avoid padding with generic marine material |
| Emergency & Safety | 2 | Emergency survey and preventive safety principles | Firearm Safety is **not** operational/weapon proficiency |
| Decision-Making & Operations | 1 | General decision framework | Does not confer special-operations capability |
| Technical Foundations | 3 | Units, notation systems and basic digital representation | Coherence as a formal Technical Specialist role remains unproven |
| Military Knowledge | 1 | Ranks and equivalencies knowledge | Recognition/equivalencies are not rank, service or training |
| **TOTAL** | **24** | **One category each** | **7 + 5 + 4 + 1 + 2 + 1 + 3 + 1 = 24** |

### All shipped topics with cross-role candidate matrix

**Legend:** **L** = locked, required (only Communicator); **P** = proposed directly relevant seed for a role; **O** = possible contextual/supporting overlap, not approved for completion; **—** = no role fit suggested (and that's acceptable). The research must validate or remove every P/O. **No L/P/O value outside Communicator means an earning requirement is established.**

**Role columns:** Com Communicator, Nav Navigator, Mar Mariner, Div Diver, Res Responder, Op Operator, Cog Cognitive Specialist, Tech Technical Specialist, Field Field Specialist, Mission Mission Integrator. The latter four names remain **research proposals**, not locked additions.

| # | MECE category | Shipped title | Canonical ID | Com | Nav | Mar | Div | Res | Op | Cog | Tech | Field | Mission |
|---:|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Communications & Signalling | **NATO Alphabet** | `nato-phonetic` | L | — | — | — | — | O | — | — | O | — |
| 2 | Communications & Signalling | **International Morse Code** | `international-morse-letters-printed` | L | — | — | — | — | — | — | — | O | — |
| 3 | Communications & Signalling | **Radio Numbers** | `radiotelephony-numbers` | L | — | — | — | — | O | — | — | O | — |
| 4 | Communications & Signalling | **Radio Procedure** | `radio-procedure` | L | — | — | — | — | O | — | — | O | O |
| 5 | Communications & Signalling | **Marine Calling** | `marine-vhf-routine-calling` | L | — | P | O | — | — | — | — | O | — |
| 6 | Communications & Signalling | **Marine Priority Calls** | `marine-vhf-priority-communications` | L | — | P | — | O | — | — | — | O | O |
| 7 | Communications & Signalling | **Signal Flags** | `signal-flags` | L | — | P | — | — | — | — | — | — | — |
| 8 | Navigation | **Compass Bearings** | `cardinal-bearings` | — | P | — | — | — | O | — | — | O | — |
| 9 | Navigation | **Whole-Circle Bearings** | `whole-circle-bearings` | — | P | — | — | — | O | — | — | O | — |
| 10 | Navigation | **Reciprocal Bearings** | `reciprocal-bearings` | — | P | — | — | — | O | — | — | O | — |
| 11 | Navigation | **True & Magnetic North** | `north-references-declination` | — | P | O | — | — | O | — | — | O | — |
| 12 | Navigation | **Grid North & Map Bearings** | `grid-north-map-bearings` | — | P | O | — | — | O | — | — | O | — |
| 13 | Maritime & Weather | **Navigation Lights & Aspect** | `navigation-lights` | — | — | P | — | — | — | — | — | — | — |
| 14 | Maritime & Weather | **Vessel Day Shapes** | `vessel-day-shapes` | — | — | P | — | — | — | — | — | — | — |
| 15 | Maritime & Weather | **Beaufort Scale** | `beaufort-wind-scale` | — | O | P | O | — | O | — | — | O | — |
| 16 | Maritime & Weather | **Cloud Genera** | `cloud-genera` | — | O | P | O | — | O | — | — | O | — |
| 17 | Diving | **SCUBA Equipment** | `scuba-equipment-abbreviations` | — | — | — | P | — | — | — | — | — | — |
| 18 | Emergency & Safety | **Primary Survey** | `primary-survey` | — | — | — | O | P | — | — | — | O | — |
| 19 | Emergency & Safety | **Firearm Safety** | `firearm-safety-acts-prove` | — | — | — | — | — | — | — | — | — | — |
| 20 | Decision-Making & Operations | **OODA Loop** | `ooda-loop` | — | — | — | — | — | P | P | — | O | O |
| 21 | Technical Foundations | **SI Prefixes** | `si-prefixes` | — | — | — | — | — | — | — | P | — | — |
| 22 | Technical Foundations | **Greek Alphabet** | `greek-alphabet` | — | — | — | — | — | — | — | P | — | — |
| 23 | Technical Foundations | **Hex to Binary** | `hex-digits-binary` | — | — | — | — | — | — | — | P | — | — |
| 24 | Military Knowledge | **CAF Rank Equivalencies** | `caf-rank-equivalencies` | — | — | — | — | — | — | — | — | — | — |

**Automated reconciliation at authoring:** every ID above appears exactly once and matches the 24 IDs in `src/domain/library/shippedCatalog.json` on `main` at the time this document was prepared. `src/domain/library/catalogSeed.ts` and the per-domain topic modules supply display titles.

**Important holes (not forced memberships):** `firearm-safety-acts-prove` and `caf-rank-equivalencies` currently have **no defensible candidate role**. `si-prefixes`, `greek-alphabet`, `hex-digits-binary` are only hypothetical seeds of a Technical Specialist curriculum, *not proof* that three unrelated reference decks earn technical proficiency. Other rows with P/O are **research hypotheses**, not confirmed coverage. Do not chase 100% role usage.

## 4. Research portfolio: 6 locked-name identities + 4 candidate lines

**Labels are editorial hypotheses for research, not approved pathway contracts.** A pathway must map to an actual, finite knowledge objective. No extra badge exists for a pathway. Each role requires a full independent rationale before its requirements are locked.

| Role | Identity status | Working purpose | Example pathways to research | Current direct candidate evidence | Main missing work / exclusion |
|---|---|---|---|---|---|
| **Communicator** | **LOCKED, MVP merged** | Foundational communication codes, signalling and radio procedures | **LOCKED** Codes & Signalling; Radio Fundamentals; Marine Communications | **7 required, fully enumerated above** | Printed Morse letter mastery does **not** establish aural reception or sending; do not quietly expand its claim |
| **Navigator** | **Name locked, requirements proposed** | Know direction/orientation and interpret bearings/maps across contexts | Bearings & Direction; North & Map References; Navigation Applications (future) | 5 navigation topics | Coordinates, route planning, positioning; distinguish learning definitions from field practice |
| **Mariner** | **Name locked, requirements proposed** | Understand marine vessel signals, environment and relevant procedures | Vessel Recognition; Marine Weather; Marine Communications & Signals | Lights, Day Shapes, Beaufort, Clouds, marine VHF x2, flags | Avoid claiming sailing competence, COLREG qualification, navigation certificates; separate from Navigator |
| **Diver** | **Name locked, requirements proposed** | Understand recreational diving equipment, environment, planning and safety | Diving Equipment; Underwater Communications; Dive Planning & Safety; Environment | SCUBA Equipment only as a direct seed | Dive-specific communication, physiology, equipment handling, dive tables/limits from competent authoritative sources; **no dive certification claim** |
| **Responder** | **Name locked, requirements proposed** | Recognize emergency priorities and recall bounded first-response frameworks | Initial Assessment; Escalation & Communication; Risk/Scene Awareness | Primary Survey only direct | Contextual emergency material, response priorities, sourced protocols and limits; **Firearm Safety is not a substitute**; no medical certification |
| **Operator** | **Name locked, requirements proposed** | Reason under uncertainty using situation assessment and fundamental field information | Situational Awareness; Decision-Making; Navigation & Communications | OODA direct; navigation/comms overlaps possible | Must not become a vague “tactical miscellaneous” bucket; research distinction from Field Specialist |
| **Cognitive Specialist** / **Human Factors** | **NEW proposal** | Attention, memory, perception, biases, judgement, social dynamics and stress | Cognitive Foundations; Behaviour & Motivation; Judgement; Social Psychology; Human Performance | OODA potential seed/overlap only | Research empirical psychology and professional-title limits; no clinical diagnostic/therapeutic claim |
| **Technical Specialist** | **NEW proposal** | Coherent scientific/measurement/digital literacy rather than unrelated symbols | Measurement & Notation; Encoding & Numeracy; Applied Technical Foundations | SI Prefixes, Greek Alphabet, Hex to Binary **tentative only** | Assess whether baseline too diffuse; require application/interpretation topics before role is earnable |
| **Field Specialist** | **NEW advanced proposal** | Integrated cross-domain field reasoning, conditions, communications, response and people | Field Orientation; Communication; Safety/Emergency Judgement; Environmental Assessment; Human Factors | Possible reuse from several roles | Define additional authored content + grounded assessment; **not** an actual Green Beret qualification and not weapons/tactics coaching |
| **Mission Integrator** | **NEW capstone proposal** | Integrate information and knowledge across domains to make defensible coordinated decisions | Planning & Risk; Information Reliability; Multi-party Communication; Decision-Making; Applied Scenarios | Some foundation overlaps but **no real capstone evidence** | Research non-operational fictional scenarios and an actual scored model, rather than merely completing many flashcards |

### Boundary tests to apply to *every* new role

1. **One-sentence promise:** what actual knowledge does the title represent? Could a learner reasonably explain why each included topic is necessary?
2. **Content integrity:** what precisely is tested and by what modality? Opening reading content, seeing one picture or doing a Morse lesson is not completion evidence.
3. **Cross-domain value:** does the role meaningfully combine several primary categories, or should this just remain an ordinary Library topic/group? Narrow meaningful roles may be acceptable, but no padding.
4. **Differentiation:** could the same seven topics trivially earn two very similar badges? If yes, reconsider the boundary.
5. **Earnability:** is the existing curriculum sufficient and reasonably finishable? Estimate genuine cognitive/time burden rather than treating all topics as equal units.
6. **Claims/safety:** no competence claim beyond the scored boundary; identify likely misleading associations and real-world credential implications.
7. **Versioning/permanence:** a revised role definition must not silently un-earn the historical award. Explore durable award storage, import/export, sync and deletion conflicts with #191.
8. **Design readiness:** badge symbolism must be original, meaning-linked and separable into coherent editable SVG layers *after* approved PNG.

## 5. Research for advanced/operator achievements

The owner is interested in **high-prestige, top-end achievement** influenced by the breadth associated with U.S. Army Special Forces (“Green Beret”) and JSOC. These are **not interchangeable role levels** and “Tier 1/2” terminology must be verified from authoritative material rather than assumed to be a real official personal credential ladder. Never copy actual ranks, unit emblems, distinctive symbols, restricted documents, training qualifications or selection claims.

**Research decision:** Should advanced achievements be separate role identities (Field Specialist/Mission Integrator), earned capstones of several ordinary role pathways, or some other structure? Compare:
- Distinct multidisciplinary **advanced role** with additional finite domain requirements and authored scenario assessments.
- **Capstone designation** earned by validating transfer/integration of existing knowledge in a fictional, civilian-safe applied assessment.
- **Only ordinary roles** until relevant curricula exist, leaving aspirational badge design as planning work.

**Unacceptable shortcut:** Gate a prestige badge solely on “earn 5 badges,” an arbitrary XP number or time spent. Such a count can be a prerequisite but cannot substitute for a role's independent knowledge boundary. Avoid any material that trains operational violence, weapons handling beyond high-level safety, evasion, targeting or field assault skills; the research can focus on communication, risk judgement, ethics, navigation concepts and information quality.

**Primary source research leads (to verify, not asserted conclusions):** U.S. Army / USASOC, official JSOC information where publicly available, relevant doctrine about leadership/coordination only where public and appropriate; analogous civilian incident management, human factors and crisis communications programmes. Record exact source title/URL/publication date, authority, scope and rationale for borrowing a **concept**, never source images or trade badges.

## 6. Psychology / human factors research line

Evaluate title **Cognitive Specialist** against **Human Factors**, **Behavioural Science**, **Cognitive Foundations** and an editorial (not credential-sounding) alternative. Cognitive Specialist is currently the working proposal, *not* locked. The goal is general empirical literacy, not diagnosing conditions, counselling or professional qualification. Consider an explicit overlap with **OODA Loop** only if the scored content genuinely teaches the relevant cognitive construct.

Research: attention/perception, memory and learning, heuristics/biases, emotion/stress under workload, motivation and reinforcement, social influence/group decision-making, human-machine interaction/ergonomics, uncertainty and communication. For each, identify finite testable units and whether knowledge-only tests have appropriate confidence limits. Seek high-quality peer-reviewed or primary educational sources; verify local legal restrictions on professional titles/claims before naming.

**Candidate first topics to propose for research** (not authorized for creation):
- Attention and selective perception — demonstrable limits and common errors.
- Working memory, retrieval and spacing — distinct constructs, not wellness advice.
- Decision biases and uncertainty — recognize examples and evidence quality.
- Cognitive workload and fatigue — safety boundaries and applied reflection.
- Group decision processes — social influence, conformity and coordination.

## 7. Technical literacy and orphan topics

Proposed Technical Specialist *may* bring **SI Prefixes**, **Greek Alphabet** and **Hex to Binary** into a coherent measurement/notation/encoding line, but current topics are very small and largely static reference sets. Research adjacent **applied** content (unit transformations, measurement uncertainty, base systems, encoding use cases, structured data and technical communication) before claiming a specialist. “Greek alphabet memorized” is not independently evidence of technical competency.

The two unassigned topics should remain explicit, not invisibly absorbed:
- **Firearm Safety:** preventive principles/recognition only. Not a default Operator, Field Specialist or Responder requirement. An eventual safe/safety-literacy line would need its own evidence and boundary.
- **CAF Rank Equivalencies:** descriptive military organizational literacy only. Could justify later “Service Literacy” or an organization/recognition line *if* more independently sourced content is developed. Does not imply armed-forces membership, rank or qualification. Related CAF insignia artwork licensing remains a **separate** research gate.

Document why any new role needs these topics before proposing actual membership. No commitment to one role per primary MECE category.

## 8. Research backlog / sequencing

| Priority | Work package | Concrete output | Owner gate |
|---|---|---|---|
| **P0** | Re-check shipped manifest and MECE map | Topic IDs/titles, one primary category per ID, 24-row matrix, drift test | Confirm Library group names and any mismatch |
| **P0** | Navigator and Mariner scope | Full proposed paths, exclusions, topic-level load/claims audit | Lock exact earnable requirements |
| **P0** | Cognitive Specialist / Human Factors naming and curriculum | Alternatives, source-backed finite topic proposals, risk/claims review | Lock identity only if coherent |
| **P1** | Diver and Responder research | Missing dive/response curricula and safe evidence boundaries | Decide defer vs staged availability |
| **P1** | Operator vs advanced Field Specialist | Clear conceptual separation and real assessment boundaries | Decide if advanced should be an earned separate role |
| **P1** | Technical Specialist coherence | Whether SI/Greek/Hex belong together; proposals for application-based topics | Lock/defer candidate |
| **P1** | Capstone model | Scenario modalities, scoring/feedback, possible prerequisite logic | Confirm capstone architecture |
| **P2** | Orphan-topic assessment | Firearm Safety and CAF Rank Equivalencies placement rationales | Decide leave standalone versus future line |
| **After decisions** | Artwork and UI brief updates | Individually approved badge symbols/PNG masters; SVG construction/animation QA plan in #192 | **Explicit artwork approval** before reconstruction |
| **After decisions** | Implementation/scoped follow-up issues | Small separately reviewable curricular and role-feature tickets | No automatic deployment |

### Suggested authoritative source families to investigate

- **Navigation/maritime:** IHO/IMO COLREG-related primary material, Transport Canada marine guidance, national hydrographic/navigation resources, WMO cloud guides, official Beaufort explanations.
- **Recreational diving:** recognized training-agency/public safety materials and independent diving medicine sources (e.g. DAN), with provenance/license and limitations verified.
- **Emergency response:** local qualified first-aid/resuscitation institutions and health authority protocols appropriate to the intended *knowledge* scope.
- **Human factors/psychology:** established textbooks/academic reviews, peer-reviewed studies and professional regulation sources for titles.
- **Technical foundations:** BIPM/SI authorities, standards bodies, educational computing/network references.
- **Advanced operational comparisons:** public official organizational descriptions only, plus civilian cross-domain/incident-management principles; no implied sanctioned equivalence.

Research agents must cite the **actual documents consulted** with publication/revision dates and specific claims; the organizations above are only discovery leads.

## 9. Research process and owner decisions

For each proposed role, provide a short decision brief that includes: **recommended name**, definition, boundary/exclusions, 2–4 likely open pathways, exact current shipped-topic IDs that plausibly qualify (with justification), needed new topics (not invented as already shipped), overlap with other roles, expected learning effort, scored-evidence limitations, readiness (ready / needs authored topics / defer), and badge symbolism notes *after* scope is approved.

Maintain an explicit state label:
- **Locked identity / locked requirements** — owner-approved, potentially shipped (Communicator only today).
- **Locked identity / proposed requirements** — other five names.
- **Candidate identity** — Cognitive Specialist, Technical Specialist, Field Specialist, Mission Integrator.
- **Rejected / deferred** — retained with rationale; do not silently reintroduce.

### Open owner decisions (present recommendations and alternatives, not presumed answers)
1. Are Cognitive Specialist, Technical Specialist, Field Specialist and Mission Integrator the right names and distinct identities? What alternatives reduce credential/military equivalence problems?
2. Does the Argus role model use **standard / specialist / advanced / capstone**, or only **ordinary + advanced**? Is this taxonomy visible to learners or internal?
3. Which existing topics belong as required versus supporting in Navigator and Mariner? What is the evidence burden?
4. How much purpose-built content is necessary before Diver, Responder, Operator or the psychology/technical line can be earnable?
5. Do advanced achievements require prerequisite badges, independent integrated scenarios, or both? How are scenarios scored without pretending practice equals field competence?
6. How should **historical permanent awards** survive deletion, replacement, imports and definition changes, beyond retention decay?
7. Which future badge symbols are visually distinct while remaining one coherent Nautical medallion family? What minimum fidelity and animation checks are mandatory?

## 10. Acceptance and handoff

- [ ] Catalog manifest reconciled at start of each research iteration, with exactly one MECE category per shipped topic.
- [ ] Full 24×10 hypothesis matrix validated or revised with a **written rationale** for each proposed core/overlap link.
- [ ] Ten individual role-definition briefs with readiness and claims boundaries; current six plus four candidates.
- [ ] Prioritized authored-topic backlog and genuinely sourced research notes, not a list of vague subjects.
- [ ] A tested conceptual advanced/capstone rubric, separate from XP and ungrounded ranks.
- [ ] Legal/terminology/credential/insignia concerns investigated and linked to authoritative sources.
- [ ] Owner-ready alternatives and a dated decision log; update #197 and link any resulting follow-up issues.
- [ ] Hand off approved badge directions to #192: **PNG visual authority → individually QA'd layered SVG → accessible/reduced-motion app rendering**.
- [ ] Keep this dossier under `docs/open/` while actively maintained; move completed/superseded research to `docs/closed/` and update references per `AGENTS.md`.

**Out of scope:** changing `src/domain/roles/definitions.ts`, declaring new roles earnable, generating badges, changing Test scoring or topic data, merging an application implementation, or deploying Argus. Research decisions require owner review first.

## 11. Decision log

| Date | Decision | Authority / notes |
|---|---|---|
| 2026-10-07 | Six role names locked: Communicator, Navigator, Mariner, Diver, Responder, Operator | Owner conversation; only Communicator detailed requirements locked |
| 2026-10-07 | Communicator MVP: 3 fully open pathways, 7 required topics, pathway completion text-only, permanent role badge | #191 / merged #196 |
| 2026-10-07 | MECE Library categories distinct from overlapping roles | Owner conversation; conceptual taxonomy |
| 2026-10-07 | Nautical medallion family; future PNG approval then layered SVG with rigorous fidelity QA | #192 and owner conversation |
| 2026-10-07 | Research additional cognitive, technical, advanced and capstone lines; no approvals yet | #197 scope |

## 12. Deep research findings and UX/UI avenues — 2026-10-07

**Research log, not a locked decision.** This pass reconciled the 24-item shipped manifest and single locked Communicator definition against #191, #192, current `RolesPage.tsx`, `roles.ts`, `DESIGN.md`, the Library Roadmap/Research Method and existing #104 research briefs. It adds two substantive companion documents rather than duplicating the canonical 24×10 matrix here.

- **Curriculum:** Navigator and Mariner have the strongest near-term existing-topic clusters; Diver and Responder have only one direct topic each and should not be made earnable by padding with unrelated subjects. Operator requires evidence-reasoning content; the psychology line has considerable previously researched, **unshipped** material (observation/inference, bias control, situational awareness, interviewing, active listening, PFA and de-escalation). Technical literacy needs applied measurement/encoding, not three unrelated notation decks. Firearm Safety and CAF Rank Equivalencies remain legitimate unassigned topics. Full 10-role briefs and sourced bounded-topic proposals: [research](ISSUE_197_EVIDENCE_CURRICULUM_RESEARCH.md).
- **Advanced/capstone:** Official Army and JSOC descriptions support the analogy of specialist foundation and coordination, **not** any individual “JSOC Tier 2” qualification. Research recommendation: independently scored civilian-safe multi-domain scenarios (source evaluation, uncertainty calibration, communication and reassessment) with explicit safety limits, not XP or badge count. No validated scoring threshold or scenario runtime currently exists.
- **Mobile UX:** the current code shows one Communicator detail intentionally. Keep this while only one role is actually available. Once a second role is approved and earnable, **research/prototype** a compact focus selector, direct Continue action and secondary “explore” disclosures, preserving the exact brushed-gunmetal design tokens and one award per role. An always-visible ten-role trophy gallery is premature. Detailed alternatives, screen sketches, accessibility and tests: [UX research](ISSUE_197_ROLE_UX_ARCHITECTURE_RESEARCH.md).
- **Evidence integrity risk:** current `roles.ts` derives `earned` from existing local banked topic records. Decay is handled, but deletion/import/replacement can remove evidence and affect what appears earned. A durable versioned award receipt/ledger is a **research hypothesis** requiring explicit reconciliation with #191's derived-truth contract before implementation.
- **Authority:** The #197 research ranking is **not** the P0/P1 implementation status of `docs/LIBRARY_ROADMAP.md`. The older #104 scenario implementation proposal was superseded as the roadmap authority; its course research is still valuable as sourced input. Existing #140 topographic-literacy work is deferred, not an unresearched gap.

**Decision order proposed:** (1) next earnable Navigator/Mariner role scope; (2) psychology identity/name and overlap with Operator; (3) technical coherence; (4) ordinary vs advanced distinction and evidence gate; (5) UX navigation after two real roles; (6) immutable award/date/version behavior; (7) only then original badge-symbol briefs under #192. Every recommendation remains subject to owner approval. No code, Test scoring, badges, deployment or merge under #197.
