import type {
  AmbitoRegla,
  AtributoDisponible,
  CondicionInput,
  ConjuntoCrearInput,
  ConjuntoLeer,
  ConjuntoResumen,
  ConjuntoVersionInput,
  OperadorDisponible,
  PrioridadInput,
} from '@/types/reglas'

export interface ReglasRepository {
  listarConjuntos(filtros?: {
    ambito?: AmbitoRegla
    vigente?: boolean
    nombre?: string
  }): Promise<ConjuntoResumen[]>
  obtenerConjunto(id: number): Promise<ConjuntoLeer>
  crearConjunto(input: ConjuntoCrearInput): Promise<ConjuntoLeer>
  crearVersionConjunto(id: number, input: ConjuntoVersionInput): Promise<ConjuntoLeer>
  eliminarConjunto(id: number): Promise<void>
  agregarCondicion(conjuntoId: number, input: CondicionInput): Promise<ConjuntoLeer>
  actualizarCondicion(
    conjuntoId: number,
    condicionId: number,
    input: Partial<CondicionInput>,
  ): Promise<ConjuntoLeer>
  quitarCondicion(conjuntoId: number, condicionId: number): Promise<void>
  agregarPrioridad(conjuntoId: number, input: PrioridadInput): Promise<ConjuntoLeer>
  actualizarPrioridad(
    conjuntoId: number,
    prioridadId: number,
    input: Partial<PrioridadInput>,
  ): Promise<ConjuntoLeer>
  quitarPrioridad(conjuntoId: number, prioridadId: number): Promise<void>
  obtenerAtributosRegla(ambito: AmbitoRegla): Promise<AtributoDisponible[]>
  obtenerOperadoresRegla(): Promise<OperadorDisponible[]>
}
