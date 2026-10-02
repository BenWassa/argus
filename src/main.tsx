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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

registerServiceWorker()
