import {
  alojamientos,
  cuartos,
  edificios,
  escaleras,
  estadosConstructivos,
} from '@/data/mockInfraestructura'
import {
  deberes as deberesIniciales,
  estudiantes as estudiantesIniciales,
  extrasAsignacion,
  type DeberRecord,
  type EstudianteRecord,
} from '@/data/mockEstudiantes'
import { normalizarClave } from '@/lib/estudiantes'
import {
  sugerirCuartos as calcularSugerencias,
  type ContextoCuarto,
} from '@/lib/asignacionCuarto'
import type {
  AsignarCuartoInput,
  AsignarCuartosMasivosInput,
  AsignarCuartosMasivosResultado,
  AsignacionCuarto,
  AtributoDisponible,
  CondicionRegla,
  ConjuntoReglaCrear,
  DeberEstudiante,
  Estudiante,
  EstudianteImportado,
  EstudianteResumen,
  OperadorDisponible,
  PrioridadRegla,
  ResultadoImportacion,
  SugerenciaCuarto,
  TipoIngreso,
} from '@/types/estudiante'
import type { EstudiantesRepository } from './contracts'

const esperar = (ms = 220) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const hoy = () => new Date().toISOString().slice(0, 10)

const registros: EstudianteRecord[] = [...estudiantesIniciales]
const deberesRegistrados: DeberRecord[] = deberesIniciales

let siguienteEstudianteId = Math.max(...registros.map((item) => item.id)) + 1
let siguienteAlojamientoId = Math.max(...alojamientos.map((item) => item.id)) + 1

function esAlojamientoActivo(alojamiento: (typeof alojamientos)[number]): boolean {
  return !alojamiento.hasta || alojamiento.hasta >= hoy()
}

function alojamientoActivoDe(estudianteId: number) {
  const activos = alojamientos.filter(
    (alojamiento) => alojamiento.estudianteId === estudianteId && esAlojamientoActivo(alojamiento),
  )
  return activos[activos.length - 1] ?? null
}

function asignacionDe(estudianteId: number): AsignacionCuarto | null {
  const alojamiento = alojamientoActivoDe(estudianteId)
  if (!alojamiento) return null

  const cuarto = cuartos.find((item) => item.id === alojamiento.cuartoId)
  if (!cuarto) return null

  const escalera = escaleras.find((item) => item.id === cuarto.escaleraId)
  const edificio = escalera
    ? edificios.find((item) => item.id === escalera.edificioId)
    : undefined
  const extras = extrasAsignacion[estudianteId]

  return {
    id: alojamiento.id,
    edificioId: edificio?.id ?? escalera?.edificioId ?? 0,
    edificioNombre: edificio?.nombre ?? 'Sin edificio',
    escaleraId: escalera?.id ?? cuarto.escaleraId,
    escaleraNombre: escalera?.nombre ?? 'Sin escalera',
    cuartoId: cuarto.id,
    cuartoNombre: cuarto.nombre,
    desde: alojamiento.desde,
    hasta: alojamiento.hasta,
    taquilla: extras?.taquilla,
    llaveEntregada: extras?.llaveEntregada ?? false,
    llaveTaquillaEntregada: extras?.llaveTaquillaEntregada ?? false,
  }
}

function deberesDe(estudianteId: number): DeberEstudiante[] {
  return deberesRegistrados
    .filter((item) => item.estudianteId === estudianteId)
    .map((item) => ({
      id: item.id,
      tipo: item.tipo,
      descripcion: item.descripcion,
      fecha: item.fecha,
      turno: item.turno,
      estado: item.estado,
      cuartoNombre: item.cuartoNombre,
    }))
}

function resumenDe(registro: EstudianteRecord): EstudianteResumen {
  const deberes = deberesDe(registro.id)
  const asignacion = asignacionDe(registro.id)

  return {
    id: registro.id,
    carnet: registro.carnet,
    nombre: registro.nombre,
    sexo: registro.sexo,
    provincia: registro.provincia,
    municipio: registro.municipio,
    facultad: registro.facultad,
    carrera: registro.carrera,
    especialidad: registro.especialidad,
    anioAcademico: registro.anioAcademico,
    grupo: registro.grupo,
    tipoIngreso: registro.tipoIngreso,
    estadoBeca: registro.estadoBeca,
    telefono: registro.telefono,
    asignacion,
    estadoAlojamiento: asignacion ? 'VIGENTE' : 'NINGUNO',
    deberesPendientes: deberes.filter((deber) => deber.estado === 'pendiente').length,
    deberesIncumplidos: deberes.filter((deber) => deber.estado === 'incumplido').length,
  }
}

function detalleDe(registro: EstudianteRecord): Estudiante {
  const resumen = resumenDe(registro)

  return {
    ...resumen,
    fechaNacimiento: registro.fechaNacimiento,
    pais: registro.pais,
    preuniversitario: registro.preuniversitario,
    fechaIngreso: registro.fechaIngreso,
    direccionParticular: registro.direccionParticular,
    padecimiento: registro.padecimiento,
    madre: registro.madre,
    padre: registro.padre,
    telefonoMadre: registro.telefonoMadre,
    telefonoPadre: registro.telefonoPadre,
    militancia: registro.militancia,
    observaciones: registro.observaciones,
    zonaProcedencia: registro.zonaProcedencia,
    universidadOrigen: registro.universidadOrigen,
    deberes: deberesDe(registro.id),
  }
}

function contextosDeCuartos(): ContextoCuarto[] {
  const alojamientosActivos = alojamientos.filter(esAlojamientoActivo)

  return cuartos.map((cuarto) => {
    const escalera = escaleras.find((item) => item.id === cuarto.escaleraId)
    const edificio = escalera
      ? edificios.find((item) => item.id === escalera.edificioId)
      : undefined
    const estado = estadosConstructivos.find(
      (item) => item.id === cuarto.estadoConstructivoId,
    )
    const alojamientosCuarto = alojamientosActivos.filter(
      (alojamiento) => alojamiento.cuartoId === cuarto.id,
    )

    const ocupantes = alojamientosCuarto.flatMap((alojamiento) => {
      const estudiante = registros.find(
        (registro) => registro.id === alojamiento.estudianteId,
      )
      return estudiante
        ? [
            {
              sexo: estudiante.sexo,
              provincia: estudiante.provincia,
              carrera: estudiante.carrera,
              preuniversitario: estudiante.preuniversitario,
              anioAcademico: estudiante.anioAcademico,
            },
          ]
        : []
    })

    return {
      id: cuarto.id,
      nombre: cuarto.nombre,
      capacidadMaxima: cuarto.capacidadMaxima,
      habitable: estado?.habitable ?? false,
      escaleraId: escalera?.id ?? cuarto.escaleraId,
      escaleraNombre: escalera?.nombre ?? 'Sin escalera',
      edificioId: edificio?.id ?? escalera?.edificioId ?? 0,
      edificioNombre: edificio?.nombre ?? 'Sin edificio',
      ocupados: alojamientosCuarto.length,
      ocupantes,
    }
  })
}

function normalizarCarnet(valor: string): string {
  return valor.replace(/\s+/g, '').toUpperCase()
}

export const demoEstudiantesRepository: EstudiantesRepository = {
  async obtenerEstudiantes(filtros = {}) {
    await esperar()

    const texto = normalizarClave(filtros.texto ?? '')

    return registros
      .filter((registro) => {
        if (texto) {
          const contenido = normalizarClave(
            `${registro.nombre} ${registro.carnet} ${registro.carrera} ${registro.provincia} ${registro.municipio}`,
          )
          if (!contenido.includes(texto)) return false
        }
        if (filtros.carrera && registro.carrera !== filtros.carrera) return false
        if (filtros.especialidad && registro.especialidad !== filtros.especialidad) return false
        if (filtros.tipoIngreso && registro.tipoIngreso !== filtros.tipoIngreso) return false
        if (filtros.estadoBeca && registro.estadoBeca !== filtros.estadoBeca) return false
        if (filtros.edificioId != null) {
          const asignacion = asignacionDe(registro.id)
          if (asignacion?.edificioId !== filtros.edificioId) return false
        }
        return true
      })
      .map(resumenDe)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  },

  async obtenerEstudiante(id) {
    await esperar()
    const registro = registros.find((item) => item.id === id)
    if (!registro) throw new Error('Estudiante no encontrado.')
    return detalleDe(registro)
  },

  async importarEstudiantes(importados: EstudianteImportado[]): Promise<ResultadoImportacion> {
    await esperar(260)

    const carnets = new Set(registros.map((registro) => normalizarCarnet(registro.carnet)))
    const importadas: EstudianteResumen[] = []
    let omitidas = 0

    for (const datos of importados) {
      const carnet = normalizarCarnet(datos.carnet)
      if (carnets.has(carnet)) {
        omitidas++
        continue
      }

      const registro: EstudianteRecord = {
        id: siguienteEstudianteId++,
        ...datos,
      }
      registros.push(registro)
      carnets.add(carnet)
      importadas.push(resumenDe(registro))
    }

    return {
      resumen: {
        total: importados.length,
        validas: importadas.length,
        omitidas,
        rechazadas: 0,
      },
      importadas,
    }
  },

  async sugerirCuartos(estudianteId): Promise<SugerenciaCuarto[]> {
    await esperar(180)
    const registro = registros.find((item) => item.id === estudianteId)
    if (!registro) throw new Error('Estudiante no encontrado.')
    return calcularSugerencias(registro, contextosDeCuartos())
  },

  async asignarCuarto(estudianteId, input: AsignarCuartoInput) {
    await esperar(220)

    const registro = registros.find((item) => item.id === estudianteId)
    if (!registro) throw new Error('Estudiante no encontrado.')
    if (registro.estadoBeca === 'baja') {
      throw new Error('No se puede asignar cuarto a un estudiante dado de baja.')
    }

    const cuarto = cuartos.find((item) => item.id === input.cuartoId)
    if (!cuarto) throw new Error('El cuarto seleccionado no existe.')

    const estado = estadosConstructivos.find(
      (item) => item.id === cuarto.estadoConstructivoId,
    )
    if (!estado?.habitable) throw new Error('El cuarto seleccionado no es habitable.')

    const contexto = contextosDeCuartos().find((item) => item.id === cuarto.id)
    if (!contexto) throw new Error('No se pudo calcular la ocupación del cuarto.')
    if (contexto.ocupantes.some((ocupante) => ocupante.sexo !== registro.sexo)) {
      throw new Error('El cuarto no es compatible con el sexo del estudiante.')
    }

    const alojamientoActual = alojamientoActivoDe(estudianteId)
    const yaEstaEnCuarto = alojamientoActual?.cuartoId === cuarto.id

    if (!yaEstaEnCuarto && contexto.ocupados >= cuarto.capacidadMaxima) {
      throw new Error('El cuarto seleccionado no tiene camas disponibles.')
    }

    if (alojamientoActual) {
      alojamientoActual.cuartoId = cuarto.id
      alojamientoActual.desde = input.desde ?? hoy()
      delete alojamientoActual.hasta
    } else {
      alojamientos.push({
        id: siguienteAlojamientoId++,
        cuartoId: cuarto.id,
        estudianteId,
        desde: input.desde ?? hoy(),
      })
    }

    extrasAsignacion[estudianteId] = {
      taquilla: input.taquilla,
      llaveEntregada: input.llaveEntregada ?? false,
      llaveTaquillaEntregada: input.llaveTaquillaEntregada ?? false,
    }

    const asignacion = asignacionDe(estudianteId)
    if (!asignacion) throw new Error('No se pudo registrar la asignación de cuarto.')
    return asignacion
  },

  async asignarCuartosMasivamente(asignaciones: AsignarCuartosMasivosInput[]): Promise<AsignarCuartosMasivosResultado> {
    await esperar(300)
    const detalles: AsignarCuartosMasivosResultado['detalles'] = []
    let exitosos = 0
    let fallidos = 0

    for (const asignacion of asignaciones) {
      try {
        const registro = registros.find((item) => item.id === asignacion.estudianteId)
        if (!registro) {
          throw new Error('Estudiante no encontrado.')
        }
        if (registro.estadoBeca === 'baja') {
          throw new Error('No se puede asignar cuarto a un estudiante dado de baja.')
        }

        const cuarto = cuartos.find((item) => item.id === asignacion.cuartoId)
        if (!cuarto) throw new Error('El cuarto seleccionado no existe.')

        const estado = estadosConstructivos.find(
          (item) => item.id === cuarto.estadoConstructivoId,
        )
        if (!estado?.habitable) throw new Error('El cuarto seleccionado no es habitable.')

        const contexto = contextosDeCuartos().find((item) => item.id === cuarto.id)
        if (!contexto) throw new Error('No se pudo calcular la ocupación del cuarto.')
        if (contexto.ocupantes.some((ocupante) => ocupante.sexo !== registro.sexo)) {
          throw new Error('El cuarto no es compatible con el sexo del estudiante.')
        }

        const alojamientoActual = alojamientoActivoDe(asignacion.estudianteId)
        const yaEstaEnCuarto = alojamientoActual?.cuartoId === asignacion.cuartoId

        if (!yaEstaEnCuarto && contexto.ocupados >= cuarto.capacidadMaxima) {
          throw new Error('El cuarto seleccionado no tiene camas disponibles.')
        }

        if (alojamientoActual) {
          alojamientoActual.cuartoId = asignacion.cuartoId
          alojamientoActual.desde = asignacion.desde ?? hoy()
          delete alojamientoActual.hasta
        } else {
          alojamientos.push({
            id: siguienteAlojamientoId++,
            cuartoId: asignacion.cuartoId,
            estudianteId: asignacion.estudianteId,
            desde: asignacion.desde ?? hoy(),
          })
        }

        extrasAsignacion[asignacion.estudianteId] = {
          taquilla: asignacion.taquilla,
          llaveEntregada: asignacion.llaveEntregada ?? false,
          llaveTaquillaEntregada: asignacion.llaveTaquillaEntregada ?? false,
        }

        detalles.push({
          estudianteId: asignacion.estudianteId,
          cuartoId: asignacion.cuartoId,
          exitoso: true,
        })
        exitosos++
      } catch (caught) {
        fallidos++
        detalles.push({
          estudianteId: asignacion.estudianteId,
          cuartoId: asignacion.cuartoId,
          exitoso: false,
          error: caught instanceof Error ? caught.message : String(caught),
        })
      }
    }

    return { exitosos, fallidos, detalles }
  },

  async obtenerAtributos(): Promise<AtributoDisponible[]> {
    await esperar(100)
    return [
      {
        id: 1,
        nombre: 'Sexo',
        tipoDatoId: 6,
        tipoDatoNombre: 'referencia a entidad',
        almacenado: false,
        activo: true,
        valoresPermitidos: [
          { id: 1, valor: 'Femenino' },
          { id: 2, valor: 'Masculino' },
        ],
      },
      {
        id: 2,
        nombre: 'Año académico',
        tipoDatoId: 2,
        tipoDatoNombre: 'entero',
        almacenado: false,
        activo: true,
        valoresPermitidos: [],
      },
      {
        id: 7,
        nombre: 'Provincia',
        tipoDatoId: 6,
        tipoDatoNombre: 'referencia a entidad',
        almacenado: false,
        activo: true,
        valoresPermitidos: [
          { id: 1, valor: 'La Habana' },
          { id: 2, valor: 'Pinar del Río' },
          { id: 3, valor: 'Villa Clara' },
          { id: 4, valor: 'Camagüey' },
          { id: 5, valor: 'Santiago de Cuba' },
        ],
      },
      {
        id: 9,
        nombre: 'Especialidad',
        tipoDatoId: 6,
        tipoDatoNombre: 'referencia a entidad',
        almacenado: false,
        activo: true,
        valoresPermitidos: [
          { id: 1, valor: 'Ciencias Informáticas' },
          { id: 2, valor: 'Estructuras' },
          { id: 3, valor: 'Logística y Producción' },
          { id: 4, valor: 'Sistemas Eléctricos' },
        ],
      },
    ]
  },

  async obtenerOperadores(): Promise<OperadorDisponible[]> {
    await esperar(100)
    return [
      { id: 1, simbolo: 'IGUAL', nombre: 'Igual a', soloOrdenables: false },
      { id: 2, simbolo: 'DISTINTO', nombre: 'Distinto de', soloOrdenables: false },
      { id: 3, simbolo: 'MAYOR_IGUAL', nombre: 'Mayor o igual que', soloOrdenables: true },
      { id: 4, simbolo: 'MENOR_IGUAL', nombre: 'Menor o igual que', soloOrdenables: true },
    ]
  },

  async crearConjuntoRegla(conjunto: ConjuntoReglaCrear): Promise<{ id: number }> {
    await esperar(200)
    // Simular creación exitosa en el demo
    return { id: 999 }
  },

  async eliminarEstudiante(id) {
    await esperar(180)
    const indice = registros.findIndex((item) => item.id === id)
    if (indice === -1) throw new Error('Estudiante no encontrado.')
    registros.splice(indice, 1)
  }
}
