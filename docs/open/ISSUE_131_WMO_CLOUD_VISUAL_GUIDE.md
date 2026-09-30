# Issue #131 — WMO cloud genera visual guide

**Status:** downstream / hold final asset production pending #141  
**Issue:** #131  
**Upstream research:** #141 and `docs/open/ISSUE_141_CLOUD_WEATHER_RECOGNITION.md`  
**Roadmap:** `docs/LIBRARY_ROADMAP.md`

## Decision

Keep the ten WMO cloud genera as the likely first visual-reference topic after Beaufort, but do not lock the final production dataset until #141 resolves source hierarchy, licensing, exemplar diversity, AI fallback and QA.

This first phase remains a **Learn/reference guide**, not a visual-recognition Test. One exemplar can introduce a genus, but it cannot prove that a learner can recognize the category across different real clouds.

## Information architecture

Provisional grouping:

1. **High** — Cirrus, Cirrostratus, Cirrocumulus
2. **Middle** — Altostratus, Altocumulus
3. **Low** — Stratus, Stratocumulus, Nimbostratus
4. **Vertical development** — Cumulus, Cumulonimbus

#141 must verify the authoritative teaching boundary and whether this grouping needs qualification before production.

The app renders genus names and explanatory copy as HTML. Artwork contains no essential labels.

## First asset set

Provisional target: ten individual realistic sky images, one clear introductory exemplar per genus.

Prefer correctly identified, reusable real-world imagery where practical. AI-generated imagery is a fallback, not the factual authority.

The images do not need to form a continuous panorama. They should instead prioritize representative diagnostic form and believable atmospheric appearance.

## Production rules

- follow `docs/LIBRARY_RESEARCH_METHOD.md` and the asset/licensing decision from #141;
- realistic natural sky imagery rather than stylized weather art;
- no baked-in essential labels;
- no dramatic treatment that obscures diagnostic form;
- each asset independently reviewed against authoritative identification guidance before acceptance;
- avoid near-duplicate exemplars that make adjacent genera harder to distinguish;
- retain source, license/attribution and QA notes for every accepted sourced asset;
- generated assets require explicit QA and never substitute for the source authority.

## App presentation

Preferred first treatment remains a mobile carousel or grouped visual strip with one genus per card and the altitude/development grouping visible as section context, subject to #141.

The visual guide should sit before detailed textual/reference material if the topic ships.

## Future recognition phase

Do not build a scored visual Test from the first ten images. Robust category recognition requires multiple varied exemplars per genus, with acquisition and Test images separated so the learner is not simply memorizing photographs. #141 owns the minimum exemplar-diversity recommendation.

## Completion for this issue

Proceed after #141 produces a build recommendation and the following are resolved:

- source hierarchy and cloud-identification boundary;
- asset acquisition/licensing strategy;
- ten hero assets pass category QA;
- grouped mobile layout is defined;
- asset provenance is recorded;
- Learn copy is scoped without expanding into unsupported forecasting, cloud species or varieties.
