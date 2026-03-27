import { createClient, SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = SupabaseClient<any>

let _browserClient: AnyClient | null = null

/** Lazy singleton browser client — safe for client components */
export function getSupabaseClient(): AnyClient {
  if (_browserClient) return _browserClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  _browserClient = createClient(url, key)
  return _browserClient
}

/** Named export used by client components */
export const supabase = {
  get from() { return getSupabaseClient().from.bind(getSupabaseClient()) },
  get channel() { return getSupabaseClient().channel.bind(getSupabaseClient()) },
  get removeChannel() { return getSupabaseClient().removeChannel.bind(getSupabaseClient()) },
}

/** Server-side client — fresh per request, safe in Server Components & API routes */
export function createServerClient(): AnyClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  return createClient(url, key)
}
