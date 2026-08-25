import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { canManagePackages } from '../lib/permissions'
import {
  listDepartments,
  listWorkStages,
  listCurrentPackages,
  listPackageTemplates,
  savePackageVersion,
  createDepartment,
  renameDepartment,
  createWorkStage,
  renameWorkStage,
} from '../lib/packages'
import Modal from './Modal'
import PackageEditor from './PackageEditor'
import InlineEditor from './InlineEditor'

export default function PackagesTab() {
  const { profile } = useAuth()
  const canManage = canManagePackages(profile)

  const [departments, setDepartments] = useState([])
  const [workStages, setWorkStages] = useState([])
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // { definition, templates } | 'new' | null
  const [editingDeptId, setEditingDeptId] = useState(null)
  const [newDeptName, setNewDeptName] = useState('')
  const [editingStageId, setEditingStageId] = useState(null)
  const [newStageName, setNewStageName] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [error, setError] = useState('')

  async function refresh() {
    const [deps, stages, pkgs] = await Promise.all([listDepartments(), listWorkStages(), listCurrentPackages()])
    setDepartments(deps)
    setWorkStages(stages)
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

  async function handleRenameWorkStage(id, name) {
    if (!name.trim()) throw new Error('שם שלב חובה')
    await renameWorkStage(id, name.trim())
    await refresh()
    setEditingStageId(null)
  }

  async function handleAddWorkStage() {
    if (!newStageName.trim()) return
    setError('')
    try {
      await createWorkStage(newStageName.trim())
      setNewStageName('')
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
        <div className="page-head-actions">
          {canManage && (
            <button type="button" className="btn-ghost" onClick={() => setSettingsOpen(true)}>
              ⚙️ הגדרות
            </button>
          )}
          <button type="button" className="cta" onClick={() => setEditing('new')}>
            חבילה חדשה
          </button>
        </div>
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
            workStages={workStages}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {/* מחלקות ושלבי עבודה: עידן, 25.08.2026 - "אני רוצה שזה יהיה מוצג במקום
          פחות בולט ורק להנהלה, שיהיה כפתור הגדרות ואז לחיצה עליו תפתח את זה".
          לא יותר inline בעמוד הראשי, רק דרך המודל הזה. */}
      {canManage && settingsOpen && (
        <Modal title="הגדרות חבילות" onClose={() => setSettingsOpen(false)}>
          <div className="section">
            <h3>מחלקות</h3>
            <div className="field-grid">
              {departments.map((d) =>
                editingDeptId === d.id ? (
                  <InlineEditor
                    key={d.id}
                    type="text"
                    value={d.name}
                    onSave={(v) => handleRenameDepartment(d.id, v)}
                    onCancel={() => setEditingDeptId(null)}
                  />
                ) : (
                  <button
                    type="button"
                    key={d.id}
                    className="field field-editable"
                    onClick={() => setEditingDeptId(d.id)}
                  >
                    <div className="v">{d.name}</div>
                  </button>
                )
              )}
            </div>
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
          </div>

          <div className="section">
            <h3>שלבי עבודה</h3>
            <div className="field-grid">
              {workStages.map((s) =>
                editingStageId === s.id ? (
                  <InlineEditor
                    key={s.id}
                    type="text"
                    value={s.name}
                    onSave={(v) => handleRenameWorkStage(s.id, v)}
                    onCancel={() => setEditingStageId(null)}
                  />
                ) : (
                  <button
                    type="button"
                    key={s.id}
                    className="field field-editable"
                    onClick={() => setEditingStageId(s.id)}
                  >
                    <div className="v">{s.name}</div>
                  </button>
                )
              )}
            </div>
            <div className="tag-add-row">
              <input
                type="text"
                placeholder="שלב עבודה חדש"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
              />
              <button type="button" className="btn-ghost" onClick={handleAddWorkStage}>
                + שלב חדש
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
