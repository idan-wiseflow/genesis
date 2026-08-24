import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  addTaskComment,
  attachTag,
  createTag,
  detachTag,
  getTask,
  listTaskComments,
  listTaskTagIds,
  listTags,
  updateTask,
} from '../lib/queries'
import { canCreateTags, canEditTask } from '../lib/permissions'
import {
  describeTaskError,
  nextStatus,
  prevStatus,
  PRIORITY_BADGE_CLASS,
  STATUS_BADGE_CLASS,
  STATUS_ORDER,
} from '../lib/taskStatus'
import { formatDate, initials } from '../lib/format'
import { useClientsById } from '../hooks/useClientsById'
import { useProfilesById } from '../hooks/useProfilesById'
import InlineEditor from '../components/InlineEditor'

const MENTION_RE = /(@[\p{L}\p{N}_'"]+)/gu

function renderCommentText(text) {
  // תיוג @שם ויזואלי בלבד: פיצול לטקסט + span, אף פעם לא dangerouslySetInnerHTML
  // על טקסט חופשי של משתמש (ראו סקירת שמעון על התוכנית, 24.08.2026).
  return text.split(MENTION_RE).map((part, i) =>
    part.startsWith('@') ? (
      <span className="mention" key={i}>
        {part}
      </span>
    ) : (
      part
    )
  )
}

// שדה בסיידבר: תצוגה, או לחיצה כדי לעבור לעריכה במקום. אין כפתור "עריכה" גלובלי,
// כל שדה עומד בפני עצמו (עידן, 24.08.2026: "לא צריך כפתור עריכה... יש לערוך אם לוחצים על שורה").
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

export default function TaskDetail() {
  const { taskId } = useParams()
  const { profile, user } = useAuth()
  const { clients, clientsById } = useClientsById()
  const { profiles, profilesById } = useProfilesById()

  const [task, setTask] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [comments, setComments] = useState([])
  const [tagIds, setTagIds] = useState([])
  const [allTags, setAllTags] = useState([])
  const [editingField, setEditingField] = useState(null)
  const [statusError, setStatusError] = useState('')
  const [statusBusy, setStatusBusy] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentBusy, setCommentBusy] = useState(false)
  const [addTagValue, setAddTagValue] = useState('')
  const [newTagName, setNewTagName] = useState('')

  useEffect(() => {
    let active = true
    getTask(taskId)
      .then((row) => active && setTask(row))
      .catch(() => active && setNotFound(true))
    listTaskComments(taskId).then((rows) => active && setComments(rows))
    listTaskTagIds(taskId).then((ids) => active && setTagIds(ids))
    listTags().then((rows) => active && setAllTags(rows))
    return () => {
      active = false
    }
  }, [taskId])

  if (notFound) {
    return (
      <section className="screen">
        <div className="detail-page">
          <Link className="back-link" to="/tasks">
            ← חזרה למשימות
          </Link>
          <div className="empty-state">המשימה לא נמצאה, או שאין לך הרשאה לצפות בה</div>
        </div>
      </section>
    )
  }

  if (!task) {
    return (
      <section className="screen">
        <div className="detail-page">
          <div className="empty-state">טוען...</div>
        </div>
      </section>
    )
  }

  const canEdit = canEditTask(profile, task, user?.id)
  const clientName = task.client_id ? clientsById[task.client_id]?.name : null
  const assigneeName = task.assigned_to ? profilesById[task.assigned_to]?.full_name : null
  const currentPos = STATUS_ORDER.indexOf(task.status)
  const forward = nextStatus(task.status)
  const back = prevStatus(task.status)
  const attachedTags = allTags.filter((t) => tagIds.includes(t.id))
  const availableTags = allTags.filter((t) => !tagIds.includes(t.id))

  async function moveStatus(newStatus) {
    setStatusBusy(true)
    setStatusError('')
    try {
      const updated = await updateTask(taskId, { status: newStatus })
      setTask(updated)
    } catch (err) {
      setStatusError(describeTaskError(err))
    } finally {
      setStatusBusy(false)
    }
  }

  async function saveField(field, rawValue) {
    const value = rawValue === '' ? null : rawValue
    if (field === 'title' && !value) throw new Error('שם המשימה חובה')
    try {
      const updated = await updateTask(taskId, { [field]: value })
      setTask(updated)
      setEditingField(null)
    } catch (err) {
      throw new Error(describeTaskError(err))
    }
  }

  async function handleAddComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    setCommentBusy(true)
    try {
      const created = await addTaskComment(taskId, user.id, commentText.trim())
      setComments((prev) => [...prev, created])
      setCommentText('')
    } finally {
      setCommentBusy(false)
    }
  }

  async function handleAttachTag() {
    if (!addTagValue) return
    await attachTag(taskId, addTagValue)
    setTagIds((prev) => [...prev, addTagValue])
    setAddTagValue('')
  }

  async function handleDetachTag(tagId) {
    await detachTag(taskId, tagId)
    setTagIds((prev) => prev.filter((id) => id !== tagId))
  }

  async function handleCreateTag() {
    if (!newTagName.trim()) return
    const tag = await createTag(newTagName.trim(), user.id)
    setAllTags((prev) => [...prev, tag])
    await attachTag(taskId, tag.id)
    setTagIds((prev) => [...prev, tag.id])
    setNewTagName('')
  }

  const clientOptions = [
    { value: '', label: 'ללא לקוח' },
    ...clients.map((c) => ({ value: c.id, label: c.name })),
  ]
  const assigneeOptions = [
    { value: '', label: 'לא משויך' },
    ...profiles.map((p) => ({ value: p.id, label: p.full_name })),
  ]
  const priorityOptions = [
    { value: 'רגיל', label: 'רגיל' },
    { value: 'דחוף', label: 'דחוף' },
  ]

  return (
    <section className="screen">
      <div className="detail-page wide">
        <Link className="back-link" to="/tasks">
          ← חזרה למשימות
        </Link>

        <div className="title-row">
          {editingField === 'title' ? (
            <InlineEditor
              type="text"
              value={task.title}
              onSave={(v) => saveField('title', v)}
              onCancel={() => setEditingField(null)}
            />
          ) : (
            <h1
              className={canEdit ? 'clickable' : undefined}
              onClick={() => canEdit && setEditingField('title')}
            >
              {task.title}
            </h1>
          )}
        </div>

        <div className="meta-strip">
          <span className={`badge ${STATUS_BADGE_CLASS[task.status]}`}>{task.status}</span>
        </div>

        <div className="grid">
          <div>
            <div className="section">
              <h3>התקדמות</h3>
              <div className="stepper">
                {STATUS_ORDER.map((status, i) => (
                  <div key={status} className={'seg' + (i < currentPos ? ' done' : i === currentPos ? ' current' : '')}>
                    <span className="line" />
                    <span className="node">{i < currentPos ? '✓' : ''}</span>
                    <span className="label">{status}</span>
                  </div>
                ))}
              </div>
              {canEdit && (
                <div className="stepper-actions">
                  <button
                    type="button"
                    className="btn"
                    disabled={!forward || statusBusy}
                    onClick={() => moveStatus(forward)}
                  >
                    שלב הבא →
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    disabled={!back || statusBusy}
                    onClick={() => moveStatus(back)}
                  >
                    ← שלב קודם
                  </button>
                </div>
              )}
              {statusError && <p className="form-error">{statusError}</p>}
            </div>

            <div className="section">
              <h3>תיאור</h3>
              {editingField === 'description' ? (
                <InlineEditor
                  type="textarea"
                  value={task.description ?? ''}
                  onSave={(v) => saveField('description', v)}
                  onCancel={() => setEditingField(null)}
                />
              ) : (
                <p
                  className={'desc' + (canEdit ? ' clickable' : '')}
                  onClick={() => canEdit && setEditingField('description')}
                >
                  {task.description || (canEdit ? 'אין תיאור, לחצו להוספה' : 'אין תיאור')}
                </p>
              )}
            </div>

            <div className="section">
              <h3>התכתבות</h3>
              <div>
                {comments.map((c) => (
                  <div className="comment" key={c.id}>
                    <span className="avatar">{initials(profilesById[c.user_id]?.full_name)}</span>
                    <div>
                      <div className="who">
                        {profilesById[c.user_id]?.full_name ?? '...'}
                        <time>{formatDate(c.created_at?.slice(0, 10))}</time>
                      </div>
                      <div className="ctext">{renderCommentText(c.text)}</div>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && <div className="empty-state">אין עדיין תגובות</div>}
              </div>
              <form className="comment-input" onSubmit={handleAddComment}>
                <input
                  type="text"
                  placeholder="כתבו הערה..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button type="submit" disabled={commentBusy || !commentText.trim()}>
                  שלח
                </button>
              </form>
            </div>
          </div>

          <aside className="side">
            <EditableField
              label="לקוח"
              display={clientName ?? 'ללא לקוח'}
              value={task.client_id ?? ''}
              type="select"
              options={clientOptions}
              editable={canEdit}
              isEditing={editingField === 'client_id'}
              onEdit={() => setEditingField('client_id')}
              onSave={(v) => saveField('client_id', v)}
              onCancel={() => setEditingField(null)}
            />
            <EditableField
              label="אחראי"
              display={assigneeName ?? 'לא משויך'}
              value={task.assigned_to ?? ''}
              type="select"
              options={assigneeOptions}
              editable={canEdit}
              isEditing={editingField === 'assigned_to'}
              onEdit={() => setEditingField('assigned_to')}
              onSave={(v) => saveField('assigned_to', v)}
              onCancel={() => setEditingField(null)}
            />
            <EditableField
              label="עדיפות"
              display={<span className={`badge ${PRIORITY_BADGE_CLASS[task.priority]}`}>{task.priority}</span>}
              value={task.priority}
              type="select"
              options={priorityOptions}
              editable={canEdit}
              isEditing={editingField === 'priority'}
              onEdit={() => setEditingField('priority')}
              onSave={(v) => saveField('priority', v)}
              onCancel={() => setEditingField(null)}
            />
            <EditableField
              label="יעד"
              display={task.due_date ? formatDate(task.due_date) : 'ללא תאריך יעד'}
              value={task.due_date ?? ''}
              type="date"
              editable={canEdit}
              isEditing={editingField === 'due_date'}
              onEdit={() => setEditingField('due_date')}
              onSave={(v) => saveField('due_date', v)}
              onCancel={() => setEditingField(null)}
            />

            <div className="field">
              <div className="k">תגיות</div>
              <div className="v tag-list">
                {attachedTags.map((t) => (
                  <span className="tag-badge" key={t.id}>
                    {t.name}
                    {canEdit && (
                      <button type="button" className="tag-remove" onClick={() => handleDetachTag(t.id)}>
                        ✕
                      </button>
                    )}
                  </span>
                ))}
                {attachedTags.length === 0 && <span className="meta-text">אין תגיות</span>}
              </div>
              {canEdit && availableTags.length > 0 && (
                <div className="tag-add-row">
                  <select value={addTagValue} onChange={(e) => setAddTagValue(e.target.value)}>
                    <option value="">בחר תגית קיימת</option>
                    {availableTags.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="btn-ghost" onClick={handleAttachTag}>
                    הוסף
                  </button>
                </div>
              )}
              {canCreateTags(profile) && (
                <div className="tag-add-row">
                  <input
                    type="text"
                    placeholder="תגית חדשה"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                  />
                  <button type="button" className="btn-ghost" onClick={handleCreateTag}>
                    יצירה
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
