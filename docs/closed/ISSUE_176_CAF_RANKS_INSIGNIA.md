# Issue #176 — Canadian Armed Forces ranks and insignia programme

**Status:** research complete and merged via PR #179; #177 shipped via PR #180; #178 remains rights-gated.  
**Issue:** #176  
**Priority:** P0 foundation; P0 visual work once DND/CAF reproduction permission is secured  
**Research method:** `docs/LIBRARY_RESEARCH_METHOD.md`

## 1. Decision summary

Build this programme.

Canadian Armed Forces ranks and insignia are an unusually strong Argus fit: the factual inventory is finite, the hierarchy and service designations are owned by authoritative Canadian sources, the recognition task is objective, and Argus already has the visual-choice primitive required for phone-sized insignia tests.

Do **not** describe the programme as “19 CAF ranks”. The practical recognition ladder contains nineteen displayed levels in each environmental uniform, but those levels mix:

- seventeen statutory ranks from QR&O 3.01;
- the Master Corporal / Master Sailor appointment above Corporal / Sailor 1st Class;
- Basic/Trained junior classifications within the Private/Aviator level and the corresponding RCN Sailor 3rd/2nd Class designations.

The first programme should therefore teach **rank hierarchy, service designation and standard rank/appointment insignia** while explicitly explaining which labels are appointments or classifications rather than distinct substantive ranks.

### Build decision

1. **CAF rank hierarchy & equivalencies** — build now as a text/structured topic.
2. **Canadian Army rank-insignia recognition** — approved, but production assets are blocked until DND/CAF grants a licence to reproduce CAF insignia.
3. **Royal Canadian Navy rank-insignia recognition** — same.
4. **Royal Canadian Air Force rank-insignia recognition** — same.
5. **CANSOFCOM rank-insignia recognition** — defer to a later extension. Its rank names duplicate the Army/RCAF structure and it adds another licensed visual set before the core three-environment programme has proved useful.

Official DND/CAF artwork is the preferred production source if licensed. AI-generated insignia are rejected: small symbolic errors would directly teach the wrong answer, and redrawing a protected CAF insignia does not solve the trademark/licensing problem.

## 2. Proposed programme and sequence

### A. CAF rank hierarchy & equivalencies — P0, build now

**Completion claim:** after completing the topic, the learner can map the nineteen current practical Army/RCAF recognition levels to their Royal Canadian Navy equivalents in both directions, including the MCpl/MS appointment and the Basic/Trained junior distinctions.

This topic teaches the cross-environment structure before visual memorization. It is not a drill on dress-placement rules or every Army regimental title.

### B. Canadian Army rank insignia — P0, licence-gated

**Completion claim:** given one canonical current Canadian Army service-dress rank or appointment insignia from the approved production set, the learner can identify the represented rank/appointment level among plausible nearby alternatives.

Expected scored set: 19 canonical exemplars.

### C. Royal Canadian Navy rank insignia — P0, licence-gated

Same claim, using one canonical current RCN insignia representation per practical recognition level.

Expected scored set: 19 canonical exemplars.

### D. Royal Canadian Air Force rank insignia — P0, licence-gated

Same claim for RCAF insignia.

Expected scored set: 19 canonical exemplars.

### E. CANSOFCOM — P1 extension

Research authority exists on Canada.ca and the Dress Instructions include CANSOFCOM NCM insignia. Defer until the three core environmental topics ship and the owner still wants the added visual set.

## 3. Completion claims and explicit exclusions

The programme may claim:

- current standard rank/designation equivalence across Army/RCAF and RCN;
- recognition of the canonical service-dress insignia exemplars actually shipped;
- awareness that MCpl/MS is an appointment rather than a substantive rank;
- awareness that Basic/Trained labels at the junior level are classifications/designations rather than additional statutory ranks.

The programme does **not** claim:

- command qualification, leadership competence or military experience;
- recognition of every order of dress, field/operational colourway or historical pattern;
- every Army corps/regimental designation such as Gunner, Sapper, Trooper, Guardsman, Rifleman, etc.;
- specialist, occupation, flying, qualification, branch, cap, unit or trade badges;
- honorary ranks or honorary appointments;
- senior CWO/CPO1 employment-level appointment badges beyond the base rank set;
- drum-major, pipe-major or trumpet/bugle-major appointment badges;
- gorget patches as standalone rank-recognition targets;
- historical RCN junior-rank terminology as a separate memorization set;
- CANSOFCOM visual recognition in v1.

## 4. Authority and source hierarchy

### Controlling rank authority

**QR&O Volume I, Chapter 3, article 3.01**  
https://www.canada.ca/en/department-national-defence/corporate/policies-standards/queens-regulations-orders/vol-1-administration/ch-3-rank-seniority-command-precedence.html

Use this for the statutory rank ladder and formal environmental designations. It enumerates 17 ranks and maps them to naval, army and air-force designations.

**QR&O 3.08 — Master Corporal Appointment**  
Same source. It states that a Master Corporal remains substantively a Corporal, while holding authority over other Corporals.

### Current personnel/nomenclature authority

**CAFMPI 01/26 — Promotion and other rank changes**  
https://www.canada.ca/en/department-national-defence/corporate/policies-standards/canadian-forces-military-personnel-instructions/promotion-and-other-rank-changes.html

Use this for current operational terminology and the appointment distinction. It explicitly treats Cpl/S1 as the underlying rank, MCpl/MS as an appointment, and uses the current Sailor 1st/2nd/3rd Class and Master Sailor nomenclature.

### Visual authority

**CAF Dress Instructions, Chapter 3, Section 2 — Rank insignia and appointment badges**  
https://www.canada.ca/en/services/defence/caf/military-identity-system/dress-manual/chapter-3/section-2.html

**Annex A — Rank insignia and appointment badges**  
https://www.canada.ca/en/services/defence/caf/military-identity-system/dress-manual/chapter-3/annex-a.html

These own the form and wear of Army, Navy, Air Force and CANSOFCOM rank insignia.

### Service reference pages

- CAF rank overview: https://www.canada.ca/en/services/defence/caf/military-identity-system/rank-appointment-insignia.html
- Army ranks: https://www.canada.ca/en/services/defence/caf/military-identity-system/army-ranks.html
- RCN ranks: https://www.canada.ca/en/services/defence/caf/military-identity-system/navy-ranks.html
- RCAF ranks: https://www.canada.ca/en/services/defence/caf/military-identity-system/air-force-ranks.html
- CANSOFCOM ranks: https://www.canada.ca/en/services/defence/caf/military-identity-system/cansofcom-ranks.html

### Rights authority

**DND/CAF Crown copyright protected works**  
https://www.canada.ca/en/department-national-defence/corporate/intellectual-property/crown-copyright.html

This is a hard implementation constraint. DND/CAF explicitly excludes Canadian Armed Forces badges, crests, flags and insignia from the general reproduction permission and says a licence is required. The visual topics must not package, crop, trace, redraw or otherwise reproduce rank-insignia artwork until the required permission is granted.

## 5. Claim ledger

| Claim / item family | Authority | Scored? | Notes |
| --- | --- | --- | --- |
| CAF has 17 statutory ranks in the NDA/QR&O ladder | QR&O 3.01 | foundation structure | Do not inflate this to 19 statutory ranks. |
| RCN has distinct naval designations for the common hierarchy | QR&O 3.01 | yes | Current junior nomenclature needs CAFMPI/current RCN treatment below. |
| MCpl/MS is an appointment; underlying rank remains Cpl/S1 | QR&O 3.08; CAFMPI 01/26 | yes, as an equivalency level | Teach the distinction explicitly. |
| Current RCN junior nomenclature is Master Sailor, Sailor 1st/2nd/3rd Class | CAF rank pages; CAFMPI 01/26 | yes | QR&O HTML table still shows legacy seaman labels; current operational terminology wins in learner-facing copy, with a limitation note. |
| Private/Aviator Basic and Trained are displayed separately in current rank references | Army/RCAF rank pages; CAFMPI 01/26 | yes, practical recognition level | They do not create extra statutory ranks. |
| Army officer insignia patterns use stars/crowns and general-officer devices | CAF Dress Instructions §3-2 | visual | Official artwork is QA authority. |
| RCAF officer rank is carried by defined braid patterns | CAF Dress Instructions §3-2 | visual | Use canonical approved exemplar only in v1. |
| RCN officer rank is represented through authorized naval lace/shoulder-board patterns | CAF Dress Instructions §3-2 and Annex A | visual | Choose one canonical production representation per rank. |
| NCM rank/appointment insignia are defined by Figures 3-2-6 to 3-2-8 | CAF Dress Instructions §3-2 | visual | Canonical service-dress set only in v1. |
| CAF insignia reproduction requires a DND/CAF licence | DND/CAF IP guidance | implementation gate | No local assets before written permission. |

## 6. Content specification

### 6.1 Foundation scored boundary

Use **19 equivalency pairs expressed as 38 ordinary directional scored prompts**: one Army/RCAF → RCN prompt and one RCN → Army/RCAF prompt per pair. Argus reserves `bidirectional` evidence for the Morse acquisition ladder, so this topic must not widen that architecture merely to reverse ordinary recall cards.

| Level | Army | RCAF | RCN current learner-facing designation | Status note |
| ---: | --- | --- | --- | --- |
| 1 | General | General | Admiral | statutory rank |
| 2 | Lieutenant-General | Lieutenant-General | Vice-Admiral | statutory rank |
| 3 | Major-General | Major-General | Rear-Admiral | statutory rank |
| 4 | Brigadier-General | Brigadier-General | Commodore | statutory rank |
| 5 | Colonel | Colonel | Captain(N) | statutory rank |
| 6 | Lieutenant-Colonel | Lieutenant-Colonel | Commander | statutory rank |
| 7 | Major | Major | Lieutenant-Commander | statutory rank |
| 8 | Captain | Captain | Lieutenant(N) | statutory rank |
| 9 | Lieutenant | Lieutenant | Sub-Lieutenant | statutory rank |
| 10 | Second Lieutenant | Second Lieutenant | Acting Sub-Lieutenant | statutory rank |
| 11 | Officer Cadet | Officer Cadet | Naval Cadet | statutory rank |
| 12 | Chief Warrant Officer | Chief Warrant Officer | Chief Petty Officer 1st Class | statutory rank |
| 13 | Master Warrant Officer | Master Warrant Officer | Chief Petty Officer 2nd Class | statutory rank |
| 14 | Warrant Officer | Warrant Officer | Petty Officer 1st Class | statutory rank |
| 15 | Sergeant | Sergeant | Petty Officer 2nd Class | statutory rank |
| 16 | Master Corporal | Master Corporal | Master Sailor | **appointment** above Cpl/S1 |
| 17 | Corporal | Corporal | Sailor 1st Class | underlying statutory Corporal level |
| 18 | Private (Trained) | Aviator (Trained) | Sailor 2nd Class | practical junior classification/designation |
| 19 | Private (Basic) | Aviator (Basic) | Sailor 3rd Class | practical junior classification/designation |

For levels 1–17 the item can display the Army/RCAF term together when identical. Levels 18–19 must show Army and RCAF separately.

Do not create separate scored items for abbreviations in v1. Show abbreviations in Learn/reference copy and in answer labels where compact enough; recognition of the abbreviation itself is not part of the completion claim.

### 6.2 Learn-only support

Keep this compact:

- one table showing the nineteen practical levels in descending order;
- a short note explaining that QR&O has 17 statutory ranks, while the practical 19-level table inserts MCpl/MS and splits the single Private/Aviator rank into Basic/Trained presentations;
- one note on current RCN Sailor terminology versus the still-unamended QR&O table;
- officer / senior NCM / junior NCM grouping;
- source and limitations modal using the existing compact-topic pattern.

### 6.3 Visual scored boundaries

Each service topic uses **19 visual-choice items**, one per level above.

Each item:

- shows one canonical licensed official insignia exemplar;
- asks for the rank/appointment designation;
- provides 3–4 plausible choices;
- keeps the correct answer and distractors inside the closest meaningful confusion family;
- does not rely on colour alone where shape/pattern can distinguish the answer;
- has non-revealing alt text because the claimed competence is explicitly visual.

### 6.4 Confusion sets

Use these families for distractors and Learn comparison:

**Army**
- Gen / LGen / MGen / BGen
- Col / LCol / Maj
- Capt / Lt / 2Lt
- OCdt / 2Lt
- CWO / MWO / WO / Sgt
- MCpl / Cpl / Pte(T) / Pte(B)

**RCN**
- Adm / VAdm / RAdm / Cmdre
- Capt(N) / Cdr / LCdr
- Lt(N) / SLt / A/SLt / NCdt
- CPO1 / CPO2 / PO1 / PO2
- MS / S1 / S2 / S3

**RCAF**
- Gen / LGen / MGen / BGen
- Col / LCol / Maj
- Capt / Lt / 2Lt / OCdt
- CWO / MWO / WO / Sgt
- MCpl / Cpl / Avr(T) / Avr(B)

Avoid obviously impossible cross-family distractors in normal acquisition. A later mixed review may sample across the full service once the learner has already acquired the families.

## 7. Medium and asset plan

### Foundation

Existing ordinary text-item machinery is sufficient. No new runtime primitive. Both directions are authored explicitly so ordinary Test/evidence semantics remain honest.

### Visual topics

Existing #146 `Visual` + choice stimulus is sufficient. No new visual renderer is required.

Preferred asset workflow after permission:

1. obtain written DND/CAF permission/licence specifically covering use of current rank insignia in the public Argus PWA and public GitHub repository;
2. record exact permitted source works, alteration/cropping terms, attribution wording and any platform/revenue restrictions;
3. download the highest-quality official source for each canonical exemplar;
4. preserve an unaltered archival copy outside production if the licence permits;
5. create only transformations explicitly permitted by the licence;
6. package phone-optimized local assets under a dedicated `public/media/caf-ranks/` path;
7. maintain provenance including original URL, source figure/page, licence evidence, permitted derivative treatment and asset hash.

Until the licence exists, official images may be consulted for research/QA but must not be copied into the repository.

### Why not synthetic insignia

Rank insignia themselves are the protected identifiers and the scored fact. Redrawing or AI-generating them is both less accurate and not a credible workaround for the DND/CAF licensing restriction.

## 8. Product and engineering implications

No architecture work is required for the foundation topic.

The visual topics reuse:

- local media;
- `Visual` stimuli;
- objectively graded choices;
- existing catalog reconciliation;
- existing Learn visual blocks and source/limitations modal.

Potential implementation detail: keep programme data in a small dedicated module such as `src/domain/military/cafRanks.ts` rather than further expanding `catalogSeed.ts`. The module can export the foundation topic now and later export service visual topics once assets are licensed.

The public shipped-catalog manifest must be updated only for topics that actually land.

## 9. QA and validation plan

### Foundation

- pin the 19-level inventory and order;
- assert every equivalency row is unique;
- assert MCpl/MS is labelled as an appointment in Learn material;
- assert the completion scope does not claim 19 statutory ranks;
- assert current RCN terms S1/S2/S3/MS are used learner-facing;
- source-review every mapping against QR&O/CAFMPI;
- browser check at supported phone widths.

### Visual topics

- licence/provenance gate must pass before any asset enters Git;
- verify each asset against the controlling Dress Instruction/service rank page;
- test every stimulus at actual phone card size, not only full resolution;
- choices must remain within the specified confusion family unless deliberately running mixed review;
- alt text must describe the stimulus without naming the answer;
- inspect greyscale/contrast where colour could otherwise leak the key;
- representative browser tests at 320 px, 390 px, short landscape and desktop;
- full `npm run check` before merge.

## 10. Risks and unresolved questions

### Hard blocker: insignia reproduction rights

This is not a general Crown-copyright “non-commercial use is fine” case. DND/CAF identifies CAF badges, crests, flags and insignia as an exemption requiring a licence. Visual implementation cannot proceed until permission is secured.

Recommended owner-side action: submit the DND/CAF licence form or contact the DND Intellectual Property office and describe Argus as a public, educational PWA plus public source repository, requesting permission to reproduce the official current rank-insignia artwork for non-endorsed educational recognition training. Ask explicitly about cropping/resizing/format conversion and repository distribution.

### RCN legal text lag

QR&O 3.01 still carries legacy junior naval designations while current CAF policy and service communications use Sailor 1st/2nd/3rd Class and Master Sailor. Learner-facing content should use the current terminology, with a concise source note so Argus does not pretend the underlying regulation text has already been amended.

### Canonical visual variant

The Dress Instructions authorize multiple ways rank may appear across garments/orders of dress. V1 must choose one canonical current service-dress representation per level. Do not broaden the completion claim to “recognize rank on any CAF uniform” until varied exemplars have been separately sourced and tested.

## 11. Implementation handoff

Open two bounded implementation issues:

1. **CAF rank hierarchy & equivalencies** — implement the 19-item text foundation immediately.
2. **CAF rank insignia visual recognition** — prepare the service-topic data model, provenance checklist and licence gate, but do not add insignia assets or ship the visual topics until written DND/CAF permission exists.

CANSOFCOM remains a later P1 extension and should not be folded into either first implementation issue.
