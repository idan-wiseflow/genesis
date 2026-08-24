import { lazy, Suspense, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  addTaskComment,
  addTaskFile,
  attachTag,
  createTag,
  deleteTaskFile,
  detachTag,
  getTask,
  listTaskComments,
  listTaskFiles,
  listTaskStatusHistory,
  listTaskTagIds,
  listTags,
  updateTask,
} from '../lib/queries'
import { deleteTaskFileObject, getTaskFileSignedUrl, uploadTaskFile } from '../lib/taskFiles'
import { canCreateTags, canEditTask } from '../lib/permissions'
import {
  describeTaskError,
  nextStatus,
  prevStatus,
  PRIORITY_BADGE_CLASS,
  STATUS_BADGE_CLASS,
  STATUS_ORDER,
} from '../lib/taskStatus'
import { formatDate } from '../lib/format'
import { useClientsById } from '../hooks/useClientsById'
import { useProfilesById } from '../hooks/useProfilesById'
import InlineEditor from '../components/InlineEditor'
import Avatar from '../components/Avatar'
import TaskDescriptionHtml from '../components/TaskDescriptionHtml'

// טעון עצל: Tiptap מוסיף כ-400KB ל-bundle. רוב הביקורים במסך הזה הם קריאה
// בלבד (TaskDescriptionHtml, קל, לא עצל), רק לחיצה בפועל על "עריכה" בתיאור
// טוענת את זה. בלי זה, כל טעינה ראשונה של האפליקציה סוחבת עורך WYSIWYG
// שרוב המבקרים לעולם לא פותחים.
const RichTextEditor = lazy(() => import('../components/RichTextEditor'))

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

// שורת קובץ מצורף: signed URL נחתם בזמן תצוגה (bucket פרטי), עם download
// כפוי (lib/taskFiles.js) כדי שקובץ מסוכן שהועלה בטעות לא ייפתח inline.
function FileRow({ file, canDelete, onDeleted }) {
  const [url, setUrl] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    getTaskFileSignedUrl(file.file_url)
      .then((signed) => active && setUrl(signed))
      .catch(() => active && setUrl(null))
    return () => {
      active = false
    }
  }, [file.file_url])

  async function handleDelete() {
    setBusy(true)
    try {
      await deleteTaskFileObject(file.file_url)
      await deleteTaskFile(file.id)
      onDeleted(file.id)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="file-row">
      <span className="file-ic">📎</span>
      {url ? (
        <a className="file-name" href={url}>
          {file.file_name}
        </a>
      ) : (
        <span className="file-name">{file.file_name}</span>
      )}
      {canDelete && (
        <button type="button" className="tag-remove" onClick={handleDelete} disabled={busy}>
          ✕
        </button>
      )}
    </div>
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
  const [history, setHistory] = useState([])
  const [files, setFiles] = useState([])
  const [fileError, setFileError] = useState('')
  const [uploadBusy, setUploadBusy] = useState(false)

  useEffect(() => {
    let active = true
    getTask(taskId)
      .then((row) => active && setTask(row))
      .catch(() => active && setNotFound(true))
    listTaskComments(taskId).then((rows) => active && setComments(rows))
    listTaskTagIds(taskId).then((ids) => active && setTagIds(ids))
    listTags().then((rows) => active && setAllTags(rows))
    listTaskStatusHistory(taskId).then((rows) => active && setHistory(rows))
    listTaskFiles(taskId).then((rows) => active && setFiles(rows))
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

  async function uploadOneFile(file) {
    setUploadBusy(true)
    setFileError('')
    try {
      const path = await uploadTaskFile(taskId, file)
      const id = await addTaskFile(taskId, user.id, path, file.name)
      setFiles((prev) => [
        ...prev,
        { id, task_id: taskId, file_url: path, file_name: file.name, uploaded_by: user.id },
      ])
    } catch (err) {
      setFileError(err.message ?? 'העלאה נכשלה')
    } finally {
      setUploadBusy(false)
    }
  }

  async function handleFileInputChange(e) {
    const selected = Array.from(e.target.files ?? [])
    e.target.value = ''
    for (const file of selected) {
      await uploadOneFile(file)
    }
  }

  function handleFileDeleted(fileId) {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
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
                    ← שלב הבא
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    disabled={!back || statusBusy}
                    onClick={() => moveStatus(back)}
                  >
                    שלב קודם →
                  </button>
                </div>
              )}
              {statusError && <p className="form-error">{statusError}</p>}
            </div>

            <div className="section">
              <div className="section-head">
                <h3>תיאור</h3>
                {canEdit && editingField !== 'description' && (
                  <button type="button" className="section-edit-btn" onClick={() => setEditingField('description')}>
                    עריכה
                  </button>
                )}
              </div>
              {editingField === 'description' ? (
                <Suspense fallback={<div className="empty-state">טוען עורך...</div>}>
                  <RichTextEditor
                    taskId={taskId}
                    value={task.description ?? ''}
                    onSave={(v) => saveField('description', v)}
                    onCancel={() => setEditingField(null)}
                  />
                </Suspense>
              ) : (
                <TaskDescriptionHtml
                  html={task.description}
                  emptyText={canEdit ? 'אין תיאור, לחצו על עריכה להוספה' : 'אין תיאור'}
                />
              )}
            </div>

            <div className="section">
              <h3>קבצים מצורפים</h3>
              <div className="file-list">
                {files.map((f) => (
                  <FileRow key={f.id} file={f} canDelete={canEdit} onDeleted={handleFileDeleted} />
                ))}
                {files.length === 0 && <div className="empty-state">אין קבצים מצורפים</div>}
              </div>
              {canEdit && (
                <label className="btn-ghost profile-avatar-upload file-upload-trigger">
                  {uploadBusy ? 'מעלה...' : 'העלאת קובץ'}
                  <input type="file" multiple onChange={handleFileInputChange} disabled={uploadBusy} hidden />
                </label>
              )}
              {fileError && <p className="form-error">{fileError}</p>}
            </div>

            <div className="section">
              <h3>היסטוריה</h3>
              <div className="history-list">
                {history.map((h) => (
                  <div className="history-row" key={h.id}>
                    <span className="meta-text">
                      {h.old_status ? `${h.old_status} ← ${h.new_status}` : `נוצרה ב"${h.new_status}"`}
                    </span>
                    <span className="meta-text">
                      {profilesById[h.changed_by]?.full_name ?? '...'} · {formatDate(h.changed_at?.slice(0, 10))}
                    </span>
                  </div>
                ))}
                {history.length === 0 && <div className="empty-state">אין עדיין היסטוריה</div>}
              </div>
            </div>

            <div className="section">
              <h3>התכתבות</h3>
              <div>
                {comments.map((c) => (
                  <div className="comment" key={c.id}>
                    <Avatar name={profilesById[c.user_id]?.full_name} avatarPath={profilesById[c.user_id]?.avatar_url} />
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
