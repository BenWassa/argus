# Letter practice

**Status:** current code map. **Authority:** implementation navigation; the linked contracts govern behavior.

- `LetterPracticeSurface.tsx`: selects eligible settled letters (all A–Z for an acquisition-ready learner), owns round remounts and writes only `morsePractice`.
- `LetterPracticeRun.tsx`: ten-prompt adaptive Key/Read/Listen rounds, help, playback validity and shared character corrections.
- `LetterPractice.css`: letter practice layout and controls.

Selection and independent per-direction histories live in `src/domain/morse/practice.ts`. The run receives its progress callback; the surface preserves every other topic field. Help does not count as an independent outcome, and Listen requires completed, uninterrupted playback. This formative record is separate from Fluency statistics and scored Test evidence.

Contract: [Adaptive practice and shared corrections](../../../../docs/open/ISSUE_221_MORSE_UX_CONSOLIDATION.md)

Contract: [Progress architecture](../../../../docs/open/PROGRESS_ARCHITECTURE.md)

Contract: [Morse audio runtime](../../../../docs/open/MORSE_AUDIO_RUNTIME.md)
