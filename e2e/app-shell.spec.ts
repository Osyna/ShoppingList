import { test, expect } from '@playwright/test'

/**
 * Smoke tests for the static app shell. These run without a backend and
 * guarantee the build doesn't regress rendering, routing, or the PWA
 * manifest. Feature tests that need PocketBase live in other specs.
 */
test.describe('app shell', () => {
  test('loads the login page', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Liste de Courses|Shopping List/i)
    // Unauthenticated users are redirected to /login by the router guard.
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('button', { name: /Se connecter|Sign in/ })).toBeVisible()
  })

  test('navigates between login and signup', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: /S'inscrire|Create account/ }).click()
    await expect(page).toHaveURL(/\/signup$/)
    await page.getByRole('link', { name: /Se connecter|Sign in/ }).click()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('exposes a PWA manifest + service worker', async ({ page }) => {
    await page.goto('/')
    const manifestHref = await page
      .locator('link[rel="manifest"]')
      .getAttribute('href')
    expect(manifestHref).toBeTruthy()

    const manifestResp = await page.request.get(manifestHref!)
    expect(manifestResp.ok()).toBe(true)
    const manifest = await manifestResp.json()
    expect(manifest.name).toMatch(/Courses|Shopping/i)
    expect(manifest.display).toBe('standalone')

    const swResp = await page.request.get('/sw.js')
    expect(swResp.ok()).toBe(true)
  })

  test('rejects form submission with mismatched passwords', async ({ page }) => {
    await page.goto('/signup')
    await page.locator('input[autocomplete="name"]').fill('Tester')
    await page.locator('input[autocomplete="email"]').fill('t@example.com')
    const pwd = page.locator('input[autocomplete="new-password"]')
    await pwd.nth(0).fill('password123')
    await pwd.nth(1).fill('different1')
    await page.getByRole('button', { name: /S'inscrire|Create account/ }).click()
    // A toast appears via ToastStack. We only assert the URL didn't change.
    await expect(page).toHaveURL(/\/signup$/)
  })
})
