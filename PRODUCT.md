# Product

## Register

product

## Users

Ben, the owner and sole user for the beta: a self-directed learner building a personal library of finite, closed-scope competencies (recall systems, psychology frameworks, emergency medicine, navigation, observation and counter-surveillance tradecraft). He authors topics himself rather than consuming a catalogue, and tests recall in short mobile sessions — on a phone, in spare five-minute windows — not at a desk in a dedicated study block. The desktop surface exists for authoring and review, not as the primary recall context.

The job to be done, every session: see what's due, do the one thing the schedule is asking for, and leave. Nothing else competes with that on open.

## Modes

Two ways to engage a topic:

- **Learn** — the set laid out in full as a reading sheet, prompts and answers both visible, scannable in any order. This is what an `unstarted` topic gets, because testing someone on material they have never seen is not a test. Reading moves the topic to `learning`; nothing is scored.
- **Test** — flashcards, every item once, self-scored. Every Test creates history, while the scheduler decides whether that result is timely enough to advance the ladder. An early Test cannot satisfy or postpone required delayed evidence.

The split exists because retention and exposure are different things, and the interface should never let one be mistaken for the other. A surface shaped like a flashcard must conceal its answer; a surface meant for scanning must not pretend to be a card.

## Product Purpose

Argus is a personal skill library built entirely from topics that can be genuinely finished: a fixed alphabet, a named framework with a known number of parts, a defined protocol. Every topic states its own boundary (`scope_definition`) at authoring time; topics without an edge are rejected, not managed later. Completion requires recall after a gap, not exposure, and remains a durable, permanent record — decay routes a topic back to drilling without erasing that it was once completed.

Success, twelve months in: 40–60 completed topics that the owner can still recall cold, weeks after last opening the app.

**Safety boundary:** Argus supports memory and rehearsal only. It does not certify physical, medical, emergency, or other hazardous competencies. Survival and tradecraft topics must retain source attribution and state their own limitations plainly — the app is a memory tool, not a credential.

## Brand Personality

Capable. Deliberate. Unshowy. The interface should disappear into the task the way a well-kept field manual does — present when needed, silent otherwise. It earns trust through restraint and precision, not through reassurance copy or ceremony.

The tradecraft and survival tracks pull hard toward military, prepper, or tactical-game visual language; the product explicitly refuses that pull. The framing throughout is competence, not catastrophe — this is a memory tool, not a bunker simulator.

## Anti-references

- Marketing-landing framing on the Test surface: hero sections, oversized slogans, "eyebrow" labels above headings — the app is opened to *do* something, not to be sold to.
- The generic AI-generated dashboard: a hero, four equal metric cards, a grid of identical rounded topic cards. Flagged directly in design critique as "category-interchangeable" — recognizable ingredients, generic composition.
- Repetitive card scaffolding used as a default container for everything (stats, topics, modes, panels) — it flattens hierarchy instead of establishing it.
- Military, survivalist, or "prepper" visual language: tactical iconography, rugged/camo textures, alarm-red urgency, game-like HUD elements.
- Gamification: streaks, badges, XP, leaderboards, shame-based nudging for missed days. Retention decay is information, not punishment.
- Desktop-as-widened-mobile: cosmetic breakpoint scaling instead of a real task-oriented desktop layout (side rail, dense authoring views).
- Decorative gradients, ornamental rings, and non-functional visual flourish anywhere in the Test loop.

## Design Principles

1. **Finishability is the entry gate.** Every topic must state a hard boundary before it can exist in the library; the UI enforces this at authoring time rather than relying on discipline later.
2. **Task-first over showcase-first.** The interface opens to "what's due" and "start Test," not to a summary or a pitch. Marketing-page instincts (heroes, slogans, eyebrows) are actively rejected on functional screens.
3. **Retention over exposure, decay as routing not punishment.** Completion means recall survives a gap. Surfacing decay is diagnostic information, framed the same way as any other status, never as a failure state.
4. **Portable and owner-owned.** Full JSON export/import is a first-class feature, not a settings-page afterthought — the interface should never make data feel trapped.
5. **Restraint reads as competence.** One accent color, minimal chrome, and native typography carry the "capable and deliberate" tone. Restraint is not the same as flatness: the interface earns its calm through material, real typographic hierarchy, and one lit surface per view, not by removing contrast until everything sits at the same pitch.
6. **The form must not lie about the content.** A card shape promises a concealed answer; a list promises scannability. Matching the surface to the actual task is a correctness requirement, not a style choice.

## Accessibility & Inclusion

Target WCAG 2.1 AA. Established and non-negotiable baseline (already implemented, must be preserved through future changes):

- Visible focus-visible treatment on every interactive element, not just links and buttons.
- Minimum 44px touch target on primary interactive controls.
- `aria-pressed` on toggleable filters/chips, `aria-current` on active navigation.
- Modal/sheet focus management: opening moves focus inside, closing returns focus to the invoking control; Escape and backdrop dismissal both available.
- `aria-live="polite"` regions for dynamic status (e.g. due-count updates) so screen reader users get session state without hunting for it.
- Full `prefers-reduced-motion` support — no animation is load-bearing for comprehension.
