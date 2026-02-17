'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabaseClient'
import type { User, Session } from '@/utils/types'

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
