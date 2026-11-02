import { describe, expect, it } from 'vitest'
import type { EstudianteImportado } from '@/types/estudiante'
import { COLUMNAS_ESTUDIANTES, parsearFilasEstudiantes } from './importarEstudiantes'

type Campo = keyof EstudianteImportado

const base: Record<Campo, string | number> = {
  carnet: 'CI-2026001',
  nombre: 'Ana Rodríguez Pérez',
  fechaNacimiento: '2007-05-18',
  sexo: 'F',
  pais: 'Cuba',
  provincia: 'Villa Clara',
  municipio: 'Santa Clara',
  facultad: 'Facultad de Ingeniería Informática',
  carrera: 'Ingeniería Informática',
  especialidad: 'Ciencias Informáticas',
  anioAcademico: 1,
  grupo: '11',
  preuniversitario: 'IPVCE Federico Engels',
  tipoIngreso: 'Residente en provincia',
  estadoBeca: 'Activo',
  fechaIngreso: '2026-09-01',
  direccionParticular: 'Calle 12 #34',
  telefono: '51234567',
  padecimiento: '',
  madre: 'María Pérez',
  padre: 'José Rodríguez',
  telefonoMadre: '52345678',
  telefonoPadre: '53456789',
  militancia: 'UJC',
  observaciones: '',
  zonaProcedencia: '',
  universidadOrigen: '',
}

const encabezados = COLUMNAS_ESTUDIANTES.map((columna) => columna.encabezado)

function fila(cambios: Partial<Record<Campo, string | number | null>> = {}) {
  return COLUMNAS_ESTUDIANTES.map(
    (columna) => cambios[columna.campo] ?? base[columna.campo] ?? null,
  )
}

describe('parsearFilasEstudiantes', () => {
  it('convierte una fila válida en un estudiante importable', () => {
    const resultado = parsearFilasEstudiantes([encabezados, fila()])

    expect(resultado.resumen).toEqual({
      total: 1,
      validas: 1,
      omitidas: 0,
      rechazadas: 0,
    })
    expect(resultado.filas[0]?.datos?.nombre).toBe('Ana Rodríguez Pérez')
    expect(resultado.filas[0]?.datos?.anioAcademico).toBe(1)
    expect(resultado.filas[0]?.datos?.tipoIngreso).toBe('residente_provincia')
  })

  it('acepta fechas con formato dd/mm/aaaa', () => {
    const resultado = parsearFilasEstudiantes(
      [encabezados, fila({ fechaNacimiento: '18/05/2007', fechaIngreso: '01/09/2026' })],
    )

    expect(resultado.resumen.validas).toBe(1)
    expect(resultado.filas[0]?.datos?.fechaNacimiento).toBe('2007-05-18')
    expect(resultado.filas[0]?.datos?.fechaIngreso).toBe('2026-09-01')
  })

  it('omite La Habana, extranjeros y carnets ya registrados', () => {
    const resultado = parsearFilasEstudiantes(
      [
        encabezados,
        fila({ carnet: 'CI-2026100', provincia: 'La Habana' }),
        fila({
          carnet: 'CI-2026101',
          provincia: 'Matanzas',
          tipoIngreso: 'Extranjero por convenio',
        }),
        fila({ carnet: 'CI-2026102' }),
      ],
      ['CI-2026102'],
    )

    expect(resultado.resumen.validas).toBe(0)
    expect(resultado.resumen.omitidas).toBe(3)
    expect(resultado.filas[0]?.omision).toContain('La Habana')
    expect(resultado.filas[1]?.omision).toContain('Residente en provincia')
    expect(resultado.filas[2]?.omision).toContain('ya está registrado')
  })

  it('omite carnets duplicados dentro del mismo archivo', () => {
    const resultado = parsearFilasEstudiantes([encabezados, fila(), fila()])

    expect(resultado.resumen.validas).toBe(1)
    expect(resultado.resumen.omitidas).toBe(1)
    expect(resultado.filas[1]?.omision).toContain('duplicado')
  })

  it('rechaza filas con datos inválidos', () => {
    const resultado = parsearFilasEstudiantes(
      [
        encabezados,
        fila({
          carnet: 'X',
          nombre: 'A',
          fechaNacimiento: '31/02/2007',
          sexo: 'otro',
          provincia: 'Marte',
          anioAcademico: 9,
          tipoIngreso: 'desconocido',
          estadoBeca: 'raro',
        }),
      ],
    )

    expect(resultado.resumen.rechazadas).toBe(1)
    expect(resultado.filas[0]?.datos).toBeNull()
    expect(resultado.filas[0]?.errores.length).toBeGreaterThan(4)
  })

  it('busca encabezados con alias y rechaza columnas obligatorias faltantes', () => {
    const titulo = ['Reporte de matrícula']
    const alias = [
      'Carnet',
      'Nombre completo',
      'Nacimiento',
      'Sexo',
      'País',
      'Provincia',
      'Municipio',
      'Facultad',
      'Carrera',
      'Especialidad',
      'Año académico',
      'Grupo',
      'Preuniversitario',
      'Tipo de ingreso',
      'Estado de beca',
      'Fecha de ingreso',
      'Dirección particular',
      'Teléfono',
      'Padecimiento',
      'Madre',
      'Padre',
      'Teléfono de la madre',
      'Teléfono del padre',
      'Militancia',
      'Observaciones',
      'Zona de procedencia',
      'Universidad de origen',
    ]

    const resultado = parsearFilasEstudiantes([titulo, alias, fila()])
    expect(resultado.resumen.validas).toBe(1)

    const sinTelefono = alias.filter((columna) => columna !== 'Teléfono')
    expect(() => parsearFilasEstudiantes([sinTelefono, fila()])).toThrow('Teléfono')
  })
})
