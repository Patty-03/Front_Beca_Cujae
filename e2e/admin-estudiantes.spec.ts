import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/auth'

test.describe('Admin - Estudiantes', () => {
  test('debe listar estudiantes, aplicar filtros y ver el resumen de KPIs', async ({ page }) => {
    await loginAsAdmin(page)

    await page.goto('/estudiantes')
    await expect(page.getByRole('heading', { name: 'Estudiantes' })).toBeVisible()

    // KPIs
    await expect(page.getByText(/Matrícula/)).toBeVisible()
    await expect(page.getByText(/Con cuarto/)).toBeVisible()
    await expect(page.getByText(/Sin cuarto/)).toBeVisible()
    await expect(page.getByText(/Deberes pendientes/)).toBeVisible()

    // Buscar por nombre
    await page.fill('input[placeholder="Buscar estudiante..."]', 'Juan')
    await expect(page.getByText(/Mostrando/)).toBeVisible()

    // Limpiar filtros
    await page.click('button:has-text("Limpiar filtros")')
  })

  test('debe abrir el detalle de un estudiante y mostrar su ficha', async ({ page }) => {
    await loginAsAdmin(page)

    await page.goto('/estudiantes')

    // Abrir detalle del primer estudiante si existe
    const detalleBtn = page.getByRole('button', { name: /Ver detalle|Detalle/ }).first()
    if (await detalleBtn.isVisible()) {
      await detalleBtn.click()
      await expect(page.getByText(/Mis datos|Carnet|Carrera|Estado de beca/).first()).toBeVisible()
    } else {
      // Si no hay estudiantes, verificar mensaje vacío o botón importar
      await expect(
        page.getByText(/No hay estudiantes registrados/).or(page.getByRole('button', { name: /Importar estudiantes/ }))
      ).toBeVisible()
    }
  })

  test('debe importar estudiantes desde un archivo XLSX', async ({ page }) => {
    await loginAsAdmin(page)

    await page.goto('/estudiantes')

    await page.getByRole('button', { name: /Importar estudiantes/ }).click()
    await expect(page.getByRole('dialog').or(page.getByText(/Importar/)).first()).toBeVisible()

    const inputArchivo = page.locator('input[type="file"]').first()
    await inputArchivo.setInputFiles({
      name: 'estudiantes-import.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('mock xlsx content'),
    })

    await page.getByRole('button', { name: /Importar|Confirmar|Aceptar/ }).click()
    await expect(page.getByText(/Listado actualizado|estudiantes nuevos/).first()).toBeVisible()
  })
})
