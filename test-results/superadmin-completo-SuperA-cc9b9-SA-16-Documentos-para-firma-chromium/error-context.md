# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: superadmin-completo.spec.ts >> SuperAdmin (root) - Todos los módulos y flujos >> SA-16 | Documentos para firma
- Location: e2e\superadmin-completo.spec.ts:161:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Documentos para firma' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Documentos para firma' }) with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Documentos para firma' })

```

```yaml
- link "Saltar al contenido principal":
  - /url: "#contenido-principal"
- navigation "Navegación principal":
  - list:
    - listitem:
      - link "Residencia CUJAE Gestión de residencia":
        - /url: /
  - text: General
  - list:
    - listitem:
      - link "Inicio":
        - /url: /
  - text: Sistema
  - list:
    - listitem:
      - link "Super Admin":
        - /url: /superadmin
  - text: Módulos
  - list:
    - listitem:
      - link "Infraestructura":
        - /url: /infraestructura
      - list:
        - listitem:
          - link "General / Resumen":
            - /url: /infraestructura
        - listitem:
          - link "Edificios":
            - /url: /infraestructura/edificios
        - listitem:
          - link "Inventario de medios":
            - /url: /infraestructura/inventario
    - listitem:
      - link "Estudiantes":
        - /url: /estudiantes
    - listitem:
      - link "Solicitudes de medios":
        - /url: /solicitudes-medios
  - list:
    - listitem:
      - button "R root Administrador"
  - button "Alternar menú lateral"
- main:
  - button "Alternar menú lateral"
  - navigation "breadcrumb":
    - list:
      - listitem:
        - link "Inicio" [disabled]
  - button "Notificaciones"
  - text: CUJAE · Residencia
  - heading "Hola, root" [level=1]
  - paragraph: Bienvenido al panel general de la residencia estudiantil. Selecciona un módulo para comenzar a trabajar.
  - heading "Accesos rápidos" [level=2]
  - paragraph: Módulos disponibles en el sistema de gestión de la residencia.
  - link "Disponible Infraestructura Consulta y administra edificios, escaleras, cuartos y su estado constructivo. Abrir módulo":
    - /url: /infraestructura
    - text: Disponible
    - heading "Infraestructura" [level=3]
    - paragraph: Consulta y administra edificios, escaleras, cuartos y su estado constructivo.
    - text: Abrir módulo
  - link "En preparación Deberes Gestiona las tareas y responsabilidades de los estudiantes de la residencia. Ver módulo":
    - /url: /deberes
    - text: En preparación
    - heading "Deberes" [level=3]
    - paragraph: Gestiona las tareas y responsabilidades de los estudiantes de la residencia.
    - text: Ver módulo
  - link "En preparación Estudiantes Consulta la información y el estado de los estudiantes residentes. Ver módulo":
    - /url: /estudiantes
    - text: En preparación
    - heading "Estudiantes" [level=3]
    - paragraph: Consulta la información y el estado de los estudiantes residentes.
    - text: Ver módulo
  - link "En preparación Evaluaciones Revisa y registra las evaluaciones realizadas a los estudiantes. Ver módulo":
    - /url: /evaluaciones
    - text: En preparación
    - heading "Evaluaciones" [level=3]
    - paragraph: Revisa y registra las evaluaciones realizadas a los estudiantes.
    - text: Ver módulo
  - link "Disponible Solicitudes de medios Aprueba o rechaza las solicitudes de medios propios de los estudiantes. Abrir módulo":
    - /url: /solicitudes-medios
    - text: Disponible
    - heading "Solicitudes de medios" [level=3]
    - paragraph: Aprueba o rechaza las solicitudes de medios propios de los estudiantes.
    - text: Abrir módulo
- region "Notifications alt+T":
  - list
- img
- img
```

# Test source

```ts
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
  126 |     await expect(page.getByRole('heading', { name: 'Edificios' })).toBeVisible()
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
> 164 |     await expect(page.getByRole('heading', { name: 'Documentos para firma' })).toBeVisible()
      |                                                                                ^ Error: expect(locator).toBeVisible() failed
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