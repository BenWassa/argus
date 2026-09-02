# Argus: Product Requirements Document

**Working name:** Argus (Argus Panoptes, the hundred-eyed watchman). Alternates: Mnemosyne (memory), Aegis (protection), Praxis (practice).

**Status:** Draft v0.1, vision and scope definition
**Owner:** Ben
**Date:** 29 July 2026

---

## 1. Vision

### One line
A finite library of closed-scope competencies, where every topic can be genuinely finished.

### The problem
Self-directed learning tools fail in two directions. Habit and productivity apps track effort without ever producing mastery. Broad-domain learning apps (finance, communication, fitness) open subjects that never close, so progress feels like maintenance rather than accumulation. The satisfaction of learning the NATO alphabet came from a specific property: it is a fixed set of 26 items, and when you know all 26, you are done. Permanently.

### The insight
Competence is more motivating when it is bounded. A skill with a known edge produces a completion event. Completion events compound into an identity claim: *I am someone who knows how to do things.* Open-ended domains never produce that event, which is why they get abandoned.

### The product
Argus is a personal skill library built entirely from closed-scope competencies. Every topic in it satisfies one test: **can this be finished?** A fixed alphabet, a named framework with a known number of parts, a specific protocol, a defined set of knots. If a topic requires indefinite maintenance or has no natural edge, it does not belong in the library.

The library spans three tracks:
- **Learning:** recall systems, psychology frameworks, memory technique
- **Survival:** emergency medicine, navigation, environmental hazards, physical skills
- **Tradecraft:** situational awareness, threat assessment, counter-surveillance, movement mechanics, cognition under stress

### What it is not
- Not a habit tracker
- Not a course platform or curriculum
- Not a gamified streak engine
- Not a general knowledge quiz app
- Not a survivalist or prepper product. The framing is competence, not catastrophe

### Success condition
Twelve months in, the library holds 40 to 60 completed topics, and the owner can recall the substance of any of them cold, without having opened the app in weeks.

---

## 2. Design principles

| Principle | Implication |
|---|---|
| **Finishability is the entry gate** | A topic without a defined edge is rejected at authoring time, not managed later |
| **Retention over exposure** | Completion means recall after a delay, not having read the material once |
| **Drill type follows content type** | Recall sets, procedural sequences, and judgment scenarios need different Test mechanics |
| **Owner-authored** | Content is written by the user, not consumed from a catalogue. Authoring is part of the learning |
| **Portable** | Full library exports to JSON. No lock-in, no dependency on the app surviving |
| **Mobile-first, minimal UI** | Testing happens in short sessions on a phone. No dashboard sprawl |
| **No streaks, no shame** | Missed days do not reset progress. Retention decay is surfaced as information, not punishment |

---

## 3. Content model

### Topic
The atomic unit. A closed-scope competency.

**Required fields**
- `id`, `title`, `track` (learning / survival / tradecraft)
- `scope_definition`: an explicit statement of the topic's boundary, e.g. "26 letters" or "the 6 domains of observation". **This field is mandatory. A topic that cannot state its boundary cannot be created.**
- `item_count`: the finite count implied by scope
- `drill_type`: recall / procedure / judgment / physical
- `status`: unstarted / learning / drilled / completed / decayed
- `source`: book, manual, or reference the content is drawn from

**Optional fields**
- `prerequisite_ids`, `notes`, `last_tested`, `retention_score`

### Item
A single unit inside a topic. A letter, a framework component, a step in a protocol, a scenario.

### Drill types

**Recall.** Fixed sets, tested both directions. Spaced repetition, standard SM-2 style intervals.
*Examples:* NATO alphabet, Morse code, Big Five facets, cognitive bias set, logical fallacies.

**Procedure.** Ordered sequences where order is the content. Tested by reconstructing the sequence, not recognizing it.
*Examples:* Stop the Bleed protocol, PASS for extinguishers, recovery position, combat breathing, slicing the pie.

**Judgment.** Situational prompts with no single correct answer. Tested by writing a response, then comparing against the reference reasoning. Self-scored.
*Examples:* baseline-and-anomaly reading, TEDD assessment, de-escalation scripting, stroke recognition under ambiguity.

**Physical.** Cannot be validated in-app. Logged as attested practice with a date and a self-assessment. Honest about its own limits.
*Examples:* knots, tourniquet application on a limb, splinting, fire building.

### Status lifecycle

```
unstarted -> learning -> drilled -> completed
                            ^            |
                            |            v
                            +-------- decayed
```

- **drilled:** all items correct in a single session
- **completed:** all items correct after a 30-day gap; early Tests do not reset the qualifying clock
- **decayed:** a previously completed topic that failed a spot check. Returns to drilling, but retains its completion history

Completion is a durable achievement. Decay is a routing signal, not a demotion.

---

## 4. Initial library

Seeded content for v1. Roughly 45 topics.

### Track: Learning

**Recall systems**
- NATO phonetic alphabet *(already complete, seeds the library)*
- Morse code
- Maritime semaphore flags
- Phonetic number system for digit memorisation
- Method of loci
- Name-and-face technique
- Metric to imperial conversion set

**Psychology frameworks**
- Big Five: 5 traits, 30 facets
- Self-determination theory: 3 needs, motivation continuum
- Attachment: 4 patterns and behavioural markers
- Cognitive biases: the decision-relevant working set (~15)
- Logical fallacies: the working set (~20)
- Ekman basic emotions and facial signatures
- Cialdini persuasion principles, with replication status noted
- Negotiation vocabulary: BATNA, ZOPA, anchoring, reservation point
- Motivational Interviewing OARS
- Change and transition models: Kübler-Ross, Bridges, ADKAR
- Sleep architecture: stages and function
- Recognition-primed decision model (Klein)

### Track: Survival

**Emergency medicine beyond CPR-C**
- Stop the Bleed: pressure, packing, tourniquet
- Stroke recognition: BE-FAST
- Anaphylaxis and auto-injector use
- Opioid overdose and naloxone
- Recovery position and airway management
- Shock recognition
- Concussion red flags
- Burn classification and immediate treatment
- Splinting a suspected fracture
- Hypothermia and heat stroke tipping points
- SAMPLE and OPQRST patient assessment

**Navigation**
- Finding north: sun, shadow stick, Polaris, Southern Cross
- Compass bearing and map orientation

**Environment and hazard**
- Rule of threes as triage frame
- Water purification methods and their limits
- Fire building: tinder, kindling, structure
- Signalling: ground-to-air symbols, whistle codes, mirror flash
- Cold water immersion: the 1-10-1 principle
- Hazard responses: rip current, house fire, vehicle in water, avalanche
- Essential knots: bowline, clove hitch, sheet bend, taut-line hitch
- Fire extinguisher: PASS
- Vehicle basics: jump start, oil, tire pressure, tire change

### Track: Tradecraft

**Observation**
- Cooper's colour code
- Baseline and anomaly
- Six domains of observation: kinesics, biometrics, proxemics, geographics, iconography, atmospherics
- Pre-incident indicators of violence
- De Becker's PINS
- Cluster logic: why single cues mean nothing

**Counter-surveillance**
- TEDD: time, environment, distance, demeanour
- Surveillance detection route construction
- Choke points and channels
- How surveillance teams operate, at conceptual level, as the basis for detecting them

**Spatial reading**
- Reading a room: exits, cover, concealment
- Positioning and seat selection
- Pattern-of-life self-audit: recognising your own predictability
- Natural lines of drift, anchor points, habitual areas

**Movement mechanics**
- Slicing the pie
- Threshold discipline and the fatal funnel
- Corner-fed vs centre-fed room geometry
- Points of domination and sectors of responsibility
- Eyes lead the body: searching before moving
- Deliberate vs dynamic clearing, and why solo clearing is unsound

**Cognition under stress**
- OODA loop
- Adrenaline effects: tunnel vision, auditory exclusion, time distortion, fine-motor loss
- Combat breathing, four-count
- Hick's Law and the case for few simple responses
- Inattentional and change blindness

**Social tradecraft**
- Elicitation
- Cover for status and cover for action
- Grey man principle
- Verbal de-escalation as first option

### Source anchors
*Left of Bang* (Van Horne, Riley). *The Gift of Fear* (de Becker). *Sources of Power* (Klein). Stop the Bleed and Red Cross protocols. USMC MCWP publications (public domain). Standard psychology texts for framework accuracy.

---

## 5. Functional requirements

### v1 (must have)

**Library**
- Browse topics by track, filter by status and drill type
- Topic detail view: scope definition, item list, status, test history
- Create and edit topics. `scope_definition` and `item_count` are required to save

**Test**
- Daily session, target under 5 minutes, mixed across due topics
- Recall drills: both-directions prompting, SM-2 intervals
- Procedure drills: reorder or reconstruct a sequence
- Judgment drills: free-text response, reveal reference reasoning, self-score
- Physical drills: log an attested practice with date and self-assessment

**Progress**
- Completion count per track
- Decay queue: completed topics due for a spot check
- Completion log with dates. The permanent record of finished topics

**Data**
- Full JSON export and import
- Local-first storage. Offline capable

### v2 (should have)
- Prerequisite chaining, so foundational topics gate dependent ones
- Retention curve view per topic
- Scenario compositing: pull items from multiple topics into one prompt, e.g. an emergency scenario drawing on bleeding control plus shock recognition plus signalling
- Topic templates for faster authoring

### Explicitly out of scope
- Multi-user, social, or leaderboard features
- Streaks, badges, XP
- A pre-built content marketplace
- Video or media hosting
- Any medical or tactical claim of certification. The app is a memory and rehearsal tool, not a credential

---

## 6. Non-functional requirements

- **Platform:** mobile-first web app, installable as PWA
- **Storage:** local-first. Optional sync in a later version
- **Performance:** Test session opens in under one second, cold
- **Offline:** all Learn and Test functions work with no network
- **Data ownership:** JSON export is a first-class feature, not an afterthought

---

## 7. Risks and open questions

| Risk | Mitigation |
|---|---|
| **Authoring burden exceeds practice benefit** | Seed the first 10 topics before building any authoring UI. Validate that drilling is worth it before optimising creation |
| **Judgment drills are unfalsifiable and drift into self-flattery** | Reference reasoning must be written at authoring time, before any self-scoring. Consider a "what would disconfirm this read?" prompt |
| **Scope creep back toward open domains** | The `scope_definition` field is a hard gate. Enforce it in validation, not by discipline |
| **Physical skills logged but never actually practised** | Surface attested-only topics separately from drilled ones. Do not let a log entry masquerade as competence |
| **Overbuild** | v1 is a library, a Test loop, and a JSON export. Nothing else. Ship before adding retention curves and prerequisite graphs |

**Open questions**
1. Are the three tracks the right cut, or is drill type the more useful primary axis?
2. Does the 30-day gap for completion need tuning per drill type? Procedures may decay faster than recall sets
3. Should decayed topics be visible in the completion count, or held separately?
4. Is there a fourth track for language and communication, or does that stay out as too open-ended?

---

## 8. Build sequence

1. **Content first.** Author 10 seed topics as raw JSON, one per drill type minimum. No UI
2. **Test loop.** Recall and procedure drills against the seed JSON. This is the core value test
3. **Library views.** Browse, filter, topic detail
4. **Authoring UI.** Only after the Test loop has proven worth the effort
5. **Judgment and physical drill types**
6. **Progress and decay queue**
7. **Export and import**

Step 2 is the go / no-go. If drilling the seed topics does not feel worth five minutes a day, the concept is wrong and no amount of UI fixes it.
