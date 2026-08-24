import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getClient, listClientTasks, updateClient } from '../lib/queries'
import { canEditProjectManager, canManageClients } from '../lib/permissions'
import { formatCurrency, initials } from '../lib/format'
import { useProfilesById } from '../hooks/useProfilesById'
import TaskRow from '../components/TaskRow'
import ClientForm from '../components/ClientForm'

const ROLE_FIELDS = [
  { field: 'project_manager_id', label: 'מנהל פרויקט' },
  { field: 'campaigner_id', label: 'קמפיינר' },
  { field: 'social_id', label: 'Social' },
  { field: 'seo_id', label: 'SEO' },
  { field: 'studio_id', label: 'סטודיו' },
]

export default function ClientDetail() {
  const { clientId } = useParams()
  const { profile } = useAuth()
  const { profiles, profilesById } = useProfilesById()

  const [client, setClient] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [tasks, setTasks] = useState([])
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    let active = true
    getClient(clientId)
      .then((row) => active && setClient(row))
      .catch(() => active && setNotFound(true))
    listClientTasks(clientId).then((rows) => active && setTasks(rows))
    return () => {
      active = false
    }
  }, [clientId])

  if (notFound) {
    return (
      <section className="screen">
        <div className="detail-page">
          <Link className="back-link" to="/clients">
            ← חזרה ללקוחות
          </Link>
          <div className="empty-state">הלקוח לא נמצא, או שאין לך הרשאה לצפות בו</div>
        </div>
      </section>
    )
  }

  if (!client) {
    return (
      <section className="screen">
        <div className="detail-page">
          <div className="empty-state">טוען...</div>
        </div>
      </section>
    )
  }

  const canEdit = canManageClients(profile)
  const hasFinancialRow = client.retainer_amount !== null || client.media_amount !== null

  async function handleEditSubmit(patch) {
    const updated = await updateClient(clientId, patch)
    setClient(updated)
    setEditing(false)
  }

  return (
    <section className="screen">
      <div className="detail-page">
        <Link className="back-link" to="/clients">
          ← חזרה ללקוחות
        </Link>

        {editing ? (
          <div className="section">
            <ClientForm
              initialValues={client}
              profiles={profiles}
              canEditProjectManager={canEditProjectManager(profile)}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditing(false)}
              submitLabel="שמירה"
            />
          </div>
        ) : (
          <>
            <div className="title-row">
              <h1>{client.name}</h1>
              {canEdit && (
                <button type="button" className="btn-ghost" onClick={() => setEditing(true)}>
                  עריכה
                </button>
              )}
            </div>

            <div className="section">
              <h3>צוות מוקצה</h3>
              <div className="field-grid">
                {ROLE_FIELDS.map(({ field, label }) => {
                  const name = client[field] ? profilesById[client[field]]?.full_name : null
                  return (
                    <div className="field" key={field}>
                      <div className="k">{label}</div>
                      <div className="v">
                        {name ? (
                          <>
                            <span className="avatar">{initials(name)}</span>
                            {name}
                          </>
                        ) : (
                          <span className="meta-text">לא משויך</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {hasFinancialRow && (
              <div className="section">
                <h3>פרטים כספיים</h3>
                <div className="field-grid">
                  {client.retainer_amount !== null && (
                    <div className="field">
                      <div className="k">סכום ריטיינר</div>
                      <div className="v">{formatCurrency(client.retainer_amount)}</div>
                    </div>
                  )}
                  {client.media_amount !== null && (
                    <div className="field">
                      <div className="k">סכום מדיה</div>
                      <div className="v">{formatCurrency(client.media_amount)}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="section">
              <h3>משימות</h3>
              {tasks.length === 0 && <div className="empty-state">אין משימות ללקוח הזה</div>}
              {tasks.length > 0 && (
                <div className="task-list">
                  {tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      showClient={false}
                      assigneeName={task.assigned_to ? profilesById[task.assigned_to]?.full_name : null}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
