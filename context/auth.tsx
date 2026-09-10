import { Session, User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'
import { MOCK_PROFILE, USE_MOCK } from '../constants/mockData'
import { supabase } from '../lib/supabase'

type Profile = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  dob: string | null
  avatar_url: string | null
  role: 'parent' | 'tutor' | 'student'
}

type AuthContextType = {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(USE_MOCK ? ({} as Session) : null)
  const [profile, setProfile] = useState<Profile | null>(USE_MOCK ? MOCK_PROFILE : null)
  const [loading, setLoading] = useState(!USE_MOCK)

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) {
      setProfile(data)
    } else {
      // profiles row missing — create it from auth user metadata
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const newProfile = {
          id: userId,
          email: user.email ?? null,
          full_name: user.user_metadata?.full_name ?? null,
          phone: null,
          dob: null,
          avatar_url: null,
          role: (user.user_metadata?.role ?? 'parent') as 'parent' | 'tutor' | 'student',
        }
        await supabase.from('profiles').upsert(newProfile)
        setProfile(newProfile)
      }
    }
  }

  async function refreshProfile() {
    if (session?.user?.id) await fetchProfile(session.user.id)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
  }

  useEffect(() => {
    if (USE_MOCK) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
