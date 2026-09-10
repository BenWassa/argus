import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

function source(file: string): string {
  return readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8')
}

describe('Morse programme path', () => {
  it('renders one derived path rather than maintaining its own lesson or checkpoint progress', () => {
    const code = source('./MorseProgramme.tsx')
    expect(code).toContain('morseLessonPath(topic)')
    expect(code).toContain('morseWordCheckpointPath(topic)')
    expect(code).toContain('startLesson(topic)')
    expect(code).toContain('startReplayLesson(topic, index)')
    expect(code).toContain('<MorseCheckpoint checkpoint={active.checkpoint}')
    expect(code).not.toContain('updateTopic')
    expect(code).not.toContain('lessonProgress =')
    expect(code).not.toContain('checkpointCompleted')
  })

  it('keeps canonical lessons numbered independently from the two interstitial checkpoints', () => {
    const code = source('./MorseProgramme.tsx')
    expect(code).toContain('<span className="tabular">{path.length} lessons</span>')
    expect(code).toContain('morse-path-lesson')
    expect(code).toContain('morse-path-checkpoint')
    expect(code).toContain('checkpointAfter.get(lesson.number)')
    expect(code).toContain('After lesson {checkpoint.afterLesson}')
  })

  it('distinguishes current, replayable, checkpoint and locked actions accessibly', () => {
    const code = source('./MorseProgramme.tsx')
    expect(code).toContain('aria-current={lesson.state === \'current\' ? \'step\' : undefined}')
    expect(code).toMatch(/>\s*Replay\s*<\/button>/)
    expect(code).toContain('disabled aria-label={`Lesson ${lesson.number} locked`}')
    expect(code).toContain('disabled={!checkpoint.unlocked}')
    expect(code).toContain('`Start word checkpoint after lesson ${checkpoint.afterLesson}`')
    expect(code).toContain('Replays and word checkpoints are formative review only')
  })

  it('keeps the lesson/checkpoint path compact at phone widths', () => {
    const css = source('./MorseProgramme.css')
    expect(css).toContain('.morse-path')
    expect(css).toContain('.morse-path-item')
    expect(css).toContain('.morse-path-checkpoint')
    expect(css).toContain('@media (max-width: 380px)')
    expect(css).not.toMatch(/font-size:\s*\d+px/)
  })

  it('returns focus to the path heading after closing a lesson, replay or checkpoint', () => {
    const code = source('./MorseProgramme.tsx')
    expect(code).toContain('if (!active) headingRef.current?.focus')
    expect(code).toContain("if (active?.kind === 'checkpoint')")
  })

  it('does not create browser-history microstate for checkpoint selection', () => {
    const code = source('./MorseProgramme.tsx')
    expect(code).not.toContain('pushState')
    expect(code).not.toContain('replaceState')
    expect(code).not.toContain('history.')
  })
})
