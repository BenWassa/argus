# #280 — Morse haptics coverage and integration handoff

**Status:** implementation PR pending CI/review, 2026-10-22. **Base:** `feat/ui-overhaul`.
**Issues:** [#280](https://github.com/BenWassa/argus/issues/280) (this slice), [#279](https://github.com/BenWassa/argus/issues/279) (Letter Practice ownership), [#281](https://github.com/BenWassa/argus/issues/281) (physical Pixel calibration).
**Companion scoping document:** [PR #282](https://github.com/BenWassa/argus/pull/282), `ISSUE_280_281_MORSE_HAPTICS.md`; this implementation does not require #282 to merge first.

## Event contract

Only `src/shared/haptics.ts` calls `navigator.vibrate`; `useMorseKeyPress` emits `element` once on an accepted touch/keyboard onset, independent of subsequent correctness. Surfaces that know the graded result emit exactly one of `settle` (correct character), `miss` (wrong), `word` (complete correct word/group), or `crest` (actual milestone/personal best). Do not assign a second result pulse to a final character when its group earns `word`. No verdict on Free Play, ungraded separators, showing/replaying a stimulus, rejected input, or re-render. All effects are supplemental to visible and audible status, obey the shared vibration preference, and must not affect recorded outcomes.

## Grading-path matrix

| Mode / event | Verdict source | Before #280 | Integration disposition |
| --- | --- | --- | --- |
| Learn printed and replay | `useLessonProgression.answerVisual` | Missing | One `settle`/`miss` after `answerLesson` accepts a response; replay is still unscored |
| Learn listening | `useLessonProgression.answerListening` | Missing | One `settle`/`miss` after listening engine accepts it; audio playback/skip has no verdict |
| Word checkpoint warmups | `MorseCheckpoint.answer` | Missing | Character `settle`/`miss`; no persistence |
| Word checkpoint letters | `MorseCheckpoint.answer` | Missing | `word` replaces final `settle` **only** when all word letters were correct; missed word cannot celebrate |
| Placement letter/whole word | `MorsePlacementDialog.answer` | Missing | Letter `settle`/`miss`; whole-word `word`/`miss`, one per whole-word response |
| Adaptive Letter Practice — Key / Read / Listen | `LetterPracticeRun` | Missing | **Deferred to #279**: their owner adds exactly one `settle`/`miss` after the gated, accepted answer. Four-choice recognitions count as one character verdict; never vibrate from an option's render, speed timer, or shared `useKeyedResponse` |
| Send Spotlight | `useSendRun.answerSpotlight` | Final-char + review duplicate | Nonfinal character `settle`/`miss`; final success `word` iff entire word correct, otherwise `settle`/`miss` as appropriate. Review transition no second verdict |
| Send Flow / phrases / messages | `useSendRun.beginReview` | Word/miss already | One whole-prompt `word`/`miss` only upon review; adding a space is **not** a correct answer; no fake word when finishing a run |
| Send personal best | `useSendRun.nextFromReview` | `crest` on first baseline, `word` otherwise | `crest` only if an existing best was improved; no duplicate end-of-run word |
| Copy | `useCopyRun.check` | Existing | Correct singleton `settle`, correct multi-character `word`, wrong `miss`; `crest` only on an improved established best. No change |
| Listen Fluency | `useFluencyRun` grading callback | Existing | `settle`/`word`/`miss` on the accepted answer; no replay verdict; no change |
| Formal A–Z Test | `TestSession` graded handlers | Existing | One verdict per accepted grade; `reveal` is a separate ungraded generic card action, not a second Morse grade. No change to evidence |
| Test milestone | `TestDone` | Existing | Existing completion `crest` on a genuinely completed topic; no change |
| Free Play | Shared key only | `element` onset | Never emits a fabricated correct/wrong/word grade; no change |

## Follow-up handoff to #279

Do **not** edit `src/features/morse/practice/LetterPracticeRun.tsx` from this PR. #279 should import the existing `fire` from `shared/haptics` in its answer handler and call `fire(correct ? 'settle' : 'miss')` only **after** a valid single-letter grading decision is made and the response gate accepts the first submission. That applies to Key, Read, Listen, ordinary adaptive practice and optional four-choice Speed variants. Correct option selection is a character, never `word` or `crest`. Do not put calls in the generic `useKeyedResponse`, multiple-choice tile callbacks that can double-activate, or mode-switch effects. Retain #279's method-specific score and speed invalidation rules unchanged; assistive/late/ignored activations receive no outcome effect.

Integration review when #279 merges: add direct outcome tests for its Read/Listen/Key handlers, repeated taps, speed interruption, choice gating, and replay; rerun these haptics tests against the merged branch. **#280 is not all-mode complete until that handoff lands.**

## Automated/physical boundary

`src/features/morse/hapticsCoverage.test.tsx` stubs the shared key's accepted submission (without its distinct onset effect) and spies on the native vibration boundary for Learn visual, checkpoint multi-letter success/failure, placement preference-off, and Send word/separator semantics. Existing `src/features/morse/input/keyedResponse.test.tsx`, `MorseKeyInput.test.tsx`, and `src/shared/haptics.test.ts` cover the key's lifecycle and the service's unsupported/refusal/preference behaviours. CI must pass; a simulator cannot establish tactile perceptibility.

**#281 only:** duration/waveform adjustment, real Pixel Chrome/PWA tests, OS settings, DND, tactile feel, cancellation ergonomics and release sign-off. Do not claim Pixel acceptance here. No mapping, timing threshold, sidetone, scheduling, evidence, storage or UI change is authorized by #280.
