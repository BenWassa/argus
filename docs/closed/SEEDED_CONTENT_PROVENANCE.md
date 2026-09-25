# Seeded content provenance and Test boundaries

Issue: #11; Morse baseline: #23; final A–Z curriculum: #28; acquisition/audio correction: #42; first-wave catalog expansion: #104  
Research baseline: `f2a3112110356f90f469c8c340f9f0ac69fbb2ee`  
Library format: v5

## Purpose

This document records the research decisions behind the topics shipped by `src/domain/library/catalogSeed.ts`. For every topic, `scope` plus `items` remain the finite scored Test boundary. `topic.learn` is explanatory/acquisition support only and does not expand the completion claim.

## Boundary matrix

| Topic | Final finite Test boundary | Items | Learn treatment |
| --- | --- | ---: | --- |
| NATO phonetic alphabet | 26 letters A–Z → official NATO code word | 26 | Concise support |
| International Morse — Letters (printed) | 26 printed A–Z mappings recalled in both directions | 26 bidirectional logical units | Rhythmic verbal-first progressive packets + secondary SVG + canonical audio |
| OODA loop | Four stages in order + one core function for each | 4 | Briefing + integrated case |
| Primary survey | Five ABCDE headings in order only | 5 | Briefing + integrated bounded case + explicit safety limits |
| Cardinal/intercardinal bearings | Eight named compass points → clockwise degree value from north, with north represented as 0° | 8 | Concise support |
| Recreational scuba equipment abbreviations | SCUBA, BCD, SPG, LPI, DSMB and DPV → expansion and core reference function | 6 | Concise support + explicit safety limits |
| Radiotelephony numbers | Digits 0–9 plus decimal, hundred and thousand → RIC-21 spoken form | 13 | Concise support + explicit limits |
| SI prefixes | 24 powers of ten from 10³⁰ to 10⁻³⁰ → prefix name and symbol | 24 | Concise support + explicit limits |
| Greek alphabet | 24 letters, capital and small forms → English name | 24 | Concise support + explicit limits |
| Hexadecimal digits in binary | 16 hex digits 0–F → four-bit binary pattern | 16 | Concise support + explicit limits |
| Beaufort wind scale | Forces 0–12 → descriptive term and knot range (force 12: 64 knots or more) | 13 | Concise support (effects table) + explicit limits |

Existing seeded historical attempt totals remain compatible with their decks. #42 adds no durable learner-state field and does not change any scored item.

## NATO phonetic alphabet

### Research decision

NATO’s official reference confirms the 26 standardized code words and the spellings used by the existing deck, including **Alfa** and **Juliett**. The mapping itself remains the material worth recalling, so #11 does not turn it into a briefing.

### Test boundary

**The 26 letters A–Z and their official NATO code words, tested letter → code word.**

All 26 mappings are present as scored items. Context about the purpose/history of the spelling alphabet is Learn-only.

### Learn treatment

Concise support only: one short purpose/spelling note plus provenance. No case study.

### Authoritative source

- NATO, **The NATO phonetic alphabet**: https://www.nato.int/en/about-us/nato-history/history-by-theme/symbols-of-nato/nato-phonetic-alphabet

## International Morse — Letters (printed)

### Research decision

Workstream #28 absorbed the temporary #23 forward-only control in place: the topic id and all 26 deterministic item ids remain stable, while each logical item requires both printed directions. No duplicate or overlapping Morse topic is shipped. ITU-R M.1677-1 Annex 1 supplies the authoritative International Morse A–Z mapping and canonical timing relationships.

#42 corrects the acquisition treatment without touching that content/state boundary. The first memory hook is now an original rhythmic verbal phrase whose short/held beat sequence exactly matches the canonical mapping. The generated SVG remains a secondary timing scaffold, and deterministic Morse audio is available from first exposure. All channels are temporary support and disappear before uncued evidence.

The 26 canonical mappings are:

| Letter | Pattern | Letter | Pattern | Letter | Pattern |
| --- | --- | --- | --- | --- | --- |
| A | `.-` | J | `.---` | S | `...` |
| B | `-...` | K | `-.-` | T | `-` |
| C | `-.-.` | L | `.-..` | U | `..-` |
| D | `-..` | M | `--` | V | `...-` |
| E | `.` | N | `-.` | W | `.--` |
| F | `..-.` | O | `---` | X | `-..-` |
| G | `--.` | P | `.--.` | Y | `-.--` |
| H | `....` | Q | `--.-` | Z | `--..` |
| I | `..` | R | `.-.` |  |  |

### Test boundary

**Can independently recall all A–Z printed Morse mappings in both directions.**

Every A–Z mapping appears once as one bidirectional logical scoring unit—not as 52 duplicated cards. Directional evidence gates a passing retention attempt, so forward-only evidence cannot award completion. Completion does **not** claim auditory reception, sending, WPM, words, phrases, or operating fluency.

### Learn/acquisition treatment after #42

The hierarchy is:

> verbal mnemonic + SVG + canonical pattern + audio  
> → reduced verbal/visual rhythm cue  
> → canonical/audio support  
> → uncued production and printed reverse recall

The verbal A–Z set is documented in `MORSE_VERBAL_MNEMONICS.md`.

- the supplied `A LONG` example is retained;
- the other 25 phrases are original Argus content, not copied from a third-party mnemonic list;
- each phrase has one labelled short/held beat per canonical element;
- tests convert every phrase back to dots/dashes and compare all 26 against the same canonical table used by the scored deck;
- tests also enforce the coda rule that keeps the length contrast unambiguous: a short beat must end in a stop and a held beat in a continuant, with `A` the single documented exemption;
- tests also compare verbal beat units to SVG units and synthesized-audio signal units.

The SVG remains the original generated `argus-morse-rhythm-v1-<GLYPH>` timing grammar from #26. #42 does not repoint those ids to different artwork and therefore requires no learner-state/content migration.

Supported Test may reveal only a strict opening verbal/SVG/canonical prefix. The next rung removes verbal and SVG support and may offer user-triggered canonical audio. Both uncued rungs mechanically receive a cue payload containing only the rung id: no phrase, SVG, audio support, length or answer prefix can leak into the evidence that supports completion.

### Audio provenance and boundary

Audio is synthesized from canonical data; Argus does not ship arbitrary prerecorded clips. ITU timing remains the sole timing authority.

#42 hardens the production mobile path around direct user activation and mobile browser lifecycle handling. The fix resumes and verifies any non-running `AudioContext`, avoids app-driven background `suspend()` races, cancels playback on background/pagehide, recreates closed contexts, shares the oscillator/highlight start delay and raises the deliberate default linear gain from 0.12 to 0.25. Device media volume/routing remain final output controls.

These implementation changes do **not** add auditory evidence to the topic. A printed prompt answered after optional audio support remains acquisition/cue evidence, not proof of sound-only reception.

### Acquisition provenance

- ITU-R M.1677-1 supplies canonical mappings and timing.
- The rhythmic-verbal method reference supplied in #42 is used as a design precedent: https://youtu.be/0CYpik24pRU?si=RX5Bow1eMGFpLdV5
- Only the user-supplied `A LONG` exemplar is retained directly from that request; the remaining Argus phrases are independently authored and mechanically checked.
- Google Creative Lab/Ace Centre/Morse Code Master remain research/product precedents; no per-letter asset or full mnemonic list is silently copied.

Automated checks prove structural agreement, not human-learning effectiveness. #42 cannot close until its exact production build receives the issue's genuine physical-device acceptance, and learner validation should follow before #29 expands the competency claim.

### Authoritative source

- ITU-R, **Recommendation M.1677-1 — International Morse code**: https://www.itu.int/rec/R-REC-M.1677-1-200910-I/en
  - Annex 1 §1.1.1 defines the A–Z letter signals.
  - Annex 1 §§2.1–2.4 define dash = three dots, one-dot intra-character spacing, three-dot inter-character spacing, and seven-dot inter-word spacing.

## OODA loop

### Research decision

The prior four-card deck tested stage names but not the stated “what each one does” boundary. Boyd’s published final OODA sketch also shows why a simple four-arrow circle is insufficient explanatory support: orientation has multiple inputs; decision is a hypothesis; action is a test; and feedback, feed-forward, and implicit guidance/control make the model non-linear and iterative.

The scored boundary therefore remains four items, preserving finishability and historical attempt totals, but each item now requires the stage name **and its core function**. Richer relationships stay in Learn rather than becoming an open-ended Test claim.

### Test boundary

1. **Observe** — notice unfolding circumstances, outside information, and interaction with the environment.
2. **Orient** — interpret observations through analysis/synthesis shaped by experience, culture, heritage, and new information.
3. **Decide** — select a course of action as a hypothesis to test.
4. **Act** — carry out the decision as a test; results feed subsequent observation/orientation.

Stage-number prompts make order explicit, so these four items completely cover the declared boundary.

### Learn treatment

Briefing required. It explains the four functions, relationships, feedback/iteration, implicit guidance, and the limits of the familiar four-arrow mnemonic. One integrated software-service incident traces repeated observation → orientation → hypothesis → test → new evidence across the situation as a whole rather than manufacturing one disconnected example per stage.

### Primary-quality sources

- John R. Boyd, **A Discourse on Winning and Losing**, Air University Press: https://www.airuniversity.af.edu/AUPress/Display/Article/1528758/a-discourse-on-winning-and-losing/
  - The published appendix reproduces Boyd’s final OODA-loop sketch and accompanying explanation of feedback/feed-forward, decision-as-hypothesis, action-as-test, non-linearity, and the shortcomings of the simple circular diagram.
- U.S. Marine Corps Officer Candidates School, **Academic Preparation Guide**: https://www.ocs.marines.mil/Portals/243/Docs/Candidates/Academic%20Prep%20Guide.pdf
  - Used as a current military-training cross-check for the four stage labels/functions and continuous-feedback framing.

## Primary survey

### Research decision

Current Resuscitation Council UK guidance uses a structured ABCDE approach and emphasizes early help, treating life-threatening problems before simply moving on, reassessment, and acting within training. Those principles make the sequence meaningful, but converting detailed clinical actions into scored Argus cards would create a misleading completion claim.

#11 therefore deliberately keeps the finite Test boundary at the five headings **and their order only**. Clinical purpose, priority, reassessment, and the high-level focus of each heading are explanatory Learn support.

### Test boundary

1. **A — Airway**
2. **B — Breathing**
3. **C — Circulation**
4. **D — Disability**
5. **E — Exposure**

The five stage-number/letter prompts cover the boundary completely.

### Learn treatment

Briefing required because an acronym expansion without context is too shallow. Learn covers:

- the sequence as a priority framework rather than a checklist to finish mechanically;
- the high-level assessment focus of A/B/C/D/E;
- treatment/escalation of immediate threats within training before progression;
- reassessment after intervention or change;
- one integrated clinical-deterioration case focused on order and reassessment, with treatment details deliberately omitted.

### Safety boundary

The topic states visibly that Argus is for memory/rehearsal only and is not first-aid or clinical training, a credential, or a substitute for supervised practice and current local protocols. Detailed techniques, thresholds, interventions, medications, population-specific modifications, CPR algorithms, and diagnosis remain outside the scored boundary.

### Authoritative sources

- Resuscitation Council UK, **First Aid Guidelines 2025**: https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/first-aid-guidelines
  - Current official guidance supporting structured ABCDE assessment, early help, and acting within training.
- Resuscitation Council UK, **The ABCDE Approach** (updated July 2024): https://www.resus.org.uk/library/abcde-approach
  - Official reference for the sequence, treatment of life-threatening problems before progression, reassessment, and the meaning of each heading.

## Cardinal and intercardinal bearings

### Research decision

NOAA navigation training material defines degree bearings clockwise from north and gives the eight cardinal/intercardinal values used here: N 0°, NE 45°, E 90°, SE 135°, S 180°, SW 225°, W 270°, NW 315°.

North can also be represented by 360° after a full turn, but testing both 0° and 360° would make the chosen eight-value mapping ambiguous. The topic therefore declares **0°** as its north convention and keeps 360° as Learn-only clarification.

### Test boundary

The eight named compass points mapped to: **0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°**.

All eight mappings are present as scored items.

### Learn treatment

Concise support only: clockwise-from-north convention, 45° spacing, the 0°/360° clarification, and provenance. No case study.

## Recreational scuba equipment abbreviations

### Research decision

The inbox request “Scuba gear review and acronyms” is too broad to be a completion claim: equipment choices, set-up, inspection, maintenance and diving practice depend on training, equipment, conditions and local operations. The shipped topic therefore takes only the stable, finite vocabulary boundary: six common abbreviations and their broad reference functions.

### Test boundary

1. **SCUBA** — self-contained underwater breathing apparatus; equipment that lets a diver breathe underwater from a carried gas supply.
2. **BCD** — buoyancy control device; the buoyancy bladder/system that helps a diver control buoyancy and commonly holds the cylinder.
3. **SPG** — submersible pressure gauge; an instrument that displays cylinder pressure and therefore remaining gas.
4. **LPI** — low-pressure inflator; the hose and fitting that supplies low-pressure gas from a regulator to inflate a BCD.
5. **DSMB** — delayed surface marker buoy; an inflatable surface-signalling buoy deployed from underwater.
6. **DPV** — diver propulsion vehicle; a powered device used to propel a diver through the water.

### Safety boundary

Completion means only that these six abbreviations and reference functions can be recalled. It does not establish equipment selection, assembly, inspection, maintenance, gas planning, buoyancy control, emergency response, ascent judgement or diving competence. The topic directs learners to qualified instruction, manufacturer material and local operator procedures for those matters.

### Sources

- PADI, **What does SCUBA stand for?**: https://blog.padi.com/what-does-scuba-stand-for/
- PADI, **SPG (Submersible Pressure Gauges)**: https://www.padi.com/gear/spgs
- British Sub-Aqua Club, **Annual Diving Incident Report 2024 — abbreviations**: https://www.bsac.com/document/bsac-diving-incidents-report-2024/1bsac-annual-incident-report-2024.pdf

### Authoritative source

- NOAA, **Navigation Training Manual**: https://repository.library.noaa.gov/view/noaa/42218/noaa_42218_DS1.pdf

## #104 first-wave expansion: direction of recall

The #104 research proposed bidirectional recall for several first-wave topics. Only the Morse acquisition ladder asks and records the reverse direction today: an ordinary reveal-and-self-score card always asks prompt → answer and records no per-direction evidence, so a bidirectional item there could never earn reverse evidence and its topic could never pass a retention attempt. Authoring both directions as separate forward cards was also rejected, because the two cards of one mapping disclose each other inside the same run.

Every #104 topic is therefore **forward-only**, and each scope names the one direction it tests. The direction chosen is the one the real-world use needs first. `catalogInvariants.test.ts` refuses a bidirectional topic that the ladder does not drive.

## Radiotelephony numbers

### Research decision

ISED's RIC-21 study guide for the Restricted Operator Certificate with Aeronautical Qualification prints the spoken forms of the ten digits and of the words decimal, hundred and thousand at the end of §5.3, and §5.4 sets how numbers are transmitted. The 13 forms are finite, stable and extend the NATO topic into numbers without new machinery. The topic is scoped to this named Canadian aeronautical source rather than presented as universal radio practice.

The tested direction is number → spoken form, because producing the form is what a speaker needs; hearing “NIN-er” and writing 9 needs no training.

### Test boundary

`0` ZE-RO · `1` WUN · `2` TOO · `3` TREE · `4` FOW-er · `5` FIFE · `6` SIX · `7` SEV-en · `8` AIT · `9` NIN-er · Decimal DAY-SEE-MAL · Hundred HUN-dred · Thousand TOU-SAND — spellings and hyphenation exactly as printed.

### Learn treatment

Concise support: what the fixed forms are and where they are printed, the §5.4 grouping rules (digit by digit, whole thousands, “decimal”) with RIC-21's own examples, and a note that altitude, heading, wind, time and aircraft-type conventions are outside the topic. None of the grouping rules is scored.

### Limits

Completion is recall of 13 forms. It is not a radio operator certificate, radio training or permission to transmit, and it makes no claim about marine, amateur, public-safety or other services.

### Authoritative source

- Innovation, Science and Economic Development Canada, **RIC-21 — Study Guide for the Restricted Operator Certificate With Aeronautical Qualification** (page dated 2011-07-12; checked 2026-09-25): https://ised-isde.canada.ca/site/spectrum-management-telecommunications/en/official-publications/information/radiocom-information-circulars-ric/ric-21-study-guide-restricted-operator-certificate-aeronautical-qualification
  - §5.3 number pronunciation table (0–9, decimal, hundred, thousand).
  - §5.4 transmission of numbers.

## SI prefixes

### Research decision

The BIPM SI Brochure's Table 7 is the complete, authoritative list: 24 prefixes from 10³⁰ to 10⁻³⁰, including ronna, ronto, quetta and quecto, added by the 27th CGPM in 2022. The mapping is finite, stable and useful well beyond science, and the familiar prefixes give false confidence about the rarer ones and about symbol case.

The tested direction is power → name and symbol, as the #104 research example proposed. Producing the symbol exercises the case rule (M/m, P/p, Z/z, Y/y, R/r, Q/q), which is where the confusion cost sits.

### Test boundary

10³⁰ quetta (Q) · 10²⁷ ronna (R) · 10²⁴ yotta (Y) · 10²¹ zetta (Z) · 10¹⁸ exa (E) · 10¹⁵ peta (P) · 10¹² tera (T) · 10⁹ giga (G) · 10⁶ mega (M) · 10³ kilo (k) · 10² hecto (h) · 10¹ deca (da) · 10⁻¹ deci (d) · 10⁻² centi (c) · 10⁻³ milli (m) · 10⁻⁶ micro (µ) · 10⁻⁹ nano (n) · 10⁻¹² pico (p) · 10⁻¹⁵ femto (f) · 10⁻¹⁸ atto (a) · 10⁻²¹ zepto (z) · 10⁻²⁴ yocto (y) · 10⁻²⁷ ronto (r) · 10⁻³⁰ quecto (q).

### Learn treatment

Concise support: the 10³ stepping outside hecto–centi, the BIPM case rule, deca's two-letter symbol, micro's µ and how symbols attach to units. The limitations separate the IEC binary prefixes (kibi, mebi…), which the Brochure itself distinguishes from SI prefixes.

### Authoritative source

- BIPM, **The International System of Units (SI Brochure)**, 9th edition (2019), version 4.01, June 2026: https://www.bipm.org/en/publications/si-brochure
  - Chapter 3, Table 7 (SI prefixes) and the case rule directly above it.
  - Chapter 3 note that SI prefixes refer strictly to powers of 10, with the IEC binary prefix names.
  - Appendix 1, 27th CGPM (2022): addition of ronna, ronto, quetta and quecto.

## Greek alphabet

### Research decision

The 24 letters recur throughout mathematics, statistics, science and engineering, where passive recognition decays and look-alike letters (ν/υ, ζ/ξ, η/n, ρ/p) cause real misreadings. The Unicode Greek and Coptic chart encodes the 24 capital and small letters in alphabetical order with their names, so a single durable source fixes the glyphs, the order and the names. Unicode's character names spell lambda as LAMDA; the chart gives lambda as the usual name, and Argus uses it.

The tested direction is letter → name, because reading notation is the everyday need. Each prompt shows the capital and small forms together (sigma also shows final ς), because many capitals are identical in shape to Latin letters and only the small form identifies them. Name → letter is recorded as a limit, not tested (see the forward-only note above).

### Test boundary

Α α Alpha · Β β Beta · Γ γ Gamma · Δ δ Delta · Ε ε Epsilon · Ζ ζ Zeta · Η η Eta · Θ θ Theta · Ι ι Iota · Κ κ Kappa · Λ λ Lambda · Μ μ Mu · Ν ν Nu · Ξ ξ Xi · Ο ο Omicron · Π π Pi · Ρ ρ Rho · Σ σ ς Sigma · Τ τ Tau · Υ υ Upsilon · Φ φ Phi · Χ χ Chi · Ψ ψ Psi · Ω ω Omega. Every glyph is the Greek code point, never a Latin look-alike; the seed test checks the code-point ranges.

### Learn treatment

Concise support: why recognition is the tested direction, the look-alike pairs, and final sigma. Limits say this is not reading, writing or pronouncing Greek. A guided acquisition path was not built: the #104 research asks for ordinary reference + Test to be tried first.

### Authoritative source

- Unicode Consortium, **Greek and Coptic code chart, Unicode 18.0**: https://www.unicode.org/charts/PDF/U0370.pdf
  - U+0391–U+03A9 capitals and U+03B1–U+03C9 small letters (U+03A2 reserved), in alphabetical order.
  - U+03C2 GREEK SMALL LETTER FINAL SIGMA.
  - U+03BB GREEK SMALL LETTER LAMDA, alias “lambda”.

## Hexadecimal digits in binary

### Research decision

One hexadecimal digit represents exactly four bits, giving 16 fixed mappings from 0–F to 0000–1111. The boundary is finite and genuinely completable, unlike a general “learn binary” course, and it pays off whenever bytes, masks, colour values or registers are read in hex. The mapping is mathematical; RFC 4648 §8 is the standards reference that fixes the hex alphabet (values 0–15 → 0–9, A–F) and its four-bits-per-character meaning.

The tested direction is hex → binary, the direction used when reading a hex value as bits.

### Test boundary

0 0000 · 1 0001 · 2 0010 · 3 0011 · 4 0100 · 5 0101 · 6 0110 · 7 0111 · 8 1000 · 9 1001 · A 1010 · B 1011 · C 1100 · D 1101 · E 1110 · F 1111. The seed derives each answer from the digit's value, so no pattern can be mistyped.

### Learn treatment

Concise support: the 8-4-2-1 place values with one worked example, A–F as 10–15, case-insensitivity, and single-bit anchors. Binary → hex, longer numbers and arithmetic are limits, not scored content.

### Authoritative source

- IETF, **RFC 4648 — The Base16, Base32, and Base64 Data Encodings**, §8 Base 16 Encoding: https://www.rfc-editor.org/rfc/rfc4648#section-8

## Beaufort wind scale

### Research decision

The Beaufort scale is the first environment-observation system in the catalog and pairs with bearings: 13 forces, each with a descriptive term, a speed band and visible effects. The #104 research proposed the U.S. National Weather Service table, but the editorial identity asks for Canadian sources where practice varies, and the NWS table differs from the WMO wording at force 9 (“Severe gale”) and gives 0–1 knot for force 0. The topic therefore uses Environment and Climate Change Canada's table, which matches the WMO/Met Office terms.

One deliberate departure: ECCC prints **64–71 knots** for force 12. WMO-No. 558 defines hurricane force as “Beaufort force 12 or over” with no upper bound, and the Met Office gives 64 knots or more, so a capped band would teach a false ceiling. Argus tests force 12 as **64 knots or more** and says why in Learn.

The tested direction is force → term and knot range. Prose effects stay in Learn, as the research recommended, because memorizing them would widen the claim without making it more checkable.

### Test boundary

0 Calm, less than 1 knot · 1 Light air, 1–3 · 2 Light breeze, 4–6 · 3 Gentle breeze, 7–10 · 4 Moderate breeze, 11–16 · 5 Fresh breeze, 17–21 · 6 Strong breeze, 22–27 · 7 Near gale, 28–33 · 8 Gale, 34–40 · 9 Strong gale, 41–47 · 10 Storm, 48–55 · 11 Violent storm, 56–63 · 12 Hurricane, 64 knots or more.

### Learn treatment

Concise support with two tables — ECCC's effects observed at sea, then on land, for each force, quoted — plus a short note on the force-12 ceiling. No case study.

### Safety boundary

A memory aid for estimating and describing wind, not a forecast and no substitute for current marine forecasts, warnings or seamanship judgement.

### Sources

- Environment and Climate Change Canada, **Beaufort wind scale table** (page dated 2017-09-10; checked 2026-09-25): https://www.canada.ca/en/environment-climate-change/services/general-marine-weather-information/understanding-forecasts/beaufort-wind-scale-table.html
- World Meteorological Organization, **Manual on Marine Meteorological Services (WMO-No. 558), Volume I**, 2012 edition updated 2018, Part I §2.2.44(c): https://library.wmo.int/records/item/41585-manual-on-marine-meteorological-services-volume-i-global-aspects
- Met Office, **Beaufort wind force scale** (cross-check of terms and ranges): https://weather.metoffice.gov.uk/guides/coast-and-sea/beaufort-scale

## Scope-integrity check

- Every topic has an explicit finite scope.
- Every stated scored boundary is completely enumerated by `items`.
- The final Morse topic requires both printed directions and does not count verbal-mnemonic recall, SVG use, timing context, audio exposure/support, sending, speed, words, phrases, or operating fluency toward completion.
- No case-study detail, provenance note, limitation, clinical technique, wider OODA relationship, or contextual explanation is silently counted toward completion.
- NATO, Morse and bearings remain compact despite using provenance/acquisition support.
- OODA and Primary Survey use the richer Learn model because understanding the framework/procedure requires more than mapping labels.
