# Manual de Usuario - Estudiante (Becado de la Residencia CUJAE)

## 1. Acceso al sistema

1. Abre el navegador y dirígete a la URL del frontend (por ejemplo, `http://localhost:5173`).
2. En la pantalla de inicio de sesión, ingresa tu **correo electrónico institucional** y tu **contraseña**.
3. Haz clic en **Iniciar sesión**.
4. Serás redirigido automáticamente a **Mi Perfil** (dashboard personal).

> **Nota:** Si el backend no está disponible, el login puede demorar hasta 10 segundos antes de mostrar un error de conexión. Asegúrate de que el servidor FastAPI esté ejecutándose en `http://localhost:8000`.

---

## 2. Mi Perfil (Dashboard)

Al entrar, verás una tarjeta con tus **indicadores clave (KPIs)** en la parte superior:

| Indicador | Qué muestra |
|-----------|-------------|
| **Estado de beca** | Activo, Condicional o Baja |
| **Cuarto** | Nombre del cuarto y edificio asignado (o "Sin cuarto") |
| **Deberes pendientes** | Cantidad de deberes sin cumplir |
| **Documentos por firmar** | Cuántos documentos esperan tu firma digital |
| **Notificaciones no leídas** | Alertas personales sin leer |
| **Año académico** | Tu año actual y carrera |

---

## 3. Mis datos

Muestra tu información personal y académica:
- Nombre, carnet, sexo, año académico
- Carrera y especialidad
- Facultad, grupo, tipo de ingreso, teléfono
- Provincia y municipio
- Fecha de ingreso
- Estado de beca (con badge de color)

---

## 4. Mi cuarto

Muestra tu asignación de alojamiento:
- **Número de cuarto** y **edificio**
- **Escalera** y fecha desde la que tienes la asignación
- **Taquilla** (si aplica)
- Estado de **llave del cuarto** y **llave de la taquilla** (entregada / pendiente)

Si no tienes cuarto asignado, se mostrará un aviso indicando que debes contactar a la administración de la residencia.

---

## 5. Mis deberes

Lista de responsabilidades asignadas:
- Tipo de deber (Guardia, Limpieza de áreas verdes, etc.)
- Descripción y fecha
- Turno (para guardias)
- Estado: **Pendiente**, **Cumplido** o **Incumplido** (con badge de color)

---

## 6. Firmar documentos (Acta y Convenio)

Desde la sección **Mis documentos**, puedes firmar digitalmente los documentos que requieran tu firma:

### Pasos para firmar un documento:

1. Busca el documento en la lista (por ejemplo: *Acta de Responsabilidad Material* o *Convenio de Alojamiento*).
2. Si el documento **no está firmado**, verás un botón **Firmar**.
3. Haz clic en **Firmar**. Se abrirá un diálogo de confirmación.
4. Lee la información del documento y haz clic en **Firmar digitalmente**.
5. El sistema registrará tu firma con la fecha y hora actual.
6. El documento pasará a estado **Firmado** y el botón cambiará a **Descargar**.

### Documentos disponibles para firmar:

- **Convenio de Alojamiento**
- **Boleta de la Facultad**
- **Tarjeta de Caracterización del Becado**
- **Acta de Responsabilidad Material**

---

## 7. Descargar documentos firmados

Una vez que un documento está firmado:
1. En la sección **Mis documentos**, busca el documento con estado **Firmado**.
2. Haz clic en el botón **Descargar**.
3. El archivo se descargará a tu computadora.

---

## 8. Notificaciones

En la parte superior derecha del dashboard hay un icono de **campanilla** 🔔.

- Si tienes notificaciones sin leer, aparecerá un contador rojo con el número.
- Haz clic en la campanilla para ver las notificaciones recientes.
- Las notificaciones nuevas se muestran con una etiqueta "Nuevo".
- Al hacer clic en una notificación, se marca como leída automáticamente.

---

## 9. Avisos de la residencia

Sección con comunicados importantes para todos los becados (inspecciones, plan de limpieza, inicio de curso, etc.). Cada aviso muestra:
- Título y contenido
- Fecha de publicación
- Prioridad (Baja, Media, Alta)

---

## 10. Preguntas frecuentes

Respuestas a las dudas más comunes sobre alojamiento, beca, deberes y documentos.

---

## 11. Cerrar sesión

Para cerrar sesión, usa el botón de salida en el menú de navegación o la barra superior de la aplicación.

---

## Soporte

Si tienes problemas para iniciar sesión o acceder a tu perfil, contacta a la administración de la residencia CUJAE.

---

# Manual de Usuario - Administrador (Subida de documentos para firma)

## 1. Acceso

El administrador debe iniciar sesión con credenciales que tengan el permiso `documentos:manage` (rol **Administrador**).

---

## 2. Subir un documento para firma

1. Desde el menú de navegación, accede a **Documentos para firma** (ruta `/documentos-admin`).
2. Verás el listado de documentos ya subidos con su estado (Firmado / Pendiente de firma).
3. Haz clic en el botón **Subir documento**.
4. Se abrirá un diálogo con los siguientes campos:

| Campo | Descripción |
|-------|-------------|
| **Tipo de documento** | Selecciona: *Convenio de Alojamiento* o *Acta de Responsabilidad Material* |
| **Nombre** | Nombre descriptivo del documento (obligatorio) |
| **Descripción** | Breve descripción del contenido |
| **Archivo** | Sube un archivo PDF, DOC o DOCX (obligatorio) |

5. Haz clic en **Subir documento**.
6. El sistema mostrará un mensaje de éxito y el documento aparecerá en el listado con estado **Pendiente de firma**.

---

## 3. Ver estado de firmas

Desde la vista **Documentos para firma**, puedes ver:
- Total de documentos subidos
- Cuántos ya fueron firmados por los estudiantes
- Cuántos están pendientes de firma
- Fecha de subida y, si aplica, fecha de firma

---

## 4. Flujo completo (Administrador → Estudiante)

1. El admin sube un documento (ej. *Acta de Responsabilidad Material 2026*).
2. El documento aparece en el perfil de **todos los estudiantes** en la sección **Mis documentos**.
3. Cada estudiante entra a su perfil y firma el documento digitalmente.
4. Una vez firmado, el estudiante puede descargar su copia firmada.
5. El admin puede ver en su lista cuántos estudiantes han firmado cada documento.

---

## Solución de problemas

| Problema | Posible causa | Solución |
|----------|---------------|----------|
| El login se demora mucho | El backend en `localhost:8000` no responde | Verifica que el servidor FastAPI esté en ejecución |
| No veo el botón "Firmar" | El documento ya está firmado | Busca el botón "Descargar" |
| No puedo acceder a `/documentos-admin` | No tienes permisos de administrador | Contacta al administrador del sistema |
| Los navegadores de Playwright no se instalan | Restricción geográfica del CDN | Instala manualmente con `npx playwright install` |

---
