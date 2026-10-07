# Issue #151 — Prerecorded speech drills and marine listening/copy

**Status:** reusable runtime implemented (see `docs/open/AUDIO_DRILLS_RUNTIME.md`); production pack still depends on #150  
**Issue:** #151  
**Depends on:** #150 for canonical programme scripts  
**Research authority:** `docs/open/ISSUE_139_RADIO_COMMUNICATIONS_AUDIO.md`

## Owned capability

Add a reusable prerecorded-speech stimulus/drill path with:

- local/offline assets;
- canonical transcript/script authority;
- replay controls;
- transcript/accessibility support;
- assisted-state tracking;
- modality-specific audio evidence;
- deterministic transcription/extraction answer keys.

No microphone or ASR.

## First pack

Implement only the researched clean-listening sequence: phonetic/number copy, selected prowords, routine-call extraction/copy, priority-signal recognition and bounded message-field extraction.

Do not add degraded-channel/noise/speed/voice-difficulty scoring in the first release.

## Asset contract

Every speech asset must retain source/script provenance, generation tool/model/version/settings where applicable, immutable hash, and human listening QA. Generated audio is presentation, not factual authority.

## Handoff status

Architecture can be explored in parallel with #150, but production scripts/audio must wait for #150's canonical text content.

## Implementation status — runtime built; production blocked (updated 2026-10-01)

The reusable runtime is built and documented in `docs/open/AUDIO_DRILLS_RUNTIME.md`. No audio topic ships. The first reason below is cleared; the second still blocks production audio:

1. **Production content** depended on #150's canonical scripts. #150 shipped on 2026-10-06, so the canonical text now exists (`src/domain/radio/radioTopics.ts`); this reason no longer blocks scripting.
2. **Build-time TTS could not be evaluated in the environment that attempted this.** The candidate engines' models are hosted on `huggingface.co` (Kokoro, most Piper voices), which the sandbox refused. The bake-off in #139 §9 — generating the acceptance corpus and choosing an engine by human listening — needs that access, and needs a human to listen. Generated audio is never accepted because a model is "generally high quality".

The runtime (audio stimulus on an item, native Play/Replay, transcript-assisted state, deterministic response modes) landed after the #146 visual primitives, as sequenced, and keeps listening evidence in its own record (`audioEvidence`), so text recall and choice recognition can never mark the listening claim complete. One product question is open before any audio topic ships: a scored Test currently offers to reveal the transcript (the answer then counts as a miss), which sits against the rule that Tests after acquisition show no hints.