import { test, expect } from '@playwright/test'

test.describe('Admin - Subir documentos para firma', () => {
  test('debe subir un documento desde la vista de administración', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[name="email"], input[type="email"]', 'admin@cujae.cu')
    await page.fill('input[name="password"], input[type="password"]', 'password123')
    await page.click('button[type="submit"]:has-text("Iniciar"), button:has-text("Ingresar"), button:has-text("Acceder")')

    // Ir a la vista de administración de documentos
    await page.goto('/documentos-admin')

    await expect(page.getByRole('heading', { name: 'Documentos para firma' })).toBeVisible()

    // Clic en Subir documento
    await page.getByRole('button', { name: /Subir documento/ }).click()

    // Debería abrir el dialog
    await expect(page.getByRole('heading', { name: 'Subir documento para firma' })).toBeVisible()

    // Seleccionar tipo de documento
    await page.selectOption('select', { label: 'Acta de Responsabilidad Material' })

    // Llenar nombre
    await page.fill('input[id="documento-nombre"]', 'Acta de Responsabilidad Material 2026')

    // Seleccionar archivo (PDF)
    const inputArchivo = page.locator('input[type="file"]')
    await inputArchivo.setInputFiles({
      name: 'acta-responsabilidad.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 mock content'),
    })

    // Confirmar subida
    await page.getByRole('button', { name: /Subir documento/ }).click()

    // Verificar mensaje de éxito
    await expect(page.getByText(/Documento subido/)).toBeVisible()

    // Verificar que el documento aparece en el listado
    await expect(page.getByText('Acta de Responsabilidad Material 2026')).toBeVisible()
  })
})
