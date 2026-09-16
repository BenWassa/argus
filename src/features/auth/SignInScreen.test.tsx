// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SignInScreen } from './SignInScreen'

afterEach(() => {
  cleanup()
})

describe('SignInScreen', () => {
  it('keeps splash media and Google authentication in one shell', () => {
    const { container } = render(
      <SignInScreen restoring={false} error={null} onSignIn={() => {}} />,
    )

    expect(container.querySelector('.signin-shell')).toBeTruthy()
    expect(container.querySelector('.signin-media')).toBeTruthy()
    expect(container.querySelector('video source')?.getAttribute('src')).toContain('media/splashv1.mp4')
    expect(screen.getByRole('heading', { name: 'Argus' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeTruthy()
  })

  it('shows restoration status without offering a duplicate sign-in action', () => {
    render(<SignInScreen restoring error={null} onSignIn={() => {}} />)

    expect(screen.getByText(/checking your session/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /continue with google/i })).toBeNull()
  })

  it('prevents duplicate submission while Google sign-in is active', async () => {
    let finish!: () => void
    const signIn = () =>
      new Promise<void>((resolve) => {
        finish = resolve
      })

    render(<SignInScreen restoring={false} error={null} onSignIn={signIn} />)
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }))

    const busy = screen.getByRole('button', { name: /signing in/i }) as HTMLButtonElement
    expect(busy.disabled).toBe(true)
    expect(busy.getAttribute('aria-busy')).toBe('true')

    finish()
    await waitFor(() =>
      expect((screen.getByRole('button', { name: /continue with google/i }) as HTMLButtonElement).disabled).toBe(false),
    )
  })

  it('uses the stable poster and does not autoplay video for reduced motion', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    })

    const { container } = render(
      <SignInScreen restoring={false} error={null} onSignIn={() => {}} />,
    )

    expect(container.querySelector('.signin-poster')).toBeTruthy()
    expect(container.querySelector('.signin-video')).toBeNull()
  })
})
