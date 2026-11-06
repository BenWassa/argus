// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { LessonStage, LessonStep } from '../../../domain/learning/stages'
import { seedLibrary } from '../../../domain/library/catalogSeed'
import type { Item, Topic } from '../../../domain/library/topic'
import { generatedCurriculum } from '../../../domain/learning/generatedCurriculum'
import { StageRunner } from './StageRunner'
import { StageLesson } from './StageLesson'

let current: Topic
const updateTopic = vi.fn((_id: string, update: (topic: Topic) => Topic) => { current = update(current) })
vi.mock('../../../services/library/LibraryProvider', () => ({ useLibrary: () => ({ updateTopic }) }))
afterEach(() => { cleanup(); updateTopic.mockClear() })
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const summary: LessonStep = { kind: 'summary', id: 'end', text: 'All covered.' }
function setup(step: LessonStep) {
  const onFinish = vi.fn()
  const onExit = vi.fn()
  const onNext = vi.fn()
  render(<StageRunner stage={{ id: 'lesson-1', title: 'Lesson 1', steps: [step, summary] }}
    itemFace={id => ({ front: `Prompt ${id}`, back: `Answer ${id}` })} onFinish={onFinish} onExit={onExit} onNext={onNext} />)
  return { onFinish, onExit, onNext }
}

describe('StageRunner', () => {
  it('focuses the step heading, counts steps, and closes without completion', () => {
    const { onExit, onFinish } = setup({ kind: 'show', id: 'show', title: 'A', body: 'Alfa' })
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'A' }))
    expect(screen.getByRole('progressbar', { name: '1 of 2' })).toBeTruthy()
    expect(screen.getByText('Alfa')).toBeTruthy()
    click('Close')
    expect(onExit).toHaveBeenCalledOnce()
    expect(onFinish).not.toHaveBeenCalled()
    click('Continue')
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'All covered.' }))
  })

  it.each([
    { kind: 'choose', id: 'pick', itemId: 'a', prompt: 'Pick', options: ['Wrong', 'Right'], answer: 'Right', explain: 'The answer is Right.' },
    { kind: 'complete', id: 'gap', itemId: 'a', before: 'Before', after: 'After', options: ['Wrong', 'Right'], answer: 'Right', explain: 'The answer is Right.' },
    { kind: 'contrast', id: 'compare', itemIds: ['Wrong', 'Right'], prompt: 'Compare', answerItemId: 'Right', explain: 'The answer is Right.' },
  ] satisfies LessonStep[])('marks a wrong $kind answer, permits retry, then waits for Continue', step => {
    setup(step)
    const prefix = step.kind === 'contrast' ? 'Prompt ' : ''
    click(`${prefix}Wrong`)
    expect(screen.getByRole('alert').textContent).toContain('Try again')
    expect(screen.getByRole('alert').textContent).not.toContain('The answer is Right.')
    expect(screen.getByRole('button', { name: `${prefix}Right` }).className).not.toContain('is-correct')
    click(`${prefix}Wrong`)
    expect(screen.getByRole('alert').textContent).toContain('The answer is Right.')
    expect(screen.getByRole('button', { name: `${prefix}Right` }).className).toContain('is-correct')
    expect(screen.getByRole('button', { name: `${prefix}Wrong` }).className).toContain('is-wrong')
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull()
    click(`${prefix}Right`)
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByRole('heading', { name: 'All covered.' })).toBeNull()
    click('Continue')
    expect(screen.getByRole('heading', { name: 'All covered.' })).toBeTruthy()
  })

  it('supports ordered blocks and retry without skipping the question', () => {
    setup({ kind: 'order', id: 'order', itemId: 'a', prompt: 'Order', blocks: ['First', 'Second'], explain: 'First, Second.' })
    click('Second'); click('First'); click('Check order')
    expect(screen.getByRole('alert')).toBeTruthy()
    click('Remove Second'); click('Remove First')
    click('First'); click('Second'); click('Check order'); click('Continue')
    expect(screen.getByRole('heading', { name: 'All covered.' })).toBeTruthy()
  })

  it('explains an order step after a second wrong check, like a choice', () => {
    setup({ kind: 'order', id: 'order', itemId: 'a', prompt: 'Order', blocks: ['First', 'Second'], explain: 'First, Second.' })
    click('Second'); click('First'); click('Check order')
    expect(screen.getByRole('alert').textContent).not.toContain('First, Second.')
    click('Check order')
    expect(screen.getByRole('alert').textContent).toContain('First, Second.')
  })

  it('asks a pictured checkpoint item in lesson wording, not its Test prompt', () => {
    const pictured = { id: 'a', prompt: 'Test prompt', answer: 'Answer', kind: 'forward', stimulus: { source: { kind: 'figure', figure: { kind: 'day-shape-stack', shapes: ['ball'] } }, alt: 'One ball' } } as unknown as Item
    render(<StageRunner stage={{ id: 's', title: 'S', steps: [{ kind: 'checkpoint', id: 'check', itemIds: ['a'] }] }}
      itemFace={() => ({ front: 'Test prompt', back: 'Answer' })} itemFor={() => pictured} onFinish={() => {}} onExit={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Which one is this?' })).toBeTruthy()
    expect(screen.queryByText('Test prompt')).toBeNull()
  })

  it('shows all of Sigma\'s forms large, and leaves a short word alone', () => {
    const stage = { id: 's', title: 'S', steps: [{ kind: 'checkpoint', id: 'check', itemIds: ['a'] } satisfies LessonStep] }
    const { unmount } = render(<StageRunner stage={stage} itemFace={() => ({ front: 'Σ σ ς', back: 'Sigma' })} onFinish={() => {}} onExit={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Σ σ ς' }).className).toContain('is-glyph')
    unmount()
    render(<StageRunner stage={stage} itemFace={() => ({ front: 'kilo', back: '1000' })} onFinish={() => {}} onExit={() => {}} />)
    expect(screen.getByRole('heading', { name: 'kilo' }).className).not.toContain('is-glyph')
  })

  it('shows short contrast labels as large letters, and leaves sentences alone', () => {
    const contrast: LessonStep = { kind: 'contrast', id: 'compare', itemIds: ['a', 'b'], prompt: 'Compare', answerItemId: 'a', explain: 'Because.' }
    const stage = { id: 's', title: 'S', steps: [contrast] }
    const { unmount } = render(<StageRunner stage={stage} itemFace={id => ({ front: id === 'a' ? 'Β β' : 'Ε ε', back: '' })} onFinish={() => {}} onExit={() => {}} />)
    expect(document.querySelector('.stage-options.is-glyphs')).toBeTruthy()
    unmount()
    render(<StageRunner stage={stage} itemFace={id => ({ front: `A longer label ${id}`, back: '' })} onFinish={() => {}} onExit={() => {}} />)
    expect(document.querySelector('.stage-options.is-glyphs')).toBeNull()
  })

  it('walks every checkpoint item; Not yet repeats the current recall', () => {
    setup({ kind: 'checkpoint', id: 'check', itemIds: ['a', 'b'] })
    click('Reveal')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Got it' }))
    click('Not yet')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Reveal' }))
    expect(screen.getByRole('heading', { name: 'Prompt a' })).toBeTruthy()
    expect(screen.queryByText('Answer a')).toBeNull()
    click('Reveal'); click('Got it')
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Prompt b' }))
    click('Reveal'); click('Got it')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Continue' }))
    click('Continue')
    expect(screen.getByRole('heading', { name: 'All covered.' })).toBeTruthy()
  })

  it('renders the actual pictured stimulus with its alt', () => {
    const topic = seedLibrary().topics.find(topic => topic.id === 'signal-flags')!
    const item = topic.items[0]
    render(<StageRunner stage={generatedCurriculum(topic).stages[0]} itemFor={() => item}
      itemFace={() => ({ front: item.prompt, back: item.answer })} onFinish={vi.fn()} onExit={vi.fn()} />)
    expect(screen.getByRole('img', { name: item.stimulus!.alt }).querySelector('svg')).toBeTruthy()
    expect(screen.getByRole('heading', { name: item.answer })).toBeTruthy()
    expect(document.querySelector('.stage-answer')).toBeNull()
  })

  it('shows a photograph carried by the step when the item has none', () => {
    const visual = { source: { kind: 'image' as const, src: '/media/clouds/cirrus.avif', width: 700, height: 467 }, alt: 'Cirrus: filaments', credit: 'Photo: Jebulon, CC BY-SA 3.0' }
    const item = { id: 'a', prompt: 'Ci', answer: 'Cirrus', kind: 'forward' } as Item
    const stage: LessonStage = { id: 's', title: 'S', steps: [
      { kind: 'show', id: 'show', itemId: 'a', title: 'Cirrus', body: 'Ci. Filaments.', visual },
      { kind: 'choose', id: 'ask', itemId: 'a', prompt: 'Which cloud is this?', options: ['Cirrus', 'Cumulus'], answer: 'Cirrus', explain: 'Filaments.', visual },
    ] }
    render(<StageRunner stage={stage} itemFace={() => ({ front: 'Ci', back: 'Cirrus' })} itemFor={() => item} onFinish={vi.fn()} onExit={vi.fn()} />)
    expect(screen.getByRole('img', { name: 'Cirrus: filaments' })).toBeTruthy()
    expect(screen.getByText('Photo: Jebulon, CC BY-SA 3.0')).toBeTruthy()
    click('Continue')
    expect(screen.getByRole('heading', { name: 'Which cloud is this?' })).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Cirrus: filaments' })).toBeTruthy()
  })

  it('plays audio through AudioReference without writing evidence', () => {
    const item = { id: 'audio', prompt: 'Listen', answer: 'A12', audio: {
      assetId: 'lesson-audio', src: '/media/audio/lesson.mp3', transcript: 'Alfa WUN TOO', drill: 'token-copy' as const,
    } }
    render(<StageRunner stage={{ id: 'lesson-1', title: 'Lesson 1', steps: [{ kind: 'show', id: 'show', title: item.prompt, body: item.answer, itemId: item.id }] }}
      itemFor={() => item} itemFace={() => ({ front: item.prompt, back: item.answer })} onFinish={vi.fn()} onExit={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Play recording/ })).toBeTruthy()
    expect(screen.getByText('Alfa WUN TOO')).toBeTruthy()
    expect(updateTopic).not.toHaveBeenCalled()
  })

  it('waits for the local write, allows retry on failure, and announces completion only after success', async () => {
    let resolve!: (saved: boolean) => void
    const onFinish = vi.fn(() => new Promise<boolean>(done => { resolve = done }))
    render(<StageRunner stage={{ id: 'lesson-1', title: 'Lesson 1', steps: [summary] }}
      itemFace={() => ({ front: '', back: '' })} onFinish={onFinish} onExit={vi.fn()} />)
    click('Finish lesson')
    expect((screen.getByRole('button', { name: 'Saving…' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByRole('heading', { name: 'Lesson complete' })).toBeNull()
    await act(async () => resolve(false))
    expect(screen.getByRole('alert').textContent).toContain('Could not save')
    click('Finish lesson')
    await act(async () => resolve(true))
    expect(screen.getByRole('heading', { name: 'Lesson complete' })).toBeTruthy()
    expect(onFinish).toHaveBeenCalledTimes(2)
  })

  it('finishes only once and shows the next action and Done', () => {
    const { onFinish, onNext } = setup(summary)
    click('Continue')
    const finish = screen.getByRole('button', { name: 'Finish lesson' })
    fireEvent.click(finish); fireEvent.click(finish)
    expect(onFinish).toHaveBeenCalledExactlyOnceWith('lesson-1')
    expect(screen.getByRole('heading', { name: 'Lesson complete' })).toBe(document.activeElement)
    click('Next lesson')
    expect(onNext).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Done' })).toBeTruthy()
  })
})

describe('lesson completion through the library provider', () => {
  function finishLesson(topic: Topic, stageId: string) {
    const onNext = vi.fn()
    const onTest = vi.fn()
    const onExit = vi.fn()
    render(<StageLesson topic={topic} stageId={stageId} onExit={onExit} onNext={onNext} onTest={onTest} />)
    const stage = generatedCurriculum(topic).stages.find(stage => stage.id === stageId)!
    for (const step of stage.steps) {
      if (step.kind === 'show') click('Continue')
      else if (step.kind === 'choose') { click(step.answer); click('Continue') }
      else if (step.kind === 'checkpoint') {
        for (const _id of step.itemIds) { click('Reveal'); click('Got it') }
        click('Finish lesson')
      }
    }
    return { onNext, onTest, onExit }
  }

  it('returns to the first unfinished lesson when the last lesson is finished out of order', () => {
    current = { ...seedLibrary().topics.find(topic => topic.id === 'nato-phonetic')!, status: 'unstarted', completedAt: null }
    const lastId = generatedCurriculum(current).stages.at(-1)!.id
    const { onNext, onTest } = finishLesson(current, lastId)
    expect(screen.queryByRole('button', { name: 'Final Test' })).toBeNull()
    click('Next lesson')
    expect(onNext).toHaveBeenCalledWith('lesson-1')
    expect(onTest).not.toHaveBeenCalled()
    expect(current.completedAt).toBeNull()
  })

  it('writes stageProgress without history or itemEvidence, then completes on the final lesson', () => {
    current = { ...seedLibrary().topics.find(topic => topic.id === 'nato-phonetic')!, status: 'unstarted', completedAt: null }
    const before = structuredClone(current)
    const first = finishLesson(current, 'lesson-1')
    expect(updateTopic).toHaveBeenCalledOnce()
    expect(current.stageProgress?.['lesson-1']).toBeTruthy()
    expect(current.completedAt).toBeNull()
    expect(current.history).toEqual(before.history)
    expect(current.itemEvidence).toEqual(before.itemEvidence)
    expect(Object.keys(current).filter(key => JSON.stringify(current[key as keyof Topic]) !== JSON.stringify(before[key as keyof Topic]))).toEqual(['stageProgress'])
    click('Next lesson')
    expect(first.onNext).toHaveBeenCalledWith('lesson-2')
    cleanup()
    const stages = generatedCurriculum(current).stages
    current = { ...current, stageProgress: Object.fromEntries(stages.slice(0, -1).map(stage => [stage.id, '2026-10-29T00:00:00Z'])) }
    const last = finishLesson(current, stages.at(-1)!.id)
    expect(current.completedAt).toBeTruthy()
    expect(current.status).toBe('completed')
    expect(current.history).toEqual(before.history)
    expect(current.itemEvidence).toEqual(before.itemEvidence)
    click('Final Test')
    expect(last.onTest).toHaveBeenCalledOnce()
    click('Done')
    expect(last.onExit).toHaveBeenCalledOnce()
  })
})
