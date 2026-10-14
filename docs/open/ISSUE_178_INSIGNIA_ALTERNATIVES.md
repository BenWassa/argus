# Issue #178 — Alternatives to licensed CAF rank-insignia artwork

> **Status: research only — 2026-10-06. Nothing here is approved or implemented.**
>
> **Authority:** this document is advisory. [#178](ISSUE_178_CAF_RANK_INSIGNIA_VISUAL_RECOGNITION.md) remains the sole authority on the insignia rights gate and is **not changed by this document**. Any change to #178's rules proposed below needs an explicit owner decision and a separate PR.
>
> **Not legal advice.** The statutory and case-law reading below is a research summary for the owner. The questions in [section 9](#9-open-questions-for-the-owner-or-counsel) need counsel before anything here is relied on.
>
> **Related:** [#178](ISSUE_178_CAF_RANK_INSIGNIA_VISUAL_RECOGNITION.md) (rights gate, licence request) · [#176](../closed/ISSUE_176_CAF_RANKS_INSIGNIA.md) (programme research) · [#146](ISSUE_146_VISUAL_CONTENT_PRIMITIVES.md) (visual primitives) · `src/domain/military/cafRankRecognitionPlan.ts` (metadata only)

## 1. Bottom line

**No lawful, licence-free route exists to show the official rank insignia, or a faithful picture of them, inside Argus.** Every route that keeps the completion claim ("recognise the canonical service-dress exemplar") either copies or redraws the protected insignia, or relies on a legal argument that DND's own guidance contradicts and that has not been tested.

What exists instead:

- **Free-licensed art does exist on Wikimedia Commons** (307 files across the current-pattern Canadian rank categories), but every file is a user recreation or an unexplained public-domain claim. None of those licences can be treated as clearing the underlying Crown work. Using them is the redraw route #178 forbids, with an extra layer of unverifiable provenance.
- **A fair-dealing argument exists** but is weak for the delivery model (public repo, offline copies, whole works, a free alternative on Canada.ca) and cannot be settled by research.
- **Text-only material is the only lawful-now option**, and it teaches a different skill (decoding insignia from a description), not visual recognition. #178's own wording already allows it in Learn.

**Recommendation (detail in [section 8](#8-recommendation)):** wait for the licence and ship nothing visual. Optionally, as a separate issue, ship a text-only "how to read insignia" explainer under a narrower claim. Do not build a pictorial schematic. Submit the licence request now, and ask it to cover the Canadian Royal Crown replacement artwork.

## 2. Method and caveats

- Research date and retrieval date for every source: **2026-10-06**.
- No official insignia image was downloaded or saved. For Wikimedia Commons I queried the public API for **licence metadata only** (titles, licence names, credit and description text). No image bytes were fetched. One DND policy letter (a PDF of text, not an insignia) was fetched and read.
- Web pages were read through an HTML-to-text tool whose summariser can reword quotes. Quotes marked **[V]** were returned consistently by two separate fetches or are statute text; quotes marked **[E]** came from one extraction and must be re-read on the live page before anyone relies on them. Anything I could not confirm is marked **unverified**.
- Statute and case-law references that come from my background knowledge and were not retrieved in this session are marked **unverified**.

## 3. Question 1 — Existing free-licensed art

### 3.1 What Commons holds

Query: Commons API, categories *Military rank insignia of the Canadian Army / Royal Canadian Navy (and its sleeve and slides sub-categories) / Royal Canadian Air Force / Canada (OF-09)*, historical sub-categories excluded, retrieved 2026-10-06.

| Licence (as tagged) | Distinct files |
| --- | ---: |
| CC BY-SA 4.0 | 189 |
| CC BY-SA 3.0 (incl. 1 CC BY-SA 3.0 de) | 80 |
| Public domain | 36 |
| CC0 | 2 |
| CC BY (attribution only) | 0 |
| **Total** | **307** |

Credit fields: 215 say "Own work", 124 say based on, derived from, redrawn, extracted from or vectorised from another file (the two are not exclusive). The candidates that matter for #178, grouped by their stated legal basis:

| Candidate | Stated basis | Legal reading |
| --- | --- | --- |
| `File:Canadian Army OR-4.svg`, `File:Canadian Army OF-1b.svg` and the `Canada-Army-OR-*` "(service)" SVG family (Sodacan and derivatives), all CC BY-SA 4.0. The `Canada-Navy-*` and `Canada-AirForce-*` "(service)" families carry the same licence tag; I did not check their credit lines. | Credit: "Own work; Based on: Rank Appointment Insignia -Canadian Army" with a link to a `forces.gc.ca` page. | **User recreation derived from the official artwork.** The licensor can only license what they own. This is exactly "tracing or redrawing" under #178. |
| `File:Canadian Army Colonel Gorget.png`. CC BY-SA 4.0. | Credit: "Redraw of" a `forces.gc.ca` page. | Same, and it is a gorget, which #178 excludes as a scored target anyway. |
| `File:Can-*-2010-OF*.png` and `*-Can-2010.png` (Ctjj.stevenson), tagged **Public domain**. | "Own work … I created this work entirely by myself", released to the public domain by the author. | **User recreation, self-released.** The author can release only their own contribution. The design of the 2010 naval insignia is a DND design. |
| `File:Generic-Navy-O1…O11.svg` (Greentubing), tagged Public domain. | "Own work". Descriptions list several navies (UK, Canadian, Danish, Norwegian, Turkish, Slovene) per file. | **Generic multi-navy stripe schematics.** Not the Canadian official artwork, and cover only part of the officer ladder. This is the closest existing example of the "generic schematic" route in section 6. |
| `File:LSeaman.jpg`, `File:ABSeaman.jpg`, tagged Public domain. | Source: a 2007 `forces.gc.ca` page; author "Marine Canadienne". The file page's stated rationale: international law "requires identification of combatants and prohibits copyrighting military rank insignia" **[E]**. | **Upload of an official image under a claimed public-domain rationale.** I found no Canadian statute or case supporting the rationale (the Geneva Conventions regulate identification, not copyright). Treat as **unverified and not reliable**. The Commons template behind it could not be located (`Template:PD-RankInsignia` returned 404). |
| `File:Canada ARMY Insignia 0.png`, tagged Public domain. | 2005 upload, 66×14 px. Rationale: "ineligible for copyright … consists entirely of information that is common property" **[E]**. | **PD-ineligible claim on a tiny single image.** Not a basis for a ladder, and the claim is the uploader's, not a DND statement. |
| 2 CC0 files (ChevronTango). | "Own work" (e.g. a Commodore, a surgeon variant). | Self-released recreations. |

### 3.2 Would the licences hold up?

Not safely.

1. **A licence tag is the uploader's claim, not a clearance.** Commons' own licensing page states "A copyright license can _only_ be granted by the copyright holder, which is usually the author" and that a free licence on an image based on non-free copyrighted material does not make it acceptable **[E]** (`https://commons.wikimedia.org/wiki/Commons:Licensing`, retrieved 2026-10-06). Its derivative-works page says a tracing "is a copy without new creative content" and that a non-free work "cannot be rendered free without the consent of the copyright holder, not by photographing, nor drawing, nor sculpting" **[E]** (`https://commons.wikimedia.org/wiki/Commons:Derivative_works`).
2. **DND's stated position is that these are protected and that adapting them always needs permission.** [Crown copyright page](https://www.canada.ca/en/department-national-defence/corporate/intellectual-property/crown-copyright.html) **[V]**: "You **always** need permission when the Work is being: revised, adapted, modified, translated", and the always-need-permission exclusions list "Canadian Armed Forces badges, crests, flags and insignia". The CAF Heritage Manual defines insignia to include rank insignia: "A badge or other device such as rank insignia, name tag, buttons, unit identifiers …" **[E]** ([Section 3 – Definitions](https://www.canada.ca/en/services/defence/caf/military-identity-system/heritage-manual/chapter-6/section-3.html), modified 2023-08-30).
3. **There is a counter-argument, and it is untested.** Copyright protects expression, not ideas or functional systems. A rank is defined by a counted arrangement of devices ("a combination of two devices in numbers and order" **[E]**, [Dress Instructions §3-2](https://www.canada.ca/en/services/defence/caf/military-identity-system/dress-manual/chapter-3/section-2.html), modified 2024-02-01). An independent recreation from that specification, without copying the official rendering, might not reproduce a substantial part of the official artwork (the Canadian test is qualitative and holistic; *Cinar Corporation v. Robinson*, 2013 SCC 73 — **unverified, from background knowledge, counsel to confirm**). But the Commons recreations above say they are based on the official pages, which is the worst fact pattern for this argument, and DND's guidance does not accept it.
4. **Commons accepting a file is not a legal finding.** Its policy requires a free licence in both the US and the country of origin **[E]**, and enforcement is by community deletion. These files can be deleted or contested at any time, which would break Argus's provenance ledger (#178 requires a licence/permission reference per asset).
5. **#178 forbids this route by its own text:** "tracing or redrawing it", "generating a substitute representation", and "distributing source or optimized copies through the public GitHub repository". Reusing a recreation is distributing a redrawing.

There is a separate fidelity problem. #176 makes official artwork the QA authority, and "small symbolic errors would directly teach the wrong answer". The Commons set mixes unification-era (1968–1985) and current patterns, and no uploader is accountable for matching the current Dress Instructions figures.

### 3.3 Crown copyright duration, in relation to the current exemplars only

- [Copyright Act s. 12](https://laws-lois.justice.gc.ca/eng/acts/c-42/section-12.html) (current to 2026-09-21) **[V]**: copyright in a work prepared or published under the direction or control of Her Majesty or a government department "shall continue for the remainder of the calendar year of the first publication of the work and for a period of fifty years following the end of that calendar year."
- Commons' Canada page states the 2022 term extension to life plus 70 years "did not extend the term for Crown Copyright" **[E]** (`https://commons.wikimedia.org/wiki/Commons:Copyright_rules_by_territory/Canada`). The s. 12 text above is consistent with that.
- A work first published in 1975 is out of term from the end of 2025; one first published in 1976 from the end of 2026.
- The current service-dress patterns are recent. The naval restoration is dated 2010 on the Commons uploads; the RCAF's new insignia were announced in 2014 ([DND/RCAF article](https://www.canada.ca/en/department-national-defence/maple-leaf/rcaf/migration/2014/new-insignia-for-the-royal-canadian-air-force.html), date from the URL path; **page not read**); Army general-officer changes were announced in April 2016 ([DND news](https://www.canada.ca/en/department-national-defence/news/2016/04/canadian-army-announces-changes-to-the-general-officer-rank-insignia.html), title and date taken from the URL and search result; **page not read**). Artwork first published on or after 2010 stays in term until at least the end of 2060.
- **Older patterns do not help.** They are different designs (maple-leaf officer insignia of 1968–2013, unification-era naval insignia), so a public-domain older rendering is not the "canonical current service-dress exemplar". A narrow exception is theoretically possible where a current pattern is unchanged since a pre-1976 Crown publication, but that needs dated first-publication evidence per rank and would mean drawing the old artwork, not the current exemplar. **Unverified; not recommended.**
- Copyright expiry would not remove the other layers in section 5.

## 4. Question 2 — Statutory exceptions

**Fair dealing, [Copyright Act s. 29](https://laws-lois.justice.gc.ca/eng/acts/c-42/section-29.html) [V]:** "Fair dealing for the purpose of research, private study, education, parody or satire does not infringe copyright." Education is an enumerated purpose. The Supreme Court treats fair dealing as a user's right to be read in a "large and liberal" way (*CCH Canadian Ltd v Law Society of Upper Canada*, 2004 SCC 13; *SOCAN v Bell Canada*, 2012 SCC 36; *Alberta (Education) v Access Copyright*, 2012 SCC 37 — all confirmed by search summaries, not read in full). *York University v Access Copyright*, 2021 SCC 32 declined to assess York's guidelines but said fairness must consider the individual user's perspective as well as the institution's (search summary).

Fairness is then tested on the six *CCH* factors. A rough reading for this use:

| Factor | Reading for a public rank-insignia quiz |
| --- | --- |
| Purpose | Education is plausible for a learning tool. Weighs for. |
| Character | Unlimited public distribution, permanent copies in a public repo, offline caches on every device. Weighs against. Fair dealing is not a licence the owner can pass on: a forker's purpose is theirs. |
| Amount | Each insignia is a whole work; 57 whole works. Weighs against, though small works sometimes need to be copied whole. |
| Alternatives | A free official copy exists on Canada.ca, and text descriptions and links need no copying. Weighs against. |
| Nature of work | Factual, publicly circulated official identifiers. Neutral to for. |
| Effect on the work | DND licenses insignia reproduction ("typically … a non-exclusive license at a 5% royalty rate on standard terms" **[V]**, Crown copyright page), but a free educational app is unlikely to displace paid use. Neutral to for, but a licensing market exists. |

Where this leaves a small educational recognition quiz:

- **In-app display of the 57 insignia:** arguable, not safe. The result turns on facts (who runs Argus, whether it earns revenue, how it is distributed) that only counsel can weigh.
- **Bundling in the public repo:** weaker than in-app display. The repo exists to let anyone copy and reuse the files for any purpose, which is not Argus's educational dealing.
- **Offline PWA copies:** the copy lands on each learner's device. Argus still makes and distributes the copy; this is closer to the in-app case but adds another reproduction and the format-conversion transformations that #178 lists.
- **Not available:** [s. 29.4](https://laws-lois.justice.gc.ca/eng/acts/c-42/section-29.4.html) **[E]** covers an "educational institution or a person acting under its authority for the purposes of education or training on its premises" displaying a work, and is lost where the work is "commercially available … in a medium that is appropriate". Argus is not an educational institution and is not on premises.
- **Possibly relevant, unclear:** [s. 29.21](https://laws-lois.justice.gc.ca/eng/acts/c-42/section-29.21.html) **[E]** (non-commercial user-generated content). An *individual* may use published works to create new content if use and dissemination are "solely for non-commercial purposes", the source is mentioned where reasonable, the individual had reasonable grounds to believe the source copy was not infringing, and there is no "substantial adverse effect, financial or otherwise" on the work's exploitation. Whether an unaltered insignia quiz is "new content", whether Argus is "solely non-commercial" (this document does not know Argus's revenue plans), and whether the owner is an "individual" in the statutory sense are all open.
- **DND's published guidance does not mention these exceptions.** Its page is a permission statement, not a statute, and a statutory exception does not depend on it. But the owner is simultaneously asking DND for a licence, and an argument that DND's insignia exclusion does not bind would sit awkwardly beside that request.

**Flag for counsel:** whether any of ss. 29, 29.21 and 29.4 supports each of (a) in-app display, (b) public-repo hosting, (c) offline caching, (d) format conversion and resizing, given DND's "revised, adapted, modified" statement.

## 5. Question 3 — Other layers of protection

Separate from copyright, and not removed by it expiring:

| Layer | What the source says | Effect for Argus |
| --- | --- | --- |
| **Trademarks Act s. 9(1)(n) and s. 11** | s. 9(1): "No person shall adopt in connection with a business, as a trademark or otherwise, any mark consisting of, or so nearly resembling as to be likely to be mistaken for," paragraph (n): "any badge, crest, emblem or mark (i) adopted or used by any of Her Majesty's Forces as defined in the National Defence Act, (ii) of any university, or (iii) adopted and used by any public authority in Canada as an official mark for goods or services". s. 11: "No person shall use in connection with a business, as a trademark or otherwise, any sign or combination of signs adopted contrary to section 9 or 10." [V] ([s. 9](https://laws-lois.justice.gc.ca/eng/acts/T-13/section-9.html), [s. 11](https://laws-lois.justice.gc.ca/eng/acts/T-13/section-11.html), current to 2026-09-21) | Hinges on "in connection with a business". A free hobby app may be outside it; any monetisation could bring it in. Whether rank insignia are "adopted or used by Her Majesty's Forces" for paragraph (i) looks likely on its face but is **unverified**. I did not search the trademarks register for official-mark notices on rank insignia. **Counsel question.** |
| **National Defence Act s. 291** | "Every person who uses (a) the words 'Canadian Forces' or 'Canadian Armed Forces' … (b) any picture or other representation of a member of the Canadian Forces, or (c) any uniform, mark, badge or insignia in use in the Canadian Forces, in any advertising or in any trade or service, having been requested in writing by the Minister to cease that usage, is guilty of an offence punishable on summary conviction." (2): no proceedings without the Minister's consent. [V] ([s. 291](https://laws-lois.justice.gc.ca/eng/acts/N-5/section-291.html), current to 2026-09-21) | Reaches depictions and insignia, not only wearing. Only bites after a written Minister request to stop, and only for use "in any advertising or in any trade or service". Free educational use may not be "trade or service"; **unverified**. The Crown copyright page itself cites "section 291 of the National Defence Act" as the lawful-use condition. |
| **Criminal Code s. 419** | Offence of "without lawful authority" wearing a Canadian Forces uniform, a military badge, ribbon, decoration or "any mark or device or thing that is likely to be mistaken for" one, or possessing another person's discharge or identity documents. [V] ([s. 419](https://laws-lois.justice.gc.ca/eng/acts/C-46/section-419.html)) | Concerns wearing and possession, not depicting or teaching. Not a barrier to Argus. |
| **Heritage Manual and Public Register** | "All badges and other insignia are recorded in the Public Register of Arms, Flags and Badges of Canada and cannot be used without authorization, pursuant to the National Defence Act, Trade-marks Act and Copyright Act." "Badge ownership is retained by the Crown". A formation commander or CO may authorize non-commercial reproduction of the unit's own badge. Authority for other uses is requested from NDHQ/DHH (Inspector of CAF Colours and Badges). [E] ([Section 10](https://www.canada.ca/en/services/defence/caf/military-identity-system/heritage-manual/chapter-6/section-10.html), modified 2023-08-30) | Policy, not statute. It covers unit badges, and does not mention rank insignia in that section. Whether *rank* insignia are individually in the Public Register is **unverified**. The Register's own terms say its heraldic emblems "may not be reproduced in any form or in any media without the written consent of the Canadian Heraldic Authority" (search summary of `gg.ca` register pages, **not read**). |
| **"Flags / Emblems / Names" regulation** | I could not find a regulation by that name. The Heritage Manual and the above statutes are the actual instruments. | None identified. If the owner has a specific instrument in mind, **unverified**. |
| **Canada.ca site terms** | Non-commercial reproduction is allowed "without charge or further permission", but "The official symbols of the Government of Canada, including the Canada wordmark, the Arms of Canada, and the flag symbol may not be reproduced, whether for commercial or non-commercial purposes, without prior written authorization" **[E]** ([Terms and conditions](https://www.canada.ca/en/transparency/terms.html), modified 2025-09-05). | Does not itself exclude rank insignia, but DND's own page does. The DND page is the more specific rule. |
| **Open Government Licence – Canada** | Excludes "the names, crests, logos, or other official symbols of the Information Provider" and "Information subject to other intellectual property rights, including patents, trade-marks and official marks" **[E]** ([OGL–Canada](https://open.canada.ca/en/open-government-licence-canada)). | DND's *text* dataset "Rank Appointment Insignia" ([record](https://donnees.iriu.ca/dataset/a503f0de-b081-4b8f-ae69-651f8c95d676), updated 2026-04-17, licence CA-OGL-LGO) has CSV resources only: rank titles and abbreviations, no images and no insignia descriptions **[E]**. It is a clean source for names, not for insignia. |

So **yes, there are protection layers separate from copyright** (Trademarks Act official marks and NDA s. 291), and they are the reason a copyright-term or fair-dealing win would not be enough on its own.

## 6. Question 4 — Non-reproduction designs

#178's wording that matters (`ISSUE_178_CAF_RANK_INSIGNIA_VISUAL_RECOGNITION.md`):

- Blocked: "tracing or redrawing it", "generating a substitute representation of the insignia", and "Learn comparison images".
- Allowed by its accessibility contract: "Learn material may describe discriminating visual features outside the scored question."
- The completion claim is "visual recognition of the one canonical current service-dress exemplar actually shipped".
- #176 §7: rank insignia "are the protected identifiers and the scored fact. Redrawing or AI-generating them is both less accurate and not a credible workaround".
- #146: a `Visual` image `src` must be a local `/media/…` file and "Remote URLs … are rejected at import", and media is precached for offline use.

| Design | Lawful now? | What it teaches | What it does not teach | Completion claim | Within #178's wording? |
| --- | --- | --- | --- | --- | --- |
| **A. Text-only descriptions** of each rank's elements (counts of bars, stripes, pips, crowns, maple leaves, swords), authored in Argus's own words as short factual statements | Likely, with the cautions below | Decoding: given a described arrangement, name the rank; the grammar of each service (pips and crowns, lace and curl, chevrons) | Seeing the real thing at phone size; shape and proportion; distinguishing similar real-world renderings | **Must change.** The claim becomes "decode a verbal description of insignia", not "recognise the canonical exemplar". | **Yes.** Learn description is explicitly allowed. A *scored* description item is a text item and does not conflict with the non-revealing-alt rule, but must not be presented as the visual topic. |
| **B. Abstract count notation** (non-pictorial tokens such as "2 pips + crown" rendered as plain text or generic symbols that do not resemble the official artwork) | Probably, **unverified** | Same as A, with a more compact display | Same as A | Same change as A | **Borderline.** Depends on whether it looks like the insignia. Needs an explicit #178 clarification. |
| **C. Pictorial schematic** built from a factual description (drawn bars, chevrons, stars, crowns arranged like the real insignia) | Uncertain (copyright idea/expression and official-mark questions, section 3.2 and 5) | A picture of the pattern, closest to real recognition | The official proportions, devices and colourways; carries a risk of teaching an inaccurate pattern (#176) | **Must change** to "recognise a schematic of the rank pattern". It is not the canonical exemplar. | **No.** It is a "substitute representation of the insignia" under #178's plain wording and is what #176 §7 rejects. Allowing it would need a deliberate rule change, which this document does not make. |
| **D. Link out** to the official Canada.ca rank pages | Yes: a link copies nothing. Embedding or hot-linking the image is different and is blocked by #178 and #146 | Where the real artwork is, for a learner with a connection | Anything offline; nothing is graded; Argus cannot check recognition | **No claim possible.** At best a "check the official page" reference line | **Yes.** Conflicts with offline-first: cross-origin images cannot be precached without copying them, and #146's local-only media rule exists for this reason. |
| **E. Learn-only "how to read insignia" explainer**, no scored visual items | Same as A | Reading grammar and the confusion families (Gen/LGen/MGen/BGen etc.) | Visual recognition | No visual claim; the existing #177 hierarchy topic stays the only scored rank topic | **Yes.** |

Does a schematic count as the "substitute representation" #178 forbids? **Yes under the plain reading of C**, because it is a depiction made to stand in for the insignia, and #176 rules out synthetic insignia on both accuracy and licensing grounds. A and B describe or encode the *rule* rather than depict the insignia, which is why they are the only designs this document treats as compatible with #178 as written (B only after clarification).

Cautions for A and B:

1. **Do not copy official wording.** Official text for this is also Crown copyright. The Dress Instructions give only partial text ("Rank lace shall be gold, in straight rows, surmounted by a circle (executive curl)" for Navy officers **[E]**) and rely on figures for the rest, so Argus would be authoring new factual descriptions. Short statements of counts and devices are facts, not expression. Counsel should confirm that describing the official artwork in words does not engage the "adapted" language on DND's page.
2. **Names and abbreviations** already come from sources #177 uses. If the OGL–Canada CSV is reused, its attribution wording applies.
3. **Verify every description** against the official artwork by eye, as #178 permits for research and QA (not as a copy).
4. **Accessibility contract:** any scored text item must not leak the answer to a future visual item for the same rank, and must not be framed as the visual topic.

## 7. Question 5 — Licence-request levers

**Process (verified):** DND's route is the [Apply for Crown copyright permission](https://www.canada.ca/en/department-national-defence/corporate/intellectual-property/apply-crown-copyright-permission.html) form **[E]** (modified 2023-10-30), which asks for applicant details, purpose, work details including commercial status, and DND source material details. The page states no processing time. Help: `IntellectualProperty-Proprieteintellectuelle@forces.gc.ca`.

**What DND has said about terms:**

- The Crown copyright page **[V]** says non-commercial reproduction of ordinary Crown works needs no permission (conditions include lawful use, DAOD 7021-1, "personal or public non-commercial use or for cost-recovery use"), but insignia are always excluded. It says DND "typically grants a non-exclusive license at a 5% royalty rate on standard terms" for the licensing route. An earlier extraction also mentioned royalty-free permission for commercial use below $10,000 annual revenue with credit and a liability disclaimer; **unverified** whether that applies to insignia.
- The Heritage Manual [Section 11](https://www.canada.ca/en/services/defence/caf/military-identity-system/heritage-manual/chapter-6/section-11.html) **[E]** says only the Inspector of CAF Colours and Badges may approve commercial use of badges, that approval must be "revocable, nonexclusive" with a government copyright notice, and it does not address rank insignia.
- DND's [CADPAT licensing letter](https://www.canada.ca/content/dam/dnd-mdn/documents/2020/cadpat-licensing-policy-letter.pdf) (read in full, two pages, DMPP 8 / Intellectual Property Manager; a *camouflage pattern* policy, so a process precedent only) shows: an online application, a prototype review, a royalty-bearing licence for commercial use, and revocation "if … items … detract from the integrity and reputation of the DND/CAF". Expect revocability and a quality-review step in any insignia licence.

**Precedents and blanket permissions:** I found **none** for rank insignia, and none for cadets, museums or Wikipedia. The DND intellectual-property landing page and the Crown copyright page do not mention educational use, cadets or museums. The only related permission found is internal: Branch Advisors, regiments and COs "may grant authority to ex-service member associations or affiliated cadets corps to use their badges" **[E]** (Heritage Manual §10), which concerns unit badges and custom, not rank insignia. I found no evidence that Commons or Wikipedia holds a DND permission; their rank-insignia files are user recreations (section 3). The Crown copyright page notes a licence is required for the exclusions, so there is no faster route found.

**Ways to shape the request** (added to #178's existing checklist, not replacing it):

1. State whether Argus is non-commercial or commercial and what revenue is expected, because DND's own scheme turns on it.
2. Ask separately for (a) in-app display, (b) offline caching, (c) public-repo hosting, (d) format conversion/resizing. A narrower grant that excludes the repo is better than waiting for a full one (see fallback in section 8).
3. Ask what **revocation** looks like and how much notice is given, and plan a withdrawal path (assets removed, topics archived) before agreeing.
4. Ask whether DND would confirm in writing that text-only descriptions of rank insignia need no permission. That is a comfort letter for route A and costs one question.
5. Ask whether DHH can supply an official digital artwork pack, which would also answer the Crown-version question below.

**Does the Canadian Royal Crown replacement affect timing? Yes, but how much for rank insignia is unclear.**

- [Transition page](https://www.canada.ca/en/services/defence/caf/military-identity-system/transition-canadian-royal-crown.html) (modified 2026-01-20) **[E]**: scope includes "primary, secondary, and supplementary badges; Colours and flags, insignia, ranks, and accoutrements"; "DHH will gradually update all CAF identifiers throughout 2026 and 2027"; "St. Edward's Crown remains valid until it is officially updated with the Canadian Royal Crown. Existing insignia with St. Edward's Crown will be replaced on an attrition basis." It gives no third-party reproduction guidance.
- [July 2026 update](https://www.canada.ca/en/department-national-defence/maple-leaf/defence/2026/07/update-transition-canadian-royal-crown-caf-identifiers.html) (23 July 2026) **[E]**: the CAF primary badge and Command badges were updated and distributed in January 2026; DHH "will update the remaining 800 identifiers (Group, Formation, Branch, Corps, and Unit) throughout 2026 and 2027"; "Digital artwork featuring St. Edward's Crown remains valid until an official version incorporating the Canadian Royal Crown is released." It does **not** mention rank insignia or give availability dates.
- So the January page puts "ranks" in scope and the July list of remaining work names only other identifier families. **Whether, when and in what form the rank artwork changes is unverified.**
- Consequences: (a) the Canada.ca image URLs pinned in `cafRankRecognitionPlan.ts` may be replaced mid-process; (b) a licence granted against the 57 current URLs could be out of date within the programme's lifetime; (c) waiting for the transition to finish before applying is not warranted, because the form has no stated service standard and the wait could be long. Apply now, describe the transition, and ask that the grant cover replacement artwork (this is already on #178's checklist).

## 8. Recommendation

**Comparison of routes**

| Route | Lawful? | Effort | What it teaches | Effect on completion claim |
| --- | --- | --- | --- | --- |
| **1. DND written licence** | Yes, once granted and covering the delivery model | Form + wait (unknown) + post-licence build in #178 | Full visual recognition of the canonical exemplar | **Unchanged** |
| **1b. Licence narrowed to in-app and offline only** (no public-repo images; assets supplied through a private build step) | Yes, if DND grants it | As route 1, plus build and CI changes to keep assets out of Git | Same | Unchanged. Needs a #178 change to the repo rule |
| 2. Commons CC BY-SA / PD files | **No.** Unverifiable provenance, user recreations of Crown works, forbidden by #178 | Low technically | Visual recognition of third-party renderings of uncertain fidelity | Fails #176's "official artwork is QA authority" |
| 3. Own redraw / trace / AI image | **No.** Forbidden by #178 | Medium | Same as 2 | Same as 2 |
| 4. Fair dealing: embed official images | **Arguable, not safe.** Weak for repo and offline; untested | Low technically; counsel cost | Full visual recognition | Unchanged, but contradicts #178's hard gate |
| 5. Older public-domain artwork | Narrow and unverified; does not match current exemplars | High (per-rank first-publication evidence) | Recognition of obsolete patterns | **Must change** (obsolete, not current) |
| 6. Pictorial schematic | Uncertain, and **excluded by #178's text** | Medium | Schematic pattern | **Must change**; plain "substitute representation" |
| 7. Abstract count notation | Probably, **unverified**; needs a #178 clarification | Low–medium | Counts and devices, decoding | **Must change** to "decode" |
| 8. Text-only descriptions in Learn | Likely; allowed by #178 | Low | Decoding grammar | **Must change**; no visual claim |
| 9. Link out to Canada.ca | Yes | Trivial | Nothing in-app | No claim; conflicts with offline-first |
| 10. Learn-only explainer (no scored visuals) | Same as 8 | Low | Reading grammar, confusion families | No new scored claim |

**Recommendation: wait for the licence; ship nothing visual.** Concretely:

1. **Keep #178's gate exactly as it is.** None of the alternatives are lawful, verified and faithful at once. The honest answer to "is there another route?" is **no**, except for text-only material that teaches a different skill.
2. **Submit the licence request now**, using #178's checklist plus the additions in section 7. Do not wait for the Crown replacement to complete.
3. **Treat the licence scope as the real decision point.** If DND will not permit public-repo redistribution, the fallback is route 1b, which needs a #178 amendment before any asset enters the build.
4. **Optional, separate issue:** a text-only "how to read insignia" Learn explainer (route 10/8) under a *narrower* claim ("decode a verbal description of insignia"), with no scored visual items and no link between its items and the future visual topics. It stays lawful regardless of the licence outcome, and it does not displace #178. Decide whether it is worth it; it delivers real but different value.
5. **Do not build a pictorial schematic.** If the owner wants to pursue one, it needs an explicit #178 rule change and counsel's sign-off first.

**Proposed changes to #178 (not applied here):**

- Add a "Considered alternatives" pointer to this document (done as a one-line link in #178's header block; no rule changes).
- If the owner chooses route 1b, replace the "public GitHub repository" bullet with a licence-dependent rule.
- If the owner chooses route 7 or the optional explainer, add a sentence to the "Hard rights gate" section stating whether non-pictorial count notation is permitted.
- If the owner chooses to rely on fair dealing for any part, record it as an explicit owner override with counsel's written advice attached, not as a quiet exception.

## 9. Open questions for the owner or counsel

1. Is Argus "non-commercial" for the purposes of the Crown copyright page, the Trademarks Act "in connection with a business" test and s. 29.21? Does the owner plan any revenue (ads, subscriptions, paid sync)? This decides much of sections 4 and 5.
2. Does fair dealing (s. 29) or s. 29.21 plausibly support each of: in-app display, public-repo hosting, offline caching, resizing and format conversion of the 57 insignia? If counsel says yes to some, does the owner want to override #178's gate for those, given the parallel licence request?
3. Would counsel treat an independent redrawing from the Dress Instructions specification (not from the official rendering) as a reproduction of a substantial part of the official artwork, given DND's position that adapting or modifying always needs permission?
4. Are CAF rank insignia the subject of official-mark notices under Trademarks Act s. 9(1)(n)(iii), or in the Public Register of Arms, Flags and Badges? (I did not search either register.)
5. Does NDA s. 291 ("in any advertising or in any trade or service", after a written Minister request) reach a free educational app? Practical risk: the owner is asking DND for a licence, so DND is a likely first reader.
6. Does describing insignia in words engage DND's "revised, adapted, modified, translated" language? Will DND confirm in writing that text-only descriptions are acceptable?
7. Which DND office decides an insignia licence (Crown copyright / IP Manager, DMPP 8, or the Inspector of CAF Colours and Badges / DHH), and what is the realistic timeline? The form states no service standard.
8. Will any licence cover Canadian Royal Crown replacement artwork automatically? Will rank insignia be replaced in 2026–27, and when? (DND's July 2026 update does not say.)
9. If the licence is revocable, what must Argus do on revocation (remove assets from the build, from caches, from offline devices), and is that acceptable?
10. Does the owner want the optional text-only explainer, or does it risk teaching decoding without recognition and delaying the visual topics?
11. Jurisdiction: Argus is distributed through a public GitHub repo and a public PWA, so non-Canadian law may also apply to what is copied and where. Counsel may want to address this.

## 10. Source ledger

All retrieved 2026-10-06. **[V]** consistent across two fetches or statute text; **[E]** single extraction, re-read before relying; **[C]** Commons API metadata.

| # | URL | Used for | Key quote |
| --- | --- | --- | --- |
| 1 | https://www.canada.ca/en/department-national-defence/corporate/intellectual-property/crown-copyright.html (modified 2022-07-22) | DND exclusion, adaptation, licence **[V]** | "You **always** need permission when the Work is being: revised, adapted, modified, translated"; exclusions "Canadian Armed Forces badges, crests, flags and insignia"; "it typically grants a non-exclusive license at a 5% royalty rate on standard terms" |
| 2 | https://www.canada.ca/en/department-national-defence/corporate/intellectual-property/apply-crown-copyright-permission.html (2023-10-30) | Application route **[E]** | "Use this form to apply for permission to publish or alter Crown Copyright works managed by the Department of National Defence (DND) only." |
| 3 | https://laws-lois.justice.gc.ca/eng/acts/c-42/section-12.html (current to 2026-09-21) | Crown copyright term **[V]** | "…for the remainder of the calendar year of the first publication of the work and for a period of fifty years following the end of that calendar year." |
| 4 | https://laws-lois.justice.gc.ca/eng/acts/c-42/section-29.html | Fair dealing **[V]** | "Fair dealing for the purpose of research, private study, education, parody or satire does not infringe copyright." |
| 5 | https://laws-lois.justice.gc.ca/eng/acts/c-42/section-29.4.html | Educational institutions **[E]** | "…for an educational institution or a person acting under its authority for the purposes of education or training on its premises to reproduce a work, or do any other necessary act, in order to display it." |
| 6 | https://laws-lois.justice.gc.ca/eng/acts/c-42/section-29.21.html | UGC **[E]** | "…done solely for non-commercial purposes" |
| 7 | https://laws-lois.justice.gc.ca/eng/acts/T-13/section-9.html, https://laws-lois.justice.gc.ca/eng/acts/T-13/section-11.html | Official marks **[V]** | s. 9(1)(n) and s. 11 as quoted in section 5 |
| 8 | https://laws-lois.justice.gc.ca/eng/acts/N-5/section-291.html | NDA s. 291 **[V]** | As quoted in section 5 |
| 9 | https://laws-lois.justice.gc.ca/eng/acts/C-46/section-419.html | Criminal Code s. 419 **[V]** | "Every person is guilty of an offence punishable on summary conviction who, without lawful authority, (a) wears a uniform of the Canadian Forces…" |
| 10 | https://www.canada.ca/en/services/defence/caf/military-identity-system/heritage-manual/chapter-6/section-10.html, …/section-11.html, …/section-3.html (2023-08-30) | Badge regime, insignia definition **[E]** | "All badges and other insignia are recorded in the Public Register of Arms, Flags and Badges of Canada and cannot be used without authorization"; "Only the Inspector of CAF Colours and Badges is authorized to approve the use of badges for commercial purposes"; "revocable, nonexclusive" |
| 11 | https://www.canada.ca/en/services/defence/caf/military-identity-system/dress-manual/chapter-3/section-2.html (2024-02-01) | Text of insignia description **[E]** | "Army officers' rank will consist of a combination of two devices in numbers and order as outlined in Annex A." |
| 12 | https://www.canada.ca/en/transparency/terms.html (2025-09-05) | Site terms **[E]** | "The official symbols of the Government of Canada … may not be reproduced, whether for commercial or non-commercial purposes, without prior written authorization" |
| 13 | https://open.canada.ca/en/open-government-licence-canada; https://donnees.iriu.ca/dataset/a503f0de-b081-4b8f-ae69-651f8c95d676; https://open.canada.ca/data/dataset/a503f0de-b081-4b8f-ae69-651f8c95d676 | OGL exclusions; text dataset **[E]** | "the names, crests, logos, or other official symbols of the Information Provider"; CSV header "Ranks,Royal Canadian Navy,Canadian Army / Royal Canadian Air Force" |
| 14 | https://www.canada.ca/en/services/defence/caf/military-identity-system/transition-canadian-royal-crown.html (2026-01-20); https://www.canada.ca/en/department-national-defence/maple-leaf/defence/2026/07/update-transition-canadian-royal-crown-caf-identifiers.html (2026-07-23) | Crown transition **[E]** | Quoted in section 7 |
| 15 | https://www.canada.ca/content/dam/dnd-mdn/documents/2020/cadpat-licensing-policy-letter.pdf | DND licensing process precedent (read in full) | "In conjunction with DLR's approval and letter, DMPP 8 will issue a royalty-bearing license."; revocation clause as in section 7 |
| 16 | https://commons.wikimedia.org/w/api.php (categories under *Military rank insignia of Canada*) | Licence counts and per-file licence and credit **[C]** | Counts in section 3.1 |
| 17 | https://commons.wikimedia.org/wiki/File:LSeaman.jpg, https://commons.wikimedia.org/wiki/File:Can-Capt-Capv-2010-OF5.png, https://commons.wikimedia.org/wiki/File:Canada-Army-OR-7_(service).svg, https://commons.wikimedia.org/wiki/File:Canada_ARMY_Insignia_0.png | Per-file basis **[E]** | "I grant anyone the right to use this work for any purpose, without any conditions, unless such conditions are required by law."; "Licensed under Creative Commons Attribution-Share Alike 4.0" |
| 18 | https://commons.wikimedia.org/wiki/Commons:Licensing, https://commons.wikimedia.org/wiki/Commons:Derivative_works, https://commons.wikimedia.org/wiki/Commons:Copyright_rules_by_territory/Canada | Commons policy **[E]** | Quoted in section 3.2 and 3.3 |
| 19 | https://en.wikipedia.org/wiki/CCH_Canadian_Ltd_v_Law_Society_of_Upper_Canada and other case summaries (search results only) | Fair-dealing framework | Case holdings summarised, not read in full |
