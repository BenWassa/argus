# Canadian Firearm Storage, Display & Transportation — federal law research and Argus course design

**Status:** deep research / course-design input only  
**Issue:** #104  
**Branch:** `research/issue-104-practical-skills-expansion`  
**Implementation:** out of scope  
**Shipped:** no (checked 2026-09-25) — the claim needs scenario practice, and a recall-only version was held back because multi-clause legal answers do not self-score reliably; see `../ISSUE_104_SCENARIO_ITEMS.md` §1. The legal snapshot must be re-checked before any build  
**Jurisdiction:** Canada; federal law is the authority for the rules researched here. Provincial, territorial, municipal, hunting, range and other laws can add requirements in particular situations.  
**Legal snapshot:** researched 2026-09-17 against the current Justice Laws consolidations identified below.

## Recommendation

**Ship as a tightly versioned Canadian legal-literacy course, not as a substitute for the Canadian Firearms Safety Course, a firearms licence, legal advice or hands-on training.**

This subject is unusually suitable for Argus because the legal rules are finite, classification-dependent and scenario-friendly. The main instructional risk is not lack of information; it is collapsing three different things into one:

- the legal minimum in current federal legislation;
- current Canadian Firearms Program explanatory guidance; and
- additional safer practices that may exceed the legal minimum.

Argus should make that distinction explicit on every lesson and scenario.

## Exact completion claim

> **Can identify the principal current federal storage, display and transportation requirements for non-restricted, restricted and prohibited firearms held by individuals in Canada, distinguish those legal minimums from additional recommended practices, and apply the rules to authored scenarios involving ammunition access, display, ordinary transportation, unattended vehicles and Authorization to Transport requirements.**

This completion claim does **not** mean the learner:

- has completed the CFSC or CRFSC;
- has demonstrated safe hands-on firearm handling;
- is licensed or authorized to possess or transport a firearm;
- can determine the legal classification of every firearm from appearance or a model name;
- has received legal advice about a real situation;
- has satisfied any provincial, territorial, municipal, hunting, range, import/export or other law that may also apply;
- can rely on course content indefinitely after legislation changes.

The course should always display its legal snapshot date and should be treated as stale when one of its controlling legal sources changes.

---

# 1. Authority model and source snapshot

## 1.1 Primary rule: current legislation controls

For this course, the principal authority is the **Storage, Display, Transportation and Handling of Firearms by Individuals Regulations, SOR/98-209** under the *Firearms Act*.

The current Justice Laws consolidation separates the rules for:

- storage of non-restricted firearms — section 5;
- storage of restricted firearms — section 6;
- storage of prohibited firearms — section 7;
- display of non-restricted firearms — section 8;
- display of restricted and prohibited firearms — section 9;
- transportation of non-restricted firearms — section 10;
- transportation of restricted firearms — section 11;
- transportation of prohibited firearms — section 12;
- replica firearms — section 13;
- antique firearms — section 14;
- handling of loaded firearms — section 15;
- shipping by post — section 16.

The RCMP Canadian Firearms Program is useful as current explanatory guidance, but a simplified RCMP page does not override the regulations.

Argus should not treat historical CFSC/CRFSC legal summaries as controlling where current legislation differs. Older training material can remain useful for general safety principles, but current law must be sourced from current legislation.

## 1.2 Versioned legal sources

| Source | Role in this research | Version/date used |
| --- | --- | --- |
| [Storage, Display, Transportation and Handling of Firearms by Individuals Regulations, SOR/98-209](https://laws-lois.justice.gc.ca/eng/regulations/SOR-98-209/) | Primary storage/display/transport authority for individuals | Justice Laws consolidation **current to 2026-07-21**; **last amended 2012-11-30**; index page modified 2026-09-11; accessed 2026-09-17 |
| [Firearms Act, S.C. 1995, c. 39](https://laws-lois.justice.gc.ca/eng/acts/F-11.6/FullText.html) | Possession and Authorization to Transport framework, including s. 19 | Justice Laws consolidation **current to 2026-07-21**; **last amended 2026-07-18**; accessed 2026-09-17 |
| [Authorizations to Transport Restricted Firearms and Prohibited Firearms Regulations, SOR/98-206](https://laws-lois.justice.gc.ca/eng/regulations/SOR-98-206/) | Separate ATT requirements and conditions | Justice Laws consolidation **current to 2026-07-21**; **last amended 2022-10-21**; index page modified 2026-09-11; accessed 2026-09-17 |
| [Criminal Code, R.S.C. 1985, c. C-46, s. 84](https://laws-lois.justice.gc.ca/eng/acts/C-46/section-84.html) | Current statutory classification definitions used by the Firearms Act | Justice Laws consolidation **current to 2026-07-21**; **last amended 2026-07-18**; accessed 2026-09-17 |
| [Explosives Regulations, 2013, SOR/2013-211](https://laws-lois.justice.gc.ca/eng/regulations/SOR-2013-211/FullText.html) | Separate federal requirements for storage of small-arms cartridges; Part 14, especially ss. 278–281 | Justice Laws consolidation **current to 2026-07-21**; **last amended 2024-05-03**; accessed 2026-09-17 |

## 1.3 Current official explanatory sources

These are secondary to legislation but useful for learner-facing explanations:

- RCMP Canadian Firearms Program, [Storing, transporting and displaying firearms](https://rcmp.ca/en/firearms/firearms-safety-training-transport-and-storage/storing-transporting-and-displaying-firearms), page modified **2024-11-12**, accessed 2026-09-17.
- RCMP Canadian Firearms Program, [Classes of firearms in Canada](https://rcmp.ca/en/firearms/classes-firearms/classes-firearms-canada), page modified **2026-06-08**, accessed 2026-09-17.
- RCMP Canadian Firearms Program, [Firearms Reference Table](https://rcmp.ca/en/firearms/firearms-reference-table), public FRT and prohibited-firearms lists last updated **2026-09-07**; page modified **2026-09-10**; accessed 2026-09-17. The RCMP expressly states that the FRT is an administrative document and **not a legal instrument**; the Criminal Code, Firearms Act and applicable regulations prevail.
- RCMP, [Safety reminders to prevent the loss of a buck](https://rcmp.ca/en/bc/prince-george/news/2025/09/safety-reminders-prevent-loss-buck), **2025-09-10**. Used only for clearly labelled theft-prevention / good-practice advice such as not storing firearms in a vehicle overnight.

## 1.4 Course authority rule

Every authored item should be tagged internally as one of:

- `LAW — SOR/98-209`
- `LAW — Firearms Act / SOR/98-206`
- `LAW — Explosives Regulations`
- `CFP GUIDANCE`
- `GOOD PRACTICE — exceeds or clarifies legal minimum`

Do not write a question whose correct answer depends on an unlabeled mixture of these categories.

---

# 2. Classification boundary

Canada currently recognizes three firearm classes relevant to this course:

- non-restricted;
- restricted;
- prohibited.

The controlling classification definitions come from s. 84 of the *Criminal Code* and prescribed regulations. The RCMP applies those rules and maintains the Firearms Reference Table as an administrative reference.

Argus should **not** turn this course into a firearm-identification test. A storage or transportation scenario should normally state the class explicitly: “a non-restricted rifle,” “a restricted firearm,” or “a prohibited firearm.”

Why this matters:

- classification can depend on technical characteristics and prescribed make/model rules;
- classification law has changed over time;
- the FRT is useful but is not itself the law;
- asking learners to infer class from a photograph or colloquial label creates avoidable legal ambiguity.

Antique firearms and replicas are also treated separately in SOR/98-209. They should be a short boundary note, not part of the core three-class progression. Sections 5–13 do not apply to antique firearms; s. 14 supplies separate antique-firearm rules. Replica transportation is addressed separately by s. 13.

---

# 3. Storage

## 3.1 The common baseline: unloaded

For all three main firearm classes, ordinary storage under ss. 5–7 starts with the firearm being **unloaded**.

The important differences are what must happen after unloading.

## 3.2 Non-restricted firearms — s. 5

A non-restricted firearm stored by an individual must ordinarily be:

- unloaded; and
- secured by **at least one** of the following methods:
  - a secure locking device;
  - removal of the bolt or bolt-carrier; or
  - storage in a securely locked container, receptacle or room constructed so that it cannot readily be broken open or into; and
- not readily accessible to ammunition, **unless** the ammunition is stored, together with or separately from the firearm, in a securely locked container or receptacle constructed so that it cannot readily be broken open or into.

### Key teaching point

For ordinary non-restricted storage, the regulation is an **OR** structure, not an “all of the above” structure.

A learner should not be taught that a non-restricted firearm legally requires both a trigger lock **and** a locked cabinet in every ordinary storage situation. Either may satisfy the firearm-security branch if the actual regulatory standard is met.

### Narrow statutory exceptions

Section 5 contains two special exceptions that should not be used in beginner questions except as advanced boundary material:

- temporary storage where the individual reasonably requires the non-restricted firearm for predator or other animal control in a place where discharge is lawful; and
- storage in a qualifying remote wilderness area not subject to visible or reasonably ascertainable use incompatible with hunting.

The course should not encourage learners to stretch these narrow exceptions into ordinary home, cottage, vehicle or urban storage scenarios.

## 3.3 Restricted firearms — s. 6

A restricted firearm must be unloaded and then satisfy one of two storage structures.

### Route A — locking device plus locked enclosure

- firearm unloaded;
- firearm rendered inoperable by a secure locking device; and
- firearm stored in a securely locked container, receptacle or room constructed so that it cannot readily be broken open or into.

### Route B — qualifying vault, safe or room

- firearm unloaded; and
- firearm stored in a securely locked vault, safe or room **specifically constructed or modified for the secure storage of restricted firearms**.

Under Route B, s. 6 does not separately require a secure locking device on the firearm.

Ammunition must not be readily accessible to the restricted firearm unless it is stored, together with or separately from the firearm, in a qualifying locked container/receptacle or a qualifying secure-storage vault/safe/room.

### Key teaching point

“Restricted means two locks in every case” is too crude. The ordinary cabinet/container route requires both a locking device on the firearm and a locked enclosure. The qualifying safe/vault/room route is an alternative legal structure.

## 3.4 Prohibited firearms — s. 7

The prohibited-firearm structure largely parallels restricted storage but adds an important rule for certain automatic firearms.

### Route A — locking device plus locked enclosure

- firearm unloaded;
- firearm rendered inoperable by a secure locking device;
- firearm stored in a securely locked container, receptacle or room constructed so it cannot readily be broken open or into; and
- if it is an automatic firearm with a removable bolt or bolt-carrier, the bolt or bolt-carrier must be removed and stored in a **different securely locked room** that cannot readily be broken open or into.

### Route B — qualifying vault, safe or room

- firearm unloaded; and
- firearm stored in a securely locked vault, safe or room specifically constructed or modified for secure storage of prohibited firearms.

The ammunition-access rule parallels restricted firearms.

### Key teaching point

Do not generalize the automatic-firearm bolt rule beyond the precise circumstances in the regulation. For storage, the separate-room bolt requirement is written into s. 7(b)(i), the locking-device-plus-enclosure route. Transportation has its own separate automatic-firearm rule in s. 12.

## 3.5 Storage comparison

| Requirement | Non-restricted | Restricted | Prohibited |
| --- | --- | --- | --- |
| Unloaded | Yes | Yes | Yes |
| Secure locking device always required? | No. Locking device **or** bolt removal **or** qualifying locked enclosure | Required under ordinary enclosure route; not separately required when stored in qualifying restricted-firearm vault/safe/room | Required under ordinary enclosure route; not separately required when stored in qualifying prohibited-firearm vault/safe/room |
| Locked enclosure always required? | No, if another s. 5(1)(b) method is used | Yes under ordinary route; qualifying vault/safe/room is alternative | Yes under ordinary route; qualifying vault/safe/room is alternative |
| Special automatic-firearm bolt rule | No class-wide rule | No special restricted rule in s. 6 | Yes under s. 7(b)(i) for qualifying automatic firearm with removable bolt/bolt-carrier |
| Ammunition may be in same locked container? | Yes, if the s. 5(1)(c) locked-container standard is satisfied | Yes, if s. 6(c) is satisfied | Yes, if s. 7(c) is satisfied |

---

# 4. Ammunition accessibility

This is one of the highest-value misconception areas for Argus.

## 4.1 What SOR/98-209 actually says

For ordinary storage of non-restricted, restricted and prohibited firearms, the regulation does **not** impose a universal rule that ammunition must always be in a different container or different room.

Instead, the firearm must not be **readily accessible to ammunition**, unless the ammunition is stored, together with or separately from the firearm, in the qualifying locked storage described by the relevant section.

Therefore:

> **“Firearms and ammunition must always be locked in separate containers” is not an accurate statement of ss. 5–7.**

Separate locked storage may be a sensible additional safety practice, but it is not the only compliant configuration under these sections.

## 4.2 Display is stricter about proximity

For display, ss. 8 and 9 say the firearm must not be displayed with and must not be readily accessible to ammunition that can be discharged from it, subject to the specific away-from-home display wording in s. 9 for restricted/prohibited firearms.

The learner should not carry the “same locked container can be lawful for storage” rule over into display scenarios.

## 4.3 Transportation sections do not create a general separate-ammunition rule

Sections 10–12 principally regulate the **firearm’s unloaded state and security during transportation**. They do not say that ammunition must always travel in a separate vehicle compartment or separate case.

Argus should therefore avoid marking “ammunition is in the same locked case” as automatically unlawful unless another applicable fact makes it unlawful.

The firearm must still be unloaded.

## 4.4 Ammunition has a separate federal regulatory regime

Small-arms cartridges are also regulated as explosives under Part 14 of the **Explosives Regulations, 2013**.

For an unlicensed user, the current rules include:

- storage in a dwelling or storage unit;
- no more than 225 kg of small-arms cartridges at one time under s. 280;
- in a dwelling, storage away from flammable substances and sources of ignition; and
- people not authorized by the user must not be given unlimited access to the cartridges.

Argus should keep this as a compact overlay lesson. The central storage course should not imply that satisfying SOR/98-209 exhausts every legal rule governing ammunition.

---

# 5. Display

Display is not the same legal category as storage. A learner who memorizes only storage rules will make predictable mistakes here.

## 5.1 Non-restricted display — s. 8

A displayed non-restricted firearm must be:

- unloaded;
- either rendered inoperable by a secure locking device **or** kept in a securely locked container, receptacle or room constructed so it cannot readily be broken open or into; and
- not displayed with and not readily accessible to ammunition that can be discharged from it.

### Comparison with storage

Bolt removal is expressly one of the ordinary storage options in s. 5, but s. 8’s display rule is written as secure locking device **or** qualifying locked enclosure.

Argus should not mechanically copy the storage alternatives into display questions.

## 5.2 Restricted or prohibited display in a dwelling-house — s. 9(1)

A restricted or prohibited firearm displayed in a dwelling-house must be:

- unloaded;
- rendered inoperable by a secure locking device;
- securely attached to a **non-portable structure** so that it cannot readily be removed; and
- not displayed with and not readily accessible to compatible ammunition.

For an automatic prohibited firearm with a removable bolt or bolt-carrier, that component must also be removed and stored in a different securely locked room constructed so it cannot readily be broken open or into.

### Key teaching point

A restricted firearm on a wall rack is not compliant merely because it has a trigger lock. The dwelling-house display rule separately requires secure attachment to a non-portable structure.

## 5.3 Restricted or prohibited display away from a dwelling-house — s. 9(2)–(4)

For a restricted firearm displayed elsewhere, the regulation requires it to be:

- unloaded;
- rendered inoperable by secure locking device;
- securely attached to the display structure by chain, metal cable or similar device so it cannot readily be removed; and
- kept away from readily accessible compatible ammunition, unless the ammunition is in a qualifying locked container or receptacle.

Prohibited firearms have the same core structure plus the automatic-firearm bolt rule where applicable.

The attachment requirement does not apply while the firearm is detached so it can be handled by a person under the **direct and immediate supervision** of the individual displaying it.

This is useful advanced material, but Argus should not build operational “gun show handling” instruction around it. The course goal is legal recognition, not live handling technique.

---

# 6. Transportation

## 6.1 Non-restricted firearms — s. 10

For ordinary transportation, a non-restricted firearm must be **unloaded**.

There is a narrow muzzle-loading exception for transportation between hunting sites: the firing cap or flint must be removed. This is not a useful beginner-course emphasis and should be taught only as an exception card.

### Important misconception

Section 10 does **not** impose a general requirement that an attended non-restricted firearm also have:

- a trigger/cable lock; or
- a locked opaque case.

Those can be prudent additional measures, but they are not the basic physical-transport rule in s. 10(1).

## 6.2 Restricted firearms — s. 11

A restricted firearm may be transported only if it is:

- unloaded;
- rendered inoperable by a secure locking device; and
- inside a **locked opaque container** strong and constructed so that it cannot readily be broken open or into or accidentally opened during transportation.

If that container is left in an unattended vehicle, additional vehicle requirements apply; see section 7 below.

## 6.3 Prohibited firearms — s. 12

A prohibited firearm may be transported only if it is:

- unloaded;
- rendered inoperable by a secure locking device;
- if it is an automatic firearm with a bolt or bolt-carrier removable with reasonable facility, transported with that bolt or bolt-carrier removed; and
- inside a locked opaque container strong and constructed so that it cannot readily be broken open or into or accidentally opened during transportation.

Again, unattended vehicles add further requirements.

### Key distinction from storage

For transportation of the qualifying automatic prohibited firearm, bolt/bolt-carrier removal is a direct s. 12 requirement. Do not import the storage-route nuance from s. 7 into transport questions.

## 6.4 Physical transport rules are not the whole legality test

A restricted or prohibited firearm can be perfectly unloaded, locked and cased yet still be transported unlawfully if the person lacks the necessary legal authority for that trip.

The *Firearms Act* and **SOR/98-206** separately govern Authorizations to Transport.

Current federal law includes automatic ATT treatment for certain circumstances under s. 19 of the *Firearms Act*, while other trips require an authorization from the Chief Firearms Officer. The RCMP currently summarizes that restricted/prohibited transport requires an ATT and directs individuals to the Canadian Firearms Program to determine whether an application is required for a particular trip.

Argus should teach the principle, not attempt to infer an individual learner’s licence conditions:

> **For restricted/prohibited transport, ask two separate questions: (1) are the physical transport conditions satisfied, and (2) is this trip legally authorized?**

## 6.5 ATT scope and route

SOR/98-206 provides that an ATT taking the form of a licence condition must identify the firearms and specify the period, places and reasons for transport.

Section 4 of SOR/98-206 requires a Chief Firearms Officer issuing an ATT to attach the condition that the firearm be transported by a route that, in all the circumstances, is **reasonably direct**.

This supports scenario questions about route discipline, but Argus should not invent a rigid “no stops whatsoever” rule. Whether a route remains reasonably direct can depend on circumstances.

A scenario with incomplete facts should allow **insufficient information / check ATT conditions** as the correct answer.

## 6.6 Transportation comparison

| Requirement | Non-restricted | Restricted | Prohibited |
| --- | --- | --- | --- |
| Unloaded | Yes, subject to narrow muzzle-loading exception | Yes | Yes |
| Secure locking device | Not generally required by s. 10(1) for ordinary attended transport | Yes | Yes |
| Locked opaque container | Not generally required by s. 10(1) | Yes | Yes |
| Automatic firearm removable bolt/bolt-carrier removed | No general s. 10 rule | No separate s. 11 rule | Yes, if s. 12(c) applies |
| ATT layer | Not under the restricted/prohibited ATT regime | Required legal-authority analysis | Required legal-authority analysis |
| Extra unattended-vehicle rules | Yes | Yes | Yes |

---

# 7. Unattended vehicles

The presence or absence of the person is legally important. An ordinary transport scenario can become a different compliance question when the vehicle is left unattended.

## 7.1 Non-restricted firearm — s. 10(2)

If the unattended vehicle has a trunk or similar compartment that can be securely locked:

- the non-restricted firearm must be in that trunk/compartment; and
- the trunk/compartment must be securely locked.

If the vehicle has no such trunk or compartment:

- the firearm must not be visible from outside; and
- the vehicle, or the part containing the firearm, must be securely locked.

### Remote-wilderness exception — s. 10(3)

There is a narrow rule for a qualifying remote wilderness area where the vehicle lacks a secure trunk/compartment and the vehicle or relevant part cannot be securely locked. In that circumstance, the firearm must be out of sight and rendered inoperable by a secure locking device, unless reasonably required for predator control.

This belongs in an advanced exception lesson, not in core recall.

## 7.2 Restricted firearm — s. 11(d)

The restricted firearm already must be unloaded, locked against operation and inside its locked opaque container.

If that container is in an unattended vehicle:

- with a secure trunk/similar compartment: the container goes in it and that compartment is securely locked;
- without such a compartment: the vehicle or relevant part is securely locked **and the container is not visible from outside**.

## 7.3 Prohibited firearm — s. 12(e)

The unattended-vehicle structure parallels restricted firearms, on top of the ordinary prohibited-transport requirements.

## 7.4 “Locked vehicle” is not always enough

A common weak answer is:

> “The doors are locked, so it is compliant.”

That ignores the class and vehicle configuration.

Examples:

- an unattended non-restricted firearm in a sedan with a lockable trunk belongs in the locked trunk;
- in a vehicle without a secure trunk, visibility becomes a specific issue;
- restricted/prohibited firearms remain subject to their locked opaque container requirement before the unattended-vehicle rule is even considered.

## 7.5 Overnight in a vehicle

Current RCMP theft-prevention guidance says firearms **should not be stored in a vehicle overnight** and recommends bringing them into a hotel or temporary residence and storing them properly there.

That is useful **good-practice guidance** and should be labelled as such.

Argus should not convert that sentence into a fabricated stand-alone statutory offence. It should also avoid giving a blanket “compliant” answer to an overnight-vehicle scenario merely because the vehicle-transport conditions appear satisfied: whether the circumstances are still transportation, have become storage, and what other law or authorization conditions apply can be fact-sensitive.

Best course treatment:

- teach the RCMP recommendation clearly;
- avoid normalizing unattended overnight vehicle storage;
- use “insufficient information / apply storage rules and current CFP guidance” for legally ambiguous edge cases.

---

# 8. Law versus recommended good practice

This distinction should be an explicit course mechanic.

| Statement | Status | Explanation |
| --- | --- | --- |
| Stored firearms must ordinarily be unloaded | **LAW** | SOR/98-209 ss. 5–7 |
| A non-restricted firearm at home always needs both a trigger lock and a locked cabinet | **FALSE as a statement of law** | s. 5 ordinarily permits locking device **or** bolt removal **or** qualifying locked enclosure |
| A restricted firearm using the ordinary cabinet/container storage route needs both a locking device and locked enclosure | **LAW** | s. 6(b)(i) |
| A restricted firearm in a qualifying secure-storage safe/vault/room also always needs a trigger lock | **FALSE as a universal statement of law** | s. 6(b)(ii) is an alternative route and does not separately require the device |
| Ammunition must always be in a different locked container from the firearm | **FALSE as a universal statement of law** | ss. 5–7 expressly permit ammunition to be stored together with the firearm in qualifying locked storage |
| Keeping ammunition separately locked is a prudent default | **GOOD PRACTICE** | Consistent with CFP guidance to store ammunition separately or lock it up; the law also permits certain same-container storage |
| A displayed firearm may have compatible ammunition sitting beside it if the firearm itself is locked | **FALSE** | Display rules restrict display with / ready access to compatible ammunition |
| An attended non-restricted firearm in ordinary transport always needs a trigger lock | **FALSE as a statement of s. 10(1)** | s. 10(1) principally requires unloading, subject to the muzzle-loader exception |
| An attended non-restricted firearm always needs a locked opaque case | **FALSE as a statement of s. 10(1)** | The locked opaque case requirement is explicit for restricted/prohibited firearms, not ordinary non-restricted transport |
| Restricted transport requires unloaded + secure locking device + locked opaque sturdy container | **LAW** | s. 11 |
| Prohibited transport uses the same core structure and adds removable-bolt rules for qualifying automatic firearms | **LAW** | s. 12 |
| A restricted/prohibited firearm that is perfectly locked and cased can be taken anywhere | **FALSE** | Firearms Act / ATT law is a separate legal layer |
| An ATT route must be reasonably direct | **LAW / ATT CONDITION** | SOR/98-206 s. 4 |
| Any locked vehicle is sufficient for any unattended firearm | **FALSE** | ss. 10–12 distinguish trunk/similar compartment, visibility and firearm class |
| Do not leave firearms stored in a vehicle overnight | **GOOD PRACTICE / CFP-RCMP THEFT-PREVENTION GUIDANCE** | Current RCMP safety guidance recommends against overnight vehicle storage; do not mislabel this as the wording of s. 10–12 |
| Avoid advertising firearm contents or ownership on a vehicle | **GOOD PRACTICE** | RCMP theft-prevention guidance notes that firearm-related decals can increase theft targeting; not a storage/transport statutory requirement |

---

# 9. Common misconceptions Argus should explicitly correct

## Misconception 1 — “All firearms use the same storage rule”

Incorrect. The security structure becomes stricter from non-restricted to restricted/prohibited, and prohibited automatic firearms have additional rules in specified circumstances.

## Misconception 2 — “Two locks are always legally required”

Incorrect as a universal statement. It is a useful shorthand for one common restricted/prohibited storage route, but qualifying vault/safe/room alternatives exist, and non-restricted storage has broader alternatives.

## Misconception 3 — “Ammo must always be in another room”

Incorrect. Ordinary firearm storage rules permit ammunition in the same qualifying locked container/receptacle in specified circumstances. Display rules are different.

## Misconception 4 — “If the gun has a trigger lock, ammunition can sit beside it on display”

Incorrect. Display provisions independently restrict compatible ammunition from being displayed with or readily accessible to the firearm.

## Misconception 5 — “A non-restricted firearm always has to be cased for transport”

Not as a general statement of s. 10(1). Ordinary attended transport principally requires the non-restricted firearm to be unloaded, subject to the narrow muzzle-loader rule.

## Misconception 6 — “A non-restricted firearm always needs a trigger lock in the car”

Not as a general statement of ordinary attended transportation law. Different requirements arise when the vehicle is unattended, and extra locking remains prudent.

## Misconception 7 — “The car doors are locked, so unattended transport is automatically lawful”

Incorrect. The law distinguishes vehicles with a lockable trunk/similar compartment from those without one and, in some situations, expressly requires the firearm/container to be out of sight.

## Misconception 8 — “A locked case is enough for restricted transport”

Incorrect. The firearm itself must also be unloaded and rendered inoperable by a secure locking device, and the container must meet the locked opaque-container standard.

## Misconception 9 — “If the physical locks are correct, the restricted/prohibited trip is legal”

Incorrect. Authorization to Transport is a separate legal question.

## Misconception 10 — “An ATT means any route or stop is fine”

Incorrect. ATT law includes specified places/reasons and a reasonably-direct-route condition.

## Misconception 11 — “A current RCMP Firearms Reference Table entry is itself the legal classification law”

Incorrect. The RCMP expressly describes the FRT as an administrative reference, not a legal instrument.

## Misconception 12 — “An old CFSC page or remembered instructor phrase is enough to resolve a current legal question”

Incorrect. For Argus, current legislation controls. Training material should be checked against the current consolidation before being used as legal doctrine.

---

# 10. Scenario design model

Each scenario should ask four things in a fixed order:

1. **What legal activity is happening?** Storage, display, transport, unattended-vehicle transport, or an ATT question.
2. **What class is stated?** Non-restricted, restricted or prohibited.
3. **Is the described situation compliant with the federal rule being tested?** Yes / No / Insufficient information.
4. **What principle controls?** Select the exact reason, not merely “firearm safety.”

A second feedback line can then distinguish:

- legal minimum;
- current CFP guidance; and
- safer practice beyond the minimum.

The course should reward **Insufficient information** where the legal conclusion depends on facts not supplied, particularly ATT scope, firearm classification, whether a safe/room meets the regulatory construction standard, or whether an edge-case vehicle situation is properly characterized as storage versus transportation.

---

# 11. Scenario bank

The scenarios below are content-design exemplars. They should be converted into authored items with the legal snapshot date visible in the UI.

## Scenario 1 — non-restricted storage, ammunition on the shelf

**Facts:** A non-restricted rifle is unloaded and fitted with a secure locking device. It is stored in a bedroom closet. Compatible ammunition is loose on the shelf immediately beside it. The ammunition is not in a locked container.

**Question:** Compliant with the ordinary federal storage rule?

**Answer:** **No.**

**Principle:** The firearm satisfies one s. 5(1)(b) security option, but s. 5(1)(c) separately requires that it not be readily accessible to ammunition unless the ammunition is in qualifying locked storage.

**Tag:** `LAW — SOR/98-209 s. 5(1)`

---

## Scenario 2 — non-restricted storage, ammunition in same locked cabinet

**Facts:** An unloaded non-restricted rifle and its ammunition are stored together inside a securely locked cabinet constructed so it cannot readily be broken open or into. The rifle has no separate trigger lock.

**Question:** Does the federal rule require a second lock on the rifle or a separate ammunition box?

**Answer:** **No, assuming the cabinet actually meets the regulatory standard.**

**Principle:** For non-restricted storage, a qualifying locked enclosure is one of the alternative s. 5(1)(b) methods, and s. 5(1)(c) permits ammunition to be stored together with the firearm in qualifying locked storage.

**Good-practice note:** Separate locked ammunition storage can still reduce access risk; it is not the only lawful configuration.

**Tag:** `LAW — SOR/98-209 s. 5(1)`

---

## Scenario 3 — non-restricted storage, bolt removed

**Facts:** An unloaded non-restricted rifle is stored at home with its bolt removed. Compatible ammunition is separately kept in a locked container that meets the regulatory standard.

**Question:** Must the rifle also have a trigger lock solely to satisfy s. 5(1)(b)?

**Answer:** **No.**

**Principle:** Bolt or bolt-carrier removal is one of the ordinary alternative methods in s. 5(1)(b).

**Tag:** `LAW — SOR/98-209 s. 5(1)(b)`

---

## Scenario 4 — restricted storage, ordinary locked cabinet route

**Facts:** A restricted firearm is unloaded, fitted with a secure locking device and placed in a securely locked cabinet that cannot readily be broken into. Its ammunition is also inside that locked cabinet.

**Question:** Is the same-cabinet ammunition fact automatically non-compliant?

**Answer:** **No.**

**Principle:** Section 6(c) permits ammunition to be stored together with the firearm in a qualifying locked container/receptacle or qualifying secure-storage vault/safe/room.

**Tag:** `LAW — SOR/98-209 s. 6`

---

## Scenario 5 — restricted storage in a qualifying safe

**Facts:** An unloaded restricted firearm is stored in a securely locked safe specifically constructed or modified for secure storage of restricted firearms. No trigger lock is attached.

**Question:** Non-compliant because there is no trigger lock?

**Answer:** **No, on the stated facts.**

**Principle:** Section 6(b)(ii) is an alternative to the locking-device-plus-enclosure route. The scenario must explicitly establish that the safe meets the statutory description.

**Tag:** `LAW — SOR/98-209 s. 6(b)(ii)`

---

## Scenario 6 — prohibited automatic firearm, ordinary enclosure route

**Facts:** A prohibited automatic firearm is unloaded, trigger-locked and inside a qualifying locked cabinet. Its bolt is readily removable but remains installed. The cabinet is not a vault/safe/room specifically constructed or modified for prohibited-firearm storage.

**Question:** Compliant?

**Answer:** **No.**

**Principle:** Under s. 7(b)(i), when the automatic firearm has a removable bolt or bolt-carrier and the ordinary locking-device-plus-enclosure route is used, that component must be removed and stored in a different qualifying locked room.

**Tag:** `LAW — SOR/98-209 s. 7(b)(i)`

---

## Scenario 7 — non-restricted display with ammunition beside it

**Facts:** An unloaded non-restricted firearm is displayed on a wall with a secure locking device. Compatible ammunition is displayed on the shelf directly below it.

**Question:** Compliant?

**Answer:** **No.**

**Principle:** Section 8 separately prohibits displaying the firearm with, or readily accessible to, ammunition that can be discharged from it.

**Tag:** `LAW — SOR/98-209 s. 8`

---

## Scenario 8 — restricted display in a home

**Facts:** An unloaded restricted firearm is trigger-locked and displayed on a table. It is not attached to the building or any non-portable structure. No ammunition is nearby.

**Question:** Compliant?

**Answer:** **No.**

**Principle:** In a dwelling-house, s. 9(1) requires secure attachment to a non-portable structure in addition to unloading and a secure locking device.

**Tag:** `LAW — SOR/98-209 s. 9(1)`

---

## Scenario 9 — attended transport of a non-restricted firearm

**Facts:** A licensed owner is driving with an unloaded non-restricted firearm in the vehicle. The firearm is in a normal case but the case is not locked and there is no trigger lock. The vehicle is attended throughout the trip.

**Question:** Does s. 10(1) itself make the situation non-compliant solely because the firearm lacks a trigger lock or locked opaque case?

**Answer:** **No.**

**Principle:** The ordinary s. 10(1) rule for non-restricted transport is that the firearm be unloaded, subject to the specific muzzle-loader exception.

**Good-practice note:** Additional locking/casing can reduce theft or unauthorized access risk. This answer addresses the physical requirements in s. 10(1), not every law that could apply to every trip.

**Tag:** `LAW — SOR/98-209 s. 10(1)`

---

## Scenario 10 — unattended non-restricted firearm in a sedan

**Facts:** An unloaded non-restricted firearm is left in an unattended sedan. It is placed in the sedan’s lockable trunk and the trunk is securely locked.

**Question:** Does s. 10(2) additionally require a trigger lock merely because the sedan is unattended?

**Answer:** **No, not on these ordinary stated facts.**

**Principle:** When the unattended vehicle has a trunk or similar securely lockable compartment, s. 10(2)(a) requires the firearm to be in that compartment and the compartment to be securely locked.

**Tag:** `LAW — SOR/98-209 s. 10(2)`

---

## Scenario 11 — unattended pickup, firearm visible

**Facts:** An unloaded non-restricted firearm is left behind the seat of a pickup truck that has no lockable trunk or similar compartment. The cab doors are locked, but the firearm is plainly visible through the window.

**Question:** Compliant?

**Answer:** **No.**

**Principle:** Where there is no secure trunk/similar compartment, s. 10(2)(b) requires the firearm not to be visible from outside in addition to the vehicle or relevant part being securely locked.

**Tag:** `LAW — SOR/98-209 s. 10(2)(b)`

---

## Scenario 12 — restricted transport, transparent container

**Facts:** A restricted firearm is unloaded and fitted with a secure locking device. It is transported inside a locked, sturdy **transparent** case.

**Question:** Compliant with the physical transport rule?

**Answer:** **No.**

**Principle:** Section 11(c) requires the locked container to be made of an **opaque** material as well as being sufficiently strong and secure against accidental opening.

**Tag:** `LAW — SOR/98-209 s. 11(c)`

---

## Scenario 13 — restricted transport, physical compliance but no ATT

**Facts:** A restricted firearm is unloaded, trigger-locked and inside a compliant locked opaque container. The owner wants to take it to a repair business but has not checked whether their current licence conditions authorize that trip and has not obtained any separate ATT.

**Question:** Is physical compliance under s. 11 enough to conclude that the trip is lawful?

**Answer:** **No.**

**Principle:** Physical transport conditions and legal authority to make the trip are separate questions. Current federal ATT law governs restricted/prohibited transportation between places. Current CFP guidance says individuals may need to request an ATT from the CFO for destinations such as repair/appraisal businesses.

**Tag:** `LAW — Firearms Act s. 19 / SOR/98-206 + SOR/98-209 s. 11`

---

## Scenario 14 — prohibited automatic firearm in transport

**Facts:** A prohibited automatic firearm is unloaded, fitted with a secure locking device and placed inside a compliant locked opaque container. Its bolt is removable with reasonable facility but remains installed.

**Question:** Compliant with s. 12?

**Answer:** **No.**

**Principle:** Section 12(c) requires removal of the bolt or bolt-carrier where the described automatic-firearm condition is met.

**Tag:** `LAW — SOR/98-209 s. 12(c)`

---

## Scenario 15 — unattended restricted firearm in a vehicle with no trunk

**Facts:** A restricted firearm is unloaded, trigger-locked and inside a locked opaque compliant container. The container is left in an unattended vehicle with no trunk or similar lockable compartment. The doors are locked, but the container is clearly visible through a window.

**Question:** Compliant?

**Answer:** **No.**

**Principle:** Section 11(d)(ii) requires both a securely locked vehicle/relevant part **and** that the container not be visible from outside.

**Tag:** `LAW — SOR/98-209 s. 11(d)(ii)`

---

## Scenario 16 — ATT detour with incomplete facts

**Facts:** A person with an ATT is transporting a restricted firearm between two authorized places. They make a detour. The scenario does not say why, how far, how long or what the authorization specifies.

**Question:** Is the detour compliant?

**Answer:** **Insufficient information.**

**Principle:** SOR/98-206 s. 4 requires the firearm to be transported by a route that, in all the circumstances, is reasonably direct. The phrase is contextual. Argus should not invent a universal “zero stops” rule or automatically approve every detour.

**Tag:** `LAW — SOR/98-206 s. 4`

---

## Scenario 17 — ammunition in dwelling near an ignition source

**Facts:** Small-arms cartridges are stored in a dwelling where they are kept beside a clear source of ignition. Assume the user is otherwise within the ordinary unlicensed-user quantity limit.

**Question:** Does firearm-storage compliance alone resolve the legality of this ammunition storage?

**Answer:** **No.**

**Principle:** The Explosives Regulations separately require small-arms cartridges stored in a dwelling to be kept away from flammable substances and sources of ignition and restrict unlimited access by unauthorized people.

**Tag:** `LAW — Explosives Regulations, 2013 ss. 278–281`

---

## Scenario 18 — overnight vehicle edge case

**Facts:** A traveller reaches a hotel and proposes leaving a firearm in the locked vehicle overnight. The prompt does not establish whether the journey is legally continuing, whether the situation is better characterized as storage, what firearm class is involved, or what ATT conditions apply.

**Question:** Should Argus mark this simply “compliant because the vehicle is locked”?

**Answer:** **No — insufficient information, and current RCMP guidance recommends against overnight vehicle storage.**

**Principle:** Do not stretch a transport rule into a blanket overnight-storage permission. Apply the correct storage/transport rules to the actual facts and keep the RCMP recommendation clearly labelled as good practice.

**Tag:** `GOOD PRACTICE + LEGAL-BOUNDARY SCENARIO`

---

# 12. Assessment rules

## 12.1 What should be memorized

Finite recall is appropriate for:

- the three class labels;
- storage rule structure by class;
- ammunition-access rule;
- display-versus-storage distinction;
- transport rule structure by class;
- locked opaque container rule for restricted/prohibited transport;
- unattended-vehicle trunk / concealment logic;
- separate ATT legal layer;
- reasonably-direct-route condition;
- current-law-over-old-summary principle.

## 12.2 What should be scenario-practised

Scenario application is appropriate for:

- identifying which legal activity is occurring;
- distinguishing “one of these methods” from “all of these methods”;
- separating firearm security from ammunition access;
- deciding whether vehicle visibility matters;
- recognizing when an ATT question remains after the physical locks are correct;
- distinguishing legal minimum from recommended practice;
- recognizing incomplete facts and choosing “insufficient information.”

## 12.3 What Argus should not test

Do not test:

- how to defeat, improvise or bypass locking devices;
- how to conceal a firearm from law enforcement;
- tactical vehicle carriage;
- self-defence carry;
- use-of-force decision-making;
- marksmanship;
- how to modify a firearm;
- operational handling beyond the legal/safety principles necessary to understand storage, display and transportation.

## 12.4 Scoring rubric

For scenario items, award full credit only when the learner gets both layers correct:

- **Compliance judgement:** yes / no / insufficient information; and
- **Controlling principle:** correct class + activity + legal reason.

A learner who answers “no” for the wrong reason should not receive full mastery credit.

Example:

- Scenario: unloaded non-restricted firearm in a qualifying locked cabinet with ammunition in the same locked cabinet.
- Weak answer: “Compliant because ammunition never needs to be locked.”
- Correct judgement, wrong rule: not full credit.
- Strong answer: “Compliant under the stated storage rule because the firearm is unloaded and the qualifying locked cabinet satisfies the enclosure option; compatible ammunition may be stored together with the firearm inside qualifying locked storage.”

---

# 13. Course structure

A compact first course should be roughly **5 lessons + 2 checkpoints + final mixed scenarios**.

## Lesson 1 — Legal map: class × activity

Teach:

- non-restricted / restricted / prohibited;
- storage / display / transport are separate legal modes;
- current legislation controls;
- FRT is administrative, not the legal instrument;
- course legal snapshot date.

Target: 6–8 recall items.

## Lesson 2 — Storage and ammunition

Teach:

- unloaded baseline;
- non-restricted OR structure;
- restricted/prohibited enclosure route versus qualifying safe/vault/room route;
- ammunition accessibility;
- prohibited automatic-firearm storage nuance.

Target: 8–10 recall items + 4 scenarios.

## Checkpoint A — “Is this storage compliant?”

Use home/cottage-style authored facts with the firearm class stated explicitly. Include one “insufficient information” item about whether a claimed safe actually meets the regulatory standard.

## Lesson 3 — Display is different

Teach:

- non-restricted display rule;
- restricted/prohibited dwelling-house attachment rule;
- ammunition-on-display misconception;
- limited away-from-home distinction without turning the lesson into gun-show operations.

Target: 6 recall items + 3 scenarios.

## Lesson 4 — Transportation by class

Teach:

- non-restricted unloaded baseline;
- restricted: unloaded + device + locked opaque container;
- prohibited: same core structure + qualifying automatic-firearm bolt rule;
- physical compliance is not the same as authorization.

Target: 8 recall items + 5 scenarios.

## Lesson 5 — Unattended vehicles and ATT

Teach:

- trunk/similar lockable compartment;
- no-trunk concealment and locked-vehicle rule;
- restricted/prohibited container visibility;
- ATT as a separate legal layer;
- reasonably-direct route;
- good-practice warning about overnight vehicle storage.

Target: 8 recall items + 5 scenarios.

## Checkpoint B — “What changed when the driver walked away?”

Use paired scenarios in which the firearm and vehicle are identical, but one vehicle is attended and one unattended. This makes the legal state transition memorable without operationalizing firearm use.

## Final — mixed compliance review

10–12 scenarios:

- balanced across all three classes;
- at least two storage/ammunition items;
- at least two display items;
- at least three vehicle/transport items;
- at least two ATT/legal-authority items;
- at least two questions where “insufficient information” is correct;
- at least two explicit law-versus-good-practice distinctions.

---

# 14. Content-maintenance contract

This course cannot be treated like timeless trivia.

Before release and on any scheduled legal refresh, verify at minimum:

- SOR/98-209 consolidation date and amendment history;
- Firearms Act s. 19;
- SOR/98-206;
- Criminal Code s. 84 classification definitions;
- current RCMP storage/transport guidance;
- current RCMP classification/FRT notices;
- Explosives Regulations Part 14 if ammunition-storage content remains in scope.

### Revalidation trigger

Any change in:

- the “current to” or “last amended” information for a controlling legal source;
- Firearms Act ATT rules;
- firearm classification definitions;
- SOR/98-209;
- SOR/98-206;
- RCMP guidance that conflicts with course wording;

should mark the legal course for human review before new mastery claims are issued.

### Item-level provenance

Each legal question should store:

- source instrument;
- section/subsection;
- consolidation date used when authored;
- last human verification date;
- whether the item tests law, CFP guidance or good practice.

This lets Argus update one rule family without silently invalidating the rest of the course.

---

# 15. Final Argus treatment

**Ship, but only as versioned federal legal literacy.**

The strongest learning sequence is:

1. identify firearm class from the scenario label;
2. identify activity: storage, display, transport or unattended transport;
3. apply the class-specific legal minimum;
4. check ammunition-access rules where relevant;
5. for restricted/prohibited transport, separately ask whether the trip is authorized;
6. distinguish statutory requirement from safer additional practice;
7. choose “insufficient information” instead of inventing certainty.

The course should deliberately correct the most common overgeneralizations:

- “two locks always”;
- “ammo always separate”;
- “non-restricted transport always requires a trigger lock/case”;
- “locked car means compliant”;
- “physical transport compliance means the trip is authorized”;
- “old CFSC wording is current law.”

Argus can teach and test those distinctions well. It cannot certify safe hands-on handling, firearm ownership eligibility, current individual licence conditions or legal compliance in a real fact pattern.
