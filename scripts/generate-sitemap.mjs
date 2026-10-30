// Writes dist/sitemap.xml after `vite build`.
// Published post slugs are fetched with the public anon key (RLS only exposes
// published posts to anon). If the env is missing or the request fails, the
// sitemap falls back to the static public routes so the build never breaks.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const SITE = (process.env.SITE_URL || 'https://blog-platform-one-xi.vercel.app').replace(/\/$/, '')

const readEnvFile = () => {
  const env = {}
  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !(m[1] in env)) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
    }
  }
  return env
}

const fileEnv = readEnvFile()
const url = process.env.VITE_SUPABASE_URL || fileEnv.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY || fileEnv.VITE_SUPABASE_ANON_KEY

const escapeXml = s => s.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c])

const entries = [
  { loc: `${SITE}/login`, priority: '0.8' },
  { loc: `${SITE}/search`, priority: '0.5' },
]

if (url && key) {
  try {
    const res = await fetch(
      `${url}/rest/v1/posts?select=slug,updated_at,created_at&published=eq.true&order=created_at.desc`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10000) },
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const posts = await res.json()
    for (const p of posts) {
      entries.push({
        loc: `${SITE}/post/${encodeURIComponent(p.slug)}`,
        lastmod: (p.updated_at || p.created_at || '').slice(0, 10) || undefined,
        priority: '0.7',
      })
    }
    console.log(`sitemap: ${posts.length} published posts`)
  } catch (err) {
    console.warn(`sitemap: could not fetch posts (${err.message}); writing static routes only`)
  }
} else {
  console.warn('sitemap: Supabase env not set; writing static routes only')
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(e => `  <url>\n    <loc>${escapeXml(e.loc)}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ''}\n    <priority>${e.priority}</priority>\n  </url>`)
  .join('\n')}
</urlset>
`

writeFileSync('dist/sitemap.xml', xml)
