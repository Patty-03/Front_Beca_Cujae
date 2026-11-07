import type {
  AsignarCuartoInput,
  AsignacionCuarto,
  Estudiante,
  EstudianteImportado,
  EstudianteResumen,
  FiltrosEstudiante,
  ResultadoImportacion,
  SugerenciaCuarto,
} from '@/types/estudiante'
import { apiErrorMessage, apiFetch, apiJson } from '@/lib/api'
import { toCamelObject } from '@/lib/case'
import type { EstudiantesRepository } from './contracts'

const BASE = '/api/v1/estudiantes'

async function solicitarJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(`${BASE}${path}`, init)

  if (!response.ok) {
    throw new Error(await apiErrorMessage(response))
  }

  return apiJson<T>(response)
}

function construirQuery(filtros: FiltrosEstudiante): string {
  const params = new URLSearchParams()

  if (filtros.texto) params.set('q', filtros.texto)
  if (filtros.edificioId != null) params.set('edificio_id', String(filtros.edificioId))

  const query = params.toString()
  return query ? `?${query}` : ''
}

function aEstudianteResumen(back: unknown): EstudianteResumen {
  const c = toCamelObject(back as Record<string, unknown>)
  return {
    id: Number(c.id),
    carnet: String(c.carnetDeIdentidad ?? c.pasaporte ?? ''),
    nombre: String(c.nombre ?? ''),
    sexo: 'M',
    provincia: '',
    municipio: '',
    facultad: String(c.facultad ?? ''),
    carrera: String(c.especialidad ?? ''),
    especialidad: String(c.especialidad ?? ''),
    anioAcademico: Number(c.anioAcademico ?? 0),
    grupo: c.grupo != null ? String(c.grupo) : undefined,
    tipoIngreso: 'residente_provincia',
    estadoBeca: 'activo',
    telefono: '',
    asignacion: null,
    deberesPendientes: 0,
    deberesIncumplidos: 0,
  } as EstudianteResumen
}

function aEstudiante(back: unknown): Estudiante {
  const c = toCamelObject(back as Record<string, unknown>)
  const resumen = aEstudianteResumen(c)
  return {
    ...resumen,
    fechaNacimiento: String(c.fechaNacimiento ?? ''),
    pais: '',
    preuniversitario: undefined,
    fechaIngreso: c.fechaDeIngreso ? String(c.fechaDeIngreso) : undefined,
    direccionParticular: c.direccionParticular ?? undefined,
    padecimiento: c.padecimiento ?? undefined,
    madre: c.madre ?? undefined,
    padre: c.padre ?? undefined,
    telefonoMadre: c.telefonoMadre ?? undefined,
    telefonoPadre: c.telefonoPadre ?? undefined,
    militancia: c.militancia ?? undefined,
    observaciones: c.observaciones ?? undefined,
    zonaProcedencia: c.zonaProcedencia ?? undefined,
    universidadOrigen: c.universidadOrigen ?? undefined,
    deberes: [],
  } as Estudiante
}

export class HttpEstudiantesRepository implements EstudiantesRepository {
  async obtenerEstudiantes(filtros: FiltrosEstudiante = {}): Promise<EstudianteResumen[]> {
    const datos = await solicitarJson<unknown[]>(construirQuery(filtros))
    return datos.map((d) => aEstudianteResumen(d))
  }

  async obtenerEstudiante(id: number): Promise<Estudiante> {
    return solicitarJson<Estudiante>(`/${id}`).then((d) => aEstudiante(d))
  }

  async importarEstudiantes(_estudiantes: EstudianteImportado[]): Promise<ResultadoImportacion> {
    throw new Error('Pendiente de backend: POST /api/v1/estudiantes/importar')
  }

  async sugerirCuartos(_estudianteId: number): Promise<SugerenciaCuarto[]> {
    throw new Error('Pendiente de backend: GET /api/v1/estudiantes/{id}/sugerencias-cuarto')
  }

  async asignarCuarto(
    _estudianteId: number,
    _input: AsignarCuartoInput,
  ): Promise<AsignacionCuarto> {
    throw new Error('Pendiente de backend: POST /api/v1/estudiantes/{id}/asignacion-cuarto')
  }

  async eliminarEstudiante(_id: number): Promise<void> {
    throw new Error('Pendiente de backend: DELETE /api/v1/estudiantes/{id}')
  }
}
