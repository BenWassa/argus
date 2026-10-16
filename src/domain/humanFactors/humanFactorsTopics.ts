import type { LearnContent, LearnSource } from '../learning/content'
import type { IdentifiedItem, Topic } from '../library/topic'

/**
 * Analyst Wave 1 (#197): four single-best-answer vignette topics. They sit beside
 * the shipped `ooda-loop` (4 recall items) to make the proposed five-topic,
 * 40-item Human Factors line.
 *
 * Authority: `docs/open/ISSUE_197_ANALYST_WAVE1_HUMAN_FACTORS.md`. The fifth
 * topic is Decision Under Uncertainty I (owner decision, 2026-10-15).
 *
 * STAGED, NOT DELIVERED. These topics are deliberately absent from
 * `catalogSeed.ts` and `shippedCatalog.json`, so no learner receives them and no
 * role can be earned from them. The Wave 1 spec requires an independent review
 * of every answer key and per-item source mapping first. Shipping is then two
 * edits: spread `humanFactorsTopics()` into the seed and add the ids to the
 * manifest. Delete the staging guard in the tests in the same change.
 *
 * Every item is an objective single-answer choice on the existing engine. The
 * claim is recognition and selection inside authored vignettes, never real-world
 * judgement, and each topic says so. The Test card shuffles options per card, so
 * authored order carries no information; options are written at similar length so
 * the key is not the longest or most elaborate choice.
 */
export const OBSERVATION_VS_INFERENCE_ID = 'observation-vs-inference'
export const BIAS_CONTROL_ID = 'bias-control'
export const SITUATIONAL_AWARENESS_ID = 'situational-awareness-i'
export const DECISION_UNDER_UNCERTAINTY_ID = 'decision-under-uncertainty-i'

export const HUMAN_FACTORS_TOPIC_IDS = [
  OBSERVATION_VS_INFERENCE_ID,
  BIAS_CONTROL_ID,
  SITUATIONAL_AWARENESS_ID,
  DECISION_UNDER_UNCERTAINTY_ID,
] as const

type Vignette = readonly [prompt: string, answer: string, wrong: readonly [string, string, string]]

function vignetteItems(topicId: string, vignettes: readonly Vignette[]): IdentifiedItem[] {
  return vignettes.map(([prompt, answer, wrong], index) => ({
    id: `${topicId}-item-${String(index + 1).padStart(2, '0')}`,
    kind: 'forward',
    prompt,
    answer,
    choice: { options: [answer, ...wrong].sort() },
  }))
}

function staged(base: Pick<Topic, 'id' | 'title' | 'scope' | 'items' | 'learn'>): Topic {
  return {
    ...base,
    track: 'learning',
    status: 'unstarted',
    createdAt: new Date(0).toISOString(),
    drilledAt: null,
    learningAt: null,
    completedAt: null,
    lastTestedAt: null,
    spotCheckedAt: null,
    history: [],
  }
}

const ONTARIO_REPORT_WRITING: LearnSource = {
  label: 'Ontario — Training syllabus for security guards, Section 4: Report writing',
  url: 'https://www.ontario.ca/document/training-syllabus-security-guards/section-4-report-writing',
  note: 'Jurisdictional training anchor: reports are to be factual and objective rather than opinion-based. Context for the habit, not evidence that this topic improves real reporting.',
}

const ONTARIO_BASIC_PROCEDURES: LearnSource = {
  label: 'Ontario — Training syllabus for security guards, Section 3: Basic security procedures',
  url: 'https://www.ontario.ca/document/training-syllabus-security-guards/section-3-basic-security-procedures',
  note: 'Jurisdictional training anchor for observing the physical environment and noticing changes. Occupational syllabus, not proof of civilian transfer.',
}

const ONTARIO_PI_ETHICS: LearnSource = {
  label: 'Ontario — Training syllabus for private investigators, Section 6: Principles of ethical reasoning and decision-making',
  url: 'https://www.ontario.ca/document/training-syllabus-private-investigators/section-6-principles-ethical-reasoning-and-decision-making',
  note: 'Jurisdictional anchor for ethical reasoning and for keeping conclusions tied to evidence.',
}

const TVERSKY_KAHNEMAN: LearnSource = {
  label: 'Tversky & Kahneman (1974) — Judgment under uncertainty: heuristics and biases',
  url: 'https://pubmed.ncbi.nlm.nih.gov/17835457/',
  note: 'Primary study naming anchoring and availability. Names the mechanisms; the single best response in each Argus vignette is an authored editorial rule.',
}

/* ------------------------------------------------- Observation vs Inference */

const OBSERVATION_VIGNETTES: readonly Vignette[] = [
  [
    'A security camera log shows the lobby door opening at 09:10. Which entry records only what the camera shows?',
    'Lobby door opened at 09:10.',
    ['Lobby door was forced open at 09:10.', 'Someone hurried through the lobby door at 09:10.', 'Lobby door opened at 09:10 to let a visitor out.'],
  ],
  [
    'A colleague tells you a parcel arrived at noon. You were away from the desk and did not see it. Which log entry is most accurate?',
    'Colleague reports the parcel arrived at noon; I did not see it.',
    ['Parcel arrived at noon and was signed for at the front desk by staff.', 'Parcel arrived at noon, which a colleague confirmed independently.', 'Parcel was delivered by the usual courier a little after noon.'],
  ],
  [
    'A visitor stands facing a posted notice for a minute, then turns and leaves the building. Which statement is an inference rather than an observation?',
    'The visitor found the notice confusing.',
    ['The visitor stood facing the notice.', 'The visitor turned and left the building.', 'The visitor left after standing at the notice.'],
  ],
  [
    'You pass two people talking quietly near reception. Which note records what you observed?',
    'Two people were talking quietly near reception.',
    ['Two people were arranging something they wanted kept secret.', 'Two people were speaking quietly because they feared being overheard.', 'Two people were discussing a private matter near reception.'],
  ],
  [
    'One camera covers a hallway but not the stairwell at its end. A person walks toward the stairwell and passes out of view. What does the footage establish?',
    'The person walked toward the stairwell; what happened next is not shown.',
    ['The person went up the stairs and out of the building on the far side.', 'Nothing of note happened to the person after they left the camera’s view.', 'The person reached the stairwell and stopped there for a short while.'],
  ],
  [
    'You are asking a witness about a vehicle they saw. Which question avoids suggesting an answer?',
    'What can you tell me about the vehicle?',
    ['Was the vehicle going too fast?', 'The vehicle was blue, wasn’t it?', 'Did the driver look like they were in a hurry?'],
  ],
  [
    'A log says “The visitor ignored me on purpose.” You only saw the visitor keep walking after you spoke. Which rewrite keeps the evidence and drops the unsupported claim?',
    'I spoke and the visitor kept walking; I do not know whether they heard me.',
    ['I spoke and the visitor kept walking, which was rude and showed no respect for me.', 'I spoke and the visitor kept walking without a word, as if they were annoyed.', 'I spoke and the visitor deliberately chose not to respond to what I said.'],
  ],
  [
    'A witness says they heard a loud crash at 14:00. The only camera has no audio and shows nothing unusual in its view at 14:00. Which statement is justified?',
    'The crash is only reported; the silent footage cannot confirm or rule it out.',
    ['The witness is mistaken, because the footage shows nothing unusual at 14:00.', 'The footage confirms the crash happened somewhere outside the camera’s view.', 'The crash happened, because the witness has no reason to make it up at all.'],
  ],
  [
    'At 18:00 you see that a staff door is locked. You did not see anyone lock it. Which statement do you actually know?',
    'The door was locked at 18:00.',
    ['The door was locked by a member of staff.', 'The door was locked only a short while earlier.', 'The door was locked for security reasons.'],
  ],
]

const observationLearn: LearnContent = {
  kind: 'briefing',
  overview:
    'A report is stronger when each statement says how you know it. Separate what was directly observed, what someone else reported, and what you concluded, and say what is still unknown.',
  sections: [
    {
      heading: 'Three kinds of statement',
      blocks: [
        {
          type: 'definitions',
          items: [
            { term: 'Observation', definition: 'What you or a recording directly saw or heard: “The door opened at 09:10.”' },
            { term: 'Report', definition: 'What someone else says they saw. Log it as theirs: “Colleague reports a parcel arrived at noon.”' },
            { term: 'Inference', definition: 'A conclusion that goes beyond the evidence: “The visitor was angry.” Label it, or leave it out.' },
          ],
        },
        {
          type: 'bullets',
          items: [
            'Write the action, not the motive: “kept walking after I spoke”, not “ignored me on purpose”.',
            'Say what the evidence does not cover: a camera shows only what is in its view.',
            'Ask open questions. A question that contains your guess can plant it in the witness’s answer.',
          ],
        },
      ],
    },
  ],
  caseStudies: [
    {
      title: 'The visitor who turned back',
      scenario: 'A visitor reaches the front desk, looks at a sign, and walks out again. The first draft of the log reads: “Visitor was nervous and left suddenly.”',
      analysis: [
        {
          heading: 'Walkthrough',
          blocks: [
            { type: 'paragraph', text: 'Observed: the visitor reached the desk, looked at the sign and left. “Nervous” and “suddenly” are inferences about feeling and speed that nothing here supports. A sound rewrite records the three actions and adds “reason for leaving unknown”.' },
          ],
        },
      ],
      takeaway: 'Keep the actions and drop the feelings you cannot see.',
    },
    {
      title: 'A reported noise',
      scenario: 'A neighbour says they heard banging in the loading bay overnight. The loading bay camera has no audio and shows nothing out of place.',
      analysis: [
        {
          heading: 'Walkthrough',
          blocks: [
            { type: 'paragraph', text: 'The noise is a report, and the footage is silent. The footage does not confirm the banging and does not disprove it. Log both facts, and note that the cause and timing of the noise are unknown.' },
          ],
        },
      ],
      takeaway: 'Evidence that is silent on a point is not evidence against it.',
    },
  ],
  limitations: [
    'Practice at labelling statements inside short invented scenarios. It does not measure eyewitness accuracy, investigative skill or lie detection, and it is not a reporting certification.',
    'Real reports follow the rules of the organisation and jurisdiction you work in.',
  ],
  sources: [
    ONTARIO_REPORT_WRITING,
    {
      label: 'Ontario — Security guard study guide',
      url: 'https://www.ontario.ca/page/security-guard-study-guide',
      note: 'Provincial study guide covering report writing for licence applicants. Context for the factual-reporting habit.',
    },
    {
      label: 'Johnson, Hashtroudi & Lindsay (1993) — Source monitoring',
      url: 'https://pubmed.ncbi.nlm.nih.gov/8346328/',
      note: 'Review of how people judge where a memory came from. Background for separating direct observation from report and inference.',
    },
  ],
}

/* ------------------------------------------------------------- Bias Control */

const BIAS_VIGNETTES: readonly Vignette[] = [
  [
    'Early in a review you decide a late shipment was the supplier’s fault. New records arrive that mention a port closure. Which step best guards against confirmation bias?',
    'List what would count against the supplier explanation and check for it.',
    ['Collect more records that match the supplier explanation before looking elsewhere.', 'Leave the explanation unchanged, since an early view is usually the right one.', 'Set the port closure aside because the records do not mention the supplier.'],
  ],
  [
    'Before anyone measures a job, a supervisor says it will take about 20 minutes. The team’s estimates then cluster around 20. Which bias best fits?',
    'Anchoring on the supervisor’s number.',
    ['Availability of vivid recent jobs that come easily to mind.', 'Hindsight, judging the estimates after the job was finished.', 'Survivorship, counting only the jobs that were completed.'],
  ],
  [
    'After one widely shared story about a delayed train, a commuter decides trains on that line are usually late. Which information would best test the conclusion?',
    'How often trains on the line were actually late over several weeks.',
    ['How many people shared the story and how widely it spread.', 'How upsetting the delay was for the people who were caught in it.', 'How closely the story matches the commuter’s own journey on the day.'],
  ],
  [
    'A colleague arrives late once and you think “careless”. Before settling on a trait, which step is strongest?',
    'Check for circumstances that could explain the lateness, such as a disruption.',
    ['Record the lateness as carelessness and watch for a pattern over time.', 'Ask other colleagues whether this person has seemed careless before now.', 'Compare their arrival time with other late colleagues before drawing any conclusion.'],
  ],
  [
    'Two reports support your hypothesis and one contradicts it. Which summary is best?',
    'Give all three reports and note that one conflicts with the hypothesis.',
    ['Give the two supporting reports and describe the third as an unreliable outlier.', 'Leave out the third report until someone else has corroborated what it says.', 'State that a majority of the reports confirms the hypothesis you started with.'],
  ],
  [
    'A colleague states a figure very confidently but cannot say where it came from. What does the confidence tell you about its accuracy?',
    'Nothing by itself; the source of the figure still needs checking.',
    ['It makes the figure likely accurate, because confidence follows knowledge.', 'It makes the figure unreliable, because confident claims are usually inflated.', 'It means the figure is usable once a second person repeats it confidently.'],
  ],
  [
    'You concluded an invoice was missing. You then find it, correctly dated, filed under another client’s name by mistake. What should you do?',
    'Revise the conclusion and note where the invoice was found.',
    ['Hold to the conclusion, since your first assessment was reasoned.', 'Treat the find as an exception and report the invoice as missing.', 'Report the invoice as found but leave the earlier conclusion in place.'],
  ],
  [
    'A visitor in the lobby wears unusual clothing and has done nothing else notable. A colleague says to treat them as a risk. What is the sound response?',
    'Clothing alone is not evidence of risk; rely on what the visitor does.',
    ['Watch them closely, since unusual clothing is a recognised warning sign.', 'Ask them to leave until their intentions have been made clear to you.', 'Record the clothing as a risk factor in case something happens later.'],
  ],
  [
    'Two different explanations both fit what you saw. Which is the most useful next question?',
    'What observation would be more likely under one explanation than the other?',
    ['Which explanation would most colleagues find more convincing on first hearing?', 'Which explanation did I happen to think of first, before the other one?', 'Which explanation would be quicker and easier to write up in a report?'],
  ],
]

const biasLearn: LearnContent = {
  kind: 'briefing',
  overview:
    'Everyone fills gaps with what they already expect. Bias control means building small checks into your reasoning: look for evidence against your view, ask what else could explain it, and change your conclusion when the evidence changes.',
  sections: [
    {
      heading: 'Four common pulls',
      blocks: [
        {
          type: 'definitions',
          items: [
            { term: 'Confirmation bias', definition: 'Looking for, noticing and remembering evidence that fits what you already believe.' },
            { term: 'Anchoring', definition: 'Letting an early number or idea pull later estimates toward it, even when it was only a guess.' },
            { term: 'Availability', definition: 'Judging how common something is by how easily an example comes to mind.' },
            { term: 'Context neglect', definition: 'Explaining one event by a person’s character without checking circumstances.' },
          ],
        },
        {
          type: 'bullets',
          items: [
            'List what would count against your view, then look for it.',
            'Write down all the evidence, including the part that does not fit.',
            'Confidence is not evidence. Ask for the source.',
            'Appearance is not conduct. Rely on what a person does, not how they look.',
          ],
        },
      ],
    },
  ],
  caseStudies: [
    {
      title: 'The 20-minute estimate',
      scenario: 'A manager opens a planning meeting by saying a task “should take about 20 minutes”. The team’s estimates come in at 18, 20, 22 and 25 minutes. Nobody has timed the task.',
      analysis: [
        {
          heading: 'Walkthrough',
          blocks: [
            { type: 'paragraph', text: 'The cluster follows the opening number, not a measurement. Ask each person to write an estimate before hearing any number, or time the task once, then compare. An agreed number is only as good as what produced it.' },
          ],
        },
      ],
      takeaway: 'The first number in the room becomes the centre of the room.',
    },
    {
      title: 'The missing parcel',
      scenario: 'You are sure a parcel was never delivered. A delivery record then shows a signature at 11:40 from the neighbouring office.',
      analysis: [
        {
          heading: 'Walkthrough',
          blocks: [
            { type: 'paragraph', text: 'The record is evidence against your view. Check it rather than explain it away, and if it holds, revise the conclusion and say what changed. Changing your mind in light of evidence is the method working.' },
          ],
        },
      ],
      takeaway: 'A conclusion earns trust by being open to revision.',
    },
  ],
  limitations: [
    'Practice at spotting a bias and choosing a check inside short invented scenarios. It does not remove implicit bias, show reduced errors in real work, or qualify you in any psychological or behavioural assessment.',
    'Naming a bias does not prove it caused a particular error.',
  ],
  sources: [
    {
      label: 'Nickerson (1998) — Confirmation bias: a ubiquitous phenomenon in many guises',
      url: 'https://doi.org/10.1037/1089-2680.2.2.175',
      note: 'Review of confirmation bias across settings. Background for the evidence-against habit.',
    },
    TVERSKY_KAHNEMAN,
    ONTARIO_PI_ETHICS,
    {
      label: 'Ontario Human Rights Commission — Racial profiling fact sheet',
      url: 'https://www.ohrc.on.ca/en/what-racial-profiling-fact-sheet',
      note: 'Provincial human-rights guidance on why appearance and identity are not evidence of risk. Basis for the conduct-over-appearance rule.',
    },
  ],
}

/* ------------------------------------------------- Situational Awareness I */

const AWARENESS_VIGNETTES: readonly Vignette[] = [
  [
    'A side entrance is posted as closing at 18:00 every day. At 18:05 it is closed. How should this be classed?',
    'As expected: it matches the posted baseline.',
    ['As a change that suggests tampering with the entrance.', 'As a change that needs reporting to security.', 'As unclear until someone explains why it closed.'],
  ],
  [
    'Yesterday the east corridor was your exit route. Today a printed notice on it reads “Closed for repairs. Use west stairs.” What matters most?',
    'Use the route the current notice gives.',
    ['Take the east corridor, since it was your planned route.', 'Ask a stranger whether the notice is real before using the west stairs.', 'Wait for the notice to come down to confirm the east route.'],
  ],
  [
    'A platform becomes crowded right after an announcement that a train is cancelled. Which reading is best supported?',
    'The cancellation likely explains the crowd; reassess your position and exit.',
    ['The crowd shows an incident developing somewhere on the platform nearby.', 'The crowd suggests that someone in it is behaving in an unusual way.', 'The crowd means this platform should be avoided for the rest of the day and evening.'],
  ],
  [
    'A wet patch is spreading across a busy walkway beneath a leaking pipe. Which response fits?',
    'Keep clear of it and tell the staff responsible for the area.',
    ['Work out who damaged the pipe before telling anyone about the leak.', 'Leave it alone for now, since nobody yet knows what caused the leak.', 'Wait to see whether anyone else reports it before you do.'],
  ],
  [
    'In a quiet reading room, a visitor wears a style of clothing you have not seen before. They are reading and have not spoken to anyone. What follows?',
    'Nothing: unfamiliar clothing is not a change in behaviour or conditions.',
    ['Note the person for later, in case something happens in the reading room.', 'Ask a colleague whether they have seen this person in the building before.', 'Check on the person at regular intervals throughout the afternoon.'],
  ],
  [
    'You hear one short, unexplained bang from outside. Nothing else changes and nobody reacts. Which assessment is best?',
    'The cause is unknown; stay aware of any change and do not assume a cause.',
    ['It is an emergency, so you should begin acting at once as though one is under way.', 'It is harmless, so it can be put out of mind and ignored from now on.', 'It is evidence that someone meant to cause a disturbance outside.'],
  ],
  [
    'The power cuts out. Exit signs stay lit and a staff member calls out, “Please follow the lit exit signs.” What takes priority?',
    'Following the lit exit signs and the staff direction.',
    ['Finding out what caused the outage before deciding what to do next.', 'Staying exactly where you are until the power has come back on.', 'Using the same route that you took when you first arrived.'],
  ],
  [
    'A stairwell was blocked this morning. This afternoon staff remove the barrier and the sign in front of you. How should your earlier assessment change?',
    'Update it: the stairwell is now open for use.',
    ['Keep treating it as blocked in case conditions reverse again.', 'Treat the sudden removal of the barrier as suspicious.', 'Keep it as blocked until the change has been formally announced.'],
  ],
  [
    'You have been concentrating on a task for an hour. Which statement about your awareness is justified?',
    'You may have missed changes, so planned checks at set points are useful.',
    ['Focused attention means you would certainly have noticed anything important.', 'Glancing around often is enough to catch every change as it happens.', 'Missing a change shows you were not trying hard enough to notice it.'],
  ],
]

const awarenessLearn: LearnContent = {
  kind: 'briefing',
  overview:
    'Awareness starts from a baseline: what is normal here, now. A change from that baseline is worth noticing; most changes have ordinary explanations, and your attention has limits.',
  sections: [
    {
      heading: 'Baseline, change, response',
      blocks: [
        {
          type: 'steps',
          items: [
            'Know the baseline: posted times, usual routes, normal conditions.',
            'Notice a change in conditions or in what someone is doing.',
            'Look for the ordinary explanation first, such as a cancellation or a repair.',
            'Respond in proportion: update your route, report a hazard, or keep watching.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Current official notices and directions replace older plans.',
            'A single unexplained event is information, not a verdict.',
            'How a person looks is not a change in conditions or behaviour.',
            'Attention is limited. Planned checks help; they do not guarantee you notice everything.',
          ],
        },
      ],
    },
  ],
  caseStudies: [
    {
      title: 'The crowded platform',
      scenario: 'At 17:40 a station platform fills quickly. A speaker has just announced that the 17:45 train is cancelled.',
      analysis: [
        {
          heading: 'Walkthrough',
          blocks: [
            { type: 'paragraph', text: 'The baseline changed and the cancellation explains it. Reassess your position and exit rather than looking for a hidden cause in the crowd. If conditions then change again, update again.' },
          ],
        },
      ],
      takeaway: 'Look for the ordinary explanation before the alarming one.',
    },
    {
      title: 'The wet floor',
      scenario: 'Passing a café you see water spreading across the floor under a leaking ceiling panel. Customers are walking through it.',
      analysis: [
        {
          heading: 'Walkthrough',
          blocks: [
            { type: 'paragraph', text: 'This is a hazard, whatever its cause. Steer clear and tell the staff responsible for the area. You do not need to know what caused the leak, and nobody’s behaviour needs explaining.' },
          ],
        },
      ],
      takeaway: 'A hazard calls for a report, not a theory.',
    },
  ],
  limitations: [
    'Practice at comparing a stated baseline with a change and choosing a proportionate response in short invented scenarios. It is not continuous vigilance, threat prediction, surveillance skill or a safety assurance.',
    'It never treats appearance as a hazard indicator. In a real emergency, follow the actual procedures and directions for your location.',
  ],
  sources: [
    ONTARIO_BASIC_PROCEDURES,
    {
      label: 'Ontario — Training syllabus for private investigators, Section 5: Investigative techniques',
      url: 'https://www.ontario.ca/document/training-syllabus-private-investigators/section-5-investigative-techniques',
      note: 'Jurisdictional anchor for observing the environment and recording what is seen. Occupational syllabus, not proof of civilian transfer.',
    },
    {
      label: 'Wolfe et al. (2007) — Low target prevalence is a stubborn source of errors in visual search tasks',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2662480/',
      note: 'Laboratory evidence that rare targets are often missed. Basis for the statement that attention has limits.',
    },
  ],
}

/* ------------------------------------------- Decision Under Uncertainty I */

const DECISION_VIGNETTES: readonly Vignette[] = [
  [
    'A booking may clash with an unconfirmed meeting. Nothing is urgent, and either can be moved later. What keeps the most options open?',
    'Check the calendar for the meeting before moving either booking.',
    ['Cancel both bookings until the clash with the meeting has been settled.', 'Keep both bookings and let the people involved sort out the clash.', 'Move your booking to another slot and tell nobody, to avoid a fuss.'],
  ],
  [
    'A report goes out tomorrow. One document is missing its date, and its author is reachable today. What is the best first step?',
    'Ask the author to confirm the date.',
    ['Use the date of the most recent related document.', 'Send it undated and add the date later.', 'Estimate the date from when the file was last saved.'],
  ],
  [
    'You must choose a supplier for a trial. Information on two suppliers is incomplete, but the trial can end at any time at no cost. Which approach fits?',
    'Start a small trial with a review point rather than wait for full information.',
    ['Wait until the information on both suppliers is complete before choosing either.', 'Sign a long contract with the supplier that currently looks cheaper to you.', 'Pick one supplier at random and plan no review of how the trial goes.'],
  ],
  [
    'Two reports give different totals for the same month, 412 and 421, and you need the figure today. What is justified?',
    'Flag the difference and confirm which version is authoritative.',
    ['Use the average of the two totals and mention the method used.', 'Use the higher figure to be safe and call it confirmed.', 'Use the report you received first, since it arrived before the other one.'],
  ],
  [
    'Yesterday’s instructions say to use Room A. This morning an official notice says Room A is closed and to use Room C. What follows?',
    'Follow the newer notice and use Room C.',
    ['Use Room A, as the original plan stated.', 'Use Room B as a compromise.', 'Wait at Room A until someone confirms the notice.'],
  ],
  [
    'A quoted price of 1,200 does not say whether it includes tax. You must compare it with a tax-inclusive quote. What do you need next?',
    'Whether the 1,200 includes tax.',
    ['Which of the two suppliers you have used before.', 'Which quote arrived first.', 'The average of earlier quotes for similar work.'],
  ],
  [
    'A venue alarm sounds and staff direct everyone to the nearest exit. You do not know the cause. What takes precedence?',
    'Following the staff directions to the exit now.',
    ['Finding out the cause first, in case it is a drill.', 'Finishing your task, since alarms are often false.', 'Waiting to see what other people do first.'],
  ],
  [
    'A forecast says sales will rise about 10%, with a range of 4% to 16%. Which summary is best calibrated?',
    'About 10% is expected, but the range is wide; plan for 4% to 16%.',
    ['Sales will rise by 10%, so plan on exactly that figure and nothing else.', 'The forecast is too uncertain to be used for any kind of planning at all.', 'Sales will probably rise by 16%, the top of the forecast range.'],
  ],
  [
    'Two repair plans are possible. A 10-minute check could show which one fits, and the costlier plan cannot be undone once started. What is best?',
    'Do the 10-minute check before starting either plan.',
    ['Start the cheaper plan and check whether it fits afterwards.', 'Start the costlier plan, since it is the more thorough of the two.', 'Choose the plan that the team happened to prefer first.'],
  ],
]

const decisionLearn: LearnContent = {
  kind: 'briefing',
  overview:
    'You often have to act before you know everything. When the facts, costs and thresholds are stated, prefer steps you can undo, check what would settle the question, and defer to current official instructions.',
  sections: [
    {
      heading: 'Choosing with gaps in what you know',
      blocks: [
        {
          type: 'bullets',
          items: [
            'If a step is cheap and reversible, take it with a review point; do not wait for certainty.',
            'If a step cannot be undone, spend a short check first when one is available.',
            'When sources disagree or a definition is missing, flag it and ask the person who owns the answer.',
            'A newer official instruction replaces an older one.',
            'In an emergency, follow the directions you are given; working out the cause comes afterwards.',
            'State uncertainty as a range with its assumptions, not as a single exact number.',
          ],
        },
      ],
    },
  ],
  caseStudies: [
    {
      title: 'Two totals',
      scenario: 'Two monthly reports show 412 and 421 for the same count, and a summary is due in an hour.',
      analysis: [
        {
          heading: 'Walkthrough',
          blocks: [
            { type: 'paragraph', text: 'Averaging or picking the larger figure hides the disagreement. Flag it, ask which report is authoritative, and if there is no time, state the figure used and say it is unconfirmed.' },
          ],
        },
      ],
      takeaway: 'Make the uncertainty visible instead of resolving it by guesswork.',
    },
    {
      title: 'The alarm',
      scenario: 'A venue alarm sounds while you are mid-task. Staff call for everyone to leave by the nearest exit.',
      analysis: [
        {
          heading: 'Walkthrough',
          blocks: [
            { type: 'paragraph', text: 'Here the instruction is explicit, so you follow it at once. Investigating first, or assuming a false alarm, delays the one action the situation has already called for.' },
          ],
        },
      ],
      takeaway: 'Where official directions exist, uncertainty about the cause is not a reason to delay.',
    },
  ],
  limitations: [
    'Practice at picking a sensible response in short invented scenarios where the facts, costs and thresholds are stated. It is not risk-management certification, emergency command judgement, forecasting skill, medical triage or a measure of real-world readiness.',
    'The best answer in each scenario follows an authored rule applied to the stated facts. It is not a universal rule for every decision.',
  ],
  sources: [
    {
      label: 'National Academies of Sciences, Engineering, and Medicine — How People Learn II',
      url: 'https://nap.nationalacademies.org/catalog/24783/how-people-learn-ii-learners-contexts-and-cultures',
      note: 'Learning-science context for practising reasoning with feedback. Context only; it does not prescribe the decision rules used here.',
    },
    TVERSKY_KAHNEMAN,
    {
      label: 'NIST — Risk Management Framework',
      url: 'https://csrc.nist.gov/projects/risk-management/about-rmf',
      note: 'An organisational risk framework used here only as an analogy for verify-then-act. Not a rule for ordinary personal decisions.',
    },
  ],
}

/* ---------------------------------------------------------------- Topics */

export function humanFactorsTopics(): Topic[] {
  return [
    staged({
      id: OBSERVATION_VS_INFERENCE_ID,
      title: 'Observation vs Inference',
      scope: 'In nine short invented reports, telling what was observed from what was reported or inferred, choosing neutral wording, and naming what is still unknown. Real-world reporting skill, eyewitness accuracy and lie detection are not scored.',
      items: vignetteItems(OBSERVATION_VS_INFERENCE_ID, OBSERVATION_VIGNETTES),
      learn: observationLearn,
    }),
    staged({
      id: BIAS_CONTROL_ID,
      title: 'Bias Control',
      scope: 'In nine short invented scenarios, spotting confirmation, anchoring, availability and context neglect, and choosing an evidence check or revision. Removing bias in real work and judging real people are not scored.',
      items: vignetteItems(BIAS_CONTROL_ID, BIAS_VIGNETTES),
      learn: biasLearn,
    }),
    staged({
      id: SITUATIONAL_AWARENESS_ID,
      title: 'Situational Awareness I',
      scope: 'In nine short invented scenes, comparing a stated baseline with a change and choosing a proportionate response. Continuous vigilance, threat prediction and judging people by appearance are not scored.',
      items: vignetteItems(SITUATIONAL_AWARENESS_ID, AWARENESS_VIGNETTES),
      learn: awarenessLearn,
    }),
    staged({
      id: DECISION_UNDER_UNCERTAINTY_ID,
      title: 'Decision Under Uncertainty I',
      scope: 'In nine short invented decisions where facts, costs and thresholds are stated, choosing a reversible, information-seeking or properly escalated response. Real-world decisions, forecasting and emergency command are not scored.',
      items: vignetteItems(DECISION_UNDER_UNCERTAINTY_ID, DECISION_VIGNETTES),
      learn: decisionLearn,
    }),
  ]
}
