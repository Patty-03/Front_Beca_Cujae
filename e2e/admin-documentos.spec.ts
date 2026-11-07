import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/auth'

test.describe('Admin - Documentos para firma', () => {
  test('debe listar documentos, subir uno nuevo y verificar que aparece', async ({ page }) => {
    await loginAsAdmin(page)

    await page.goto('/documentos-admin')
    await expect(page.getByRole('heading', { name: 'Documentos para firma' })).toBeVisible()

    // Ver tarjetas de resumen
    await expect(page.getByText(/Total documentos/)).toBeVisible()
    await expect(page.getByText(/Firmados/)).toBeVisible()
    await expect(page.getByText(/Pendientes de firma/)).toBeVisible()

    // Abrir dialog de subida
    await page.getByRole('button', { name: /Subir documento/ }).click()
    await expect(page.getByRole('heading', { name: 'Subir documento para firma' })).toBeVisible()

    // Seleccionar tipo de documento
    await page.selectOption('select', { label: 'Acta de Responsabilidad Material' })

    // Llenar nombre
    await page.fill('input[id="documento-nombre"]', 'Acta de Responsabilidad Material 2026')

    // Seleccionar archivo PDF mock
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
