import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { canManagePackages } from '../lib/permissions'
import {
  listDepartments,
  listCurrentPackages,
  listPackageTemplates,
  savePackageVersion,
  createDepartment,
  renameDepartment,
} from '../lib/packages'
import Modal from './Modal'
import PackageEditor from './PackageEditor'
import InlineEditor from './InlineEditor'

export default function PackagesTab() {
  const { profile } = useAuth()
  const canManage = canManagePackages(profile)

  const [departments, setDepartments] = useState([])
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // { definition, templates } | 'new' | null
  const [editingDeptId, setEditingDeptId] = useState(null)
  const [newDeptName, setNewDeptName] = useState('')
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

  async function handleRenameDepartment(id, name) {
    if (!name.trim()) throw new Error('שם מחלקה חובה')
    await renameDepartment(id, name.trim())
    await refresh()
    setEditingDeptId(null)
  }

  async function handleAddDepartment() {
    if (!newDeptName.trim()) return
    setError('')
    try {
      await createDepartment(newDeptName.trim())
      setNewDeptName('')
      await refresh()
    } catch (err) {
      setError(err.message ?? 'משהו השתבש')
    }
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

      {canManage && (
        <div className="tag-add-row">
          <input
            type="text"
            placeholder="שם מחלקה חדשה"
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
          />
          <button type="button" className="btn-ghost" onClick={handleAddDepartment}>
            + מחלקה חדשה
          </button>
        </div>
      )}

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
          {canManage && editingDeptId === department.id ? (
            <InlineEditor
              type="text"
              value={department.name}
              onSave={(v) => handleRenameDepartment(department.id, v)}
              onCancel={() => setEditingDeptId(null)}
            />
          ) : (
            <h3
              className={canManage ? 'clickable' : undefined}
              onClick={() => canManage && setEditingDeptId(department.id)}
            >
              {department.name}
            </h3>
          )}
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
