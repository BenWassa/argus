# Issue #131 — WMO cloud genera visual field guide

**Status:** implementation ready; asset sourcing can proceed, UI integration depends on #146  
**Issue:** #131  
**Research authority:** #141 and `docs/open/ISSUE_141_CLOUD_WEATHER_RECOGNITION.md`  
**Shared UI dependency:** #146  
**Roadmap:** `docs/LIBRARY_ROADMAP.md`

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

## Implementation status — asset sourcing blocked; UI integration unblocked (2026-09-30)

**Sourcing/QA not started.** The preferred source order starts with item-level verification on Wikimedia Commons and classification cross-checks against the WMO Cloud Atlas. Both `commons.wikimedia.org` / `upload.wikimedia.org` and `cloudatlas.wmo.int` / `www.wmo.int` (and NOAA) were refused by the sandbox egress policy, so no real photograph could be fetched, licence-checked or classification-checked. No image was substituted: AI generation is permitted only as a strict unscored fallback, and using it merely because sourcing was unavailable would sidestep the asset policy.

### To unblock

Allow the agent network policy to reach `commons.wikimedia.org`, `upload.wikimedia.org`, `cloudatlas.wmo.int` and optionally `www.noaa.gov`, or supply a vetted set of ten photographs with their licence and classification evidence.

### What is ready

The shared Learn visual primitive this issue depends on exists (#146, PR #152): `LearnEntry.visual` carries a local `/media/` image with required alt text, visible caption and credit line, and an `assetId` for the provenance record, and a failed image falls back to its text. The guide can therefore be written as one `entries` block of ten genera with no further UI work. The remaining work is the ten images, the provenance records and the copy from #141.
