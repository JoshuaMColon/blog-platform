import { test, expect, type Page } from '@playwright/test'
import { loadEnv } from 'vite'

const env = { ...loadEnv('production', process.cwd(), 'VITE_'), ...process.env }
const SUPABASE_URL = env.VITE_SUPABASE_URL as string
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY as string
const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }

test.describe('image storage', () => {
  test.skip(!SUPABASE_URL || !ANON_KEY, 'Supabase env not configured')

  test('signed-out visitors cannot upload or list images, but can read public covers', async ({ request }) => {
    for (const bucket of ['covers', 'post-images']) {
      const up = await request.post(`${SUPABASE_URL}/storage/v1/object/${bucket}/e2e/probe.png`, {
        headers: { ...headers, 'Content-Type': 'image/png' },
        data: Buffer.from('not really a png'),
      })
      expect(up.ok(), `${bucket} upload should be rejected`).toBe(false)

      const list = await request.post(`${SUPABASE_URL}/storage/v1/object/list/${bucket}`, {
        headers: { ...headers, 'Content-Type': 'application/json' },
        data: { prefix: '', limit: 100 },
      })
      expect(await list.json()).toEqual([])
    }
  })

  test('the cleanup function refuses calls without the internal token', async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/functions/v1/cleanup-demo-files`, { data: {} })
    expect(res.status()).toBe(401)
  })
})

/** Makes a large noisy PNG in the browser so compression has real work to do. */
const bigPng = (page: Page) =>
  page.evaluate(() => {
    const c = document.createElement('canvas')
    c.width = 2600
    c.height = 1700
    const ctx = c.getContext('2d')!
    const g = ctx.createLinearGradient(0, 0, c.width, c.height)
    g.addColorStop(0, '#00e5ff')
    g.addColorStop(1, '#ff2bd6')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, c.width, c.height)
    for (let i = 0; i < 4000; i++) {
      ctx.fillStyle = `hsl(${(i * 37) % 360} 80% 50% / .5)`
      ctx.fillRect((i * 97) % c.width, (i * 53) % c.height, 40, 40)
    }
    return c.toDataURL('image/png').split(',')[1]
  })

test('guest uploads a compressed cover and an inline image, or skips while anonymous sign-ins are off', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: /try the demo/i }).click()
  const disabled = page.getByText(/isn't switched on yet/i)
  const badge = page.getByText('DEMO', { exact: true })
  await expect(disabled.or(badge).first()).toBeVisible({ timeout: 15_000 })
  test.skip(await disabled.isVisible(), 'Anonymous sign-ins are disabled in Supabase')

  await page.goto('/create')
  const buffer = Buffer.from(await bigPng(page), 'base64')
  expect(buffer.length).toBeGreaterThan(2 * 1024 * 1024)

  await page.getByTestId('cover-input').setInputFiles({ name: 'cover.png', mimeType: 'image/png', buffer })
  const preview = page.getByAltText('Cover preview')
  await expect(preview).toHaveAttribute('src', /\/storage\/v1\/object\/public\/covers\/[0-9a-f-]+\/[0-9a-f-]+\.(webp|jpg)$/, { timeout: 30_000 })
  const width = await preview.evaluate(img => (img as HTMLImageElement).naturalWidth)
  expect(width).toBeLessThanOrEqual(1600)

  await page.getByTestId('editor-image-input').setInputFiles({ name: 'diagram.png', mimeType: 'image/png', buffer })
  await expect(page.locator('.ProseMirror img')).toHaveAttribute('src', /\/post-images\//, { timeout: 30_000 })

  await page.getByTestId('cover-input').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hi') })
  await expect(page.getByText(/only jpg, png, webp or gif/i)).toBeVisible()
})
