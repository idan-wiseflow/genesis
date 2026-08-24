import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { createUser } from '../lib/queries'
import { canCreateUsers } from '../lib/permissions'
import { useProfilesById } from '../hooks/useProfilesById'
import Avatar from '../components/Avatar'
import UserForm from '../components/UserForm'
import Modal from '../components/Modal'

export default function Users() {
  const { profile } = useAuth()
  const { profiles, refresh } = useProfilesById()
  const [creating, setCreating] = useState(false)

  // לא רק הסתרת הכפתור: מי שאינו הנהלה ומגיע לנתיב הזה ישירות (למשל הקלדת
  // /users) לא רואה מסך שאין לו שום שימוש בו. ה-DB לא מגן על זה, profiles
  // גלוי לכל מחובר ממילא (profiles_select_all), זו החלטת מוצר, לא גבול אבטחה.
  if (!canCreateUsers(profile)) {
    return (
      <section className="screen">
        <div className="empty-state">המסך הזה זמין להנהלה בלבד</div>
      </section>
    )
  }

  async function handleCreate(values) {
    await createUser(values)
    await refresh()
    setCreating(false)
  }

  return (
    <section className="screen">
      <div className="page-head">
        <div>
          <h1>משתמשים</h1>
          <div className="sub">כל מי שיש לו גישה למערכת</div>
        </div>
        <button type="button" className="cta" onClick={() => setCreating(true)}>
          משתמש חדש
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>שם</th>
              <th>דרג הרשאה</th>
              <th>תפקידים</th>
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
                <td className="muted-cell">{p.permission_level}</td>
                <td className="muted-cell">{p.roles?.length ? p.roles.join(', ') : '-'}</td>
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
    </section>
  )
}
