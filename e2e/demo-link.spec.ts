import { test, expect } from '@playwright/test'

// The portfolio links to /demo: one click should land in the guest demo.
test('/demo starts the guest session and lands on the feed, or explains while anonymous sign-ins are off', async ({ page }) => {
  await page.goto('/demo')
  const disabled = page.getByText(/isn't switched on yet/i)
  const badge = page.getByText('DEMO', { exact: true })
  await expect(disabled.or(badge).first()).toBeVisible({ timeout: 15_000 })
  test.skip(await disabled.isVisible(), 'Anonymous sign-ins are disabled in Supabase')
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByTestId('notification-bell')).toBeVisible()
})

test('/login?demo=1 leaves an existing session alone', async ({ page }) => {
  await page.goto('/demo')
  const badge = page.getByText('DEMO', { exact: true })
  const disabled = page.getByText(/isn't switched on yet/i)
  await expect(disabled.or(badge).first()).toBeVisible({ timeout: 15_000 })
  test.skip(await disabled.isVisible(), 'Anonymous sign-ins are disabled in Supabase')
  const uid = () => page.evaluate(() => {
    const k = Object.keys(localStorage).find(x => x.endsWith('-auth-token'))
    return k ? JSON.parse(localStorage.getItem(k) as string).user.id : null
  })
  const first = await uid()
  await page.goto('/login?demo=1')
  await expect(page).toHaveURL(/\/$/)
  expect(await uid()).toBe(first)
})
