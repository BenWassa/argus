# Issue #129 — Beaufort visual-guide carousel

**Status:** guide implementation shipped in v1.3.3 through #175 on 2026-10-03. This document remains the maintained artwork/scope contract; external provenance details and later photographic-recognition gates retain their stated status.
**Authority:** maintained artwork and visual-guide contract. Topic-page ordering is superseded by [the revamp plan](TOPIC_PAGE_REVAMP.md): recall first, guide in a closed fold.

Related: #128, #129

## Purpose

Add a four-panel visual recognition guide to the Beaufort Scale Learn page. The guide should help the learner see how the same coastline changes as wind conditions intensify. It complements the force-by-force reference; it does not replace it and does not change Test scope.

Placement remains the #128 sequence:

1. Introduction / how to read the scale
2. **Read the wind at a glance** visual guide
3. The scale — Forces 0–12
4. What to remember
5. Limitations
6. Sources

## Approved visual direction

Use one continuous coastal scene across four independent images. The lighthouse, buildings, road, coastline, horizon and major landmarks remain consistent while the weather progressively strengthens.

The visual standard is believable documentary coastal photography. Avoid artificial HDR texture, synthetic-looking rocks or vegetation, repetitive foam, exaggerated waves, and cinematic disaster-storm treatment.

The artwork contains no Beaufort labels or explanatory text. Essential information must be HTML rendered by Argus.

## Asset contract

Implementation-ready web assets are staged at:

- `public/media/beaufort/beaufort-0-3.avif`
- `public/media/beaufort/beaufort-4-6.avif`
- `public/media/beaufort/beaufort-7-9.avif`
- `public/media/beaufort/beaufort-10-12.avif`

All four assets are 700 × 300 AVIF images with the same 7:3 aspect ratio. They are optimized for the mobile-first carousel and remain suitable up to roughly 700 CSS px display width. Do not upscale them beyond their intrinsic width in implementation.

| Range | SHA-256 |
| --- | --- |
| 0–3 | `a126f372456856aae29e5ea8249b954fcf42545f272df83be9093667e2cc7d3a` |
| 4–6 | `61d56c190d95851aee6dfe61a22c40e56e929334cbf9309354aebc52070cd287` |
| 7–9 | `a6c72fc33c8a96f96435a6e7fa72ebca55bd2ba616d2768ebb2781500a6828dc` |
| 10–12 | `6cb9518a7256d3701c00ef2b81325a09a18278b5409aa504689f5055e28b2a9c` |

Do not regenerate these merely because older #129 wording described artwork as out of scope. That was the pre-approval state. Replace an asset only after an explicit visual review decision.

## Section copy

### Heading

**Read the wind at a glance**

The Beaufort scale describes wind through its visible effects. Move from calm conditions to hurricane-force winds and watch how the sea, vegetation and coastline change.

### 0–3 — Calm → gentle breeze

Mostly smooth water develops ripples, then small wavelets. Leaves and grasses begin to move, but conditions remain settled.

**Look for:** ripples · small wavelets · light vegetation movement

### 4–6 — Moderate → strong breeze

Whitecaps become common, waves grow noticeably larger and exposed vegetation moves continuously. Conditions are clearly windy.

**Look for:** frequent whitecaps · larger waves · sustained movement

### 7–9 — Near gale → strong gale

The sea becomes rough. Foam is blown along the surface, spray increases and trees or larger branches are visibly affected.

**Look for:** breaking waves · streaking foam · spray · difficult walking

### 10–12 — Storm → hurricane force

Very high seas, dense spray and severe wind effects dominate the scene. Visibility can deteriorate sharply and structural damage becomes possible.

**Look for:** very high waves · airborne spray · poor visibility · damage risk

Exact knot ranges remain in the detailed force reference rather than being repeated prominently in this recognition layer. Do not bake speeds into the artwork.

## Responsive presentation

Treat the guide as an interactive field-guide element, not four ordinary content cards and not another Beaufort table.

### Mobile first

- One panel at a time, nearly the full content width.
- Horizontal swipe with firm scroll snapping.
- Preserve the common image aspect ratio at every breakpoint.
- Let approximately 16–24 px of the next panel peek into view where practical so swipeability is obvious.
- Do not auto-advance.
- Keep transitions short and direct.
- Place the descriptive paragraph and `Look for` cues outside the photograph.
- Use labelled range buttons plus the active range and position; labels make dots unnecessary.

### Larger screens

- Keep the photograph dominant while respecting its 700 px intrinsic width; center the carousel rather than upscaling the asset.
- Provide previous/next controls and keyboard arrow navigation.
- Avoid surrounding the whole section with a heavy bordered card.
- A restrained range/title treatment may sit near the image, but essential content remains accessible HTML rather than baked into the image.

## Progression rail

Use the visual continuity explicitly with a compact progression indicator beneath the panel:

`CALMER  ●────────●────────●────────●  STRONGER`

with nodes labelled `0–3`, `4–6`, `7–9`, `10–12`. The shared implementation uses labelled range buttons rather than a decorative connecting rail.

The active node/range receives emphasis. Colour should be restrained and applied to the control/marker only. Do not tint the photographs.

## Suggested alt text

- **0–3:** Rocky lighthouse coast in calm to light-breeze conditions, with smooth water and only small ripples.
- **4–6:** The same lighthouse coast under moderate to strong breeze, with frequent whitecaps and wind-bent grasses.
- **7–9:** The same lighthouse coast in near-gale to strong-gale conditions, with rough breaking seas, blown spray and bent vegetation.
- **10–12:** The same lighthouse coast in storm to hurricane-force conditions, with very rough seas, dense spray, rain and reduced visibility.

## Implementation boundary

The guide is wired through the shared Learn `entries` block with `presentation: "visual-guide"`. Manual scroll snapping, range controls, Previous/Next and keyboard arrows share the same component as the cloud guide. No autoplay or required motion. The existing narrow Beaufort Learn refresh delivers it to unchanged catalog topics without changing evidence.

The images are visual intuition, not a claim that one still photograph can precisely diagnose a Beaufort force. Exact force names and knot ranges remain authoritative in the detailed reference and scored mapping.

## Packaged artwork provenance

These are the owner-approved illustrations staged by commit `8c424d9` (#130), reused without regeneration. The original asset handoff records approval and hashes but does not record creator, generation model or rights metadata. The UI credits the supplied Argus artwork without asserting a photographic or AI origin; that missing metadata remains an asset-ledger follow-up.
