# Issue #193 — Selected Home redesign

**Status:** merged via #195 (2026-10-07); automated regression passed; included in the owner-authorized v1.5.0 release; real Pixel acceptance remains outstanding.
**Authority:** implementation contract for #193. #126 and #127 remain the exploration/decision history.  
**Related:** #191 role/designation progression; #192 role badge art.

## 1. Goal

Replace the current Today surface with the selected **Home** design while staying close to the existing Argus visual system.

The owner-selected direction is based on the second circular-progress mockup, corrected back to the production token system:

- keep the exact shipped Argus materials/tokens;
- rename Today → Home;
- use a compact top readout: **Completed / In progress / Last active**;
- make **Active topics** the first and main content section;
- give active-topic plates a little more physical lift, but not the heavy “Lifted” treatment explored earlier;
- use circular topic-progress instruments instead of Home's horizontal gauges;
- remove classroom/course-management language from Home;
- finish with **+ Add something to learn**, reusing the existing inbox/capture flow;
- make the mobile bottom nav rounded and slightly raised without turning it into a floating/glowing dock.

No other section is required.

## 2. Production visual baseline

Do not derive implementation styling from generated images. The authority remains:

- `DESIGN.md`
- `DESIGN.json`
- `src/styles/tokens.css`
- `src/styles/global.css`

The generated mockups are composition references only.

### Chassis

- `--bg: #101215`
- `--surface: #16191d`
- `--surface-2: #1d2126`
- `--surface-3: #272c33`
- `--surface-4: #343a42`
- `--field: #0b0d10`

### Type

- `--ink: #e6eaf0`
- `--muted: #979fac`
- `--subtle: #868f9d`
- native sans for language/actions;
- native mono for readings/status/data.

### Rules/material

- `--line: #2a2f37`
- `--line-strong: #3d4450`
- `--line-hover: #5b6472`
- `--edge`
- `--edge-under`
- `--engrave`
- `--shadow-sm`
- `--shadow-key`

### Accent

Polished steel remains:

- `--accent: #e9edf3`
- `--accent-2: #ffffff`

Do not introduce a new general-purpose blue/cyan/purple palette merely because concept imagery used one.

### Substrate

Preserve the existing:

- SVG grain;
- machining marks;
- convex upper light;
- restrained sheen on raised plates.

## 3. Home information architecture

The intended mobile hierarchy is:

```
ARGUS / date / profile

┌──────────────────────────────────────┐
│ 12             3             02 OCT  │
│ COMPLETED      IN PROGRESS   LAST ACTIVE
└──────────────────────────────────────┘

ACTIVE TOPICS

◯  International Morse Code
   18 of 26 characters settled

◯  Compass Bearings
   [truthful topic progression]

◯  Radio Procedures
   [truthful topic progression]

+ Add something to learn

[ Home ]                      Library
```

Do not add a recent-activity feed, achievements area, trend chart, or another section simply to use vertical space.

## 4. Top readout

This is a single compact instrument readout, not three independent dashboard cards.

No icons.  
No progress bars.  
No large colored backgrounds.

### Completed

Definition:

> Number of topics with a permanent `completedAt` record.

This deliberately counts historical completion even if the topic later enters repair.

Do not use current `status === 'completed'` as the sole definition because that would erase historically completed topics while they are decayed.

### In progress

Definition:

> Started topics that have not yet earned permanent completion.

Use the same “started” semantics already established by `hasStarted()`: actual learner state, not merely opening/browsing a topic.

A previously completed topic that currently needs repair is **not** a never-completed “in progress” topic. Its historical completion remains real.

### Last active

Definition:

> Most recent calendar date on which the canonical library records durable study activity.

The repo already derives topic activity in:

`src/domain/study/libraryGroups.ts -> lastActivityAt(topic)`

Use/generalize this existing derivation.

The current helper already checks:

- `learningAt`
- `drilledAt`
- `completedAt`
- `lastTestedAt`
- `spotCheckedAt`
- `acquisitionReadyAt`
- Test history timestamps
- per-direction item evidence `lastAt`

Important limitation: some Morse formative state is count-based rather than timestamped. Do not claim more precision than the canonical data contains. If the Home requirement eventually needs every formative interaction to update Last active, that needs an explicit timestamp addition rather than inference.

Display example:

`02 OCT`

If no durable study timestamp exists:

`—`

Do not use app-open time, browse time, sync time, or content-capture time as study activity.

## 5. Active topics

Active topics are the main content on Home.

### Quantity

Initial mobile target remains **three** visible active topics, consistent with the current Today density.

If more exist:

- a quiet `See all` may route to Library/started topics if useful;
- do not create a vertically unbounded Home feed.

### Plate treatment

Active topics should read one visual step above the chassis.

Use production materials:

- neutral gunmetal surface;
- current border vocabulary;
- `--edge` + `--edge-under`;
- restrained `--shadow-sm` where needed.

Avoid:

- heavy ambient floating shadows on every row;
- bright category-colored slabs;
- gradient game cards;
- nested cards.

The target is “modestly raised hardware,” not B/Lifted's deep floating plates.

## 6. Circular topic-progress instrument

The owner prefers the circular/medallion progress treatment over a standard horizontal bar.

Home should therefore show **one circular progress instrument** per active topic and remove the redundant horizontal gauge.

### Design intent

The circle should:

- differentiate Home from Library without inventing a new visual language;
- feel like an Argus instrument/recessed dial;
- carry progress visually without making Home a comparison leaderboard;
- leave room for one concise textual reading beside it.

### Semantic rule

The circle represents **progress through the topic's own finite progression**, not an app-wide notion of mastery.

Do not assume every topic is entitled to a percentage.

Argus currently distinguishes:

- acquisition;
- evidence;
- retention;
- current sitting.

Those remain separate semantics.

### Numeric ring: allowed cases

A proportional ring may be used when the topic exposes a real finite ratio.

Examples:

- Morse acquisition: settled characters / total required characters;
- a future authored curriculum with completed stages / total stages;
- genuine evidence coverage where the topic persists that evidence and that is the selected progression reading.

For Morse, copy such as:

`18 of 26 characters settled`

is preferable to:

`Lesson 8 of 13`

because it states what has actually been acquired rather than describing classroom structure.

### Non-numeric ring: required fallback

Ordinary topics often do not persist item-level acquisition/evidence. For those topics, Argus must **not** manufacture 42%, 60%, 78%, etc.

Use a discrete/staged visual treatment instead.

The implementation lane must choose and test a truthful staged model. Candidate semantic states:

1. started/building;
2. completion earned;
3. needs repair;

or a richer authored progression only where the topic explicitly defines one.

A staged ring may use segments, a partial material treatment, or another non-numeric dial state. It must not imply false mathematical precision.

### Text beside the ring

Do not show procedural/classroom labels merely because they are available internally.

Avoid Home copy such as:

- `LESSON 8 OF 13`
- `READY TO TEST`
- `LESSON IN PROGRESS`

Prefer meaningful topic-specific progression, for example:

- `18 of 26 characters settled`
- a concise authored/derived progression sentence;
- no second line at all if nothing truthful and useful can be said.

The topic page remains the place to explain the next action.

## 7. Progress color

The owner wants color to relate to **progress**, not subject category.

This is intentionally different from the current track-color use.

However, existing semantic restrictions still apply.

### Hard constraints

- `--warning #d68d5e` remains repair/decay only.
- Do not use Learning / Survival / Tradecraft colors to identify subject categories on Home.
- Do not color-fill the topic plate.
- Do not create red/amber/green grading that falsely implies bad/good knowledge.

### Implementation decision still required

Determine a restrained progress treatment using existing cool tokens/material language.

Possible direction:

- incomplete/building: restrained cool steel;
- further progressed: more polished/bright portion of the same metal;
- complete: `--complete #8c98a5` or settled steel treatment;
- repair: Tarnish semantic indicator.

Prefer changes in material/lightness/filled arc before adding more hue.

If a new progress token is genuinely required, update `DESIGN.md`, `DESIGN.json`, and `tokens.css` together rather than hardcoding it in Home.

## 8. Add something to learn

Home ends with:

`+ Add something to learn`

This is not a new learning object and not a second authoring workflow.

The Library already owns:

- `useInbox()`
- `AddMenu`
- `CaptureSheet`
- new-topic fallback behavior

Refactor/share that capability so Home can launch the same underlying flow.

Preferred intent on Home:

- when inbox capture is available, open Want-to-learn capture directly;
- if product behavior chooses to preserve Library's conditional fallback, make it deterministic and covered by tests;
- do not duplicate Firestore/inbox state or validation in Home.

## 9. Rename Today → Home

Learner-facing navigation should use **Home**.

Update:

- mobile nav label;
- desktop rail label;
- accessible nav names;
- documentation/product copy;
- any UI strings that refer to Today as a destination.

Do not casually rename internal modules/routes if doing so creates migration/history risk. A route may remain internally `today` temporarily if that is the safest compatibility path, while learner-facing copy says Home.

Historical browser navigation must keep working.

## 10. Mobile bottom navigation

Selected visual direction:

- rounded external silhouette;
- slight inset from left/right/bottom safe-area edges;
- modest raised hardware treatment;
- current destination uses existing polished/current-state semantics;
- no neon glow;
- no translucent glass dock;
- no exaggerated floating shadow.

Use current radii/material vocabulary before inventing new tokens.

The goal is a more intentional physical control while remaining clearly Argus.

### Desktop

Desktop continues to use a left rail at the existing breakpoint.

Do not apply a rounded floating mobile dock treatment to desktop.

#191 added Communicator Roles as a third destination via #196. The integrated navigation is Home · Roles · Library; Home continues to own its readout and active-topic projection.

## 11. Interaction

- whole active-topic plate opens the topic;
- Home does not start a Test/lesson directly;
- progress ring is informational, not a second nested button;
- `+ Add something to learn` is a minimum 44px target;
- nav retains normal current-page semantics.

## 12. Accessibility

Required:

- WCAG 2.1 AA contrast;
- 44px touch targets;
- focus-visible states;
- circular progress has accessible text equivalent;
- no state conveyed by ring color alone;
- top readout survives 200% text without horizontal page overflow;
- 320px screen support;
- reduced-motion behavior;
- nav remains reachable above safe-area inset.

If the three top readouts no longer fit in one row at enlarged text, reflow them. Do not shrink below readable token sizes to preserve the three-column composition.

## 13. Empty/edge states

### No started topics

Show the top readout, then a concise state and **Add something to learn** / Library path as appropriate.

Do not show three empty active-topic plates.

### All started topics historically completed

`IN PROGRESS` can truthfully read 0.

The main body may omit Active topics if nothing qualifies.

### Repair

A historically completed topic needing repair should retain its Completed contribution.

If surfaced under Active topics, use Tarnish only for the repair semantic; do not recolor the entire dial/card warm.

### More than three active topics

Bound Home. Use a route/link to see the remainder rather than growing indefinitely.

### Last active unavailable

Show `—`.

## 14. Files likely touched

Expected implementation areas include:

- `src/features/today/Today.tsx`
- `src/features/today/Today.css`
- `src/shared/layout/AppShell.tsx`
- `src/styles/global.css`
- `src/domain/study/libraryGroups.ts`
- shared/refactored capture UI currently owned by `LibraryPage.tsx`
- relevant routing/view labels and tests
- `PRODUCT.md`
- `DESIGN.md`
- `DESIGN.json` / `tokens.css` only if an approved new token is actually needed

Prefer extracting small shared derivations/components to duplicating Library logic.

## 15. Tests

At minimum:

### Derivation

- Completed includes a decayed topic with `completedAt`.
- In progress excludes unstarted topics.
- In progress excludes a previously completed topic now in repair.
- Last active returns the newest durable study timestamp across topics.
- Last active ignores mere browse/open/capture activity.
- no timestamp → null/empty state.

### Progress ring

- Morse ratio reflects real settled/total data.
- no arbitrary percentage for an ordinary topic lacking a ratio.
- repair is accessible without relying on color.
- no redundant horizontal gauge on Home.

### UI

- Home label appears in nav.
- active topics appear before capture action.
- max visible active-topic count is bounded.
- add action opens the existing capture behavior.
- 320px viewport has no horizontal overflow.
- 200% text reflows readouts.
- reduced motion.
- focus order and accessible labels.

### Navigation

- old/restored `today` history entries continue to resolve if the internal route name is retained.
- Home/Library navigation remains correct.
- rounded mobile nav does not alter desktop rail behavior.

## 16. Non-goals

- #191 Roles/designations.
- #192 role badges.
- XP/streak systems.
- a recent-activity timeline.
- a dashboard analytics page.
- arbitrary mastery percentages.
- recoloring the whole app.
- changing topic completion/evidence semantics merely to make a progress ring look better.

## 17. Candidate implementation record

The combined branch `feat/morse-home-release` implements the selected structure. `homeReadout()` counts permanent completion independently of repair and reads the existing durable timestamps. `homeProgress()` chooses real acquisition/evidence ratios or a discrete Building recall / Completion earned / Needs repair state. Active topics retain journey ordering and are bounded to three; See all opens Library without authoring.

Home shares `useTopicCapture()` with Library. An available inbox opens the existing CaptureSheet directly; otherwise the action opens Library's existing TopicForm. No request is a learning topic and no Firestore schema/rule changes are introduced. Home labels replace Today in navigation and Profile while internal `today` routes remain valid.

The selected neutral dial takes the leading slot on Home, replacing subject icons and horizontal gauges. Library retains its existing icon/gauge treatment. Mobile navigation uses the existing radii, gunmetal and bevels; desktop retains its attached rail. Automated tests cover count/activity boundaries, repair, ratio fallback, capture, history navigation, reduced motion, 320px and 200% text. Owner Pixel verification remains required before closeout.

## 18. Acceptance

- [x] Home composition matches the owner-selected hierarchy.
- [x] Exact production tokens remain the visual baseline.
- [x] Top readout is Completed / In progress / Last active with no icons/bars.
- [x] Active topics receive modest lift only.
- [x] Circular progress instrument replaces Home horizontal gauges.
- [x] Circular progress is truthful for every topic shown.
- [x] Procedural “lesson/test status” copy is removed from Home.
- [x] Capture action reuses the existing Want-to-learn workflow.
- [x] Rounded mobile nav remains restrained and uses existing Argus materials.
- [x] Empty/repair/overflow/accessibility states pass.
- [x] PRODUCT/DESIGN documentation reflects candidate behavior with deployment pending.
- [ ] Owner verifies the production build on Pixel before close.
