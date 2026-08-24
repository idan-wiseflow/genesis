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
import TaskForm from '../components/TaskForm'

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
  const [editing, setEditing] = useState(false)
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

  async function handleEditSubmit(patch) {
    const updated = await updateTask(taskId, patch)
    setTask(updated)
    setEditing(false)
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

  return (
    <section className="screen">
      <div className="detail-page wide">
        <Link className="back-link" to="/tasks">
          ← חזרה למשימות
        </Link>

        {editing ? (
          <div className="section">
            <TaskForm
              initialValues={{
                title: task.title,
                description: task.description ?? '',
                client_id: task.client_id ?? '',
                assigned_to: task.assigned_to ?? '',
                due_date: task.due_date ?? '',
                priority: task.priority,
              }}
              clients={clients}
              profiles={profiles}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditing(false)}
              submitLabel="שמירה"
            />
          </div>
        ) : (
          <>
            <div className="title-row">
              <h1>{task.title}</h1>
              {canEdit && (
                <button type="button" className="btn-ghost" onClick={() => setEditing(true)}>
                  עריכה
                </button>
              )}
            </div>

            <div className="meta-strip">
              <span className={`badge ${STATUS_BADGE_CLASS[task.status]}`}>{task.status}</span>
              <span className="meta-sep" />
              <span className={`badge ${PRIORITY_BADGE_CLASS[task.priority]}`}>{task.priority}</span>
              {assigneeName && (
                <>
                  <span className="meta-sep" />
                  <span className="avatar">{initials(assigneeName)}</span>
                  <span className="meta-text">{assigneeName}</span>
                </>
              )}
              {task.due_date && (
                <>
                  <span className="meta-sep" />
                  <span className="meta-text">יעד {formatDate(task.due_date)}</span>
                </>
              )}
              {clientName && (
                <>
                  <span className="meta-sep" />
                  <Link className="meta-text" to={`/clients/${task.client_id}`}>
                    {clientName}
                  </Link>
                </>
              )}
            </div>

            <div className="grid">
              <div>
                <div className="section">
                  <h3>התקדמות</h3>
                  <div className="stepper">
                    {STATUS_ORDER.map((status, i) => (
                      <div
                        key={status}
                        className={
                          'seg' + (i < currentPos ? ' done' : i === currentPos ? ' current' : '')
                        }
                      >
                        <span className="line" />
                        <span className="node">{i < currentPos ? '✓' : ''}</span>
                        <span className="label">{status}</span>
                      </div>
                    ))}
                  </div>
                  {canEdit && (
                    <div className="stepper-actions">
                      <button type="button" className="btn-ghost" disabled={!back || statusBusy} onClick={() => moveStatus(back)}>
                        ← שלב קודם
                      </button>
                      <button type="button" className="btn" disabled={!forward || statusBusy} onClick={() => moveStatus(forward)}>
                        שלב הבא →
                      </button>
                    </div>
                  )}
                  {statusError && <p className="form-error">{statusError}</p>}
                </div>

                <div className="section">
                  <h3>תיאור</h3>
                  <p className="desc">{task.description || 'אין תיאור'}</p>
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
          </>
        )}
      </div>
    </section>
  )
}
