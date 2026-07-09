import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { App } from './App'
import { nativeBootstrap, hideNativeSplash } from './lib/nativeBootstrap'

// Native chrome (status bar) before first paint; both are no-ops on the web.
void nativeBootstrap()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Dismiss the launch splash once the first frame is up.
requestAnimationFrame(() => void hideNativeSplash())
