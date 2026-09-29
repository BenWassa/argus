# Issue #131 — WMO cloud genera visual guide

**Status:** design / asset planning  
**Issue:** #131  
**Related:** #104 visual-content research

## Decision

Use the ten WMO cloud genera as the next visual-reference topic after Beaufort.

This first phase is a **Learn/reference guide**, not a visual-recognition Test. One exemplar can introduce a genus, but it cannot prove that a learner can recognize the category across different real clouds.

## Information architecture

Group the visual guide into four understandable families:

1. **High** — Cirrus, Cirrostratus, Cirrocumulus
2. **Middle** — Altostratus, Altocumulus
3. **Low** — Stratus, Stratocumulus, Nimbostratus
4. **Vertical development** — Cumulus, Cumulonimbus

The app renders genus names and explanatory copy as HTML. Artwork contains no essential labels.

## First asset set

Produce ten individual realistic sky images, one clear introductory exemplar per genus.

The images do not need to form a continuous panorama. They should instead prioritize a clear, representative cloud form and believable atmospheric photography.

## Production rules

- realistic natural sky photography rather than stylized weather art;
- no baked-in labels;
- no dramatic treatment that obscures diagnostic form;
- each asset reviewed against WMO identification guidance before acceptance;
- avoid near-duplicate exemplars that make adjacent genera harder to distinguish;
- retain source and QA notes for every accepted asset.

## App presentation

Preferred first treatment: a mobile carousel or grouped visual strip with one genus per card and the four altitude/development groups visible as section context.

The visual guide should sit before the detailed textual/reference material if the topic later ships.

## Future recognition phase

Do not build a scored visual Test from the first ten images. Robust category recognition requires multiple exemplars per genus, with acquisition and Test images separated so the learner is not simply memorizing photographs.

## Completion for this issue

The issue is ready for implementation once:

- all ten hero assets pass category QA;
- the grouped mobile layout is defined;
- asset provenance is recorded;
- the Learn copy is scoped without expanding into forecasting, cloud species or varieties.
