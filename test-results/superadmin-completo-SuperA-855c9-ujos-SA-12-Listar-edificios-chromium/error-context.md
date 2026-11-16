# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: superadmin-completo.spec.ts >> SuperAdmin (root) - Todos los módulos y flujos >> SA-12 | Listar edificios
- Location: e2e\superadmin-completo.spec.ts:123:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Edificios' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Edificios' }) with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Edificios' })

```

```yaml
- region "Notifications alt+T":
  - list
- img
- img
```

# Test source

```ts
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
  112 |     await page.screenshot({ path: 'test-results/sa-10-importar-estudiantes.png', fullPage: true })
  113 |   })
  114 | 
  115 |   // ==================== INFRAESTRUCTURA - EDIFICIOS ====================
  116 |   test('SA-11 | Dashboard de infraestructura', async ({ page }) => {
  117 |     await loginAsRoot(page)
  118 |     await page.goto('/infraestructura')
  119 |     await expect(page.getByRole('heading', { name: 'Infraestructura' })).toBeVisible()
  120 |     await page.screenshot({ path: 'test-results/sa-11-dashboard-infraestructura.png', fullPage: true })
  121 |   })
  122 | 
  123 |   test('SA-12 | Listar edificios', async ({ page }) => {
  124 |     await loginAsRoot(page)
  125 |     await page.goto('/infraestructura/edificios')
> 126 |     await expect(page.getByRole('heading', { name: 'Edificios' })).toBeVisible()
      |                                                                    ^ Error: expect(locator).toBeVisible() failed
  127 |     await page.screenshot({ path: 'test-results/sa-12-listar-edificios.png', fullPage: true })
  128 |   })
  129 | 
  130 |   test('SA-13 | Crear edificio', async ({ page }) => {
  131 |     await loginAsRoot(page)
  132 |     await page.goto('/infraestructura/edificios')
  133 |     await page.getByRole('button', { name: /Nuevo edificio/ }).click()
  134 |     await expect(page.getByRole('dialog').or(page.getByText(/Editar edificio|Crear edificio/)).first()).toBeVisible()
  135 |     await page.fill('input[placeholder="Nombre del edificio"]', 'Edificio QA SuperAdmin')
  136 |     await page.getByRole('button', { name: /Crear edificio|Guardar/ }).click()
  137 |     await expect(page.getByText(/Edificio QA SuperAdmin/).or(page.getByText(/Edificio creado/))).toBeVisible()
  138 |     await page.screenshot({ path: 'test-results/sa-13-crear-edificio.png', fullPage: true })
  139 |   })
  140 | 
  141 |   test('SA-14 | Ver detalle de edificio', async ({ page }) => {
  142 |     await loginAsRoot(page)
  143 |     await page.goto('/infraestructura/edificios')
  144 |     const detalleBtn = page.getByRole('button', { name: /Ver detalle|Detalle/ }).first()
  145 |     if (await detalleBtn.isVisible()) {
  146 |       await detalleBtn.click()
  147 |       await expect(page.getByText(/Edificio|Cuartos|Escaleras/).first()).toBeVisible()
  148 |     }
  149 |     await page.screenshot({ path: 'test-results/sa-14-detalle-edificio.png', fullPage: true })
  150 |   })
  151 | 
  152 |   // ==================== INFRAESTRUCTURA - MEDIOS ====================
  153 |   test('SA-15 | Inventario de medios', async ({ page }) => {
  154 |     await loginAsRoot(page)
  155 |     await page.goto('/infraestructura/inventario')
  156 |     await expect(page.getByRole('heading', { name: 'Inventario de medios' })).toBeVisible()
  157 |     await page.screenshot({ path: 'test-results/sa-15-inventario-medios.png', fullPage: true })
  158 |   })
  159 | 
  160 |   // ==================== DOCUMENTOS ====================
  161 |   test('SA-16 | Documentos para firma', async ({ page }) => {
  162 |     await loginAsRoot(page)
  163 |     await page.goto('/documentos-admin')
  164 |     await expect(page.getByRole('heading', { name: 'Documentos para firma' })).toBeVisible()
  165 |     await page.screenshot({ path: 'test-results/sa-16-documentos-admin.png', fullPage: true })
  166 |   })
  167 | 
  168 |   // ==================== DEBERES ====================
  169 |   test('SA-17 | Módulo de deberes', async ({ page }) => {
  170 |     await loginAsRoot(page)
  171 |     await page.goto('/deberes')
  172 |     await expect(page.getByText(/Deberes/).first()).toBeVisible()
  173 |     await page.screenshot({ path: 'test-results/sa-17-modulo-deberes.png', fullPage: true })
  174 |   })
  175 | 
  176 |   // ==================== INICIO / HOME ====================
  177 |   test('SA-18 | Página de inicio', async ({ page }) => {
  178 |     await loginAsRoot(page)
  179 |     await page.goto('/')
  180 |     await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible()
  181 |     await page.screenshot({ path: 'test-results/sa-18-pagina-inicio.png', fullPage: true })
  182 |   })
  183 | 
  184 |   // ==================== LOGOUT ====================
  185 |   test('SA-19 | Cerrar sesión', async ({ page }) => {
  186 |     await loginAsRoot(page)
  187 |     await page.getByRole('button', { name: /Cerrar sesi|Logout|Salir/ }).first().click()
  188 |     await expect(page).toHaveURL(/.*\/login/)
  189 |     await page.screenshot({ path: 'test-results/sa-19-cerrar-sesion.png', fullPage: true })
  190 |   })
  191 | 
  192 | })
  193 | 
```