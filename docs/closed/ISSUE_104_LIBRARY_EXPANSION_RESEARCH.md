# Issue #104 — Argus library expansion research

**Status:** research / owner decision — Batch A shipped; Batch B, the visual wave and the curriculum rule remain open  
**Date:** 2026-09-16 (status updated 2026-09-25)  
**Issue:** #104  
**Implementation:** Batch A shipped as five catalog topics (see status update below); nothing else in this paper is implemented

## Status update — 2026-09-25

Decision A's default shipped as five ordinary catalog topics. Their sources and boundaries are recorded in `docs/closed/SEEDED_CONTENT_PROVENANCE.md`:

| Topic id | Completion claim | Items |
|---|---|---:|
| `radiotelephony-numbers` | Digits 0–9 plus decimal, hundred and thousand → ISED RIC-21 spoken form | 13 |
| `si-prefixes` | Powers 10³⁰ to 10⁻³⁰ → SI prefix name and symbol (BIPM SI Brochure, Table 7) | 24 |
| `greek-alphabet` | Capital and small letter → English name (Unicode Greek and Coptic chart) | 24 |
| `hex-digits-binary` | Hex digit 0–F → four-bit binary pattern (RFC 4648 §8) | 16 |
| `beaufort-wind-scale` | Force 0–12 → descriptive term and knot range (ECCC; force 12 is 64 knots or more) | 13 |

Where the shipped topics depart from this paper:

- **Every topic is forward-only.** §8.1 assumed the model already supports bidirectional recall for any topic. It does not: only the Morse acquisition ladder asks and records the reverse direction, so a bidirectional ordinary topic could never pass a retention attempt. Each scope names the one direction it tests, and `catalogInvariants.test.ts` now refuses a bidirectional topic without the ladder.
- **Beaufort is sourced to Environment and Climate Change Canada, not the NWS.** The NWS table's force 9 term differs from the WMO wording. ECCC's own force 12 band (64–71 knots) is overridden to the WMO's open-ended “force 12 or over”.
- **Radiotelephony procedural words stay held**, as Decision A recommended.

Decisions B (visual portfolio), C (ICS, Cynefin) and D (curriculum rule) are untouched, which is why this paper stays open.

## Executive decision

Argus should expand by **deepening a small number of coherent capability families**, not by accumulating miscellaneous facts.

The current catalog already implies a product identity:

- **communications and compact codes** — NATO phonetic alphabet; International Morse;
- **orientation** — cardinal/intercardinal bearings;
- **decision frameworks** — OODA;
- **safety schemas** — ABCDE primary survey.

That combination works because each topic is finite, externally defensible, useful to recall without opening a reference, and small enough to retain over time. The next library should preserve those properties.

The strongest near-term additions are:

1. **Radiotelephony numerals** — direct extension of NATO; 10 digits plus a tiny set of standardized number words.
2. **SI prefixes** — 24 stable, authoritative mappings; broadly useful; ideal bidirectional recall material.
3. **Greek alphabet** — 24 canonical letters; broadly useful across science, engineering and notation; works in the current text model.
4. **Beaufort wind scale** — 13 levels; practical environmental observation; authoritative and bounded.
5. **Binary / hexadecimal nibble mappings** — 16 exact bidirectional mappings; compact technical fluency rather than trivia.
6. **Radiotelephony procedural words** — a useful communications cluster extension, but only if explicitly scoped to a named service/source such as Canadian aeronautical radiotelephony rather than presented as universal radio doctrine.

A second wave is more strategically interesting because it can justify one reusable product capability: **visual stimulus items**. The best subjects are:

- **WHMIS hazard pictograms**;
- **WMO cloud genera**;
- **International Code of Signals flags**.

Those three are materially better than adding visual capability for a single bespoke course. Together they form a credible reason to add a generic `image ↔ meaning/name` item treatment later.

Several plausible subjects should **not** be first-wave catalog additions:

- Cynefin is useful but its terminology/representation is actively evolving; freeze a sourced version before cataloging it.
- Braille is finite, but a phone can only teach printed visual encoding; that is not the same competence as tactile braille reading.
- Mnemonic systems such as the Major System are valuable, but the useful skill is generative encoding/decoding, not merely memorizing ten consonant mappings; current Test primitives would overclaim the competency.
- broad first-aid procedures, drug doses, treatment algorithms, survival procedures and similar material should not be expanded merely because they can be turned into cards. Rote recall has to remain narrower than practical competence.

The central product recommendation is therefore:

> **Grow Argus from five topics to roughly 12–15 through compact, high-utility, source-backed topics before building another Morse-sized curriculum. Add generic visual stimuli only when three or more approved catalog topics need it.**

That approach expands the library quickly while preserving the rule already established in the learning-experience architecture: the ordinary finite topic is the common object; a guided curriculum is exceptional.

---

# 1. What the current catalog says Argus is

The current five shipped topics are not random. They share six properties:

1. **The completion boundary fits in one sentence.**
2. **The answer set can be enumerated completely.**
3. **The mapping is stable enough to retain for years.**
4. **Recall has practical value outside the app.**
5. **The app can test the claim without pretending that exposure equals competence.**
6. **An authoritative or canonical source exists.**

The existing product architecture makes that explicit. Argus is aimed at a mature personal library of roughly 40–60 completed topics, but the architecture assumes that most of those objects are small finite references, not lesson paths. Morse is deliberately the rare curriculum.

This matters because “course expansion” could easily produce the wrong product. If every new subject receives lessons, checkpoints, custom controls and its own pedagogy, Argus becomes a bespoke course platform. If every interesting list becomes a deck, Argus becomes trivia software. The selection doctrine has to reject both errors.

## Portfolio principle

A shipped topic should normally do at least one of two things:

- **deepen an existing capability family**, so separate topics compound into a useful body of competence; or
- **establish a new family with obvious room for two or more durable topics**, so the library gains structure rather than isolated facts.

Examples:

- NATO → radiotelephony numerals → procedural words is a coherent communications family.
- bearings → Beaufort → cloud genera is a coherent orientation/environment family.
- OODA → carefully chosen sense-making/incident frameworks can become a decision-and-systems family.
- ABCDE → WHMIS pictograms can broaden safety literacy without pretending to teach clinical practice.
- SI prefixes → Greek alphabet → binary/hex can form a compact technical-fluency family.

This does **not** require new visible tracks. The existing `learning`, `survival`, and `tradecraft` values are implementation taxonomy, not a mandate to build a category browser.

---

# 2. Admission test for new catalog material

Use this before authoring any new topic.

## 2.1 Hard gates

A candidate fails the catalog gate if any answer is “no”.

| Gate | Required question |
|---|---|
| Finite | Can the full scored boundary be enumerated now? |
| Stable | Is the answer key likely to remain valid for years, or can it be tied to a named/versioned standard? |
| Objective | Can a learner decide whether an answer is correct without subjective grading? |
| Useful | Is there a plausible real situation in which recall without opening a reference is useful? |
| Honest | Can Argus state exactly what completion proves without implying a broader practical skill? |
| Sourceable | Is there a primary, standards-body, government, canonical-author or similarly strong source? |
| Retainable | Is the boundary small enough to maintain through Argus's retention model? |

## 2.2 Preference factors

Candidates that pass the hard gate should then be preferred when they have more of the following:

- **adjacency** to a shipped topic;
- **cross-domain reuse** rather than one hobby-specific use;
- **high confusion cost**, where recall prevents a meaningful error;
- **compactness**, typically about 5–30 scored units;
- **symmetry**, where bidirectional recall is meaningful;
- **good mobile fit**, where a five-minute session is enough to make progress;
- **source durability**, ideally an official standard rather than a blog or commercial course;
- **content separability**, where explanatory context can remain in Learn while Test stays narrow.

## 2.3 Warning signs

Do not confuse these with value:

- “I would like to know more about this subject.” That is an inbox request, not a completion boundary.
- “There is a famous list.” Famous lists often become trivia without an operational reason to recall them.
- “This could have many lessons.” Course size is not evidence of fit.
- “This is important in an emergency.” Importance can increase the cost of false confidence.
- “It is standardized.” A standard can still be too broad, too frequently revised, or useless to memorize.

---

# 3. Recommended portfolio

## 3.1 Summary matrix

| Candidate | Family | Boundary | Current app fit | Practical value | Source durability | Recommendation |
|---|---|---:|---|---|---|---|
| Radiotelephony numerals | Communications | 10 digits + small fixed terms | Excellent | High in any formal radio context | High | **Wave 1** |
| SI prefixes | Technical fluency | 24 prefixes | Excellent | High | Very high | **Wave 1** |
| Greek alphabet | Technical fluency | 24 letters | Excellent | High | Very high | **Wave 1** |
| Beaufort scale | Orientation/environment | 13 forces | Good | Medium-high | High | **Wave 1** |
| Binary/hex nibble mapping | Technical fluency | 16 mappings | Excellent | High for technical work | Very high | **Wave 1** |
| Radiotelephony procedural words | Communications | selected named-service vocabulary | Excellent | Medium-high | High if service-scoped | **Wave 1 or 2** |
| ICS functional areas | Decision/incident systems | 5 functions | Excellent | Medium | High | **Optional compact topic** |
| WHMIS pictograms | Safety literacy | 9–10 pictograms depending boundary | Needs images | High in Canada/workplaces | High | **Visual wave** |
| WMO cloud genera | Observation/environment | 10 genera | Needs varied images | High observation value | Very high | **Visual wave** |
| International signal flags | Communications | 26 alphabet flags; optionally single-letter meanings | Needs images | Medium / niche | High | **Visual wave** |
| Cynefin domains | Decision/systems | 5 domains + response modes | Text fit | High conceptual value | Medium while model evolves | **Defer/freeze version** |
| UEB printed braille letters | Codes/accessibility | 26 letters | Unicode/image fit | Medium-low unless specifically needed | High | **Defer** |
| Major System | Memory systems | 10 digit–sound conventions | Text fit, but competency does not | Potentially high | Convention varies | **Defer pending generative practice** |
| Broad emergency treatment algorithms | Safety | varies | Technically possible | High stakes | Revision-sensitive | **Reject as generic catalog expansion** |

---

# 4. Candidate pitches

## 4.1 Radiotelephony numerals

### Why it belongs

This is the most natural expansion in the entire set.

The existing NATO alphabet is not merely an alphabet fact set: its value is standardized communication when letters could be confused. Formal radiotelephony applies the same principle to numbers. Innovation, Science and Economic Development Canada's ROC-A study guide provides standardized pronunciations for digits, including forms such as `TREE`, `FIFE`, and `NIN-er`, and also defines words such as `DECIMAL`.

That means Argus can turn one isolated NATO deck into the start of a genuine **radio communications competence cluster** without adding any new product machinery.

### Honest completion boundary

> Can recall the standardized ROC-A pronunciations for digits 0–9 and the chosen fixed numeric terms in both directions.

Avoid claiming “can conduct aeronautical radio communications.” That is a much broader practical skill.

### App treatment

- **Type:** ordinary topic, not curriculum.
- **Items:** bidirectional digit ↔ spoken standard form.
- **Learn:** concise support explaining why standard pronunciation exists and that this is a Canadian aeronautical-source boundary.
- **Test:** every digit once per direction under existing evidence rules.
- **Track:** `learning` unless the owner deliberately wants communications grouped under `tradecraft`; no new track is justified.

### Source

Government of Canada / ISED, *RIC-21 — Study Guide for the Restricted Operator Certificate With Aeronautical Qualification*, §5.3–5.4:  
https://ised-isde.canada.ca/site/spectrum-management-telecommunications/en/official-publications/information/radiocom-information-circulars-ric/ric-21-study-guide-restricted-operator-certificate-aeronautical-qualification

### Build cost

Very low. Content authoring, provenance, catalog reconciliation and tests only.

---

## 4.2 SI prefixes

### Why it belongs

SI prefixes are almost a model Argus topic:

- 24 entries;
- exact name/symbol/factor mappings;
- global standards authority;
- stable enough for durable retention;
- useful across science, engineering, data, economics and technical reading;
- naturally bidirectional.

The 2022 CGPM extension added `ronna/ronto` and `quetta/quecto`, and the current BIPM SI Brochure now presents the complete range from 10^30 to 10^-30. This is a strong case where Argus is useful precisely because familiar prefixes create false confidence while the less common ones are easily forgotten.

### Honest completion boundary

> Can recall all 24 current SI prefix names, symbols and decimal powers from 10^30 through 10^-30.

That is finite and current-standard-specific.

### App treatment

Two defensible choices exist.

**Preferred:** one ordinary bidirectional topic.

- Prompt: `10^-12`; answer: `pico (p)`.
- Reverse: `pico (p)`; answer: `10^-12`.
- Learn support includes the paired symmetry around 10^0 and the capitalization rule.

**Do not** create 24 bespoke lessons merely because there are 24 units. The mapping is simple enough for reference + retrieval.

Potential later practice could ask symbol-only discrimination (`m` vs `M`, `r` vs `R`, `q` vs `Q`), but that is not required for the first topic.

### Sources

BIPM, current *SI Brochure*, Table 7:  
https://www.bipm.org/en/publications/si-brochure

BIPM, CGPM Resolution 3 (2022), adding ronna/ronto/quetta/quecto:  
https://www.bipm.org/en/-/resolution-cgpm-27-3

### Build cost

Very low.

---

## 4.3 Greek alphabet

### Why it belongs

The Greek alphabet is a better Argus candidate than most “learn an alphabet” ideas because the symbols recur constantly in mathematics, statistics, science, engineering, economics and technical notation. Recognition is often passive; active name ↔ glyph recall is what deteriorates.

It also tests whether Argus can support a second compact symbol system without turning every symbol system into another Morse implementation.

### Honest completion boundary

A narrow first topic:

> Can recall the 24 modern Greek letter names and their standard uppercase/lowercase glyph pair in both directions.

Do **not** claim Greek-language reading or pronunciation proficiency.

### App treatment

- **Type:** ordinary bidirectional topic first.
- **Prompt:** `lambda`; answer `Λ λ`.
- **Reverse:** `Λ λ`; answer `lambda`.
- **Learn:** concise note on letter order, sigma's final lowercase form, and the difference between alphabet knowledge and Greek language competence.
- **Test:** existing bidirectional self-scored cards work because Unicode glyphs are text.

The product should resist the temptation to extract a generic “Morse lesson engine” merely because this is another alphabet. If ordinary reference + Test proves unpleasant at 24 items, that is evidence for a generic progressive-acquisition primitive later; it is not evidence to clone Morse now.

### Source basis

Unicode's Greek and Coptic chart provides durable encoded uppercase and lowercase Greek characters:  
https://www.unicode.org/charts/nameslist/c_0370.html

For catalog authoring, use a separate language/reference source for the canonical 24-letter modern alphabet order and conventional English names; Unicode is authoritative for code points, not pedagogy or pronunciation.

### Build cost

Low.

---

## 4.4 Beaufort wind scale

### Why it belongs

This is the strongest bridge from “memorized mapping” to **observation** without requiring images.

The Beaufort scale contains 13 numbered forces, 0–12, each associated with a wind description, speed band and observable effects. The U.S. National Weather Service still publishes it as a practical way to estimate wind strength from visual observations.

This complements bearings well: both are compact environmental reference systems that make observation more precise.

### Honest completion boundary

Avoid asking the learner to memorize every prose effect line. Prefer:

> Can recall Beaufort force 0–12, each force's standard descriptor, and its knot range.

Land/sea visual effects belong in Learn support and can later become recognition practice.

### App treatment

- **Type:** ordinary topic.
- **Items:** force ↔ descriptor + knot range; bidirectional only if the combined answer remains comfortable.
- **Learn:** briefing with a compact table and selected observable effects.
- **Test:** 13 fixed items.
- **Safety copy:** a memory aid, not a substitute for current weather information or marine judgement.

### Source

U.S. National Weather Service Beaufort Wind Scale:  
https://www.weather.gov/mfl/beaufort

### Build cost

Low.

---

## 4.5 Binary / hexadecimal nibble mappings

### Why it belongs

This is compact technical fluency with a real retrieval payoff. A single hexadecimal digit represents exactly four binary bits, creating 16 fixed mappings from `0`–`F` to `0000`–`1111`.

Unlike a broad “learn binary” course, this boundary is finite and can be genuinely completed. It helps with bitmasks, debugging, colour values, byte inspection, low-level protocols and technical documentation.

### Honest completion boundary

> Can recall all 16 hexadecimal digits 0–F and their four-bit binary representations in both directions.

Do not claim general binary arithmetic or programming competence.

### App treatment

- **Type:** ordinary bidirectional topic.
- **Items:** `A ↔ 1010`, etc.
- **Learn:** concise support explaining nibble grouping and why hexadecimal maps cleanly onto binary.
- **Test:** 16 bidirectional items.

This is intentionally a mapping topic, not a generative arithmetic engine. If later content wants decimal↔binary conversion for arbitrary values, that is a different product capability.

### Source/provenance

Use an appropriate standards/technical reference during authoring. The mapping itself is mathematical and stable; the important editorial constraint is to scope the topic to fixed 4-bit ↔ hexadecimal symbols rather than general conversion.

### Build cost

Very low.

---

## 4.6 Radiotelephony procedural words

### Why it belongs

The Canadian ROC-A guide explicitly warns against slang such as “OK,” “REPEAT,” “TEN-FOUR,” “OVER AND OUT,” and similar expressions, and provides standard procedural words/phrases and calling patterns. That creates a second strong extension from NATO beyond digit pronunciation.

This material is valuable because ordinary-language intuition is often wrong. “Repeat,” for example, is not simply interchangeable with the formal request to say a message again.

### The important scoping problem

Procedural vocabulary is **service-specific**. Argus should not ship a deck titled “Radio prowords” that implies universal coverage across aviation, marine, amateur, military and public-safety services.

A defensible boundary would be:

> Canadian aeronautical radiotelephony: the selected procedural words and their meanings defined in ISED RIC-21.

### App treatment

- **Type:** ordinary topic with a briefing.
- **Items:** term → operational meaning; only use bidirectional recall when the reverse question is unambiguous.
- **Learn:** examples showing `OVER`, `OUT`, `ROGER`, `STAND BY`, `GO AHEAD`, `SAY AGAIN`, `CORRECTION`, and the calling order.
- **Do not score:** complete radio procedure, certification or judgement.

### Source

Government of Canada / ISED, RIC-21 §§5.5–5.7:  
https://ised-isde.canada.ca/site/spectrum-management-telecommunications/en/official-publications/information/radiocom-information-circulars-ric/ric-21-study-guide-restricted-operator-certificate-aeronautical-qualification

### Build cost

Low, but editorial work is higher than the numeral deck because the exact scored subset must be selected carefully.

---

## 4.7 Incident Command System — five functional areas

### Why it may belong

FEMA describes ICS as a standardized incident-management structure and names five major functional areas: Command, Operations, Planning, Logistics, and Finance/Administration. That is a clean, bounded framework with legitimate use in emergency management, NGOs, government and some private-sector incident response.

It pairs with OODA in a useful way: OODA is a decision/adaptation frame; ICS is an organizational coordination frame.

### Why it is not a priority

The five labels are easy to memorize, and knowing them alone has limited value unless the learner actually works in an ICS context. It is therefore a good compact topic **if personal relevance exists**, but it should not outrank SI prefixes, radio numerals or other material with broader repeated use.

### Honest completion boundary

> Can name the five major ICS functional areas and state the core responsibility of each.

### App treatment

Ordinary five-item framework with briefing-required Learn content. No lessons.

### Source

FEMA NIMS / ICS materials describe the five major functional areas. Example:  
https://emilms.fema.gov/_is0700b/groups/62.html

---

# 5. The visual-learning wave

Argus currently has only text `prompt` / `answer` items plus Morse-specific presentation. Adding generic images should not be justified by one attractive deck. It becomes rational when a small portfolio of approved topics depends on the same primitive.

The following three together meet that threshold.

## 5.1 WHMIS hazard pictograms

### Why it belongs

For a Canadian user, WHMIS pictograms are unusually practical visual knowledge. They are designed specifically to communicate hazard classes quickly. CCOHS describes pictograms as graphic images that let a user see the type of hazard at a glance.

This is exactly the sort of knowledge where passive familiarity can be misleading: many symbols look obvious until asked to distinguish, for example, acute toxicity from chronic health hazard or oxidizer from ordinary flame.

### Boundary

The source needs deliberate Canadian scoping because GHS and WHMIS do not map perfectly. CCOHS notes that the environmental hazard group was not adopted as a WHMIS 2015 hazard class even though the environment pictogram may appear on labels/SDSs.

A defensible topic could be:

> Recognize the WHMIS pictograms used in Canada and state the high-level hazard meaning of each; distinguish the optional GHS environment pictogram from WHMIS-adopted classes.

### App implication

This should use a generic visual item, not ASCII descriptions or emoji approximations.

Potential item model concept for a future issue:

```ts
{
  stimulus: { kind: 'image', assetId: 'whmis-flame' },
  answer: 'Flame — fire hazards'
}
```

The scored boundary remains finite; image rendering is presentation.

### Source

Canadian Centre for Occupational Health and Safety, WHMIS Pictograms, revised 2026-05-28:  
https://www.ccohs.ca/oshanswers/chemicals/whmis_ghs/pictograms.html

### Recommendation

**Approve content direction, defer implementation until generic visual items are intentionally scoped.**

---

## 5.2 WMO cloud genera

### Why it belongs

The WMO International Cloud Atlas recognizes exactly **ten cloud genera** and provides identification guidance. The classification is an international standard used by meteorological observers and is also intended as a training resource.

This candidate has unusually good Argus qualities:

- finite: 10 genera;
- authoritative: WMO;
- observational: useful while outside, travelling, hiking or diving/trip planning;
- retained skill: benefits from spaced repeated recognition;
- expandable without moving the boundary: species/varieties can remain outside the first topic.

### The key product insight

A cloud course is **not** ten photo flashcards.

If each genus has one hero image, the learner can memorize those ten photographs without learning the category. A credible visual Test needs **multiple exemplars** and preferably separates acquisition images from Test images.

That makes this a better justification for generic visual-learning work than WHMIS alone: it forces the image primitive to support category recognition rather than just static icon lookup.

### Honest completion boundary

> Given representative cloud observations within the WMO genus definitions, can identify the ten cloud genera at genus level.

Do not claim weather forecasting ability.

### App treatment

A future image-capability issue should support:

- multiple source-backed exemplars per scored concept;
- randomized exemplar selection;
- alt text/accessibility that does not reveal the answer;
- provenance/licensing per image;
- image fallback behavior;
- separation between reference gallery and scored stimulus pool.

The Learn page can explain height bands and distinctive features using a WMO-derived identification table. The Test should show a fresh image and ask for the genus.

### Sources

WMO International Cloud Atlas — ten genera:  
https://cloudatlas.wmo.int/en/clouds-genera.html

WMO genus identification guide:  
https://cloudatlas.wmo.int/en/tabular-guide-genus.html

### Recommendation

**High-value visual-wave candidate.**

---

## 5.3 International Code of Signals — flags

### Why it belongs

This is the closest visual cousin of the current communications catalog. The International Code of Signals exists to communicate safety-related messages across language barriers. Its alphabet flags also connect naturally to NATO phonetics and Morse.

There are two possible topics here, and they should not be conflated:

1. **flag ↔ letter recognition**;
2. **single-letter signal ↔ meaning**, where applicable.

The second has real operational meaning but also greater safety sensitivity and more complex source/version considerations.

### Recommended first boundary

> Recognize the 26 International Code of Signals alphabet flags and recall their corresponding letters in both directions.

Only after that ships should Argus consider a second topic for the official single-letter meanings.

### App treatment

- visual bidirectional deck;
- one standardized flag asset per letter;
- optional concise Learn support about the Code's purpose and flag-hoist context;
- do not present completion as maritime signalling competence.

Because the mapping is 26 units and visually confusable, this is a plausible future **guided acquisition** candidate, but it should first prove that ordinary visual reference + Test is insufficient before Argus grows another custom lesson path.

### Source basis

U.S. Government publication of the International Code of Signals:  
https://www.govinfo.gov/content/pkg/GOVPUB-D5_300-PURL-LPS73101/pdf/GOVPUB-D5_300-PURL-LPS73101.pdf

NOAA also publishes educational material based on the single-letter signals.

### Recommendation

**Approve as part of the visual capability portfolio, behind WHMIS/clouds in general utility.**

---

# 6. Candidates to defer or reject

## 6.1 Cynefin — useful, but freeze a version first

Cynefin superficially looks like a perfect OODA companion: a small number of domains, each with a different sense-making/response posture.

The problem is not usefulness. It is **version stability**.

Current Cynefin Company material uses Clear, Complicated, Complex, Chaotic and a central Confused/Aporetic treatment, while 2025–2026 material continues to explore the aporetic domain and revised visual representations. The company itself describes some current representation work as still not stable.

Argus can still support it, but only by making the version explicit:

> “Cynefin domains and response patterns — [named source/version/date]”

Do not ship an apparently timeless deck while the framework's contemporary language is in motion.

**Decision:** defer until the owner wants this framework specifically, then author against a frozen canonical source.

Sources:

- https://thecynefin.co/effective-decision-making-support-tool/
- https://thecynefin.co/st-davids-2026-a-work-in-progress/

---

## 6.2 Unified English Braille — do not overclaim visual proficiency

UEB is standardized and finite enough to create an alphabet deck, and BANA provides current UEB code resources.

The product problem is the completion claim. Braille is fundamentally a tactile reading/writing system. A phone displaying braille cells can train **visual printed-cell recognition**, but that should not be labelled “learn braille” or imply tactile reading competence.

A defensible topic would be:

> Visually recognize the printed UEB cells for the 26 Latin letters.

That is honest but currently lower utility than the recommended candidates.

**Decision:** defer unless accessibility/braille knowledge becomes a deliberate user goal.

Source:  
https://www.brailleauthority.org/unified-english-braille-codebooks

---

## 6.3 Major System — good learning goal, wrong current Test claim

The Major System converts digits into consonant sounds and then into memorable words. Memorizing the digit–sound map is finite; using it fluently is generative.

A ten-card topic could truthfully prove only:

> recalls the chosen digit-to-sound convention.

It would not prove:

> can encode and decode numbers fluently using the Major System.

The latter requires open generation with many valid answers, something Argus's current fixed `prompt`/`answer` Test does not represent well.

**Decision:** keep as a future content/capability experiment rather than a catalog deck that overstates the skill.

---

## 6.4 Semaphore alphabet — coherent but too niche for the next wave

Semaphore has the same attractive properties as Morse and signal flags: finite alphabet, visual mappings, possible progressive acquisition.

Its weakness is portfolio priority. International signal flags have a clearer standards/safety communications context and WHMIS/clouds have broader daily usefulness. Semaphore therefore does not justify visual capability before those subjects.

**Decision:** later only.

---

## 6.5 Broad emergency procedures — resist content inflation

ABCDE works in Argus because its scored boundary is intentionally tiny: the five headings and order. Learn support explicitly states that detailed examination, treatment and diagnosis are outside the claim.

That pattern should remain the exception, not become a route to a large library of simplified clinical algorithms.

Avoid first-wave topics for:

- medication doses;
- treatment thresholds;
- CPR/ALS algorithms as if card recall were procedural competence;
- triage decisions without formal training context;
- hazardous survival interventions;
- frequently revised medical recommendations.

Some may eventually be appropriate as narrowly sourced memory aids for a trained user, but catalog expansion should not create them merely to populate the `survival` track.

---

# 7. What should be a “course” versus an ordinary topic

The current product architecture already answers this better than conventional education apps do.

## Ordinary topic by default

Use reference + explicit Start learning + Test when:

- the full material can be understood from a compact sheet;
- item relationships are simple;
- acquisition does not need a particular order;
- there is no meaningful formative skill beyond remembering the mapping.

Recommended ordinary topics:

- radiotelephony numerals;
- SI prefixes;
- Greek alphabet initially;
- Beaufort scale;
- binary/hex nibble mappings;
- procedural words;
- ICS functions;
- WHMIS pictograms once images exist.

## Guided curriculum only when order and formative support matter

Morse earned its lesson path because acquisition benefits from controlled introduction, cumulative review, diminishing cues, audio, keying and checkpoints.

A future candidate should receive a guided curriculum only if it has similarly strong reasons. Candidate examples:

- International signal flags **may** justify progressive introduction because 26 visual patterns can interfere, but this should be measured rather than assumed.
- Greek alphabet **may** eventually benefit from progressive acquisition, but a 24-item reference deck should be tried first.
- WMO cloud genera need varied exemplar practice, but that is a **classification-learning** problem rather than a Morse-style ordered lesson problem.

The lesson is architectural: do not generalize from surface resemblance (“another alphabet”) to learning-treatment equivalence.

---

# 8. Product capability implications

## 8.1 No schema work is needed for the first expansion wave

The existing model already supports:

- forward items;
- bidirectional items;
- concise Learn support;
- briefing Learn support;
- sources and limitations;
- durable catalog delivery;
- existing retention/evidence semantics.

The first content wave should exploit those primitives before adding new ones.

## 8.2 A generic visual stimulus is the next capability worth considering

Do **not** add `whmis-pictogram`, `cloud-photo`, or `signal-flag` special cases.

If owner review approves at least two or preferably all three visual candidates, scope one reusable content primitive with:

- media asset identity separate from answer identity;
- local/offline availability consistent with the PWA;
- alt/accessibility strategy;
- source/license provenance;
- multiple exemplars per concept where classification is being learned;
- deterministic fallback behavior;
- export/import safety;
- no automatic promotion from visual recognition to broader real-world competence.

This is the most credible expansion of the content model visible from the candidate research.

## 8.3 Do not create a generic curriculum engine yet

The current durable state contains Morse-specific lesson sitting/review fields and a Morse-specific Learn packet type. That is acceptable while Morse is the only genuine curriculum.

A second guided curriculum should be the trigger for architectural extraction, not the desire to make the code look generic in advance.

When that trigger arrives, the extraction should begin from shared learning semantics—finite packets, formative retrieval, cumulative review, support fading—not from renaming `Morse` types.

---

# 9. Proposed first expansion wave

The goal is not “ship as many as possible.” It is to establish a richer library without changing product shape.

## Batch A — direct adjacency

### A1. Radiotelephony numerals

Smallest cost, strongest relationship to an existing topic.

### A2. SI prefixes

Best broadly useful standards-backed mapping deck.

### A3. Greek alphabet

Tests a second symbol system using only generic current primitives.

### A4. Binary / hexadecimal nibble mappings

Adds compact technical fluency with a very clean bidirectional boundary.

### A5. Beaufort wind scale

Adds the first environment-observation system and creates a natural bridge to cloud identification later.

Expected catalog after Batch A: **10 topics**, still structurally simple.

## Batch B — communications/framework enrichment

After real use of Batch A:

- Canadian aeronautical procedural words, if the radio cluster remains useful;
- ICS five functional areas, if incident-management relevance is real;
- a frozen/versioned Cynefin topic only if owner interest is high enough to justify managing source evolution.

## Batch C — generic visual content

Scope the visual item capability only after owner approval of the content portfolio. Then author:

1. WHMIS pictograms;
2. WMO cloud genera;
3. International Code of Signals flags.

This would bring the catalog into roughly the **13–16 topic** range without turning Argus into a course marketplace.

---

# 10. How each new topic should be authored

Every implementation issue should contain a small content contract before code begins.

## Required authoring packet

```text
Title
Why this belongs in Argus
Exact completion claim
Explicit non-claims
Canonical source(s) + version/date
Scored item inventory
Item direction: forward or bidirectional
Learn treatment: reference-only / concise / briefing
Known ambiguities
Safety/limitations copy if needed
Expected item count
Whether ordinary Topic primitives are sufficient
```

## Example: SI prefixes

```text
Title: SI prefixes
Claim: Can recall all 24 current SI prefix names, symbols and decimal powers.
Non-claims: Does not prove dimensional analysis or unit-conversion proficiency.
Source: BIPM SI Brochure, current edition, Table 7.
Items: 24.
Direction: bidirectional.
Learn: concise.
Special UI: none.
```

That packet should be reviewed before an implementation agent writes a seed object. It prevents the code diff from silently making product decisions.

---

# 11. Catalog governance as the library grows

At five topics, quality can be managed informally. At 40–60, it cannot.

The library expansion should eventually maintain a lightweight content registry or documentation table with:

- topic id;
- title;
- family;
- completion claim;
- item count;
- source authority;
- source date/version;
- content owner (`catalog`);
- last editorial review;
- safety sensitivity;
- custom capability dependency;
- superseded/deprecated status if a standard changes.

This is not a CMS. It is a review ledger so Argus does not end up with a dozen old “standard” decks that nobody knows how to audit.

A useful policy would be:

- **standards-backed topics:** review when the named source changes or annually if the publisher has no version notification;
- **canonical conceptual frameworks:** pin a source/version and update only deliberately;
- **safety-sensitive topics:** review on every authoritative guideline revision before catalog content changes;
- **mathematical mappings:** no periodic editorial churn unless the presentation or scope changes.

---

# 12. Research evidence informing the shortlist

## Current Argus authority

The repository establishes:

- Argus as a personal library of finite, closed-scope competencies;
- 40–60 completed-topic twelve-month success condition;
- small finite reference topics as the dominant object;
- curricula such as Morse as exceptional;
- separate browse, acquisition, scored evidence and retention semantics;
- text forward/bidirectional items as the generic scored primitive;
- Morse-specific lesson state rather than a generic course engine.

Primary repository sources:

- `PRODUCT.md`
- `docs/open/LEARNING_EXPERIENCE_DESIGN_DECISION.md`
- `docs/open/LEARN_CONTENT_MODEL.md`
- `src/lib/types.ts`
- `src/lib/seed.ts`

## External sources reviewed

### Communications

Government of Canada / ISED — RIC-21, aeronautical radiotelephony study guide:  
https://ised-isde.canada.ca/site/spectrum-management-telecommunications/en/official-publications/information/radiocom-information-circulars-ric/ric-21-study-guide-restricted-operator-certificate-aeronautical-qualification

U.S. Government — International Code of Signals publication:  
https://www.govinfo.gov/content/pkg/GOVPUB-D5_300-PURL-LPS73101/pdf/GOVPUB-D5_300-PURL-LPS73101.pdf

### Measurement / technical fluency

BIPM — current SI Brochure:  
https://www.bipm.org/en/publications/si-brochure

BIPM — 27th CGPM Resolution 3 (2022), extension of SI prefixes:  
https://www.bipm.org/en/-/resolution-cgpm-27-3

Unicode — Greek and Coptic names/code chart:  
https://www.unicode.org/charts/nameslist/c_0370.html

### Environment

WMO — International Cloud Atlas, ten cloud genera:  
https://cloudatlas.wmo.int/en/clouds-genera.html

WMO — genus identification guide:  
https://cloudatlas.wmo.int/en/tabular-guide-genus.html

U.S. National Weather Service — Beaufort scale:  
https://www.weather.gov/mfl/beaufort

### Safety / incident systems

Canadian Centre for Occupational Health and Safety — WHMIS pictograms:  
https://www.ccohs.ca/oshanswers/chemicals/whmis_ghs/pictograms.html

FEMA — ICS introduction and five major functional areas:  
https://emilms.fema.gov/_is0700b/groups/62.html

### Framework versioning caution

The Cynefin Company — current domain explanation:  
https://thecynefin.co/effective-decision-making-support-tool/

The Cynefin Company — 2026 work-in-progress discussion demonstrating continuing representation evolution:  
https://thecynefin.co/st-davids-2026-a-work-in-progress/

### Braille scope caution

Braille Authority of North America — Unified English Braille codebooks:  
https://www.brailleauthority.org/unified-english-braille-codebooks

---

# 13. Owner decision package

No implementation should begin from this issue. The useful next decision is a **portfolio decision**, not item-by-item code authorization.

## Decision A — first-wave content

Recommended default:

- approve radiotelephony numerals;
- approve SI prefixes;
- approve Greek alphabet;
- approve binary/hex nibble mapping;
- approve Beaufort scale;
- hold procedural words for a second communications pass.

This yields five new topics using only current generic primitives.

## Decision B — visual capability portfolio

Recommended default:

Approve the **content direction** for all three, but do not implement yet:

- WHMIS pictograms;
- WMO cloud genera;
- International signal flags.

If owner approval survives a later content-design pass, open one generic visual-item architecture issue and three independent content-authoring issues behind it.

## Decision C — conceptual frameworks

Recommended default:

- ICS: optional, only if personally useful;
- Cynefin: defer until a specific frozen source/version is selected;
- do not add conceptual frameworks merely to balance the catalog visually.

## Decision D — future curriculum rule

Recommended default:

Keep Morse as the only guided curriculum for now. A second course gets a lesson path only when research shows that ordinary reference + retrieval is materially inadequate. At that point, scope a generic progressive-acquisition architecture from two real examples rather than abstracting Morse pre-emptively.

---

# 14. Definition of done for #104

This research issue is complete when:

- the owner has reviewed the portfolio and selection doctrine;
- first-wave candidates are explicitly approved/rejected/deferred;
- the visual-wave direction is decided;
- any approved content is split into separate implementation issues with exact completion claims and canonical sources;
- #104 is then closed as a research/design issue.

No content implementation, schema change, UI work or course-engine refactor belongs in #104 itself.
