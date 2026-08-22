import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { applyDeviceQuality } from './lib/deviceQuality'

applyDeviceQuality()

// When embedded in the 3D room visualizer via iframe, make the app
// background transparent so the mirror reflection shows through dark
// areas (smart mirror effect via mix-blend-mode: screen on the parent).
if (new URLSearchParams(window.location.search).get('embedded') === '1') {
  document.documentElement.style.background = 'transparent'
  document.body.style.background = 'transparent'
  const root = document.getElementById('root')
  if (root) root.style.background = 'transparent'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
