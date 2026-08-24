import { useParams, Link } from 'react-router-dom'

export default function ClientDetail() {
  const { clientId } = useParams()

  return (
    <section className="screen">
      <div className="detail-page">
        <Link className="back-link" to="/clients">
          ← חזרה ללקוחות
        </Link>
        <div className="page-head">
          <div>
            <h1>לקוח #{clientId}</h1>
            <div className="sub">עדיין לא מחובר לנתונים אמיתיים, זה הסבב הבא</div>
          </div>
        </div>
      </div>
    </section>
  )
}
