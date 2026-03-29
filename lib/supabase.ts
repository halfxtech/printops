import { createBrowserClient, createServerClient as createSSRClient } from '@supabase/ssr'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _browserClient: ReturnType<typeof createBrowserClient> | null = null

/** Lazy singleton browser client — reads session from cookies, safe for client components */
export function getSupabaseClient() {
  if (_browserClient) return _browserClient
  _browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return _browserClient
}

/** Named export used by client components */
export const supabase = {
  get from() { return getSupabaseClient().from.bind(getSupabaseClient()) },
  get channel() { return getSupabaseClient().channel.bind(getSupabaseClient()) },
  get removeChannel() { return getSupabaseClient().removeChannel.bind(getSupabaseClient()) },
}

/** Server-side client — fresh per request, forwards session cookies for RLS */
export async function createServerClient() {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
