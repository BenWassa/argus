# Issue #192 — Custom role badge art system

**Status:** owner-locked Nautical (current) family; independently layered vector candidate integrated in PR #196; runtime QA and owner vector-fidelity review remain open — 2026-10-07.  
**Authority:** active visual-production proposal for role badges only. `DESIGN.md` / `DESIGN.json` remain the authority for the application UI.

## 1. Purpose

Create distinctive custom badges for Argus roles such as Communicator, Operator, Medic and Diver.

The badges should make the new progression system more motivating and collectible while remaining visually compatible with Argus.

This issue does **not** decide what earns a role. #191 owns taxonomy and completion semantics.

## 2. Visual objective

Badges should feel like purpose-built **Argus insignia**:

- machined / stamped / engraved rather than cartoon achievements;
- strong silhouette at phone scale;
- restrained metal base;
- polished highlights consistent with Argus;
- limited accent colour;
- no embedded text unless later testing proves it necessary;
- recognisable in monochrome;
- visually richer than the existing topic icons without becoming dominant UI chrome.

They may be more expressive than Home because earning a role is a rare achievement moment.

## 3. What not to copy

Do not copy, trace, redraw, transform or closely imitate:

- CAF/DND ranks or occupational badges;
- other armed-forces rank/trade insignia;
- EMS, police or fire-service official insignia;
- PADI/SSI/other diving-agency marks;
- amateur-radio organisation logos;
- commercial certification badges.

Role names can evoke a field; badge art must remain original Argus artwork.

## 4. Shared construction system

Before generating the full set, test at least three families.

Possible families:

### A. Machined medallion

Circular or near-circular metal piece with one central symbol, shallow bevel and engraved secondary geometry.

### B. Shield / tab

Compact shield-like silhouette with a single large pictogram and restrained lower notch/tab. Must avoid looking like a copied service patch.

### C. Geometric mark

Abstract lozenge/hex/diamond construction using negative space and one field symbol. Most distinct from real-world insignia.

The chosen family should define:

- outer silhouette;
- edge/bevel;
- background metal;
- icon stroke or relief style;
- allowed highlight;
- allowed accent placement;
- locked/in-progress/earned treatments.

## 5. Candidate symbol language

Exploration only until #191 approves roles.

- **Communicator** — radio wave / antenna / signal geometry; avoid generic Wi-Fi logo.
- **Operator** — navigation/observation geometry rather than weapons.
- **Medic** — original medical/assessment motif; avoid protected service marks and do not default automatically to a red cross.
- **Diver** — mask, regulator, pressure/gauge or marine geometry; avoid diving-agency logo language.

The role should be identifiable by form, not by bright colour coding.

## 6. Colour

Home's strict colour discipline still matters.

Badge concepts may use restrained role accents, but:

- polished steel stays the shared material;
- colour should occupy a minority of the badge;
- avoid four saturated “game rarity” colours;
- do not reuse Tarnish as a decorative role colour because `#d68d5e` means repair/decay;
- topic track colours are not automatically role colours.

Locked/in-progress states should be expressible through material/light, not only hue.

## 7. AI generation workflow

1. Approve role names and meanings in #191.
2. Generate the same 3–5 roles in **one family at a time** so the owner evaluates systems, not isolated pretty badges.
3. Generate each badge as an individual square master, with no text or frame outside the badge itself.
4. Review:
   - full resolution;
   - approximately 96 px;
   - approximately 48 px;
   - approximately 32–36 px if compact use is intended.
5. Reject:
   - illegible micro-detail;
   - accidental letters/text;
   - military/logo lookalikes;
   - inconsistent lighting/material;
   - symbols that require colour to identify.
6. Iterate the selected family.
7. Convert/refine to production SVG if the geometry survives cleanly; otherwise keep a high-resolution raster master and produce optimized runtime derivatives.
8. Record source/generation/provenance metadata.
9. Integrate only after the Roles screen direction is approved.

## 8. Asset contract to decide

Preferred target if achievable:

- source master: SVG or high-resolution lossless raster;
- runtime: SVG or optimized WebP/AVIF/PNG depending on rendering QA;
- transparent background;
- square view box/canvas;
- safe padding consistent across the set;
- no baked role title;
- manifest maps `roleId -> asset`.

Do not force SVG if conversion makes AI artwork visibly worse.

## 9. UI states

The same badge may need these treatments:

- **planned/locked** — subdued, mostly recessed;
- **in progress** — normal metal with restrained progress treatment around/below it, not a glowing badge;
- **earned** — full polish/depth and the one celebratory presentation;
- **needs refresh** — if #191 adopts this state, do not recolour the badge with Tarnish wholesale; keep repair information as a separate semantic signal.

Whether these are separate assets or CSS treatments should be decided after the family is selected.

## 10. Production QA

For every final badge:

- recognisable at intended smallest size;
- consistent silhouette scale and padding;
- no unintended text;
- no copied insignia geometry;
- no role depends solely on colour;
- contrast against `#101215`, `#16191d`, and `#1d2126`;
- compatible with 200% text layouts when shown beside labels;
- no unnecessary animation;
- provenance entry present.

## 11. Deliverables

- [ ] Three coherent badge-family concept sheets.
- [ ] Owner-selected family.
- [ ] One approved master per v1 role.
- [ ] Small-scale QA comparison.
- [ ] Production asset format decision.
- [ ] Manifest/provenance record.
- [ ] Integration notes for #191.


## 12. Approved visual direction — 2026-10-07

**Nautical (current)** was selected over CAF-inspired, minimal and other families. The original concept's high-detail circular medallion is the authority: substantial relief, rope edge, brushed metal, deep navy enamel, gold relief, limited teal wave accents. Communicator's central subjects: radio mast/transmission arcs, abstract signal flags, Morse-like marks, waves and compass rose. Do not use official CAF insignia, crowns, trade badges or protected service logos.

Only fully completed roles receive the **earned** full-colour badge. An unearned monochrome *preview* is permitted, but no progress-stage material transformations. A completed pathway receives a text **Complete** state only, no badge.

**Asset status:** the app MVP stages a small hand-authored SVG as a lightweight rendering placeholder. It reflects the same visual vocabulary but is not asserted to match the high-detail approved image. The image-generation source and transparent optimized raster masters were prepared in the owner conversation on 2026-10-07. Import the approved earned/locked WebP/PNG masters before treating #192 as complete; record checksums and render QA at 220, 96, 48 and 32px. Replace the vector fallback in the manifest and UI only after that review. Maintain original file provenance and document that this is original Argus-made visual art, not licensed official insignia.


## 13. Layered SVG reconstruction — 2026-10-07

The user approved continuing with a **real animatable SVG**, rather than importing the generated PNG as the sole production asset. PR #196 now replaces the first provisional flat placeholder with a manually authored, fully vector medallion in `public/media/roles/communicator.svg` (~20 KB). It follows the locked Nautical family; it is not claimed to be a pixel-perfect replica of the original photorealistic reference.

**Actual editable vector groups:** `badge-body`, `rope-border` (106 reusable modeled braid segments), `enamel-field`, `mast-assembly`, `signal-arcs` (individual left/right groups), `signal-flags` (individual flags), `morse-code` (left/right), `sea-waves` (back/mid/front), `rim-clasps`, `compass-rose`. All artwork is original SVG path/circle/rect geometry with gradients and filters: no data URI, embedded bitmap, traced protected art, HTML foreign object, downloaded font or official emblem. Outer medallion geometry is transparent beyond the badge perimeter; the source remains square 512 viewBox.

**Motion contract:** SVG IDs permit later timeline-based pulse/wave/compass effects without retracing. Tiny signal/compass hover treatments are included for motion-capable devices, behind `prefers-reduced-motion: no-preference`. The unearned preview remains monochrome, inert and unanimated; the earned badge alone uses the full enamel-and-gold vector. No perpetual, automatic, score-driven, or pathway-specific badge animation. Animation must never communicate achievement independently of real completion.

**QA:** SVG parsed and rasterized at 512, 220, 96, 48 and 32 px in the working environment. The 32 px badge reads as a medallion and mast, but flags and Morse marks intentionally require larger presentation. Review at 220 px remains the primary target. A vector-to-approved-raster side-by-side is available for owner review outside the repository. CI/browser suite, native mobile (Pixel), high-DPI rasterization of SVG filters, screen-reader interpretation and animation triggers should be verified on the PR before merge. The current preferred approach does **not** require importing the pre-generated WebP masters to achieve an editable vector.

**Status gate:** this fulfills the SVG production **candidate**, not final visual acceptance. Do not close #192 or describe the badge as an exact production reproduction until owner accepts the vector's fidelity and mobile/browser checks pass. `public/media/roles/manifest.json` records asset details and the Git blob SHA.
