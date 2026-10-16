# #221 — Morse UX consolidation: continuous adaptive letter practice and one teaching language

**Status:** Implemented and released in v1.5.3 on 2026-10-16; automated release verification complete. Real Pixel acceptance remains open.
**Authority:** Maintained issue scope and implementation record. Proposed sections below retain rationale; the implementation record states the actual delivered behavior.
**Audit:** Original scoping inventory inspected default-branch source on 2026-10-16. The implementation review below adds real Chromium captures at 320/390 CSS px; physical Pixel and deployed-app acceptance remain outstanding.
**Issue:** https://github.com/BenWassa/argus/issues/221
**Related:** #201 / PRs #209, #212, #215; #188; #87; #90; #76; #113.
**Authorities:** `DESIGN.md`, `DESIGN.json`, `src/styles/tokens.css`, `PRODUCT.md`, `MORSE_LESSON.md`, `MORSE_CUE_LADDER.md`, `MORSE_FLUENCY.md`, `PROGRESS_ARCHITECTURE.md`, `MORSE_AUDIO_RUNTIME.md`, `ISSUE_201_MORSE_GAMEPLAY_CONTINUITY.md`.

## Implementation record — 2026-10-16

The owner requested review and full implementation of today's issue. Work was developed on `fix/221-morse-practice` and integrated into `main`; the [release closeout](../closed/RELEASE_1_5_3.md) records deployment verification. This record does not claim physical-device acceptance.

- `Practice letters` opens a ten-prompt round directly from Morse Topic. Key, Read and Listen maintain independent histories. New learners use canonically settled letters; historically acquisition-ready learners retain all A–Z. Zero eligible letters leads back to Learn without inventing knowledge.
- The incremental scheduler uses the proposed bounded weight, three need draws per coverage draw, recent-letter spacing, and event order only. The E-five-correct/Y-four-misses seeded regression retains exploration. No calendar influences selection.
- `Topic.morsePractice` is optional within v5. Strict import parsing rejects corrupt/future schemas. Existing libraries remain valid; export and topic sync preserve the record, and simultaneous edits follow existing explicit conflict policy.
- The sole write adapter changes `morsePractice`; formal evidence, acquisition, lesson history, status and completion remain untouched. Help does not create independent outcomes. Listen answers remain disabled until playback completes; interrupted playback requires replay.
- Shared `MorseCharacterSupport` reuses canonical notation, `MorsePhrase`, and `MorsePlayButton`. Learn misses, scored Test misses, checkpoints, recognition, Send Spotlight, Copy's unambiguous letter mismatch, and A–Z reference use this body. Existing response wrappers retain Continue and transition gates. First-exposure timing instruction remains intentionally richer. Word-level comparisons remain intact; Send and Copy share safe letter selection, including single-letter targets. Ambiguous multicharacter shifts do not fabricate a culprit.
- Morse Topic omits its large decorative hero and duplicate recommendation card. It offers Practice letters, Send, Receive and Free Play directly, with Challenges under More options, a direct A–Z reference and folded acquired Lessons. The existing next action remains authoritative; Practice letters is independently available. Direct activity exits return to Topic instead of opening a second chooser. All historical Send stages, Receive levels and recognition modes remain directly reachable under More options. Listening settings intentionally retains the legacy Fluency settings/chooser surface as an optional compatibility route, rather than putting it in the normal activity path.

### Component/route review

| Surface | Before | After |
| --- | --- | --- |
| Topic | Large artwork, recommendation plus matching primary, curriculum occupying returning view | Compact header, four direct activities, one primary, acquired Lessons folded |
| Letter practice | No general adaptive multi-direction entry | `letter-practice` learn route; per-direction formative state |
| Learn correction | Full timing scaffold plus printed pattern | Shared character body; original hold and audio ownership |
| Formal Test correction | Two comparison rows without mnemonic/audio | Attempt comparison plus shared character body after grade only |
| Checkpoint / recognition / Spotlight | Local compact pattern treatment | Shared body for the incorrect character |
| Copy | Target/received comparison only | Comparison retained, shared support only for safely aligned letter mismatch |
| Reference | Local glyph/pattern/plain phrase/audio | Shared body with rhythmic mnemonic; still read-only |
| Direct activity exit | Second Fluency chooser | Original Topic route |

### Validation — 2026-10-16

- `npm test`: 1,732 passed across 134 files, including direction isolation, Help/interruption handling, safe character alignment, strict imports, sync conflicts and formal-state isolation.
- `npm run build:e2e`: TypeScript and production bundle passed; offline app-shell footprint 4.93 MiB.
- Release composite gate `ARGUS_E2E_PORT=4197 npm run check`: all 1,732 unit tests, TypeScript/production build and 465 browser cases passed, with 19 intentional skips. A prior run lost its default-port preview server; the isolated-port composite run passed without reduced workers or changed assertions. The final bundle's focused continuous-Send and letter-practice checks also passed (3/3).
- Separate `npm run test:rules`: all 33 Security Rules emulator tests passed. No rule or index changes are part of this release.
- `git diff --check` passed. These are local checks, not a claim of hosted GitHub CI or physical Pixel acceptance.

### Visual and acceptance evidence

Browser captures: [320 before](assets/morse-221/phone-320-before.png), [390 before](assets/morse-221/phone-390-before.png), [320 topic](assets/morse-221/phone-320-topic.png), [390 topic](assets/morse-221/phone-390-topic.png), [320 practice](assets/morse-221/phone-320-active.png), [390 practice](assets/morse-221/phone-390-active.png), [320 correction](assets/morse-221/phone-320-correction.png), [390 correction](assets/morse-221/phone-390-correction.png).

These are real Chromium renders of the production bundle at CSS phone widths, not physical Pixel captures. Physical Pixel touch/audio acceptance and owner visual signoff remain outstanding; keep #221 open for those checks. The prior documentation PR is provenance, not a runtime dependency. No changes from the separate #113 branch are assumed.

## 1. Owner problem and product decision

The app contains several ways to play Morse and teach the A–Z alphabet but has no **single obvious place to practice individual letters adaptively after completing them**. On return, the learner wants to *use* knowledge, not re-enter the 13-lesson curriculum or undertake an examination. A correct streak should suppress a stable letter substantially; a sequence of errors should raise a weak letter substantially. There are **no calendar dates, no due dates, no streaks by day, no elapsed-time decay and no forced refresher**.

The current UI also reimplements the same corrective teaching job in multiple ways. The original mnemonic/pattern/audio system is strong enough to reuse; no alternate condensed letter explanations should be invented inside each mode. A mistake must always offer the core treatment.

**Desired order whenever Morse is opened:** (1) plain overall **A–Z acquisition progress**, (2) one clear **next activity**, (3) a very small set of activity routes, (4) the **A–Z reference**, and only then optional curriculum, formal checking and advanced detail. No repeating information blocks or second mode-selection hub.

**Terminology decision proposed:** call unscored, repeating work **Practice letters**, never **Test** or **Exam**. Retain the existing **Test** name only for the distinct, formal bidirectional A–Z completion/repair assessment; make its consequences explicit at that boundary rather than throughout Play.

## 2. Verified current code inventory (not a claim of Pixel appearance)

| Existing surface | Current implementation verified in source | Consolidation problem / action |
| --- | --- | --- |
| `src/features/library/TopicPage.tsx` | Acquired-course header, embedded `Play Morse` recommendation and Send/Receive/Challenges/Free Play choices before curriculum; fixed primary; extra options; links to reference. | Existing #201 work is real in the inspected default-branch file; **keep it**, then simplify density, add Practice letters, and avoid duplicate recommendation/choices. Source and #215 documents may have drifted on merge status; verify separately. |
| `src/features/morse/lesson/MorsePath.tsx` | 13 two-letter lessons, four checkpoints, folded old lessons, formal Test row, repair/go-over row. | Valuable during acquisition; after completing A–Z collapse under `Lessons` rather than make the full historical path the returning user's main destination. |
| `src/features/morse/lesson/MorseLesson.tsx` + `LessonSteps.tsx` | Correct feedback; wrong keyed/listening feedback uses `CharacterStage` with letter, `MorsePhrase`, beat SVG, audio and printed notation; wrong holds for Continue. | Best current teaching precedent. Preserve its hold/touch lifecycle, but remove duplicate visual readings from a shared correction and reuse it elsewhere. |
| `src/features/test/ProgressiveCard.tsx` | Graded Test cues respect progressive cue rung; on wrong it shows two comparison rows with written notation/letter but **no canonical full mnemonic/audio support**. | Replace post-grade correction presentation with the same component; do **not** alter what may be disclosed pre-answer or what evidence is scored. |
| `src/features/morse/lesson/MorseCheckpoint.tsx` | Mistake shows a compact `[letter] is [pattern]` line, then Continue. | Does not provide established mnemonic or play control; converge. |
| `src/features/morse/fluency/FluencyHome.tsx` | Separate `After the alphabet` hub: Send stages, spacing dial, Copy levels, Free Play, Sprint/Ladder/Words/Groups, and technical latency/statistics. | Overloaded/duplicative chooser behind a chooser. Keep special settings/results where genuinely needed; main Topic should carry direct routes and one next action. |
| `src/features/morse/fluency/FluencyRun.tsx` | On a miss, reveals the first broken character's notation inside a generic `fluency-feedback` card; short text feedback. | Use shared character teaching component for single-letter errors; words/groups identify first incorrect letter and allow later errors as needed. |
| `src/features/morse/fluency/SendRun.tsx` | Spotlight miss uses inline `send-feedback` and pattern only; word/message results use their own Target/Received comparison UI. | Use shared single-letter correction in Spotlight. Keep word-level comparison but provide standard support on selected missed characters. |
| `src/features/morse/fluency/CopyRun.tsx` | Copy feedback uses `copy-feedback` text comparison, percentage and Continue. | Keep useful prompt/response comparison; add same selected-letter learning treatment when the judged answer maps to an actual letter. Do not fabricate a unique culprit for shifts/ambiguous alignment. |
| `src/features/morse/fluency/FreePlay.tsx` | Key→text and text→audio without score. | Preserve no-scoring contract; invalid/unknown patterns can offer reference-level teaching, **not** count as wrong answers. |
| `src/features/morse/reference/MorseReference.tsx` | Compact A–Z cards already have large glyph, canonical pattern, mnemonic phrase and shared Play sound. | Good compact reference precedent. Consider using the same character-body primitive in reference and correction, with separate wrappers. Reference remains read-only. |
| `src/features/morse/MorseCharacterPacket.tsx` / `MorseMnemonic.tsx` / `MorsePhrase.tsx` / `MorsePlayButton.tsx` | Full learning packet, rhythmic verbal mnemonic, SVG grammar and 44px audio button already exist. | **Reuse**, do not author a parallel mnemonic or sound control. One component may show a subset of content by *context*, but not different semantics or random styling per mode. |
| `src/domain/morse/fluency/progress.ts` + `session.ts` + `focus.ts` | Existing `fluencyNeed`: never-heard coverage priority, accumulated misses, recent correct latency, number of exposures and misses from formal/lesson state; deterministic weighted run generation. | Useful foundation for **auditory Fluency**, but cumulative `heard/correct` counts do not reveal whether E has just been right five consecutive times. Not a cross-direction letter-recall scheduler. |

This inventory counts distinct *implementations* rather than asserting a screenshot defect was manually viewed. A real rendered matrix is a required next step.

## 3. Target information architecture

### Morse Topic — first screen

**Heading:** Morse
**Progress:** `A–Z · 18 of 26 learned` / `A–Z · 26 of 26 learned` — derived from canonical settled/acquired letters, never from number of games played. A subdued separate one-line status may distinguish `Alphabet learned`, `Test available`, `Completed`, or `Repair needed` if genuinely supported by the existing journey. **Do not invent a global Morse mastery %.** If the all-26 course has been traversed but some letters are still owed, report the actual settled count rather than falsely showing 26 acquired.

**One recommendation:** A single directly launchable action, state-sensitive: continue lessons during acquisition; a brief letter-practice round when weakness is genuinely evidenced or selected; formal checking when appropriate to earn the A–Z claim; otherwise a specific Send/Receive challenge. Distinguish formal `Test A–Z` as such when it is the selected recommendation and always permit `Practice letters` independently. An already-banked user must always have one-tap letter practice, whatever game is recommended.

**Compact activities:** Proposal for owner review: `Practice letters`, `Send`, `Receive`, `Free play`; existing `Challenges`/Sprint/Ladder/Groups remain available through a plainly named secondary disclosure or are represented by the appropriate direct challenge when recommended. This **proposes an adjustment to the four direct #201 links** — it is **not** approved merely because #201 embedded Play was approved. Do not build until owner chooses exact route treatment.

**Reference:** `A–Z reference` as an obvious direct action. During acquisition show the current/next lesson and a compact lesson outline. Once acquired, historical lesson path and word checkpoints are behind `Lessons` (expandable/on demand), not the default content occupying the main view.

**Advanced/help:** Formal full Test/Quick Review, pace/listening spacing, per-mode statistics, how the programme works, source and limits remain accessible but are disclosed only at their real point of use.

### Interaction budget

- Above the fold at 390 CSS px: one progress readout, one dominant action, short activity controls, and direct A–Z reference if viewport permits. Do not demand that all 13 lessons be visible there.
- One polished primary per view; no competing `Start`, `Go`, `Recommended`, `Next` badges all shouting at once.
- Each activity requires a short **name**; secondary description only where needed for a meaningful distinction. Do not repeat the verb in title, label and prose.
- Active run: small mode label and `3/10`, dominant stimulus/key/input, stable feedback area, discreet exit. Avoid another paragraph of instructions after the learner has performed the interaction.
- Results: first useful outcome and one `Another round`/relevant next action. Optional back, details or choices at quieter weight. No moralizing `failed exam` presentation.
- Direct routes must return to the same Topic context, not return into another mode-picker unexpectedly; preserve Android Back behavior and interrupted-key safety.

## 4. One canonical Morse teaching/correction system

Build a single shared semantic family, provisionally `MorseCharacterSupport` (pure presentation) and `MorseCorrection` (response-context wrapper). Names are proposals, not mandated final filenames.

### Full character treatment (mandatory on an individual-letter miss)

1. **Correct glyph** prominently, e.g. `Y`.
2. **Large canonical dit/dah notation**, e.g. `— · — —`, using current `canonicalNotation`, not a new notation mapping.
3. **Existing rhythmic verbal mnemonic**, using `MorsePhrase` / `verbalMnemonic`, with established beat alignment; do not substitute an invented rhyme, a raw count or a second version.
4. **The existing MorsePlayButton**, accessible and with actual Web Audio, including stop/replay and errors; allow repeated listens before Continue.
5. One short contextual line naming the attempted versus correct value **if different and meaningful**. Put the attempted value in subdued visual weight; the correct value should dominate.
6. **Continue** after a miss. The correction remains until acknowledged; no timed removal. The key/input stays blocked through acknowledgment and transition.

### Variants: shared content, different disclosure contract

| Context | Before response | Correct response | Wrong response |
| --- | --- | --- | --- |
| First-exposure Learn | Full support intentionally visible | Quiet `Correct` + current safe auto-advance | Full shared correction; stop and let learner replay |
| Cued Learn / formal Test | Only cue rung's **permitted** support; no answer leak | Quiet correct, existing bounded auto-advance | Full shared correction **after grade**, independent of future question cue |
| Adaptive Practice letters | Uncued by default; optional Help means assisted/not counted as an independent hit | Quiet `Correct`; no large card | Full shared correction |
| Word checkpoint / Send Spotlight | A letter within a word | Quiet correct | Full shared correction for that letter |
| Audio Receive / recognition | Play control must conceal correct glyph in accessible label pre-answer | Quiet correct | Full shared correction after grade |
| Word/phrase/group miss | Show target vs received or individual marks | Concise mode-appropriate result | Identify the **verifiably** wrong characters and show the shared correction for a selected letter. No need to plaster a six-letter screen with six teaching cards |
| A–Z reference | Fully visible, read-only | N/A | Same letter/pattern/mnemonic/audio body without verdict/Continue |
| Free play | No correct target exists | N/A | No arbitrary incorrect grade; show unknown sequence or reference teaching on request |

**Visual reduction:** The current `CharacterStage` combines glyph, phrase with beats, beat SVG rail, printed canonical notation and spoken rhythm. It works as a teaching precedent but **duplicates representations**. In the new default correction render only glyph + *one* prominent printed pattern + mnemonic + audio; reserve the extra timing SVG/phonetic transcription for deliberate first-exposure explanation or accessible disclosure if testing demonstrates genuine teaching benefit. This is a proposed simplification, not authority to erase the existing grammar.

**Accessibility:** The audio playback button for a listening *question* must never name the hidden letter in accessible text. After grading it may name the letter. No correctness conveyed by colour alone; aria-live should announce the correction once, not read redundant SVG captions. All targets ≥44px, visible focus, readable at 200% scaling, reduced motion, 320/390px without horizontal clipping. Default auditory playback must not auto-start over a voice announcement or be unusable offline.

### Component architecture

- Domain content authority: `MORSE_LETTERS`, `canonicalNotation`, `verbalMnemonic` and `MorsePhrase`.
- Audio authority: `MorsePlayButton`, `useMorseAudio` and `MORSE_AUDIO_RUNTIME.md`; adapt ownership for cases using the dedicated Fluency player but do not create competing playback behavior.
- Presentation authority: shared pure character treatment + shared correction shell; mode adapters pass `glyph`, `attempt`, `status`, `audio`, and gated `onContinue`.
- Response lifecycle authority: `useKeyedResponse` / `MorseKeyInput`; do not regress held dah release, bleed-through taps, correct-hold timing or keyboard equivalence.
- Keep formal Test cue selection/evidence separate from presentation. Reuse the same error UI **without** letting presentation code qualify Test completion.
- Tests should assert shared component usage or explicit documented exceptions, not merely near-equal CSS snapshots.

## 5. Adaptive letter practice — no calendar scheduler

### Entry and modes

A single **Practice letters** entry is always available for a valid Morse topic. Its default should be a fast 10-prompt, unscored practice round appropriate to the learner's acquired letters. Simple optional selector: `Key` (letter → dits/dahs), `Read` (printed pattern → letter), `Listen` (audio → letter). These are **different knowledge/response directions** and must not share per-letter proficiency statistics. A beginner is restricted to canonically acquired/eligible letters and may proceed through original Learn; a fully acquired learner can use all A–Z. A user with no practice observations gets a balanced starting selection, not a fictitious personalized score.

This is **practice rather than the formal Test**. Never write `itemEvidence`, retention/status, `completedAt`, qualifying directional evidence, `morseReview`, `lessonProgress`, or `acquisitionReadyAt` from a practice round.

### Minimal durable state proposal (requires schema/merge design)

A separately namespaced, optional **formative-only** practice object with independent character records for the three directions:

```ts
type PracticeDirection = 'key' | 'read' | 'listen'
interface CharacterPractice {
  outcomes: boolean[]         // last 8 independently graded trials; oldest first
  shown: number                // bounded/safely parsed non-negative count
  lastShownSequence: number    // event-order index, not calendar time
}
interface MorsePractice {
  schemaVersion: 1
  sequence: Record<PracticeDirection, number>
  characters: Record<PracticeDirection, Partial<Record<MorseLetter, CharacterPractice>>>
}
```

Correct/wrong streaks are derived from the `outcomes` tail; do not store duplicate conflicting counters. No timestamp is needed. Versioning and unknown/legacy record sanitization must be tested; coordinate parser, import/export, storage/sync and #113 IndexedDB ownership before choosing whether the optional field belongs on `Topic` or under an existing validated formative namespace. **Do not repurpose auditory-only `morseFluency.characters[glyph].heard/correct` into a claimed multi-direction mastery record.** Existing data should remain intact, and missing data means unknown rather than zero competence.

### Proposed transparent selection rule (subject to deterministic simulation)

For letter `g` and direction `d`, let `m5` be misses within its latest five **independently graded** attempts; `cw` consecutive wrong at the tail; `cc` consecutive correct at the tail. Define:

```
weight(g,d) = clamp(
  0.35, 10,
  (1 + 1.5*m5 + min(cw,4)) / (1 + 0.5*min(cc,5))
)
```

Illustration: **E with five correct in succession** has weight `0.35` (floor); **Y with four consecutive misses** has weight `10` (cap), before exploration. Thus Y is substantially more likely to be selected, while E is **never deleted** from practice. These coefficients are starting product heuristics, not scientifically validated estimates of memory strength. Compare seeded simulation distributions and tune for feel before freezing thresholds. Never display these numbers as a user-facing mastery or competency score.

For each run, propose roughly **75% need-weighted draws and 25% coverage/exploration draws** (least recently presented letters by `lastShownSequence`, with deterministic seeded tie-breaking), rejecting immediate repeats and preferably inserting two other eligible letters between repeated misses unless the roster is too small. Newly eligible/unseen characters receive fair coverage without drowning out repeatedly missed ones. The exact ratio/cooldown should be exercised on A–Z and 1–4-letter eligible rosters; don't allow one wrong answer to monopolize a ten-prompt round. Select the queue incrementally or precompute a deterministic queue then update needs between subsequent questions/runs; **do not precompute all future difficulty against a stale snapshot**.

If the learner uses Help before submitting, or playback is interrupted, do not record a clean independent correct streak for that attempt. In a normal Listen mode, hearing the target is the *stimulus*, not a hint. Multiple legitimate replays can be tracked separately for interpretation but do not automatically become errors. After a miss, pressing Play on the revealed correction has no scoring consequence.

If a prior Learn/Test miss is used as an initial focus signal, it is a *soft initial prior only*: several later independent practice successes should reduce the letter's practice weight even while the **formal** Test/repair record remains unchanged. Never use the lack of a follow-up formal Test to force Y into every practice round forever.

### Optional lightweight feedback

During a round show `4 / 10` and the stimulus; after each response give the shared feedback above. At round end: `8 correct · 2 to work on: Y, Q`, and `Another round`. If specific letters weren't objectively assessed, omit the names. Offer `Practice missed` as a voluntary next action, not a mandatory second deck. Do not print a percentage/rank on the Topic header, and do not label the learner `mastered` from five successes.

## 6. Data and claims: invariants that must survive

1. **A–Z acquisition vs formal evidence vs practice** must remain separate, including imported legacy learner data. Formal completion is permanent; a later bad practice run doesn't reset it or silently move retention.
2. No calendars, daily streaks, due dates, hidden time decay or session penalty for returning after months/years.
3. Practice is repeatable indefinitely. Every eligible letter remains reachable, even if its weight reaches the floor.
4. A learner's ability to key a pattern is not the same evidence as hearing a character or reading its printed pattern; no cross-direction score laundering.
5. Audio unavailable: visible printed correction/reference still works, an explanation is shown and the learner isn't penalized for interrupted/unavailable audio.
6. Copying a multicharacter string cannot falsely attribute every alignment mistake to a particular letter; only confirmed per-letter errors can create per-letter adaptive evidence.
7. Replay and Free Play remain separate non-destructive experiences. No automatic promotion of formative numbers to Roles, Morse formal Test, or auditory communication competence.
8. Local/offline and cloud merge work must not lose the existing library; tests must cover old/missing/partially corrupted state and concurrent independent updates.

## 7. Original proposed visual audit before design implementation (Impeccable Extract gate)

**Capture actual rendered UI** at 390×844 and narrow 320px (dark mode exact production tokens), and where material 200% text, reduced motion, landscape, and Pixel tap/input state. Produce a compare sheet for these states:

1. Fresh Morse opening and placement choice.
2. Partial acquisition (e.g. 8/26), normal lesson new character, supported prompt, uncued prompt, correct and wrong keyed answer, wrong listening answer.
3. Completed 26/26 but not qualified in formal Test.
4. Banked/returning after long absence — explicitly **no date-aware recommendation**.
5. Banked but formal repair needed — practice remains available, claims stay truthful.
6. Full Test pre-answer cued/uncued, wrong forward and wrong reverse, TestDone qualifying/nonqualifying/review.
7. Word-checkpoint warm-up and character error.
8. Post-alphabet FluencyHome, one-character Sprint miss, word/group miss.
9. Send Spotlight miss and continuous word/message mismatch/result.
10. Copy letter miss, phrase/word mismatch/result, audio replay/interrupt.
11. Free Play known/unknown pattern; reference list; reference single card/audio.
12. Back/exit after correction, double tap, long-held dah, screen rotation/background, audio unavailable.

For each screenshot, label the existing rendered component, the contradictory semantics or excess copy, the canonical replacement, and whether it is **must fix** / **preserve** / **optional simplification**. Apply Impeccable Extract to the production screen/component styles; explicitly compare extracted tokens with `DESIGN.json` and `src/styles/tokens.css`. Extract is an input for review, **not** authority to import new hues, fonts or button shapes. Static mockups from PR #212 are design proposals, not proof of runtime fidelity.

Deliver a simple before/after screen count/navigation diagram and a checklist of removed headings, duplicate feedback boxes, redundant glyph/pattern renderings, repeated copy, and unnecessary screen transitions. Owner approval of the **specific** 390px source-accurate redesign is mandatory before runtime UI.

## 8. Recommended implementation slices and dependencies

| Slice | Outcome | Gate |
| --- | --- | --- |
| **0 — Audit / design approval** | Baseline visual matrix, Impeccable Extract, compact entry and correction mockups. Mark each deletion/merge. Reconcile #201/#215 and current main. | **Owner approves exact 390px appearance and route semantics.** No code UI yet. |
| **1 — Canonical content and correction** | Pure shared `MorseCharacterSupport` + `MorseCorrection` with unified glyph/pattern/mnemonic/audio, mounted first in Learn/Test/checkpoint; cross-surface adapters for Send/Copy/Fluency. Preserve input and scoring. | Component/keyboard/audio regression tests and visual diff, no new practice feature. |
| **2 — Adaptive engine / persistence** | Pure `morsePractice` scheduler, direction-separated evidence, deterministic tests, migration/parser and offline/sync preservation; isolated Practice letters run. | Simulations and invariants prove no Test/retention changes; coordinate #113 storage changes. |
| **3 — Topic information reduction** | Exact approved progress → recommended → compact choices → reference; contextual lessons/Test; eliminate redundant Fluency hub where possible; one-tap Practice letters. | E2E paths for all learner states, 320/390 + Pixel acceptance. Avoid rewriting #201 work blindly. |
| **4 — Cross-mode polish/closeout** | Remaining rare errors, word-level focus, sound failure and summary states use canonical system; remove obsolete CSS/components, reconcile docs. | Full CI and user device acceptance, no parallel correction variants left unaccounted for. |

Prefer small, reviewable PRs from fresh main; never combine feedback component changes, evidence migrations and new navigation in a single unreviewable patch. Existing #201 and #188 device gates remain independently open until actually verified.

## 9. Deterministic acceptance scenarios

- [x] One-tap **Practice letters** for a banked 26/26 learner; no Test/lesson forced first. Full A–Z remains reference-accessible.
- [x] E correct five times in the same direction is much less common than Y missed four times, over reproducible seeded runs; E remains eligible and occasional.
- [x] Three successes on an originally weak character reduce its later weight; a subsequent miss raises it again, with no date effects.
- [x] Distinct Key/Read/Listen histories for the same letter; no fake independent success from Help, unsupported stimulus or interrupted audio.
- [x] Even a streak of misses does not produce immediate Y-Y-Y-Y unless the eligible roster makes spacing impossible.
- [x] Beginner roster never contains unacquired letters in the practice prompts; acquired-but-not-Test-banked and legacy-import states are truthful.
- [x] One shared corrected glyph/pattern/mnemonic/sound unit renders after **all objective individual-letter misses** in lesson, Test, checkpoint, Sprint, Send Spotlight and Copy letters, with documented exceptions for alignment-ambiguous multicharacter responses.
- [x] Audio Play/Stop can be retriggered on held correction and pre-answer listening ARIA never reveals the glyph.
- [x] Full/cued Test grading stays untouched, completes only under existing formal bidirectional requirements; practice cannot clear repair or earn roles.
- [x] Free Play creates no right/wrong grading, and errors don't masquerade as incorrect trials.
- [x] Topic progress says 26/26 acquired only when acquisition is truly ready, does not manufacture a global mastery score, and preserves permanent completed record.
- [x] No nested `choose activity` screens for direct core activities, multiple polished CTAs, repeated three-line explanations or overlong mode inventory on Morse landing.
- [x] Tests cover backward navigation, screen focus, 200% type, 320px width, haptic/long-press gating, reduced motion, audio interruption, offline behavior and existing learner-data round-trip.
- [ ] Before/after screenshots and Impeccable Extract comparison are attached to the implementation review; real Pixel acceptance recorded rather than inferred from static SVGs/browser CI.

## 10. Explicit non-goals / not authorized by this document

No new formal Morse qualification; no altered Test completion threshold or cue ladder; no certifying actual sending WPM; no aggressive reminder, time-based scheduling, XP, badges, or novel audio/haptic engine; no second standalone Morse app; no wholesale redesign of unrelated topic Test screens. Do not close #188, #201 or #113, or claim deployed/Pixel-accepted behavior from this planning PR alone.

**Original proposal decision (retained for provenance; compact activities implemented under the later owner request):** Approve the proposed compact four activities with `Practice letters` taking the place of a prominent generic `Challenges` route (keeping Challenge drills available in a quiet disclosure), or preserve the existing four direct #201 activities and place Practice letters as a separate quick action. All other key owner requirements in §1 are recorded as the proposed product brief.
