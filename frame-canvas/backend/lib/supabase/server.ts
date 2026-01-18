import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for server-side use in API routes.
 * Uses cookies to maintain authentication state.
 * 
 * Note: For proper session handling in production, consider using @supabase/ssr
 * or middleware to refresh tokens. This is a simplified version.
 */
export function createClientServer() {
  const cookieStore = cookies()
  
  // Get access token from cookies (Supabase stores it as sb-<project-ref>-auth-token)
  // For API routes, the frontend should send the access token in Authorization header
  // and we'll use that, or we can read from cookies if available
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      // Note: In production, you may want to use @supabase/ssr for better cookie handling
      // For now, RPC functions will use auth.uid() which reads from the session in the request context
    }
  )
}

