import writeXlsxFile from 'write-excel-file/browser'
import { COLUMNAS_ESTUDIANTES } from '@/lib/importarEstudiantes'
import {
  ESTADOS_BECA,
  ETIQUETAS_ESTADO_BECA,
  ETIQUETAS_SEXO,
  ETIQUETAS_TIPO_INGRESO,
  PROVINCIAS_CUBA,
  SEXOS,
  TIPOS_INGRESO,
} from '@/lib/estudiantes'

const ejemplo = [
  'CI-2026001',
  'Ana Rodríguez Pérez',
  '2007-05-18',
  'F',
  'Cuba',
  'Villa Clara',
  'Santa Clara',
  'Facultad de Ingeniería Informática',
  'Ingeniería Informática',
  'Ciencias Informáticas',
  1,
  '11',
  'IPVCE Federico Engels',
  'Residente en provincia',
  'Activo',
  '2026-09-01',
  'Calle 12 #34, Santa Clara',
  '51234567',
  '',
  'María Pérez',
  'José Rodríguez',
  '52345678',
  '53456789',
  'UJC',
  '',
  '',
  '',
]

export async function descargarPlantillaEstudiantes(): Promise<void> {
  const encabezados = COLUMNAS_ESTUDIANTES.map((columna) => columna.encabezado)
  const maximos = Math.max(
    TIPOS_INGRESO.length,
    ESTADOS_BECA.length,
    SEXOS.length,
    PROVINCIAS_CUBA.length,
  )

  const catalogos: (string | null)[][] = [
    ['Tipo de ingreso', 'Estado de beca', 'Sexo', 'Provincias'],
  ]

  for (let indice = 0; indice < maximos; indice++) {
    const tipo = TIPOS_INGRESO[indice]
    const estado = ESTADOS_BECA[indice]
    const sexo = SEXOS[indice]

    catalogos.push([
      tipo ? ETIQUETAS_TIPO_INGRESO[tipo] : null,
      estado ? ETIQUETAS_ESTADO_BECA[estado] : null,
      sexo ? ETIQUETAS_SEXO[sexo] : null,
      PROVINCIAS_CUBA[indice] ?? null,
    ])
  }

  await writeXlsxFile([
    {
      data: [encabezados, ejemplo],
      sheet: 'Estudiantes',
    },
    {
      data: catalogos,
      sheet: 'Catálogos',
    },
    {
      data: [
        ['Indicaciones'],
        ['Solo se importan estudiantes con tipo de ingreso "Residente en provincia".'],
        ['La Habana no se considera provincia para esta importación.'],
        ['Las columnas marcadas con * son obligatorias.'],
        ['Las fechas pueden escribirse como AAAA-MM-DD o DD/MM/AAAA.'],
        ['El carnet debe ser único; si ya existe, la fila se omite.'],
      ],
      sheet: 'Instrucciones',
    },
  ]).toFile('plantilla-estudiantes.xlsx')
}
