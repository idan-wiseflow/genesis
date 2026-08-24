import { useState } from 'react'

// רב-ערכי לפי תיעוד 001_init_schema.sql: "קמפיינר / SEO / Social / סטודיו / מנהל פרויקט"
const ROLE_TAGS = ['קמפיינר', 'SEO', 'Social', 'סטודיו', 'מנהל פרויקט']
const PERMISSION_LEVELS = ['הנהלה', 'מנהל_פרויקט', 'עובד_פנימי', 'פרילנסר']

export default function UserForm({ onSubmit, onCancel }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [permissionLevel, setPermissionLevel] = useState('עובד_פנימי')
  const [roles, setRoles] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function toggleRole(tag) {
    setRoles((prev) => (prev.includes(tag) ? prev.filter((r) => r !== tag) : [...prev, tag]))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!fullName.trim() || !email.trim() || !password) {
      setError('שם, אימייל וסיסמה הם שדות חובה')
      return
    }
    if (password.length < 6) {
      setError('סיסמה חייבת להיות לפחות 6 תווים')
      return
    }
    setError('')
    setBusy(true)
    try {
      await onSubmit({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        permissionLevel,
        roles,
      })
    } catch (err) {
      setError(err.message ?? 'משהו השתבש, נסה שוב')
      setBusy(false)
    }
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <label>
        שם מלא
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
      </label>

      <label>
        אימייל
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
      </label>

      <label>
        סיסמה זמנית
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
      </label>
      <div className="form-hint">המשתמש יכול להתחבר איתה מיד, אין עדיין מסך "שכחתי סיסמה"</div>

      <label>
        דרג הרשאה
        <select value={permissionLevel} onChange={(e) => setPermissionLevel(e.target.value)}>
          {PERMISSION_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </label>

      <div>
        <div className="form-hint role-tags-label">תפקידים</div>
        <div className="role-tags">
          {ROLE_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={'chip-toggle' + (roles.includes(tag) ? ' active' : '')}
              onClick={() => toggleRole(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>
          ביטול
        </button>
        <button type="submit" className="btn" disabled={busy}>
          {busy ? 'יוצר...' : 'יצירה'}
        </button>
      </div>
    </form>
  )
}
