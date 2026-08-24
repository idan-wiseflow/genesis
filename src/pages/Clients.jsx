import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createClient } from '../lib/queries'
import { canCreateClients, canEditProjectManager } from '../lib/permissions'
import { formatCurrency, initials } from '../lib/format'
import { useClientsById } from '../hooks/useClientsById'
import { useProfilesById } from '../hooks/useProfilesById'
import ClientForm from '../components/ClientForm'
import Modal from '../components/Modal'

const ROLE_FIELDS = [
  { field: 'project_manager_id', label: 'מנהל פרויקט' },
  { field: 'campaigner_id', label: 'קמפיינר' },
  { field: 'social_id', label: 'Social' },
  { field: 'seo_id', label: 'SEO' },
  { field: 'studio_id', label: 'סטודיו' },
]

export default function Clients() {
  const { profile } = useAuth()
  const { clients, refresh } = useClientsById()
  const { profiles, profilesById } = useProfilesById()
  const [creating, setCreating] = useState(false)

  async function handleCreate(payload) {
    await createClient(payload)
    await refresh()
    setCreating(false)
  }

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

      {clients.length === 0 && <div className="empty-state">אין עדיין לקוחות</div>}

      {clients.length > 0 && (
        <div className="client-list">
          {clients.map((c) => (
            <Link className="client-row" key={c.id} to={`/clients/${c.id}`}>
              <div className="client-row-main">
                <span className="client-row-name">{c.name}</span>
                <div className="client-row-roles">
                  {ROLE_FIELDS.map(({ field, label }) => {
                    const name = c[field] ? profilesById[c[field]]?.full_name : null
                    if (!name) return null
                    return (
                      <span className="avatar" key={field} title={`${label}: ${name}`}>
                        {initials(name)}
                      </span>
                    )
                  })}
                </div>
              </div>
              {(c.retainer_amount !== null || c.media_amount !== null) && (
                <div className="client-row-financial">
                  {c.retainer_amount !== null && (
                    <span className="badge badge-outline">ריטיינר {formatCurrency(c.retainer_amount)}</span>
                  )}
                  {c.media_amount !== null && (
                    <span className="badge badge-outline">מדיה {formatCurrency(c.media_amount)}</span>
                  )}
                </div>
              )}
            </Link>
          ))}
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
