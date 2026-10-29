// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { LessonStage, LessonStep } from '../../../domain/learning/stages'
import { StageRunner } from './StageRunner'

afterEach(cleanup)
const summary: LessonStep = { kind: 'summary', id: 'end', text: 'All covered.' }
function setup(step: LessonStep, last = false) {
  const onFinish = vi.fn()
  const onExit = vi.fn()
  const stage: LessonStage = { id: 'lesson', title: 'Small lesson', steps: last ? [step] : [step, summary] }
  render(<StageRunner stage={stage} itemFace={(id) => ({ front: `Label ${id}`, back: `Answer ${id}` })} onFinish={onFinish} onExit={onExit} />)
  return { onFinish, onExit }
}
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))

describe('StageRunner', () => {
  it('shows text equivalents, progress and exit without finishing', () => {
    const { onFinish, onExit } = setup({ kind: 'show', id: 'show', title: 'Look', body: 'Read this.', itemId: 'a', altText: 'A striped shape' })
    expect(screen.getByRole('img', { name: 'A striped shape' })).toBeTruthy()
    expect(screen.getByText('Read this.')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toBe('Step 1 of 2')
    click('Exit lesson')
    expect(onExit).toHaveBeenCalledOnce()
    expect(onFinish).not.toHaveBeenCalled()
    click('Continue')
    expect(screen.getByRole('status').textContent).toBe('Step 2 of 2')
  })

  it.each([
    { kind: 'choose', id: 'pick', itemId: 'a', prompt: 'Pick one', options: ['Wrong', 'Right'], answer: 'Right', explain: 'The distinction.' },
    { kind: 'complete', id: 'gap', itemId: 'a', before: 'Before', after: 'After', options: ['Wrong', 'Right'], answer: 'Right', explain: 'The distinction.' },
    { kind: 'contrast', id: 'compare', itemIds: ['Wrong', 'Right'], prompt: 'Compare', answerItemId: 'Right', explain: 'The distinction.' },
  ] satisfies LessonStep[])('supports wrong then right for $kind', (step) => {
    setup(step)
    const prefix = step.kind === 'contrast' ? 'Label ' : ''
    click(`${prefix}Wrong`)
    expect(screen.getByRole('alert').textContent).toContain('The distinction.')
    click(`${prefix}Right`)
    expect(screen.getByText('All covered.')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('lets a learner continue after a wrong answer', () => {
    setup({ kind: 'choose', id: 'pick', itemId: 'a', prompt: 'Pick', options: ['No', 'Yes'], answer: 'Yes', explain: 'Use Yes.' })
    click('No')
    click('Continue')
    expect(screen.getByText('All covered.')).toBeTruthy()
  })

  it('builds, removes and retries an ordered sequence', () => {
    setup({ kind: 'order', id: 'order', itemId: 'a', prompt: 'Put in order', blocks: ['First', 'Second'], explain: 'First comes first.' })
    expect((screen.getByRole('button', { name: 'Check order' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getAllByRole('button', { pressed: false }).map((b) => b.textContent)).toEqual(['Second', 'First'])
    click('Second'); click('First'); click('Check order')
    expect(screen.getByRole('alert').textContent).toContain('First comes first.')
    click('Remove Second')
    click('First')
    expect(screen.getByRole('list', { name: 'Your sequence' }).children.length).toBe(0)
    click('First'); click('Second'); click('Check order')
    expect(screen.getByText('All covered.')).toBeTruthy()
  })

  it.each(['Got it', 'Not yet'])('shows the prompt, reveals the answer, and advances with %s', (grade) => {
    setup({ kind: 'recall', id: 'recall', itemId: 'a' })
    expect(screen.getByText('Label a')).toBeTruthy()
    expect(screen.queryByText('Answer a')).toBeNull()
    click('Reveal')
    expect(screen.getByText('Answer a')).toBeTruthy()
    click(grade)
    expect(screen.getByText('All covered.')).toBeTruthy()
  })

  it('walks every checkpoint item before moving on', () => {
    const { onFinish } = setup({ kind: 'checkpoint', id: 'check', itemIds: ['a', 'b'] })
    expect(screen.getByText('Label a')).toBeTruthy()
    click('Reveal'); click('Got it')
    expect(screen.getByText('Label b')).toBeTruthy()
    expect(screen.queryByText('Answer a')).toBeNull()
    expect(screen.queryByText('All covered.')).toBeNull()
    click('Reveal'); click('Not yet')
    expect(screen.getByText('All covered.')).toBeTruthy()
    expect(onFinish).not.toHaveBeenCalled()
  })

  it('finishes once on the last step, including repeated activation', () => {
    const { onFinish } = setup(summary, true)
    const finish = screen.getByRole('button', { name: 'Finish lesson' })
    fireEvent.click(finish)
    fireEvent.click(finish)
    expect(onFinish).toHaveBeenCalledExactlyOnceWith('lesson')
    expect(screen.getByRole('status').textContent).toBe('Lesson finished')
  })

  it('finishes on the last answer without finishing an earlier step', () => {
    const { onFinish } = setup({ kind: 'choose', id: 'pick', itemId: 'a', prompt: 'Pick', options: ['No', 'Yes'], answer: 'Yes', explain: 'Use Yes.' })
    click('Yes')
    expect(onFinish).not.toHaveBeenCalled()
    click('Finish lesson')
    expect(onFinish).toHaveBeenCalledExactlyOnceWith('lesson')
  })

  it('starts a different stage with fresh step state', () => {
    const onFinish = vi.fn()
    const props = { onFinish, onExit: vi.fn(), itemFace: (id: string) => ({ front: id, back: id }) }
    const { rerender } = render(<StageRunner {...props} stage={{ id: 'one', title: 'One', steps: [summary] }} />)
    click('Finish lesson')
    rerender(<StageRunner {...props} stage={{ id: 'two', title: 'Two', steps: [summary] }} />)
    expect(screen.getByRole('status').textContent).toBe('Step 1 of 1')
    click('Finish lesson')
    expect(onFinish.mock.calls).toEqual([['one'], ['two']])
  })

  it('supports keyboard activation and focuses the lesson heading', async () => {
    const user = userEvent.setup()
    setup({ kind: 'show', id: 'show', title: 'Read', body: 'Text' })
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Small lesson' }))
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Exit lesson' }))
    await user.tab()
    await user.keyboard('{Enter}')
    expect(screen.getByText('All covered.')).toBeTruthy()
  })
})
