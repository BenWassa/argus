# Issue #129 — Beaufort visual-guide carousel

Status: **Visual direction approved; assets staged; implementation pending**

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

Production-ready web assets are staged at:

- `public/media/beaufort/beaufort-0-3.webp`
- `public/media/beaufort/beaufort-4-6.webp`
- `public/media/beaufort/beaufort-7-9.webp`
- `public/media/beaufort/beaufort-10-12.webp`

All four assets are 1400 × 600 WebP images with the same aspect ratio.

| Range | SHA-256 |
| --- | --- |
| 0–3 | `83ff778bbcf2db07c5ac90abba18475f327a64c9d50f217aa774c66dbdf7a53a` |
| 4–6 | `660864817e1fdbe32ac1ca06aefd0947e923d3a712be96f7dd5e40b0f8640592` |
| 7–9 | `9ee3ed7ce8cab95f232463a6b685010cf31250db62cbc94682f72107d9ca16fa` |
| 10–12 | `6aee05ef179997e85289e2a1b446cc711e7bb76ae6edf43e8c1aad1e5214c0d6` |

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
- Use pagination dots plus the active range; do not depend on dots alone for meaning.

### Larger screens

- Keep the photograph dominant, approximately 16:9-or-wider in feel using the supplied 7:3 artwork.
- Provide previous/next controls and keyboard arrow navigation.
- Avoid surrounding the whole section with a heavy bordered card.
- A restrained range/title treatment may sit near the image, but essential content remains accessible HTML rather than baked into the image.

## Progression rail

Use the visual continuity explicitly with a compact progression indicator beneath the panel:

`CALMER  ●────────●────────●────────●  STRONGER`

with nodes labelled `0–3`, `4–6`, `7–9`, `10–12`.

The active node/range receives emphasis. Colour should be restrained and applied to the control/marker only. Do not tint the photographs.

## Suggested alt text

- **0–3:** Rocky lighthouse coast in calm to light-breeze conditions, with smooth water and only small ripples.
- **4–6:** The same lighthouse coast under moderate to strong breeze, with frequent whitecaps and wind-bent grasses.
- **7–9:** The same lighthouse coast in near-gale to strong-gale conditions, with rough breaking seas, blown spray and bent vegetation.
- **10–12:** The same lighthouse coast in storm to hurricane-force conditions, with very rough seas, dense spray, rain and reduced visibility.

## Implementation boundary

This asset commit does **not** implement the carousel. The implementation agent should integrate this contract with the #128 Beaufort layout work and the existing Learn content model.

The images are visual intuition, not a claim that one still photograph can precisely diagnose a Beaufort force. Exact force names and knot ranges remain authoritative in the detailed reference and scored mapping.
