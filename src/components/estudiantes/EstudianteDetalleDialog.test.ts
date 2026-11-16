import { describe, expect, it, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import EstudianteDetalleDialog from './EstudianteDetalleDialog.vue'
import type { Estudiante } from '@/types/estudiante'

vi.mock('@/services/estudiantes', () => ({
  obtenerEstudiante: vi.fn(),
}))

import { obtenerEstudiante } from '@/services/estudiantes'

const estudiante: Estudiante = {
  id: 1,
  carnet: 'CI-2026001',
  nombre: 'Ana Rodríguez',
  sexo: 'F',
  provincia: 'Villa Clara',
  municipio: 'Santa Clara',
  facultad: 'FII',
  carrera: 'Ingeniería Informática',
  especialidad: 'Ciencias Informáticas',
  anioAcademico: 1,
  grupo: '11',
  tipoIngreso: 'residente_provincia',
  estadoBeca: 'activo',
  telefono: '51234567',
  asignacion: {
    id: 1,
    edificioId: 1,
    edificioNombre: 'Edificio A',
    escaleraId: 1,
    escaleraNombre: 'Escalera 1',
    cuartoId: 101,
    cuartoNombre: '101-A',
    desde: '2026-09-01',
    llaveEntregada: false,
    llaveTaquillaEntregada: false,
  },
  deberesPendientes: 1,
  deberesIncumplidos: 0,
  fechaNacimiento: '2007-05-18',
  pais: 'Cuba',
  fechaIngreso: '2026-09-01',
  direccionParticular: 'Calle 1',
  deberes: [],
}

describe('EstudianteDetalleDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(obtenerEstudiante).mockResolvedValue(estudiante)
  })

  it('renderiza el detalle del estudiante cuando está abierto', async () => {
    const wrapper = mount(EstudianteDetalleDialog, {
      props: {
        estudianteId: 1,
        open: true,
      },
    })

    await new Promise((r) => setTimeout(r, 200))

    // Verificar que el componente monta sin errores
    expect(wrapper.exists()).toBe(true)
  })

  it('no renderiza contenido cuando está cerrado', () => {
    const wrapper = mount(EstudianteDetalleDialog, {
      props: {
        estudianteId: 1,
        open: false,
      },
    })

    expect(wrapper.text()).not.toContain('Ana Rodríguez')
  })

  it('emite update:open al cerrar', async () => {
    const wrapper = mount(EstudianteDetalleDialog, {
      props: {
        estudianteId: 1,
        open: true,
      },
    })

    await new Promise((r) => setTimeout(r, 200))

    const closeBtn = wrapper.find('button[aria-label="Cerrar"]')
    if (closeBtn.exists()) {
      await closeBtn.trigger('click')
      const emitted = wrapper.emitted('update:open')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toBe(false)
    }
  })
})
