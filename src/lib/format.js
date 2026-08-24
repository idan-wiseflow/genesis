export function formatDate(dateStr) {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-')
  return `${d}.${m}.${y}`
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return null
  return `₪${Number(amount).toLocaleString('he-IL')}`
}

export function initials(fullName) {
  if (!fullName) return '?'
  return fullName.trim().slice(0, 2)
}
