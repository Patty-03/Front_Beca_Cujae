import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/auth'

test.describe('Admin - Infraestructura (edificios y cuartos)', () => {
  test('debe listar edificios, crear uno nuevo y verificar en el listado', async ({ page }) => {
    await loginAsAdmin(page)

    await page.goto('/infraestructura/edificios')
    await expect(page.getByRole('heading', { name: 'Gestión de edificios' })).toBeVisible()

    // KPIs de infraestructura
    await expect(page.getByText(/Edificios/)).toBeVisible()
    await expect(page.getByText(/Cuartos/)).toBeVisible()
    await expect(page.getByText(/Capacidad/)).toBeVisible()
    await expect(page.getByText(/Ocupación/)).toBeVisible()

    // Crear nuevo edificio
    await page.getByRole('button', { name: /Nuevo edificio/ }).click()
    await expect(page.getByRole('dialog').or(page.getByText(/Edificio/).first())).toBeVisible()

    await page.fill('input[id="edificio-nombre"], input[placeholder*="nombre" i]', 'Edificio Prueba E2E')
    await page.getByRole('button', { name: /Guardar|Crear|Aceptar/ }).click()

    await expect(page.getByText('Edificio Prueba E2E').or(page.getByText(/Edificio creado|Guardado/))).toBeVisible()
  })

  test('debe ver el detalle de un edificio, sus pestañas y exportar el censo', async ({ page }) => {
    await loginAsAdmin(page)

    await page.goto('/infraestructura/edificios')

    const primerEdificio = page.locator('tr, article').filter({ hasText: /Edificio/ }).first()
    if (await primerEdificio.isVisible()) {
      await primerEdificio.click()
      await expect(page.getByRole('heading', { name: /Detalle del edificio|Edificio/ })).toBeVisible()
      await expect(page.getByText(/Escaleras|Cuartos|General|Estadísticas/).first()).toBeVisible()

      // Exportar censo
      await page.getByRole('button', { name: /Exportar censo/ }).click()
      await expect(page.getByText(/Censo exportado|descargó el censo/).first()).toBeVisible()
    } else {
      await expect(page.getByText(/No se encontraron edificios|registra un nuevo edificio/).first()).toBeVisible()
    }
  })
})
