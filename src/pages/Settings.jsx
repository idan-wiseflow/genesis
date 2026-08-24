import { useState } from 'react'
import { getStoredTheme, setTheme } from '../lib/theme'

const OPTIONS = [
  { value: null, label: 'לפי המערכת' },
  { value: 'light', label: 'בהיר' },
  { value: 'dark', label: 'כהה' },
]

export default function Settings() {
  const [theme, setThemeState] = useState(getStoredTheme)

  function choose(value) {
    setTheme(value)
    setThemeState(value)
  }

  return (
    <section className="screen">
      <div className="page-head">
        <div>
          <h1>הגדרות</h1>
          <div className="sub">מוצג רק לך, נשמר בדפדפן הזה</div>
        </div>
      </div>

      <div className="section">
        <h3>תצוגה</h3>
        <div className="theme-picker">
          {OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              className={'chip-toggle' + (theme === opt.value ? ' active' : '')}
              onClick={() => choose(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
