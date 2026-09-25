# Canadian Firearm Safety I — ACTS & PROVE

**Status:** deep research / course recommendation  
**Date:** 2026-09-17  
**Issue:** #104  
**Implementation:** out of scope  
**Shipped:** recall layer only, 2026-09-25 — catalog topic `firearm-safety-acts-prove` (the nine ACTS/PROVE rules in order, pinned to the 2014 Student Handbook after the §3.3 revalidation). The scenario-application claim is not shipped; see `../ISSUE_104_SCENARIO_ITEMS.md`  
**Jurisdictional anchor:** Canada, with Ontario delivery context  
**Primary doctrine:** RCMP Canadian Firearms Safety Course (CFSC) Student Handbook  

## Recommendation in one sentence

Build this as a compact, doctrine-faithful Argus course for **recalling and reasoning with the Canadian ACTS/PROVE safety framework**, while making it explicit that app completion is knowledge practice only and does not demonstrate safe firearm handling, replace the CFSC, satisfy licensing requirements or substitute for supervised hands-on instruction and practical testing.

---

## 1. Research conclusion

This is a strong Argus candidate because it has an unusually clean boundary between finite knowledge that an app can teach well and physical competence that an app must not claim to teach.

The RCMP Canadian Firearms Safety Course handbook centres routine firearm handling around the **Vital Four ACTS of Firearm Safety** and **PROVE it safe**. The framework is deliberately redundant: the learner is expected to assume danger before knowing the firearm's actual condition, maintain a safe muzzle direction, keep the trigger finger away from the trigger, and then establish unloaded status through a complete verification sequence rather than through memory, appearance, another person's assurance or a single mechanical check.

The public RCMP handbook gives the wording as:

### The Vital Four ACTS of Firearm Safety

- **A — Assume every firearm is loaded.**
- **C — Control the muzzle direction at all times.**
- **T — Trigger finger must be kept off the trigger and out of the trigger guard.**
- **S — See that the firearm is unloaded — PROVE it safe.**

### PROVE it safe

- **P — Point the firearm in the safest available direction.**
- **R — Remove all ammunition.**
- **O — Observe the chamber.**
- **V — Verify the feeding path.**
- **E — Examine the bore for obstructions.**

The handbook also supplies several rules that matter as much as memorizing the acronyms:

- both the chamber and magazine must be checked;
- a firearm should be passed or accepted only open and unloaded;
- the mechanical safety must never be treated as a substitute for safe handling because mechanical devices can fail;
- the firearm is considered unloaded and safe only while it remains under the direct control of the person who unloaded and PROVEd it safe;
- a person who is uncomfortable handling a firearm should not improvise and should seek assistance from a qualified individual.

That combination is a good fit for Argus. The app can teach the sequence, the purpose of each layer, the logic behind repeated verification and recognition of common safety failures. It can also present authored scenarios where the correct answer is to stop, re-establish safe assumptions, repeat the doctrine or defer to qualified hands-on help.

It cannot establish whether a learner can actually control a firearm's muzzle, identify and operate unfamiliar actions, inspect chambers and feeding paths correctly, recognize physical obstructions, handle ammunition safely, or perform the procedure consistently under instructor observation. Those are physical competencies.

The current Canadian Firearms Program still describes the CFSC as an **introductory course for new firearms users** and requires both written and practical testing after in-class instruction. The 2025 Commissioner of Firearms Report further states that a new national firearms-safety curriculum begins rolling out in 2026. As of this research date, the current public RCMP web pages do not publish a replacement ACTS/PROVE wording, while the RCMP 2014 Student Handbook remains the authoritative public source located for the exact acronym language.

Therefore the Argus content should be **versioned doctrine**, not timeless folklore. Before implementation or publication, the exact wording should be rechecked against whatever new CFSC materials the Canadian Firearms Program has made operative in the target jurisdiction.

---

## 2. Exact competency and completion boundary

### Competency claim

After completing **Canadian Firearm Safety I — ACTS & PROVE**, the learner can, in authored written or illustrated safety scenarios:

- recall the four ACTS rules in order and explain the safety purpose of each;
- recall the five PROVE steps in order and explain what each step is intended to establish;
- recognize that another person's assurance, an open action, an engaged safety, a removed magazine or a prior check does not replace the complete safety framework;
- identify common ACTS/PROVE violations and incomplete verification;
- recognize when loss of direct control means unloaded status must not simply be assumed later;
- identify the safer response when the firearm, action type or condition is unfamiliar;
- choose stopping, re-PROVing, maintaining the safe handling rules or seeking qualified assistance over guessing or shortcutting;
- distinguish knowledge of the procedure from demonstrated physical competence.

### Exact completion claim

> **Completed Canadian Firearm Safety I — ACTS & PROVE:** demonstrated recall of the RCMP ACTS/PROVE safety framework and applied its principles successfully across authored firearm-safety scenarios. This completion records knowledge practice only; it does not certify firearm-handling competence, replace supervised CFSC instruction or practical testing, satisfy firearms-licensing requirements, or authorize firearm possession or use.

### What completion must never imply

Completion does **not** mean the learner:

- has passed the Canadian Firearms Safety Course;
- has passed a CFSC written or practical examination;
- has a Possession and Acquisition Licence or is eligible for one;
- has demonstrated safe physical handling of any firearm;
- can safely operate an unfamiliar firearm action;
- has been trained in firing, marksmanship, hunting, tactical use, defensive employment or use of force;
- can identify every mechanical malfunction or obstruction;
- can teach or supervise another person in firearm handling;
- can ignore current federal, provincial, territorial, range or local rules.

This boundary should appear before the first scenario and again at completion.

---

## 3. Doctrine status and terminology check

### 3.1 Primary public doctrine found

The primary source for exact ACTS/PROVE wording is the RCMP **Canadian Firearms Safety Course — Student Handbook (2014)**.

The handbook explicitly identifies the Vital Four ACTS as a core course element and repeatedly applies ACTS and PROVE before loading, unloading and handling procedures. In the handbook's PROVE table:

- P is the safest-available-direction requirement;
- R is removal of all ammunition;
- O is chamber observation;
- V is feeding-path verification;
- E is bore examination for obstructions.

The handbook states that the firearm is unloaded and safe only until it leaves the direct control of the person who unloaded and PROVEd it safe.

### 3.2 Current Canadian Firearms Program status

Current RCMP / Canadian Firearms Program web material continues to use the names:

- **Canadian Firearms Safety Course (CFSC)**;
- **Canadian Restricted Firearms Safety Course (CRFSC)**;
- **Possession and Acquisition Licence (PAL)**.

The current CFSC page states that first-time licence applicants must pass the CFSC before applying for a PAL and that the course includes both written and practical testing after in-class instruction. Its published topic list still includes basic firearm-safety practices, operating firearm actions, safe handling and carrying, owner responsibilities, and safe storage, display, transportation and handling.

The RCMP's 2025 Commissioner of Firearms Report says the Canadian Firearms Program maintains national firearms-safety training standards and that a new firearms-safety curriculum will begin national rollout in 2026.

### 3.3 Implication for Argus

No current public CFP source located in this research pass states that ACTS or PROVE has been replaced or provides a different public wording. That is **not** proof that the 2014 handbook is the final 2026 classroom text.

Argus should therefore store this course with metadata equivalent to:

- `doctrine_owner: RCMP Canadian Firearms Program`;
- `primary_manual: CFSC Student Handbook 2014`;
- `terminology_checked: 2026-09-17`;
- `curriculum_transition_flag: 2026 national rollout announced`;
- `requires_revalidation_before_ship: true`.

If newer official course materials change wording, sequence or scope, the Argus course must follow the current CFP doctrine rather than preserve the older acronym wording for product consistency.

---

## 4. Why ACTS is structured as four overlapping rules

The useful teaching model is not “memorize four letters.” It is **layered error control**.

A firearm-safety system should not depend on one assumption being correct. ACTS creates multiple simultaneous controls so that one mistake does not automatically become an injury.

### 4.1 A — Assume every firearm is loaded

**Doctrine:** Regard any firearm as a potential danger.

**Why it exists:** The handler often does not have reliable knowledge of the firearm's current condition. Memory can be wrong. Another person's statement can be wrong. A prior check can become stale. An apparently open or inactive firearm can still be mishandled if the learner treats appearance as proof.

The safety value is behavioural: the learner begins with the conservative assumption that the firearm can cause harm and therefore immediately applies muzzle and trigger discipline before trying to establish actual condition.

**Argus should teach:**

- “I was told it is unloaded” is not a substitute for the rule;
- “I checked it earlier” is not a permanent status;
- “the safety is on” does not make the firearm safe to point at a person;
- an apparently unloaded firearm is still handled under ACTS;
- uncertainty is resolved through the full safety process, not confidence.

**Common failure:** treating unloaded as a remembered label rather than a condition that must be established and maintained.

### 4.2 C — Control the muzzle direction at all times

**Doctrine:** Identify and maintain the safest available muzzle direction; do not point the muzzle at yourself or another person.

**Why it exists:** If every firearm is initially treated as capable of firing, muzzle direction is the main consequence-limiting control. It protects against the case where the handler's belief about loaded status is wrong, a mechanical condition is misunderstood or an unintended discharge occurs.

The word **available** matters. “Safe direction” is contextual rather than a universal compass direction. The learner must reason about people, surroundings and where a projectile could travel rather than repeat “up” or “down” as fixed answers.

**Argus should teach:**

- safest direction depends on the scenario;
- an otherwise correct PROVE sequence does not excuse sweeping another person with the muzzle;
- a muzzle rule remains active during handoff, inspection and unloading;
- written scenarios should avoid pretending there is always one geometrically safe direction when the scene description does not establish one.

**Common failure:** focusing on the action, magazine or chamber and allowing the muzzle to drift toward a person during manipulation.

### 4.3 T — Trigger finger off the trigger and out of the trigger guard

**Doctrine:** Do not place the trigger finger on the trigger or inside the trigger guard while picking up or handling the firearm as part of the safety procedure.

**Why it exists:** It separates ordinary handling movements from the control that fires the firearm. The RCMP handbook specifically warns against putting the finger inside the guard while picking up a firearm and treats trigger discipline as one of the Vital Four rather than an optional refinement.

**Argus should teach:**

- finger “resting lightly” on the trigger is still wrong;
- a mechanical safety being engaged does not cancel the trigger rule;
- correct muzzle direction does not cancel the trigger rule;
- trigger discipline begins before loaded status has been established.

**Common failure:** placing the finger in the guard because the handler believes the firearm is unloaded or because the mechanical safety is on.

### 4.4 S — See that the firearm is unloaded — PROVE it safe

**Doctrine:** Do not merely assume unloaded status; establish it through PROVE.

**Why it exists:** The earlier ACTS rules manage the firearm safely while its status is uncertain. S then requires a structured process to resolve that uncertainty.

This is why ACTS and PROVE should not be taught as two unrelated mnemonics. ACTS governs the entire handling context; PROVE is the verification process nested inside the final ACTS rule.

**Argus should teach:**

- “looks empty” is not enough;
- removing a magazine alone is not enough;
- observing one chamber alone is not enough if the feeding path has not been checked;
- verification is procedural and complete, not a feeling of confidence;
- pass or accept only open and unloaded firearms.

**Common failure:** collapsing S into one favourite check — usually “magazine out” or “chamber looked empty” — instead of the full PROVE sequence.

---

## 5. Why each PROVE step exists

PROVE should be taught as a chain in which each step closes a different source of uncertainty.

### 5.1 P — Point the firearm in the safest available direction

This deliberately repeats the C in ACTS because unloading and verification involve manipulating the firearm. The procedure begins by controlling the consequence if the handler's assumptions are wrong.

The RCMP handbook also says to ensure nothing touches the trigger during unloading and to apply the mechanical safety where it can remain on during the procedure. The safety device is an additional layer, not the primary control.

**Failure pattern:** beginning to manipulate the action while muzzle direction has become secondary.

### 5.2 R — Remove all ammunition

The purpose is to remove ammunition sources rather than treat one component as synonymous with the firearm's complete loaded state.

The key conceptual lesson is that **removing a detachable magazine does not establish an empty chamber**. Conversely, observing an empty chamber does not establish an empty feeding path or magazine.

Argus should teach the concept without becoming a simulator for the operating sequence of specific firearm actions.

**Failure pattern:** “magazine removed, therefore unloaded.”

### 5.3 O — Observe the chamber

The chamber is where a cartridge may remain even after ammunition elsewhere has been removed. Observation therefore tests a different proposition from magazine removal.

**Failure pattern:** assuming action movement or magazine removal automatically proves the chamber empty.

Argus can safely ask whether chamber observation is still required. It should not attempt to teach the physical inspection technique for every action type.

### 5.4 V — Verify the feeding path

The feeding path can retain ammunition, empty cases or foreign objects. Verification checks the route by which ammunition reaches the chamber, not just the chamber itself.

This step is especially valuable educationally because it exposes why “I looked in the chamber” is not a complete proof.

**Failure pattern:** stopping after O because the most visually obvious location is empty.

### 5.5 E — Examine the bore for obstructions

The bore must be checked for obstructions. The handbook also references lubricant and rust in the unloading procedure.

The Argus learning objective is modest: the learner should know that an empty chamber and feeding path do not establish that the bore is clear and that an obstruction is a stop condition, not something to ignore before firing.

Argus should **not** teach improvised methods for clearing a bore, diagnosing barrel damage or deciding that a questionable bore is safe to fire. Those are hands-on matters for qualified instruction or appropriate professional service.

**Failure pattern:** treating “no ammunition present” as equivalent to “firearm ready for use.”

---

## 6. Universal handling assumptions worth teaching

These are the high-value generalizations that make the course more than acronym recall.

### 6.1 Safety status is not inherited from another person

A statement such as “don't worry, it's unloaded” is not proof.

The recipient should apply ACTS and accept only an open, unloaded firearm consistent with the CFSC handbook. A scenario should reward the learner for refusing to let social confidence replace the procedure.

### 6.2 Safety status is not permanent

The handbook says the firearm is unloaded and safe until it leaves the direct control of the person who unloaded and PROVEd it safe.

Argus should turn this into a repeated rule:

> **Loss of direct control breaks continuity. Re-establish status rather than relying on the earlier check.**

This is one of the strongest scenario concepts because it tests understanding rather than rote letters.

### 6.3 A mechanical safety is not a guarantee

The handbook warns that safeties can wear or fail and that a loaded firearm may still fire with the safety engaged.

Therefore:

- safety ON does not permit unsafe muzzle direction;
- safety ON does not permit a finger in the trigger guard;
- safety ON does not replace PROVE;
- safety OFF is not the only state in which a firearm deserves full ACTS handling.

### 6.4 One successful check does not replace the sequence

Each PROVE step answers a different question. Argus should treat partial verification as incomplete, even when the learner happened to discover one correct fact.

Examples:

- magazine absent but chamber unknown;
- chamber empty but feeding path unknown;
- ammunition removed but bore not examined;
- bore apparently clear but chamber not checked.

### 6.5 “Open” is a transfer condition, not permission to become careless

The handbook says to pass or accept only open and unloaded firearms. Argus should teach this as an additional visible safety condition for handoff, not as a reason to stop applying ACTS.

### 6.6 Unfamiliarity is a stop signal

The handbook advises not attempting to handle a firearm when uncomfortable handling it and to seek help from a qualified person.

Argus should actively reward:

- “I do not know how this action works”;
- “I cannot establish the condition safely from the information given”;
- “seek qualified assistance.”

The course must not frame guessing as courage or competence.

### 6.7 Procedure is more important than confidence

A learner can be highly confident and wrong. The app should score completion of the safety logic, not certainty language.

A useful recurring answer is:

> **Insufficient information to treat it as safe — maintain ACTS and PROVE it or defer to qualified hands-on help.**

---

## 7. Common safety failures to teach explicitly

The course should use a small failure taxonomy so scenario feedback is consistent.

### Failure 1 — Condition-by-assurance

**Pattern:** “The owner said it was unloaded.”  
**Error:** outsourced verification.  
**Correction:** apply ACTS and establish condition through PROVE.

### Failure 2 — Condition-by-memory

**Pattern:** “I unloaded it twenty minutes ago.”  
**Error:** stale status, especially after loss of direct control.  
**Correction:** re-establish status.

### Failure 3 — Magazine fallacy

**Pattern:** “The magazine is out, so it is unloaded.”  
**Error:** chamber and feeding path remain unverified.  
**Correction:** complete PROVE.

### Failure 4 — Chamber-only shortcut

**Pattern:** “The chamber looks empty.”  
**Error:** feeding path and bore remain unchecked.  
**Correction:** complete PROVE.

### Failure 5 — Mechanical-safety substitution

**Pattern:** “The safety is on, so muzzle and trigger discipline are less important.”  
**Error:** reliance on a mechanical device.  
**Correction:** ACTS remains fully active.

### Failure 6 — Task fixation

**Pattern:** attention narrows onto the magazine, bolt, lever or chamber and the muzzle sweeps another person.  
**Error:** manipulating the firearm while suspending C.  
**Correction:** muzzle control remains continuous.

### Failure 7 — Premature trigger contact

**Pattern:** finger enters the trigger guard while checking or carrying the firearm.  
**Error:** T violation independent of loaded status.  
**Correction:** finger remains off the trigger and outside the guard.

### Failure 8 — Open-action overconfidence

**Pattern:** open action is treated as proof of total safety.  
**Error:** open is valuable but does not replace ACTS/PROVE.  
**Correction:** maintain all rules and verify the complete condition.

### Failure 9 — Bore omission

**Pattern:** learner reaches the conclusion “safe” after ammunition checks without considering the bore.  
**Error:** PROV without E.  
**Correction:** complete the full acronym.

### Failure 10 — Guessing on an unfamiliar firearm

**Pattern:** learner improvises an operating method because “all guns basically work the same.”  
**Error:** unsupported generalization.  
**Correction:** maintain ACTS and seek qualified assistance.

### Failure 11 — Handoff shortcut

**Pattern:** passing or accepting a closed firearm based on trust.  
**Error:** violates the handbook's open-and-unloaded handoff rule.  
**Correction:** pass or accept only open and unloaded, with ACTS still maintained.

### Failure 12 — App-confidence error

**Pattern:** “I passed the Argus course, so I know how to handle firearms.”  
**Error:** confusing declarative knowledge with physical competency.  
**Correction:** only supervised practical training and testing can assess physical handling performance.

---

## 8. Scenario design

The course should be scenario-led but deliberately **non-tactical**. Scenarios test whether the learner preserves the safety framework, not whether they can operate firearms quickly or efficiently.

### 8.1 Scenario families

#### A. Handoff scenarios

Example:

> A friend offers you a firearm with the action closed and says, “It's unloaded; I checked it.” What is the safety problem?

Desired reasoning:

- another person's assurance does not establish safe status;
- pass or accept only open and unloaded;
- ACTS applies immediately;
- condition must be established through PROVE by a person competent to do so.

The scenario should not reward the fastest physical manipulation.

#### B. Loss-of-control scenarios

Example:

> You PROVE a firearm safe and place it on a bench. You leave the room and return later. Can you rely on the earlier check?

Correct concept:

- no;
- direct-control continuity was lost;
- treat the status as unknown and re-establish it under ACTS/PROVE.

#### C. Partial-PROVE scenarios

Example:

> The magazine has been removed and the action is open. Which conclusion is justified?

Correct concept:

- those are useful observations but not the complete PROVE sequence;
- chamber, feeding path and bore still matter;
- do not jump to “safe” from one condition.

#### D. Mechanical-safety scenarios

Example:

> The safety is ON, but the firearm's muzzle is pointed toward another person while the handler checks the action.

Correct concept:

- C is violated;
- mechanical safety does not replace muzzle control;
- ACTS rules overlap rather than trade off.

#### E. Trigger-discipline scenarios

Example:

> The learner is confident the firearm is unloaded and places a finger inside the trigger guard while carrying it to a table.

Correct concept:

- T remains violated regardless of confidence about unloaded status.

#### F. Safest-available-direction scenarios

These should test contextual reasoning without teaching tactical positioning.

Example presentation:

- simple room or range diagram;
- learner identifies which described direction clearly avoids people and obvious hazards;
- an “insufficient scene information” option is available where the diagram does not establish what is beyond a wall or surface.

Do not teach a universal “always point up/down” rule.

#### G. Unfamiliar-action scenarios

Example:

> You encounter a firearm with an action you do not know how to operate safely. What should you do?

Correct concept:

- maintain ACTS;
- do not experiment to prove competence;
- seek assistance from a qualified person.

#### H. Obstruction scenarios

Example:

> During inspection, the bore appears obstructed or its condition cannot be established confidently. What follows?

Correct concept:

- do not proceed as though the firearm is ready for use;
- maintain safe handling;
- obtain qualified hands-on assistance as needed.

Do not teach clearing methods, tools or firing-based remedies.

### 8.2 Question formats

Recommended reusable item types:

- **Recall:** complete ACTS or PROVE from a letter.
- **Order:** arrange PROVE steps in order.
- **Rule identification:** identify the ACTS rule violated in a scene.
- **Missing step:** identify which part of PROVE was skipped.
- **Best conclusion:** choose the strongest justified conclusion from partial information.
- **What changed?:** decide whether loss of direct control requires renewed verification.
- **Error spotting:** mark every safety failure in a short scenario.
- **Rewrite:** replace a bad explanation such as “it's safe because the safety is on” with doctrine-faithful reasoning.
- **Boundary recognition:** choose when the correct response is to stop and seek qualified assistance.
- **Competence boundary:** distinguish “knows the acronym” from “has demonstrated safe handling.”

### 8.3 Correct-answer philosophy

Argus should routinely make the conservative answer correct when evidence is incomplete.

Examples of valid answers:

- “Status is not established.”
- “Complete PROVE.”
- “Maintain ACTS while condition is unknown.”
- “The safety being ON does not change the rule.”
- “The earlier check is stale because direct control was lost.”
- “Do not guess; seek qualified assistance.”

This course should never reward bravado, speed or unnecessary handling.

---

## 9. Scoring rubric

Scenario scoring should reflect the hierarchy of safety principles rather than treating every error as equal trivia.

### Critical errors

Any answer that normalizes one of the following should fail the scenario outright:

- pointing a firearm at oneself or another person as an acceptable shortcut;
- placing a finger on the trigger or inside the trigger guard during ordinary handling because the firearm is believed unloaded;
- relying on another person's assurance instead of verification;
- relying on a mechanical safety as the main reason the handling is safe;
- declaring a firearm safe solely because the magazine is removed;
- encouraging experimentation on an unfamiliar firearm action;
- proceeding despite an unresolved suspected bore obstruction;
- claiming Argus completion proves real-world firearm-handling competence.

### Major reasoning errors

These should substantially reduce the score:

- missing loss-of-direct-control implications;
- omitting one or more PROVE steps;
- treating an open action as complete proof;
- failing to recognize that safe muzzle direction is context-dependent;
- concluding “safe” when the scenario leaves key status unknown.

### Minor errors

These include:

- recalling the correct principle but misnaming a letter;
- giving a safe but unnecessarily broad answer;
- confusing “magazine” and “feeding path” terminology while still rejecting the shortcut.

### Mastery expectation

For course completion:

- 100% recall of the ACTS and PROVE sequences after correction/review;
- no critical safety error in the capstone;
- at least 85% correct on scenario reasoning overall;
- mandatory remediation and fresh scenario after any critical error;
- no “mastery” label that implies practical certification.

The product term should remain **course complete** or **knowledge complete**, not “qualified,” “certified” or “safe handler.”

---

## 10. What Argus can teach well

### Finite recall

Argus is well suited to:

- ACTS expansion and order;
- PROVE expansion and order;
- the distinction between ACTS and PROVE;
- direct-control rule;
- open-and-unloaded handoff rule;
- mechanical-safety limitation;
- why magazine removal does not prove an empty chamber;
- why chamber observation does not replace feeding-path verification;
- why bore examination is separate;
- the rule to seek qualified help when uncomfortable with a firearm;
- terminology such as chamber, magazine, feeding path, bore, muzzle and trigger guard at a recognition level.

### Scenario reasoning

Argus can also practice:

- recognizing incomplete verification;
- spotting unsafe assumptions;
- choosing to stop rather than guess;
- maintaining multiple safety layers simultaneously;
- deciding when a previous unloaded status has become stale;
- identifying when a scenario does not provide enough information to call something safe.

### Useful spaced review

The mnemonics are well suited to spaced retrieval, but reviews should periodically include a one- or two-paragraph scenario so the memory does not collapse into letter recital without application.

---

## 11. What requires supervised hands-on CFSC training

Argus should explicitly defer the following to the formal course and qualified instruction:

- physically picking up and controlling an actual firearm;
- maintaining safe muzzle direction while manipulating a real firearm;
- demonstrating trigger-finger placement consistently;
- opening, closing and operating specific firearm actions;
- identifying the chamber and feeding path correctly on different firearm types;
- physically removing ammunition safely;
- examining a bore safely;
- identifying action-specific hazards or malfunctions;
- loading and unloading real or deactivated training firearms;
- selecting and matching ammunition;
- demonstrating safe carry procedures;
- storage, display and transportation compliance in practical context;
- firing procedures and range conduct;
- any practical examination of firearm handling.

The CFSC's structure matters here. The Canadian Firearms Program requires in-class instruction followed by written **and practical** tests. That is strong evidence that knowledge recall alone is not the intended competence standard.

Argus should therefore function as:

- pre-course familiarization;
- post-course memory support;
- refresher knowledge practice;
- a compact reference to the doctrine.

It should not market itself as a CFSC alternative or exam substitute.

---

## 12. Safety and product boundaries

### 12.1 No marksmanship

Do not teach:

- aiming technique;
- sight picture;
- shooting positions beyond any minimum reference needed to explain that they are outside scope;
- recoil control;
- trigger press technique;
- accuracy drills;
- speed drills.

### 12.2 No tactical or defensive employment

Do not teach:

- room clearing;
- drawing or presentation;
- defensive firearm use;
- armed confrontation;
- use-of-force decision trees;
- weapon retention;
- target prioritization;
- tactical movement;
- engagement distances;
- concealment or cover use.

### 12.3 No action-specific operating tutorial as the product goal

The CFSC includes operation of firearm actions, but this Argus course should stop at recognition-level concepts and the universal safety framework. A phone app should not encourage a learner to manipulate an unfamiliar firearm based on remembered screen instructions.

### 12.4 No legal overreach

This course is not the place for a full Canadian firearms-law curriculum. Licensing, classification, storage, transport and regulatory details can change and deserve separately versioned material if Argus later adds them.

The only legal/product statement required here is that Argus completion does not satisfy licensing requirements.

### 12.5 No simulated competence theatre

Avoid interactions that visually imitate a practical test so closely that the user could reasonably interpret a passing score as proof of handling skill.

Good:

- diagrams;
- written scenes;
- identify-the-error questions;
- sequence recall;
- safety reasoning.

Avoid:

- “virtual firearm handling certification”;
- speed bonuses;
- swipe-to-rack or tap-to-fire mechanics;
- sound effects rewarding manipulation;
- badges labelled “qualified,” “marksman,” “operator,” or similar.

---

## 13. Misconceptions the course should deliberately correct

1. **“Unloaded means harmless.”**  
   Wrong framing. ACTS remains the handling framework even when a firearm is believed unloaded.

2. **“If I can see the action is open, I know everything I need to know.”**  
   Open is valuable but does not replace the complete process.

3. **“Magazine out means unloaded.”**  
   The chamber may still contain a cartridge; complete PROVE.

4. **“The safety is on, so an accidental discharge cannot happen.”**  
   The RCMP explicitly warns not to rely on a mechanical safety.

5. **“PROVE is only for beginners.”**  
   The doctrine is a repeatable safety process, not a beginner-only crutch.

6. **“If I checked it, anyone else can trust my check.”**  
   Handoff still requires safe transfer conditions and the next handler should not inherit confidence as proof.

7. **“Once PROVEd safe, it stays safe.”**  
   The handbook limits the safe status to direct control by the person who performed the procedure.

8. **“Safe direction always means down.”**  
   The wording is safest **available** direction; surroundings matter.

9. **“If I know ACTS and PROVE, I know how to operate a firearm.”**  
   Mnemonic knowledge is not action-specific physical competence.

10. **“An app can prepare me well enough to skip CFSC instruction.”**  
    False. Formal instruction and practical testing remain required for the licensing path described by the CFP.

---

## 14. Proposed Argus course structure

### Lesson 1 — The safety model: status is unknown until established

**Purpose:** teach why ACTS starts before mechanical condition is known.

Finite knowledge:

- assume every firearm is loaded;
- safe handling uses overlapping controls;
- mechanical safety is supplementary;
- safe status is not inherited from assurance or memory.

Practice:

- 5 recall items;
- 3 short confidence-vs-procedure scenarios.

### Lesson 2 — The Vital Four ACTS

**Purpose:** perfect recall plus application of all four rules simultaneously.

Finite knowledge:

- A, C, T, S exact expansions;
- safest available direction;
- trigger finger outside trigger guard;
- S leads into PROVE.

Practice:

- acronym reconstruction;
- identify the violated rule from 6 short scenarios;
- 2 multi-error scenarios where more than one ACTS rule is violated.

### Lesson 3 — PROVE it safe

**Purpose:** teach the five-step verification logic and why no single check substitutes for another.

Finite knowledge:

- P, R, O, V, E exact expansions;
- distinction between chamber and feeding path;
- bore examination is part of the sequence;
- open-and-unloaded handoff.

Practice:

- order the five steps;
- 5 missing-step items;
- 4 partial-verification scenarios.

### Lesson 4 — Direct control and recurrent failure patterns

**Purpose:** move beyond the mnemonic into durable safety reasoning.

Finite knowledge:

- safe-until-direct-control-is-lost rule;
- mechanical-safety limitation;
- magazine fallacy;
- chamber-only shortcut;
- handoff rule;
- unfamiliarity means stop and seek qualified help.

Practice:

- 6 scenarios involving interruptions, handoffs, forgotten checks and social pressure;
- at least 2 scenarios where the correct answer is “status not established.”

### Lesson 5 — What the app cannot prove

**Purpose:** prevent overconfidence and connect Argus to formal CFSC training.

Finite knowledge:

- CFSC requires in-class instruction plus written and practical testing;
- app completion is not licensing, certification or physical competence;
- physical manipulation of unfamiliar firearm types requires qualified instruction;
- this course excludes marksmanship and defensive/tactical use.

Practice:

- 4 boundary questions;
- 2 “what should you do?” scenarios where qualified hands-on help is the correct endpoint.

### Capstone — ACTS & PROVE mixed safety decisions

Recommended capstone:

- **15 scored scenarios**;
- at least 3 handoff/direct-control scenarios;
- at least 3 partial-PROVE scenarios;
- at least 2 mechanical-safety misconception scenarios;
- at least 2 trigger/muzzle simultaneous-error scenarios;
- at least 2 unfamiliar-action or obstruction stop scenarios;
- at least 2 competence-boundary scenarios;
- at least 1 scenario where information is deliberately insufficient and the learner must refuse to declare the firearm safe.

No critical safety error should be allowed to pass without remediation and a fresh item.

### Recommended initial content size

- **5 lessons + 1 capstone**;
- **20–26 finite recall propositions**;
- **25–35 authored teaching scenarios**;
- **15 capstone scenarios** from a larger pool;
- approximately **30–45 minutes** for a deliberate first completion;
- short later reviews combining mnemonic retrieval with occasional fresh scenarios.

This is large enough to teach reasoning but small enough to remain clearly a safety-literacy course rather than an imitation CFSC.

---

## 15. Authoring rules for future implementation

Every item should satisfy these constraints:

- use current Canadian terminology, not imported U.S. mnemonic variants;
- cite the doctrine version used to author it;
- avoid brand/model-specific manipulation instructions unless future course scope explicitly changes;
- make muzzle and trigger safety active even when the scenario says the firearm is unloaded;
- never imply a mechanical safety makes unsafe handling acceptable;
- never reward speed;
- make “stop / recheck / seek qualified assistance” a normal correct answer;
- include “insufficient information” where the safest conclusion cannot be justified from the scene;
- never ask the learner to choose whom to shoot, when to fire or how to use a firearm defensively;
- never frame passing the item as proof of physical competence.

### Feedback style

Feedback should be short and doctrinal.

Good:

> The magazine being removed does not establish an empty chamber. Maintain ACTS and complete PROVE.

Good:

> The safety is a mechanical device and does not replace muzzle or trigger discipline.

Good:

> You lost direct control. Do not rely on the earlier check; re-establish status.

Avoid:

> You would probably be fine because...

Avoid:

> An experienced shooter could skip...

Avoid:

> In a real fight...

The course is safer and more useful when it is procedural and conservative.

---

## 16. Evidence base and source hierarchy

### Primary Canadian doctrine

1. **Royal Canadian Mounted Police — Canadian Firearms Safety Course, Student Handbook (2014)**  
   Primary doctrine for the exact Vital Four ACTS and PROVE wording, direct-control rule, open-and-unloaded transfer rule, mechanical-safety caution, and the course's relationship between handbook study and instructor-led practical exercises.  
   Government of Canada Publications PDF:  
   https://publications.gc.ca/collections/collection_2015/grc-rcmp/PS99-2-2-1-2014-eng.pdf

   High-value sections located in this research pass:

   - handbook introduction: the book plus classroom lessons and practical exercises together teach safe handling;
   - Module 3, §3.1.7: PROVE table;
   - Module 6, §6.10.1: Vital Four ACTS and PROVE before unloading;
   - loading/unloading sections: continuous safe muzzle direction, trigger isolation and complete PROVE;
   - action sections: warning not to rely on the mechanical safety;
   - later loading section: do not handle a firearm when uncomfortable; seek assistance from a qualified individual.

2. **Royal Canadian Mounted Police — Safety courses**  
   Current Canadian Firearms Program page confirming the CFSC remains the introductory mandatory course path for first-time PAL applicants and includes in-class instruction followed by written and practical tests. Current topic list includes basic safety, action operation, handling/carry, owner responsibilities and storage/transport/display.  
   Date modified on source: 2024-10-23.  
   https://rcmp.ca/en/firearms/firearms-safety-training-transport-and-storage/safety-courses

3. **Royal Canadian Mounted Police — 2025 Commissioner of Firearms Report**  
   Current CFP source confirming responsibility for national firearms-safety training standards and announcing that national rollout of a new CFSC/CRFSC curriculum begins in 2026. This creates a specific revalidation requirement before Argus ships exact doctrine content.  
   https://rcmp.ca/en/corporate-information/publications-and-manuals/2025-commissioner-firearms-report

4. **Royal Canadian Mounted Police — Firearms**  
   Current program-level source confirming the Canadian Firearms Program oversees licensing and registration and maintains national firearm-safety training standards under the Firearms Act / Criminal Code framework.  
   Date modified on source: 2026-01-15.  
   https://rcmp.ca/en/firearms

5. **Royal Canadian Mounted Police — Canadian Firearms Safety Course instructors**  
   Current operational source confirming jurisdictional delivery arrangements and listing Firearms Safety Education Service of Ontario as the Ontario service-delivery agent.  
   Date modified on source: 2026-09-01.  
   https://rcmp.ca/en/firearms/canadian-firearms-safety-course-instructors

### Ontario delivery context — secondary

6. **Firearms Safety Education Service of Ontario — Canadian Firearm Safety Course (CFSC)**  
   Current Ontario delivery page. It describes beginner-level instruction in safe use/handling and owner responsibilities, states a minimum eight hours of course instruction excluding written/practical testing, and directs students to the Student Manual for advance review. Use this for Ontario delivery context, not to override RCMP doctrine.  
   https://fseso.org/course/canadian-firearm-safety-course-cfsc/

### Historical cross-check

7. **Royal Canadian Mounted Police — Canadian Firearms Safety Course (2008)**  
   Earlier official manual reproduces the same Vital Four ACTS and PROVE concepts, including the direct-control limitation. Useful as a continuity check, but the 2014 Student Handbook should be preferred where wording differs.  
   https://publications.gc.ca/collections/collection_2013/grc-rcmp/PS99-2-2-2008-eng.pdf

### Source limitations

- The exact ACTS/PROVE wording located publicly is from the RCMP 2014 Student Handbook, not a newly published 2026 student manual.
- The CFP's 2025 annual report explicitly says new national course materials begin rolling out in 2026; therefore doctrine must be rechecked before implementation and periodically afterward.
- The current public CFP safety-course page confirms course structure and scope but does not itself spell out ACTS and PROVE.
- FSESO is relevant to Ontario delivery but is secondary to the RCMP/CFP for national doctrine.
- This research intentionally excludes marksmanship, tactical use, defensive employment and detailed action-specific manipulation instruction.

---

## 17. Ship / revise / reject

**Recommendation: SHIP — after one current-doctrine revalidation immediately before content implementation.**

The course fits Argus unusually well because it combines:

- a small finite body of exact Canadian recall material;
- strong scenario applications;
- clear real-world safety value;
- an explicit boundary against overclaiming competence;
- a natural relationship to formal training rather than competition with it.

### Proposed Argus treatment

- Title: **Canadian Firearm Safety I — ACTS & PROVE**.
- Use the RCMP wording exactly where it names ACTS/PROVE concepts.
- Teach the framework as layered error control, not just acronym memorization.
- Make direct-control loss, mechanical-safety overconfidence, magazine-only checking, incomplete PROVE and unfamiliar-firearm guessing recurring scenario themes.
- Make conservative uncertainty handling a first-class answer pattern.
- Include an explicit doctrine-version check because the CFP is rolling out updated national curriculum in 2026.
- Keep the course entirely outside marksmanship, tactical use, defensive employment and use-of-force instruction.
- Treat formal CFSC instructor-led practical training and testing as the authority for physical handling competence.

## Exact completion claim

> **Completed Canadian Firearm Safety I — ACTS & PROVE:** demonstrated recall of the RCMP ACTS/PROVE safety framework and applied its principles successfully across authored firearm-safety scenarios. This completion records knowledge practice only; it does not certify firearm-handling competence, replace supervised CFSC instruction or practical testing, satisfy firearms-licensing requirements, or authorize firearm possession or use.
