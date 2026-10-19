---
name: Argus
description: A lifted dark-slate index for finite, closed-scope competencies. Opaque plates, one signal-yellow action, four solid Morse mode colours, three track colours, one copper that means decay, and a mono readout voice.
colors:
  bg: "oklch(0.255 0.012 255)"
  surface: "oklch(0.30 0.013 255)"
  surface-2: "oklch(0.345 0.014 255)"
  surface-3: "oklch(0.40 0.015 255)"
  surface-4: "oklch(0.45 0.015 255)"
  field: "oklch(0.22 0.012 255)"
  ink: "oklch(0.97 0.004 255)"
  muted: "oklch(0.83 0.012 255)"
  subtle: "oklch(0.75 0.012 255)"
  placeholder: "oklch(0.68 0.012 255)"
  line: "oklch(0.42 0.014 255)"
  line-strong: "oklch(0.55 0.014 255)"
  line-hover: "oklch(0.62 0.014 255)"
  action: "oklch(0.86 0.16 95)"
  action-ink: "oklch(0.22 0.04 95)"
  accent: "oklch(0.86 0.16 95)"
  accent-2: "oklch(0.86 0.16 95)"
  accent-ink: "oklch(0.22 0.04 95)"
  accent-wash: "oklch(0.33 0.03 95)"
  mode-key: "oklch(0.80 0.14 150)"
  mode-key-ink: "oklch(0.22 0.04 150)"
  mode-listen: "oklch(0.80 0.10 250)"
  mode-listen-ink: "oklch(0.22 0.04 250)"
  mode-read: "oklch(0.80 0.11 300)"
  mode-read-ink: "oklch(0.22 0.04 300)"
  mode-free: "oklch(0.80 0.12 205)"
  mode-free-ink: "oklch(0.22 0.04 205)"
  learning: "oklch(0.78 0.10 250)"
  survival: "oklch(0.80 0.11 205)"
  tradecraft: "oklch(0.77 0.11 300)"
  danger: "oklch(0.74 0.13 18)"
  danger-2: "oklch(0.80 0.11 18)"
  danger-ink: "oklch(0.20 0.04 18)"
  ok: "oklch(0.80 0.10 170)"
  complete: "oklch(0.70 0.02 255)"
  warning: "oklch(0.75 0.11 50)"
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
    fontSize: "0.75rem"
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
  edge: "0 0 0 0 transparent"
  edge-under: "0 0 0 0 transparent"
  engrave: "inset 0 0 0 1px {colors.line}"
  press: "inset 0 2px 4px rgb(0 0 0 / 30%)"
  press-lit: "inset 0 2px 4px rgb(0 0 0 / 18%)"
  shadow-sm: "0 1px 2px rgb(0 0 0 / 30%)"
  shadow-key: "0 8px 22px rgb(0 0 0 / 35%)"
  shadow: "0 14px 36px rgb(0 0 0 / 35%)"
  shadow-lift: "0 22px 54px rgb(0 0 0 / 42%)"
components:
  button-primary:
    background: "{colors.action}"
    textColor: "{colors.action-ink}"
    rounded: "{rounded.md}"
    height: "44px"
    shadow: "{elevation.shadow-sm}"
    pressed: "translateY(1px), {elevation.press-lit}"
  button-ghost:
    background: "{colors.surface-2}"
    hover: "{colors.surface-3}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "44px"
    shadow: "{elevation.shadow-sm}"
    pressed: "translateY(1px), {elevation.press}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    height: "38px"
    border: "none"
  engraved-track:
    backgroundColor: "{colors.field}"
    shadow: "{elevation.engrave}"
    fill: "topic track colour; {colors.action} for the lit track"
    rounded: "{rounded.pill}"
    height: "3px"
  flip-card:
    minHeight: "clamp(300px, 58svh, 500px)"
    rounded: "{rounded.xl}"
    shadow: "{elevation.shadow}"
    flipDuration: "460ms"
  topic-row:
    backgroundColor: "transparent"
    rounded: "0"
    padding: "15px 2px"
  library-plate:
    background: "{colors.surface}"
    raised: "{colors.surface-2}"
    rounded: "{rounded.lg}"
    padding: "14px 18px 14px 14px"
    gap: "8px"
  sheet:
    background: "{colors.surface-2}"
    shadow: "{elevation.shadow-lift}"
    rounded: "16px 16px 0 0"
  mode-tile:
    backgroundColor: "{colors.mode-key}"
    textColor: "{colors.mode-key-ink}"
    note: "one of four solid mode fills (key, listen, read, free), each with its own ink"
    rounded: "{rounded.lg}"
    minHeight: "56px"
  path-spine:
    width: "2px"
    done: "{colors.action}"
    ahead: "{colors.line-strong}"
  path-milestone:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.line}"
    rounded: "{rounded.lg}"
    node: "square, flag for a word check, A-Z for the Test"
    width: "full"
---

# Design System: Argus

**Status:** current design contract. The **Signal on Slate** standard (#225/#226, owner-approved 2026-10-17) is the visual authority; the colour tokens landed in #226, and the Morse tile and path surfaces specified below ship with #228 to #230. Morse/Home (#195) and Communicator Roles (#196) merged on 2026-10-07 and were released and deployment-verified in v1.5.0; real Pixel acceptance remains outstanding.
**Authority:** design context. Signal on Slate supersedes the retired Brushed Gunmetal material system, and the #227 no-fold rule supersedes earlier disclosure guidance. Light mode was considered and is parked as an idea (#237); Dark Slate is the standard. `docs/open/ISSUE_225_UI_OVERHAUL.md` tracks integration and browser acceptance. `docs/open/TOPIC_PAGE_REVAMP.md` and `docs/open/LIBRARY_COMPACT_TOPICS.md` own the pending topic-page and provenance contracts.

## 1. Overview

**Creative North Star: "Signal on Slate"**

Argus is a precision instrument, not a dashboard and not a journal: a calm dark index the owner opens for a few minutes, uses without friction, and closes. Every screen answers one question, what's next, before it answers anything else.

The ground is a lifted cool slate, light enough that a plate reads as an object and colour has something to sit on. Every container is an opaque plate: it separates from its neighbours by a step in fill, a 1px line, size and weight, never by a wash of colour, a glow or a texture. Against that quiet ground there is exactly one signal, a yellow that means "do this" or "you are here", and colour is otherwise spent on meaning: four solid mode colours say which kind of Morse practice you are in, three track colours say what subject a topic belongs to, and one copper says a skill has decayed.

The earlier Brushed Gunmetal pass made everything dark and restrained, and the result was a product with almost no colour outside decay, in which the one accent was a near-white that could not be told from the text. Slate keeps what that pass got right (the index structure, one primary action, decay as routing, calm) and drops the material metaphor that was holding colour back.

The system runs on **two voices**. A native sans carries everything a person reads and operates: page titles, topic names, scope statements, prose, buttons. A native mono carries everything the instrument reports: counts, dates, positions, status, track labels. Nothing is downloaded for either, so the PWA opens the same offline as online. That split is the identity: when the type turns mono, you are reading a measurement; when it is sans, you are reading language.

**Key characteristics:**
- A lifted slate chassis and opaque plates; hierarchy from fill steps, size and weight, never from translucency, glow or texture
- One signal-yellow action: the primary action, the current selection, the current step and the done part of a path
- Four solid mode colours and three track colours used for wayfinding, with copper reserved for decay
- Sans for language, mono for readings, and the boundary between them is meaningful
- Dense index rows over card grids; a topic list reads like a table of contents
- Few, large words: a tile or label is one or two words, and a screen shows what the task will put in front of you
- Motion is state feedback, one piece of card physics, and a short arrival for the Library list and its gauges; nothing moves for its own sake

## 2. Colors

A signal strategy: a lifted cool slate carries the surface, one yellow is held to the action you are being asked to take, four mode colours and three track colours do wayfinding, and one copper is held to decay. Every fill is solid.

### The chassis
- **Slate** (`oklch(0.255 0.012 255)`): page background. Cool and lifted, never near-black and never warm.
- **Plate** (`oklch(0.30 0.013 255)`) → **Raised** (`oklch(0.345 0.014 255)`) → **Lifted** (`oklch(0.40 0.015 255)`) → **Top** (`oklch(0.45 0.015 255)`): four tonal steps, and all four are used. Hierarchy is built by moving between them.
- **Recess** (`oklch(0.22 0.012 255)`): the one surface *below* the page. Inputs and progress tracks are recessed by a darker fill and a 1px line, so they sit in the chassis rather than above it.
- **Ink** (`oklch(0.97 0.004 255)`): primary text. **Muted** (`oklch(0.83 0.012 255)`): secondary text. **Subtle** (`oklch(0.75 0.012 255)`): quietest, for readouts and kickers; it clears 4.5:1 on the page, a plate and a raised plate, and text on Lifted and above uses Muted instead. **Placeholder** (`oklch(0.68 0.012 255)`).
- **Line** (`oklch(0.42 0.014 255)`) / **Line Strong** (`oklch(0.55 0.014 255)`) / **Line Hover** (`oklch(0.62 0.014 255)`): the rule vocabulary. Line Strong is held at 3:1 against the page so a locked node's ring and the path ahead stay visible as UI.

### Signal
- **Signal** (`oklch(0.86 0.16 95)`, token `--action`) with **Ink-on-Signal** (`oklch(0.22 0.04 95)`, `--action-ink`), the only text colour used on top. The primary button is a solid fill of it; there is no gradient and no wash.
- The `--accent`, `--accent-2` and `--accent-ink` names predate Signal and are aliases of it, so every older surface moves with it. `--accent-wash` (`oklch(0.33 0.03 95)`) is a solid warm slate, not an alpha.
- Signal is a **meaning, not a decoration**: it marks the one thing you are being asked to do, or where you are.

### Morse modes
Four solid fills, each with its own ink, one per Morse activity. They show where you are, so each fills only its own tile and sets the hue of its session frame and pips.

- **Key** (`oklch(0.80 0.14 150)`, ink `oklch(0.22 0.04 150)`)
- **Listen** (`oklch(0.80 0.10 250)`, ink `oklch(0.22 0.04 250)`)
- **Read** (`oklch(0.80 0.11 300)`, ink `oklch(0.22 0.04 300)`)
- **Free play** (`oklch(0.80 0.12 205)`, ink `oklch(0.22 0.04 205)`)

Listen, Read and Free play share hues with the tracks below. That is deliberate and safe, because modes and tracks never share a screen.

### Status
- **Copper** (`oklch(0.75 0.11 50)`): decay, and nothing else. It always travels with its ◆ glyph and the words `Needs repair`. See the Copper Means Decay rule.
- **Clay** (`oklch(0.74 0.13 18)`, light `oklch(0.80 0.11 18)`, ink `oklch(0.20 0.04 18)`) for a missed card and for destructive actions; **Mineral** (`oklch(0.80 0.10 170)`) for a correct one. The miss red sits at 18°, well clear of copper at 50°, so the one screen that grades you keeps a genuine red/green pair without borrowing the decay colour.
- **Settled** (`oklch(0.70 0.02 255)`): a completed step. Slate that has clearly stopped being the thing in progress.

### Track semantics
**Steel Blue, Learning** (`oklch(0.78 0.10 250)`), **Verdigris, Survival** (`oklch(0.80 0.11 205)`), **Pewter, Tradecraft** (`oklch(0.77 0.11 300)`). They were raised from the old anodised-metal chroma so tracks read as colour. Lightness is matched so no track outranks another. None of them is copper, because copper means decay and the two appear on the same row. A track colour may fill an icon, a gauge or a ring and may set a label; it never makes a side stripe.

### Named Rules
**The One Action Rule.** Signal yellow appears only on the primary action, the current selection, the current step and the done part of a path. It is never decoration. Two primary actions on one screen means one of them is wrong. The single exception is the completion moment, where Signal marks the event rather than an action.

**The Copper Means Decay Rule.** Copper is used only for decay, always with the ◆ glyph and words, so the meaning never rests on colour alone. No other role sits within 30° of copper's hue at similar lightness; Signal (95°) and the miss red (18°) both clear it. Spending copper anywhere else destroys the one pre-attentive signal that says a skill has slipped.

**The Solid Plates Rule.** Every container is opaque. No translucent fills, no translucent borders, no glow, and no gradient standing in for a colour. Neutral drop shadows are allowed for things that lift (the card, a sheet) and for the pressed state.

**Mode Colours Show Where You Are.** A mode hue appears only on its own tile, its session frame and its pips. Tracks and modes never share a screen, so a hue means one thing wherever it appears.

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
- **Readout** (mono, 0.75rem, weight 600, letter-spacing 0.055em, uppercase): metadata, status, track, kickers, counts, dates. Mono is wider than the sans at the same size, so the readout step is one notch smaller and less tracked than a sans label would be, or a row of them will not fit a 320px screen.

### Named Rules
**The Two-Voice Rule.** Mono means a reading; sans means language. A button verb never uses the mono, and a status word never uses the sans. The one place this is explicit is the session bar, where the deck's *name* and the *End test* control stay sans inside an element that is otherwise mono. Mixing them destroys the only signal that tells the eye which is which.

**The No-Eyebrow Rule.** Headings do not get an eyebrow label above them. Eyebrow-weight type is reserved for genuine metadata: track labels, item counts, session kickers. Topic support uses descriptive native headings; the former Briefing and Concise support labels are omitted.

**Tabular figures everywhere.** Any number that updates in place (counts, positions, scores, dates) carries `font-variant-numeric: tabular-nums`, so digits never reflow the layout around them.

## 4. Elevation and material

The page is a plain solid slate. There is no texture layer: the grain, machining and convex highlight that gave the old ground its metal are retired, and their tokens resolve to `none`.

Depth is built from three things, in this order: **fill steps** (Slate, Plate, Raised, Lifted, Top); a **solid 1px line** (`--line`, `--line-strong`) where two plates of similar fill meet; and only then a **neutral shadow**, and only for something that lifts. Plates are flat and opaque. The old bevel tokens `--edge` and `--edge-under` remain as no-op names so existing shadow lists stay valid, and nothing new should use them.

A **recessed field** (an input, a progress track, an engaged filter chip) reads by a darker fill (`--field`) plus a 1px line (`--engrave`). Nothing is cut with an inner shadow.

### Shadow Vocabulary
- **`--engrave`**: the 1px line that outlines a recessed field. No blur, no darkness beyond the field's own fill.
- **`--press` / `--press-lit`**: a held control, dropping a pixel with a neutral shadow inside it. The lit variant is for the solid action fill, which needs less black in it to look held.
- **`--shadow-sm`**: buttons and small raised controls, and Home plates.
- **`--shadow-key`**: a focused required action.
- **`--shadow`**: the flashcard, the one focused surface in a session.
- **`--shadow-lift`**: the completion moment, and the sheet.

### Named Rules
**One Lifted Surface Rule.** At most one surface per view casts a deep shadow. In a session it is the card. Home plates use the modest `--shadow-sm`; no plate receives the session key depth. Colour carries meaning on a plate; the shadow never does.

The rule says *at most*, not *exactly*. A view with nothing to lift is allowed to stay flat. Learn briefings are editorial flow, not raised surfaces, so they do not create a second lifted object.

## 5. Modes

Two ways to engage a topic. Learn exposes the material; Test is the only recall interaction.

`Learn` is internal terminology. Ordinary topics open directly as reading; their action is `Test`, `Test again` or `Repair`. Curriculum acquisition uses `Lesson N`.

| Mode | Surface | Records |
|---|---|---|
| **Learn** | For an ordinary topic, the topic page's item spine (every prompt with its answer, concealing no scored material) and its Learn screen (optional hero, scope and explanatory support). A guided lesson for a curriculum topic. | Opening ordinary content writes nothing. Curriculum lessons own acquisition writes. |
| **Test** | Flashcards with a 3D flip, every scored item once, self-scored | Records the attempt; one clean eligible Test banks the topic |

### Topic page contract
Every topic takes the screen kit (#244). An ordinary topic opens with a ScreenHeader: Back, its track-coloured recognition glyph, the title, a track-coloured bar of items settled with a settled / total reading (Settled slate once banked), and one mono status line (`◆ Needs repair` in copper in repair, `✓ Banked` once banked), plus a listening reading where the topic has recordings. The body is the complete scored set on a ProgressSpine: one reading row per item, prompt as the label and answer beneath (a pictured item's picture is its prompt, so its row names the answer), numbered or carrying its authored sequence letter, with any stimulus or recording under the row; authored sequences head each group with a square milestone plate. Node state comes from per-item Test evidence where it exists, otherwise from the topic's rung; copper marks only an item with a recorded miss, and a decayed topic says so once, in its header. No row is a forced position. History is one row of pips, one per attempt, filled to its score, with `First completed` as one mono line. A ModeTray holds Learn and Practice in the track colour and Test (`Test again`, `Repair`) in Signal: Learn opens the topic's Learn screen (optional hero, scope, explanatory support and its own sources control) with Back to the topic, and is locked when there is nothing to read; Practice shows the count of missed items, as Test shows the item count, and is locked while nothing is missed. Scope moves into the Sources and limitations sheet, and stays visible as the lede of the Learn screen, so survival safety boundaries are never more than one tap away and are visible wherever the explanation is read.

Ordinary-topic explanatory sections, overview and case studies remain visible in editorial flow on the Learn screen. A quiet centred footer control opens scope, limitations as bullets, then sources, in a centred modal. All authored ordinary Learn content remains available. Morse keeps a short course explanation on the A–Z reference page. Morse instead has Back and A–Z controls, a title and a solid 8px settled-letter bar with a settled / 26 reading. Its straight path owns the body and opens at the current node, which marks position only: there is no forced path, and every reached node is equally tappable (#242). Key, Listen, Read and Free play form an opaque tray fixed above phone navigation and placed above the path at desktop widths (980px and up). The footer contains Edit, Delete and Sources and limitations. Begin enters the existing new-learner transition directly; Skip ahead opens placement. There is no second Morse chooser or docked primary. Historical hub entries normalize in place to the topic.

**Test Conceals; Reference Reveals.** Test keeps the answer hidden until reveal. Topic item rows show prompt and answer together; their compact reference treatment must remain distinct from the focused Test card.

**Support Does Not Score.** The Learn briefing is explanatory. The topic page's item spine is the visible rendering of the finite Test deck. Keeping the briefing on its own Learn screen keeps the two apart so richer explanation cannot imply that every sentence is a completion requirement.

**Consequence Is Stated, Not Implied.** Test records a score; course acquisition gates remain explicit. No Test waits on an elapsed-time clock.

## 6. Components

All state transitions are 150–220ms on properties only, never layout, and collapse under `prefers-reduced-motion`.

### Named Rules

**The No-Fold Rule.** Content is either visible or it lives on its own page; nothing is folded.

### Buttons
Controls are solid plates. At rest they sit on the chassis with a small neutral shadow; held, the surface moves down a pixel and the shadow moves inside it. Hover moves a control one fill step, never a gradient or a glow.

- **Primary:** the solid Signal fill (`--action`), Ink-on-Signal text, 44px minimum, 8px radius. A yellow plate on slate, and the only one on the screen. The one control a screen is asking to be pressed may use the 56px large step.
- **Ghost:** a solid Raised fill (`--surface-2`) with a Line Strong border; hover moves it to Lifted (`--surface-3`) and the border to Line Hover.
- **Quiet:** text-weight, no border, no background. Used where a third control would otherwise blunt the primary one.
- **Danger:** Clay, destructive actions only.
- **Readout:** a control that reports rather than commands: a count, a filter, a position. It takes the mono voice so it sits with the data it belongs to.

### Engraved tracks
Every progress indicator is a recessed track: a darker fill (`--field`) with a 1px line (`--engrave`) and the fill sitting inside it. Two kinds, and the difference is deliberate:

- **Topic tracks**, the gap, evidence or acquisition reading on a Library row or topic page, fill in the topic's track colour, never the action colour and never a red/green status colour. Lighting one in yellow would light up every row, and a graded colour would turn a schedule into a scoreboard; a track is a category, so it colours without grading. A banked topic fills in Settled slate. The fill grows in once when the gauge appears (transform only), and not under reduced motion.
- **The lit track**, the lesson sitting meter, fills in Signal, because closing that finite boundary is the thing the screen is asking for. It is the only meter in the product whose fill is the action colour.

### Flip card
A `preserve-3d` inner element rotated 180° on the Y axis inside a stage that owns the perspective. Both faces are opaque plates with no texture. The front is a solid Raised fill; the back is a step higher (Lifted), because the answer is what you came for, and the card casts the one deep shadow in the view. Scoring controls fade in after the flip is most of the way through, so they never invite a click at a card the user has not read yet.

### Structured Learn support
The richer Learn layer is a compact reference briefing, not an article template and not a stack of cards.

- Maximum prose measure stays near 68ch; overview copy may use a slightly larger reading size (`--t-lede`), while longer explanatory body copy uses the normal body voice.
- Structure is native and visible: headings, paragraphs, unordered/ordered lists, definition lists and compact tables.
- Whole-framework/procedure case studies are continuous reading under descriptive native headings. They are not one card per stage or one panel per term.
- The finite recall set is the topic page's item spine; optional explanatory support reads openly on the Learn screen.
- A repeated reference whose unit is the entry (Beaufort's forces) uses the `entries` block: the marker is the heaviest element, then the title, a mono meta line, and labelled fields stacked beneath, never in columns.
- Sources and limitations remain available in a centred modal through one quiet footer control. Safety boundaries remain visible in the topic scope.
- Tables wrap content aggressively and may scroll inside their own focusable wrapper at extreme text scaling. The page itself must not overflow horizontally at 200% text scaling.
- No animation is needed for briefing comprehension; reduced-motion behavior is therefore inherited without special alternative content.

### Home

Home keeps the Argus/date/profile masthead, built from `ScreenHeader` (the wordmark is its title; the date and profile sit opposite and drop beneath it at enlarged text). A single raised `Plate` readout, divided by solid hairlines, reports Completed, In progress and Last active. Its figures are mono; no icons, gauges or separate metric cards appear in the strip.

Active topics lead the body, bounded to three plates in the journey's priority order. Plates are the kit's `plate plate-raised` classes on the button (a repair plate adds `plate-repair`, copper in the full hairline); no deep key shadow is applied, and a ring fills in the topic's track colour. Each plate has one recessed circular instrument and a title with one concise progression reading. Morse acquisition uses a real settled/total arc; ordinary topics without item-level evidence use a dashed Building recall state rather than a partial percentage. Repair uses a named reading and the copper dial/mark. Home has no redundant horizontal gauge, topic icon or procedural lesson/Test label.

The whole plate opens its topic; rings are informational and have a visible text equivalent. Home ends with `+ Add something to learn`, a full-width signal-yellow button and the one action colour on the screen, reusing the existing capture or deterministic authoring fallback. The empty state is one short plate line and a quiet Open Library. The mobile navigation is pinned solid to the bottom edge, full width with a top hairline and no radius, so nothing shows beneath it; its current destination is marked in the action colour. Desktop keeps its attached left rail. The route remains internally `today` for restored history.

### Guided Morse sending

Sending uses the shared full-screen session grammar, one stable written target, a recessed sent readout and the shared Morse key. Spotlight highlights one letter and reserves feedback space; continuous sending retains the whole target, with explicit word gaps for phrases/messages. Review presents target and received text with one primary next action. Sending leads Fluency, while listening spacing remains separate. Reduced motion, keyboard input and audio/haptic absence preserve the interaction state.

### Morse mode tray
The four Morse modes sit in a fixed tray above navigation, so the path owns the rest of the screen. Each is a solid tile in its own mode colour with that colour's ink, and it **shows the stimulus**: what the mode puts in front of you first.

- **Key** shows a letter (you see `A`, you key it).
- **Listen** shows an audio waveform (you hear it).
- **Read** shows dits and dashes (you see `·−−`, you name it).
- **Free play** shows your own text appearing at a cursor.

One word per tile, and no subtitle. Glyphs are bold, filled and pixel-aligned; there are no metaphor icons and no thin decorative strokes. A tile is at least 44px and may use the 56px step. The mode hue then carries into that mode's session frame and pips, and nowhere else.

### Morse progress path
The Morse course is one straight vertical line, top to bottom, opening scrolled to the current lesson. Rows read left to right: node, letters, label. Where the course is done the spine is the action colour; where it lies ahead it is `--spine-ahead`.

- **Lessons** have round nodes. State (done, current, locked) is carried by fill and ring, and by position on the line.
- **Milestones**: word checks and the A–Z Test break the rhythm. Each is a full-width plate that crosses the spine with a **square** node, a flag for a word check and `A–Z` for the Test, and an uppercase label. The A–Z Test is the largest. Shape, width and label say "this is a test", so the meaning never rests on colour.
- **The current row** is a raised plate with a solid Signal node. It says "you are here" and sets where the path opens; it carries no `Start` chip, and every reached row is equally tappable (#242).

The path is a progress visualisation, not gamification: it carries no XP, streak, heart or gem, and it never reads a clock.

### Screen kit
The Signal on Slate structure is the standard for every screen (#243). Build from these in `src/shared/ui/` before writing screen-local chrome.

- **`ScreenHeader`**: quiet `← Back`, optional trailing quiet actions, one focusable h1 with an optional glyph, and an optional lit bar with a mono reading. Every screen that is not a session.
- **`ProgressSpine`**: one straight line of rows; round nodes for steps, square for tests, plates for milestones, a group row for inline controls. The position row marks where you are and where the line opens; it is never the only thing to press. Any finite sequence.
- **`ModeTray`**: solid stimulus tiles, one or two words each, fixed above phone navigation (tiles drop to 64px on short or narrow screens) and sticky at the top from 980px. It reserves its own height. Locked is a plate with a line and a lock. Ways into practice, never more than one row.
- **`Plate`** (`.plate`, `.plate-raised`, `.plate-repair`): an opaque container, one fill step and a 1px solid line. Repair takes copper in the full hairline.
- **`SessionFrame`**, **`SessionCorrect`**, **`RoundResult`**: the full-screen run. Morse modes take their mode colour; Test takes the action colour; Practice passes its track colour as `colour` and `ink`. Every session has one layout: the frame header at the top, the stimulus centred in the free space, and the response (key, choices, grade buttons, correction, primary action) docked at the foot through the optional `response` slot or `.session-response`; results centre their reading and dock full-width actions, and the score is set in ink, since yellow belongs to the primary action. A disabled control is a solid fill and ink, never reduced opacity.

### Stat strip
One bordered container divided by hairlines, reading as a single instrument panel. Every figure is a reading, so every figure is mono.

### Library list
Two named shelves, each a mono label with its count on the same line: `Started` (started topics, most recent at the top) and `Not started`. The first was `Learning` until the unstarted shelf was split by track, since Learning is also a track and would then have headed both. `Not started` is set out **by track**, in the canonical order, each run under a mono subheading in its own colour with a hairline of the same colour running to the edge: the track colour is named where it is used. Within a track topics run by title, except that the steps of one programme (Compass Bearings and its follow-ons, the maritime topics) stay together under the first step, in learning order (`TOPIC_SEQUENCES`), so the shelf shows where a programme starts.

Each topic is its own **plate** (the kit's `plate` classes on the button), 8px apart, 12px radius, with no chevron because the plate is the control. A started topic's plate is raised (`plate-raised`); a not-started one sits flush (`--surface`, hairline, no shadow), so the shelves differ in depth. A decayed topic's plate is `plate-repair`, copper in its full hairline, never a side stripe. The heading and its count are a `ScreenHeader` title and mono readout. Held, a plate drops a pixel into the chassis with `--press`.

A shipped topic leads with a neutral recognition icon beside its title, whether started or not. User-authored topics retain the title-only layout. The shared Library and Home icon system is specified in `docs/open/LIBRARY_TOPIC_ICONS.md`. A started plate carries exactly one reading under the title, spanning the full plate width: its gauge, a short straight bar of the same shape as the `ScreenHeader` bar (8px, 1px line, recessed track) filled in the track colour with the label beside it in its own units (`27 days of the gap to go`, `Banked`), or, where there is no measure yet, the schedule's own sentence (`Ready to drill`). A decayed topic says `Needs repair` in copper behind a small ◆ diamond, so decay is never colour alone. A not-started row has no reading. No row carries an action button, item count or track name. Search is a single icon control that opens leftwards over the heading.

The list arrives once: rows rise 8px and fade in, 24ms apart and capped at twelve, with each gauge filling just after its row lands. Hover moves the plate one fill step. All of it is transform and opacity, and all of it is off under reduced motion.

### Current destination
The navigation marks the current destination with the action colour: Signal on the icon and label, plus a 2px bar on the edge the nav is attached to (along the top on the mobile bar, down the left on the desktop rail), so "current" never rests on hue alone.

### Named Rules
**The Nothing-Nests Rule.** A card never contains another card. Internal grouping uses a hairline or spacing. Learn case studies follow the same rule: hierarchy is document structure, not nested surfaces.

## 7. Do's and Don'ts

### Do
- **Do** open every view on the task, never on a summary or a pitch.
- **Do** let the status ladder pick the mode, and lead with exactly one primary action.
- **Do** use the sans for language and the mono for readings, consistently.
- **Do** separate plates by a fill step and a 1px line, and give recessed fields a darker fill.
- **Do** show the stimulus on a mode tile: a letter, a waveform, dits and dashes, or your own text at a cursor.
- **Do** keep copper for decay alone, always with its ◆ glyph and words, so it is never confused with the yellow action.
- **Do** state a mode's consequence in its own label.
- **Do** treat decay as routing information, never as an error or a scolding.
- **Do** keep reference-only Learn topics compact and add richer hierarchy only when the content earns it.
- **Do** keep Learn sources and limitations reachable through a named footer control and centred modal, readable at 200% text scaling.

### Don't
- **Don't** add marketing heroes, slogans or decorative eyebrows. Topic artwork is a finite content slot, not a pitch.
- **Don't** build a wall of identical metric cards.
- **Don't** style visible reference cards like the concealed-answer Test card.
- **Don't** turn structured Learn content into arbitrary HTML, a marketing article, or a stack of mini-cards.
- **Don't** nest cards, use side-stripe borders, gradient text, or glassmorphism.
- **Don't** add glow. A plate is lit by the room, not by itself. Outer glow on a fill is the fastest way to turn an instrument into a sci-fi prop, and it smears on OLED.
- **Don't** use translucent fills or borders for colour. Colour is a solid fill with contrast-checked ink; a wash of alpha reads as a bruise on a dark ground.
- **Don't** add subtitles to tiles. A tile is one word and the stimulus it shows.
- **Don't** let the material drag the *language* tactical. The chassis is slate; the words are plain. Argus says `Needs repair`, `Continue lesson 2` and `Start`, never `TST`, `MODULE DATA` or `INITIATE EXECUTION`. Status is written in English and reinforced by colour, not replaced by a callsign. The Survival and Tradecraft subject matter invites the opposite, and the framing is competence, not catastrophe.
- **Don't** add streaks, XP, indiscriminate badges, or shame-based nudges. The sole approved badge exception is a completed Argus role; pathways do not earn badges (#191/#192).
- **Don't** widen the mobile layout and call it desktop. Desktop gets a real side rail.
- **Don't** let an early Test counterfeit or postpone scheduled evidence.

## Role-award exception (owner-approved v1, #191/#192)

Only the earned **Communicator** award may deliberately use the Nautical (current) badge family: textured navy enamel, dimensional gold-toned rim and restrained teal sea relief. This is artwork inside the award, not an app-surface colour token. Continue to reserve Copper (`oklch(0.75 0.11 50)`) for decay on functional UI. No badge-gold UI controls (Signal is the only yellow in the interface), glow, animated badge upgrade, pathway medals or alternate scoring system. Before earning, a muted monochrome medallion may preview what is being pursued; its progression is expressed entirely with the three pathway lists and raw completed-topic counts. The earned artwork remains earned after later decay; any repair information is text outside the badge. No official CAF or protected professional insignia.
