import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    // Fallback to empty strings during build time or if env vars are missing
    // to prevent @supabase/ssr from throwing an error.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

    return createBrowserClient(supabaseUrl, supabaseKey)
}
