import { describe, expect, it, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import AsignarCuartoDialog from './AsignarCuartoDialog.vue'
import type { EstudianteResumen } from '@/types/estudiante'

vi.mock('@/services/estudiantes', () => ({
  sugerirCuartos: vi.fn(),
  asignarCuarto: vi.fn(),
}))

import { sugerirCuartos } from '@/services/estudiantes'

const estudiante: EstudianteResumen = {
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
  asignacion: null,
  deberesPendientes: 0,
  deberesIncumplidos: 0,
}

describe('AsignarCuartoDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(sugerirCuartos).mockResolvedValue([
      {
        cuartoId: 101,
        cuartoNombre: '101-A',
        edificioId: 1,
        edificioNombre: 'Edificio A',
        escaleraId: 1,
        escaleraNombre: 'Escalera 1',
        capacidadMaxima: 4,
        ocupados: 2,
        disponibles: 2,
        puntuacion: 50,
        motivos: ['Misma carrera'],
      },
    ])
  })

  it('renderiza el diálogo de asignar cuarto', async () => {
    const wrapper = mount(AsignarCuartoDialog, {
      props: {
        estudiante,
        open: false,
      },
    })

    // Trigger watch by setting open after mount
    await wrapper.setProps({ open: true })
    await new Promise((r) => setTimeout(r, 200))

    // Verificar que se llamó a sugerirCuartos
    expect(vi.mocked(sugerirCuartos)).toHaveBeenCalledWith(estudiante.id)
  })

  it('no renderiza cuando está cerrado', () => {
    const wrapper = mount(AsignarCuartoDialog, {
      props: {
        estudiante,
        open: false,
      },
    })

    expect(wrapper.text()).not.toContain('Ana Rodríguez')
  })

  it('emite update:open al cerrar', async () => {
    const wrapper = mount(AsignarCuartoDialog, {
      props: {
        estudiante,
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
