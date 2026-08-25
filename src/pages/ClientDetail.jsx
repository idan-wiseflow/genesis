import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getClient, listClientTasks, updateClient } from '../lib/queries'
import { canEditProjectManager, canManageClients } from '../lib/permissions'
import { listClientPackageHistory } from '../lib/packages'
import { FREQUENCY_LABELS } from '../lib/packageMeta'
import { formatCurrency, formatDate } from '../lib/format'
import { CLIENT_ROLE_FIELDS } from '../lib/clientRoles'
import { useProfilesById } from '../hooks/useProfilesById'
import TaskRow from '../components/TaskRow'
import Avatar from '../components/Avatar'
import InlineEditor from '../components/InlineEditor'
import ClientPackagesSection from '../components/ClientPackagesSection'

// שדה ברשת: תצוגה, או לחיצה כדי לעבור לעריכה במקום. אין כפתור "עריכה" גלובלי,
// כל שדה עומד בפני עצמו. אותה תבנית בדיוק כמו EditableField ב-TaskDetail.jsx
// (עידן, 24.08.2026: "לא צריך כפתור עריכה... יש לערוך אם לוחצים על שורה").
function EditableField({ label, display, value, type, options, editable, isEditing, onEdit, onSave, onCancel }) {
  if (isEditing) {
    return (
      <div className="field">
        <div className="k">{label}</div>
        <InlineEditor type={type} value={value} options={options} onSave={onSave} onCancel={onCancel} />
      </div>
    )
  }
  if (!editable) {
    return (
      <div className="field">
        <div className="k">{label}</div>
        <div className="v">{display}</div>
      </div>
    )
  }
  return (
    <button type="button" className="field field-editable" onClick={onEdit}>
      <div className="k">{label}</div>
      <div className="v">{display}</div>
    </button>
  )
}

export default function ClientDetail() {
  const { clientId } = useParams()
  const { profile } = useAuth()
  const { profiles, profilesById } = useProfilesById()

  const [client, setClient] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [tasks, setTasks] = useState([])
  const [history, setHistory] = useState([])
  const [editingField, setEditingField] = useState(null)
  const [detailTab, setDetailTab] = useState('packages')

  useEffect(() => {
    let active = true
    getClient(clientId)
      .then((row) => active && setClient(row))
      .catch(() => active && setNotFound(true))
    listClientTasks(clientId).then((rows) => active && setTasks(rows))
    listClientPackageHistory(clientId).then((rows) => active && setHistory(rows))
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
  const canEditPM = canEditProjectManager(profile)
  const hasFinancialRow = client.retainer_amount !== null || client.media_amount !== null

  async function saveField(field, rawValue) {
    const value = rawValue === '' ? null : rawValue
    if (field === 'name' && !value) throw new Error('שם הלקוח חובה')
    const updated = await updateClient(clientId, { [field]: value })
    setClient(updated)
    setEditingField(null)
  }

  const roleOptions = [{ value: '', label: 'לא משויך' }, ...profiles.map((p) => ({ value: p.id, label: p.full_name }))]

  return (
    <section className="screen">
      <div className="detail-page wide client-detail">
        <Link className="back-link" to="/clients">
          ← חזרה ללקוחות
        </Link>

        <div className="title-row">
          {editingField === 'name' ? (
            <InlineEditor
              type="text"
              value={client.name}
              onSave={(v) => saveField('name', v)}
              onCancel={() => setEditingField(null)}
            />
          ) : (
            <h1 className={canEdit ? 'clickable' : undefined} onClick={() => canEdit && setEditingField('name')}>
              {client.name}
            </h1>
          )}
        </div>

        {/* סדר הסקשנים לפי בקשת עידן (25.08.2026): פרטים כלליים, צוות מנהל,
            פרטים כספיים, ואז חבילות ומשימות. */}

        <div className="section">
          <div className="section-head">
            <h3>פרטים כלליים</h3>
          </div>
          <div className="field-grid">
            <EditableField
              label="אתר"
              display={
                client.website ? (
                  <span className="link-value">
                    {client.website} <span className="ext">↗</span>
                  </span>
                ) : (
                  'לא הוגדר'
                )
              }
              value={client.website ?? ''}
              type="text"
              editable={canEdit}
              isEditing={editingField === 'website'}
              onEdit={() => setEditingField('website')}
              onSave={(v) => saveField('website', v)}
              onCancel={() => setEditingField(null)}
            />
            <EditableField
              label="אימייל ליצירת קשר"
              display={client.contact_email ? <span className="link-value">{client.contact_email}</span> : 'לא הוגדר'}
              value={client.contact_email ?? ''}
              type="text"
              editable={canEdit}
              isEditing={editingField === 'contact_email'}
              onEdit={() => setEditingField('contact_email')}
              onSave={(v) => saveField('contact_email', v)}
              onCancel={() => setEditingField(null)}
            />
            <EditableField
              label="טלפון"
              display={client.contact_phone ?? 'לא הוגדר'}
              value={client.contact_phone ?? ''}
              type="text"
              editable={canEdit}
              isEditing={editingField === 'contact_phone'}
              onEdit={() => setEditingField('contact_phone')}
              onSave={(v) => saveField('contact_phone', v)}
              onCancel={() => setEditingField(null)}
            />
            <EditableField
              label="תיקיית עבודה"
              display={
                client.drive_folder_url ? (
                  <span className="link-value">
                    פתיחה בדרייב <span className="ext">↗</span>
                  </span>
                ) : (
                  'לא הוגדר'
                )
              }
              value={client.drive_folder_url ?? ''}
              type="text"
              editable={canEdit}
              isEditing={editingField === 'drive_folder_url'}
              onEdit={() => setEditingField('drive_folder_url')}
              onSave={(v) => saveField('drive_folder_url', v)}
              onCancel={() => setEditingField(null)}
            />
          </div>
        </div>

        <div className="section">
          <div className="section-head">
            <h3>צוות מנהל</h3>
          </div>
          <div className="field-grid">
            {CLIENT_ROLE_FIELDS.map(({ field, label }) => {
              const isPM = field === 'project_manager_id'
              const person = client[field] ? profilesById[client[field]] : null
              return (
                <EditableField
                  key={field}
                  label={label}
                  display={
                    person ? (
                      <>
                        <Avatar name={person.full_name} avatarPath={person.avatar_url} />
                        {person.full_name}
                      </>
                    ) : (
                      <span className="unassigned">לא משויך</span>
                    )
                  }
                  value={client[field] ?? ''}
                  type="select"
                  options={roleOptions}
                  editable={isPM ? canEdit && canEditPM : canEdit}
                  isEditing={editingField === field}
                  onEdit={() => setEditingField(field)}
                  onSave={(v) => saveField(field, v)}
                  onCancel={() => setEditingField(null)}
                />
              )
            })}
          </div>
        </div>

        {hasFinancialRow && (
          <div className="section">
            <div className="section-head">
              <h3>פרטים כספיים</h3>
            </div>
            <div className="field-grid">
              {client.retainer_amount !== null && (
                <EditableField
                  label="סכום ריטיינר"
                  display={formatCurrency(client.retainer_amount)}
                  value={client.retainer_amount ?? ''}
                  type="text"
                  editable={canEdit}
                  isEditing={editingField === 'retainer_amount'}
                  onEdit={() => setEditingField('retainer_amount')}
                  onSave={(v) => saveField('retainer_amount', v)}
                  onCancel={() => setEditingField(null)}
                />
              )}
              {client.media_amount !== null && (
                <EditableField
                  label="סכום מדיה"
                  display={formatCurrency(client.media_amount)}
                  value={client.media_amount ?? ''}
                  type="text"
                  editable={canEdit}
                  isEditing={editingField === 'media_amount'}
                  onEdit={() => setEditingField('media_amount')}
                  onSave={(v) => saveField('media_amount', v)}
                  onCancel={() => setEditingField(null)}
                />
              )}
            </div>
          </div>
        )}

        <div className="section">
          <div className="tab-switcher">
            <button
              type="button"
              className={'tab' + (detailTab === 'packages' ? ' active' : '')}
              onClick={() => setDetailTab('packages')}
            >
              חבילות משויכות
            </button>
            <button
              type="button"
              className={'tab' + (detailTab === 'tasks' ? ' active' : '')}
              onClick={() => setDetailTab('tasks')}
            >
              משימות{tasks.length > 0 ? ` (${tasks.length})` : ''}
            </button>
            <button
              type="button"
              className={'tab' + (detailTab === 'history' ? ' active' : '')}
              onClick={() => {
                setDetailTab('history')
                listClientPackageHistory(clientId).then(setHistory)
              }}
            >
              היסטוריה
            </button>
          </div>

          {detailTab === 'packages' && <ClientPackagesSection clientId={clientId} canEdit={canEdit} />}

          {detailTab === 'tasks' && (
            <>
              {tasks.length === 0 && <div className="empty-state">אין משימות ללקוח הזה</div>}
              {tasks.length > 0 && (
                <div className="task-list">
                  {tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      showClient={false}
                      assignee={task.assigned_to ? profilesById[task.assigned_to] : null}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {detailTab === 'history' && (
            <div className="history-list">
              {history.map((h) => (
                <div className="history-row" key={h.id}>
                  <span className="meta-text">
                    {h.client_packages?.package_definitions?.name ?? 'חבילה'}
                    {' · '}
                    {h.package_task_templates?.task_name ?? 'משימה'}
                    {' · '}
                    {h.action === 'set' ? `${h.quantity} · ${FREQUENCY_LABELS[h.frequency]}` : 'ההתאמה הוסרה'}
                  </span>
                  <span className="meta-text">
                    {profilesById[h.changed_by]?.full_name ?? 'לא ידוע'} · {formatDate(h.changed_at)}
                  </span>
                </div>
              ))}
              {history.length === 0 && <div className="empty-state">אין שינויים רשומים</div>}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
