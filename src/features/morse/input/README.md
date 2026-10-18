# Morse input

**Status:** Maintained module guide

**Authority:** Describes implementation ownership; the contracts below govern behaviour.

`MorseKeyInput.tsx` renders the shared categorical dit/dah key and keyed pattern.
It keeps the existing exports for timing constants and pure entry functions,
whose implementation lives in `morseKeying.ts`.

`useMorseKeyPress.ts` owns entry/completion state, pointer and keyboard handlers,
cancellation, parent locks and in-place target resets. It calls
`useMorseSidetone.ts` for the mounted AudioContext and oscillator lifecycle.
Sidetone starts in the direct press before resume is awaited, and the final
element's canonical audible tail delays submission. Changing `advanceToken`
clears the response while retaining the context.

`MorseWordKeyInput.tsx` collects character patterns with one mounted key for a
whole word. `useKeyedResponse.ts` owns the parent surface's feedback and
transition gate: hits advance on a timer; misses wait for acknowledgement.

Contract: [Morse lesson](../../../../docs/open/MORSE_LESSON.md)

Contract: [Audio runtime](../../../../docs/open/MORSE_AUDIO_RUNTIME.md)
