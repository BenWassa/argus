# Morse feature map

**Status:** current code map. **Authority:** navigation guidance; the linked contracts govern behavior and `src/architecture.test.ts` enforces import boundaries.

Root modules provide shared teaching and interaction building blocks:

| File | Responsibility |
| --- | --- |
| `MorseCharacterPacket.tsx` | Learn character cards combining glyphs, mnemonic graphics, phrases, notation and playback. |
| `MorseCharacterSupport.tsx` | Canonical character reveal for corrections and lookup, with caller-owned or self-owned audio. |
| `MorseMnemonic.tsx` | Accessible SVG rendering of the shared visual mnemonic grammar and sounding element. |
| `MorsePhrase.tsx` | Rhythmic verbal mnemonic and `MorseBeatGrammarNote` explaining the beat marks. |
| `MorsePlayButton.tsx` | Shared Play/Stop control, including concealed glyph labels for listening questions. |
| `MorsePlacementDialog.tsx` | Placement assessment dialog and its formative acquisition handoff. |
| `useMorseAudio.ts` | Character audio player lifecycle, sounding-element state, cancellation and errors. |
| `keyedResponse.ts` | Public re-exports of `MorseKeyInput` and `useKeyedResponse` from `input/`. |

Each subfolder owns its internal screens and controls:

- [fluency/](fluency/README.md): guided Send, receiving Copy, sound-first speed drills, Free Play and formative fluency statistics.
- [input/](input/README.md): shared physical Morse key, whole-word entry and answer/feedback lifecycle.
- [lesson/](lesson/README.md): acquisition lessons, lesson records, curriculum path and word checkpoints.
- [practice/](practice/README.md): adaptive ten-letter Key/Read/Listen rounds and their separate formative record.
- [reference/](reference/README.md): read-only A–Z character lookup and playback.

Sibling features may import Morse root files only. Current sibling consumers use `MorseCharacterPacket` (Learn), `MorseCharacterSupport`, `MorsePhrase`, `useMorseAudio` and `keyedResponse` (Test), `MorseBeatGrammarNote` from `MorsePhrase` and `MorsePlacementDialog` (Library), and `useKeyedResponse` from `keyedResponse` (Audio). The remaining root modules are also reachable under the root-only rule and compose these shared pieces.

The sole `DEEP_FEATURE_IMPORTS` exception is `src/features/library/TopicPage.tsx -> src/features/morse/lesson/MorsePath`. It is recorded debt and must not grow. Tests are exempt from the production import rules. The app layer may compose internal surfaces directly: `AppRouter` imports `fluency/FluencySurface`, rather than a root re-export. Domain Morse code has no React dependency.

Contract: [Morse lesson](../../../docs/open/MORSE_LESSON.md)

Contract: [Word checkpoints](../../../docs/open/MORSE_WORD_CHECKPOINTS.md)

Contract: [Fluency](../../../docs/open/MORSE_FLUENCY.md)

Contract: [Intermediate path](../../../docs/open/MORSE_INTERMEDIATE_PATH.md)

Contract: [Shared corrections and adaptive letter practice](../../../docs/open/ISSUE_221_MORSE_UX_CONSOLIDATION.md)

Contract: [Morse audio runtime](../../../docs/open/MORSE_AUDIO_RUNTIME.md)

Contract: [Mnemonic grammar](../../../docs/open/MORSE_MNEMONIC_GRAMMAR.md)

Contract: [Verbal mnemonics](../../../docs/open/MORSE_VERBAL_MNEMONICS.md)

Contract: [Progress architecture](../../../docs/open/PROGRESS_ARCHITECTURE.md)
