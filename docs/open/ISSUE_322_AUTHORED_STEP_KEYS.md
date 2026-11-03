# #322 — Authored step and feedback ledger

**Status:** unregistered **authoring specification**, not runnable code; owner approval, #296 runner integration and relevant expert/rights reviews pending. Companion: [curriculum/source plan](ISSUE_322_STAGED_CURRICULA.md) and [390px mockups](assets/issue-322/).

## Step conventions for #296 handoff

- Stage and step IDs below are stable, lowercase/kebab case and semantic. Items keep existing stable topic IDs and 01-indexed suffixes; a single original scored item can be rehearsed more than once without generating new scored items.
- Every lesson uses **demonstration → active recall → explain/repair → checkpoint → summary**. Each stage may contain several teaching steps, but is complete after a single traversal even with corrections; retries are supportive, never a perfect-score gate.
- In an item-based visual choose step, the canonical item supplies the stimulus and canonical answer. The separate authored step supplies prompt/distractors/explanation. Do not duplicate a legal signal figure or overwrite the canonical source key.
- Answer-first authored options are shuffled by the shared deterministic runner. A four-choice recommendation is not licence to create a second independent selection model.
- “Correct” feedback cites the observed discriminant as well as the outcome; “Not quite” feedback identifies the wrong visual/numerical distinction and gives the correct answer. The *full* actual answer, sources and caveats remain discoverable in Reference.
- Pre-answer visual alternative descriptions must describe geometric arrangement **without naming the answer**. At reveal, the description may include its meaning. An accessible descriptive mode for real-object photo identification is an accommodation and must not be reported as unaided visual identification.
- Explicit remediations deep-link to source stage ID, not a generic Practice screen; no XP, lives, timer, mandatory repeated passes or Test-history writes.

## Day Shapes — implementation-first detailed sequence

### Step map

| Stage ID | Step ID | Kind/proposed action | Canonical item(s) | Prompt or authored explanation |
| --- | --- | --- | --- | --- |
| shape-ball-count | shapes-count-intro | show | 01, 02, 04 references | Labelled three-up compare: 1 = anchor, 2 = NUC, 3 = aground; show three source-derived figures |
| shape-ball-count | shapes-count-one | choose | 01 | Figure-first: “Which vessel state does this display?” |
| shape-ball-count | shapes-count-two | choose | 02 | Same, new unlabelled two-ball figure |
| shape-ball-count | shapes-count-three | choose | 04 | Same, unlabelled three-ball figure |
| shape-ball-count | shapes-count-check | checkpoint | 01, 02, 04 | Count across the three neighbouring cases |
| shape-ball-count | shapes-count-summary | summary | — | “One anchor; two not under command; three aground.” |
| shape-middle-diamond | shapes-middle-show | show | 03 | Labelled ball / diamond / ball; compare middle outline with a third ball |
| shape-middle-diamond | shapes-middle-choose | choose | 03 | Which state? Correct response from item 03 |
| shape-middle-diamond | shapes-middle-contrast | contrast | 03, 04 | Compare RAM versus aground diagrams, never text abbreviations alone |
| shape-middle-diamond | shapes-middle-check | checkpoint | 03, 04 | Vary permissible size/spacing; order unchanged |
| shape-middle-diamond | shapes-middle-summary | summary | — | “The middle diamond identifies restricted ability to manoeuvre.” |
| shape-fishing-cones | shapes-cone-show | show | 05 | Two opposed cones touch at their tips; neither is a ball |
| shape-fishing-cones | shapes-cone-choose | choose | 05 | Which state? The answer explicitly includes trawling **or other fishing** |
| shape-fishing-cones | shapes-cone-contrast | contrast | 05, 03 | Two cones versus ball–diamond–ball, line-up and order retained |
| shape-fishing-cones | shapes-cone-check | checkpoint | 05, 03 | Correct explanation for “trawling only” as an unsupported inference |
| shape-fishing-cones | shapes-cone-summary | summary | — | “The day shape does not separate fishing types.” |
| shape-mixed-signals | shapes-mixed-teach | show | — | Rules only: count; check middle; identify points meeting; no new content |
| shape-mixed-signals | shapes-mixed-check | checkpoint | 01–05 | All original five canonical figures; visual stimulus precedes text choices |
| shape-mixed-signals | shapes-mixed-summary | summary | — | One-and-done stage completion; optional separate Final Test |

### Original 5-item choices and wrong-answer feedback

For each unlabelled figure, use the **existing Test answer string**, not a shortened answer, as the canonical value. These authored examples are orientation/reference; the runner may sort/shuffle, and original Test options remain unchanged.

| Item | Correct answer | Recommended relevant alternatives (not a second Test bank) | Response when mistaken |
| --- | --- | --- | --- |
| 01 | Vessel at anchor | NUC; Aground; RAM | “Only one round ball appears. NUC has two; aground has three.” |
| 02 | Vessel not under command | At anchor; Aground; RAM | “Two round balls are vertically stacked; a third round ball would indicate aground.” |
| 03 | Vessel restricted in her ability to manoeuvre | Aground; NUC; Fishing | “Round–diamond–round differs from three round balls. The middle diamond matters.” |
| 04 | Vessel aground | NUC; RAM; At anchor | “Aground is three round balls. RAM has a diamond in the middle.” |
| 05 | Vessel engaged in fishing (trawling or other fishing) | RAM; NUC; At anchor | “Those are two cones joined point-to-point. The same shape covers trawling and other fishing.” |

**Worked correction UI:** in screen 04 the learner incorrectly selects “Vessel aground” for ball–diamond–ball; feedback explicitly names the correct state and why the central diamond changes interpretation. The mock shows a two-state revision; implementation may offer a retry without rescoring a formal Test.

### Semantic-variant restrictions

Generated shape variations are limited to position and uniform overall scale, adequate vertical spacing and neutral background. Do not mirror a single cone into an inverted meaning, alter the number, swap order, hide one shape behind another, stylize circles into diamonds or use emoji. Do not treat variation of the same canonical regulatory symbol as independent photo exemplars. Unchanged source model: DAY_SHAPE_STATUS_ORDER = anchor, not-under-command, restricted-manoeuvre, aground, fishing; shapeState() normalizes the shared fishing concept.

## Navigation Lights — detailed exercise/source-key map

**Geometry identity:** clockwise from bow, bow up; bearing 000 and 360 describe the same observer position. Port and starboard are **vessel-relative**, not camera-relative after rotations. Use source functions visibleLights(bearing), describeVisibleLights(), statuses and FigureSpec; the prose below is for design review only.

| Stage ID | Key step IDs and actions | Original scored items asked | Answer check and immediate correction |
| --- | --- | --- | --- |
| lights-vessel-orientation | lights-orientation-show: labelled bow/stern/port/starboard; lights-orientation-tap: select port vs starboard on plan; lights-orientation-check: distinguish underway/making way in a worked explanation; lights-orientation-summary | No new scored items; orientation prerequisite | “Port is the vessel's left when looking forward; it has red sidelights. Starboard is right, green.” |
| lights-sector-visibility | lights-sectors-show: annotated 225°/112.5°/135° arcs; lights-sector-ahead: canonical 000; lights-sector-starboard: canonical 045; lights-sector-check: mixed 000/045; lights-sector-summary | navigation-lights-item-01, -02 | 000°: white masthead, red and green sidelights. 045°: white masthead + green starboard sidelight. Avoid claim that a real mariner sees exact arcs at boundaries. |
| lights-observer-aspect | lights-aspect-beam: 090°; lights-aspect-quarter: 135°; lights-aspect-stern: 180°; lights-aspect-port-quarter: 225°; lights-aspect-port-beam: 270°; lights-aspect-port-bow: 315°; lights-aspect-check: mix aspect bank; lights-aspect-summary | navigation-lights-item-03, -04, -05, -06, -07, -08 (plus optional revisits 01–02) | 090° masthead+green; 135° sternlight; 180° sternlight; 225° sternlight; 270° masthead+red; 315° masthead+red. Distinguish port vs starboard *and* forward vs aft sector. |
| lights-vessel-signatures | lights-states-plan: two plan views; lights-states-fishing: green/white vs red/white; lights-states-status: NUC vs RAM; lights-states-stationary: anchor vs aground; lights-states-check: all 8 signatures; lights-states-summary | navigation-lights-item-09 through -16 | 09 power-driven, 10 sailing, 11 trawling, 12 fishing other than trawling, 13 NUC, 14 RAM, 15 at anchor, 16 aground. The *positive* displayed signatures are selected illustrative rule cases; do not infer missing signals or absence. |
| lights-mixed-contrast | lights-mixed-intro: mnemonic-free discriminants; lights-mixed-check: representative items from both banks; lights-mixed-repair: deep-link to stage explaining each miss; lights-mixed-summary | 01–16 optional cumulative checkpoint | Correct by identifying observer-relative sector OR actual light colour/order, with the corresponding diagram revealed only after selection. |

**Signature-specific corrections:** power-driven vs sailing: presence of the illustrated masthead light in the selected reference configuration, **not** “sailing vessels never have one”; trawling vs other fishing: green/white vs red/white (do not carry this distinction over to their shared day shape); NUC vs RAM: 2 red vs red/white/red; anchor vs aground: anchor reference vs anchor plus 2 red; port vs starboard: red vs green vessel-relative. Never present the eight selected configurations as comprehensive in all conditions.

**Observer interaction fallback:** if #296 does not have a reviewed pointer/sector control, teach using eight pre-rendered fixed legal angles and native large choice tiles. A draggable observer marker is not a requirement for this content PR.

## SCUBA — detailed exercise and remediation map

| Stage ID | Step IDs and interaction | Original item IDs in teaching/checkpoint | Corrective distinctions |
| --- | --- | --- | --- |
| scuba-gas-path | scuba-system-show: labelled non-operational conceptual system; scuba-system-terms: short textual choice on SCUBA; scuba-system-second: DV vs AAS; scuba-system-pressure: HP vs LP vs IP; scuba-system-check; scuba-system-summary | 01, 07, 08, 09, 10, 11 | DV is the regulator second-stage demand valve; AAS describes an alternate breathing-gas source, often another second stage. HP is the cylinder-pressure side; IP is pressure after first-stage reduction; LP describes low-pressure system outlets/hoses. Overlap in colloquial usage is explained, not mis-scored as mutually exclusive products. |
| scuba-gauge-buoyancy | scuba-bcd-show: generic annotated system; scuba-bcd-choose: what provides buoyancy volume?; scuba-spg-choose: what monitors cylinder pressure?; scuba-lpi-choose: identify name/function; scuba-bcd-check; scuba-bcd-summary | 02, 03, 04 | BCD is inflatable buoyancy equipment; SPG is gauge/display of cylinder pressure; LPI is the BCD low-pressure inflator assembly/connection. Do not treat an air hose's appearance alone as certainty. |
| scuba-surface-signals | scuba-signals-show: terms and context; scuba-smb-contrast: SMB vs DSMB; scuba-dpv-choose: recognize powered propulsion; scuba-signals-check; scuba-signals-summary | 05, 06, 12 | DSMB is generally carried deflated and deployed later (commonly underwater); SMB is a broader marker at surface. Photos alone may not prove deployability. DPV is powered propulsion, not flotation. |
| scuba-connections | scuba-din-show: diagram of screw-in vs yoke labels with no mechanical instructions; scuba-din-choose; scuba-pressure-contrast; scuba-connections-check; scuba-connections-summary | 13, 09, 10, 11, 08 | DIN is a specific regulator-to-cylinder connection standard; not just “any fitting”. Pressure labels indicate system role, not a step-by-step assembly order. |
| scuba-kit-map | scuba-mixed-intro: reference prior labels; scuba-mixed-check: all 13 acronym→term/function source items; scuba-mixed-map: schematic pointing in context; scuba-mixed-summary | All 01–13 | If a future real-image variant is unavailable or not accepted, use schematic/text only and label this as terminology learning. Visual-to-object identification is strictly formative until independent new Test approval. |

**Detailed acronym correction seeds:** SCUBA = self-contained underwater breathing apparatus (complete carried-gas system; not one hose). BCD = buoyancy control device (not SPG). SPG = submersible pressure gauge (not BCD/LPI). LPI = low-pressure inflator (not the regulator's breathing-demand valve). DSMB = delayed surface marker buoy (not any orange tube). DPV = diver propulsion vehicle (not a float). AAS = alternate air source (not automatically a unique hose layout). DV = demand valve (second stage). HP = high pressure at cylinder side. LP = low pressure at regulator outlets. IP = intermediate pressure between first/second stages. SMB = surface marker buoy (general surface marker). DIN = screw-in regulator connection (not yoke). Full source-qualified definitions are in original catalogSeed; these short seeds are never replacement scored answers.

**Media gate:** #132's SCUBA, BCD, SPG, LPI, DSMB and DPV photos are unapproved documentation candidates; no new working visual source is created here. Without qualified equipment check, the proposed component identification remains a conceptual schematic/text lesson and the Test stays acronym→definition.

## Beaufort — detailed exercise and remediation map

| Stage ID | Steps and interactions | Existing Force indices covered | Key corrections |
| --- | --- | --- | --- |
| beaufort-low-forces | beaufort-low-show: sea/land guide and force strip; beaufort-low-choose: force 0,1,2,3 name/ranges; beaufort-low-check; beaufort-low-summary | 0,1,2,3 | 0 <1 knot Calm; 1 = 1–3 Light air; 2 = 4–6 Light breeze; 3 = 7–10 Gentle breeze. Ripples vs wavelets are orientation clues, not measurement. |
| beaufort-breezes | beaufort-mid-show: 4–6; beaufort-mid-choose: original force→compound answer prompts; beaufort-mid-boundary: measured 16/17/21/22 examples; beaufort-mid-check; beaufort-mid-summary | 4,5,6 | 4 = 11–16 Moderate breeze; 5 = 17–21 Fresh breeze; 6 = 22–27 Strong breeze. A measured 17 is Force 5, not 4. |
| beaufort-gales | beaufort-high-show: 7–12; beaufort-high-choose: 7/8/9 then 10/11/12 original prompts; beaufort-high-check; beaufort-high-summary | 7,8,9,10,11,12 | 7 = 28–33 Near gale; 8 = 34–40 Gale; 9 = 41–47 Strong gale; 10 = 48–55 Storm; 11 = 56–63 Violent storm; 12 = >=64 Hurricane. ECCC's displayed Force12 row is 64–71; Argus uses source-reviewed open-ended convention. |
| beaufort-thresholds | beaufort-threshold-strip: display adjacent bands; beaufort-threshold-measured: question “Measured 34 kt: Force 7, 8 or 9?”; beaufort-threshold-observed: “Can one photograph prove precisely Force 8?”; beaufort-threshold-check; beaufort-threshold-summary | Teaching uses 4–12 **without creating new Test IDs** | 34 kt = Force 8. 33 is Force 7. A photo may be illustrative of broad sea conditions but cannot establish measured wind. Disallow a single forced integer for qualitative text. |
| beaufort-mixed-recall | beaufort-mixed-intro: force order and observed cues; beaufort-mixed-check: all 0–12 original force→term and knots; beaufort-mixed-explain: review any adjacent mistake; beaufort-mixed-summary | 0–12 all assessed in formative Learn | Correct band inclusivity. Remediate by showing the neighbouring pair and source-backed observed-effect description, not by inventing a photo-based exact value. |

**All exact original answer strings** and 13 sequential item IDs must be read from BEAUFORT in catalogSeed.ts at implementation. A formative knots→force choice is **not** interchangeable with the historical Force→compound-answer Test. For source-backed sea-effects explanations, the repo already contains ECCC's BEAUFORT_AT_SEA / BEAUFORT_ON_LAND arrays; never copy a sentence from an invented visual.

## Release/readiness evidence matrix

| Check | Present in this proposal | Still outstanding |
| --- | --- | --- |
| Four meaningful curriculum sequences and stable IDs | Yes, authored here | #296 registration and separate code implementation |
| Exact historical scored boundary (16/5/13/13) | Yes, original IDs/keys retained | Automated invariant checks |
| Source-backed corrective feedback | Yes, mistakes/confusions mapped | Independent #147 maritime, #132 SCUBA review |
| Working responsive lesson UI | No | Owner mock approval first, then #296 integration |
| Real-equipment rights-approved photos | No | #132 candidate acceptance and derivative audit |
| New versioned visual Test for equipment | No | Independent expertise, rights, version migration approval |
| Historic completion, Morse, roles, account isolation | No code changed here | Regression + browser/offline/Pixel before shipping |
