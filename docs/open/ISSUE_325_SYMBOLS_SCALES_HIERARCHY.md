# #325 — Symbols, scales and hierarchy: authored-learning plan

**Status:** Greek authored lessons are **registered with owner approval on 2026-11-03**. SI and CAF are authored specifications, not production UI or changed Test banks. Revised 2026-11-03.

## Ownership and acceptance boundaries

- #325 owns the authored **content**, subject-specific answer validation, source trace and 390px design proposals. #296 owns the shared lesson schema, runner, registration, routing, cross-topic persistence and error-feedback UI; #113 owns storage integration.
- Existing catalog scope remains **Greek 24 glyph-pair → English name**, **SI 24 decimal power → prefix name and case-sensitive symbol**, **CAF 19 practical equivalency levels × two directions = 38 Test prompts**.
- Existing `*-item-XX` IDs, answers, successful prior Test history, completions, roles and optional Final Test behavior are immutable. A lesson response is formative and cannot write scored Test evidence. Old completed topics stay complete.
- Greek now uses its registered authored curriculum without re-keying existing items. Existing generated lesson ticks do not carry over; in-progress learners start the authored path at its first stage, as accepted for wave 1. Test history, evidence and completion remain untouched; no migration is added. SI and CAF remain spec-only and gated.
- All individual exercises are deterministic; no unreviewed procedural inference, random fabricated keys, handwriting claims, Greek listening/pronunciation claims, unit-conversion Test, military command qualification or insignia-recognition claim.
- Reference offers the entire original table without replacing Learn with a reference dump. Each lesson is completed once; retries correct *this* step, no repeated perfect-score rule. Final Test remains optional.

## Greek Alphabet — six small authored packets

**Authority:** Unicode 18.0 [Greek and Coptic nameslist](https://www.unicode.org/Public/18.0.0/charts/nameslist/0370/). The fixed English naming convention and existing two-form prompts are in `catalogSeed.ts` (`GREEK_LETTERS`). Code: `src/domain/learning/authored/greek-alphabet.ts`. The audit test compares **all 24 prompts and answers** to `seedLibrary()`.

| Packet (stable stage ID) | Four new letters | Review and formative contrast |
| --- | --- | --- |
| `familiar-shapes` | Alpha Α α · Beta Β β · Epsilon Ε ε · Iota Ι ι | Identify capitals *and* lowercase; Beta vs Epsilon |
| `distinctive-outline` | Delta Δ δ · Lambda Λ λ · Pi Π π · Omega Ω ω | Review Alpha/Beta; Delta vs Lambda; Pi vs Omega |
| `similar-capitals` | Gamma Γ γ · Eta Η η · Mu Μ μ · Nu Ν ν | Review Delta/Lambda; Eta vs Nu; Mu vs Nu |
| `deceptive-lookalikes` | Kappa Κ κ · Omicron Ο ο · Rho Ρ ρ · Tau Τ τ | Review Eta/Nu; Rho vs Kappa; Omicron vs Omega |
| `easily-confused` | Zeta Ζ ζ · Xi Ξ ξ · Sigma Σ σ ς · Upsilon Υ υ | Review Nu/Rho; Xi vs Zeta; Upsilon vs Nu |
| `finish-and-mix` | Theta Θ θ · Phi Φ φ · Chi Χ χ · Psi Ψ ψ | Review Xi/Sigma; Phi vs Theta; Psi vs Chi |

Each packet: four **show** cards (group introduction), four **choose** glyph-to-name questions using four large choices, two earlier-item reviews from packet 2 onward, one or two explicit **contrast** prompts, a meaningful summary and a mixed checkpoint. No authored stage exceeds 16 runner steps. Final sigma `ς` (U+03C2) is a form of Sigma, **not a 25th letter**. Lowercase Greek Mu `μ` is U+03BC and differs from the SI prefix symbol `µ` (U+00B5); never normalize either to Latin `u`.

**Sample source-bound keys and corrections:**

| ID / interaction | Correct | Explanation after a second miss |
| --- | --- | --- |
| `greek-alphabet-item-07` · `Η η` | Eta | Eta is Η η; Nu is Ν ν. Their small forms η and ν are distinguishable. |
| `greek-alphabet-item-13` · `Ν ν` | Nu | Nu is Ν ν, not Upsilon Υ υ or Eta Η η. |
| `greek-alphabet-item-18` · `Σ σ ς` | Sigma | Both σ and word-final ς are forms of the letter Sigma. |
| Contrast `Φ φ` / `Θ θ` | Phi is `Φ φ` | Phi has a vertical bar; Theta has a horizontal bar. |

The existing Test remains `letter pair → name`. Writing glyphs, individual upper/lower Test direction, Greek word reading and pronunciation are explicitly **not** added. Lowercase isolation in lesson text is formative discrimination, not new scored evidence.

## SI Prefixes — log-power curriculum specification (next independent slice)

**Authority:** BIPM [official SI prefix table](https://www.bipm.org/en/measurement-units/si-prefixes), [SI Brochure](https://www.bipm.org/en/publications/si-brochure) Table 7 and [2022 CGPM resolution](https://www.bipm.org/en/cgpm-2022/resolution-3). The present catalog has precisely 24 power→name(symbol) items; use the literal symbol strings already in `SI_PREFIXES`, not reconstructed or normalized text.

| Proposed packet | Four introductions / recall | Distinctions and cumulative checkpoint |
| --- | --- | --- |
| S1 Everyday anchors | kilo k 10³ · mega M 10⁶ · milli m 10⁻³ · micro µ 10⁻⁶ | M vs m; distinguish the U+00B5 micro sign from lower-case m |
| S2 Increasing magnitudes | giga G 10⁹ · tera T 10¹² · peta P 10¹⁵ · exa E 10¹⁸ | +3 log₁₀ units per adjacent entry; compare P/p only after pico introduced |
| S3 Largest multiples | zetta Z 10²¹ · yotta Y 10²⁴ · ronna R 10²⁷ · quetta Q 10³⁰ | Show 2022 additions as the far end, not a new unit |
| S4 Small submultiples | nano n 10⁻⁹ · pico p 10⁻¹² · femto f 10⁻¹⁵ · atto a 10⁻¹⁸ | P vs p; decreasing exponents move left on log axis |
| S5 Smallest submultiples | zepto z 10⁻²¹ · yocto y 10⁻²⁴ · ronto r 10⁻²⁷ · quecto q 10⁻³⁰ | Q/q and R/r; 2022 additions |
| S6 Near the base | deca da 10¹ · hecto h 10² · deci d 10⁻¹ · centi c 10⁻² | The four non-10³-step exceptions; deca has two letters |
| S7 Mixed magnitude | None; mixed questions sampled deterministically from all 24 | Spot the exponent, name and exact case; no new scored boundary |

**Proposed 390px scale primitive:** a fixed log₁₀ number line / vertically ordered discrete ladder from +30 through −30, with a visibly distinct 10⁰ baseline and a `+3` or `−3` grouping for most steps. Use a compact local zoom/focus window on 320–390px screens rather than compressing 61 exponent values into illegible text. Render superscript numbers visually; accessible name must announce `ten to the power of positive six` or `ten to the power of negative three`. The diagram is formative support and is hidden from or irrelevant to the unchanged Final Test.

**Keys and error explanations:** `si-prefixes-item-09`: `10⁶ → mega (M)`; if `m` chosen: `M is mega, ten to positive six; m is milli, ten to negative three.` `si-prefixes-item-15`: `10⁻³ → milli (m)`. `si-prefixes-item-01`: `10³⁰ → quetta (Q)`; `si-prefixes-item-24`: `10⁻³⁰ → quecto (q)`. Distinguish `µ` (micro sign) from `μ` (Greek small mu) at the code-point layer even where fonts render identically. A conversion exercise, if later proposed, needs independently checked numeric keys and a *separate* assessed-skill decision; not part of this slice.

**Next files after approval:** `src/domain/learning/authored/si-prefixes.ts` and matching independent audit test, using existing item IDs and BIPM data. An interactive log-scale renderer requires #296-owned primitives and separate UI sign-off. Do not change `catalogSeed.ts`.

## CAF Rank Equivalencies — text-only hierarchy curriculum specification (later independent slice)

**Authority:** [QR&O 3.01/3.08](https://www.canada.ca/en/department-national-defence/corporate/policies-standards/queens-regulations-orders/vol-1-administration/ch-3-rank-seniority-command-precedence.html), [CAFMPI 01/26](https://www.canada.ca/en/department-national-defence/corporate/policies-standards/canadian-forces-military-personnel-instructions/promotion-and-other-rank-changes.html), [CAF military ranks](https://www.canada.ca/en/services/defence/caf/military-identity-system/rank-appointment-insignia.html). The code's sole source for the practical pair ladder remains `CAF_RANK_LEVELS` from `src/domain/military/cafRankTopic.ts`. **Do not duplicate 38 strings or build alternate spelling logic in the curriculum.**

| Proposed packet | Canonical practical levels | Finite teaching and objective interactions |
| --- | --- | --- |
| C1 Junior member ladder | 19, 18, 17, 16 | Basic vs Trained classification; Corporal ↔ S1; **appointment** MCpl ↔ MS; both directions |
| C2 Senior NCMs | 15, 14, 13, 12 | Sgt ↔ PO2; WO ↔ PO1; MWO ↔ CPO2; CWO ↔ CPO1 |
| C3 Cadets and junior officers | 11, 10, 9, 8 | OCdt ↔ NCdt; 2Lt ↔ A/SLt; Lt ↔ SLt; Capt ↔ Lt(N) |
| C4 Senior officers | 7, 6, 5 | Maj ↔ LCdr; LCol ↔ Cdr; Col ↔ Capt(N), not Capt |
| C5 General and flag officers | 4, 3, 2, 1 | BGen ↔ Cmdre; MGen ↔ RAdm; LGen ↔ VAdm; Gen ↔ Adm |
| C6 Mixed hierarchy | No new levels | Text-only two-way matching and adjacent-level discrimination across all five bands |

Each initial level generates **two** source-backed formative prompts referring to the two already scored IDs in `cafRankEquivalenciesTopic()`; every level is taught in a band of 3–4 practical levels. A lesson step can show a short *parallel text ladder*, then one large tap target for each possible match (no drag required); later hide the ladder during retrieval. Preserve 19 practical positions but state only **17 statutory ranks**: level 16 MCpl/MS is an appointment held with substantive Cpl/S1 rank, and levels 18/19 are two classifications of the one Pte/Avr rank. Source titles and abbreviations must match the current 2026 metadata; public DND pages may retain legacy `Seaman` names while current personnel policy uses `Sailor 1st/2nd/3rd Class`.

**Keys and error explanations:** `caf-rank-equivalencies-item-16-land-air-to-rcn`: `Army / RCAF — Master Corporal → RCN — Master Sailor`; `...-16-rcn-to-land-air` is the reciprocal. On `Sailor 1st Class` answer: `Master Sailor is the appointment corresponding to Master Corporal; Sailor 1st Class corresponds to substantive Corporal.` `...-05-land-air-to-rcn`: `Colonel → Captain(N)`, **not** `Captain`. Include the band label and a brief correction, never a synthetic command/seniority determination.

### Insignia licence is closed

#178's [rights plan](ISSUE_178_CAF_RANK_INSIGNIA_VISUAL_RECOGNITION.md) and DND [Crown copyright exemptions](https://www.canada.ca/en/department-national-defence/corporate/intellectual-property/crown-copyright.html) exclude CAF rank insignia, badges, crests and flags from automatic reproduction permission. DND's [badge ownership guidance](https://www.canada.ca/en/services/defence/caf/military-identity-system/heritage-manual/chapter-6/section-10.html) also requires authorization. **No official image, tracing, derivative, substitute illustrated insignia, external runtime image or cached image is permitted in #325 without #178's explicit written licence and QA.** The mock and future lesson use plain text rank labels only.

## Existing shared-runner observations / #296 handoff

- Owner decision (2026-11-03): in every lesson, a first miss shows colour, a visual cue and a styled “Try again”, with no explanation. An explanation appears **after a second miss**, as today. Greek lessons are registered under this contract; no shared-runner edit is included.
- The runner's `checkpoint` currently performs **reveal/self-report**, not objective grading. Our Greek packet includes objective choose/contrast steps before the checkpoint; never label the checkpoint as independent Test evidence.
- No special Greek character images are necessary: render UTF-8 text with a Greek-capable system-font fallback and independent accessibility names. Test at 320px and 390px plus 200% text; on unsupported glyph fallback, avoid tofu and prevent ambiguous character collapse.
- `contrast` tiles currently show a topic item's scored `prompt`. This makes the Greek text-pair contrast supportable with existing #296 primitives without any new shared UI. SI's log scale and CAF's paired ladder are **proposed** primitives; implementation separately approved and owned by #296.
- Assess missed-items remediation with a jump back to the packet that introduced that ID; `lessonForItem` already locates its lesson without changes to Test history. Preserve historical generated-stage records as unknown harmless keys; no automatic completion reset or inference.

## 390px mockup review pack

All three images are **static 390×844px SVG design specifications**, not production components:

1. [Greek glyph contrast](assets/issue-325/greek-contrast-390.svg) — actual glyph, four choices, specific explanation after a second miss.
2. [SI log-scale checkpoint](assets/issue-325/si-log-scale-390.svg) — relative powers and M/m magnitude distinction.
3. [CAF text hierarchy match](assets/issue-325/caf-band-match-390.svg) — tap-based text equivalency and appointment note, **no insignia**.

Colour and spacing follow `src/styles/tokens.css` Signal-on-Slate intent: cool opaque slate surfaces, legible native type, single solid yellow action, no glow or decorative gradients. 44px minimum choices; 56px main action. These represent separate design states for review, not claims that the app already renders them.

## Acceptance and regression plan

- **Registered Greek:** all 24 stable IDs and exact Unicode prompts match seed, exactly one answer in every four-choice step, no duplicate keys, checkpoint at each stage, contrast descriptions sourced, 6 stages within `MAX_STEPS_PER_STAGE`; run targeted Vitest and TypeScript in CI.
- **SI future slice:** 24 exact power/name/case symbols including `da` and `µ`; test for `M/m`, `P/p`, `Q/q`, `R/r`, exponent sign and sorted log scale; source-checked numerical examples; do not silently score conversions.
- **CAF future slice:** 19 distinct level metadata and 38 direction-specific IDs match the shipped bank; every equivalent is reversible, rank-vs-appointment distinctions correct; assert **no insignia paths or images**.
- **Shared integration review:** 320/390px and short landscape, 200% text, keyboard and screen reader, 44px minimum targets, reduced motion, replay and Back/reload, per-account persisted completion with no test/evidence mutation, old completion and roles preserved, offline/Pixel smoke.
- **Owner gate:** Greek registration is approved and complete (2026-11-03), using the shared feedback contract above. SI and CAF remain spec-only: registration, new primitives, production UI and rights-gated artwork require separate owner approval and #296 coordination. CI checks do not substitute for that sign-off.
