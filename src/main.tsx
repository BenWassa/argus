import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { registerServiceWorker } from './app/registerServiceWorker'
import './styles/global.css'

// A local study, never a production preference or persisted learner setting.
if (import.meta.env.DEV) {
  const colour = new URLSearchParams(window.location.search).get('colour')
  if (colour === 'current' || colour === 'raised') {
    document.documentElement.dataset.colourPreview = colour
    void import('./styles/colourPreview.css')
  }
}

const root = createRoot(document.getElementById('root')!)

if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'morse-play') {
  void import('./dev/morsePlay/MorsePlayPreview').then(({ MorsePlayPreview }) => {
    root.render(<StrictMode><MorsePlayPreview /></StrictMode>)
  })
} else {
  root.render(<StrictMode><App /></StrictMode>)
}

registerServiceWorker()
