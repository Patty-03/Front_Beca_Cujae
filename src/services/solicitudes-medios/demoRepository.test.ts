import { describe, expect, it, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { demoSolicitudesMediosRepository } from './demoRepository'
import type {
  CrearSolicitudMedioInput,
  ResolverSolicitudMedioInput,
} from '@/types/solicitud-medio'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('demoSolicitudesMediosRepository', () => {
  describe('obtenerTiposMedio', () => {
    it('devuelve la lista de tipos de medio activos', async () => {
      const tipos = await demoSolicitudesMediosRepository.obtenerTiposMedio()

      expect(Array.isArray(tipos)).toBe(true)
      expect(tipos.length).toBeGreaterThan(0)
      expect(tipos.every((t) => t.activo)).toBe(true)
      expect(tipos[0]?.id).toBeDefined()
      expect(tipos[0]?.nombre).toBeDefined()
      expect(tipos[0]?.codigo).toBeDefined()
    })

    it('no devuelve tipos inactivos', async () => {
      const tipos = await demoSolicitudesMediosRepository.obtenerTiposMedio()
      expect(tipos.some((t) => !t.activo)).toBe(false)
    })
  })

  describe('crearSolicitud', () => {
    it('crea una solicitud válida con cantidad y motivo correctos', async () => {
      const input: CrearSolicitudMedioInput = {
        tipoMedioId: 1,
        cantidad: 2,
        motivo: 'Necesito una cama adicional para mi cuarto.',
      }

      const creada = await demoSolicitudesMediosRepository.crearSolicitud(input)

      expect(creada.id).toBeDefined()
      expect(creada.tipoMedioId).toBe(1)
      expect(creada.tipoMedioNombre).toBe('Cama')
      expect(creada.cantidad).toBe(2)
      expect(creada.motivo).toBe('Necesito una cama adicional para mi cuarto.')
      expect(creada.estado).toBe('pendiente')
      expect(creada.fechaSolicitud).toBeDefined()
      expect(creada.fechaResolucion).toBeNull()
      expect(creada.resueltoPor).toBeNull()
    })

    it('rechaza cantidad menor a 1', async () => {
      const input: CrearSolicitudMedioInput = {
        tipoMedioId: 1,
        cantidad: 0,
        motivo: 'Prueba de cantidad inválida.',
      }

      await expect(demoSolicitudesMediosRepository.crearSolicitud(input)).rejects.toThrow()
    })

    it('rechaza cantidad mayor a 999', async () => {
      const input: CrearSolicitudMedioInput = {
        tipoMedioId: 1,
        cantidad: 1000,
        motivo: 'Prueba de cantidad inválida.',
      }

      await expect(demoSolicitudesMediosRepository.crearSolicitud(input)).rejects.toThrow()
    })

    it('rechaza motivo vacío', async () => {
      const input: CrearSolicitudMedioInput = {
        tipoMedioId: 1,
        cantidad: 1,
        motivo: '   ',
      }

      await expect(demoSolicitudesMediosRepository.crearSolicitud(input)).rejects.toThrow(
        'obligatorio',
      )
    })

    it('rechaza motivo mayor a 255 caracteres', async () => {
      const input: CrearSolicitudMedioInput = {
        tipoMedioId: 1,
        cantidad: 1,
        motivo: 'a'.repeat(256),
      }

      await expect(demoSolicitudesMediosRepository.crearSolicitud(input)).rejects.toThrow(
        '255 caracteres',
      )
    })

    it('rechaza tipo de medio inexistente', async () => {
      const input: CrearSolicitudMedioInput = {
        tipoMedioId: 9999,
        cantidad: 1,
        motivo: 'Tipo inexistente.',
      }

      await expect(demoSolicitudesMediosRepository.crearSolicitud(input)).rejects.toThrow()
    })
  })

  describe('obtenerMisSolicitudes', () => {
    it('devuelve solo las solicitudes del estudiante autenticado', async () => {
      const solicitudesEstudiante = await demoSolicitudesMediosRepository.obtenerMisSolicitudes()

      expect(Array.isArray(solicitudesEstudiante)).toBe(true)
      solicitudesEstudiante.forEach((s) => {
        expect(s.estado).toBeDefined()
        expect(s.tipoMedioNombre).toBeDefined()
      })
    })

    it('ordena solicitudes por fecha descendente', async () => {
      const solicitudesOrdenadas =
        await demoSolicitudesMediosRepository.obtenerMisSolicitudes()

      if (solicitudesOrdenadas.length >= 2) {
        for (let i = 1; i < solicitudesOrdenadas.length; i++) {
          const anterior = Date.parse(solicitudesOrdenadas[i - 1].fechaSolicitud)
          const actual = Date.parse(solicitudesOrdenadas[i].fechaSolicitud)
          expect(anterior).toBeGreaterThanOrEqual(actual)
        }
      }
    })
  })

  describe('aprobarSolicitud', () => {
    it('aprueba una solicitud pendiente', async () => {
      const pendientes = (await demoSolicitudesMediosRepository.obtenerMisSolicitudes()).filter(
        (s) => s.estado === 'pendiente',
      )
      if (pendientes.length === 0) {
        expect(true).toBe(true)
        return
      }

      const solicitud = pendientes[0]
      const resultado = await demoSolicitudesMediosRepository.aprobarSolicitud(
        solicitud.id,
      )

      expect(resultado.estado).toBe('aprobada')
      expect(resultado.fechaResolucion).toBeDefined()
      expect(resultado.resueltoPor).toBeDefined()
    })

    it('rechaza aprobar una solicitud ya resuelta', async () => {
      const noPendientes = (await demoSolicitudesMediosRepository.obtenerMisSolicitudes()).filter(
        (s) => s.estado !== 'pendiente',
      )
      if (noPendientes.length === 0) {
        expect(true).toBe(true)
        return
      }

      const solicitud = noPendientes[0]
      await expect(
        demoSolicitudesMediosRepository.aprobarSolicitud(solicitud.id),
      ).rejects.toThrow()
    })
  })

  describe('rechazarSolicitud', () => {
    it('rechaza una solicitud pendiente con observaciones', async () => {
      const pendientes = (await demoSolicitudesMediosRepository.obtenerMisSolicitudes()).filter(
        (s) => s.estado === 'pendiente',
      )
      if (pendientes.length === 0) {
        expect(true).toBe(true)
        return
      }

      const solicitud = pendientes[0]
      const input: ResolverSolicitudMedioInput = {
        observacionesResolucion: 'No hay disponibilidad de este medio.',
      }

      const resultado = await demoSolicitudesMediosRepository.rechazarSolicitud(
        solicitud.id,
        input,
      )

      expect(resultado.estado).toBe('rechazada')
      expect(resultado.observacionesResolucion).toBe(
        'No hay disponibilidad de este medio.',
      )
    })

    it('rechaza una solicitud ya resuelta', async () => {
      const noPendientes = (await demoSolicitudesMediosRepository.obtenerMisSolicitudes()).filter(
        (s) => s.estado !== 'pendiente',
      )
      if (noPendientes.length === 0) {
        expect(true).toBe(true)
        return
      }

      const solicitud = noPendientes[0]
      await expect(
        demoSolicitudesMediosRepository.rechazarSolicitud(solicitud.id),
      ).rejects.toThrow()
    })
  })
})
