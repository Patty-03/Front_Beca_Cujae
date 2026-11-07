import type { Aviso, Documento, Notificacion, PreguntaFrecuente } from '@/types/estudiante-view'
import { useAuthStore } from '@/stores/auth'

const hoy = () => new Date().toISOString().slice(0, 10)

const avisos: Aviso[] = [
  {
    id: 'a-1',
    titulo: 'Inicio del curso académico 2026-2027',
    contenido: 'Se recuerda a todos los becados que el curso académico inicia el próximo lunes 1 de septiembre. La entrega de llaves se realizará en la portería del edificio correspondiente.',
    fecha: '2026-08-25',
    prioridad: 'alta',
  },
  {
    id: 'a-2',
    titulo: 'Plan de limpieza de áreas verdes',
    contenido: 'A partir del lunes se activa el cronograma de limpieza de áreas verdes. Consulte su turno asignado en la sección de deberes.',
    fecha: '2026-08-20',
    prioridad: 'media',
  },
  {
    id: 'a-3',
    titulo: 'Inspección de cuartos',
    contenido: 'El próximo viernes se realizará una inspección general de cuartos. Asegúrese de tener su habitación en orden.',
    fecha: '2026-08-15',
    prioridad: 'baja',
  },
]

const notificaciones: Notificacion[] = [
  {
    id: 'n-1',
    titulo: 'Asignación de cuarto confirmada',
    mensaje: 'Su solicitud de asignación de cuarto ha sido confirmada. Puede consultar los detalles en su perfil.',
    fecha: '2026-08-28',
    leida: false,
    tipo: 'exito',
  },
  {
    id: 'n-2',
    titulo: 'Deber pendiente: Guardia',
    mensaje: 'Tiene un deber de guardia pendiente para mañana en el turno de la mañana.',
    fecha: '2026-08-27',
    leida: false,
    tipo: 'advertencia',
  },
  {
    id: 'n-3',
    titulo: 'Beca actualizada',
    mensaje: 'Su estado de beca ha sido actualizado a activo. Puede descargar su certificado en la sección de documentos.',
    fecha: '2026-08-20',
    leida: true,
    tipo: 'info',
  },
]

const documentos: Documento[] = [
  {
    id: 'd-1',
    nombre: 'Convenio de Alojamiento',
    tipo: 'convenio',
    descripcion: 'Documento firmado que establece los derechos y obligaciones del becado en la residencia.',
    url: '#',
    fechaSubida: '2026-09-01',
    firmado: false,
  },
  {
    id: 'd-2',
    nombre: 'Boleta de la Facultad',
    tipo: 'boleta',
    descripcion: 'Certificado emitido por la facultad que acredita el derecho a beca.',
    url: '#',
    fechaSubida: '2026-09-01',
    firmado: false,
  },
  {
    id: 'd-3',
    nombre: 'Tarjeta de Caracterización del Becado',
    tipo: 'tarjeta',
    descripcion: 'Tarjeta que identifica al estudiante como becado de la residencia.',
    url: '#',
    fechaSubida: '2026-09-01',
    firmado: false,
  },
  {
    id: 'd-4',
    nombre: 'Acta de Responsabilidad Material',
    tipo: 'acta_responsabilidad_material',
    descripcion: 'Acta mediante la cual el becado acepta la responsabilidad sobre los bienes y enseres del cuarto asignado.',
    url: '#',
    fechaSubida: '2026-09-01',
    firmado: false,
  },
]

const preguntasFrecuentes: PreguntaFrecuente[] = [
  {
    id: 'p-1',
    categoria: 'Alojamiento',
    pregunta: '¿Cómo se asignan los cuartos?',
    respuesta: 'Los cuartos se asignan considerando la carrera, año académico, provincia y sexo del estudiante, priorizando la agrupación por carrera.',
  },
  {
    id: 'p-2',
    categoria: 'Beca',
    pregunta: '¿Qué documentos necesito para mantener mi beca?',
    respuesta: 'Debe tener vigente el convenio de alojamiento, la boleta de la facultad y la tarjeta de caracterización del becado.',
  },
  {
    id: 'p-3',
    categoria: 'Deberes',
    pregunta: '¿Qué pasa si incumplo un deber asignado?',
    respuesta: 'Los incumplimientos se registran en su expediente y pueden afectar su estado de beca. Se recomienda cumplir con todos los deberes asignados.',
  },
  {
    id: 'p-4',
    categoria: 'Documentos',
    pregunta: '¿Dónde puedo descargar mis documentos?',
    respuesta: 'En la sección "Mis documentos" de este perfil puede ver y descargar el convenio de alojamiento, la boleta de la facultad y la tarjeta de caracterización.',
  },
]

export const demoEstudianteViewService = {
  obtenerAvisos: async (): Promise<Aviso[]> => {
    return [...avisos]
  },
  obtenerNotificaciones: async (): Promise<Notificacion[]> => {
    return [...notificaciones]
  },
  obtenerDocumentos: async (): Promise<Documento[]> => {
    return [...documentos]
  },
  obtenerPreguntasFrecuentes: async (): Promise<PreguntaFrecuente[]> => {
    return [...preguntasFrecuentes]
  },
  marcarNotificacionLeida: async (id: string): Promise<void> => {
    const notificacion = notificaciones.find((n) => n.id === id)
    if (notificacion) {
      notificacion.leida = true
    }
  },
  descargarDocumento: async (id: string): Promise<void> => {
    const documento = documentos.find((d) => d.id === id)
    if (!documento) throw new Error('Documento no encontrado.')
  },
  firmarDocumento: async (id: string): Promise<void> => {
    const auth = useAuthStore()
    const documento = documentos.find((d) => d.id === id)
    if (!documento) throw new Error('Documento no encontrado.')
    if (documento.firmado) throw new Error('El documento ya está firmado.')
    documento.firmado = true
    documento.fechaFirma = hoy()
    documento.firmadoPor = auth.user?.name ?? auth.user?.email ?? 'estudiante'
  },
  subirDocumento: async (
    documento: Omit<Documento, 'id' | 'firmado' | 'fechaFirma' | 'firmadoPor'>,
    archivo: File,
  ): Promise<Documento> => {
    const nuevo: Documento = {
      ...documento,
      id: `d-${Date.now()}`,
      url: URL.createObjectURL(archivo),
      firmado: false,
    }
    documentos.push(nuevo)
    return nuevo
  },
}

export const obtenerAvisos = demoEstudianteViewService.obtenerAvisos
export const obtenerNotificaciones = demoEstudianteViewService.obtenerNotificaciones
export const obtenerDocumentos = demoEstudianteViewService.obtenerDocumentos
export const obtenerPreguntasFrecuentes = demoEstudianteViewService.obtenerPreguntasFrecuentes
export const marcarNotificacionLeida = demoEstudianteViewService.marcarNotificacionLeida
export const descargarDocumento = demoEstudianteViewService.descargarDocumento
export const firmarDocumento = demoEstudianteViewService.firmarDocumento
export const subirDocumento = demoEstudianteViewService.subirDocumento
