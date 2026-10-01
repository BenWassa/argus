# Issue #151 — Prerecorded speech drills and marine listening/copy

**Status:** architecture ready; production pack depends on #150  
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

## Implementation status — architecture not started; production blocked (2026-09-30)

Nothing is built. Two independent reasons:

1. **Production content** depends on #150's canonical scripts, which are blocked on the ISED RIC-22 and CCG RAMN 2026 texts (see #150's note).
2. **Build-time TTS could not be evaluated in the environment that attempted this.** The candidate engines' models are hosted on `huggingface.co` (Kokoro, most Piper voices), which the sandbox refused. The bake-off in #139 §9 — generating the acceptance corpus and choosing an engine by human listening — needs that access, and needs a human to listen. Generated audio is never accepted because a model is "generally high quality".

The reusable runtime capability (audio stimulus on an item, native Play/Replay, transcript-assisted state, modality-specific evidence, deterministic response modes) does not depend on either and could be built against fixture audio, but it was sequenced after the #146 visual primitives so that items, evidence and the parser are extended once and consistently. The key design question to settle first is where audio evidence lives: it must be a separate record from the text and choice evidence, so that text recall and choice recognition can never mark the listening claim complete.
