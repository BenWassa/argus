# Issue #296 — Signal Flags lessons: source trace

> **Status: DRAFT. Not reviewed by a domain expert and not shipped.** Provenance record for the draft curriculum of Signal Flags (`signal-flags`), produced by Codex on 2026-10-23. Every step's text is derived at run time from `flags.ts`, `flagBank.ts` and `flagTopic.ts`, so it cannot drift from the shipped topic; this table names the line behind each step for an independent reviewer. It is not a content authority.
> **Gate:** this lesson text may not ship until the independent review in [`ISSUE_147_148_MARITIME_DOMAIN_REVIEW.md`](ISSUE_147_148_MARITIME_DOMAIN_REVIEW.md) and the #296 brief §6 is recorded.

Authority: Existing shipped topic definitions and Learn content only. This report is provenance, not a new content authority.

Implementation follows the supplied five-stage brief and `src/domain/learning/stages.ts`. This root report is placed here as explicitly requested.

| Step id | Exact source |
| --- | --- |
| show-a | `src/domain/maritime/flags.ts:84` (A entry: name, meaning, description); `src/domain/maritime/flagBank.ts:39` (published alt) |
| choose-a | `src/domain/maritime/flagBank.ts:29` (published prompt, answer and options); `src/domain/maritime/flags.ts:251` (answer format); `src/domain/maritime/flags.ts:86` (A meaning); `src/domain/maritime/flagTopic.ts:93` (distinction) |
| show-b | `src/domain/maritime/flags.ts:96` (B entry: name, meaning, description); `src/domain/maritime/flagBank.ts:39` (published alt) |
| choose-b | `src/domain/maritime/flagBank.ts:29` (published prompt, answer and options); `src/domain/maritime/flags.ts:251` (answer format); `src/domain/maritime/flags.ts:98` (B meaning); `src/domain/maritime/flagTopic.ts:91` (distinction) |
| show-o | `src/domain/maritime/flags.ts:172` (O entry: name, meaning, description); `src/domain/maritime/flagBank.ts:39` (published alt) |
| choose-o | `src/domain/maritime/flagBank.ts:29` (published prompt, answer and options); `src/domain/maritime/flags.ts:251` (answer format); `src/domain/maritime/flags.ts:174` (O meaning); `src/domain/maritime/flagTopic.ts:93` (distinction) |
| show-u | `src/domain/maritime/flags.ts:184` (U entry: name, meaning, description); `src/domain/maritime/flagBank.ts:39` (published alt) |
| choose-u | `src/domain/maritime/flagBank.ts:29` (published prompt, answer and options); `src/domain/maritime/flags.ts:251` (answer format); `src/domain/maritime/flags.ts:186` (U meaning); `src/domain/maritime/flagTopic.ts:90` (distinction) |
| show-v | `src/domain/maritime/flags.ts:199` (V entry: name, meaning, description); `src/domain/maritime/flagBank.ts:39` (published alt) |
| choose-v | `src/domain/maritime/flagBank.ts:29` (published prompt, answer and options); `src/domain/maritime/flags.ts:251` (answer format); `src/domain/maritime/flags.ts:201` (V meaning); `src/domain/maritime/flagTopic.ts:90` (distinction) |
| show-w | `src/domain/maritime/flags.ts:214` (W entry: name, meaning, description); `src/domain/maritime/flagBank.ts:39` (published alt) |
| choose-w | `src/domain/maritime/flagBank.ts:29` (published prompt, answer and options); `src/domain/maritime/flags.ts:251` (answer format); `src/domain/maritime/flags.ts:216` (W meaning); `src/domain/maritime/flagTopic.ts:90` (distinction) |
| show-d | `src/domain/maritime/flags.ts:104` (D entry: name, meaning, description); `src/domain/maritime/flagBank.ts:39` (published alt) |
| choose-d | `src/domain/maritime/flagBank.ts:29` (published prompt, answer and options); `src/domain/maritime/flags.ts:251` (answer format); `src/domain/maritime/flags.ts:106` (D meaning); `src/domain/maritime/flagTopic.ts:89` (distinction) |
| show-f | `src/domain/maritime/flags.ts:116` (F entry: name, meaning, description); `src/domain/maritime/flagBank.ts:39` (published alt) |
| choose-f | `src/domain/maritime/flagBank.ts:29` (published prompt, answer and options); `src/domain/maritime/flags.ts:251` (answer format); `src/domain/maritime/flags.ts:118` (F meaning); `src/domain/maritime/flagTopic.ts:89` (distinction) |
| show-m | `src/domain/maritime/flags.ts:157` (M entry: name, meaning, description); `src/domain/maritime/flagBank.ts:39` (published alt) |
| choose-m | `src/domain/maritime/flagBank.ts:29` (published prompt, answer and options); `src/domain/maritime/flags.ts:251` (answer format); `src/domain/maritime/flags.ts:159` (M meaning); `src/domain/maritime/flagTopic.ts:92` (distinction) |
| show-j | `src/domain/maritime/flags.ts:130` (J entry: name, meaning, description); `src/domain/maritime/flagBank.ts:39` (published alt) |
| choose-j | `src/domain/maritime/flagBank.ts:29` (published prompt, answer and options); `src/domain/maritime/flags.ts:251` (answer format); `src/domain/maritime/flags.ts:132` (J meaning); `src/domain/maritime/flagTopic.ts:91` (distinction) |
| show-l | `src/domain/maritime/flags.ts:142` (L entry: name, meaning, description); `src/domain/maritime/flagBank.ts:39` (published alt) |
| choose-l | `src/domain/maritime/flagBank.ts:29` (published prompt, answer and options); `src/domain/maritime/flags.ts:251` (answer format); `src/domain/maritime/flags.ts:144` (L meaning); `src/domain/maritime/flagTopic.ts:92` (distinction) |
| show-y | `src/domain/maritime/flags.ts:230` (Y entry: name, meaning, description); `src/domain/maritime/flagBank.ts:39` (published alt) |
| choose-y | `src/domain/maritime/flagBank.ts:29` (published prompt, answer and options); `src/domain/maritime/flags.ts:251` (answer format); `src/domain/maritime/flags.ts:232` (Y meaning); `src/domain/maritime/flags.ts:232`; `src/domain/maritime/flags.ts:118`; `src/domain/maritime/flags.ts:159` (distinction) |
| contrast-u-v-w | `src/domain/maritime/flags.ts:256` (confusion set U, V, W); `src/domain/maritime/flags.ts:186` (verbatim prompt); `src/domain/maritime/flagTopic.ts:90` (distinction) |
| contrast-d-f-m | `src/domain/maritime/flags.ts:256` (confusion set D, F, M); `src/domain/maritime/flags.ts:106` (verbatim prompt); `src/domain/maritime/flagTopic.ts:89` (distinction) |
| contrast-j-b | `src/domain/maritime/flags.ts:256` (confusion set J, B); `src/domain/maritime/flags.ts:132` (verbatim prompt); `src/domain/maritime/flagTopic.ts:91` (distinction) |
| contrast-l-m | `src/domain/maritime/flags.ts:256` (confusion set L, M); `src/domain/maritime/flags.ts:144` (verbatim prompt); `src/domain/maritime/flagTopic.ts:92` (distinction) |
| checkpoint-d-f-m | `src/domain/maritime/flags.ts:256` (confusion set D, F, M); `src/domain/maritime/flags.ts:118` (verbatim prompt); `src/domain/maritime/flagTopic.ts:89` (distinction) |
| checkpoint-u-v-w | `src/domain/maritime/flags.ts:256` (confusion set U, V, W); `src/domain/maritime/flags.ts:216` (verbatim prompt); `src/domain/maritime/flagTopic.ts:90` (distinction) |
| checkpoint-b-j | `src/domain/maritime/flags.ts:256` (confusion set B, J); `src/domain/maritime/flags.ts:98` (verbatim prompt); `src/domain/maritime/flagTopic.ts:91` (distinction) |
| checkpoint-l-m | `src/domain/maritime/flags.ts:256` (confusion set L, M); `src/domain/maritime/flags.ts:159` (verbatim prompt); `src/domain/maritime/flagTopic.ts:92` (distinction) |
| checkpoint-a-o | `src/domain/maritime/flags.ts:256` (confusion set A, O); `src/domain/maritime/flags.ts:174` (verbatim prompt); `src/domain/maritime/flagTopic.ts:93` (distinction) |
| checkpoint-all-twelve | `src/domain/maritime/flagTopic.ts:118` (all twelve scored items); `src/domain/maritime/flags.ts:256` (five confusion sets revisited by the accompanying contrasts) |

## Needs human domain review

All show bodies, alt text, scored prompts, options, answers and contrast prompts are direct copies of shipped source values. The following explanations combine or shorten sourced meanings; review their wording:

- `choose-a`: explanation restates the cited distinction.
- `choose-b`: explanation restates the cited distinction.
- `choose-o`: explanation restates the cited distinction.
- `choose-u`: explanation restates the cited distinction.
- `choose-v`: explanation restates the cited distinction.
- `choose-w`: explanation restates the cited distinction.
- `choose-d`: explanation restates the cited distinction.
- `choose-f`: explanation restates the cited distinction.
- `choose-m`: explanation restates the cited distinction.
- `choose-j`: explanation restates the cited distinction.
- `choose-l`: explanation restates the cited distinction.
- `choose-y`: explanation restates the cited distinction.
- `contrast-u-v-w`: explanation restates the cited distinction.
- `contrast-d-f-m`: explanation restates the cited distinction.
- `contrast-j-b`: explanation restates the cited distinction.
- `contrast-l-m`: explanation restates the cited distinction.
- `checkpoint-d-f-m`: explanation restates the cited distinction.
- `checkpoint-u-v-w`: explanation restates the cited distinction.
- `checkpoint-b-j`: explanation restates the cited distinction.
- `checkpoint-l-m`: explanation restates the cited distinction.
- `checkpoint-a-o`: explanation restates the cited distinction.

## Needs source

- The missing approved design document is needed to verify alignment beyond the supplied brief and schema.
- No additional domain content was omitted for lack of a source; signalling procedure and contextual extensions remain outside the shipped recognition boundary.

## Validation

- `npx tsc -b`: passed.
- `npx vitest run src/domain/maritime/flagCurriculum.test.ts`: passed (3 tests).
- Only the requested curriculum, adjacent test and this report were added; existing topic content was not edited. No Playwright, commit, push or git metadata operations were performed.
