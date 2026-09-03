# Structured Learn content model

Issue: #9  
Library format: v4

## Purpose

Argus topics have two different content layers with different claims.

1. **Finite scored boundary** — `scope` states what the topic claims to cover and `items` contains the complete set Test can score.
2. **Optional explanatory support** — `learn` helps the user understand that finite boundary in Learn without expanding Test or completion implicitly.

Test, scheduling, history and completion continue to operate on `items`. Nothing inside `learn` is scored unless equivalent material is deliberately added to the finite Test deck.

## Three Learn treatments

### Reference-only

Omit `learn` entirely. Learn keeps the existing compact scope + prompt/answer reference. Use this for mappings and other self-explanatory finite sets.

### Concise support

Set `learn.kind` to `"concise"`. Use a short overview, provenance note, limitation, or small structured section when a topic needs context but not a full briefing.

### Briefing required

Set `learn.kind` to `"briefing"`. Use short structured sections and, where application matters, one or more integrated case studies that analyse the framework/procedure as a whole.

`kind` is an editorial/rendering signal, not a scoring signal.

## Type shape

```ts
interface Topic {
  // existing finite boundary
  scope: string
  items: { prompt: string; answer: string }[]

  // optional Learn-only support
  learn?: LearnContent
}

interface LearnContent {
  kind: 'concise' | 'briefing'
  overview?: string
  sections?: LearnSection[]
  caseStudies?: LearnCaseStudy[]
  limitations?: string[]
  sources?: LearnSource[]
}

interface LearnSection {
  heading: string
  blocks: LearnBlock[]
}

type LearnBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'steps'; items: string[] }
  | { type: 'definitions'; items: { term: string; definition: string }[] }
  | { type: 'table'; columns: string[]; rows: string[][] }

interface LearnCaseStudy {
  title: string
  scenario: string
  analysis: LearnSection[]
  takeaway?: string
}

interface LearnSource {
  label: string
  url?: string
  note?: string
}
```

This is intentionally a small discriminated data model. It does not accept arbitrary HTML, rich-text blobs, component names, CSS, or a bespoke CMS document format.

## Representative shape

This example demonstrates structure only. It is not shipped topic content and is not an editorial rewrite of OODA or any other seed topic.

```json
{
  "scope": "A finite scored boundary remains here.",
  "items": [
    { "prompt": "Finite prompt", "answer": "Finite answer" }
  ],
  "learn": {
    "kind": "briefing",
    "overview": "A concise explanation of how the finite parts fit together.",
    "sections": [
      {
        "heading": "Relationships",
        "blocks": [
          { "type": "paragraph", "text": "Short explanatory prose." },
          {
            "type": "definitions",
            "items": [
              { "term": "Term", "definition": "Precise bounded definition." }
            ]
          },
          {
            "type": "table",
            "columns": ["Part", "Role"],
            "rows": [["A", "First role"], ["B", "Second role"]]
          }
        ]
      }
    ],
    "caseStudies": [
      {
        "title": "Integrated case",
        "scenario": "One scenario exercises the model as a whole.",
        "analysis": [
          {
            "heading": "Trace",
            "blocks": [
              { "type": "paragraph", "text": "Analyse relationships across the full case." }
            ]
          }
        ],
        "takeaway": "State the whole-model lesson rather than one toy example per term."
      }
    ],
    "limitations": ["State the relevant boundary or safety limitation."],
    "sources": [
      {
        "label": "Authoritative source",
        "url": "https://example.com/reference",
        "note": "What this source supports."
      }
    ]
  }
}
```

## Validation rules

Imports validate structured Learn data before replacing the current library.

- `learn.kind` is `concise` or `briefing`.
- Sections have a non-empty heading and at least one supported block.
- Paragraph/list/definition cells are non-empty text.
- Tables have at least two columns, at least one row, and exactly one cell per column in every row.
- Integrated case studies have a title, scenario and at least one structured analysis section.
- Source labels are required; optional URLs must use HTTP or HTTPS.
- Unknown block types are rejected rather than interpreted as HTML.
- A present `learn` object cannot be empty.

The parser normalizes whitespace but does not rewrite substantive content.

## Migration and portability

- Runtime storage key: `argus.library.v4`.
- Existing v3 and v2 local libraries remain readable and are promoted to v4 automatically.
- Existing v2 practice-named timestamps retain the earlier v2 → current scheduler migration behavior.
- Existing v2/v3 topics with no `learn` become v4 reference-only topics without synthetic prose.
- Reset removes v4 and legacy v3/v2 storage keys so stale data cannot reappear.
- JSON export writes v4 and includes `learn` wherever present.
- JSON import accepts old exports and v4 exports; validated rich content round-trips as structured data.
- The ordinary topic editor edits the finite title/scope/items fields and preserves `learn` unchanged. Rich authoring can therefore happen through typed code/import/AI-assisted workflows without requiring a CMS in #9.

## Rendering contract

Learn renders in this order for a rich topic:

1. track/title/scope and finite item count;
2. optional explanatory support;
3. a visibly separate **Recall reference** containing the complete scored `items` set;
4. the existing transition into Test.

Reference-only topics skip steps 2 and the extra separator label so their existing compact treatment remains intact.

Structured content uses native semantics: headings, paragraphs, lists, definition lists and tables. Case studies are continuous editorial sections, not nested cards. Tables may scroll within their own wrapper at extreme text scaling, but the page must not overflow horizontally.

Sources and limitations stay visible on the page. They are visually subordinate to the explanatory body, never hidden behind an interaction.

No Learn structure uses concealed-answer or flip-card styling.

## Editorial constraints for #11

#9 provides capability, not rewritten knowledge. #11 owns research and substantive seed-content changes.

When #11 uses the model:

- keep mapping/reference topics reference-only unless explanation materially helps;
- use concise support when a note, convention, provenance statement or limitation is enough;
- use briefing structure for frameworks/procedures that need relationships or context before recall;
- prefer dense lists/tables over repeated prose when they carry the information better;
- use integrated whole-framework/procedure cases rather than one artificial example per term;
- keep factual explanation, case analysis, limitations and provenance distinct;
- for medical, emergency, survival or other hazardous content, include authoritative provenance and an explicit limitation that Argus supports memory/rehearsal and is not a credential or substitute for training;
- re-check the finite `scope`/`items` boundary separately from explanatory support. Richer explanation does not excuse incomplete Test coverage.
