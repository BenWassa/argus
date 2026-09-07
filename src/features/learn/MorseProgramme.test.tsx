import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

function source(file: string): string {
  return readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8')
}

describe('Morse programme path', () => {
  it('renders one derived path rather than maintaining its own lesson progress', () => {
    const code = source('./MorseProgramme.tsx')
    expect(code).toContain('morseLessonPath(topic)')
    expect(code).toContain('startLesson(topic)')
    expect(code).toContain('startReplayLesson(topic, index)')
    expect(code).not.toContain('updateTopic')
    expect(code).not.toContain('lessonProgress =')
  })

  it('distinguishes current, replayable and locked actions accessibly', () => {
    const code = source('./MorseProgramme.tsx')
    expect(code).toContain('aria-current={lesson.state === \'current\' ? \'step\' : undefined}')
    expect(code).toContain('>Replay</button>')
    expect(code).toContain('disabled aria-label={`Lesson ${lesson.number} locked`}')
    expect(code).toContain('Replay is formative review only')
  })

  it('keeps the 13-lesson path compact at phone widths', () => {
    const css = source('./MorseProgramme.css')
    expect(css).toContain('.morse-path')
    expect(css).toContain('.morse-path-item')
    expect(css).toContain('@media (max-width: 380px)')
    expect(css).not.toMatch(/font-size:\s*\d+px/)
  })

  it('returns focus to the path heading after closing a lesson or replay', () => {
    const code = source('./MorseProgramme.tsx')
    expect(code).toContain('if (!active) headingRef.current?.focus')
  })
})
