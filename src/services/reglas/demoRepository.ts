import type {
  AmbitoRegla,
  AtributoDisponible,
  CondicionInput,
  CondicionLeer,
  ConjuntoCrearInput,
  ConjuntoLeer,
  ConjuntoResumen,
  ConjuntoVersionInput,
  OperadorDisponible,
  PrioridadInput,
  PrioridadLeer,
} from '@/types/reglas'
import type { ReglasRepository } from './contracts'

const delay = (ms = 160) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const hoy = () => new Date().toISOString().slice(0, 10)

function clonar<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor)) as T
}

const ATRIBUTOS_ALOJAMIENTO: AtributoDisponible[] = [
  {
    id: 1,
    nombre: 'Provincia',
    tipoDatoId: 1,
    tipoDatoNombre: 'Texto',
    almacenado: true,
    activo: true,
    valoresPermitidos: [],
  },
  {
    id: 2,
    nombre: 'Año académico',
    tipoDatoId: 2,
    tipoDatoNombre: 'Entero',
    almacenado: true,
    activo: true,
    valoresPermitidos: [],
  },
  {
    id: 3,
    nombre: 'Sexo',
    tipoDatoId: 5,
    tipoDatoNombre: 'Lista',
    almacenado: true,
    activo: true,
    valoresPermitidos: [
      { id: 1, valor: 'Femenino' },
      { id: 2, valor: 'Masculino' },
    ],
  },
  {
    id: 4,
    nombre: 'Último edificio',
    tipoDatoId: 6,
    tipoDatoNombre: 'Referencia',
    almacenado: false,
    activo: true,
    valoresPermitidos: [],
  },
]

const ATRIBUTOS_DEBER: AtributoDisponible[] = [
  {
    id: 5,
    nombre: 'Provincia',
    tipoDatoId: 1,
    tipoDatoNombre: 'Texto',
    almacenado: true,
    activo: true,
    valoresPermitidos: [],
  },
  {
    id: 6,
    nombre: 'Año académico',
    tipoDatoId: 2,
    tipoDatoNombre: 'Entero',
    almacenado: true,
    activo: true,
    valoresPermitidos: [],
  },
  {
    id: 7,
    nombre: 'Cantidad de deberes',
    tipoDatoId: 2,
    tipoDatoNombre: 'Entero',
    almacenado: false,
    activo: true,
    valoresPermitidos: [],
  },
]

const OPERADORES: OperadorDisponible[] = [
  { id: 1, simbolo: '=', nombre: 'Igual a', soloOrdenables: false },
  { id: 2, simbolo: '!=', nombre: 'Distinto de', soloOrdenables: false },
  { id: 3, simbolo: '>', nombre: 'Mayor que', soloOrdenables: true },
  { id: 4, simbolo: '<', nombre: 'Menor que', soloOrdenables: true },
]

function nombreAtributo(id: number): string {
  return (
    [...ATRIBUTOS_ALOJAMIENTO, ...ATRIBUTOS_DEBER].find((atributo) => atributo.id === id)
      ?.nombre ?? `Atributo ${id}`
  )
}

function simboloOperador(id: number): string {
  return OPERADORES.find((operador) => operador.id === id)?.simbolo ?? String(id)
}

let siguienteConjuntoId = 4
let siguienteCondicionId = 10
let siguientePrioridadId = 10

function aCondicion(input: CondicionInput, id: number): CondicionLeer {
  return {
    id,
    atributoDefId: input.atributoDefId,
    atributo: nombreAtributo(input.atributoDefId),
    operadorId: input.operadorId,
    operador: simboloOperador(input.operadorId),
    valorTexto: input.valorTexto ?? null,
    valorEntero: input.valorEntero ?? null,
    valorFecha: input.valorFecha ?? null,
    valorBool: input.valorBool ?? null,
    valorPermitidoId: input.valorPermitidoId ?? null,
    valorPermitido: null,
    parametro: input.parametro ?? null,
  }
}

function aPrioridad(input: PrioridadInput, id: number): PrioridadLeer {
  return {
    id,
    atributoDefId: input.atributoDefId,
    atributo: nombreAtributo(input.atributoDefId),
    tipo: input.tipo,
    orden: input.orden,
    sentido: input.sentido ?? null,
    nivelAgrupamiento: input.nivelAgrupamiento ?? null,
    nulosAlFinal: input.nulosAlFinal ?? true,
    parametro: input.parametro ?? null,
  }
}

const conjuntos: ConjuntoLeer[] = [
  {
    id: 1,
    nombre: 'Afín por provincia',
    ambito: 'ALOJAMIENTO',
    version: 1,
    desde: '2026-09-01',
    hasta: null,
    versionAnteriorId: null,
    vigente: true,
    enUso: true,
    condiciones: [
      {
        id: 1,
        atributoDefId: 1,
        atributo: 'Provincia',
        operadorId: 1,
        operador: '=',
        valorTexto: 'La Habana',
        valorEntero: null,
        valorFecha: null,
        valorBool: null,
        valorPermitidoId: null,
        valorPermitido: null,
        parametro: null,
      },
    ],
    prioridades: [
      {
        id: 1,
        atributoDefId: 2,
        atributo: 'Año académico',
        tipo: 'ORDEN',
        orden: 1,
        sentido: 'ASC',
        nivelAgrupamiento: null,
        nulosAlFinal: true,
        parametro: null,
      },
    ],
  },
  {
    id: 2,
    nombre: 'Conservar ubicación previa',
    ambito: 'ALOJAMIENTO',
    version: 1,
    desde: '2026-09-01',
    hasta: null,
    versionAnteriorId: null,
    vigente: true,
    enUso: false,
    condiciones: [
      {
        id: 2,
        atributoDefId: 3,
        atributo: 'Sexo',
        operadorId: 1,
        operador: '=',
        valorTexto: null,
        valorEntero: null,
        valorFecha: null,
        valorBool: null,
        valorPermitidoId: 1,
        valorPermitido: 'Femenino',
        parametro: null,
      },
    ],
    prioridades: [
      {
        id: 2,
        atributoDefId: 4,
        atributo: 'Último edificio',
        tipo: 'CONSERVAR',
        orden: 1,
        sentido: null,
        nivelAgrupamiento: null,
        nulosAlFinal: true,
        parametro: null,
      },
    ],
  },
  {
    id: 3,
    nombre: 'Rotación por año',
    ambito: 'DEBER',
    version: 1,
    desde: '2026-09-01',
    hasta: null,
    versionAnteriorId: null,
    vigente: true,
    enUso: true,
    condiciones: [],
    prioridades: [
      {
        id: 3,
        atributoDefId: 6,
        atributo: 'Año académico',
        tipo: 'ORDEN',
        orden: 1,
        sentido: 'DESC',
        nivelAgrupamiento: null,
        nulosAlFinal: true,
        parametro: null,
      },
    ],
  },
]

function solicitarConjunto(id: number): ConjuntoLeer {
  const conjunto = conjuntos.find((item) => item.id === id)
  if (!conjunto) throw new Error('El conjunto de reglas solicitado no existe.')
  return conjunto
}

function verificarEditable(conjunto: ConjuntoLeer): void {
  if (conjunto.enUso) {
    throw new Error('El conjunto está en uso; cree una versión nueva para modificarlo.')
  }
}

export async function listarConjuntos(filtros?: {
  ambito?: AmbitoRegla
  vigente?: boolean
  nombre?: string
}): Promise<ConjuntoResumen[]> {
  await delay()
  const nombre = filtros?.nombre?.trim().toLowerCase() ?? ''

  return conjuntos
    .filter(
      (conjunto) =>
        (!filtros?.ambito || conjunto.ambito === filtros.ambito) &&
        (filtros?.vigente == null || conjunto.vigente === filtros.vigente) &&
        (!nombre || conjunto.nombre.toLowerCase().includes(nombre)),
    )
    .map((conjunto) => clonar(conjunto))
}

export async function obtenerConjunto(id: number): Promise<ConjuntoLeer> {
  await delay()
  return clonar(solicitarConjunto(id))
}

export async function crearConjunto(input: ConjuntoCrearInput): Promise<ConjuntoLeer> {
  await delay()
  const conjunto: ConjuntoLeer = {
    id: siguienteConjuntoId++,
    nombre: input.nombre,
    ambito: input.ambito,
    version: 1,
    desde: hoy(),
    hasta: null,
    versionAnteriorId: null,
    vigente: true,
    enUso: false,
    condiciones: (input.condiciones ?? []).map((condicion) =>
      aCondicion(condicion, siguienteCondicionId++),
    ),
    prioridades: (input.prioridades ?? []).map((prioridad) =>
      aPrioridad(prioridad, siguientePrioridadId++),
    ),
  }
  conjuntos.push(conjunto)
  return clonar(conjunto)
}

export async function crearVersionConjunto(
  id: number,
  input: ConjuntoVersionInput,
): Promise<ConjuntoLeer> {
  await delay()
  const anterior = solicitarConjunto(id)

  anterior.vigente = false
  anterior.hasta = hoy()

  const condiciones = input.condiciones
    ? input.condiciones.map((condicion) => aCondicion(condicion, siguienteCondicionId++))
    : anterior.condiciones.map((condicion) => ({
        ...clonar(condicion),
        id: siguienteCondicionId++,
      }))
  const prioridades = input.prioridades
    ? input.prioridades.map((prioridad) => aPrioridad(prioridad, siguientePrioridadId++))
    : anterior.prioridades.map((prioridad) => ({
        ...clonar(prioridad),
        id: siguientePrioridadId++,
      }))

  const version: ConjuntoLeer = {
    id: siguienteConjuntoId++,
    nombre: anterior.nombre,
    ambito: anterior.ambito,
    version: anterior.version + 1,
    desde: hoy(),
    hasta: null,
    versionAnteriorId: anterior.id,
    vigente: true,
    enUso: false,
    condiciones,
    prioridades,
  }
  conjuntos.push(version)
  return clonar(version)
}

export async function eliminarConjunto(id: number): Promise<void> {
  await delay()
  const indice = conjuntos.findIndex((item) => item.id === id)
  if (indice < 0) throw new Error('El conjunto de reglas solicitado no existe.')
  conjuntos.splice(indice, 1)
}

export async function agregarCondicion(
  conjuntoId: number,
  input: CondicionInput,
): Promise<ConjuntoLeer> {
  await delay()
  const conjunto = solicitarConjunto(conjuntoId)
  verificarEditable(conjunto)
  conjunto.condiciones.push(aCondicion(input, siguienteCondicionId++))
  return clonar(conjunto)
}

export async function actualizarCondicion(
  conjuntoId: number,
  condicionId: number,
  input: Partial<CondicionInput>,
): Promise<ConjuntoLeer> {
  await delay()
  const conjunto = solicitarConjunto(conjuntoId)
  verificarEditable(conjunto)
  const condicion = conjunto.condiciones.find((item) => item.id === condicionId)
  if (!condicion) throw new Error('La condición solicitada no existe.')

  if (input.atributoDefId != null) {
    condicion.atributoDefId = input.atributoDefId
    condicion.atributo = nombreAtributo(input.atributoDefId)
  }
  if (input.operadorId != null) {
    condicion.operadorId = input.operadorId
    condicion.operador = simboloOperador(input.operadorId)
  }
  if ('valorTexto' in input) condicion.valorTexto = input.valorTexto ?? null
  if ('valorEntero' in input) condicion.valorEntero = input.valorEntero ?? null
  if ('valorFecha' in input) condicion.valorFecha = input.valorFecha ?? null
  if ('valorBool' in input) condicion.valorBool = input.valorBool ?? null
  if ('valorPermitidoId' in input) {
    condicion.valorPermitidoId = input.valorPermitidoId ?? null
  }
  if ('parametro' in input) condicion.parametro = input.parametro ?? null

  return clonar(conjunto)
}

export async function quitarCondicion(
  conjuntoId: number,
  condicionId: number,
): Promise<void> {
  await delay()
  const conjunto = solicitarConjunto(conjuntoId)
  verificarEditable(conjunto)
  const indice = conjunto.condiciones.findIndex((item) => item.id === condicionId)
  if (indice < 0) throw new Error('La condición solicitada no existe.')
  conjunto.condiciones.splice(indice, 1)
}

export async function agregarPrioridad(
  conjuntoId: number,
  input: PrioridadInput,
): Promise<ConjuntoLeer> {
  await delay()
  const conjunto = solicitarConjunto(conjuntoId)
  verificarEditable(conjunto)
  conjunto.prioridades.push(aPrioridad(input, siguientePrioridadId++))
  return clonar(conjunto)
}

export async function actualizarPrioridad(
  conjuntoId: number,
  prioridadId: number,
  input: Partial<PrioridadInput>,
): Promise<ConjuntoLeer> {
  await delay()
  const conjunto = solicitarConjunto(conjuntoId)
  verificarEditable(conjunto)
  const prioridad = conjunto.prioridades.find((item) => item.id === prioridadId)
  if (!prioridad) throw new Error('La prioridad solicitada no existe.')

  if (input.atributoDefId != null) {
    prioridad.atributoDefId = input.atributoDefId
    prioridad.atributo = nombreAtributo(input.atributoDefId)
  }
  if (input.tipo != null) prioridad.tipo = input.tipo
  if (input.orden != null) prioridad.orden = input.orden
  if ('sentido' in input) prioridad.sentido = input.sentido ?? null
  if ('nivelAgrupamiento' in input) {
    prioridad.nivelAgrupamiento = input.nivelAgrupamiento ?? null
  }
  if (input.nulosAlFinal != null) prioridad.nulosAlFinal = input.nulosAlFinal
  if ('parametro' in input) prioridad.parametro = input.parametro ?? null

  return clonar(conjunto)
}

export async function quitarPrioridad(
  conjuntoId: number,
  prioridadId: number,
): Promise<void> {
  await delay()
  const conjunto = solicitarConjunto(conjuntoId)
  verificarEditable(conjunto)
  const indice = conjunto.prioridades.findIndex((item) => item.id === prioridadId)
  if (indice < 0) throw new Error('La prioridad solicitada no existe.')
  conjunto.prioridades.splice(indice, 1)
}

export async function obtenerAtributosRegla(ambito: AmbitoRegla): Promise<AtributoDisponible[]> {
  await delay(80)
  const origen = ambito === 'ALOJAMIENTO' ? ATRIBUTOS_ALOJAMIENTO : ATRIBUTOS_DEBER
  return clonar(origen.filter((atributo) => atributo.activo))
}

export async function obtenerOperadoresRegla(): Promise<OperadorDisponible[]> {
  await delay(80)
  return clonar(OPERADORES)
}

export const demoReglasRepository: ReglasRepository = {
  listarConjuntos,
  obtenerConjunto,
  crearConjunto,
  crearVersionConjunto,
  eliminarConjunto,
  agregarCondicion,
  actualizarCondicion,
  quitarCondicion,
  agregarPrioridad,
  actualizarPrioridad,
  quitarPrioridad,
  obtenerAtributosRegla,
  obtenerOperadoresRegla,
}
