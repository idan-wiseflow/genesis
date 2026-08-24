// סדר שלבי הסטטוס. מראה בדיוק את status_order בטריגר enforce_task_status_order
// (B-brain/04-clients/genesis/_process/migrations/003_status_and_recurrence_triggers.sql).
// זה עותק תצוגה, לא אכיפה: הטריגר בשרת הוא הסמכות, אם הוא ידחה מעבר, ה-UI מציג שגיאה.
export const STATUS_ORDER = [
  'לביצוע',
  'בטיפול',
  'בהמתנה ללקוח',
  'בתיקונים',
  'מאושר על ידי הלקוח',
  'פורסם',
]

export const STATUS_BADGE_CLASS = {
  'לביצוע': 'badge-outline',
  'בטיפול': 'badge-info',
  'בהמתנה ללקוח': 'badge-wait',
  'בתיקונים': 'badge-urgent',
  'מאושר על ידי הלקוח': 'badge-success',
  'פורסם': 'badge-success',
}

export const PRIORITY_BADGE_CLASS = {
  'דחוף': 'badge-urgent',
  'רגיל': 'badge-outline',
}

export function statusPosition(status) {
  return STATUS_ORDER.indexOf(status)
}

export function nextStatus(status) {
  const i = statusPosition(status)
  return i >= 0 && i < STATUS_ORDER.length - 1 ? STATUS_ORDER[i + 1] : null
}

export function prevStatus(status) {
  const i = statusPosition(status)
  return i > 0 ? STATUS_ORDER[i - 1] : null
}

// ממפה שגיאת postgres להודעה ידידותית. לעולם לא מציגים error.message גולמי -
// עלול לחשוף שם טבלה/פונקציה למשתמש בדרג פרילנסר (ראו סקירת שמעון על התוכנית, 24.08.2026).
export function describeTaskError(error) {
  if (!error) return null
  if (error.message?.includes('מעבר סטטוס לא חוקי')) return error.message
  if (error.message?.includes('רק הנהלה יכולה לשנות מנהל פרויקט')) return error.message
  if (error.code === '42501' || error.message?.includes('row-level security')) {
    return 'אין לך הרשאה לבצע את הפעולה הזו'
  }
  return 'משהו השתבש, נסה שוב'
}
