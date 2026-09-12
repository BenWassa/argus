// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { act, cleanup, fireEvent, render as renderDom, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MORSE_LETTERS } from '../../lib/morse'
import {
  advanceLesson,
  answerLesson,
  currentStep,
  introduceLesson,
  introducedGlyphs,
  lessonPackets,
  lessonProgressOf,
  startLesson,
  withLessonProgress,
  type LessonEntry,
  type LessonRun,
} from '../../lib/morseLesson'
import { lessonListeningOptions } from '../../lib/morseLessonListening'
import { MORSE_FEEDBACK_CORRECT_MS, MORSE_TRANSITION_MS, morseElementDurationMs } from '../../lib/morseResponse'
import { LibraryProvider } from '../../lib/store'
import { parseLibrary, saveLibrary } from '../../lib/storage'
import { seedLibrary } from '../../lib/seed'
import type { ItemLessonStore, Topic } from '../../lib/types'
import { Learn } from './Learn'
import { ListeningCheckStep, MorseLesson, VisualCheckStep } from './MorseLesson'

const MORSE_ID = 'international-morse-letters-printed'

function seededTopic(id: string): Topic {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  const topic = parsed.library.topics.find((candidate) => candidate.id === id)
  if (!topic) throw new Error(`Missing seeded topic ${id}`)
  return topic
}

function fakeStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => [...values.keys()][index] ?? null,
    removeItem: (key: string) => void values.delete(key),
    setItem: (key: string, value: string) => void values.set(key, value),
  }
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: fakeStorage(), configurable: true })
})

function render(topic: Topic, run: LessonRun): string {
  return renderToStaticMarkup(
    <LibraryProvider>
      <MorseLesson topic={topic} initialRun={run} onExit={() => undefined} onTest={() => undefined} onReference={() => undefined} />
    </LibraryProvider>,
  )
}

function learn(topicIds: string[]): string {
  return renderToStaticMarkup(
    <LibraryProvider>
      <Learn topicIds={topicIds} onExit={() => undefined} onTest={() => undefined} onReference={() => undefined} />
    </LibraryProvider>,
  )
}

function source(file: string): string {
  return readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8')
}

function runAtFormat(topic: Topic, format: 'taught' | 'cued' | 'solo'): LessonRun {
  let run = startLesson(topic) as LessonRun
  for (let guard = 0; guard < 40; guard += 1) {
    const step = currentStep(run)
    if (!step) break
    if (step.kind === 'introduce') {
      run = introduceLesson(run, step.entry.itemId)
      continue
    }
    if (step.format === format) return run
    run = advanceLesson(answerLesson(run, step.entry.itemId, step.entry.pattern))
  }
  throw new Error(`Never reached a ${format} check`)
}

function itemIdForGlyph(value: Topic, glyph: string): string {
  const item = value.items.find((candidate) => candidate.prompt === glyph)
  if (!item?.id) throw new Error(`Missing item for ${glyph}.`)
  return item.id
}

/** Mirrors `morseWordCheckpoints.test.ts`'s fixture helper: settle whole lessons mechanically. */
function settledThroughLesson(value: Topic, lessonNumber: number): Topic {
  const progress: ItemLessonStore = { ...(value.lessonProgress ?? {}) }
  for (const packet of lessonPackets().slice(0, lessonNumber)) {
    for (const glyph of packet.characters) progress[itemIdForGlyph(value, glyph)] = 'settled'
  }
  return { ...value, lessonProgress: progress }
}

/**
 * `MorseLesson` resolves `live`/`topicRef` from the library store, not from
 * its own `topic` prop, so an interactive test has to seed the store with the
 * exact same progress the prop and `initialRun` already reflect — otherwise
 * the first persisted answer would silently overwrite it.
 */
function seedLibraryWithTopic(value: Topic): void {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  saveLibrary({
    ...parsed.library,
    topics: parsed.library.topics.map((candidate) => (candidate.id === value.id ? value : candidate)),
  })
}

function tEntry(): LessonEntry {
  return {
    itemId: 'morse-T', glyph: 'T', pattern: '-', novel: true, support: 'cued', introduced: true,
    asked: true, done: false, notBefore: 0, lastAskedAt: null, order: 0,
  }
}

const ref = { current: null }

describe('Learn picks the right surface', () => {
  it('gives the Morse topic a guided lesson rather than a scrollable packet page', () => {
    const html = learn([MORSE_ID])
    expect(html).toContain('morse-lesson')
    expect(html).toContain('Learn Morse A–Z')
    expect(html).toContain('Start lesson 1')
    expect(html).not.toContain('sheet-items')
    expect(html).not.toContain('morse-cards')
  })

  it('leaves non-Morse and batched Learn on the reading sheet', () => {
    expect(learn(['nato-phonetic'])).toContain('sheet-items')
    expect(learn([MORSE_ID, 'nato-phonetic'])).toContain('sheet-items')
  })
})

describe('printed letter → Morse uses one production mechanism', () => {
  const topic = seededTopic(MORSE_ID)

  it('introduces one character with instructional audio before recall begins', () => {
    const html = render(topic, startLesson(topic) as LessonRun)
    expect(html).toContain('New letter')
    expect(html).toContain('aria-label="Play E Morse"')
    expect([...html.matchAll(/class="morse-mnemonic"/g)]).toHaveLength(1)
  })

  it('keeps the rhythmic phrase on taught support but requires keyed production', () => {
    const html = render(topic, runAtFormat(topic, 'taught'))
    expect(html).toContain('Key this pattern')
    expect(html).toContain('data-support="taught"')
    expect(html).toContain('class="morse-phrase-beats"')
    expect(html).toContain('class="morse-key"')
    expect(html).not.toContain('class="lesson-option mono"')
  })

  it('keeps only non-answer-bearing element count on cued production', () => {
    const html = render(topic, runAtFormat(topic, 'cued'))
    expect(html).toContain('data-support="cued"')
    expect(html).toMatch(/\d+ signals?/)
    expect(html).toContain('class="morse-key"')
    expect(html).not.toContain('class="morse-play')
    expect(html).not.toContain('aria-label="Play')
    expect(html).not.toContain('class="morse-phrase-beats"')
    expect(html).not.toContain('class="lesson-option mono"')
  })

  it('the one-signal T case has no answer audio hint or pattern choices', () => {
    const html = renderToStaticMarkup(
      <VisualCheckStep entry={tEntry()} format="cued" regionRef={ref} armed onAnswer={() => undefined} />,
    )
    expect(html).toContain('T')
    expect(html).toContain('1 signal')
    expect(html).toContain('Morse key. Tap for dit; press and hold for dah.')
    expect(html).not.toContain('morse-play')
    expect(html).not.toContain('lesson-option mono')
  })

  it('uses the same shared key at solo support with no scaffold', () => {
    const html = render(topic, runAtFormat(topic, 'solo'))
    expect(html).toContain('Key this pattern')
    expect(html).toContain('class="morse-key"')
    expect(html).toContain('Tap')
    expect(html).toContain('Hold')
    expect(html).not.toContain('lesson-support')
    expect(html).not.toContain('morse-play')
  })
})

describe('Morse sound → letter is the only multiple-choice Morse Learn prompt', () => {
  it('uses sound as the stimulus without naming the answer in the prompt or audio control', () => {
    const entry = tEntry()
    const html = renderToStaticMarkup(
      <ListeningCheckStep entry={entry} options={['E', 'T']} playing={false} regionRef={ref} armed
        onToggle={() => undefined} onAnswer={() => undefined} onSkip={() => undefined} />,
    )
    expect(html).toContain('Listen, then choose the letter')
    expect(html).toContain('aria-label="Play Morse sound"')
    expect(html).not.toContain('Play T Morse')
    expect(html).not.toContain('lesson-glyph')
    expect(html).not.toContain('morse-notation')
    expect(html).toContain('lesson-letter-option')
    expect(html).toContain('E')
    expect(html).toContain('T')
  })

  it('supports replay and always exposes the no-audio escape', () => {
    const html = renderToStaticMarkup(
      <ListeningCheckStep entry={tEntry()} options={['E', 'T']} playing={true} regionRef={ref} armed
        onToggle={() => undefined} onAnswer={() => undefined} onSkip={() => undefined} />,
    )
    expect(html).toContain('aria-label="Stop Morse sound"')
    expect(html).toContain('Replay as needed')
    expect(html).toContain("Can&#x27;t listen now")
  })

  it('only offers introduced letter choices', () => {
    let topic = seededTopic(MORSE_ID)
    let run = startLesson(topic) as LessonRun
    while (currentStep(run)?.kind === 'introduce') {
      const step = currentStep(run)
      if (step?.kind !== 'introduce') break
      run = introduceLesson(run, step.entry.itemId)
    }
    topic = withLessonProgress(topic, lessonProgressOf(run))
    const step = currentStep(run)
    if (step?.kind !== 'check') throw new Error('expected check')
    const options = lessonListeningOptions(run, step.entry, introducedGlyphs(topic))
    const introduced = new Set(run.entries.filter((entry) => entry.introduced).map((entry) => entry.glyph))
    for (const option of options) expect(introduced.has(option)).toBe(true)
  })

  it('draws distractors from characters learned in earlier packets, not only this packet roster', () => {
    // Walk the topic through packets 0 and 1 to settled, so packet 2's roster
    // (N, S plus review) is not the only pool a listening question can draw
    // from: E, I, T and A are also genuinely known by this point.
    let topic = seededTopic(MORSE_ID)
    let run = startLesson(topic) as LessonRun
    for (
      let guard = 0;
      guard < 200 && (run.packetIndex < 2 || currentStep(run)?.kind === 'introduce');
      guard += 1
    ) {
      const step = currentStep(run)
      if (!step) {
        topic = withLessonProgress(topic, lessonProgressOf(run))
        run = startLesson(topic) as LessonRun
        continue
      }
      if (step.kind === 'introduce') {
        run = introduceLesson(run, step.entry.itemId)
      } else {
        run = answerLesson(run, step.entry.itemId, step.entry.pattern)
        if (run.feedback?.correct) run = advanceLesson(run)
      }
      topic = withLessonProgress(topic, lessonProgressOf(run))
    }
    expect(run.packetIndex).toBe(2)
    expect(currentStep(run)?.kind).toBe('check')

    const known = introducedGlyphs(topic)
    expect(known).toEqual(expect.arrayContaining(['E', 'I', 'T', 'A']))

    const step = currentStep(run)
    if (step?.kind !== 'check') throw new Error('expected check')
    const seen = new Set<string>()
    for (let lessonStep = 0; lessonStep < known.length; lessonStep += 1) {
      const options = lessonListeningOptions({ ...run, step: lessonStep }, step.entry, known)
      for (const option of options) seen.add(option)
    }
    // Rotating through every step surfaces letters from outside packet 2's own
    // small roster: the pool is the whole topic, not just the current packet.
    expect(seen.has('E') || seen.has('I') || seen.has('T') || seen.has('A')).toBe(true)
  })
})

describe('feedback and modality boundaries', () => {
  const topic = seededTopic(MORSE_ID)

  it('reteaches a printed miss without adding a Continue button', () => {
    const run = runAtFormat(topic, 'taught')
    const step = currentStep(run)
    if (step?.kind !== 'check') throw new Error('expected a check')
    const html = render(topic, answerLesson(run, step.entry.itemId, '-----'))
    expect(html).toContain('Not that one')
    expect(html).toContain('class="morse-mnemonic"')
    expect(html).toContain(`aria-label="Play ${step.entry.glyph} Morse"`)
    expect(html).toContain('It comes back later, after other letters.')
    expect(html).not.toContain('>Continue<')
  })

  it('acknowledges both verdicts on one shared boundary and never adds a Continue action', () => {
    const code = source('./MorseLesson.tsx')
    // A hit used to call `movePastVisualFeedback` synchronously inside
    // `answerVisual`, which cleared `run.feedback` in the same tick it was set.
    expect(code).not.toContain('if (next.feedback.correct) movePastVisualFeedback(next, nextSitting)')
    expect(code).toContain('pendingAdvance.current = () => movePastVisualFeedback(next, nextSitting, pathBeforeAnswer)')
    expect(code).toContain('answered(next.feedback.correct)')
    // Durations live in the shared policy, never as a private literal here.
    expect(code).not.toMatch(/setTimeout\([^)]*\d{3}/)
    expect(code).not.toContain('function continueAfterFeedback')
    expect(code).not.toContain('>Continue</button>')
  })

  it('technical audio failure suppresses later listening instead of blocking Learn', () => {
    const code = source('./MorseLesson.tsx')
    expect(code).toContain('if (!audioError) return')
    expect(code).toContain('suppressListening(state)')
    expect(code).toContain('Continuing with visual questions for this lesson')
  })

  it("Can't listen now changes only runtime modality state and does not record a retrieval", () => {
    const code = source('./MorseLesson.tsx')
    const skip = code.slice(code.indexOf('function skipListening()'), code.indexOf('function nextSitting()'))
    expect(skip).toContain('suppressListening')
    expect(skip).not.toContain('recordLessonRetrieval')
    expect(skip).not.toContain('answerLesson')
  })
})

describe('finite progress and evidence honesty', () => {
  const topic = seededTopic(MORSE_ID)

  it('states packet position and the finite sitting target in plain terms', () => {
    const html = render(topic, startLesson(topic) as LessonRun)
    expect(html).toContain('Packet 1 of 13')
    // #62: the ten-answer sitting is a finite retrieval budget, not an economy.
    // Argus rejects a global XP model, so the copy must not imply one.
    expect(html).toContain('0 / 10 retrievals')
    expect(html).not.toContain('XP')
    expect(html).toContain('Packet progress: 0 of 2 settled')
    expect(html).toContain('aria-label="Retrievals this sitting"')
    expect(html).toContain('aria-valuemax="10"')
  })

  it('resumes the durable sitting from the topic rather than a sidecar', () => {
    const resumed: Topic = {
      ...topic,
      lessonSitting: { retrievals: 6, correct: 4, revisitItemIds: [topic.items[0].id as string] },
    }
    const html = render(resumed, startLesson(resumed) as LessonRun)
    expect(html).toContain('6 / 10 retrievals')
    expect(html).toContain('aria-valuenow="6"')
  })

  it('sends a finished learner to formal Test rather than claiming completion', () => {
    let current = topic
    for (let packet = 0; packet < 14; packet += 1) {
      let run = startLesson(current) as LessonRun
      if (run.finished) break
      for (let guard = 0; guard < 80 && !run.complete; guard += 1) {
        const step = currentStep(run)
        if (!step) break
        run = step.kind === 'introduce' ? introduceLesson(run, step.entry.itemId) : advanceLesson(answerLesson(run, step.entry.itemId, step.entry.pattern))
      }
      current = withLessonProgress(current, lessonProgressOf(run))
    }
    const html = render(current, startLesson(current) as LessonRun)
    expect(html).toContain('That is acquisition, not proof')
    expect(html).toContain('Test me')
  })
})

describe('accessibility and mobile composition', () => {
  it('keeps one practical primary Morse key and readable listening choices', () => {
    const global = source('../../styles/global.css')
    expect(global).toMatch(/^button \{[^}]*min-height:\s*44px/m)
    const keyCss = source('../morse/MorseKeyInput.css')
    expect(keyCss).toMatch(/\.morse-key\s*\{[^}]*min-height:\s*84px/)
    expect(keyCss).toContain('touch-action: none')
    const lessonCss = source('./MorseLesson.css')
    expect(lessonCss).toContain('.lesson-letter-option')
  })

  it('respects reduced motion and text scaling', () => {
    const css = `${source('./MorseLesson.css')}\n${source('../morse/MorseKeyInput.css')}`
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    const typeSizes = [...css.matchAll(/font-size:\s*([^;]+);/g)].map((match) => match[1].trim())
    for (const size of typeSizes) expect(size).not.toMatch(/^\d+px$/)
  })

  it('keeps focus on the changing task or finite endpoint without a feedback button', () => {
    const code = source('./MorseLesson.tsx')
    expect(code).toContain('stepRef.current?.focus')
    expect(code).toContain('headingRef.current?.focus')
    expect(code).not.toContain('continueRef')
  })
})

describe('Learn cannot reach formal retention state', () => {
  it('imports no scheduler, cue ladder or distractor module', () => {
    const code = source('./MorseLesson.tsx')
    const imports = [...code.matchAll(/from '([^']+)'/g)].map((match) => match[1])
    for (const forbidden of ['../../lib/scheduling', '../../lib/cueLadder', '../../lib/distractors']) expect(imports).not.toContain(forbidden)
    expect(code).not.toContain('resolveAttempt')
    expect(code).not.toContain('itemEvidence')
  })

  it('writes only formative acquisition state, and only through composing updates', () => {
    const code = source('./MorseLesson.tsx')

    // Whole-object writes would reinstate every sibling field as it looked when
    // the lesson opened, including a scheduler resolution banked since (#62).
    expect(code).not.toContain('upsertTopic')

    // Every durable write this surface makes, and what it is allowed to touch:
    // lesson support, the finite sitting, and the acquisition-readiness anchor.
    // Nothing here can reach status, history, timestamps or `DirectionEvidence`.
    const updaters = [...code.matchAll(/updateTopic\(topic\.id,/g)].map((match) =>
      code.slice(match.index ?? 0, (match.index ?? 0) + 160),
    )
    expect(updaters.length).toBeGreaterThan(0)
    for (const updater of updaters) {
      expect(updater).toMatch(
        /withAcquisitionReadiness|withLessonProgress|withLessonSitting|withoutLessonSitting/,
      )
    }

    // The one thing imported from the journey layer is the acquisition anchor.
    // That layer can see the scheduler; this surface still must not.
    const journeyImport = code.slice(code.indexOf("from '../../lib/journey'") - 120, code.indexOf("from '../../lib/journey'"))
    expect(journeyImport).toContain('withAcquisitionReadiness')
    expect(journeyImport).not.toContain('resolveAttempt')
    expect(journeyImport).not.toContain('journeyFor')
  })
})

describe('#88 automatic word-checkpoint handoff at lesson completion', () => {
  async function settle() {
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
  }

  async function keyElement(element: '.' | '-') {
    fireEvent.keyDown(window, { key: element, repeat: false })
    await settle()
  }

  function advanceTime(ms: number) {
    act(() => {
      vi.advanceTimersByTime(ms)
    })
  }

  async function keyPattern(pattern: string) {
    for (const element of pattern) {
      await keyElement(element as '.' | '-')
      advanceTime(morseElementDurationMs(element as '.' | '-') + 10)
    }
  }

  /**
   * Drive the real rendered lesson — introductions and keyed checks alike —
   * one answer at a time until either the checkpoint invitation appears or
   * the guard trips. This exercises the actual timer-gated boundary #88 adds
   * rather than the pure functions underneath it, so it is the one test that
   * would fail if the milestone were wired to the wrong render path.
   */
  async function driveUntilCheckpointInviteOrDone(maxSteps = 60) {
    for (let step = 0; step < maxSteps; step += 1) {
      if (screen.queryByRole('button', { name: 'Start checkpoint' })) return
      const gotIt = screen.queryByRole('button', { name: 'Got it' })
      if (gotIt) {
        fireEvent.click(gotIt)
        continue
      }
      const glyph = document.querySelector('.lesson-glyph')?.textContent as keyof typeof MORSE_LETTERS | undefined
      if (!glyph) throw new Error('Expected either a "Got it" introduction or a keyed check on screen.')
      await keyPattern(MORSE_LETTERS[glyph])
      // Split rather than combined: returning right after the feedback dwell,
      // before the transition elapses, is what lets a caller observe the
      // invitation arriving still gated rather than already armed.
      advanceTime(MORSE_FEEDBACK_CORRECT_MS)
      if (screen.queryByRole('button', { name: 'Start checkpoint' })) return
      advanceTime(MORSE_TRANSITION_MS)
    }
    throw new Error(`Did not reach the checkpoint invitation within ${maxSteps} steps.`)
  }

  async function completeCheckpoint(maxTargets = 20) {
    for (let targetIndex = 0; targetIndex < maxTargets; targetIndex += 1) {
      if (screen.queryByRole('heading', { name: 'Word checkpoint complete' })) return
      const label = document.querySelector('.morse-checkpoint-target')?.getAttribute('aria-label') ?? ''
      const glyph = label.match(/^Key (?:the Morse pattern for )?([A-Z])(?:\s|$)/)?.[1] as keyof typeof MORSE_LETTERS | undefined
      if (!glyph) throw new Error(`Could not read the checkpoint target from "${label}".`)
      await keyPattern(MORSE_LETTERS[glyph])
      advanceTime(MORSE_FEEDBACK_CORRECT_MS + MORSE_TRANSITION_MS)
    }
    throw new Error(`Did not complete the checkpoint within ${maxTargets} targets.`)
  }

  function presetTopic(): Topic {
    const base = settledThroughLesson(seededTopic(MORSE_ID), 3)
    // Listening questions pick their own DOM branch; suppressing them keeps
    // this test driving the one keyed-check shape it knows how to answer.
    return { ...base, lessonSitting: { retrievals: 0, correct: 0, revisitItemIds: [], listeningSuppressed: true } }
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('surfaces the lesson-4 checkpoint invitation automatically, without a trip through the lesson path', async () => {
    const topic = presetTopic()
    seedLibraryWithTopic(topic)

    renderDom(
      <LibraryProvider>
        <MorseLesson topic={topic} initialRun={startLesson(topic) as LessonRun} onExit={vi.fn()} onTest={vi.fn()} onReference={vi.fn()} />
      </LibraryProvider>,
    )

    await driveUntilCheckpointInviteOrDone()

    expect(screen.getByText('Lesson 4 complete')).toBeTruthy()
    expect(screen.getByText(/Word checkpoint/)).toBeTruthy()
    expect(screen.getByText(/one letter at a time/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Start checkpoint' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Skip for now' })).toBeTruthy()
  })

  it('gates the invitation buttons until the preceding tap\'s transition settles, then starts the checkpoint directly', async () => {
    const topic = presetTopic()
    seedLibraryWithTopic(topic)

    renderDom(
      <LibraryProvider>
        <MorseLesson topic={topic} initialRun={startLesson(topic) as LessonRun} onExit={vi.fn()} onTest={vi.fn()} onReference={vi.fn()} />
      </LibraryProvider>,
    )

    await driveUntilCheckpointInviteOrDone()
    const start = screen.getByRole('button', { name: 'Start checkpoint' })
    expect(start.closest('.lesson-exits')?.hasAttribute('inert')).toBe(true)

    advanceTime(MORSE_TRANSITION_MS)
    expect(start.closest('.lesson-exits')?.hasAttribute('inert')).toBe(false)

    fireEvent.click(start)
    expect(screen.getByText('Warm-up 1 of 4')).toBeTruthy()
  })

  it('resumes the lesson untouched when the invitation is skipped, leaving the checkpoint for later replay', async () => {
    const topic = presetTopic()
    seedLibraryWithTopic(topic)

    renderDom(
      <LibraryProvider>
        <MorseLesson topic={topic} initialRun={startLesson(topic) as LessonRun} onExit={vi.fn()} onTest={vi.fn()} onReference={vi.fn()} />
      </LibraryProvider>,
    )

    await driveUntilCheckpointInviteOrDone()
    advanceTime(MORSE_TRANSITION_MS)
    fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }))

    // Lesson 5 continues exactly as an un-invited sitting would: no gate, no
    // memory that an invitation was ever shown.
    expect(screen.queryByRole('button', { name: 'Start checkpoint' })).toBeNull()
    expect(screen.getByText('Packet 5 of 13')).toBeTruthy()
  })

  it('returns to the lesson after completing the checkpoint, without a stop at the path', async () => {
    const topic = presetTopic()
    seedLibraryWithTopic(topic)

    renderDom(
      <LibraryProvider>
        <MorseLesson topic={topic} initialRun={startLesson(topic) as LessonRun} onExit={vi.fn()} onTest={vi.fn()} onReference={vi.fn()} />
      </LibraryProvider>,
    )

    await driveUntilCheckpointInviteOrDone()
    advanceTime(MORSE_TRANSITION_MS)
    fireEvent.click(screen.getByRole('button', { name: 'Start checkpoint' }))

    expect(screen.getByText('Warm-up 1 of 4')).toBeTruthy()
    await completeCheckpoint()
    expect(screen.getByRole('heading', { name: 'Word checkpoint complete' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Keep going' }))
    expect(screen.queryByRole('heading', { name: 'Learn Morse A–Z' })).toBeNull()
    expect(screen.getByText('Packet 5 of 13')).toBeTruthy()
  })

  it('does not invite again when the already-unlocked checkpoint is replayed from the path', () => {
    const code = source('./MorseLesson.tsx')
    expect(code).toContain('checkpointNewlyUnlocked(pathBeforeAnswer, pathNow, completedLessonNumber)')
    expect(code).toContain('const pathBeforeAnswer = morseLessonPath(topicRef.current)')
    // The snapshot is taken before `commit`, never after — taking it later
    // would compare the topic against itself and never find a crossing.
    const answerVisual = code.slice(code.indexOf('function answerVisual'), code.indexOf('function answerListening'))
    expect(answerVisual.indexOf('pathBeforeAnswer')).toBeLessThan(answerVisual.indexOf('commit(next)'))
  })

  it('writes no new durable checkpoint state and introduces no second unlock system', () => {
    const code = source('./MorseLesson.tsx')
    const newState = code.slice(code.indexOf('CheckpointHandoff | null>(null)'), code.indexOf('function commit'))
    expect(newState).not.toContain('updateTopic(')
    expect(code).not.toContain('checkpointSkipped')
    expect(code).not.toContain('checkpointSeen')
    expect(code).not.toContain('checkpointCompleted')
  })

  it('keeps the milestone screen quiet: one primary action, one secondary, no gamification copy', () => {
    const code = source('./MorseLesson.tsx')
    expect(code).toContain('Start checkpoint')
    expect(code).toContain('Skip for now')
    expect(code).not.toMatch(/\bbadge\b|\bconfetti\b|\bstreak\b|\bXP\b/i)
    expect(code).toContain('Optional and formative: skipping never blocks the next lesson.')
  })

  it('reuses the #87 touch-safe boundary for every terminal screen, not only the new one', () => {
    const code = source('./MorseLesson.tsx')
    const exitGroups = [...code.matchAll(/<div className="lesson-exits"[^>]*>/g)].map((match) => match[0])
    expect(exitGroups.length).toBeGreaterThanOrEqual(4)
    for (const group of exitGroups) expect(group).toContain('inert={!armed}')
  })
})
