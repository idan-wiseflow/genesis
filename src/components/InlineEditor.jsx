import { useState } from 'react'

// עורך שדה בודד במקום (input/textarea/select/date), בלי wrapper של field/k/v -
// זה באחריות הקורא, כדי שאותו רכיב ישרת גם h1 (כותרת), גם פסקת תיאור,
// וגם שדות בסיידבר. onSave יכול לזרוק, ההודעה מוצגת כמו שהיא (הקורא כבר
// דואג לסניטציה של שגיאות שרת, ראו describeTaskError).
export default function InlineEditor({ type = 'text', value, options, onSave, onCancel }) {
  const [draft, setDraft] = useState(value ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setBusy(true)
    setError('')
    try {
      await onSave(draft)
    } catch (err) {
      setError(err.message ?? 'משהו השתבש')
      setBusy(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') onCancel()
    if (e.key === 'Enter' && type !== 'textarea') handleSave()
  }

  return (
    <div className="inline-editor">
      {type === 'textarea' && (
        <textarea
          rows={4}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          disabled={busy}
        />
      )}
      {type === 'text' && (
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          disabled={busy}
        />
      )}
      {type === 'date' && (
        <input
          type="date"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={busy}
        />
      )}
      {type === 'select' && (
        <select
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={busy}
          autoFocus
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
      {error && <p className="form-error">{error}</p>}
      <div className="inline-editor-actions">
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>
          ביטול
        </button>
        <button type="button" className="btn" onClick={handleSave} disabled={busy}>
          {busy ? 'שומר...' : 'שמירה'}
        </button>
      </div>
    </div>
  )
}
