'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabaseClient'
import type { User, Session } from '@/utils/types'
import { isDemoMode, mockUser, mockSession, simulateDelay } from '@/utils/mockData'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  })

  useEffect(() => {
    // Demo mode - use mock data
    if (isDemoMode()) {
      simulateDelay(800).then(() => {
        setAuthState({
          user: mockUser,
          session: mockSession,
          loading: false,
        })
      })
      return
    }

    // Production mode - use Supabase
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState({
        user: session?.user
          ? { id: session.user.id, email: session.user.email || '' }
          : null,
        session: session
          ? {
              user: {
                id: session.user.id,
                email: session.user.email || '',
              },
              access_token: session.access_token,
            }
          : null,
        loading: false,
      })
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState({
        user: session?.user
          ? { id: session.user.id, email: session.user.email || '' }
          : null,
        session: session
          ? {
              user: {
                id: session.user.id,
                email: session.user.email || '',
              },
              access_token: session.access_token,
            }
          : null,
        loading: false,
      })
    })

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signInWithGoogle = async () => {
    // Demo mode - simulate sign in
    if (isDemoMode()) {
      await simulateDelay(500)
      setAuthState({
        user: mockUser,
        session: mockSession,
        loading: false,
      })
      return
    }

    // Production mode - use Supabase
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      console.error('Error signing in:', error.message)
    }
  }

  const signOut = async () => {
    // Demo mode - simulate sign out
    if (isDemoMode()) {
      await simulateDelay(300)
      setAuthState({
        user: null,
        session: null,
        loading: false,
      })
      return
    }

    // Production mode - use Supabase
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error.message)
    }
  }

  return {
    ...authState,
    signInWithGoogle,
    signOut,
  }
}
