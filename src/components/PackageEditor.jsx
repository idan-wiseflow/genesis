import { useState } from 'react'
import { FREQUENCIES, FREQUENCY_LABELS } from '../lib/packageMeta'
import Checkbox from './Checkbox'

function emptyRow(workStages) {
  return {
    key: crypto.randomUUID(),
    work_stage_id: workStages[0]?.id ?? '',
    task_name: '',
    description: '',
    quantity: 1,
    frequency: FREQUENCIES[0],
  }
}

// עריכה יוצרת תמיד גרסה חדשה (savePackageVersion → create_package_version RPC),
// לא UPDATE. initial=null זו חבילה חדשה לגמרי, initial עם ערך זו גרסה חדשה
// לחבילה קיימת (package_group_id נשמר, version מתקדם).
export default function PackageEditor({ initial, initialTemplates, departments, workStages, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [departmentId, setDepartmentId] = useState(initial?.department_id ?? '')
  const [isBundle, setIsBundle] = useState(initial?.is_bundle ?? false)
  const [templates, setTemplates] = useState(
    initialTemplates?.length
      ? initialTemplates.map((t) => ({ ...t, key: t.id ?? crypto.randomUUID() }))
      : [emptyRow(workStages)]
  )
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function updateRow(key, field, value) {
    setTemplates((prev) => prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)))
  }

  function addRow() {
    setTemplates((prev) => [...prev, emptyRow(workStages)])
  }

  function removeRow(key) {
    setTemplates((prev) => prev.filter((row) => row.key !== key))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('שם החבילה חובה')
      return
    }
    if (!isBundle && !departmentId) {
      setError('חבילה שאינה בנדל חייבת מחלקה')
      return
    }
    const cleanTemplates = templates.filter((t) => t.task_name.trim())
    setError('')
    setBusy(true)
    try {
      await onSave({
        groupId: initial?.package_group_id ?? null,
        name: name.trim(),
        departmentId: isBundle ? null : departmentId,
        isBundle,
        templates: cleanTemplates.map((t) => ({
          work_stage_id: t.work_stage_id,
          task_name: t.task_name.trim(),
          description: t.description?.trim() || null,
          quantity: Number(t.quantity) || 1,
          frequency: t.frequency,
        })),
      })
    } catch (err) {
      setError(err.message ?? 'משהו השתבש, נסה שוב')
      setBusy(false)
    }
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      {initial && (
        <div className="form-hint">
          שמירה יוצרת גרסה חדשה (מגרסה {initial.version} לגרסה {initial.version + 1}). לקוחות שכבר
          משויכים לגרסה הקודמת לא מושפעים.
        </div>
      )}

      <label>
        שם החבילה
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </label>

      <div className="form-row">
        <Checkbox checked={isBundle} onChange={(e) => setIsBundle(e.target.checked)}>
          בנדל חוצה-מחלקות (כמו "360 לעסקים")
        </Checkbox>
        {!isBundle && (
          <label>
            מחלקה
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">בחר מחלקה</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div>
        <div className="form-hint role-tags-label">משימות בחבילה</div>
        <div className="package-templates">
          {templates.map((row) => (
            <div className="package-template-row" key={row.key}>
              <select
                value={row.work_stage_id}
                onChange={(e) => updateRow(row.key, 'work_stage_id', e.target.value)}
              >
                {workStages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="שם המשימה"
                value={row.task_name}
                onChange={(e) => updateRow(row.key, 'task_name', e.target.value)}
              />
              <input
                type="number"
                min="1"
                className="package-template-qty"
                value={row.quantity}
                onChange={(e) => updateRow(row.key, 'quantity', e.target.value)}
              />
              <select value={row.frequency} onChange={(e) => updateRow(row.key, 'frequency', e.target.value)}>
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {FREQUENCY_LABELS[f]}
                  </option>
                ))}
              </select>
              <button type="button" className="tag-remove" onClick={() => removeRow(row.key)}>
                ✕
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="btn-ghost" onClick={addRow}>
          הוספת משימה
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>
          ביטול
        </button>
        <button type="submit" className="btn" disabled={busy}>
          {busy ? 'שומר...' : initial ? 'שמירת גרסה חדשה' : 'יצירה'}
        </button>
      </div>
    </form>
  )
}
