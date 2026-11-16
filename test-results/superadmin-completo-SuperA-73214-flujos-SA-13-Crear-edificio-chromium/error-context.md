# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: superadmin-completo.spec.ts >> SuperAdmin (root) - Todos los módulos y flujos >> SA-13 | Crear edificio
- Location: e2e\superadmin-completo.spec.ts:130:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[placeholder="Nombre del edificio"]')

```

# Page snapshot

```yaml
- generic:
  - generic:
    - generic [aria-hidden]:
      - link:
        - /url: "#contenido-principal"
        - text: Saltar al contenido principal
      - generic:
        - navigation:
          - generic:
            - generic:
              - list:
                - listitem:
                  - link:
                    - /url: /
                    - generic:
                      - generic: Residencia CUJAE
                      - generic: Gestión de residencia
            - generic:
              - generic:
                - generic: General
                - generic:
                  - list:
                    - listitem:
                      - link:
                        - /url: /
                        - generic: Inicio
              - generic:
                - generic: Sistema
                - generic:
                  - list:
                    - listitem:
                      - link:
                        - /url: /superadmin
                        - generic: Super Admin
              - generic:
                - generic: Módulos
                - generic:
                  - list:
                    - listitem:
                      - link:
                        - /url: /infraestructura
                        - generic: Infraestructura
                      - list:
                        - listitem:
                          - link:
                            - /url: /infraestructura
                            - generic: General / Resumen
                        - listitem:
                          - link:
                            - /url: /infraestructura/edificios
                            - generic: Edificios
                        - listitem:
                          - link:
                            - /url: /infraestructura/inventario
                            - generic: Inventario de medios
                    - listitem:
                      - link:
                        - /url: /estudiantes
                        - generic: Estudiantes
                    - listitem:
                      - link:
                        - /url: /solicitudes-medios
                        - generic: Solicitudes de medios
            - generic:
              - list:
                - listitem:
                  - button:
                    - generic: R
                    - generic:
                      - generic: root
                      - generic: Administrador
            - button
      - main:
        - generic:
          - button:
            - generic: Alternar menú lateral
          - navigation:
            - list:
              - listitem:
                - link:
                  - /url: /
                  - text: Inicio
              - listitem [aria-hidden]
              - listitem:
                - link [disabled]: Edificios
          - generic:
            - button
        - generic:
          - generic:
            - generic:
              - generic:
                - heading [level=1]: Gestión de edificios
                - paragraph: Consulta y administra el inventario de infraestructura de la residencia.
              - generic:
                - button: Importar Excel
                - button: Agregar cuarto
                - button: Nuevo edificio
            - generic:
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - paragraph: Edificios
                      - paragraph: "5"
                      - paragraph: 19 escaleras
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - paragraph: Cuartos
                      - paragraph: "110"
                      - paragraph: Inventario total
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - paragraph: Capacidad
                      - paragraph: "442"
                      - paragraph: Plazas de alojamiento
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - paragraph: Ocupación
                      - paragraph: 0 %
                      - paragraph: 0 plazas ocupadas
            - generic:
              - generic:
                - generic:
                  - heading [level=2]: Criterios de Estado Constructivo de Edificios
                  - generic: Configura los porcentajes de cuartos buenos necesarios para determinar automáticamente el estado general del edificio.
                - button: Guardar criterios
              - generic:
                - generic:
                  - generic:
                    - generic: Umbral para Edificio "Bueno" (%)
                    - generic:
                      - spinbutton: "100"
                      - generic: "%"
                    - paragraph: Porcentaje de cuartos buenos requerido para que el edificio se considere 100% Bueno (por defecto 100%).
                  - generic:
                    - generic: Umbral para Edificio "Regular" (%)
                    - generic:
                      - spinbutton: "75"
                      - generic: "%"
                    - paragraph: Porcentaje mínimo de cuartos buenos para considerarse Regular; por debajo se considerará Mal estado.
            - generic:
              - generic:
                - heading [level=2]: Inventario de edificios
                - generic: Selecciona un edificio para revisar sus escaleras y cuartos.
              - generic:
                - generic:
                  - generic:
                    - textbox:
                      - /placeholder: Buscar por nombre
                  - combobox:
                    - generic: Todos los estados
                - paragraph: Mostrando 5 de 5 edificios.
                - generic:
                  - generic:
                    - generic:
                      - table:
                        - rowgroup:
                          - row:
                            - columnheader: Edificio
                            - columnheader: Estado
                            - columnheader: Escaleras
                            - columnheader: Cuartos
                            - columnheader: Ocupación
                            - columnheader: Acciones
                        - rowgroup:
                          - row:
                            - cell:
                              - link:
                                - /url: /infraestructura/edificios/1
                                - text: Edificio A
                            - cell:
                              - generic: Regular
                            - cell: "4"
                            - cell: "28"
                            - cell:
                              - generic:
                                - progressbar
                            - cell:
                              - generic:
                                - link:
                                  - /url: /infraestructura/edificios/1
                                - button
                                - button [disabled]
                          - row:
                            - cell:
                              - link:
                                - /url: /infraestructura/edificios/4
                                - text: Edificio B
                            - cell:
                              - generic: Regular
                            - cell: "3"
                            - cell: "27"
                            - cell:
                              - generic:
                                - progressbar
                            - cell:
                              - generic:
                                - link:
                                  - /url: /infraestructura/edificios/4
                                - button
                                - button [disabled]
                          - row:
                            - cell:
                              - link:
                                - /url: /infraestructura/edificios/2
                                - text: Edificio B QA Editado
                            - cell:
                              - generic: Mal estado
                            - cell: "6"
                            - cell: "1"
                            - cell:
                              - generic:
                                - progressbar
                            - cell:
                              - generic:
                                - link:
                                  - /url: /infraestructura/edificios/2
                                - button
                                - button [disabled]
                          - row:
                            - cell:
                              - link:
                                - /url: /infraestructura/edificios/5
                                - text: Edificio C
                            - cell:
                              - generic: Regular
                            - cell: "3"
                            - cell: "27"
                            - cell:
                              - generic:
                                - progressbar
                            - cell:
                              - generic:
                                - link:
                                  - /url: /infraestructura/edificios/5
                                - button
                                - button [disabled]
                          - row:
                            - cell:
                              - link:
                                - /url: /infraestructura/edificios/6
                                - text: Edificio D
                            - cell:
                              - generic: Regular
                            - cell: "3"
                            - cell: "27"
                            - cell:
                              - generic:
                                - progressbar
                            - cell:
                              - generic:
                                - link:
                                  - /url: /infraestructura/edificios/6
                                - button
                                - button [disabled]
    - region "Notifications alt+T":
      - list
  - dialog "Nuevo edificio" [ref=f1e2]:
    - generic [ref=f1e3]:
      - heading "Nuevo edificio" [level=2] [ref=f1e4]
      - paragraph [ref=f1e5]: Registra un edificio dentro del inventario de infraestructura.
    - generic [ref=f1e6]:
      - generic [ref=f1e7]:
        - generic [ref=f1e8]: Nombre
        - textbox "Nombre" [active] [ref=f1e9]:
          - /placeholder: Ej. Edificio I
      - generic [ref=f1e10]:
        - generic [ref=f1e11]:
          - generic [ref=f1e12]: Estado constructivo definitivo
          - generic [ref=f1e13] [cursor=pointer]:
            - checkbox "Fijar manualmente" [ref=f1e14]
            - text: Fijar manualmente
        - combobox "Estado constructivo definitivo" [ref=f1e15]:
          - generic: Seleccione un estado
      - generic [ref=f1e16]:
        - generic [ref=f1e17]: Observación / Justificación
        - textbox "Observación / Justificación" [ref=f1e18]:
          - /placeholder: Ej. Falla en la instalación eléctrica central...
      - generic [ref=f1e19]:
        - button "Cancelar" [ref=f1e20]
        - button "Registrar edificio" [ref=f1e21]
    - button "Cerrar" [ref=f1e22]
```

# Test source

```ts
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
  126 |     await expect(page.getByRole('heading', { name: 'Edificios' })).toBeVisible()
  127 |     await page.screenshot({ path: 'test-results/sa-12-listar-edificios.png', fullPage: true })
  128 |   })
  129 | 
  130 |   test('SA-13 | Crear edificio', async ({ page }) => {
  131 |     await loginAsRoot(page)
  132 |     await page.goto('/infraestructura/edificios')
  133 |     await page.getByRole('button', { name: /Nuevo edificio/ }).click()
  134 |     await expect(page.getByRole('dialog').or(page.getByText(/Editar edificio|Crear edificio/)).first()).toBeVisible()
> 135 |     await page.fill('input[placeholder="Nombre del edificio"]', 'Edificio QA SuperAdmin')
      |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
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