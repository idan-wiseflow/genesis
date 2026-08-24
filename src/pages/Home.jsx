import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listMyOpenTasks } from '../lib/queries'
import { useClientsById } from '../hooks/useClientsById'
import TaskRow from '../components/TaskRow'

export default function Home() {
  const { profile, user } = useAuth()
  const { clientsById } = useClientsById()
  const [tasks, setTasks] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    let active = true
    listMyOpenTasks(user.id)
      .then((rows) => active && setTasks(rows))
      .catch((err) => active && setError(err.message))
    return () => {
      active = false
    }
  }, [user])

  return (
    <section className="screen">
      <div className="page-head">
        <div>
          <h1>בוקר טוב{profile?.full_name ? `, ${profile.full_name}` : ''}</h1>
          <div className="sub">המשימות הפתוחות שמשויכות אליך</div>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      {tasks === null && !error && <div className="empty-state">טוען...</div>}

      {tasks?.length === 0 && <div className="empty-state">אין לך משימות פתוחות כרגע</div>}

      {tasks && tasks.length > 0 && (
        <div className="task-list">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              clientName={task.client_id ? clientsById[task.client_id]?.name : null}
            />
          ))}
        </div>
      )}
    </section>
  )
}
