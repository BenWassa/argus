// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { seedLibrary } from '../../../domain/library/catalogSeed'
import { startLesson } from '../../../domain/morse/curriculum/lesson'
import { morseWordCheckpoints } from '../../../domain/morse/curriculum/checkpoints'
import { newFluencyProgress } from '../../../domain/morse/fluency/progress'
import { MorseLesson } from '../lesson/MorseLesson'
import { MorseCheckpoint } from '../lesson/MorseCheckpoint'
import { LetterPracticeRun } from '../practice/LetterPracticeRun'
import { CopyRun } from '../fluency/CopyRun'
import { FluencyRun } from '../fluency/FluencyRun'
import { SendRun } from '../fluency/SendRun'
import { FreePlay } from '../fluency/FreePlay'
import { MorsePlacementDialog } from '../MorsePlacementDialog'

const topic = seedLibrary().topics.find(candidate => candidate.id === 'international-morse-letters-printed')!
vi.mock('../../../services/library/LibraryProvider', () => ({ useLibrary: () => ({ topics: [topic], updateTopic: vi.fn() }) }))
afterEach(cleanup)
const noop = () => undefined

describe('every Morse session shares the frame', () => {
  const progress = newFluencyProgress()
  it.each([
    ['lesson', <MorseLesson topic={topic} initialRun={startLesson(topic)!} onExit={noop} onTest={noop} onReference={noop} />],
    ['checkpoint', <MorseCheckpoint checkpoint={morseWordCheckpoints()[0]} onExit={noop} />],
    ['key', <LetterPracticeRun eligible={['E']} direction="key" onProgress={noop} onAnother={noop} onExit={noop} />],
    ['read', <LetterPracticeRun eligible={['E']} direction="read" onProgress={noop} onAnother={noop} onExit={noop} />],
    ['listen', <LetterPracticeRun eligible={['E']} direction="listen" onProgress={noop} onAnother={noop} onExit={noop} />],
    ['key', <SendRun stage="words" progress={progress} onProgress={noop} onStage={noop} onExit={noop} />],
    ['listen', <CopyRun level="letters" rung={6} progress={progress} onProgress={noop} onLevel={noop} onExit={noop} />],
    ['listen', <FluencyRun mode="sprint" rung={6} progress={progress} onProgress={noop} onExit={noop} />],
    ['free', <FreePlay rung={6} onExit={noop} />],
  ])('frames a %s session', (kind, element) => {
    const { container } = render(element)
    expect(container.querySelectorAll('.session-frame')).toHaveLength(1)
    expect(container.querySelector('.session-frame')?.getAttribute('data-session-kind')).toBe(kind)
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy()
    for (const paragraph of container.querySelectorAll('p')) {
      if (paragraph.closest('.morse-character-support, [data-session-hint]')) continue
      expect(paragraph.textContent?.match(/[.!?](?:\s|$)/g)?.length ?? 0).toBeLessThanOrEqual(1)
    }
  })

  it('frames active placement', () => {
    const { container } = render(<MorsePlacementDialog topic={topic} onClose={noop} onNew={noop} onCommit={noop} onContinue={noop} />)
    fireEvent.click(screen.getByRole('button', { name: /Know some Morse/ }))
    expect(container.querySelector('[data-session-kind="lesson"]')).toBeTruthy()
  })

  it('fixes practice direction when entry supplies it', () => {
    const { container } = render(<LetterPracticeRun eligible={['E']} direction="read" onProgress={noop} onAnother={noop} onExit={noop} />)
    expect(screen.getByText('Read')).toBeTruthy()
    expect(container.querySelector('.letter-practice-directions')).toBeNull()
    expect(screen.getByRole('textbox', { name: 'Letter' })).toBeTruthy()
  })
})

describe('session copy budget', () => {
  const paths = ['lesson/MorseLesson', 'lesson/MorseCheckpoint', 'practice/LetterPracticeRun', 'fluency/SendRun', 'fluency/CopyRun', 'fluency/FluencyRun', 'fluency/FreePlay', 'MorsePlacementDialog']
  it.each(paths)('keeps static paragraphs in %s to one short sentence', path => {
    const source = ts.createSourceFile(path, readFileSync(`src/features/morse/${path}.tsx`, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    function visit(node: ts.Node, inFrame = false) {
      if (ts.isJsxElement(node)) {
        const tag = node.openingElement.tagName.getText(source)
        inFrame ||= tag === 'SessionFrame'
        if (inFrame && tag === 'p') {
          const text = node.children.filter(ts.isJsxText).map(child => child.text).join(' ').replace(/\s+/g, ' ').trim()
          expect(text.length, text).toBeLessThanOrEqual(100)
          expect(text.match(/[.!?](?:\s|$)/g)?.length ?? 0, text).toBeLessThanOrEqual(1)
        }
      }
      ts.forEachChild(node, child => visit(child, inFrame))
    }
    visit(source)
  })
})
