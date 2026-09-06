import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  advanceLesson,
  answerLesson,
  currentStep,
  introduceLesson,
  lessonProgressOf,
  startLesson,
  withLessonProgress,
  type LessonEntry,
  type LessonRun,
} from '../../lib/morseLesson'
import { lessonListeningOptions } from '../../lib/morseLessonListening'
import { LibraryProvider } from '../../lib/store'
import { parseLibrary } from '../../lib/storage'
import { seedLibrary } from '../../lib/seed'
import type { Topic } from '../../lib/types'
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
    expect(html).toContain('New letter')
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

  it('the one-signal T case has no audio hint or pattern choices', () => {
    const html = renderToStaticMarkup(
      <VisualCheckStep entry={tEntry()} format="cued" regionRef={ref} onAnswer={() => undefined} />,
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
    expect(html).toContain('Tap&nbsp;·')
    expect(html).toContain('Hold&nbsp;—')
    expect(html).not.toContain('lesson-support')
    expect(html).not.toContain('morse-play')
  })
})

describe('Morse sound → letter is the only multiple-choice Morse Learn prompt', () => {
  it('uses sound as the stimulus without naming the answer in the prompt or audio control', () => {
    const entry = tEntry()
    const html = renderToStaticMarkup(
      <ListeningCheckStep entry={entry} options={['E', 'T']} playing={false} regionRef={ref}
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
      <ListeningCheckStep entry={tEntry()} options={['E', 'T']} playing={true} regionRef={ref}
        onToggle={() => undefined} onAnswer={() => undefined} onSkip={() => undefined} />,
    )
    expect(html).toContain('aria-label="Stop Morse sound"')
    expect(html).toContain('Replay as needed')
    expect(html).toContain("Can&#x27;t listen now")
  })

  it('only offers introduced letter choices', () => {
    let run = startLesson(seededTopic(MORSE_ID)) as LessonRun
    while (currentStep(run)?.kind === 'introduce') {
      const step = currentStep(run)
      if (step?.kind !== 'introduce') break
      run = introduceLesson(run, step.entry.itemId)
    }
    const step = currentStep(run)
    if (step?.kind !== 'check') throw new Error('expected check')
    const options = lessonListeningOptions(run, step.entry)
    const introduced = new Set(run.entries.filter((entry) => entry.introduced).map((entry) => entry.glyph))
    for (const option of options) expect(introduced.has(option)).toBe(true)
  })
})

describe('feedback and modality boundaries', () => {
  const topic = seededTopic(MORSE_ID)

  it('reteaches a printed miss only after the learner has answered', () => {
    const run = runAtFormat(topic, 'taught')
    const step = currentStep(run)
    if (step?.kind !== 'check') throw new Error('expected a check')
    const html = render(topic, answerLesson(run, step.entry.itemId, '-----'))
    expect(html).toContain('Not that one')
    expect(html).toContain('class="morse-mnemonic"')
    expect(html).toContain(`aria-label="Play ${step.entry.glyph} Morse"`)
    expect(html).toContain('It comes back later, after other letters.')
  })

  it('technical audio failure suppresses later listening instead of blocking Learn', () => {
    const code = source('./MorseLesson.tsx')
    expect(code).toContain('if (!audioError) return')
    expect(code).toContain('suppressListening(state)')
    expect(code).toContain('Continuing with visual questions for this lesson')
  })

  it("Can't listen now changes only runtime modality state and does not record a retrieval", () => {
    const code = source('./MorseLesson.tsx')
    const skip = code.slice(code.indexOf('function skipListening()'), code.indexOf('function continueAfterFeedback()'))
    expect(skip).toContain('suppressListening')
    expect(skip).not.toContain('recordLessonRetrieval')
    expect(skip).not.toContain('answerLesson')
  })
})

describe('finite progress and evidence honesty', () => {
  const topic = seededTopic(MORSE_ID)

  it('keeps #51 packet position and ten-XP sitting target explicit', () => {
    const html = render(topic, startLesson(topic) as LessonRun)
    expect(html).toContain('Packet 1 of 13')
    expect(html).toContain('0 / 10 XP')
    expect(html).toContain('Packet progress: 0 of 2 settled')
    expect(html).toContain('aria-label="Lesson XP"')
    expect(html).toContain('aria-valuemax="10"')
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

  it('keeps focus in the changing task/feedback surface', () => {
    const code = source('./MorseLesson.tsx')
    expect(code).toContain('continueRef.current?.focus')
    expect(code).toContain('stepRef.current?.focus')
    expect(code).toContain('headingRef.current?.focus')
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

  it('keeps the only topic write behind withLessonProgress', () => {
    const code = source('./MorseLesson.tsx')
    const writes = [...code.matchAll(/upsertTopic\(([^)]*)\)/g)].map((match) => match[1])
    expect(writes).toEqual(['updated'])
    expect(code).toContain('withLessonProgress(topicRef.current, lessonProgressOf(next))')
  })
})
