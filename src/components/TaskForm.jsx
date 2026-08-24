import { useState } from 'react'

const EMPTY = {
  title: '',
  description: '',
  client_id: '',
  assigned_to: '',
  due_date: '',
  priority: 'רגיל',
}

export default function TaskForm({ initialValues, clients, profiles, onSubmit, onCancel, submitLabel }) {
  // ערכי null (בלי לקוח, בלי שיוך) הופכים ל-'' - קלט מבוקר לא יכול לקבל value={null}
  // בלי אזהרת controlled/uncontrolled בקונסול.
  const [values, setValues] = useState(() => {
    const merged = { ...EMPTY, ...initialValues }
    for (const key of Object.keys(EMPTY)) {
      if (merged[key] === null || merged[key] === undefined) merged[key] = EMPTY[key]
    }
    return merged
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function set(field, value) {
    setValues((v) => ({ ...v, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!values.title.trim()) {
      setError('שם המשימה חובה')
      return
    }
    setError('')
    setBusy(true)
    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim() || null,
        client_id: values.client_id || null,
        assigned_to: values.assigned_to || null,
        due_date: values.due_date || null,
        priority: values.priority,
      })
    } catch (err) {
      setError(err.message ?? 'משהו השתבש, נסה שוב')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <label>
        שם המשימה
        <input value={values.title} onChange={(e) => set('title', e.target.value)} autoFocus />
      </label>

      <label>
        תיאור
        <textarea rows={3} value={values.description} onChange={(e) => set('description', e.target.value)} />
      </label>

      <div className="form-row">
        <label>
          לקוח
          <select value={values.client_id} onChange={(e) => set('client_id', e.target.value)}>
            <option value="">ללא לקוח</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          משויך ל
          <select value={values.assigned_to} onChange={(e) => set('assigned_to', e.target.value)}>
            <option value="">לא משויך</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!values.assigned_to && (
        <div className="form-hint">משימה לא משויכת גלויה רק להנהלה ומנהל פרויקט, עד שתשייכו אותה</div>
      )}

      <div className="form-row">
        <label>
          תאריך יעד
          <input type="date" value={values.due_date} onChange={(e) => set('due_date', e.target.value)} />
        </label>

        <label>
          עדיפות
          <select value={values.priority} onChange={(e) => set('priority', e.target.value)}>
            <option value="רגיל">רגיל</option>
            <option value="דחוף">דחוף</option>
          </select>
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>
          ביטול
        </button>
        <button type="submit" className="btn" disabled={busy}>
          {busy ? 'שומר...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
