import { useEffect, useState } from 'react'
import { getAvatarSignedUrl } from '../lib/avatar'
import { initials } from '../lib/format'

// תמונת פרופיל אם יש, אחרת ראשי תיבות. avatarPath הוא נתיב אחסון (008/009),
// לא URL, אז צריך signed URL בכל הצגה. נופל בחזרה לראשי תיבות גם אם החתימה
// נכשלת (bucket עדיין ריק אצל רוב המשתמשים, זה תרחיש נורמלי, לא שגיאה להציג).
export default function Avatar({ name, avatarPath, className = 'avatar', title }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (!avatarPath) {
      setUrl(null)
      return
    }
    let active = true
    getAvatarSignedUrl(avatarPath)
      .then((signed) => active && setUrl(signed))
      .catch(() => active && setUrl(null))
    return () => {
      active = false
    }
  }, [avatarPath])

  if (url) {
    return <img className={className} src={url} alt={name ?? ''} title={title ?? name} />
  }

  return (
    <span className={className} title={title ?? name}>
      {initials(name)}
    </span>
  )
}
