# Library topic icon system

**Status:** active design authority  
**Scope:** shipped Library topics only  
**Implementation:** `src/assets/library-icons/` + `src/features/library/LibraryPage.css`

## Purpose

Library icons are compact recognition aids beside shipped topic titles. They are not badges, achievements, category colours, or replacement labels. A learner should understand the subject faster when the icon and title are seen together.

## Production rules

- One unique icon per shipped catalog topic.
- Keep the concept immediately recognizable; prefer one dominant object and at most one supporting cue.
- Production format is SVG whenever the result survives small-size QA cleanly. PNG is the fallback only when vector simplification materially damages the concept.
- Standard canvas: `32 × 32` viewBox.
- Standard stroke: `1.75`, round caps and joins.
- Standard colour: Steel Ash `#979fac`.
- Transparent background; no tile, badge, gradient, shadow, texture, or decorative frame.
- Avoid tiny mechanical detail. The icon is judged at the actual Library-row size, about 26–28 px, not at source scale.
- Text inside icons is normally avoided. Symbol systems may use their own characters when that is the clearest possible identifier; the Greek alphabet icon is the current exception.
- Track colours remain typographic labels only. Topic icons do not inherit Learning/Survival/Tradecraft colours.
- User-authored topics do not receive a fake generic icon. Absence of a shipped mapping leaves the existing row layout unchanged.

## Workflow for new shipped topics

1. Start from current `main` and confirm the topic is actually in `shippedCatalog.json`.
2. Generate a visual concept first, using the existing icon family as style authority.
3. Reduce the concept until it reads in roughly one second at 26–28 px.
4. Rebuild/normalize the approved concept as a clean SVG using the rules above.
5. Add the SVG under `src/assets/library-icons/<topic-id>.svg`.
6. Add the topic-id mapping in `LibraryPage.css`.
7. QA on the real dark gunmetal Library row at phone width. Reject icons that need the source-size image to make sense.

## Current shipped mappings

| Topic id | Visual cue |
| --- | --- |
| `nato-phonetic` | radio microphone + transmission waves |
| `international-morse-letters-printed` | telegraph key + dit/dah cue |
| `ooda-loop` | eye inside a four-direction feedback cycle |
| `primary-survey` | medical assessment clipboard |
| `cardinal-bearings` | eight-point compass rose |
| `scuba-equipment-abbreviations` | scuba mask |
| `radiotelephony-numbers` | handheld radio + keypad |
| `si-prefixes` | increasing magnitude / scale |
| `greek-alphabet` | alpha + omega |
| `hex-digits-binary` | hexagonal digital bit pattern |
| `beaufort-wind-scale` | windsock + wind lines |
| `firearm-safety-acts-prove` | safety shield + simplified firearm handling cue |

## Design boundary

Icons must stay consistent with Argus's brushed-gunmetal instrument language. Do not drift into colourful course thumbnails, tactical-game imagery, clip-art illustration, or detailed mini-scenes. The title remains the authoritative label; the icon exists to make recognition faster.
