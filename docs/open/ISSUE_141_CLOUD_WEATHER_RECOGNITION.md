# Issue #141 — Cloud and weather recognition programme

**Status:** research complete — implementation decisions ready  
**Priority:** P0  
**Issue:** #141  
**Related:** #131 WMO cloud genera visual guide; #129 Beaufort visual guide  
**Roadmap:** `docs/LIBRARY_ROADMAP.md`  
**Method:** `docs/LIBRARY_RESEARCH_METHOD.md`  
**Research completed:** 2026-09-30

## 1. Decision summary

### Build / revise / defer

| Candidate | Decision | Why |
| --- | --- | --- |
| Ten WMO cloud genera — Learn/reference foundation | **BUILD, by revising #131** | Finite, stable, visually useful, authoritative WMO definitions exist, and a real-image source pool is practical. |
| Scored photographic genus recognition | **DEFER until dataset + Test capability gates pass** | One hero image per genus does not demonstrate general recognition. Scored work needs a varied real-photo dataset, held-out images, and a visual-stimulus Test model that Argus does not currently have. |
| Weather implications from cloud type | **REVISE to narrow Learn-only associations** | Present/identification cues can be taught where they are part of authoritative genus descriptions. Deterministic forecasting from one photograph is not defensible. |
| Fronts / surface-weather-map symbols | **DEFER to a separate later topic/research issue** | Good Argus fit as standardized diagram interpretation, but it is a different competence from natural-image cloud recognition and should not enlarge #131. |
| Cloud species, varieties, supplementary features | **DEFER** | Useful specialist depth, but it would multiply the visual classes before the genus-level foundation is proven. |
| AI-generated cloud imagery | **FALLBACK only for unscored Learn support** | Real correctly identified imagery is preferable and available. Generated images must never establish the category definition or count toward the initial scored-recognition dataset. |

### Programme boundary

The initial programme should teach **the ten WMO cloud genera as seen by a ground observer in ordinary daytime visible-light conditions**. It should help the learner notice the visual properties used to distinguish genera and the major confusion sets.

It should not claim that completion proves:

- professional or coded meteorological observing competence;
- cloud species/variety identification;
- reliable cloud-base or cloud-top estimation;
- identification from aircraft, satellite, radar or infrared imagery;
- diagnosis from night, heavily colour-shifted sunset, fog-obscured or otherwise exceptional views;
- forecasting the timing, severity or probability of future weather from one cloud photograph.

The WMO International Cloud Atlas explicitly frames its ordinary surface definitions around ground observation in clear air with normal daylight and clouds sufficiently above the horizon that perspective effects are limited. That makes a ground/daylight first boundary both authoritative and useful.

## 2. Proposed programme and sequence

### Stage A — WMO cloud genera field guide — BUILD

**Purpose:** establish the finite ten-genus vocabulary, WMO level framework and visual discriminators.

**Completion claim:**

> After using the guide, the learner has a source-backed visual reference for the ten WMO cloud genera and the principal features used to distinguish commonly confused genera from a ground view.

This stage is **Learn/reference**, not proof of retained visual-recognition competence. #131 owns its implementation after being revised by this note.

Recommended order:

1. explain what a cloud genus is and that ten genera form the foundation;
2. show the WMO level framework;
3. teach each genus with one strong real-world hero image and concise HTML cues;
4. explicitly teach the high-value confusion sets;
5. end with “what clouds can and cannot tell you” rather than a forecasting section.

### Stage B — photographic genus-recognition drill — DEFER

**Provisional completion claim, only if the later gates are met:**

> The learner can identify the ten WMO cloud genera from varied, independently sourced ground-based photographs representative of the programme boundary.

This claim is narrower than “can identify any cloud.” It must not ship until the real-image dataset, holdout rules and visual Test capability in this note are implemented and independently verified.

### Stage C — weather associations — REVISE to Learn-only support

The initial genus guide may teach only associations that are useful to identification or describe present conditions and are supported directly by WMO/ECCC material. Examples include:

- Cirrostratus often producing halo phenomena;
- Altostratus lacking halo phenomena and sometimes showing the Sun only vaguely, as through ground/frosted glass;
- Nimbostratus being a thick, often dark layer associated with more-or-less continuous rain or snow that usually reaches the ground;
- Stratus being a generally uniform grey layer that may produce drizzle, snow or snow grains;
- Cumulonimbus having very large vertical extent and a frequently flattened/fibrous upper portion, often with precipitation beneath it.

Do **not** turn common synoptic sequences into scored rules such as “cirrus means rain in X hours,” “cumulus means fair weather,” or “altocumulus means a storm later.” Such patterns depend on broader atmospheric context and would make the app imply forecasting skill it has not assessed.

### Stage D — fronts and weather-map literacy — DEFER as a sibling programme topic

Fronts and surface-map symbols belong in the broader environment/weather family, but not inside #131. They are better treated as a later deterministic diagram-reading topic: warm/cold/stationary/occluded-front symbols, high/low pressure and selected current Canadian chart conventions.

This topic should receive its own source/version research because chart products and conventions are not the same problem as visual cloud classification. Current Canadian authoritative material exists: ECCC defines fronts and Transport Canada’s current AIM documents synoptic features and graphical weather products. That makes the topic promising, but separate.

## 3. Completion claims and explicit exclusions

| Topic | Allowed claim | Explicitly not proved |
| --- | --- | --- |
| #131 Learn guide | Learner has a visual reference for ten WMO genera and the main distinguishing cues. | Retained recognition across arbitrary real clouds. |
| Later scored recognition | Learner identifies the ten genera from varied ground/daytime photographs within the tested boundary. | Species/varieties, professional observation, airborne/satellite views, cloud height estimation, forecasting. |
| Learn-only weather associations | Learner understands selected observable/definitional associations and their limitations. | Prediction of future timing, severity or probability from one image. |
| Later fronts/maps | To be defined separately as symbol/chart interpretation. | Operational forecasting or aviation qualification. |

## 4. Authority and source hierarchy

### Tier A — controlling factual authority

1. **World Meteorological Organization — International Cloud Atlas, 2017 Edition**
   - [Ten cloud genera](https://cloudatlas.wmo.int/en/clouds-genera.html)
   - [Cloud levels and genus allocation](https://cloudatlas.wmo.int/en/clouds-definitions.html)
   - [Genus identification table](https://cloudatlas.wmo.int/en/tabular-guide-genus.html)
   - [Identifying clouds](https://cloudatlas.wmo.int/en/identifying-clouds.html)
   - [Surface-observation conditions](https://cloudatlas.wmo.int/en/observing-clouds.html)

   WMO owns the taxonomy and diagnostic boundary. Its genus definitions and identification guidance control any scored classification.

2. **Environment and Climate Change Canada / Meteorological Service of Canada**
   - [MANOBS — Manual of Surface Weather Observation Standards, 8th Edition, Amendment 2](https://www.canada.ca/en/environment-climate-change/services/weather-manuals-documentation/manobs-surface-observations.html)
   - [MANMAR — Manual of Marine Weather Observations](https://www.canada.ca/en/environment-climate-change/services/weather-manuals-documentation/marine-observations.html)
   - [Weather and meteorology glossary](https://www.canada.ca/en/environment-climate-change/services/weather-general-tools-resources/glossary.html)

   ECCC is the Canadian operational cross-check. MANMAR Chapter 9 explicitly covers the ten distinctive cloud types and differentiation; MANOBS uses WMO cloud standards and codes.

### Tier A/B for a later Canadian weather-map topic

- [Transport Canada Aeronautical Information Manual — current Meteorology chapter](https://tc.canada.ca/en/aviation/publications/transport-canada-aeronautical-information-manual-tc-aim-tp-14371)

Use only if/when the separate map/symbol topic is researched. Do not import aviation-specific scope into the genus guide merely because the source is authoritative.

### Media/licensing authorities

- [Wikimedia Commons reuse guidance](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/en)
- [Wikimedia Commons cloud-types category](https://commons.wikimedia.org/wiki/Category:Cloud_types)
- [WMO International Cloud Atlas copyright terms](https://cloudatlas.wmo.int/en/copyright.html)
- [NOAA image licensing/usage guidance](https://www.omao.noaa.gov/image-licensing-usage-info)

WMO Atlas images are **reference material, not the default production image library**. WMO states that Atlas material is freely downloadable/copyable for personal non-commercial use only and that other reuse of individual images requires permission from the relevant copyright holder. Use the Atlas to classify and QA; do not copy its images into Argus without explicit permission.

Wikimedia Commons is the preferred discovery pool because it has substantial coverage for the genera and provides file-level licensing metadata. Commons itself warns that licensing information is not warranted; each accepted file therefore requires an item-level rights check as well as an identity check.

NOAA can supplement Commons where a specific still has clear federal provenance and no third-party copyright notice. NOAA states that its still imagery is generally not copyrighted, but third-party material can be present, so item-level credits still matter.

## 5. Claim ledger

| Claim / item family | Authority | Scored? | Notes / ambiguity |
| --- | --- | ---: | --- |
| There are ten WMO cloud genera | WMO ICA, genera | Yes, if later recognition ships | Stable finite boundary. |
| High level: Ci, Cc, Cs | WMO ICA, Table 6 | Learn support; can support scoring | Level ranges overlap and vary with latitude. |
| Middle level: Ac, As, Ns | WMO ICA, Table 6 | Learn support; can support scoring | **Corrects #131:** Nimbostratus is allocated to middle level, though it commonly extends into other levels. |
| Low level: St, Sc, Cu, Cb | WMO ICA, Table 6 | Learn support; can support scoring | Cu/Cb bases are usually low; their tops can reach middle/high levels. |
| Cc / Ac / Sc element-size distinction | WMO ICA, genus definitions + Table 12 | Recognition cue | Apparent widths: Cc <1°, Ac usually 1–5°, Sc >5° for regularly arranged elements. Best used with ground-observer context, not tightly cropped images. |
| Cs vs As | WMO ICA definitions/Table 12 | Recognition cue | Cs is a transparent whitish veil and often produces halos; As is grey/blue and does not produce halo phenomena. |
| As vs Ns | WMO ICA definitions | Recognition cue | As may show Sun vaguely; Ns is thick enough to blot it and is associated with continuous precip usually reaching ground. |
| St vs Sc | WMO ICA definitions | Recognition cue | St is generally uniform; Sc has larger non-fibrous rounded/tessellated/rolled elements and dark parts. |
| Cu vs Cb | WMO ICA definitions | Recognition cue | Cu has sharp detached mounds/domes/towers; Cb has much greater vertical extent and an upper portion becoming smooth/fibrous/striated and often flattened/anvil-like. |
| Ci vs Cs | WMO ICA definitions | Recognition cue | Ci is detached filaments/patches/bands; Cs is a broader transparent veil. |
| One photograph can establish robust recognition | None | **No** | Explicitly rejected as an Argus editorial inference. |
| A genus alone reliably predicts future weather | None at the required level | **No** | Do not score. Broader synoptic context is required. |

## 6. Content specification

### 6.1 Correct the provisional #131 grouping

#131 currently proposes:

- High: Ci, Cs, Cc
- Middle: As, Ac
- Low: St, Sc, Ns
- Vertical development: Cu, Cb

That is pedagogically familiar but not faithful to the WMO level allocation. Revise it.

Use the WMO allocation as the factual frame:

- **High:** Cirrus, Cirrocumulus, Cirrostratus
- **Middle:** Altocumulus, Altostratus, Nimbostratus
- **Low-base:** Stratus, Stratocumulus, Cumulus, Cumulonimbus

Then explain the exceptions in HTML:

- Altostratus often extends above the middle level;
- Nimbostratus usually extends into other levels;
- Cumulus and Cumulonimbus have low bases but can develop far upward into middle/high levels.

“Vertical development” can remain a useful descriptive teaching cue for Cu/Cb, but it must not be presented as a fourth WMO altitude level.

### 6.2 Genus-level visual cues to teach

| Genus | Primary visible cue for v1 | Main confusion to address |
| --- | --- | --- |
| **Cirrus (Ci)** | Detached white delicate filaments, patches or narrow bands; fibrous/hair-like or silky. | Cirrostratus: detached elements vs broad veil. |
| **Cirrocumulus (Cc)** | Thin white patch/sheet of very small grains/ripples, generally without shading; most regular elements <1° apparent width. | Altocumulus and Stratocumulus: element size and shading. |
| **Cirrostratus (Cs)** | Transparent whitish veil, smooth or fibrous, partly/totally covering sky; often halos. | Altostratus: halo/opacity and Sun appearance. |
| **Altocumulus (Ac)** | White/grey patches, rolls or rounded masses, generally with shading; regular elements usually 1–5°. | Cc/Sc size continuum. |
| **Altostratus (As)** | Grey/blue sheet, uniform/fibrous/striated; Sun can appear vaguely through thinner parts; no halo. | Cs and Ns. |
| **Nimbostratus (Ns)** | Thick grey/dark diffuse layer, Sun blotted out, continuous rain/snow in most cases; low ragged cloud may sit beneath. | Altostratus and Stratus. |
| **Stratocumulus (Sc)** | Grey/white layer of large rounded/tessellated/rolled elements, usually with dark parts; regular elements >5°. | Altocumulus and Stratus. |
| **Stratus (St)** | Generally uniform grey low layer/base; Sun outline clear when visible; may appear as ragged patches. | Stratocumulus / low Nimbostratus scenes. |
| **Cumulus (Cu)** | Detached dense sharp-edged mounds/domes/towers; cauliflower-like top; darker nearly horizontal base. | Developing Cb. |
| **Cumulonimbus (Cb)** | Heavy dense cloud with very large vertical extent; upper portion becomes smooth/fibrous/striated and usually flattened, often anvil/plume. | Large Cumulus/congestus-like development. |

The guide should teach **relationships**, not ten isolated flashcards. The most useful recognition content is the set of contrasts above.

### 6.3 Learn-only support

Include:

- WMO level diagram or simple HTML/SVG explanation;
- compact explanation of apparent angular element size for the Cc/Ac/Sc confusion set;
- one comparison section for Cs/As/Ns;
- one comparison section for St/Sc;
- one comparison section for Cu/Cb;
- a limitation that still photographs omit motion, height measurements and wider sky context;
- “what clouds can and cannot tell you” with the forecast boundary stated plainly.

Do not add species/varieties merely to make the guide look richer. They are out of the v1 completion boundary.

## 7. Medium and asset plan

### 7.1 Real-image-first policy

For natural cloud recognition, variation is part of the lesson. Use real photographs whenever practical.

**Preferred acquisition order:**

1. Wikimedia Commons files with clear reusable rights and independently verified genus identity;
2. government photo libraries/agency imagery with clear item-level reuse terms and identification;
3. direct permission from photographers/institutions where a particularly useful gap remains;
4. AI-generated imagery only under the narrow fallback policy below.

Do not hotlink production media. Store an optimized local derivative so the app can be reliable/offline and so upstream file changes do not silently alter the curriculum.

### 7.2 Asset provenance record

Every accepted image needs a durable manifest/ledger entry containing at least:

- Argus asset ID and intended genus;
- role: `learn-hero`, `learn-practice`, `assessment-holdout`, or `fallback-generated`;
- original file/page URL;
- original source URL if different from the host page;
- creator/photographer and source organization;
- exact license, version and license URL, or public-domain basis;
- required attribution string;
- crop/derivative/share-alike obligations;
- whether Argus cropped, resized, recompressed or otherwise changed the file;
- original-file checksum where practical and packaged-asset SHA-256;
- source/download date;
- classification evidence and WMO criteria used in QA;
- QA reviewer/pass date and disposition;
- confusion set / visual cue represented;
- any geographic/date metadata useful for diversity, when reliably known.

A Commons category label is discovery metadata, **not classification authority**. License and identity must be verified separately.

### 7.3 License acceptance rule

Prefer uncomplicated reusable assets in this order:

1. public domain / CC0;
2. CC BY;
3. CC BY-SA where Argus can satisfy the derivative and attribution obligations.

Reject an asset if rights are unclear, the stated source cannot be reconciled with the license, the file relies on non-free/fair-use status, or the derivative terms cannot be satisfied by the intended packaging.

### 7.4 #131 first asset set

For the unscored guide, **one QA-passed hero image per genus (10 total)** is acceptable as orientation material, because #131 explicitly does not claim general recognition. The hero should be a relatively clear instance, but not a hyper-stylized “perfect icon” of the genus.

The page must explicitly teach that real clouds vary and that the hero is an example, not the complete category.

## 8. Exemplar-diversity rule before scored recognition

There is no WMO/ECCC rule saying that a particular number of photographs proves recognition. The numeric threshold below is therefore an **Argus editorial QA floor**, not a meteorological standard.

### Minimum dataset gate

Do not approve a scored ten-genus image-recognition Test until there are **at least 8 independently acceptable real photographs per genus — 80 total**.

Per genus:

- **3 images maximum may be exposed in Learn/practice** before scoring;
- **at least 5 must remain assessment holdouts** and must not appear in Learn/practice;
- no generated image counts toward the eight;
- no two crops/edits of the same photograph count separately;
- burst shots or near-duplicates of the same cloud event count as one diversity slot.

This is a floor, not a target. Ambiguous/confusion-heavy genera should move toward 10–12 accepted real images where practical.

### Diversity requirements within each genus

The eight only count if the set contains:

- at least **two independent photographers/source lineages**;
- at least **three materially different compositions/manifestations** within the v1 genus boundary;
- both a textbook-clear exemplar and less-ideal but still unambiguous views;
- enough surrounding sky/context to preserve any cue that depends on apparent scale or coverage;
- representation of the genus’s principal confusion set rather than eight visually near-identical examples.

Across the full dataset, avoid making all classes separable by irrelevant shortcuts such as one photographer, one geography, one aspect ratio, one sky colour or one editing style.

### Assessment-use rule

A future Test must sample **variants of the same semantic genus**, not treat each photograph as a separate fact to memorize. Qualifying evidence should require success on at least two different held-out images for each genus across the learner’s assessment history before claiming varied photographic recognition.

This matters because the current Argus item model is text prompt/answer. Simply creating five independent “Cirrus photo” items would measure memory for five photographs, not the desired class-level competence.

### Boundary for v1 scored images

Use ordinary visible-light photographs taken from the Earth’s surface in daytime. Exclude from the initial scoring pool:

- aircraft/above-cloud views;
- satellite/radar/infrared imagery;
- night scenes;
- strongly colour-shifted sunrise/sunset images where colour dominates form;
- heavy fog/haze/smoke obstruction;
- fisheye or extreme processing;
- composite images;
- images where multiple genera make the intended answer genuinely ambiguous.

Those can become later advanced material only after the basic claim is stable.

## 9. AI fallback policy

### Allowed

AI-generated cloud imagery may be used only when:

1. an unscored Learn/reference need cannot be met by a credible licensed real image after reasonable sourcing effort;
2. the requested visual state has clear WMO diagnostic criteria;
3. the image is independently checked against the WMO authority and its nearest confusion set;
4. failure cannot contaminate a scored recognition pool.

Possible uses include an explanatory background or a replacement Learn hero when licensing blocks an otherwise straightforward genus.

### Not allowed in the initial programme

- as factual authority;
- as the sole exemplar for a genus;
- in the 80-image minimum scored dataset;
- as a held-out Test stimulus;
- to illustrate subtle/ambiguous species or transitional states that reviewers cannot verify confidently;
- merely because it is more dramatic or visually consistent than real photographs.

### Generated-image QA rubric

A generated candidate passes only if all are true:

**Classification**
- matches the WMO genus definition;
- contains the intended diagnostic cues;
- does not contain a contradictory cue that would point to a nearby genus;
- remains identifiable at the actual phone crop/size.

**Physical plausibility**
- cloud geometry, texture, lighting and precipitation relationships are meteorologically plausible;
- no repeated/generated texture artifacts, impossible edges or pasted-looking structures;
- no cinematic exaggeration that changes the diagnostic form.

**Confusion check**
- reviewer explicitly compares it with the closest confusion set, not just with the target definition;
- if a competent reviewer could reasonably choose two genera from the still, reject rather than rationalize.

**Process/provenance**
- record model/version/date and prompt/seed where available;
- record the WMO criteria used;
- record rejected versions/reasons where useful;
- require two independent QA passes for any generated asset accepted into Learn.

For cloud recognition, “looks like a cloud” is not sufficient QA.

## 10. Product and engineering implications

### 10.1 Small reusable Learn visual-guide primitive — BUILD if not already delivered by #129

Current `LearnBlock` supports paragraphs, lists, definitions, tables, entries and the Morse-specific packet; it has no generic image/figure block. #129 Beaufort and #131 cloud genera now provide two approved consumers, so a small reusable primitive is justified under the roadmap reuse rule.

The capability should remain narrow: an ordered **visual guide/set** whose individual figures support:

- local asset reference;
- accessible alt text;
- HTML-rendered marker/title/caption/cues;
- provenance/credit reference;
- responsive one-at-a-time/snap presentation on phones and an appropriate larger-screen layout.

Do not build a generic CMS/media framework. Essential labels and explanations remain HTML.

If #129 implementation lands an equivalent reusable primitive first, #131 should reuse it rather than add another one.

### 10.2 Scored image-stimulus capability — DEFER

The current scored item contract is `prompt: string` / `answer: string` with forward/bidirectional semantics. A credible cloud-recognition Test needs a concept-level item with multiple image variants and holdout/exposure control.

Do not bolt image paths into plain text items or create each photograph as a separate memorization item.

A later engineering issue should define the smallest visual-recognition exercise model only after the 80-image dataset gate is demonstrably achievable. It must support:

- a semantic answer/class with multiple media variants;
- Learn/practice vs assessment-holdout roles;
- deterministic sampling without exposing holdouts in Learn;
- evidence that can distinguish repeated success across different variants;
- alt/accessibility behavior without leaking the answer;
- offline/media-size budgeting.

### 10.3 Offline/media budget

The first #131 set is only ten optimized images and is compatible with the existing direction to keep shipped curriculum available locally. A later 80+ image scored dataset is materially larger and should be size-budgeted before inclusion. Do not introduce per-topic download UX in #141; coordinate with the offline/content-pack work if the measured media footprint eventually justifies it.

## 11. QA and validation plan

### Sourced real image — acceptance rubric

Every production image must pass all of the following:

1. **Rights:** license/public-domain basis verified at the item level; attribution/derivative requirements recorded.
2. **Origin:** original creator/source identified; re-upload chains understood well enough to trust the rights statement.
3. **Classification:** genus independently checked against WMO definition/Table 12; Commons metadata alone is insufficient.
4. **Confusion:** closest plausible alternative genus explicitly considered.
5. **Boundary:** ground/daytime/visible-light and otherwise inside the intended stage boundary.
6. **Presentation:** crop preserves diagnostic context; image remains useful at phone size.
7. **No shortcut contamination:** no baked label, filename/UI text or distinctive editing treatment that reveals the answer.
8. **Dataset role:** Learn/practice/holdout assignment recorded before shipping; holdouts are not accidentally exposed elsewhere.
9. **Duplication:** perceptual/manual duplicate check prevents alternate crops/near-duplicates from inflating diversity.
10. **Provenance:** packaged file hash and manifest entry match the accepted file.

For the future scored pool, require **two independent classification passes**. If the reviewers disagree or either marks the image ambiguous, it is not a scored asset.

### Content QA

- verify the ten names/abbreviations against WMO;
- verify altitude grouping against WMO Table 6;
- verify every visual cue against a WMO genus definition or Table 12;
- keep source fact distinct from Argus editorial shorthand;
- ensure Learn copy does not convert “usual/possible” WMO features into universal rules;
- explicitly test the major confusion sets;
- verify no weather-association sentence reads as a deterministic forecast;
- verify WMO Atlas images have not been copied without permission.

### Product QA

At phone width:

- diagnostic parts of each photo remain visible without relying on pinch-zoom;
- alt text describes the visual without becoming the only path to understanding;
- attribution does not overwhelm the guide but remains accessible;
- essential labels/cues are HTML and survive 200% text scaling;
- image failure leaves understandable text rather than a blank topic;
- no horizontal page overflow outside the intentional visual-set interaction.

## 12. Relationship to #131 and Beaufort

### #131 — revise, then proceed

#131 remains the right downstream issue, but its specification must be revised in three places before asset production:

1. **Correct the level grouping** — Nimbostratus belongs in WMO middle-level allocation; Cumulus/Cumulonimbus are low-base genera with large vertical extent, not a formal fourth WMO level.
2. **Real imagery first** — source ten hero photographs with full provenance before considering generation.
3. **Keep #131 unscored** — one hero per genus is a field guide, not evidence of robust recognition.

#131 should implement only the Stage A visual/reference guide. The 80-image dataset and image-scored Test are not hidden acceptance criteria for #131.

### Beaufort — reuse layout lessons, not epistemic assumptions

The Beaufort visual guide uses four staged coastal images to build intuition while the authoritative scored material remains textual force/name/knot mapping. Its images are explicitly not precise force diagnosis.

Cloud recognition differs in one crucial way: **natural visual variation is itself the competence**. A continuous/synthetic visual progression can support explanation, but it cannot substitute for real varied examples if Argus later claims photographic recognition.

Reuse from Beaufort:

- image-first phone layout;
- HTML labels/captions outside artwork;
- alt-text/accessibility approach;
- local optimized assets;
- responsive visual-set/carousel behavior.

Do not reuse:

- the assumption that a small generated set can stand in for the real visual distribution;
- one fixed panorama/style as the basis for a scored recognition Test.

## 13. Risks and unresolved questions

1. **Numeric exemplar floor is editorial.** Eight per genus is a conservative Argus minimum, not a research finding from WMO/ECCC. Reassess after pilot confusion data; increase rather than decrease the set if learners can exploit image-specific shortcuts.
2. **Some real images are legitimately mixed/ambiguous.** Reject ambiguity from the initial scored pool rather than pretending every sky has one clean label.
3. **Apparent angular-size cues need context.** Cc/Ac/Sc size guidance is valuable to a ground observer but can be destroyed by tight cropping. Asset selection must preserve sufficient sky context.
4. **License drift/re-upload errors are possible.** Store source metadata/checksums at acquisition; do not assume a future Commons page is identical to the accepted state.
5. **Weather maps are a separate standards/version problem.** Their promise does not justify expanding #141 into a general meteorology course.
6. **A true visual Test changes the item model.** Do not pre-build that capability until the real dataset is proven feasible.

## 14. Bounded implementation handoffs

Do not open a broad “weather programme implementation” issue. Keep the work separable.

### Handoff A — #131 revision + ten-genus Learn guide

Owner: existing #131.

Bound it to:

- correct WMO grouping and genus copy;
- one sourced real hero image per genus;
- explicit confusion-set teaching;
- provenance manifest/ledger;
- unscored Learn/reference presentation;
- no forecast claims;
- no Test changes.

### Handoff B — reusable Learn visual-guide primitive

Open only if #129 has not already delivered an equivalent reusable capability by implementation time.

Bound it to the small media-set primitive described in §10.1, used by Beaufort and cloud guides. No generic CMS, no scored media.

### Handoff C — scored cloud-recognition dataset + capability

**Do not open yet.** First demonstrate that the sourcing process can satisfy the 8-real-images-per-genus gate with rights and classification QA.

If that feasibility gate passes, split into:

1. real-image dataset acquisition/provenance/QA;
2. visual-recognition item/variant capability;
3. cloud Test integration and evidence rules.

### Handoff D — fronts / weather-map literacy research

Separate later research issue. Candidate scope: front meanings/symbols, pressure centres/isobars and a small set of current Canadian chart-reading conventions. Use deterministic diagrams, not AI weather maps. Do not attach this work to #131.

## 15. Final decisions

- **BUILD:** ten-genus WMO Learn/reference foundation.
- **REVISE:** #131 grouping, imagery policy and contrast-based teaching copy before production.
- **BUILD when needed:** one small reusable Learn visual-guide/media-set primitive shared with Beaufort if equivalent capability has not already landed.
- **REVISE:** weather implications to present-condition/identification associations only; keep them unscored.
- **DEFER:** scored visual cloud recognition until the 80-real-image diversity/holdout gate and a proper variant-aware Test capability exist.
- **DEFER:** fronts/weather-map literacy to a separate sourced topic.
- **DEFER:** species/varieties/supplementary features.
- **RESTRICT:** AI imagery to strictly QA'd unscored fallback use; do not use it in the initial scored recognition dataset.

With those boundaries, #131 can proceed to source/QA its ten real hero assets without waiting for a general meteorology curriculum, while Argus avoids claiming that memorizing one cloud photograph equals recognizing the sky.