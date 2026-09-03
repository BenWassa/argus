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
  shadow-key: "0 12px 30px rgb(0 0 0 / 40%)"
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

**The No-Eyebrow Rule.** Headings do not get an eyebrow label above them. Eyebrow-weight type is reserved for genuine metadata: track labels, item counts, session kickers. Learn's `Briefing`, `Concise support`, and `Case study` labels are content-type metadata, not decorative pre-headings.

**Tabular figures everywhere.** Any number that updates in place (counts, positions, scores, dates) carries `font-variant-numeric: tabular-nums`, so digits never reflow the layout around them.

## 4. Elevation and material

The page sits on a **grain substrate**: a single inline SVG turbulence at ~3% opacity, fixed, non-interactive, never animated. It exists so the dark ground reads as a material rather than an absence.

Depth is then built from three things, in this order: **tonal layering**, an **edge highlight** (`inset 0 1px 0 rgb(255 255 255 / 5%)`) that makes a raised surface read as catching light from above, and only then a shadow.

### Shadow Vocabulary
- **`--shadow-sm`**: buttons and small raised controls.
- **`--shadow-key`**: the required action on Today, when there is one.
- **`--shadow`**: the flashcard, the one focused surface in a session.
- **`--shadow-lift`**: the completion moment only.

### Named Rules
**One Lit Surface Rule.** At most one surface per view is lit. In a session it is the card. On Today it is the required action itself, so a day with nothing due carries no brass and no shadow anywhere, because there is no work. Everything else sits flush with an edge highlight at most.

The rule says *at most*, not *exactly*. A view with nothing to light is allowed to stay dark. Learn briefings are editorial flow, not raised surfaces, so they do not create a second lit object.

## 5. Modes

Two ways to engage a topic. Learn exposes the material; Test is the only recall interaction.

| Mode | Surface | Records |
|---|---|---|
| **Learn** | A reading sheet. Every topic shows its finite prompt/answer reference in full; optional concise or briefing support may precede it. Nothing is concealed. | Moves `unstarted` → `learning`. No score. |
| **Test** | Flashcards with a 3D flip, every scored item once, self-scored | Records the attempt; moves the ladder only when scheduled evidence conditions are met |

Learn has three valid visual outcomes. A **reference-only** topic keeps the compact title/scope/count + numbered set with no additional scaffolding. **Concise support** adds only the small amount of explanation/provenance/limitation the topic needs. A **briefing** may add short sections, lists, definitions, compact tables and integrated case studies before a visibly separate `Recall reference` section. The extra structure is never mandatory simply because the renderer supports it.

### Named Rules
**Flashcards Must Conceal.** A card shape promises a hidden answer. If both sides are visible at once it is not a card, it is a list, and it should be set as one. Learn is therefore never card-shaped, and Test never shows the answer before the flip.

**Support Does Not Score.** The Learn briefing is explanatory. The `Recall reference` is the visible rendering of the finite Test deck. Their separation must be legible in the page hierarchy so richer explanation cannot imply that every sentence is a completion requirement.

**Consequence Is Stated, Not Implied.** Voluntary early Tests state that the score is recorded while required evidence clocks do not move early.

## 6. Components

All state transitions are 150–220ms on properties only, never layout, and collapse under `prefers-reduced-motion`.

### Buttons
- **Primary:** top-lit brass gradient, Ink-on-Brass text, 44px minimum, 10px radius.
- **Ghost:** Raised Olive, Line Strong border, edge highlight.
- **Quiet:** text-weight, no border, no background. Used where a third control would otherwise blunt the primary one.
- **Danger:** Signal Coral, destructive actions only.

### Flip card
A `preserve-3d` inner element rotated 180° on the Y axis inside a stage that owns the perspective. The front face is neutral and lit from above; the back face is the only card surface bordered and washed in brass, because the answer is what you came for. Scoring controls fade in after the flip is most of the way through, so they never invite a click at a card the user has not read yet.

### Structured Learn support
The richer Learn layer is a compact reference briefing, not an article template and not a stack of cards.

- Maximum prose measure stays near 68ch; overview copy may use the serif at a slightly larger reading size, while longer explanatory body copy uses the normal body voice.
- Structure is native and visible: headings, paragraphs, unordered/ordered lists, definition lists and compact tables.
- Whole-framework/procedure case studies are continuous sections separated with rules and spacing. They are not one card per stage or one panel per term.
- The finite recall set follows rich support under a strong hairline and `Recall reference` metadata label.
- Sources and limitations remain in normal document flow, set smaller/muted but not collapsed or hidden.
- Tables wrap content aggressively and may scroll inside their own focusable wrapper at extreme text scaling. The page itself must not overflow horizontally at 200% text scaling.
- No animation is needed for briefing comprehension; reduced-motion behavior is therefore inherited without special alternative content.

### Topic rows (not cards)
The library is a dense index. Each row: no radius, full-width bottom hairline, serif title, small-caps metadata. One trailing action button per row, and it launches the mode the ladder is asking for.

### The docket
Today uses the same index rows, because a due topic and a library topic are the same object. The whole row is the control and it starts that topic alone, so a five-minute window never has to take the whole batch. The row's metadata is the **reason** the topic surfaced today (`dueState().label`) and its item count, never its rung: the rung is a fact about the topic, the reason is a fact about today. Below the docket, one primary action runs the batch the top-ranked topic belongs to.

Counts are stated in items, not topics alone. Four topics can be eight items or forty-five, and the difference is the entire question of whether there is time.

### Stat strip
One bordered container divided by hairlines, reading as a single instrument panel. The first figure is brass; the rest are bone.

### Completion record
A numbered descending index of completions, serif titles with small-caps track labels and tabular dates. This is the artifact the product exists to build, so it is composed rather than listed.

### Named Rules
**The Nothing-Nests Rule.** A card never contains another card. Internal grouping uses a hairline or spacing. Learn case studies follow the same rule: hierarchy is document structure, not nested surfaces.

## 7. Do's and Don'ts

### Do
- **Do** open every view on the task, never on a summary or a pitch.
- **Do** let the status ladder pick the mode, and lead with exactly one primary action.
- **Do** use the serif for content and the sans for chrome, consistently.
- **Do** give the page ground its grain and raised surfaces their edge highlight.
- **Do** state a mode's consequence in its own label.
- **Do** treat decay as routing information, never as an error or a scolding.
- **Do** keep reference-only Learn topics compact and add richer hierarchy only when the content earns it.
- **Do** keep Learn sources and limitations visible, subordinate and readable at 200% text scaling.

### Don't
- **Don't** put a hero, slogan, or eyebrow above a heading.
- **Don't** build a wall of identical metric cards.
- **Don't** shape something like a flashcard unless it actually conceals an answer.
- **Don't** turn structured Learn content into arbitrary HTML, a marketing article, or a stack of mini-cards.
- **Don't** nest cards, use side-stripe borders, gradient text, or glassmorphism.
- **Don't** reach for military, survivalist, or tactical visual language, even though the Survival and Tradecraft subject matter invites it. The framing is competence, not catastrophe.
- **Don't** add streaks, badges, XP, or shame-based nudges.
- **Don't** widen the mobile layout and call it desktop. Desktop gets a real side rail.
- **Don't** let an early Test counterfeit or postpone scheduled evidence.
