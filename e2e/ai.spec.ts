import { test, expect } from '@playwright/test'
import { loadEnv } from 'vite'

const env = { ...loadEnv('production', process.cwd(), 'VITE_'), ...process.env }
const SUPABASE_URL = env.VITE_SUPABASE_URL as string
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY as string
const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json' }
const rest = `${SUPABASE_URL}/rest/v1`

const postId = async (request: import('@playwright/test').APIRequestContext, slugPart: string) => {
  const res = await request.get(`${rest}/posts?select=id,slug&published=eq.true&slug=ilike.*${slugPart}*`, { headers })
  const rows = await res.json()
  return rows[0] as { id: string; slug: string } | undefined
}

test.describe('AI data (embeddings + summaries)', () => {
  test.skip(!SUPABASE_URL || !ANON_KEY, 'Supabase env not configured')

  test('related_posts returns other published posts ranked by similarity, capped', async ({ request }) => {
    const rls = await postId(request, 'row-level-security')
    test.skip(!rls, 'seed post missing')
    const res = await request.post(`${rest}/rpc/related_posts`, { headers, data: { p_post_id: rls!.id, match_count: 99 } })
    expect(res.ok()).toBe(true)
    const rows = await res.json()
    test.skip(rows.length === 0, 'embeddings not computed yet')
    expect(rows.length).toBeLessThanOrEqual(6)
    for (const r of rows) {
      expect(r.id).not.toBe(rls!.id)
      expect(r.similarity).toBeGreaterThan(0)
      expect(r.similarity).toBeLessThanOrEqual(1)
      expect(r).not.toHaveProperty('content')
    }
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1].similarity).toBeGreaterThanOrEqual(rows[i].similarity)
  })

  test('anon can read summaries but not write AI tables or call worker RPCs', async ({ request }) => {
    const sums = await request.get(`${rest}/post_summaries?select=post_id,summary,source`, { headers })
    expect(sums.ok()).toBe(true)
    for (const s of await sums.json()) expect(['llm', 'extractive']).toContain(s.source)

    const ins = await request.post(`${rest}/post_summaries`, {
      headers,
      data: { post_id: '00000000-0000-0000-0000-000000000000', summary: 'x', source: 'llm', content_hash: 'x' },
    })
    expect(ins.ok()).toBe(false)
    for (const fn of ['ai_claim_jobs', 'ai_complete_summary', 'ai_complete_embedding', 'ai_fail_job']) {
      const r = await request.post(`${rest}/rpc/${fn}`, { headers, data: {} })
      expect(r.ok(), fn).toBe(false)
    }
  })

  test('worker Edge Functions reject calls without the internal token', async ({ request }) => {
    for (const fn of ['embed-post', 'summarize-post']) {
      const none = await request.post(`${SUPABASE_URL}/functions/v1/${fn}`, { headers, data: {} })
      expect(none.status(), fn).toBe(401)
      const bad = await request.post(`${SUPABASE_URL}/functions/v1/${fn}`, {
        headers: { ...headers, 'x-internal-token': 'not-the-token' },
        data: {},
      })
      expect(bad.status(), fn).toBe(401)
    }
  })
})

test.describe('AI UI', () => {
  test.skip(!SUPABASE_URL || !ANON_KEY, 'Supabase env not configured')

  test('post page shows a TL;DR panel and related posts', async ({ page, request }) => {
    const rls = await postId(request, 'row-level-security')
    test.skip(!rls, 'seed post missing')
    await page.goto(`/post/${rls!.slug}`)
    const tldr = page.getByTestId('tldr-panel')
    await expect(tldr).toBeVisible()
    await expect(tldr.getByTestId('tldr-text').or(tldr.getByTestId('tldr-pending'))).toBeVisible()

    const toggle = tldr.getByRole('button', { name: /collapse\(\)/ })
    await toggle.click()
    await expect(tldr.getByRole('button', { name: /expand\(\)/ })).toHaveAttribute('aria-expanded', 'false')

    const related = page.getByTestId('related-posts')
    await expect(related).toBeVisible()
    const cards = related.getByTestId('related-post')
    expect(await cards.count()).toBeGreaterThan(0)
    expect(await cards.count()).toBeLessThanOrEqual(3)
    await cards.first().click()
    await expect(page).not.toHaveURL(new RegExp(rls!.slug))
    await expect(page.getByTestId('tldr-panel')).toBeVisible()
  })
})
