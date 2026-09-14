# Documentation housekeeping

Documentation is grouped by lifecycle:

- `open/` contains current product, architecture, implementation, and decision documents. A document may describe shipped behavior and still belong here when it remains the maintained contract.
- `closed/` contains completed closeouts, historical research, and superseded proposals. These documents are retained for rationale and provenance, but should not be treated as current guidance unless an open document explicitly points to them.

When adding or updating a document:

1. Put active work or a maintained contract in `open/`.
2. Move a completed or superseded workstream to `closed/` once no active decision depends on it.
3. Update repository links when moving a document.
4. Keep the document's status or authority banner accurate.

`AGENTS.md` and `CLAUDE.md` at the repository root carry this rule for coding agents.
