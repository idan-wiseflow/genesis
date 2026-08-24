import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyTheme, getStoredTheme } from './lib/theme'

// לפני ה-render הראשון, כדי למנוע הבזק של הצבע הלא נכון אם המשתמש דרס את
// prefers-color-scheme ידנית דרך מסך ההגדרות.
applyTheme(getStoredTheme())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
