// Queue worker: computes gte-small embeddings (384-d, built into the Edge
// Runtime, no API key) for published posts whose title/tags/content changed.
// Kicked by a posts trigger via pg_net and a 5-minute cron retry; authenticated
// by the Vault internal token. The service-role key never leaves the function.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
})
const model = new Supabase.ai.Session('gte-small')

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const ENTITIES: Record<string, string> = { '&nbsp;': ' ', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&amp;': '&' }
const plain = (html: string) =>
  html
    .replace(/<(br|\/p|\/h\d|\/li|\/pre|\/blockquote)[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(nbsp|lt|gt|quot|#39|amp);/g, (m) => ENTITIES[m] ?? m)
    .replace(/\s+/g, ' ')
    .trim()

type Job = { post_id: string; title: string; content: string; tags: string[] | null; content_hash: string; requested_at: string }

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' })
  const token = req.headers.get('x-internal-token') ?? ''
  if (!token) return json(401, { error: 'unauthorized' })
  const { data: ok, error: tokErr } = await admin.rpc('internal_token_ok', { token })
  if (tokErr || ok !== true) return json(401, { error: 'unauthorized' })

  const started = Date.now()
  let done = 0
  const failed: string[] = []
  // Per-invocation cap (3 batches of 5); the rest waits for the next kick.
  for (let batch = 0; batch < 3 && Date.now() - started < 20_000; batch++) {
    const { data, error } = await admin.rpc('ai_claim_jobs', { job_kind: 'embed', max_jobs: 5 })
    if (error) return json(500, { error: error.message, done })
    const jobs = (data ?? []) as Job[]
    if (!jobs.length) break
    for (const j of jobs) {
      try {
        // gte-small truncates at 512 tokens; ~2000 chars keeps the important part.
        const text = `${j.title}. ${(j.tags ?? []).join(', ')}. ${plain(j.content)}`.slice(0, 2000)
        const emb = (await model.run(text, { mean_pool: true, normalize: true })) as number[]
        if (!Array.isArray(emb) || emb.length !== 384) throw new Error(`bad embedding length ${emb?.length}`)
        const { error: e } = await admin.rpc('ai_complete_embedding', {
          p_post_id: j.post_id,
          p_embedding: JSON.stringify(emb),
          p_content_hash: j.content_hash,
          p_requested_at: j.requested_at,
        })
        if (e) throw new Error(e.message)
        done++
      } catch (err) {
        failed.push(j.post_id)
        await admin.rpc('ai_fail_job', { p_post_id: j.post_id, job_kind: 'embed', p_error: String(err) })
      }
    }
  }
  return json(200, { done, failed })
})
