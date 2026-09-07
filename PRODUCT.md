# Product

## Register

product

## Users

Ben, the owner and sole user for the beta: a self-directed learner building a personal library of finite, closed-scope competencies (recall systems, psychology frameworks, emergency medicine, navigation, observation and counter-surveillance tradecraft). He authors topics himself rather than consuming a catalogue, and tests recall in short mobile sessions — on a phone, in spare five-minute windows — not at a desk in a dedicated study block. The desktop surface exists for authoring and review, not as the primary recall context.

The job to be done, every session: see what's due, do the one thing the schedule is asking for, and leave. Nothing else competes with that on open.

## Modes

Two ways to engage a topic:

- **Learn** — ungraded reading/exposure. Every topic exposes its complete finite prompt/answer reference with nothing hidden. Topics may optionally place structured explanatory support above that reference: concise context for topics that need a little help, or a fuller briefing with sections, definitions, lists, tables, integrated case studies, sources and limitations. Reference-only topics remain as compact as before. Reading moves an `unstarted` topic to `learning`; nothing is scored.
- **Test** — flashcards, every scored item once, self-scored. Every Test creates history, while the scheduler decides whether that result is timely enough to advance the ladder. An early Test cannot satisfy or postpone required delayed evidence.

The split exists because retention and exposure are different things, and the interface should never let one be mistaken for the other. A surface shaped like a flashcard must conceal its answer; a surface meant for reading and scanning must not pretend to be a card.

For most topics Learn is a single reading, and moving to `learning` is the whole of acquisition. Some topics need more: Morse's Learn is a guided lesson running over many sittings and days, and its status is `learning` throughout. For those, finishing acquisition is a distinct event from first exposure, and until it happens every surface keeps recommending the lesson — an early Test stays available, but it is recorded rather than banked. `docs/PROGRESS_ARCHITECTURE.md` is the authority.

## What progress means

Argus tracks four different things about a topic and deliberately does not average them:

- **Acquisition** — can you retrieve this without the teaching support you are currently using?
- **Evidence** — have you demonstrated the directions and conditions the scored boundary requires?
- **Retention** — has that recall survived the required gap?
- **Current sitting** — where are you inside the finite task you are doing right now?

One shared derivation reads all four and answers the only question the learner actually asks — *what should I do next, and why* — so Today, Library, Topic and Progress cannot contradict each other about the same topic at the same instant. There is no single progress percentage, because a number averaging those four would not mean anything.

The Progress screen shows live work, work the schedule is holding, work that decayed, and the permanent completion record. It is a review surface, not a dashboard.

## Content boundary

A topic has two structurally separate content layers with different claims:

- **Scored boundary:** `scope` states the finite claim and `items` are the complete material Test is allowed to score. Scheduler/completion semantics depend only on these finite Test items.
- **Learn support:** optional structured explanatory material stored in `topic.learn`. It may make the scored boundary understandable, show relationships, add provenance, state limitations, or analyse an integrated case. It does not become Test material merely because it appears in Learn.

There are three intended Learn treatments:

1. **Reference-only** — no `topic.learn`; use when the finite mapping/reference is already self-explanatory.
2. **Concise support** — `topic.learn.kind = "concise"`; a small amount of context, provenance or a limitation note.
3. **Briefing required** — `topic.learn.kind = "briefing"`; structured explanation and, where useful, a whole-framework or whole-procedure case study.

The content model is typed data, not arbitrary HTML and not a bespoke CMS. Rich content can be prepared through code/import/AI-assisted authoring; the ordinary topic form continues to own the finite title/scope/items fields and must preserve any structured Learn support it does not edit.

## Content inbox

Argus also carries a small **content inbox**, kept strictly outside the learning library. Tapping `+ Want to learn` in Library records one line of intent — an idea, a link, or a link and a note — in Firestore, and nothing more. A request has no scope, no scored items, no status ladder, no scheduler state and no evidence, so it can never be mistaken for a topic or affect what has been proved.

The library, its history and its cue evidence remain local-first and are never synchronized. Firestore stores only these requests, and the inbox being signed out or unreachable leaves every learning surface untouched.

Turning a request into curriculum is editorial work that happens in the repository: research the subject, decide whether it carries one honest completion boundary, author deliberate ids, and open an ordinary reviewed pull request. A request is marked `added` only once the topics it became have actually shipped. Newly shipped catalog topics then reach an existing library as fresh unstarted topics, appended without touching anything already there. See `docs/CONTENT_INBOX.md`.

## Product Purpose

Argus is a personal skill library built entirely from topics that can be genuinely finished: a fixed alphabet, a named framework with a known number of parts, a defined protocol. Every topic states its own boundary (`scope`) at authoring time; topics without an edge are rejected, not managed later. Completion requires recall after a gap, not exposure, and remains a durable, permanent record — decay routes a topic back to drilling without erasing that it was once completed.

Success, twelve months in: 40–60 completed topics that the owner can still recall cold, weeks after last opening the app.

**Safety boundary:** Argus supports memory and rehearsal only. It does not certify physical, medical, emergency, or other hazardous competencies. Safety-sensitive Learn support must carry authoritative source attribution and visible limitations appropriate to its subject — the app is a memory tool, not a credential or substitute for training.

## Brand Personality

Capable. Deliberate. Unshowy. The interface should disappear into the task the way a well-kept field manual does — present when needed, silent otherwise. It earns trust through restraint and precision, not through reassurance copy or ceremony.

The tradecraft and survival tracks pull hard toward military, prepper, or tactical-game visual language; the product explicitly refuses that pull. The framing throughout is competence, not catastrophe — this is a memory tool, not a bunker simulator.

## Anti-references

- Marketing-landing framing on the Test surface: hero sections, oversized slogans, "eyebrow" labels above headings — the app is opened to *do* something, not to be sold to.
- The generic AI-generated dashboard: a hero, four equal metric cards, a grid of identical rounded topic cards. Flagged directly in design critique as "category-interchangeable" — recognizable ingredients, generic composition.
- Repetitive card scaffolding used as a default container for everything (stats, topics, modes, panels) — it flattens hierarchy instead of establishing it.
- Military, survivalist, or "prepper" visual language: tactical iconography, rugged/camo textures, alarm-red urgency, game-like HUD elements.
- Gamification: streaks, badges, XP, leaderboards, shame-based nudging for missed days. Retention decay is information, not punishment. The ten-answer Morse Learn sitting is a finite retrieval budget and is named as one — earlier copy called it `XP`, which implied a currency the product does not have.
- A single aggregate progress percentage. Acquisition, evidence, retention and completion answer different questions; one number combining them would be precise and untrue.
- Desktop-as-widened-mobile: cosmetic breakpoint scaling instead of a real task-oriented desktop layout (side rail, dense authoring views).
- Decorative gradients, ornamental rings, and non-functional visual flourish anywhere in the Test loop.

## Design Principles

1. **Finishability is the entry gate.** Every topic must state a hard boundary before it can exist in the library; the UI enforces this at authoring time rather than relying on discipline later.
2. **Task-first over showcase-first.** The interface opens to "what's due" and "start Test," not to a summary or a pitch. Marketing-page instincts (heroes, slogans, eyebrows) are actively rejected on functional screens.
3. **Retention over exposure, decay as routing not punishment.** Completion means recall survives a gap. Surfacing decay is diagnostic information, framed the same way as any other status, never as a failure state.
4. **Portable and owner-owned.** Full JSON export/import is a first-class feature, not a settings-page afterthought — including optional structured Learn support. The interface should never make data feel trapped.
5. **Restraint reads as competence.** One accent color, minimal chrome, and native typography carry the "capable and deliberate" tone. Restraint is not the same as flatness: the interface earns its calm through material, real typographic hierarchy, and one lit surface per view, not by removing contrast until everything sits at the same pitch.
6. **The form must not lie about the content.** A card shape promises a concealed answer; a list promises scannability. Matching the surface to the actual task is a correctness requirement, not a style choice. Learn support therefore uses editorial structure, never concealed-answer styling.

## Accessibility & Inclusion

Target WCAG 2.1 AA. Established and non-negotiable baseline (already implemented, must be preserved through future changes):

- Visible focus-visible treatment on every interactive element, not just links and buttons.
- Minimum 44px touch target on primary interactive controls.
- `aria-pressed` on toggleable filters/chips, `aria-current` on active navigation.
- Modal/sheet focus management: opening moves focus inside, closing returns focus to the invoking control; Escape and backdrop dismissal both available.
- `aria-live="polite"` regions for dynamic status (e.g. due-count updates) so screen reader users get session state without hunting for it.
- Full `prefers-reduced-motion` support — no animation is load-bearing for comprehension.
- Learn briefings use native heading/list/definition/table semantics, keep sources and limitations visible, and must remain readable at 200% text scaling without page-level horizontal overflow.
