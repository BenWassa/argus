# Letter practice

**Status:** current code map. **Authority:** implementation navigation; the linked contracts govern behavior.

- `LetterPracticeSurface.tsx`: selects eligible settled letters (all A–Z for an acquisition-ready learner), owns round remounts and the Speed choice, and writes only formative records: `morsePractice` (Key) and `morseRecognition` (Read and Listen).
- `LetterPracticeRun.tsx`: ten-prompt adaptive Key/Read/Listen rounds, help, playback validity, shared character corrections, and the optional Speed variant of Read and Listen (monotonic timing, capped durations).
- `LetterChoiceTiles.tsx`: the four answer tiles that replace the one-letter text field, so no software keyboard opens.
- `LetterPractice.css`: letter practice layout and controls.

Key selection and its history live in `src/domain/morse/practice.ts`; Read and Listen choices, histories and timing live in `src/domain/morse/recognition/`. The run receives its progress callback; the surface preserves every other topic field. Help does not count as an independent outcome, and Listen requires completed, uninterrupted playback. This formative record is separate from Fluency statistics and scored Test evidence.

Contract: [Four-choice recognition and Speed](../../../../docs/open/morse/ISSUE_279_MORSE_SPEED.md)

Contract: [Adaptive practice and shared corrections](../../../../docs/open/morse/ISSUE_221_MORSE_UX_CONSOLIDATION.md)

Contract: [Progress architecture](../../../../docs/open/PROGRESS_ARCHITECTURE.md)

Contract: [Morse audio runtime](../../../../docs/open/morse/MORSE_AUDIO_RUNTIME.md)
