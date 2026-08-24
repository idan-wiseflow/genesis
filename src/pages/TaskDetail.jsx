import { useParams, Link } from 'react-router-dom'

export default function TaskDetail() {
  const { taskId } = useParams()

  return (
    <section className="screen">
      <div className="detail-page">
        <Link className="back-link" to="/tasks">
          ← חזרה למשימות
        </Link>
        <div className="page-head">
          <div>
            <h1>משימה #{taskId}</h1>
            <div className="sub">עדיין לא מחובר לנתונים אמיתיים, זה הסבב הבא</div>
          </div>
        </div>
      </div>
    </section>
  )
}
