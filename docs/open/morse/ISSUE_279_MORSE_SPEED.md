# #279 — Morse four-choice recognition and capped Speed sessions

> **Status (2026-10-22):** Domain implementation and static owner-approval SVGs in draft PR [#285](https://github.com/BenWassa/argus/pull/285). **Live UI, topic persistence, device verification and owner mockup sign-off are NOT complete.** Do not close #279 or claim Speed is shipped.
>
> **Authority:** Proposed UI and maintained domain integration contract, subordinate to current `DESIGN.json`, `src/styles/tokens.css`, `src/shared/ui/SessionFrame.tsx` and issue #279. The Signal on Slate overhaul PR #271 is merged into `main`; do not use an old `feat/ui-overhaul` runtime base.

**Issue:** https://github.com/BenWassa/argus/issues/279  
**Draft implementation:** https://github.com/BenWassa/argus/pull/285  
**Related:** #221 (adaptive accuracy/coverage), #228/#225 (four Morse modes and tokens), #231 (session layout), #280 (haptics), #113 (LibraryProvider/IndexedDB), #276 (permanent learning and optional Tests).

## Delivered, pending integration

- `src/domain/morse/recognition/letterChoices.ts`: deterministic under injected RNG; only taught/eligible A–Z letters; confusable Morse-pattern alternatives; target exactly once in a randomized position. One known letter is a non-scored teaching state. Fewer than four choices cannot create accuracy or speed evidence.
- `speed.ts`: pure monotonic attempt lifecycle and half-open response bands `[0,1), [1,2), [2,3), [3,5), [5,7), [7,10), [10,∞)` seconds. For valid finite nonnegative milliseconds, `min(floor(ms),10000)` bounds the contribution without ending the question. All other times are null.
- `progress.ts`: versioned, strictly parsed formative recognition history. Streams are `read/practice`, `read/speed`, and `listen/(practice|speed)@{characterWpm}` (supported 5–60 whole WPM). This separates Read from Listen, ordinary play from Speed and different Listen playback rates. Successful speed samples per character retain the last eight saturated millisecond durations. Only three or more can affect priority.
- `practice.ts`: a backward-compatible optional weight callback to the existing deterministic 3 accuracy-weighted draws / 1 oldest-coverage draw scheduler. Free response retains its previous default behaviour.
- Derived speed factor: `1 + 0.5 × clamp((medianCorrectMs/1000 − 2)/8, 0, 1)`, then overall weight `clamp(basePracticeWeight × factor, 0.35, 10)`. Missing data mean **unknown speed**, never presumed slow. Four recent misses outrank five successes even if the successful letter is slow.
- Comparable-stream optional round indicator: `round(100 × Σ(correct ? exp(-ln 2 × cappedMs/3000) : 0) / Nvalid)`. Accuracy and median latency remain primary; no WPM, rankings or proficiency labels. One invalid/assisted attempt is **not** a slow miss; an independently graded wrong answer is still wrong.

This new domain record is **not yet a Topic field**. The domain parser does not grant learning progress, retention, lessons, scored Test or legacy fluency evidence. No import/export migration, sync, account isolation or storage write is claimed; those must be coordinated with #113 before activation. Keep unknown-version stored values untouched if encountered.

## Mockups — owner approval required before runtime UI work

These are **static 390 × 844 CSS-pixel SVG proposals**, not browser/device captures. Colours were converted from the actual Signal on Slate OKLCH tokens; layout follows the current `SessionFrame` header, mode hue, central stimulus and docked answer zone. They illustrate states rather than certify font rendering, large-text scaling, TalkBack or on-device touch behavior.

| State | Preview |
| --- | --- |
| Read ordinary practice, four tiles and no keyboard | [390 Read practice](assets/issue-279/phone-390-read-practice.svg) |
| Read with optional 10-letter Speed variant | [390 Read Speed](assets/issue-279/phone-390-read-speed.svg) |
| Listen playback; options unavailable until full completion | [390 Listen playing](assets/issue-279/phone-390-listen-playing.svg) |
| Listen after complete playback; post-audio response readiness | [390 Listen ready](assets/issue-279/phone-390-listen-ready.svg) |
| Correct answer; all options locked | [390 correct](assets/issue-279/phone-390-correct.svg) |
| Incorrect answer; shared correction plus explicit Continue | [390 miss](assets/issue-279/phone-390-wrong-continue.svg) |
| End of ten responses; accuracy and median before any score | [390 summary](assets/issue-279/phone-390-round-summary.svg) |
| Interrupted/hide/replay; no valid speed sample | [390 interrupted](assets/issue-279/phone-390-interrupted.svg) |
| Still-visible pause beyond ten seconds; tiles stay live | [390 10s+](assets/issue-279/phone-390-over-10s.svg) |
| Audio fails or sound unavailable | [390 audio fallback](assets/issue-279/phone-390-audio-off.svg) |
| Narrower large-text concept (**not** a 200%-zoom browser proof) | [320 larger-text](assets/issue-279/phone-320-large-type.svg) |

**Owner decision needed:** approve or change tile geometry (2×2 76px-high at 390px), Speed's placement within Read/Listen, feedback states, and round-summary hierarchy. Do not add a fifth top-level mode, separate Fluency hub, letter keyboard default, countdown, punitive penalties, or a formal-Test multiple-choice input.

### Approved UI implementation acceptance checklist (future slice)

1. `LetterPracticeRun` Read and Listen only: replace implicit-focus one-character `<input>` with four 76px-high buttons, visible focus, accessible per-choice letters and keyboard/switch activation. Exactly one selected answer; immediate logical lock; prevent duplicated submissions and tap-through on Continue. Do not change `MorseKeyInput`, Copy, Free play or formal Test.
2. Resolve choices from *already-taught* roster with seedable pure `letterChoices`. Avoid target disclosure before grading through stimulus `aria-label`, audio label, DOM hidden answer, CSS order or offscreen helper. For one choice present a non-scored teaching action; for two/three choices answer normally without speed evidence.
3. Standard Read/Listen stays untimed. Speed runs exactly ten independent full-MC4 questions. Read arms after actual completed rendering and enabled answer tiles; Listen arms only after audio playback completes. Record the **first accepted** choice using `performance.now()`. Reject any assisted/helped, playback-restarted, backgrounded, visibility lost, pagehidden, invalid clock or fewer-than-four item. The 10s band is a scoring cap, not an auto-timeout.
4. Render existing `SessionCorrect` and `MorseCharacterSupport` with the stimulus retained above misses and Continue as the only dismissal path. Reduced motion, audio-off failure, Android Back, TalkBack, touch and hardware keyboard preserve safe behavior.
5. For semantic verdict haptics, #279 will expose exactly one `correct`/incorrect judgment to #280's shared **existing** haptic adapter at the grading boundary. #280 integrates or coordinates that call; no new `navigator.vibrate`, no double verdict and no onset haptic change inside `MorseKeyInput`.
6. Persist the optional record only after #113 coordination on Topic schema/versioned parsing/import/export, transaction authority, account isolation and conflict semantics. Do not silently add an unvalidated field to a Topic v5 record or write to `morsePractice`. No Test score or completed lesson should be created by this session.
7. Run `npm run check`, rules tests where persistence changes, real 390/320 Chromium captures including **actual 200% text**, physical Pixel touch/Gboard/audio/haptics checks, TalkBack focus and screen-reader names. Static SVGs alone are not sign-off.

## Assumptions, measurements and limitations

- These seven speed bands, the 3s utility half-life, eight samples and ≥3 observations are bounded product heuristics, **not** empirically calibrated proficiency thresholds. Timing is post-stimulus-choice latency, **not** transmitted Morse speed, personal competence, or WPM.
- The original accuracy-practice adaptive model in `src/domain/morse/practice.ts` remains authoritative for its own free-response stream; this MC4 store is observationally independent even when it reuses the same scheduling shape.
- Source background: [response-time adaptive sequencing](https://pmc.ncbi.nlm.nih.gov/articles/PMC6124487/), [RT distribution shape](https://pmc.ncbi.nlm.nih.gov/articles/PMC3062635/), [MDN monotonic performance.now](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now), [Page Visibility](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API), [WCAG 2.2 target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum). These support design principles, not specific bins or claims about expertise.

## Deferred

Production UI wiring, approved responsive captures and haptics integration await owner sign-off. Persistence must be integrated with #113, including strict read/write validation and migrations. Historical elapsed-speed data cannot be inferred from `morsePractice`, `morseFluency`, Test or lesson histories.
