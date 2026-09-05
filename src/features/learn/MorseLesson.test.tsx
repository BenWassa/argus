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
  type LessonRun,
} from '../../lib/morseLesson'
import { LibraryProvider } from '../../lib/store'
import { parseLibrary } from '../../lib/storage'
import { seedLibrary } from '../../lib/seed'
import type { Topic } from '../../lib/types'
import { Learn } from './Learn'
import { MorseLesson } from './MorseLesson'

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
    get length() {
      return values.size
    },
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
      <MorseLesson
        topic={topic}
        initialRun={run}
        onExit={() => undefined}
        onTest={() => undefined}
        onReference={() => undefined}
      />
    </LibraryProvider>,
  )
}

function learn(topicIds: string[]): string {
  return renderToStaticMarkup(
    <LibraryProvider>
      <Learn
        topicIds={topicIds}
        onExit={() => undefined}
        onTest={() => undefined}
        onReference={() => undefined}
      />
    </LibraryProvider>,
  )
}

function source(file: string): string {
  return readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8')
}

/** Advance a run to the first check at the requested support format. */
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

describe('Learn picks the right surface', () => {
  it('gives the Morse topic a guided lesson rather than a scrollable packet page', () => {
    const html = learn([MORSE_ID])
    expect(html).toContain('morse-lesson')
    expect(html).toContain('New letter')
    // The old A–Z curriculum scroll is gone from Learn.
    expect(html).not.toContain('sheet-items')
    expect(html).not.toContain('Recall reference')
    expect(html).not.toContain('morse-cards')
  })

  it('leaves every other topic on the unchanged reading sheet', () => {
    const html = learn(['nato-phonetic'])
    expect(html).toContain('sheet-items')
    expect(html).not.toContain('morse-lesson')
  })

  it('keeps the reading sheet for a batched multi-topic Learn run', () => {
    const html = learn([MORSE_ID, 'nato-phonetic'])
    expect(html).toContain('sheet-items')
    expect(html).not.toContain('morse-lesson')
  })
})

describe('one dominant task at a time', () => {
  const topic = seededTopic(MORSE_ID)

  it('introduces one character, with its phrase, drawing, audio and pattern', () => {
    const html = render(topic, startLesson(topic) as LessonRun)
    expect(html).toContain('New letter')
    expect(html).toContain('aria-label="Play E Morse"')
    expect(html).toContain('class="morse-mnemonic"')
    // Exactly one character on screen: no packet of five to scroll.
    expect([...html.matchAll(/class="morse-mnemonic"/g)]).toHaveLength(1)
    expect([...html.matchAll(/lesson-glyph/g)]).toHaveLength(1)
    expect(html).toContain('New letter')
    expect(html).not.toContain('lesson-options')
  })

  it('asks a supported check with the phrase in view and three alternatives', () => {
    const html = render(topic, runAtFormat(topic, 'taught'))
    expect(html).toContain('Choose this pattern')
    expect(html).toContain('data-support="taught"')
    expect(html).toContain('class="morse-phrase-beats"')
    expect([...html.matchAll(/class="lesson-option mono"/g)]).toHaveLength(3)
    expect(html).not.toContain('lesson-keys')
  })

  it('reduces a cued check to the element count and optional audio', () => {
    const html = render(topic, runAtFormat(topic, 'cued'))
    expect(html).toContain('data-support="cued"')
    expect(html).toMatch(/\d+ signals?/)
    expect(html).toContain('Morse"')
    // The phrase is gone at this level; only the count and Play remain.
    expect(html).not.toContain('class="morse-phrase-beats"')
    expect([...html.matchAll(/class="lesson-option mono"/g)]).toHaveLength(3)
  })

  it('asks the unaided check with the glyph alone and dit/dah keys', () => {
    const html = render(topic, runAtFormat(topic, 'solo'))
    expect(html).toContain('Key this pattern')
    expect(html).toMatch(/Key the Morse pattern for [A-Z]\./)
    expect(html).toContain('lesson-keys')
    expect(html).toContain('Add a dit')
    expect(html).toContain('Add a dah')
    // No support of any kind: no phrase, no drawing, no count, no options.
    expect(html).not.toContain('lesson-support')
    expect(html).not.toContain('class="morse-phrase-beats"')
    expect(html).not.toContain('class="morse-mnemonic"')
    expect(html).not.toContain('lesson-option')
  })
})

describe('feedback and reteaching', () => {
  const topic = seededTopic(MORSE_ID)

  it('reteaches a miss with the phrase, drawing, audio and canonical pattern', () => {
    const run = runAtFormat(topic, 'taught')
    const step = currentStep(run)
    if (step?.kind !== 'check') throw new Error('expected a check')
    const html = render(topic, answerLesson(run, step.entry.itemId, '-----'))

    expect(html).toContain('Not that one')
    expect(html).toContain('class="morse-phrase-beats"')
    expect(html).toContain('class="morse-mnemonic"')
    expect(html).toContain(`aria-label="Play ${step.entry.glyph} Morse"`)
    expect(html).toContain('It comes back later in this lesson, after other letters.')
    expect(html).toContain('Continue')
  })

  it('confirms a correct answer without a full reteach', () => {
    const run = runAtFormat(topic, 'taught')
    const step = currentStep(run)
    if (step?.kind !== 'check') throw new Error('expected a check')
    const html = render(topic, answerLesson(run, step.entry.itemId, step.entry.pattern))

    expect(html).toContain('Correct')
    expect(html).toContain('is-correct')
    expect(html).not.toContain('lesson-stage')
    expect(html).toContain('Continue')
  })

  it('never states a verdict by colour alone', () => {
    const run = runAtFormat(topic, 'taught')
    const step = currentStep(run)
    if (step?.kind !== 'check') throw new Error('expected a check')
    for (const [response, word] of [[step.entry.pattern, 'Correct'], ['-----', 'Not that one']] as const) {
      const html = render(topic, answerLesson(run, step.entry.itemId, response))
      expect(html).toContain(word)
      expect(html).toContain('role="status"')
    }
  })
})

describe('progress, exits and honesty about what a lesson proves', () => {
  const topic = seededTopic(MORSE_ID)

  it('states lesson position and settled count in words as well as in a bar', () => {
    const html = render(topic, startLesson(topic) as LessonRun)
    expect(html).toContain('Lesson 1 of 13')
    expect(html).toContain('0 of 2 settled')
    expect(html).toContain('role="progressbar"')
    expect(html).toContain('aria-valuenow="0"')
    expect(html).toContain('aria-valuemax="2"')
  })

  it('offers the next packet when one is finished, and says nothing was scored', () => {
    let run = startLesson(topic) as LessonRun
    for (let guard = 0; guard < 60 && !run.complete; guard += 1) {
      const step = currentStep(run)
      if (!step) break
      run = step.kind === 'introduce'
        ? introduceLesson(run, step.entry.itemId)
        : advanceLesson(answerLesson(run, step.entry.itemId, step.entry.pattern))
    }

    const html = render(topic, run)
    expect(html).toContain('Packet 1 done')
    expect(html).toContain('Next packet')
    expect(html).toContain('Nothing in the lesson is scored')
    expect(html).toContain('Test is still the only place the A–Z claim is proved')
  })

  it('sends a finished learner to Test rather than claiming completion', () => {
    let current = topic
    for (let packet = 0; packet < 14; packet += 1) {
      let run = startLesson(current) as LessonRun
      if (run.finished) break
      for (let guard = 0; guard < 80 && !run.complete; guard += 1) {
        const step = currentStep(run)
        if (!step) break
        run = step.kind === 'introduce'
          ? introduceLesson(run, step.entry.itemId)
          : advanceLesson(answerLesson(run, step.entry.itemId, step.entry.pattern))
      }
      current = withLessonProgress(current, lessonProgressOf(run))
    }

    const html = render(current, startLesson(current) as LessonRun)
    expect(html).toContain('You have been through every letter')
    expect(html).toContain('That is acquisition, not proof')
    expect(html).toContain('uncued and in both')
    expect(html).toContain('Test me')
    expect(html).toContain('Morse alphabet')
  })
})

describe('accessibility and mobile composition', () => {
  const topic = seededTopic(MORSE_ID)

  it('keeps a comfortable touch target on every control the lesson uses', () => {
    const global = readFileSync(
      fileURLToPath(new URL('../../styles/global.css', import.meta.url)),
      'utf8',
    )
    // The Play control's glyph is 20px, but the button it sits in is not: the
    // base rule gives every button 44px of height and `.icon` adds the width.
    expect(global).toMatch(/^button \{[^}]*min-height:\s*44px/m)
    expect(global).toMatch(/^button\.icon \{[^}]*min-width:\s*44px/m)

    const css = source('./MorseLesson.css')
    expect(css).toMatch(/\.lesson-key\s*\{[^}]*min-height:\s*72px/)
    expect(css).toMatch(/\.lesson-option\s*\{[^}]*min-height:\s*64px/)
    expect(css).toMatch(/\.lesson-submit,\s*\n\.lesson-next\s*\{[^}]*min-height:\s*52px/)
  })

  it('respects reduced motion without losing any information', () => {
    expect(source('./MorseLesson.css')).toContain('@media (prefers-reduced-motion: reduce)')
    // The only animation in the lesson is the progress bar's width, and the
    // same count is stated in words in the session bar regardless.
    const html = render(topic, startLesson(topic) as LessonRun)
    expect(html).toContain('0 of 2 settled')
  })

  it('scales with the reader rather than pinning type to pixels', () => {
    const css = source('./MorseLesson.css')
    const typeSizes = [...css.matchAll(/font-size:\s*([^;]+);/g)].map((match) => match[1].trim())
    expect(typeSizes.length).toBeGreaterThan(0)
    for (const size of typeSizes) expect(size).not.toMatch(/^\d+px$/)
  })

  it('keeps focus inside the lesson as each step replaces the last control', () => {
    // The introduction and the check are focusable regions, so advancing never
    // drops focus to the document body when the control that was focused
    // unmounts. The reteach panel's Continue takes focus in its place.
    const intro = render(topic, startLesson(topic) as LessonRun)
    expect(intro).toMatch(/class="lesson-introduce"[^>]*tabindex="-1"/)

    const check = render(topic, runAtFormat(topic, 'taught'))
    expect(check).toMatch(/class="lesson-check"[^>]*tabindex="-1"/)

    const code = source('./MorseLesson.tsx')
    expect(code).toContain('continueRef.current?.focus')
    expect(code).toContain('stepRef.current?.focus')
    expect(code).toContain('headingRef.current?.focus')
  })

  it('names every control and every non-text mark for a screen reader', () => {
    const solo = render(topic, runAtFormat(topic, 'solo'))
    expect(solo).toContain('Add a dit')
    expect(solo).toContain('Add a dah')
    expect(solo).toContain('nothing keyed yet')

    const supported = render(topic, runAtFormat(topic, 'taught'))
    // Each alternative carries a spoken reading beside its `·`/`—` rendering.
    expect(supported).toMatch(/class="sr-only">(dit|dah)/)
    expect(supported).toContain('aria-hidden="true"')
  })
})

describe('the lesson cannot reach retention state', () => {
  it('imports no scheduler, cue ladder or distractor module', () => {
    const code = source('./MorseLesson.tsx')
    const imports = [...code.matchAll(/from '([^']+)'/g)].map((match) => match[1])
    for (const forbidden of ['../../lib/scheduling', '../../lib/cueLadder', '../../lib/distractors']) {
      expect(imports).not.toContain(forbidden)
    }
    expect(code).not.toContain('resolveAttempt')
    expect(code).not.toContain('recordAnswer')
    expect(code).not.toContain('itemEvidence')
  })

  it('writes exactly one field, through the one function that copies the rest verbatim', () => {
    const code = source('./MorseLesson.tsx')
    const writes = [...code.matchAll(/upsertTopic\(([^)]*)\)/g)].map((match) => match[1])
    expect(writes).toEqual(['updated'])
    expect(code).toContain('withLessonProgress(topicRef.current, lessonProgressOf(next))')
  })

  it('leaves the one first-exposure transition where Learn has always made it', () => {
    // `resolveStudy` still runs once when the surface opens, exactly as it did
    // for the reading sheet. It is not driven by any retrieval.
    const learnCode = source('./Learn.tsx')
    expect(learnCode).toContain('resolveStudy(topic)')
    expect([...learnCode.matchAll(/resolveStudy/g)]).toHaveLength(2)
    expect(source('./MorseLesson.tsx')).not.toContain('resolveStudy')
  })
})
