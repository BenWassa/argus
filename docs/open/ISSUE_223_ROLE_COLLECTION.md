# Issue #223 — Roles collection-first implementation review

**Status:** implemented for code review on `feature/223-role-collection`; **owner visual approval, physical Pixel review and merge pending.** This document records what the branch proposes, not a deployed acceptance claim.

**Authority:** [issue #223](https://github.com/BenWassa/argus/issues/223), [Signal-on-Slate](../../DESIGN.md), [role runtime](ISSUE_197_ROLE_RUNTIME.md), [badge art approval](ISSUE_192_ROLE_BADGE_ART.md), [progress contract](PROGRESS_ARCHITECTURE.md).

## Hierarchy and responsive design

- Entry is `Roles`, a short completion statement, a literal `earned / available` count and the collection; the role dropdown is absent.
- Current three-role collection is one shallow row on phones, with 72–80px artwork and no inherited raised-button shadows. Collection items contain only the approved locked/unlocked PNG, role name and `Not started`, `X of Y topics complete` or `Earned`. The existing authored `AVAILABLE_ROLES` order remains stable. No synthetic role is shipped.
- All current available roles (Communicator, Navigator, Mariner) remain discoverable; Diver/Responder/Operator art and Analyst research do **not** create available/earnable roles.
- Desktop/tablet detail: one centered bounded-width modal with one scrollable content region; collection visible behind the inert backdrop.
- Phone detail (below 700 CSS pixels): full-viewport modal, safe-area insets, visible Close and one scroll region. At 320–390px, badge and description share a compact row; next action precedes requirements.
- Detail order: name and larger artwork; claim description; earned/current-completion facts; contextual Start/Continue where applicable; pathway headings/requirements; version and qualification limitations.
- 24 synthetic entries are injected **only by browser test** to inspect grid overflow and large type; they cannot be persisted or earned.

No new palette, animation, award type, trophy effects, persistence schema or aggregate mastery score is introduced.

## Navigation / eligibility

- `{ kind: 'role', roleId }` is a validated ParentRoute. `?role=<approved-id>` deep-links on the existing URL path and coexists with other query keys. Invalid, staged or removed IDs fall back to the Roles overview and are normalized out of the URL.
- Click pushes a route; Back closes and Forward reopens. Direct-entry Close replaces the route if no Argus-owned previous entry exists. The role remains the origin for topic/run navigation and nonresumable Test entries fall back without launching another scored attempt.
- Modal focus is contained by the shared Dialog, background and section nav are inert, Escape/backdrop dismiss through the same history closure, and closing restores invoking-button focus where it remains mounted. The existing dialog's transient Back blocker is disabled **only** for route-backed role details.
- Overview scroll position is held while opening/closing role detail and restored on history traversal. The topic/reading routes keep their existing navigation behavior.
- Awards continue to come from `roleProgress`. Earned receipts remain permanent across later optional Tests, deletion and historical/version conditions. Missing catalog topics stay disabled, and no unavailable topic receives a Start/Continue action.

## Verification matrix

| Case | Coverage |
| --- | --- |
| 3 available roles, default overview, pathways and art | `e2e/roles.spec.ts` |
| Valid/invalid direct links, refresh, Back/Forward and run origin | `routes.test.ts`, `e2e/roles.spec.ts` |
| Learned, missing and persisted awards, reset, no decay repair | `roles.test.ts`, `e2e/roles.spec.ts` |
| 320px, 390px, short landscape and 1280px, large type | Playwright projects + 24-item synthetic gallery |
| Keyboard entry, focus return, inert nav/overview, Escape | `e2e/roles.spec.ts` |
| Physical Pixel touch, TalkBack, scroll return, Android Back | **Not yet verified — owner gate** |

## Remaining owner/visual approval gates

1. Review **actual rendered** 390px Pixel, 320px, tablet and desktop overview/detail screens, with zero, partial and earned states. Screenshots or a local branch build are required before sign-off; CSS and tests alone are not visual approval.
2. Confirm the centred desktop modal against longest pathway; if reading length makes it inadequate, propose a dedicated detail page for approval rather than silently switching the model.
3. Verify Android system Back, safe-area/docked-navigation behavior, in/out-of-detail scrolling and TalkBack focus on a physical Pixel.
4. Review enlarged PNG readability (especially unearned art) and the current v1 award/qualification text. No additional art is approved here.

**Merge gate:** keep PR draft until owner visual approval and green repository CI; no deployment is implied by the branch.

## Local review follow-up (2026-10-22)

The resumed review corrected role fixtures to reset all available requirements and exercise durable individual deletion without triggering the existing empty-library recovery policy. It also fixed focus return to a remounted badge after a topic visit and guarded delayed section focus from taking focus from a newly opened modal. Local checks: TypeScript clean, 83 focused route/role/shared UI tests passed, and all 32 Roles browser cases passed across the four configured viewports. Actual overview/detail PNGs are captured by the responsive browser case after badge decoding. These are engineering checks; owner and physical Pixel acceptance remain pending.
