# Issue #296 — Radio Procedure lessons: source trace

> **Status: DRAFT. Not reviewed by a domain expert and not shipped.** Provenance record for the draft curriculum of Radio Procedure (`radio-procedure`), produced by Codex and edited by Claude on 2026-10-23. It lists the repository source behind every step so an independent reviewer can check each line. It is not a content authority.
> **Gate:** this lesson text may not ship until the independent domain review named in [the #296 brief](ISSUE_296_LEARNING_REDESIGN.md) §5-6 is recorded.

Status: Draft. Authority: shipped Radio Procedure definitions and Learn content only; this is not domain approval.

The requested approved design `docs/open/ISSUE_296_LEARNING_REDESIGN.md` is absent from this worktree. The lesson uses the supplied requirements and `src/domain/learning/stages.ts`.

| Step id | Exact source |
| --- | --- |
| `words-that-agree-show-roger` | src/domain/radio/radioTopics.ts:126 |
| `words-that-agree-show-wilco` | src/domain/radio/radioTopics.ts:131 |
| `words-that-agree-show-acknowledge` | src/domain/radio/radioTopics.ts:115 |
| `words-that-agree-show-affirmative` | src/domain/radio/radioTopics.ts:116 |
| `words-that-agree-show-negative` | src/domain/radio/radioTopics.ts:119 |
| `words-that-agree-choose-roger` | src/domain/radio/radioTopics.ts:126, src/domain/radio/radioTopics.ts:131, src/domain/radio/radioTopics.ts:115, src/domain/radio/radioTopics.ts:116 |
| `words-that-agree-choose-wilco` | src/domain/radio/radioTopics.ts:131, src/domain/radio/radioTopics.ts:126, src/domain/radio/radioTopics.ts:115, src/domain/radio/radioTopics.ts:116 |
| `words-that-agree-choose-acknowledge` | src/domain/radio/radioTopics.ts:115, src/domain/radio/radioTopics.ts:126, src/domain/radio/radioTopics.ts:131, src/domain/radio/radioTopics.ts:116 |
| `words-that-agree-choose-affirmative` | src/domain/radio/radioTopics.ts:116, src/domain/radio/radioTopics.ts:126, src/domain/radio/radioTopics.ts:131, src/domain/radio/radioTopics.ts:115 |
| `words-that-agree-choose-negative` | src/domain/radio/radioTopics.ts:119, src/domain/radio/radioTopics.ts:126, src/domain/radio/radioTopics.ts:131, src/domain/radio/radioTopics.ts:115 |
| `words-that-agree-contrast` | src/domain/radio/radioTopics.ts:126, src/domain/radio/radioTopics.ts:131, src/domain/radio/radioTopics.ts:115 |
| `words-that-agree-summary` | src/domain/radio/radioTopics.ts:126, src/domain/radio/radioTopics.ts:131, src/domain/radio/radioTopics.ts:115, src/domain/radio/radioTopics.ts:116, src/domain/radio/radioTopics.ts:119 |
| `ending-and-turns-show-over` | src/domain/radio/radioTopics.ts:121 |
| `ending-and-turns-show-out` | src/domain/radio/radioTopics.ts:120 |
| `ending-and-turns-show-go-ahead` | src/domain/radio/radioTopics.ts:118 |
| `ending-and-turns-show-stand-by` | src/domain/radio/radioTopics.ts:130 |
| `ending-and-turns-choose-over` | src/domain/radio/radioTopics.ts:121, src/domain/radio/radioTopics.ts:120, src/domain/radio/radioTopics.ts:118, src/domain/radio/radioTopics.ts:130 |
| `ending-and-turns-choose-out` | src/domain/radio/radioTopics.ts:120, src/domain/radio/radioTopics.ts:121, src/domain/radio/radioTopics.ts:118, src/domain/radio/radioTopics.ts:130 |
| `ending-and-turns-choose-go-ahead` | src/domain/radio/radioTopics.ts:118, src/domain/radio/radioTopics.ts:121, src/domain/radio/radioTopics.ts:120, src/domain/radio/radioTopics.ts:130 |
| `ending-and-turns-choose-stand-by` | src/domain/radio/radioTopics.ts:130, src/domain/radio/radioTopics.ts:121, src/domain/radio/radioTopics.ts:120, src/domain/radio/radioTopics.ts:118 |
| `ending-and-turns-contrast` | src/domain/radio/radioTopics.ts:121, src/domain/radio/radioTopics.ts:120 |
| `ending-and-turns-summary` | src/domain/radio/radioTopics.ts:121, src/domain/radio/radioTopics.ts:120, src/domain/radio/radioTopics.ts:118, src/domain/radio/radioTopics.ts:130 |
| `fixing-mistakes-show-say-again` | src/domain/radio/radioTopics.ts:129 |
| `fixing-mistakes-show-read-back` | src/domain/radio/radioTopics.ts:125 |
| `fixing-mistakes-show-correction` | src/domain/radio/radioTopics.ts:117 |
| `fixing-mistakes-repeat` | src/domain/radio/radioTopics.ts:188 |
| `fixing-mistakes-choose-say-again` | src/domain/radio/radioTopics.ts:129, src/domain/radio/radioTopics.ts:125, src/domain/radio/radioTopics.ts:117, src/domain/radio/radioTopics.ts:115 |
| `fixing-mistakes-choose-read-back` | src/domain/radio/radioTopics.ts:125, src/domain/radio/radioTopics.ts:129, src/domain/radio/radioTopics.ts:117, src/domain/radio/radioTopics.ts:115 |
| `fixing-mistakes-choose-correction` | src/domain/radio/radioTopics.ts:117, src/domain/radio/radioTopics.ts:129, src/domain/radio/radioTopics.ts:125, src/domain/radio/radioTopics.ts:115 |
| `fixing-mistakes-contrast` | src/domain/radio/radioTopics.ts:129, src/domain/radio/radioTopics.ts:125 |
| `fixing-mistakes-summary` | src/domain/radio/radioTopics.ts:129, src/domain/radio/radioTopics.ts:125, src/domain/radio/radioTopics.ts:117 |
| `call-order-show-one-station` | src/domain/radio/radioTopics.ts:208, src/domain/radio/radioTopics.ts:209 |
| `call-order-show-all-stations` | src/domain/radio/radioTopics.ts:215, src/domain/radio/radioTopics.ts:216 |
| `call-order-show-message-handling` | src/domain/radio/radioTopics.ts:222, src/domain/radio/radioTopics.ts:223 |
| `call-order-order-one-station` | src/domain/radio/radioTopics.ts:208, src/domain/radio/radioTopics.ts:209, src/domain/radio/radioTopics.ts:48–64 (published sequence choices) |
| `call-order-choose-one-station` | src/domain/radio/radioTopics.ts:208, src/domain/radio/radioTopics.ts:209, src/domain/radio/radioTopics.ts:48–64 (published sequence choices) |
| `call-order-order-all-stations` | src/domain/radio/radioTopics.ts:215, src/domain/radio/radioTopics.ts:216, src/domain/radio/radioTopics.ts:48–64 (published sequence choices) |
| `call-order-choose-all-stations` | src/domain/radio/radioTopics.ts:215, src/domain/radio/radioTopics.ts:216, src/domain/radio/radioTopics.ts:48–64 (published sequence choices) |
| `call-order-order-message-handling` | src/domain/radio/radioTopics.ts:222, src/domain/radio/radioTopics.ts:223, src/domain/radio/radioTopics.ts:48–64 (published sequence choices) |
| `call-order-choose-message-handling` | src/domain/radio/radioTopics.ts:222, src/domain/radio/radioTopics.ts:223, src/domain/radio/radioTopics.ts:48–64 (published sequence choices) |
| `call-order-summary` | src/domain/radio/radioTopics.ts:177–180 |
| `together-show` | src/domain/radio/radioTopics.ts:195 |
| `together-checkpoint` | src/domain/radio/radioTopics.ts:114–131, src/domain/radio/radioTopics.ts:201–225 |
| `together-contrast-1` | src/domain/radio/radioTopics.ts:121, src/domain/radio/radioTopics.ts:120 |
| `together-contrast-2` | src/domain/radio/radioTopics.ts:129, src/domain/radio/radioTopics.ts:125 |
| `together-summary` | src/domain/radio/radioTopics.ts:114–131, src/domain/radio/radioTopics.ts:177–180 |

## Needs human domain review

- `words-that-agree-choose-roger`: short explanation paraphrases the sourced meaning or sequence.
- `words-that-agree-choose-wilco`: short explanation paraphrases the sourced meaning or sequence.
- `words-that-agree-choose-acknowledge`: short explanation paraphrases the sourced meaning or sequence.
- `words-that-agree-choose-affirmative`: short explanation paraphrases the sourced meaning or sequence.
- `words-that-agree-choose-negative`: short explanation paraphrases the sourced meaning or sequence.
- `words-that-agree-contrast`: short explanation paraphrases the sourced meaning or sequence.
- `ending-and-turns-choose-over`: short explanation paraphrases the sourced meaning or sequence.
- `ending-and-turns-choose-out`: short explanation paraphrases the sourced meaning or sequence.
- `ending-and-turns-choose-go-ahead`: short explanation paraphrases the sourced meaning or sequence.
- `ending-and-turns-choose-stand-by`: short explanation paraphrases the sourced meaning or sequence.
- `ending-and-turns-contrast`: short explanation paraphrases the sourced meaning or sequence.
- `fixing-mistakes-choose-say-again`: short explanation paraphrases the sourced meaning or sequence.
- `fixing-mistakes-choose-read-back`: short explanation paraphrases the sourced meaning or sequence.
- `fixing-mistakes-choose-correction`: short explanation paraphrases the sourced meaning or sequence.
- `fixing-mistakes-contrast`: short explanation paraphrases the sourced meaning or sequence.
- `call-order-order-one-station`: short explanation paraphrases the sourced meaning or sequence.
- `call-order-choose-one-station`: short explanation paraphrases the sourced meaning or sequence.
- `call-order-order-all-stations`: short explanation paraphrases the sourced meaning or sequence.
- `call-order-choose-all-stations`: short explanation paraphrases the sourced meaning or sequence.
- `call-order-order-message-handling`: short explanation paraphrases the sourced meaning or sequence.
- `call-order-choose-message-handling`: short explanation paraphrases the sourced meaning or sequence.
- `together-contrast-1`: short explanation paraphrases the sourced meaning or sequence.
- `together-contrast-2`: short explanation paraphrases the sourced meaning or sequence.

- The three `fixing-mistakes-choose-*` steps use ACKNOWLEDGE as the fourth meaning: this stage has only three words and no documented fourth confusion partner. All options are exact scored answers from this topic, but this is an exception to the requested same-stage/contrast-set pool.
- `together-checkpoint` covers all 15 distinct ids; the schema forbids repeated ids. Extra contrasts weight OVER/OUT and SAY AGAIN/READ BACK; the three completion questions and two contrasts fit the six-asking-step limit. ROGER/WILCO/ACKNOWLEDGE are revisited in the checkpoint only.

## Needs source

- The missing approved design document must be supplied for design-conformance review.
- A fourth same-stage or documented confusion-set meaning for Fixing Mistakes; none is documented, so no new confusion claim was added.
- Concrete calls, station identities and dialogue for Radio Procedure: omitted because this topic supplies only structural placeholders.
- Partial call-element completion answer keys: omitted because the scored answers are whole sequences.
- Per-item checkpoint weights: unsupported by the current schema; duplicate ids were omitted.


## Removed after review

The draft first included three `complete` steps (`together-complete-*`). They are removed: the source gives call structure only as placeholders with no dialogue, so each could only repeat the call-order question already asked in stage 4. Nothing in the pilot uses the `complete` step kind.
