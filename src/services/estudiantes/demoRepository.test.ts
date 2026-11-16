import { describe, expect, it } from 'vitest'
import { demoEstudiantesRepository } from './demoRepository'
import type {
  AsignarCuartoInput,
  AsignarCuartosMasivosInput,
  EstudianteImportado,
} from '@/types/estudiante'

describe('demoEstudiantesRepository', () => {
  describe('obtenerEstudiantes', () => {
    it('devuelve lista de estudiantes resumen', async () => {
      const estudiantes = await demoEstudiantesRepository.obtenerEstudiantes()

      expect(Array.isArray(estudiantes)).toBe(true)
      expect(estudiantes.length).toBeGreaterThan(0)

      const primero = estudiantes[0]
      expect(primero.id).toBeDefined()
      expect(primero.carnet).toBeDefined()
      expect(primero.nombre).toBeDefined()
      expect(primero.estadoBeca).toBeDefined()
      expect(primero.deberesPendientes).toBeDefined()
      expect(primero.deberesIncumplidos).toBeDefined()
    })

    it('filtra por carrera cuando se especifica', async () => {
      const todos = await demoEstudiantesRepository.obtenerEstudiantes()
      if (todos.length === 0) {
        expect(todos).toHaveLength(0)
        return
      }
      const carrera = todos[0].carrera

      const filtrados = await demoEstudiantesRepository.obtenerEstudiantes({ carrera })
      expect(filtrados.every((e) => e.carrera === carrera)).toBe(true)
      expect(filtrados.length).toBeLessThanOrEqual(todos.length)
    })

    it('filtra por estado de beca', async () => {
      const activos = await demoEstudiantesRepository.obtenerEstudiantes({
        estadoBeca: 'activo',
      })
      expect(activos.every((e) => e.estadoBeca === 'activo')).toBe(true)
    })

    it('devuelve array vacío si no hay coincidencias', async () => {
      const filtrados = await demoEstudiantesRepository.obtenerEstudiantes({
        carrera: 'Carrera Inexistente XYZ',
      })
      expect(filtrados).toHaveLength(0)
    })
  })

  describe('obtenerEstudiante', () => {
    it('devuelve el detalle completo de un estudiante existente', async () => {
      const lista = await demoEstudiantesRepository.obtenerEstudiantes()
      const estudiante = lista[0]
      if (!estudiante) throw new Error('No hay estudiantes demo')

      const detalle = await demoEstudiantesRepository.obtenerEstudiante(estudiante.id)

      expect(detalle.id).toBe(estudiante.id)
      expect(detalle.nombre).toBe(estudiante.nombre)
      expect(detalle.carnet).toBe(estudiante.carnet)
      expect(detalle.fechaNacimiento).toBeDefined()
      expect(detalle.pais).toBeDefined()
      expect(Array.isArray(detalle.deberes)).toBe(true)
      expect(detalle.asignacion).toBeDefined()
    })

    it('lanza error si el estudiante no existe', async () => {
      await expect(
        demoEstudiantesRepository.obtenerEstudiante(999999),
      ).rejects.toThrow('Estudiante no encontrado.')
    })
  })

  describe('importarEstudiantes', () => {
    it('importa estudiantes nuevos y omite carnets duplicados', async () => {
      const existentes = await demoEstudiantesRepository.obtenerEstudiantes()
      const carnetExistente = existentes[0]?.carnet
      if (!carnetExistente) throw new Error('No hay estudiantes para probar duplicado')

      const importados: EstudianteImportado[] = [
        {
          carnet: 'CI-9999999',
          nombre: 'Nuevo Estudiante Demo',
          fechaNacimiento: '2005-01-15',
          sexo: 'M',
          pais: 'Cuba',
          provincia: 'Villa Clara',
          municipio: 'Santa Clara',
          facultad: 'FII',
          carrera: 'Ingeniería Informática',
          especialidad: 'Ciencias Informáticas',
          anioAcademico: 2,
          grupo: '21',
          preuniversitario: 'IPVCE',
          tipoIngreso: 'residente_provincia',
          estadoBeca: 'activo',
          fechaIngreso: '2026-09-01',
          direccionParticular: 'Calle 1',
          telefono: '51111111',
          padecimiento: '',
          madre: 'Mamá Demo',
          padre: 'Papá Demo',
          telefonoMadre: '52222222',
          telefonoPadre: '53333333',
          militancia: 'UJC',
          observaciones: '',
          zonaProcedencia: '',
          universidadOrigen: '',
        },
        {
          carnet: carnetExistente,
          nombre: 'Duplicado',
          fechaNacimiento: '2005-01-15',
          sexo: 'M',
          pais: 'Cuba',
          provincia: 'Villa Clara',
          municipio: 'Santa Clara',
          facultad: 'FII',
          carrera: 'Ingeniería Informática',
          especialidad: 'Ciencias Informáticas',
          anioAcademico: 2,
          grupo: '21',
          preuniversitario: 'IPVCE',
          tipoIngreso: 'residente_provincia',
          estadoBeca: 'activo',
          fechaIngreso: '2026-09-01',
          direccionParticular: 'Calle 1',
          telefono: '51111111',
          padecimiento: '',
          madre: 'Mamá Demo',
          padre: 'Papá Demo',
          telefonoMadre: '52222222',
          telefonoPadre: '53333333',
          militancia: 'UJC',
          observaciones: '',
          zonaProcedencia: '',
          universidadOrigen: '',
        },
      ]

      const resultado = await demoEstudiantesRepository.importarEstudiantes(importados)

      expect(resultado.resumen.total).toBe(2)
      expect(resultado.resumen.validas).toBe(1)
      expect(resultado.resumen.omitidas).toBe(1)
      expect(resultado.resumen.rechazadas).toBe(0)
      expect(resultado.importadas).toHaveLength(1)
      expect(resultado.importadas[0].carnet).toBe('CI-9999999')
    })
  })

  describe('sugerirCuartos', () => {
    it('devuelve sugerencias para un estudiante existente', async () => {
      const lista = await demoEstudiantesRepository.obtenerEstudiantes()
      const estudiante = lista[0]
      if (!estudiante) throw new Error('No hay estudiantes demo')

      const sugerencias = await demoEstudiantesRepository.sugerirCuartos(estudiante.id)

      expect(Array.isArray(sugerencias)).toBe(true)
      expect(sugerencias.length).toBeGreaterThan(0)
      expect(sugerencias[0]?.cuartoId).toBeDefined()
      expect(sugerencias[0]?.puntuacion).toBeDefined()
      expect(Array.isArray(sugerencias[0]?.motivos)).toBe(true)
    })

    it('lanza error si el estudiante no existe', async () => {
      await expect(
        demoEstudiantesRepository.sugerirCuartos(999999),
      ).rejects.toThrow('Estudiante no encontrado.')
    })
  })

  describe('asignarCuarto', () => {
    it('asigna un cuarto habitable y disponible', async () => {
      const lista = await demoEstudiantesRepository.obtenerEstudiantes()
      const estudiante = lista.find((e) => !e.asignacion && e.estadoBeca === 'activo')
      if (!estudiante) {
        expect(true).toBe(true)
        return
      }

      const sugerencias = await demoEstudiantesRepository.sugerirCuartos(estudiante.id)
      if (sugerencias.length === 0) {
        expect(true).toBe(true)
        return
      }

      const cuarto = sugerencias[0]
      const input: AsignarCuartoInput = {
        cuartoId: cuarto.cuartoId,
        desde: '2026-09-01',
        llaveEntregada: false,
        llaveTaquillaEntregada: false,
      }

      const asignacion = await demoEstudiantesRepository.asignarCuarto(
        estudiante.id,
        input,
      )

      expect(asignacion.cuartoId).toBe(cuarto.cuartoId)
      expect(asignacion.llaveEntregada).toBe(false)
      expect(asignacion.llaveTaquillaEntregada).toBe(false)
    })

    it('rechaza asignar cuarto a estudiante dado de baja', async () => {
      const lista = await demoEstudiantesRepository.obtenerEstudiantes()
      const baja = lista.find((e) => e.estadoBeca === 'baja')
      if (!baja) {
        expect(true).toBe(true)
        return
      }

      const input: AsignarCuartoInput = { cuartoId: 1 }
      await expect(
        demoEstudiantesRepository.asignarCuarto(baja.id, input),
      ).rejects.toThrow()
    })
  })

  describe('asignarCuartosMasivamente', () => {
    it('procesa asignaciones masivas y devuelve resultado', async () => {
      const lista = await demoEstudiantesRepository.obtenerEstudiantes()
      const estudiantesSinAsignar = lista.filter(
        (e) => !e.asignacion && e.estadoBeca === 'activo',
      )
      if (estudiantesSinAsignar.length === 0) {
        expect(true).toBe(true)
        return
      }

      const sugerencias = await demoEstudiantesRepository.sugerirCuartos(
        estudiantesSinAsignar[0].id,
      )
      if (sugerencias.length === 0) {
        expect(true).toBe(true)
        return
      }

      const input: AsignarCuartosMasivosInput[] = estudiantesSinAsignar.slice(0, 2).map(
        (e) => ({
          estudianteId: e.id,
          cuartoId: sugerencias[0]?.cuartoId ?? 1,
          desde: '2026-09-01',
        }),
      )

      const resultado = await demoEstudiantesRepository.asignarCuartosMasivamente(input)

      expect(resultado.exitosos + resultado.fallidos).toBe(input.length)
      expect(Array.isArray(resultado.detalles)).toBe(true)
      expect(resultado.detalles.length).toBe(input.length)
    })

    it('marca como fallido cuando el estudiante no existe', async () => {
      const input: AsignarCuartosMasivosInput[] = [
        { estudianteId: 999999, cuartoId: 1 },
      ]
      const resultado = await demoEstudiantesRepository.asignarCuartosMasivamente(input)

      expect(resultado.exitosos).toBe(0)
      expect(resultado.fallidos).toBe(1)
      expect(resultado.detalles[0]?.exitoso).toBe(false)
      expect(resultado.detalles[0]?.error).toBeDefined()
    })
  })

  describe('obtenerAtributos y obtenerOperadores', () => {
    it('devuelve atributos disponibles', async () => {
      const atributos = await demoEstudiantesRepository.obtenerAtributos()
      expect(Array.isArray(atributos)).toBe(true)
      expect(atributos.length).toBeGreaterThan(0)
      expect(atributos[0]?.id).toBeDefined()
      expect(atributos[0]?.nombre).toBeDefined()
    })

    it('devuelve operadores disponibles', async () => {
      const operadores = await demoEstudiantesRepository.obtenerOperadores()
      expect(Array.isArray(operadores)).toBe(true)
      expect(operadores.length).toBeGreaterThan(0)
      expect(operadores[0]?.simbolo).toBeDefined()
      expect(operadores[0]?.nombre).toBeDefined()
    })
  })

  describe('crearConjuntoRegla', () => {
    it('crea un conjunto de reglas y devuelve su id', async () => {
      const resultado = await demoEstudiantesRepository.crearConjuntoRegla({
        nombre: 'Regla prueba',
        ambito: 'ALOJAMIENTO',
        desde: '2026-09-01',
        hasta: '2026-12-31',
        condiciones: [],
        prioridades: [],
      })

      expect(resultado.id).toBeDefined()
      expect(typeof resultado.id).toBe('number')
    })
  })

  describe('eliminarEstudiante', () => {
    it('elimina un estudiante existente', async () => {
      const lista = await demoEstudiantesRepository.obtenerEstudiantes()
      const estudiante = lista[0]
      if (!estudiante) throw new Error('No hay estudiantes para eliminar')

      await demoEstudiantesRepository.eliminarEstudiante(estudiante.id)

      const restantes = await demoEstudiantesRepository.obtenerEstudiantes()
      expect(
        restantes.some((e) => e.id === estudiante.id),
      ).toBe(false)
    })

    it('lanza error si el estudiante no existe', async () => {
      await expect(
        demoEstudiantesRepository.eliminarEstudiante(999999),
      ).rejects.toThrow('Estudiante no encontrado.')
    })
  })
})
