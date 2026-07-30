---
name: Argus
description: A quiet field index for finite, closed-scope competencies — task-first, restrained, brass on dark olive.
colors:
  bg: "#0f1210"
  surface: "#151916"
  surface-2: "#1b201c"
  surface-3: "#232923"
  ink: "#f4f2ea"
  muted: "#a9b0a5"
  subtle: "#788077"
  line: "#303730"
  line-strong: "#465047"
  accent: "#d6b574"
  accent-2: "#f0d39a"
  accent-ink: "#20180d"
  learning: "#8fb5cf"
  survival: "#98b77c"
  tradecraft: "#c99a82"
  danger: "#e0958c"
  ok: "#9dc5a2"
  warning: "#d8bd79"
typography:
  page-title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "2rem"
    fontWeight: 760
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  section-title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.35rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  component-title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.98rem"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.86rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.7rem"
    fontWeight: 700
    letterSpacing: "0.03em"
rounded:
  sm: "9px"
  md: "10px"
  lg: "14px"
  xl: "18px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "14px"
  lg: "18px"
  xl: "26px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.md}"
    padding: "11px 14px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.accent-2}"
    textColor: "{colors.accent-ink}"
  button-ghost:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "11px 14px"
    height: "44px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-3}"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "8px 11px"
    height: "38px"
  chip-active:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
  field:
    backgroundColor: "#121613"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "11px 12px"
    height: "44px"
  topic-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "0"
    padding: "15px 2px"
  sheet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "18px 18px 0 0"
---

# Design System: Argus

## 1. Overview

**Creative North Star: "The Quiet Field Index"**

Argus is styled as a field manual, not a dashboard: a dark, low-glare reference the owner opens for a few minutes, uses without friction, and closes. Every screen answers one question — what's due, what's next — before it answers anything else. The palette is dark olive and near-black surfaces with a single warm brass accent reserved for the primary action and the current state; three muted track colors (dusty blue, sage, clay) carry semantic meaning only, never decoration. Controls are named as direct actions ("Start due practice," "Export JSON," never "Get started" or "Let's go") — the copy voice matches the visual restraint.

The system explicitly rejects the instincts of a generated SaaS dashboard: no marketing hero on the practice surface, no wall of identical metric cards, no rounded card-in-a-card nesting, no eyebrow labels ceremonializing routine headings. A prior design pass shipped exactly that pattern — hero, four stat cards, a grid of topic cards — and design critique flagged it as competent but "category-interchangeable," recognizable Argus ingredients in a generic composition. This spec exists to keep that from recurring. It equally rejects the opposite failure mode this content invites: nothing here should read as tactical, military, or survivalist. The three subject tracks (learning, survival, tradecraft) are handled as calm, muted metadata, not as a HUD.

**Key Characteristics:**
- Dark, warm-tinted neutrals; one brass accent used sparingly, never decoratively
- Flat surfaces differentiated by tone, not shadow — depth comes from layering, not elevation
- Dense index rows over card grids; a topic list reads like a table of contents, not a gallery
- Fixed type sizes, native UI sans only — no fluid display type, no serif ceremony
- Motion is restrained: state feedback only, 150–200ms, no decorative choreography
- Every interactive element carries visible default / hover / focus / active / disabled states

## 2. Colors

The palette is a restrained strategy: tinted near-black neutrals carrying almost the entire surface, one warm accent held to primary actions and current-state only, and three desaturated track colors used exclusively as semantic labels.

### Primary
- **Brass** (`#d6b574`): the single accent. Reserved for the primary action button, the current selection, and active/current state (active nav, active filter chip, active mode card). Never used decoratively — if brass appears, something is actionable or current.
- **Bright Brass** (`#f0d39a`): the hover/active state of Brass, used on primary button hover and emphasis numerals (the due-count figure on the practice hero).
- **Ink-on-Brass** (`#20180d`): the text color used only on top of Brass or Bright Brass surfaces, for contrast.

### Neutral
- **Field Black** (`#0f1210`): page background. A near-black with a faint green undertone, not a true neutral gray.
- **Olive Surface** (`#151916`): the base surface tone for panels, the practice panel, and sheets.
- **Raised Olive** (`#1b201c`): one step up — ghost buttons, top-bar actions, secondary chrome.
- **Lifted Olive** (`#232923`): hover state for raised surfaces; the topmost tonal layer in the system.
- **Warm Bone** (`#f4f2ea`): primary text. A warm off-white, never pure `#fff`.
- **Sage Ash** (`#a9b0a5`): secondary text and metadata labels.
- **Deep Sage** (`#788077`): the quietest text tone, used for eyebrow-weight labels and stat card kickers.
- **Line** (`#303730`): default hairline border between rows, panels, and grid cells.
- **Line Strong** (`#465047`): emphasized border — cards, sheets, focus-adjacent chrome, hover borders.

### Track semantics (used only as metadata, never as backgrounds)
- **Dusty Blue — Learning** (`#8fb5cf`)
- **Sage — Survival** (`#98b77c`)
- **Clay — Tradecraft** (`#c99a82`)

### Status
- **Signal Coral — danger/error** (`#e0958c`)
- **Muted Green — success/ok** (`#9dc5a2`)
- **Muted Gold — warning** (`#d8bd79`)

### Named Rules
**The One Accent Rule.** Brass appears only on the primary action, the current selection, and active state. If a second element on the same screen carries brass, one of them is wrong.

**The No Track-as-Background Rule.** Learning/Survival/Tradecraft colors label metadata (a tag, a dot) and are never used as a card background, button fill, or large surface area — that would tip the product toward the tactical/game aesthetic it explicitly rejects.

## 3. Typography

**Body & Display Font:** the native UI sans stack — `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. No web font, no serif, no display face.

**Character:** functional and quiet. Hierarchy comes from fixed size and weight steps, not from a decorative display face — the system deliberately avoids Georgia/serif ceremony that a prior pass used and design critique flagged as behaving "like a brand surface" rather than a practice tool.

### Hierarchy
- **Page title** (weight 760, 2rem, line-height 1.08, letter-spacing -0.035em): the h1 on every top-level view. Carries its own weight — no eyebrow label above it.
- **Section title** (weight 700, 1.35rem, line-height 1.2, letter-spacing -0.02em): h2, used for major in-page sections (Today, Library, Progress).
- **Component title** (weight 700, 0.98rem, line-height 1.25): h3, topic titles, card/panel headings.
- **Body** (weight 400, 0.86–1rem, line-height 1.5): all prose and descriptions. Measure capped near 68ch (topic scope text uses `max-width: 68ch`).
- **Label** (weight 700, 0.66–0.76rem, letter-spacing 0.03–0.08em): metadata, kickers, stat card eyebrows. Used sparingly — this is the only place small-caps-weight labeling belongs.
- **Prompt** (weight 760, 1.75rem, line-height 1.18, letter-spacing -0.03em): the practice-session question itself. The one place type is allowed to feel large, because it's the entire task in that moment.

### Named Rules
**The No-Eyebrow Rule.** Page and section headings do not get an eyebrow label above them. A prior pass used eyebrow labels throughout and design critique named it directly as ceremony that doesn't belong on a task-first surface. Eyebrow-weight type is reserved for genuine metadata (stat card kickers, session step labels), never as heading decoration.

## 4. Elevation

Argus is flat by default. Depth is conveyed through tonal layering (Field Black → Olive Surface → Raised Olive → Lifted Olive) and hairline borders, not through shadow. The single exception is the practice panel and the hero-style due-practice surface, which carry one soft ambient shadow to read as the primary, protected focus area on the screen — everything else sits flush.

### Shadow Vocabulary
- **Ambient panel** (`box-shadow: 0 18px 48px rgba(0,0,0,.28)`): reserved for the practice panel and the top-of-library "due practice" surface. Signals "this is the one thing to look at," not general-purpose card elevation.

### Named Rules
**The Flat-By-Default Rule.** No shadow on topic rows, chips, buttons, stat cells, or sheets. Shadow is spent once, on the single most important surface per view.

## 5. Components

Components are dense and quiet at rest; they get louder only on hover, focus, and active/current state. All state transitions are 150–200ms, properties only (background, border-color, transform on `:active`) — never layout properties — and collapse to near-zero under `prefers-reduced-motion`.

### Buttons
- **Shape:** 10px radius (`rounded.md`), 44px minimum height.
- **Primary:** Brass background, Ink-on-Brass text, Brass border. Hover shifts to Bright Brass. Active state depresses 1px on the y-axis.
- **Ghost/Secondary:** Raised Olive background, Line Strong border, Warm Bone text. Hover moves to Lifted Olive with border brightening toward `#59645a`.
- **Danger:** same shape as primary, background/border swapped into Signal Coral territory — reserved for destructive actions only (reset local library).
- **Small variant:** 38px height, 9px radius — used inline (session "End" button) where 44px would overwhelm the row.
- **Disabled:** 46% opacity, `cursor: not-allowed`.

### Chips (filters)
- **Style:** transparent background, Line border, pill radius (999px), 38px height.
- **Selected (`aria-pressed="true"`):** Brass background, Ink-on-Brass text, Brass border — the same accent-equals-active logic as everywhere else in the system.

### Topic Rows (not cards)
The library is a dense index, deliberately not a card grid. Each row: no border-radius, full-width bottom hairline (`--line`), 15px vertical padding. On hover, background lifts to `rgba(255,255,255,.018)` and padding nudges inward — a subtle "this is clickable" cue instead of a lift/shadow effect. A trailing `›` chevron sits absolute-positioned at the row's right edge. Track/status/item-count metadata renders as plain text tags separated by a `·` glyph, not pill badges.

### Stat Strip
Not four separate cards: one bordered container (14px radius) divided internally by hairlines into a 2×2 (mobile) / 1×4 (desktop) grid. Reads as a single instrument panel, not a repeated card pattern.

### Inputs / Fields
- **Style:** `#121613` background (one step darker than Olive Surface, for contrast against surrounding panels), Line Strong border, 10px radius, 44px height.
- **Focus:** 3px outline in `rgba(240,211,154,.32)` (Bright Brass at low opacity), 2px offset, border forced to Brass.
- **Placeholder:** `#7d857c`, dimmer than Sage Ash body text.

### Navigation
Bottom nav on mobile (fixed, safe-area aware, 50px min-height touch targets), fixed 236px left side rail on desktop (≥980px) — not the same component stretched, a distinct layout. Active item: Bright Brass icon/text, `aria-current="page"`. Icons are inline SVG, 24×24 viewBox, `stroke="currentColor"` so they inherit state color for free.

### Modal Sheets
Bottom sheets on mobile, centered on desktop (≥980px), Olive Surface background, Line Strong border, 18px top radius (16px all corners on desktop). Focus moves to the first focusable element on open and returns to the invoking control on close; Escape and backdrop click both dismiss. Close button is a 44×44px target with an explicit `aria-label` naming what it closes, never a bare "×".

### Named Rules
**The Nothing-Nests Rule.** A card does not contain another card. If a component needs internal grouping, use a hairline divider or spacing, not a nested bordered container.

## 6. Do's and Don'ts

### Do:
- **Do** open every top-level view on the task (what's due, start practice) — never on a summary, pitch, or hero.
- **Do** hold Brass to exactly three roles: primary action, current selection, active/current state.
- **Do** use flat tonal layering (Field Black → Olive Surface → Raised Olive → Lifted Olive) for hierarchy instead of shadow.
- **Do** render topic listings as a dense hairline-divided index, not a card grid.
- **Do** give every interactive element default, hover, focus-visible, active, and disabled states, with a minimum 44px primary touch target.
- **Do** name controls as direct actions ("Start due practice," "Create topic," "Export JSON") and explain the recovery path in empty states.
- **Do** treat retention decay as a routing signal — same visual weight as any other status, never styled as an error or a scolding.
- **Do** keep JSON export/import visually first-class, not buried as a settings afterthought.

### Don't:
- **Don't** put a hero, oversized slogan, or eyebrow label above a page or section heading. The app is opened to act, not to be sold to.
- **Don't** build a wall of identical metric cards. Design critique flagged exactly this pattern as "category-interchangeable" — consolidate into one instrument-panel stat strip instead.
- **Don't** nest a card inside a card, or use `border-left`/`border-right` as a colored accent stripe on any row, alert, or callout.
- **Don't** use gradient text, glassmorphism, or decorative rings/gradients anywhere in the practice loop.
- **Don't** reach for military, survivalist, tactical, or "prepper" visual language (camo textures, alarm-red urgency, HUD framing) even though the Survival and Tradecraft tracks' subject matter invites it. The framing is competence, not catastrophe.
- **Don't** add streaks, badges, XP, or any shame-based nudge for missed practice days.
- **Don't** widen the mobile layout for desktop and call it done. Desktop gets a genuine side-rail, task-oriented layout.
- **Don't** use a serif or fluid display typeface, or any animation beyond a 150–200ms state transition.
