import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  listClientPackages,
  listCurrentPackages,
  listDepartments,
  assignPackageToClient,
  endClientPackage,
  listPackageTemplates,
  listClientPackageOverrides,
  setTaskOverride,
  removeTaskOverride,
} from '../lib/packages'
import { FREQUENCIES, FREQUENCY_LABELS } from '../lib/packageMeta'
import { formatDate } from '../lib/format'

// שורת משימה בתוך חבילה משויכת: כמות/תדירות מהתבנית הגלובלית, אלא אם יש
// override פר-לקוח (client_package_task_overrides, 011). "שינויים קטנים
// בלבד" (עידן, 25.08.2026): רק כמות/תדירות, לא רשימת משימות עצמאית.
// סטפר +/- במקום קלט מספר גולמי (עידן, 25.08.2026: "אני לא רואה שיש לי שם
// דרך לשנות את המספר בצורה נוחה").
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

  function adjust(delta) {
    const next = Math.max(1, Number(quantity) + delta)
    setQuantity(next)
    persist(next, frequency)
  }

  function changeFrequency(nextFrequency) {
    setFrequency(nextFrequency)
    persist(quantity, nextFrequency)
  }

  async function handleReset() {
    setQuantity(template.quantity)
    setFrequency(template.frequency)
    await onReset()
  }

  return (
    <div className={'ptask-row' + (isOverridden ? ' overridden' : '')}>
      <span className="ptask-name">{template.task_name}</span>
      {canEdit ? (
        <>
          <div className="qty-stepper">
            <button type="button" className="qty-btn" onClick={() => adjust(-1)} disabled={quantity <= 1}>
              −
            </button>
            <span className="qty-value">{quantity}</span>
            <button type="button" className="qty-btn" onClick={() => adjust(1)}>
              +
            </button>
          </div>
          <select className="freq-select" value={frequency} onChange={(e) => changeFrequency(e.target.value)}>
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
      {isOverridden && <span className="badge badge-outline override-badge">מותאם</span>}
      {canEdit && isOverridden && (
        <button type="button" className="reset-btn" onClick={handleReset} title="איפוס לברירת המחדל">
          ↺
        </button>
      )}
    </div>
  )
}

function ClientPackageCard({ clientPackage, department, canEdit, onEnded }) {
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
    <div className="package-card">
      <div className="package-card-head">
        <div className="package-card-title">
          <span className="package-ic">{(department?.name ?? clientPackage.package_definitions.name)[0]}</span>
          <div>
            <h4>{clientPackage.package_definitions.name}</h4>
            <div className="dept">
              {department?.name ?? 'ללא מחלקה'} · פעיל מאז {formatDate(clientPackage.assigned_at)}
            </div>
          </div>
        </div>
        {canEdit && (
          <button type="button" className="package-remove" onClick={handleEnd}>
            הסרה
          </button>
        )}
      </div>
      <div className="package-tasks">
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
  const [departments, setDepartments] = useState([])
  const [addValue, setAddValue] = useState('')
  const [error, setError] = useState('')

  async function refresh() {
    const [assigned, all, depts] = await Promise.all([
      listClientPackages(clientId),
      listCurrentPackages(),
      listDepartments(),
    ])
    setClientPackages(assigned)
    setAvailablePackages(all)
    setDepartments(depts)
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
  const departmentsById = Object.fromEntries(departments.map((d) => [d.id, d]))

  return (
    <div>
      <div className="section-head">
        <h3>חבילות משויכות</h3>
      </div>

      {error && <p className="form-error">{error}</p>}

      {clientPackages.map((cp) => (
        <ClientPackageCard
          key={cp.id}
          clientPackage={cp}
          department={departmentsById[cp.package_definitions.department_id]}
          canEdit={canEdit}
          onEnded={refresh}
        />
      ))}

      {clientPackages.length === 0 && <div className="empty-state">אין ללקוח חבילות משויכות</div>}

      {canEdit && (
        <div className="add-package-row">
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
            + הוספה
          </button>
        </div>
      )}
    </div>
  )
}
