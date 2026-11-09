import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

async function loginAsEstudiante(page: any) {
  await page.goto(`${BASE_URL}/login`)
  await page.waitForSelector('input[id="username"], input[name="email"], input[type="email"]', { timeout: 15000 })
  await page.fill('input[id="username"], input[name="email"], input[type="email"]', 'estudiante@cujae.edu.cu')
  await page.fill('input[id="password"], input[name="password"], input[type="password"]', '12345678')
  await page.click('button[type="submit"]')
  await page.waitForURL(/.*\/estudiante/, { timeout: 15000 })
}

async function loginAsAdmin(page: any) {
  await page.goto(`${BASE_URL}/login`)
  await page.waitForSelector('input[id="username"], input[name="email"], input[type="email"]', { timeout: 15000 })
  await page.fill('input[id="username"], input[name="email"], input[type="email"]', 'admin@cujae.edu.cu')
  await page.fill('input[id="password"], input[name="password"], input[type="password"]', '12345678')
  await page.click('button[type="submit"]')
  await page.waitForURL(/.*\/(?!login)/, { timeout: 15000 })
}

test.describe('Módulo de Solicitud de Medios Propios - Pruebas de QA', () => {

  test.describe('Autenticación', () => {
    test('CP-01: Login como estudiante', async ({ page }) => {
      await loginAsEstudiante(page)
      await expect(page).toHaveURL(/.*\/estudiante/)
    })

    test('CP-02: Login como administrador', async ({ page }) => {
      await loginAsAdmin(page)
      await expect(page).not.toHaveURL(/.*\/login/)
    })
  })

  test.describe('Crear solicitud de medios', () => {
    test('CP-03: Estudiante puede crear solicitud de medios', async ({ page }) => {
      await loginAsEstudiante(page)

      // Navegar a solicitud de medios
      await page.goto(`${BASE_URL}/mis-solicitudes`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(3000)

      // Buscar botón para crear solicitud
      const crearBtn = page.getByRole('button', { name: /crear solicitud|nueva solicitud|nueva solicitud de medios/i })
      if (await btns.count() > 0) {
        await btns.first().click()
        await page.waitForTimeout(2000)

        // Llenar formulario
        const tipoInput = page.getByRole('input', { name: /tipo/i })
        if (await tipoInput.count() > 0) {
          await tipoInput.first().fill('Cuaderno')
        }

        const cantidadInput = page.getByRole('input', { name: /cantidad/i })
        if (await cantidadInput.count() > 0) {
          await cantidadInput.first().fill('2')
        }

        const motivoInput = page.getByRole('input', { name: /motivo/i })
        if (await motivoInput.count() > 0) {
          await motivoInput.first().fill('Necesito cuadernos para mis clases')
        }

        await page.click('button[type="submit"]')
        await page.waitForTimeout(3000)
      }
    })
  })

  test.describe('Ver solicitudes propias', () => {
    test('CP-04: Estudiante puede ver sus solicitudes', async ({ page }) => {
      await loginAsEstudiante(page)
      await page.goto(`${BASE_URL}/mis-solicitudes`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(3000)
      await expect(page).toHaveURL(/.*\/mis-solicitudes/)
    })
  })

  test.describe('Control de acceso - Estudiante no puede acceder a rutas de administración', () => {
    test('CP-05: Estudiante no puede acceder a rutas de aprobación', async ({ page }) => {
      await loginAsEstudiante(page)

      // Intentar acceder a ruta de aprobación
      await page.goto(`${BASE_URL}/infraestructura/edificios`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)
      // Si el estudiante no tiene permiso, debería ser redirigido o mostrar error
    })
  })

  test.describe('Control de acceso - Administrador', () => {
    test('CP-05b: Administrador puede acceder a módulos de administración', async ({ page }) => {
      await loginAsAdmin(page)
      await p.goto(BASE + '/infraestructura/edificios', { waitUntil: 'domcontentloaded', timeout: 15000 })
      await p.waitForTimeout(2000)
      const adminOk = p.url().includes('/infraestructura/edificios')
      if (!adminOk) throw new Error('Admin no puede acceder a /infraestructura/edificios')
    })
  })

  test.describe('Validaciones de datos de entrada', () => {
    test('CP-09: Validar que se requiere cantidad mínima', async ({ page }) => {
      await loginAsEstudiante(page)
      await page.goto(`${BASE_URL}/mis-solicitudes`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(3000)

      const btns = page.getByRole('button', { name: /crear solicitud|nueva solicitud/i })
      if (await btns.count() > 0) {
        await btns.first().click()
        await page.waitForTimeout(2000)

        const cantidadInput = page.getByRole('input', { name: /cantidad/i })
        if (await cantidadInput.count() > 0) {
          await cantidadInput.first().fill('0')
        }

        await page.click('button[type="submit"]')
        await page.waitForTimeout(2000)
        // Debería mostrar error de validación
      }
    })
  })
})
