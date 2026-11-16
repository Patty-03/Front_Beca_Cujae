import { test, expect } from '@playwright/test'

const ROOT_USER = 'root'
const ROOT_PASS = 'CAMBIAR_ESTA_CONTRASENA'

async function loginAsRoot(page) {
  await page.goto('/login')
  await page.fill('input[id="username"]', ROOT_USER)
  await page.fill('input[id="password"]', ROOT_PASS)
  await page.click('button[type="submit"]')
  await expect(page).not.toHaveURL(/.*\/login/)
}

test.describe('SuperAdmin (root) - Todos los módulos y flujos', () => {

  // ==================== SEGURIDAD - USUARIOS ====================
  test('SA-01 | Listar usuarios del personal', async ({ page }) => {
    await loginAsRoot(page)
    await page.goto('/superadmin')
    await expect(page.getByRole('heading', { name: 'Super Admin' })).toBeVisible()
    await expect(page.getByText(/Usuarios|Nombre|Correo|Rol|Estado/).first()).toBeVisible()
    await page.screenshot({ path: 'test-results/sa-01-listar-usuarios.png', fullPage: true })
  })

  test('SA-02 | Crear usuario del personal', async ({ page }) => {
    await loginAsRoot(page)
    await page.goto('/superadmin')
    await page.getByRole('button', { name: /Nuevo usuario/ }).click()
    await expect(page.getByRole('dialog').or(page.getByText(/Editar usuario|Crear usuario/)).first()).toBeVisible()
    await page.fill('input[placeholder="Nombre completo"]', 'Usuario SuperAdmin QA')
    await page.fill('input[type="email"]', 'superadmin-qa@cujae.edu.cu')
    await page.getByRole('button', { name: /Crear usuario|Guardar cambios/ }).click()
    await expect(page.getByText('superadmin-qa@cujae.edu.cu').or(page.getByText(/Usuario creado/))).toBeVisible()
    await page.screenshot({ path: 'test-results/sa-02-crear-usuario.png', fullPage: true })
  })

  test('SA-03 | Asignar roles a usuario', async ({ page }) => {
    await loginAsRoot(page)
    await page.goto('/superadmin')
    const rolSelect = page.locator('select').first()
    if (await rolSelect.isVisible()) {
      await rolSelect.selectOption({ label: /administrador|operador|estudiante/ })
    }
    await page.screenshot({ path: 'test-results/sa-03-asignar-roles.png', fullPage: true })
  })

  test('SA-04 | Desactivar usuario', async ({ page }) => {
    await loginAsRoot(page)
    await page.goto('/superadmin')
    await page.getByRole('button', { name: /Eliminar/ }).last().click()
    await page.getByRole('button', { name: /Eliminar|Aceptar/ }).click()
    await expect(page.getByText(/Usuario eliminado/).or(page.getByText(/superadmin-qa@cujae.edu.cu/).not())).toBeVisible()
    await page.screenshot({ path: 'test-results/sa-04-desactivar-usuario.png', fullPage: true })
  })

  // ==================== SEGURIDAD - ROLES Y PERMISOS ====================
  test('SA-05 | Listar roles y permisos', async ({ page }) => {
    await loginAsRoot(page)
    await page.goto('/superadmin')
    await expect(page.getByText(/Roles y permisos/)).toBeVisible()
    await expect(page.getByText(/Estudiante de pregrado|Operador de infraestructura|Administrador/).first()).toBeVisible()
    await page.screenshot({ path: 'test-results/sa-05-roles-permisos.png', fullPage: true })
  })

  test('SA-06 | Crear rol', async ({ page }) => {
    await loginAsRoot(page)
    await page.goto('/superadmin')
    await page.getByRole('button', { name: /Nuevo rol|Crear rol/ }).first().click()
    await expect(page.getByRole('dialog').or(page.getByText(/Editar rol|Crear rol/)).first()).toBeVisible()
    await page.fill('input[placeholder="Nombre del rol"]', 'Rol QA SuperAdmin')
    await page.getByRole('button', { name: /Crear rol|Guardar/ }).click()
    await expect(page.getByText(/Rol QA SuperAdmin/).or(page.getByText(/Rol creado/))).toBeVisible()
    await page.screenshot({ path: 'test-results/sa-06-crear-rol.png', fullPage: true })
  })

  test('SA-07 | Asignar permisos a rol', async ({ page }) => {
    await loginAsRoot(page)
    await page.goto('/superadmin')
    await page.getByRole('button', { name: /Gestionar permisos|Permisos/ }).first().click()
    await expect(page.getByRole('dialog').or(page.getByText(/Permisos del rol/)).first()).toBeVisible()
    await page.screenshot({ path: 'test-results/sa-07-asignar-permisos.png', fullPage: true })
  })

  // ==================== ESTUDIANTES ====================
  test('SA-08 | Listar estudiantes', async ({ page }) => {
    await loginAsRoot(page)
    await page.goto('/estudiantes')
    await expect(page.getByRole('heading', { name: 'Estudiantes' })).toBeVisible()
    await expect(page.getByText(/Matrícula/)).toBeVisible()
    await page.fill('input[placeholder="Buscar estudiante..."]', 'Juan')
    await expect(page.getByText(/Mostrando/)).toBeVisible()
    await page.click('button:has-text("Limpiar filtros")')
    await page.screenshot({ path: 'test-results/sa-08-listar-estudiantes.png', fullPage: true })
  })

  test('SA-09 | Ver detalle de estudiante', async ({ page }) => {
    await loginAsRoot(page)
    await page.goto('/estudiantes')
    const detalleBtn = page.getByRole('button', { name: /Ver detalle|Detalle/ }).first()
    if (await detalleBtn.isVisible()) {
      await detalleBtn.click()
      await expect(page.getByText(/Mis datos|Carnet|Carrera|Estado de beca/).first()).toBeVisible()
    }
    await page.screenshot({ path: 'test-results/sa-09-detalle-estudiante.png', fullPage: true })
  })

  test('SA-10 | Importar estudiantes desde XLSX', async ({ page }) => {
    await loginAsRoot(page)
    await page.goto('/estudiantes')
    await page.getByRole('button', { name: /Importar estudiantes/ }).click()
    await expect(page.getByRole('dialog').or(page.getByText(/Importar/)).first()).toBeVisible()
    await page.screenshot({ path: 'test-results/sa-10-importar-estudiantes.png', fullPage: true })
  })

  // ==================== INFRAESTRUCTURA - EDIFICIOS ====================
  test('SA-11 | Dashboard de infraestructura', async ({ page }) => {
    await loginAsRoot(page)
    await page.goto('/infraestructura')
    await expect(page.getByRole('heading', { name: 'Infraestructura' })).toBeVisible()
    await page.screenshot({ path: 'test-results/sa-11-dashboard-infraestructura.png', fullPage: true })
  })

  test('SA-12 | Listar edificios', async ({ page }) => {
    await loginAsRoot(page)
    await page.goto('/infraestructura/edificios')
    await expect(page.getByRole('heading', { name: 'Edificios' })).toBeVisible()
    await page.screenshot({ path: 'test-results/sa-12-listar-edificios.png', fullPage: true })
  })

  test('SA-13 | Crear edificio', async ({ page }) => {
    await loginAsRoot(page)
    await page.goto('/infraestructura/edificios')
    await page.getByRole('button', { name: /Nuevo edificio/ }).click()
    await expect(page.getByRole('dialog').or(page.getByText(/Editar edificio|Crear edificio/)).first()).toBeVisible()
    await page.fill('input[placeholder="Nombre del edificio"]', 'Edificio QA SuperAdmin')
    await page.getByRole('button', { name: /Crear edificio|Guardar/ }).click()
    await expect(page.getByText(/Edificio QA SuperAdmin/).or(page.getByText(/Edificio creado/))).toBeVisible()
    await page.screenshot({ path: 'test-results/sa-13-crear-edificio.png', fullPage: true })
  })

  test('SA-14 | Ver detalle de edificio', async ({ page }) => {
    await loginAsRoot(page)
    await page.goto('/infraestructura/edificios')
    const detalleBtn = page.getByRole('button', { name: /Ver detalle|Detalle/ }).first()
    if (await detalleBtn.isVisible()) {
      await detalleBtn.click()
      await expect(page.getByText(/Edificio|Cuartos|Escaleras/).first()).toBeVisible()
    }
    await page.screenshot({ path: 'test-results/sa-14-detalle-edificio.png', fullPage: true })
  })

  // ==================== INFRAESTRUCTURA - MEDIOS ====================
  test('SA-15 | Inventario de medios', async ({ page }) => {
    await loginAsRoot(page)
    await page.goto('/infraestructura/inventario')
    await expect(page.getByRole('heading', { name: 'Inventario de medios' })).toBeVisible()
    await page.screenshot({ path: 'test-results/sa-15-inventario-medios.png', fullPage: true })
  })

  // ==================== DOCUMENTOS ====================
  test('SA-16 | Documentos para firma', async ({ page }) => {
    await loginAsRoot(page)
    await page.goto('/documentos-admin')
    await expect(page.getByRole('heading', { name: 'Documentos para firma' })).toBeVisible()
    await page.screenshot({ path: 'test-results/sa-16-documentos-admin.png', fullPage: true })
  })

  // ==================== DEBERES ====================
  test('SA-17 | Módulo de deberes', async ({ page }) => {
    await loginAsRoot(page)
    await page.goto('/deberes')
    await expect(page.getByText(/Deberes/).first()).toBeVisible()
    await page.screenshot({ path: 'test-results/sa-17-modulo-deberes.png', fullPage: true })
  })

  // ==================== INICIO / HOME ====================
  test('SA-18 | Página de inicio', async ({ page }) => {
    await loginAsRoot(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible()
    await page.screenshot({ path: 'test-results/sa-18-pagina-inicio.png', fullPage: true })
  })

  // ==================== LOGOUT ====================
  test('SA-19 | Cerrar sesión', async ({ page }) => {
    await loginAsRoot(page)
    await page.getByRole('button', { name: /Cerrar sesi|Logout|Salir/ }).first().click()
    await expect(page).toHaveURL(/.*\/login/)
    await page.screenshot({ path: 'test-results/sa-19-cerrar-sesion.png', fullPage: true })
  })

})
