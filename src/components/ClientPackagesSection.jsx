import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  listClientPackages,
  listCurrentPackages,
  assignPackageToClient,
  endClientPackage,
  listPackageTemplates,
  listClientPackageOverrides,
  setTaskOverride,
  removeTaskOverride,
} from '../lib/packages'
import { FREQUENCIES, FREQUENCY_LABELS } from '../lib/packageMeta'

// שורת משימה בתוך חבילה משויכת: כמות/תדירות מהתבנית הגלובלית, אלא אם יש
// override פר-לקוח (client_package_task_overrides, 011). "שינויים קטנים
// בלבד" (עידן, 25.08.2026): רק כמות/תדירות, לא רשימת משימות עצמאית.
function TemplateRow({ template, override, canEdit, onSave, onReset }) {
  const [quantity, setQuantity] = useState(override?.quantity ?? template.quantity)
  const [frequency, setFrequency] = useState(override?.frequency ?? template.frequency)
  const isOverridden = Boolean(override)

  async function persist(nextQuantity, nextFrequency) {
    const changed = Number(nextQuantity) !== template.quantity || nextFrequency !== template.frequency
    if (!changed) {
      if (isOverridden) await onReset()
      return
    }
    await onSave(Number(nextQuantity), nextFrequency)
  }

  return (
    <div className="file-row">
      <span className="file-name">{template.task_name}</span>
      {canEdit ? (
        <>
          <input
            type="number"
            min="1"
            className="package-template-qty"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onBlur={() => persist(quantity, frequency)}
          />
          <select
            value={frequency}
            onChange={(e) => {
              setFrequency(e.target.value)
              persist(quantity, e.target.value)
            }}
          >
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {FREQUENCY_LABELS[f]}
              </option>
            ))}
          </select>
        </>
      ) : (
        <span className="meta-text">
          {quantity} · {FREQUENCY_LABELS[frequency]}
        </span>
      )}
      {isOverridden && <span className="badge badge-outline">מותאם</span>}
    </div>
  )
}

function ClientPackageCard({ clientPackage, canEdit, onEnded }) {
  const { user } = useAuth()
  const [templates, setTemplates] = useState([])
  const [overrides, setOverrides] = useState([])

  async function refreshOverrides() {
    const rows = await listClientPackageOverrides(clientPackage.id)
    setOverrides(rows)
  }

  useEffect(() => {
    listPackageTemplates(clientPackage.package_definition_id).then(setTemplates)
    refreshOverrides()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientPackage.id, clientPackage.package_definition_id])

  const overridesByTemplate = Object.fromEntries(overrides.map((o) => [o.package_task_template_id, o]))

  async function handleEnd() {
    if (!window.confirm(`להסיר את החבילה "${clientPackage.package_definitions.name}" מהלקוח?`)) return
    await endClientPackage(clientPackage.id)
    onEnded()
  }

  return (
    <div className="section">
      <div className="section-head">
        <h3>{clientPackage.package_definitions.name}</h3>
        {canEdit && (
          <button type="button" className="section-edit-btn" onClick={handleEnd}>
            הסרה
          </button>
        )}
      </div>
      <div className="file-list">
        {templates.map((t) => (
          <TemplateRow
            key={t.id}
            template={t}
            override={overridesByTemplate[t.id]}
            canEdit={canEdit}
            onSave={async (quantity, frequency) => {
              await setTaskOverride(clientPackage.id, t.id, { quantity, frequency }, user.id)
              await refreshOverrides()
            }}
            onReset={async () => {
              const existing = overridesByTemplate[t.id]
              if (existing) await removeTaskOverride(existing.id)
              await refreshOverrides()
            }}
          />
        ))}
        {templates.length === 0 && <div className="empty-state">אין משימות בגרסת החבילה הזו</div>}
      </div>
    </div>
  )
}

export default function ClientPackagesSection({ clientId, canEdit }) {
  const { user } = useAuth()
  const [clientPackages, setClientPackages] = useState([])
  const [availablePackages, setAvailablePackages] = useState([])
  const [addValue, setAddValue] = useState('')
  const [error, setError] = useState('')

  async function refresh() {
    const [assigned, all] = await Promise.all([listClientPackages(clientId), listCurrentPackages()])
    setClientPackages(assigned)
    setAvailablePackages(all)
  }

  useEffect(() => {
    refresh().catch((err) => setError(err.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  async function handleAdd() {
    if (!addValue) return
    setError('')
    try {
      const pkg = availablePackages.find((p) => p.id === addValue)
      await assignPackageToClient(clientId, addValue, user.id, pkg?.department_id)
      setAddValue('')
      await refresh()
    } catch (err) {
      setError(err.message ?? 'משהו השתבש')
    }
  }

  const assignedIds = new Set(clientPackages.map((cp) => cp.package_definition_id))

  return (
    <div>
      {error && <p className="form-error">{error}</p>}

      {clientPackages.map((cp) => (
        <ClientPackageCard key={cp.id} clientPackage={cp} canEdit={canEdit} onEnded={refresh} />
      ))}

      {clientPackages.length === 0 && <div className="empty-state">אין ללקוח חבילות משויכות</div>}

      {canEdit && (
        <div className="tag-add-row">
          <select value={addValue} onChange={(e) => setAddValue(e.target.value)}>
            <option value="">בחר חבילה להוספה</option>
            {availablePackages
              .filter((p) => !assignedIds.has(p.id))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
          <button type="button" className="btn-ghost" onClick={handleAdd}>
            הוספה
          </button>
        </div>
      )}
    </div>
  )
}
