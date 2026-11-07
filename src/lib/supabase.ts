import { createClient } from '@supabase/supabase-js'

// One client for the app, so auth state and the Realtime socket are shared.
// The anon key is meant to ship in the bundle: it only identifies the
// project. Which rows this session can touch is decided by RLS, not by
// hiding the key.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)