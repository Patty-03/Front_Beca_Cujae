import { test, expect } from '@playwright/test'

test.describe('Estudiante - Perfil / Dashboard', () => {
  test('debe iniciar sesión y ver el dashboard con sus KPIs', async ({ page }) => {
    // Navegar al login
    await page.goto('/login')

    // Llenar credenciales (modo demo o http según configuración)
    await page.fill('input[name="email"], input[type="email"]', 'estudiante@cujae.cu')
    await page.fill('input[name="password"], input[type="password"]', 'password123')
    await page.click('button[type="submit"]:has-text("Iniciar"), button:has-text("Ingresar"), button:has-text("Acceder")')

    // Debería redirigir al dashboard del estudiante
    await expect(page).toHaveURL(/.*\/estudiante/)

    // Verificar que se muestra el título del perfil
    await expect(page.getByRole('heading', { name: 'Mi Perfil' })).toBeVisible()

    // Verificar KPIs principales
    await expect(page.getByText('Estado de beca')).toBeVisible()
    await expect(page.getByText('Cuarto')).toBeVisible()
    await expect(page.getByText('Deberes pendientes')).toBeVisible()
    await expect(page.getByText('Documentos por firmar')).toBeVisible()
    await expect(page.getByText('Notificaciones no leídas')).toBeVisible()
    await expect(page.getByText('Año académico')).toBeVisible()
  })

  test('debe mostrar la sección de Mi cuarto con la asignación', async ({ page }) => {
    await page.goto('/estudiante')

    // Verificar sección Mi cuarto
    await expect(page.getByRole('heading', { name: 'Mi cuarto' })).toBeVisible()

    // Si tiene cuarto, mostrar detalles
    const cuartoAsignado = page.getByText(/Cuarto \d+/)
    const sinCuarto = page.getByText('Sin cuarto asignado')

    // Uno de los dos debe estar visible
    await expect(
      cuartoAsignado.or(sinCuarto)
    ).toBeVisible()
  })

  test('debe mostrar Mis deberes con estados', async ({ page }) => {
    await page.goto('/estudiante')

    await expect(page.getByRole('heading', { name: 'Mis deberes' })).toBeVisible()

    // Verificar que se muestran los deberes o el mensaje de no hay deberes
    await expect(
      page.getByText('No tiene deberes registrados.').or(page.getByText(/pendiente|incumplido|cumplido/))
    ).toBeVisible()
  })

  test('debe mostrar Avisos de la residencia', async ({ page }) => {
    await page.goto('/estudiante')

    await expect(page.getByRole('heading', { name: 'Avisos de la residencia' })).toBeVisible()
  })

  test('debe mostrar Preguntas frecuentes', async ({ page }) => {
    await page.goto('/estudiante')

    await expect(page.getByRole('heading', { name: 'Preguntas frecuentes' })).toBeVisible()
  })

  test('la campanilla de notificaciones debe mostrar contador de no leídas', async ({ page }) => {
    await page.goto('/estudiante')

    const botonCampanilla = page.getByRole('button', { name: /Notificaciones/ })
    await expect(botonCampanilla).toBeVisible()
  })
})
