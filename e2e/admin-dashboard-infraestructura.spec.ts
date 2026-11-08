import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/auth'

test.describe('Admin - Dashboard de infraestructura', () => {
  test('debe mostrar KPIs, ocupación por edificio, donut de estado y exportar reporte', async ({ page }) => {
    await loginAsAdmin(page)

    await page.goto('/infraestructura')
    await expect(page.getByRole('heading', { name: 'Dashboard de infraestructura' })).toBeVisible()

    // KPIs
    await expect(page.getByText(/Edificios/)).toBeVisible()
    await expect(page.getByText(/Cuartos/)).toBeVisible()
    await expect(page.getByText(/Capacidad/)).toBeVisible()
    await expect(page.getByText(/Ocupación/)).toBeVisible()

    // Ocupación por edificio y estado constructivo
    await expect(page.getByText(/Ocupación por edificio|Estado constructivo/).first()).toBeVisible()

    // Cambios recientes y acciones rápidas
    await expect(page.getByText(/Cambios recientes|Acciones rápidas/).first()).toBeVisible()

    // Exportar reporte general
    await page.getByRole('button', { name: /Exportar reporte/ }).click()
    await expect(page.getByText(/Reporte exportado|Se descargó el resumen/).first()).toBeVisible()
  })
})
