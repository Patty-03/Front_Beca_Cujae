import type {
  AsignarCuartosMasivosInput,
  AsignarCuartosMasivosResultado,
  AsignacionCuarto,
  Estudiante,
  EstudianteImportado,
  EstudianteResumen,
  FiltrosEstudiante,
  ResultadoImportacion,
  Sexo,
  SugerenciaCuarto,
  TipoIngreso,
  AtributoDisponible,
  OperadorDisponible,
  CondicionRegla,
  PrioridadRegla,
  ConjuntoReglaCrear,
  AsignarCuartoInput,
  EstadoBeca,
  ProcesoAlojamiento,
  PreasignacionLeer,
  ResultadoProcesoAlojamiento,
} from '@/types/estudiante'
import { apiErrorMessage, apiFetch, apiJson } from '@/lib/api'
import { toCamelObject } from '@/lib/case'
import { normalizarClave } from '@/lib/estudiantes'
import {
  sugerirCuartos as calcularSugerencias,
  type ContextoCuarto,
  type OcupanteCuarto,
} from '@/lib/asignacionCuarto'
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
  if (!response.ok) throw new ErrorHttp(response.status, await apiErrorMessage(response))
  return apiJson<T>(response)
}

async function solicitarApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(`${API}${path}`, init)
  if (!response.ok) throw new ErrorHttp(response.status, await apiErrorMessage(response))
  return apiJson<T>(response)
}

async function solicitarApiLista<T>(path: string): Promise<T[]> {
  const resultado: T[] = []
  for (let offset = 0; ; offset += TAMANO_PAGINA) {
    const separador = path.includes('?') ? '&' : '?'
    const response = await apiFetch(`${API}${path}${separador}limit=${TAMANO_PAGINA}&offset=${offset}`)
    if (!response.ok) throw new ErrorHttp(response.status, await apiErrorMessage(response))
    const pagina = await apiJson<T[]>(response)
    resultado.push(...pagina)
    if (pagina.length < TAMANO_PAGINA) break
  }
  return resultado
}

async function obtenerAtributos(): Promise<AtributoDisponible[]> {
  const atributos = await solicitarApi<Array<{
    id: number; nombre: string; tipo_dato_id: number; tipo_dato: { id: number; nombre: string };
    almacenado: boolean; activo: boolean; valores_permitidos: Array<{ id: number; valor: string }>
  }>>('/atributos?ambito=ALOJAMIENTO')
  return atributos.map((a) => ({
    id: a.id, nombre: a.nombre, tipoDatoId: a.tipo_dato_id, tipoDatoNombre: a.tipo_dato.nombre,
    almacenado: a.almacenado, activo: a.activo,
    valoresPermitidos: a.valores_permitidos.map((v) => ({ id: v.id, valor: v.valor })),
  }))
}

async function obtenerOperadores(): Promise<OperadorDisponible[]> {
  const operadores = await solicitarApi<Array<{ id: number; simbolo: string; nombre: string; solo_ordenables: boolean }>>('/operadores')
  return operadores.map((o) => ({ id: o.id, simbolo: o.simbolo, nombre: o.nombre, soloOrdenables: o.solo_ordenables }))
}

async function crearConjuntoRegla(conjunto: ConjuntoReglaCrear): Promise<{ id: number }> {
  return solicitarApi<{ id: number }>('/conjuntos-regla', {
    method: 'POST',
    body: JSON.stringify({
      nombre: conjunto.nombre, ambito: conjunto.ambito, desde: conjunto.desde, hasta: conjunto.hasta,
      condiciones: conjunto.condiciones.map((c) => ({
        atributo_def_id: c.atributoDefId, operador_id: c.operadorId,
        ...(c.valorTexto !== undefined && { valor_texto: c.valorTexto }),
        ...(c.valorEntero !== undefined && { valor_entero: c.valorEntero }),
        ...(c.valorFecha !== undefined && { valor_fecha: c.valorFecha }),
        ...(c.valorBool !== undefined && { valor_bool: c.valorBool }),
        ...(c.valorPermitidoId !== undefined && { valor_permitido_id: c.valorPermitidoId }),
      })),
      prioridades: conjunto.prioridades.map((p) => ({
        atributo_def_id: p.atributoDefId, tipo: p.tipo, orden: p.orden,
        ...(p.sentido !== undefined && { sentido: p.sentido }),
        ...(p.nivelAgrupamiento !== undefined && { nivel_agrupamiento: p.nivelAgrupamiento }),
      })),
    }),
  })
}

async function solicitarLista<T>(path: string, base = BASE): Promise<T[]> {
  const resultado: T[] = []
  for (let offset = 0; ; offset += TAMANO_PAGINA) {
    const separador = path.includes('?') ? '&' : '?'
    const response = await apiFetch(`${base}${path}${separador}limit=${TAMANO_PAGINA}&offset=${offset}`)
    if (!response.ok) throw new ErrorHttp(response.status, await apiErrorMessage(response))
    const pagina = await apiJson<T[]>(response)
    resultado.push(...pagina)
    if (pagina.length < TAMANO_PAGINA) break
  }
  return resultado
}

interface SexoBack { id: number; nombre: string }
interface PaisBack { id: number; nombre: string; iso2: string }
interface ProvinciaBack { id: number; nombre: string }
interface MunicipioBack { id: number; nombre: string; provincia_id: number }
interface FacultadBack { id: number; nombre: string }
interface EspecialidadBack { id: number; nombre: string; facultad_id: number }
interface MilitanciaBack { id: number; nombre: string }
interface TipoIngresoBack { id: number; nombre: string }

interface Catalogos {
  sexos: SexoBack[]; paises: PaisBack[]; provincias: ProvinciaBack[]; municipios: MunicipioBack[];
  facultades: FacultadBack[]; especialidades: EspecialidadBack[]; militancias: MilitanciaBack[];
  tiposIngreso: TipoIngresoBack[];
}

let catalogoCache: Promise<Catalogos> | null = null

async function cargarUnCatalogo<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try { return await fn() } catch { return [] }
}

async function cargarCatalogos(): Promise<Catalogos> {
  const sexos = await cargarUnCatalogo(() => solicitarApi<SexoBack[]>('/sexos'))
  const paises = await cargarUnCatalogo(() => solicitarLista<PaisBack>('/paises', API))
  const provincias = await cargarUnCatalogo(() => solicitarApi<ProvinciaBack[]>('/provincias', API))
  const municipios = await cargarUnCatalogo(() => solicitarApi<MunicipioBack[]>('/municipios', API))
  const facultades = await cargarUnCatalogo(() => solicitarApi<FacultadBack[]>('/facultades'))
  const especialidades = await cargarUnCatalogo(() => solicitarApi<EspecialidadBack[]>('/especialidades', API))
  const militancias = await cargarUnCatalogo(() => solicitarApi<MilitanciaBack[]>('/militancias'))
  const tiposIngreso = await cargarUnCatalogo(() => solicitarApi<TipoIngresoBack[]>('/tipos-ingreso'))
  return { sexos, paises, provincias, municipios, facultades, especialidades, militancias, tiposIngreso }
}

function buscarPorNombre<T extends { nombre: string }>(items: T[], valor: string | undefined): T | undefined {
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
    id: 0, edificioId: 0, edificioNombre: edificioNombre || 'Sin edificio', escaleraId: 0,
    escaleraNombre: escaleraNombre || 'Sin escalera', cuartoId, cuartoNombre: cuartoNombre || '',
    desde: String(c.desde ?? ''), llaveEntregada: false, llaveTaquillaEntregada: false,
  }
}

function aEstudianteResumenDesdeLista(back: unknown, catalogos: Catalogos): EstudianteResumen {
  const c = toCamelObject(back as Record<string, unknown>)
  const pais = catalogos.paises.find((item) => item.id === Number(c.paisId))
  return {
    id: Number(c.id), carnet: String(c.carnetDeIdentidad ?? c.pasaporte ?? ''), nombre: String(c.nombre ?? ''),
    sexo: sexoDesdeId(Number(c.sexoId), catalogos), provincia: '', municipio: '',
    facultad: String(c.facultad ?? ''), carrera: String(c.especialidad ?? ''), especialidad: String(c.especialidad ?? ''),
    anioAcademico: Number(c.anioAcademico ?? 0), grupo: c.grupo != null ? String(c.grupo) : undefined,
    tipoIngreso: tipoIngresoDesdePais(pais), estadoBeca: estadoBecaDesdeActivo(c.activo),
    telefono: '', asignacion: aAsignacion(c.cuartoActual), deberesPendientes: 0, deberesIncumplidos: 0,
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
    id: Number(c.id), carnet: String(c.carnetDeIdentidad ?? c.pasaporte ?? ''), nombre: String(c.nombre ?? ''),
    sexo: sexoDesdeNombre(sexo?.nombre != null ? String(sexo.nombre) : undefined),
    provincia: provincia?.nombre != null ? String(provincia.nombre) : '',
    municipio: municipio?.nombre != null ? String(municipio.nombre) : '',
    facultad: facultad?.nombre != null ? String(facultad.nombre) : '',
    carrera: especialidad?.nombre != null ? String(especialidad.nombre) : '',
    especialidad: especialidad?.nombre != null ? String(especialidad.nombre) : '',
    anioAcademico: Number(c.anioAcademico ?? 0), grupo: c.grupo != null ? String(c.grupo) : undefined,
    tipoIngreso: tipoIngresoDesdePais(pais ? { id: Number(pais.id), nombre: String(pais.nombre ?? ''), iso2: String(pais.iso2 ?? '') } : undefined),
    estadoBeca: estadoBecaDesdeActivo(c.activo), telefono: String(c.telefono ?? ''),
    asignacion: aAsignacion(c.cuartoActual), deberesPendientes: 0, deberesIncumplidos: 0,
  }
}

function aEstudiante(back: unknown): Estudiante {
  const c = toCamelObject(back as Record<string, unknown>)
  const resumen = aEstudianteResumenDesdeDetalle(c)
  const militancia = c.militancia as Record<string, unknown> | null | undefined
  const pais = c.pais as Record<string, unknown> | undefined
  return {
    ...resumen, fechaNacimiento: String(c.fechaNacimiento ?? ''),
    pais: pais?.nombre != null ? String(pais.nombre) : '',
    preuniversitario: c.preuniversitario != null ? String(c.preuniversitario) : undefined,
    fechaIngreso: c.fechaDeIngreso != null ? String(c.fechaDeIngreso) : '',
    direccionParticular: c.direccionParticular != null ? String(c.direccionParticular) : '',
    padecimiento: c.padecimiento != null ? String(c.padecimiento) : undefined,
    madre: c.madre != null ? String(c.madre) : undefined,
    padre: c.padre != null ? String(c.padre) : undefined,
    telefonoMadre: c.telefonoMadre != null ? String(c.telefonoMadre) : undefined,
    telefonoPadre: c.telefonoPadre != null ? String(c.telefonoPadre) : undefined,
    militancia: militancia?.nombre != null ? String(militancia.nombre) : undefined,
    observaciones: c.observacionesSociales != null ? String(c.observacionesSociales) : undefined,
    zonaProcedencia: c.zonaProcedencia != null ? String(c.zonaProcedencia) : undefined,
    universidadOrigen: c.universidadOrigen != null ? String(c.universidadOrigen) : undefined,
    deberes: [],
  }
}

function filtrarClientSide(estudiantes: EstudianteResumen[], filtros: FiltrosEstudiante): EstudianteResumen[] {
  const texto = normalizarClave(filtros.texto ?? '')
  const carrera = normalizarClave(filtros.carrera ?? '')
  const especialidad = normalizarClave(filtros.especialidad ?? '')
  return estudiantes.filter((estudiante) => {
    if (texto) {
      const contenido = normalizarClave(`${estudiante.nombre} ${estudiante.carnet} ${estudiante.carrera} ${estudiante.especialidad}`)
      if (!contenido.includes(texto)) return false
    }
    if (carrera && normalizarClave(estudiante.carrera) !== carrera) return false
    if (especialidad && normalizarClave(estudiante.especialidad) !== especialidad) return false
    if (filtros.tipoIngreso && estudiante.tipoIngreso !== filtros.tipoIngreso) return false
    if (filtros.estadoBeca && estudiante.estadoBeca !== filtros.estadoBeca) return false
    return true
  })
}

async function resolverPais(datos: EstudianteImportado, catalogos: Catalogos): Promise<PaisBack> {
  const nombre = datos.pais || 'Cuba'
  const pais = buscarPorNombre(catalogos.paises, nombre) ?? catalogos.paises.find((item) => item.iso2?.toUpperCase() === nombre.toUpperCase())
  if (!pais) throw new Error(`No existe el país "${nombre}" en el catálogo.`)
  return pais
}

function resolverSexo(datos: EstudianteImportado, catalogos: Catalogos): SexoBack {
  const nombreBuscado = datos.sexo === 'F' ? 'Femenino' : 'Masculino'
  const sexo = buscarPorNombre(catalogos.sexos, nombreBuscado)
  if (!sexo) throw new Error(`No existe el sexo "${nombreBuscado}" en el catálogo.`)
  return sexo
}

function resolverEspecialidad(datos: EstudianteImportado, catalogos: Catalogos): EspecialidadBack {
  const facultad = buscarPorNombre(catalogos.facultades, datos.facultad)
  const nombre = datos.especialidad || datos.carrera
  const normalizado = normalizarClave(nombre)
  let especialidad = catalogos.especialidades.find((item) => normalizarClave(item.nombre) === normalizado && (!facultad || item.facultad_id === facultad.id))
  if (!especialidad) {
    especialidad = catalogos.especialidades.find((item) => normalizarClave(item.nombre) === normalizado)
  }
  if (!especialidad) {
    especialidad = catalogos.especialidades.find((item) => {
      const n = normalizarClave(item.nombre)
      return n.includes(normalizado) || normalizado.includes(n)
    })
  }
  if (!especialidad) {
    throw new Error(`No existe la especialidad/carrera "${nombre}" en el catálogo.`)
  }
  return especialidad
}

function resolverTipoIngresoId(datos: EstudianteImportado, catalogos: Catalogos): number | undefined {
  const mapa: Record<string, string[]> = {
    extranjero_convenio: ['extranjero por convenio', 'extranjero convenio'],
    extranjero_autofinanciado: ['extranjero autofinanciado'],
    residente_provincia: ['residente en provincia', 'residente provincia', 'provincia'],
    caso_excepcional: ['caso excepcional', 'otros', 'situacion compleja'],
    lejania: ['lejania', 'lejanía'],
    traslado: ['traslado'],
  }
  const candidatos = mapa[datos.tipoIngreso] ?? [datos.tipoIngreso]
  for (const cand of candidatos) {
    const encontrado = buscarPorNombre(catalogos.tiposIngreso, cand)
    if (encontrado) return encontrado.id
  }
  // fallback: buscar por coincidencia parcial
  const n = normalizarClave(datos.tipoIngreso)
  const parcial = catalogos.tiposIngreso.find((t) => normalizarClave(t.nombre).includes(n) || n.includes(normalizarClave(t.nombre)))
  if (parcial) return parcial.id
  if (catalogos.tiposIngreso.length === 1) return catalogos.tiposIngreso[0]!.id
  return undefined
}

function cuerpoEstudiante(
  datos: EstudianteImportado, pais: PaisBack, sexo: SexoBack, especialidad: EspecialidadBack, catalogos: Catalogos,
): Record<string, unknown> {
  const esCuba = pais.iso2?.toUpperCase() === 'CU'
  const provincia = buscarPorNombre(catalogos.provincias, datos.provincia)
  const municipio = provincia
    ? catalogos.municipios.find((item) => item.provincia_id === provincia.id && normalizarClave(item.nombre) === normalizarClave(datos.municipio))
    : undefined
  if (esCuba && !provincia) throw new Error(`No existe la provincia "${datos.provincia}" en el catálogo.`)
  if (esCuba && !municipio) throw new Error(`No existe el municipio "${datos.municipio}" en la provincia "${datos.provincia}".`)

  const militancia = buscarPorNombre(catalogos.militancias, datos.militancia)
  if (datos.militancia && !militancia) throw new Error(`No existe la militancia "${datos.militancia}" en el catálogo.`)

  const grupo = datos.grupo != null ? Number(datos.grupo) : undefined
  const tipoIngresoId = resolverTipoIngresoId(datos, catalogos)

  const cuerpo: Record<string, unknown> = {
    nombre: datos.nombre, fecha_nacimiento: datos.fechaNacimiento, sexo_id: sexo.id, pais_id: pais.id,
    especialidad_id: especialidad.id, municipio_id: esCuba ? municipio?.id : undefined, militancia_id: militancia?.id,
    padecimiento: datos.padecimiento || undefined, madre: datos.madre || undefined, padre: datos.padre || undefined,
    telefono_madre: datos.telefonoMadre || undefined, telefono_padre: datos.telefonoPadre || undefined,
    anio_academico: datos.anioAcademico || undefined,
    grupo: Number.isInteger(grupo) && (grupo ?? 0) >= 1 ? grupo : undefined,
    fecha_de_ingreso: datos.fechaIngreso || undefined,
    direccion_particular: datos.direccionParticular || undefined,
    telefono: datos.telefono || undefined,
    preuniversitario: datos.preuniversitario || undefined,
    carnet_de_identidad: esCuba ? datos.carnet : undefined,
    pasaporte: esCuba ? undefined : datos.carnet,
  }
  if (datos.tipoIngreso === 'caso_excepcional' && datos.observaciones) {
    cuerpo.observaciones_sociales = datos.observaciones
  }
  if (datos.tipoIngreso === 'lejania' && datos.zonaProcedencia) {
    cuerpo.zona_procedencia = datos.zonaProcedencia
  }
  if (datos.tipoIngreso === 'traslado' && datos.universidadOrigen) {
    cuerpo.universidad_origen = datos.universidadOrigen
  }
  if (tipoIngresoId != null) cuerpo.tipo_ingreso_id = tipoIngresoId
  return cuerpo
}

async function procesarEnParalelo<T, R>(
  items: T[],
  limite: number,
  procesar: (item: T, indice: number) => Promise<R>,
  onProgreso?: (completados: number, total: number) => void,
): Promise<Array<R | { error: Error }>> {
  const resultados: Array<R | { error: Error }> = new Array(items.length)
  let indice = 0
  let completados = 0
  let activos = 0

  async function worker() {
    while (indice < items.length) {
      const i = indice++
      activos++
      try {
        resultados[i] = await procesar(items[i], i)
      } catch (e) {
        resultados[i] = { error: e instanceof Error ? e : new Error(String(e)) }
      } finally {
        activos--
        completados++
        onProgreso?.(completados, items.length)
      }
    }
  }

  const workers = Array.from({ length: Math.min(limite, items.length) }, () => worker())
  await Promise.all(workers)
  return resultados
}

export class HttpEstudiantesRepository implements EstudiantesRepository {
  async obtenerEstudiantes(filtros: FiltrosEstudiante = {}): Promise<EstudianteResumen[]> {
    const [datos, catalogos] = await Promise.all([solicitarLista<Record<string, unknown>>(''), cargarCatalogos()])
    return filtrarClientSide(datos.map((dato) => aEstudianteResumenDesdeLista(dato, catalogos)), filtros)
  }

  async obtenerEstudiante(id: number): Promise<Estudiante> {
    const datos = await solicitarJson<Record<string, unknown>>(`/${id}`)
    return aEstudiante(datos)
  }

  async importarEstudiantes(
    importados: EstudianteImportado[],
    onProgreso?: (completados: number, total: number) => void,
  ): Promise<ResultadoImportacion> {
    const catalogos = await cargarCatalogos()
    const importadas: EstudianteResumen[] = []
    let omitidas = 0
    let rechazadas = 0
    let primerError: string | null = null

    // Paso 1: Validar y construir cuerpos (resoluciones de catálogo, rápido)
    const preparados: Array<
      { tipo: 'valido'; datos: EstudianteImportado; cuerpo: Record<string, unknown> }
      | { tipo: 'omitido'; datos: EstudianteImportado }
      | { tipo: 'rechazado'; datos: EstudianteImportado; error: string }
    > = []

    for (const datos of importados) {
      try {
        const pais = await resolverPais(datos, catalogos)
        const sexo = resolverSexo(datos, catalogos)
        const especialidad = resolverEspecialidad(datos, catalogos)
        const cuerpo = cuerpoEstudiante(datos, pais, sexo, especialidad, catalogos)
        preparados.push({ tipo: 'valido', datos, cuerpo })
      } catch (caught) {
        if (caught instanceof ErrorHttp && caught.status === 409) {
          preparados.push({ tipo: 'omitido', datos })
          omitidas++
        } else {
          preparados.push({ tipo: 'rechazado', datos, error: caught instanceof Error ? caught.message : String(caught) })
          rechazadas++
          if (!primerError) primerError = preparados[preparados.length - 1]!.error
        }
      }
    }

    // Paso 2: POST en paralelo con concurrencia limitada
    const validos = preparados.filter(
      (p): p is { tipo: 'valido'; datos: EstudianteImportado; cuerpo: Record<string, unknown> } => p.tipo === 'valido',
    )
    const totalPost = validos.length

    const resultados = await procesarEnParalelo(
      validos,
      10,
      async (p) => {
        const creado = await solicitarJson<Record<string, unknown>>('', { method: 'POST', body: JSON.stringify(p.cuerpo) })
        const estudiante = creado.estudiante as Record<string, unknown> | undefined
        if (!estudiante) throw new Error('El backend no devolvi� el estudiante creado.')
        if (p.datos.estadoBeca === 'baja') {
          await solicitarJson<Record<string, unknown>>(
            `/${estudiante.id}`,
            { method: 'PATCH', body: JSON.stringify({ activo: false }) },
          )
        }
        return aEstudianteResumenDesdeDetalle(estudiante)
      },
      (completados) => onProgreso?.(completados, totalPost),
    )

    for (const resultado of resultados) {
      if ('error' in resultado) {
        rechazadas++
        if (!primerError) primerError = resultado.error.message
      } else {
        importadas.push(resultado)

    }

    return { resumen: { total: importados.length, validas: importadas.length, omitidas, rechazadas }, importadas, primerError }
  }
}

  async sugerirCuartos(estudianteId: number): Promise<SugerenciaCuarto[]> {
    const estudiante = await this.obtenerEstudiante(estudianteId)
    const cuartosBack = await solicitarApi<Array<Record<string, unknown>>>('/cuartos?activo=true')
    const arbol = await solicitarApi<Array<{ id: number; nombre: string; activo: boolean; escaleras: Array<{ id: number; nombre: string; activo: boolean; cuartos: Array<{ id: number; nombre: string; capacidad_maxima: number; habitable: boolean; activo: boolean }> }> }>>('/estructura/arbol')
    const cuartoContexto = new Map<number, { edificioId: number; edificioNombre: string; escaleraId: number; escaleraNombre: string; habitable: boolean; capacidadMaxima: number }>()
    for (const edificio of arbol) for (const escalera of edificio.escaleras) for (const cuarto of escalera.cuartos) {
      cuartoContexto.set(cuarto.id, { edificioId: edificio.id, edificioNombre: edificio.nombre, escaleraId: escalera.id, escaleraNombre: escalera.nombre, habitable: cuarto.habitable, capacidadMaxima: cuarto.capacidad_maxima })
    }
    const estudiantesBack = await solicitarJson<Record<string, unknown>[]>('/estudiantes')
    const ocupantesPorCuarto = new Map<number, OcupanteCuarto[]>()
    for (const estBack of estudiantesBack) {
      const est = toCamelObject(estBack as Record<string, unknown>) as Record<string, unknown>
      const cuartoActual = est.cuartoActual as Record<string, unknown> | undefined
      if (!cuartoActual) continue
      const cuartoId = Number((cuartoActual.cuarto as Record<string, unknown> | undefined)?.id ?? cuartoActual.cuartoId)
      if (!Number.isFinite(cuartoId)) continue
      if (!ocupantesPorCuarto.has(cuartoId)) ocupantesPorCuarto.set(cuartoId, [])
      ocupantesPorCuarto.get(cuartoId)!.push({ sexo: sexoDesdeNombre(String(est.sexo)) as Sexo, provincia: String(est.provincia ?? ''), carrera: String(est.carrera ?? ''), preuniversitario: est.preuniversitario != null ? String(est.preuniversitario) : undefined, anioAcademico: Number(est.anioAcademico ?? 0) })
    }
    const contextos: ContextoCuarto[] = []
    for (const back of cuartosBack) {
      const c = toCamelObject(back as Record<string, unknown>) as Record<string, unknown>
      const cuartoId = Number(c.id)
      const ctx = cuartoContexto.get(cuartoId)
      if (!ctx) continue
      const ocupantes = ocupantesPorCuarto.get(cuartoId) ?? []
      contextos.push({ id: cuartoId, nombre: String(c.nombre), capacidadMaxima: ctx.capacidadMaxima, habitable: ctx.habitable, escaleraId: ctx.escaleraId, escaleraNombre: ctx.escaleraNombre, edificioId: ctx.edificioId, edificioNombre: ctx.edificioNombre, ocupados: ocupantes.length, ocupantes })
    }
    return calcularSugerencias({ sexo: estudiante.sexo, provincia: estudiante.provincia, carrera: estudiante.carrera, preuniversitario: estudiante.preuniversitario, anioAcademico: estudiante.anioAcademico }, contextos)
  }

  async asignarCuarto(estudianteId: number, input: AsignarCuartoInput): Promise<AsignacionCuarto> {
    return this.ejecutarAsignacion([{ estudianteId, ...input }]).then((resultado) => {
      const detalle = resultado.detalles.find((d) => d.estudianteId === estudianteId)
      if (!detalle || !detalle.exitoso) throw new Error(detalle?.error || 'No se pudo asignar el cuarto.')
      return this.obtenerEstudiante(estudianteId).then((est) => {
        const asignacion = (est as unknown) as Record<string, unknown>
        const a = asignacion.asignacion as AsignacionCuarto | null
        if (!a) throw new Error('No se pudo confirmar la asignación de cuarto.')
        return { ...a, taquilla: input.taquilla, llaveEntregada: input.llaveEntregada ?? false, llaveTaquillaEntregada: input.llaveTaquillaEntregada ?? false }
      })
    })
  }

  async asignarCuartosMasivamente(asignaciones: AsignarCuartosMasivosInput[]): Promise<AsignarCuartosMasivosResultado> {
    return this.ejecutarAsignacion(asignaciones)
  }

  private async ejecutarAsignacion(asignaciones: AsignarCuartosMasivosInput[]): Promise<AsignarCuartosMasivosResultado> {
    const periodoId = await this.asegurarPeriodoRegistro()
    const conjuntoId = await this.asegurarConjuntoReglaConCondiciones()
    const proceso = await solicitarApi<Record<string, unknown>>('/procesos-alojamiento', { method: 'POST', body: JSON.stringify({ nombre: 'Asignacion masiva ' + new Date().toISOString().slice(0, 10), tipo: 'MASIVO', periodo_registro_id: periodoId, conjunto_regla_id: conjuntoId }) })
    const procesoId = Number((proceso as Record<string, unknown>).id)
    const detalles: AsignarCuartosMasivosResultado['detalles'] = []
    let ejecucionOk = false
    try {
      await apiFetch(`/api/v1/procesos-alojamiento/${procesoId}/ejecutar`, { method: 'POST', body: JSON.stringify({ base: 'FIJANDO_BLOQUEADAS', algoritmo: 'CPSAT' }) })
      ejecucionOk = true
    } catch (caught) {
      const msg = caught instanceof ErrorHttp ? caught.message : String(caught)
      for (const asignacion of asignaciones) detalles.push({ estudianteId: asignacion.estudianteId, cuartoId: asignacion.cuartoId, exitoso: false, error: msg })
      return { exitosos: 0, fallidos: asignaciones.length, detalles }
    }
    if (!ejecucionOk) return { exitosos: 0, fallidos: asignaciones.length, detalles }
    try {
      await apiFetch(`/api/v1/procesos-alojamiento/${procesoId}/confirmar`, { method: 'POST', body: JSON.stringify({ excluir_estudiante_ids: [] }) })
    } catch (caught) {
      const msg = caught instanceof ErrorHttp ? caught.message : String(caught)
      for (const asignacion of asignaciones) detalles.push({ estudianteId: asignacion.estudianteId, cuartoId: asignacion.cuartoId, exitoso: false, error: msg })
      return { exitosos: 0, fallidos: asignaciones.length, detalles }
    }
    const estudiantesActualizados = await this.obtenerEstudiantes()
    const estudiantesMap = new Map(estudiantesActualizados.map((e) => [e.id, e]))
    for (const asignacion of asignaciones) {
      const est = estudiantesMap.get(asignacion.estudianteId)
      const asignacionCuarto = est?.asignacion
      if (asignacionCuarto && asignacionCuarto.cuartoId === asignacion.cuartoId) detalles.push({ estudianteId: asignacion.estudianteId, cuartoId: asignacion.cuartoId, exitoso: true })
      else detalles.push({ estudianteId: asignacion.estudianteId, cuartoId: asignacion.cuartoId, exitoso: false, error: 'El estudiante no quedó asignado al cuarto solicitado.' })
    }
    const exitosos = detalles.filter((d) => d.exitoso).length
    const fallidos = detalles.filter((d) => !d.exitoso).length
    return { exitosos, fallidos, detalles }
  }

  private async asegurarPeriodoRegistro(): Promise<number> {
    const periodos = await solicitarJson<Array<{ id: number; inicio: string; fin: string }>>('/periodos-registro')
    if (periodos.length > 0) return periodos[0]!.id
    const creado = await solicitarJson<{ id: number }>('/periodos-registro', { method: 'POST', body: JSON.stringify({ curso_id: 1, inicio: new Date().toISOString().slice(0, 10), fin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) }) })
    return creado!.id
  }

  private async asegurarConjuntoReglaConCondiciones(): Promise<number> {
    const conjuntos = await solicitarJson<Array<{ id: number; nombre: string; ambito: string; condiciones: unknown[] }>>('/conjuntos-regla')
    if (conjuntos.length > 0) {
      const conjunto = conjuntos[0]!
      if (conjunto.condiciones && conjunto.condiciones.length > 0) return conjunto.id
      try {
        const atributos = await solicitarJson<Array<{ id: number; nombre: string; almacenado: boolean; activo: boolean }>>('/atributos')
        const operadores = await solicitarJson<Array<{ id: number; simbolo: string }>>('/operadores')
        const atributoSexo = atributos.find((a) => a.nombre.toLowerCase().includes('sexo'))
        const operadorIgual = operadores.find((o) => o.simbolo === 'IGUAL')
        if (atributoSexo && operadorIgual) {
          await solicitarJson<unknown>(`/conjuntos-regla/${conjunto.id}/condiciones`, { method: 'POST', body: JSON.stringify({ atributo_def_id: atributoSexo.id, operador_id: operadorIgual.id, valor_texto: 'Femenino' }) })
        }
      } catch {}
      return conjunto.id
    }
    const atributos = await solicitarJson<Array<{ id: number; nombre: string; almacenado: boolean; activo: boolean }>>('/atributos')
    const operadores = await solicitarJson<Array<{ id: number; simbolo: string }>>('/operadores')
    const atributoSexo = atributos.find((a) => a.nombre.toLowerCase().includes('sexo'))
    const operadorIgual = operadores.find((o) => o.simbolo === 'IGUAL')
    const cuerpo: Record<string, unknown> = { nombre: 'Reglas alojamiento por defecto', ambito: 'ALOJAMIENTO', desde: new Date().toISOString().slice(0, 10), fin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) }
    if (atributoSexo && operadorIgual) cuerpo.condiciones = [{ atributo_def_id: atributoSexo.id, operador_id: operadorIgual.id, valor_texto: 'Femenino' }]
    const creado = await solicitarJson<{ id: number }>('/conjuntos-regla', { method: 'POST', body: JSON.stringify(cuerpo) })
    return creado!.id
  }

  async eliminarEstudiante(id: number): Promise<void> {
    const response = await apiFetch(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify({ activo: false }) })
    if (!response.ok) throw new ErrorHttp(response.status, await apiErrorMessage(response))
  }

  async obtenerProcesosAlojamiento(): Promise<ProcesoAlojamiento[]> { return solicitarApi<ProcesoAlojamiento[]>('/procesos-alojamiento') }
  async obtenerProcesoAlojamiento(id: number): Promise<ProcesoAlojamiento> { return solicitarJson<ProcesoAlojamiento>(`/procesos-alojamiento/${id}`) }
  async obtenerPreasignacionesProceso(id: number): Promise<PreasignacionLeer[]> { return solicitarApi<PreasignacionLeer[]>(`/procesos-alojamiento/${id}/preasignaciones`) }
  async obtenerAtributos(): Promise<AtributoDisponible[]> { return obtenerAtributos() }
  async obtenerOperadores(): Promise<OperadorDisponible[]> { return obtenerOperadores() }
  async crearConjuntoRegla(conjunto: ConjuntoReglaCrear): Promise<{ id: number }> { return crearConjuntoRegla(conjunto) }
}