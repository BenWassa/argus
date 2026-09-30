// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AudioPlayer } from './AudioPlayer'

let play: ReturnType<typeof vi.fn>
let pause: ReturnType<typeof vi.fn>

beforeEach(() => {
  play = vi.fn(() => Promise.resolve())
  pause = vi.fn()
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(play as never)
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pause as never)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const audioElement = () => document.querySelector('audio') as HTMLAudioElement

describe('AudioPlayer', () => {
  it('never plays by itself', () => {
    render(<AudioPlayer src="/media/audio/a.mp3" label="a call" />)
    expect(play).not.toHaveBeenCalled()
    expect(audioElement().autoplay).toBe(false)
  })

  it('points the native element at the local shipped file', () => {
    render(<AudioPlayer src="/media/audio/a.mp3" label="a call" />)
    expect(audioElement().getAttribute('src')).toBe('/media/audio/a.mp3')
    expect(audioElement().getAttribute('preload')).toBe('auto')
  })

  it('names its control by what it will do and what it is about', () => {
    render(<AudioPlayer src="/media/audio/a.mp3" label="Copy the call sign" />)
    expect(screen.getByRole('button', { name: 'Play recording: Copy the call sign' })).toBeTruthy()
  })

  it('plays on press, says Stop while playing, then offers Replay', () => {
    const onPlay = vi.fn()
    render(<AudioPlayer src="/media/audio/a.mp3" label="x" onPlay={onPlay} />)
    fireEvent.click(screen.getByRole('button', { name: /Play recording/ }))
    expect(play).toHaveBeenCalledTimes(1)

    fireEvent(audioElement(), new Event('playing'))
    expect(screen.getByRole('button', { name: /Stop recording/ })).toBeTruthy()
    expect(screen.getByRole('status').textContent).toBe('Playing.')
    expect(onPlay).toHaveBeenLastCalledWith(false)

    fireEvent(audioElement(), new Event('ended'))
    expect(screen.getByRole('button', { name: /Replay recording/ })).toBeTruthy()
    expect(screen.getByRole('status').textContent).toMatch(/Finished/)

    fireEvent.click(screen.getByRole('button', { name: /Replay recording/ }))
    expect(play).toHaveBeenCalledTimes(2)
    fireEvent(audioElement(), new Event('playing'))
    expect(onPlay).toHaveBeenLastCalledWith(true) // the second start is a replay
  })

  it('stops and rewinds when pressed while playing', () => {
    render(<AudioPlayer src="/media/audio/a.mp3" label="x" />)
    fireEvent.click(screen.getByRole('button', { name: /Play recording/ }))
    fireEvent(audioElement(), new Event('playing'))
    fireEvent.click(screen.getByRole('button', { name: /Stop recording/ }))
    expect(pause).toHaveBeenCalled()
    expect(audioElement().currentTime).toBe(0)
    expect(screen.getByRole('button', { name: /Replay recording/ })).toBeTruthy()
  })

  it('reports an unplayable recording, disables the control and keeps the learner unblocked', async () => {
    play.mockImplementation(() => Promise.reject(new Error('NotSupportedError')))
    const onUnavailable = vi.fn()
    render(<AudioPlayer src="/media/audio/a.mp3" label="x" onUnavailable={onUnavailable} />)
    fireEvent.click(screen.getByRole('button', { name: /Play recording/ }))
    await act(async () => {
      await Promise.resolve()
    })
    expect(onUnavailable).toHaveBeenCalledTimes(1)
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByRole('status').textContent).toMatch(/read the transcript instead/)
  })

  it('treats a load error on the element the same way', () => {
    const onUnavailable = vi.fn()
    render(<AudioPlayer src="/media/audio/missing.mp3" label="x" onUnavailable={onUnavailable} />)
    fireEvent(audioElement(), new Event('error'))
    expect(onUnavailable).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button').textContent).toMatch(/Unavailable/)
  })

  it('stops on unmount and when the page is hidden', () => {
    const { unmount } = render(<AudioPlayer src="/media/audio/a.mp3" label="x" />)
    window.dispatchEvent(new Event('pagehide'))
    expect(pause).toHaveBeenCalledTimes(1)
    unmount()
    expect(pause.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  it('announces state politely so a screen reader hears it without stealing focus', () => {
    render(<AudioPlayer src="/media/audio/a.mp3" label="x" />)
    const status = screen.getByRole('status')
    expect(status.getAttribute('aria-live')).toBe('polite')
  })
})
