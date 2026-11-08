// Hourly sweep (pg_cron -> pg_net). Direct deletes from storage.objects are
// blocked, so I remove guest images and orphans through the Storage API.
// The caller proves itself with the Vault internal token (checked in
// Postgres, not compared in this file). The service-role key is injected
// into the function and never returned.
import { createClient } from 'npm:@supabase/supabase-js@2'

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
})

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' })
  const token = req.headers.get('x-internal-token') ?? ''
  if (!token) return json(401, { error: 'unauthorized' })
  const { data: ok, error: tokErr } = await admin.rpc('internal_token_ok', { token })
  if (tokErr || ok !== true) return json(401, { error: 'unauthorized' })

  const { data: rows, error } = await admin.rpc('demo_files_to_purge', { max_rows: 500 })
  if (error) return json(500, { error: error.message })

  const byBucket = new Map<string, string[]>()
  for (const r of (rows ?? []) as { bucket_id: string; name: string }[]) {
    byBucket.set(r.bucket_id, [...(byBucket.get(r.bucket_id) ?? []), r.name])
  }
  const removed: Record<string, number> = {}
  for (const [bucket, names] of byBucket) {
    for (let i = 0; i < names.length; i += 100) {
      const { data, error: rmErr } = await admin.storage.from(bucket).remove(names.slice(i, i + 100))
      if (rmErr) return json(500, { error: rmErr.message, removed })
      removed[bucket] = (removed[bucket] ?? 0) + (data?.length ?? 0)
    }
  }
  return json(200, { removed })
})
