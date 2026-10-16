# Morse — recommended next slice

**Status:** recommendation prepared 2026-10-15; existing embedded-layout approval recorded in #212, no new visual approval or runtime delivery claimed.
**Authority:** execution proposal under [#201](ISSUE_201_MORSE_GAMEPLAY_CONTINUITY.md). Existing evidence and gameplay contracts remain authoritative. The mockup review in PR #212 and implementation draft #215 require reconciliation before new UI work.

## Direction

Make existing Morse games easy to find and continue. Finish the entry and handoff experience before adding another game, achievement system or storage format.

S0 already shipped in #209. S1A is a separate draft in #215. Review their combined behavior rather than rebuilding either. The [S1A source/CI review](ISSUE_201_S1A_SCOPE_REVIEW.md) confirms that #215 already implements most of this bounded proposal and that embedded architecture approval is recorded in #212. Exact rendered-state approval remains separate. This document is not approval of the existing mockups.

## Seven decisions reduced to one bounded proposal

1. **Layout:** recommend an embedded Play area on the Morse topic, preserving visible Test/repair status and access to lessons/reference. Avoid introducing another landing page in this slice. This architecture was already approved in #212; validate #215 against that recorded decision rather than requesting it again.
2. **Handoff:** retain the direct, exact “Send five words” action where it launches that challenge. Preserve truthful qualification copy for final Learn, nonqualifying Test and repair.
3. **Beginner play:** defer new known-letter word rounds. Existing unlocked checkpoint replay in #215 is bounded reuse and can remain within this slice; corpus expansion needs separate packet validation.
4. **Readouts:** show only facts current durable records support. If a summary cannot be justified from existing data, omit it in this slice; do not manufacture a combined mastery percentage.
5. **Milestones:** add no new thresholds, badges or role qualification changes.
6. **Expansion:** defer Copy & Relay and Free Transmission+ until current P0 experience passes Pixel acceptance.
7. **Persistence:** add no new durable fields. Coordinate any future record changes with #113 after its storage boundary settles.

These are recommendations, not seven independently ratified product decisions. The high-level choice is whether to finish access to existing games first; the implementation owner can resolve routine detail within that approved boundary.

## Concrete implementation review

- Compare #215 file diff and rendered 320/390px states against #212, #209 and the current main branch.
- Check fresh, mid-course, alphabet-acquired, qualified, returning and repair states; retain access to Full Test, course replay and reference.
- Verify direct challenge routes and browser-back behavior, with no formal evidence mutation from Play.
- Use existing tests for entry/handoff coverage; add regression coverage only for changed behavior.
- Capture actual active, miss, result and handoff states for the final owner review. Static proposal artwork is not runtime proof.

No new runtime edits are made by this recommendation. Owner visual review of the prepared states remains pending and can be taken in the consolidated acceptance session.
