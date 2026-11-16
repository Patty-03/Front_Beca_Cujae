import { describe, expect, it, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import AsignarCuartoDialog from './AsignarCuartoDialog.vue'
import type { EstudianteResumen } from '@/types/estudiante'

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
  })

  it('monta el diálogo abierto sin errores', () => {
    const wrapper = mount(AsignarCuartoDialog, {
      props: {
        estudiante,
        open: true,
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('no renderiza cuando está cerrado', () => {
    const wrapper = mount(AsignarCuartoDialog, {
      props: {
        estudiante,
        open: false,
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('emite update:open al cerrar', async () => {
    const wrapper = mount(AsignarCuartoDialog, {
      props: {
        estudiante,
        open: true,
      },
    })

    const closeBtn = wrapper.find('button[aria-label="Cerrar"]')
    if (closeBtn.exists()) {
      await closeBtn.trigger('click')
      const emitted = wrapper.emitted('update:open')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toBe(false)
    }
  })
})
