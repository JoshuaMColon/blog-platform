import { test, expect } from './guest-cleanup'
import { loadEnv } from 'vite'

const env = { ...loadEnv('production', process.cwd(), 'VITE_'), ...process.env }
const SUPABASE_URL = env.VITE_SUPABASE_URL as string
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY as string
const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json' }

test.describe('notifications API', () => {
  test.skip(!SUPABASE_URL || !ANON_KEY, 'Supabase env not configured')

  test('signed-out visitors can neither read nor create notifications', async ({ request }) => {
    const read = await request.get(`${SUPABASE_URL}/rest/v1/notifications?select=id&limit=5`, { headers })
    if (read.ok()) expect(await read.json()).toEqual([])
    else expect([401, 403]).toContain(read.status())

    const write = await request.post(`${SUPABASE_URL}/rest/v1/notifications`, {
      headers,
      data: {
        user_id: 'b10c0000-0000-4000-8000-000000000001',
        actor_id: 'b10c0000-0000-4000-8000-000000000001',
        type: 'follow',
      },
    })
    expect(write.ok()).toBe(false)
  })
})

test('the notifications page needs a signed-in user', async ({ page }) => {
  await page.goto('/notifications')
  await expect(page).toHaveURL(/\/login/)
})

test('guest sees the bell, an empty inbox and the notifications page, or skips while anonymous sign-ins are off', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: /try the demo/i }).click()
  const disabled = page.getByText(/isn't switched on yet/i)
  const badge = page.getByText('DEMO', { exact: true })
  await expect(disabled.or(badge).first()).toBeVisible({ timeout: 15_000 })
  test.skip(await disabled.isVisible(), 'Anonymous sign-ins are disabled in Supabase')

  const bell = page.getByTestId('notification-bell')
  await expect(bell).toBeVisible()
  await expect(page.getByTestId('notification-badge')).toHaveCount(0)
  await bell.click()
  await expect(page.getByText(/no signals yet/i)).toBeVisible()
  await page.getByRole('link', { name: /view_all/ }).click()
  await expect(page).toHaveURL(/\/notifications$/)
  await expect(page.getByRole('heading', { name: 'notifications' })).toBeVisible()
  // the page keeps the navbar (bell included) so you can navigate away
  await expect(page.getByTestId('notification-bell')).toBeVisible()
})
