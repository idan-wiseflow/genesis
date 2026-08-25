import { useEffect, useState } from 'react'
import {
  listDepartments,
  listCurrentPackages,
  listPackageTemplates,
  savePackageVersion,
} from '../lib/packages'
import Modal from './Modal'
import PackageEditor from './PackageEditor'

export default function PackagesTab() {
  const [departments, setDepartments] = useState([])
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // { definition, templates } | 'new' | null
  const [error, setError] = useState('')

  async function refresh() {
    const [deps, pkgs] = await Promise.all([listDepartments(), listCurrentPackages()])
    setDepartments(deps)
    setPackages(pkgs)
  }

  useEffect(() => {
    refresh()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function openEdit(pkg) {
    setError('')
    try {
      const templates = await listPackageTemplates(pkg.id)
      setEditing({ definition: pkg, templates })
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleSave(values) {
    await savePackageVersion(values)
    await refresh()
    setEditing(null)
  }

  const bundles = packages.filter((p) => p.is_bundle)
  const byDepartment = departments.map((d) => ({
    department: d,
    packages: packages.filter((p) => p.department_id === d.id),
  }))

  if (loading) return <div className="empty-state">טוען...</div>

  return (
    <div>
      <div className="page-head">
        <div className="sub">מבנה עבודה גלובלי: מחלקה → שלב → משימה → כמות ותדירות</div>
        <button type="button" className="cta" onClick={() => setEditing('new')}>
          חבילה חדשה
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {bundles.length > 0 && (
        <div className="section">
          <h3>בנדלים חוצי-מחלקות</h3>
          <div className="task-list">
            {bundles.map((p) => (
              <button type="button" key={p.id} className="package-row" onClick={() => openEdit(p)}>
                <span>{p.name}</span>
                <span className="meta-text">גרסה {p.version}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {byDepartment.map(({ department, packages: deptPackages }) => (
        <div className="section" key={department.id}>
          <h3>{department.name}</h3>
          {deptPackages.length === 0 && <div className="empty-state">אין עדיין חבילות במחלקה הזו</div>}
          {deptPackages.length > 0 && (
            <div className="task-list">
              {deptPackages.map((p) => (
                <button type="button" key={p.id} className="package-row" onClick={() => openEdit(p)}>
                  <span>{p.name}</span>
                  <span className="meta-text">גרסה {p.version}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {editing && (
        <Modal
          title={editing === 'new' ? 'חבילה חדשה' : `עריכת ${editing.definition.name}`}
          onClose={() => setEditing(null)}
        >
          <PackageEditor
            initial={editing === 'new' ? null : editing.definition}
            initialTemplates={editing === 'new' ? [] : editing.templates}
            departments={departments}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  )
}
