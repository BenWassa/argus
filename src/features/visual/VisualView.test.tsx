// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { VisualView } from './VisualView'
import { LearnSupport } from '../learn/LearnSupport'
import type { Visual } from '../../domain/visual/visual'
import type { LearnContent } from '../../domain/learning/content'

afterEach(cleanup)

const dial: Visual = {
  source: { kind: 'figure', figure: { kind: 'angle-dial', pointers: [{ bearing: 90, label: 'A' }] } },
  alt: 'A dial with one pointer due east.',
  caption: 'Pointer A at east.',
  credit: 'Drawn by Argus.',
}

const image: Visual = {
  source: { kind: 'image', src: '/media/test/sample.png', width: 700, height: 300 },
  alt: 'A sample photograph.',
}

describe('VisualView', () => {
  it('names the picture with its alt text and shows the caption as text', () => {
    render(<VisualView visual={dial} />)
    expect(screen.getByRole('img', { name: dial.alt })).toBeTruthy()
    expect(screen.getByText('Pointer A at east.')).toBeTruthy()
    expect(screen.getByText('Drawn by Argus.')).toBeTruthy()
  })

  it('draws the dial deterministically from the spec', () => {
    const first0 = render(<VisualView visual={dial} />)
    const first = first0.container.innerHTML
    cleanup()
    const again = render(<VisualView visual={dial} />)
    expect(again.container.innerHTML).toBe(first)
    expect(again.container.querySelectorAll('line.figure-pointer')).toHaveLength(1)
  })

  it('leaves the caption off when asked, as a scored stimulus does', () => {
    render(<VisualView visual={dial} showCaption={false} />)
    expect(screen.queryByText('Pointer A at east.')).toBeNull()
    expect(screen.getByRole('img', { name: dial.alt })).toBeTruthy()
  })

  it('reserves the image box from its dimensions and loads a local file', () => {
    const { container } = render(<VisualView visual={image} />)
    const img = container.querySelector('img')!
    expect(img.getAttribute('src')).toBe('/media/test/sample.png')
    expect(img.getAttribute('width')).toBe('700')
    expect(img.getAttribute('alt')).toBe('')
    expect((container.querySelector('.visual-frame') as HTMLElement).style.aspectRatio).toBe('700 / 300')
  })

  it('shows the alternative as visible text when the image cannot load', () => {
    const { container } = render(<VisualView visual={image} />)
    fireEvent.error(container.querySelector('img')!)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('.visual-missing')?.textContent).toBe(image.alt)
  })
})

describe('Learn visual blocks', () => {
  const learn: LearnContent = {
    kind: 'concise',
    sections: [
      {
        heading: 'Pictures',
        blocks: [
          { type: 'visual', visual: dial },
          {
            type: 'entries',
            entries: [{ marker: 'A', title: 'Alpha', fields: [{ label: 'Look for', text: 'Diver below' }], visual: image }],
          },
        ],
      },
    ],
  }

  it('renders a visual block and an entry visual beside their own text', () => {
    render(<LearnSupport content={learn} />)
    expect(screen.getByRole('img', { name: dial.alt })).toBeTruthy()
    expect(screen.getByRole('img', { name: image.alt })).toBeTruthy()
    expect(screen.getByText('Diver below')).toBeTruthy()
    expect(screen.getByText('Alpha')).toBeTruthy()
  })
})
