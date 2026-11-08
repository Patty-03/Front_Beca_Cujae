export type TipoDocumento = 'convenio' | 'boleta' | 'tarjeta' | 'acta_responsabilidad_material'

export interface Aviso {
  id: string
  titulo: string
  contenido: string
  fecha: string
  prioridad: 'baja' | 'media' | 'alta'
}

export interface Notificacion {
  id: string
  titulo: string
  mensaje: string
  fecha: string
  leida: boolean
  tipo: 'info' | 'exito' | 'advertencia' | 'error'
}

export interface Documento {
  id: string
  nombre: string
  tipo: TipoDocumento
  descripcion: string
  url: string
  fechaSubida: string
  firmado: boolean
  fechaFirma?: string
  firmadoPor?: string
}

export interface PreguntaFrecuente {
  id: string
  categoria: string
  pregunta: string
  respuesta: string
}

export const ETIQUETAS_TIPO_DOCUMENTO: Record<TipoDocumento, string> = {
  convenio: 'Convenio de alojamiento',
  boleta: 'Boleta de la facultad',
  tarjeta: 'Tarjeta de caracterización',
  acta_responsabilidad_material: 'Acta de responsabilidad material',
}

export const ETIQUETAS_PRIORIDAD: Record<'baja' | 'media' | 'alta', string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
}

export const ETIQUETAS_TIPO_NOTIFICACION: Record<Notificacion['tipo'], string> = {
  info: 'Información',
  exito: 'Éxito',
  advertencia: 'Advertencia',
  error: 'Error',
}
