import { expect } from '@playwright/test'

export async function login(page, email = 'admin@cujae.cu', password = 'password123') {
  await page.goto('/login')
  await page.fill('input[id="username"]', email)
  await page.fill('input[id="password"]', password)
  await page.click('button[type="submit"]')
  await expect(page).not.toHaveURL(/.*\/login/)
}

export async function loginAsAdmin(page) {
  return login(page, 'admin@cujae.cu', 'password123')
}

export async function loginInvalid(page) {
  await page.goto('/login')
  await page.fill('input[id="username"]', 'admin@cujae.cu')
  await page.fill('input[id="password"]', 'wrongpassword')
  await page.click('button[type="submit"]')
}

export async function ensureNotLogin(page) {
  await expect(page).toHaveURL(/.*\/login/)
}
