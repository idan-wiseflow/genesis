import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createClient } from '../lib/queries'
import { canCreateClients, canEditProjectManager } from '../lib/permissions'
import { formatCurrency } from '../lib/format'
import { useClientsById } from '../hooks/useClientsById'
import { useProfilesById } from '../hooks/useProfilesById'
import ClientForm from '../components/ClientForm'
import Modal from '../components/Modal'

const ROLE_COLUMNS = [
  { key: 'project_manager_id', label: 'מנהל פרויקט' },
  { key: 'campaigner_id', label: 'קמפיינר' },
  { key: 'social_id', label: 'Social' },
  { key: 'seo_id', label: 'SEO' },
  { key: 'studio_id', label: 'סטודיו' },
]
const FINANCIAL_COLUMNS = [
  { key: 'retainer_amount', label: 'ריטיינר' },
  { key: 'media_amount', label: 'מדיה' },
]
const ALL_COLUMNS = [...ROLE_COLUMNS, ...FINANCIAL_COLUMNS]
const COLUMNS_KEY = 'genesis:clients:columns'

function loadVisibleColumns() {
  try {
    const stored = JSON.parse(localStorage.getItem(COLUMNS_KEY))
    if (Array.isArray(stored)) return stored
  } catch {
    // localStorage פגום או ריק, ברירת מחדל: הכל מוצג
  }
  return ALL_COLUMNS.map((c) => c.key)
}

export default function Clients() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { clients, refresh } = useClientsById()
  const { profiles, profilesById } = useProfilesById()
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [columnsOpen, setColumnsOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState(loadVisibleColumns)

  useEffect(() => {
    localStorage.setItem(COLUMNS_KEY, JSON.stringify(visibleColumns))
  }, [visibleColumns])

  function toggleColumn(key) {
    setVisibleColumns((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  async function handleCreate(payload) {
    await createClient(payload)
    await refresh()
    setCreating(false)
  }

  const query = search.trim().toLowerCase()
  const filtered = clients.filter((c) => c.name.toLowerCase().includes(query))
  const activeRoleColumns = ROLE_COLUMNS.filter((c) => visibleColumns.includes(c.key))
  const activeFinancialColumns = FINANCIAL_COLUMNS.filter((c) => visibleColumns.includes(c.key))

  return (
    <section className="screen">
      <div className="page-head">
        <div>
          <h1>לקוחות</h1>
          <div className="sub">כל הלקוחות שאתה מורשה לראות</div>
        </div>
        {canCreateClients(profile) && (
          <button type="button" className="cta" onClick={() => setCreating(true)}>
            לקוח חדש
          </button>
        )}
      </div>

      <div className="list-toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="חיפוש לקוח..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="columns-picker">
          <button type="button" className="chip-toggle" onClick={() => setColumnsOpen((v) => !v)}>
            עמודות
          </button>
          {columnsOpen && (
            <div className="columns-menu" onMouseLeave={() => setColumnsOpen(false)}>
              {ALL_COLUMNS.map((c) => (
                <label key={c.key} className="columns-menu-item">
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(c.key)}
                    onChange={() => toggleColumn(c.key)}
                  />
                  {c.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">{query ? 'אין לקוחות שתואמים לחיפוש' : 'אין עדיין לקוחות'}</div>
      )}

      {filtered.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>שם</th>
                {activeRoleColumns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
                {activeFinancialColumns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="data-row" onClick={() => navigate(`/clients/${c.id}`)}>
                  <td>
                    <Link to={`/clients/${c.id}`} onClick={(e) => e.stopPropagation()}>
                      {c.name}
                    </Link>
                  </td>
                  {activeRoleColumns.map((col) => (
                    <td key={col.key} className="muted-cell">
                      {c[col.key] ? (profilesById[c[col.key]]?.full_name ?? '...') : '-'}
                    </td>
                  ))}
                  {activeFinancialColumns.map((col) => (
                    <td key={col.key} className="muted-cell">
                      {c[col.key] !== null ? formatCurrency(c[col.key]) : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <Modal title="לקוח חדש" onClose={() => setCreating(false)}>
          <ClientForm
            initialValues={{}}
            profiles={profiles}
            canEditProjectManager={canEditProjectManager(profile)}
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
            submitLabel="יצירה"
          />
        </Modal>
      )}
    </section>
  )
}
