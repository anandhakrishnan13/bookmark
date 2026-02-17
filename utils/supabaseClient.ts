import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

// Environment variables - will be set when Supabase is configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export function createClient() {
  return createBrowserClient<Database>(
    supabaseUrl, 
    supabaseAnonKey,
    {
      db: {
        schema: 'public'
      }
    }
  )
}

// Singleton client for browser usage with proper typing
let browserClient: ReturnType<typeof createClient> | undefined

export function getSupabase() {
  if (typeof window === 'undefined') {
    return createClient()
  }
  if (!browserClient) {
    browserClient = createClient()
  }
  return browserClient
}

export const supabase = getSupabase()
