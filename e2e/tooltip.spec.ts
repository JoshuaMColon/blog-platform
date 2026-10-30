import { expect, test } from '@playwright/test'

// Public page only: no sign-in, so this never creates users.
test.beforeEach(async ({ page }) => {
  await page.goto('/login')
})

test('theme toggle shows a tooltip on hover and keyboard focus; Esc dismisses it', async ({ page, isMobile }) => {
  test.skip(isMobile, 'pointer + keyboard behaviour is covered on desktop')
  const toggle = page.getByRole('button', { name: /Switch to (light|dark) mode/ })
  const tip = page.getByRole('tooltip')
  await toggle.hover()
  await expect(tip).toBeVisible()
  await expect(tip).toHaveText(/^(Light|Dark) mode$/)
  await page.keyboard.press('Escape')
  await expect(tip).toBeHidden()

  await page.mouse.move(0, 0)
  await toggle.focus()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Tab')
  await expect(tip).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(tip).toBeHidden()
})

test('the colour-theme chip has a tooltip only where its label is hidden', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop pointer only')
  await page.setViewportSize({ width: 800, height: 700 })
  await page.getByRole('button', { name: /^Colour theme:/ }).hover()
  await expect(page.getByRole('tooltip')).toHaveText(/^Colour theme:/)
  await page.mouse.move(0, 0)
  await page.setViewportSize({ width: 1280, height: 700 })
  await page.getByRole('button', { name: /^Colour theme:/ }).hover()
  await page.waitForTimeout(900)
  await expect(page.getByRole('tooltip')).toBeHidden()
})

test('tapping on touch never leaves a tooltip behind', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'touch only')
  await page.getByRole('button', { name: /Switch to (light|dark) mode/ }).tap()
  await page.waitForTimeout(900)
  await expect(page.getByRole('tooltip')).toBeHidden()
})
