// חלוקת משימות לפי תאריך יעד: היום / מחר / המשך השבוע / עתידי, ומשימות באיחור
// מוצגות ראשונות. "המשך השבוע" מוגדר עד שבת (שבוע עברי, ראשון-שבת), לא 7 ימים קבועים.
export const BUCKET_ORDER = ['באיחור', 'היום', 'מחר', 'המשך השבוע', 'עתידי', 'ללא תאריך']

export function dateBucket(dueDateStr) {
  if (!dueDateStr) return 'ללא תאריך'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDateStr + 'T00:00:00')
  const diffDays = Math.round((due - today) / 86400000)

  if (diffDays < 0) return 'באיחור'
  if (diffDays === 0) return 'היום'
  if (diffDays === 1) return 'מחר'

  const daysUntilSaturday = 6 - today.getDay()
  if (diffDays <= daysUntilSaturday) return 'המשך השבוע'
  return 'עתידי'
}

export function groupByDateBucket(tasks) {
  const groups = Object.fromEntries(BUCKET_ORDER.map((b) => [b, []]))
  for (const task of tasks) {
    groups[dateBucket(task.due_date)].push(task)
  }
  return BUCKET_ORDER.map((bucket) => ({ bucket, tasks: groups[bucket] })).filter((g) => g.tasks.length > 0)
}
