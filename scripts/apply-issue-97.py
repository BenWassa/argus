from pathlib import Path
import re


def read(path: str) -> str:
    return Path(path).read_text()


def write(path: str, text: str) -> None:
    Path(path).write_text(text)


def replace(path: str, old: str, new: str, expected: int = 1) -> None:
    text = read(path)
    count = text.count(old)
    if count != expected:
        raise RuntimeError(f"{path}: expected {expected} occurrence(s), found {count}: {old[:100]!r}")
    write(path, text.replace(old, new))


def regex_replace(path: str, pattern: str, replacement: str, expected: int = 1) -> None:
    text = read(path)
    new, count = re.subn(pattern, replacement, text, flags=re.S)
    if count != expected:
        raise RuntimeError(f"{path}: expected {expected} regex replacement(s), found {count}: {pattern[:100]!r}")
    write(path, new)


# ---------------------------------------------------------------------------
# Journey: browsing is no longer an action or an acquisition event. A fresh
# ordinary topic has an explicit enrollment action, while Morse keeps Learn.
# ---------------------------------------------------------------------------
replace(
    "src/lib/journey.ts",
    "export type TopicAction = 'author' | 'learn' | 'test'",
    "export type TopicAction = 'author' | 'enroll' | 'learn' | 'test'",
)
replace(
    "src/lib/journey.ts",
    """  /**\n   * The verb on a row or button: `Read`, `Continue`, `Test`, `Add items`.\n   *\n   * `Learn` is gone from it. It named an internal mode rather than an action,\n   * and it named two different things: opening an ordinary topic's reference,\n   * and continuing a guided lesson that runs over weeks. Those are not the same\n   * verb and the learner was the one paying for the ambiguity.\n   */\n""",
    """  /**\n   * The verb on a row or button: `Start`, `Continue`, `Test`, `Add items`.\n   *\n   * Browsing is deliberately absent: opening an ordinary topic is reference\n   * access, not learner progress. `enroll` names the explicit boundary where an\n   * ordinary topic becomes active learning; progressive curricula keep `learn`.\n   */\n""",
)
replace(
    "src/lib/journey.ts",
    """ * For an ordinary topic that is first exposure, exactly as it has always been.\n *\n * For a progressive topic it is the moment acquisition became ready, which is\n""",
    """ * For an ordinary topic this is deliberate enrollment (`Start learning`), not\n * a reference-page visit. Browsing has no retention anchor.\n *\n * For a progressive topic it is the moment acquisition became ready, which is\n""",
)
regex_replace(
    "src/lib/journey.ts",
    r"  if \(topic\.status === 'unstarted'\) \{\n    // Ordinary first exposure\..*?\n    \}\n  \}\n\n  // A progressive topic waiting out its anchored learning gap",
    """  if (topic.status === 'unstarted') {\n    // A fresh ordinary topic is available to browse, but browsing is not\n    // enrollment. The explicit action is what creates active-learning state.\n    //\n    // A progressive topic can reach here only when acquisition is already ready\n    // while the scheduler still says `unstarted`, which no production sequence\n    // produces but an import or a fixture can. It is still a curriculum, so it\n    // still asks for its lesson.\n    return {\n      topicId: topic.id,\n      phase: 'acquiring',\n      acquisition,\n      evidence,\n      retention,\n      sitting,\n      action: acquisition.progressive ? 'learn' : 'enroll',\n      actionLabel: acquisition.progressive ? 'Start lesson' : 'Start',\n      primaryLabel: acquisition.progressive ? `Start lesson ${acquisition.packet}` : 'Start learning',\n      statusLabel: retention.label,\n      detail: acquisition.progressive ? null : 'Reference browsing does not start progress.',\n      due: true,\n      waitDays: 0,\n      advancementEligible: true,\n    }\n  }\n\n  // A progressive topic waiting out its anchored learning gap""",
)
replace(
    "src/lib/journey.ts",
    """  // A progressive topic waiting out its anchored learning gap is not \"drilled\n  // today\" — nothing drilled it. Say what is actually true of it.\n  //\n  // Neither is an ordinary topic that has only been read. `learning` is entered\n  // by exposure, so the scheduler's own `Drilled today` describes a drill that\n  // never happened, and that wording became much more visible once opening the\n  // topic page is the exposure event rather than a separate reading route.\n  const progressiveLearning = acquisition.progressive && topic.status === 'learning'\n  const readNotDrilled =\n    !acquisition.progressive && topic.status === 'learning' && topic.history.length === 0\n  const statusLabel = progressiveLearning\n    ? scheduled.due\n      ? 'Ready to test'\n      : `Test in ${days(scheduled.waitDays)}`\n    : readNotDrilled\n      ? scheduled.due\n        ? 'Read, ready to test'\n        : 'Read today'\n      : scheduled.label\n""",
    """  // A progressive topic waiting out its anchored learning gap is not \"drilled\n  // today\" — nothing drilled it. Say what is actually true of it.\n  //\n  // The same is true for an ordinary topic that has been deliberately enrolled\n  // but has no scored history yet. Enrollment starts the existing learning gap;\n  // it is not itself a drill and it is never inferred from reference browsing.\n  const progressiveLearning = acquisition.progressive && topic.status === 'learning'\n  const enrolledNotDrilled =\n    !acquisition.progressive && topic.status === 'learning' && topic.history.length === 0\n  const statusLabel = progressiveLearning\n    ? scheduled.due\n      ? 'Ready to test'\n      : `Test in ${days(scheduled.waitDays)}`\n    : enrolledNotDrilled\n      ? scheduled.due\n        ? 'Ready to test'\n        : 'Learning started'\n      : scheduled.label\n""",
)
replace(
    "src/lib/journey.ts",
    """/** The mode the journey's recommended action launches. Authoring launches none. */\nexport function modeForAction(action: TopicAction): Mode | null {\n  return action === 'author' ? null : action\n}\n""",
    """/** The run mode for actions that actually launch a run. */\nexport function modeForAction(action: TopicAction): Mode | null {\n  return action === 'learn' || action === 'test' ? action : null\n}\n""",
)
regex_replace(
    "src/lib/journey.ts",
    r"/\*\*\n \* What pressing the recommended action actually opens\..*?export function launchFor\(journey: TopicJourney\): TopicLaunch \{\n  if \(journey\.action === 'author'\) return \{ kind: 'author' \}\n  if \(journey\.action === 'test'\) return \{ kind: 'run', mode: 'test' \}\n  return journey\.acquisition\.progressive \? \{ kind: 'run', mode: 'learn' \} : \{ kind: 'open' \}\n\}",
    """/**\n * What pressing the recommended action does.\n *\n * Browsing is not represented here: opening a topic's left/navigation surface\n * is always read-only. A fresh ordinary topic instead exposes an explicit\n * enrollment action; its caller records `resolveStudy` and may then open the\n * reference. Curriculum Learn and Test remain real runs.\n */\nexport type TopicLaunch =\n  | { kind: 'enroll' }\n  | { kind: 'run'; mode: Mode }\n  | { kind: 'author' }\n\nexport function launchFor(journey: TopicJourney): TopicLaunch {\n  if (journey.action === 'author') return { kind: 'author' }\n  if (journey.action === 'enroll') return { kind: 'enroll' }\n  if (journey.action === 'test') return { kind: 'run', mode: 'test' }\n  return { kind: 'run', mode: 'learn' }\n}""",
)

# ---------------------------------------------------------------------------
# Scheduler semantics are unchanged; rename the transition accurately. The same
# pure function serves deliberate ordinary enrollment and canonical lesson start.
# ---------------------------------------------------------------------------
replace(
    "src/lib/scheduling.ts",
    """/**\n * Reading a topic moves it off `unstarted`, because it has now been seen. No\n * attempt is recorded: nothing was scored. The exposure timestamp starts\n * the one-day learning gap, so a topic read today comes back tomorrow to be\n * drilled rather than immediately.\n */\nexport function resolveStudy(topic: Topic, now: Date = new Date()): Topic {\n""",
    """/**\n * Deliberately starting acquisition moves a topic off `unstarted`. For an\n * ordinary topic this is explicit enrollment (`Start learning`); for a\n * progressive topic it is the canonical lesson start. Merely browsing a\n * reference must never call this function.\n *\n * No attempt or evidence is recorded: nothing was scored. The timestamp starts\n * the existing one-day learning gap.\n */\nexport function resolveStudy(topic: Topic, now: Date = new Date()): Topic {\n""",
)
replace(
    "src/lib/scheduling.ts",
    """  } else if (from === 'unstarted') {\n    // A first Test exposes the whole deck, but it cannot also prove retention.\n    // Start the learning gap regardless of score.\n""",
    """  } else if (from === 'unstarted') {\n    // A first Test is itself a deliberate learning/check action, so it enrolls\n    // the topic, but it cannot also prove retention. Start the learning gap\n    // regardless of score.\n""",
)

# ---------------------------------------------------------------------------
# Topic page: remove the mount write. Browsing renders the stored journey as-is;
# the primary action is the explicit ordinary-topic enrollment boundary.
# ---------------------------------------------------------------------------
replace(
    "src/features/library/TopicPage.tsx",
    """  /**\n   * Opening an ordinary topic is the exposure event, because the reference is\n   * on this page and reading it is the whole of acquisition for that kind of\n   * topic. The separate Learn route used to stamp this on mount and nothing\n   * about the meaning changed when the route went away, only where it happens.\n   *\n   * A curriculum topic is exempt: its exposure is a lesson, and `MorseLesson`\n   * owns that write. Reading the path is not learning the alphabet.\n   *\n   * The displayed journey is computed from the resolved topic rather than the\n   * stored one so the page does not paint one frame of a verdict it is in the\n   * act of invalidating.\n   */\n  const exposed = !course && runnable ? resolveStudy(topic) : topic\n  const journey = journeyFor(exposed)\n\n  useEffect(() => {\n    if (course || !runnable) return\n    updateTopic(topic.id, (current) => resolveStudy(current))\n    // Exposure belongs to opening this topic, not to every render of it.\n    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [topic.id, course, runnable])\n""",
    """  /**\n   * The topic body is reference material. Rendering or revisiting it is read-only\n   * browsing and must not create learner state. The journey therefore reads the\n   * stored topic exactly as it stands.\n   */\n  const journey = journeyFor(topic)\n""",
)
replace(
    "src/features/library/TopicPage.tsx",
    """  function startCheck() {\n    onStart('test', [topic.id])\n  }\n""",
    """  function startLearning() {\n    updateTopic(topic.id, (current) => resolveStudy(current))\n  }\n\n  function startCheck() {\n    onStart('test', [topic.id])\n  }\n""",
)
replace(
    "src/features/library/TopicPage.tsx",
    """            course={course}\n            onLesson={() => onStart('learn', [topic.id], { kind: 'lesson' })}\n            onCheck={startCheck}\n""",
    """            course={course}\n            onEnroll={startLearning}\n            onLesson={() => onStart('learn', [topic.id], { kind: 'lesson' })}\n            onCheck={startCheck}\n""",
)
replace(
    "src/features/library/TopicPage.tsx",
    """          {!course && (\n            <p className=\"topic-consequence\">\n              {journey.advancementEligible\n                ? 'Scored, every item once. The ladder moves only when the required gap is satisfied.'\n                : 'Scored and recorded, but the ladder does not move until acquisition is finished.'}\n            </p>\n          )}\n""",
    """          {!course && (\n            <p className=\"topic-consequence\">\n              {journey.action === 'enroll'\n                ? 'Browse freely. Starting learning records enrollment, not a score or evidence.'\n                : journey.advancementEligible\n                  ? 'Scored, every item once. The ladder moves only when the required gap is satisfied.'\n                  : 'Scored and recorded, but the ladder does not move until acquisition is finished.'}\n            </p>\n          )}\n""",
)
replace(
    "src/features/library/TopicPage.tsx",
    """  course,\n  onLesson,\n  onCheck,\n}: {\n  journey: ReturnType<typeof journeyFor>\n  course: boolean\n  onLesson: () => void\n  onCheck: () => void\n}) {\n  if (journey.action === 'learn' && course) {\n""",
    """  course,\n  onEnroll,\n  onLesson,\n  onCheck,\n}: {\n  journey: ReturnType<typeof journeyFor>\n  course: boolean\n  onEnroll: () => void\n  onLesson: () => void\n  onCheck: () => void\n}) {\n  if (journey.action === 'enroll') {\n    return (\n      <button className=\"topic-primary\" type=\"button\" onClick={onEnroll}>\n        <span className=\"topic-primary-verb\">{journey.primaryLabel}</span>\n        <span className=\"topic-primary-note\">\n          Make this an active topic. Browsing the reference alone changes nothing.\n        </span>\n      </button>\n    )\n  }\n\n  if (journey.action === 'learn' && course) {\n""",
)

# ---------------------------------------------------------------------------
# Library: row body is browse-only; right-side Start is explicit enrollment.
# ---------------------------------------------------------------------------
replace(
    "src/features/library/Library.tsx",
    "import type { RunTarget } from '../../lib/navigation'\n",
    "import type { RunTarget } from '../../lib/navigation'\nimport { resolveStudy } from '../../lib/scheduling'\n",
)
replace(
    "src/features/library/Library.tsx",
    "  const { topics, upsertTopic, removeTopic } = useLibrary()",
    "  const { topics, upsertTopic, removeTopic, updateTopic } = useLibrary()",
)
replace(
    "src/features/library/Library.tsx",
    """  /** Set when leaving a topic page, so focus lands back on the row you left from. */\n  const returnTo = useRef<string | null>(null)\n""",
    """  /** Set when leaving a topic page, so focus lands back on the row you left from. */\n  const returnTo = useRef<string | null>(null)\n""",
)
replace(
    "src/features/library/Library.tsx",
    """   * The row can move while you are away, and now usually does: opening an\n   * ordinary topic is its exposure event, so by the time you come back it has\n   * left `Due now` for `Waiting` and been re-rendered under a different shelf.\n   * A single-frame restore raced that write and sometimes focused nothing.\n   *\n   * So this re-runs as the list settles and gives up only once it has, rather\n""",
    """   * A row can still move while you are away because a deliberate action, a\n   * scored run or another concurrent write may change its journey. Browsing the\n   * topic itself does not. A single-frame restore must therefore tolerate either\n   * case rather than assuming the row is still under the same shelf.\n   *\n   * So this re-runs as the list settles and gives up only once it has, rather\n""",
)
replace(
    "src/features/library/Library.tsx",
    """                          if (target.kind === 'open') {\n                            openTopic(entry.topic.id)\n                            return\n                          }\n                          onStart(\n""",
    """                          if (target.kind === 'enroll') {\n                            updateTopic(entry.topic.id, (current) => resolveStudy(current))\n                            openTopic(entry.topic.id)\n                            return\n                          }\n                          onStart(\n""",
)
replace(
    "src/features/library/Library.tsx",
    """ * Two zones, separated by a hairline, each with one meaning: the left navigates\n * to the topic, the right runs it. The action carries its mode as a word,\n""",
    """ * Two zones, separated by a hairline, each with one meaning: the left browses\n * the topic without learner-state effects; the right performs the journey action.\n * The action carries its consequence as a word,\n""",
)

# ---------------------------------------------------------------------------
# Today: a fresh ordinary due row is an intentional Start action. It enrolls and
# opens the reference. Today never becomes a passive browsing entry point.
# ---------------------------------------------------------------------------
replace(
    "src/features/today/Today.tsx",
    "import type { RunTarget } from '../../lib/navigation'\n",
    "import type { RunTarget } from '../../lib/navigation'\nimport { resolveStudy } from '../../lib/scheduling'\n",
)
replace(
    "src/features/today/Today.tsx",
    "  const { topics } = useLibrary()",
    "  const { topics, updateTopic } = useLibrary()",
)
replace(
    "src/features/today/Today.tsx",
    """  // The journey decides the action, and `launchFor` decides where it happens.\n  // An ordinary topic's reference is its own page, so reading opens the topic\n  // rather than a full-screen route that repeats it; a guided lesson is a real\n  // bounded task and stays a run. `dueEntries` already ranks the day, so the one\n  // primary action follows whatever the top-ranked topic needs.\n  // Three kinds of work, and they are genuinely different things to be told you\n  // have: a guided lesson is a bounded task, a reading is a page to open, and a\n  // Test is scored. Collapsing the first two into one word made the headline\n  // vague for no gain.\n""",
    """  // The journey decides the action, and `launchFor` decides what that action\n  // does. A fresh ordinary topic is explicitly started here before its reference\n  // opens; passive reference browsing happens only by navigating to the topic.\n  // A guided lesson is a bounded run and Test is scored. `dueEntries` already\n  // ranks the day, so the one primary action follows the top-ranked topic.\n""",
)
replace(
    "src/features/today/Today.tsx",
    """  const toRead = due.filter(\n    (entry) => entry.journey.action === 'learn' && !entry.journey.acquisition.progressive,\n  )\n""",
    """  const toStart = due.filter((entry) => entry.journey.action === 'enroll')\n""",
)
replace(
    "src/features/today/Today.tsx",
    """    if (target.kind === 'open' || target.kind === 'author') {\n      onOpenTopic(entry.topic.id)\n      return\n    }\n    onStart(\n""",
    """    if (target.kind === 'author') {\n      onOpenTopic(entry.topic.id)\n      return\n    }\n    if (target.kind === 'enroll') {\n      updateTopic(entry.topic.id, (current) => resolveStudy(current))\n      onOpenTopic(entry.topic.id)\n      return\n    }\n    onStart(\n""",
)
replace(
    "src/features/today/Today.tsx",
    "      toRead.length > 0 ? `${count(toRead.length)} to read` : null,",
    "      toStart.length > 0 ? `${count(toStart.length)} to start` : null,",
)
replace(
    "src/features/today/Today.tsx",
    """        {/* Batching is for proving, not for reading. Running three readings\n            back to back was never a task with a beginning and an end, and the\n            batch Learn button existed only because a reading route existed to\n            batch. A scored run over several topics still is one. */}\n""",
    """        {/* Batching is for proving, not for enrollment or browsing. A scored\n            run over several topics is one task; starting several unrelated topics\n            or reading several references is not. */}\n""",
)
replace(
    "src/features/today/Today.tsx",
    """        {/* Said where a scored run is actually on offer, and nowhere else. A\n            day of lessons and readings was carrying a note about Test. */}\n""",
    """        {/* Said where a scored run is actually on offer, and nowhere else. A\n            day of lessons or new starts should not carry a note about Test. */}\n""",
)

# ---------------------------------------------------------------------------
# Pure journey tests: pin the new explicit enrollment action and terminology.
# ---------------------------------------------------------------------------
replace(
    "src/lib/journey.test.ts",
    """  dueEntries,\n  journeyFor,\n""",
    """  dueEntries,\n  journeyFor,\n  launchFor,\n""",
)
replace(
    "src/lib/journey.test.ts",
    "describe('ordinary topics keep exactly the behaviour they had', () => {",
    "describe('ordinary topics separate browsing from deliberate enrollment', () => {",
)
regex_replace(
    "src/lib/journey.test.ts",
    r"  it\('routes an unstarted ordinary topic to its reference, then to Test', \(\) => \{.*?\n  \}\)\n\n  it\('keeps the scheduler wording",
    """  it('keeps a fresh ordinary topic unenrolled until Start, then preserves Test scheduling', () => {\n    const bearings = { ...seeded('cardinal-bearings'), status: 'unstarted' as const, completedAt: null, history: [] }\n\n    const fresh = journeyFor(bearings, NOW)\n    expect(fresh.acquisition.progressive).toBe(false)\n    expect(fresh.action).toBe('enroll')\n    expect(fresh.actionLabel).toBe('Start')\n    expect(fresh.primaryLabel).toBe('Start learning')\n    expect(fresh.statusLabel).toBe('Not started')\n    expect(fresh.detail).toBe('Reference browsing does not start progress.')\n    expect(fresh.due).toBe(true)\n    expect(fresh.advancementEligible).toBe(true)\n    expect(launchFor(fresh)).toEqual({ kind: 'enroll' })\n\n    // Explicit enrollment changes only the scheduler-owned learning state. It\n    // invents no attempt, score or formal evidence.\n    const enrolled = resolveStudy(bearings, NOW)\n    expect(enrolled.status).toBe('learning')\n    expect(enrolled.learningAt).toBe(NOW.toISOString())\n    expect(enrolled.history).toEqual([])\n    expect(enrolled.itemEvidence).toEqual(bearings.itemEvidence)\n\n    const sameDay = journeyFor(enrolled, NOW)\n    expect(sameDay.action).toBe('test')\n    expect(sameDay.statusLabel).toBe('Learning started')\n    expect(sameDay.due).toBe(false)\n\n    const nextDay = journeyFor(enrolled, new Date(NOW.getTime() + DAY))\n    expect(nextDay.due).toBe(true)\n    expect(nextDay.statusLabel).toBe('Ready to test')\n    expect(nextDay.advancementEligible).toBe(true)\n  })\n\n  it('keeps the scheduler wording""",
)

# ---------------------------------------------------------------------------
# Cross-surface tests: the Topic page must report the same stored state on open;
# a dedicated regression checks byte-stable browse and explicit enrollment.
# ---------------------------------------------------------------------------
replace(
    "src/features/crossSurface.test.tsx",
    "import { cleanup, render, screen, within } from '@testing-library/react'",
    "import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'",
)
regex_replace(
    "src/features/crossSurface.test.tsx",
    r"/\*\*\n \* The topic as its own page leaves it\..*?\n\}\n\n/\*\* The row for one topic",
    "/** The row for one topic",
)
replace(
    "src/features/crossSurface.test.tsx",
    "name: 'an ordinary topic nobody has opened',",
    "name: 'an ordinary topic not yet enrolled',",
)
replace(
    "src/features/crossSurface.test.tsx",
    """      // Today and Library describe the topic as stored, so they are asked first:\n      // opening the Topic page is itself an exposure event for an ordinary topic\n      // and would otherwise change the state underneath the later assertions.\n""",
    """      // Every surface describes the same stored topic. Opening Topic is browsing\n      // only, so it cannot advance the state underneath later assertions.\n""",
)
replace(
    "src/features/crossSurface.test.tsx",
    """      // The Topic page describes the topic as its own page leaves it. For an\n      // unstarted ordinary topic that is deliberately one rung further on,\n      // because the reading it used to route to now happens here.\n      const opened = journeyFor(asOpened(topic))\n      install([topic])\n      expect(topicPrimary(topic)).toBe(opened.primaryLabel)\n      cleanup()\n      install([topic])\n      expect(topicSchedule(topic)).toBe(opened.statusLabel)\n""",
    """      // Topic browsing is side-effect free and therefore renders the same\n      // journey as Today and Library, including for a fresh ordinary topic.\n      install([topic])\n      expect(topicPrimary(topic)).toBe(journey.primaryLabel)\n      cleanup()\n      install([topic])\n      expect(topicSchedule(topic)).toBe(journey.statusLabel)\n""",
)
replace(
    "src/features/crossSurface.test.tsx",
    "describe('ordinary topics keep the behaviour they had', () => {",
    "describe('ordinary topic browsing and enrollment', () => {",
)
regex_replace(
    "src/features/crossSurface.test.tsx",
    r"  it\('reads an unstarted topic, then proves it, on every surface alike', \(\) => \{.*?\n  \}\)\n\n  it\('treats a topic with no items",
    """  it('keeps page-open side-effect free and starts only on the deliberate action', async () => {\n    const fresh = blank('primary-survey')\n    install([fresh])\n\n    expect(todayVerb(fresh)).toBe('Start')\n    cleanup()\n    expect(libraryVerb(fresh)).toBe('Start')\n    cleanup()\n\n    install([fresh])\n    const beforeBrowse = localStorage.getItem(STORE_KEY)\n    renderTopicPage(fresh)\n    expect(topicPrimary(fresh)).toBe('Start learning')\n    expect(document.querySelectorAll('.sheet-items li')).toHaveLength(fresh.items.length)\n    await waitFor(() => expect(localStorage.getItem(STORE_KEY)).toBe(beforeBrowse))\n\n    fireEvent.click(screen.getByRole('button', { name: /Start learning/ }))\n    await waitFor(() => {\n      const stored = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}') as { topics?: Topic[] }\n      const enrolled = stored.topics?.find((topic) => topic.id === fresh.id)\n      expect(enrolled?.status).toBe('learning')\n      expect(enrolled?.learningAt).toBeTruthy()\n      expect(enrolled?.history).toEqual([])\n      expect(enrolled?.lastTestedAt).toBeNull()\n      expect(enrolled?.itemEvidence ?? {}).toEqual({})\n    })\n  })\n\n  it('treats a topic with no items""",
)

# ---------------------------------------------------------------------------
# Browser production flow: Library row opens reference without writes; Start
# enrolls on the same topic route; only the following Test creates a run route.
# ---------------------------------------------------------------------------
replace(
    "e2e/navigation.spec.ts",
    """async function navigationState(page: Page): Promise<NavigationState> {\n  return page.evaluate(() => window.history.state as NavigationState)\n}\n""",
    """async function navigationState(page: Page): Promise<NavigationState> {\n  return page.evaluate(() => window.history.state as NavigationState)\n}\n\nasync function storedTopic(page: Page): Promise<Topic> {\n  return page.evaluate(\n    ([storeKey, topicId]) => {\n      const raw = window.localStorage.getItem(storeKey)\n      if (!raw) throw new Error('Missing Argus library')\n      const parsed = JSON.parse(raw) as { topics: Topic[] }\n      const topic = parsed.topics.find((candidate) => candidate.id === topicId)\n      if (!topic) throw new Error(`Missing topic ${topicId}`)\n      return topic\n    },\n    [STORE_KEY, TOPIC.id] as const,\n  )\n}\n""",
)
replace(
    "e2e/navigation.spec.ts",
    """  // Today -> Topic -> Back = Today. Reading an ordinary topic is no longer a\n  // full-screen run that repeats the page behind it; the reference is the page,\n  // so the docket row opens the topic and adds exactly one history stop.\n""",
    """  // Today -> Topic -> Back = Today. A fresh docket row is the deliberate\n  // Start action: it enrolls, opens the reference, and adds one history stop.\n""",
)
replace(
    "e2e/navigation.spec.ts",
    """  // Opening the topic marked it learning, so Library correctly routes it to\n  // Test. This assertion is about preserving the Library origin, not\n  // re-testing scheduler/mode selection semantics.\n""",
    """  // The deliberate Today start marked it learning, so Library correctly\n  // routes it to Test. This assertion is about preserving the Library origin.\n""",
)
regex_replace(
    "e2e/navigation.spec.ts",
    r"test\('reading an ordinary topic adds no Back stop of its own', async \(\{ page \}\) => \{.*?\n\}\)\n\ntest\('partial Test Back",
    """test('browsing an ordinary topic is side-effect free and Start enrolls without a Back stop', async ({ page }) => {\n  await openApp(page)\n  await openLibrary(page)\n  await openTopic(page)\n\n  const onTopic = await navigationState(page)\n  expect(onTopic).toMatchObject({ index: 2, route: { kind: 'topic', topicId: TOPIC.id } })\n\n  // The complete finite set is freely browsable and opening it has created no\n  // learner-progress, scheduler or evidence state.\n  await expect(page.locator('.sheet-items li')).toHaveCount(TOPIC.items.length)\n  await expect(page.getByText('Show all')).toHaveCount(0)\n  const browsed = await storedTopic(page)\n  expect(browsed.status).toBe('unstarted')\n  expect(browsed.learningAt).toBeNull()\n  expect(browsed.history).toEqual([])\n  expect(browsed.lastTestedAt).toBeNull()\n  await expect(page.locator('.topic-primary-verb')).toHaveText('Start learning')\n\n  // Deliberate Start changes only enrollment state and stays on the same route.\n  await page.locator('.topic-primary').click()\n  await expect(page.locator('.topic-primary-verb')).toHaveText('Test')\n  const enrolled = await storedTopic(page)\n  expect(enrolled.status).toBe('learning')\n  expect(enrolled.learningAt).not.toBeNull()\n  expect(enrolled.history).toEqual([])\n  expect(enrolled.lastTestedAt).toBeNull()\n  expect((await navigationState(page)).index).toBe(2)\n\n  // Test is still the scored run and therefore creates the next history entry.\n  await page.locator('.topic-primary').click()\n  await expect(page.locator('.flip-card')).toBeVisible()\n  expect(await navigationState(page)).toMatchObject({\n    index: 3,\n    route: { kind: 'run', mode: 'test', origin: { kind: 'topic', topicId: TOPIC.id } },\n  })\n\n  await systemBack(page)\n  await expect(page.getByRole('heading', { name: TOPIC.title, level: 1 })).toBeVisible()\n  expect((await navigationState(page)).index).toBe(2)\n})\n\ntest('partial Test Back""",
)
replace(
    "e2e/navigation.spec.ts",
    """  await openTopic(page)\n  await page.locator('.topic-primary').click()\n\n  await page.locator('.flip-card').click()\n""",
    """  await openTopic(page)\n  await expect(page.locator('.topic-primary-verb')).toHaveText('Start learning')\n  await page.locator('.topic-primary').click()\n  await expect(page.locator('.topic-primary-verb')).toHaveText('Test')\n  await page.locator('.topic-primary').click()\n\n  await page.locator('.flip-card').click()\n""",
)

# ---------------------------------------------------------------------------
# Durable product/design docs: issue #97 supersedes the prior §15.1 choice.
# ---------------------------------------------------------------------------
regex_replace(
    "PRODUCT.md",
    r"## Modes\n\n.*?\n## What progress means",
    """## Modes\n\nReference access, active learning and scored recall are different interactions\nwith different consequences. The interface must not let one masquerade as\nanother.\n\n**Browse/reference ≠ enrolled learning.** Opening an ordinary topic is analogous\nto opening a course book: its finite reference and optional `topic.learn` support\nare immediately available to inspect, and that navigation performs no progress,\nscheduler or evidence write. Revisiting or scrolling the page is equally inert.\n\n- **Browse/reference** — read-only access to the complete finite material. It does not change `status`, `learningAt`, history, evidence, scheduling or completion.\n- **Learn** — the internal ungraded acquisition mode. For an ordinary topic the learner-facing boundary is the explicit **Start learning** action: it enrolls an `unstarted` topic by entering the existing `learning` state and starts the existing learning gap, but records no score or evidence. For a curriculum such as Morse, canonical lessons own the corresponding acquisition writes.\n- **Test** — flashcards, every scored item once, self-scored. Every Test creates history, while the scheduler decides whether that result is timely enough to advance the ladder. A Test started from an `unstarted` topic is itself a deliberate check/enrollment action, but that first run still cannot simultaneously prove retention; existing Test/evidence semantics are unchanged.\n\n`Learn` remains an implementation term rather than a generic button label. An\nordinary topic says `Start learning`; Morse says `Lesson N`; scored recall says\n`Test`. The reference remains visible before and after enrollment, because access\nto information is not evidence that the learner chose to study it.\n\nFor most ordinary topics enrollment is a single explicit state transition before\nthe existing Test/retention ladder. Some topics need more acquisition: Morse's\nLearn is a guided lesson running over many sittings and days, and its status is\n`learning` throughout. For those, finishing acquisition is a distinct event from\nfirst lesson start, and until it happens every surface keeps recommending the\nlesson — an early Test stays available, but it is recorded rather than banked.\n`docs/open/PROGRESS_ARCHITECTURE.md` is the authority.\n\n## What progress means""",
)

for path, title, block in [
    (
        "docs/open/LEARNING_EXPERIENCE_DESIGN_DECISION.md",
        "# Argus learning-experience design decision\n",
        """\n> **#97 owner decision — 2026-09-15.** **Browse/reference ≠ enrolled learning.** This decision supersedes §4/§15.1 and every implementation-record statement below that treats opening an ordinary Topic page as exposure. The ordinary Topic body remains freely browsable, but mounting, revisiting or restoring that page writes no `status`, `learningAt`, history, scheduler or evidence state. A fresh ordinary topic instead exposes a deliberate **Start learning** action; that action may perform the existing `unstarted → learning` / learning-gap transition but creates no score or formal evidence. A first Test remains a deliberate check and keeps its existing scheduler/evidence semantics. Existing legitimate `learning`, `drilled`, `completed` or `decayed` state is preserved; there is no backwards migration. Morse and the settled navigation architecture are unchanged.\n""",
    ),
    (
        "docs/open/PROGRESS_ARCHITECTURE.md",
        "# Argus progress architecture\n",
        """\n> **#97 enrollment boundary — 2026-09-15.** **Browse/reference ≠ enrolled learning.** This supersedes the later #92 amendment where ordinary `unstarted → learning` was stamped by opening the Topic page. Topic/reference navigation is now a pure read: it creates no durable learner state, scheduler anchor or evidence. `journeyFor` exposes a distinct `enroll` action for a fresh ordinary topic; the explicit **Start learning** control calls the existing `resolveStudy` transition, while canonical curriculum lessons continue to own their acquisition start. Enrollment itself records no Test evidence. Existing learner state is preserved, and Test, completion, retention, Morse and storage semantics are otherwise unchanged.\n""",
    ),
]:
    text = read(path)
    if not text.startswith(title):
        raise RuntimeError(f"{path}: unexpected title")
    write(path, title + block + text[len(title):])

# Basic stale-language audit: these phrases describe the rejected page-open
# semantics and must no longer survive in live source/tests (historical docs may
# retain them beneath explicit superseding addenda).
for path in [
    "src/features/library/TopicPage.tsx",
    "src/features/library/Library.tsx",
    "src/features/today/Today.tsx",
    "src/lib/journey.ts",
    "src/features/crossSurface.test.tsx",
    "e2e/navigation.spec.ts",
]:
    text = read(path)
    for phrase in ["opening an ordinary topic is the exposure event", "Read, ready to test", "Read today"]:
        if phrase in text:
            raise RuntimeError(f"{path}: stale rejected semantics remain: {phrase}")

print("Applied issue #97 browse/enrollment boundary")
