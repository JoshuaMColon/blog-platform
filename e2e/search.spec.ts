import { test, expect } from '@playwright/test'
import { loadEnv } from 'vite'

const env = { ...loadEnv('production', process.cwd(), 'VITE_'), ...process.env }
const SUPABASE_URL = env.VITE_SUPABASE_URL as string
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY as string
const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json' }
const rpc = `${SUPABASE_URL}/rest/v1/rpc/search_posts`

test.describe('search_posts RPC', () => {
  test.skip(!SUPABASE_URL || !ANON_KEY, 'Supabase env not configured')

  test('ranks title matches first and highlights without HTML', async ({ request }) => {
    const res = await request.post(rpc, { headers, data: { q: 'row level security' } })
    expect(res.ok()).toBe(true)
    const rows = await res.json()
    expect(rows.length).toBeGreaterThan(0)
    expect(rows[0].title).toBe('Row Level Security in practice')
    expect(rows[0].title_highlight).toContain('\uE000')
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1].rank).toBeGreaterThanOrEqual(rows[i].rank)
    for (const r of rows) {
      expect(r.snippet).not.toMatch(/<[a-z/]/i)
      expect(r.total_count).toBe(rows.length)
      expect(r).not.toHaveProperty('content')
    }
  })

  test('matches prefixes as you type, supports web-search syntax and ignores junk', async ({ request }) => {
    const prefix = await (await request.post(rpc, { headers, data: { q: 'row lev' } })).json()
    expect(prefix.map((r: { title: string }) => r.title)).toContain('Row Level Security in practice')

    const excluded = await (await request.post(rpc, { headers, data: { q: '"row level" -react' } })).json()
    expect(excluded.every((r: { tags: string[] }) => !r.tags.includes('react'))).toBe(true)

    for (const q of ['', 'the', "' & | ! :* ()"]) {
      const res = await request.post(rpc, { headers, data: { q } })
      expect(res.ok()).toBe(true)
      expect(await res.json()).toEqual([])
    }
  })

  test('caps page size at 50', async ({ request }) => {
    const res = await request.post(rpc, { headers, data: { q: 'post', page_size: 5000, page_offset: -3 } })
    expect(res.ok()).toBe(true)
    expect((await res.json()).length).toBeLessThanOrEqual(50)
  })
})

test('search page shows ranked, highlighted results and keeps the query in the URL', async ({ page }) => {
  await page.goto('/search')
  await page.getByTestId('search-input').fill('row lev')
  const first = page.getByTestId('search-result').first()
  await expect(first).toContainText('Row Level Security in practice')
  await expect(first.locator('mark.hud-mark').first()).toBeVisible()
  await expect(page.getByText('ranked by relevance')).toBeVisible()
  await expect(page).toHaveURL(/\?q=row\+lev|\?q=row%20lev/)

  await page.reload()
  await expect(page.getByTestId('search-input')).toHaveValue('row lev')
  await expect(page.getByTestId('search-result').first()).toContainText('Row Level Security')
})
