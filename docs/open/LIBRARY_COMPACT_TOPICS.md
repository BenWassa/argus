# Compact library topics

**Status:** plan, 2026-10-02, owner decisions in. Batch 1 (OODA pilot) is in review as #168; nothing else is implemented. Tracking issue: #166.
**Authority:** once a batch ships, its section becomes the maintained contract for that behaviour. Until then `TOPIC_PAGE_REVAMP.md` stays authoritative for the topic-page layout and `LIBRARY_ROADMAP.md` for which topics exist.
**Relationship:** this is the content and provenance half of the topic-page diet. `TOPIC_PAGE_REVAMP.md` §4 decides how the page is laid out; this document decides how much each topic says and where its sources live.

## 0. The request

From the owner, near verbatim:

1. Every library topic opens **more compact and minimal at first view**.
2. **Sources are hidden** behind a button: small, subtle text, at the very bottom, centred. It opens a **centred modal**.
3. Some topics carry **too much prose**: dramatic lead-ins and over-explaining. Trim significantly, keeping the main content only.
4. There are many topics, so this is tracked in a doc and an issue.

## 1. What is there today

Measured by a scratch vitest over the real `catalogDefinitions()` (word counts of Learn text; scored items excluded, sources counted in the last column only). Reference blocks (tables, `entries`) are counted with prose, so the visual-heavy rows overstate how much is trimmable; see §3.4.

| Topic | Track | Items | Kind | Overview | Sections | Cases | Limits | Learn total | Sources (n, words) |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | --- |
| `nato-phonetic` | learning | 26 | concise | 29 | 0 | 0 | 0 | **29** | 1, 18 |
| `cardinal-bearings` | tradecraft | 8 | concise | 36 | 0 | 0 | 0 | **36** | 1, 17 |
| `hex-digits-binary` | learning | 16 | concise | 38 | 79 | 0 | 28 | **145** | 1, 42 |
| `radiotelephony-numbers` | learning | 13 | concise | 59 | 78 | 0 | 47 | **184** | 1, 39 |
| `greek-alphabet` | learning | 24 | concise | 46 | 104 | 0 | 58 | **208** | 1, 40 |
| `si-prefixes` | learning | 24 | concise | 52 | 111 | 0 | 73 | **236** | 1, 46 |
| `international-morse-letters-printed` | learning | 26 | concise | 62 | 178 | 0 | 0 | **240** | 1, 20 |
| `reciprocal-bearings` | tradecraft | 12 | concise | 41 | 144 | 0 | 105 | **290** | 1, 17 |
| `whole-circle-bearings` | tradecraft | 12 | concise | 55 | 153 | 0 | 135 | **343** | 2, 45 |
| `north-references-declination` | tradecraft | 16 | briefing | 48 | 244 | 0 | 95 | **387** | 3, 65 |
| `vessel-day-shapes` | tradecraft | 5 | concise | 33 | 279 | 0 | 115 | **427** | 2, 40 |
| `primary-survey` | survival | 5 | briefing | 43 | 191 | 175 | 66 | **475** | 2, 53 |
| `grid-north-map-bearings` | tradecraft | 12 | briefing | 60 | 208 | 105 | 116 | **489** | 4, 94 |
| `firearm-safety-acts-prove` | survival | 9 | briefing | 70 | 159 | 181 | 121 | **531** | 4, 140 |
| `ooda-loop` | learning | 4 | briefing | 43 | 233 | 227 | 53 | **556** | 2, 54 |
| `beaufort-wind-scale` | tradecraft | 13 | concise | 63 | 451 | 0 | 58 | **572** | 3, 97 |
| `scuba-equipment-abbreviations` | learning | 13 | briefing | 66 | 509 | 0 | 97 | **672** | 9, 187 |
| `signal-flags` | tradecraft | 12 | concise | 63 | 544 | 0 | 81 | **688** | 3, 93 |
| `navigation-lights` | tradecraft | 16 | briefing | 47 | 810 | 0 | 123 | **980** | 3, 62 |

19 topics, about 7,500 words of Learn text, plus about 1,200 words of source labels and notes.

What the worst cases look like (read from `catalogSeed.ts`):

- **OODA Loop** has four scored items and 556 words around them. The overview opens by correcting a misconception ("not merely four boxes connected in a circle"), and a full section ("Common simplification") exists only to say the familiar picture is a simplification.
- **Firearm Safety** overview opens by saying where ACTS and PROVE sit in the course and closes by telling the reader what Test asks, which the page already shows.
- Firearm Safety's first limitation restates the boundary already printed in its scope sentence under the title.

## 2. Target shape

### 2.1 First view

Title, one scope sentence, the recall set, the one action. Nothing else is open. This is `TOPIC_PAGE_REVAMP.md` §4's layout; this document adds what that layout still shows at the bottom.

### 2.2 Sources and limitations: one quiet control, one modal

Decided by the owner: limitations are bullets, at the end, and live with the sources.

- A single text button, last element on the page, horizontally centred, small and low-contrast (muted ink, no border, no icon, no chevron per the UI preference). Label: **Sources and limitations** (shortened to **Sources** for a topic with no limitations). It is the only trace of provenance or caveat in the body.
- It opens a **centred modal** built on the existing `shared/ui/Dialog` (focus entry and return, scroll lock, Escape, and the browser-Back blocker are already handled there). Two parts in one scroll: **Limitations** as a short bullet list first, then **Sources** (the current `learn-sources` list unchanged: label, link, note). Close button named "Close sources and limitations".
- The inline `Limitations` and `Sources` sections are removed from `LearnSupport`. A topic with neither renders no button.
- **Provenance is not reduced.** Every source stays, verbatim, one tap away. The provenance requirement (see `docs/closed/SEEDED_CONTENT_PROVENANCE.md`) is met by availability, not by prominence.
- **Safety topics.** Firearm Safety and Primary Survey rely on limitations for their scope boundary (Argus teaches recall, not competence). Hiding them is a decision the owner has made; their `scope` sentence under the title therefore carries the one-line boundary ("recall of these nine rules only, not handling a firearm") and must not be trimmed away in Batch 2.
- Accessibility: the button is a real `<button aria-haspopup="dialog">`; its muted style must still clear 4.5:1 on `--surface-2` (text this small is the case the token comments warn about); at 200% text the modal scrolls internally and never clips the close control. Links keep `target="_blank" rel="noreferrer"`.
- Offline: no change. Links are the only network touch and already were.

### 2.3 Limitations as bullets

Limitations are authored as a short bullet list (≤ 3 bullets, ≤ 25 words each, §3.3), each one fact: what the topic does not claim. They are no longer prose paragraphs. `LearnContent.limitations` is already `string[]`, so there is no schema change; the change is in how short they are and where they render.

### 2.4 Learn-content refresh for existing learners

`reconcileCatalog` only appends and never rewrites a topic a learner already holds (`catalog.ts`). Rewritten prose therefore needs the other path, and **it already exists**: `refreshShippedLearn` in `libraryMigrations.ts` (introduced for Beaufort in #128). It is an opt-in list, `REFRESHED_LEARN_TOPIC_IDS`. For a listed topic that the catalog still owns and whose scored items match the catalog exactly, it replaces `learn` and nothing else; it is idempotent, so two devices agree and sync sees no conflict. A topic whose boundary the learner edited is left alone.

So no new mechanism is needed (this corrects an earlier draft, which proposed building one). The rule for every content batch is: **add the trimmed topic's id to `REFRESHED_LEARN_TOPIC_IDS`, and extend the `#166` test in `libraryMigrations.test.ts`.** The refresh does not touch `scope` or `title`; a batch that must change either needs the narrower title/scope migration pattern (`PREVIOUS_SHIPPED_TITLES`) instead, and should avoid doing so.

## 3. Editorial rules for trimming

Applied to every topic, in this order.

### 3.1 What to cut

- **Lead-ins.** Sentences that frame, motivate or announce ("X is a feedback-rich model of adaptation, not merely…", "ACTS and PROVE are the safety core of…"). Start with the fact.
- **Restatement.** Anything the title, scope sentence or scored items already say. The overview must not repeat the scope; if it only does, delete it.
- **Meta-sentences.** "Test asks for…", "the handbook rules below explain…", "this case is about the rules only". The page already shows what is scored.
- **Corrections of misconceptions** unless the misconception is the commonly tested trap (then one clause, not a section).
- **Hedged doublets.** Two bullets making one point; a bullet that is a paragraph.
- **Case studies** shrink to the scenario and the takeaway, or go entirely if the takeaway restates the items. A case study that does not change what the learner would do is cut.

### 3.2 What to keep

- Scored items, item ids, `scope` meaning, and any claim a source note cites. Trimming changes wording, never the facts a source supports.
- Reference structures that are the content (tables, `entries`, visual blocks, glossary definitions). These are reference, not prose; they are not trimmed for length, only for duplication (the same fact in both a table and a bullet).
- Safety and scope boundaries, in limitations, in their shortest accurate form.

### 3.3 Proposed budgets

Words of non-source Learn text, per topic. These are starting points, to be confirmed in the Batch 1 pilot, not contracts.

| Shape | Overview | Sections | Case study | Limitations |
| --- | --- | --- | --- | --- |
| concise | ≤ 25, or none | ≤ 90 | none | ≤ 2 bullets, ≤ 20 words each |
| briefing | ≤ 30, or none | ≤ 130 | ≤ 90 (scenario, walkthrough, takeaway) | ≤ 3 bullets, ≤ 25 words each |

The OODA pilot landed at 15 / 89 / 82 / 42 against these and they held. A topic already inside budget is left alone. NATO Alphabet (29) and Compass Bearings (36) need no change.

### 3.4 Visual-heavy topics

Navigation Lights (810 section words), Signal Flags (544), SCUBA Equipment (509) and Beaufort (451) are mostly `entries`/table reference. The audit counted those with prose, so their trimmable share is unknown until the pilot separates the two. **Do not apply the budgets in §3.3 to those four until Batch 4/5 measures prose blocks alone.**

### 3.5 Accuracy guard

- No scored item, answer, id, order or `kind` changes. A scratch test asserts `scoredIdentity` is identical before and after for every edited topic.
- Cutting a sentence must not orphan a source note: if a source note cites a claim, that claim stays in the topic (or the note is trimmed in the same PR, and says why).
- Safety-critical and medical topics (Firearm Safety, Primary Survey) and the maritime visual topics (Navigation Lights, Day Shapes, Signal Flags) get an **owner domain review** on the diff before merge. The trimmed text is reviewed as claims, not as style.
- The agent doing the edit proposes a before/after word count and a one-line "what was cut" per section in the PR body, so the reviewer can see cuts without diffing blocks of prose.

## 4. Work breakdown

One PR per batch. Each batch is gated on unit tests plus a targeted e2e; the full Playwright suite flakes under load (see `TOPIC_PAGE_REVAMP.md` §7).

| Batch | Scope | Depends on | Review |
| --- | --- | --- | --- |
| **0a** | "Sources and limitations" button and modal for all topics; remove inline Limitations and Sources from `LearnSupport`. **Built, committed locally on `feat/sources-modal` (off `feat/topic-revamp-integration`); not pushed** because that base is not on the remote | topic-page rebuild merged, or built on `feat/topic-revamp-integration` | UI, a11y |
| **0b** | ~~Learn-content refresh~~ **Not needed:** `refreshShippedLearn` exists (§2.4). Each content batch registers its ids | n/a | n/a |
| **1** | Pilot trim: **OODA Loop**; confirm budgets in §3.3. **In review: #168** | none (0a changes the final look only) | owner reads the diff |
| **2** | Survival briefings: Primary Survey, Firearm Safety | 1 | owner domain review |
| **3** | Navigation: Cardinal (no-op), Whole-circle, Reciprocal, North References, Grid North | 1 | owner skim |
| **4** | Maritime: Navigation Lights, Vessel Day Shapes, Signal Flags | 1, §3.4 measure | owner domain review |
| **5** | Reference topics: SCUBA, Beaufort, Radio Numbers, SI Prefixes, Greek, Hex, International Morse | 1, §3.4 measure | owner skim |

Why OODA first: lowest domain risk, worst words-to-items ratio (556 words around 4 items), and its prose is the clearest example of the lead-in problem, so it calibrates the budgets cheaply.

0a is independent of 1–5 in code. Each of 1–5 reaches existing learners through its own `REFRESHED_LEARN_TOPIC_IDS` entry.

Some existing tests pin the old wording of limitations (`catalogSeed.test.ts` asserts three Firearm Safety limitation phrases and an OODA one). A trim updates those assertions to the new wording and keeps what they protect: that the boundary is stated.

### 4.1 Base branch and merge order

The topic-page rebuild exists in sibling worktrees (`feat/topic-revamp-integration`, `feat/topic-page-rebuild`) and is not merged. It rewrites `TopicPage.tsx` (432 lines, down from 583) and changes `LearnSupport.tsx`. Batch 0a edits `LearnSupport.tsx` and the foot of `TopicPage.tsx`, so building it on current `main` guarantees a conflict. Build 0a on the integration branch, or wait for it to merge. The content batches (1–5) touch only `catalogSeed.ts` and the per-family topic modules (`bearingTopics`, `maritimeTopics`, `flagTopic`) and do not conflict with it.

## 5. Tracker

Update the box when the batch PR merges. Word counts are Learn text before → after.

| Topic | Batch | Trimmed | Domain review | Words |
| --- | --- | :-: | :-: | --- |
| Sources and limitations modal (all topics) | 0a | built, local branch `feat/sources-modal` | n/a | n/a |
| Learn-content refresh | 0b | n/a (already exists) | n/a | n/a |
| `ooda-loop` | 1 | PR #168 | ☐ | 556 → 228 |
| `primary-survey` | 2 | ☐ | ☐ | 475 → |
| `firearm-safety-acts-prove` | 2 | ☐ | ☐ | 531 → |
| `cardinal-bearings` | 3 | n/a (in budget) | n/a | 36 |
| `whole-circle-bearings` | 3 | ☐ | ☐ | 343 → |
| `reciprocal-bearings` | 3 | ☐ | ☐ | 290 → |
| `north-references-declination` | 3 | ☐ | ☐ | 387 → |
| `grid-north-map-bearings` | 3 | ☐ | ☐ | 489 → |
| `navigation-lights` | 4 | ☐ | ☐ | 980 → |
| `vessel-day-shapes` | 4 | ☐ | ☐ | 427 → |
| `signal-flags` | 4 | ☐ | ☐ | 688 → |
| `scuba-equipment-abbreviations` | 5 | ☐ | ☐ | 672 → |
| `beaufort-wind-scale` | 5 | ☐ | ☐ | 572 → |
| `radiotelephony-numbers` | 5 | ☐ | ☐ | 184 → |
| `si-prefixes` | 5 | ☐ | ☐ | 236 → |
| `greek-alphabet` | 5 | ☐ | ☐ | 208 → |
| `hex-digits-binary` | 5 | ☐ | ☐ | 145 → |
| `international-morse-letters-printed` | 5 | ☐ | ☐ | 240 → |
| `nato-phonetic` | 5 | n/a (in budget) | n/a | 29 |

## 6. Verification

- **Word audit.** A scratch vitest (not committed) calls the real `catalogDefinitions()` and prints the §1 table. Re-run after each batch to fill §5.
- **Scored identity.** For every edited topic, `scoredIdentity` (the helper in `catalog.ts`) is identical to the pre-edit value. `catalogInvariants.test.ts` already guards shipped ids.
- **Sources and limitations modal.** Component test: button present only when the topic has sources or limitations; opens a dialog listing limitations as bullets, then every source with its link; Escape and the close button return focus to the button; no `Limitations` or `Sources` heading remains in the page body. A targeted Playwright pass at 390 px and 200% text.
- **Learn refresh.** The `#166` describe in `libraryMigrations.test.ts`: old-prose catalog topic with progress gets the new `learn`, every learner field identical, idempotent, edited boundary untouched. Extended per batch.
- **Budget.** A word-budget test in `catalogSeed.test.ts` per trimmed topic, so prose cannot creep back.
- **Parser/sync.** `libraryParser` and `syncPlanner` accept the changed `learn` shape unchanged (no schema change is expected from any batch).

## 7. Out of scope

Layout of the topic page beyond the Sources control (`TOPIC_PAGE_REVAMP.md`), the Morse course internals and lesson copy, scored item wording, adding or removing topics, new imagery, and any change to what a source says or links to. User-authored topics are never trimmed; only shipped catalog content is.
