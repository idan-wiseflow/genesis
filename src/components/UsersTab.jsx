import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { createUser, setUserDisabled, updateProfile } from '../lib/queries'
import { useProfilesById } from '../hooks/useProfilesById'
import Avatar from './Avatar'
import UserForm from './UserForm'
import EditUserForm from './EditUserForm'
import Modal from './Modal'

// email/is_disabled מגיעים דרך profiles_view (010), null אוטומטית למי
// שאינו הנהלה. הלשונית הזו מוצגת רק להנהלה ממילא (Settings.jsx), אז זה
// לא אמור לקרות כאן, אבל אם כן - הטבלה פשוט תראה "-" בשתי העמודות.
export default function UsersTab() {
  const { user } = useAuth()
  const { profiles, refresh } = useProfilesById()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [rowError, setRowError] = useState('')

  async function handleCreate(values) {
    await createUser(values)
    await refresh()
    setCreating(false)
  }

  async function handleEditSave(patch) {
    await updateProfile(editing.id, patch)
    await refresh()
    setEditing(null)
  }

  async function handleToggleDisabled(target) {
    const nextDisabled = !target.is_disabled
    const confirmed = window.confirm(
      nextDisabled ? `לבטל את הגישה של ${target.full_name}?` : `להפעיל מחדש את ${target.full_name}?`
    )
    if (!confirmed) return
    setRowError('')
    setBusyId(target.id)
    try {
      await setUserDisabled(target.id, nextDisabled)
      await refresh()
    } catch (err) {
      setRowError(err.message ?? 'משהו השתבש')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="page-head">
        <div className="sub">כל מי שיש לו גישה למערכת</div>
        <button type="button" className="cta" onClick={() => setCreating(true)}>
          משתמש חדש
        </button>
      </div>

      {rowError && <p className="form-error">{rowError}</p>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>שם</th>
              <th>אימייל</th>
              <th>דרג הרשאה</th>
              <th>תפקידים</th>
              <th>סטטוס</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="user-name-cell">
                    <Avatar name={p.full_name} avatarPath={p.avatar_url} />
                    {p.full_name}
                  </div>
                </td>
                <td className="muted-cell">{p.email ?? '-'}</td>
                <td className="muted-cell">{p.permission_level}</td>
                <td className="muted-cell">{p.roles?.length ? p.roles.join(', ') : '-'}</td>
                <td>
                  {p.is_disabled ? (
                    <span className="badge badge-urgent">מבוטל</span>
                  ) : (
                    <span className="badge badge-success">פעיל</span>
                  )}
                </td>
                <td>
                  <div className="user-row-actions">
                    <button type="button" className="btn-ghost" onClick={() => setEditing(p)}>
                      עריכה
                    </button>
                    {p.id !== user?.id && (
                      <button
                        type="button"
                        className="btn-ghost"
                        disabled={busyId === p.id}
                        onClick={() => handleToggleDisabled(p)}
                      >
                        {p.is_disabled ? 'הפעלה מחדש' : 'ביטול'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && (
        <Modal title="משתמש חדש" onClose={() => setCreating(false)}>
          <UserForm onSubmit={handleCreate} onCancel={() => setCreating(false)} />
        </Modal>
      )}

      {editing && (
        <Modal title={`עריכת ${editing.full_name}`} onClose={() => setEditing(null)}>
          <EditUserForm user={editing} onSubmit={handleEditSave} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  )
}
