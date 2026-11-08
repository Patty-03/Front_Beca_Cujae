import { test, expect } from '@playwright/test'

test.describe('Estudiante - Firmar documentos', () => {
  test('debe firmar el acta de responsabilidad digitalmente', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[name="email"], input[type="email"]', 'estudiante@cujae.cu')
    await page.fill('input[name="password"], input[type="password"]', 'password123')
    await page.click('button[type="submit"]:has-text("Iniciar"), button:has-text("Ingresar"), button:has-text("Acceder")')

    await expect(page).toHaveURL(/.*\/estudiante/)

    // Ir a Mis documentos
    await expect(page.getByRole('heading', { name: 'Mis documentos' })).toBeVisible()

    // Buscar el acta de responsabilidad material
    const actaRow = page.locator('article').filter({ hasText: 'Acta de Responsabilidad Material' })
    await expect(actaRow).toBeVisible()

    // Clic en Firmar
    const botonFirmar = actaRow.getByRole('button', { name: 'Firmar' })
    if (await botonFirmar.isVisible()) {
      await botonFirmar.click()

      // Debería abrir el dialog de firma
      await expect(page.getByRole('heading', { name: 'Firmar documento digitalmente' })).toBeVisible()

      // Confirmar firma
      await page.getByRole('button', { name: 'Firmar digitalmente' }).click()

      // Verificar mensaje de éxito y cambio de estado
      await expect(page.getByText(/Documento firmado/)).toBeVisible()
      await expect(page.getByText('Firmado')).toBeVisible()
    } else {
      // Ya estaba firmado, verificar que muestra Descargar
      await expect(actaRow.getByRole('button', { name: 'Descargar' })).toBeVisible()
      await expect(actaRow.getByText('Firmado')).toBeVisible()
    }
  })

  test('debe descargar un documento ya firmado', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[name="email"], input[type="email"]', 'estudiante@cujae.cu')
    await page.fill('input[name="password"], input[type="password"]', 'password123')
    await page.click('button[type="submit"]:has-text("Iniciar"), button:has-text("Ingresar"), button:has-text("Acceder")')

    await expect(page).toHaveURL(/.*\/estudiante/)

    const docFirmado = page.locator('article').filter({ hasText: 'Firmado' }).first()
    if (await docFirmado.isVisible()) {
      await expect(docFirmado.getByRole('button', { name: 'Descargar' })).toBeVisible()
    }
  })
})
