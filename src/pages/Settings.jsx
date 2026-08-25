import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getStoredTheme, setTheme } from '../lib/theme'
import { updateOwnProfile } from '../lib/queries'
import { uploadAvatar } from '../lib/avatar'
import { canCreateUsers, canManagePackages } from '../lib/permissions'
import Avatar from '../components/Avatar'
import UsersTab from '../components/UsersTab'
import PackagesTab from '../components/PackagesTab'

const THEME_OPTIONS = [
  { value: null, label: 'לפי המערכת' },
  { value: 'light', label: 'בהיר' },
  { value: 'dark', label: 'כהה' },
]

export default function Settings() {
  const { profile, user, refreshProfile } = useAuth()
  const [tab, setTab] = useState('profile')
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

  const showUsersTab = canCreateUsers(profile)
  const showPackagesTab = canManagePackages(profile)

  return (
    <section className="screen">
      <div className="page-head">
        <div>
          <h1>הגדרות</h1>
          <div className="sub">
            {tab === 'users' && 'ניהול משתמשי המערכת'}
            {tab === 'packages' && 'קטלוג החבילות הגלובלי'}
            {tab !== 'users' && tab !== 'packages' && 'מוצג רק לך, נשמר בדפדפן הזה'}
          </div>
        </div>
      </div>

      <div className="tab-switcher">
        <button type="button" className={'tab' + (tab === 'profile' ? ' active' : '')} onClick={() => setTab('profile')}>
          פרופיל
        </button>
        <button type="button" className={'tab' + (tab === 'display' ? ' active' : '')} onClick={() => setTab('display')}>
          תצוגה
        </button>
        {showUsersTab && (
          <button type="button" className={'tab' + (tab === 'users' ? ' active' : '')} onClick={() => setTab('users')}>
            משתמשים
          </button>
        )}
        {showPackagesTab && (
          <button
            type="button"
            className={'tab' + (tab === 'packages' ? ' active' : '')}
            onClick={() => setTab('packages')}
          >
            חבילות
          </button>
        )}
      </div>

      {tab === 'profile' && (
        <div>
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
      )}

      {tab === 'display' && (
        <div className="theme-picker">
          {THEME_OPTIONS.map((opt) => (
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
      )}

      {tab === 'users' && showUsersTab && <UsersTab />}
      {tab === 'packages' && showPackagesTab && <PackagesTab />}
    </section>
  )
}
