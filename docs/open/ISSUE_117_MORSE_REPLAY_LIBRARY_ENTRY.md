# Issue #117 — Morse Replay and Library Entry

GitHub: https://github.com/BenWassa/argus/issues/117

## Status

Open.

## Problem

Two parts of the Morse experience are currently misleading or too weak.

First, replaying Morse should not collapse into a generic review/test path. A learner who chooses Replay should be able to run through the same canonical progression used during original acquisition, including mnemonic review and the same lesson structure. The implementation should know this is a replay so that existing progress is preserved and the learner is not treated as newly enrolled.

Second, the Morse Alphabet action in Library is too visually subtle. It does not clearly communicate that it is an actionable control, which means Library is failing at one of its core jobs: helping the learner understand what can be opened and what action is available next.

## Product intent

### Replay

Replay is the original guided Morse acquisition sequence rerun non-destructively.

It should reuse, rather than duplicate:

- lesson ordering;
- mnemonic-first introduction screens;
- SVG/audio/canonical Morse presentation;
- guided retrieval steps;
- word checkpoints where they belong;
- transitions and existing lesson UI.

Replay should have an explicit replay mode/state only where behavior must differ from initial enrollment.

The main behavioral difference is state consequence, not screen design.

Initial acquisition may advance acquisition state. Replay must not pretend the learner is new and must not erase, reset or counterfeit existing learning evidence.

### Library entry

Library should provide an obvious state-aware Morse action.

The control should visually read as interactive without relying on subtle typography or color treatment. It should remain consistent with Argus's restrained design language and should not introduce generic dashboard/card chrome solely to add prominence.

Expected action semantics:

- unstarted -> Start Morse;
- learning -> Continue Morse;
- completed -> Replay Morse.

If existing routing/state names require different copy, preserve the same clarity of intent.

## State requirements

Replay must preserve:

- completion;
- evidence;
- retention state;
- scheduler history;
- prior attempts;
- export/import integrity.

Replay must not:

- set a completed topic back to unstarted or learning;
- erase prior evidence;
- create a second first-completion event;
- broaden the scored Morse boundary;
- treat mnemonic exposure as scored evidence;
- create a new Practice mode.

A replay sitting may keep transient position so the learner can move through the sequence, but replay position must be modeled separately from the canonical earned-state record if persistence is required.

## UX requirements

### Replay entry

A completed Morse learner must have a clear Replay action.

Starting Replay should begin at the start of the canonical course progression unless the product deliberately exposes a separate resume-replay affordance later.

The flow should use the same surfaces as original acquisition. Do not make a parallel "review version" of each screen.

Copy that is explicitly first-time-only should be made context-aware where necessary, but shared content should remain shared.

### Library

The Morse action must:

- look like a button/control at a glance;
- use an action label that describes the result;
- maintain at least a 44 CSS px touch target;
- remain keyboard accessible;
- preserve visible focus treatment;
- remain clear at phone width and 200% text;
- not depend on color alone for interactivity.

## Architecture direction

Prefer a small explicit context such as an acquisition run mode over duplicating lesson definitions:

```
mode: "initial" | "replay"
```

The canonical lesson graph/content should remain one source of truth.

Behavioral writes can then branch at the boundary:

- `initial`: normal acquisition-state transitions;
- `replay`: transient run progression only, preserving earned state.

Do not fork mnemonic data, lesson order or checkpoint content between initial and replay paths.

## Validation

Add regression coverage for:

1. completed learner can launch Replay;
2. Replay starts from canonical lesson 1;
3. Replay displays mnemonic content again;
4. Replay follows the same ordered lesson/checkpoint graph;
5. Replay does not reset completion;
6. Replay does not delete/replace evidence or attempts;
7. Replay does not issue duplicate first-completion semantics;
8. Library action text changes appropriately by learner state;
9. Library Morse action is a semantic interactive control with correct focus/touch behavior;
10. phone-width and 200% text layouts remain usable.

Run the complete repository gate after implementation.

## Acceptance

- [ ] Replay reuses the exact canonical Morse progression.
- [ ] Mnemonics and first-acquisition teaching screens are available during Replay.
- [ ] Replay is explicitly distinguishable in state from first-time acquisition.
- [ ] Existing earned progress is untouched.
- [ ] No parallel duplicate lesson implementation is introduced.
- [ ] Library makes the Morse action immediately recognizable.
- [ ] Action copy reflects Start / Continue / Replay semantics.
- [ ] Accessibility and responsive behavior remain correct.
- [ ] Regression coverage protects replay-state and Library-action behavior.
