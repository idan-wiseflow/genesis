import { getSignedUrl } from './storage'
import { uploadTaskFile } from './taskFiles'

// אותה טכניקה בדיוק כמו wiki-images ב-wiseflow-crm (utils/wikiImages.js):
// signed URL פג תוקף אחרי שעה, אז ה-HTML הנשמר ב-DB מחזיק marker קבוע
// (task://<path>) במקום ה-URL עצמו. toStoredHtml ממיר URL חתום בחזרה
// למarker לפני שמירה, signDescriptionHtml עושה את ההפך בזמן תצוגה/עריכה.
const STORAGE_URL_RE = /https?:\/\/[^"'\s]+\/storage\/v1\/object\/(?:public|sign)\/task-files\/([^"'?\s]+)(?:\?[^"'\s]*)?/g
// path charset הוא whitelist: כל דבר אחר נשאר marker מת, לעולם לא נחתם ולא מוזרק
const MARKER_RE = /task:\/\/([A-Za-z0-9._/-]+)/g

export function toStoredHtml(html) {
  if (!html) return html
  return html.replace(STORAGE_URL_RE, (_, path) => `task://${path}`)
}

export async function signDescriptionHtml(html) {
  if (!html || !html.includes('task://')) return html
  const paths = [...new Set([...html.matchAll(MARKER_RE)].map((m) => m[1]))]
  if (!paths.length) return html
  const entries = await Promise.all(
    paths.map(async (path) => {
      try {
        return [path, await getSignedUrl('task-files', path)]
      } catch {
        return [path, null]
      }
    })
  )
  const urlByPath = new Map(entries.filter(([, url]) => url))
  return html.replace(MARKER_RE, (marker, path) => urlByPath.get(path) || marker)
}

// תמונה שהודבקה/נגררה לתוך התיאור עולה לאותו bucket כמו קבצים מצורפים
// (task-files, 006), אבל לא נכנסת כשורה ב-task_files: שני הפיצ'רים נשארים
// נפרדים לגמרי (הכרעת עידן, 24.08.2026). מחזיר signed URL להצגה מיידית
// בעורך, ה-marker נשמר רק כש-toStoredHtml רץ על ה-HTML לפני שמירה.
export async function uploadDescriptionImage(taskId, file) {
  const path = await uploadTaskFile(taskId, file)
  return getSignedUrl('task-files', path)
}
