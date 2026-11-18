import { describe, expect, it, vi, beforeEach } from 'vitest'
import { HttpEstudiantesRepository } from './httpRepository'
import { apiFetch } from '@/lib/api'
import type {
  FiltrosEstudiante,
  EstudianteImportado,
} from '@/types/estudiante'

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
  apiJson: vi.fn(async (res: Response) => res.json()),
  apiErrorMessage: vi.fn(async () => 'Error de API'),
}))

const mockApiFetch = vi.mocked(apiFetch)

const mockResumen: any = {
  id: 1,
  carnet: 'CI-2026001',
  nombre: 'Ana Rodríguez Pérez',
  sexo: 'F',
  provincia: 'Villa Clara',
  municipio: 'Santa Clara',
  facultad: 'FII',
  carrera: 'Ingeniería Informática',
  especialidad: 'Ciencias Informáticas',
  anioAcademico: 1,
  grupo: '11',
  tipoIngreso: 'residente_provincia',
  estadoBeca: 'activo',
  telefono: '51234567',
  asignacion: null,
  deberesPendientes: 0,
  deberesIncumplidos: 0,
}

const mockDetalle: any = {
  ...mockResumen,
  fechaNacimiento: '2007-05-18',
  pais: 'Cuba',
  preuniversitario: 'IPVCE',
  fechaIngreso: '2026-09-01',
  direccionParticular: 'Calle 1',
  padecimiento: '',
  madre: 'Mamá',
  padre: 'Papá',
  telefonoMadre: '52222222',
  telefonoPadre: '53333333',
  militancia: 'UJC',
  observaciones: '',
  zonaProcedencia: '',
  universidadOrigen: '',
  deberes: [],
}

const mockCatalogos = {
  sexos: [{ id: 1, nombre: 'Femenino' }, { id: 2, nombre: 'Masculino' }],
  paises: [{ id: 1, nombre: 'Cuba', iso2: 'CU' }],
  provincias: [{ id: 1, nombre: 'Villa Clara' }],
  municipios: [{ id: 1, nombre: 'Santa Clara', provincia_id: 1 }],
  facultades: [{ id: 1, nombre: 'FII' }],
  especialidades: [{ id: 1, nombre: 'Ciencias Informáticas', facultad_id: 1 }],
  militancias: [{ id: 1, nombre: 'UJC' }],
}

beforeEach(() => {
  mockApiFetch.mockReset()
})

describe('HttpEstudiantesRepository', () => {
  describe('obtenerEstudiantes', () => {
    it('devuelve lista de estudiantes resumen', async () => {
      mockApiFetch.mockResolvedValue(
        new Response(JSON.stringify([mockResumen]), { status: 200 }),
      )

      const repo = new HttpEstudiantesRepository()
      const estudiantes = await repo.obtenerEstudiantes()

      expect(mockApiFetch).toHaveBeenCalled()
      expect(Array.isArray(estudiantes)).toBe(true)
      expect(estudiantes.length).toBe(1)
      expect(estudiantes[0].nombre).toBe('Ana Rodríguez Pérez')
    })

    it('aplica filtros de carrera y estado de beca', async () => {
      mockApiFetch.mockResolvedValue(
        new Response(JSON.stringify([mockResumen]), { status: 200 }),
      )

      const repo = new HttpEstudiantesRepository()
      await repo.obtenerEstudiantes({
        carrera: 'Ingeniería Informática',
        estadoBeca: 'activo',
      })

      expect(mockApiFetch).toHaveBeenCalled()
    })

    it('lanza error cuando la API falla', async () => {
      mockApiFetch.mockResolvedValue(
        new Response('Error', { status: 500, statusText: 'Internal Server Error' }),
      )

      const repo = new HttpEstudiantesRepository()
      await expect(repo.obtenerEstudiantes()).rejects.toThrow()
    })
  })

  describe('obtenerEstudiante', () => {
    it('devuelve el detalle completo de un estudiante', async () => {
      mockApiFetch.mockResolvedValue(
        new Response(JSON.stringify(mockDetalle), { status: 200 }),
      )

      const repo = new HttpEstudiantesRepository()
      const estudiante = await repo.obtenerEstudiante(1)

      expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/estudiantes/1', undefined)
      expect(estudiante.id).toBe(1)
      expect(estudiante.nombre).toBe('Ana Rodríguez Pérez')
      expect(estudiante.fechaNacimiento).toBe('2007-05-18')
      expect(Array.isArray(estudiante.deberes)).toBe(true)
    })

    it('lanza error si el estudiante no existe (404)', async () => {
      mockApiFetch.mockResolvedValue(
        new Response('Not Found', { status: 404, statusText: 'Not Found' }),
      )

      const repo = new HttpEstudiantesRepository()
      await expect(repo.obtenerEstudiante(999)).rejects.toThrow()
    })
  })

  describe('importarEstudiantes', () => {
    it('importa estudiantes y devuelve resultado', async () => {
      const creado = { ...mockDetalle, id: 42 }

      // Mocker catálogos (7 llamadas) + POST (1 llamada) = 8 mocks
      mockApiFetch
        .mockResolvedValueOnce(new Response(JSON.stringify(mockCatalogos.sexos), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify(mockCatalogos.paises), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify(mockCatalogos.provincias), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify(mockCatalogos.municipios), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify(mockCatalogos.facultades), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify(mockCatalogos.especialidades), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify(mockCatalogos.militancias), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify(mockCatalogos.tiposIngreso), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ estudiante: creado }), { status: 200 }))

      const repo = new HttpEstudiantesRepository()
      const importados: EstudianteImportado[] = [
        {
          carnet: 'CI-2026100',
          nombre: 'Nuevo Estudiante',
          fechaNacimiento: '2006-01-15',
          sexo: 'M',
          pais: 'Cuba',
          provincia: 'Villa Clara',
          municipio: 'Santa Clara',
          facultad: 'FII',
          carrera: 'Ingeniería Informática',
          especialidad: 'Ciencias Informáticas',
          anioAcademico: 1,
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

      const resultado = await repo.importarEstudiantes(importados)

      expect(mockApiFetch).toHaveBeenCalled()
      expect(resultado.resumen.total).toBe(1)
      expect(resultado.resumen.validas).toBe(1)
    })
  })

  describe('obtenerAtributos', () => {
    it('devuelve lista de atributos disponibles', async () => {
      const atributos = [
        {
          id: 1,
          nombre: 'Sexo',
          tipo_dato_id: 6,
          tipo_dato: { id: 6, nombre: 'referencia a entidad' },
          almacenado: false,
          activo: true,
          valores_permitidos: [
            { id: 1, valor: 'Femenino' },
            { id: 2, valor: 'Masculino' },
          ],
        },
      ]
      mockApiFetch.mockResolvedValue(
        new Response(JSON.stringify(atributos), { status: 200 }),
      )

      const repo = new HttpEstudiantesRepository()
      const resultado = await repo.obtenerAtributos()

      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/v1/atributos?ambito=ALOJAMIENTO',
        undefined,
      )
      expect(Array.isArray(resultado)).toBe(true)
      expect(resultado[0]?.nombre).toBe('Sexo')
    })
  })

  describe('obtenerOperadores', () => {
    it('devuelve lista de operadores disponibles', async () => {
      const operadores = [
        { id: 1, simbolo: 'IGUAL', nombre: 'Igual a', solo_ordenables: false },
        { id: 2, simbolo: 'DISTINTO', nombre: 'Distinto de', solo_ordenables: false },
      ]
      mockApiFetch.mockResolvedValue(
        new Response(JSON.stringify(operadores), { status: 200 }),
      )

      const repo = new HttpEstudiantesRepository()
      const resultado = await repo.obtenerOperadores()

      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/v1/operadores',
        undefined,
      )
      expect(Array.isArray(resultado)).toBe(true)
      expect(resultado[0]?.simbolo).toBe('IGUAL')
    })
  })

  describe('crearConjuntoRegla', () => {
    it('crea un conjunto de reglas y devuelve su id', async () => {
      mockApiFetch.mockResolvedValue(
        new Response(JSON.stringify({ id: 7 }), { status: 200 }),
      )

      const repo = new HttpEstudiantesRepository()
      const resultado = await repo.crearConjuntoRegla({
        nombre: 'Regla prueba',
        ambito: 'ALOJAMIENTO',
        desde: '2026-09-01',
        hasta: '2026-12-31',
        condiciones: [],
        prioridades: [],
      })

      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/v1/conjuntos-regla',
        expect.objectContaining({ method: 'POST' }),
      )
      expect(resultado.id).toBe(7)
    })
  })

  describe('eliminarEstudiante', () => {
    it('elimina un estudiante y no devuelve error', async () => {
      mockApiFetch.mockResolvedValue(
        new Response(null, { status: 204 }),
      )

      const repo = new HttpEstudiantesRepository()
      await expect(repo.eliminarEstudiante(1)).resolves.toBeUndefined()

      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/v1/estudiantes/1',
        expect.objectContaining({ method: 'PATCH' }),
      )
    })

    it('lanza error si la eliminación falla', async () => {
      mockApiFetch.mockResolvedValue(
        new Response('Error', { status: 500, statusText: 'Internal Server Error' }),
      )

      const repo = new HttpEstudiantesRepository()
      await expect(repo.eliminarEstudiante(1)).rejects.toThrow()
    })
  })
})
