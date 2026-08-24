import { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'
import { signDescriptionHtml } from '../lib/taskDescriptionImages'

// ההופעה היחידה של dangerouslySetInnerHTML בקוד. Tiptap מגביל מה אפשר
// להזין דרך המסך, אבל RLS על tasks לא בודק תוכן, רק מי כותב - כתיבה ישירה
// ל-API יכולה להכניס HTML זדוני. DOMPurify.sanitize (>=3.3.2, ראו
// package.json) הוא שכבת ההגנה שסוגרת את זה, לא Tiptap. ראו סקירת שמעון, 24.08.2026.
export default function TaskDescriptionHtml({ html, emptyText }) {
  const [signed, setSigned] = useState(null)

  useEffect(() => {
    let active = true
    signDescriptionHtml(html || '').then((result) => active && setSigned(result))
    return () => {
      active = false
    }
  }, [html])

  if (!html) return <p className="desc">{emptyText}</p>
  if (signed === null) return <p className="desc">טוען...</p>

  return <div className="desc rich-editor-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(signed) }} />
}
