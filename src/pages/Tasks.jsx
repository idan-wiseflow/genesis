import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { createTask, listTasks } from '../lib/queries'
import { canCreateTasks, isManagement } from '../lib/permissions'
import { groupByDateBucket } from '../lib/dateBuckets'
import { useClientsById } from '../hooks/useClientsById'
import { useProfilesById } from '../hooks/useProfilesById'
import TaskRow from '../components/TaskRow'
import TaskForm from '../components/TaskForm'
import Modal from '../components/Modal'

const SHOW_ALL_KEY = 'genesis:tasks:show-all'
const ASSIGNEE_FILTER_KEY = 'genesis:tasks:assignee-filter'

export default function Tasks() {
  const { profile } = useAuth()
  const { clients, clientsById } = useClientsById()
  const { profiles, profilesById } = useProfilesById()
  const [tasks, setTasks] = useState(null)
  const [error, setError] = useState('')
  const [showAll, setShowAll] = useState(() => localStorage.getItem(SHOW_ALL_KEY) === '1')
  // 'mine' | 'all' | <profile id>. ברירת מחדל "שלי" (עידן, 25.08.2026: "אני
  // רוצה לראות את שלי בדיפולט ואז סינון לפי נציגים"), לא אכיפה, רק תצוגה -
  // RLS כבר קובע מה כל דרג רואה בכלל, זה רק מסנן בתוך מה שכבר חזר.
  const [assigneeFilter, setAssigneeFilter] = useState(() => localStorage.getItem(ASSIGNEE_FILTER_KEY) ?? 'mine')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let active = true
    listTasks()
      .then((rows) => active && setTasks(rows))
      .catch((err) => active && setError(err.message))
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(SHOW_ALL_KEY, showAll ? '1' : '0')
  }, [showAll])

  useEffect(() => {
    localStorage.setItem(ASSIGNEE_FILTER_KEY, assigneeFilter)
  }, [assigneeFilter])

  async function handleCreate(payload) {
    const created = await createTask(payload)
    setTasks((prev) => [...(prev ?? []), created])
    setCreating(false)
  }

  // ארכיון ("הצג הכל", חושף status='פורסם') חשוף רק להנהלה (020, project-brief.md:
  // "ארכיון מלא של משימות שבוצעו... חשוף רק להנהלה, לא לעובד רגיל"). אכיפה
  // אמיתית ב-RLS (policy restrictive), זה רק מסתיר את הכפתור למי שלא יעזור לו.
  const canSeeArchive = isManagement(profile)

  const assigneeFiltered = tasks?.filter((t) => {
    if (assigneeFilter === 'all') return true
    if (assigneeFilter === 'mine') return t.assigned_to === profile?.id
    return t.assigned_to === assigneeFilter
  })
  const visibleTasks = assigneeFiltered?.filter((t) => showAll || t.status !== 'פורסם')
  const grouped = visibleTasks ? groupByDateBucket(visibleTasks) : []

  return (
    <section className="screen">
      <div className="page-head">
        <div>
          <h1>משימות</h1>
          <div className="sub">
            {showAll ? 'כל המשימות' : 'משימות פעילות, פורסמו מוסתרות'}
          </div>
        </div>
        {canCreateTasks(profile) && (
          <button type="button" className="cta" onClick={() => setCreating(true)}>
            משימה חדשה
          </button>
        )}
      </div>

      <div className="list-toolbar">
        <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}>
          <option value="mine">המשימות שלי</option>
          <option value="all">כל הנציגים</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </select>
        {canSeeArchive && (
          <button
            type="button"
            className={'chip-toggle' + (showAll ? ' active' : '')}
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? 'הצג רק פעילות' : 'הצג הכל'}
          </button>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}

      {tasks === null && !error && <div className="empty-state">טוען...</div>}

      {visibleTasks?.length === 0 && <div className="empty-state">אין משימות להצגה</div>}

      {grouped.map(({ bucket, tasks: bucketTasks }) => (
        <div className="task-group" key={bucket}>
          <h3 className="task-group-title">{bucket}</h3>
          <div className="task-list">
            {bucketTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                clientName={task.client_id ? clientsById[task.client_id]?.name : null}
                assignee={task.assigned_to ? profilesById[task.assigned_to] : null}
              />
            ))}
          </div>
        </div>
      ))}

      {creating && (
        <Modal title="משימה חדשה" onClose={() => setCreating(false)}>
          <TaskForm
            initialValues={{}}
            clients={clients}
            profiles={profiles}
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
            submitLabel="יצירה"
          />
        </Modal>
      )}
    </section>
  )
}
