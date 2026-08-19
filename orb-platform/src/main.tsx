import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { applyDeviceQuality } from './lib/deviceQuality'

applyDeviceQuality()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
