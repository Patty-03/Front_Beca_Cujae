import { test, expect } from '@playwright/test'
import { loginAsAdmin, loginInvalid, ensureNotLogin } from './helpers/auth'

test.describe('Admin - Autenticación', () => {
  test('debe iniciar sesión como administrador y redirigir al inicio', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page).toHaveURL(/.*\//)
    await expect(page.getByText(/Accesos rápidos|Infraestructura|Estudiantes/)).toBeVisible()
  })

  test('debe rechazar credenciales inválidas y permanecer en login', async ({ page }) => {
    await loginInvalid(page)
    await ensureNotLogin(page)
    await expect(page.getByText(/No se pudo iniciar sesión/)).toBeVisible()
  })

  test('debe navegar a /login directamente y mostrar el formulario', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /Inicio de Sesión/ })).toBeVisible()
    await expect(page.getByLabel(/Correo electrónico/)).toBeVisible()
    await expect(page.getByLabel(/Contraseña/)).toBeVisible()
    await expect(page.getByRole('button', { name: /INICIAR SESIÓN/ })).toBeVisible()
  })
})
