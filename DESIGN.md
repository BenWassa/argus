# Argus Design System

## Product mode

**Operate.** Argus is a personal practice tool. The interface should disappear into short, focused learning sessions rather than perform like a marketing page.

## Visual direction

**Quiet field index.** Dark, low-glare surfaces; warm brass for primary action and current state; muted blue, green, and clay only for track semantics. The mood is capable and deliberate without drifting into military, survivalist, or game aesthetics.

## Hierarchy

1. What is due now
2. Start or continue practice
3. Browse and filter finite topics
4. Review completion and decay
5. Author or move data

Page headings carry their own weight. Do not add eyebrow labels above headings. Avoid hero-metric templates, nested cards, decorative borders, and ornamental gradients.

## Typography

Use the native UI sans stack. Fixed sizes, not fluid display typography.

- Page title: 2rem / 1.08 / 760+
- Section title: 1.35rem / 1.2 / 700+
- Component title: 0.98rem / 1.25 / 700+
- Body: 0.86–1rem / 1.5
- Metadata: 0.66–0.76rem, used sparingly

Prose measure should remain below 70 characters where practical.

## Color tokens

- Background: `#0f1210`
- Surface: `#151916`
- Raised surface: `#1b201c`
- Primary text: `#f4f2ea`
- Secondary text: `#a9b0a5`
- Border: `#303730`
- Primary accent: `#d6b574`
- Learning: `#8fb5cf`
- Survival: `#98b77c`
- Tradecraft: `#c99a82`
- Success: `#9dc5a2`
- Warning: `#d8bd79`
- Error: `#e0958c`

Accent is reserved for the primary action, current selection, and state—not decoration.

## Layout

- Mobile: sticky top bar, single content column, bottom navigation.
- Desktop: 236px fixed side rail and a centered content region up to 1040px.
- Topic browsing uses a dense index/list, not a grid of equal cards.
- Practice remains a single protected panel with one clear next action.

## Components and states

All interactive elements require visible default, hover, focus, active, and disabled states. Minimum primary touch target is 44px. Selected filters expose `aria-pressed`; active navigation exposes `aria-current`.

Modal sheets are reserved for focused topic detail and authoring. Opening a sheet moves focus inside it; closing returns focus to the invoker. Escape and backdrop dismissal remain available.

## Motion

Use 150–200ms state transitions only. Respect `prefers-reduced-motion`. No decorative entrance choreography.

## Copy

Controls name the action directly: “Start due practice,” “Create topic,” “Export JSON.” Empty states explain the recovery path. Retention decay is described as routing for repair, never punishment.

## Safety boundary

Argus supports memory and rehearsal only. It does not certify physical, medical, emergency, or other hazardous competencies. Relevant topics must retain source attribution and clear limitations.
