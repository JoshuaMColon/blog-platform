import { test, expect, type Page } from '@playwright/test'

const POST_SLUG = 'welcome-to-the-blog-platform-demo'

const trackConsoleErrors = (page: Page) => {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', err => errors.push(err.message))
  return errors
}

test('login page renders with demo button and social meta tags', async ({ page }) => {
  const errors = trackConsoleErrors(page)
  await page.goto('/login')
  await expect(page.getByRole('button', { name: /try the demo/i })).toBeVisible()
  await expect(page).toHaveTitle(/Sign in · BlogPlatform/)
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /blogging platform/i)
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-image\.png$/)
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
  expect(errors).toEqual([])
})

test('a direct link to a post renders the post and sets its title', async ({ page }) => {
  const errors = trackConsoleErrors(page)
  await page.goto(`/post/${POST_SLUG}`)
  const heading = page.getByRole('heading', { level: 1 })
  await expect(heading).toBeVisible()
  const title = (await heading.textContent())?.trim() ?? ''
  expect(title.length).toBeGreaterThan(0)
  await expect(page).toHaveTitle(`${title} · BlogPlatform`)
  expect(errors).toEqual([])
})

test('unknown routes show the in-app 404 page', async ({ page }) => {
  await page.goto('/definitely/not/a/page')
  await expect(page.getByText('Page not found')).toBeVisible()
})

test('robots.txt and sitemap.xml are served as real files', async ({ request }) => {
  const robots = await request.get('/robots.txt')
  expect(robots.ok()).toBeTruthy()
  expect(robots.headers()['content-type']).toContain('text/plain')
  expect(await robots.text()).toContain('Sitemap:')

  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.ok()).toBeTruthy()
  expect(await sitemap.text()).toContain('<urlset')
})

test('buttons give press feedback while held (mouse and touch)', async ({ page, context, browserName }, testInfo) => {
  await page.goto('/login')
  const button = page.getByRole('button', { name: /try the demo/i })
  await expect(button).toBeVisible()
  const box = await button.boundingBox()
  if (!box) throw new Error('button has no box')
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  const transform = () => button.evaluate(el => getComputedStyle(el).transform)

  if (testInfo.project.name === 'mobile' && browserName === 'chromium') {
    // Hold a finger down with raw touch events (no click is fired).
    const cdp = await context.newCDPSession(page)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    await expect.poll(transform).not.toBe('none')
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
  } else {
    await page.mouse.move(x, y)
    await page.mouse.down()
    await expect.poll(transform).not.toBe('none')
    await page.mouse.up()
  }
  await expect.poll(transform).toBe('none')
})

test('guest demo signs in, or skips while anonymous sign-ins are off', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: /try the demo/i }).click()

  const disabled = page.getByText(/isn't switched on yet/i)
  const badge = page.getByText('DEMO', { exact: true })
  await expect(disabled.or(badge).first()).toBeVisible({ timeout: 15_000 })

  test.skip(await disabled.isVisible(), 'Anonymous sign-ins are disabled in Supabase')
  await expect(badge).toBeVisible()
})

test('post page shows a live presence-based "reading now" counter', async ({ browser }) => {
  const a = await browser.newContext()
  const b = await browser.newContext()
  try {
    const pageA = await a.newPage()
    const pageB = await b.newPage()
    await pageA.goto(`/post/${POST_SLUG}`)
    await pageB.goto(`/post/${POST_SLUG}`)
    const readers = async () =>
      Number((await pageA.getByTestId('reading-now').textContent())?.match(/\d+/)?.[0] ?? 0)
    // Other test workers (or real visitors) may be on the same post, so only
    // require that this tab sees at least both of our readers.
    await expect.poll(readers, { timeout: 20_000 }).toBeGreaterThanOrEqual(2)
    await expect(pageA.getByTestId('reading-now')).toContainText('reading now')
  } finally {
    await a.close()
    await b.close()
  }
})
