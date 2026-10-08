# Morse sending games — guided words, messages and free transmission

**Status:** Selected A + B runtime merged via #195 and included in v1.5.0; real Pixel acceptance remains outstanding.
**Issue:** [#188](https://github.com/BenWassa/argus/issues/188)  
**Reviewed against current `main`:** 2026-10-06  
**Authority:** Maintained selected sending gameplay contract and deferred follow-on proposals. The selected Send implementation is merged; optional later modes remain unbuilt. For shipped behavior, `MORSE_WORD_CHECKPOINTS.md`, `MORSE_FLUENCY.md`, `MORSE_INTERMEDIATE_PATH.md`, `MORSE_AUDIO_RUNTIME.md` and `PROGRESS_ARCHITECTURE.md` remain authoritative. Historical #29 concerns formal, scored competency and is not re-opened.

## 0. Decision in plain terms

The main missing activity is **send the text you see**. A written word is on screen; the learner uses the actual Morse key to send it, progressing from individual-letter support to uninterrupted whole-word sending and finally short multiword messages. The app shows exactly where the learner is, what they sent, where they missed, and what to try next.

**Recommended first investment:** A — **Morse Missions**, a five-step *sending* pathway, plus prominent entry to the **existing** Copy and Free Play surfaces. Add a small optional **B — Dispatch** scenario pack after the underlying sending loop has proved usable on a Pixel. Do not build all modes at once.

## 1. Verified current implementation — what not to duplicate

| Existing feature | Where it actually lives | What it covers | What's missing here |
| --- | --- | --- | --- |
| Four letter-highlighted whole-word checkpoints | `curriculum/checkpoints.ts`, `MorseCheckpoint.tsx`; #78, #90, #115 | Formative warm-ups and contiguous highlighted-letter keying at Lessons 4/7/10/13: TIME; TRAIN/GARDEN; FLOW/PLANT; BOX/COZY/JAZZ/QUIZ | Tiny fixed milestones, not an ongoing word/message game or continuous no-letter-pause sending |
| Fluency words/groups | `FluencyHome.tsx`, `FluencyRun.tsx`; #119 | Hear audio and key rhythm back; four sprint/ladder/word/group modes | Does not prompt visible text to **send** |
| Copy seven levels | `CopyRun.tsx`, `copy.ts`, `sentences.ts` | Hear Morse and **type** letters, words, phrases, sentences, numbers, punctuation; 90% optional clear | Opposite direction; no text→key challenge |
| Free play | `FreePlay.tsx` | Key unprompted patterns, see decoded text, insert spaces/delete, play back; or type text to hear it | No opt-in comparison to learner-chosen target, no review of mismatches |
| Shared key/audio | `MorseKeyInput`, `MorseWordKeyInput`, `MorseAudioPlayer`, `code.ts`, #77/#87/#119 | Tap/hold sidetone, touch-safe answer lifecycle, haptics, ITU timing, free-play pause segmentation | A new deliberate continuous-message judgement flow |

The existing **After the alphabet** Fluency hub exposes Copy, Free play, and speed drills, yet its visible headings suggest primarily listening. The new direction deserves an explicit **Send** action, not another item buried in speed drills. Do not replace Copy; it trains reception and is complementary.

A–Z acquisition is 13 lessons with two letters per lesson and four checkpoint handoffs; previous content mechanically validates milestone eligibility against `lessonPackets()`. The proposed early sending must follow that authority. Fluency proper is post-acquisition; it does not currently serve someone halfway through the alphabet.

## 2. Primary pathway — progression from beginner to intermediate

Use a single reusable run shell with **target**, **key**, **position**, **feedback** and **next**. Avoid seven different mini-apps and avoid turning completion into an infinite-test deck.

| Stage | On-screen prompt / learner action | Feedback rule | Availability |
| --- | --- | --- | --- |
| **1. Letter launch** | Show `T`; key its pattern with the existing shared key | Immediate correct/miss and correct pattern | Any learner with the letter introduced |
| **2. Spotlight words** | Show `T I M E` in one word, current letter highlighted; key each letter; visible `2/4` progress | Per-letter acknowledgement; stay on the same word; correction at the expected safe boundary | During Learn milestones, using only unlocked letters |
| **3. Word flow** | Show `TRAIN`; key a **whole word** without mandatory per-letter confirmation or mid-word correctness signals | One word-level verdict after word boundary; show decoded transmission and pinpoint mismatch | After short guided-word success, not necessarily full A–Z |
| **4. Short phrases** | Show `SEND IT`; key one word then the next, with word position and optional highlighted-letter assist | Review both words and missed characters after phrase | Later packets, with validation against known letters |
| **5. Short messages** | Show `REPORT STATUS` / `MESSAGE RECEIVED` / simple 3–8 word text; send it as a single exercise, optionally without highlights | Finish-screen transcript: intended vs received; word/character accuracy and next useful drill | A–Z acquired; figures/punctuation only after introduced |

Examples above are **curriculum candidates, not guaranteed shipping data**. All words/phrases must pass eligibility and plaintext-quality checks before committing. Stage 5 has an easy word-by-word variant before fully unassisted messages; do not start a novice at blind sentences.

### Teaching and interaction rules

- **Beginner:** show full target and highlight current character; preserve the existing keyed tap/hold, complete sidetone and touch/feedback lock; no forced extra `Continue` after a correct letter. A mistake requires readable correction, not a silently skipped answer.
- **Transition:** the whole word remains visible throughout, but per-letter interruption fades. Do not call a sequence of disconnected single-letter cards a whole-word exercise.
- **Intermediate:** display the whole sentence and optionally current word, not the expected Morse element count. The user can hear and see the transmitted message. A replay button may play the intended text *after the attempt*, or as an explicitly labelled supported round.
- **Word/letter gaps:** do **not** infer high-quality manual CW spacing from phone tap duration. A first prototype should test whether idle-pause letter boundaries from FreePlay plus an explicit `Finish word` / `Space` escape are comprehensible. Never silently swallow or duplicate an element at focus change/hold/release; do not adopt known target pattern length as hidden segmentation because it leaks the answer. Controlled segmentation and neutral feedback must be separately tested.
- **Session length:** default short runs: e.g. 5 easy words, 3 phrases, or 2 messages. Provide Repeat, Next difficulty and Focus missed letters; no forced daily schedule.
- **Scoring:** first count exact decoded characters and word/letter errors. Meaningful within-mode personal bests can be stored. Never advertise phone key timing as sending speed, CW accuracy in the radio sense, operator proficiency, or an official certification.

## 3. Five game concepts for owner choice

| Choice | Product loop | Learning value | Build effort | Recommendation |
| --- | --- | --- | --- | --- |
| **A. Morse Missions** | See a target → key it → clear words → short phrase → message, with progression and support fading | Direct printed-to-key production with increasing composition | **M** (first usable slice S) | **Core** |
| **B. Dispatch** | Choose a fictional field-message pack, send short operational-style text, receive clear after-action transcript | Repetition with semantic context and motivation | **S–M** after A | Strong optional theme |
| **C. Rapid Fire** | 60–90-second finite rounds of known letters/short words, visible accuracy and best | Retrieval automaticity and repeat engagement | **S–M** | Optional; timer must never be the only mode |
| **D. Copy & Relay** | Hear short Morse, type what was heard, then key a written response | Combines the two directions in one narrative, uses existing Copy | **M–L** | Later extension |
| **E. Free Transmission+** | Current sandbox plus optional typed target → `Send my text` → compare sent transcript, audio replay | Learner-directed exploration and deliberate self-review | **S–M** | Optional quality-of-life improvement |

**A+B** is the strongest first package. **A+E** suits free experimentation. **A+C** suits quick return visits. **D** is best once both sending and listening flows are pleasant and reliable. None requires a new standalone scored Morse topic or a broad gamification framework.

### B — Dispatch pack editorial boundary

Useful possible prompts: `CHECK IN`, `SEND STATUS`, `REPORT POSITION`, `MESSAGE RECEIVED`, `RETURN TO BASE`, `ALL CLEAR`. Label as **fictional field-communications inspired** until each item's procedural context is researched. Do not imply these strings are official CAF/NATO radiotelegraph procedure; do not present `OVER AND OUT` as canonical, or mix radio voice procedure, CW abbreviations, Q-codes and prosigns as if equivalent. If authentic historical/procedural material is desired, create a distinct sourced corpus with provenance and review it before release.

For variation, ship small deterministic packs first: *Check-in*, *Movement*, *Status*, *Weather*. Word strings are safe, plain-English and mechanically checked against the current Morse character map. Scenarios are thematic packaging, not real military field instruction.

### Optional engagement mechanics (secondary to skill)

- A quiet **round complete** with exact target vs keyed transcript, number of words clean, and one useful next action.
- A **personal best** per stage and content pack; never global score inflation or artificial leaderboards.
- A **spotlight weak letters** rerun generated from formative wrong-character records, without updating formal Test evidence.
- A little **mission board** if the owner prefers a visual campaign. Avoid badges/coins/daily-streak penalties unless later user testing shows value.
- Optional challenge setting with no highlight, but never force hidden targets for a beginner.

## 4. UI/UX direction — must feel native to Argus

This is **not** permission to invent a separate arcade skin. The sending game must read as the same product as Today, Library, Topic, Learn and Test.

### Design-system contract

Use `DESIGN.md` / `DESIGN.json` as hard constraints:

- **Gunmetal chassis:** `#101215` page ground, milled/raised cool-grey surfaces and recessed `#0b0d10` fields. No bright game-board panels, neon accents, cartoon effects or military-stencil styling.
- **One Accent Rule:** at most one polished-steel primary action/current state per screen. A highlighted Morse target is a current-state treatment, not a second glowing button.
- **One Warm Colour Rule:** tarnish remains reserved for decay/repair. Do not use orange/gold for streaks, scores or mission progress. Correct/miss may use the existing cooled Mineral/Clay feedback vocabulary.
- **Two-Voice Rule:** language and target text stay in native sans; session position, counts and measured results use mono readout. Do not put button verbs in mono.
- **Hardware controls:** the Morse key and buttons should use existing raised/pressed/engraved material behavior. The key remains the physical centre of the interaction rather than being redrawn as a novelty control.
- **Motion:** 150–220 ms state feedback only, no decorative movement; collapse under `prefers-reduced-motion`. Haptics follow the existing semantic vocabulary rather than adding mode-specific vibration patterns.
- **One Lit Surface Rule:** the current task can be the focused/lit surface. Secondary statistics, help and mode controls remain flush/quiet.

### Product feel

The intended tone is a **precision training instrument**, not a mobile game layered onto Argus. Engagement should come from fast interaction, visible progress through a finite round, accurate feedback, personal improvement and meaningful content — not coins, badges, confetti, artificial streak pressure or decorative mission chrome.

A themed Dispatch mode may change **copy and content**, not the design language. It still uses the same gunmetal session shell, key, typography, feedback colors and completion treatment as ordinary Morse.

### Entry / discovery

On the Morse topic page, surface `Send words` beside `Copy Morse` and `Free play`; for an in-course learner show `Try a word` once eligible rather than hiding it behind `After the alphabet`. The recommended next stage is visually strongest; advanced drill settings remain secondary. Do not add another dashboard or mode-picker screen unless owner-reviewed mockups prove it improves navigation.

### Run layout

Target the real phone first, especially **390 px portrait** with 320 px as the narrow automated boundary.

A default run should fit its **core interaction in one viewport without ordinary vertical scrolling**:

1. compact session bar: `Send` + mono `3/5` + quiet Close;
2. large target area, with stable current-letter or current-word emphasis;
3. one restrained line showing decoded/sent progress;
4. the existing large tap/hold Morse key in the lower interaction zone;
5. at most one secondary/help control exposed during active input.

Do not stack score cards, tips, progress bars and multiple controls above the key. Nothing should move vertically when an answer lands. Feedback should replace or overlay a stable region rather than pushing the key around.

At 200% text, accessibility takes priority over the single-viewport goal: allow deliberate scroll rather than clipping or shrinking below readable/touchable sizes.

### Target treatment

- **Spotlight stage:** keep the whole word visible; current letter gets one clear current-state treatment. Completed letters recede; upcoming letters remain readable.
- **Word Flow:** keep the full word stable with no per-letter flash/grade interruption. Show sent progress separately so the target itself does not jump.
- **Phrases/messages:** current word may be emphasized, but never hide the rest of the message. The user should always understand their location in the target.
- Avoid faux-terminal styling, blinking cursors, typewriter animations, giant Morse glyph decoration, military map textures or any visual treatment that competes with the keying task.

### Review / completion

The completion screen is allowed one stronger polished moment, consistent with Argus's existing completion hierarchy. It should show:

- expected text;
- decoded/sent text;
- exact missed positions/words;
- one concise result readout in mono;
- one primary next action;
- no more than two quiet secondary actions such as `Repeat` and `Focus misses`.

Do not bury the useful diagnosis under celebratory treatment. No confetti or trophy UI.

### Owner-reviewed design gate

**No runtime implementation of S1/S2/S3 should begin from wireframe prose alone.** Before each new interaction family ships:

1. produce realistic **dark-mode Argus mockups** at 390 px portrait using current `DESIGN.md` tokens/components;
2. show at minimum the active run, a miss, and the completion/review state;
3. for S2, also show the continuous word/phrase flow state where segmentation and progress are visible without per-letter interruption;
4. compare the mockups against the current Morse Learn/Fluency screens so new work does not introduce a separate visual grammar;
5. obtain owner selection/approval, then treat the approved direction as the implementation reference.

Design review should reject any concept that feels visually busier, more arcade-like, less legible, or less physically coherent than the existing Morse surfaces even if the mechanics are technically correct.

### UX acceptance gate

A slice is not complete merely because inputs grade correctly. It must also pass:

- no accidental taps during answer transitions or key release;
- no layout jump when correct/miss feedback appears;
- no normal-run scroll on 390 px portrait and no horizontal overflow at 320 px;
- target, position and next action understandable within one glance;
- primary key/control reach remains comfortable one-handed;
- Android Back exits one meaningful level, never the whole PWA unexpectedly;
- audio/haptics unavailable still leaves every state understandable;
- reduced motion removes animation without removing state cues;
- screen-reader output does not repeat every visual character update noisily;
- interruption/background/resume never creates a phantom element or skips progress;
- owner real-device Pixel review before merge of any interaction that changes continuous keying behavior.

**Discoverability audit:** confirm the live topic page labels and paths, and whether the learner who has mastered A–Z can find Copy/Free play in one obvious action. The source already implements the features, so this should be solved with navigation/copy, not by recreating them.

## 5. Technical boundaries and risk register

1. **Source and state authority.** `lessonPackets()` determines what was taught. New content must validate against the generated unlocked set, not a duplicated alphabet string. The 13 canonical lessons and four checkpoints remain unchanged.
2. **One key.** Reuse `MorseKeyInput`, its audio lifecycle and `useKeyedResponse` where appropriate. Continuous sending likely needs an explicit wrapper/state machine using `FreePlay`'s decoding/token primitives, not a separate key implementation. Unit-test token segmentation, focus loss and rapid multiple touches.
3. **Progress isolation.** Guided games may record formative stats, accuracy and bests via the existing `morseFluency` envelope *if its parser validates the new keys*. Prove they cannot modify `status`, `itemEvidence`, `lessonProgress`, `lessonSitting`, `morseReview`, `acquisitionReadyAt`, Test history or completion. Do not widen `MorseFluency` state without considering export/import, Firebase sync and version compatibility.
4. **Audio and spacing.** Preserve `MORSE_AUDIO_RUNTIME.md`, ITU-R M.1677 timing, first-gesture unlock and cancellation on navigation. The 20 WPM pinned speed/spacing rung is for post-acquisition audio practice, not an arbitrary requirement on early visible keying. Avoid claims of precise sidetone/key timing measurement.
5. **Offline.** No external API, no online leaderboard and no network requirement for a run. Respect #113's still-open offline-runtime work rather than claiming cold-offline guarantees not yet merged.
6. **Usability/accessibility.** 320/390 px phone widths, keyboard and switch alternative, 44 CSS px hit area, screen reader announces target/position/decoded feedback once, reduced-motion, audio unavailable, vibration unavailable and interruption recovery. Android Back returns one meaningful level without persisting phantom success.
7. **Quality/content.** Deterministic tests for curation, target representability, word lengths, no empty or unexpected Unicode/prosign payload, accurate text diff on repeated words, and no unsupported characters. Keep core lessons and full Test independent.
8. **Deployment.** Documentation/issue PR is not runtime work. Later implementation through focused PRs; running required checks does not authorize production deployment.

## 6. Build in bounded slices after owner selection

| Slice | Size | Shippable acceptance |
| --- | --- | --- |
| **S1 — Send a word** | Small | Topic/lesson entry; correctly eligible 2–5 letter targets; whole word visible, highlighted current letter, shared tap/hold, finite summary; phone tests; zero formal-evidence writes |
| **S2 — Flow and phrases** | Medium/high risk | No mid-word verdict, intentional boundary method, transcript comparison; 2–3 word prompts; handling of pauses and mistaken characters verified on Pixel; accessible fallback |
| **S3 — Progression and missions** | Medium | Recommended next stage, contextual prompts with editorial QA/provenance, lightweight persistent bests, repeatable runs; no false competency claim |
| **S4 — Optional modes** | Separate decisions | Pick **one** of Rapid Fire, Copy & Relay or Free Transmission+ based on real usability after S2 |

### Acceptance tests that must exist before S1–S3 ship

- Mid-lesson targets only use unlocked letters; after Lesson 4 `TIME` is valid, before Lesson 8 `O` must not appear; every generated phrase validated against packet authority.
- Press/hold, delayed sidetone, overlapping touches, held key through a transition, audio background/resume and rapid navigation cannot create double answers.
- The highlight/progress never jumps or incorrectly silently advances; input remains uninterrupted through a word in Flow mode, and a miss can be reviewed without hiding the remaining target.
- Phrases and sentences show the exact typed/decoded comparison even with an inserted/deleted character or a repeated word; no misleading `100%` for altered text.
- Game results do not change completion, Test evidence, acquisition support or retention. Existing topic sync/import/export roundtrips remain valid.
- New modes are explicitly usable in dark mode, on 320/390 px phone, in reduced motion and audio/haptics-disabled states. Check a real Pixel/PWA for the continuous-send boundary before calling S2 done.
- Every game works with connectivity disabled in a provisioned offline session; broader cold-offline guarantee remains with #113.

## 7. Owner decision record (selected 2026-10-07)

Owner instruction **Build it** selects the recommended **A — Morse Missions** as the core and **B — Dispatch** as the first contextual pack.

Runtime PR #194 supplies the implementation, now integrated with its design contract into `feat/morse-home-release`:
1. Spotlight words;
2. Word flow;
3. Phrases;
4. Short messages;
5. Dispatch.

The presentation stays as restrained Argus levels rather than a separate mission-board skin. Spotlight uses highlighted-letter support; later stages use pause-delimited open keying. Everyday material comes first and Dispatch remains explicitly fictional rather than official CAF/NATO procedure.

Rapid Fire, Copy & Relay and Free Transmission+ remain optional later work. The combined candidate fixes the listening-spacing assertion, the extra shell gutter on sending, and idle-letter segmentation during a held dah. Keep #188 open until the combined candidate is green, merged and accepted on the owner's real Pixel. The first implementation remains post-alphabet; in-course entry, target replay and focused missed-letter rounds are deferred follow-ons, not completion claims of this release.

## Research and source record

This is an incremental product proposal informed by the repository's completed #119 research and source code, rather than a claim of new educational efficacy. External design precedents corroborate the split between sending, copying, word groups and free practice:

- **ITU-R M.1677-1** (current International Morse representation/timing): https://www.itu.int/rec/R-REC-M.1677-1-200910-I/
- **CW Academy Fundamental curriculum** includes prompted sending, word training, direct copying and longer text: https://cwops.org/wp-content/uploads/2025/04/CW-Academy-Fundamental-Curriculum-v2.0.htm
- **Morse Code World trainer** distinguishes Copying/Sending and Characters/Words/Phrases: https://morsecode.world/international/trainer/trainer.html
- **Morse Code World Sending Practice** supports word prompts and weak-letter weighting: https://morsecode.world/labs/sending-practice/
- **LCWO** distinguishes group/plaintext/callsign/word training and text→CW conversion: https://lcwo.net/

No third-party code, word lists or proprietary military insignia/material are to be copied into Argus on the strength of these links. This proposal's example prompts are newly authored suggestions.
