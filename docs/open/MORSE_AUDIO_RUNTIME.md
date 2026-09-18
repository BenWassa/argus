# Morse audio runtime contract

**Status:** Maintained implementation contract

**Authority:** Current for every Morse Web Audio entry point

**Last verified:** 2026-09-18

## The recurring first-press defect

Morse sidetone has regressed more than once as a silent first tap on mobile,
especially in an installed PWA after a fresh launch or return from the
background. It is a release-blocking interaction defect: the same gesture that
records a dit or dah must also produce its audible feedback when the device can
play audio. A second tap must never be required to make the first one audible.

The defect is easy to reintroduce by awaiting `AudioContext.resume()` before a
source is started. Mobile browsers may let the transient activation from the
tap expire while that promise settles.

## Required behavior

- Every explicit Morse Play action starts its scheduled source in that direct
  action, resumes any non-running context, then verifies it reached `running`
  before it reports playback.
- Every shared `MorseKeyInput` press creates and starts its oscillator in the
  pointer or keyboard event, before waiting for resume. A source started while
  suspended waits for the direct user action to unlock the context.
- A quick first release still plays its canonical dit/dah once and only submits
  after that element's audible window. Audio failure never blocks Morse entry.
- Backgrounding cancels active sound without app-issued suspension. The next
  explicit action reopens/resumes output; no autoplay is permitted.
- Learn, replay, checkpoints, placement and any future keyed prompt must use
  `MorseKeyInput`, not copy an AudioContext lifecycle locally.

`src/domain/morse/audio.ts` owns sampled playback. `src/features/morse/input/MorseKeyInput.tsx`
owns keyed sidetone. They share timing, pitch, gain and edge shaping through the
Morse audio domain constants.

## Regression coverage and device acceptance

The automated suite covers a suspended initial context, one first-press
oscillator, quick-release handling, complete-tone commit timing, cancellation,
and background/foreground resume. It cannot prove a particular phone speaker or
installed-PWA audio route.

Before deployment, verify on the target installed PWA:

1. Fresh launch, first key tap is audible.
2. Fresh launch, first Play action is audible.
3. Background then foreground, first key tap is audible.
4. Repeat in Learn, replay, a word checkpoint and placement.

If any case needs a second tap, record the device/browser/PWA version and treat
it as this contract failing rather than as a learner-volume preference.
