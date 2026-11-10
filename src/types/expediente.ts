export type TipoEvaluacion =
  | 'academica'
  | 'disciplinaria'
  | 'social'
  | 'otra';

export type EstadoEvaluacion = 'pendiente' | 'aprobada' | 'rechazada';

export interface Evaluacion {
  id: number;
  estudiante_id: number;
  tipo_evaluacion: TipoEvaluacion;
  resultado: string;
  fecha: string;
  resuelto_por?: number;
  resuelto_por_nombre?: string;
  creado_en: string;
}

export interface HistorialAlojamiento {
  id: number;
  cuarto_id: number;
  cuarto_nombre: string;
  edificio_id: number;
  edificio_nombre: string;
  escalera_id: number;
  escalera_nombre: string;
  desde: string;
  hasta: string | null;
  estado_constructivo_id: number;
  estado_constructivo_nombre: string;
}

export interface ExpedienteEstudiante {
  id: number;
  carnet_de_identidad: string | null;
  pasaporte: string | null;
  nombre: string;
  fecha_nacimiento: string;
  edad: number;
  sexo: { id: number; nombre: string };
  pais: { id: number; nombre: string };
  municipio: { id: number; nombre: string } | null;
  especialidad: { id: number; nombre: string; facultad: { id: number; nombre: string } };
  anio_academico: number | null;
  grupo: number | null;
  fecha_de_ingreso: string | null;
  correo_institucional: string | null;
  correo_alternativo: string | null;
  telefono: string | null;
  direccion_particular: string | null;
  padecimiento: string | null;
  madre: string | null;
  padre: string | null;
  telefono_madre: string | null;
  telefono_padre: string | null;
  militancia: string | null;
  observaciones: string | null;
  zona_procedencia: string | null;
  universidad_origen: string | null;
  tipo_ingreso: { id: number; nombre: string } | null;
  estado: string; // 'activo', 'condicional', 'baja'
  // Evaluaciones
  evaluaciones: Evaluacion[];
  // Historial de alojamientos (cuartos por año)
  historial_alojamiento: HistorialAlojamiento[];
}

export interface CrearEvaluacionInput {
  estudiante_id: number;
  tipo_evaluacion: TipoEvaluacion;
  resultado: string;
  fecha: string;
}

export interface FiltrosEvaluacion {
  estudiante_id?: number;
  tipo_evaluacion?: TipoEvaluacion;
  fecha_desde?: string;
  fecha_hasta?: string;
}
