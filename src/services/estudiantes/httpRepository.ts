import type {
  AsignarCuartoInput,
  AsignacionCuarto,
  EstadoBeca,
  Estudiante,
  EstudianteImportado,
  EstudianteResumen,
  FiltrosEstudiante,
  ResultadoImportacion,
  Sexo,
  SugerenciaCuarto,
  TipoIngreso,
} from '@/types/estudiante'
import { apiErrorMessage, apiFetch, apiJson } from '@/lib/api'
import { toCamelObject } from '@/lib/case'
import { normalizarClave } from '@/lib/estudiantes'
import type { EstudiantesRepository } from './contracts'

const API = '/api/v1'
const BASE = `${API}/estudiantes`
const TAMANO_PAGINA = 200

class ErrorHttp extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function solicitarJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(`${BASE}${path}`, init)

  if (!response.ok) {
    throw new ErrorHttp(response.status, await apiErrorMessage(response))
  }

  return apiJson<T>(response)
}

async function solicitarApi<T>(path: string): Promise<T> {
  const response = await apiFetch(`${API}${path}`)

  if (!response.ok) {
    throw new ErrorHttp(response.status, await apiErrorMessage(response))
  }

  return apiJson<T>(response)
}

async function solicitarLista<T>(path: string, base = BASE): Promise<T[]> {
  const resultado: T[] = []

  for (let offset = 0; ; offset += TAMANO_PAGINA) {
    const separador = path.includes('?') ? '&' : '?'
    const response = await apiFetch(
      `${base}${path}${separador}limit=${TAMANO_PAGINA}&offset=${offset}`,
    )

    if (!response.ok) {
      throw new ErrorHttp(response.status, await apiErrorMessage(response))
    }

    const pagina = await apiJson<T[]>(response)
    resultado.push(...pagina)

    if (pagina.length < TAMANO_PAGINA) break
  }

  return resultado
}

interface SexoBack {
  id: number
  nombre: string
}

interface PaisBack {
  id: number
  nombre: string
  iso2: string
}

interface ProvinciaBack {
  id: number
  nombre: string
}

interface MunicipioBack {
  id: number
  nombre: string
  provincia_id: number
}

interface FacultadBack {
  id: number
  nombre: string
}

interface EspecialidadBack {
  id: number
  nombre: string
  facultad_id: number
}

interface MilitanciaBack {
  id: number
  nombre: string
}

interface Catalogos {
  sexos: SexoBack[]
  paises: PaisBack[]
  provincias: ProvinciaBack[]
  municipios: MunicipioBack[]
  facultades: FacultadBack[]
  especialidades: EspecialidadBack[]
  militancias: MilitanciaBack[]
}

let catalogoCache: Promise<Catalogos> | null = null

async function cargarCatalogos(): Promise<Catalogos> {
  if (catalogoCache) return catalogoCache

  catalogoCache = (async () => {
    const [sexos, paises, provincias, municipios, facultades, especialidades, militancias] =
      await Promise.all([
        solicitarApi<SexoBack[]>('/sexos'),
        solicitarLista<PaisBack>('/paises', API),
        solicitarApi<ProvinciaBack[]>('/provincias'),
        solicitarLista<MunicipioBack>('/municipios', API),
        solicitarApi<FacultadBack[]>('/facultades'),
        solicitarLista<EspecialidadBack>('/especialidades', API),
        solicitarApi<MilitanciaBack[]>('/militancias'),
      ])

    return {
      sexos,
      paises,
      provincias,
      municipios,
      facultades,
      especialidades,
      militancias,
    }
  })()

  try {
    return await catalogoCache
  } catch {
    catalogoCache = null
    return {
      sexos: [],
      paises: [],
      provincias: [],
      municipios: [],
      facultades: [],
      especialidades: [],
      militancias: [],
    }
  }
}

function buscarPorNombre<T extends { nombre: string }>(
  items: T[],
  valor: string | undefined,
): T | undefined {
  if (!valor) return undefined
  const buscado = normalizarClave(valor)
  return items.find((item) => normalizarClave(item.nombre) === buscado)
}

function sexoDesdeNombre(nombre: string | undefined): Sexo {
  const normalizado = normalizarClave(nombre ?? '')
  if (normalizado.startsWith('f') || normalizado.includes('mujer')) return 'F'
  return 'M'
}

function sexoDesdeId(id: number, catalogos: Catalogos): Sexo {
  return sexoDesdeNombre(catalogos.sexos.find((sexo) => sexo.id === id)?.nombre)
}

function tipoIngresoDesdePais(pais: PaisBack | undefined): TipoIngreso {
  return pais?.iso2?.toUpperCase() === 'CU' ? 'residente_provincia' : 'extranjero_convenio'
}

function estadoBecaDesdeActivo(activo: unknown): EstadoBeca {
  return activo === false ? 'baja' : 'activo'
}

function aAsignacion(back: unknown): AsignacionCuarto | null {
  if (!back || typeof back !== 'object') return null

  const c = toCamelObject(back as Record<string, unknown>)
  const nombreCompleto = String(c.nombreCompleto ?? '')
  const [edificioNombre, escaleraNombre, cuartoNombre] = nombreCompleto.split(' / ')
  const cuartoId = Number(c.cuartoId)

  if (!Number.isFinite(cuartoId) || cuartoId <= 0) return null

  return {
    id: 0,
    edificioId: 0,
    edificioNombre: edificioNombre || 'Sin edificio',
    escaleraId: 0,
    escaleraNombre: escaleraNombre || 'Sin escalera',
    cuartoId,
    cuartoNombre: cuartoNombre || '',
    desde: String(c.desde ?? ''),
    llaveEntregada: false,
    llaveTaquillaEntregada: false,
  }
}

function aEstudianteResumenDesdeLista(back: unknown, catalogos: Catalogos): EstudianteResumen {
  const c = toCamelObject(back as Record<string, unknown>)
  const pais = catalogos.paises.find((item) => item.id === Number(c.paisId))

  return {
    id: Number(c.id),
    carnet: String(c.carnetDeIdentidad ?? c.pasaporte ?? ''),
    nombre: String(c.nombre ?? ''),
    sexo: sexoDesdeId(Number(c.sexoId), catalogos),
    provincia: '',
    municipio: '',
    facultad: String(c.facultad ?? ''),
    carrera: String(c.especialidad ?? ''),
    especialidad: String(c.especialidad ?? ''),
    anioAcademico: Number(c.anioAcademico ?? 0),
    grupo: c.grupo != null ? String(c.grupo) : undefined,
    tipoIngreso: tipoIngresoDesdePais(pais),
    estadoBeca: estadoBecaDesdeActivo(c.activo),
    telefono: '',
    asignacion: null,
    deberesPendientes: 0,
    deberesIncumplidos: 0,
  }
}

function aEstudianteResumenDesdeDetalle(back: unknown): EstudianteResumen {
  const c = toCamelObject(back as Record<string, unknown>)
  const sexo = c.sexo as Record<string, unknown> | undefined
  const pais = c.pais as Record<string, unknown> | undefined
  const municipio = c.municipio as Record<string, unknown> | undefined
  const provincia = municipio?.provincia as Record<string, unknown> | undefined
  const especialidad = c.especialidad as Record<string, unknown> | undefined
  const facultad = especialidad?.facultad as Record<string, unknown> | undefined

  return {
    id: Number(c.id),
    carnet: String(c.carnetDeIdentidad ?? c.pasaporte ?? ''),
    nombre: String(c.nombre ?? ''),
    sexo: sexoDesdeNombre(sexo?.nombre != null ? String(sexo.nombre) : undefined),
    provincia: provincia?.nombre != null ? String(provincia.nombre) : '',
    municipio: municipio?.nombre != null ? String(municipio.nombre) : '',
    facultad: facultad?.nombre != null ? String(facultad.nombre) : '',
    carrera: especialidad?.nombre != null ? String(especialidad.nombre) : '',
    especialidad: especialidad?.nombre != null ? String(especialidad.nombre) : '',
    anioAcademico: Number(c.anioAcademico ?? 0),
    grupo: c.grupo != null ? String(c.grupo) : undefined,
    tipoIngreso: tipoIngresoDesdePais(
      pais
        ? {
            id: Number(pais.id),
            nombre: String(pais.nombre ?? ''),
            iso2: String(pais.iso2 ?? ''),
          }
        : undefined,
    ),
    estadoBeca: estadoBecaDesdeActivo(c.activo),
    telefono: String(c.telefono ?? ''),
    asignacion: aAsignacion(c.cuartoActual),
    deberesPendientes: 0,
    deberesIncumplidos: 0,
  }
}

function aEstudiante(back: unknown): Estudiante {
  const c = toCamelObject(back as Record<string, unknown>)
  const resumen = aEstudianteResumenDesdeDetalle(c)
  const militancia = c.militancia as Record<string, unknown> | null | undefined
  const pais = c.pais as Record<string, unknown> | undefined

  return {
    ...resumen,
    fechaNacimiento: String(c.fechaNacimiento ?? ''),
    pais: pais?.nombre != null ? String(pais.nombre) : '',
    preuniversitario: undefined,
    fechaIngreso: c.fechaDeIngreso != null ? String(c.fechaDeIngreso) : '',
    direccionParticular:
      c.direccionParticular != null ? String(c.direccionParticular) : '',
    padecimiento: c.padecimiento != null ? String(c.padecimiento) : undefined,
    madre: c.madre != null ? String(c.madre) : undefined,
    padre: c.padre != null ? String(c.padre) : undefined,
    telefonoMadre: c.telefonoMadre != null ? String(c.telefonoMadre) : undefined,
    telefonoPadre: c.telefonoPadre != null ? String(c.telefonoPadre) : undefined,
    militancia: militancia?.nombre != null ? String(militancia.nombre) : undefined,
    observaciones: undefined,
    zonaProcedencia: undefined,
    universidadOrigen: undefined,
    deberes: [],
  }
}

function filtrarClientSide(
  estudiantes: EstudianteResumen[],
  filtros: FiltrosEstudiante,
): EstudianteResumen[] {
  const texto = normalizarClave(filtros.texto ?? '')
  const carrera = normalizarClave(filtros.carrera ?? '')
  const especialidad = normalizarClave(filtros.especialidad ?? '')

  return estudiantes.filter((estudiante) => {
    if (texto) {
      const contenido = normalizarClave(
        `${estudiante.nombre} ${estudiante.carnet} ${estudiante.carrera} ${estudiante.especialidad}`,
      )
      if (!contenido.includes(texto)) return false
    }
    if (carrera && normalizarClave(estudiante.carrera) !== carrera) return false
    if (especialidad && normalizarClave(estudiante.especialidad) !== especialidad) return false
    if (filtros.tipoIngreso && estudiante.tipoIngreso !== filtros.tipoIngreso) return false
    if (filtros.estadoBeca && estudiante.estadoBeca !== filtros.estadoBeca) return false
    return true
  })
}

async function resolverPais(
  datos: EstudianteImportado,
  catalogos: Catalogos,
): Promise<PaisBack> {
  const nombre = datos.pais || 'Cuba'
  const pais =
    buscarPorNombre(catalogos.paises, nombre) ??
    catalogos.paises.find((item) => item.iso2?.toUpperCase() === nombre.toUpperCase())

  if (!pais) {
    throw new Error(`No existe el país "${nombre}" en el catálogo.`)
  }

  return pais
}

function resolverSexo(datos: EstudianteImportado, catalogos: Catalogos): SexoBack {
  const nombreBuscado = datos.sexo === 'F' ? 'Femenino' : 'Masculino'
  const sexo = buscarPorNombre(catalogos.sexos, nombreBuscado)
  if (!sexo) {
    throw new Error(`No existe el sexo "${nombreBuscado}" en el catálogo.`)
  }
  return sexo
}

function resolverEspecialidad(
  datos: EstudianteImportado,
  catalogos: Catalogos,
): EspecialidadBack {
  const facultad = buscarPorNombre(catalogos.facultades, datos.facultad)
  const nombre = datos.especialidad || datos.carrera
  const normalizado = normalizarClave(nombre)

  const especialidad = catalogos.especialidades.find((item) => {
    if (normalizarClave(item.nombre) !== normalizado) return false
    return !facultad || item.facultad_id === facultad.id
  })

  if (!especialidad) {
    throw new Error(
      `No existe la especialidad "${nombre}"${datos.facultad ? ` en la facultad "${datos.facultad}"` : ''} en el catálogo.`,
    )
  }

  return especialidad
}

function cuerpoEstudiante(
  datos: EstudianteImportado,
  pais: PaisBack,
  sexo: SexoBack,
  especialidad: EspecialidadBack,
  catalogos: Catalogos,
): Record<string, unknown> {
  const esCuba = pais.iso2?.toUpperCase() === 'CU'
  const provincia = buscarPorNombre(catalogos.provincias, datos.provincia)
  const municipio = provincia
    ? catalogos.municipios.find(
        (item) =>
          item.provincia_id === provincia.id &&
          normalizarClave(item.nombre) === normalizarClave(datos.municipio),
      )
    : undefined

  if (esCuba && !provincia) {
    throw new Error(`No existe la provincia "${datos.provincia}" en el catálogo.`)
  }
  if (esCuba && !municipio) {
    throw new Error(
      `No existe el municipio "${datos.municipio}" en la provincia "${datos.provincia}".`,
    )
  }

  const militancia = buscarPorNombre(catalogos.militancias, datos.militancia)
  if (datos.militancia && !militancia) {
    throw new Error(`No existe la militancia "${datos.militancia}" en el catálogo.`)
  }

  const grupo = datos.grupo != null ? Number(datos.grupo) : undefined

  return {
    nombre: datos.nombre,
    fecha_nacimiento: datos.fechaNacimiento,
    sexo_id: sexo.id,
    pais_id: pais.id,
    especialidad_id: especialidad.id,
    municipio_id: esCuba ? municipio?.id : undefined,
    militancia_id: militancia?.id,
    padecimiento: datos.padecimiento || undefined,
    madre: datos.madre || undefined,
    padre: datos.padre || undefined,
    telefono_madre: datos.telefonoMadre || undefined,
    telefono_padre: datos.telefonoPadre || undefined,
    anio_academico: datos.anioAcademico || undefined,
    grupo: Number.isInteger(grupo) && (grupo ?? 0) >= 1 ? grupo : undefined,
    fecha_de_ingreso: datos.fechaIngreso || undefined,
    direccion_particular: datos.direccionParticular || undefined,
    telefono: datos.telefono || undefined,
    carnet_de_identidad: esCuba ? datos.carnet : undefined,
    pasaporte: esCuba ? undefined : datos.carnet,
  }
}

export class HttpEstudiantesRepository implements EstudiantesRepository {
  async obtenerEstudiantes(filtros: FiltrosEstudiante = {}): Promise<EstudianteResumen[]> {
    const [datos, catalogos] = await Promise.all([
      solicitarLista<Record<string, unknown>>(''),
      cargarCatalogos(),
    ])

    let estudiantes = filtrarClientSide(
      datos.map((dato) => aEstudianteResumenDesdeLista(dato, catalogos)),
      filtros,
    )

    if (filtros.edificioId != null) {
      const [detalles, arbol] = await Promise.all([
        Promise.all(
          estudiantes.map((estudiante) => solicitarJson<Record<string, unknown>>(`/${estudiante.id}`)),
        ),
        solicitarApi<Array<{ id: number; nombre: string }>>('/estructura/arbol'),
      ])
      const idsPorNombre = new Map(
        arbol.map((edificio) => [normalizarClave(edificio.nombre), edificio.id]),
      )
      const ids = new Set(
        detalles.flatMap((detalle) => {
          const resumen = aEstudianteResumenDesdeDetalle(detalle)
          if (!resumen.asignacion) return []
          const id = idsPorNombre.get(normalizarClave(resumen.asignacion.edificioNombre))
          return id != null && id === filtros.edificioId ? [resumen.id] : []
        }),
      )
      estudiantes = estudiantes.filter((estudiante) => ids.has(estudiante.id))
    }

    return estudiantes
  }

  async obtenerEstudiante(id: number): Promise<Estudiante> {
    const datos = await solicitarJson<Record<string, unknown>>(`/${id}`)
    return aEstudiante(datos)
  }

  async importarEstudiantes(importados: EstudianteImportado[]): Promise<ResultadoImportacion> {
    const catalogos = await cargarCatalogos()
    const importadas: EstudianteResumen[] = []
    let omitidas = 0
    let rechazadas = 0

    for (const datos of importados) {
      try {
        const pais = await resolverPais(datos, catalogos)
        const sexo = resolverSexo(datos, catalogos)
        const especialidad = resolverEspecialidad(datos, catalogos)
        const cuerpo = cuerpoEstudiante(datos, pais, sexo, especialidad, catalogos)

        const creado = await solicitarJson<Record<string, unknown>>('', {
          method: 'POST',
          body: JSON.stringify(cuerpo),
        })

        const estudiante = creado.estudiante as Record<string, unknown> | undefined
        if (!estudiante) {
          throw new Error('El backend no devolvió el estudiante creado.')
        }

        if (datos.estadoBeca === 'baja') {
          await solicitarJson<Record<string, unknown>>(`/${estudiante.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ activo: false }),
          })
        }

        importadas.push(aEstudianteResumenDesdeDetalle(estudiante))
      } catch (caught) {
        if (caught instanceof ErrorHttp && caught.status === 409) {
          omitidas++
        } else {
          rechazadas++
        }
      }
    }

    return {
      resumen: {
        total: importados.length,
        validas: importadas.length,
        omitidas,
        rechazadas,
      },
      importadas,
    }
  }

  async sugerirCuartos(_estudianteId: number): Promise<SugerenciaCuarto[]> {
    throw new Error(
      'El backend todavía no expone sugerencias de cuarto con ocupación; no se pueden calcular sin datos de alojamiento.',
    )
  }

  async asignarCuarto(
    _estudianteId: number,
    _input: AsignarCuartoInput,
  ): Promise<AsignacionCuarto> {
    throw new Error('El backend todavía no expone la asignación de cuartos.')
  }

  async eliminarEstudiante(id: number): Promise<void> {
    const response = await apiFetch(`${BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ activo: false }),
    })

    if (!response.ok) {
      throw new ErrorHttp(response.status, await apiErrorMessage(response))
    }
  }
}
