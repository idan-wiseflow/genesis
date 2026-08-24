import { useEffect, useState } from 'react'
import { listProfiles } from '../lib/queries'

// שימוש חוזר בכל מסך שצריך לתרגם assigned_to/project_manager_id וכו' לשם.
export function useProfilesById() {
  const [profilesById, setProfilesById] = useState({})
  const [profiles, setProfiles] = useState([])

  useEffect(() => {
    let active = true
    listProfiles().then((rows) => {
      if (!active) return
      setProfiles(rows)
      setProfilesById(Object.fromEntries(rows.map((p) => [p.id, p])))
    })
    return () => {
      active = false
    }
  }, [])

  return { profiles, profilesById }
}
