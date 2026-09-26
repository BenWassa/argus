# Issue #104 — Scenario items: the smallest capability that unlocks the field and human-skills courses

**Status:** design proposal / owner decision — not implemented  
**Date:** 2026-09-25  
**Issue:** #104  
**Library format:** v5 today; this proposal requires v6  
**Relationship:** answers owner decision C in `ISSUE_104_FIELD_HUMAN_SKILLS_EXPANSION.md` (§9, §13) for the eleven course specs in `library-research/`.

## Summary

None of the eleven field and human-skills specs can ship its completion claim on today's item. Each claim includes applying knowledge “in authored scenarios”, and a self-scored prompt/answer card cannot score that.

The smallest reusable capability that unlocks most of that work is **one new item kind: an authored single-best-answer scenario**. It has a short scene, a question, three to five options with exactly one keyed best answer, a rationale for every option, and a small number of options marked **critical** that fail the attempt on their own. It is machine-graded, carries two or more variants per scored unit so Test does not reward memorizing one scene, and adds nothing else: no free text, no branching, no media, no per-course UI.

The only field-lane topic shipped in this wave is the ACTS & PROVE **recall layer** (`firearm-safety-acts-prove`), under the separate recall claim the umbrella paper gives it (§8.1 Q/R). Its scenario layer is one of the first consumers proposed below.

---

## 1. Why today's item cannot score these claims

A `Topic` scores `items: { prompt, answer }[]`. Test reveals the answer and the learner grades themselves by swipe. For an ordinary topic that grade feeds the attempt tally and nothing else: only the Morse acquisition ladder records per-item, per-direction evidence.

That works when the answer is a fixed fact the learner can compare against. It fails for judgement, for five reasons:

1. **Self-grading judgement is not evidence.** A learner who would have chosen the unsafe response can still read the model answer and swipe right. A prompt like “what should you say next?” is only scored honestly if the app knows which response the learner picked.
2. **There is nowhere to put the plausible wrong answers.** Every spec builds its practice around named misconceptions: “the magazine is out, so it's unloaded”, “an anomaly is a threat”, “empathy means agreement”. Those need to be offered as options and rejected.
3. **There is no rationale per answer.** The specs' feedback style is short and doctrinal (“You lost direct control. Do not rely on the earlier check.”). The current card can only show one answer.
4. **One fixed prompt is memorized within a few runs.** After that, Test measures recall of that scene, not application of the principle.
5. **There is no hard-fail gate.** Every spec has a safety gate: profiling, diagnosing, confronting, ignoring immediate danger, accepting a closed firearm on someone's word. A 90% score must still fail when the 10% was one of those.

Two of the eleven specs also have a recall claim in the umbrella paper that the current item *could* hold, but it was deliberately not shipped:

- **Firearm storage, display and transportation** (umbrella §8.1 S). The answers are multi-clause legal rules that a learner cannot reliably self-grade, and the restricted and prohibited routes are near-duplicates, so their prompts would be ambiguous. The deep spec's claim also requires applying the rules and separating legal minimums from good practice. It waits for scenario items and a fresh legal-snapshot review.
- **Psychological First Aid** (umbrella §5 K). The recall layer is four words plus paraphrased meanings. Shipping it alone would present PFA as a mnemonic, which is the outcome the spec argues against, and the paraphrases are not Red Cross text.

## 2. What the eleven specs ask for

| Spec | Recall layer on today's items | Scenario forms the claim needs | Covered by single-best-answer? | Beyond the smallest capability |
|---|---|---|---|---|
| Situational awareness I | Small | Which detail is new / relevant; enough information? | Yes | Layer C two- or three-step reassessment |
| Observation vs inference | Small | Classify a statement; which question least contaminates | Yes | Rewrite a loaded statement; incident report |
| De-escalation I | Small | What to say next; spot the mistake; continue, disengage or get help | Yes | Rewrite a poor response |
| Crisis active listening (FBI ALS) | 8 technique names | Which technique is this; choose the better response | Yes | Construct a response |
| Threat recognition I | Vocabulary + 3 categories | Ordinary / concerning / urgent / insufficient; what to report | Yes, via critical options for the safety gate | Revising after new information; 5-dimension rubric |
| Bias control | 8 failure names | Detect the biased reasoning; what evidence discriminates | Yes | — |
| Psychological First Aid | Look, Listen, Link, Live | What first; support or intrusion; escalate? | Yes, via critical options for hard fails | — |
| Interviewing I | Phases, question types | Which question next; statement vs interviewer inference | Yes | Contemporaneous note writing |
| ACTS & PROVE (scenario layer) | **Shipped** | Violated rule; missing step; status not established | Yes, via critical options | — |
| Safe handling fundamentals | Small | Condition, transfer, range command, abnormal-condition stop | Yes, via critical options | — |
| Storage, display and transport | Long legal rules (not shipped, §1) | Apply the rule to a firearm class and situation | Yes | Legal-snapshot staleness handling |

Single-best-answer covers the core of all eleven. What it leaves out is concentrated in two places: free-text production, and multi-step reassessment.

## 3. The proposal

### 3.1 Item shape

```ts
type Item = TextItem | ScenarioItem   // TextItem is today's { id, kind, prompt, answer }

interface ScenarioItem {
  id: string
  kind: 'scenario'
  /** The principle this unit scores, stated plainly. Shown in Learn. */
  concept: string
  /** Two or more interchangeable scenes testing the same concept. */
  variants: ScenarioVariant[]
}

interface ScenarioVariant {
  id: string
  setup: string              // short authored scene, plain text
  observations?: string[]    // bounded list of stated facts, when the scene needs one
  question: string
  options: ScenarioOption[]  // 3–5, shown in shuffled order
  sources: string[]          // labels from topic.learn.sources, plus the spec section applied
}

interface ScenarioOption {
  id: string
  text: string
  verdict: 'best' | 'weaker' | 'critical'
  rationale: string          // shown after answering, for every option
}
```

This is a sketch of the contract, not a final schema. Its rules:

- exactly one `best` option per variant;
- `critical` is reserved for answers a spec's safety gate names. It is never a way of marking an option as merely wrong;
- “Insufficient information” and “No material anomaly” are ordinary options, and may be the best answer. Several specs require them to be the correct answer regularly;
- plain text only, like the rest of the Learn model: no HTML, no media, no per-course component names.

### 3.2 Test and scoring

- **Machine-graded.** A scenario card shows the scene and options and records the option chosen. There is no reveal-and-swipe step, so the learner never grades their own judgement.
- **One variant per unit per run.** The run picks the variant this learner has seen least recently. The attempt answer records `{ itemId, variantId, optionId, correct, critical }`.
- **Critical choices fail the attempt.** A retention attempt counts as passing under the existing threshold rules only if no critical option was chosen anywhere in the run. A critical choice shows its rationale at once and returns the unit to Practice.
- **The scheduler, ladder and completion rules are unchanged.** A scenario unit is one scored unit, exactly like a text item.
- **Feedback** shows the rationale for the chosen option and for the best option. Rationale text is written in the specs' doctrinal style.

### 3.3 Learn and Practice

- The Learn **Recall reference** lists each scenario unit by its `concept`, never its Test variants and keyed answers. Printing those would turn the application claim back into recall of specific scenes.
- A topic may include one **worked example** in Learn. It is a variant marked Learn-only and excluded from the Test pool, and it fits the existing `caseStudies` model.
- **Practice** may draw any variant, including ones missed in Test, and stays formative as `TARGETED_PRACTICE.md` defines it.

### 3.4 Topic shape and claims

- A topic may hold text items and scenario items together. This matches the two-layer assessment most specs describe: recall plus application under one claim.
- The completion claim of any topic with scenario units must say “in authored scenarios”. It must never imply field, professional, licensing or handling competence. The specs' non-claims appear in `learn.limitations`.
- **Shipped topics are not retrofitted.** Adding scenario units to `firearm-safety-acts-prove` would change what an existing completion means, so its application layer should ship as a new topic id (for example “ACTS & PROVE in practice”). This follows the same rule that makes catalog reconciliation append-only.

### 3.5 Storage, sync and the parse boundary

- The item union changes, so the library format moves to **v6**. The v5 → v6 migration is a promotion only, because no v5 library can contain a scenario item. v6 export and import follow the path v4 → v5 took.
- The parser rejects any scenario item that breaks §3.1: fewer than two variants, fewer than three or more than five options, anything other than exactly one `best`, an empty rationale, duplicate ids or unknown fields. An older client rejects a v6 export with a clear message rather than silently dropping items.
- Firestore sync (`ISSUE_93_FIREBASE_PROGRESS_SYNC.md`) and the IndexedDB authority (`ISSUE_113_OFFLINE_FIRST_RUNTIME.md`) carry the new shape. The sync planner needs a version guard so an older device does not overwrite a v6 record.
- Catalog reconciliation needs no change: new topics still arrive appended and unstarted.
- Size: one variant is roughly 1 KB, so eleven courses of about 40 variants each come to about 0.5 MB of curriculum source. That fits the 5 MiB app-shell budget, but it is the point at which the `optionalPacks` slot in the build-size report should start doing work.

## 4. Deliberately outside the smallest capability

- **Free-text production:** rewrite, construct and incident-report exercises. There is no honest automatic grading for these. A later formative Practice mode could show a model answer for self-comparison, but that must never count as scored evidence.
- **Staged scenarios**, where new information changes the answer (situational awareness Layer C; threat recognition scenario K). The first approximation is two variants shown in sequence, the second revealing the update. A true staged format is the first extension to consider if that proves too weak.
- **Rubric scoring** across several dimensions (threat recognition's five-dimension 0–2 rubric). Option verdicts plus critical options are the approximation.
- **Images, video and audio.** The visual wave (WHMIS, clouds, signal flags) is a separate capability in `ISSUE_104_LIBRARY_EXPANSION_RESEARCH.md` §8.2.
- **Branching dialogue, timers or speed as evidence, and LLM grading.**

## 5. Authoring and provenance rules

- Every variant cites the primary source it applies and the spec section it implements, in the same way `SEEDED_CONTENT_PROVENANCE.md` records every scored item today.
- Every option carries a rationale. Distractors come from the spec's own misconception lists, not invented foils.
- The specs' boundaries apply to every variant: no demographic threat cues, no amateur diagnosis, no confrontation requirement, no covert-surveillance instruction, and for firearms nothing tactical, no marksmanship and no action-specific manipulation.
- Safety-sensitive topics (threat recognition, PFA, the firearm lane) get a second editorial review of every critical option before shipping.
- Where a spec requires “insufficient information” to be the best answer for part of its scenario set, the variant pool reflects that.

## 6. Proposed first consumers

1. **Observation vs inference.** Almost pure classification, with no safety gate. It proves the card, variants, machine grading and the v6 boundary on the simplest content.
2. **ACTS & PROVE in practice.** It exercises critical options and pairs with the shipped recall topic, which tests the rule that application layers ship as their own topics.

Two consumers with different demands test whether the capability is general before the other nine courses are authored against it.

## 7. Owner decisions

- **A.** Approve single-best-answer with critical options as the scenario primitive.
- **B.** Approve the v6 library format bump and its version-guarded sync.
- **C.** Approve the rule that application layers ship as new topics rather than retrofitting shipped claims.
- **D.** Choose the first consumers (default: §6).
- **E.** Confirm that free-text and staged formats stay out until two shipped courses show the approximations in §4 are inadequate.
