export type { AtributoDisponible, OperadorDisponible } from '@/types/estudiante'

export type AmbitoRegla = 'ALOJAMIENTO' | 'DEBER'

export type TipoPrioridad = 'ORDEN' | 'AGRUPAMIENTO' | 'CONSERVAR'

export type SentidoOrden = 'ASC' | 'DESC'

export type NivelAgrupamiento = 'CUARTO' | 'ESCALERA' | 'EDIFICIO'

export interface ConjuntoResumen {
  id: number
  nombre: string
  ambito: string
  version: number
  desde: string
  hasta: string | null
  versionAnteriorId: number | null
  vigente: boolean
  enUso: boolean
}

export interface CondicionLeer {
  id: number
  atributoDefId: number
  atributo: string
  operadorId: number
  operador: string
  valorTexto: string | null
  valorEntero: number | null
  valorFecha: string | null
  valorBool: boolean | null
  valorPermitidoId: number | null
  valorPermitido: string | null
  parametro: number | null
}

export interface PrioridadLeer {
  id: number
  atributoDefId: number
  atributo: string
  tipo: string
  orden: number
  sentido: string | null
  nivelAgrupamiento: string | null
  nulosAlFinal: boolean
  parametro: number | null
}

export interface ConjuntoLeer extends ConjuntoResumen {
  condiciones: CondicionLeer[]
  prioridades: PrioridadLeer[]
}

export interface CondicionInput {
  atributoDefId: number
  operadorId: number
  valorTexto?: string
  valorEntero?: number
  valorFecha?: string
  valorBool?: boolean
  valorPermitidoId?: number
  parametro?: number
}

export interface PrioridadInput {
  atributoDefId: number
  tipo: TipoPrioridad
  orden: number
  sentido?: SentidoOrden
  nivelAgrupamiento?: NivelAgrupamiento
  nulosAlFinal?: boolean
  parametro?: number
}

export interface ConjuntoCrearInput {
  nombre: string
  ambito: AmbitoRegla
  condiciones?: CondicionInput[]
  prioridades?: PrioridadInput[]
}

export interface ConjuntoVersionInput {
  condiciones?: CondicionInput[]
  prioridades?: PrioridadInput[]
}
