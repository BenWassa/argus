# Morse reference

**Status:** Maintained module guide

**Authority:** Describes implementation ownership; the contracts below govern behaviour.

`MorseReference.tsx` provides the standalone lookup screen and exports
`MorseReferenceCards` for the topic page's shared alphabetical A–Z cards.
The standalone screen also includes figures and beginner punctuation with
rule-based captions. All cards use `MorseCharacterSupport` for their glyph,
pattern, mnemonic and audio control, styled by `MorseReference.css`.

Alphabet and figure playback each use local `useMorseAudio` state. The reference
receives no topic or progress mutation callback and writes no learning state.
The file remains together because its card helpers and captions form one small
lookup presentation.

Contract: [Morse lesson and reference](../../../../docs/open/MORSE_LESSON.md)

Contract: [Audio runtime](../../../../docs/open/MORSE_AUDIO_RUNTIME.md)
