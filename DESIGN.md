---
name: Argus
description: A dark brushed-gunmetal index for finite, closed-scope competencies — cool milled greys, one polished-steel accent, one tarnish, and a mono readout voice.
colors:
  bg: "#101215"
  surface: "#16191d"
  surface-2: "#1d2126"
  surface-3: "#272c33"
  surface-4: "#343a42"
  field: "#0b0d10"
  ink: "#e6eaf0"
  muted: "#979fac"
  subtle: "#868f9d"
  line: "#2a2f37"
  line-strong: "#3d4450"
  line-hover: "#5b6472"
  accent: "#e9edf3"
  accent-2: "#ffffff"
  accent-ink: "#0b0d10"
  learning: "#8aa8c8"
  survival: "#92a9ab"
  tradecraft: "#a79ac0"
  danger: "#d98078"
  ok: "#92b5ae"
  complete: "#8c98a5"
  warning: "#d68d5e"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "clamp(2.5rem, 9vw, 3.6rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  page-title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "2.15rem"
    fontWeight: 600
    lineHeight: 1.06
    letterSpacing: "-0.028em"
  section-title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.45rem"
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: "-0.02em"
  component-title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.05rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.98rem"
    fontWeight: 400
    lineHeight: 1.55
  readout:
    fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace"
    fontSize: "0.68rem"
    fontWeight: 600
    letterSpacing: "0.055em"
    textTransform: "uppercase"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
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
  edge: "inset 0 1px 0 rgb(255 255 255 / 7%)"
  edge-under: "inset 0 -1px 0 rgb(0 0 0 / 50%)"
  engrave: "inset 0 1px 3px rgb(0 0 0 / 62%)"
  press: "inset 0 2px 5px rgb(0 0 0 / 50%)"
  press-lit: "inset 0 2px 4px rgb(0 0 0 / 22%)"
  shadow-sm: "0 1px 2px rgb(0 0 0 / 40%)"
  shadow-key: "0 10px 26px rgb(0 0 0 / 46%)"
  shadow: "0 16px 42px rgb(0 0 0 / 42%)"
  shadow-lift: "0 26px 60px rgb(0 0 0 / 54%)"
components:
  button-primary:
    background: "linear-gradient(180deg, {colors.accent-2}, {colors.accent})"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.md}"
    height: "44px"
    shadow: "{elevation.shadow-sm}"
    pressed: "translateY(1px), {elevation.press-lit}"
  button-ghost:
    background: "linear-gradient(180deg, {colors.surface-3}, {colors.surface-2})"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "44px"
    shadow: "{elevation.edge}, {elevation.edge-under}, {elevation.shadow-sm}"
    pressed: "translateY(1px), {elevation.press}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    height: "38px"
    border: "none"
  engraved-track:
    backgroundColor: "{colors.field}"
    shadow: "{elevation.engrave}"
    rounded: "{rounded.pill}"
    height: "3px"
  flip-card:
    minHeight: "clamp(300px, 58svh, 500px)"
    rounded: "{rounded.xl}"
    shadow: "{elevation.edge}, {elevation.edge-under}, {elevation.shadow}"
    flipDuration: "460ms"
  topic-row:
    backgroundColor: "transparent"
    rounded: "0"
    padding: "15px 2px"
  sheet:
    background: "linear-gradient(180deg, {colors.surface-2}, {colors.surface})"
    rounded: "16px 16px 0 0"
---

# Design System: Argus

## 1. Overview

**Creative North Star: "Brushed Gunmetal"**

Argus is styled as a precision instrument, not a dashboard and not a journal: a dark, low-glare index the owner opens for a few minutes, uses without friction, and closes. Every screen answers one question, what's due, before it answers anything else.

The material is machined metal. Surfaces are milled cool grey and read as stamped plate; controls protrude with a lit top edge and a dark lower lip, and fall into the chassis when held; progress tracks are cut into the surface rather than drawn on it. One thing on a screen is polished, and it is the action you are being asked to take.

The system runs on **two voices**. A native sans carries everything a person reads and operates: page titles, topic names, scope statements, prose, buttons. A native mono carries everything the instrument reports: counts, dates, positions, status, track labels. Nothing is downloaded for either, so the PWA opens the same offline as online. That split is the identity: when the type turns mono, you are reading a measurement; when it is sans, you are reading language.

This replaced an earlier warm, serif-led field-journal pass. The information architecture it produced was right and is unchanged — index rows, one primary action, decay as routing — but the material underneath it has been swapped from brass-and-olive to gunmetal-and-steel, and the second voice from a serif to a mono.

**Key characteristics:**
- Cool milled greys over grain, machining marks and a convex highlight; one polished-steel accent, never decorative
- Sans for language, mono for readings, and the boundary between them is meaningful
- Depth from bevel and engraving (lit top edge, dark lower lip, inset tracks), not from stacked drop shadows
- Exactly one warm colour in the product, and it means a skill has decayed
- Dense index rows over card grids; a topic list reads like a table of contents
- Motion is state feedback plus one piece of card physics; nothing else moves

## 2. Colors

A restrained strategy: cool near-black neutrals carry almost the entire surface, one polished accent is held to primary actions and current state, one warm colour is held to decay, and three low-chroma track colors are used exclusively as typographic labels.

### The chassis
- **Gunmetal** (`#101215`): page background. Near-black with a cool undertone, never a true grey and never warm.
- **Milled** (`#16191d`) → **Raised** (`#1d2126`) → **Lifted** (`#272c33`) → **Top** (`#343a42`): four tonal steps, and all four are used. Hierarchy is built by moving between them.
- **Recess** (`#0b0d10`): the one surface *below* the page. Inputs and progress tracks are cut into the chassis, so they sit on it rather than above it.
- **Ink** (`#e6eaf0`): primary text. Cooler than white, so the accent can be white.
- **Steel Ash** (`#979fac`): secondary text. **Slate** (`#868f9d`): quietest, for readouts and kickers. Held light enough to clear 4.5:1 on a hovered row, not just on the page ground.
- **Line** (`#2a2f37`) / **Line Strong** (`#3d4450`) / **Line Hover** (`#5b6472`): the rule vocabulary.

### Accent
- **Polish** (`#e9edf3`) and **Highlight** (`#ffffff`). The primary button is a top-lit gradient between them, reading as a polished inlay set into the chassis. **Ink-on-Polish** (`#0b0d10`) is the only text color used on top.
- The accent is a **material, not a hue**: what marks a surface as accented is that it is the one catching the light. This is why `--ink` is deliberately held below white.

### Status
- **Tarnish** (`#d68d5e`): decay, and nothing else. See the One Warm Colour Rule.
- **Clay** (`#d98078`) for a missed card and for destructive actions; **Mineral** (`#92b5ae`) for a correct one. Both cooled until they sit inside the gunmetal world, but kept as a genuine red/green pair, because the one screen that grades you is the wrong place to spend clarity on minimalism.
- **Settled** (`#8c98a5`): a completed step. Cool slate — done, and no longer the thing in progress.

### Track semantics
**Steel Blue — Learning** (`#8aa8c8`), **Verdigris — Survival** (`#92a9ab`), **Pewter — Tradecraft** (`#a79ac0`). Low chroma, so they read as tinted metal rather than as three crayons. None of them is copper, because copper means decay and the two appear on the same row.

### Named Rules
**The One Accent Rule.** The polish appears only on the primary action, the current selection, and active state. Two polished elements on one screen means one of them is wrong. The single exception is the completion moment, where the polish marks the event rather than an action.

**The One Warm Colour Rule.** Tarnish is the only warm colour in the product and it means exactly one thing: this skill has decayed and needs repair. On a screen that is otherwise entirely grey and white it cannot be missed, and it cannot be confused with anything else. Spending it anywhere else destroys the only pre-attentive signal the system has.

**The No Track-as-Background Rule.** Track colors are set as small-caps typographic labels. They never fill a surface, a button, or a border stripe.

## 3. Typography

**Language:** the native sans stack. It carries titles, topic names, scope, prose, and every button verb.

**Readings:** `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace`. It carries counts, dates, positions, status words, track labels and section kickers.

`--font-display` deliberately resolves to the same family as `--font`. The display voice is now carried by size, weight and negative tracking rather than by a second family; the token is kept so the surfaces that speak in it stay named and the family can be changed in one place.

### Hierarchy
- **Display** (sans, `clamp(2.5rem, 9vw, 3.6rem)`, weight 600, tracking −0.03em): topic titles on the Learn sheet. The largest type in the product, because on that screen the topic *is* the screen.
- **Card value** (sans, `clamp(3rem, 16vw, 6.5rem)`): the prompt and answer on a flashcard. The one place type is allowed to dominate a full viewport, because it is the entire task in that moment.
- **Page title** (sans, 2.15rem, weight 600, tracking −0.028em): the h1 on every view. No eyebrow above it.
- **Section title** (sans, 1.45rem, tracking −0.02em): h2.
- **Component title** (sans, 1.05rem, weight 600): topic titles in dense rows, panel headings.
- **Body** (sans, 0.98rem, line-height 1.55): prose, capped near 68ch.
- **Readout** (mono, 0.68rem, weight 600, letter-spacing 0.055em, uppercase): metadata, status, track, kickers, counts, dates. Mono is wider than the sans at the same size, so the readout step is one notch smaller and less tracked than a sans label would be, or a row of them will not fit a 320px screen.

### Named Rules
**The Two-Voice Rule.** Mono means a reading; sans means language. A button verb never uses the mono, and a status word never uses the sans. The one place this is explicit is the session bar, where the deck's *name* and the *End test* control stay sans inside an element that is otherwise mono. Mixing them destroys the only signal that tells the eye which is which.

**The No-Eyebrow Rule.** Headings do not get an eyebrow label above them. Eyebrow-weight type is reserved for genuine metadata: track labels, item counts, session kickers. Learn's `Briefing`, `Concise support`, and `Case study` labels are content-type metadata, not decorative pre-headings.

**Tabular figures everywhere.** Any number that updates in place (counts, positions, scores, dates) carries `font-variant-numeric: tabular-nums`, so digits never reflow the layout around them.

## 4. Elevation and material

The page sits on a **three-layer substrate**, all of it fixed, non-interactive and never animated: SVG turbulence **grain** for tooth, **machining** marks — 1px diagonals at −45°, light and dark — for the brushed direction, and a **convex** radial highlight for the light falling on the panel from above. Together they exist so the dark ground reads as metal rather than as an absence. They are fixed rather than scrolled, so the 1px marks never moire against moving content.

Depth is then built from four things, in this order: **tonal layering**; an **edge highlight** (`inset 0 1px 0 rgb(255 255 255 / 7%)`) that makes a raised surface read as catching light from above; an **under-edge** (`inset 0 -1px 0 rgb(0 0 0 / 50%)`) that gives it thickness; and only then a shadow. Anything recessed uses **`--engrave`** instead, which cuts it into the chassis.

### Shadow Vocabulary
- **`--edge` / `--edge-under`**: the bevel on anything raised. A control has both.
- **`--engrave`**: anything cut into the surface — inputs, progress tracks, an engaged filter chip.
- **`--press` / `--press-lit`**: a held control, dropping into the chassis. The lit variant is for the polished primary, which does not need half a stop of black in it to look held.
- **`--shadow-sm`**: buttons and small raised controls.
- **`--shadow-key`**: the required action on Today, when there is one.
- **`--shadow`**: the flashcard, the one focused surface in a session.
- **`--shadow-lift`**: the completion moment, and the sheet.

### Named Rules
**One Lit Surface Rule.** At most one surface per view is lit. In a session it is the card. On Today it is the required action itself, so a day with nothing due carries no polish and no shadow anywhere, because there is no work. Everything else sits flush with a bevel at most.

The rule says *at most*, not *exactly*. A view with nothing to light is allowed to stay dark. Learn briefings are editorial flow, not raised surfaces, so they do not create a second lit object.

## 5. Modes

Two ways to engage a topic. Learn exposes the material; Test is the only recall interaction.

`Learn` is a semantic, not a label: the learner reads `Read` for an ordinary
topic and `Lesson N` for a curriculum, and `Test` is the only mode name that
reaches them, because it is the only one with a consequence to state.

| Mode | Surface | Records |
|---|---|---|
| **Learn** | The topic page itself for an ordinary topic: the finite prompt/answer reference in full, preceded by optional concise or briefing support, concealing nothing. A guided lesson for a curriculum topic. | Moves `unstarted` → `learning`. No score. |
| **Test** | Flashcards with a 3D flip, every scored item once, self-scored | Records the attempt; moves the ladder only when scheduled evidence conditions are met |

Learn has three valid visual outcomes. A **reference-only** topic keeps the compact title/scope/count + numbered set with no additional scaffolding. **Concise support** adds only the small amount of explanation/provenance/limitation the topic needs. A **briefing** may add short sections, lists, definitions, compact tables and integrated case studies before a visibly separate `Recall reference` section. The extra structure is never mandatory simply because the renderer supports it.

### Named Rules
**Flashcards Must Conceal.** A card shape promises a hidden answer. If both sides are visible at once it is not a card, it is a list, and it should be set as one. Learn is therefore never card-shaped, and Test never shows the answer before the flip.

**Support Does Not Score.** The Learn briefing is explanatory. The `Recall reference` is the visible rendering of the finite Test deck. Their separation must be legible in the page hierarchy so richer explanation cannot imply that every sentence is a completion requirement.

**Consequence Is Stated, Not Implied.** Voluntary early Tests state that the score is recorded while required evidence clocks do not move early.

## 6. Components

All state transitions are 150–220ms on properties only, never layout, and collapse under `prefers-reduced-motion`.

### Buttons
Controls are hardware. At rest they protrude: a lit top edge, a dark lower lip, a shadow beneath. Held, they drop into the chassis — the surface moves down a pixel and the shadow moves inside it.

- **Primary:** top-lit polish gradient, Ink-on-Polish text, 44px minimum, 8px radius. A white plate set into grey metal, and the only one on the screen.
- **Ghost:** a Lifted→Raised gradient, Line Strong border with a Line Hover top edge, both bevel shadows.
- **Quiet:** text-weight, no border, no background, no bevel. Used where a third control would otherwise blunt the primary one.
- **Danger:** Clay, destructive actions only.
- **Readout:** a control that reports rather than commands — a count, a filter, a position. It takes the mono voice so it sits with the data it belongs to.

### Engraved tracks
Every progress indicator is a track cut into the surface (`--field` plus `--engrave`) with the fill sitting inside the cut. Two kinds, and the difference is deliberate:

- **Neutral tracks** — the retention gap on a library or progress row — fill in steel, never the accent. Lighting one would light up every row, and a semantic colour would turn a schedule into a scoreboard.
- **The lit track** — the lesson sitting meter — fills in the polish, because closing that finite boundary is the thing the screen is asking for. It is the only meter in the product whose fill is the accent.

### Flip card
A `preserve-3d` inner element rotated 180° on the Y axis inside a stage that owns the perspective. Both faces are stamped plate: a diagonal sheen over a depth gradient, bevelled top and bottom. The front is neutral; the back is the one catching the light, because the answer is what you came for. Scoring controls fade in after the flip is most of the way through, so they never invite a click at a card the user has not read yet.

### Structured Learn support
The richer Learn layer is a compact reference briefing, not an article template and not a stack of cards.

- Maximum prose measure stays near 68ch; overview copy may use a slightly larger reading size (`--t-lede`), while longer explanatory body copy uses the normal body voice.
- Structure is native and visible: headings, paragraphs, unordered/ordered lists, definition lists and compact tables.
- Whole-framework/procedure case studies are continuous sections separated with rules and spacing. They are not one card per stage or one panel per term.
- The finite recall set follows rich support under a strong hairline and `Recall reference` metadata label.
- Sources and limitations remain in normal document flow, set smaller/muted but not collapsed or hidden.
- Tables wrap content aggressively and may scroll inside their own focusable wrapper at extreme text scaling. The page itself must not overflow horizontally at 200% text scaling.
- No animation is needed for briefing comprehension; reduced-motion behavior is therefore inherited without special alternative content.

### Topic rows (not cards)
The library is a dense index. Each row: no radius, full-width bottom hairline, sans title, mono readout metadata. One trailing action button per row, and it launches the mode the ladder is asking for.

Rows, not cards, is a deliberate rejection of the obvious gunmetal move. A card per topic with a bezelled icon looks like hardware and costs roughly half the rows that fit a phone screen; the index is both denser and more minimal, which is what the material is actually for.

### The docket
Today uses the same index rows, because a due topic and a library topic are the same object. The whole row is the control and it starts that topic alone, so a five-minute window never has to take the whole batch. The row's metadata is the **reason** the topic surfaced today (`dueState().label`) and its item count, never its rung: the rung is a fact about the topic, the reason is a fact about today. Below the docket, one primary action runs the batch the top-ranked topic belongs to.

Counts are stated in items, not topics alone. Four topics can be eight items or forty-five, and the difference is the entire question of whether there is time.

### Stat strip
One bordered container divided by hairlines, reading as a single instrument panel. Every figure is a reading, so every figure is mono.

### Library list
Titles only, with the row gauge where a topic has earned a reading. Started topics come first under one mono `Learning` label, most recent at the top; everything else follows by title with no label. A row opens its topic and carries no action button, status words, item count or track. Search is a single icon control that opens leftwards over the heading.

### Current destination
Once the accent is a near-white, a hue shift alone cannot carry "current" against ink that is also near-white. The navigation marks it with a 2px machined bar on the edge the nav is attached to: along the top on the mobile bar, down the left on the desktop rail.

### Named Rules
**The Nothing-Nests Rule.** A card never contains another card. Internal grouping uses a hairline or spacing. Learn case studies follow the same rule: hierarchy is document structure, not nested surfaces.

## 7. Do's and Don'ts

### Do
- **Do** open every view on the task, never on a summary or a pitch.
- **Do** let the status ladder pick the mode, and lead with exactly one primary action.
- **Do** use the sans for language and the mono for readings, consistently.
- **Do** give the page ground its grain and machining, raised surfaces their bevel, and recessed ones their engraving.
- **Do** keep tarnish for decay alone, so it stays the one warm thing on a cool screen.
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
- **Don't** add glow. A polished surface catches light; it does not emit it. Outer glow on a fill is the fastest way to turn a machined instrument into a sci-fi prop, and it smears on OLED.
- **Don't** let the material drag the *language* tactical. The chassis is machined; the words are not. Argus says `Needs repair`, `Continue lesson 2` and `Start`, never `TST`, `MODULE DATA` or `INITIATE EXECUTION`. Status is written in English and reinforced by colour, not replaced by a callsign. The Survival and Tradecraft subject matter invites the opposite, and the framing is competence, not catastrophe.
- **Don't** add streaks, badges, XP, or shame-based nudges.
- **Don't** widen the mobile layout and call it desktop. Desktop gets a real side rail.
- **Don't** let an early Test counterfeit or postpone scheduled evidence.
