const KEY = 'genesis:theme'

// null = לפי המערכת (prefers-color-scheme), אחרת 'light'/'dark' דורס אותה.
export function getStoredTheme() {
  const value = localStorage.getItem(KEY)
  return value === 'light' || value === 'dark' ? value : null
}

export function applyTheme(theme) {
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.setAttribute('data-theme', theme)
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

export function setTheme(theme) {
  if (theme === 'light' || theme === 'dark') localStorage.setItem(KEY, theme)
  else localStorage.removeItem(KEY)
  applyTheme(theme)
}
