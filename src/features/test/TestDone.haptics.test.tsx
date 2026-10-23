// @vitest-environment jsdom
import { StrictMode } from 'react'
import { cleanup, render } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { seedLibrary } from '../../domain/library/catalogSeed'
import { fire } from '../../shared/haptics'
import { TestDone } from './TestDone'

vi.mock('../../shared/haptics', () => ({ fire: vi.fn() }))
afterEach(() => { cleanup(); vi.mocked(fire).mockClear() })

it('emits a completion crest once across StrictMode effect replay and rerenders', () => {
  const topic = seedLibrary().topics.find(topic => topic.id === 'nato-phonetic')!
  const banked = [{
    resolution: { topic, from: 'learning' as const, to: 'completed' as const, completed: true },
    withheldByAcquisition: false, nonQualifying: false,
  }]
  const content = <StrictMode><TestDone banked={banked} missed={{}} onExit={vi.fn()} score={{ correct: 26, total: 26 }} /></StrictMode>
  const view = render(content)
  expect(fire).toHaveBeenCalledExactlyOnceWith('crest')
  view.rerender(content)
  expect(fire).toHaveBeenCalledTimes(1)
})
