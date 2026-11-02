import { describe, expect, it } from 'vitest'
import type { Estudiante } from '@/types/estudiante'
import { sugerirCuartos, type ContextoCuarto } from './asignacionCuarto'

type EstudianteSugerencia = Pick<
  Estudiante,
  'sexo' | 'provincia' | 'carrera' | 'preuniversitario' | 'anioAcademico'
>

const estudiante: EstudianteSugerencia = {
  sexo: 'F',
  provincia: 'Villa Clara',
  carrera: 'Ingeniería Informática',
  preuniversitario: 'IPVCE Federico Engels',
  anioAcademico: 1,
}

function cuarto(cambios: Partial<ContextoCuarto> = {}): ContextoCuarto {
  return {
    id: 1,
    nombre: '1101',
    capacidadMaxima: 4,
    habitable: true,
    escaleraId: 1,
    escaleraNombre: 'Escalera 1',
    edificioId: 1,
    edificioNombre: 'Edificio A',
    ocupados: 0,
    ocupantes: [],
    ...cambios,
  }
}

describe('sugerirCuartos', () => {
  it('prioriza cuartos con estudiantes de la misma provincia y carrera', () => {
    const resultado = sugerirCuartos(estudiante, [
      cuarto({ id: 1, nombre: '1101' }),
      cuarto({
        id: 2,
        nombre: '1102',
        ocupados: 1,
        ocupantes: [
          {
            sexo: 'F',
            provincia: 'Villa Clara',
            carrera: 'Ingeniería Informática',
            preuniversitario: 'IPVCE Federico Engels',
            anioAcademico: 1,
          },
        ],
      }),
    ])

    expect(resultado[0]?.cuartoId).toBe(2)
    expect(resultado[0]?.motivos).toEqual(
      expect.arrayContaining(['Misma provincia', 'Misma carrera', 'Mismo preuniversitario']),
    )
    expect(resultado[1]?.motivos).toContain('Cuarto vacío')
  })

  it('excluye cuartos no habitables, llenos o con otro sexo', () => {
    const resultado = sugerirCuartos(estudiante, [
      cuarto({ id: 1, habitable: false }),
      cuarto({ id: 2, ocupados: 4 }),
      cuarto({
        id: 3,
        ocupados: 1,
        ocupantes: [
          {
            sexo: 'M',
            provincia: 'Villa Clara',
            carrera: 'Ingeniería Informática',
            anioAcademico: 1,
          },
        ],
      }),
      cuarto({ id: 4, ocupados: 2 }),
    ])

    expect(resultado.map((item) => item.cuartoId)).toEqual([4])
    expect(resultado[0]?.disponibles).toBe(2)
  })

  it('permite cuartos con ocupación no identificada si el género conocido es compatible', () => {
    const resultado = sugerirCuartos(estudiante, [
      cuarto({
        id: 1,
        ocupados: 3,
        ocupantes: [
          {
            sexo: 'F',
            provincia: 'Artemisa',
            carrera: 'Ingeniería Civil',
            anioAcademico: 2,
          },
        ],
      }),
    ])

    expect(resultado).toHaveLength(1)
    expect(resultado[0]?.disponibles).toBe(1)
    expect(resultado[0]?.puntuacion).toBe(4)
  })

  it('limita la respuesta a seis sugerencias ordenadas por afinidad', () => {
    const cuartos = Array.from({ length: 8 }, (_, indice) => {
      const ocupados = indice === 7 ? 3 : 0
      return cuarto({
        id: indice + 1,
        nombre: `11${String(indice + 1).padStart(2, '0')}`,
        ocupados,
        ocupantes: Array.from({ length: ocupados }, () => ({
          sexo: 'F' as const,
          provincia: 'Villa Clara',
          carrera: 'Ingeniería Informática',
          preuniversitario: 'IPVCE Federico Engels',
          anioAcademico: 1,
        })),
      })
    })

    const resultado = sugerirCuartos(estudiante, cuartos)

    expect(resultado).toHaveLength(6)
    expect(resultado[0]?.cuartoId).toBe(8)
    expect(resultado[0]?.puntuacion).toBeGreaterThan(resultado[1]?.puntuacion ?? 0)
  })
})
