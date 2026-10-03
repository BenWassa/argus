# Compact library topics

**Status:** implemented and published for review, 2026-10-02; not merged or deployed. Batches 0a–5 are ready in PRs #168–#174, with the rebuild in #170. Tracking issue: #166. Owner domain review remains open for survival and maritime content.
**Authority:** active implementation and review contract for #166. After merge, the layout and content-refresh sections remain maintained contracts in `docs/open/`; review status is not a production-delivery claim. `TOPIC_PAGE_REVAMP.md` owns the surrounding page/Test rebuild; this document owns compact copy and the provenance modal.
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
- **Safety topics.** Firearm Safety and Primary Survey keep their full authored `scope` visible under the title, even with ordered recall. Their boundary must not depend on a closed fold or modal. Primary Survey now ends “not first-aid or clinical training”; Firearm Safety retains “not handling a firearm”. Only the exact former Primary Survey scope migrates; custom scopes and edited scored sets stay untouched.
- Accessibility: the button is a real `<button aria-haspopup="dialog">`; its muted style must still clear 4.5:1 on `--surface-2` (text this small is the case the token comments warn about); at 200% text the modal scrolls internally and never clips the close control. Links keep `target="_blank" rel="noreferrer"`.
- Offline: no change. Links are the only network touch and already were.

### 2.3 Limitations as bullets

Limitations are authored as a short bullet list (≤ 3 bullets, ≤ 25 words each, §3.3), each one fact: what the topic does not claim. They are no longer prose paragraphs. `LearnContent.limitations` is already `string[]`, so there is no schema change; the change is in how short they are and where they render.

### 2.4 Learn-content refresh for existing learners

`reconcileCatalog` appends but never rewrites held topics. `refreshShippedLearn` in `libraryMigrations.ts` is the existing opt-in path for new explanatory content. Every trimmed topic is registered in `REFRESHED_LEARN_TOPIC_IDS` (Beaufort was already registered).

The refresh now requires catalog ownership, the full shipped scored identity (IDs, directions, prompts/answers, choices and visual/audio response data), and an unchanged scope or its exact registered predecessor. It changes only `learn`; all status, timestamps, evidence and history remain identical. User-owned topics and edited scored sets/scopes are skipped. Repeating it returns the same object.

Primary Survey has one explicit presentation migration in `PREVIOUS_SHIPPED_SCOPES`. `refreshShippedScopes` changes only the exact former scope of an unchanged catalog copy to add the visible training boundary. It does not reset progress or broaden Test. This is separate from Learn refresh and runs through the stored/imported-library reconciliation path.

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

Words of non-source Learn text, per topic. Confirmed by the Batch 1 pilot and enforced for trimmed topics. Section budgets count prose only (paragraphs, bullets and steps); reference definitions, tables, entries, pictures, captions and alternative text are not prose-budget targets.

| Shape | Overview | Sections | Case study | Limitations |
| --- | --- | --- | --- | --- |
| concise | ≤ 25, or none | ≤ 90 | none | ≤ 2 bullets, ≤ 20 words each (exceptions below) |
| briefing | ≤ 30, or none | ≤ 130 | ≤ 90 (scenario, walkthrough, takeaway) | ≤ 3 bullets, ≤ 25 words each |

The OODA pilot landed at 15 / 89 / 82 / 42 against these and they held. Navigation and maritime concise topics use up to three bullets of up to 25 words to retain editorial provenance, access constraints and safety boundaries separately. Other compact concise topics retain the two-bullet target; SCUBA and the survival briefings use the briefing target. A topic already inside budget is left alone. NATO Alphabet (29) and Compass Bearings (36) need no change.

### 3.4 Visual-heavy topics

Navigation Lights (810 section words), Signal Flags (544), SCUBA Equipment (509) and Beaufort (451) are mostly `entries`/table reference. The audit counted those with prose, so their trimmable share is unknown until the pilot separates the two. **Measured for Batches 4/5:** section prose is 212 → 110 (lights), 163 → 65 (flags), 210 → 121 (SCUBA), and 0 → 0 (Beaufort on the content base). Reference structures remain byte-identical. The integrated rebuild adds 28 unchanged words of Beaufort field-guide prose and 109 reference words; including these, Beaufort is 709 → 635, rather than the content-base 572 → 498.

### 3.5 Accuracy guard

- No scored item, answer, id, order or `kind` changes. A scratch test asserts `scoredIdentity` is identical before and after for every edited topic.
- Cutting a sentence must not orphan a source note: if a source note cites a claim, that claim stays in the topic (or the note is trimmed in the same PR, and says why).
- Safety-critical and medical topics (Firearm Safety, Primary Survey) and the maritime visual topics (Navigation Lights, Day Shapes, Signal Flags) get an **owner domain review** on the diff before merge. The trimmed text is reviewed as claims, not as style.
- The agent doing the edit proposes a before/after word count and a one-line "what was cut" per section in the PR body, so the reviewer can see cuts without diffing blocks of prose.

## 4. Work breakdown

One PR per batch. Each batch is gated on unit tests plus a targeted e2e; the full Playwright suite flakes under load (see `TOPIC_PAGE_REVAMP.md` §7).

| Batch | Scope | Depends on | Review |
| --- | --- | --- | --- |
| **0a** | "Sources and limitations" button and modal for all topics; remove inline Limitations and Sources from `LearnSupport`. **PR #171**, stacked on rebuild **#170** | topic-page rebuild merged, or built on `feat/topic-revamp-integration` | UI, a11y |
| **0b** | ~~Learn-content refresh~~ **Not needed:** `refreshShippedLearn` exists (§2.4). Each content batch registers its ids | n/a | n/a |
| **1** | Pilot trim: **OODA Loop**; confirm budgets in §3.3. **In review: #168** | none (0a changes the final look only) | owner reads the diff |
| **2** | Survival briefings: Primary Survey, Firearm Safety. **PR #169**, stacked on #168; visible Primary Survey scope migration included | 1 | owner domain review |
| **3** | Navigation: Cardinal (no-op), Whole-circle, Reciprocal, North References, Grid North. **PR #172**, stacked on #169 | 1 | owner skim |
| **4** | Maritime: Navigation Lights, Vessel Day Shapes, Signal Flags. **PR #174**, stacked on #172 | 1, §3.4 measure | owner domain review |
| **5** | Reference topics: SCUBA, Beaufort, Radio Numbers, SI Prefixes, Greek, Hex, International Morse. **PR #173**, stacked on #174 | 1, §3.4 measure | owner skim |

Why OODA first: lowest domain risk, worst words-to-items ratio (556 words around 4 items), and its prose is the clearest example of the lead-in problem, so it calibrates the budgets cheaply.

0a is independent of 1–5 in code. Each of 1–5 reaches existing learners through its own `REFRESHED_LEARN_TOPIC_IDS` entry.

Some existing tests pin the old wording of limitations (`catalogSeed.test.ts` asserts three Firearm Safety limitation phrases and an OODA one). A trim updates those assertions to the new wording and keeps what they protect: that the boundary is stated.

### 4.1 Base branch and merge order

The topic-page rebuild is published as #170 (`feat/topic-revamp-integration`) and is not merged. It rewrites `TopicPage.tsx` (432 lines, down from 583) and changes `LearnSupport.tsx`. Batch 0a edits `LearnSupport.tsx` and the foot of `TopicPage.tsx`, so building it on current `main` guarantees a conflict. Build 0a on the integration branch, or wait for it to merge. Content batches share the seed, refresh list and tests. The final integration resolves the Beaufort overview conflict while retaining the staged visual guide. The scored decks and reference structures remain unchanged.

## 5. Tracker

Update the box when the batch PR merges. Word counts are Learn text before → after on the content base. The unchanged staged Beaufort guide adds 137 words to both sides in the final integration. The rebuild also introduces Cloud Genera; it is outside the original 19-topic copy audit and its Learn text is unchanged by #166.

| Topic | Batch | Trimmed | Domain review | Words |
| --- | --- | :-: | :-: | --- |
| Sources and limitations modal (all topics) | 0a | PR #171 (base #170) | n/a | n/a |
| Learn-content refresh | 0b | n/a (already exists) | n/a | n/a |
| `ooda-loop` | 1 | PR #168 | ☐ | 556 → 228 |
| `primary-survey` | 2 | PR #169 | ☐ | 475 → 257 |
| `firearm-safety-acts-prove` | 2 | PR #169 | ☐ | 531 → 288 |
| `cardinal-bearings` | 3 | n/a (in budget) | n/a | 36 |
| `whole-circle-bearings` | 3 | PR #172 | ☐ | 343 → 173 |
| `reciprocal-bearings` | 3 | PR #172 | ☐ | 290 → 187 |
| `north-references-declination` | 3 | PR #172 | ☐ | 387 → 260 |
| `grid-north-map-bearings` | 3 | PR #172 | ☐ | 489 → 280 |
| `navigation-lights` | 4 | PR #174 | ☐ | 980 → 785 |
| `vessel-day-shapes` | 4 | PR #174 | ☐ | 427 → 303 |
| `signal-flags` | 4 | PR #174 | ☐ | 688 → 504 |
| `scuba-equipment-abbreviations` | 5 | PR #173 | ☐ | 672 → 496 |
| `beaufort-wind-scale` | 5 | PR #173 | ☐ | 572 → 498 |
| `radiotelephony-numbers` | 5 | PR #173 | ☐ | 184 → 95 |
| `si-prefixes` | 5 | PR #173 | ☐ | 236 → 112 |
| `greek-alphabet` | 5 | PR #173 | ☐ | 208 → 100 |
| `hex-digits-binary` | 5 | PR #173 | ☐ | 145 → 82 |
| `international-morse-letters-printed` | 5 | PR #173 | ☐ | 240 → 109 |
| `nato-phonetic` | 5 | n/a (in budget) | n/a | 29 |

## 6. Verification

- **Word audit.** A scratch vitest (not committed) calls the real `catalogDefinitions()` and prints the §1 table. Re-run after each batch to fill §5.
- **Scored identity.** For every edited topic, `scoredIdentity` (the helper in `catalog.ts`) is identical to the pre-edit value. `catalogInvariants.test.ts` already guards shipped ids.
- **Sources and limitations modal.** Component test: button present only when the topic has sources or limitations; opens a dialog listing limitations as bullets, then every source with its link; Escape and the close button return focus to the button; no `Limitations` or `Sources` heading remains in the page body. Playwright verifies all four configured viewports (320 px, 390 px, short landscape and desktop), including 200% text, focus trapping/return and browser Back.
- **Learn refresh.** The `#166` describe in `libraryMigrations.test.ts`: old-prose catalog topic with progress gets the new `learn`, every learner field identical, idempotent, edited boundary untouched. Extended per batch.
- **Budget.** A word-budget test in `catalogSeed.test.ts` per trimmed topic, so prose cannot creep back.
- **Parser/sync.** `libraryParser` and `syncPlanner` accept the changed `learn` shape unchanged (no schema change is expected from any batch).

## 7. Out of scope

Layout of the topic page beyond the Sources control (`TOPIC_PAGE_REVAMP.md`), the Morse course internals and lesson copy, scored item wording, adding or removing topics, new imagery, and any change to what a source says or links to. User-authored topics are never trimmed; only shipped catalog content is.

## 8. Delivery and review

The combined branch is `feat/compact-library-integration`. It combines both review stacks without changing their scored identities or dropping the staged visual guides. Content merge order: #168 → #169 → #172 → #174 → #173. UI merge order: #170 → #171. The integration PR contains the final documentation and cross-stack safety/browser checks; it can be retargeted after its dependencies land.

All implementation work for the original 19-topic request is complete. NATO and Compass Bearings remain unchanged because they were already compact. Sources remain verbatim for every topic, including Cloud Genera from the rebuild. Owner domain review for survival and maritime remains required before merge; no domain review or deployment is claimed here.

Validation results are recorded below once the final integrated run completes.
