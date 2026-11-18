import {
  esEstadoBeca,
  esTipoIngreso,
  normalizarClave,
  PROVINCIAS_CUBA,
} from '@/lib/estudiantes'
import type {
  EstadoBeca,
  EstudianteImportado,
  FilaImportacionEstudiante,
  PrevisualizacionImportacion,
  Sexo,
  TipoIngreso,
} from '@/types/estudiante'

type CampoImportacion = keyof EstudianteImportado

interface DefinicionColumna {
  campo: CampoImportacion
  encabezado: string
  obligatorio: boolean
  alias: string[]
}

export const COLUMNAS_ESTUDIANTES: DefinicionColumna[] = [
  { campo: 'carnet', encabezado: 'Carnet / CI', obligatorio: true, alias: ['carnet', 'carne', 'ci', 'identidad', 'carnet identidad', 'documento'] },
  { campo: 'nombre', encabezado: 'Nombre', obligatorio: true, alias: ['nombre', 'nombres', 'nombre completo', 'estudiante', 'apellidos y nombre s', 'apellidos y nombres', 'apellidos y nombre'] },
  { campo: 'fechaNacimiento', encabezado: 'Fecha de nacimiento', obligatorio: false, alias: ['fecha nacimiento', 'fecha de nacimiento', 'nacimiento'] },
  { campo: 'sexo', encabezado: 'Sexo', obligatorio: true, alias: ['sexo', 'genero'] },
  { campo: 'pais', encabezado: 'País', obligatorio: false, alias: ['pais', 'nacionalidad'] },
  { campo: 'provincia', encabezado: 'Provincia', obligatorio: true, alias: ['provincia', 'provincia origen', 'provincia de origen', 'procedencia', 'prov'] },
  { campo: 'municipio', encabezado: 'Municipio', obligatorio: true, alias: ['municipio', 'municipio origen', 'municipio de origen', 'mun'] },
  { campo: 'facultad', encabezado: 'Facultad', obligatorio: false, alias: ['facultad'] },
  { campo: 'carrera', encabezado: 'Carrera', obligatorio: true, alias: ['carrera'] },
  { campo: 'especialidad', encabezado: 'Especialidad', obligatorio: false, alias: ['especialidad'] },
  { campo: 'anioAcademico', encabezado: 'Año académico', obligatorio: false, alias: ['ano academico', 'año academico', 'ano', 'año', 'nivel', 'anio academico'] },
  { campo: 'grupo', encabezado: 'Grupo', obligatorio: false, alias: ['grupo'] },
  { campo: 'preuniversitario', encabezado: 'Preuniversitario', obligatorio: false, alias: ['preuniversitario', 'instituto', 'pre'] },
  { campo: 'tipoIngreso', encabezado: 'Tipo de ingreso', obligatorio: false, alias: ['tipo ingreso', 'tipo de ingreso', 'modalidad', 'via de ingreso', 'vía de ingreso'] },
  { campo: 'estadoBeca', encabezado: 'Estado de beca', obligatorio: false, alias: ['estado beca', 'estado de beca'] },
  { campo: 'fechaIngreso', encabezado: 'Fecha de ingreso', obligatorio: false, alias: ['fecha ingreso', 'fecha de ingreso'] },
  { campo: 'direccionParticular', encabezado: 'Dirección particular', obligatorio: false, alias: ['direccion particular', 'direccion', 'domicilio'] },
  { campo: 'telefono', encabezado: 'Teléfono', obligatorio: false, alias: ['telefono', 'celular', 'movil'] },
  { campo: 'padecimiento', encabezado: 'Padecimiento', obligatorio: false, alias: ['padecimiento', 'enfermedad'] },
  { campo: 'madre', encabezado: 'Madre', obligatorio: false, alias: ['madre', 'nombre madre'] },
  { campo: 'padre', encabezado: 'Padre', obligatorio: false, alias: ['padre', 'nombre padre'] },
  { campo: 'telefonoMadre', encabezado: 'Teléfono de la madre', obligatorio: false, alias: ['telefono madre', 'telefono de la madre'] },
  { campo: 'telefonoPadre', encabezado: 'Teléfono del padre', obligatorio: false, alias: ['telefono padre', 'telefono del padre'] },
  { campo: 'militancia', encabezado: 'Militancia', obligatorio: false, alias: ['militancia'] },
  { campo: 'observaciones', encabezado: 'Observaciones', obligatorio: false, alias: ['observaciones', 'notas'] },
  { campo: 'zonaProcedencia', encabezado: 'Zona de procedencia', obligatorio: false, alias: ['zona procedencia', 'zona de procedencia', 'zona'] },
  { campo: 'universidadOrigen', encabezado: 'Universidad de origen', obligatorio: false, alias: ['universidad origen', 'universidad de origen'] },
]

const ALIAS_POR_CAMPO = new Map<CampoImportacion, Set<string>>(
  COLUMNAS_ESTUDIANTES.map((columna) => [columna.campo, new Set(columna.alias.map(normalizarClave))]),
)

const SIGLAS_PROVINCIA: Record<string, string> = {
  pr: 'Pinar del Río', ar: 'Artemisa', lh: 'La Habana', my: 'Mayabeque', mt: 'Matanzas',
  cf: 'Cienfuegos', vc: 'Villa Clara', ss: 'Sancti Spíritus', ca: 'Ciego de Ávila',
  cg: 'Camagüey', lt: 'Las Tunas', hg: 'Holguín', gr: 'Granma', sc: 'Santiago de Cuba',
  gt: 'Guantánamo', ij: 'Isla de la Juventud',
}

const TIPO_INGRESO_POR_TEXTO: Record<string, TipoIngreso> = {
  'extranjero convenio': 'extranjero_convenio',
  'extranjero por convenio': 'extranjero_convenio',
  'extranjero autofinanciado': 'extranjero_autofinanciado',
  'residente provincia': 'residente_provincia',
  'residente en provincia': 'residente_provincia',
  provincia: 'residente_provincia',
  'caso excepcional': 'caso_excepcional',
  otros: 'caso_excepcional',
  'situacion compleja': 'caso_excepcional',
  lejania: 'lejania',
  traslado: 'traslado',
}

const ESTADO_BECA_POR_TEXTO: Record<string, EstadoBeca> = {
  activo: 'activo', condicional: 'condicional', baja: 'baja',
}

const SEXO_POR_TEXTO: Record<string, Sexo> = {
  f: 'F', femenino: 'F', mujer: 'F', m: 'M', masculino: 'M', hombre: 'M', varon: 'M',
}

function texto(valor: unknown): string {
  if (valor === null || valor === undefined) return ''
  if (valor instanceof Date) return fechaIso(valor)
  return String(valor).replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim()
}

function fechaIso(fecha: Date): string {
  const anio = fecha.getUTCFullYear()
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getUTCDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function parsearFecha(valor: unknown): string | null {
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : fechaIso(valor)
  if (typeof valor === 'number' && Number.isFinite(valor)) {
    const fecha = new Date(Date.UTC(1899, 11, 30) + valor * 24 * 60 * 60 * 1000)
    return Number.isNaN(fecha.getTime()) ? null : fechaIso(fecha)
  }
  const t = texto(valor)
  if (!t) return null
  const iso = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(t)
  if (iso) return construirFecha(Number(iso[1]), Number(iso[2]), Number(iso[3]))
  const local = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(t)
  if (local) return construirFecha(Number(local[3]), Number(local[2]), Number(local[1]))
  return null
}

function construirFecha(anio: number, mes: number, dia: number): string | null {
  const fecha = new Date(Date.UTC(anio, mes - 1, dia))
  if (fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== dia) return null
  return fechaIso(fecha)
}

function parsearEntero(valor: unknown): number | null {
  const bruto = texto(valor)
  if (bruto === '') return null
  const numero = typeof valor === 'number' ? valor : Number(bruto)
  return Number.isInteger(numero) ? numero : null
}

function normalizarCarnet(valor: unknown): string {
  const carnet = texto(valor).replace(/\s+/g, '').toUpperCase()
  // Excel quita el cero inicial de los CI cubanos (ej. 03033067054 → 3033067054).
  // Completar a 11 dígitos cuando es un número de 10 cifras.
  if (/^\d{10}$/.test(carnet)) return carnet.padStart(11, '0')
  return carnet
}

function inferirFechaNacimientoDesdeCarnet(carnet: string): string | null {
  let digitos = carnet.replace(/\D/g, '')
  if (digitos.length === 10) digitos = digitos.padStart(11, '0')
  if (digitos.length !== 11) return null
  const yy = Number(digitos.slice(0, 2))
  const mm = Number(digitos.slice(2, 4))
  const dd = Number(digitos.slice(4, 6))
  if (!Number.isFinite(yy) || !Number.isFinite(mm) || !Number.isFinite(dd)) return null
  const anioActual = new Date().getUTCFullYear() % 100
  const siglo = yy <= anioActual ? 2000 : 1900
  return construirFecha(siglo + yy, mm, dd)
}

function buscarEncabezado(
  filas: readonly (readonly unknown[])[],
): { indice: number; indices: Map<CampoImportacion, number> } | null {
  const limite = Math.min(filas.length, 10)
  for (let i = 0; i < limite; i++) {
    const fila = filas[i] ?? []
    const indices = new Map<CampoImportacion, number>()
    fila.forEach((celdaValor, indiceColumna) => {
      const encabezado = normalizarClave(texto(celdaValor))
      if (!encabezado) return
      for (const columna of COLUMNAS_ESTUDIANTES) {
        if (indices.has(columna.campo)) continue
        const alias = ALIAS_POR_CAMPO.get(columna.campo)
        if (alias?.has(encabezado)) { indices.set(columna.campo, indiceColumna); break }
      }
    })
    if (indices.has('carnet') && indices.has('nombre')) return { indice: i, indices }
  }
  return null
}

function celda(fila: readonly unknown[], indices: Map<CampoImportacion, number>, campo: CampoImportacion) {
  const indice = indices.get(campo)
  return indice === undefined ? null : (fila[indice] ?? null)
}

function filaVacia(fila: readonly unknown[]): boolean {
  return fila.every((valor) => texto(valor) === '')
}

function agregarObligatorio(errores: string[], valor: string, etiqueta: string) {
  if (!valor) errores.push(`El campo "${etiqueta}" es obligatorio.`)
}

function validarTexto(errores: string[], valor: string, etiqueta: string, minimo = 1, maximo = 200) {
  if (!valor) return
  if (valor.length < minimo) errores.push(`El campo "${etiqueta}" debe tener al menos ${minimo} caracteres.`)
  if (valor.length > maximo) errores.push(`El campo "${etiqueta}" no puede superar los ${maximo} caracteres.`)
}

function convertirTipoIngreso(valor: string): TipoIngreso | null {
  const normalizado = normalizarClave(valor)
  if (normalizado === '') return null
  if (esTipoIngreso(normalizado)) return normalizado
  if (TIPO_INGRESO_POR_TEXTO[normalizado]) return TIPO_INGRESO_POR_TEXTO[normalizado]
  if (normalizado.includes('extranj')) return 'extranjero_convenio'
  if (normalizado.includes('traslado')) return 'traslado'
  if (normalizado.includes('lejania')) return 'lejania'
  if (normalizado.includes('excepc')) return 'caso_excepcional'
  return 'residente_provincia'
}

function convertirEstadoBeca(valor: string): EstadoBeca | null {
  const normalizado = normalizarClave(valor)
  if (normalizado === '') return null
  if (esEstadoBeca(normalizado)) return normalizado
  return ESTADO_BECA_POR_TEXTO[normalizado] ?? null
}

function convertirSexo(valor: string): Sexo | null {
  return SEXO_POR_TEXTO[normalizarClave(valor)] ?? null
}

const PROVINCIA_CANONICA_POR_NORMALIZADA = new Map<string, string>(
  PROVINCIAS_CUBA.map((p) => [normalizarClave(p), p]),
)

function convertirProvincia(valor: string): string | null {
  const bruto = texto(valor)
  if (!bruto) return null
  const key = normalizarClave(bruto).replace(/\s+/g, '')
  const porSigla = SIGLAS_PROVINCIA[key] ?? SIGLAS_PROVINCIA[normalizarClave(bruto)]
  if (porSigla) {
    return PROVINCIA_CANONICA_POR_NORMALIZADA.get(normalizarClave(porSigla)) ?? porSigla
  }
  return PROVINCIA_CANONICA_POR_NORMALIZADA.get(normalizarClave(bruto)) ?? null
}

function parsearFila(
  fila: readonly unknown[],
  indices: Map<CampoImportacion, number>,
  carnetsExistentes: Set<string>,
  carnetsDelArchivo: Map<string, number>,
  numeroFila: number,
): FilaImportacionEstudiante {
  const errores: string[] = []
  const carnet = normalizarCarnet(celda(fila, indices, 'carnet'))
  const nombre = texto(celda(fila, indices, 'nombre'))
  const fechaNacimientoExplicita = parsearFecha(celda(fila, indices, 'fechaNacimiento'))
  const fechaNacimiento = fechaNacimientoExplicita ?? inferirFechaNacimientoDesdeCarnet(carnet)
  const sexo = convertirSexo(texto(celda(fila, indices, 'sexo')))
  const provincia = convertirProvincia(texto(celda(fila, indices, 'provincia')))
  const municipio = texto(celda(fila, indices, 'municipio'))
  const facultad = texto(celda(fila, indices, 'facultad'))
  const carrera = texto(celda(fila, indices, 'carrera'))
  const especialidad = texto(celda(fila, indices, 'especialidad')) || carrera
  const anioAcademico = parsearEntero(celda(fila, indices, 'anioAcademico')) ?? 1
  const tipoIngreso = convertirTipoIngreso(texto(celda(fila, indices, 'tipoIngreso'))) ?? 'residente_provincia'
  const estadoBeca = convertirEstadoBeca(texto(celda(fila, indices, 'estadoBeca'))) ?? 'activo'
  const fechaIngreso = parsearFecha(celda(fila, indices, 'fechaIngreso'))
  const telefono = texto(celda(fila, indices, 'telefono'))
  const observacionesBase = texto(celda(fila, indices, 'observaciones'))
  const modalidadTexto = indices.has('tipoIngreso') ? texto(celda(fila, indices, 'tipoIngreso')) : ''

  agregarObligatorio(errores, carnet, 'Carnet')
  agregarObligatorio(errores, nombre, 'Nombre')
  agregarObligatorio(errores, municipio, 'Municipio')
  agregarObligatorio(errores, carrera, 'Carrera')

  validarTexto(errores, carnet, 'Carnet', 4, 30)
  if (/^\d+$/.test(carnet) && carnet.length !== 11) {
    errores.push('El carnet debe tener 11 dígitos.')
  }
  validarTexto(errores, nombre, 'Nombre', 3, 150)
  validarTexto(errores, municipio, 'Municipio', 2, 100)
  validarTexto(errores, facultad, 'Facultad', 2, 150)
  validarTexto(errores, carrera, 'Carrera', 2, 150)
  validarTexto(errores, especialidad, 'Especialidad', 2, 150)
  if (telefono) validarTexto(errores, telefono, 'Teléfono', 6, 30)

  if (!fechaNacimiento) errores.push('No se pudo inferir la fecha de nacimiento desde el carnet.')
  if (texto(celda(fila, indices, 'fechaNacimiento')) && !fechaNacimientoExplicita) errores.push('La fecha de nacimiento no es válida.')
  if (!sexo) errores.push('El sexo debe ser F/M, femenino/masculino.')
  if (!provincia) errores.push('La provincia no es válida o no pertenece al catálogo de Cuba.')
  if (anioAcademico < 1 || anioAcademico > 6) errores.push('El año académico debe ser un número entero entre 1 y 6.')
  if (fechaNacimiento && fechaNacimiento >= new Date().toISOString().slice(0, 10)) errores.push('La fecha de nacimiento debe ser anterior a hoy.')
  if (texto(celda(fila, indices, 'fechaIngreso')) && !fechaIngreso) errores.push('La fecha de ingreso no es válida.')

  if (errores.length > 0 || !fechaNacimiento || !sexo || !provincia) {
    return { fila: numeroFila, datos: null, errores }
  }

  const observacionesPartes = [observacionesBase]
  const modNorm = normalizarClave(modalidadTexto)
  if (modalidadTexto && !TIPO_INGRESO_POR_TEXTO[modNorm] && !esTipoIngreso(modNorm)) {
    observacionesPartes.push(`Modalidad: ${modalidadTexto}`)
  }
  const observaciones = observacionesPartes.filter(Boolean).join(' | ') || undefined

  const datos: EstudianteImportado = {
    carnet, nombre, fechaNacimiento, sexo,
    pais: texto(celda(fila, indices, 'pais')) || 'Cuba',
    provincia, municipio, facultad, carrera, especialidad, anioAcademico,
    grupo: texto(celda(fila, indices, 'grupo')) || undefined,
    preuniversitario: texto(celda(fila, indices, 'preuniversitario')) || undefined,
    tipoIngreso, estadoBeca,
    fechaIngreso: fechaIngreso || '',
    direccionParticular: texto(celda(fila, indices, 'direccionParticular')),
    telefono,
    padecimiento: texto(celda(fila, indices, 'padecimiento')) || undefined,
    madre: texto(celda(fila, indices, 'madre')) || undefined,
    padre: texto(celda(fila, indices, 'padre')) || undefined,
    telefonoMadre: texto(celda(fila, indices, 'telefonoMadre')) || undefined,
    telefonoPadre: texto(celda(fila, indices, 'telefonoPadre')) || undefined,
    militancia: texto(celda(fila, indices, 'militancia')) || undefined,
    observaciones,
    zonaProcedencia: texto(celda(fila, indices, 'zonaProcedencia')) || undefined,
    universidadOrigen: texto(celda(fila, indices, 'universidadOrigen')) || undefined,
  }

  if (carnetsExistentes.has(carnet)) {
    return { fila: numeroFila, datos, errores: [], omision: 'El carnet ya está registrado en el sistema.' }
  }
  const filaDuplicada = carnetsDelArchivo.get(carnet)
  if (filaDuplicada !== undefined) {
    return { fila: numeroFila, datos, errores: [], omision: `El carnet está duplicado en el archivo (fila ${filaDuplicada}).` }
  }
  carnetsDelArchivo.set(carnet, numeroFila)
  return { fila: numeroFila, datos, errores: [] }
}

export function parsearFilasEstudiantes(
  filas: readonly (readonly unknown[])[],
  carnetsExistentes: Iterable<string> = [],
): PrevisualizacionImportacion {
  const encabezado = buscarEncabezado(filas)
  if (!encabezado) {
    throw new Error('No se encontró la fila de encabezados. Verifica que el archivo tenga las columnas requeridas (CI/Carnet, Nombre, Carrera, Sexo, Provincia, Municipio).')
  }
  const faltantes = ['carnet', 'nombre', 'sexo', 'provincia', 'municipio', 'carrera']
    .filter((campo) => !encabezado.indices.has(campo as CampoImportacion))
    .map((campo) => COLUMNAS_ESTUDIANTES.find((c) => c.campo === campo)?.encabezado ?? campo)
  if (faltantes.length > 0) throw new Error(`Faltan columnas obligatorias: ${faltantes.join(', ')}.`)

  const existentes = new Set([...carnetsExistentes].map((carnet) => normalizarCarnet(carnet)))
  const carnetsDelArchivo = new Map<string, number>()
  const resultado: FilaImportacionEstudiante[] = []
  for (let indice = encabezado.indice + 1; indice < filas.length; indice++) {
    const fila = filas[indice] ?? []
    if (filaVacia(fila)) continue
    resultado.push(parsearFila(fila, encabezado.indices, existentes, carnetsDelArchivo, indice + 1))
  }
  const validas = resultado.filter((f) => f.datos && f.errores.length === 0 && !f.omision).length
  const omitidas = resultado.filter((f) => f.omision && f.errores.length === 0).length
  const rechazadas = resultado.filter((f) => f.errores.length > 0).length
  const filaEncabezado = filas[encabezado.indice] ?? []
  return {
    filas: resultado,
    resumen: { total: resultado.length, validas, omitidas, rechazadas },
    encabezados: filaEncabezado.map((valor) => texto(valor)),
  }
}

export function seleccionarHojaDatos(
  hojas: readonly { sheet?: string; data?: readonly (readonly unknown[])[] }[],
): readonly (readonly unknown[])[] {
  if (!hojas.length) return []
  let mejor: readonly (readonly unknown[])[] = []
  let mejorPuntaje = -1
  for (const hoja of hojas) {
    const data = Array.isArray(hoja.data) ? hoja.data : []
    const encabezado = buscarEncabezado(data)
    if (!encabezado) continue
    const puntaje = encabezado.indices.size + Math.min(data.length, 5000) / 1000
    if (puntaje > mejorPuntaje) { mejorPuntaje = puntaje; mejor = data }
  }
  if (mejorPuntaje >= 0) return mejor
  const conDatos = hojas.map((h) => (Array.isArray(h.data) ? h.data : [])).filter((d) => d.length > 0)
  conDatos.sort((a, b) => b.length - a.length)
  return conDatos[0] ?? []
}
