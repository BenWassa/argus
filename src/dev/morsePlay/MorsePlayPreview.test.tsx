// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { morseProgressPath } from '../../domain/morse/curriculum/progressPath'
import { MorsePlayPreview, morsePlayPreviewTopic } from './MorsePlayPreview'

afterEach(() => cleanup())

describe('Morse play preview', () => {
  it('projects fresh, five settled lessons, banked and repair fixtures from separate seeds', () => {
    expect(morseProgressPath(morsePlayPreviewTopic('fresh'))!.currentNodeId).toBe('start')
    expect(morseProgressPath(morsePlayPreviewTopic('mid'))!.currentNodeId).toBe('lesson-6')
    for (const [state, testState] of [['done', 'banked'], ['repair', 'repair']]) {
      expect(morseProgressPath(morsePlayPreviewTopic(state))!.nodes.find((node) => node.kind === 'test')).toMatchObject({ state: 'current', testState })
    }
    expect(morsePlayPreviewTopic(null).status).toBe('unstarted')
    expect(morsePlayPreviewTopic('mid').lessonProgress).not.toBe(morsePlayPreviewTopic('mid').lessonProgress)
  })

  it('renders the standalone course and play tray', () => {
    render(<MorsePlayPreview />)
    expect(screen.getByRole('list', { name: 'Course path' })).toBeTruthy()
    expect(screen.getByRole('navigation', { name: 'Play' })).toBeTruthy()
  })
})
