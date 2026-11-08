import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/auth'

test.describe('Admin - Super Admin (usuarios, roles y permisos)', () => {
  test('debe listar usuarios, crear uno, editarlo, cambiar rol y eliminarlo', async ({ page }) => {
    await loginAsAdmin(page)

    await page.goto('/superadmin')
    await expect(page.getByRole('heading', { name: 'Super Admin' })).toBeVisible()

    // Tabla de usuarios
    await expect(page.getByText(/Usuarios|Nombre|Correo|Rol|Estado/).first()).toBeVisible()

    // Crear nuevo usuario
    await page.getByRole('button', { name: /Nuevo usuario/ }).click()
    await expect(page.getByRole('dialog').or(page.getByText(/Editar usuario|Crear usuario/)).first()).toBeVisible()

    await page.fill('input[placeholder="Nombre completo"]', 'Usuario E2E')
    await page.fill('input[type="email"]', 'e2e@cujae.cu')
    await page.getByRole('button', { name: /Crear usuario|Guardar cambios/ }).click()

    await expect(page.getByText('e2e@cujae.cu').or(page.getByText(/Usuario creado/))).toBeVisible()

    // Cambiar rol / editar
    const rolSelect = page.locator('select').first()
    if (await rolSelect.isVisible()) {
      await rolSelect.selectOption({ label: /administrador|operador|estudiante/ })
    }

    // Eliminar usuario creado
    await page.getByRole('button', { name: /Eliminar/ }).last().click()
    await page.getByRole('button', { name: /Eliminar|Aceptar/ }).click()
    await expect(page.getByText(/Usuario eliminado/).or(page.getByText(/e2e@cujae.cu/).not())).toBeVisible()
  })

  test('debe mostrar roles y permisos disponibles', async ({ page }) => {
    await loginAsAdmin(page)

    await page.goto('/superadmin')
    await expect(page.getByText(/Roles y permisos/)).toBeVisible()
    await expect(page.getByText(/Estudiante de pregrado|Operador de infraestructura|Administrador/).first()).toBeVisible()
  })
})
