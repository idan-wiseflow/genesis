import { useState } from 'react'

const EMPTY = {
  name: '',
  project_manager_id: '',
  campaigner_id: '',
  social_id: '',
  seo_id: '',
  studio_id: '',
  retainer_amount: '',
  media_amount: '',
}

const ROLE_FIELDS = [
  { field: 'project_manager_id', label: 'מנהל פרויקט' },
  { field: 'campaigner_id', label: 'קמפיינר' },
  { field: 'social_id', label: 'Social' },
  { field: 'seo_id', label: 'SEO' },
  { field: 'studio_id', label: 'סטודיו' },
]

// משמש גם ליצירה (בתוך Modal) וגם לעריכה inline ב-ClientDetail.
// canEditProjectManager: רק הנהלה, אוכף בטריגר clients_role_guard (002) - כאן רק disabled מוקדם.
export default function ClientForm({
  initialValues,
  profiles,
  canEditProjectManager,
  onSubmit,
  onCancel,
  submitLabel,
}) {
  // ערכי null (יחסים לא משויכים, שדות כספיים ריקים) הופכים ל-'' - קלט מבוקר לא יכול
  // לקבל value={null} בלי אזהרת controlled/uncontrolled בקונסול.
  const [values, setValues] = useState(() => {
    const merged = { ...EMPTY, ...initialValues }
    for (const key of Object.keys(EMPTY)) {
      if (merged[key] === null || merged[key] === undefined) merged[key] = ''
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
    if (!values.name.trim()) {
      setError('שם הלקוח חובה')
      return
    }
    setError('')
    setBusy(true)
    try {
      await onSubmit({
        name: values.name.trim(),
        project_manager_id: values.project_manager_id || null,
        campaigner_id: values.campaigner_id || null,
        social_id: values.social_id || null,
        seo_id: values.seo_id || null,
        studio_id: values.studio_id || null,
        retainer_amount: values.retainer_amount === '' ? null : Number(values.retainer_amount),
        media_amount: values.media_amount === '' ? null : Number(values.media_amount),
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
        שם הלקוח
        <input value={values.name} onChange={(e) => set('name', e.target.value)} autoFocus />
      </label>

      <div className="form-row">
        {ROLE_FIELDS.map(({ field, label }) => {
          const disabled = field === 'project_manager_id' && !canEditProjectManager
          return (
            <label key={field}>
              {label}
              <select value={values[field]} onChange={(e) => set(field, e.target.value)} disabled={disabled}>
                <option value="">לא משויך</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
              {disabled && <span className="form-hint">שינוי מנהל פרויקט שמור להנהלה</span>}
            </label>
          )
        })}
      </div>

      <div className="form-row">
        <label>
          סכום ריטיינר
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.retainer_amount}
            onChange={(e) => set('retainer_amount', e.target.value)}
          />
        </label>
        <label>
          סכום מדיה
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.media_amount}
            onChange={(e) => set('media_amount', e.target.value)}
          />
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
