import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { createTask, listTasks } from '../lib/queries'
import { canCreateTasks } from '../lib/permissions'
import { groupByDateBucket } from '../lib/dateBuckets'
import { useClientsById } from '../hooks/useClientsById'
import { useProfilesById } from '../hooks/useProfilesById'
import TaskRow from '../components/TaskRow'
import TaskForm from '../components/TaskForm'
import Modal from '../components/Modal'

const SHOW_ALL_KEY = 'genesis:tasks:show-all'

export default function Tasks() {
  const { profile } = useAuth()
  const { clients, clientsById } = useClientsById()
  const { profiles, profilesById } = useProfilesById()
  const [tasks, setTasks] = useState(null)
  const [error, setError] = useState('')
  const [showAll, setShowAll] = useState(() => localStorage.getItem(SHOW_ALL_KEY) === '1')
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

  async function handleCreate(payload) {
    const created = await createTask(payload)
    setTasks((prev) => [...(prev ?? []), created])
    setCreating(false)
  }

  const visibleTasks = tasks?.filter((t) => showAll || t.status !== 'פורסם')
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
        <button
          type="button"
          className={'chip-toggle' + (showAll ? ' active' : '')}
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? 'הצג רק פעילות' : 'הצג הכל'}
        </button>
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
                assigneeName={task.assigned_to ? profilesById[task.assigned_to]?.full_name : null}
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
