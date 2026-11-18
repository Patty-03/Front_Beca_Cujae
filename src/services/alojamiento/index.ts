import type {
  BloquearInput,
  ConfirmarInput,
  EjecutarInput,
  PreasignacionActualizarInput,
  PreasignacionCrearInput,
  ProcesoCrearInput,
  RestriccionCrearInput,
} from '@/types/alojamiento'
import { modoDemo } from '@/services/auth'
import { demoAlojamientoRepository } from './demoRepository'
import { HttpAlojamientoRepository } from './httpRepository'

const repositorio = modoDemo ? demoAlojamientoRepository : new HttpAlojamientoRepository()

export const listarProcesos = (filtros?: { estado?: string; periodoRegistroId?: number }) =>
  repositorio.listarProcesos(filtros)
export const obtenerProceso = (id: number) => repositorio.obtenerProceso(id)
export const crearProceso = (input: ProcesoCrearInput) => repositorio.crearProceso(input)

export const listarRestricciones = (procesoId: number) =>
  repositorio.listarRestricciones(procesoId)
export const agregarRestricciones = (procesoId: number, input: RestriccionCrearInput) =>
  repositorio.agregarRestricciones(procesoId, input)
export const quitarRestriccion = (procesoId: number, restriccionId: number) =>
  repositorio.quitarRestriccion(procesoId, restriccionId)

export const ejecutarProceso = (procesoId: number, input?: EjecutarInput) =>
  repositorio.ejecutarProceso(procesoId, input)
export const listarPreasignaciones = (procesoId: number) =>
  repositorio.listarPreasignaciones(procesoId)
export const listarNoAlojados = (procesoId: number) =>
  repositorio.listarNoAlojados(procesoId)
export const agregarPreasignacion = (
  procesoId: number,
  input: PreasignacionCrearInput,
) => repositorio.agregarPreasignacion(procesoId, input)
export const actualizarPreasignacion = (
  procesoId: number,
  estudianteId: number,
  input: PreasignacionActualizarInput,
) => repositorio.actualizarPreasignacion(procesoId, estudianteId, input)
export const quitarPreasignacion = (procesoId: number, estudianteId: number) =>
  repositorio.quitarPreasignacion(procesoId, estudianteId)
export const bloquearPreasignaciones = (procesoId: number, input: BloquearInput) =>
  repositorio.bloquearPreasignaciones(procesoId, input)
export const descartarProceso = (procesoId: number) => repositorio.descartarProceso(procesoId)
export const confirmarProceso = (procesoId: number, input?: ConfirmarInput) =>
  repositorio.confirmarProceso(procesoId, input)
export const listarPeriodosRegistro = () => repositorio.listarPeriodosRegistro()
