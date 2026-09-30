# Prerecorded speech drills — runtime contract (#151)

**Status:** implemented on the feature branch, in review. This is the maintained contract for the reusable audio capability. It ships **no production speech**: the first listening pack is still blocked on #150's canonical scripts and on the TTS bake-off (see `docs/open/ISSUE_151_RADIO_AUDIO_DRILLS.md`).  
**Issue:** #151  
**Research authority:** `docs/open/ISSUE_139_RADIO_COMMUNICATIONS_AUDIO.md` (§7 scoring, §8 capability, §10 asset/QA contract, §11 transcript and accessibility)  
**Code:** `src/domain/audio/`, `src/features/audio/`, `src/infrastructure/persistence/audioParser.ts`

## What exists

A heard item is an ordinary `Item` with two optional, additive fields (library format v5, no version bump; items without them are unchanged):

```ts
interface Item { …; audio?: AudioStimulus; response?: ItemResponse }

interface AudioStimulus {
  assetId: string          // ties the recording to its manifest row and QA record
  src: string              // /media/audio/….(mp3|m4a|ogg|opus|wav), local only
  transcript: string       // canonical, required: content, not metadata
  drill: 'token-copy' | 'proword' | 'call-extraction' | 'call-copy'
       | 'priority-signal' | 'message-extraction'
}
type ItemResponse =
  | { mode: 'copy'; normalizer: 'compact' | 'words' }
  | { mode: 'fields'; fields: { label: string; expected: string }[] }   // 2–5 fields
```

An audio item is answered by **exactly one** of `choice` (from #146) or `response`. It must be `forward`, cannot also carry a picture, and `response` requires `audio`. `answer` stays the text key, so the recall reference, catalog identity, export/import and every text-only surface keep working. The parser rejects remote addresses, data URIs, traversal, a missing transcript or asset id, and an unknown drill.

## Grading is deterministic and never forgiving

`src/domain/audio/response.ts`. Normalization ignores **case and non-semantic punctuation and spacing**, and only that:

- `compact` removes all spaces and punctuation (`A12` = `a 1 2`), for identifiers where spacing means nothing;
- `words` compares whole words in order (`SEA BREEZE` ≠ `SEABREEZE`), for a transcribed call;
- `fields` compares each field as `words`; the answer is correct only if **every** field is, and feedback names the wrong field.

A wrong letter, digit, word, field or order is never accepted (tested exhaustively). Nothing is self-scored and nothing is fuzzy-matched.

## Evidence: listening is its own claim

`Topic.audioEvidence` is a record of its own, deliberately **separate** from `itemEvidence`:

```ts
interface AudioEvidence {
  attempts; correct; unassistedCorrect; assistedAttempts; lastAt; lastLatencyMs
}
```

- An answer by ear writes only here. A text or choice answer never does. A topic's listening claim is read only from this record (`listeningCoverage`, `hasCompleteListeningCoverage`), so no amount of text or picture evidence can complete it. A test proves this against perfect item evidence for the same items.
- `unassistedCorrect` counts correct answers given **without the transcript having been revealed first**. Replaying the clean recording is allowed and never disqualifies.
- Absent means none, which can only withhold a claim, never fabricate one. Import validates it strictly: ids must be heard items, counters non-negative integers and mutually consistent (correct ≤ attempts, unaided ≤ unassisted attempts, …). A record no real run could produce is rejected, not clamped.
- The topic page shows `Listening: N of M answered by ear, unaided`, read only from this record.

## Transcript and the cost of using it

- In **Learn** the transcript is shown normally beside a player. Playing there is reference listening and records nothing.
- In a **scored exposure** the transcript is concealed and not even in the DOM until the learner chooses **Show transcript**, at which point the card says, in words, that this answer will be practice.
- An answer after the transcript was revealed, or with a recording that would not play, is **graded for the learner's benefit but does not count as correct for the attempt**, and is recorded as assisted. It is held for reading rather than moving on by itself. Such an attempt is practice, not evidence that the words were heard unaided.
- After any answer the transcript is shown as part of the correction.
- **Practice** offers the player and a free transcript reveal, and records nothing.

This is the main product decision in this PR: a transcript-assisted correct answer counts as not-correct in the scored tally. The alternative (count it, flag it) would let a learner pass a listening attempt by reading. The rule follows #139 §7 and §11 literally.

## Player

`AudioPlayer` is a native `<audio preload="auto">` with one explicit control that names what it will do (Play / Stop / Replay) and what it is about (`Play recording: <prompt>`). There is no autoplay. State is announced politely. Playback stops on unmount and on `pagehide`. A recording that cannot load is reported at once (it is fetched ahead), the control says so and is disabled, and the transcript route stays open, so audio failure never locks a learner out. The recordings are static media under `public/media/audio/`, so the build's precache covers them and playback works offline.

## Asset QA (the production gate)

`src/domain/audio/assetManifest.ts` implements the #139 §10 checks as a pure function (`validateAudioAssets`), and `productionAssets.test.ts` runs it against the real catalog, the real manifest (`productionManifest.json`) and the real files in `public/`. It fails when an audio item has no manifest row or an unapproved one; approval has fewer than two independent listens checked against the transcript; the file is missing, empty, resized or no longer matches its SHA-256; the manifest and item disagree on path, topic, drill or transcript; a row has no source or voice licence; or a `token-copy` transcript does not decode (`tokens.ts`, cross-checked against the shipped NATO and radiotelephony-number topics) to the answer key. The manifest is empty today, so **the first audio item added to the catalog fails CI until all of that is in place.** These checks prove packaging and transcript agreement; they do not prove pronunciation. That is the two human listens, recorded in the manifest.

## Not built

Microphone, speech recognition, runtime TTS, second voices, speed control, static, noise or any degraded-channel scoring, a waveform or radio simulator, and any production recording, script or voice selection. The Morse audio runtime is untouched and not reused.

## Validation

Unit: grading (every wrong-token case), evidence recording and separation, the decoder and its cross-check against the catalog, the manifest validator's failure cases, the production gate, parser rejection matrix and round trips, authoring identity, storage round trip. Component: player (never autoplays, plays/stops/replays, failure, cleanup), card (all three modes, transcript cost, failed recording, replay does not change the count, one answer only, no stale feedback on card swap), Test session (evidence lands only in the listening record, assisted answers do not count, practice offer, early exit), Practice. Browser (`e2e/listening.spec.ts`, 320/390/landscape/desktop, with a generated tone served through the router so no audio file is committed): Learn shows recordings with transcripts, a recording plays only when pressed and can be replayed, a clean run banks to the listening record only, a revealed transcript makes the answer practice, a recording that cannot load is reported and leaves the text route open, and no mode scrolls sideways.

## Things for the design pass

The card centres its content vertically, which leaves empty space above the prompt on a tall phone; the Play and Show transcript controls stack tightly against the heading; and the disabled Check button reads as grey rather than clearly inactive. None changes behaviour.
