# Targeted practice

> **Status:** implemented under #92 batch 5. This is the maintained contract for
> the practice surface. The decision it rests on is §15.5 of
> `docs/open/LEARNING_EXPERIENCE_DESIGN_DECISION.md`, ratified 2026-09-14:
> **repair is formative**. `docs/open/ARGUS_OVERHAUL_RATIFICATION.md` is the
> programme-level package; `docs/open/PROGRESS_ARCHITECTURE.md` remains the
> authority for the state boundaries this surface must not cross.

## What it is

A bounded formative run over what a check just missed. The learner reaches it
from the check's end screen, or from the topic page while a miss still stands.

It asks only the weak material, it re-asks anything missed inside the run, and
it ends by handing back to the check. It is the answer to "I got four letters
wrong, must I now sit all twenty-six again?" — no, practise the four, then take
the check when you are ready.

## The evidence boundary

Practice writes nothing. Not cue evidence, not an attempt, not `lastTestedAt`,
not a status transition, not a completion.

This is enforced structurally rather than by policy. `PracticeRun.tsx` imports
no store write path, no scheduler and no evidence recorder, which is the same
guarantee `MorseReplay` gives and for the same reason: a surface that cannot
reach durable state cannot corrupt it. `src/features/practice/PracticeRun.test.tsx`
asserts the absence of those imports directly, so an edit that reintroduces one
fails the suite rather than quietly changing what practice means.

The behavioural half of the same claim: a completed run leaves `localStorage`
byte-identical, asserted both in the component test and end to end in
`e2e/practice.spec.ts`.

What follows from this:

- Practice cannot re-bank anything. The next check re-earns the evidence.
- Practice cannot fail a learner. There is no outcome it can record.
- A topic keeps offering practice until a later **check** answers those items
  correctly. Nothing has to remember that practice was taken, because taking it
  changes nothing.

## Selecting what to practise

Two entry points, two sources, one reason.

### From the topic page — derived from durable evidence

`practiceTargets(topic)` in `src/lib/practice.ts` reads
`topic.itemEvidence[itemId].directions[direction]`. A direction is a target when
`attempts > 0 && consecutiveCorrect === 0` — precisely a direction whose most
recent answer was wrong.

`consecutiveCorrect` does the whole job. It is zeroed by a miss and rebuilt by
correct answers, so no new field is needed to record "what was missed", and the
target retires itself the moment a later check answers it. That is the ratified
policy expressed as selection rather than as bookkeeping.

Directions a required item has never been tried in are included as `untried`
targets, ordered after every real miss. They make a run useful without ever
displacing the material the learner actually came for.

The **offer** is made on misses alone (`hasPractice`), so a topic that has simply
never been tested does not advertise repair work it has no grounds to claim.

### From the check's end screen — named explicitly

`targetsForItems(topic, itemIds)` takes the set the finished run hands over.

This path exists because **an ordinary reveal-and-grade topic writes no per-item
evidence at all.** Only the progressive cue-ladder cards call `recordAnswer`;
`commitGrade` records a tally and nothing else. For NATO, bearings and every
other ordinary topic, the run that just ended is the only thing that knows what
was missed, and that knowledge dies with the component.

`Session` therefore keeps a `missedItems` ref — run bookkeeping, never evidence,
never written to a topic — and `TestDone` offers it. Recording it inside
`recordGrade` covers both grade paths, self-scored and ladder alike.

### The consequence, stated plainly

The topic-page offer appears only for a topic that keeps per-item evidence,
which today means Morse. An ordinary topic's offer lives on the check's end
screen and lasts only as long as that screen.

This is a real limit, not an oversight. Closing it means either a new durable
field or making ordinary Test answers write `itemEvidence` — and that store is
the one `hasCompleteDirectionalCoverage` reads to gate completion. Both were
out of scope for batch 5, which was given "no new durable state" and no change
to the evidence contract. It is the obvious candidate for a follow-up, and it
should be decided deliberately rather than absorbed.

## The run

`src/lib/practiceRun.ts` is the whole policy, as pure functions.

- At most `PRACTICE_LIMIT` (10) targets, matching the lesson sitting and the
  replay limit so a formative run has a pace the learner already recognises.
- A correct answer settles the target and moves straight on. The learner just
  produced the answer; showing it back costs a tap and tells them nothing.
- A miss holds, names the answer, and pushes the target back
  `PRACTICE_REVISIT_GAP` (2) places. Re-asking immediately would be answered
  from the echo of the answer just shown — recognition wearing recall's
  clothes.
- The run ends only once every target has been retrieved, which is what makes
  it practice rather than a second chance to be told.
- Identity is item **and** direction: recalling `-...` from `B` and `B` from
  `-...` are two retrievals, and settling one must not settle the other.

Order is deterministic for a given library: most recent miss first, then untried
oldest first, ties broken by the topic's own item order.

## Placement and copy

- The topic page offer is a `quiet topic-alt` text-weight control. It is never
  the primary action, because the primary action is the check — only the check
  can re-earn anything.
- The end screen offer sits below the outcome copy and above `Back to today`,
  and carries no accent. The end screen's one brass moment belongs to banking a
  completion; a miss is not an event to mark.
- Offers count **items**, not directions. A bidirectional item missed both ways
  is one thing to go and fix, and calling it two would overstate the damage.
- The offer names a count and never an answer, so the end screen keeps the
  answer confidentiality the check itself maintains.

## Naming, and a collision that was avoided

The design paper calls this *repair*. The shipped product already uses that word
for something else: `JourneyPhase = 'repair'` is set when `topic.status ===
'decayed'`, and the learner sees **"Needs repair"** on a decayed topic whose
remedy is a full *scored* Test.

Using one word for a scored full-deck retention run and an unscored partial
formative run would have been the clearest possible way to blur the boundary
this batch exists to protect. The shipped label was left alone and the new
surface is called **practice**.

This is a reversible labelling decision and it is the one part of batch 5 worth
an explicit look. If `Repair` is wanted for the formative run, the decay label
needs a different word first.

## Route model

Practice is a `run` route in `learn` mode with `target: { kind: 'practice';
itemIds?: string[] }`. `learn` is already the internal formative mode, so
practice inherits the right side of the formative/scored split rather than
introducing a third mode that some future switch could mistake for scored.

`itemIds` is present only on the end-screen path. Absent, the run derives its
own queue, which is what lets the topic-page entry work without the route
carrying a stale copy of a selection the library can recompute.

Practice is **not** resumable. It persists nothing, so restoring the entry would
silently restart a run the learner did not ask for; it falls back to its origin
exactly as replay and checkpoints do. `sameTarget` compares `itemIds`, so two
offers over different sets are different routes and the second is not a no-op.

## Coverage

| File | What it holds |
| --- | --- |
| `src/lib/practice.test.ts` | selection from durable evidence, ordering, the bound, offer counting, imperfect libraries |
| `src/lib/practiceRun.test.ts` | queue policy, re-queue gap, direction identity, feedback |
| `src/features/practice/PracticeRun.test.tsx` | the import boundary, storage identity, what it asks, reveal |
| `src/features/test/Session.practice.test.tsx` | the end-screen offer for an ordinary topic |
| `src/lib/navigation.test.ts` | route validation, malformed item lists, route equality |
| `e2e/practice.spec.ts` | the App seam: offer → route → run → nothing written; reload fallback |

## Not in scope

No scheduler change, no new durable field, no change to the cue-evidence
contract or the #68 completion gate, no storage version change, and no migration
— practice reads state that already exists. #90's lesson-scheduling policy
(batch 6) remains separate and still carries the programme's one additive
migration.
