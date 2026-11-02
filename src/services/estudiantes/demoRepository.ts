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
  AsignacionCuarto,
  DeberEstudiante,
  Estudiante,
  EstudianteImportado,
  EstudianteResumen,
  ResultadoImportacion,
  SugerenciaCuarto,
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
    asignacion: asignacionDe(registro.id),
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
}
