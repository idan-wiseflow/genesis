import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

// אחרי SIGNED_IN טרי (לא page refresh עם session קיים), הבקשות הראשונות יכולות
// לרוץ כ-anon לפני שה-session מחובר בפועל, גם כש-loading כבר false. תוקן ב-CRM
// עם retry קצר על getSession() לפני שמסירים את מסך הטעינה. אותו דפוס כאן.
async function waitForReadySession() {
  for (let i = 0; i < 10; i++) {
    const { data } = await supabase.auth.getSession()
    if (data.session?.access_token) return data.session
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  return null
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadProfile(userId) {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (active) setProfile(data ?? null)
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      const finish = () => active && setLoading(false)
      if (data.session) loadProfile(data.session.user.id).then(finish)
      else finish()
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!active) return

      if (event === 'SIGNED_IN') {
        const ready = await waitForReadySession()
        const finalSession = ready ?? newSession
        setSession(finalSession)
        if (finalSession) await loadProfile(finalSession.user.id)
        return
      }

      setSession(newSession)
      if (newSession) await loadProfile(newSession.user.id)
      else setProfile(null)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = {
    session,
    profile,
    loading,
    user: session?.user ?? null,
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth חייב לרוץ בתוך AuthProvider')
  return ctx
}
