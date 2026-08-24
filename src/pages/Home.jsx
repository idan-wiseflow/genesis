import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listMyOpenTasks } from '../lib/queries'
import { dateBucket } from '../lib/dateBuckets'
import { useClientsById } from '../hooks/useClientsById'
import TaskRow from '../components/TaskRow'

const HOME_BUCKETS = new Set(['באיחור', 'היום'])

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

  // בית נשאר קליל בכוונה (החלטת בריפינג, לא דשבורד): רק היום ובאיחור,
  // לא כל הרשימה. זה מה שמבדיל אותו ממסך משימות, שם רואים הכל.
  const urgentTasks = tasks?.filter((t) => HOME_BUCKETS.has(dateBucket(t.due_date)))
  const restCount = tasks ? tasks.length - (urgentTasks?.length ?? 0) : 0

  return (
    <section className="screen">
      <div className="page-head">
        <div>
          <h1>בוקר טוב{profile?.full_name ? `, ${profile.full_name}` : ''}</h1>
          <div className="sub">היום ומשימות באיחור, המשויכות אליך</div>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      {tasks === null && !error && <div className="empty-state">טוען...</div>}

      {urgentTasks?.length === 0 && <div className="empty-state">אין לך כלום דחוף היום</div>}

      {urgentTasks && urgentTasks.length > 0 && (
        <div className="task-list">
          {urgentTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              clientName={task.client_id ? clientsById[task.client_id]?.name : null}
            />
          ))}
        </div>
      )}

      {tasks && (
        <Link className="home-more-link" to="/tasks">
          {restCount > 0 ? `עוד ${restCount} משימות פתוחות, לכל המשימות ←` : 'לכל המשימות ←'}
        </Link>
      )}
    </section>
  )
}
