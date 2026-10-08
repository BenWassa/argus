# #197 — UX/UI and evidence architecture research for expanded Argus Roles

**Status:** owner-review research concepts, 2026-10-07; **no UI or source implementation approved here**.
**Upstream:** [#197 parent dossier](ISSUE_197_EXPANDED_ROLE_ARCHITECTURE_RESEARCH.md), [evidence/curriculum findings](ISSUE_197_EVIDENCE_CURRICULUM_RESEARCH.md), [#191](ISSUE_191_ROLE_DESIGNATIONS.md), [#192](ISSUE_192_ROLE_BADGE_ART.md), [Home #193](ISSUE_193_HOME_REDESIGN.md).
**Visual authority:** `DESIGN.md` / `DESIGN.json`, `src/styles/tokens.css`, `src/styles/global.css`; **not** competitor screenshots or generated images.
**Caution:** design patterns below are inspectable proposals, not tested usability results. All four new role identities, tiers and scenarios remain research candidates. No changes to source, shipping, badge art or approved Communicator semantics.

## 1. Current-state audit — code, not mockup assumptions

Inspected fresh main (2026-10-07): `src/features/roles/RolesPage.tsx`, `RolesPage.css`, `src/domain/roles/roles.ts`, `roles.test.ts`, `definitions.ts`, Product/Design contracts.

Current Roles screen:
- Exactly one **Communicator** detail; **deliberately no empty gallery**. Heading, role promise, centered/side-by-side 220px medallion, derived “N of 7” count, three pathway sections with raw 3/2/2 counts, clickable topic rows and noncertification note.
- Pathway order is suggested, **not locked**; one role badge only. Full-colour SVG if earned; monochrome if unearned. `img` is decorative (`alt=""`) because adjacent text names award. Source is `public/media/roles/communicator.svg`.
- Mobile ≤560px stacks award/medallion and centers text. At ≤370px rows reflow status under title. CSS respects reduced motion for earned hover lift.
- `communicatorProgress` derives from catalog-origin banked topics (`completedAt || drilledAt`); refresh tracks decayed completed topics separately. A missing topic returns “Not available”; user-authored ID collisions do not create credit. A missing local record can also make an awarded role appear not earned — **historical durability through deletion/import is not yet solved**.
- Product already has **Home | Roles | Library**. Home places up to three active topics first with truthful circular instruments and compact Completed / In progress / Last active callouts. Roles should not add an unrelated Home achievement feed or duplicate Home's active-topic routing.
- Design = brushed gunmetal + polished steel; contrast, sans for language, mono for numeric/status; tarnish reserved for decay, not “elite.” Neutrals: `#101215`, `#16191d`, `#1d2126`, `#272c33`, `#e6eaf0`; primary polished steel `#e9edf3`; repair `#d68d5e`. **No saturated rarity palette, military HUD, decorative progress bars or course-management copy.**
- Content research must defer to authoritative `docs/LIBRARY_ROADMAP.md` and `docs/LIBRARY_RESEARCH_METHOD.md`; the 2026-09-30 superseded #104 scenario proposal is **not** active implementation authority.

### Current information problem once more roles exist

A one-role detail is optimal now; showing 10 full detailed pages sequentially would be hard to browse, while suddenly showing ten grey/locked trophy cards risks false earnability, discouragement and visual noise. The design problem is *discovery + transparent evidence + frictionless next useful action* with a credible separation between **available now**, **planned curriculum**, and **earned historically**.

## 2. Comparative product/design research — borrow behavior, not aesthetics

| Evidence/analogue | What is actually documented | Argus-compatible insight | What NOT to borrow |
|---|---|---|---|
| [Brilliant Learning Paths](https://brilliant.org/help/features/what-are-learning-paths/), updated Sept 14 2026 | Guided course sequence, interactive exercises and checkpoints; courses can be chosen flexibly (some lesson-level access varies by plan) | Organize role curriculum into visible meaningful pathways; show assessment checkpoints only when real | Mandatory linear unlocking, paid upsell, XP league |
| [Khan Academy Course/Unit Mastery](https://support.khanacademy.org/hc/en-us/articles/115002552631-What-are-Course-and-Unit-Mastery), updated Sept 19 2024 | Differentiates Familiar/Proficient/Mastered, course challenge, separate feedback and subsequent recommended learning | Independent capstone check can add *new* evidence rather than a topic-count milestone | Import their points, percentages or “Mastered” label when Argus only verifies specific finite topics |
| [Nielsen Norman Group — Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/), 2006 | Common important actions first, reveal secondary options clearly | Selected/focused role should dominate; advanced planned roles belong behind a clear expansion | Hiding essential status or making planned roles seem missing |
| [Dunlosky et al. — Learning techniques review](https://www.psychologicalscience.org/journals/pspi/1529100612453266/), 2013 | Retrieval practice and spaced repetition broadly useful; not all “engaging” methods support learning equally | Action = relevant Test/learning next step; no engagement vanity metrics | Role claim inferred from view time, taps, animations |
| [Wang et al. — Autonomy/competence in educational interventions](https://www.sciencedirect.com/science/article/pii/S0023969024000572), 2024 | Autonomy-supportive choices/competence feedback can improve motivation | Learner-selected focus and open pathways support a personal app | Pressuring daily obligations; confusing gamified motivation with actual Test evidence |
| [WCAG 2.2](https://www.w3.org/TR/wcag/), 2024 errata | Reflow, target size, accessible names, motion from interactions, contrast | Mobile-first readable role checklist and meaningful status text; never color-only | Invisible state semantics or tiny badge touch targets |
| [W3C Reduced-motion technique C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39), accessed 2026 | Detect/reduce motion for users who request less movement | Badge animation may be opt-in and nonessential; static equivalent mandatory | Infinite shine, sudden parallax or decorative motion on every scroll |
| [WAI-ARIA range guidance](https://www.w3.org/WAI/ARIA/apg/practices/range-related-properties/), accessed 2026 | Communicate known progress values and understandable text for range widgets | If later using a ring, announce “4 of 7 required topics complete”; raw counts must remain visible | Reusing a circular ring as an unsupported “mastery percent” |
| [W3C WCAG target size 2.5.8](https://www.w3.org/TR/WCAG22/#target-size-minimum), AA | 24×24 CSS px minimum with defined exceptions; 44px enhanced AAA is more usable where feasible | Continue current ≥56px topic rows; ensure reachable actions, even on 320px screens | Miniature tappable medallion with no visible label |

**Confidence distinction:** WCAG is a normative accessibility criterion. The external learning apps document feature patterns (not evidence those work in Argus). Academic work supports some learning and motivation principles, not exact page layouts. The variants below need actual owner selection and mobile usability tests.

## 3. High-value information architecture alternatives

### A — Earnable-only role index (strict baseline)
On Roles, list only fully authored and earnable ordinary roles. For one role, navigate **directly** to Communicator exactly as now. Once ≥2 are earnable, show a compact list with medallion, title, one-line promise, “N of M topics” and one action. Planned roles stay in the repo and do not appear publicly.

- **Benefits:** cannot counterfeit availability; low visual density.
- **Cost:** user cannot browse forthcoming aspirational lines or choose them as a motivational objective.
- **Verdict:** safest if curriculum delivery lags; maintain as immediate default.

### B — Focused role + “Other roles” compact rail (preferred **exploration** candidate)
Top: one focused role's medallion, title and status. Below: pathways and directly actionable next topic. At the end (or via a visible compact selector near the title), “Explore other roles” list with **Available**, **In development**, **Research only** sections; never show a planned badge as earnable. Clicking planned role shows only a sourced preview with a plain reason it is not yet available; no pseudo-progress calculation based on incomplete proposed requirements.

- **Benefits:** keeps present one-role clarity, accommodates growth, room for aspiration.
- **Cost:** risk of heavy scroll; ensure selector accessible near top.
- **Verdict:** best medium-term research variant *once* at least two approved content-complete roles exist.

### C — Role gallery + detail drill-down
A role index with 2–3 compact cards visible per screen; each card opens detail. Status, name, main symbol, 1-line promise and count where real. “Advanced/capstone” cards only after actual programme approval.

- **Benefits:** collectible feel, side-by-side selection.
- **Cost:** noisy and potentially game-like; hard to show real progress if 8/10 titles aren't deliverable.
- **Verdict:** later option, test if roles increase and people explicitly want collection browsing.

**Recommendation to owner:** keep A while only Communicator exists; investigate B as the second real role approaches; defer C unless usability warrants. **No new empty gallery on current main.**

## 4. Specific mobile layout proposals (composition only)

### Variant B1 — “One selected role, one next action” (recommended prototype)

```text
ROLES                           [Choose role ▾]

                [NAUTICAL MEDALLION]
                    NAVIGATOR
            3 of 5 required topics complete
    Recognize bearings and map references.
           [Continue: Grid North]

   PATHWAYS
   ─ Bearings & Direction             COMPLETE
     ✓ Compass Bearings  ✓ Whole Circle  ✓ Reciprocal
   ─ Reference Frames                  0 OF 2
     ○ True & Magnetic North           >
     ○ Grid North & Map Bearings       >

    Explore other roles                    >
    Knowledge designation, not field certification
```

Constraints: the headline description needs to **describe the actual scored claim**, not “can navigate.” Badge ≤160–180px on 320–390px screens unless device test shows it fits; avoid the existing stacked 200px medallion consuming most of the first viewport. Do not displace the required items with a carousel.

### Variant B2 — “Compact focus selector”
A compact horizontal text row below ROLES: **Communicator ▾**. One medallion/earned label beneath, then count and row actions. The selector opens a bottom sheet with all **available** role names as explicit text buttons and optional noninteractive “In research” list.

- Higher density; more screen space for the work.
- Worry: selector looks like account dropdown, not navigation. Test labeling **“Choose a role”** or **“Switch role”**.
- Reuse existing sheet tokens, focus trap and back-button patterns; do not invent a new gesture.

### Variant C1 — “Collection grid” (defer)
Two-column compact medallion gallery ONLY if many earnable roles. Text status and count always below glyph; planned cards not disabled *falsely clickable* placeholders. Mobile list may still outperform grid at 320px due to long names. Compare scan time and mistaken availability.

### One viewport question
At 390×844 and 320×568, a user should see **role identity, truthful count, and at least the first actionable row or explicit Continue CTA** without scrolling. This is a prototype test target, not a blanket fixed-height guarantee: large text (200%), safe areas, translated labels and viewport zoom must still reflow and allow scrolling. Never crop required content to satisfy a screenshot rule.

## 5. Semantics: design a state machine before a badge gallery

### Proposed public states (mutually clear)
- **Earned**: all required evidence complete; full colour; show *earned date* only if stored and true.
- **Working toward**: some true required items banked / other required items exist and are not banked.
- **Not started**: available authored curriculum, no evidence yet.
- **In research**: identity/concept exists but required knowledge and Test contract **unapproved**; **no completion count**.
- **Coming later**: definition approved but curriculum/assessments not yet shipped; **no faux progress**.
- **Needs refresh** (secondary): completed/banked historical award with some decayed topics. This is *additional state*, not a replacement for Earned.
- **Unavailable locally**: required topic missing/mismatched origin; explain that recovery/sync may be necessary, do not imply deliberate learner failure.

These states must not be represented by one color or a locked padlock alone. **Research-only is not learner failure**. Do not show “0 of 14” when “14” is an unapproved number. The UI must not infer a badge is “earned on X date” merely because it is earned at render time.

### One role can be a work target, not a mandatory path
Personal focus selection should be local (optional) and never change completion/Test evidence. Suggested action picks a real unfinished required topic using canonical topic action routing; completed topics needing repair may be surfaced as a separate “Refresh” action, not counted as unbanked. If no eligible topic is available, explain the reason and offer Library, not a blank CTA.

### Completion moment (if implemented later)
- Show role medal in approved full-colour form, role name, date based on real award record, small factual claim (“Completed 7 required Argus topics”), and a neutral exit **“Back to roles”**.
- Preserve scroll/focus semantics and reduced motion; avoid full-screen confetti, long animation, forced share, scores or XP.
- Exactly **one** badge per whole role; a pathway gets “Complete” text.
- Completion moment must be idempotent across reloading, offline sync and import. Never congratulate repeatedly because a derived boolean flips during hydration.

## 6. Deep UX opportunities worth prototyping

| UX experiment | Specific user decision/help | Suggested implementation shape | Hazard / validation gate |
|---|---|---|---|
| **Role picker in header** | Move to another real role in ≤2 taps | Plain native/select-like sheet; order Focused, Earned, Available, future information | No broken back focus; no options masquerading as earnable |
| **Truthful “next topic”** | “What should I study for this role?” | One top action computed from actual canonical topic state | Test eligibility/action must come from topic derivation; avoid a role-only scheduler |
| **Shared-topic context** | “Why does Marine VHF count for both roles?” | Quiet “Also part of Mariner” contextual link in details | **Do not** list speculative overlaps as required |
| **Pathway information disclosure** | Explain purpose without walls of text | Collapsible heading containing one-line goal and concrete required topics | Preserve all requirements discoverable and accessible |
| **Curriculum provenance** | Show reason for a requirement | “Why this topic?” short note when tapped; source optional in secondary content | Not a faux source badge or official endorsement |
| **Role type disclosure** | Explain advanced vs ordinary | Secondary “How roles work” info sheet, not permanent colorful tier chips | No invented credential labels |
| **Historical award receipt** | Trust permanence, date and requirement version | Plain completion receipt + “Requirements at earning” version detail | Award integrity/import/versioning unresolved |
| **Scenario review mode** | Assess applied integration without chaos | Stepper of discrete decisions with evidence packet + revise phase | Need separate scoring semantics; avoid auto-claim of real-world skills |
| **Explain a missed scenario** | Correct a misconception safely | Rationale and source, including what unknown fact changes decision | Do not teach hazardous actions or reveal private/operational data |
| **Compare roles** | Distinguish Navigator vs Mariner/Operator vs Field | Side-by-side *textual* promise/exclusions/source discipline sheet | Comparison based on **approved** definitions only |
| **Role readiness disclosure** | Set expectations for research-only titles | “Not yet an Argus learning programme” explanation | No bait-and-switch badges |
| **Compact medallion** | Fit action above fold on Pixel | 112–160px display, semantic text adjacent | Individual 220/96/48/32px art QA continues via #192 |
| **Plain-language status under ring** | Make progress scannable | Raw “N of M required topics”; optional subtle engraved arc only if meaningful | Don't call raw count “mastery”; accessible exact text |
| **Offline-first roles** | Work without internet | All role requirements and state from local durable records | Import/sync race and missing catalog need explicit handling |

### What should NOT be developed
- No global **Mastery %**, overall rank ladder, “Tier 1/2,” XP, streaks, leaderboard, “elite” color rarity, punitive lockouts or timed performance gate.
- No sham progress counts for proposed unshipped curricula.
- No mini badge for every pathway; no huge role-gallery tiles on the current one-role screen.
- No defensive scrolling hack hiding accessible content.
- No copy that says “trained Diver,” “certified Responder,” “psychologist,” “special forces,” “mission qualified.”
- No exact visual recreation of US/Canadian military insignia, protected emergency/diving agency marks or rank emblems.

## 7. Scenario experience research — preserve Argus Test truth

**Evidence gap:** `docs/LIBRARY_ROADMAP.md` identifies finite recall/visual/aural/calculation and **constrained application with an objective answer key** as strong app fits. The older #104 scenario research is not currently an authorized core implementation plan. The proposed advanced UI must not assume an AI-driven judgement grader is already approved.

### Assessment UI anatomy (exploratory)

1. **Scope briefing:** “This assesses reasoning in fictional Argus scenarios; it is not field, rescue, clinical or professional qualification.”
2. **Evidence packet:** 2–4 authored text/diagram excerpts (weather observation, conflicting message, labelled map excerpt, known/unknown facts) with source labels. Present full source text accessibly, no essential information only in color.
3. **Question:** choose an explanation, identify missing information, select a proportionate safe action or arrange a *high-level decision* sequence. Limit typing; prefer deterministic answer choices, but ensure plausible distractors and correct abstention/verify options.
4. **Update:** add one new fact and reassess a prior answer. The update measures revision, not reaction time.
5. **Feedback:** show correct bounded principle, why a tempting alternative is unsupported, exact factual source if relevant, and “This result does not demonstrate field competence.”
6. **Result:** report separately: factual interpretation, uncertainty, safety, communication, updating. Avoid one opaque “mastery score” or fake professional grade.

### Example (not production content)
> A small group is planning a publicly accessible shoreline photography outing. Their weather forecast is older than a new official warning. A participant reports a route blocked but cannot confirm whether it is the only access. Which claim is **directly supported** by the packet? What should be independently verified before deciding? What is a conservative, non-technical communication decision?

Scoring can recognize **lack of evidence** and **appropriate consultation of official information**, not detailed weather prediction or field-rescue tactics.

### Authoring and QA
- Frozen authored factual packet with item IDs, item version, source date, intended principle and acceptable alternatives.
- Deliberately ambiguous or multi-justifiable cases should be revised or use explicit multi-answer acceptance and rationale. **No AI score without a separately justified and validated design**.
- Test cases include missing data, fabricated facts, unsafe inference, mistaken sign of a bearing, incorrect unit scale, overconfident danger/profiling guess, false emergency “certainty,” and failure to update after contradictory evidence.
- Critical safety mistakes cannot be offset by accumulating unrelated right answers.
- Question sequencing stays voluntary/open unless the owner explicitly approves a scenario-assessment flow. No time pressure.
- Pilot with the owner on phone: record incorrect assumptions, time-to-understand, whether uncertainty answer feels fair, whether completion copy overclaims the result.

## 8. Award/evidence data contract research (no schema change approved)

Current role derivation:
```text
RoleDefinition -> required topic IDs -> banked completedAt/drilledAt
                   -> earned boolean + refresh separately
```

**Important defect class to plan for:** requirement list changes, catalog-topic replacement, deleted local topics, user-authored ID collision, import of older saved data, multiple offline devices syncing, changing scoring versions, and cross-role overlap.

**Research-only proposed contract:**
```text
roleDefinitions:
  roleId, roleVersion, displayName, claim, pathwayIds,
  requiredTopicRefs[{id, minEvidenceSchemaVersion?}],
  assessmentRequirementIds[], status, approvalDate?

roleProgress (derived):
  perTopicEvidence[], perAssessmentEvidence[], requiredCount,
  availableCount, bankedCount, needsRefresh, eligible, earnedNow

roleAwards (durable historical ledger):
  awardId (stable), roleId, roleVersion, awardedAt,
  evidenceRefs[ {type:topic|assessment, id, version, bankedAt} ],
  provenance, migrationVersion, sourceDevice?
```

**Hypothesis:** `earnedNow` is calculated from current records, but `everAwarded` can be read from a durable receipt. Once historical award has valid original evidence, freshness/repair can change separately. Avoid writing award receipts from invalid or transient states; require atomic/idempotent creation and restore validation. The ledger proposal changes existing #191 pure-derived semantics and **must be explicitly approved** before implementation.

### Required tests when this lane starts
- Awards from authentic catalog records only, not colliding user topics.
- No award for missing, unstarted, merely viewed, formative or partially scored topics.
- Decay does not revoke a real historical award; “needs refresh” is separate.
- Delete/reimport a banked topic: test expected policy and prevent badge flicker or accidental revocation.
- Modified definition after award: old award remains tied to v1, new requirements clearly labeled not quietly added retroactively.
- Same topic counted once inside a role, even in multiple pathways; across roles may legitimately support more than one.
- Two devices offline, both award before sync: idempotent receipt merging by stable IDs.
- Restore an old archive where manifest has changed: explicit missing evidence/needs review, no fabricated award.
- Scenario partial progress never counts as passed; safety critical fail cannot be outweighed.
- Screen-readers announce accurate role status; SVG decorative only when an adjacent accessible title/status exists.
- Rehydrate from offline store without playing the earned animation again unless a new genuine award event is created.

## 9. Accessible visual/interaction specification to test (not release acceptance yet)

- **320px, 360px, 390px, 428px** widths; portrait short height; up to **200% text**; Android Pixel Chrome/PWA; browser font scaling; landscape. Ensure content can scroll and is not covered by nav/safe areas.
- One h1 per view, understandable role text names, heading h2 per pathway; interactive topic row remains button with entire row touchable; states in visible text rather than ✓/○ alone.
- Badge has empty alt only if adjacent role title and earned/unearned status are in the same meaningful semantic grouping. If badge itself ever opens a details page, it needs a button accessible name independent of its appearance.
- 56px topic-row target (current), with clear visible focus and low-contrast secondary text checked against each permitted surface.
- **Colour semantics:** tarnish exclusively repair/decay; earned full-colour within #192 medallion allowance; grayscale preview not sole status differentiator.
- Motion: keep transition short and state-driven; opt out for prefers-reduced-motion; no autoplay animation, parallax, long metallic glints or flashing.
- Ring: **optional and secondary**, only actual finite requirement count; provide exact “N of M” outside graphic and accessible text; never “percentage mastered.”
- No informational dependency on animation completion. Don't require a swipe or drag gesture to change roles; provide simple buttons/selector.
- Status strings reviewed for translation/layout: “Earned,” “Not started,” “In progress,” “In research,” “Not yet available,” “Some topics need refreshing,” “Required topic unavailable.”
- Error paths: empty catalog, hydration delay, corrupt topic record, offline fresh installation, missing media file, reduced motion, narrow screen and no role evidence. A role should still navigate to available topics without waiting for decorative SVG.
- Animation-capable SVG layer conventions and fidelity comparisons at **220/96/48/32 px** belong in #192. SVG flexibility doesn't entitle a visual rewrite.

## 10. Research → design → implementation gating

| Gate | Minimum evidence | Owner decision |
|---|---|---|
| **G0 Candidate** | one-sentence promise, exclusions, role identity, overlap rationale; no pseudo credential | Approve role name/identity or defer |
| **G1 Scope** | pathway count and exact required topic IDs; every source, scored modality and difficulty honest | Approve detailed earning contract |
| **G2 Content** | candidate topics actually shipped, source/rights QA, finite scored Test boundary and device checks | Approve role earnability |
| **G3 UX** | mobile role chooser/progress, accessible states, focus action, authentic badge previews; on-device QA | Approve role-gallery treatment |
| **G4 Evidence** | definition versioning/import/deletion decision; if advanced, independent assessment rubric validated | Approve award architecture |
| **G5 Art** | approved original PNG/reference per identity → faithful layered SVG with small-size audit | Authorize #192 production |
| **G6 Release** | separate PRs, CI + real-device and documented release instructions; no implicit prod deploy | Approve live release separately |

Do not use generic “research complete” status to close all six gates. #197 can deliver a substantial research synthesis while **remaining open** for owner decisions.

## 11. Prioritized prototypes and measurable acceptance questions

| Priority | Prototype | Narrow question / observed success |
|---|---|---|
| **UX-1** | 2-role compact chooser while Communicator remains untouched | Can owner select Navigator, understand it is real/available, and reach an unfinished topic in ≤2 taps? |
| **UX-2** | Folded 112–160px medallion vs current mobile 200px | At 390×844 and 320×568, how much actionable curriculum is visible, and is badge meaning/quality retained? |
| **UX-3** | Focus CTA “Continue: [topic]” vs no CTA | Does it reduce time to the next useful Test/Learn without creating two contradictory action recommendations? |
| **UX-4** | Planned-role disclosure “In research” | Can users correctly distinguish an **approved but unbuilt** role from an earnable one? |
| **UX-5** | 1 small deterministic scenario with two updates | Do ambiguous answers have fair, source-backed rationales? Does user understand this is *scenario reasoning*, not professional qualification? |
| **UX-6** | Permanent award detail with version | Does owner understand “earned on” versus “needs refreshing” and what happens after changed requirements? |
| **UX-7** | 10-role gallery under 200% fonts | Does extra browsing value outweigh mobile density/ambiguity? If not, retain focused view. |
| **UX-8** | Original medallion relief at 96/48/32px; two motion treatments | Which readable details persist? Does reduced-motion remain fully functional? |

**No automated implementation under #197.** Each prototype needs an explicit mockup/design follow-up tied to #191/#192, not a direct source change on this branch.

## 12. Decision memo: what to ask owner in one review

**Recommend owner approve/defer in this order:**
1. **Navigator** or **Mariner** next, and whether the titles may indicate only knowledge of their bounded rules (recommended: Navigator first, narrow claim).
2. Keep ordinary roles as one-level badges; no role gallery until ≥2 real earnable roles (recommended).
3. Prefer **Human Factors / Cognition & Judgment** as psychology curriculum language, while title still open; reuse #104 research instead of new overlapping tracks.
4. Separate Operator (interpreting evidence/uncertainty) from Field (cross-domain application) and Systems/Mission Integrator (capstone coordination). Reject fake tactical ranks.
5. Defer advanced earnability until authored deterministic scenarios, safety rubrics and receipt/version semantics are approved.
6. Approve **B focused selector** as the next mockup *direction only*; no visual drift from `DESIGN.md`.
7. Determine if historical awards must remain immutable **across deletion/import**, not just decay (requires a new authority decision).
8. Defer production assets for unapproved new roles; #192 does individually approved PNG authority and fidelity-audited SVG reconstruction.

## 13. Risks and uncertainties register

| ID | Risk | Likelihood / impact | Research mitigation |
|---|---|---|---|
| R-U1 | Unapproved role cards imply available awards | High / high | Explicit labels and no 0-of-N for unknown N |
| R-U2 | Prestige badges imply real military or clinical qualifications | Medium / high | Original marks, precise claims, noun/title review |
| R-U3 | New research ignores already documented #104 curriculum | High / medium | Crosswalk roadmap and nine existing deep briefs |
| R-U4 | “Expert” or “Mastered” awarded for recall/recognition only | High / high | Modality-specific finite scoring, capstone separate |
| R-U5 | Ever-earned badge disappears after deletion/import | Medium / high | Explicit award-ledger design gate, recovery tests |
| R-U6 | Multiple roles double-count same topic within same role | Medium / medium | Unique IDs within requirements and clear cross-role policy |
| R-U7 | Too many previews push actionable topics below fold | High / medium | Focused role, collapse supplementary exploration |
| R-U8 | SVG editability degrades fidelity | Medium / medium | #192 PNG reference at 220/96/48/32; art review |
| R-U9 | Unsafe scenario distractors normalize hazardous action | Medium / high | Scenario-specific safety editor/reviewer, critical failures |
| R-U10 | UI creates a fictional “overall progress” metric | High / medium | Raw counts only, no aggregated learning percentage |
| R-U11 | PWA offline state temporarily shows “not earned” | Medium / high | Hydration/restore tests; distinguish loading vs missing |
| R-U12 | Sourcing equals reuse rights | Medium / high | Separate licensing audit for imagery/agency insignia |

### Handoff artifacts and responsibility
- **#197:** maintain research, full 24-topic canonical matrix, ten candidate roles, source quality/claims and owner decisions.
- **Current Library Roadmap:** retains independent priority authority. Research table priority **is not** permission to change P0/P1 classifications.
- **#191:** owns accepted role contract, versioning/earned semantics and UI implementation decisions.
- **#192:** owns approved badge directions, PNG reference, layer reconstruction, SVG fidelity and accessible/motion QA.
- **Future scoped issue:** authored scenario item primitive and scored assessment evidence only if owner elects advanced roles.
