import type { Estudiante, SugerenciaCuarto } from '@/types/estudiante'

export interface OcupanteCuarto {
  sexo: Estudiante['sexo']
  provincia: string
  carrera: string
  preuniversitario?: string
  anioAcademico: number
}

export interface ContextoCuarto {
  id: number
  nombre: string
  capacidadMaxima: number
  habitable: boolean
  escaleraId: number
  escaleraNombre: string
  edificioId: number
  edificioNombre: string
  ocupados: number
  ocupantes: OcupanteCuarto[]
}

type EstudianteParaSugerencia = Pick<
  Estudiante,
  'sexo' | 'provincia' | 'carrera' | 'preuniversitario' | 'anioAcademico'
>

export function sugerirCuartos(
  estudiante: EstudianteParaSugerencia,
  cuartos: ContextoCuarto[],
): SugerenciaCuarto[] {
  return cuartos
    .flatMap((cuarto) => {
      if (!cuarto.habitable) return []
      if (cuarto.ocupados >= cuarto.capacidadMaxima) return []

      const generos = new Set(cuarto.ocupantes.map((ocupante) => ocupante.sexo))
      if (generos.size > 1 || (generos.size === 1 && !generos.has(estudiante.sexo))) {
        return []
      }

      const motivos: string[] = []
      let puntuacion = 0

      const mismaProvincia = cuarto.ocupantes.some(
        (ocupante) => ocupante.provincia === estudiante.provincia,
      )
      const mismaCarrera = cuarto.ocupantes.some(
        (ocupante) => ocupante.carrera === estudiante.carrera,
      )
      const mismoPreuniversitario = Boolean(
        estudiante.preuniversitario &&
          cuarto.ocupantes.some(
            (ocupante) => ocupante.preuniversitario === estudiante.preuniversitario,
          ),
      )
      const mismoAnio = cuarto.ocupantes.some(
        (ocupante) => ocupante.anioAcademico === estudiante.anioAcademico,
      )

      if (mismaProvincia) {
        puntuacion += 30
        motivos.push('Misma provincia')
      }
      if (mismaCarrera) {
        puntuacion += 20
        motivos.push('Misma carrera')
      }
      if (mismoPreuniversitario) {
        puntuacion += 10
        motivos.push('Mismo preuniversitario')
      }
      if (mismoAnio) {
        puntuacion += 5
        motivos.push('Mismo año académico')
      }
      if (cuarto.ocupados === 0) {
        motivos.push('Cuarto vacío')
      } else {
        puntuacion += Math.round((cuarto.ocupados / cuarto.capacidadMaxima) * 5)
      }

      return [
        {
          cuartoId: cuarto.id,
          cuartoNombre: cuarto.nombre,
          edificioId: cuarto.edificioId,
          edificioNombre: cuarto.edificioNombre,
          escaleraId: cuarto.escaleraId,
          escaleraNombre: cuarto.escaleraNombre,
          capacidadMaxima: cuarto.capacidadMaxima,
          ocupados: cuarto.ocupados,
          disponibles: cuarto.capacidadMaxima - cuarto.ocupados,
          puntuacion,
          motivos,
        },
      ]
    })
    .sort(
      (a, b) =>
        b.puntuacion - a.puntuacion ||
        a.disponibles - b.disponibles ||
        a.cuartoNombre.localeCompare(b.cuartoNombre, 'es', { numeric: true }),
    )
    .slice(0, 6)
}
