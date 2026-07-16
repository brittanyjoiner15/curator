'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import posthog from 'posthog-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const verifiedIdentityFor = useRef<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) posthog.identify(session.user.id, { email: session.user.email })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) posthog.identify(session.user.id, { email: session.user.email })
    })

    return () => subscription.unsubscribe()
  }, [])

  // Verified identity for the PostHog support widget: an HMAC of the user id signed
  // server-side, so support tickets persist across browsers and can't be spoofed.
  useEffect(() => {
    const u = session?.user
    if (!u || verifiedIdentityFor.current === u.id) return
    verifiedIdentityFor.current = u.id
    fetch('/api/posthog-identity', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.enabled && data.hash) posthog.setIdentity(data.distinct_id, data.hash)
      })
      .catch(() => { verifiedIdentityFor.current = null })
  }, [session])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error && data.user) {
      posthog.identify(data.user.id, { email: data.user.email })
      posthog.capture('user_logged_in')
    }
    return { error: error?.message ?? null }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (!error && data.user) {
      posthog.identify(data.user.id, { email: data.user.email })
      posthog.capture('user_signed_up')
    }
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    posthog.clearIdentity()
    verifiedIdentityFor.current = null
    posthog.reset()
    router.push('/auth')
  }, [router])

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
