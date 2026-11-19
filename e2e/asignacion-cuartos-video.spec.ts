import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

test.use({ viewport: { width: 1280, height: 720 } })

test('video: asignación de cuartos como root', async ({ page }) => {
  test.setTimeout(300_000)

  // 1) Login
  await login(page, 'root', 'CAMBIAR_ESTA_CONTRASENA')
  await expect(page).not.toHaveURL(/\/login/)
  await page.waitForTimeout(1500)

  // 2) Ir a Asignación de cuartos
  await page.goto('/asignacion-cuartos')
  await expect(page.getByRole('heading', { name: 'Asignación de cuartos' })).toBeVisible({ timeout: 15000 })
  await page.waitForTimeout(2000)

  // 3) Mostrar filtros/búsqueda brevemente
  const buscar = page.getByPlaceholder('Buscar por nombre')
  if (await buscar.isVisible().catch(() => false)) {
    await buscar.click()
    await page.waitForTimeout(800)
  }

  // 4) Intentar abrir un proceso existente; si no hay, abrir diálogo nuevo
  const filaProceso = page.locator('tbody tr.cursor-pointer').first()
  const hayProcesos = await filaProceso.isVisible().catch(() => false)

  if (!hayProcesos) {
    const btnNuevo = page.getByRole('button', { name: /Nuevo proceso/i })
    if (await btnNuevo.isVisible().catch(() => false)) {
      await btnNuevo.click()
      await page.waitForTimeout(2000)
      // cerrar diálogo si se abrió
      await page.keyboard.press('Escape')
      await page.waitForTimeout(1000)
    }
  } else {
    await filaProceso.click()
    await expect(page.getByText(/Proceso de asignación|Configurar|Ejecutar|Revisar|Confirmar/).first()).toBeVisible({ timeout: 15000 })
    await page.waitForTimeout(2000)

    // 5) Recorrer pestañas
    const tabs = [
      { name: /Configurar/i, key: 'configurar' },
      { name: /Ejecutar/i, key: 'ejecutar' },
      { name: /Revisar/i, key: 'revisar' },
      { name: /Confirmar/i, key: 'confirmar' },
    ]

    for (const tab of tabs) {
      const trigger = page.getByRole('tab', { name: tab.name })
      if (await trigger.isVisible().catch(() => false)) {
        await trigger.click()
        await page.waitForTimeout(2500)
        // scroll suave para mostrar contenido
        await page.mouse.wheel(0, 300)
        await page.waitForTimeout(1200)
        await page.mouse.wheel(0, -300)
        await page.waitForTimeout(800)
      }
    }

    // 6) Volver al listado
    const volver = page.getByRole('button', { name: /Volver a asignación de cuartos/i })
    if (await volver.isVisible().catch(() => false)) {
      await volver.click()
      await expect(page.getByRole('heading', { name: 'Asignación de cuartos' })).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(1500)
    }
  }

  // 7) Pausa final para que el video capture el estado
  await page.waitForTimeout(2000)
})
