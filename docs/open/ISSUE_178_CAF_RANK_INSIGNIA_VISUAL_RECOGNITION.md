# Issue #178 — CAF rank-insignia visual recognition programme

**Status:** licence-safe preparation implemented; all insignia reproduction and runtime delivery remain blocked pending written DND/CAF permission.  
**Issue:** #178  
**Research authority:** #176 / `docs/open/ISSUE_176_CAF_RANKS_INSIGNIA.md` (currently staged by PR #179 at the time this work began)  
**Shared visual capability:** #146 / `docs/open/ISSUE_146_VISUAL_CONTENT_PRIMITIVES.md`  
**Machine-readable preparation:** `src/domain/military/cafRankRecognitionPlan.ts`  
**Verified:** 2026-10-06 against current Canada.ca rank pages, Dress Instructions and DND/CAF intellectual-property guidance.

## Decision

The programme remains approved exactly as specified by #176:

1. Canadian Army rank-insignia recognition — 19 canonical visual-choice items;
2. Royal Canadian Navy rank-insignia recognition — 19 canonical visual-choice items;
3. Royal Canadian Air Force rank-insignia recognition — 19 canonical visual-choice items.

The completion claim remains visual recognition of the one canonical current service-dress exemplar actually shipped for each practical level. It does not expand to every order of dress, operational colourway, historical pattern or senior appointment badge.

No insignia artwork is present in this branch. No remote official image is used as a runtime `Visual`. No visual topic is registered in the catalog while the rights gate is closed.

## Hard rights gate

DND/CAF's Crown copyright guidance expressly excludes **Canadian Armed Forces badges, crests, flags and insignia** from the page's automatic reproduction permission and directs users to apply for a licence. The same guidance also requires permission when a protected work is revised, adapted or modified.

That blocks all of the following until the written licence says they are permitted:

- downloading an official rank-insignia image into this repository;
- copying or embedding the image into the public PWA;
- cropping, resizing, recolouring, converting or otherwise transforming it;
- tracing or redrawing it;
- generating a substitute representation of the insignia;
- distributing source or optimized copies through the public GitHub repository;
- shipping offline-cached copies in Argus.

The preparation module therefore records only textual metadata and official source URLs.

## Canonical source decision

### Canadian Army

Use the current official **Canadian Army ranks and badges** page as the per-rank production source after permission. Its 19 core rank/appointment images correspond to the #176 practical ladder.

Dress authority:

- officer levels 1–11: Figure 3-2-1, Army Officer's Rank Insignia;
- NCM/appointment levels 12–19: Figure 3-2-6, Army NCM Rank and Appointment Insignia.

Do not use the separate general-officer or colonel gorget images as scored targets. They are dress accoutrements, not the chosen canonical rank exemplar.

### Royal Canadian Navy

Use the current official **Royal Canadian Navy ranks and badges** page.

For the four flag-officer levels, choose the page's **sleeve-lacing** images rather than the alternate shoulder-board images. This keeps the officer set in one coherent service-dress visual family: the Dress Instructions specify Navy officer sleeve lace for the No. 3 service-dress jacket and Figure 3-2-3 controls the officer pattern.

Dress authority:

- officer levels 1–11: Figure 3-2-3, Navy Officer's Rank Insignia;
- NCM/appointment levels 12–19: Figure 3-2-7, Naval NCM Rank and Appointment Insignia.

The current page still uses legacy filenames/near-image labels for the junior Navy assets (`master-seaman`, `leading-seaman`, `able-seaman`, `ordinary-seaman`). Learner-facing answers remain the current terms fixed by #176: **Master Sailor, Sailor 1st Class, Sailor 2nd Class, Sailor 3rd Class**. The source filename is provenance, not learner-facing nomenclature.

### Royal Canadian Air Force

Use the current official **Royal Canadian Air Force ranks and badges** page for all 19 canonical images.

Dress authority:

- officer levels 1–11: Figure 3-2-5, Air Force Officer's Rank Insignia;
- NCM/appointment levels 12–19: Figure 3-2-8, Air Force NCM Rank and Appointment Insignia.

## 57-item source inventory

The exact full Canada.ca image URLs, item IDs, answer labels, abbreviations, Dress Instruction figures and authored options are pinned in `cafRankRecognitionPlan.ts` and covered by tests.

### Army — 19

| Level | Answer | Official asset filename | Normal confusion set |
| ---: | --- | --- | --- |
| 1 | General | `army-general.png` | Gen / LGen / MGen / BGen |
| 2 | Lieutenant-General | `army-lieutenant-general.png` | Gen / LGen / MGen / BGen |
| 3 | Major-General | `army-major-general.png` | Gen / LGen / MGen / BGen |
| 4 | Brigadier-General | `army-brigadier-general.png` | Gen / LGen / MGen / BGen |
| 5 | Colonel | `army-colonel.png` | Col / LCol / Maj |
| 6 | Lieutenant-Colonel | `army-lieutenant-colonel.png` | Col / LCol / Maj |
| 7 | Major | `army-major.png` | Col / LCol / Maj |
| 8 | Captain | `army-captain.png` | Capt / Lt / 2Lt |
| 9 | Lieutenant | `army-lieutenant.png` | Capt / Lt / 2Lt |
| 10 | Second Lieutenant | `army-lieutenant-2.png` | Capt / Lt / 2Lt / OCdt |
| 11 | Officer Cadet | `army-officer-cadet.png` | OCdt / 2Lt / Lt |
| 12 | Chief Warrant Officer | `army-senior-chief-warrant-officer.png` | CWO / MWO / WO / Sgt |
| 13 | Master Warrant Officer | `army-master-warrant-officer.png` | CWO / MWO / WO / Sgt |
| 14 | Warrant Officer | `army-warrant-officer.png` | CWO / MWO / WO / Sgt |
| 15 | Sergeant | `army-sergeant.png` | CWO / MWO / WO / Sgt |
| 16 | Master Corporal | `army-master-corporal.png` | MCpl / Cpl / Pte(T) / Pte(B) |
| 17 | Corporal | `army-corporal.png` | MCpl / Cpl / Pte(T) / Pte(B) |
| 18 | Private (Trained) | `army-private.png` | MCpl / Cpl / Pte(T) / Pte(B) |
| 19 | Private (Basic) | `army-private-basic.png` | MCpl / Cpl / Pte(T) / Pte(B) |

### RCN — 19

| Level | Answer | Official asset filename | Normal confusion set |
| ---: | --- | --- | --- |
| 1 | Admiral | `navy-admiral-sleeve.png` | Adm / VAdm / RAdm / Cmdre |
| 2 | Vice-Admiral | `navy-vice-admiral-sleeve.png` | Adm / VAdm / RAdm / Cmdre |
| 3 | Rear-Admiral | `navy-rear-admiral-sleeve.png` | Adm / VAdm / RAdm / Cmdre |
| 4 | Commodore | `navy-commodore-sleeve.png` | Adm / VAdm / RAdm / Cmdre |
| 5 | Captain(N) | `navy-captain.png` | Capt(N) / Cdr / LCdr |
| 6 | Commander | `navy-commander.png` | Capt(N) / Cdr / LCdr |
| 7 | Lieutenant-Commander | `navy-lieutenant-commander.png` | Capt(N) / Cdr / LCdr |
| 8 | Lieutenant(N) | `navy-lieutenant.png` | Lt(N) / SLt / A/SLt / NCdt |
| 9 | Sub-Lieutenant | `navy-sub-lieutenant.png` | Lt(N) / SLt / A/SLt / NCdt |
| 10 | Acting Sub-Lieutenant | `navy-acting-sub-lieutenant.png` | Lt(N) / SLt / A/SLt / NCdt |
| 11 | Naval Cadet | `navy-naval-cadet.png` | Lt(N) / SLt / A/SLt / NCdt |
| 12 | Chief Petty Officer 1st Class | `navy-chief-petty-officer-1.png` | CPO1 / CPO2 / PO1 / PO2 |
| 13 | Chief Petty Officer 2nd Class | `navy-chief-petty-officer-2.png` | CPO1 / CPO2 / PO1 / PO2 |
| 14 | Petty Officer 1st Class | `navy-petty-officer-1.png` | CPO1 / CPO2 / PO1 / PO2 |
| 15 | Petty Officer 2nd Class | `navy-petty-officer-2.png` | CPO1 / CPO2 / PO1 / PO2 |
| 16 | Master Sailor | `navy-master-seaman.png` | MS / S1 / S2 / S3 |
| 17 | Sailor 1st Class | `navy-leading-seaman.png` | MS / S1 / S2 / S3 |
| 18 | Sailor 2nd Class | `navy-able-seaman.png` | MS / S1 / S2 / S3 |
| 19 | Sailor 3rd Class | `navy-ordinary-seaman.png` | MS / S1 / S2 / S3 |

### RCAF — 19

| Level | Answer | Official asset filename | Normal confusion set |
| ---: | --- | --- | --- |
| 1 | General | `air-general.png` | Gen / LGen / MGen / BGen |
| 2 | Lieutenant-General | `air-lieutenant-general.png` | Gen / LGen / MGen / BGen |
| 3 | Major-General | `air-major-general.png` | Gen / LGen / MGen / BGen |
| 4 | Brigadier-General | `air-brigadier-general.png` | Gen / LGen / MGen / BGen |
| 5 | Colonel | `air-colonel.png` | Col / LCol / Maj |
| 6 | Lieutenant-Colonel | `air-lieutenant-colonel.png` | Col / LCol / Maj |
| 7 | Major | `air-major.png` | Col / LCol / Maj |
| 8 | Captain | `air-captain.png` | Capt / Lt / 2Lt / OCdt |
| 9 | Lieutenant | `air-lieutenant.png` | Capt / Lt / 2Lt / OCdt |
| 10 | Second Lieutenant | `air-lieutenant-2.png` | Capt / Lt / 2Lt / OCdt |
| 11 | Officer Cadet | `air-officer-cadet.png` | Capt / Lt / 2Lt / OCdt |
| 12 | Chief Warrant Officer | `air-senior-chief-warrant-officer.png` | CWO / MWO / WO / Sgt |
| 13 | Master Warrant Officer | `air-master-warrant-officer.png` | CWO / MWO / WO / Sgt |
| 14 | Warrant Officer | `air-warrant-officer.png` | CWO / MWO / WO / Sgt |
| 15 | Sergeant | `air-sergeant.png` | CWO / MWO / WO / Sgt |
| 16 | Master Corporal | `air-master-corporal.png` | MCpl / Cpl / Avr(T) / Avr(B) |
| 17 | Corporal | `air-corporal.png` | MCpl / Cpl / Avr(T) / Avr(B) |
| 18 | Aviator (Trained) | `air-aviator.png` | MCpl / Cpl / Avr(T) / Avr(B) |
| 19 | Aviator (Basic) | `air-aviator-basic.png` | MCpl / Cpl / Avr(T) / Avr(B) |

## Accessibility contract

The completion claim is explicitly visual, so a scored image's alternative text must not identify the answer. The prepared item text uses the service name and says that a service-dress rank insignia is shown for identification while omitting the rank name.

Do not add a hidden textual device description that effectively turns the scored visual task into a text clue. Learn material may describe discriminating visual features outside the scored question.

## Canadian Royal Crown transition

The current official rank-page artwork still contains St. Edward's Crown in places. DND/CAF's current transition guidance says existing identifiers using St. Edward's Crown remain valid until officially updated, with replacement occurring gradually, and says DHH is updating identifiers through 2026–2027.

Consequences for #178:

- the current rank pages are valid official visual references as of the verification date;
- they are not safe to freeze as a permanent asset baseline while the transition is active;
- immediately after permission arrives, re-open all three official rank pages and the Dress Instructions before downloading anything;
- if DHH has replaced any canonical rank artwork, update this inventory to the new official asset before production;
- record which Crown version the licence covers and whether later DHH replacements are automatically covered or require renewed permission.

## Exact owner-side licence request

Use DND's **Apply for Crown copyright permission** form and make the proposed use explicit. The request should identify:

- applicant/organization details accurately;
- purpose: reproduction of current CAF rank-insignia artwork for an educational visual-recognition programme;
- product: the public Argus PWA and its public GitHub source repository;
- distribution: local/offline copies bundled with the PWA plus public repository distribution if DND permits it;
- source works: the three official rank pages above, the 57 exact image URLs recorded in `cafRankRecognitionPlan.ts`, and Dress Instruction Figures 3-2-1, 3-2-3, 3-2-5, 3-2-6, 3-2-7 and 3-2-8;
- intended transformations: resize, crop/pad only if needed for consistent cards, and PNG-to-WebP/AVIF or other web format conversion;
- whether any unmodified archival originals may be retained and where;
- whether public redistribution of originals or derivatives in GitHub is permitted;
- required attribution/credit wording;
- required non-affiliation/non-endorsement wording;
- any limits by term, territory, platform, revenue/commercial status or revocation;
- whether permission automatically covers DHH's Canadian Royal Crown replacements during the current transition.

Do not treat a generic approval to "use images on a website" as sufficient if it does not address the public repository and transformations. The production gate opens only when the written terms clearly cover the actual delivery model.

DND's current contact for help with the form is the Intellectual Property Manager at `IntellectualProperty-Proprieteintellectuelle@forces.gc.ca`.

## Provenance record required after licence

Create one provenance row per production asset with at least:

- stable Argus `assetId`;
- service and practical level;
- learner-facing answer and abbreviation;
- exact official source-page URL;
- exact official source-asset URL;
- controlling Dress Instruction figure;
- retrieval date;
- source file hash before any permitted transformation;
- licence/permission reference and date;
- exact permitted-use summary;
- attribution text;
- permitted derivative operations;
- production path;
- production file dimensions/format;
- production SHA-256;
- human visual QA reviewer/date;
- Crown-version note where relevant.

No row may be marked production-ready merely because the source is official.

## Implementation-ready vs blocked

### Ready now

- exact three-topic boundary: 19 + 19 + 19;
- exact canonical source URL for every item;
- one canonical service-dress visual family per service;
- exact Dress Instruction figure authority;
- current learner-facing names and abbreviations;
- nearby-rank distractor/options for every item;
- stable planned item IDs;
- non-revealing alt-text policy;
- metadata-only tests that prevent accidental rights-gate erosion;
- owner licence request checklist.

### Blocked until written permission

- any local CAF insignia file;
- any `Visual.source.kind === 'image'` stimulus using the official artwork;
- asset hashes for production copies;
- image credits derived from the final licence;
- three runtime `Topic` objects;
- catalog/manifest registration;
- offline caching of insignia;
- Learn comparison images;
- phone-size visual QA of production assets;
- browser tests that depend on the real insignia.

## Post-licence implementation sequence

1. Record the written permission and its exact scope.
2. Revalidate all three official rank pages because of the active Canadian Royal Crown transition.
3. Update the 57-source inventory if DHH has changed any asset.
4. Download only the works the licence permits.
5. Apply only explicitly permitted transformations.
6. Build the provenance ledger and source/production SHA-256 hashes.
7. Add local `/media/caf-ranks/` assets and real `Visual` stimuli.
8. Build three separate 19-item topics using the #146 objective visual-choice primitive.
9. Add Learn comparison material around the same confusion sets without widening the completion claim.
10. Run unit/parser/catalog tests plus 320 px, 390 px, short-landscape and desktop browser QA.
11. Merge only when rights, visual accuracy, source provenance and phone-scale readability are all green.
