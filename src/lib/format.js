// עובד גם על עמודת date נטו (due_date, "YYYY-MM-DD") וגם על timestamptz מלא
// (assigned_at וכו', "YYYY-MM-DDTHH:MM:SS+00:00"). הגרסה הקודמת פיצלה לפי "-"
// בלבד, ועל timestamptz זה הפיק "25T07:16:34.859463+00:00.08.2026" - הבאג
// שעידן ראה בפועל תחת "פעיל מאז" בכרטיס חבילה (25.08.2026).
export function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return null
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}.${d.getFullYear()}`
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return null
  return `₪${Number(amount).toLocaleString('he-IL')}`
}

export function initials(fullName) {
  if (!fullName) return '?'
  return fullName.trim().slice(0, 2)
}
