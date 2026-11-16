# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: superadmin-completo.spec.ts >> SuperAdmin (root) - Todos los módulos y flujos >> SA-02 | Crear usuario del personal
- Location: e2e\superadmin-completo.spec.ts:25:3

# Error details

```
Error: expect(page).not.toHaveURL(expected) failed

Expected pattern: not /.*\/login/
Received string: "http://localhost:5173/login"
Timeout: 5000ms

Call log:
  - Expect "not toHaveURL" with timeout 5000ms
    12 × locator resolved to <html lang="es">…</html>
       - unexpected value "http://localhost:5173/login"

```

```yaml
- banner: CUJAE Residencia
- main:
  - heading "Inicio de Sesión" [level=1]
  - paragraph: Sistema de Gestión de Residencia Estudiantil
  - text: Usuario
  - textbox "Usuario": root
  - text: Contraseña
  - textbox "Contraseña":
    - /placeholder: ••••••••••••
    - text: CAMBIAR_ESTA_CONTRASENA
  - button "Mostrar contraseña"
  - checkbox "Mantener sesión iniciada"
  - text: Mantener sesión iniciada
  - button "INICIANDO…" [disabled]
- region "Notifications alt+T":
  - list
- img
- img
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | const ROOT_USER = 'root'
  4   | const ROOT_PASS = 'CAMBIAR_ESTA_CONTRASENA'
  5   | 
  6   | async function loginAsRoot(page) {
  7   |   await page.goto('/login')
  8   |   await page.fill('input[id="username"]', ROOT_USER)
  9   |   await page.fill('input[id="password"]', ROOT_PASS)
  10  |   await page.click('button[type="submit"]')
> 11  |   await expect(page).not.toHaveURL(/.*\/login/)
      |                          ^ Error: expect(page).not.toHaveURL(expected) failed
  12  | }
  13  | 
  14  | test.describe('SuperAdmin (root) - Todos los módulos y flujos', () => {
  15  | 
  16  |   // ==================== SEGURIDAD - USUARIOS ====================
  17  |   test('SA-01 | Listar usuarios del personal', async ({ page }) => {
  18  |     await loginAsRoot(page)
  19  |     await page.goto('/superadmin')
  20  |     await expect(page.getByRole('heading', { name: 'Super Admin' })).toBeVisible()
  21  |     await expect(page.getByText(/Usuarios|Nombre|Correo|Rol|Estado/).first()).toBeVisible()
  22  |     await page.screenshot({ path: 'test-results/sa-01-listar-usuarios.png', fullPage: true })
  23  |   })
  24  | 
  25  |   test('SA-02 | Crear usuario del personal', async ({ page }) => {
  26  |     await loginAsRoot(page)
  27  |     await page.goto('/superadmin')
  28  |     await page.getByRole('button', { name: /Nuevo usuario/ }).click()
  29  |     await expect(page.getByRole('dialog').or(page.getByText(/Editar usuario|Crear usuario/)).first()).toBeVisible()
  30  |     await page.fill('input[placeholder="Nombre completo"]', 'Usuario SuperAdmin QA')
  31  |     await page.fill('input[type="email"]', 'superadmin-qa@cujae.edu.cu')
  32  |     await page.getByRole('button', { name: /Crear usuario|Guardar cambios/ }).click()
  33  |     await expect(page.getByText('superadmin-qa@cujae.edu.cu').or(page.getByText(/Usuario creado/))).toBeVisible()
  34  |     await page.screenshot({ path: 'test-results/sa-02-crear-usuario.png', fullPage: true })
  35  |   })
  36  | 
  37  |   test('SA-03 | Asignar roles a usuario', async ({ page }) => {
  38  |     await loginAsRoot(page)
  39  |     await page.goto('/superadmin')
  40  |     const rolSelect = page.locator('select').first()
  41  |     if (await rolSelect.isVisible()) {
  42  |       await rolSelect.selectOption({ label: /administrador|operador|estudiante/ })
  43  |     }
  44  |     await page.screenshot({ path: 'test-results/sa-03-asignar-roles.png', fullPage: true })
  45  |   })
  46  | 
  47  |   test('SA-04 | Desactivar usuario', async ({ page }) => {
  48  |     await loginAsRoot(page)
  49  |     await page.goto('/superadmin')
  50  |     await page.getByRole('button', { name: /Eliminar/ }).last().click()
  51  |     await page.getByRole('button', { name: /Eliminar|Aceptar/ }).click()
  52  |     await expect(page.getByText(/Usuario eliminado/).or(page.getByText(/superadmin-qa@cujae.edu.cu/).not())).toBeVisible()
  53  |     await page.screenshot({ path: 'test-results/sa-04-desactivar-usuario.png', fullPage: true })
  54  |   })
  55  | 
  56  |   // ==================== SEGURIDAD - ROLES Y PERMISOS ====================
  57  |   test('SA-05 | Listar roles y permisos', async ({ page }) => {
  58  |     await loginAsRoot(page)
  59  |     await page.goto('/superadmin')
  60  |     await expect(page.getByText(/Roles y permisos/)).toBeVisible()
  61  |     await expect(page.getByText(/Estudiante de pregrado|Operador de infraestructura|Administrador/).first()).toBeVisible()
  62  |     await page.screenshot({ path: 'test-results/sa-05-roles-permisos.png', fullPage: true })
  63  |   })
  64  | 
  65  |   test('SA-06 | Crear rol', async ({ page }) => {
  66  |     await loginAsRoot(page)
  67  |     await page.goto('/superadmin')
  68  |     await page.getByRole('button', { name: /Nuevo rol|Crear rol/ }).first().click()
  69  |     await expect(page.getByRole('dialog').or(page.getByText(/Editar rol|Crear rol/)).first()).toBeVisible()
  70  |     await page.fill('input[placeholder="Nombre del rol"]', 'Rol QA SuperAdmin')
  71  |     await page.getByRole('button', { name: /Crear rol|Guardar/ }).click()
  72  |     await expect(page.getByText(/Rol QA SuperAdmin/).or(page.getByText(/Rol creado/))).toBeVisible()
  73  |     await page.screenshot({ path: 'test-results/sa-06-crear-rol.png', fullPage: true })
  74  |   })
  75  | 
  76  |   test('SA-07 | Asignar permisos a rol', async ({ page }) => {
  77  |     await loginAsRoot(page)
  78  |     await page.goto('/superadmin')
  79  |     await page.getByRole('button', { name: /Gestionar permisos|Permisos/ }).first().click()
  80  |     await expect(page.getByRole('dialog').or(page.getByText(/Permisos del rol/)).first()).toBeVisible()
  81  |     await page.screenshot({ path: 'test-results/sa-07-asignar-permisos.png', fullPage: true })
  82  |   })
  83  | 
  84  |   // ==================== ESTUDIANTES ====================
  85  |   test('SA-08 | Listar estudiantes', async ({ page }) => {
  86  |     await loginAsRoot(page)
  87  |     await page.goto('/estudiantes')
  88  |     await expect(page.getByRole('heading', { name: 'Estudiantes' })).toBeVisible()
  89  |     await expect(page.getByText(/Matrícula/)).toBeVisible()
  90  |     await page.fill('input[placeholder="Buscar estudiante..."]', 'Juan')
  91  |     await expect(page.getByText(/Mostrando/)).toBeVisible()
  92  |     await page.click('button:has-text("Limpiar filtros")')
  93  |     await page.screenshot({ path: 'test-results/sa-08-listar-estudiantes.png', fullPage: true })
  94  |   })
  95  | 
  96  |   test('SA-09 | Ver detalle de estudiante', async ({ page }) => {
  97  |     await loginAsRoot(page)
  98  |     await page.goto('/estudiantes')
  99  |     const detalleBtn = page.getByRole('button', { name: /Ver detalle|Detalle/ }).first()
  100 |     if (await detalleBtn.isVisible()) {
  101 |       await detalleBtn.click()
  102 |       await expect(page.getByText(/Mis datos|Carnet|Carrera|Estado de beca/).first()).toBeVisible()
  103 |     }
  104 |     await page.screenshot({ path: 'test-results/sa-09-detalle-estudiante.png', fullPage: true })
  105 |   })
  106 | 
  107 |   test('SA-10 | Importar estudiantes desde XLSX', async ({ page }) => {
  108 |     await loginAsRoot(page)
  109 |     await page.goto('/estudiantes')
  110 |     await page.getByRole('button', { name: /Importar estudiantes/ }).click()
  111 |     await expect(page.getByRole('dialog').or(page.getByText(/Importar/)).first()).toBeVisible()
```