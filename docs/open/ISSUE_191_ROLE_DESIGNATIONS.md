# Issue #191 — Role-based learning designations

**Status:** scoped concept / owner decision pending — 2026-10-07.  
**Authority:** active product-design proposal for #191. It does not change shipped progress, completion, navigation, or anti-gamification rules until an implementation decision is approved and merged.  
**Companion asset lane:** #192 — custom role badge art system.

## 1. Owner direction

Argus should reconsider its previous blanket rejection of gamification.

The intended change is narrow: add motivating **role/designation goals** built from real topic completion. Do not reintroduce generic XP, streak pressure, leaderboards, or a single mastery score.

The first idea was an overall military-rank ladder based on total learning. The preferred direction is now different:

> A learner chooses a role such as **Communicator**, **Operator**, **Medic**, or **Diver** and earns it by completing a finite, authored set of Argus topics.

This creates a longer-term objective while preserving the existing truth of each individual topic.

## 2. Product shape

### Third primary destination

Working navigation:

```
Home · Roles · Library
```

The rename of Today → Home and the Home screen redesign remain a separate workstream. #191 owns only the new role/designation destination and its progression model.

Working screen label: **Roles**. “Designations” is acceptable internal language but is less direct as navigation copy.

The Roles screen should answer, without requiring a separate Progress destination:

1. Which roles exist?
2. Which roles have been earned?
3. What topics does each role require?
4. Which requirements are complete, active, or untouched?
5. What is the most useful next topic for that role?

### Role detail

A role detail should show a finite checklist/path, not an opaque percentage:

```
COMMUNICATOR

✓ NATO Alphabet
✓ Radio Numbers
• International Morse Code
○ Radio Procedure
○ Marine VHF Routine Calling
○ Marine VHF Priority Communications
○ Signal Flags

3 of 7 complete
```

The display can use an engraved progress treatment, but the underlying truth is the requirement list.

## 3. Completion semantics

A role definition is authored content:

```ts
interface RoleDefinition {
  id: string
  title: string
  description: string
  requiredTopicIds: string[]
  optionalTopicIds?: string[]
  safetyNote?: string
  badgeId?: string
}
```

Learner role state should be **derived**, not separately awarded by mutable counters.

A required topic counts when its permanent completion history exists under current Argus rules. Partial acquisition, lesson progress, Tests attempted, time spent, and item count do not satisfy it.

Important consequence:

- earning a role is a historical fact once all required topics have been completed;
- a later decayed topic can make the role **needs refresh** or similar if the UI eventually wants a freshness reading;
- decay does not erase the fact that the role was once earned.

Do not use the role layer to change `Topic.status`, evidence, Morse readiness, Test scoring, or scheduler behavior.

## 4. Current-catalog feasibility

The current shipped catalog has 24 topics. The role idea should use that reality instead of inventing requirements simply to fill a badge.

### Communicator — strong v1 candidate

The existing library already has a coherent communications cluster:

- `nato-phonetic` — NATO Alphabet
- `international-morse-letters-printed` — International Morse Code
- `radiotelephony-numbers` — Radio Numbers
- `radio-procedure` — Radio Procedure
- `marine-vhf-routine-calling` — Marine VHF Routine Calling
- `marine-vhf-priority-communications` — Marine VHF Priority Communications
- `signal-flags` — Signal Flags

This is the clearest first role to prototype because the requirements are already substantial and thematically coherent.

### Operator — plausible v1 candidate, exact boundary needs editorial work

Potential existing material includes:

- `cardinal-bearings`
- `whole-circle-bearings`
- `reciprocal-bearings`
- `north-references-declination`
- `grid-north-map-bearings`
- `ooda-loop`
- `beaufort-wind-scale`
- `cloud-genera`

Potentially related safety content such as `firearm-safety-acts-prove` should not be included merely to make the role feel more “operator-like”. The role boundary must describe a coherent knowledge objective first.

### Diver — promising identity, current boundary needs expansion/decision

Current obvious seed:

- `scuba-equipment-abbreviations`

Related marine/weather/navigation topics may be useful prerequisites, but using generic marine topics to pad a Diver badge would make the role arbitrary. Decide whether Diver is:

1. a cross-domain role allowed to reuse navigation/weather/communications requirements; or
2. deferred until more genuinely dive-specific topics exist.

### Medic — defer as an earnable v1 role unless catalog expands

The obvious current medical foundation is:

- `primary-survey`

That is not enough material for a meaningful Medic designation. Keep Medic visible as a future/planned role only if the UI can present that honestly, or omit it until the catalog has a real finite pathway.

## 5. Requirement overlap

Roles **may share topics**.

Example: a marine VHF topic could contribute to Communicator and later to Diver. Completing it once should satisfy the requirement everywhere because the underlying topic completion is the same fact.

Do not duplicate topics per role and do not invent role-specific completion copies.

## 6. Optional topics

A later version may distinguish:

- **required** — necessary to earn the role;
- **recommended/optional** — useful extension but does not block earning.

Do not let optional topics inflate an XP-like role score. They are additional learning, not currency.

## 7. Tiers

Tiers are deliberately deferred.

Possible later models:

- Level I / II / III;
- Basic / Advanced;
- one core badge plus small earned marks.

Do not model tiers in v1 unless the single-boundary role system proves too limiting. A flat role is easier to understand, author, migrate and test.

## 8. Overall military rank

Keep as an explored alternative, not the implementation baseline.

Problems with one global rank:

- it implies that unlike subjects are directly commensurable;
- total topic count becomes a proxy for knowledge quality;
- adding new catalog content can arbitrarily move rank thresholds;
- real military rank language introduces an authority/status implication unrelated to what Argus proves.

If revisited, it should be a purely fictional Argus progression rather than copied real-world rank structures.

## 9. Safety and claim boundary

Role names are **internal learning designations**, never credentials.

Argus must not imply that completing recall topics makes the user a qualified:

- medic;
- diver;
- radio operator;
- firearms professional;
- military operator;
- or holder of any regulated/professional qualification.

Safety-sensitive role pages should carry a concise boundary statement where needed.

## 10. Third-screen UX principles

The Roles screen can be more playful than Home without discarding the current design system.

Recommended structure:

- compact earned/in-progress role overview;
- one custom badge per role;
- clear locked / in progress / earned states;
- tap a role to open its finite requirement path;
- status comes from topic completion, not decorative XP;
- current Argus brushed-gunmetal material remains the base;
- more colour is acceptable in badge artwork than in Home, but do not turn the entire surface into a game HUD.

No official military insignia should be used.

## 11. Persistence and sync

Preferred v1 architecture:

- role definitions ship with the app/catalog as versioned authored data;
- learner role progress is derived from the canonical topic records;
- no new per-role progress counter is required;
- a persisted `earnedAt` should be added only if the product needs the historical date and it cannot be derived safely from requirement completion timestamps.

Before implementation, decide how definition changes work. If a role gains a new required topic after being earned, silently revoking it would be hostile. Candidate policy:

> Once a role is earned under a published definition version, preserve the earned record; later definition versions can show new requirements as extension/refresh work rather than retroactively invalidating the achievement.

This needs an explicit versioning design before code.

## 12. Relationship to prior anti-gamification decision

The current `PRODUCT.md`, `DESIGN.md`, and #92 ratification explicitly reject badges/gamification.

#191 does **not** make those documents wrong merely by existing. If the owner approves this role system and implementation proceeds, update those contracts narrowly:

- permit finite, evidence-backed role designations;
- continue rejecting XP, streak pressure, leaderboards and aggregate mastery scoring;
- preserve the rule that decorative game mechanics cannot redefine learning evidence.

## 13. Work phases

### Phase A — product definition

- approve the word “Roles” or choose another label;
- choose the first 2–3 earnable roles;
- author exact requirement lists;
- decide overlap and optional-topic policy;
- decide earned-vs-freshness semantics;
- decide role-definition versioning.

### Phase B — UX

- mock the third mobile destination in current Argus tokens;
- design role list + role detail;
- verify Home / Roles / Library bottom navigation at Pixel width;
- cover no roles earned, role in progress, earned, and stale/repair states.

### Phase C — badge system

Owned by #192.

### Phase D — implementation

Only after owner approval:

- typed role-definition module;
- pure derivation from topic records;
- route + third nav item;
- role list/detail UI;
- catalog/definition validation;
- tests for role earning, overlap, repair, definition changes and accessibility;
- update `PRODUCT.md` / `DESIGN.md`.

## 14. Decisions still required

- [ ] Final screen name: Roles vs another label.
- [ ] First earnable roles.
- [ ] Exact Operator boundary.
- [ ] Whether Diver can reuse cross-domain marine/navigation topics.
- [ ] Whether Medic stays hidden until its curriculum exists.
- [ ] Optional-topic behavior.
- [ ] Earned role vs later topic decay presentation.
- [ ] Role-definition versioning policy.
- [ ] Whether tiers are still wanted after testing v1.
- [ ] Whether a global fictional rank system remains interesting after roles ship.
