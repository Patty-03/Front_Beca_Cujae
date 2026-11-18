import { describe, expect, it, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import EstudianteTable from './EstudianteTable.vue'
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

describe('EstudianteTable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renderiza la tabla de estudiantes', () => {
    const wrapper = mount(EstudianteTable, {
      props: {
        estudiantes: [estudiante],
        puedeAsignar: true,
      },
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('Ana Rodríguez')
    expect(wrapper.text()).toContain('CI-2026001')
    expect(wrapper.text()).toContain('Activo')
  })

  it('renderiza tabla vacía sin estudiantes', () => {
    const wrapper = mount(EstudianteTable, {
      props: {
        estudiantes: [],
        puedeAsignar: false,
      },
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('Estudiante')
    expect(wrapper.text()).toContain('Carrera')
  })
})
