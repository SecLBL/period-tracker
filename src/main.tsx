import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ensurePersistentStorage } from './utils/database.ts'

// Ask the browser to keep our IndexedDB data even when device storage is low.
// Prevents automatic eviction (the "data disappears on its own" bug).
void ensurePersistentStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
