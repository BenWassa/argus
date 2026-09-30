# Issue #146 — Visual content primitives

**Status:** implemented on the feature branch, in review; closes #146 when merged. This note is the maintained contract for the shipped primitives.  
**Issue:** #146  
**Priority:** shared dependency  
**Research inputs:** #138, #140, #141  
**Schema authority:** `src/domain/visual/`, `src/domain/learning/content.ts`, `src/domain/library/topic.ts`; the parser is `src/infrastructure/persistence/visualParser.ts`.

## Purpose

Add the smallest reusable Argus primitives needed for phone-first visual learning without creating a second curriculum system.

## Owned capability

1. A Learn visual/media block for local images or constrained deterministic visuals with accessible HTML support.
2. An objectively graded finite choice item that can carry a visual/diagram stimulus and an optional serializable figure specification.

## Dependents

- #147 Maritime I — navigation lights/day shapes
- #148 Maritime II — signal flags
- #149 Compass & Bearings
- #131 WMO cloud visual guide
- potentially #129 Beaufort visual guide where the same Learn media primitive fits cleanly

## Guardrails

- existing Topic/evidence/export/import/sync architecture remains authoritative;
- no arbitrary executable renderer data or generic drawing language;
- visual figures are deterministic and inspectable;
- essential text stays in HTML;
- accessibility and offline behavior are first-class;
- do not implement domain curricula here.

## Final serialized shapes (additive within library format v5)

No library version bump: every new field is optional and a record without them reads exactly as before. Existing learner progress, evidence, export/import and sync records are untouched.

### `Visual` — one picture and the text that makes it usable without it

```ts
interface Visual {
  source:
    | { kind: 'figure'; figure: FigureSpec }
    | { kind: 'image'; src: string; width: number; height: number }
  alt: string          // required; what assistive technology reads
  caption?: string     // visible HTML text
  credit?: string      // visible credit/licence line
  assetId?: string     // ties an image to its provenance record (#131)
}
```

- `src` must match `^/media/…` with an image extension (`avif|webp|png|jpe?g|svg`). Remote URLs, data URIs, traversal and paths outside `/media/` are rejected at import. Media ships in `public/media/` and is precached by the build-generated service worker, so there is no runtime network dependency.
- `width`/`height` are required whole pixels so the page reserves the box and nothing shifts.
- If a local image fails to load, the `alt` text is shown as visible text in its place.
- `alt` is required. On a scored item it is read as part of the question, so write it as the stimulus, never as the answer. A visual-only spatial item still needs an equivalent non-visual form in the topic where the completion claim is not explicitly visual.

### Learn use

- `{ type: 'visual'; visual: Visual }` — a new `LearnBlock`.
- `LearnEntry.visual?: Visual` — a picture inside an existing `entries` block, so a cloud genus or Beaufort force keeps its marker/title/meta/fields/note as HTML beside its image. No carousel or new set type: a sequence of entries is the guide.

### Scored use — `Item.choice` and `Item.stimulus`

```ts
interface Item { …; choice?: { options: string[] }; stimulus?: Visual }
```

- `answer` remains the answer key and must be **exactly one** of `options` (2–6 distinct non-empty strings). The recall reference, catalog identity, export and every text-only surface therefore keep working from `prompt`/`answer`.
- A choice item must be `forward`. `stimulus` is only valid alongside `choice` (a picture with no objective response to attach to is refused, not dropped).
- Grading is `selection === answer`; only display order is shuffled (`domain/visual/choice.ts`).
- The stimulus is shown in Test **without its caption** (teaching text may state the answer). It is shown with its caption in the Learn recall reference ("What to remember"), and in Practice on the prompt side only.
- Editing a choice topic through the plain `prompt | answer` editor keeps `choice`/`stimulus` while the answer still names an option; if the answer is edited away from the options, the item becomes an ordinary reveal item rather than an objective item whose key can never be chosen.

### Evidence

A choice answer feeds the same tally/scheduler as every card and records per-item `itemEvidence` (`prompt-to-answer`). It is recorded as **assisted** (options are on screen): it counts toward `attempts`/`correct` and practice-on-miss, but never toward `unassistedCorrect`. That can only withhold a claim that reads independent recall, never fabricate one. Practice itself still records nothing.

## Figure registry (finite, closed)

`src/domain/visual/figures.ts` is the only place a figure exists. A spec is `{ kind, …params }`; an unknown kind is rejected at import. Each kind owns its validation and pure geometry; the renderer (`features/visual/FigureView.tsx`) draws from that same geometry so a picture and any answer key derived from it cannot disagree.

Supported kinds:

| Kind | Params | Notes |
| --- | --- | --- |
| `angle-dial` | `pointers: { bearing: 0–359 (whole degrees); label?: ≤12 chars }[]` (1–4); optional `reference: 'T'\|'M'\|'G'`, `quadrantGuides`, `arc` | Ring, N/E/S/W marks, labelled pointers clockwise from north. Shipped with #146 as the reference kind; `reference`, `quadrantGuides` and `arc` were added by #149. |
| `north-reference` | `rays: { ref: 'T'\|'M'\|'G'; angle: −35…35 (whole degrees); label?: ≤12 chars }[]` (2–3) | Added by #149. Exactly one upright ray at 0; rays ≥8° apart; each north drawn once. True solid, magnetic dashed, grid dotted. |

Adding a kind is a code change with its own validation and tests. #147 (lights, day shapes) and #148 (flags) register theirs here. There is no expression, path, markup or component-name data anywhere in a spec.

## Not built (by design)

Carousel/media-set framework, visual *options* (images as answer choices), free numeric entry, scored photographic recognition, audio, animation, any domain curriculum. These are separate decisions for the issues that need them.

## Validation performed

Unit: figure parsing/geometry, choice grading/shuffle, visual/choice/Learn-block parser rejection matrix and round-trip, plain-text authoring identity, local storage round-trip. Component: visual view (alt, caption, image fallback), Learn block/entry rendering, choice card lifecycle, Test session with choice items (scoring, evidence, practice offer), Practice stimulus. Browser (`e2e/visualPrimitives.spec.ts`) at 320/390/landscape/desktop: Learn visual with caption, graded choice Test with no self-grade control, held correction on a miss, no sideways scroll.

## Handoff

Record further implementation decisions here. #147/#148/#149/#131 should read the shapes above before authoring content.
