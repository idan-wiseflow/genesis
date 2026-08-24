import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { profile } = useAuth()

  return (
    <section className="screen">
      <div className="page-head">
        <div>
          <h1>בוקר טוב{profile?.full_name ? `, ${profile.full_name}` : ''}</h1>
          <div className="sub">מסך הבית עדיין לא מחובר לנתונים אמיתיים, זה הסבב הבא</div>
        </div>
      </div>
    </section>
  )
}
