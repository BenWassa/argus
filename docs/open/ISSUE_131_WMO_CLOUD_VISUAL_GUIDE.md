# Issue #131 — WMO cloud genera visual field guide

**Status:** implemented on `feat/topic-staged-assets`, 2026-10-02; not merged.
**Authority:** maintained cloud-guide scope and packaged asset provenance contract.
**Issue:** #131  
**Research authority:** #141 and `docs/open/ISSUE_141_CLOUD_WEATHER_RECOGNITION.md`  
**Shared UI dependency:** #146  
**Roadmap:** [Library roadmap](LIBRARY_ROADMAP.md)

## Locked first phase

Build a **Learn/reference field guide** for the ten WMO cloud genera. Do not add scored photographic recognition in this issue.

Use the WMO level allocation as the factual frame:

- **High:** Cirrus, Cirrocumulus, Cirrostratus
- **Middle:** Altocumulus, Altostratus, Nimbostratus
- **Low-base:** Stratus, Stratocumulus, Cumulus, Cumulonimbus

Explain that Nimbostratus commonly extends into other levels and that Cumulus/Cumulonimbus have low bases but may develop far upward. “Vertical development” may remain a descriptive teaching cue, not a fourth WMO altitude level.

## Learn structure

Teach relationships rather than ten isolated cards:

1. what a cloud genus is and the ten-genus boundary;
2. WMO level framework;
3. one strong real-world hero image per genus with concise HTML cues;
4. comparison sections for Cc/Ac/Sc, Cs/As/Ns, St/Sc and Cu/Cb;
5. “what clouds can and cannot tell you” with the forecasting boundary stated plainly.

Essential names/cues/explanations remain HTML.

## Asset policy

Prefer real correctly identified photography in this order:

1. Wikimedia Commons with clear reusable rights and independently verified identity;
2. government/agency imagery with clear item-level reuse terms and identification;
3. direct permission where a useful gap remains;
4. AI-generated imagery only as a strict unscored fallback.

WMO Atlas imagery is classification/QA authority, not a default production library; do not copy an Atlas image without the required reuse rights.

Store optimized local derivatives rather than hotlinking.

Every accepted image needs a durable provenance record covering at least:

- Argus asset ID and intended genus;
- role/use in Learn;
- source/file URL and creator/organization;
- exact licence/public-domain basis and required attribution;
- crop/derivative notes;
- packaged SHA-256;
- classification evidence / WMO cues used in QA;
- represented confusion set or diagnostic cue;
- QA disposition and review date.

## Scored recognition gate

One hero photograph per genus is orientation material, not evidence of robust recognition.

Do not build a photographic Test here. #141 sets the current Argus product gate for any later scored genus-recognition programme at **at least 8 independent real photographs per genus (80 total), with 5 held out per genus**, plus a suitable visual-Test capability and independent QA.

Treat that number as an Argus QA threshold, not a universal scientific minimum.

## Weather boundary

Teach only source-backed observable/definitional associations that support identification or describe present conditions. Do not add deterministic future-weather rules based on one photograph.

Fronts/weather-map literacy, cloud species/varieties and advanced meteorology remain separate future work.

## Implementation sequence

1. Source and QA the ten hero images plus provenance records — can proceed now.
2. Prepare concise genus/comparison Learn copy directly from #141's researched cues.
3. After #146 lands, implement the visual/media guide using the shared Learn primitive.
4. Validate at phone widths and keep all essential text accessible.

## Completion

- ten WMO genera represented by independently QA'd real hero images where feasible;
- authoritative grouping/exceptions are correct;
- confusion-set teaching is present;
- every asset has complete rights + classification provenance and packaged hash;
- guide uses the shared #146 Learn visual primitive;
- no scored photographic recognition or deterministic forecasting claim ships;
- relevant browser/accessibility checks pass.

## Hero image set — sourced and QA'd (2026-09-30)

Step 1 of the implementation sequence is done. Ten real photographs, one per genus, come from Wikimedia Commons. Each file page was resolved through the Commons API and each licence read from its metadata. Every image was checked by eye against the WMO International Cloud Atlas definition of its genus.

Rejected along the way:
- **Colour-enhanced images.** `CirrusField-color.jpg` and `GoldenMedows.jpg` are colour-enhanced, which breaks the realism rule.
- **An aerial view.** `Above_the_Clouds.jpg` looks down on the cloud; the guide needs ground views.
- **Unclear diagnostics.**
  - A dark, glare-dominated cirrostratus.
  - A cirrocumulus that reads as lenticular.
  - A stratocumulus that reads as altocumulus.
  - A stratus seen from above.
  - A portrait nimbostratus shot through a rain-covered windscreen.
- **An image with no author in its metadata.** It was replaced.

All ten are CC BY-SA, so the credit line must be shown wherever the image is (`credit` in #146's visual primitive), and the derivative carries the same licence. The set is 180 KB of AVIF under `public/media/clouds/`, and is precached like every other file in `dist`. The `assetId`s match the #146 `assetId` field.

Implemented: `cloud-genera` is a ten-item textual abbreviation-to-name topic, authorized by the owner on 2026-10-02. The photos remain unscored `LearnEntry.visual` content, grouped High / Middle / Low-base with comparison sections, source links, credits and unchanged packaged images. Shared manual visual-guide controls work inside the topic’s closed folds. Completion claims vocabulary only, never photographic recognition.

### `cloud-cirrus` — Cirrus

- **File:** `/media/clouds/cirrus.avif` (700 × 467, 71,758 bytes)
- **SHA-256:** `daee598c43df9ccbe6c0a2f897ad44506bcd09cffa68d4496d5186371fb07104`
- **Role:** the genus's hero image in the Learn guide (orientation only, never scored)
- **WMO level:** High
- **Source:** [File:Cirrus Sierra.JPG](https://commons.wikimedia.org/wiki/File:Cirrus_Sierra.JPG), 3264 × 2448 original
- **Creator:** Jebulon
- **Licence:** [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0). The derivative is shared under the same licence.
- **Credit line:** `Photo: Jebulon, CC BY-SA 3.0, via Wikimedia Commons`
- **Derivative:** 3:2 crop, gravity north, scaled to 700x467, metadata stripped, AVIF (SVT-AV1 CRF 24), from the Commons 1600 px rendition
- **Classification QA:** Detached white fibrous filaments and hooked strands ("mares' tails") on a clear blue sky; no grain, no sheet.
- **Confusion it separates:** Cirrus vs cirrostratus (sheet) and cirrocumulus (grains).
- **Disposition:** accepted, 2026-09-30

### `cloud-cirrocumulus` — Cirrocumulus

- **File:** `/media/clouds/cirrocumulus.avif` (700 × 467, 11,752 bytes)
- **SHA-256:** `396308afece91e8fe515e2a26769e2a39b2b0d672881c475d3d5ddf78ab2f86d`
- **Role:** the genus's hero image in the Learn guide (orientation only, never scored)
- **WMO level:** High
- **Source:** [File:Cirrocumulus clouds Thousand Oaks July 2010.jpg](https://commons.wikimedia.org/wiki/File:Cirrocumulus_clouds_Thousand_Oaks_July_2010.jpg), 2500 × 1600 original
- **Creator:** King of Hearts
- **Licence:** [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0). The derivative is shared under the same licence.
- **Credit line:** `Photo: King of Hearts, CC BY-SA 3.0, via Wikimedia Commons`
- **Derivative:** 3:2 crop, gravity center, scaled to 700x467, metadata stripped, AVIF (SVT-AV1 CRF 24), from the Commons 1600 px rendition
- **Classification QA:** Very small white grains and ripples, no shading, in a thin patch; individual elements far smaller than a finger at arm's length.
- **Confusion it separates:** Cc vs Ac: elements tiny and unshaded here.
- **Disposition:** accepted, 2026-09-30

### `cloud-cirrostratus` — Cirrostratus

- **File:** `/media/clouds/cirrostratus.avif` (700 × 467, 7,988 bytes)
- **SHA-256:** `f3f483fcb893d88bda7e539fed452506ecb1966802bdcc66a0492ad4fa496293`
- **Role:** the genus's hero image in the Learn guide (orientation only, never scored)
- **WMO level:** High
- **Source:** [File:Cirrostratus fibratus with 22 degrees halo.jpg](https://commons.wikimedia.org/wiki/File:Cirrostratus_fibratus_with_22_degrees_halo.jpg), 1024 × 768 original
- **Creator:** Eduardo Marquetti
- **Licence:** [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0). The derivative is shared under the same licence.
- **Credit line:** `Photo: Eduardo Marquetti, CC BY-SA 2.0, via Wikimedia Commons`
- **Derivative:** 3:2 crop, gravity center, scaled to 700x467, metadata stripped, AVIF (SVT-AV1 CRF 24), from the Commons 1600 px rendition
- **Classification QA:** Transparent whitish veil through which the sun shines, producing a complete 22° halo; the halo is the Cs diagnostic.
- **Confusion it separates:** Cs vs As: a halo means Cs; As gives a ground-glass sun and no halo.
- **Disposition:** accepted, 2026-09-30

### `cloud-altocumulus` — Altocumulus

- **File:** `/media/clouds/altocumulus.avif` (700 × 467, 25,473 bytes)
- **SHA-256:** `faf6c021d38e7b6b78f07077de99938fa23e7c274f310300f64d775b118a9767`
- **Role:** the genus's hero image in the Learn guide (orientation only, never scored)
- **WMO level:** Middle
- **Source:** [File:Altocumulus.jpg](https://commons.wikimedia.org/wiki/File:Altocumulus.jpg), 2000 × 1330 original
- **Creator:** Bidgee
- **Licence:** [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0). The derivative is shared under the same licence.
- **Credit line:** `Photo: Bidgee, CC BY-SA 3.0, via Wikimedia Commons`
- **Derivative:** 3:2 crop, gravity center, scaled to 700x467, metadata stripped, AVIF (SVT-AV1 CRF 24), from the Commons 1600 px rendition
- **Classification QA:** Layer of rounded white-and-grey masses with shading, in regular patches with blue gaps; elements larger than Cc, smaller than Sc.
- **Confusion it separates:** Ac vs Cc (shaded, larger) and Sc (smaller, higher).
- **Disposition:** accepted, 2026-09-30

### `cloud-altostratus` — Altostratus

- **File:** `/media/clouds/altostratus.avif` (700 × 467, 3,104 bytes)
- **SHA-256:** `9cf66d7360293d52de68c116510d8c390ce2169d72fd7ce517a96b47343da4c1`
- **Role:** the genus's hero image in the Learn guide (orientation only, never scored)
- **WMO level:** Middle
- **Source:** [File:Altostratus translucidus.jpg](https://commons.wikimedia.org/wiki/File:Altostratus_translucidus.jpg), 2048 × 1536 original
- **Creator:** The Great Cloudwatcher
- **Licence:** [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0). The derivative is shared under the same licence.
- **Credit line:** `Photo: The Great Cloudwatcher, CC BY-SA 3.0, via Wikimedia Commons`
- **Derivative:** 3:2 crop, gravity center, scaled to 700x467, metadata stripped, AVIF (SVT-AV1 CRF 24), from the Commons 1600 px rendition
- **Classification QA:** Greyish uniform sheet covering the sky, the sun visible as if through ground glass with no halo; no distinct elements.
- **Confusion it separates:** As vs Cs (no halo) and Ns (sun still visible, not dark and raining).
- **Disposition:** accepted, 2026-09-30

### `cloud-nimbostratus` — Nimbostratus

- **File:** `/media/clouds/nimbostratus.avif` (700 × 467, 3,458 bytes)
- **SHA-256:** `efdcdcea95103839408d69c7ee5b4af75574464abd1c93e9fd386992e4daa54b`
- **Role:** the genus's hero image in the Learn guide (orientation only, never scored)
- **WMO level:** Middle (commonly extends into other levels)
- **Source:** [File:Nimbostratus virga grey with hills.jpg](https://commons.wikimedia.org/wiki/File:Nimbostratus_virga_grey_with_hills.jpg), 4288 × 2848 original
- **Creator:** Simon A. Eugster
- **Licence:** [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0). The derivative is shared under the same licence.
- **Credit line:** `Photo: Simon A. Eugster, CC BY-SA 3.0, via Wikimedia Commons`
- **Derivative:** 3:2 crop, gravity center, scaled to 700x467, metadata stripped, AVIF (SVT-AV1 CRF 24), from the Commons 1600 px rendition
- **Classification QA:** Dark grey, featureless layer thick enough to hide the sun, with precipitation trails falling from its base across the whole view.
- **Confusion it separates:** Ns vs Cb (no towering or anvil) and As (dark, precipitating, sun hidden).
- **Disposition:** accepted, 2026-09-30

### `cloud-stratocumulus` — Stratocumulus

- **File:** `/media/clouds/stratocumulus.avif` (700 × 467, 6,748 bytes)
- **SHA-256:** `66c7e1dd87f8b41563cfc477631a27bc80059a7c496e4fa166bd5066147bc689`
- **Role:** the genus's hero image in the Learn guide (orientation only, never scored)
- **WMO level:** Low
- **Source:** [File:Stratocumulus stratiformis über dem Wachtküppel.jpg](https://commons.wikimedia.org/wiki/File:Stratocumulus_stratiformis_%C3%BCber_dem_Wachtk%C3%BCppel.jpg), 3830 × 2505 original
- **Creator:** GerritR
- **Licence:** [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0). The derivative is shared under the same licence.
- **Credit line:** `Photo: GerritR, CC BY-SA 4.0, via Wikimedia Commons`
- **Derivative:** 3:2 crop, gravity center, scaled to 700x467, metadata stripped, AVIF (SVT-AV1 CRF 24), from the Commons 1600 px rendition
- **Classification QA:** Grey and whitish layer of rounded rolls and masses with darker parts, covering most of the sky low over the hills; elements large.
- **Confusion it separates:** Sc vs Ac (larger, lower elements) and St (distinct masses, not uniform).
- **Disposition:** accepted, 2026-09-30

### `cloud-stratus` — Stratus

- **File:** `/media/clouds/stratus.avif` (700 × 467, 2,779 bytes)
- **SHA-256:** `713a00c305eb2a2927f599e1317a793ab55f58950f3ac01fe696254f54f4ec53`
- **Role:** the genus's hero image in the Learn guide (orientation only, never scored)
- **WMO level:** Low
- **Source:** [File:Stratus nebulosus über Limburg, 26.11.2020.jpg](https://commons.wikimedia.org/wiki/File:Stratus_nebulosus_%C3%BCber_Limburg,_26.11.2020.jpg), 5664 × 4248 original
- **Creator:** GerritR
- **Licence:** [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0). The derivative is shared under the same licence.
- **Credit line:** `Photo: GerritR, CC BY-SA 4.0, via Wikimedia Commons`
- **Derivative:** 3:2 crop, gravity center, scaled to 700x467, metadata stripped, AVIF (SVT-AV1 CRF 24), from the Commons 1600 px rendition
- **Classification QA:** Uniform grey layer with no structure, low over rooftops, hiding the sky entirely; the textbook "hanging fog" base.
- **Confusion it separates:** St vs Sc (no rolls or masses) and Ns (not dark or precipitating).
- **Disposition:** accepted, 2026-09-30

### `cloud-cumulus` — Cumulus

- **File:** `/media/clouds/cumulus.avif` (700 × 467, 21,723 bytes)
- **SHA-256:** `d9e445c8460ab431ab7d3d4a0cc4733067b2f92f6f406458b4b6a9c709a858bc`
- **Role:** the genus's hero image in the Learn guide (orientation only, never scored)
- **WMO level:** Low (base)
- **Source:** [File:Cumulus humilis clouds.jpg](https://commons.wikimedia.org/wiki/File:Cumulus_humilis_clouds.jpg), 3650 × 2592 original
- **Creator:** Toby Hudson
- **Licence:** [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0). The derivative is shared under the same licence.
- **Credit line:** `Photo: Toby Hudson, CC BY-SA 3.0, via Wikimedia Commons`
- **Derivative:** 3:2 crop, gravity center, scaled to 700x467, metadata stripped, AVIF (SVT-AV1 CRF 24), from the Commons 1600 px rendition
- **Classification QA:** Detached, dense, flat-based clouds with sharp cauliflower-like upper outlines, sunlit white against blue (humilis: little vertical extent).
- **Confusion it separates:** Cu vs Cb (no anvil, no great vertical development) and Sc (detached, not a layer).
- **Disposition:** accepted, 2026-09-30

### `cloud-cumulonimbus` — Cumulonimbus

- **File:** `/media/clouds/cumulonimbus.avif` (700 × 467, 13,072 bytes)
- **SHA-256:** `ae5e5cd20f25d65ea97f447a1dda421da71f8068dece012f35c5d76485728351`
- **Role:** the genus's hero image in the Learn guide (orientation only, never scored)
- **WMO level:** Low (base), developing through all levels
- **Source:** [File:Cumulonimbus incus over Warsaw, Poland.jpg](https://commons.wikimedia.org/wiki/File:Cumulonimbus_incus_over_Warsaw,_Poland.jpg), 5923 × 3954 original
- **Creator:** Kamil Nowacki
- **Licence:** [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0). The derivative is shared under the same licence.
- **Credit line:** `Photo: Kamil Nowacki, CC BY-SA 4.0, via Wikimedia Commons`
- **Derivative:** 3:2 crop, gravity center, scaled to 700x467, metadata stripped, AVIF (SVT-AV1 CRF 24), from the Commons 1600 px rendition
- **Classification QA:** Heavy dense cloud of great vertical extent topped by a smooth, spreading anvil (incus); the anvil is the Cb diagnostic.
- **Confusion it separates:** Cb vs Cu: the anvil and vertical extent.
- **Disposition:** accepted, 2026-09-30
