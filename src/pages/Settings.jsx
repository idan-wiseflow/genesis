import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getStoredTheme, setTheme } from '../lib/theme'
import { updateOwnProfile } from '../lib/queries'
import { uploadAvatar } from '../lib/avatar'
import Avatar from '../components/Avatar'

const OPTIONS = [
  { value: null, label: 'לפי המערכת' },
  { value: 'light', label: 'בהיר' },
  { value: 'dark', label: 'כהה' },
]

export default function Settings() {
  const { profile, user, refreshProfile } = useAuth()
  const [theme, setThemeState] = useState(getStoredTheme)
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [nameBusy, setNameBusy] = useState(false)
  const [nameError, setNameError] = useState('')
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [avatarError, setAvatarError] = useState('')

  function choose(value) {
    setTheme(value)
    setThemeState(value)
  }

  async function handleSaveName(e) {
    e.preventDefault()
    if (!fullName.trim()) {
      setNameError('שם חובה')
      return
    }
    setNameBusy(true)
    setNameError('')
    try {
      await updateOwnProfile(fullName.trim())
      await refreshProfile()
    } catch (err) {
      setNameError(err.message ?? 'משהו השתבש')
    } finally {
      setNameBusy(false)
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarBusy(true)
    setAvatarError('')
    try {
      const path = await uploadAvatar(user.id, file)
      // שם ריק: ה-RPC (008/009) שומר את השם הקיים כשמעבירים מחרוזת ריקה,
      // אין צורך לקרוא את profile.full_name כאן ולסכן ערך מיושן.
      await updateOwnProfile('', path)
      await refreshProfile()
    } catch (err) {
      setAvatarError(err.message ?? 'משהו השתבש')
    } finally {
      setAvatarBusy(false)
      e.target.value = ''
    }
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
        <h3>הפרופיל שלי</h3>
        <div className="profile-avatar-row">
          <Avatar name={profile?.full_name} avatarPath={profile?.avatar_url} className="avatar avatar-lg" />
          <label className="btn-ghost profile-avatar-upload">
            {avatarBusy ? 'מעלה...' : 'העלאת תמונה'}
            <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={avatarBusy} hidden />
          </label>
        </div>
        {avatarError && <p className="form-error">{avatarError}</p>}

        <form className="entity-form" onSubmit={handleSaveName}>
          <label>
            שם מלא
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </label>
          {nameError && <p className="form-error">{nameError}</p>}
          <div className="form-actions">
            <button type="submit" className="btn" disabled={nameBusy}>
              {nameBusy ? 'שומר...' : 'שמירה'}
            </button>
          </div>
        </form>
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
