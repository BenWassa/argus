# Product

## Register

product

## Users

Ben, the owner and sole user for the beta: a self-directed learner building a personal library of finite, closed-scope competencies (recall systems, psychology frameworks, emergency medicine, navigation, observation and counter-surveillance tradecraft). He authors topics himself rather than consuming a catalogue, and tests recall in short mobile sessions — on a phone, in spare five-minute windows — not at a desk in a dedicated study block. The desktop surface exists for authoring and review, not as the primary recall context.

The job to be done, every session: see what's due, do the one thing the schedule is asking for, and leave. Nothing else competes with that on open.

## Modes

Reference access, active learning and scored recall are different interactions
with different consequences. The interface must not let one masquerade as
another.

**Browse/reference ≠ enrolled learning.** Opening an ordinary topic is analogous
to opening a course book: its finite reference and optional `topic.learn` support
are immediately available to inspect, and that navigation performs no progress,
scheduler or evidence write. Revisiting or scrolling the page is equally inert.

- **Browse/reference** — read-only access to the complete finite material. It does not change `status`, `learningAt`, history, evidence, scheduling or completion.
- **Learn** — the internal ungraded acquisition mode. For an ordinary topic the learner-facing boundary is the explicit **Start learning** action: it enrolls an `unstarted` topic by entering the existing `learning` state and starts the existing learning gap, but records no score or evidence. For a curriculum such as Morse, canonical lessons own the corresponding acquisition writes.
- **Test** — flashcards, every scored item once, self-scored. Every Test creates history, while the scheduler decides whether that result is timely enough to advance the ladder. A Test started from an `unstarted` topic is itself a deliberate check/enrollment action, but that first run still cannot simultaneously prove retention; existing Test/evidence semantics are unchanged.

`Learn` remains an implementation term rather than a generic button label. An
ordinary topic says `Start learning`; Morse says `Lesson N`; scored recall says
`Test`. The reference remains visible before and after enrollment, because access
to information is not evidence that the learner chose to study it.

For most ordinary topics enrollment is a single explicit state transition before
the existing Test/retention ladder. Some topics need more acquisition: Morse's
Learn is a guided lesson running over many sittings and days, and its status is
`learning` throughout. For those, finishing acquisition is a distinct event from
first lesson start, and until it happens every surface keeps recommending the
lesson — an early Test stays available, but it is recorded rather than banked.
`docs/open/PROGRESS_ARCHITECTURE.md` is the authority.

## What progress means

Argus tracks four different things about a topic and deliberately does not average them:

- **Acquisition** — can you retrieve this without the teaching support you are currently using?
- **Evidence** — have you demonstrated the directions and conditions the scored boundary requires?
- **Retention** — has that recall survived the required gap?
- **Current sitting** — where are you inside the finite task you are doing right now?

One shared derivation reads all four and answers the only question the learner actually asks — *what should I do next, and why* — so Today, Library and Topic cannot contradict each other about the same topic at the same instant. There is no single progress percentage, because a number averaging those four would not mean anything.

The learner is not asked to hold all four at once. Each surface states one sentence about a topic, in the schedule's own words, and the consequences of the other dimensions are stated where they bite: on a Test's end screen, on a row's status line. The dimensions stay four separate fields; they stopped being a printed table.

**Progress is not a destination.** Its live sections were a third projection of the same derivation Library already shelves, and its one unique artifact — the permanent completion record — now closes Library, composed rather than listed. Nothing it showed was lost. Navigation is two destinations, `Today` and `Library`; `Data` keeps its own route, reached by a single icon in Library's header, because export and import must stay first-class and easy to find — genuinely easy, not merely reachable at the foot of a long shelf list — without needing a quarter of the bottom bar for a handful of uses a year.

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

A request has no bearing on the learning record, and the inbox being signed out or unreachable leaves every learning surface untouched.

## Sync

The library is **local-first and synced**, in that order. The copy in the browser is the one Argus reads and writes, and once signed in every surface works exactly the same with no network, offline or on a flight, the way it did before there was an account. Signing in with Google lays a mirror over that copy so one owner's devices hold the same record, and signing out leaves the local copy untouched.

A build with Firebase configured asks who you are before anything else: `Today`, `Library` and every learning surface stay unmounted behind a sign-in screen until the owner is signed in, because the learning record is now an account's record rather than a browser's (#93 §1). A returning owner sees a brief "Checking your session…" rather than the button, never the library, while that resolves. A build with no Firebase configuration — the one the browser test suite runs, and what the repository has always supported — has nothing to gate and opens straight to Today, entirely local and entirely optional.

Sync is deliberately narrow. It carries the record as the exact JSON the v5 storage boundary already validates, rather than as a second Firestore-shaped schema that could drift from it, and an arriving record goes through that same boundary before it reaches the library — so sync cannot widen what a topic is allowed to be, and cannot affect what has been proved. One document per topic means two devices working on different topics do not overwrite each other.

Where a topic genuinely changed on two devices at once, **neither copy is overwritten**. Sync detects the conflict, leaves both devices exactly as they are, and names the topic on the Data screen for the owner to settle by export and import. A remote copy is likewise refused, not applied, if taking it would drop attempts or item evidence the local copy already holds — a learner's history only grows, so a shorter one is an older copy arriving late rather than a later edit.

This is deliberate, and it is the policy `docs/open/ISSUE_93_FIREBASE_PROGRESS_SYNC.md` requires: silent last-write-wins is not acceptable for a record whose whole value is that it was actually earned. Explicit detection is the documented first-release position; field-level merge is the later option it leaves open.

Access is owner-only. Security Rules identify the owner by their verified Google address — every spelling one account may present, such as the `gmail.com`/`googlemail.com` pair, so a provider detail can never lock the real owner out — and key every path by their UID, so being signed in to Google is not authorization. No second account has a read or write path into the project. See `docs/open/CONTENT_INBOX.md` and `firestore.rules.template`.

Turning a request into curriculum is editorial work that happens in the repository: research the subject, decide whether it carries one honest completion boundary, author deliberate ids, and open an ordinary reviewed pull request. A request is marked `added` only once the topics it became have actually shipped. Newly shipped catalog topics then reach an existing library as fresh unstarted topics, appended without touching anything already there. See `docs/open/CONTENT_INBOX.md`.

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
