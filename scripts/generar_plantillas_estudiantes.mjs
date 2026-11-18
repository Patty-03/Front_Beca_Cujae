import readXlsxFile from 'read-excel-file/node'
import writeXlsxFile from 'write-excel-file/node'
import fs from 'fs'
import path from 'path'

const srcPath = 'C:/Users/Lenovo/Downloads/CUJAE 2026-2027+.xlsx'
const outDir = path.resolve('plantillas')
fs.mkdirSync(outDir, { recursive: true })

function norm(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const provMap = new Map(Object.entries({
  PR: 'Pinar del Río',
  AR: 'Artemisa',
  LH: 'La Habana',
  MY: 'Mayabeque',
  MT: 'Matanzas',
  CF: 'Cienfuegos',
  VC: 'Villa Clara',
  SS: 'Sancti Spíritus',
  CA: 'Ciego de Ávila',
  CG: 'Camagüey',
  LT: 'Las Tunas',
  HG: 'Holguín',
  GR: 'Granma',
  SC: 'Santiago de Cuba',
  GT: 'Guantánamo',
  IJ: 'Isla de la Juventud',
}))

const res = await readXlsxFile(srcPath)
let dataRows
if (Array.isArray(res) && res.length && res[0] && Array.isArray(res[0].data)) {
  const sheet = res.find((s) => /Listado|Residentes/i.test(String(s.sheet || ''))) || res[0]
  dataRows = sheet.data
  console.log('sheet', sheet.sheet)
} else if (Array.isArray(res)) {
  dataRows = res
} else {
  throw new Error('Formato inesperado al leer Excel origen')
}
const header = dataRows[0] || []
console.log('origen filas', dataRows.length, 'header', JSON.stringify(header))

const encabezados = [
  'Carnet *', 'Nombre *', 'Fecha de nacimiento *', 'Sexo *', 'País', 'Provincia *', 'Municipio *',
  'Facultad *', 'Carrera *', 'Especialidad *', 'Año académico *', 'Grupo', 'Preuniversitario',
  'Tipo de ingreso *', 'Estado de beca *', 'Fecha de ingreso *', 'Dirección particular', 'Teléfono *',
  'Padecimiento', 'Madre', 'Padre', 'Teléfono de la madre', 'Teléfono del padre', 'Militancia',
  'Observaciones', 'Zona de procedencia', 'Universidad de origen',
]

const ejemplo = [
  '05010112345', 'Ana Rodríguez Pérez', '2007-05-18', 'F', 'Cuba', 'Villa Clara', 'Santa Clara',
  'Facultad de Ingeniería Informática', 'Ingeniería Informática', 'Ciencias Informáticas', 1, '11', 'IPVCE Federico Engels',
  'Residente en provincia', 'Activo', '2026-09-01', 'Calle 12 #34, Santa Clara', '51234567',
  '', 'María Pérez', 'José Rodríguez', '52345678', '53456789', 'UJC', '', '', '',
]

const instrucciones = [
  ['PLANTILLA DE IMPORTACIÓN DE ESTUDIANTES (campos aceptados por backend/frontend)'],
  ['Obligatorios (*): Carnet, Nombre, Fecha de nacimiento (AAAA-MM-DD o DD/MM/AAAA), Sexo (F/M), Provincia, Municipio, Facultad, Carrera, Especialidad, Año académico (1-6), Tipo de ingreso, Estado de beca, Fecha de ingreso, Teléfono.'],
  ['País: Cuba por defecto. Provincia: catálogo de Cuba (incluye La Habana e Isla de la Juventud).'],
  ['Tipo de ingreso: Residente en provincia | Lejanía | Caso excepcional | Traslado | Extranjero por convenio | Extranjero autofinanciado. Estado de beca: Activo | Condicional | Baja.'],
  ['Carnet único; si ya existe o se duplica en el archivo, la fila se omite. Filas con datos inválidos se rechazan en previsualización.'],
  ['Referencia backend: crea estudiante con carnet_de_identidad/pasaporte, nombre, fecha_nacimiento, sexo_id, pais_id, especialidad_id, tipo_ingreso_id, municipio_id y demás campos opcionales; genera cuenta. El importador del front mapea estos encabezados/catálogos.'],
  ['Nota: el archivo .xls binario no se genera automáticamente (la herramienta disponible escribe .xlsx). Esta plantilla .xlsx es importable por el sistema.'],
]

async function writeBook(sheets, filePath) {
  const buf = await writeXlsxFile(sheets)
  if (Buffer.isBuffer(buf)) {
    fs.writeFileSync(filePath, buf)
  } else {
    // try toFile API
    await writeXlsxFile(sheets).toFile(filePath)
  }
}

await writeBook([
  { data: [encabezados, ejemplo], sheet: 'Estudiantes' },
  { data: instrucciones, sheet: 'Instrucciones' },
], path.join(outDir, 'plantilla_importacion_estudiantes.xlsx'))

const derived = [encabezados]
let count = 0
for (let i = 1; i < dataRows.length; i++) {
  const r = dataRows[i]
  if (!Array.isArray(r)) continue
  const carrera = String(r[0] ?? '').trim()
  const modalidad = String(r[1] ?? '').trim()
  const ci = r[3]
  const nombre = String(r[4] ?? '').trim()
  const sexoRaw = String(r[5] ?? '').trim().toUpperCase()
  const preu = String(r[6] ?? '').trim()
  const provCode = String(r[7] ?? '').trim().toUpperCase()
  const muni = String(r[8] ?? '').trim()
  const situ = String(r[13] ?? '').trim()
  if (!ci && !nombre) continue

  const provincia = provMap.get(provCode) || provCode || ''
  let tipo = 'Residente en provincia'
  const nm = norm(modalidad)
  if (nm.includes('extranj')) tipo = 'Extranjero por convenio'
  else if (nm.includes('lejania')) tipo = 'Lejanía'
  else if (nm.includes('traslado')) tipo = 'Traslado'

  const sexo = sexoRaw === 'F' || sexoRaw === 'M' ? sexoRaw : ''
  const observ = [modalidad ? `Modalidad: ${modalidad}` : '', situ ? `Situación: ${situ}` : '']
    .filter(Boolean)
    .join(' | ')

  // Campos sin dato en origen: fecha nacimiento, facultad, teléfono, dirección. Se dejan vacíos/por completar.
  derived.push([
    ci == null ? '' : String(ci),
    nombre,
    '', // Fecha de nacimiento (REQUERIDO - completar)
    sexo,
    'Cuba',
    provincia,
    muni,
    'POR COMPLETAR', // Facultad (REQUERIDO - completar)
    carrera || 'POR COMPLETAR',
    carrera || 'POR COMPLETAR',
    1,
    '',
    preu,
    tipo,
    'Activo',
    '2026-09-01',
    '',
    '', // Teléfono (REQUERIDO - completar)
    '',
    '',
    '',
    '',
    '',
    '',
    observ,
    '',
    '',
  ])
  count++
}

const notas = [
  ['NOTAS DE MAPEO (derivado de CUJAE 2026-2027+.xlsx)'],
  ['Origen: hoja "Listado" / "Residentes en beca CUJAE". Columnas: Carrera, Vía de Ingreso, Modalidad, CI, Apellidos y Nombre(S), Sexo, Preuniversitario, Prov, Mun, IA, Preselec, ESC, Conv, Opc, SMA.'],
  ['Mapeo aplicado: Carnet=CI; Nombre=Apellidos y Nombre(S); Sexo=Sexo; País=Cuba; Provincia=sigla->nombre; Municipio=Mun; Carrera/Especialidad=Carrera; Año académico=1 (defecto); Preuniversitario=Preuniversitario; Tipo de ingreso=inferido de Modalidad (defecto Residente en provincia); Estado de beca=Activo; Fecha de ingreso=2026-09-01 (defecto); Observaciones=Modalidad/Situación.'],
  ['REQUERIDOS SIN DATO EN ORIGEN (deben completarse para importar): Fecha de nacimiento, Facultad, Teléfono. Dirección particular y campos personales/familiares son opcionales.'],
  ['Se genera en formato .xlsx (importable por el sistema). No se pudo emitir .xls binario con las dependencias disponibles.'],
]

await writeBook([
  { data: derived, sheet: 'Estudiantes' },
  { data: notas, sheet: 'Mapeo' },
], path.join(outDir, 'CUJAE_2026-2027_importacion_estudiantes.xlsx'))

console.log('generados:', count, 'filas derivadas')
