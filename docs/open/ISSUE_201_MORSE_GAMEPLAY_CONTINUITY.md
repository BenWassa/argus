# Issue #201 — Continuous Morse gameplay, post-alphabet handoff and engagement

**Status:** OPEN — owner problem confirmed on 2026-10-13. **S0 (handoff and discoverability) implemented 2026-10-14 without the mandatory 390px mockup review, because the owner asked for autonomous end-to-end delivery; it remains subject to owner visual review and real-Pixel acceptance.** S1–S6 are unbuilt and unchanged below.
**Issue:** [#201](https://github.com/BenWassa/argus/issues/201)
**Authority:** Proposed future Morse continuation/engagement experience and implementation acceptance. Shipped behavior remains defined by [MORSE_FLUENCY.md](MORSE_FLUENCY.md), [MORSE_INTERMEDIATE_PATH.md](MORSE_INTERMEDIATE_PATH.md), [ISSUE_188_MORSE_SENDING_GAMEPLAY.md](ISSUE_188_MORSE_SENDING_GAMEPLAY.md), [PROGRESS_ARCHITECTURE.md](PROGRESS_ARCHITECTURE.md) and [MORSE_AUDIO_RUNTIME.md](MORSE_AUDIO_RUNTIME.md). Do **not** interpret this proposal as a shipped feature or an alteration to their evidence boundaries.
**Audit:** current `main` as examined 2026-10-13; v1.5.0 shipped the initial guided Send/Copy/Fluency experience. Owner Pixel acceptance of #188 is **still outstanding**.
**Related:** #188 (existing sending-game delivery/Pixel acceptance), #119 (closed Fluency research), #21 (historical alphabet programme), #29 (historical/deferred formal auditory/sending competency), #191/#197 (Roles architecture), #113 (offline-first runtime).

## 0. Executive decision brief

**Problem:** For someone who finishes all 26 Morse letters, the visible experience seems to end, even though substantial gameplay already exists. Finite A–Z acquisition feels like the entire product. Current continuation is indirect and mode-oriented rather than explicitly progressive and continuously playable.

**Recommended product model:** **Learn → Play → Master** (conceptual jobs, **not** three new competing completion states). Learn the canonical finite A–Z topic; Play whenever interested with material appropriate to acquired letters; optionally build measurable sending, receiving and recognition fluency through progressively harder challenges. **Play never becomes complete, locked out or “due.”**

**First investment: fix the handoff and discoverability, not another suite of minigames.** After final acquisition and especially after a qualifying A–Z Test, show the actual next gameplay action. Put an explicit recommended challenge and visible Send/Receive/Free Play choices on the Morse Topic page. Only then expand adaptive suggestions, milestones and distinct new gameplay.

**Owner-provided non-negotiables:**
- After completing A–Z, the next useful action must be **clear and obvious**; no return to an apparent dead end.
- Keep self-paced discovery and replay: **no scheduled course**, forced calendar engagement, mandatory daily streaks or punitive missed-day mechanic.
- Games should support beginners through advanced practice, with differentiated learning value.
- Preserve the app’s precise dark-mode visual system, native raised key, audio/touch/haptic lifecycle, one restrained primary action and real-phone ergonomics.
- Do not turn formative gameplay into a claim of formal auditory or manual CW proficiency.
- Permanent major badges belong to the wider Roles design; do not create a second competing badge economy.

### Decision status

| Item | Status |
| --- | --- |
| Existence of post-A–Z engagement/discoverability problem | Owner-confirmed |
| Use existing gameplay rather than reimplement it | Recommended from repository audit |
| Learn / Play / Master as conceptual information architecture | Proposed; requires owner design review |
| Post-Test direct CTA, topic-page layout, level labels and exact visual treatment | Proposed; 390px mockup selection required |
| Distinct Sending / Receiving / Recognition progress readouts | Proposed; data definitions required |
| New milestones and optional content packs | Proposed, **not earnable/shipped** |
| New formal auditory/sending qualification | Not authorized by this issue |
| Runtime changes under #201 | **None** |

## 1. Repository audit — shipped, partial and absent

### Already present; do not duplicate

| Surface / module | Current capability | Relevant limit |
| --- | --- | --- |
| `src/features/morse/lesson/MorsePath.tsx` and curriculum packets | 13 progressive two-letter lessons, completed-path folding, four keyed word checkpoints after lessons 4/7/10/13 | Finite acquisition path; not a persistent gameplay entry |
| `MorseLesson.tsx` | Final acquisition end says “Every letter covered” and offers “Test me” / alphabet reference | Correctly distinguishes Learn from formal proof, but no direct next-game CTA |
| `src/features/test/TestDone.tsx` | Qualified Test completion, repair/review and truthful result cases | Terminal action “Back to today”; no contextual “Play Morse” handoff |
| `src/features/library/TopicPage.tsx` / `src/domain/study/journey.ts` | After acquisition, `Keep going` opens Fluency when banked; in other acquired states Play sits at text weight under More options | Primary wording is generic; curriculum still dominates body; access differs by formal Test state |
| `FluencyHome.tsx` / `FluencySurface.tsx` | “After the alphabet” hub with recommended Send stage, Copy levels, Free Play, speed drills | Separate mode hub; weak persistent journey, and Send all-cleared fallback recommends Messages |
| `src/domain/morse/fluency/send.ts` / `SendRun.tsx` | Five repeatable stages: Spotlight words (5), Word Flow (5), Phrases (3), Short messages (2), fictional Dispatch (3); ≥90% best marks a stage cleared | Formative accuracy best, not communication qualification or physical sending WPM |
| `src/domain/morse/fluency/copy.ts` / `CopyRun.tsx` | Seven levels: letters, common words, everyday words, phrases, sentences, numbers, numbers+punctuation; ≥90% best marks a level cleared | Levels remain playable; after all levels, primarily repeat and adjust listening spacing |
| `FluencyRun.tsx` / `session.ts` | Four repeatable auditory key-back drills: Sprint, Ladder, Words, Groups | Some measures assess recognition pace; audible key-back is **not** the same as audio-to-text Copy |
| `FreePlay.tsx` | Unscripted key→decoded text and text→audio | No optional learner-defined target/comparison/record |
| `progress.ts` / `focus.ts` | Per-character recognition latency/accuracy, bounded need weighting and per-mode bests | No common next-challenge model or distinct skill-area milestone record |
| `src/shared/haptics.ts` / `MorseKeyInput.tsx` | Semantic haptics where supported, one press/hold Morse key, response safety lifecycle | Pixel validation still matters; touch timing is not verified radio-key quality |

**Important distinction:** Alphabet *acquisition readiness* (26 known/settled letters) and **formal Test completion** are separate. Existing Fluency unlocks from derived `journeyFor(topic).acquisition.ready`, not the presence of `completedAt` and not raw `acquisitionReadyAt` alone. Any new entry condition must retain this compatibility for learners who predate the stored readiness field.

### Missing product behaviors to own in #201

1. A direct, intentional next step on the alphabet's final Learn end and **qualifying formal Test** end.
2. A stable Play affordance on the Morse Topic page at every permitted stage, with prominent post-acquisition recommendation.
3. A coherent continuation model that answers **what next / why replay / what improved** without a maze of mode names.
4. True early play with targets restricted to letters the learner has actually acquired; this was deferred from #188.
5. Cross-mode adaptive suggestions and meaningful ongoing objectives.
6. Persistent, non-fabricated sending / receiving / recognition milestones and contextual bests.
7. A few truly distinct advanced games, rather than repeated letter drills in new visual packaging.

### Ownership boundaries

- **#188** implemented selected *sending mechanics* and Dispatch in v1.5.0. Keep that issue open for **real Pixel acceptance** and reconcile any older issue text that says these mechanics are unbuilt. #201 owns the *cross-mode user journey*, **not** rebuilding those mechanics.
- **#119** is completed research/implementation precedent for perception, haptics, latency, automaticity and the formative-only store.
- **#29** is historical/deferred *scored* reception/sending: no claimed CW timing competence from touchscreen press lengths and no automatic promotion of formative game accuracy to certification.
- **#191/#197** decide whether higher-level Communicator role milestones ever include Morse achievements. #201 can define a possible data interface but **must not grant a role or new badge**.

## 2. Product architecture: finite learning, infinite practice

### Three distinct jobs

| Job | Purpose | Can finish? | Changes formal A–Z completion? |
| --- | --- | --- | --- |
| **Learn** | Acquire printed A–Z mappings using the existing canonical sequence and four checkpoints | **Yes**, when acquisition is finished | No; acquisition alone is not qualified Test evidence |
| **Play** | Send, receive and experiment with Morse; short replayable rounds and free composition | **No**: every activity remains available | **Never** |
| **Master** | Work toward **explicit bounded performance achievements**, e.g. defined unfamiliar listening material at a specified effective speed | Individual milestones can be earned; practice continues | **Never** without a separately authorized scored competency |

“Learn → Play → Master” is an information hierarchy. It must **not** add a global “Morse level” to the domain's status/retention schema. Finite Test and immutable `completedAt` keep their existing meaning. The proposed play/milestone state is supplementary and independently reportable.

### Learner-stage coverage

| Stage | Reality | Immediate default | Other voluntary choices |
| --- | --- | --- | --- |
| New starter (few letters introduced) | Only some symbols are known | Continue the current canonical acquisition | Small known-letter keyed drills when mechanically eligible |
| Developing (partial A–Z) | Knows a subset, can produce some real words | Continue acquisition + contextual “Try a word” when eligible | Known-letter Spotlight, controlled words, help and replay |
| Alphabet acquired, not formally banked | 26 letters acquired but Test claim may remain unearned | Show both **Test the alphabet** and **Play with words** distinctly | Send, Copy, free play, focused review |
| Formal A–Z completion just earned | Test success is a milestone, **not a full Morse ending** | **Start sending five words** as the primary continuation | Copy, browse activities, revisit Test |
| Returning after completion | No finite Learn action required | Recommended specific challenge informed by last useful play | Explicit Send, Receive, Challenges, Free Play; Test/reference under secondary controls |
| Advanced / all formative stages cleared | Existing levels/bests have no natural “next” | Unfamiliar material, higher listening rung or personal challenge | Freely repeat previous games, difficult-character practice and custom material |
| Repair state after a later Test miss | Formal Test needs repair but earned history remains true | Repair/Test visible and actionable | Play remains discoverable and must not silently qualify the failed Test |

**No arbitrary time gate or locked advanced picker.** Recommendations guide but do not restrict the user's choice.

## 3. Exact navigation and handoff contract

### A. Before all letters acquired

- Morse Topic opens with the current acquisition action as primary.
- Once a real eligible word can be formed from the current packet-acquired set, expose a **quiet but visible** “Try a word” action in context. It must not require all 26 letters.
- Use the derived current learned roster rather than hardcoded “after lesson N” logic. **Validate generated content against authoritative `lessonPackets()`/settled character state**, including imports, placement and replays.
- Play creates only formative results; no Test evidence, cue changes, lesson advancement or missed-letter clearance.
- “Continue acquisition” remains clear; playing a round never masquerades as another lesson.

### B. Final Learn sitting

Keep the formal boundary honest. When every letter has been introduced/settled, final Learn end currently says “Every letter covered” and “Test me.”

**Proposed:**
- Heading: **Every letter covered**
- Supporting: “You have worked through A–Z. Test can confirm your independent recall. You can also start using the letters in words.”
- Primary: **Test the alphabet** (while a qualifying Test is still the relevant acquisition claim).
- Secondary visible: **Send five words** → direct Spotlight words, without an intermediate chooser.
- Keep reference access secondary and avoid claiming formal completion.

### C. Successful qualifying A–Z Test

The key conversion moment. The current generic `TestDone` renders **Back to today**, so it fails to hand the learner to any of the Play capability they just unlocked.

**Proposed only when the Test result actually banks the Morse topic:**

~~~text
ALPHABET COMPLETE
26 / 26 characters learned
Your A–Z recall is now recorded.

NEXT: SEND YOUR FIRST WORDS
Use the Morse key to send five short words.

[ Send five words → ]

Listen & Copy     All Morse games
~~~

- The primary CTA routes directly into the initial keyed sending run and requires no additional decision screen.
- Keep completion claim/persistence identical to current `TestDone`.
- Do not show the “alphabet complete” success treatment for a merely finished lesson, an unqualified run, a review or a failed Test.
- For a multi-topic Test, avoid taking over the combined summary with a Morse-only CTA; surface it as contextual follow-up for the eligible Morse result, observing the single-primary-action hierarchy.
- Preserve **Back to Home/Today** as a quiet exit and browser/Android Back behavior.
- When returning from the first game, enter a useful Morse Play/Topic context rather than dead-ending on the old end screen.

### D. Other Test outcomes

- **Acquisition ready but Test still unqualified:** state exactly why the result did not qualify; offer Test/repair as appropriate, and separately **Play Morse** as formative.
- **Misses / needs repair:** preserve established targeted repair action; a Play round cannot certify or fix the formal claim.
- **Optional quick review:** remain a review; do not treat its score as a new formal completion or a global gameplay level.
- **Previously completed and retesting:** keep completed history intact while respecting current repair status.

### E. Every game completion

One recommendation and at most two quiet alternatives. Do not require extra taps for each character/word. A result should carry forward the learner's context.

1. **Result:** intended versus sent/received text where relevant, exact missed characters/words and one truthful metric for that mode.
2. **Meaning:** “New best”, “Five clean words”, “Rung cleared” or “These two letters still slow you down” **only when measured**.
3. **Recommended primary:** e.g. **Try Word Flow**, **Copy common words at 9 WPM**, **Practise Q and Y**.
4. **Secondary:** **Repeat** / **Choose a game**. A generic “Back to Fluency” should not be the only helpful exit.

### F. All available stages already cleared

- Never display a fake new “level 6/6” or leave the recommended-next button pointing indefinitely to the same unqualified activity.
- Offer a clearly labelled open-ended challenge based on an actual dimension: unfamiliar text, clean-run consistency, longer messages or higher effective listening spacing.
- Keep sending and receiving progression independent; a sending best is not evidence of auditory fluency.

## 4. Suggested Morse Topic page / Play information architecture

**Do not create a new full dashboard when the topic page can resolve discoverability.** Avoid stacking a second long stage-picker behind a generic `Keep going` button.

### After acquisition — proposed compact phone hierarchy

~~~text
INTERNATIONAL MORSE CODE
Alphabet  ·  Complete  ·  26/26

CONTINUE PLAYING
Next: Word Flow
Send five complete words without letter prompts.
[ Play next challenge → ]

YOUR SKILLS
Sending        Short words cleared
Receiving      Common words · 8 WPM
Recognition    Practising Q · Y · J

CHOOSE AN ACTIVITY
Send           See text, key Morse
Receive        Hear Morse, write text
Challenges     Focus and personal bests
Free Play      Create your own message

ALPHABET & REFERENCE
Replay · Reference · Full Test · Quick review
~~~

Readings above are **illustrative fictional examples**, not current data. Show a precise value only if supported; absent stats display an honest “Not tried yet,” **not** an inferred score. Do not display a circular “overall Morse 84%” indicator without a real denominator.

**Priority order:** a single next action → available activity families → quiet skill readings → original finite path (folded) and reference. Users who return can replay anything without walking a path again.

**During acquisition:** the original course remains primary, with a single contextual “Try a word” when eligible. **During repair:** preserve explicit formal repair while keeping play discoverable; do not visually imply practice is scored.

### Activity home (if retained)

The existing `FluencyHome` can serve as the expanded picker, but its title **After the alphabet** and “Send / Copy / Free play / speed drills” hierarchy should not be the only explanation of progression. Prefer user-facing **Play Morse**, with **Send**, **Receive**, **Challenges**, **Free Play** as plain-language families. Preserve the functional distinction between “hear it and key the pattern back” and “hear it and type what you understood.”

UI strings should say *what the learner does*, not unexplained mode jargon such as “rung” or “Fluency.” Numerical WPM labels may remain in an advanced listening control.

## 5. Complete game inventory and expansion filter

| Mode / game | Acquisition phase | Core mechanic | Current status | Reason to replay / next difficulty |
| --- | --- | --- | --- | --- |
| Individual-letter keyed retrieval | Early | Given written letter, tap/hold its Morse pattern | **Shipped in Learn/Test** | Consolidate known letters; no separate mandatory copy |
| Four guided word checkpoints | Specific acquisition milestones | Whole word visible, current letter highlighted | **Shipped** | Early application, replay, not a lasting game collection |
| **Spotlight words** | Currently only after A–Z | Five short highlighted words; character-by-character feedback | **Shipped** in Send | Fresh word set, fewer supports later |
| **Word Flow** | Currently after A–Z | Five unassisted, pause-delimited whole words; word-level review | **Shipped** | Longer/new words, consecutive clean runs |
| **Phrases** | After A–Z | Two/three words, deliberate word gaps | **Shipped** | More words, fewer aids |
| **Short messages** | After A–Z | Full sentences, transmit/compare | **Shipped** | Longer/unfamiliar messages, clean transmissions |
| **Dispatch** | After A–Z | Authored fictional communications text | **Shipped** | Different scenarios/content; non-official |
| **Copy: seven levels** | After A–Z | Hear audio, type letters → words → phrases → sentences → figures/punctuation | **Shipped** | Higher effective WPM, fresh text, accuracy |
| **Sprint** | After A–Z | Hear a letter, key it back, measure response latency | **Shipped** | Faster, steadier recognition and focus letters |
| **Ladder** | After A–Z | Ten audio prompts at adjustable spacing | **Shipped** | Increase effective speed, pinned character speed |
| **Words / Groups** | After A–Z | Hear and key whole words or random letter groups | **Shipped** | Longer sequences and reduced contextual guessing |
| **Free Play** | After A–Z | Key text to see decoding or type text to hear | **Shipped** | User-created material; no score or saved target |
| **Early Word Play** | After enough letters are settled | Spotlight words restricted to known roster | **New integration**, reuses Send mechanics | Play while studying, supported → unsupervised |
| **Weakest Link** | As performance exists | Personalized weak-letter practice, then transfer to words | **Partly shipped** via weighted sprints | Correct specifically troublesome items |
| **Message Challenge** | After A–Z | Varied unfamiliar text length/structure, receive or send | **Partly shipped** | Increasing message length and effective listening speed |
| **Quick Fire** | Any adequate acquired roster | Optional rapid short rounds; never timer-only | **Partly shipped** via Sprint; new variant optional | Personal pace and accuracy records |
| **Copy & Relay** | Intermediate/advanced | Hear a message → copy/interpret → key an appropriate displayed reply | **Not built** | Bidirectional use in one scenario |
| **Free Transmission+** | After suitable roster | Optional typed self-target → key → compare → replay | **Not built** | Unlimited learner-authored goals, still unscripted option |

### Expansion order

**First:** reuse and expose the shipped inventory effectively. **Second:** add early eligible content and mixed-mode recommendations. **Third:** build **Copy & Relay** as the most distinct new challenge (receiving *and* replying), then consider expanded Message Challenge and opt-in Free Transmission+.

Do not ship multiple new minigames merely to inflate a menu. Each must teach or exercise a **different** skill and have a distinct reason to replay.

### Example Copy & Relay loop (candidate)

1. Play a short incoming signal by ear (e.g. `REPORT POSITION`).
2. Learner types what they heard, with honest character-level comparison.
3. Show a plain-English **response target** (e.g. `AT NORTH GATE`); learner keys it.
4. Show target versus decoded output for **both directions**, highlighting inaccuracies without implying live radio exchange or certified procedure.
5. Recommend next exchange, focus on weak characters or repeat.

For an advanced variant, increase unfamiliar material and reduce guidance. Any user-composed reply interpretation is a **separate design/research problem**, not assumed by this issue.

## 6. Engagement, progression and measurement

### The continuing questions

- **What next?** One recommendation, derived from readiness and meaningful latest evidence.
- **Why replay?** A personal record, unfamiliar material, a skill gap, a content variation or a self-chosen challenge.
- **What changed?** Accurate single-purpose feedback; don't mix unlike measurements.

### Three independent practice dimensions

| Dimension | Valid candidate measures | Invalid shortcut |
| --- | --- | --- |
| **Sending** | Text→key decoded character accuracy, clean words/messages, correct word boundaries, longest clean run | Reporting phone press-duration as reliable physical CW WPM |
| **Receiving** | Morse audio→typed text accuracy, unfamiliar-material length and effective listening spacing at 20 WPM character speed | Calling keyed echo or visible pattern recognition audio comprehension |
| **Recognition** | Correct single-character responses, post-audio median latency, latency variance and problem characters | Global accuracy alone, timing including playback, or selectively replayed stimuli |

Do **not** average these into one mastery score. Sending and receiving progress may diverge naturally.

### Personal records: make “best” comparable

- Record **mode + difficulty/content tier + metric definition + result**, not a single global “high score.” Compare like-for-like (e.g. Copy common words at 9 WPM vs the same level and speed).
- A new rung/difficulty starts a new contextual record. A 95% result on easy words is not directly better than 88% on longer unfamiliar material.
- Show first round as a baseline; reserve larger celebration for a real improvement (current Copy implementation explicitly does this).
- Keep streaks **within a voluntary session** (“four clean words in a row”), not compulsory calendar streaks.
- Store missed-character summaries only where the grader genuinely identifies them; a general sending accuracy best does not automatically imply a per-character diagnostic.
- Offer optional history/records, but never invent a “daily activity” timestamp from an untimestamped formative store.

### Proposed milestone examples — thresholds are **not yet ratified**

| Candidate milestone | Objective and evidence needed | Scope/status |
| --- | --- | --- |
| Alphabet acquired | Every canonical letter acquired in Learn | Existing derived acquisition state |
| Independent A–Z recall | Current formal Test qualifies the finite printed bidirectional claim | Existing scored topic completion, not a new Play badge |
| First complete word | One formative text→key word transmitted correctly | Proposed practice milestone; requires a stored event or aggregate |
| Five clean words | Five consecutive **unassisted** whole words transmitted exactly | Proposed; clearly distinguish Spotlight support |
| First clean message | Unassisted complete message exact after proper word boundaries | Proposed |
| Reliable Copy at chosen rung | ≥90% on a predeclared number/length of **unfamiliar** audio→text samples at a specified effective speed | Proposed bounded standard; verify sample size/statistical integrity before award |
| Intermediate fluency | Predeclared sequence of unfamiliar messages at an increased rung | Proposed, not proof of over-the-air operation |

**Permanent achievement semantics:** an earned milestone stays in the record if a later formative practice round is weaker. Formal retention/repair stays independent. Suggested mastery must be honest about what the phone can measure.

**Roles:** if later approved by #191/#197, milestones may be input to Communicator progression; **no second badge per Morse game**, no coins, XP, leaderboards, fake ranks or mandatory schedule. The role's separate owner-approved competency boundaries take precedence.

### Recommendation policy (first-pass specification)

Choose one **recommended next** based on concrete, ordered rules; always permit another choice:

1. **Not ready** → current acquisition action; optionally a known-letter word if eligible.
2. **Acquired but formal A–Z not banked** → Test remains recognizable, Play is a separate optional action. After a nonqualifying run, don't falsely claim A–Z completed.
3. **Fresh post-completion** → first untried Spotlight Send, directly reachable from `TestDone`.
4. **Sending stage untried** → first untried stage unless the learner intentionally selected receiving last time.
5. **Weak known character evidence** → a brief appropriate focus round; then transfer to words if possible.
6. **Sending cleared, Receiving not** → next meaningful Copy level at existing spacing.
7. **Copy stagnating** → suggest lower spacing, specific recognized weak characters, or a different modality without undoing milestones.
8. **All finite stages cleared** → unfamiliar message challenge, next listening rung or a personal-best challenge; **do not regress to generic “Messages” forever**.
9. **Returning user preference** → respect explicit selection/recent activity before paternalistically routing all users back to Spotlight.

This is a **candidate ranking** requiring user testing and concrete event-data design. Keep results deterministic/pure and test priority collisions. Do not make stage clearances hard unlocks.

## 7. Content and editorial requirements

- A beginner's target corpus is the intersection of **meaningful words** and the canonical, currently acquired letter roster. Validate programmatically; no surprising untaught letters.
- Initial words should be familiar and genuinely readable. Use lengths and difficulties appropriate to the selected stage.
- Preserve the shipped seeded/deterministic material generators for reproducible tests. Extend with curated, typed templates rather than arbitrary generated nonsense.
- Send/Copy difficulty should vary along separate authored axes: number of letters/words, familiar versus unfamiliar material, hints, effective listening spacing, and figures/punctuation after introduction.
- Optional packs: everyday communication, navigation, weather, maritime and fictional field messages. A themed Dispatch line changes **content**, not UI materials.
- Never label invented fiction as authentic CAF/NATO/ISED/marine VHF operating instructions. Authentic procedural material belongs with its separate sourced programme and licensing/provenance review.
- Validate uppercase normalization, punctuation support, whitespace, unknown glyphs, duplicates, word boundaries, exact response diff and meaningful response metadata. No external API required to generate core game rounds.

## 8. Design system and interaction contract

Source of truth: [DESIGN.md](../../DESIGN.md), [DESIGN.json](../../DESIGN.json), `src/styles/tokens.css`, existing Morse input and Run components. Mockups cannot authorize new palette tokens.

- **Gunmetal:** `#101215` page; `#16191d`/`#1d2126` restrained plates; `#0b0d10` recessed fields.
- One polished-steel **primary/current** emphasis per screen. Use existing Mineral/Clay correctness/error semantics. Reserve Tarnish for repair/decay, never streak rewards.
- Sans for words/actions; mono for compact counters, timing and metrics. Avoid faux terminal, arcade HUD, colorful cards and military-map/stencil themes.
- Keying remains the **existing large pressed tap/hold Morse control**, not a new gimmick. Haptics through `src/shared/haptics.ts` with capability detection; everything meaningful stays visible without vibration or audio.
- Motion only for state changes (approximately existing 150–220ms patterns); support `prefers-reduced-motion` without erasing state.
- Default phone target **390px portrait**, with **320px no-overflow** and responsive short-height testing. Main target, received text, big key and essential one-step control fit without **ordinary** vertical scrolling. When text zoom/accessibility requires scrolling, never clip text or make tap targets too small.
- During Spotlight, entire word stays visible; highlight current letter. Word Flow must not interrupt with per-character verdict or secretly use the expected pattern length for segmentation. Phrases/messages emphasize current word but retain message context.
- Result/feedback occupies a stable region; no jumping key, accidental multi-touches, premature next prompt on held dah, phantom key-up after app backgrounding, or silent duplicate letter due to pause boundaries.
- Keyboard/switch/screen-reader interaction is required. Ensure live-region feedback announces appropriately without repeating each character change; maintain readable help, text target and audio fallback.
- Android system Back must move one meaningful level (run → game selection → topic), not exit the PWA unexpectedly. Navigation/interruptions must not save incomplete runs as achievements.

### Mandatory mockup review before runtime changes

Produce **realistic 390px dark-mode Argus mockups** showing:
1. final lesson end (not yet Test qualified);
2. qualifying scored A–Z completion handoff;
3. Morse Topic with permanent recommended challenge/activity navigation, including banked and repair variants;
4. active Spotlight vs uninterrupted Word Flow/Copy & Relay (if selected);
5. miss/result, recommended next action and all-cleared/returning state.

Owner selects the direction **before** implementation. Mockups must use existing tokens and show actual component density rather than decorative concept illustrations.

## 9. Data ownership, persistence and safety

### Non-negotiable existing evidence boundary

Gameplay results may write formative **`Topic.morseFluency`** state only, unless a separate architecture decision introduces another explicitly nonformal store. They must **never** mutate:

- `Topic.status` / formal completion / `completedAt`;
- `itemEvidence` / `DirectionEvidence` / `lastTestedAt` / Test history or scheduler state;
- canonical `lessonProgress`, `lessonSitting`, `morseReview` or `acquisitionReadyAt`.

The current `FluencySurface.tsx` is the only write boundary for existing Fluency. Reuse that separation and extend architecture/boundary tests for any new run. Do not move or overwrite formal evidence in service of gamification.

### Proposed necessary additions (subject to schema decision)

Current `MorseFluencyProgress` holds `rung`, per-character observations and a `bests: Record<string, number>`. That suffices for existing bests but **not** full milestone provenance, per-difficulty apples-to-apples records, last voluntary selected mode or chronological practice history.

Before implementation decide minimal additive data, e.g.:

- `preferredActivity` / last useful voluntary game, **optional**;
- contextual records keyed by game, content tier, speed/rung and exact metric, with explicit version/definition;
- bounded milestone qualification evidence (criterion version, performance aggregate and first-earned timestamp) **only for ratified milestones**;
- limited timestamped latest finished round only if the product genuinely needs a truthful “last played” feature.

Avoid an unbounded event log or duplicate completion schema. Define parse/validate/export/import and Firebase conflict behavior before writing new durable fields. Do not infer formative activity dates from existing count-only latency arrays. Imported libraries missing fields should render fully with truthful placeholders.

**Offline:** provisioned offline use of these game sessions should be tested; global cold-offline guarantees remain #113 and cannot be claimed as delivered by this issue. No external leaderboard, game server or required network round-trip.

### Manual CW quality limitation

`MorseKeyInput` uses touch duration to classify dit/dah but does **not** retain verified press/gap timing as a calibrated measurement of physical radio-keying speed. Manual touch-screen play can measure **decoded text correctness**, not justified WPM transmission proficiency. Only the separate scored-competency architecture could establish a formal speed/timing claim with suitable validation.

## 10. Bounded delivery plan

| Slice | Priority | Scope | Verification |
| --- | --- | --- | --- |
| **S0 — Handoff and discoverability** | **P0 — implemented 2026-10-14 (partial; see note under table)** | Qualified A–Z Test → direct first game; last lesson → clear Test vs optional game; Morse Topic recommendation + permanent Play choice; preserve banked/repair states | New e2e for final Learn, qualifying/nonqualifying/review/Test variations and direct routing. 320/390px screens. **No new games or schema** |
| **S1 — In-course play** | **P1** | Known-letter Spotlight rounds, contextual Try a word, eligibility selector from settled characters | Unit tests over every packet/placement/import and never-untaught material; no evidence writes |
| **S2 — Smart continuation** | **P1** | Pure recommended-next derivation across Send/Copy/weak characters; contextual personal bests and honest skill headings | Priority precedence, all-cleared fallback, absent-data and incompatible-metric tests; single primary CTA |
| **S3 — Milestone/record design and minimal durable schema** | **P1** | Ratify independent skill evidence/thresholds; ship only qualifying, meaningful permanent milestones and versioned contextual records | Import/export/Firebase compatibility, evidence-boundary tests, zero fabricated achievements |
| **S4 — Distinct advanced loop** | **P2** | Copy & Relay as one coherent receive → respond scenario, reusing engines | Transcript/response compare, audio lifecycle, word-boundary safety, real Pixel validation |
| **S5 — Content and creative options** | **P2** | Unfamiliar message packs and optional custom Free Transmission+, prioritizing what usability tests support | Corpus QA, provenance, exact diff, targetless Free Play stays intact |
| **S6 — Formal advanced qualifications** | **Separate** | If ever desired, research authoritative scored boundaries for reception/sending, content sampling and hardware assumptions | Separate owner decision/issue; **not** #201 |

**S0 delivery note (2026-10-14).** Shipped: Test-banked → *Send five words* (one tap into Spotlight words via the `fluency` run target's new `send` stage); final Learn screen → quiet *Send five words*; non-banked real Morse Test results → quiet *Play with words*; Play row moved out of *More options* on the Topic page; all-cleared Send recommendation now targets the weakest stage (an S2 fragment, pure and schema-free). Not shipped: the full Topic-page recommendation/skills layout in section 4, a specific-challenge primary label (the primary is still *Keep going*), Receive-side handoff, and the mockup review. No new games, no schema.

**Do S0 before adding gameplay mechanics.** A sound starting UX may eliminate much of the perceived “ends after A–Z” problem with minimal runtime risk. Slice boundaries are planning recommendations, **not authorization to build now**.

## 11. Acceptance scenarios — implementation must prove

### Handoff / discoverability

- [ ] Fresh learner sees the canonical alphabet action; new optional play never displaces acquisition prematurely.
- [ ] After initial eligible letters, a word round using **only** settled letters is discoverable without hidden navigation.
- [ ] After final Lesson 13: text explains “acquired, not yet formally qualified”; Test is prominent, Play still accessible.
- [ ] **After a successful qualifying A–Z Test:** the next on-screen primary Morse-specific CTA launches the actual game in **one tap**, without returning through Home/Fluency chooser.
- [ ] Nonqualifying scored Test, review and repair outcomes do **not** show a false A–Z completion celebration or falsely clear evidence.
- [ ] Returning completed user opens Morse and sees **specific next challenge + explicit Send/Receive/Free Play** without scrolling past all 13 lessons.
- [ ] Full course replay, reference, Full Test and Quick Review remain possible without changing their original claims.

### Continual play / honesty

- [ ] Completing every finite Send/Copy stage does not result in a dead end, inaccessible replay or perpetual “Recommended: Short messages” without context.
- [ ] Recommendations are deterministic, optional and based on available real evidence; zero activity yields a sensible first challenge, not fake records.
- [ ] Sending, receiving and recognition findings remain visibly distinct; no invented all-in-one mastery percent.
- [ ] A personal best is comparable at the same content difficulty and speed; new difficulty does not erase older record.
- [ ] Any new permanent milestone uses a predeclared objective/threshold and qualified data; a later poor practice run does not revoke it.
- [ ] No “do your streak today” pressure, leaderboards, XP, multiple badge economies, fake skill certification or nonconsensual calendar tasks.
- [ ] A user can select any eligible activity even if it is not recommended and repeat a cleared/easy activity indefinitely.

### Engineering / phone acceptance

- [ ] Formative play leaves Test, item evidence, retention, acquisition and topic completion **bitwise unchanged** across the test scenarios.
- [ ] Last-held dit/dah, next prompt, pause delimiter, background/resume, rapid taps, navigation and retries never duplicate characters or score partial sessions.
- [ ] 390px Pixel and 320px automated viewport tests prove target/key/actions visible without page jumps; zoom/reduced-motion/screen-reader/audioless states remain usable.
- [ ] New persistent fields (if any) round-trip import/export and sync safely; older library payloads still parse.
- [ ] Real-device Pixel owner acceptance of current #188 sending gameplay and any new continuous-keying behavior before marking those lanes complete.
- [ ] Documentation and issue status are reconciled with actual merged code. **Docs PR is not gameplay delivery or production deployment.**

## 12. Suggested evaluation after launch

Evaluate whether the product answers user intent, rather than optimizing app opens for their own sake:

- In a test of a newly completed A–Z learner, can they identify and launch the next useful activity **without coaching**?
- Is the first game accessible immediately after the qualifying completion, with no incidental Home detour?
- Do returning learners find Send, Receive and Free Play independently?
- Does a second session contain a deliberate replay/new challenge rather than wandering between menus?
- Do users understand that sending accuracy, receiving by ear and the alphabet's formal Test are different claims?
- Do no-audio, no-haptics, impaired-motion and phone-interruption scenarios preserve understandable progress and controls?

Record usability findings and real-device defects on #201/#188 without assuming qualitative success from unit coverage alone.

## 13. Research and file map

**Shipped contracts and issue history**
- [#188 sending gameplay](https://github.com/BenWassa/argus/issues/188), [maintained sending design](ISSUE_188_MORSE_SENDING_GAMEPLAY.md).
- [Morse Fluency](MORSE_FLUENCY.md), [Intermediate path](MORSE_INTERMEDIATE_PATH.md), [Morse programme plan](MORSE_PROGRAMME_PLAN.md), [Progress architecture](PROGRESS_ARCHITECTURE.md), [Audio runtime](MORSE_AUDIO_RUNTIME.md).
- [#119 post-acquisition research](https://github.com/BenWassa/argus/issues/119), [archived research](../closed/ISSUE_119_MORSE_POST_ACQUISITION_FLUENCY_RESEARCH.md).
- [#21 acquisition](https://github.com/BenWassa/argus/issues/21), [#29 deferred formal competency](https://github.com/BenWassa/argus/issues/29).
- [#113 offline-first](https://github.com/BenWassa/argus/issues/113), [#191 role architecture](https://github.com/BenWassa/argus/issues/191), [#197 expanded role research](https://github.com/BenWassa/argus/issues/197).

**Key implementation files (as of 2026-10-13)**
- `src/features/morse/lesson/MorseLesson.tsx` and `MorsePath.tsx`; `src/features/test/TestDone.tsx`.
- `src/features/library/TopicPage.tsx`; `src/domain/study/journey.ts`.
- `src/features/morse/fluency/FluencyHome.tsx`, `FluencySurface.tsx`, `SendRun.tsx`, `CopyRun.tsx`, `FluencyRun.tsx`, `FreePlay.tsx`.
- `src/domain/morse/fluency/send.ts`, `copy.ts`, `session.ts`, `progress.ts`, `focus.ts`, `timing.ts` and `corpus.ts`.

**External precedents: guidance, not imported code or proof of app effectiveness**
- [ITU-R M.1677-1 — International Morse code](https://www.itu.int/rec/R-REC-M.1677-1-200910-I/en).
- [CW Academy Fundamental curriculum](https://cwops.org/wp-content/uploads/2025/04/CW-Academy-Fundamental-Curriculum-v2.0.htm).
- [Morse Code World Trainer](https://morsecode.world/international/trainer/trainer.html) and [Sending Practice](https://morsecode.world/labs/sending-practice/).
- [LCWO](https://lcwo.net/).
- Sources, limitations and research alternatives are further documented in the #119 historical research.

## 14. Open decisions for owner UX review

1. **Topic-page layout:** whether the proposed recommendation/activity area precedes a fully folded A–Z curriculum, and how it appears during repair.
2. **Post-Test result:** whether the first direct game CTA is “Send five words” or another unmistakable action. It must be direct and exact either way.
3. **In-course play:** which earliest milestone is both pedagogically useful and technically safe for enough real words; decide on candidate word corpus after actual packet validation.
4. **Progress indicators:** which one-line sending/receiving/recognition readouts are supported by current durable data versus require new proof.
5. **Milestones:** exact objective sample sizes/accuracy thresholds; placement in Morse and possible relation to Communicator role. No new earnable claims until ratified.
6. **Next expansion:** Copy & Relay versus Free Transmission+ after the P0 UX is tested on Pixel.
7. **New persistence:** whether short contextual records and next suggestions need new durable fields; prefer a minimal additive versioned schema.

**Status rule:** This is a detailed current planning contract for #201. Keep it in `docs/open/` while decisions/implementation remain active; move to `docs/closed/` only after the workstream is completed/superseded and update all links. Do not mark functionality shipped, Pixel-approved or deployed based on documentation alone.
