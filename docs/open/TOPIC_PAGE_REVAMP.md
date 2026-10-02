# Topic page and Test revamp

**Status:** implemented and locally validated in phase commits on 2026-10-02; not merged or deployed. Colour variants await the owner’s pick; external hero artwork remains pending. D1–D6 were accepted through the owner’s instruction to scope and implement this plan.
**Authority:** implementation contract for the topic-page revamp. [Progress architecture](PROGRESS_ARCHITECTURE.md) owns the one-test ladder; [topic icons](LIBRARY_TOPIC_ICONS.md) owns icon artwork. Local implementation is not evidence of production deployment.
**Relationship:** extends the Today/Library cleanup (#127) down into the topic page and the Test run, which is where the product is still dense.

## 0. The problem, as found in the code

Today and Library are one answer per screen. The topic page is not. [TopicPage.tsx](../../src/features/library/TopicPage.tsx) stacks, in order: back link, title, scope paragraph, state line, listening line, detail line, gauge, primary button + its note, up to four text-weight alternates, a consequence sentence, then the briefing (kind label, overview, sections, case studies), then the item list, limitations, sources, history, completion line, admin. A topic such as Firearm Safety has nine items and is a scroll through roughly a dozen paragraphs before the nine items appear.

Three structural causes, all fixable:

1. **Learning is gated behind a click.** An ordinary topic opens as reading but the primary button is `Start learning` ("make this an active topic"), then a second button to Test. Enrollment is bookkeeping the learner never asked for.
2. **The ladder asks for a retest.** `resolveAttempt` banks only on a second clean Test (`learning → drilled → completed`), and the page says "Two perfect tests complete the topic." The clock is already gone (2026-09-29); the retest is what remains of it.
3. **Test shuffles everything.** `buildDeck` shuffles every deck, so a stepwise acronym (ACTS, PROVE, ABCDE, OODA) is asked as nine unrelated cards.

There is also no art in the product yet beyond the 19 small topic icons. Asset inventory at scoping, before implementation:

| Asset | State |
| --- | --- |
| Topic icons (19 SVGs, `src/assets/library-icons/`) | live on Library and Today |
| Maritime flags and lights, bearings | live; drawn deterministically in code (`FigureSpec`), not images |
| Beaufort: 4 AVIFs in `public/media/beaufort/` | staged, **not wired** into the catalog |
| WMO clouds: 10 AVIFs in `public/media/clouds/` | staged, **not wired** (#131, blocked on #146 until now) |
| Hero or infographic art for the other shipped topics | **none in the repo.** No branch, stash or untracked file carries any. If it exists, it is outside the repo |

So the visual work has not started in the product. The `Visual` primitive (#146) is shipped and is the right container; it has just never been given a topic-level slot.

## 1. Decisions this plan assumes

Accepted by the owner on 2026-10-02.

| # | Decision | Source |
| --- | --- | --- |
| D1 | **Opening a topic is learning.** No `Start learning` button for ordinary topics. The content is on the page, the one button is Test. | "shouldn't have to click to start learning" |
| D2 | **One clean Test banks the topic.** `drilled` stops being a rung a learner can be on. A miss routes to `learning` as today. | "no retest. testing is: does the user know the content" |
| D3 | **A clean first Test banks too**, from `unstarted`. Knowing it cold is knowing it. | follows from D2 |
| D4 | **Morse keeps its acquisition gate.** `advancementEligible` is untouched; its lessons are a course, not reading. | Morse is mid-curriculum by design |
| D5 | **Text is demoted, not deleted.** Briefing, case studies, limits and sources stay, behind folds. Provenance is not optional. | `SEEDED_CONTENT_PROVENANCE` |
| D6 | **Colour changes inside the gunmetal system**, not away from it. | memory: gunmetal visual direction |

D2 reverses the two-clean-tests rule. D3 is intentional: a clean self-scored first Test banks an ordinary topic.

## 2. Phase 1 — Simplify the ladder (domain, small)

Do this first: it deletes UI as well as adding behaviour, and every later phase reads the simpler states.

- `scheduling.ts` `resolveAttempt`: `clean` from `unstarted | learning | decayed | drilled` → `completed` (`completedAt ??= at`). Miss → `learning`; from `completed` a miss → `decayed`, unchanged. Keep the `advancementEligible` short-circuit exactly as is (D4).
- **No data migration.** Keep `drilled` in `STATUSES` so existing exports, Firestore records and `syncPlanner` still parse. A stored `drilled` topic is read as `completed` by `journeyFor`/`dueState`; the next write normalises it. Never rewrite on read (browsing writes nothing).
- `journey.ts`: drop the `enroll` action for ordinary topics (the primary is `Test`, with `Test` on a `completed` topic reading `Test again`). Morse keeps `learn`.
- Remove copy: "Two perfect tests complete the topic", "Starting learning records enrollment…", `Ready to test again`, the `drilled` branch in `statusLabel`.
- `PROGRESS_ARCHITECTURE.md`: add a **one-test addendum** beside the no-clock one; update `LEARNING_EXPERIENCE_DESIGN_DECISION.md`'s banner the same way.
- Verification: a scratch vitest over the real `resolveAttempt` for every rung × clean/miss × eligible/ineligible (per the token-efficient-review preference); update `scheduling.test.ts`, `journey.test.ts`, `learnToTestHandoff.test.ts`. Not a browser job.

## 3. Phase 2 — Stepwise Test for ordered topics

An acronym is a sequence; recall it in sequence and show the whole thing.

**Content.** Add an optional `sequence` to the topic, additive inside library format v5 like `Visual` was (no version bump; the parser and `syncPlanner` tolerate its absence):

```ts
interface TopicSequence {
  groups: { label: string; letters: string; itemIds: string[] }[]
}
// Firearm Safety: [{ label: 'ACTS', letters: 'ACTS', itemIds: [...4] },
//                  { label: 'PROVE', letters: 'PROVE', itemIds: [...5] }]
```

`letters` is authored, not parsed out of prompts: `ACTS 1 (A)` is display text today and fragile as a source of truth. Candidates beyond Firearm Safety: `primary-survey` (ABCDE), `ooda-loop`. Not NATO, Greek, hex or SI: those are lookups, not steps, and shuffle is right for them.

**Behaviour.** For a topic with `sequence`, `buildDeck` returns items in group order, no shuffle. A group runs as one pass. Whether the topic banks is unchanged: every item once, all correct.

**Card.** The prompt is the acronym set as a word, current letter enlarged and lit, the rest dimmed. Letters already answered stay lit smaller, so the learner watches the word fill in. Reveal shows that step's wording; grade; the next letter enlarges. The second group starts after the first, with its own acronym. One acronym on screen at a time, never both.

- Touches: `testDeck.ts` (order), `TestSession.tsx` (card choice), new `SequenceCard` beside `ProgressiveCard`, `textScale.ts` (the enlarged letter must obey the same scale rules), `Topic`/`items.ts`/`visualParser.ts`-style parser for the new field, `catalogSeed.ts` (author the three topics).
- Accessibility: the enlarged letter is `aria-current="step"` within a list of the group's letters; the card also reads "Step 2 of 4, C". Reduced-motion: no letter animation, only the style change.
- Tests: deck order, every item once, miss on step 3 does not reshuffle, reduced-motion, an unordered topic is still shuffled.

## 4. Phase 3 — Rebuild the topic page

One page, three bands, everything else folded. Content first, because content is the learning (D1).

```
Library ←
[ hero — owner's art, or the fallback plate ]
Firearm Safety                          ← title
Nine rules, in order.                   ← one sentence (scope, trimmed)
9 items · Not tested yet                ← one line of state, nothing else

WHAT TO REMEMBER                        ← the recall set, as cards (§4.2)
 A  Assume every firearm is loaded.
 C  Control the muzzle direction…
 …

▸ Why it works        ▸ Case study      ← folds, closed
▸ What this doesn't cover · Sources

[ Test ]                                ← sticky bottom bar, the one action
```

### 4.1 What goes

- `topic-detail`, the gauge caption duplication, `topic-primary-note`, `topic-consequence`, the listening line unless the topic has listening, and the standing `Practise the N you missed` link stays only when it is true.
- The `Learn` kind label ("Briefing", "Concise support").
- `Start learning` entirely (D1).

### 4.2 Recall as cards, not a table

Replace `RecallReference`'s numbered list with compact cards: marker (number, or the sequence letter for ordered topics), the prompt, the answer, and the item's `stimulus` image where it has one. For a `sequence` topic the cards read as the acronym itself, group by group, so the page and the Test show the same shape.

### 4.3 Sections expand in place

Each `LearnSection` becomes a `<details>` with its heading as the summary and a one-line lead; nothing opens by default except the recall set. A section is reached in one tap and never navigates. Case studies, limitations and sources become one fold each. This reuses the existing `fold` style and needs no new content model, so authored content is untouched.

### 4.4 The one action

A bottom-fixed `Test` bar on phone (the primary control must not scroll away under a long page). Its verb carries the state: `Test`, `Test again`, `Repair` (decayed), Morse's `Lesson N`. Secondary actions (review, replay, copy practice) move into a `⋯` fold above the bar, not stacked links in the body.

### 4.5 Morse and course topics

Same diet at the top (hero, title, one-line state, one action); the body stays `MorsePath`. Its "How this course works" fold already exists.

## 5. Phase 4 — Visual slots and the asset pipeline

The owner produces art outside the repo, so the repo must make delivery boring: drop a file in, add one line, done; and the page must be good without it.

**Slots (additive, optional):**

| Slot | Where | Shape | Fallback when missing |
| --- | --- | --- | --- |
| `hero` | topic page and Library row/Today plate when large enough | `Visual` (image, `alt` required, `width`/`height`) | track-tinted plate with the existing icon, large |
| `learn` visual blocks | inside a section fold | existing `{ type: 'visual' }` block | none (block simply absent) |
| `item.stimulus` | recall card and Test card | existing `Visual` | none |

`hero` is a new optional field on `Topic`, parsed by the same `visualParser` rules as every other `Visual` (local `/media/` path only, no remote URLs, dimensions required).

**Asset brief for the owner (so outside work lands first time):**

- Hero: **16:9, 1600×900 source**, shipped as AVIF (WebP/PNG acceptable), under ~60 KB each. The beaufort/cloud AVIFs already in `public/media/` are the size reference.
- Dark ground: designed on the gunmetal `#101215` page, not white. Subject kept to the centre 70% so the bottom edge can fade under the title on a 390 px phone.
- No text baked into the image that the learner must read (essential text stays HTML, per #146). Decorative lettering is fine.
- One concept per topic, file `public/media/topics/<topic-id>/hero.avif`. Per-step or per-item art follows the same folder.
- Provenance: anything not hand-made needs a record like #131's `assetId`/credit line. AI-generated art is credited as such.

**Wire-in order** (staged assets first, because they cost nothing): Beaufort (#129), clouds (#131), then one hero per remaining topic as they arrive. Each is a one-line catalog change plus `alt` text, and the fallback plate means a half-finished set never looks broken.

## 6. Phase 5 — Colour

Today's system is intentionally restrained: a monochrome chassis, one white-steel accent, and track colours at oklch chroma ≈ 0.08 that were chosen to "read as anodised metal" and in practice read as grey. Plain, as the owner says.

Keep the chassis and the rule that warm tarnish means decay. Spend colour in three places only, where it already carries meaning:

1. **Track wash on the hero/fallback plate.** Track colour at chroma ≈ 0.12–0.14 as a low-opacity gradient behind the title; the first place a topic gets an identity.
2. **State on the action bar.** `Test` steel, `Repair` tarnish, `Banked` the settled slate. One colour per state, named where used.
3. **Sequence letters.** The lit letter in the stepwise card uses the track colour; answered letters step down to `--complete`.

Deliverable is a **two-variant spike** (current chroma vs raised) on the real Library and topic screens at 390 px, then the owner picks. Do not retune `tokens.css` globally on spec. Contrast must still clear 4.5:1 on `--surface-2`, as the token comments require.

## 7. Order and shape of the work

| PR | Contents | Depends on | Risk |
| --- | --- | --- | --- |
| 1 | Phase 1: one-test ladder, copy, architecture addendum | decisions D1–D4 | domain semantics; heavy unit coverage |
| 2 | Phase 2: `sequence` + `SequenceCard` + 3 topics authored | none | new field in the parser and sync path |
| 3 | Phase 3: topic page rebuild, hero slot with fallback plate | PR 1 (no `enroll`) | broad CSS; Playwright gate |
| 4 | Phase 5 spike, then the pick | PR 3 | taste, not code |
| 5+ | Asset wire-in, one small PR per batch as art arrives | PR 3 | none |

PRs 1 and 2 are independent and can run in parallel. Nothing in PR 3 waits on art.

**Known friction.** Many sessions share this checkout and the Playwright gate flakes badly under load, so gate on unit tests and a targeted e2e per PR rather than the full suite, and keep each PR to one concern. The working branch was `feat/demo-target` when this was written, not `main`; branch each phase from current `main`.

## 8. Out of scope

Today and Library layout (already done), Morse lesson internals, Firebase sync semantics beyond tolerating the two new optional fields, and any claim that the content teaches physical competence (Firearm Safety's scope boundary is unchanged).

## 9. Local implementation and review

All phase worktrees began at fetched `origin/main` commit `4600565`, leaving `feat/demo-target` and its untracked files untouched. `feat/topic-revamp-integration` combines the phase commits for final verification and review. Nothing is merged, pushed or deployed.

| Phase | Branch | Local outcome |
| --- | --- | --- |
| One-test ladder | `feat/topic-one-test` | Clean eligible Test banks; ordinary enrollment removed; legacy `drilled` reads Banked and normalizes on explicit ordinary topic writes; Morse eligibility short-circuit retained. |
| Ordered Tests | `feat/topic-ordered-tests` | ACTS then PROVE, ABCDE and OODA; full-deck validated sequence metadata; static current-letter emphasis; read-only defaults for unchanged older catalog records. |
| Topic page | `feat/topic-page-rebuild` | Hero Visual slot/fallback, grouped visible recall, closed native folds, fixed mobile action, preserved Morse course flow. |
| Staged assets | `feat/topic-staged-assets` | Shared manual visual guide; four Beaufort scenes; new Cloud Genera textual topic plus ten credited unscored photos. |
| Colour comparison | `feat/topic-colour-spike` | Development-only current/raised variants and real-screen captures; production track tokens stay unchanged pending selection. |

The cloud topic’s ten scored items are abbreviation → full genus name. The owner explicitly approved this boundary on 2026-10-02. Photographic identification, levels and comparison cues are explanatory content only. The packaged #131 ledger retains original URLs, licences, QA and hashes; source links and image credits remain accessible in the UI.

Beaufort reuses the exact approved files and the existing narrow `refreshShippedLearn` path. The original asset handoff lacks creator/generation metadata; the guide identifies supplied illustrative artwork without inventing a photographic or AI origin. That provenance detail remains open.

The shared guide extends `entries` with optional `presentation: "visual-guide"` inside v5. It uses manual horizontal snapping, labelled selectors, Previous/Next and arrow keys; no autoplay, global media framework or scored image recognition. All essential labels remain HTML.

Ordered topics use concise scope text such as “9 rules, in order.” The complete authored scope remains in the Scope and limits fold. Image failure retains alt text. Hero files have not been supplied; fallback plates are intentional.

Integrated validation: all 1,521 unit tests (115 files), TypeScript and the production build pass. The new topic/ordered-reference/weather browser gates pass 12 scenarios across 320 px, 390 px and desktop, including closed folds, fixed phone action, 200% text scaling, image loading and unscored cloud photos. The bundle remains 3.06 MiB (3.05 MiB app-shell precache), reusing already-staged media. The build retains its existing large-chunk advisory.

The colour comparison is documented in [Topic colour spike](TOPIC_COLOUR_SPIKE.md). Generated 390 px comparisons live under `test-results/topic-colour/` in the colour worktree; reproduce with `scripts/captureTopicColour.mjs`. Hero assets for other topics remain external, not generated or fabricated as part of this work.
