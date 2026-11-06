# #321 — Clouds: seven-stage photo-identification curriculum (editorial draft)

> **Status: content specification, not a registered curriculum or UI. Owner/meteorology editorial approval pending.** Companion: [source research](ISSUE_321_CLOUD_SOURCE_RESEARCH.md), [asset intake ledger](ISSUE_321_CLOUD_IMAGE_LEDGER.csv), [visual assessment](ISSUE_321_CLOUD_VISUAL_ASSESSMENT.md). Authority: [#141](../closed/ISSUE_141_CLOUD_WEATHER_RECOGNITION.md), [#131](../closed/ISSUE_131_WMO_CLOUD_VISUAL_GUIDE.md), [#296](ISSUE_296_LEARNING_REDESIGN.md). Created 2026-11-03.

## 1. Competence and contracts

**Learn outcome:** distinguish all ten WMO cloud genera from varied, real, daytime ground-view photographs, using visible form and explicit comparisons. The photographs are the stimulus; the full name is the response. The short code is a subordinate label, not the prompt.

**Not claimed:** ability to identify every cloud from one photo, species/variety, measured altitude, exact forecast, night/aerial/satellite identification or professional observation. Use the WMO [definitions](https://cloudatlas.wmo.int/definitions-of-clouds.html), [genus table](https://cloudatlas.wmo.int/tabular-guide-genus.html) and [identification guidance](https://cloudatlas.wmo.int/identifying-the-genus.html). Table 12 distinguishes essential, usual and possible characteristics; do not recast a usual characteristic as universal.

**Existing meaning is immutable:** cloud-genera has ten original Ci→Cirrus etc. scored vocabulary items, completion dates, item IDs, attempts and awards. None of these are visual evidence. A second, versioned visual curriculum/competence can be added under a single Clouds topic later, but must not change/relabel historical attempts or regress a Learned record. Do not implement storage contracts in this PR; #296 owns the engine and #113 owns storage.

**Progress:** once each required visual lesson is completed once, that visual curriculum is Learned permanently. All lesson questions are formative, never formal Test writes. A final held-out photo Test is optional, independently scored and **not available as a photo-recognition claim** until the 80-image/media/evidence gates pass. The existing vocabulary Test remains explicitly named and available. Free Reference/replay is never a requirement.

**Image budget:** use no more than three distinct exposed photographs per genus across *all* Reference, introductions, recall, comparison, replay, previews and formative screens combined. The existing #131 hero is exposure slot H1; L2 and L3 must be separately reviewed, genuinely different real photos (not alternate crops). Held-out images H01–H05 or equivalent NEVER appear in any of these surfaces. Photo assignment must be fixed before release and immutable without a versioned editorial decision.

## 2. Authoring pattern and surface semantics

The step ID column below is a **content key**, not a proposed implementation of #296 schemas. A visual challenge contains the real image *without text or metadata revealing the class*, then 2/3/4 large full-name alternatives limited to plausible taught genera. Once a learner answers, show the correct full name, a specifically visible diagnostic and why the selected alternative does not fit. Optionally ask a separate “What gave it away?” cue question after a correct genus response; do not use the cue question as a scored photograph classification. A wrong answer permits another attempt and then Continue without resets, streak gates, timers or perfection rules.

Work examples are labelled, with characteristic annotations in adjacent HTML/text. **The next recall uses a different real photo** from the same training allocation wherever possible. At most H1, L2 and L3 ever appear for that genus, regardless of how many times the images recur in C6–C7.

At each stage: brief introduction → visible contrast → image-first answer → targeted correction → small mixed checkpoint → one-sentence summary. Repeat old genera interleaved; introduce only two new ones in each of C1–C5. One visible class should not be distinguishable by photographer, horizon, color, season, framing, aspect ratio, or camera treatment instead of cloud morphology.

### WMO level reminder (not an identification shortcut)

High: Ci / Cc / Cs. Middle: Ac / As / Ns. Low-base: St / Sc / Cu / Cb. Nimbostratus is WMO-allocated to the middle level but can extend across levels. Cumulus and Cumulonimbus have low bases while tops can reach far higher. **Vertical development is not a fourth official WMO altitude level.** A static photograph does not directly measure height.

## 3. Seven lessons: executable content plan

### C1 — Vertical Development

**Introduces:** Cumulus (Cu), Cumulonimbus (Cb). **Goal:** detached sharp-edged mound versus a much larger convective cloud with characteristic developed upper portion; avoid labeling every large mound Cb.

| Key | Format / photo role | Content / response | Feedback / criterion |
| --- | --- | --- | --- |
| c1-cu-intro | Worked H1 Cu | “Cumulus”: detached, dense, bright or shaded cauliflower-like top; nearly horizontal, darker base | Look at shape, not just white color |
| c1-cb-intro | Worked H1 Cb | “Cumulonimbus”: great vertical extent; often smooth/fibrous, spreading/anvil upper part | Anvil is strong positive cue, not mandatory for every Cb |
| c1-cu-recognize | Unlabelled L2 Cu | Choose Cumulus / Cumulonimbus | Cu: sharp detached tops and base; no visible developed fibrous/anvil summit |
| c1-cb-recognize | Unlabelled L2 Cb | Choose Cumulonimbus / Cumulus | Cb: developing great tower and a visibly different mature upper portion |
| c1-check | L3 Cu and L3 Cb, separated | Two image-first choices, ask “Which visible feature?” after first correct response | If an image is borderline Cu congestus / Cb calvus, reject it instead of training guesswork |
| c1-close | Summary | “Judge the tower and especially its upper structure; size alone is not enough.” | Stage tick only |

### C2 — Low Layers

**Introduces:** Stratus (St), Stratocumulus (Sc). **Recall:** Cu/Cb.

| Key | Format / photo role | Content / response | Feedback / criterion |
| --- | --- | --- | --- |
| c2-st-intro | Worked H1 St | “Stratus”: generally uniform low grey layer, sometimes ragged | A low layer is not automatically rain-bearing Ns |
| c2-sc-intro | Worked H1 Sc | “Stratocumulus”: large rounded or rolled elements in a layer, usually with darker parts | Distinct masses/rolls contrast with St uniformity |
| c2-st-recognize | Unlabelled L2 St | Choose Stratus / Stratocumulus | No defined large repeating rolls or lumps |
| c2-sc-recognize | Unlabelled L2 Sc | Choose Stratocumulus / Stratus | Individual large masses/rolls and their shading |
| c2-check | L3 St / L3 Sc / C1 training image | Three image-first prompts; use up to four alternatives drawn from St, Sc, Cu, Cb | A detached Cu is not a continuous Sc sheet; Cb needs developed towering form |
| c2-close | Summary | “Uniform layer versus lumpy layer versus detached towers.” | Stage tick only |

### C3 — High Wisps and Veils

**Introduces:** Cirrus (Ci), Cirrostratus (Cs). **Recall:** Cu/Cb or St/Sc.

| Key | Format / photo role | Content / response | Feedback / criterion |
| --- | --- | --- | --- |
| c3-ci-intro | Worked H1 Ci | “Cirrus”: detached white wisps/filaments/strands, sometimes silky | Separate trails/patches, not a full-sky transparent film |
| c3-cs-intro | Worked H1 Cs | “Cirrostratus”: broad translucent whitish veil; halos *often* accompany it | A visible halo supports Cs; absence of a photographed halo does not disprove it |
| c3-ci-recognize | Unlabelled L2 Ci | Choose Cirrus / Cirrostratus | Distinct detached filaments |
| c3-cs-recognize | Unlabelled L2 Cs | Choose Cirrostratus / Cirrus | Coverage/veil (and halo if visible), not detached strands |
| c3-check | L3 Ci and L3 Cs; one previously shown St or Sc | Four options chosen from learned genera; separate test of high-vs-low layer by visible texture | If upper sky context missing, replace photo rather than ask for altitude guessing |
| c3-close | Summary | “Detached filament versus extensive transparent veil.” | Stage tick only |

### C4 — Grains, Patches and Rolls

**Introduces:** Cirrocumulus (Cc), Altocumulus (Ac). **Recall/contrast:** Stratocumulus (Sc). This is the critical Cc/Ac/Sc discrimination.

| Key | Format / photo role | Content / response | Feedback / criterion |
| --- | --- | --- | --- |
| c4-cc-intro | Worked H1 Cc | “Cirrocumulus”: many tiny white grains/ripples, generally without shading | For regular elements, apparent width usually below 1° |
| c4-ac-intro | Worked H1 Ac | “Altocumulus”: rounder larger patches/rolls with frequent shading | For regular elements, usually 1–5° |
| c4-sc-recall | Reuse H1 Sc | “Stratocumulus”: larger rounded elements/rolls, usually darker parts | For regular elements, generally above 5° |
| c4-cc-recognize | Unlabelled L2 Cc | Three-way Cc / Ac / Sc | Fine grain and context-scale, not pixel size alone |
| c4-ac-recognize | Unlabelled L2 Ac | Three-way Ac / Cc / Sc | Mid-sized shaded elements |
| c4-confusables | Unlabelled L2 Sc, then L3 Cc/Ac/Sc | Three-way recurring choices, ask which cue rules out nearest neighbour | Preserve field of view. Angular sizes from WMO are apparent **to a ground observer**, not inferable from arbitrary digital crops |
| c4-close | Summary | “Fine often-unshaded grains; medium often-shaded masses; large low rolls.” | Stage tick only |

### C5 — Veils and Precipitating Sheets

**Introduces:** Altostratus (As), Nimbostratus (Ns). **Contrast:** Cirrostratus (Cs), Stratus (St).

| Key | Format / photo role | Content / response | Feedback / criterion |
| --- | --- | --- | --- |
| c5-as-intro | Worked H1 As | “Altostratus”: grey/bluish layer; Sun may appear vague, as through frosted glass; no halo phenomena | A sun disk that is not shown cannot be used as evidence |
| c5-ns-intro | Worked H1 Ns | “Nimbostratus”: thick diffuse sheet obscuring Sun; more-or-less continuous precipitation is common | Precipitation visible in a still is useful context; never forecast future rain |
| c5-as-recognize | Unlabelled L2 As | As / Cs / Ns | Sheet with vague Sun if visible; not a transparent halo veil or heavy precipitating layer |
| c5-ns-recognize | Unlabelled L2 Ns | Ns / As / St | Thick diffuse layer and credible visible precipitating context; darkness *alone* is insufficient |
| c5-check | Unlabelled L3 As / L3 Ns; reuse training Cs/St | Four plausible choices on each image; correct with local contrast | Do not force an As/Ns decision when sky/context is inadequate |
| c5-close | Summary | “Transparency, Sun appearance, layer texture and present precipitation help; no single clue always suffices.” | Stage tick only |

### C6 — Confusables

**No new genera.** Four short guided comparisons are delivered on already allocated training photographs (no fourth exposed variant), preferably rotating H1/L2/L3 with no repeated paired crop.

| Key | Set | Exercise | Specific feedback |
| --- | --- | --- | --- |
| c6-grains | Cc / Ac / Sc | Three successive photo-first responses + choose which size/shading cue matters | See C4; digital cropping can conceal the angular-size comparison |
| c6-sheets | Cs / As / Ns, plus St as distractor only where defensible | Three images; require distinct observations about veil transparency, Sun, and precipitating thickness | Halo positive for Cs; translucent ground-glass Sun suggests As; heavy precipitating sheet suggests Ns |
| c6-layers | St / Sc | Two images: uniform layer versus lumpy/rolled layer | Don't identify by grayness alone |
| c6-towers | Cu / Cb | Two images including a non-cartoon Cb presentation | Avoid overcalling Cb solely for a large Cu |
| c6-wisps | Ci / Cs | Two images of wisps versus veils | Detached strands versus continuous transparent veil |
| c6-close | All | Mixed checkpoint from existing training assets | Correction shows target discriminant and neighbour's contrary cue; no score or repetition gate |

### C7 — Mixed Sky Identification

**No new genera.** Demonstrate generalization using different *previously assigned training* photographs and realistic contrast sets. Do not touch holdouts.

| Key | Format | Exercise / completion |
| --- | --- | --- |
| c7-warmup | Visual reminder | “Look at shape and coverage first; consider shading, Sun and context; uncertainty is acceptable.” No keyed answer revealed before photos |
| c7-mixed-01..10 | Ten image-first decisions, one per genus, from H1/L2/L3 pool | Pick among 3–4 credible taught alternatives; vary order deterministically, not a fixed easy genus order |
| c7-explain | After each response | Show class, its visible diagnostic, why closest alternative fails; optionally “not enough information” on deliberately unscored ambiguous **teaching** image |
| c7-close | Final stage | Mark visual curriculum Learned once all seven stage ticks exist. Offer Reference/replay. Show “Cloud Vocabulary Test” separately; show “Photo Recognition Test” only after source/media/evidence qualification |

## 4. Source-grounded confusion/correction matrix

| True genus | Confusable(s) | Corrective distinction to cite if seen | Critical caution |
| --- | --- | --- | --- |
| Cu | Cb / Sc | Detached sharp-edged humps, horizontal base; no characteristic developed Cb summit; not a layer of rolls | Cu congestus vs young Cb may be ambiguous |
| Cb | Cu | Major vertical tower; upper part becoming smooth/fibrous/anvil-like | Anvil not present in every developmental phase |
| St | Sc / Ns | Broad fairly uniform low sheet; no large regular bumps/rolls | Shade is not sufficient to infer Ns |
| Sc | St / Ac / Cu | Broad low lumpy layer with larger rolled masses, commonly darker portions | Need enough FOV for element-size cue |
| Ci | Cs | Detached feathery wisps vs an extensive translucent veil | Thin sections of mixed sky can mislead |
| Cs | Ci / As | Wider transparent veil; halo if present strengthens classification | Absence of halo is not itself evidence against Cs |
| Cc | Ac / Sc | Fine near-unshaded small grains, apparent regular element size below ~1° | Not measurable from arbitrary tight crop |
| Ac | Cc / Sc | Larger and often shaded masses/rolls, regular elements mostly ~1–5° apparent | Must keep ground-observer scale context |
| As | Cs / Ns | Grey/blue extensive sheet; vague Sun in thinner part, *no halo* | A hidden Sun alone cannot distinguish As/Ns |
| Ns | As / St / Cb | Thick diffuse sheet; Sun hidden, sustained precipitation often associated; no isolated anvil tower | Rain may not be visible in a still photo |

## 5. Editorial readiness checks

- [ ] WMO genus/level/cue cross-check, including As/Ns, Cs/As, Cc/Ac/Sc and Cu/Cb cautions.
- [ ] **Every image-first exercise has a reviewed source image** assigned from that genus's shared <=3 exposure budget; first new recall different from taught photo.
- [ ] Every distractor is a plausible *previously introduced* genus. No false guessing when ambiguous.
- [ ] All ten genera recur in C7, and C6 covers all major confusions.
- [ ] Full names are answer tiles; short codes appear after correction. No abbreviation-to-name drill masquerades as cloud recognition.
- [ ] Correct and incorrect feedback reviewed against the actual chosen photograph; generic cue text alone is insufficient for the final approved image set.
- [ ] Completion is one pass per stage, independent of Test, with permanent progress. Old vocabulary evidence stays untouched.
- [ ] Future 390px mock approval before UI changes (#296 integration): first stage, three-way C4, correction, C7, heldout Test, historical learned state; audit 320px, 200% type and Pixel PWA. This PR draws no UI and changes no runtime.
