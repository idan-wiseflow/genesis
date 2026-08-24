import { Link } from 'react-router-dom'
import { PRIORITY_BADGE_CLASS, STATUS_BADGE_CLASS } from '../lib/taskStatus'
import { formatDate, initials } from '../lib/format'

// שורת משימה משותפת ל-Home, Tasks ו-ClientDetail (רשימת המשימות של הלקוח).
// showClient=false ב-ClientDetail, כי שם כבר ברור באיזה לקוח מדובר.
export default function TaskRow({ task, clientName, assigneeName, showClient = true }) {
  const due = formatDate(task.due_date)

  return (
    <Link to={`/tasks/${task.id}`} className="task-row">
      <div className="task-row-main">
        <span className="task-row-title">{task.title}</span>
        {showClient && <span className="task-row-client">{clientName ?? 'ללא לקוח'}</span>}
      </div>
      <div className="task-row-meta">
        <span className={`badge ${PRIORITY_BADGE_CLASS[task.priority]}`}>{task.priority}</span>
        <span className={`badge ${STATUS_BADGE_CLASS[task.status]}`}>{task.status}</span>
        {assigneeName && (
          <span className="avatar" title={assigneeName}>
            {initials(assigneeName)}
          </span>
        )}
        {due && <span className="task-row-due">{due}</span>}
      </div>
    </Link>
  )
}
