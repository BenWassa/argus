# #201 — Persistent Morse Play UX · owner review
**Status:** PROPOSED / NOT APPROVED · design-only after merged PR #209 (S0). **No runtime changes authorized.**
**Source authority:** `DESIGN.md`, `DESIGN.json`, `src/styles/tokens.css`, `docs/open/ISSUE_201_MORSE_GAMEPLAY_CONTINUITY.md`; existing shipped behavior: `MORSE_FLUENCY.md`, #188 and merged #209.
**Mockups:** [A: returning Play](../mockups/201-play-returning.svg) · [B: beginner](../mockups/201-play-beginner.svg) · [C: active sending](../mockups/201-play-active.svg) · [D: miss/result](../mockups/201-play-result.svg) · [E: alphabet handoff](../mockups/201-play-handoff.svg). Each is a standalone **390 × 844** SVG viewport. Illustrative content and measurements only; no fabricated learner history is intended as actual user data.

## Proposed information architecture
Keep the **Morse Topic page** the authoritative entry. Add a persistent, named **Play Morse** section rather than a competing app-level dashboard. Once A–Z is acquired, the top Play area has exactly **one concrete recommended challenge**, directly launched, with **Send**, **Receive (Copy)**, **Challenges (speed/recognition)** and **Free Play** accessible without nesting under More. Keep the finite Learn/Test/repair actions visible and independent. Optional activities are never locked behind the suggested next action.

For a beginner, **Continue alphabet** remains primary; show a quiet **Try a word** only if a valid target can be composed entirely from authoritatively acquired letters. Otherwise say **Play becomes available as you learn letters**, with no disabled false promise. Free Play may be independently exposed only if existing runtime permits it; do not silently unlock the post-A–Z sending stages.

## User journeys / routing
1. **Fresh:** Topic → Lesson 1; no false play eligibility. After any genuinely eligible learned-letter roster, Topic → Try a word → short formative run → result → Topic with Continue alphabet prominent. Content validates against settled/introduced roster and lesson packet authority, not lesson index.
2. **In-progress:** Continue acquisition remains primary; eligible Try a word is secondary. Playing does not update finite Test/evidence, lesson state or retention.
3. **All 26 acquired, not banked:** Topic presents **Test the alphabet** and a distinct secondary **Send five words**. Finishing Learn says **Every letter covered**, not Complete.
4. **Qualifying formal Test:** existing #209 handoff remains **Send five words** → Spotlight (no chooser). Exit of run → persistent Play context; neither TestDone nor dead end. Nonqualifying, repair or review never gain a false complete banner.
5. **Returning qualified:** Topic → explicit **Next: Word Flow / Copy common words / relevant actual challenge** → direct run. Four named mode entries alongside. If no history exists, use **Send five words** and independent skills labeled **Not tried**.
6. **All stages cleared:** suggest replay with unfamiliar text, a higher supported listening setting, consistency/personal best or missed-character focus. No fake additional finite levels; no scheduled pressure.
7. **Result/miss:** show prompt versus submitted answer and actual feedback (e.g. **Missed: Q**, only when measured); one next action and quiet **Repeat** and **All games**. Retained completion/repair state unaffected. Android Back and explicit exits retain a sane Topic/Play destination.

## Visual and interaction contract
- 390 × 844 CSS px portrait source artwork, viewport-safe; also verify at 320 px in implementation. Sample static screens are **design proposals**, not browser renders of the current app.
- Exact colors: bg #101215, surface #16191d, surface-2 #1d2126, surface-3 #272c33, field #0b0d10, ink #e6eaf0, muted #979fac, subtle #868f9d, line #2a2f37, polished action #e9edf3, action ink #0b0d10, miss #d98078, correct #92b5ae. No unapproved hue.
- Existing 8/12/16px radii; 14/18/26px spacing; body 0.98rem, heading 2.15rem, mono readout 0.68rem; primary control ≥44px, preferred 56px. Native system fonts only.
- One polished CTA per state; ghost secondary buttons; quiet text links elsewhere; no fake XP, streak, comprehensive skill percentage, gold badge or status inferred from unplayed modes. The mockups' sample numbers are deliberately marked illustrative.
- Key input uses existing MorseKeyInput press/hold lifecycle and semantic haptics; no new rhythm, duration, touch suppression or physical sending WPM claims.
- Pixel acceptance: check safe areas, viewport height/scroll, no horizontal clipping, 44px targets, large text, focus-visible, reduced motion, Android Back, background interruptions, key stuck-down safety and offline launch.

## Proposed next challenge resolution
Use only actual store snapshots and validated formative progress. Eligibility first (acquired roster and mode-specific supported material). Candidate ranking: unfinished supported stage → last recorded weakness if enough samples → next supported difficulty → replay of a specific best / unfamiliar challenge. Preference is **advisory**, never gate. Missing or imported/partial stats fall back to a deterministic eligible introduction; do not reconstruct scores or claim fluency. Send, Receive and Recognition remain separate formative measurements. Rendering recommendation must have a valid direct route, and completed runs must return to this same context.

## Acceptance criteria for the subsequent implementation PR (NOT this PR)
- [ ] Owner selects/approves exact 390px mockup treatment **before implementation**; any changes to proposed copy/state hierarchy reviewed separately.
- [ ] #209 existing handoff preserved and regression-tested for qualified, acquired-unqualified, repair/review and multi-topic Test results.
- [ ] Topic shows one concrete direct-play primary after A–Z; all four plain-language family entries are visible and accessible without More.
- [ ] Beginner entry uses authoritative eligible learned-character set and validates every prompt; no hard-coded lesson thresholds or exposure to unlearned symbols.
- [ ] No history: **Not tried**; partial imports/corrupt formative progress: safe fallback; no inferred percentages.
- [ ] After last finite stage: an actual infinite repeat challenge exists; no falsely locked or completed Play.
- [ ] At active run and miss, feedback is textual and understandable without colour/haptics; one dominant action; per-mode metrics separated.
- [ ] Mode transitions and Android Back correct on exit, completion and interrupted key-down.
- [ ] Formative Play writes only approved morseFluency scope, preserves formal evidence, completedAt and retention; no auth/sync/role/badge changes.
- [ ] Browser e2e at 320/390, keyboard/screen-reader/reduced-motion and real Pixel acceptance. #188 real Pixel acceptance remains independently outstanding.

## Owner decisions at visual gate
Approve or request changes to **(1)** topic-page embedded Play panel vs dedicated Play route, **(2)** placement of skill readouts relative to four mode links, **(3)** the key-active/miss/result visual density, **(4)** beginner Try a word presentation. **No new UI code is included in this PR.**