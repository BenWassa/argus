# #279 — Morse four-choice recognition and capped Speed sessions

> **Status (2026-10-23):** Domain merged via [#285](https://github.com/BenWassa/argus/pull/285). Slices 1 and 2 (four answer tiles in Read and Listen, optional 10-letter Speed variant, formative `morseRecognition` persistence) are implemented in the recognition UI PR (branch `feat/279-recognition-ui`). **Slice 3 (adaptive speed weighting beyond the merged priority function), physical Pixel/Gboard/TalkBack verification and #113/IndexedDB integration are NOT complete.** Do not close #279.
>
> **Authority:** Maintained implementation contract for #279, subordinate to current `DESIGN.json`, `src/styles/tokens.css`, `src/shared/ui/SessionFrame.tsx` and the issue. The owner delegated the mockup-approval gate to the implementing agent on 2026-10-23; the decisions below are recorded under "Implemented UI decisions". That delegation is not a Pixel device sign-off.

**Issue:** https://github.com/BenWassa/argus/issues/279  
**Domain implementation (merged):** https://github.com/BenWassa/argus/pull/285  
**Related:** #221 (adaptive accuracy/coverage), #228/#225 (four Morse modes and tokens), #231 (session layout), #280 (haptics), #113 (LibraryProvider/IndexedDB), #276 (permanent learning and optional Tests).

## Delivered domain (merged in #285)

- `src/domain/morse/recognition/letterChoices.ts`: deterministic under injected RNG; only taught/eligible A–Z letters; confusable Morse-pattern alternatives; target exactly once in a randomized position. One known letter is a non-scored teaching state. Fewer than four choices cannot create accuracy or speed evidence.
- `speed.ts`: pure monotonic attempt lifecycle and half-open response bands `[0,1), [1,2), [2,3), [3,5), [5,7), [7,10), [10,∞)` seconds. For valid finite nonnegative milliseconds, `min(floor(ms),10000)` bounds the contribution without ending the question. All other times are null.
- `progress.ts`: versioned, strictly parsed formative recognition history. Streams are `read/practice`, `read/speed`, and `listen/(practice|speed)@{characterWpm}` (supported 5–60 whole WPM). This separates Read from Listen, ordinary play from Speed and different Listen playback rates. Successful speed samples per character retain the last eight saturated millisecond durations. Only three or more can affect priority.
- `practice.ts`: a backward-compatible optional weight callback to the existing deterministic 3 accuracy-weighted draws / 1 oldest-coverage draw scheduler. Free response retains its previous default behaviour.
- Derived speed factor: `1 + 0.5 × clamp((medianCorrectMs/1000 − 2)/8, 0, 1)`, then overall weight `clamp(basePracticeWeight × factor, 0.35, 10)`. Missing data mean **unknown speed**, never presumed slow. Four recent misses outrank five successes even if the successful letter is slow.
- Comparable-stream optional round indicator: `round(100 × Σ(correct ? exp(-ln 2 × cappedMs/3000) : 0) / Nvalid)`. Accuracy and median latency remain primary; no WPM, rankings or proficiency labels. One invalid/assisted attempt is **not** a slow miss; an independently graded wrong answer is still wrong.

The domain parser grants no learning progress, retention, lessons, scored Test or legacy fluency evidence. Persistence is described under "Persistence decision" below. Unknown-version stored values are rejected on import rather than rewritten.

## Mockups (static proposals; implemented with the decisions below)

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

**Decision (delegated, 2026-10-23):** the geometry, Speed placement, feedback states and summary hierarchy below were accepted with the adjustments listed under "Implemented UI decisions". Do not add a fifth top-level mode, separate Fluency hub, letter keyboard default, countdown, punitive penalties, or a formal-Test multiple-choice input.

### Acceptance checklist (reference; status in the implemented-decisions and deferred sections)

1. `LetterPracticeRun` Read and Listen only: replace implicit-focus one-character `<input>` with four 76px-high buttons, visible focus, accessible per-choice letters and keyboard/switch activation. Exactly one selected answer; immediate logical lock; prevent duplicated submissions and tap-through on Continue. Do not change `MorseKeyInput`, Copy, Free play or formal Test.
2. Resolve choices from *already-taught* roster with seedable pure `letterChoices`. Avoid target disclosure before grading through stimulus `aria-label`, audio label, DOM hidden answer, CSS order or offscreen helper. For one choice present a non-scored teaching action; for two/three choices answer normally without speed evidence.
3. Standard Read/Listen stays untimed. Speed runs exactly ten independent full-MC4 questions. Read arms after actual completed rendering and enabled answer tiles; Listen arms only after audio playback completes. Record the **first accepted** choice using `performance.now()`. Reject any assisted/helped, playback-restarted, backgrounded, visibility lost, pagehidden, invalid clock or fewer-than-four item. The 10s band is a scoring cap, not an auto-timeout.
4. Render existing `SessionCorrect` and `MorseCharacterSupport` with the stimulus retained above misses and Continue as the only dismissal path. Reduced motion, audio-off failure, Android Back, TalkBack, touch and hardware keyboard preserve safe behavior.
5. For semantic verdict haptics, #279 will expose exactly one `correct`/incorrect judgment to #280's shared **existing** haptic adapter at the grading boundary. #280 integrates or coordinates that call; no new `navigator.vibrate`, no double verdict and no onset haptic change inside `MorseKeyInput`.
6. Persist the optional record only after #113 coordination on Topic schema/versioned parsing/import/export, transaction authority, account isolation and conflict semantics. Do not silently add an unvalidated field to a Topic v5 record or write to `morsePractice`. No Test score or completed lesson should be created by this session.
7. Run `npm run check`, rules tests where persistence changes, real 390/320 Chromium captures including **actual 200% text**, physical Pixel touch/Gboard/audio/haptics checks, TalkBack focus and screen-reader names. Static SVGs alone are not sign-off.

## Implemented UI decisions (2026-10-23)

Code: `src/features/morse/practice/LetterChoiceTiles.tsx`, `LetterPracticeRun.tsx`, `LetterPractice.css`; pure `recognitionStreamFor` in `src/domain/morse/recognition/progress.ts`.

- **Tiles.** `LetterPracticeRun` Read and Listen render a `role="group"` named "Choose the letter" of plain buttons, 76px high (`min-height`) in a 2×2 grid at every portrait and desktop width (about 140px wide at 320px). In short landscape (height at most 560px) the same four tiles run as one row at 56px (48px below 480px width) so the run needs no scroll; this is the only departure from 2×2. Each tile's accessible name is `Letter X` and no attribute differs between tiles, so nothing varies with the answer. Tiles use the shared `ghost` button; disabled tiles use the global disabled style. Positions come from the seeded `letterChoices` draw and never move within a question.
- **No keyboard.** There is no `input`. Focus goes to the tile group container (a ring-less `tabindex=-1` target), never a text field, when a question appears. A physical keyboard answers by pressing the letter of a visible tile (Ctrl/Meta/Alt chords and letters not on a tile are ignored). Tab/Enter/Space work on the buttons. Screen-reader users hear the group name and `Letter X` names.
- **Lock.** The first accepted tile grades synchronously (a ref lock), `audio.stop()` runs, and the tile group is replaced by the existing verdict: `SessionCorrect` for a hit (auto-advance after the shared dwell) or the shared miss correction with the stimulus kept above it. After a miss, Continue is disabled for 350 ms so a second tap on the same spot cannot reach it, then takes focus; it is the only dismissal. Key keeps its immediate Continue.
- **Listen.** Tiles are visible but disabled until a complete, uninterrupted playback has ended (unchanged gating). Stopping, hiding the page or `pagehide` require another play. A cue line says "Play the sound, then choose".
- **Fewer than four taught letters.** Two or three letters give two or three tiles; the answer is graded and corrected as usual but writes no recognition history (domain rule) and has no Speed. One taught letter shows the shared character support and a "Got it" button that leaves the run: no tiles, no scoring, no haptic. Only taught letters ever appear.
- **Speed.** A "Speed" toggle (`aria-pressed`) sits in the `SessionFrame` toolbar of Read and Listen when at least four letters are taught; it is absent from Key. While on, a mono note reads "10 letters · no countdown". It can only be changed before the first answer. Speed is the same ten-letter run on a separate stream (`read/speed`, `listen/speed@12`); Again keeps it on. There is no per-question timer or countdown on screen.
- **Timing.** The monotonic clock (`performance.now()`) is armed after the question and live tiles have rendered (Read) or after playback ends (Listen), and stopped on the first accepted tile. It is invalidated by Help, a replay or second play, page hide/`pagehide`, or an audio error; those answers are still graded and recorded as outcomes, without a duration. A wrong answer never records a duration. Durations are capped at 10 s by the domain; nothing times out.
- **Summary.** The round result keeps "N / 10 correct" and, for Speed only, "Typical correct choice 2.4s" (or "10s+") with "N timed answers". The optional round score, rankings, WPM and proficiency labels are not shown.
- **Audio failure.** The existing status message appears and tiles stay disabled; the mockup's "Switch to Read" action is deferred because mode switching belongs to the Topic page (use Close). No answer is graded without a complete stimulus.
- **Haptics.** The existing `fire('settle' | 'miss')` runs once in `choose`, only for an unhelped answer, never from render, the clock or the dwell (#291 boundary preserved; no new `navigator.vibrate`).

## Persistence decision

`Topic.morseRecognition?: MorseRecognition` is an optional additive field inside Topic v5, written by `LetterPracticeSurface` through the same `updateTopic` path as `morsePractice`. It is parsed by the strict domain parser `parseMorseRecognition` from `libraryParser` (version-5 libraries only; corrupt, hostile, wrong-stream, over-cap or future-schema values reject the import; an empty record normalises to absent). Existing libraries import unchanged, export round-trips, and the sync planner serialises it with the whole Topic record (concurrent edits report the existing topic conflict). It carries event order and capped milliseconds, never dates.

This stays inside the current storage contract: it does not touch IndexedDB, `LibraryProvider` internals, account isolation or the #113/#214 work, which will carry the field as part of the Topic like `morsePractice`. Known limits: an older app build would drop the unknown field on import (as it would any additive field), and editing a topic through the simple authoring form rebuilds the record without it (the same pre-existing behaviour as `morsePractice` and `morseFluency`; Morse is a catalog topic).

Read and Listen no longer write `morsePractice`, so one derived read exists: `lettersStable` (the suggestion that Read/Listen letters are ready to move on) also accepts three latest independent four-way hits per letter in any one stream of the same direction. It never pools streams, never reads Speed durations and grants no lesson, Test, retention or completion evidence. Key is unchanged.

## Assumptions, measurements and limitations

- These seven speed bands, the 3s utility half-life, eight samples and ≥3 observations are bounded product heuristics, **not** empirically calibrated proficiency thresholds. Timing is post-stimulus-choice latency, **not** transmitted Morse speed, personal competence, or WPM.
- The original accuracy-practice adaptive model in `src/domain/morse/practice.ts` remains authoritative for its own free-response stream; this MC4 store is observationally independent even when it reuses the same scheduling shape.
- Source background: [response-time adaptive sequencing](https://pmc.ncbi.nlm.nih.gov/articles/PMC6124487/), [RT distribution shape](https://pmc.ncbi.nlm.nih.gov/articles/PMC3062635/), [MDN monotonic performance.now](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now), [Page Visibility](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API), [WCAG 2.2 target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum). These support design principles, not specific bins or claims about expertise.

## Deferred

Not done: real Pixel Chrome/PWA checks of Gboard suppression, touch, audio and vibration, and TalkBack (see #281); 200% text is covered only by an automated no-overflow check, not by a visual review; the optional round score and a "Switch to Read" audio-failure action; Slice 3 simulation review of E-slow versus Y-fast-wrong against the live store; and #113/IndexedDB integration. Historical elapsed-speed data cannot be inferred from `morsePractice`, `morseFluency`, Test or lesson histories.
