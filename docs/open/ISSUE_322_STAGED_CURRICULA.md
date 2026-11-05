# #322 — Staged visual and equipment curricula

**Status:** research/content proposal for owner, independent-domain and media review; **not accepted, integrated, or assessed**. **Date:** 2026-11-03. **Scope:** Navigation Lights & Aspect, Vessel Day Shapes, SCUBA Equipment, Beaufort Scale. **Owner:** #322. **Dependencies:** #296 common staged learning, #320 23-topic audit, #147 maritime technical review, #132 SCUBA asset review, #113 persistence. Clouds #321 and Signal Flags #296 are separate.

## Decision and sequencing

**Smallest next implementation candidate: Vessel Day Shapes (4 short stages, existing 5 visual scored items)**, then Navigation Lights (5 stages, existing 16 scored), Beaufort (5 stages, existing 13 scored), and SCUBA (5 stages, 13 scored; the photo-based portion is media-/instructor-gated). These are **four independent review and release slices** under one issue, not one all-or-nothing deployment.

Each topic's existing Test is a legitimate *narrow* source-defined measure, even when the useful future skill is wider. This PR changes **no** seeded items, scoring, library role, routing, persistence, UI or test code. It specifies eventual content and mockups only.

| Topic ID | Legacy scored count | Unchanged Test direction | Intended Learn capability |
| --- | ---: | --- | --- |
| vessel-day-shapes | 5 | Canonical deterministic black-shape figure → positively displayed vessel state | Count and discriminate arrangements, not absence or a legal manoeuvre |
| navigation-lights | 16 | 8 observer-aspect diagrams → visible lights; 8 state signatures → vessel state | Vessel orientation, sectors, observer and light-stack decoding |
| scuba-equipment-abbreviations | 13 | Acronym → full term and broad equipment/function | Recognize the term within a non-operational gas/equipment system; reviewed visual recognition is **not** yet Test |
| beaufort-wind-scale | 13 | Force → descriptive term **and** knots | Relate forces/ranges to credible text-based effects and measured values, without inferring an exact speed from a photo |

**Permanent progress:** retain all original topic IDs and item IDs, item evidence, imported topic records, history, timestamps, awards and roles. One completion of each required authored stage permanently satisfies that stage; replays do not erase it. Formative answers are **not** Test attempts. Formal final Test is independent, optional after lessons, with legacy-completed learners preserving access. An improved assessment direction requires a **new reviewed version of competence/evidence**; prior scores cannot be reinterpreted.

**Shared capability, read-only:** src/domain/learning/stages.ts defines show, choose, contrast, order, complete, recall, checkpoint and summary. The authoring contract in docs/open/ISSUE_296_AUTHORED_LESSONS.md requires readable stable IDs (never lesson-N), max 12 stages, max 16 steps per stage, asking steps in each stage, all original scored items asked at least once, and the source trace. The following are authored content **specifications**, not a claim the existing runner already supports every proposed diagram interaction. #296 owns any reusable schema/runner changes; this workstream only proposes adapters.

## A. Day Shapes — first release candidate

**Outcome:** identify *five selected, actually displayed* COLREG day-shape configurations. No inference from a shape's absence, no right-of-way/collision decision, no universal must-display claim, no other COLREG shapes. Canonical geometry comes from the current tested source model: src/domain/maritime/statuses.ts and dayShapeItems() in maritimeBanks.ts. Present **genuine deterministic black vector balls, diamonds and cones**, never emoji, AI art or arbitrary illustrations.

### Required stages and exact authored progression

**D1 — Count the Balls** (stable ID: shape-ball-count). *Teach:* one black ball = at anchor, two vertically = not under command, three vertically = aground; count and order the actual silhouettes rather than read textual abbreviations. *Interaction:* show one worked comparison of 1/2/3, then unlabelled shape-first choice for original item IDs 01, 02 and 04. Example: display 3 vertical balls; options Aground / At anchor / Not under command / Restricted ability to manoeuvre. **Answer:** Vessel aground. *Feedback:* “Three balls indicate aground; two balls indicate not under command, one ball at anchor.” A wrong response highlights the counted shapes, offers an in-lesson retry and does not record Test evidence. *Checkpoint:* mix one and three balls without printed counts.

**D2 — Read the Middle Shape** (shape-middle-diamond). *Teach:* ball above diamond above ball = restricted in ability to manoeuvre; middle *diamond*, not a third ball. *Interaction:* show full pattern, then compare ball–diamond–ball against 3 balls at similar size; quiz original item 03 using figure-first four large choices. **Answer:** Vessel restricted in her ability to manoeuvre. *Feedback:* “The middle figure is a diamond. Three round balls, by contrast, indicate aground.” Checkpoint contrasts 03 with 04. Do not call a ball–diamond–ball a “three-ball” signal.

**D3 — Read the Cones** (shape-fishing-cones). *Teach:* two cones, top apex pointing down and bottom apex pointing up, points touching = vessel engaged in fishing. Rule 26(b) and (c) cover **trawling and fishing other than trawling**; shape alone cannot choose between them. *Interaction:* source-derived two-cone silhouette first; choose original item 05 against restricted manoeuvre, NUC and anchor. **Exact answer:** Vessel engaged in fishing (trawling or other fishing). *Feedback:* “These are two cones meeting at their points, not ball–diamond–ball. The shared shape identifies fishing; it does not distinguish trawling from other fishing.” Checkpoint mixes item 05 with 03.

**D4 — Mixed Signal Reading** (shape-mixed-signals). *Teach:* no new signs; fade annotations and vary only **legal-invariant presentation** (uniform scale, spacing within shape-order visibility, background, horizontal position). *Interaction:* five image-first questions in a varied order, with credible near-neighbour options and short “what in the drawing proves this?” optional explanation choices. Explicit item coverage 01–05. **Answers:** keyed table below. *Feedback:* one discriminant per wrong selection, immediate correction and retry; after any reasonable completion of this authored stage mark Learn complete **once** (not five flawless answers). Offer Reference, Replay, and independent optional Final Test; never a generic locked Practice tile.

### Canonical Day Shape answer and correction matrix

| Existing stable item ID | Source model shapes (top first) | **Exact existing Test answer** | Rule | Most useful distinguishing correction |
| --- | --- | --- | --- | --- |
| vessel-day-shapes-item-01 | ball | Vessel at anchor | 30(a) | One, not two or three, black balls |
| vessel-day-shapes-item-02 | ball, ball | Vessel not under command | 27(a) | Two vertically; a third ball would indicate aground |
| vessel-day-shapes-item-03 | ball, diamond, ball | Vessel restricted in her ability to manoeuvre | 27(b) | The middle is diamond-shaped, not a ball |
| vessel-day-shapes-item-04 | ball, ball, ball | Vessel aground | 30(d) | Three balls; two would be not under command |
| vessel-day-shapes-item-05 | cone-apex-down, cone-apex-up | Vessel engaged in fishing (trawling or other fishing) | 26(b),(c) | Cones meet point-to-point; the shape covers both fishing forms |

**Teaching-only caveats:** Annex I specifies minimum shapes/proportions and spacing; under-20 m boats may use proportionately smaller shapes. Rule 27/30 small-vessel/situation exceptions apply. Another vessel may add other status signals. The five standalone drawings are selected references, not an exhaustive depiction of all lights, flags or shapes. Explicitly do not add sail+power cone, constrained-by-draught cylinder, dredging obstruction-side signs or towing shapes to this Test.

## B. Navigation Lights & Aspect — 5 stages

**Outcome:** interpret eight canonical observer positions around a representative underway power-driven vessel **under 50 m**, and eight displayed legal *distinguishing* vessel signatures. Approved current figures and keys in src/domain/maritime/lights.ts, statuses.ts, maritimeBanks.ts must remain the sole source for deterministic figure-to-answer consistency.

**L1 — Orient the Vessel** (lights-vessel-orientation). *Teach:* bow/stern, port (red)/starboard (green), centreline, ahead/astern, abeam, underway versus making way. Figure-based tap left/right and bow/stern; short correction for a mirrored side. No extra scored item.

**L2 — Trace the Sectors** (lights-sector-visibility). *Teach:* masthead white **225°**, each sidelight **112.5°** from ahead, stern white **135°** centred aft, all-round **360°**. Use top-down deterministic vessel-plan with arcs and explanation after each choice. Train 000°, 045°, 090°, 270°, 315° with source-proved answers. Do not grade at exact 112.5°/247.5° cutoffs; test geometry separately.

**L3 — Move the Observer** (lights-observer-aspect). *Teach:* moving into quarters crosses from masthead+sidelight to stern alone; compare 090° and 135°, then 225° and 270°. All eight original aspect item IDs 01–08 must appear across L2/L3. A proposed tap-to-move observer must read source-calculated sectors, not a hand-authored answer; otherwise provide noninteractive predefined bearings. Include explanatory figure overlay after answer and no legal collision-avoidance direction.

**L4 — Decode a Light Signature** (lights-vessel-signatures). *Teach:* distinguish power-driven/sailing basic plans; green/white trawling vs red/white other fishing; red/red NUC vs red/white/red RAM; white anchor vs anchor+two red aground. Ask original item IDs 09–16 from sourced diagrams before revealing label. Signature is **distinguishing**, not an exhaustive all-lights requirement; preserve under-50 m, optional second masthead, making-way and small-vessel qualifications.

**L5 — Confusable Signals** (lights-mixed-contrast). *Teach:* no new legal status. Mix red vs green, port vs starboard, NUC vs RAM vs aground, trawling vs other fishing and anchor vs aground. Interaction: choose visible lights or positively signalled state; feedback names exact difference, not legal action. Confirm all 16 original items were asked, summary, optional existing Final Test.

### Navigation answer ledger (existing 16 items, unchanged)

| Item | Stimulus | Expected answer / signature | Discriminant |
| --- | --- | --- | --- |
| 01 | observer 000° | Masthead and both sidelights | bow sees red and green |
| 02 | 045° | Masthead + starboard green sidelight | forward starboard |
| 03 | 090° | Masthead + starboard green sidelight | starboard beam |
| 04 | 135° | Sternlight | aft of sector cutoff |
| 05 | 180° | Sternlight | directly astern |
| 06 | 225° | Sternlight | port quarter |
| 07 | 270° | Masthead + port red sidelight | port beam |
| 08 | 315° | Masthead + port red sidelight | forward port |
| 09 | white masthead + red/green sides + white stern | Power-driven vessel underway (under 50 m) | has masthead |
| 10 | red/green sides + white stern | Sailing vessel underway | no masthead in selected baseline |
| 11 | green over white all-round | Vessel trawling | green, not red, top |
| 12 | red over white all-round | Vessel fishing, other than trawling | red, not green, top |
| 13 | red over red all-round | Vessel not under command | two reds |
| 14 | red over white over red all-round | Vessel restricted in her ability to manoeuvre | three, white centre |
| 15 | one white all-round | Vessel at anchor (under 50 m) | reference anchor signature |
| 16 | reference white anchor light + two red all-round | Vessel aground (under 50 m) | addition of two reds |

The aspect answers above are **human-readable descriptions**; the stored Test key remains describeVisibleLights(visibleLights(bearing)), with its canonical ordering and exact string unchanged. The light-signature answers remain status.state, not text copied out of this table. Neither the source model nor the existing Test should be rewritten by this content PR.

## C. SCUBA Equipment — 5 stages, vocabulary Test preserved

**Outcome:** a learner connects 13 already-shipped abbreviations to broad system functions, recognizes simple component relationships on *clearly labelled non-operational schematics*, and—**only after accepted media/qualified review**—practises identifying components on real equipment. **Existing Test remains 13 textual acronym → expansion/function answers**. Photo-to-equipment identification is a *proposed separate versioned objective*, not shipped scored evidence.

**S1 — Map the Breathing System** (scuba-gas-path): introduce SCUBA (01), the first/second-stage distinction, DV (08), AAS (07) and HP/LP/IP (09/10/11). Schematic: cylinder → first stage → second stage, with SPG branch and BCD LP-inflator branch shown as **conceptual relationships**, not operational wiring instructions. Ask function/name recognition with targeted correction: DV is a breathing second stage; AAS a backup breathing source, commonly another second stage. The intermediate-pressure region is between stages; avoid misleading “IP versus LP” binary where the terms overlap.

**S2 — Monitor and Adjust** (scuba-gauge-buoyancy): BCD (02), SPG (03), LPI (04). Annotated generic schematic, then unlabelled recognition *only if a schematic can accurately depict each concept*. SPG displays cylinder pressure; BCD provides adjustable buoyancy volume; LPI is its low-pressure inflator connection. Do not tell learners to attach, adjust, inflate, configure or inspect a real device.

**S3 — Locate Signalling and Propulsion** (scuba-surface-signals): DSMB (05), DPV (06), SMB (12). Contrast marker at surface versus delayed-deployment concept; terminology varies. A photo labelled DSMB requires mechanical confirmation of delayed capability, not just a long orange tube. DPV is powered propulsion, not a regulator or buoyancy device. No deployment or operation directions.

**S4 — Read Fittings and Pressure Terms** (scuba-connections): DIN (13), HP (09), LP (10), IP (11), DV (08). The DIN example is a screw-in cylinder-valve regulator connection in contrast to the yoke/bracket alternative. For pressure, contrast **location/function within source-described system** rather than asserting every hose or fitting can be identified confidently by appearance. Use diagrams with all connection details checked by a qualified reviewer. No mechanical assembly tutorials.

**S5 — Find the Component, Explain the Term** (scuba-kit-map): mixed recall of **all 13** original abbreviations, with source-authorized labels and functions. Phase A always feasible: text/schematic formative questions keyed to original item IDs. Phase B conditional: at least two independently reviewed rights-cleared real variants per targeted part for a *non-scored* recognition exercise; clear different shapes/brands and no claimed generic universal fitting. Until the #132 six-photo acceptance, show explicit schematic-only state; no fake photo stand-in and no new visual Final Test.

**Answer-key index (full Test text stays in catalogSeed.ts):** 01 SCUBA—self-contained underwater breathing apparatus; 02 BCD—buoyancy control device; 03 SPG—submersible pressure gauge; 04 LPI—low-pressure inflator; 05 DSMB—delayed surface marker buoy; 06 DPV—diver propulsion vehicle; 07 AAS—alternate air source; 08 DV—demand valve; 09 HP—high pressure; 10 LP—low pressure; 11 IP—intermediate pressure; 12 SMB—surface marker buoy; 13 DIN—screw-in connection. Each formative keyed correction must restate the **full existing function**, not grade on initials alone.

**Limits:** no scuba certification or practical competence; no cylinder/regulator assembly, servicing, inspection, deployment, gas management, emergency breathing, buoyancy control or ascent instruction. Qualified instructor and asset-rights approval are mandatory before real-equipment recognition content reaches users.

## D. Beaufort Scale — 5 stages

**Outcome:** connect the 13 source-defined Force → name/knot ranges with a practical, cautious understanding of observed conditions. The four shipped 700 × 300 AVIF Argus guide panels are optional teaching **illustrations only**; a single photograph never objectively proves a precise wind speed or Beaufort force.

**B1 — Calm to Gentle** (beaufort-low-forces): force 0–3, show mirror-like water → ripples → wavelets, leaves/smoke cues and knot range strip. Each of four original Force item IDs is asked as Force → term + band.

**B2 — Breeze Builds** (beaufort-breezes): force 4–6, whitecaps become common, branches move, range strip 11–27 knots. Contrast 16/17 and 21/22 knots as **measured-value examples** in teaching only, not new formal Test items.

**B3 — Gale and Storm** (beaufort-gales): force 7–12, introduce near gale, gale, strong gale, storm, violent storm, hurricane; distinguish wind scale from tropical-cyclone classification. Force 12 is **64 knots or more** in Argus; ECCC table's Force 12 example lists 64–71, while WMO/Met Office use open-ended hurricane force.

**B4 — Thresholds and Observations** (beaufort-thresholds): compare 10/11, 16/17, 27/28, 33/34, 40/41, 47/48, 55/56, 63/64. Ask exact measured-knots → plausible force *formatively*, then ask why an unlabeled photo cannot establish one exact force. Correct a boundary slip by displaying adjacent bands; distinguish quantitative reading from qualitative context.

**B5 — Mixed Wind Literacy** (beaufort-mixed-recall): interleave all 13 original force IDs with source-backed sea/land text observations. For text observations use broad candidate intervals or “insufficient evidence” when applicable; do not force a unique integer from descriptive prose. Check original 0–12 mappings as Force → term and knots in a mixed checkpoint and allow optional independent historical Final Test. Avoid storm-safety predictions or route advice.

| Force | **Exact existing compound Test answer** | Useful qualitative cue |
| ---: | --- | --- |
| 0 | Calm — less than 1 knot | mirror-like sea |
| 1 | Light air — 1–3 knots | ripples, no foam |
| 2 | Light breeze — 4–6 knots | short nonbreaking wavelets |
| 3 | Gentle breeze — 7–10 knots | some glassy crests |
| 4 | Moderate breeze — 11–16 knots | fairly frequent whitecaps |
| 5 | Fresh breeze — 17–21 knots | many whitecaps |
| 6 | Strong breeze — 22–27 knots | larger waves, extensive crests |
| 7 | Near gale — 28–33 knots | wind-blown streaks of foam |
| 8 | Gale — 34–40 knots | spindrift |
| 9 | Strong gale — 41–47 knots | high waves, extensive foam |
| 10 | Storm — 48–55 knots | very high waves |
| 11 | Violent storm — 56–63 knots | exceptionally high waves |
| 12 | Hurricane — 64 knots or more | dense spray / visibility affected |

The table is for author review; **do not** create a second competing runtime copy of these Test values. The actual canonical BEAUFORT map lives in src/domain/library/catalogSeed.ts.

## Reusable interaction and content components — API suggestions to #296, not owned here

| Primitive | Inputs/behaviour | Used for |
| --- | --- | --- |
| SourceFigure | exact figure spec from existing visual model, aspect ratio, accessible optional description, source note, unlabelled quiz state | Day Shapes; Lights |
| ChoiceTiles | 2–4 clear, >=44 px targets; no keyboard, no hover dependency; keep answer hidden until commit | All four |
| CompareReveal | pair or triple of canonical figures; prompt focused on a discriminating feature; explanation on reveal | ball counts, fishing/RAM, near-light sets |
| ObserverSector | bearing 0–359; state-calculated visible sectors; no state invented in component; explicit boundary policy | Lights only; defer interactive drag if renderer not certified |
| EquipmentMap | labelled/unlabelled *conceptual* schematic, separately reviewed real-photo upgrade, no procedural controls | SCUBA |
| ThresholdStrip | non-overlapping inclusive knot bands, 0 <1 and force 12 >=64; exact values textual; tap one interval | Beaufort |
| VerdictPanel | “Correct” / “Not quite”, actual answer and why contrasting option differs, inline retry | All |
| StagePath | completed / current / upcoming, one primary CTA, replay, quiet Reference, separate optional Test | All |

**Presentation invariants:** diagram or visual stimulus appears **before** graded-choice label; selected answer cannot be disclosed in alt text during visual scoring; an accessible equivalent/assisted-mode explanation remains available and is not falsely called unaided visual recognition. Formative interactions never write historic Test records. Do not offer invented attempts or “certification”. Reference is freely browsable and may reveal answers, but remains outside the challenge surface. No standalone locked Practice. No mandatory repeat passes, time gate or mandatory formal Test.

**Payload suggestion only:** a stable stepId references canonical itemId (and optional figureSpecId), options/key, answer rationale, distractor-specific rationale, sourceClaimIds, accessibilityDescriptionPolicy and mediaReviewId; generator variants may change position/scale **only if the keyed source meaning is invariant**. Source-supplied FigureSpecs and status texts are reused—not duplicated in a new engine. #296 must ratify field names and persistence contracts before implementation.

## Owner review, technical QA, media and release gates

1. **Owner design gate:** inspect 390 px current Signal-on-Slate mocks in assets/issue-322/mockups; approve each screen and touch flow *before UI implementation*. Mocks are design targets only, not working screens or evidence of runtime. Validate 320 px, 390 px, short landscape, 200% text, keyboard, switch control, reduced motion, screen reader and Pixel Chrome/PWA.
2. **Maritime (#147) gate:** independent Collision Regulations subject reviewer verifies status meaning, Canadian size/waters exemptions, figure semantics, Rule 21 light sectors and all original Test keys. Use calculated geometry. No AI-generated nautical signals; do not imply collision law or priority decision.
3. **SCUBA (#132) gate:** all six existing candidate Commons photographs remain **unaccepted**, locally held under docs/open/assets/scuba-reference/. They have provenance metadata but require attribution/CC compliance, qualified equipment plausibility, phone-size legibility, branding and mechanical review. Do not move them into public runtime or use them in a scored new direction. Extension to AAS/DV/HP/LP/IP/SMB/DIN needs new separately recorded sources and review.
4. **Beaufort media gate:** four already-shipped owner-approved panels are illustrative and may be reused unchanged, with current hash/provenance contract from docs/closed/ISSUE_129_BEAUFORT_VISUAL_GUIDE.md. Exact answers remain ECCC-anchored, force12 WMO/Met Office normalized. No new AI-generated weather photo as scientific authority.
5. **Automated gates once implementation is independently authorized:** every stage valid in checkCurriculum; each original item asked; shape key matches shapeState and renderer; light sector boundaries 112.5/247.5 with >/< epsilon tests and canonical angles; 13 exact Beaufort compound answers including 12 open-ended; all 13 SCUBA factual mappings; no Test history writes from Learn; account-isolated reload/import/export, prior progress, role invariance, offline assets, keyboard+screen reader, browser and device matrix, full npm run check. **None of these tests are claimed as run in this documentation-only PR.**
6. **Review decisions:** first approve/revise/defer *Day Shapes*. Navigation Lights must have #147 acceptance; SCUBA visual upgrade must have #132 acceptance; stronger Beaufort or SCUBA Tests are separate, versioned PRs. Each topic ships in a separate focused implementation PR. This grouped issue is not blanket approval.

## Source and claim ledger

| Source / location | Authority and claim | Editorial/review state |
| --- | --- | --- |
| Canadian Collision Regulations, Schedule 1 Rules 20, 21, 23, 26–30, Annex I: https://laws-lois.justice.gc.ca/eng/regulations/C.R.C.,_c._1416/FullText.html | Day shapes, legally defined lights and sectors, vessel-state qualifications; site snapshot current to 2026-09-30 | **Primary**; #147 independent sign-off outstanding |
| IMO COLREG overview: https://www.imo.org/en/about/conventions/pages/colreg.aspx | International framework, cross-check | Context only |
| docs/closed/ISSUE_138_MARITIME_VISUAL_LITERACY.md | Existing bounded 16+5 researched curriculum | Local historical sign-off of scope; not #147 current expert acceptance |
| src/domain/maritime/lights.ts; statuses.ts; maritimeBanks.ts | Canonical existing generated diagrams, option keys and item ordering | Preserve unchanged |
| src/domain/library/catalogSeed.ts | Exact SCUBA 13 and Beaufort 13 compound answers | Preserve unchanged |
| PADI equipment FAQ and regulator references already cited in catalogSeed.ts; DAN source in #132 review | Recreational equipment glossary/system context | Professional explanations; qualified equipment review pending |
| docs/open/ISSUE_132_SCUBA_ASSET_REVIEW.md; assets/scuba-reference/provenance.json | Six rights-documented Commons **candidate** photographs, dimensions/hashes/credits | Not accepted or deployable, even if license was checked |
| ECCC Beaufort: https://www.canada.ca/en/environment-climate-change/services/general-marine-weather-information/understanding-forecasts/beaufort-wind-scale-table.html | Force 0–12 names, knots, land/sea effects, 2017-09-10 | Canadian primary; force12 printed 64–71 differs from open-ended Argus convention |
| Met Office: https://weather.metoffice.gov.uk/guides/coast-and-sea/beaufort-scale | Cross-check all knot bands; force12 **64+** | Supports existing open-ended answer |
| docs/closed/ISSUE_129_BEAUFORT_VISUAL_GUIDE.md | Existing four approved 700×300 illustrative panels and SHA-256 | Reuse only; no numerical photo inference |

**Asset provenance:** the proposed Day Shapes silhouettes and Lights visual elements are deterministic, internally specified figures, *not copied external imagery*. The mock SVGs in this PR are standalone annotated design prototypes and **must not be imported as runtime signal assets**. No new photographs or synthetic equipment assets are acquired or licensed by this PR.

## Mockup index (exact 390px frame width)

- 01-day-shapes-path.svg — landing, staged lesson path, one CTA
- 02-day-shapes-teach.svg — worked source-derived black shapes
- 03-day-shapes-question.svg — unknown visual followed by four large tiles
- 04-day-shapes-feedback.svg — wrong choice, concrete explanation and retry
- 05-navigation-lights.svg — tap-to-select conceptual observer/sector view (not working geometry)
- 06-scuba-system.svg — neutral conceptual system map; **no unapproved equipment photos**
- 07-beaufort-thresholds.svg — measured 34 knot boundary strip, qualitative caveat
- 08-day-shapes-complete.svg — one-and-done Learn, independent optional Final Test and Reference

**These are pending owner approval**, with no framework or feature files changed.
