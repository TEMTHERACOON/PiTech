/**
 * Supabase client.
 *
 * Credentials come from Vite env vars:
 *
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 *
 * Both are safe to expose in the browser — the anon key is designed for it and
 * Row Level Security (see `supabase/migrations`) is what actually protects data.
 *
 * When the vars are missing, `supabase` is `null` and `isSupabaseConfigured`
 * is false, which lets the app fall back to the local mock (see `lib/auth.ts`)
 * so it still runs before a project is connected.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

/** Name of the private storage bucket that holds framed photos. */
export const PHOTOS_BUCKET = "photos"
