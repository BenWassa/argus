# Issue #323 — Guided Navigation & Bearings

Status: **owner review; content/fixture proposal only**, 2026-11-03. This document is not UI or release approval.

Authority: docs/closed/ISSUE_140_COMPASS_BEARINGS_TOPO.md; src/domain/navigation/bearings.ts, bearingBanks.ts, bearingTopics.ts; src/domain/visual/figures.ts. Dependencies: #296 (shared runner), #320 (inventory), #113 (account-safe offline progress), #233 (mobile acceptance).

## Verified baseline and boundary

Five topic IDs exist, with scored banks **8 / 12 / 12 / 16 / 12**. Compass Bearings (cardinal-bearings) currently tests eight direction→degree associations, writing north as **0°**. The other four use the existing T/M/G notation and math from normalize, reciprocal, convert and gridDeclination. Angle-dial and north-reference figures already have tested renderers.

The four advanced topics already have authored stages in src/domain/learning/authored/. Their questions repeat the fixed Test-bank cases, providing correct content but little transfer to unfamiliar bearings. This work adds novel deterministic **formative-only** cases. It does **not** modify Test denominators, keyed items, role evidence, historical scores, routes or shared curriculum files. Existing advanced stage IDs must remain stable to preserve acquired ticks. Compass generated lessons need a migration/legacy-completion plan before installing any new authored path.

## Five staged curricula

| Topic | Stages (use shipped IDs for advanced topics) | Learner action and key feedback |
| --- | --- | --- |
| **Compass Bearings** | Proposed anchors → diagonals → find-a-ray → mixed-eight | N/E/S/W at 0/90/180/270; add the four 45° diagonals; four lettered compass rays; choose direction from degree as formative practice only. Diagnose counting anticlockwise or confusing adjacent 45° steps. Keep 0° for the original Test. |
| **Whole-Circle Bearings** | reading-the-dial → close-to-north → finding-the-ray → checking-the-quadrant | Read unfamiliar single rays, then pick unfamiliar lettered rays by target degree. Distinguish anticlockwise 286° from actual 074°, the reciprocal 254°, and measuring from east. Include 001°/359°, all quadrants, and 000° normalization. |
| **Reciprocal Bearings** | adding-a-half-turn → wrapping-the-turn → checking-the-return → reversing-the-ray | Locate opposite rays, add/subtract 180°, cross 000° and check double reciprocal. Incorrect 119°M for back of 241°M reflects across north rather than reversing a line; a reciprocal preserves T/M/G. |
| **True & Magnetic North** | naming-the-norths → signing-declination → true-to-magnetic → magnetic-to-true → wrapping-through-north | Match pole/field/grid to T/M/G; identify east-positive vs west-negative D; select direction before arithmetic; normalize. Example 026°T with +11° D gives 015°M, not 037°M. |
| **Grid North & Map Bearings** | reading-north-diagrams → using-the-map-margin → using-signed-offsets → converting-a-back-bearing | Identify TN solid, MN dashed, GN dotted, and D vs C vs grid declination. Convert G↔M from a supplied margin relation or explicit D,C; then convert and take reciprocal as two distinct selections. Example D=+13°, C=−4°: 018°G → 001°M → back 181°M. |

Pedagogy in each stage: concise concept → worked diagram/case → learner predicts the answer → feedback naming the **specific error** and correct normalization → alternate case without hints → mixed checkpoint → mark complete once. Replay allowed. Final Test optional, independently scored. Between topics there is suggested prerequisite order, not an irreversible lock.

## Deterministic formative case contract

Topic-local pure interface: (topicId, stageId, seed, ordinal) returns stable formative ID, prompt, four choices, correct answer, distinct feedback per wrong choice, worked explanation, optional FigureSpec, non-revealing alt, and intermediate answer for two-step tasks. No Date/random/geolocation/sensor dependence. Use **seed 23, ordinal 2** as browser fixture. Numeric answers and distractors call the existing tested bearing functions; no alternate hand-entered arithmetic or measuring SVG pixels. Inputs are entirely hypothetical.

Do not train only against A1's twelve shipped ray examples, A2's twelve back bearings, A3's conversion triplets or A4's diagrams/offset cases. Vary seed, ray/angle, quadrant, T/M/G suffix, signed offset and display letter. Four ray options must maintain **at least 25° separation**. The correct ray must not always be the first letter. For a text-only alternative of a visual test, describe the task without revealing the exact angle; mark visual-recognition scope accurately rather than claiming equivalent nonvisual scoring.

For all numeric conversion prompts: αT=0, αM=D, αG=C, east-positive (signed C is an Argus editorial convention); B=normalize(A+αA−αB). Grid declination g=D−C; do not confuse g with magnetic declination D. For reciprocal conversion, compare convert(reciprocal(A)) with reciprocal(convert(A)). Format numerical results with three digits and a T/M/G suffix except the historical eight-point Compass Test. These relationships are grounded in the existing #140/#149 domain implementation.

**Specific correction examples**:

| Input | Correct | Incorrect selection and diagnostic |
| --- | --- | --- |
| Direction for 315° | Northwest | Southwest: 225° is 90° short |
| New dial ray 074°T | 074°T | 286°T: counted anticlockwise; 254°T: read the opposite ray |
| Reciprocal of 241°M | 061°M | 119°M: mirrored about north, not rotated 180° |
| 026°T, D=+11° | 015°M | 037°M: added east D instead of subtracting |
| Grid margin MN 12°W of GN; 016°G | 028°M | 004°M: wrongly applied an east offset |
| D=+13°, C=−4°, back M of 018°G | 181°M | 001°M: stopped after converting, omitting reciprocal |

The map north-reference schematic is deliberately **not to scale**; use the supplied numbers, not its apparent drawn angle. NRCan distinguishes grid declination (G→M) from true magnetic declination (T→M), and warns that map-margin diagrams exaggerate angles. Sources: [NRCan Declination](https://www.geomag.nrcan.gc.ca/mag_fld/magdec-en.php) and [NRCan Orienting a Map](https://natural-resources.canada.ca/maps-tools-publications/maps/topographic-maps/orienting-topographic-map).

## 390px mobile owner review

Static, 390px-wide Signal-on-Slate design proposals, **not production screenshots**:

- [Read a new ray](mockups/323-bearing-read.svg): number-choice tiles and new angle.
- [Correct the mistake](mockups/323-bearing-feedback.svg): selected wrong/actual ray, numerical explanation, retry.
- [Convert, then reverse](mockups/323-bearing-two-step.svg): signed D/C and answerable intermediate value.

Production integration must use FigureView, not redraw figures from these mockups. Four large 56px choices on a phone; min 44×44px targets. No mandatory drag, keyboard, or pixel-precise tapping. Verify 320px, 390px, landscape, 200%-text, zoom, screen reader, keyboard, reduced motion, offline, account switch, Back/reload and Pixel device.

## Ownership and gates

1. #323 owns this subject-local content, fixtures and design pack. #296 alone owns shared stage manifests, runner, progress contract and routing. Do not modify those files here.
2. Owner accepts mobile mockups **before any UI integration**. Domain reviewer verifies sign/reference concepts, figure line types and printed offsets.
3. New formative answers write **no** formal Test item evidence or histories. An already completed stage stays completed; imported libraries, awarded roles, Morse-only progress and recorded Test scores remain unchanged.
4. Retain the original source claims and disclose that the curriculum does **not** establish real-world field navigation, route safety, compass calibration or current local declination competence.
5. Run domain unit tests, formal Test-bank regressions, browser/accessibility/Pixel acceptance and full CI before considering merge. This focused PR is review-only; no merge authorization.

## Acceptance checklist

- [ ] Five detailed teaching paths, non-bank deterministic exercise families and per-option feedback.
- [ ] Pure local fixtures/test arithmetic, reproducibility, visual consistency and independence from scored cases.
- [ ] Owner-approved 390px mockups; production UI integration remains gated.
- [ ] No shared curriculum, router, Test, storage or role files changed.
- [ ] Mobile/domain/CI gates passed before release.
