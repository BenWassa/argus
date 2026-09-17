# Issue #105 — Morse adaptive placement assessment

**Status:** scoped / implementation not started  
**Date:** 2026-09-17  
**Issue:** #105  
**Parent:** #21

## Executive decision

Argus should add a bounded **Morse placement assessment** for returning and previously experienced learners.

The assessment exists to answer one question:

> **Where should this learner enter the existing 13-lesson A–Z acquisition programme?**

It does **not** answer whether the learner has completed the formal Morse topic. The existing competency boundary remains:

> Can independently recall all A–Z printed Morse mappings in both directions.

Placement may prove enough acquisition knowledge to skip teaching material. It must not create formal Test directional evidence, scheduler success, drilled/completed retention state, auditory competence, sending competence or WPM evidence.

The course remains locked and sequential. Placement selects the first lesson the learner still needs; it does not create an open lesson picker.

---

## 1. Owner decisions — ratified

These are product authority for implementation.

### 1.1 Experience question

Use exactly three learner-facing choices:

- **New to Morse**
- **Know some Morse**
- **Know most Morse**

`New to Morse` bypasses placement and starts the ordinary programme from Lesson 1.

`Know some Morse` and `Know most Morse` select different assessment strategies. The self-report controls assessment efficiency only. It never grants progress by itself.

### 1.2 Uneven knowledge

Place the learner at the **earliest demonstrated weakness**.

A learner may know later characters while having an earlier gap. Later knowledge does not let them bypass the earlier prerequisite.

Example:

- learner keys `X` and `Z` perfectly;
- learner repeatedly cannot produce `E`;
- placement remains at Lesson 1.

The locked curriculum model is preserved.

### 1.3 Strictness

Use a **balanced** policy.

One isolated mistake does not automatically fail a lesson or reset the learner to the beginning. An uncertain character receives later confirmation after intervening material.

Persistent uncertainty is meaningful. Later unrelated successes cannot compensate for a repeated earlier weakness.

### 1.4 Placed-out lessons

For V1 presentation and curriculum routing, material successfully placed out of counts as **Completed**.

This does not mean the learner literally performed the ordinary lesson sittings. Implementation should preserve minimal placement provenance so a future UI can distinguish:

- completed through the ordinary lesson programme;
- completed through a placement assessment.

That distinction is not surfaced in V1 and does not justify redesigning the lesson path now.

### 1.5 Result override

The learner does not manually override placement upward or choose arbitrary later lessons.

The assessment resolves the entry point and the canonical curriculum continues from there.

No `Start later anyway` control belongs in V1.

---

## 2. Why this belongs in Argus

The current Morse programme assumes a learner acquires A–Z through Argus itself. That is correct for a new learner but inefficient for two realistic cases:

- someone already knows some Morse before installing Argus;
- an existing Argus learner loses/reset local progress and needs to reconstruct a reasonable course position.

The second case is the immediate owner use case.

Without placement, the only safe option is to replay lessons the learner already knows. The opposite solution, freely unlocking lessons, would weaken the deliberate sequential curriculum and complicate review/readiness semantics.

Placement provides a middle path:

- retain the locked curriculum;
- require observable performance rather than self-reported mastery;
- find the first genuine gap;
- mark the demonstrated prerequisite prefix complete;
- continue through the normal learner journey.

---

## 3. Current architecture constraints

Implementation must work with the existing progress architecture rather than introducing a second course system.

### 3.1 Canonical curriculum authority

`lessonPackets()` is the authority for the 13 A–Z lessons and current character order.

`morseLessonPath()` derives visible completed/current/locked state from that same curriculum and durable acquisition state.

Placement must derive all lesson numbers, item ids, letters and checkpoint eligibility from these existing functions. Do not copy a static A–Z order into placement code.

### 3.2 Acquisition and formal evidence are different truths

Current Morse learner state intentionally separates:

- `Topic.lessonProgress`: formative per-item acquisition support;
- `Topic.lessonSitting`: active 10-retrieval sitting bookkeeping;
- `Topic.morseReview`: formative cross-sitting review/listening history;
- `Topic.acquisitionReadyAt`: permanent acquisition-ready anchor;
- `Topic.itemEvidence`: formal scored directional evidence;
- scheduler/history/status fields: retention state.

Placement is an **acquisition** mechanism.

It may legitimately establish that teaching support is no longer needed for prerequisite items. It may not satisfy formal `DirectionEvidence` or retention requirements.

### 3.3 Current consolidation rule

Normal new learners are not acquisition-ready merely because each item once reached `settled`. Current policy also requires later-sitting printed consolidation for items known to `morseReview`.

Placement needs an explicit integration with this rule. Do not fabricate ordinary sitting history such as fake `introducedIn`, fake `laterCorrect`, or fake retrieval counts merely to make readiness pass.

A placement-verified item may be treated as having independently demonstrated acquisition for the purpose of skipping teaching/consolidation, but that fact should be represented honestly as placement provenance.

### 3.4 Shared learner journey

`journeyFor()` remains the interpretation layer for acquisition, evidence, retention and the next recommended action.

Placement should change canonical learner state once, then let `journeyFor()` naturally derive the new course position.

Do not add a placement-specific navigation/progress engine beside the learner journey.

### 3.5 Canonical persistence and cloud sync

Placement-derived durable state must live inside the canonical Argus learner library.

Do not add:

- a localStorage placement sidecar;
- a Firebase-only placement schema;
- per-device placement authority.

Parser/export/import/catalog reconciliation and the existing per-UID Firebase sync path must carry placement state as ordinary canonical learner data.

---

## 4. Entry and eligibility UX

### 4.1 Fresh Morse start

The experience question belongs at the **deliberate start boundary**, not on passive topic browsing.

Opening the Morse topic/reference remains non-evidentiary.

When a learner with no meaningful Morse acquisition/history deliberately starts the programme, present a compact choice such as:

**How much Morse have you learned before?**

- New to Morse
- Know some Morse
- Know most Morse

Avoid labels such as `beginner`, `intermediate`, or numbered levels. The question is about prior exposure and is only routing the diagnostic.

### 4.2 New to Morse

Selecting `New to Morse`:

- writes no placement evidence;
- starts/enrolls in the existing programme normally;
- enters Lesson 1 through the same canonical path as today.

### 4.3 Some / Most

Selecting `Know some Morse` or `Know most Morse`:

- begins the assessment;
- does not yet mark lessons complete;
- does not write ordinary lesson support or Test evidence while the assessment is running.

The assessment should be visually distinct enough that the learner knows it is a level check, but it is not a third top-level product mode. It is an onboarding branch into Learn.

### 4.4 Existing meaningful progress

V1 should not use placement to downgrade or re-place an established learner.

For an existing learner with legitimate Morse progress:

- normal journey/resume behavior wins;
- placement must never erase lesson progress, formal evidence, acquisition readiness, retention or history;
- if the implementation exposes a later manual `Check my level` entry, its result may only preserve or advance existing acquisition position and must never regress it.

The minimum V1 is acceptable with placement offered only from the fresh/start boundary. Do not broaden scope merely to add a general reassessment tool.

---

## 5. Assessment stimulus boundary

### 5.1 What placement should test

Placement should test the acquisition skill required to skip Morse lessons:

- printed **letter to Morse-pattern production**;
- using the existing direct `MorseKeyInput` interaction or the same shared categorical response primitive;
- without answer-bearing mnemonic, SVG or target playback.

This is the strongest direct match to what guided Learn is trying to establish before scaffolding can be removed.

### 5.2 What placement should not test

Do not require:

- sound-to-letter listening;
- sending timing/WPM;
- formal bidirectional completion coverage;
- sentence/phrase copying;
- advanced #29 material.

Listening is environment-dependent and remains formative. Formal pattern-to-letter direction is still proven later through Test. Placement should not become a disguised scored Test.

### 5.3 Feedback

Assessment feedback should be restrained.

Do not reteach the full mnemonic during the diagnostic because that changes the thing being measured. A miss may receive minimal acknowledgement before the item is rechecked later.

If a learner reaches the final placement and enters normal Learn, ordinary teaching support resumes there.

---

## 6. Placement policy

The implementation must define the policy as a pure deterministic module before UI wiring.

Exact thresholds are implementation parameters, not owner decisions, but the following invariants are fixed.

### 6.1 Earliest-weakness invariant

The persisted placed-out region must always be a **contiguous prefix of the canonical curriculum**.

Later correct answers may help characterize the learner but can never create holes such as:

- Lesson 1 completed;
- Lesson 2 incomplete;
- Lesson 7 completed.

The result is always:

- Lessons 1 through N complete from placement;
- Lesson N+1 is the first required lesson;

or all 13 lessons placed out.

### 6.2 One miss is uncertainty

A first incorrect answer marks the item uncertain.

It should return only after intervening prompts. Do not immediately repeat the same target after showing the result.

A later successful response can clear an isolated miss under the balanced policy. Persistent or repeated misses keep the item unresolved.

### 6.3 No compensation across lessons

A learner cannot offset weak `E` performance by answering many later letters correctly.

Scoring is not an average percentage over the alphabet.

Placement is a prerequisite boundary search.

### 6.4 Bounded diagnostic

The policy must have a deterministic maximum number of individual prompts/retries for each experience path.

Do not allow an uncertain item to create an unbounded assessment loop.

When evidence remains ambiguous at the retry cap, resolve conservatively to the earlier lesson.

---

## 7. `Know some Morse` strategy

This path should optimize for learners whose boundary is likely in the first or middle portion of the curriculum.

Recommended policy shape:

1. Start from Lesson 1 in canonical order.
2. Probe the current lesson's two novel characters without teaching support.
3. Interleave confirmation rather than asking the same item twice consecutively.
4. If both characters are clearly established, advance to the next lesson.
5. At existing curriculum milestones, use an integrated word/application confirmation where useful.
6. When a lesson contains a persistent unresolved character, that lesson becomes the placement boundary.
7. Stop rather than wasting time proving later knowledge that cannot change the earliest boundary.

This path should therefore be very short for a learner who only knows a few early mappings.

The implementation may group multiple lessons between confirmation points if deterministic simulations show equivalent safety with materially shorter runs. It must preserve the earliest-weakness invariant.

---

## 8. `Know most Morse` strategy

This path should avoid forcing an experienced learner through the exact same forward diagnostic as `Some`.

Recommended policy shape:

1. Run a broad, stratified first pass across the canonical curriculum to identify suspect lessons quickly.
2. Ensure the sampling cannot systematically ignore one member of every two-letter lesson pair.
3. Recheck isolated misses after intervening prompts.
4. Concentrate stronger confirmation around the earliest suspect region and the preceding placed-out prefix.
5. Use cumulative word/application checks at existing milestone boundaries as integrated confirmation.
6. If a late letter is weak but every earlier lesson is strong, place at that late lesson.
7. If an early letter is weak despite strong later performance, place at the early lesson.
8. If all A–Z evidence is strong, permit full placement through Lesson 13.

The final algorithm should be selected using measured traces, not intuition alone.

Implementation must report at least:

- perfect `Some` learner question count;
- early-gap `Some` learner question count;
- perfect `Most` learner question count;
- one-noisy-miss `Most` count;
- uneven early-gap/later-strong count;
- repeated-late-gap count.

The purpose of the two paths is meaningful efficiency, not cosmetic copy around the same test.

---

## 9. Integrated word/application confirmation

The owner specifically wants short words to provide stronger evidence that known letters work in sequence rather than only as isolated flashcard mappings.

### 9.1 Reuse existing milestone structure

The current programme already has formative checkpoint boundaries after Lessons:

- 4;
- 7;
- 10;
- 13.

Placement should reuse these curriculum boundaries and the same mechanically derived allowed-letter sets.

Do not create unrelated assessment sections at arbitrary alphabet positions.

### 9.2 Role of word checks

A word check is **confirmation**, not a second formal competency.

It should answer:

> Can this learner apply the mappings they just demonstrated when several known letters are sequenced together?

The assessment may reuse suitable existing checkpoint words/interactions or a small placement-specific deterministic corpus that obeys the same letter-eligibility validation.

Do not introduce sentences, generated infinite material, WPM, or auditory word reception.

### 9.3 Word failure behavior

One word error should not automatically throw the learner back to the start of the block.

A failed word check should trigger focused confirmation of implicated letters after intervening material.

Then:

- if individual letter evidence remains strong and the error appears isolated, continue;
- if one or more mappings remain uncertain, place at the earliest lesson containing the earliest unresolved mapping.

This keeps the policy balanced and avoids converting a motor slip into a four-lesson reset.

---

## 10. Applying the result

### 10.1 Atomic commit

Assessment work remains ephemeral until a final placement is resolved.

At the result boundary, apply the placement to the canonical Topic in one functional/atomic learner-state update.

If the learner exits, reloads, uses Back, closes the PWA, or abandons before that boundary:

- no lesson is partially marked complete;
- no placement provenance is written;
- no formal evidence is written;
- restarting may begin the placement check again.

V1 does not need durable mid-assessment resume state.

### 10.2 Curriculum state

For every item in the contiguous placed-out lesson prefix:

- canonical acquisition support should resolve as established/`settled` for normal lesson-path purposes;
- current/replayable/locked states should then derive through existing `morseLessonPath()` behavior rather than a parallel placement lesson map.

Do not manufacture ordinary 10-retrieval sitting records to simulate lessons the learner never took.

`Topic.lessonSitting` should remain absent/fresh after placement commit unless normal Learn has actually started a sitting.

### 10.3 Status/enrollment

A completed placement is deliberate learning activity and may move a fresh topic into the existing active-learning state using the same enrollment/status semantics as normal Morse start.

Do not invent a placement-specific topic status.

### 10.4 Full A–Z placement

If all 13 lessons are successfully placed out:

- all prerequisite acquisition items may resolve as established;
- `acquisitionReadyAt` should be set at the placement-completion time if the current architecture requires it;
- the next action is whatever the existing journey/scheduler legitimately derives from acquisition readiness.

Do not waive the existing formal Test or retention gap merely because placement was perfect.

---

## 11. Recommended minimal provenance model

The implementation agent must verify the exact representation against current parser/reconciliation code, but the desired semantic model is small.

A candidate additive field is conceptually:

```ts
interface MorsePlacementProgress {
  /** Version of the placement interpretation/algorithm. */
  version: 1
  /** When this completed placement result was committed. */
  assessedAt: string
  /** Stable item ids in the contiguous curriculum prefix independently verified by placement. */
  verifiedItemIds: string[]
}
```

Potential Topic field:

```ts
morsePlacement?: MorsePlacementProgress
```

This field is **provenance**, not a second lesson path.

`lessonProgress` remains the ordinary acquisition-support source used by the curriculum. Placement commit may settle the verified items there so existing path/UI behavior stays simple.

`morsePlacement.verifiedItemIds` exists so the system can honestly distinguish placement-established acquisition from fabricated ordinary lesson/review history and can integrate with consolidation/readiness rules.

### 11.1 Why stable item ids

Use item ids rather than only `throughLesson: 7` because:

- learner state already follows stable item identity;
- future curriculum reordering should not make an old ordinal silently refer to different mappings;
- catalog reconciliation can prune deleted item references using existing patterns.

The visible `through lesson N` result can always be derived from the current canonical path.

### 11.2 Do not persist the raw diagnostic transcript by default

V1 does not need a permanent log of every assessment answer.

Persist only what is required to interpret durable course position honestly.

If implementation discovers a concrete debugging/migration requirement for more data, document it before adding it.

---

## 12. Consolidation/readiness integration

This is the highest-risk technical point.

Normal `morseReview` tracks later-sitting correctness because a character settling in the same sitting that introduced it has not yet survived a gap.

A placement assessment is different: it deliberately tests existing knowledge without teaching the character first.

Therefore a placement-verified item can satisfy the **acquisition consolidation prerequisite** without fake `morseReview` counters.

The readiness predicate should be equivalent in meaning to:

```text
item acquisition support is settled
AND
(
  item has normal later-sitting consolidation
  OR item was independently verified by completed placement
  OR the existing legacy/permanent readiness compatibility rule applies
)
```

Exact function placement is implementation detail.

Requirements:

- do not backfill `introducedIn`, `lastSeenIn`, `laterCorrect`, `printed`, `heard` or `heardCorrect` with invented values;
- placed items may participate in future ordinary cumulative review naturally;
- future review misses may change current support/review need, but must not erase the historical fact that placement once established the item;
- `acquisitionReadyAt` remains permanent once reached;
- Test evidence remains untouched.

---

## 13. Result UX

Keep the result brief.

Examples:

### Partial placement

**Start at Lesson 5**

You already know the material in Lessons 1–4, so they have been marked complete.

Primary action:

- `Start Lesson 5`

No upward/downward lesson picker appears.

### No placement

**Start at Lesson 1**

The check found an early gap, so Argus will start with the first lesson.

Primary action:

- `Start Lesson 1`

Avoid failure language. This is course placement, not a scored exam.

### Full placement

**Alphabet lessons complete**

Your placement check covered the A–Z lesson material.

Primary action should follow the existing learner journey, for example Test when legitimately available.

Do not claim Morse fluency or topic completion.

---

## 14. Edge-case matrix

### Total beginner

- Chooses `New to Morse`.
- No diagnostic.
- No placement field.
- Normal Lesson 1 behavior.

### Learner knows first several lessons

- Sequential `Some` path clears early lessons.
- First persistent gap fixes boundary.
- Only contiguous prerequisite lessons are marked complete.

### Learner knows nearly all letters

- `Most` path uses broad sampling plus confirmation.
- Final unresolved late lesson becomes entry point.

### Learner knows X/Z but not E

- Later success does not compensate.
- Repeated E weakness yields Lesson 1 placement.

### One accidental early miss

- Miss is rechecked after intervening material.
- Strong confirmation permits continued placement.
- No immediate reset.

### Repeated early miss

- Retry cap resolves the item as weak.
- Assessment ends at the earliest affected lesson.

### Strong isolated letters, weak word check

- Recheck implicated letters.
- Do not reset the whole block from one word error.
- Persistent mapping weakness determines the earliest lesson.

### No audio available

- Placement remains fully usable.
- No penalty or alternate completion meaning.

### Abandon assessment

- No partial acquisition writes.
- Re-entry begins a new placement run.

### Browser/PWA reload mid-assessment

- Same as abandon for V1.
- Canonical prior progress remains intact.

### Existing progress

- Never regress existing legitimate learner state.
- Fresh-placement flow may be hidden once meaningful progress exists.

### Full placement through Lesson 13

- Acquisition prerequisites may become ready through placement provenance.
- Formal Test/retention requirements remain.

### Import/export or cloud restore

- Placement provenance and resulting lesson support round-trip together.
- Restored learner enters the same canonical lesson/journey.

### Future catalog/item reconciliation

- Unknown/deleted placement item ids are pruned/handled consistently with other per-item stores.
- Do not transform remaining non-contiguous ids into arbitrary lesson unlock holes.
- Re-derive the largest still-valid contiguous verified prefix conservatively.

---

## 15. Deterministic policy tests

Create a pure placement-policy module with no React/storage side effects.

At minimum test:

- curriculum derives from current `lessonPackets()`;
- persisted placement is always a contiguous lesson prefix;
- later correct items cannot leapfrog an earlier unresolved lesson;
- first miss creates uncertainty rather than immediate failure;
- confirmation after intervening prompts can clear a one-off miss;
- repeated miss resolves to the correct earliest lesson;
- retries are bounded;
- assessment has a deterministic maximum length;
- `Some` and `Most` produce meaningfully different prompt strategies;
- exact same learner trace produces exact same result;
- word-check failure triggers focused confirmation rather than an automatic block reset;
- all-correct learner can place through Lesson 13;
- a learner weak only on the final lesson starts at Lesson 13;
- a learner weak on Lesson 1 starts at Lesson 1 regardless of later performance.

---

## 16. Representative simulation traces

Add programme-level simulations, not only unit examples.

Required traces:

- completely new learner selecting `New`;
- `Some` learner strong through Lesson 2 then weak in Lesson 3;
- `Some` learner with one accidental miss then recovery;
- `Most` learner perfect across A–Z;
- `Most` learner with random later knowledge but early E weakness;
- `Most` learner with only one late weak pair;
- learner with multiple scattered weak characters;
- isolated-letter-perfect learner who misses one word sequence;
- repeated word/mapping weakness;
- assessment run abandoned before result;
- full placement then normal Test journey;
- partial placement then normal Learn and later acquisition readiness.

For every trace record:

- number of prompts;
- lessons placed out;
- unresolved lesson;
- confirmation/retry count;
- word confirmations used.

The PR should make assessment-length tradeoffs visible rather than merely asserting the flow is quick.

---

## 17. Persistence and migration tests

If a new `morsePlacement` field is introduced, test all normal durable-library boundaries.

Required:

- old v5 without placement loads unchanged;
- placement field validates strictly;
- unknown item ids cannot crash parse/journey;
- export/import is lossless;
- catalog reconciliation preserves valid placement ids and prunes removed items conservatively;
- topic edits cannot accidentally fabricate new placement coverage;
- reset removes placement with the learner library as expected;
- Firebase serialization/sync uses the canonical parsed library and preserves placement;
- account switching cannot leak placement between UIDs;
- a cloud-restored placed learner derives the same current lesson;
- no sidecar is introduced.

Do not bump the schema version unless the current parser architecture actually requires it. Existing Morse additive fields demonstrate that an optional validated field can often remain inside v5.

---

## 18. Evidence-safety tests

Prove placement cannot counterfeit the stronger topic claim.

After any placement result:

- `itemEvidence` is unchanged;
- no `DirectionEvidence.unassistedCorrect` is created;
- no Test attempt/history entry is created;
- no topic becomes `drilled` or `completed` from placement alone;
- no retention timestamp is banked as a successful Test;
- no listening counters are invented;
- no sending/WPM data exists;
- the eventual formal Test still has to establish its normal directional coverage;
- permanent completion still requires the current delayed-retention contract.

---

## 19. UI/browser/accessibility acceptance

Cover at minimum:

- phone portrait around 390×844;
- narrow 320×568;
- short landscape;
- 200% text;
- keyboard operation;
- screen-reader labels for experience choices and Morse key;
- reduced motion;
- Android/Pixel Back during experience choice and assessment;
- no accidental answer carry-over through the shared keyed-response lifecycle;
- assessment exit/back does not commit progress;
- result commit occurs once;
- result action enters the expected lesson without duplicate history stops.

Reuse #45 navigation semantics and #87 keyed-response touch safety rather than adding assessment-specific gesture handling.

---

## 20. Implementation decomposition

### Lane A — policy and state contract

**High reasoning recommended.**

- define pure placement state machine;
- define `Some` and `Most` strategies;
- define uncertainty/retry/word-confirmation rules;
- measure trace lengths;
- finalize minimal placement provenance representation;
- prove integration with `lessonProgress`, `morseReview`, `acquisitionReadyAt`, `journeyFor()` and parser/reconciliation.

Do this before building UI.

### Lane B — persistence/progress integration

**High reasoning recommended because of data safety.**

- add validated canonical placement state if required;
- implement atomic placement commit;
- integrate placement-verified items with consolidation/readiness honestly;
- export/import/reconciliation/Firebase safety;
- no formal evidence writes.

### Lane C — assessment runner and UX

**Strong regular implementation agent.**

- experience choice;
- shared keyed-response runner;
- word confirmation runner/reuse;
- result surface;
- History API/Back/accessibility/mobile treatment.

### Lane D — simulations, E2E and documentation reconciliation

**Regular implementation/QA.**

- representative policy simulations;
- browser tests;
- cross-surface journey tests;
- update `MORSE_LESSON.md`, `MORSE_PROGRAMME_PLAN.md`, `PROGRESS_ARCHITECTURE.md`, and PRODUCT only where final implementation changes product-level truth;
- Pixel/PWA acceptance.

Lanes A and B should not be split between independent agents editing the same progress primitives unless their boundaries are explicitly separated. Lane C can begin after A's public interfaces are stable.

---

## 21. Likely code surfaces

Inspect fresh main before implementation. Expected touchpoints include:

- `src/lib/morseLesson.ts`;
- `src/lib/morseLessonPath.ts`;
- `src/lib/morseReview.ts`;
- `src/lib/journey.ts`;
- `src/lib/types.ts`;
- `src/lib/storage.ts`;
- `src/lib/catalog.ts`;
- canonical Firebase sync adapter/state path from #93;
- `src/features/learn/MorseProgramme.tsx`;
- shared `MorseKeyInput` / keyed-response lifecycle;
- Morse checkpoint primitives/content;
- route/history integration;
- Morse whole-programme simulations;
- parser/export/import/reconciliation tests;
- browser/E2E tests.

Do not treat this list as a mandate to touch every file. Prefer the smallest coherent implementation.

---

## 22. Non-goals

This issue does not add:

- a free lesson picker;
- arbitrary lesson unlocking;
- alphabetic learning order;
- a placement score, rank or badge;
- a new top-level Test/Practice mode;
- self-reported mastery grants;
- formal auditory reception;
- WPM/sending-quality assessment;
- numerals/punctuation/prosigns;
- sentences/phrases/continuous copy;
- #29 advanced Morse scope;
- new retention/scheduler algorithms;
- accordion/mastery redesign of the lesson path;
- a separate Firebase progress model;
- durable raw diagnostic transcripts unless later justified.

---

## 23. Definition of done

#105 is complete when:

1. a fresh Morse learner is asked `New / Some / Most` only at a deliberate start boundary;
2. `New` begins the ordinary programme without diagnostic overhead;
3. `Some` and `Most` run genuinely different bounded deterministic placement strategies;
4. placement assesses uncued printed letter-to-Morse acquisition and uses word/application confirmation where useful;
5. one noisy miss receives later confirmation rather than forcing an immediate reset;
6. the result always resolves to the earliest genuine weak lesson and preserves the locked curriculum;
7. placed-out prerequisite lessons appear completed in V1;
8. placement provenance is represented honestly enough that normal sitting/review history is not fabricated;
9. abandonment/reload before result writes no partial placement progress;
10. placement never creates formal Test evidence, retention success, auditory competence or sending/WPM claims;
11. existing legitimate learner progress is never downgraded;
12. full placement through Lesson 13 integrates correctly with `acquisitionReadyAt` and the existing learner journey without bypassing Test/retention requirements;
13. canonical storage, export/import, reconciliation and Firebase sync preserve the resulting learner state;
14. deterministic simulations demonstrate bounded length and correct behavior for typical and adversarial learner profiles;
15. mobile/browser/accessibility tests and the full repository gate pass;
16. the exact production flow receives Pixel/PWA acceptance before close.
