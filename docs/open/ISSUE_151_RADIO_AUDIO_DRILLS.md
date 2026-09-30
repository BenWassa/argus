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