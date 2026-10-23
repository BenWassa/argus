# Morse haptics — integration and Pixel acceptance plan

**Status:** scoped 2026-10-20; integrated with runtime coverage for review on 2026-10-22. Physical Pixel acceptance remains open.
**Issues:** [#280 — shared mode coverage](https://github.com/BenWassa/argus/issues/280), [#281 — Pixel calibration](https://github.com/BenWassa/argus/issues/281).
**Related:** #119 (closed research), #53/#77 (closed key), #188 (sending), #221 (adaptive), #225/#228/#231/#233 (UI overhaul).
**Base:** `main`; the overhaul and its queued UI follow-ups through #290 are merged. See [implementation coverage](ISSUE_280_HAPTIC_COVERAGE.md).
**Authority:** issue #280 defines semantic mode coverage; issue #281 owns physical-device calibration. The current shared haptics service and the implementation coverage matrix govern integration.
**Owned boundaries:** `src/shared/haptics.ts` (only platform vibration API), `src/features/morse/input/MorseKeyInput.tsx` and `useMorseKeyPress.ts` (only Morse key onset), answer-owning runners (semantic results).

## Decision

**Extend what already exists.** The repo already has an app-level haptics service with five semantic effects and an opt-out switch. It already has one common Morse input button. The correct work is to fill result-coverage gaps, enforce one-effect-per-event, then validate physical feel.

Do not create a new key, a mode-specific vibrating button, a second `navigator.vibrate` callsite, or a raw millisecond parameter in any game. Do not make vibration the sole communication of meaning.

## Source-level audit (main and UI integration branch, 2026-10-20)

| Surface | Owns response / current keying | Existing haptic | Target contract |
| --- | --- | --- | --- |
| Shared physical Morse key | `input/useMorseKeyPress.ts` → `MorseKeyInput.tsx`; word wrapper `MorseWordKeyInput.tsx` | `element` on accepted pointer/keyboard onset | Exactly one onset; no release tick; cancel yields no *verdict* |
| Guided Learn, visual + listening | `lesson/useLessonProgression.ts` | No explicit correct/miss | Character `settle` or `miss` once at authoritative judgement |
| Learn word checkpoints | `lesson/MorseCheckpoint.tsx` | Key-onset only | Character/word judgements per existing checkpoint semantics; prevent both on same result |
| Placement | `MorsePlacementDialog.tsx` | Audit required | Same character result treatment, no evidence or difficulty changes |
| Adaptive letter practice (Key/Read/Listen) | `practice/LetterPracticeRun.tsx` | Key-onset only for Key | `settle`/`miss` for three directions, one per response |
| Key/Send | `fluency/useSendRun.ts` | `settle`, `miss`, `word`, `crest` already in callbacks | Preserve, deduplicate at word vs character boundary |
| Listen fluency | `fluency/useFluencyRun.ts` | `settle`, `miss`, `word`, `crest` | Preserve, review repeated call conditions |
| Copy | `fluency/useCopyRun.ts` | `settle`, `miss`, `word`, `crest` | Preserve, review repeated call conditions |
| Free play | `fluency/FreePlay.tsx` → common `MorseKeyInput` | `element` only | Intentional: no correctness vibration, because no target |
| Formal A–Z Test | `features/test/TestSession.tsx` | `settle`/`miss` already, generic test reveal `element` | Preserve formal flow. Avoid accidental double haptic with key onset and generic reveal |
| End of Test | `features/test/TestDone.tsx` | Completion feedback already | At most one `crest`, triggered on real milestone |

### Critical constraint

`input/useKeyedResponse.ts` is not Morse-exclusive: code search also finds consumers in `features/audio/AudioCard.tsx`, `features/test/ChoiceCard.tsx`, and `features/test/ProgressiveCard.tsx`. It must **not** be made to call `fire()` unconditionally. Attach Morse-specific outcome feedback to the run's authoritative, single-shot answer handler, or implement a narrow, opt-in semantic adapter. Existing consumers with `fire()` must not gain a second result pulse.

The key itself does **not** know correctness and should not: it only receives `expectedLength`, `locked`, `advanceToken`, `onSubmit` and optional open-ended callbacks. Its press-duration threshold remains a categorical dit/dah input, not WPM or motor competence evidence.

## Semantic event-to-feedback mapping

| Event | Named effect | Emission point / exclusions |
| --- | --- | --- |
| Accepted key onset (touch or keyboard) | `element` | Solely `useMorseKeyPress`, once per started press. If later canceled, onset cannot be taken back; **no result pulse or committed element** follows. |
| Correct character | `settle` | Only at definitive answer judgement, not at render, not at every keyed element |
| Incorrect answer | `miss` | Once; the learner sees the correction independently |
| Completed word/group correctly | `word` | One group verdict, **instead of** a duplicate final-character verdict |
| Stage, personal-best or run milestone | `crest` | Genuine milestone, max once per appropriate session; never for an unscored Free Play word |
| Free Play / interrupted / backgrounded / blocked key | None beyond any already-started valid key onset | No simulated success, grading or silent evidence write |

Keep the five existing named effects. Changing waveform/duration is owned by #281 after physical calibration, not by mode authors.

## Ordered implementation plan

### Slice A — #280 coverage and source-level regression (first PR)

1. Freeze the full invocation matrix above against the integration branch; enumerate active paths plus retained historical runners before editing. Check which flows `useKeyedResponse` and which flows `TestSession` own.
2. Add missing `settle`/`miss` in Learn visual/listening, checkpoint, adaptive practice (all three directions), placement; place the call exactly where the authoritative boolean is accepted. Keep haptic calls independent of React component render and timers that re-run on rerender.
3. Audit pre-existing Send, Copy, Fluency and Test calls to distinguish character, word and milestone; remove redundant effects rather than piling on new ones.
4. Verify all physical tap-and-hold Morse entry uses `MorseKeyInput` and the shared `useMorseKeyPress` haptic emitter. `MorseWordKeyInput` should continue to reuse one mounted key/AudioContext rather than rebuilding per letter.
5. No new haptic effect names, separate prefs, storage format changes, automatic results in Free Play, or global `navigator.vibrate` calls.
6. Add deterministic unit/integration assertions for one haptic per logical answer, nested/multi-character answers, keyboard pathway, late events, rapid transitions, support denied, API exceptions, preference off, no wrong next-card effect, and no change to formal Test/retention evidence or formative practice progress.
7. Full repository checks; PR base `main`, preserving the merged one-pass learning policy. Do not claim physical feel from CI.

### Slice B — #281 Pixel acceptance (second PR only if device findings require code)

1. Record target Pixel/Android, Chrome version, installed-PWA state, enabled OS vibration/Do Not Disturb status and Profile toggle state.
2. Run single-element, mixed quick dit/dah, long-press, miss, correct character, whole-word and stage/milestone sequences in **Chrome tab and installed PWA**. Check first-press latency, distinguishability, and tactile fatigue.
3. Try rapid repeat, slight finger drift, lost pointer capture, cancel, background/foreground, exit while a pattern is in flight, replay, muted audio, and touch-haptics disabled. A canceled press *may* already have emitted its legitimate onset pulse; it must never grade or emit a verdict.
4. Tune only `HAPTIC_PATTERNS` values if physically warranted; document before/after values and observation. Consider cancellation only when it fixes a reproducible stale pattern without cutting off a newer one. Current `cancelHaptics()` exists but is not wired in a game-specific cleanup path.
5. Confirm Profile Vibration off prevents subsequent calls, persists across reloads, and stops a currently running pattern if necessary. Show no unsupported option on platforms without vibration support. Never infer perceptibility from the API returning `true`.
6. Record device acceptance in #281, link #233 Pixel gate and release only after tests and physical sign-off.

## Test cases / evidence contract

- **Response-once:** one char correct, one char incorrect, multiple char word, unexpected duplicate callbacks, rapid final-element and advance; count effects and order.
- **Touch lifecycle:** fast tap, sustained hold, multitouch refusal, lost pointer capture, pointer cancel, lock, background; no phantom element/result.
- **Input parity:** physical key, keyboard dot/dash, assistive activation; no need for a separate haptic implementation.
- **User control:** default-on preference, off mid-session, refresh, unsupported API, native refusal or throw.
- **Boundaries:** Vibration is complementary; sidetone and visible status remain. Do not modify `morseFluency` or `morsePractice` semantics, Test evidence, completion, adaptive selection, or the categorical key threshold.
- **Viewport regression:** check 320px and 390px, but no haptics-specific visual redesign is part of these issues.
- **Hardware gate:** compare Chrome tab vs PWA on real Pixel. Mark phone testing **unverified** until run, even if all mocks and CI pass.

## Platform facts

[MDN `Navigator.vibrate()`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate) reports limited cross-browser support and notes that OS settings can suppress vibration. The [20 May 2026 W3C Candidate Recommendation Draft](https://www.w3.org/TR/2026/CRD-vibration-20260520/) describes required page visibility and sticky user activation, permits refusal/rate-limiting, and replaces an in-progress pattern when a new call arrives. The draft identifies Chromium implementations and opposition from WebKit; Firefox's implementation was removed. Therefore, the browser API is best-effort tactile confirmation rather than a deterministic signal or Morse-duration encoder.

## Completion definition

- #280 is complete only when the **source and automated integration matrix** is green and review confirms no coverage gaps/duplicate pulses.
- #281 is complete only when **physical Pixel Chrome + installed PWA observations** are logged and any follow-up fix is verified.
- Neither issue changes the owner-approved UI overhaul visual plan or formal competency claims.
