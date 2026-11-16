import { describe, expect, it, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { RouterLink } from 'vue-router'
import AvisosHero from './AvisosHero.vue'
import type { Aviso } from '@/types/estudiante-view'

vi.mock('vue-router', () => ({
  RouterLink: {
    template: '<a><slot /></a>',
    props: ['to'],
  },
}))

beforeEach(() => {
  setActivePinia(createPinia())
})

const aviso: Aviso = {
  id: 'a-1',
  titulo: 'Inicio del curso académico',
  contenido: 'Se recuerda a todos los becados que el curso académico inicia próximamente.',
  fecha: '2027-01-01',
  prioridad: 'alta',
}

describe('AvisosHero', () => {
  it('renderiza avisos vigentes con colores de prioridad', () => {
    const wrapper = mount(AvisosHero, {
      props: {
        avisos: [aviso],
      },
    })

    expect(wrapper.text()).toContain('Inicio del curso académico')
    expect(wrapper.text()).toContain('Alta')
  })

  it('no renderiza cuando no hay avisos', () => {
    const wrapper = mount(AvisosHero, {
      props: {
        avisos: [],
      },
    })

    expect(wrapper.html()).not.toContain('Alta')
  })

  it('filtra avisos expirados', () => {
    const avisoExpirado: Aviso = {
      ...aviso,
      id: 'a-2',
      fecha: '2020-01-01',
      titulo: 'Aviso expirado',
    }

    const wrapper = mount(AvisosHero, {
      props: {
        avisos: [aviso, avisoExpirado],
      },
    })

    expect(wrapper.text()).toContain('Inicio del curso académico')
    expect(wrapper.text()).not.toContain(avisoExpirado.titulo)
  })

  it('tiene botón Ver todos los avisos', () => {
    const wrapper = mount(AvisosHero, {
      props: {
        avisos: [aviso],
      },
    })

    const btn = wrapper.find('a')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toContain('Ver todos los avisos')
  })
})
