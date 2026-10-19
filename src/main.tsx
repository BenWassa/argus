import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { registerServiceWorker } from './app/registerServiceWorker'
import './styles/global.css'

const root = createRoot(document.getElementById('root')!)

root.render(<StrictMode><App /></StrictMode>)

registerServiceWorker()
