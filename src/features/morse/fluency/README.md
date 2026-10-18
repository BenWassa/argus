# Fluency module map

**Status:** current code map. **Authority:** implementation navigation; the linked contracts govern behavior.

| Module | Responsibility |
| --- | --- |
| `FluencySurface.tsx` | Topic lookup, initial route handoffs, run selection/remounts and the sole durable write adapter. |
| `FluencyHome.tsx` | Send/Copy/Free Play/drill choices and the listening-spacing control. |
| `FluencyDiagnostics.tsx` | Home latency measures and their formative interpretation. |
| `SendRun.tsx` | Printed targets, Spotlight/open keying, prompt comparisons and sending summary. |
| `useSendRun.ts` | Seeded prompts, Spotlight lifecycle, pause-delimited tokens, review and sending bests. |
| `CopyRun.tsx` | Figures/punctuation introductions, typed receiving answers, corrections and summary. |
| `useCopyRun.ts` | Playback limits, input/focus state, feedback timers, scoring and final Copy best. |
| `FluencyRun.tsx` | Sound-first drill prompt, keyed response, correction and summary. |
| `useFluencyRun.ts` | Run transitions, audio, latency hygiene, character statistics and end-of-run commit. |
| `FreePlay.tsx` | Unscored key-to-text or text-to-audio exploration; no persistence callback. |

`Fluency.css` remains the shared stylesheet entry point. Its ordered imports preserve the original cascade: `FluencyHome.css` (shared shell and hub controls), `CopyRun.css` (typed answers and introductions), `FluencyDiagnostics.css` (statistics), `FluencyRun.css` (shared run/feedback/summary styles), then `FreePlay.css` (free transmission). Final responsive/shared overrides stay in the entry point. `SendRun.css` owns the complete guided sending surface and stays separate.

A normal hub entry starts at `FluencySurface -> FluencyHome -> SendRun / CopyRun / FluencyRun / FreePlay`. Direct route props select a run immediately and return to the caller on exit. Copy level and Send stage callbacks remount the next round; drills remount by mode and spacing rung. Focus letters are captured when the surface opens, and an explicit letter subset restricts the initial drill run.

Run views delegate state to their matching hook. Domain `send`, `copy` and `session` modules select material and judge answers. `progress.ts` preserves the domain API while re-exporting `progressStore.ts` (record, updates, validation) and `progressMeasures.ts` (diagnostics and selection need). Drill latencies start after audio ends; replays, interruptions and misses do not contribute latency. Multi-character prompts do not attribute a whole-unit latency to an individual character.

The evidence boundary is `onProgress -> FluencySurface.commit -> updateTopic`, which spreads the current topic and changes only `morseFluency`. Drills accumulate character statistics until completion; Copy and Send save their formative best at completion. Home spacing changes use the same adapter. Free Play saves nothing. These writes never update scored Test evidence, retention clocks, attempts, acquisition or completion. `FluencyBoundary.test.ts` checks both views and extracted hooks; component tests exercise the existing run flows.

Contract: [Fluency](../../../../docs/open/morse/MORSE_FLUENCY.md)

Contract: [Intermediate path](../../../../docs/open/morse/MORSE_INTERMEDIATE_PATH.md)

Contract: [Guided sending](../../../../docs/open/morse/ISSUE_188_MORSE_SENDING_GAMEPLAY.md)

Contract: [Morse audio runtime](../../../../docs/open/morse/MORSE_AUDIO_RUNTIME.md)

Contract: [Progress architecture](../../../../docs/open/PROGRESS_ARCHITECTURE.md)
