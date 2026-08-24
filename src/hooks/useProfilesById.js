import { useCallback, useEffect, useState } from 'react'
import { listProfiles } from '../lib/queries'

// שימוש חוזר בכל מסך שצריך לתרגם assigned_to/project_manager_id וכו' לשם.
// refresh נדרש למסך המשתמשים: לראות משתמש חדש ברשימה מיד אחרי יצירה,
// בלי לרענן דף (אותו דפוס כמו useClientsById).
export function useProfilesById() {
  const [profilesById, setProfilesById] = useState({})
  const [profiles, setProfiles] = useState([])

  const refresh = useCallback(() => {
    return listProfiles().then((rows) => {
      setProfiles(rows)
      setProfilesById(Object.fromEntries(rows.map((p) => [p.id, p])))
      return rows
    })
  }, [])

  useEffect(() => {
    let active = true
    refresh().catch(() => {
      if (!active) return
    })
    return () => {
      active = false
    }
  }, [refresh])

  return { profiles, profilesById, refresh }
}
