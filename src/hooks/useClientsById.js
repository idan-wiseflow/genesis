import { useCallback, useEffect, useState } from 'react'
import { listClients } from '../lib/queries'

// clients_view בלבד (ראו queries.js). מחזיר גם map לפי id וגם מערך + refresh
// ליצירת לקוח חדש שרוצים לראות מיד ברשימה בלי רענון דף.
export function useClientsById() {
  const [clients, setClients] = useState([])
  const [clientsById, setClientsById] = useState({})

  const refresh = useCallback(() => {
    return listClients().then((rows) => {
      setClients(rows)
      setClientsById(Object.fromEntries(rows.map((c) => [c.id, c])))
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

  return { clients, clientsById, refresh }
}
