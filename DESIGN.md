---
name: Argus
description: A dark editorial field index for finite, closed-scope competencies — serif for what you remember, sans for what you operate.
colors:
  bg: "#0d100e"
  surface: "#131714"
  surface-2: "#191e1a"
  surface-3: "#212721"
  surface-4: "#2a312b"
  field: "#0f1310"
  ink: "#f5f3ec"
  muted: "#aab1a6"
  subtle: "#8b948a"
  line: "#333b34"
  line-strong: "#4d574e"
  line-hover: "#6b776c"
  accent: "#d6b574"
  accent-2: "#f0d39a"
  accent-ink: "#1c150a"
  learning: "#8fb5cf"
  survival: "#98b77c"
  tradecraft: "#c99a82"
  danger: "#e0958c"
  ok: "#9dc5a2"
  warning: "#d8bd79"
typography:
  display:
    fontFamily: "ui-serif, 'New York', Georgia, 'Times New Roman', serif"
    fontSize: "clamp(2.5rem, 9vw, 3.6rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.022em"
  page-title:
    fontFamily: "ui-serif, 'New York', Georgia, 'Times New Roman', serif"
    fontSize: "2.15rem"
    fontWeight: 600
    lineHeight: 1.06
    letterSpacing: "-0.018em"
  section-title:
    fontFamily: "ui-serif, 'New York', Georgia, 'Times New Roman', serif"
    fontSize: "1.45rem"
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: "-0.012em"
  component-title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.05rem"
    fontWeight: 650
    lineHeight: 1.3
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.98rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.72rem"
    fontWeight: 650
    letterSpacing: "0.09em"
    textTransform: "uppercase"
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
  2xl: "40px"
  3xl: "64px"
elevation:
  edge: "inset 0 1px 0 rgb(255 255 255 / 5%)"
  shadow-sm: "0 1px 2px rgb(0 0 0 / 32%)"
  shadow: "0 18px 48px rgb(0 0 0 / 34%)"
  shadow-lift: "0 28px 64px rgb(0 0 0 / 46%)"
components:
  button-primary:
    background: "linear-gradient(180deg, {colors.accent-2}, {colors.accent})"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.md}"
    height: "44px"
    shadow: "{elevation.shadow-sm}"
  button-ghost:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "44px"
    shadow: "{elevation.edge}, {elevation.shadow-sm}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    height: "38px"
    border: "none"
  flip-card:
    minHeight: "clamp(300px, 58svh, 500px)"
    rounded: "{rounded.xl}"
    shadow: "{elevation.edge}, {elevation.shadow}"
    flipDuration: "460ms"
  topic-row:
    backgroundColor: "transparent"
    rounded: "0"
    padding: "15px 2px"
  sheet:
    backgroundColor: "{colors.surface}"
    rounded: "18px 18px 0 0"
---

# Design System: Argus

## 1. Overview

**Creative North Star: "The Quiet Field Index"**

Argus is styled as a field manual, not a dashboard: a dark, low-glare reference the owner opens for a few minutes, uses without friction, and closes. Every screen answers one question, what's due, before it answers anything else.

The system runs on **two voices**. A native serif carries the things you read and are meant to remember: page titles, topic names, scope statements, the prompt on a card, the answer you were reaching for. A native sans carries the things you operate: buttons, status, counts, metadata, navigation. Nothing is downloaded for either, so the PWA opens the same offline as online. That split is the identity: when the type turns serif, you are looking at content; when it is sans, you are looking at controls.

An earlier pass ran sans-only across a compressed six-step scale, and the result read as calm but interchangeable. The failure was never the palette, it was that every element sat at the same visual pitch with no material underneath it. The fixes are structural: a genuine display step, a real scale, a grain substrate, and surfaces that are actually lit.

**Key characteristics:**
- Dark, warm-tinted neutrals over a faint grain substrate; one brass accent, never decorative
- Serif for content, sans for controls, and the boundary between them is meaningful
- Depth from material and light (edge highlights, one lit surface per view), not from stacked drop shadows
- Dense index rows over card grids; a topic list reads like a table of contents
- Motion is state feedback plus one piece of card physics; nothing else moves

## 2. Colors

A restrained strategy: tinted near-black neutrals carry almost the entire surface, one warm accent is held to primary actions and current state, and three desaturated track colors are used exclusively as typographic labels.

### Neutral
- **Field Black** (`#0d100e`): page background. Near-black with a green undertone, never a true gray.
- **Olive Surface** (`#131714`) → **Raised** (`#191e1a`) → **Lifted** (`#212721`) → **Top** (`#2a312b`): four tonal steps, and all four are used. Hierarchy is built by moving between them.
- **Warm Bone** (`#f5f3ec`): primary text. Never pure white.
- **Sage Ash** (`#aab1a6`): secondary text. **Deep Sage** (`#8b948a`): quietest, for eyebrow labels and kickers.
- **Line** (`#333b34`) / **Line Strong** (`#4d574e`) / **Line Hover** (`#6b776c`): the rule vocabulary.

### Accent
- **Brass** (`#d6b574`) and **Bright Brass** (`#f0d39a`). The primary button is a top-lit gradient between them. **Ink-on-Brass** (`#1c150a`) is the only text color used on top.

### Track semantics
**Dusty Blue — Learning** (`#8fb5cf`), **Sage — Survival** (`#98b77c`), **Clay — Tradecraft** (`#c99a82`).

### Named Rules
**The One Accent Rule.** Brass appears only on the primary action, the current selection, and active state. Two brass elements on one screen means one of them is wrong. The single exception is the completion moment, where brass marks the event rather than an action.

**The No Track-as-Background Rule.** Track colors are set as small-caps typographic labels. They never fill a surface, a button, or a border stripe, because that tips the product toward the tactical aesthetic it explicitly rejects.

## 3. Typography

**Display / content:** `ui-serif, "New York", Georgia, "Times New Roman", serif`. On Apple platforms this resolves to New York, which is a genuine editorial face at zero download cost.

**UI / controls:** the native sans stack.

### Hierarchy
- **Display** (serif, `clamp(2.5rem, 9vw, 3.6rem)`, weight 600): topic titles on the Learn sheet. The largest type in the product, because on that screen the topic *is* the screen.
- **Card value** (serif, `clamp(3rem, 16vw, 6.5rem)`): the prompt and answer on a flashcard. The one place type is allowed to dominate a full viewport, because it is the entire task in that moment.
- **Page title** (serif, 2.15rem, weight 600): the h1 on every view. No eyebrow above it.
- **Section title** (serif, 1.45rem): h2.
- **Component title** (sans, 1.05rem, weight 650): topic titles in dense rows, panel headings.
- **Body** (sans, 0.98rem, line-height 1.55): prose, capped near 68ch.
- **Label** (sans, 0.72rem, weight 650, letter-spacing 0.09em, uppercase): metadata, status, track, kickers, counts.

### Named Rules
**The Two-Voice Rule.** Serif means content; sans means chrome. A button never uses the serif, and a topic title never uses the sans on a reading surface. Mixing them destroys the only signal that tells the eye which is which.

**The No-Eyebrow Rule.** Headings do not get an eyebrow label above them. Eyebrow-weight type is reserved for genuine metadata: track labels, item counts, session kickers.

**Tabular figures everywhere.** Any number that updates in place (counts, positions, scores, dates) carries `font-variant-numeric: tabular-nums`, so digits never reflow the layout around them.

## 4. Elevation and material

The page sits on a **grain substrate**: a single inline SVG turbulence at ~3% opacity, fixed, non-interactive, never animated. It exists so the dark ground reads as a material rather than an absence.

Depth is then built from three things, in this order: **tonal layering**, an **edge highlight** (`inset 0 1px 0 rgb(255 255 255 / 5%)`) that makes a raised surface read as catching light from above, and only then a shadow.

### Shadow Vocabulary
- **`--shadow-sm`**: buttons and small raised controls.
- **`--shadow`**: the practice panel and the flashcard, the one focused surface per view.
- **`--shadow-lift`**: the completion moment only.

### Named Rules
**One Lit Surface Rule.** Exactly one surface per view carries the ambient shadow plus a warm radial wash from above. On Today that is the due panel; in a session it is the card. Everything else sits flush with an edge highlight at most.

## 5. Modes

Three ways to engage a topic, and only one of them writes to the ladder. The mode is never a preference; the status ladder determines which one a topic is asking for.

| Mode | Surface | Records |
|---|---|---|
| **Learn** | A reading sheet: the full set laid out as a numbered index, prompts and answers both visible, scannable in any order | Moves `unstarted` → `learning`. No score. |
| **Practice** | Flashcards with a 3D flip, self-scored, repeatable | Nothing at all |
| **Test** | The same flashcards, every item, once | Resolves the attempt and moves the ladder |

### Named Rules
**Flashcards Must Conceal.** A card shape promises a hidden answer. If both sides are visible at once it is not a card, it is a list, and it should be set as one. Learn is therefore never card-shaped, and Practice/Test never show the answer before the flip.

**Consequence Is Stated, Not Implied.** Wherever the three modes are offered together, each one states what it costs: "Nothing recorded" or "This one counts". The verb alone does not carry it.

## 6. Components

All state transitions are 150–220ms on properties only, never layout, and collapse under `prefers-reduced-motion`.

### Buttons
- **Primary:** top-lit brass gradient, Ink-on-Brass text, 44px minimum, 10px radius.
- **Ghost:** Raised Olive, Line Strong border, edge highlight.
- **Quiet:** text-weight, no border, no background. Used where a third control would otherwise blunt the primary one.
- **Danger:** Signal Coral, destructive actions only.

### Flip card
A `preserve-3d` inner element rotated 180° on the Y axis inside a stage that owns the perspective. The front face is neutral and lit from above; the back face is the only card surface bordered and washed in brass, because the answer is what you came for. Scoring controls fade in after the flip is most of the way through, so they never invite a click at a card the user has not read yet.

### Topic rows (not cards)
The library is a dense index. Each row: no radius, full-width bottom hairline, serif title, small-caps metadata. One trailing action button per row, and it launches the mode the ladder is asking for.

### Stat strip
One bordered container divided by hairlines, reading as a single instrument panel. The first figure is brass; the rest are bone.

### Completion record
A numbered descending index of completions, serif titles with small-caps track labels and tabular dates. This is the artifact the product exists to build, so it is composed rather than listed.

### Named Rules
**The Nothing-Nests Rule.** A card never contains another card. Internal grouping uses a hairline or spacing.

## 7. Do's and Don'ts

### Do
- **Do** open every view on the task, never on a summary or a pitch.
- **Do** let the status ladder pick the mode, and lead with exactly one primary action.
- **Do** use the serif for content and the sans for chrome, consistently.
- **Do** give the page ground its grain and raised surfaces their edge highlight.
- **Do** state a mode's consequence in its own label.
- **Do** treat decay as routing information, never as an error or a scolding.

### Don't
- **Don't** put a hero, slogan, or eyebrow above a heading.
- **Don't** build a wall of identical metric cards.
- **Don't** shape something like a flashcard unless it actually conceals an answer.
- **Don't** nest cards, use side-stripe borders, gradient text, or glassmorphism.
- **Don't** reach for military, survivalist, or tactical visual language, even though the Survival and Tradecraft subject matter invites it. The framing is competence, not catastrophe.
- **Don't** add streaks, badges, XP, or shame-based nudges.
- **Don't** widen the mobile layout and call it desktop. Desktop gets a real side rail.
- **Don't** let Practice write to the ladder. Rehearsal that costs a rung is not rehearsal.
