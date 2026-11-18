import { describe, expect, it } from 'vitest'
import { parsearFilasEstudiantes, seleccionarHojaDatos } from './importarEstudiantes'

describe('parsearFilasEstudiantes - formato institucional', () => {
  it('acepta formato institucional, infiere fecha desde CI y asume año 1', () => {
    const filas = [
      ['Carrera', 'Vía de Ingreso', 'Modalidad', 'CI', 'Apellidos y Nombre(S)', 'Sexo', 'Preuniversitario', 'Prov', 'Mun'],
      ['Ing. Informática', 'Institutos Preuniversitarios', 'Curso Diurno', '03033067054', 'Rodríguez Pérez Ana', 'F', 'IPVCE X', 'LH', 'Playa'],
    ]
    const r = parsearFilasEstudiantes(filas)
    expect(r.resumen.total).toBe(1)
    expect(r.resumen.validas).toBe(1)
    expect(r.filas[0]?.datos?.fechaNacimiento).toBe('2003-03-30')
    expect(r.filas[0]?.datos?.anioAcademico).toBe(1)
    expect(r.filas[0]?.datos?.provincia).toBe('La Habana')
    expect(r.filas[0]?.datos?.carrera).toBe('Ing. Informática')
    expect(r.filas[0]?.datos?.telefono).toBe('')
  })

  it('infiere fecha desde CI numérico con cero inicial perdido', () => {
    const filas = [
      ['Carrera', 'CI', 'Apellidos y Nombre(S)', 'Sexo', 'Prov', 'Mun'],
      ['Ing. Civil', 3033067054, 'Ana A', 'F', 'LH', 'Playa'],
    ]
    const r = parsearFilasEstudiantes(filas)
    expect(r.resumen.validas).toBe(1)
    expect(r.filas[0]?.datos?.fechaNacimiento).toBe('2003-03-30')
  })

  it('mapea siglas de provincia y modalidad a tipo de ingreso', () => {
    const filas = [
      ['Carrera', 'Modalidad', 'CI', 'Apellidos y Nombre(S)', 'Sexo', 'Prov', 'Mun'],
      ['Ing. Civil', 'Lejanía', '03033067054', 'Ana A', 'F', 'MT', 'Matanzas'],
      ['Ing. Civil', 'Traslado', '04033067051', 'B B', 'M', 'VC', 'Santa Clara'],
    ]
    const r = parsearFilasEstudiantes(filas)
    expect(r.resumen.validas).toBe(2)
    expect(r.filas[0]?.datos?.provincia).toBe('Matanzas')
    expect(r.filas[0]?.datos?.tipoIngreso).toBe('lejania')
    expect(r.filas[1]?.datos?.provincia).toBe('Villa Clara')
    expect(r.filas[1]?.datos?.tipoIngreso).toBe('traslado')
  })

  it('acepta provincias con diéresis/acentos, sin acentos y por sigla', () => {
    const filas = [
      ['Carrera', 'CI', 'Apellidos y Nombre(S)', 'Sexo', 'Prov', 'Mun'],
      ['Ing. Civil', '03033067054', 'Ana A', 'F', 'Camagüey', 'Camagüey'],
      ['Ing. Civil', '04033067051', 'Ana B', 'F', 'Camaguey', 'Florida'],
      ['Ing. Civil', '05033067058', 'Ana C', 'F', 'CG', 'Camagüey'],
      ['Ing. Civil', '06033067055', 'Ana D', 'F', 'SS', 'Trinidad'],
    ]
    const r = parsearFilasEstudiantes(filas)
    expect(r.resumen.validas).toBe(4)
    expect(r.filas[0]?.datos?.provincia).toBe('Camagüey')
    expect(r.filas[1]?.datos?.provincia).toBe('Camagüey')
    expect(r.filas[2]?.datos?.provincia).toBe('Camagüey')
    expect(r.filas[3]?.datos?.provincia).toBe('Sancti Spíritus')
  })

  it('omite duplicados y existentes y rechaza CI sin fecha inferible', () => {
    const filas = [
      ['Carrera', 'CI', 'Apellidos y Nombre(S)', 'Sexo', 'Prov', 'Mun'],
      ['Ing. Civil', '03033067054', 'Ana A', 'F', 'LH', 'Playa'],
      ['Ing. Civil', '03033067054', 'Ana B', 'F', 'LH', 'Playa'],
      ['Ing. Civil', 'ABC123', 'Ana C', 'F', 'LH', 'Playa'],
    ]
    const r = parsearFilasEstudiantes(filas, ['03033067054'])
    expect(r.resumen.omitidas).toBe(2)
    expect(r.resumen.rechazadas).toBe(1)
    expect(r.filas[2]?.errores.join(' ')).toContain('fecha de nacimiento')
  })

  it('selecciona la hoja con datos/encabezados', () => {
    const hojas = [
      { sheet: 'Resumen', data: [['Total', 1], ['x', 2]] },
      { sheet: 'Listado', data: [['Carrera', 'CI', 'Apellidos y Nombre(S)', 'Sexo', 'Prov', 'Mun'], ['Ing', '03033067054', 'N', 'F', 'LH', 'P']] },
    ]
    const data = seleccionarHojaDatos(hojas)
    expect(data[0]?.[1]).toBe('CI')
  })

  it('mantiene compatibilidad con formato anterior cuando trae columnas', () => {
    const filas = [
      ['Carnet', 'Nombre', 'Fecha de nacimiento', 'Sexo', 'Provincia', 'Municipio', 'Facultad', 'Carrera', 'Especialidad', 'Año académico', 'Tipo de ingreso', 'Estado de beca', 'Fecha de ingreso', 'Teléfono'],
      ['05010112345', 'Ana', '2007-05-18', 'F', 'La Habana', 'Playa', 'FII', 'Ing. Informática', 'Ing. Informática', 1, 'Residente en provincia', 'Activo', '2026-09-01', '51234567'],
    ]
    const r = parsearFilasEstudiantes(filas)
    expect(r.resumen.validas).toBe(1)
    expect(r.filas[0]?.datos?.fechaNacimiento).toBe('2007-05-18')
  })
})
