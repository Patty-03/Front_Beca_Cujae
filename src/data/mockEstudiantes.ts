import { alojamientos, cuartos } from '@/data/mockInfraestructura'
import type {
  DeberEstudiante,
  EstadoBeca,
  Estudiante,
  Sexo,
  TipoDeber,
} from '@/types/estudiante'

export type EstudianteRecord = Omit<
  Estudiante,
  'asignacion' | 'deberes' | 'deberesPendientes' | 'deberesIncumplidos'
>

export interface DeberRecord extends DeberEstudiante {
  estudianteId: number
}

export interface ExtrasAsignacionRecord {
  taquilla?: string
  llaveEntregada: boolean
  llaveTaquillaEntregada: boolean
}

const hoy = () => new Date().toISOString().slice(0, 10)

const fechaRelativa = (dias: number) => {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + dias)
  return fecha.toISOString().slice(0, 10)
}

const fechaNacimientoRelativa = (edad: number) => {
  const fecha = new Date()
  fecha.setFullYear(fecha.getFullYear() - edad)
  fecha.setMonth((fecha.getMonth() + 7) % 12)
  return fecha.toISOString().slice(0, 10)
}

const provincias = [
  'Pinar del Río',
  'Artemisa',
  'Mayabeque',
  'Matanzas',
  'Cienfuegos',
  'Villa Clara',
  'Sancti Spíritus',
  'Ciego de Ávila',
  'Camagüey',
  'Las Tunas',
  'Holguín',
  'Granma',
  'Santiago de Cuba',
  'Guantánamo',
  'Isla de la Juventud',
]

const municipios: Record<string, string> = {
  'Pinar del Río': 'Pinar del Río',
  Artemisa: 'Artemisa',
  Mayabeque: 'San José de las Lajas',
  Matanzas: 'Matanzas',
  Cienfuegos: 'Cienfuegos',
  'Villa Clara': 'Santa Clara',
  'Sancti Spíritus': 'Sancti Spíritus',
  'Ciego de Ávila': 'Ciego de Ávila',
  Camagüey: 'Camagüey',
  'Las Tunas': 'Las Tunas',
  Holguín: 'Holguín',
  Granma: 'Bayamo',
  'Santiago de Cuba': 'Santiago de Cuba',
  Guantánamo: 'Guantánamo',
  'Isla de la Juventud': 'Nueva Gerona',
}

const carreras = [
  ['Ingeniería Informática', 'Facultad de Ingeniería Informática'],
  ['Ingeniería Civil', 'Facultad de Ingeniería Civil'],
  ['Arquitectura', 'Facultad de Arquitectura'],
  ['Ingeniería Industrial', 'Facultad de Ingeniería Industrial'],
  ['Ingeniería Eléctrica', 'Facultad de Ingeniería Eléctrica'],
  ['Ingeniería Mecánica', 'Facultad de Ingeniería Mecánica'],
  ['Ingeniería Química', 'Facultad de Ingeniería Química'],
  ['Licenciatura en Matemática', 'Facultad de Ciencias Básicas'],
] as const

const especialidades: Record<string, string> = {
  'Ingeniería Informática': 'Ciencias Informáticas',
  'Ingeniería Civil': 'Estructuras',
  Arquitectura: 'Diseño Arquitectónico',
  'Ingeniería Industrial': 'Logística y Producción',
  'Ingeniería Eléctrica': 'Sistemas Eléctricos',
  'Ingeniería Mecánica': 'Mecánica Aplicada',
  'Ingeniería Química': 'Procesos Químicos',
  'Licenciatura en Matemática': 'Matemática Aplicada',
}

const preuniversitarios = [
  'IPVCE Federico Engels',
  'IPUEC Antonio Maceo',
  'IPU José Martí',
  'IPVCE Luis Urquiza Jorge',
  'IPUEC Máximo Gómez',
]

const nombresF = ['Ana', 'Mariela', 'Claudia', 'Laura', 'Daniela', 'Yusmila', 'Caridad', 'Lissette']
const nombresM = ['Carlos', 'Luis', 'Ernesto', 'Raúl', 'Alejandro', 'Yunior', 'Manuel', 'Javier']
const apellidos = [
  'Rodríguez',
  'Pérez',
  'Gómez',
  'Fernández',
  'García',
  'Martínez',
  'Sánchez',
  'Ramírez',
  'Torres',
  'Díaz',
  'Cruz',
  'Morales',
]

function nombreCompleto(indice: number, sexo: Sexo): string {
  const nombres = sexo === 'F' ? nombresF : nombresM
  const primerNombre = nombres[indice % nombres.length] ?? 'Estudiante'
  const primerApellido = apellidos[indice % apellidos.length] ?? 'Pérez'
  const segundoApellido = apellidos[(indice + 3) % apellidos.length] ?? 'Gómez'
  return `${primerNombre} ${primerApellido} ${segundoApellido}`
}

function crearEstudianteBase(
  indice: number,
  id: number,
  estadoBeca: EstadoBeca = 'activo',
): EstudianteRecord {
  const sexo: Sexo = indice % 2 === 0 ? 'F' : 'M'
  const provincia = provincias[indice % provincias.length] ?? 'Pinar del Río'
  const [carrera, facultad] =
    carreras[indice % carreras.length] ??
    ['Ingeniería Informática', 'Facultad de Ingeniería Informática']
  const anioAcademico = (indice % 5) + 1
  const telefono = `5${String(1000000 + indice * 7919).slice(0, 7)}`
  const municipio = municipios[provincia] ?? provincia

  return {
    id,
    carnet: `CI-${String(id).padStart(6, '0')}`,
    nombre: nombreCompleto(indice, sexo),
    fechaNacimiento: fechaNacimientoRelativa(18 + (indice % 5)),
    sexo,
    pais: 'Cuba',
    provincia,
    municipio,
    facultad,
    carrera,
    especialidad: especialidades[carrera] ?? carrera,
    anioAcademico,
    grupo: `${anioAcademico}${(indice % 3) + 1}`,
    preuniversitario:
      preuniversitarios[indice % preuniversitarios.length] ?? 'IPVCE Federico Engels',
    tipoIngreso: 'residente_provincia',
    estadoBeca,
    fechaIngreso: `${2026 - anioAcademico}-09-01`,
    direccionParticular: `Calle ${indice + 1} #${100 + indice}, ${municipio}`,
    telefono,
    padecimiento: indice % 7 === 0 ? 'Asma bronquial' : undefined,
    madre: `María ${apellidos[(indice + 1) % apellidos.length] ?? 'Pérez'}`,
    padre: `José ${apellidos[(indice + 2) % apellidos.length] ?? 'Gómez'}`,
    telefonoMadre: `5${String(2000000 + indice * 6151).slice(0, 7)}`,
    telefonoPadre: `5${String(3000000 + indice * 4363).slice(0, 7)}`,
    militancia: indice % 4 === 0 ? 'UJC' : 'Sin militancia',
    observaciones: estadoBeca === 'condicional' ? 'Seguimiento por evaluación anual.' : undefined,
  }
}

const alojamientosActivos = alojamientos.filter(
  (alojamiento) => !alojamiento.hasta || alojamiento.hasta >= hoy(),
)

const idsConAlojamiento = [...new Set(alojamientosActivos.map((item) => item.estudianteId))].slice(
  0,
  24,
)

export const estudiantes: EstudianteRecord[] = idsConAlojamiento.map((id, indice) =>
  crearEstudianteBase(indice, id),
)

const INDICE_INICIO_SIN_CUARTO = 50001

const estudiantesSinCuarto = Array.from({ length: 6 }, (_, indice) => {
  const id = INDICE_INICIO_SIN_CUARTO + indice
  const estadoBeca: EstadoBeca = indice === 4 ? 'condicional' : indice === 5 ? 'baja' : 'activo'
  return crearEstudianteBase(idsConAlojamiento.length + indice, id, estadoBeca)
})

estudiantes.push(...estudiantesSinCuarto)

export const extrasAsignacion: Record<number, ExtrasAsignacionRecord> = Object.fromEntries(
  idsConAlojamiento.slice(0, 10).map((id, indice) => [
    id,
    {
      taquilla: indice % 3 === 0 ? `T-${String(indice + 1).padStart(3, '0')}` : undefined,
      llaveEntregada: indice % 4 !== 0,
      llaveTaquillaEntregada: indice % 3 === 0,
    },
  ]),
)

const tiposDeber: TipoDeber[] = [
  'guardia',
  'limpieza_areas_verdes',
  'limpieza_escaleras',
  'limpieza_cuarto',
]

const turnos = ['Mañana', 'Tarde', 'Noche']

export const deberes: DeberRecord[] = idsConAlojamiento
  .slice(0, 14)
  .flatMap((estudianteId, indice) => {
    const alojamiento = alojamientosActivos.find((item) => item.estudianteId === estudianteId)
    const cuarto = cuartos.find((item) => item.id === alojamiento?.cuartoId)
    const tipo = tiposDeber[indice % tiposDeber.length] ?? 'guardia'
    const estado: DeberEstudiante['estado'] =
      indice % 5 === 0 ? 'incumplido' : indice % 3 === 0 ? 'cumplido' : 'pendiente'
    const cantidad = indice % 2 === 0 ? 2 : 1

    return Array.from({ length: cantidad }, (_, posicion) => ({
      id: indice * 10 + posicion + 1,
      estudianteId,
      tipo,
      descripcion:
        tipo === 'guardia'
          ? `Guardia de ${(turnos[(indice + posicion) % turnos.length] ?? 'Mañana').toLowerCase()} en el edificio`
          : tipo === 'limpieza_cuarto'
            ? `Limpieza interna del cuarto ${cuarto?.nombre ?? ''}`.trim()
            : tipo === 'limpieza_escaleras'
              ? 'Limpieza de escaleras del edificio'
              : 'Limpieza de áreas verdes',
      fecha: fechaRelativa(posicion === 0 ? indice - 3 : indice + 2),
      turno: tipo === 'guardia' ? (turnos[(indice + posicion) % turnos.length] ?? 'Mañana') : undefined,
      estado,
      cuartoNombre: tipo === 'limpieza_cuarto' ? cuarto?.nombre : undefined,
    }))
  })
