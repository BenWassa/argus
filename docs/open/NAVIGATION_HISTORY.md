# Argus navigation and system-back contract

Status: implementation contract for [#45](https://github.com/BenWassa/argus/issues/45).

## Why this exists

Argus is a single-page React application, but its meaningful screen changes are currently held only in component state.

At the top level, `src/app/App.tsx` holds:

- `view: View` for `today`, `library`, `progress`, and `data`;
- `run` for full-surface Learn/Test sessions;
- `authorOnEntry` for the Today → Library authoring hand-off.

`src/features/library/Library.tsx` separately holds `openId` for a topic page and local state for dialogs/sheets.

That means an interaction such as:

`Today → Library → Topic → Learn`

looks like navigation to the learner but creates no browser session-history entries. Android system Back — including the Google Pixel edge-swipe gesture — therefore has no Argus state to unwind and can leave the app/tab immediately.

This is exactly the class of SPA problem the browser History API is designed to solve: user-visible page changes should have corresponding session-history entries, and `popstate` should restore the prior application state. See MDN's [Working with the History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API).

## Product contract

The Android system Back action and Argus's visible Back/Close controls must describe the same navigation model.

The expected core path is:

`Today/Home → Library → Topic → Learn/Test`

Repeated Back must unwind it as:

`Learn/Test → Topic → Library → Today/Home → platform/browser exit`

Argus must not trap Back at its root. Once Today is the active root screen and no dismissible transient layer is open, the next platform Back action belongs to the browser/OS.

This is not a Pixel-specific gesture feature. Pixel edge-swipe is simply one way Android invokes Back.

## Terminology

The current product labels the root section **Today**. In issue/user language this is also the Argus **Home/root** screen.

A **route** is a meaningful full-screen product location that a learner would reasonably expect Back/Forward to revisit.

A **transient layer** is a dialog, confirmation, or sheet that should be dismissed before leaving its underlying route but should not become a durable/deep-linkable product location.

A **local interaction state** is UI state that should not consume browser/system Back at all.

## Current architecture constraints

Argus deliberately has no routing dependency today. `package.json` contains React/ReactDOM and Firebase only; there is no React Router or equivalent.

The production Vite base is `/argus/`, and deployment is via GitHub Pages. Do not introduce path-based routes such as `/argus/library/topic/...` unless deployment fallback/reload behaviour is explicitly solved. A direct request to a nested path on static hosting must not become a 404.

For #45, the preferred implementation is a small browser-history adapter using `history.replaceState`, `history.pushState`, `history.back`, and `popstate`, while keeping the canonical document URL at `/argus/`.

That preserves current copy/paste/deep-link behaviour — the public URL still opens the root app — while making the in-session navigation stack real.

A router dependency is acceptable only if it produces a materially simpler and safer result without broadening the issue into a routing migration.

## Navigation state model

Centralize the durable navigation model near `Routes` in `src/app/App.tsx` rather than allowing browser history to mirror unrelated component-local state.

A suitable serializable route union is conceptually:

```ts
type AppRoute =
  | { kind: 'section'; view: View }
  | { kind: 'topic'; topicId: string }
  | { kind: 'run'; mode: Mode; topicIds: string[] }
```

The exact names are not binding. The invariants are.

History state must contain identifiers and navigation metadata only. Do not serialize Topic objects, learner evidence, scheduler state, form contents, Firebase data, or other mutable store snapshots into `history.state`.

Every Argus-owned history entry should carry an unambiguous versioned marker so `popstate` can distinguish Argus entries from the page/site that preceded Argus in a normal browser tab.

Example shape:

```ts
{
  argusNavigation: 1,
  index: 3,
  route: { kind: 'topic', topicId: '...' }
}
```

A monotonic index is useful for deterministic direction/guard handling, but the implementation may use another mechanism if equally clear and tested.

## What is a route

### Section routes

These are durable Back/Forward locations:

- Today (`view === 'today'`)
- Library (`view === 'library'`)
- Progress (`view === 'progress'`)
- Data (`view === 'data'`)

Changing section through `AppShell` should push one history entry when the destination actually changes.

Selecting the already-active section must not create a duplicate entry.

### Topic route

A Library topic page is a route.

Today/Library selection such as:

`Library → Topic A`

must push a topic route, and Back must restore Library.

The current `Library.openId` state should no longer be the sole authority for whether the topic page is active. The durable topic identity must be represented in the navigation layer so browser Back/Forward can restore it.

If a historical topic entry points to a topic that has since been deleted, restoration must degrade deterministically to Library rather than crash, show stale content, or create a Back loop.

### Learn/Test run route

Learn and Test already own the whole surface and are explicitly described in `App.tsx` as routes rather than modals. Browser history should now match that product meaning.

Starting a run from Today, Library, or a Topic page pushes one run route. Closing/exiting that run should return to the actual origin through the navigation layer rather than only calling `setRun(null)`.

The origin must therefore be whatever screen the user actually came from:

- Today → Test → Back = Today
- Library → Learn → Back = Library
- Topic → Test → Back = Topic

### Learn → Test

`Learn` currently exposes `Test me`, and the current implementation replaces the in-memory `run` value from Learn to Test. Preserve that product behaviour unless #45 implementation proves it creates a defect.

Recommended history semantics:

- Learn was pushed from its origin.
- `Test me` **replaces** the current Learn history entry with Test rather than pushing a second run entry.
- Exiting Test therefore returns to the screen that launched Learn, matching current Argus behaviour and avoiding an unexpected extra Back stop.

Do not silently change this to `Origin → Learn → Test → Learn` as part of the Android fix unless the product decision is explicitly revisited.

## What consumes Back before a route change

Transient layers should be dismissed before their underlying route is popped.

Current relevant layers include:

- New/Edit Topic form;
- Want to learn capture sheet;
- Delete topic confirmation;
- dirty-topic-form discard confirmation;
- partial-Test exit confirmation.

The implementation mechanism may use a lightweight transient history entry, a registered back guard, or another deterministic approach. The UX contract matters more than the internal representation.

### Clean dialog/sheet

If a clean dismissible dialog is open, one system Back closes it and leaves the underlying route active.

Example:

`Library → New topic dialog`

Back sequence:

`New topic dialog → Library → prior route`

The first Back must not leave Library.

### Dirty Topic form

`TopicForm` already protects typed work: Escape/close invokes `requestClose()`, and a dirty form presents **Discard changes** rather than destroying edits immediately.

System Back must use the same safeguard.

Required behaviour:

1. Back while dirty does not discard typed work and does not leave the underlying route.
2. It opens/enters the existing discard-confirmation state.
3. Back/Keep editing from that confirmation returns to the dirty form.
4. Confirming Discard changes completes the pending close/back action exactly once.
5. No duplicate browser-history entries or oscillating `popstate` loop may result.

### Test exit guard

`Session` already protects an incomplete scored attempt. `requestExit()` shows **End test** once the current topic has partial answers, and `exitSession()` preserves cue evidence while discarding the incomplete retention attempt according to existing semantics.

System Back must go through the same exit policy.

Required behaviour:

- Test with no unbanked partial attempt: Back exits the run to its origin.
- Test with an unbanked partial attempt: Back opens the existing End test confirmation instead of silently leaving.
- Back/Keep going from the confirmation resumes the same Test state.
- Confirming End test runs the same `exitSession()` semantics and then completes the pending navigation.
- Completed/banked Test results must not be altered by navigation work.

Do not create a second scoring or persistence path for system Back.

## What must not become Back stops

The following are local interaction state and should not create durable session-history entries merely because they changed:

- Library search query;
- track filters;
- multi-select mode and selected topic checkboxes;
- expanded/collapsed `<details>` sections;
- Test card reveal state;
- current Test card index/answer phase;
- Morse cue/audio animation state;
- focus position;
- scroll position;
- splash visibility.

A user should not need multiple edge swipes to escape microstates inside one screen.

Browser-native form-control behaviour should remain native; do not globally capture horizontal touch movement.

## History ownership and root behaviour

### Initial load

On initial Argus mount, seed the current browser entry with the root Argus state using `replaceState`, not `pushState`.

This is critical.

Pushing a synthetic root entry on launch would create a phantom duplicate and require two Back actions to leave the app/tab from Today.

### Normal browser tab

If the user arrived at Argus from another page/site:

`External page → Argus Today`

Back from Today must return to the external page. Argus must not intercept it or immediately push Today again.

### Installed PWA / standalone launch

If Today is the root entry for the standalone app and there is no earlier in-app state, Argus must leave the next Back action to Android. The OS may close/minimize the standalone app.

Do not implement an exit-app API, `window.close()`, double-back-to-exit pattern, toast, or root sentinel that traps the user.

### Forward navigation

After Back traverses Argus-owned history, browser Forward must restore the corresponding Argus route when that route is still valid.

Example:

`Today → Library → Topic`

then:

`Back → Library`

then browser Forward:

`Library → Topic`

Forward restoration must not duplicate the entry or replay side effects such as starting a new Test attempt.

## Reload and stale-state behaviour

Because the recommended solution stores route identity in `history.state` while keeping the URL stable, a reload of the current session-history entry may retain a serializable Argus route.

The app may restore that route when safe, but it must validate it against live local data first.

Rules:

- section state is always safe to restore;
- topic state restores only if the topic still exists, otherwise Library;
- run state restores only if every required topic can be resolved and restoration cannot accidentally replay one-time side effects or misrepresent an in-progress scored Test;
- if safe run restoration is not straightforward, normalize a reloaded run entry to its safe parent/root instead of inventing persistence for in-progress Test state;
- malformed, foreign, or unknown-version `history.state` must never crash the app.

Do not broaden #45 into persistent Test-session recovery.

## Focus and accessibility

History traversal is real navigation and must preserve the existing focus discipline.

Required outcomes:

- entering a Topic route focuses its heading as `TopicPage` does today;
- returning from Topic to Library should continue to restore focus to the originating row where possible;
- closing a dialog restores focus to its opener as `Dialog` does today;
- section/run navigation lands focus on a sensible destination heading or `#main`;
- no focus is left in an unmounted route;
- keyboard focus rings and Escape behaviour remain intact;
- system Back must not bypass existing accessible confirmation language.

Do not use focus changes themselves as navigation/history state.

## Touch and gesture boundary

Do **not** listen for the Pixel edge gesture directly.

Do not add:

- edge-coordinate gesture detectors;
- global `touchstart`/`touchmove` interception;
- horizontal-swipe navigation handlers;
- Android user-agent branching;
- Capacitor/native back plugins to a web-only PWA;
- `preventDefault()` on ordinary page gestures to simulate Back.

The browser/OS already turns the Pixel edge swipe into Back. Argus only needs correct session history to respond to it.

Keep existing in-content swipe interactions, such as Test-card scoring gestures, isolated to their own controls. A content swipe must not be reinterpreted as app navigation.

## Recommended implementation shape

Keep the change narrow and testable.

A reasonable decomposition is:

1. `src/lib/navigation.ts`
   - versioned `AppRoute`/history-state types;
   - validation/normalization;
   - `push`, `replace`, `back`, and `popstate` adapter;
   - no learner-domain logic.
2. `src/app/App.tsx`
   - make the durable route the source of truth instead of independent `view` + `run` state;
   - resolve route → screen;
   - seed initial history entry;
   - subscribe/unsubscribe to `popstate` exactly once.
3. `Library`
   - accept/emit durable topic navigation rather than owning `openId` as an isolated pseudo-route;
   - keep filters, selection, dialogs, and other local state local.
4. Learn/Test exits
   - call shared navigation/guard callbacks;
   - preserve all current learning/scoring/evidence semantics.
5. Dialog/Test back guards
   - reuse the existing close/dirty/partial-attempt logic;
   - no parallel confirmation wording or persistence code.

This is a suggested structure, not a requirement to force abstractions that make the code worse.

## Required invariants

1. A meaningful forward screen change produces at most one new Argus history entry.
2. Re-rendering never produces a new history entry.
3. Clicking the current section never produces a duplicate entry.
4. `popstate` restores state; it never immediately pushes the same state back during ordinary unguarded traversal.
5. Guarded Back cannot lose typed Topic edits or partial-Test semantics.
6. Root Back is never trapped.
7. Argus-owned history state contains no learner content/evidence snapshots.
8. Missing/stale route identifiers degrade safely.
9. Forward history works after Back.
10. No navigation action changes scheduler, completion, cue evidence, migration, export/import, or content-inbox semantics.

## Deterministic acceptance matrix

| Starting state | Action | Expected result |
| --- | --- | --- |
| External page → Argus Today in browser tab | Back | Leaves Argus for external page |
| Fresh installed-PWA Today | Back | Argus does not trap; Android may exit/minimize app |
| Today → Library | Back | Today |
| Today → Library → Topic | Back ×2 | Library, then Today |
| Today → Library → Topic → Learn | Back ×3 | Topic, Library, Today |
| Today → Library → Topic → Test, no partial answer | Back | Topic |
| Topic → Test, partial current-topic attempt | Back | End test confirmation; no navigation/data loss yet |
| End test confirmation | Back / Keep going | Same Test resumes |
| End test confirmation | Confirm End test | Existing exit semantics run, then Topic |
| Topic → Learn → Test me | Back | Topic, under the recommended replace semantics |
| Library + clean New topic dialog | Back | Dialog closes; Library remains |
| Library + dirty Topic form | Back | Discard changes confirmation; typed work remains |
| Discard changes confirmation | Keep editing / Back | Dirty form remains |
| Discard changes confirmation | Discard changes | Form closes once; underlying route remains |
| Library + Want to learn sheet | Back | Sheet closes; Library remains |
| Library → Topic; then Back | Forward | Topic restored without duplicate history |
| Historical Topic entry whose topic was deleted | Back/Forward into entry | Safe fallback to Library |
| Current section button tapped repeatedly | Back | No duplicate/no-op history stops created |
| Test card reveal/answer microstate changes | Back | Test exit policy, not reversal of card microstates |

Also test direct navigation starting runs from Today and Library, not only Topic pages.

## Automated validation

Add regression coverage around the navigation adapter and its integration with `Routes`.

At minimum cover:

- initial `replaceState` seeding rather than root `pushState`;
- push vs replace semantics for section/topic/run navigation;
- duplicate-section suppression;
- `popstate` Back traversal across multiple routes;
- browser Forward restoration;
- foreign/malformed history state;
- stale/deleted topic restoration;
- clean transient dismissal;
- dirty Topic form Back guard;
- partial-Test Back guard and confirmation;
- no silent banking/discarding changes to Test semantics;
- event-listener cleanup/remount safety.

Use the existing Vitest stack unless a real browser harness is clearly justified. Do not add a large test framework solely to simulate one API that can be deterministically unit/integration tested.

Run the complete repository gate (`npm run check`, plus any relevant rules tests if touched). Navigation work should not require Firestore rule changes.

## Real-device acceptance

Automated History API tests are not sufficient to close the issue because the defect was reported through Android gesture navigation.

Validate the exact production build on a Google Pixel with gesture navigation, preferably both:

- installed standalone PWA;
- Chrome browser tab.

Use at least these real-device paths:

1. Today → Library → Topic → Learn → repeated edge-swipe Back to Today → one more Back exits/leaves.
2. Today → Library → Topic → Test → edge-swipe before answering → Topic.
3. Partial Test → edge-swipe → End test confirmation → Keep going; then repeat and confirm End test.
4. Library → New/Edit Topic → type a change → edge-swipe → discard confirmation; verify no typed work disappears before confirmation.
5. Library → Want to learn → edge-swipe closes the sheet only.
6. Back then Android/browser Forward where available; verify the prior Argus route returns.

Record device/browser mode and exact deployed commit in the issue/PR before closing.

## Non-goals

Do not use #45 to:

- redesign the nav bar;
- rename Today/Home;
- change screen hierarchy;
- add URL-addressable public deep links;
- persist in-progress Test sessions across process death/relaunch;
- change Learn/Test pedagogy or scoring;
- change scheduler/completion semantics;
- redesign dialogs;
- add new gestures;
- add native Android code;
- alter PWA installation/update behaviour;
- change Content Inbox or Firestore architecture.

## Completion definition

#45 is complete only when the browser/OS history model and Argus screen model agree: Back unwinds real Argus navigation, guarded work is protected, Forward is coherent, and Today remains a true boundary that Argus does not trap.