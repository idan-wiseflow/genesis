import { useState } from 'react'

const ROLE_TAGS = ['קמפיינר', 'SEO', 'Social', 'סטודיו', 'מנהל פרויקט']
const PERMISSION_LEVELS = ['הנהלה', 'מנהל_פרויקט', 'עובד_פנימי', 'פרילנסר']

// עריכת משתמש קיים: שם/דרג הרשאה/תפקידים בלבד. לא אימייל (משויך ל-auth,
// שינוי דורש זרימה אחרת) ולא סיסמה (איפוס סיסמה הוא פיצ'ר נפרד, לא בסבב הזה).
export default function EditUserForm({ user, onSubmit, onCancel }) {
  const [fullName, setFullName] = useState(user.full_name ?? '')
  const [permissionLevel, setPermissionLevel] = useState(user.permission_level)
  const [roles, setRoles] = useState(user.roles ?? [])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function toggleRole(tag) {
    setRoles((prev) => (prev.includes(tag) ? prev.filter((r) => r !== tag) : [...prev, tag]))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!fullName.trim()) {
      setError('שם חובה')
      return
    }
    setError('')
    setBusy(true)
    try {
      await onSubmit({ full_name: fullName.trim(), permission_level: permissionLevel, roles })
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
          {busy ? 'שומר...' : 'שמירה'}
        </button>
      </div>
    </form>
  )
}
